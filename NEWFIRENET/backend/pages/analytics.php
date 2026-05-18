<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();

function firenet_load_app_config_for_analytics(): array {
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $configFile = __DIR__ . '/../../config/config.php';
    if (!is_file($configFile)) {
        $config = [];
        return $config;
    }

    $loaded = require $configFile;
    $config = is_array($loaded) ? $loaded : [];
    return $config;
}

function firenet_table_exists_for_analytics(PDO $pdo, string $tableName): bool {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?");
    $stmt->execute([$tableName]);
    return (int) ($stmt->fetchColumn() ?: 0) > 0;
}

function firenet_analytics_normalize_scope(string $scope): string {
    return strtolower(trim($scope)) === 'history' ? 'history' : 'current';
}

function firenet_analytics_parse_datetime_local(string $value): ?string {
    $value = trim($value);
    if ($value === '') {
        return null;
    }

    $timestamp = strtotime(str_replace('T', ' ', $value));
    if ($timestamp === false) {
        return null;
    }

    return date('Y-m-d H:i:s', $timestamp);
}

function firenet_analytics_format_datetime_local(?string $value): string {
    $value = trim((string) $value);
    if ($value === '') {
        return '';
    }

    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return '';
    }

    return date('Y-m-d\TH:i', $timestamp);
}

function firenet_analytics_build_time_window_sql(?string $from, ?string $to): array {
    $conditions = [];
    $params = [];
    $referenceTimeSql = 'COALESCE(i.incident_started_at, i.incident_finished_at, i.updated_at, i.created_at, r.updated_at, r.created_at)';

    if ($from !== null) {
        $conditions[] = $referenceTimeSql . ' >= ?';
        $params[] = $from;
    }

    if ($to !== null) {
        $conditions[] = $referenceTimeSql . ' <= ?';
        $params[] = $to;
    }

    return [
        'sql' => $conditions ? implode(' AND ', $conditions) : '',
        'params' => $params
    ];
}

function firenet_analytics_build_incident_scope_sql(string $scope): string {
    if ($scope === 'history') {
        return '';
    }

    return "(s.stage_code IS NULL OR s.stage_code <> 'after_incident')\n            AND (i.incident_status IS NULL OR i.incident_status <> 'fire_out')\n            AND COALESCE(i.incident_finished_at, '') = ''";
}

function firenet_analytics_fetch_local_hydrants(PDO $pdo): array {
    if (!firenet_table_exists_for_analytics($pdo, 'fire_hydrants')) {
        return [];
    }

    $hydrantStmt = $pdo->query("SELECT hydrant_id, hydrant_name, latitude, longitude, status, barangay, address, pressure_psi, last_inspected_at FROM fire_hydrants ORDER BY hydrant_name ASC");
    $hydrantRows = $hydrantStmt ? $hydrantStmt->fetchAll(PDO::FETCH_ASSOC) : [];
    $hydrants = [];

    foreach ($hydrantRows as $row) {
        $latitude = isset($row['latitude']) ? (float) $row['latitude'] : 0.0;
        $longitude = isset($row['longitude']) ? (float) $row['longitude'] : 0.0;
        if ($latitude === 0.0 && $longitude === 0.0) {
            continue;
        }

        $hydrants[] = [
            'hydrantId' => (int) ($row['hydrant_id'] ?? 0),
            'hydrantName' => (string) ($row['hydrant_name'] ?? 'Fire Hydrant'),
            'latitude' => $latitude,
            'longitude' => $longitude,
            'status' => (string) ($row['status'] ?? 'active'),
            'barangay' => (string) ($row['barangay'] ?? ''),
            'address' => (string) ($row['address'] ?? ''),
            'pressurePsi' => $row['pressure_psi'] !== null ? (int) $row['pressure_psi'] : null,
            'lastInspectedAt' => (string) ($row['last_inspected_at'] ?? '')
        ];
    }

    return $hydrants;
}

function firenet_analytics_fetch_public_hydrants(): array {
    $cacheFile = __DIR__ . '/../../data/makati_fire_hydrants_osm.json';
    if (is_file($cacheFile)) {
        $cachedJson = file_get_contents($cacheFile);
        $cachedJson = ltrim((string) $cachedJson, "\xEF\xBB\xBF");
        $cachedData = json_decode($cachedJson, true);
        if (is_array($cachedData) && isset($cachedData['elements']) && is_array($cachedData['elements'])) {
            $points = [];
            foreach ($cachedData['elements'] as $element) {
                if (($element['type'] ?? '') !== 'node' || !isset($element['lat'], $element['lon'])) {
                    continue;
                }

                $latitude = (float) $element['lat'];
                $longitude = (float) $element['lon'];
                $tags = is_array($element['tags'] ?? null) ? $element['tags'] : [];
                $name = trim((string) ($tags['name'] ?? ''));
                if ($name === '') {
                    $name = 'Fire Hydrant';
                }

                $points[] = [
                    'hydrantId' => (int) ($element['id'] ?? 0),
                    'hydrantName' => $name,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'status' => 'public',
                    'barangay' => (string) ($tags['addr:suburb'] ?? $tags['addr:barangay'] ?? ''),
                    'address' => (string) ($tags['addr:full'] ?? $tags['addr:street'] ?? ''),
                    'pressurePsi' => null,
                    'lastInspectedAt' => '',
                    'source' => 'openstreetmap'
                ];
            }

            return [
                'points' => $points,
                'sourceLabel' => 'OpenStreetMap public hydrants',
                'sourceNote' => 'Hydrants are loaded from cached OpenStreetMap public data for the Makati area.'
            ];
        }
    }

    $bounds = [
        'south' => 14.5296505,
        'west' => 120.9987708,
        'north' => 14.5794322,
        'east' => 121.0500718
    ];

    $query = sprintf(
        '[out:json][timeout:25];(node["emergency"="fire_hydrant"](%F,%F,%F,%F);node["man_made"="fire_hydrant"](%F,%F,%F,%F););out body;',
        $bounds['south'],
        $bounds['west'],
        $bounds['north'],
        $bounds['east'],
        $bounds['south'],
        $bounds['west'],
        $bounds['north'],
        $bounds['east']
    );

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", [
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: application/json',
                'User-Agent: FireNet/1.0 (Makati GIS analytics)'
            ]),
            'content' => http_build_query(['data' => $query]),
            'timeout' => 15
        ]
    ]);

    $response = @file_get_contents('https://overpass-api.de/api/interpreter', false, $context);
    if ($response === false || trim($response) === '') {
        return [
            'points' => [],
            'sourceLabel' => 'OpenStreetMap public hydrants',
            'sourceNote' => 'Public hydrants could not be loaded right now, so the map will fall back to any local hydrant records.'
        ];
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded) || !isset($decoded['elements']) || !is_array($decoded['elements'])) {
        return [
            'points' => [],
            'sourceLabel' => 'OpenStreetMap public hydrants',
            'sourceNote' => 'Public hydrants could not be parsed from the map service response.'
        ];
    }

    $points = [];
    foreach ($decoded['elements'] as $element) {
        if (($element['type'] ?? '') !== 'node') {
            continue;
        }

        if (!isset($element['lat'], $element['lon'])) {
            continue;
        }

        $latitude = (float) $element['lat'];
        $longitude = (float) $element['lon'];
        $tags = is_array($element['tags'] ?? null) ? $element['tags'] : [];
        $name = trim((string) ($tags['name'] ?? ''));
        if ($name === '') {
            $name = 'Fire Hydrant';
        }

        $points[] = [
            'hydrantId' => (int) ($element['id'] ?? 0),
            'hydrantName' => $name,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'status' => 'public',
            'barangay' => (string) ($tags['addr:suburb'] ?? $tags['addr:barangay'] ?? ''),
            'address' => (string) ($tags['addr:full'] ?? $tags['addr:street'] ?? ''),
            'pressurePsi' => null,
            'lastInspectedAt' => '',
            'source' => 'openstreetmap'
        ];
    }

    return [
        'points' => $points,
        'sourceLabel' => 'OpenStreetMap public hydrants',
        'sourceNote' => $points ? 'Hydrants are loaded from OpenStreetMap public data for the Makati area.' : 'No hydrants were returned by the public OpenStreetMap query for Makati.'
    ];
}

function firenet_analytics_build_filter_summary(string $scope, ?string $from, ?string $to, int $incidentCount): string {
    if ($scope === 'history') {
        $parts = ['All incident history'];
        if ($from !== null) {
            $parts[] = 'from ' . $from;
        }
        if ($to !== null) {
            $parts[] = 'to ' . $to;
        }

        return implode(' ', $parts) . ' | ' . $incidentCount . ' matching incidents';
    }

    return 'Current active incidents only | ' . $incidentCount . ' matching incidents';
}

$user = (string) ($_SESSION['user']['username'] ?? 'Unknown User');
$role = strtolower((string) ($_SESSION['user']['role'] ?? 'user'));
$stationId = (int) ($_SESSION['user']['station_id'] ?? 1);
$incidentScope = firenet_analytics_normalize_scope((string) ($_GET['incident_scope'] ?? 'current'));
$incidentFrom = firenet_analytics_parse_datetime_local((string) ($_GET['incident_from'] ?? ''));
$incidentTo = firenet_analytics_parse_datetime_local((string) ($_GET['incident_to'] ?? ''));

$roleTitle = 'User';
$roleSummary = 'View Makati-wide analytics and operational trends.';

if ($role === 'admin') {
    $roleTitle = 'Admin';
    $roleSummary = 'Review Makati-wide analytics and operational summaries.';
} elseif ($role === 'superadmin') {
    $roleTitle = 'Superadmin';
    $roleSummary = 'Monitor all incident analytics across the platform.';
}

$analyticsContext = [
    'user' => $user,
    'role' => $role,
    'roleTitle' => $roleTitle,
    'roleSummary' => $roleSummary,
    'stationId' => $stationId,
    'activeIncidentCount' => 0,
    'completedIncidentCount' => 0,
    'totalIncidentCount' => 0,
    'latestIncidentLabel' => 'No active incidents.',
    'latestIncidentMeta' => 'Analytics will update when new incidents are recorded.',
    'stationCount' => 0,
    'incidentHeatPointCount' => 0,
    'hydrantCount' => 0,
    'googleMapsConfigured' => false,
    'mapCenter' => ['lat' => 14.5547, 'lng' => 121.0244],
    'stationGeo' => [],
    'incidentHeatmapPoints' => [],
    'liveIncidents' => [],
    'hydrantGeo' => [],
    'hydrantNotice' => 'Hydrant layer will appear after hydrant coordinates are loaded.',
    'hydrantSourceLabel' => 'OpenStreetMap public hydrants',
    'incidentScope' => $incidentScope,
    'incidentScopeLabel' => $incidentScope === 'history' ? 'All incident history' : 'Current incidents',
    'incidentFrom' => $incidentFrom,
    'incidentTo' => $incidentTo,
    'incidentFromInput' => firenet_analytics_format_datetime_local($incidentFrom),
    'incidentToInput' => firenet_analytics_format_datetime_local($incidentTo),
    'incidentFilterSummary' => ''
];

try {
    $pdo = firenet_get_pdo();

    $appConfig = firenet_load_app_config_for_analytics();
    $googleMapsConfig = is_array($appConfig['google_maps'] ?? null) ? $appConfig['google_maps'] : [];
    // Prefer an environment variable for the API key so it can be injected from Secret Manager or CI/CD.
    $googleMapsApiKey = getenv('FIRENET_GOOGLE_MAPS_KEY') ?: trim((string) ($googleMapsConfig['api_key'] ?? ''));
    // If the configured key is a placeholder or empty, treat as not configured.
    if ($googleMapsApiKey === '' || strpos($googleMapsApiKey, 'YOUR_GOOGLE_MAPS_API_KEY') === 0) {
        $googleMapsApiKey = '';
    }

    // NOTE: In production, store `FIRENET_GOOGLE_MAPS_KEY` in Google Secret Manager
    // and inject it into the runtime environment (e.g., when deploying to Cloud Run, GCE, or GKE).
    $analyticsContext['googleMapsConfigured'] = $googleMapsApiKey !== '';

    $stationStmt = $pdo->query('SELECT station_id, station_name, station_code, latitude, longitude, status FROM stations ORDER BY station_id ASC');
    $stationRows = $stationStmt ? $stationStmt->fetchAll(PDO::FETCH_ASSOC) : [];
    foreach ($stationRows as $row) {
        $latitude = isset($row['latitude']) ? (float) $row['latitude'] : 0.0;
        $longitude = isset($row['longitude']) ? (float) $row['longitude'] : 0.0;
        if ($latitude === 0.0 && $longitude === 0.0) {
            continue;
        }

        $analyticsContext['stationGeo'][] = [
            'stationId' => (int) ($row['station_id'] ?? 0),
            'stationName' => (string) ($row['station_name'] ?? ''),
            'stationCode' => (string) ($row['station_code'] ?? ''),
            'latitude' => $latitude,
            'longitude' => $longitude,
            'status' => (string) ($row['status'] ?? 'active')
        ];
    }
    $analyticsContext['stationCount'] = count($analyticsContext['stationGeo']);

    $timeWindowSql = firenet_analytics_build_time_window_sql($incidentFrom, $incidentTo);
    $scopeSql = firenet_analytics_build_incident_scope_sql($incidentScope);
    $incidentWhereSql = trim($scopeSql . $timeWindowSql['sql']);
    $incidentParams = $timeWindowSql['params'];

    $summarySql = "\n        SELECT\n            SUM(CASE WHEN (s.stage_code IS NULL OR s.stage_code <> 'after_incident') AND (i.incident_status IS NULL OR i.incident_status <> 'fire_out') AND COALESCE(i.incident_finished_at, '') = '' THEN 1 ELSE 0 END) AS active_count,\n            SUM(CASE WHEN (s.stage_code = 'after_incident' OR i.incident_status = 'fire_out' OR i.incident_finished_at IS NOT NULL) THEN 1 ELSE 0 END) AS completed_count,\n            COUNT(*) AS total_count\n        FROM incident_reports i\n        JOIN reports r ON r.report_id = i.report_id\n        LEFT JOIN incident_report_stage s ON s.incident_report_stage_id = i.incident_report_stage_id\n    ";
    if ($incidentWhereSql !== '') {
        $summarySql .= "\n        WHERE " . $incidentWhereSql;
    }

    $summaryStmt = $pdo->prepare($summarySql);
    $summaryStmt->execute($incidentParams);
    $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $analyticsContext['activeIncidentCount'] = (int) ($summary['active_count'] ?? 0);
    $analyticsContext['completedIncidentCount'] = (int) ($summary['completed_count'] ?? 0);
    $analyticsContext['totalIncidentCount'] = (int) ($summary['total_count'] ?? 0);

    $latestSql = "\n        SELECT\n            COALESCE(NULLIF(r.title, ''), NULLIF(i.incident_location, ''), 'Unspecified location') AS incident_title,\n            COALESCE(i.incident_status, 'newly_reported') AS incident_status,\n            COALESCE(i.alarm_level, 1) AS alarm_level,\n            COALESCE(i.updated_at, i.created_at, r.updated_at, r.created_at) AS incident_time,\n            COALESCE(st.station_name, 'Makati') AS station_name\n        FROM incident_reports i\n        JOIN reports r ON r.report_id = i.report_id\n        LEFT JOIN stations st ON st.station_id = r.station_id\n        LEFT JOIN incident_report_stage s ON s.incident_report_stage_id = i.incident_report_stage_id\n    ";
    if ($incidentWhereSql !== '') {
        $latestSql .= "\n        WHERE " . $incidentWhereSql;
    }
    $latestSql .= "\n        ORDER BY COALESCE(i.updated_at, i.created_at, r.updated_at, r.created_at) DESC\n        LIMIT 1\n    ";

    $latestStmt = $pdo->prepare($latestSql);
    $latestStmt->execute($incidentParams);
    $latest = $latestStmt->fetch(PDO::FETCH_ASSOC);

    if ($latest) {
        $analyticsContext['latestIncidentLabel'] = 'Alarm ' . (int) ($latest['alarm_level'] ?? 1) . ' - ' . (string) ($latest['incident_title'] ?? 'Unspecified location');
        $status = (string) ($latest['incident_status'] ?? 'newly_reported');
        $statusLabel = $status === 'under_control' ? 'Under Control' : ($status === 'fire_out' ? 'Fire Out' : 'Newly Reported');
        $stationName = (string) ($latest['station_name'] ?? 'Makati');
        $analyticsContext['latestIncidentMeta'] = 'Station: ' . $stationName . ' | Status: ' . $statusLabel . ' | Last update: ' . (string) ($latest['incident_time'] ?? '-');
    }

    $incidentHeatSql = "\n        SELECT\n            COALESCE(NULLIF(r.title, ''), NULLIF(i.incident_location, ''), CONCAT('Incident #', i.incident_report_id)) AS incident_label,\n            COALESCE(i.incident_status, 'newly_reported') AS incident_status,\n            COALESCE(i.alarm_level, 1) AS alarm_level,\n            COALESCE(i.updated_at, i.created_at, r.updated_at, r.created_at) AS incident_time,\n            COALESCE(st.station_name, '') AS station_name,\n            i.latitude,\n            i.longitude\n        FROM incident_reports i\n        JOIN reports r ON r.report_id = i.report_id\n        LEFT JOIN stations st ON st.station_id = r.station_id\n        LEFT JOIN incident_report_stage s ON s.incident_report_stage_id = i.incident_report_stage_id\n        WHERE i.latitude IS NOT NULL\n          AND i.longitude IS NOT NULL\n    ";
    if ($incidentWhereSql !== '') {
        $incidentHeatSql .= "\n          AND " . $incidentWhereSql;
    }
    $incidentHeatSql .= "\n        ORDER BY COALESCE(i.updated_at, i.created_at, r.updated_at, r.created_at) DESC\n        LIMIT 750\n    ";

    $incidentHeatStmt = $pdo->prepare($incidentHeatSql);
    $incidentHeatStmt->execute($incidentParams);
    $incidentHeatRows = $incidentHeatStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    foreach ($incidentHeatRows as $row) {
        $latitude = isset($row['latitude']) ? (float) $row['latitude'] : 0.0;
        $longitude = isset($row['longitude']) ? (float) $row['longitude'] : 0.0;
        if ($latitude === 0.0 && $longitude === 0.0) {
            continue;
        }

        $alarmLevel = max(1, (int) ($row['alarm_level'] ?? 1));
        $incidentStatus = (string) ($row['incident_status'] ?? 'newly_reported');
        $weight = (float) $alarmLevel;
        if ($incidentStatus !== 'fire_out') {
            $weight *= 1.35;
        }

        $analyticsContext['incidentHeatmapPoints'][] = [
            'lat' => $latitude,
            'lng' => $longitude,
            'weight' => $weight,
            'label' => (string) ($row['incident_label'] ?? 'Incident'),
            'status' => $incidentStatus,
            'stationName' => (string) ($row['station_name'] ?? ''),
            'alarmLevel' => $alarmLevel,
            'updatedAt' => (string) ($row['incident_time'] ?? '')
        ];
    }
    $analyticsContext['incidentHeatPointCount'] = count($analyticsContext['incidentHeatmapPoints']);

    $liveIncidentSql = "
        SELECT
            i.incident_report_id,
            COALESCE(NULLIF(r.title, ''), NULLIF(i.incident_location, ''), CONCAT('Incident #', i.incident_report_id)) AS incident_label,
            COALESCE(i.incident_status, 'newly_reported') AS incident_status,
            COALESCE(i.alarm_level, 1) AS alarm_level,
            COALESCE(i.updated_at, i.created_at, r.updated_at, r.created_at) AS incident_time,
            i.latitude,
            i.longitude,
            i.dispatched_station_id,
            rpt_station.station_id AS report_station_id,
            rpt_station.station_name AS report_station_name,
            rpt_station.station_code AS report_station_code,
            rpt_station.latitude AS report_station_latitude,
            rpt_station.longitude AS report_station_longitude,
            dispatch_station.station_name AS dispatched_station_name,
            dispatch_station.station_code AS dispatched_station_code,
            dispatch_station.latitude AS dispatched_station_latitude,
            dispatch_station.longitude AS dispatched_station_longitude
        FROM incident_reports i
        JOIN reports r ON r.report_id = i.report_id
        LEFT JOIN incident_report_stage s ON s.incident_report_stage_id = i.incident_report_stage_id
        LEFT JOIN stations rpt_station ON rpt_station.station_id = r.station_id
        LEFT JOIN stations dispatch_station ON dispatch_station.station_id = i.dispatched_station_id
        WHERE i.latitude IS NOT NULL
          AND i.longitude IS NOT NULL
          AND (s.stage_code IS NULL OR s.stage_code <> 'after_incident')
          AND (i.incident_status IS NULL OR i.incident_status <> 'fire_out')
          AND COALESCE(i.incident_finished_at, '') = ''
        ORDER BY COALESCE(i.updated_at, i.created_at, r.updated_at, r.created_at) DESC
        LIMIT 50
    ";

    $liveIncidentStmt = $pdo->query($liveIncidentSql);
    $liveIncidentRows = $liveIncidentStmt ? $liveIncidentStmt->fetchAll(PDO::FETCH_ASSOC) : [];
    $liveIncidentLookup = [];

    foreach ($liveIncidentRows as $row) {
        $incidentId = (int) ($row['incident_report_id'] ?? 0);
        $latitude = isset($row['latitude']) ? (float) $row['latitude'] : 0.0;
        $longitude = isset($row['longitude']) ? (float) $row['longitude'] : 0.0;

        if ($incidentId <= 0 || ($latitude === 0.0 && $longitude === 0.0)) {
            continue;
        }

        $liveIncidentLookup[$incidentId] = [
            'incidentReportId' => $incidentId,
            'label' => (string) ($row['incident_label'] ?? ('Incident #' . $incidentId)),
            'status' => (string) ($row['incident_status'] ?? 'newly_reported'),
            'alarmLevel' => max(1, (int) ($row['alarm_level'] ?? 1)),
            'updatedAt' => (string) ($row['incident_time'] ?? ''),
            'latitude' => $latitude,
            'longitude' => $longitude,
            'responders' => []
        ];

        $fallbackStationId = (int) ($row['dispatched_station_id'] ?: $row['report_station_id'] ?: 0);
        $fallbackStationName = (string) ($row['dispatched_station_name'] ?: $row['report_station_name'] ?: 'Assigned station');
        $fallbackStationCode = (string) ($row['dispatched_station_code'] ?: $row['report_station_code'] ?: '');
        $fallbackLat = (float) ($row['dispatched_station_latitude'] ?: $row['report_station_latitude'] ?: 0);
        $fallbackLng = (float) ($row['dispatched_station_longitude'] ?: $row['report_station_longitude'] ?: 0);

        if ($fallbackStationId > 0 && !($fallbackLat === 0.0 && $fallbackLng === 0.0)) {
            $liveIncidentLookup[$incidentId]['responders'][] = [
                'stationId' => $fallbackStationId,
                'stationName' => $fallbackStationName,
                'stationCode' => $fallbackStationCode,
                'latitude' => $fallbackLat,
                'longitude' => $fallbackLng,
                'dispatchOrder' => 1,
                'assignmentMethod' => 'fallback'
            ];
        }
    }

    if ($liveIncidentLookup && firenet_table_exists_for_analytics($pdo, 'incident_report_dispatch_stations')) {
        $liveDispatchSql = "
            SELECT
                ds.incident_report_id,
                ds.dispatch_order,
                ds.assignment_method,
                st.station_id,
                st.station_name,
                st.station_code,
                st.latitude,
                st.longitude
            FROM incident_report_dispatch_stations ds
            JOIN stations st ON st.station_id = ds.station_id
            JOIN incident_reports i ON i.incident_report_id = ds.incident_report_id
            LEFT JOIN incident_report_stage s ON s.incident_report_stage_id = i.incident_report_stage_id
            WHERE (s.stage_code IS NULL OR s.stage_code <> 'after_incident')
              AND (i.incident_status IS NULL OR i.incident_status <> 'fire_out')
              AND COALESCE(i.incident_finished_at, '') = ''
              AND i.latitude IS NOT NULL
              AND i.longitude IS NOT NULL
            ORDER BY ds.incident_report_id ASC, ds.dispatch_order ASC
        ";

        $liveDispatchStmt = $pdo->query($liveDispatchSql);
        $liveDispatchRows = $liveDispatchStmt ? $liveDispatchStmt->fetchAll(PDO::FETCH_ASSOC) : [];

        foreach ($liveDispatchRows as $row) {
            $incidentId = (int) ($row['incident_report_id'] ?? 0);
            if (!isset($liveIncidentLookup[$incidentId])) {
                continue;
            }

            $latitude = isset($row['latitude']) ? (float) $row['latitude'] : 0.0;
            $longitude = isset($row['longitude']) ? (float) $row['longitude'] : 0.0;
            $stationId = (int) ($row['station_id'] ?? 0);
            if ($stationId <= 0 || ($latitude === 0.0 && $longitude === 0.0)) {
                continue;
            }

            $liveIncidentLookup[$incidentId]['responders'][] = [
                'stationId' => $stationId,
                'stationName' => (string) ($row['station_name'] ?? 'Station'),
                'stationCode' => (string) ($row['station_code'] ?? ''),
                'latitude' => $latitude,
                'longitude' => $longitude,
                'dispatchOrder' => max(1, (int) ($row['dispatch_order'] ?? 1)),
                'assignmentMethod' => (string) ($row['assignment_method'] ?? 'nearest')
            ];
        }
    }

    foreach ($liveIncidentLookup as $incidentId => $incidentData) {
        if (!empty($incidentData['responders'])) {
            $deduped = [];
            foreach ($incidentData['responders'] as $responder) {
                $stationKey = (int) ($responder['stationId'] ?? 0);
                if ($stationKey <= 0) {
                    continue;
                }

                if (isset($deduped[$stationKey])) {
                    $existingMethod = (string) ($deduped[$stationKey]['assignmentMethod'] ?? '');
                    $currentMethod = (string) ($responder['assignmentMethod'] ?? '');

                    if ($existingMethod !== 'fallback') {
                        continue;
                    }

                    if ($currentMethod === 'fallback') {
                        continue;
                    }
                }

                $deduped[$stationKey] = $responder;
            }

            $incidentData['responders'] = array_values($deduped);
            usort($incidentData['responders'], static function (array $a, array $b): int {
                return ((int) ($a['dispatchOrder'] ?? 999)) <=> ((int) ($b['dispatchOrder'] ?? 999));
            });
        }

        $analyticsContext['liveIncidents'][] = $incidentData;
    }

    $hydrantSource = firenet_analytics_fetch_public_hydrants();
    if (!empty($hydrantSource['points'])) {
        $analyticsContext['hydrantGeo'] = $hydrantSource['points'];
        $analyticsContext['hydrantSourceLabel'] = (string) ($hydrantSource['sourceLabel'] ?? 'OpenStreetMap public hydrants');
        $analyticsContext['hydrantNotice'] = (string) ($hydrantSource['sourceNote'] ?? 'Hydrants are loaded from OpenStreetMap public data for the Makati area.');
    } else {
        $analyticsContext['hydrantGeo'] = firenet_analytics_fetch_local_hydrants($pdo);
        $analyticsContext['hydrantSourceLabel'] = 'FireNet local hydrant records';
        $analyticsContext['hydrantNotice'] = $analyticsContext['hydrantGeo']
            ? 'Public hydrant data is unavailable right now, so the map is using local hydrant records.'
            : 'No hydrant records are available yet. Add public OpenStreetMap hydrants or local hydrant data to display this layer.';
    }
    $analyticsContext['hydrantCount'] = count($analyticsContext['hydrantGeo']);
    $analyticsContext['incidentFilterSummary'] = firenet_analytics_build_filter_summary(
        $incidentScope,
        $incidentFrom,
        $incidentTo,
        (int) $analyticsContext['totalIncidentCount']
    );
} catch (Throwable $e) {
    // Keep page usable if analytics query fails.
}

$appConfig = isset($appConfig) && is_array($appConfig) ? $appConfig : firenet_load_app_config_for_analytics();
$googleMapsConfig = is_array($appConfig['google_maps'] ?? null) ? $appConfig['google_maps'] : [];
$googleMapsApiKey = getenv('FIRENET_GOOGLE_MAPS_KEY') ?: trim((string) ($googleMapsConfig['api_key'] ?? ''));
if ($googleMapsApiKey === '' || strpos($googleMapsApiKey, 'YOUR_GOOGLE_MAPS_API_KEY') === 0) {
    $googleMapsApiKey = '';
}

$pageStyles = ['/firenet/NEWFIRENET/assets/css/analytics.css?v=' . filemtime(__DIR__ . '/../../assets/css/analytics.css')];
$pageScripts = [];
if ($googleMapsApiKey !== '') {
    $pageScripts[] = 'https://maps.googleapis.com/maps/api/js?key=' . rawurlencode($googleMapsApiKey) . '&libraries=visualization&v=weekly&loading=async';
}
$pageScripts[] = '/firenet/NEWFIRENET/assets/js/analytics.js?v=' . filemtime(__DIR__ . '/../../assets/js/analytics.js');

require_once __DIR__ . '/../../includes/header.php';
?>
<script id="analyticsContext" type="application/json"><?php echo json_encode($analyticsContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php
readfile(__DIR__ . '/../../pages/analytics.html');
require_once __DIR__ . '/../../includes/footer.php';