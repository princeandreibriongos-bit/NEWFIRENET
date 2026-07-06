<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/report_r2_backup.php';

firenet_require_login();
firenet_start_session();

$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
$username = (string) ($_SESSION['user']['username'] ?? '');
$positionCode = strtolower((string) ($_SESSION['user']['position_code'] ?? ''));
$canViewAllReports = $positionCode === 'position1';
$canCreateIncidentReports = $positionCode !== 'position2';
$canCreateEquipmentReports = $positionCode === 'position2' || $positionCode === '';
$canUpdateIncidentReports = $positionCode === 'position1';
if ($username === '' || $userId < 1) {
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'message' => 'Unauthorized']);
    exit;
}

$sessionStationId = (int) ($_SESSION['user']['station_id'] ?? 0);
if ($sessionStationId < 1) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'message' => 'Invalid user station']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && trim((string) ($_GET['action'] ?? '')) === 'download-pdf') {
    try {
        $pdo = firenet_get_pdo();
        $reportId = (int) ($_GET['reportId'] ?? 0);
        firenet_stream_incident_report_pdf($pdo, $reportId, $userId, $sessionStationId);
    } catch (Throwable $e) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=utf-8');
        echo $e->getMessage();
    }
    exit;
}

header('Content-Type: application/json; charset=utf-8');

function firenet_haversine_km(float $lat1, float $lng1, float $lat2, float $lng2): float {
    $earthRadiusKm = 6371.0;
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) * sin($dLng / 2);
    $c = 2 * atan2(sqrt($a), sqrt(max(0.0, 1 - $a)));
    return $earthRadiusKm * $c;
}

function firenet_point_in_polygon(float $latitude, float $longitude, array $points): bool {
    $count = count($points);
    if ($count < 3) {
        return false;
    }

    $inside = false;
    $j = $count - 1;
    for ($i = 0; $i < $count; $i++) {
        $latI = (float) ($points[$i][0] ?? 0.0);
        $lngI = (float) ($points[$i][1] ?? 0.0);
        $latJ = (float) ($points[$j][0] ?? 0.0);
        $lngJ = (float) ($points[$j][1] ?? 0.0);

        $intersects = (($lngI > $longitude) !== ($lngJ > $longitude))
            && ($latitude < (($latJ - $latI) * ($longitude - $lngI)) / (($lngJ - $lngI) ?: 1e-12) + $latI);

        if ($intersects) {
            $inside = !$inside;
        }

        $j = $i;
    }

    return $inside;
}

function firenet_find_station_assignment(PDO $pdo, float $latitude, float $longitude): ?array {
    $assignments = firenet_find_station_assignments($pdo, $latitude, $longitude, 1);
    return $assignments[0] ?? null;
}

function firenet_required_station_count(int $alarmLevel): int {
    if ($alarmLevel >= 4) {
        return 5;
    }
    if ($alarmLevel === 3) {
        return 4;
    }
    if ($alarmLevel === 2) {
        return 3;
    }
    if ($alarmLevel === 1) {
        return 2;
    }
    return 1;
}

function firenet_find_station_assignments(PDO $pdo, float $latitude, float $longitude, int $alarmLevel): array {
    $requiredCount = firenet_required_station_count($alarmLevel);

    $zonesStmt = $pdo->query('
        SELECT z.station_aor_zone_id, z.station_id, z.shape_type, z.center_latitude, z.center_longitude, z.radius_km, z.polygon_points_json,
               s.station_name, s.latitude AS station_latitude, s.longitude AS station_longitude
        FROM station_aor_zones z
        JOIN stations s ON s.station_id = z.station_id
        WHERE z.is_active = 1 AND s.status = "active"
    ');
    $zones = $zonesStmt->fetchAll(PDO::FETCH_ASSOC);

    $aorMatchesByStation = [];
    foreach ($zones as $zone) {
        $shapeType = strtolower((string) ($zone['shape_type'] ?? 'circle'));
        $isMatch = false;

        if ($shapeType === 'polygon') {
            $rawPoints = trim((string) ($zone['polygon_points_json'] ?? ''));
            $decoded = $rawPoints !== '' ? json_decode($rawPoints, true) : null;
            if (is_array($decoded) && firenet_point_in_polygon($latitude, $longitude, $decoded)) {
                $isMatch = true;
            }
        } else {
            $centerLat = isset($zone['center_latitude']) ? (float) $zone['center_latitude'] : 0.0;
            $centerLng = isset($zone['center_longitude']) ? (float) $zone['center_longitude'] : 0.0;
            $radiusKm = isset($zone['radius_km']) ? (float) $zone['radius_km'] : 0.0;
            if ($centerLat !== 0.0 || $centerLng !== 0.0) {
                $distanceToCenter = firenet_haversine_km($latitude, $longitude, $centerLat, $centerLng);
                if ($radiusKm > 0 && $distanceToCenter <= $radiusKm) {
                    $isMatch = true;
                }
            }
        }

        if (!$isMatch) {
            continue;
        }

        $stationId = (int) $zone['station_id'];
        $stationLat = isset($zone['station_latitude']) ? (float) $zone['station_latitude'] : 0.0;
        $stationLng = isset($zone['station_longitude']) ? (float) $zone['station_longitude'] : 0.0;
        $distance = ($stationLat !== 0.0 || $stationLng !== 0.0)
            ? firenet_haversine_km($latitude, $longitude, $stationLat, $stationLng)
            : null;

        $candidate = [
            'stationId' => $stationId,
            'stationName' => (string) ($zone['station_name'] ?? ''),
            'method' => 'aor',
            'distanceKm' => $distance
        ];

        if (!isset($aorMatchesByStation[$stationId])) {
            $aorMatchesByStation[$stationId] = $candidate;
            continue;
        }

        $existingDistance = $aorMatchesByStation[$stationId]['distanceKm'] ?? INF;
        $newDistance = $candidate['distanceKm'] ?? INF;
        if ($newDistance < $existingDistance) {
            $aorMatchesByStation[$stationId] = $candidate;
        }
    }

    $aorMatches = array_values($aorMatchesByStation);
    usort($aorMatches, static function (array $a, array $b): int {
        $ad = $a['distanceKm'] ?? INF;
        $bd = $b['distanceKm'] ?? INF;
        if ($ad === $bd) {
            return ((int) ($a['stationId'] ?? 0)) <=> ((int) ($b['stationId'] ?? 0));
        }
        return $ad <=> $bd;
    });

    $selected = array_slice($aorMatches, 0, $requiredCount);
    $selectedById = [];
    foreach ($selected as $entry) {
        $selectedById[(int) $entry['stationId']] = true;
    }

    if (count($selected) < $requiredCount) {
        $nearestStmt = $pdo->query('
            SELECT station_id, station_name, latitude, longitude
            FROM stations
            WHERE status = "active" AND latitude IS NOT NULL AND longitude IS NOT NULL
        ');
        $stations = $nearestStmt->fetchAll(PDO::FETCH_ASSOC);

        $nearestCandidates = [];
        foreach ($stations as $station) {
            $stationId = (int) ($station['station_id'] ?? 0);
            if ($stationId < 1 || isset($selectedById[$stationId])) {
                continue;
            }

            $stationLat = (float) ($station['latitude'] ?? 0.0);
            $stationLng = (float) ($station['longitude'] ?? 0.0);
            if ($stationLat === 0.0 && $stationLng === 0.0) {
                continue;
            }

            $distanceKm = firenet_haversine_km($latitude, $longitude, $stationLat, $stationLng);
            $nearestCandidates[] = [
                'stationId' => $stationId,
                'stationName' => (string) ($station['station_name'] ?? ''),
                'method' => 'nearest',
                'distanceKm' => $distanceKm
            ];
        }

        usort($nearestCandidates, static function (array $a, array $b): int {
            $ad = $a['distanceKm'] ?? INF;
            $bd = $b['distanceKm'] ?? INF;
            if ($ad === $bd) {
                return ((int) ($a['stationId'] ?? 0)) <=> ((int) ($b['stationId'] ?? 0));
            }
            return $ad <=> $bd;
        });

        foreach ($nearestCandidates as $candidate) {
            $selected[] = $candidate;
            if (count($selected) >= $requiredCount) {
                break;
            }
        }
    }

    return $selected;
}

function firenet_ensure_incident_report_columns(PDO $pdo): void {
    $columnExistsStmt = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'incident_reports' AND COLUMN_NAME = 'incident_case_id'");
    if ((int) $columnExistsStmt->fetchColumn() === 0) {
        $pdo->exec('ALTER TABLE incident_reports ADD COLUMN incident_case_id INT NULL AFTER report_id');
        $pdo->exec('CREATE INDEX idx_incident_reports_case ON incident_reports (incident_case_id)');
    }

    $stationColumnStmt = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'incident_reports' AND COLUMN_NAME = 'station_id'");
    if ((int) $stationColumnStmt->fetchColumn() === 0) {
        $pdo->exec('ALTER TABLE incident_reports ADD COLUMN station_id INT NULL AFTER incident_case_id');
    }

    $updatedByColumnStmt = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'incident_reports' AND COLUMN_NAME = 'updated_by_user_id'");
    if ((int) $updatedByColumnStmt->fetchColumn() === 0) {
        $pdo->exec('ALTER TABLE incident_reports ADD COLUMN updated_by_user_id INT NULL AFTER received_by_user_id');
    }

    $stationFkStmt = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'incident_reports' AND CONSTRAINT_NAME = 'fk_incident_reports_station'");
    if ((int) $stationFkStmt->fetchColumn() === 0) {
        $pdo->exec('ALTER TABLE incident_reports ADD CONSTRAINT fk_incident_reports_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE');
    }

    $updatedByFkStmt = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'incident_reports' AND CONSTRAINT_NAME = 'fk_incident_reports_updated_by'");
    if ((int) $updatedByFkStmt->fetchColumn() === 0) {
        $pdo->exec('ALTER TABLE incident_reports ADD CONSTRAINT fk_incident_reports_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL');
    }

    $pdo->exec('
        UPDATE incident_reports i
        JOIN reports r ON r.report_id = i.report_id
        SET i.station_id = r.station_id
        WHERE i.station_id IS NULL
    ');
    $pdo->exec('
        UPDATE incident_reports i
        JOIN reports r ON r.report_id = i.report_id
        SET i.updated_by_user_id = COALESCE(i.received_by_user_id, r.created_by)
        WHERE i.updated_by_user_id IS NULL
    ');
}

function firenet_sync_responder_station_reports(
    PDO $pdo,
    int $primaryReportId,
    int $primaryIncidentReportId,
    int $reportTypeId,
    int $createdByUserId,
    array $assignedStations,
    array $snapshot
): void {
    firenet_ensure_incident_report_columns($pdo);

    if ($primaryReportId < 1 || $primaryIncidentReportId < 1) {
        return;
    }

    $pdo->prepare('UPDATE incident_reports SET incident_case_id = ? WHERE incident_report_id = ?')
        ->execute([$primaryReportId, $primaryIncidentReportId]);

    $existingStmt = $pdo->prepare('
        SELECT r.report_id, COALESCE(i.station_id, r.station_id) AS station_id, i.incident_report_id
        FROM incident_reports i
        JOIN reports r ON r.report_id = i.report_id
        WHERE i.incident_case_id = ?
    ');
    $existingStmt->execute([$primaryReportId]);
    $existingByStation = [];
    foreach ($existingStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $existingByStation[(int) ($row['station_id'] ?? 0)] = $row;
    }

    if (empty($assignedStations)) {
        return;
    }

    $insertIncidentStmt = $pdo->prepare('
        INSERT INTO incident_reports (
            report_id, incident_case_id, station_id, incident_report_stage_id, received_by_user_id, updated_by_user_id,
            caller_name, incident_location, latitude, longitude, geocode_status, assignment_method, assignment_distance_km,
            dispatched_station_id, alarm_level, incident_status, incident_started_at, incident_finished_at, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $insertUpdateStmt = $pdo->prepare('
        INSERT INTO incident_report_updates (incident_report_id, alarm_level, incident_status, recorded_by_user_id)
        VALUES (?, ?, ?, ?)
    ');

    foreach ($assignedStations as $assignment) {
        $responderStationId = (int) ($assignment['stationId'] ?? 0);
        if ($responderStationId < 1 || isset($existingByStation[$responderStationId])) {
            continue;
        }

        $title = (string) ($snapshot['title'] ?? '');
        $remarks = (string) ($snapshot['remarks'] ?? '');

        $pdo->prepare('
            INSERT INTO reports (report_type_id, station_id, title, description, created_by, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ')->execute([$reportTypeId, $responderStationId, $title, $remarks, $createdByUserId, 'submitted']);
        $responderReportId = (int) $pdo->lastInsertId();

        $insertIncidentStmt->execute([
            $responderReportId,
            $primaryReportId,
            $responderStationId,
            (int) ($snapshot['stageId'] ?? 1),
            $createdByUserId,
            $createdByUserId,
            (string) ($snapshot['callerName'] ?? ''),
            (string) ($snapshot['location'] ?? ''),
            $snapshot['latitude'],
            $snapshot['longitude'],
            (string) ($snapshot['geocodeStatus'] ?? 'skipped'),
            (string) ($snapshot['assignmentMethod'] ?? 'pending'),
            $snapshot['assignmentDistanceKm'],
            $responderStationId,
            (int) ($snapshot['alarmLevel'] ?? 1),
            $snapshot['incidentStatus'] ?: null,
            $snapshot['incidentStartedAt'] ?: null,
            $snapshot['incidentFinishedAt'] ?: null,
            $remarks
        ]);

        $responderIncidentId = (int) $pdo->lastInsertId();
        firenet_sync_incident_dispatch_stations($pdo, $responderIncidentId, $assignedStations);

        $insertUpdateStmt->execute([
            $responderIncidentId,
            (int) ($snapshot['alarmLevel'] ?? 1),
            $snapshot['incidentStatus'] ?: null,
            $createdByUserId
        ]);
    }
}

function firenet_is_central_station(PDO $pdo, int $stationId): bool {
    if ($stationId < 1) {
        return false;
    }

    static $cache = [];
    if (array_key_exists($stationId, $cache)) {
        return $cache[$stationId];
    }

    $stmt = $pdo->prepare('SELECT station_code FROM stations WHERE station_id = ? LIMIT 1');
    $stmt->execute([$stationId]);
    $code = strtolower(trim((string) $stmt->fetchColumn()));
    $cache[$stationId] = $code === 'mcfs';
    return $cache[$stationId];
}

function firenet_incident_completed_sql(string $stageAlias = 's', string $incidentAlias = 'i'): string {
    return '('
        . $stageAlias . ".stage_code = 'after_incident'"
        . ' OR ' . $incidentAlias . ".incident_status = 'fire_out'"
        . ' OR ' . $incidentAlias . '.incident_finished_at IS NOT NULL'
        . ')';
}

function firenet_report_belongs_to_station(PDO $pdo, int $reportId, int $stationId): bool {
    $stmt = $pdo->prepare('SELECT report_id FROM reports WHERE report_id = ? AND station_id = ? LIMIT 1');
    $stmt->execute([$reportId, $stationId]);
    return (bool) $stmt->fetchColumn();
}

function firenet_sync_incident_dispatch_stations(PDO $pdo, int $incidentReportId, array $assignments): void {
    $pdo->prepare('DELETE FROM incident_report_dispatch_stations WHERE incident_report_id = ?')->execute([$incidentReportId]);

    if ($incidentReportId < 1 || empty($assignments)) {
        return;
    }

    $insertStmt = $pdo->prepare('
        INSERT INTO incident_report_dispatch_stations
            (incident_report_id, station_id, dispatch_order, assignment_method, assignment_distance_km)
        VALUES (?, ?, ?, ?, ?)
    ');

    $order = 1;
    foreach ($assignments as $assignment) {
        $stationId = (int) ($assignment['stationId'] ?? 0);
        if ($stationId < 1) {
            continue;
        }

        $method = (string) ($assignment['method'] ?? 'nearest');
        if (!in_array($method, ['aor', 'nearest', 'manual', 'pending'], true)) {
            $method = 'nearest';
        }

        $distance = isset($assignment['distanceKm']) && $assignment['distanceKm'] !== null
            ? (float) $assignment['distanceKm']
            : null;

        $insertStmt->execute([
            $incidentReportId,
            $stationId,
            $order,
            $method,
            $distance
        ]);
        $order++;
    }
}

function firenet_station_responding_to_incident(PDO $pdo, int $reportId, int $stationId): bool {
    $stmt = $pdo->prepare('SELECT 1
        FROM incident_reports i
        JOIN reports r ON r.report_id = i.report_id
        LEFT JOIN incident_report_dispatch_stations d ON d.incident_report_id = i.incident_report_id
        WHERE i.report_id = ? AND (r.station_id = ? OR i.dispatched_station_id = ? OR d.station_id = ?)
        LIMIT 1
    ');
    $stmt->execute([$reportId, $stationId, $stationId, $stationId]);
    return (bool) $stmt->fetchColumn();
}

function firenet_ensure_equipment_reports_table(PDO $pdo): void {
    $pdo->exec('CREATE TABLE IF NOT EXISTS equipment_reports (
        equipment_report_id INT PRIMARY KEY AUTO_INCREMENT,
        report_id INT NOT NULL,
        equipment_name VARCHAR(120) NOT NULL,
        equipment_category VARCHAR(50) NOT NULL,
        issue_type VARCHAR(50) NOT NULL,
        urgency ENUM(\'low\', \'medium\', \'high\', \'critical\') NOT NULL DEFAULT \'medium\',
        last_service_date DATE NULL,
        operational_status ENUM(\'operational\', \'limited\', \'out_of_service\') NOT NULL DEFAULT \'limited\',
        action_taken LONGTEXT NULL,
        recommendation LONGTEXT NULL,
        issue_summary LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_equipment_report_reference (report_id),
        CONSTRAINT fk_equipment_reports_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
    )');

    $columnExistsStmt = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'equipment_reports' AND COLUMN_NAME = 'equipment_location'");
    $columnExists = (int) $columnExistsStmt->fetchColumn() > 0;
    if ($columnExists) {
        $pdo->exec('ALTER TABLE equipment_reports DROP COLUMN equipment_location');
    }
}

function firenet_normalize_search_value(string $value): string {
    $value = preg_replace('/[^\pL\pN\s]/u', ' ', $value) ?? $value;
    $value = preg_replace('/\s+/', ' ', $value) ?? $value;
    return trim($value);
}

function firenet_extract_search_tokens(string $value): array {
    $normalized = strtolower(firenet_normalize_search_value($value));
    if ($normalized === '') {
        return [];
    }

    $parts = preg_split('/\s+/', $normalized) ?: [];
    $tokens = [];
    foreach ($parts as $part) {
        if ($part === '' || strlen($part) < 3) {
            continue;
        }
        $tokens[] = $part;
    }

    return array_values(array_unique($tokens));
}

function firenet_extract_equipment_payload_from_remarks(string $remarks): array {
    $marker = '[EQUIPMENT_REPORT_V1]';
    if (strpos($remarks, $marker) !== 0) {
        return [];
    }

    $details = [];
    $lines = preg_split('/\r\n|\r|\n/', $remarks) ?: [];
    $inSummary = false;
    $summaryLines = [];

    foreach ($lines as $index => $line) {
        if ($index === 0) {
            continue;
        }

        $trimmed = trim((string) $line);
        if ($trimmed === 'Issue Summary:') {
            $inSummary = true;
            continue;
        }

        if ($inSummary) {
            $summaryLines[] = $line;
            continue;
        }

        $separatorPos = strpos($line, ':');
        if ($separatorPos === false) {
            continue;
        }

        $key = trim(substr($line, 0, $separatorPos));
        $value = trim(substr($line, $separatorPos + 1));

        if ($key === 'Equipment Name') {
            $details['equipmentName'] = $value;
        } elseif ($key === 'Category') {
            $details['equipmentCategoryLabel'] = $value;
        } elseif ($key === 'Issue Type') {
            $details['equipmentIssueTypeLabel'] = $value;
        } elseif ($key === 'Urgency') {
            $details['equipmentUrgencyLabel'] = $value;
        } elseif ($key === 'Last Service Date') {
            $details['equipmentLastService'] = $value === '-' ? '' : $value;
        } elseif ($key === 'Operational Status') {
            $details['equipmentOperationalStatusLabel'] = $value;
        } elseif ($key === 'Initial Action Taken') {
            $details['equipmentActionTaken'] = $value === '-' ? '' : $value;
        } elseif ($key === 'Recommended Follow-up') {
            $details['equipmentRecommendation'] = $value === '-' ? '' : $value;
        }
    }

    $summary = trim(implode("\n", $summaryLines));
    if ($summary !== '') {
        $details['remarks'] = $summary;
    }

    return $details;
}

function firenet_build_street_variants(string $street): array {
    $street = trim($street);
    if ($street === '') {
        return [''];
    }

    $expanded = preg_replace([
        '/\bst\.?\b/i',
        '/\bave\.?\b/i',
        '/\bav\.?\b/i',
        '/\brd\.?\b/i',
        '/\bblvd\.?\b/i',
        '/\bdr\.?\b/i',
        '/\bext\.?\b/i'
    ], [
        'Street',
        'Avenue',
        'Avenue',
        'Road',
        'Boulevard',
        'Drive',
        'Extension'
    ], $street) ?? $street;

    $abbreviated = preg_replace([
        '/\bstreet\b/i',
        '/\bavenue\b/i',
        '/\broad\b/i',
        '/\bboulevard\b/i',
        '/\bdrive\b/i',
        '/\bextension\b/i'
    ], [
        'St',
        'Ave',
        'Rd',
        'Blvd',
        'Dr',
        'Ext'
    ], $street) ?? $street;

    $withoutSuffix = preg_replace('/\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|extension|ext)\b\.?$/i', '', $street) ?? $street;

    $variants = [
        trim($street),
        trim($expanded),
        trim($abbreviated),
        trim($withoutSuffix),
        trim(firenet_normalize_search_value($street))
    ];

    $variants = array_filter($variants, static fn ($value) => $value !== '');
    return array_values(array_unique($variants));
}

function firenet_is_within_makati_bounds(float $latitude, float $longitude): bool {
    return $latitude >= 14.49 && $latitude <= 14.62 && $longitude >= 120.98 && $longitude <= 121.09;
}

function firenet_score_geocode_result(array $result, array $context): float {
    $latitude = isset($result['lat']) ? (float) $result['lat'] : (float) ($result['latitude'] ?? 0.0);
    $longitude = isset($result['lon']) ? (float) $result['lon'] : (float) ($result['longitude'] ?? 0.0);
    $displayName = strtolower((string) ($result['display_name'] ?? $result['displayName'] ?? ''));

    $score = 0.0;
    if (firenet_is_within_makati_bounds($latitude, $longitude)) {
        $score += 14.0;
    } else {
        $score -= 4.0;
    }

    if (strpos($displayName, 'makati') !== false) {
        $score += 8.0;
    }
    if (strpos($displayName, 'metro manila') !== false || strpos($displayName, 'national capital region') !== false || strpos($displayName, 'ncr') !== false) {
        $score += 3.0;
    }

    $streetTokens = firenet_extract_search_tokens((string) ($context['street'] ?? ''));
    $landmarkTokens = firenet_extract_search_tokens((string) ($context['landmark'] ?? ''));
    $barangayTokens = firenet_extract_search_tokens((string) ($context['barangay'] ?? ''));

    foreach ($streetTokens as $token) {
        $score += strpos($displayName, $token) !== false ? 2.1 : -0.2;
    }
    foreach ($landmarkTokens as $token) {
        $score += strpos($displayName, $token) !== false ? 1.2 : -0.1;
    }
    foreach ($barangayTokens as $token) {
        $score += strpos($displayName, $token) !== false ? 2.0 : -0.2;
    }

    return $score;
}

function firenet_geocode_address(PDO $pdo, string $query, array $context = []): ?array {
    $normalized = strtolower(trim($query));
    if ($normalized === '') {
        return null;
    }

    try {
        $cacheStmt = $pdo->prepare('SELECT latitude, longitude, display_name FROM geocode_cache WHERE query_key = ? LIMIT 1');
        $cacheStmt->execute([$normalized]);
        $cached = $cacheStmt->fetch(PDO::FETCH_ASSOC);
        if ($cached) {
            $cachedResult = [
                'lat' => (float) $cached['latitude'],
                'lon' => (float) $cached['longitude'],
                'display_name' => (string) ($cached['display_name'] ?? '')
            ];

            if (empty($context) || firenet_score_geocode_result($cachedResult, $context) >= 6.0) {
            return [
                'latitude' => (float) $cached['latitude'],
                'longitude' => (float) $cached['longitude'],
                'displayName' => (string) ($cached['display_name'] ?? '')
            ];
            }
        }
    } catch (Throwable $ignored) {
        // Cache table may not yet exist in older databases.
    }

    $url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=ph&viewbox=120.98,14.62,121.09,14.49&bounded=0&q=' . rawurlencode($query);
    $body = false;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'User-Agent: FireNet/1.0 (dispatch-assignment)'
            ]
        ]);
        $body = curl_exec($ch);
        curl_close($ch);
    }

    if ($body === false) {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 10,
                'header' => "Accept: application/json\r\nUser-Agent: FireNet/1.0 (dispatch-assignment)\r\n"
            ]
        ]);
        $body = @file_get_contents($url, false, $context);
    }

    if (!is_string($body) || trim($body) === '') {
        return null;
    }

    $decoded = json_decode($body, true);
    if (!is_array($decoded) || empty($decoded)) {
        return null;
    }

    $best = null;
    $bestScore = -INF;

    foreach ($decoded as $entry) {
        if (!is_array($entry) || !isset($entry['lat'], $entry['lon'])) {
            continue;
        }

        $score = firenet_score_geocode_result($entry, $context);
        if ($score > $bestScore) {
            $bestScore = $score;
            $best = $entry;
        }
    }

    if (!is_array($best) || $bestScore < 5.0) {
        return null;
    }

    $latitude = (float) $best['lat'];
    $longitude = (float) $best['lon'];
    $displayName = (string) ($best['display_name'] ?? '');

    try {
        $saveStmt = $pdo->prepare('INSERT INTO geocode_cache (query_key, query_text, latitude, longitude, display_name, source) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude), display_name = VALUES(display_name), source = VALUES(source), updated_at = CURRENT_TIMESTAMP');
        $saveStmt->execute([$normalized, $query, $latitude, $longitude, $displayName, 'nominatim']);
    } catch (Throwable $ignored) {
        // Cache table may not yet exist in older databases.
    }

    return [
        'latitude' => $latitude,
        'longitude' => $longitude,
        'displayName' => $displayName
    ];
}

function firenet_normalize_barangay_label(string $barangay): string {
    $value = trim($barangay);
    if ($value === '') {
        return '';
    }

    if (stripos($value, 'barangay ') === 0 || stripos($value, 'brgy ') === 0) {
        return $value;
    }

    return 'Barangay ' . $value;
}

function firenet_extract_incident_location_parts(string $location): array {
    $parts = array_values(array_filter(array_map('trim', explode(',', $location)), static fn ($item) => $item !== ''));
    $barangay = '';

    if (!empty($parts)) {
        $lastPart = end($parts);
        if (preg_match('/^(?:Barangay|Brgy)\b/i', $lastPart)) {
            $barangay = preg_replace('/^(?:Barangay|Brgy)\s*/i', '', $lastPart);
            array_pop($parts);
        }
    }

    $street = $parts[0] ?? '';
    $landmark = count($parts) > 1 ? implode(', ', array_slice($parts, 1)) : '';

    return [
        'street' => $street,
        'landmark' => $landmark,
        'barangay' => $barangay
    ];
}

function firenet_build_geocode_queries(string $streetName, string $landmark, string $barangay): array {
    $street = trim($streetName);
    $mark = trim($landmark);
    $brgyRaw = trim($barangay);
    $brgy = firenet_normalize_barangay_label($brgyRaw);

    $streetVariants = firenet_build_street_variants($street);

    $queries = [];

    $localityVariants = [
        ['Makati City', 'Metro Manila', 'Philippines'],
        ['City of Makati', 'Metro Manila', 'Philippines'],
        ['Makati', 'Metro Manila', 'Philippines'],
        ['Makati City', 'Philippines'],
        ['Metro Manila', 'Philippines'],
        ['Philippines']
    ];

    foreach ($streetVariants as $streetVariant) {
        foreach ($localityVariants as $localityParts) {
            $variants = [
                [$streetVariant, $mark, $brgy],
                [$streetVariant, $brgy],
                [$streetVariant, $mark, $brgyRaw],
                [$streetVariant, $brgyRaw],
                [$streetVariant, $mark],
                [$streetVariant]
            ];

            foreach ($variants as $parts) {
                $query = implode(', ', array_values(array_filter(array_merge($parts, $localityParts), static fn ($value) => trim((string) $value) !== '')));
                if ($query !== '') {
                    $queries[] = $query;
                }
            }
        }
    }

    $queries[] = implode(', ', array_values(array_filter([$mark, $brgy, 'Makati City', 'Metro Manila', 'Philippines'], static fn ($value) => trim((string) $value) !== '')));
    $queries[] = implode(', ', array_values(array_filter([$mark, $brgyRaw, 'Makati City', 'Metro Manila', 'Philippines'], static fn ($value) => trim((string) $value) !== '')));

    $deduped = array_values(array_unique(array_filter($queries, static fn ($value) => trim((string) $value) !== '')));
    return array_slice($deduped, 0, 24);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = trim((string) ($_GET['action'] ?? ''));
    if ($action === 'locate') {
        try {
            $pdo = firenet_get_pdo();
            $latitudeRaw = trim((string) ($_GET['latitude'] ?? ''));
            $longitudeRaw = trim((string) ($_GET['longitude'] ?? ''));
            $streetNameLookup = trim((string) ($_GET['streetName'] ?? ''));
            $barangayLookup = trim((string) ($_GET['barangay'] ?? ''));
            $landmarkLookup = trim((string) ($_GET['landmark'] ?? ''));
            $alarmLevelLookup = (int) ($_GET['alarmLevel'] ?? 1);

            $latitude = null;
            $longitude = null;
            $displayAddress = '';

            if ($latitudeRaw !== '' && $longitudeRaw !== '') {
                $latitude = (float) $latitudeRaw;
                $longitude = (float) $longitudeRaw;
            } else {
                $queries = firenet_build_geocode_queries($streetNameLookup, $landmarkLookup, $barangayLookup);
                $geocodeContext = [
                    'street' => $streetNameLookup,
                    'landmark' => $landmarkLookup,
                    'barangay' => $barangayLookup
                ];

                foreach ($queries as $query) {
                    $geocodeResult = firenet_geocode_address($pdo, $query, $geocodeContext);
                    if (!$geocodeResult) {
                        continue;
                    }

                    $latitude = (float) $geocodeResult['latitude'];
                    $longitude = (float) $geocodeResult['longitude'];
                    $displayAddress = (string) ($geocodeResult['displayName'] ?? '');
                    break;
                }
            }

            if ($latitude === null || $longitude === null) {
                echo json_encode(['ok' => true, 'latitude' => null, 'longitude' => null, 'station' => null, 'displayAddress' => $displayAddress]);
                exit;
            }

            $assignments = firenet_find_station_assignments($pdo, $latitude, $longitude, $alarmLevelLookup);
            $assignment = $assignments[0] ?? null;
            echo json_encode([
                'ok' => true,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'displayAddress' => $displayAddress,
                'station' => $assignment ? [
                    'id' => $assignment['stationId'],
                    'name' => $assignment['stationName'],
                    'method' => $assignment['method'],
                    'distanceKm' => $assignment['distanceKm'] !== null ? number_format((float) $assignment['distanceKm'], 3, '.', '') : null
                ] : null,
                'stations' => array_map(static function (array $entry): array {
                    return [
                        'id' => (int) $entry['stationId'],
                        'name' => (string) ($entry['stationName'] ?? ''),
                        'method' => (string) ($entry['method'] ?? 'nearest'),
                        'distanceKm' => $entry['distanceKm'] !== null ? number_format((float) $entry['distanceKm'], 3, '.', '') : null
                    ];
                }, $assignments)
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'message' => 'Unable to locate address right now']);
        }
        exit;
    }

    if ($action === 'logs') {
        try {
            $pdo = firenet_get_pdo();
            firenet_ensure_report_cloud_backups_table($pdo);
            $sort = strtolower(trim((string) ($_GET['sort'] ?? 'date')));
            $dir = strtolower(trim((string) ($_GET['dir'] ?? 'desc')));
            $search = trim((string) ($_GET['q'] ?? ''));
            $stationFilter = (int) ($_GET['stationId'] ?? 0);
            $caseFilter = (int) ($_GET['caseId'] ?? $_GET['incidentCaseId'] ?? 0);
            $isCentralStation = firenet_is_central_station($pdo, $sessionStationId);

            $sortMap = [
                'date' => 'COALESCE(i.incident_finished_at, i.updated_at, r.updated_at, r.created_at)',
                'name' => 'COALESCE(NULLIF(r.title, ""), NULLIF(i.incident_location, ""), "Untitled Incident")',
                'station' => 'COALESCE(s_report.station_name, "")',
                'alarm' => 'i.alarm_level',
                'status' => 'i.incident_status'
            ];
            $sortColumn = $sortMap[$sort] ?? $sortMap['date'];
            $sortDirection = $dir === 'asc' ? 'ASC' : 'DESC';

            $where = [
                "rt.type_name = 'incident_report'",
                "i.incident_status = 'fire_out'",
            ];
            $params = [];

            if ($isCentralStation) {
                if ($stationFilter > 0) {
                    $where[] = 'COALESCE(i.station_id, r.station_id) = ?';
                    $params[] = $stationFilter;
                }
            } else {
                $where[] = 'COALESCE(i.station_id, r.station_id) = ?';
                $params[] = $sessionStationId;
            }

            if ($caseFilter > 0) {
                $where[] = '(i.incident_case_id = ? OR (i.incident_case_id IS NULL AND r.report_id = ?))';
                $params[] = $caseFilter;
                $params[] = $caseFilter;
            }

            if ($search !== '') {
                $where[] = '(r.title LIKE ? OR i.incident_location LIKE ? OR u.username LIKE ? OR COALESCE(s_report.station_name, "") LIKE ? OR CAST(COALESCE(i.incident_case_id, r.report_id) AS CHAR) LIKE ?)';
                $like = '%' . $search . '%';
                $params = array_merge($params, [$like, $like, $like, $like, $like]);
            }

            firenet_ensure_incident_report_columns($pdo);

            $sql = '
                SELECT DISTINCT r.report_id, r.title, r.description, r.created_at, r.updated_at, r.created_by,
                       u.username AS creator_username,
                       i.incident_report_id, i.incident_case_id, i.station_id AS incident_station_id,
                       i.updated_by_user_id, u_updated.username AS updated_by_username,
                       i.incident_location, i.alarm_level, i.incident_status,
                       i.incident_started_at, i.incident_finished_at, i.caller_name, i.remarks AS incident_remarks,
                       i.incident_report_stage_id, s.stage_code, i.latitude, i.longitude, i.geocode_status,
                       i.assignment_method, i.assignment_distance_km, i.dispatched_station_id,
                       ds.station_name AS assigned_station_name,
                       s_report.station_id AS report_station_id, s_report.station_name AS report_station_name,
                       e.equipment_name, e.equipment_category, e.issue_type, e.urgency, e.last_service_date,
                       e.operational_status, e.action_taken, e.recommendation, e.issue_summary
                FROM reports r
                LEFT JOIN report_type rt ON r.report_type_id = rt.report_type_id
                LEFT JOIN incident_reports i ON r.report_id = i.report_id
                LEFT JOIN incident_report_stage s ON i.incident_report_stage_id = s.incident_report_stage_id
                LEFT JOIN stations ds ON ds.station_id = i.dispatched_station_id
                LEFT JOIN stations s_report ON s_report.station_id = r.station_id
                LEFT JOIN incident_report_dispatch_stations d ON d.incident_report_id = i.incident_report_id
                LEFT JOIN users u ON u.user_id = r.created_by
                LEFT JOIN users u_updated ON u_updated.user_id = i.updated_by_user_id
                LEFT JOIN equipment_reports e ON e.report_id = r.report_id
                WHERE ' . implode(' AND ', $where) . '
                ORDER BY ' . $sortColumn . ' ' . $sortDirection . ', r.report_id DESC
                LIMIT 250
            ';

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $logs = [];
            foreach ($rows as $row) {
                $incidentReportId = (int) ($row['incident_report_id'] ?? 0);
                if ($incidentReportId < 1) {
                    continue;
                }

                $timelineUpdatesStmt = $pdo->prepare('
                    SELECT alarm_level, incident_status, recorded_at
                    FROM incident_report_updates
                    WHERE incident_report_id = ?
                    ORDER BY recorded_at ASC
                ');
                $timelineUpdatesStmt->execute([$incidentReportId]);
                $timelineUpdates = array_map(static function (array $update): array {
                    return [
                        'alarmLevel' => (int) ($update['alarm_level'] ?? 0),
                        'incidentStatus' => (string) ($update['incident_status'] ?? ''),
                        'recordedAt' => (string) ($update['recorded_at'] ?? '')
                    ];
                }, $timelineUpdatesStmt->fetchAll(PDO::FETCH_ASSOC));

                $timelineChangesStmt = $pdo->prepare('
                    SELECT from_alarm_level, to_alarm_level, from_incident_status, to_incident_status, changed_at, notes
                    FROM incident_report_change_logs
                    WHERE incident_report_id = ?
                    ORDER BY changed_at ASC
                ');
                $timelineChangesStmt->execute([$incidentReportId]);
                $timelineChanges = array_map(static function (array $change): array {
                    return [
                        'fromAlarmLevel' => isset($change['from_alarm_level']) ? (int) $change['from_alarm_level'] : null,
                        'toAlarmLevel' => isset($change['to_alarm_level']) ? (int) $change['to_alarm_level'] : null,
                        'fromIncidentStatus' => (string) ($change['from_incident_status'] ?? ''),
                        'toIncidentStatus' => (string) ($change['to_incident_status'] ?? ''),
                        'changedAt' => (string) ($change['changed_at'] ?? ''),
                        'notes' => (string) ($change['notes'] ?? '')
                    ];
                }, $timelineChangesStmt->fetchAll(PDO::FETCH_ASSOC));

                $logs[] = [
                    'id' => (int) ($row['report_id'] ?? 0),
                    'incidentCaseId' => (int) ($row['incident_case_id'] ?? $row['report_id'] ?? 0),
                    'incidentReportId' => $incidentReportId,
                    'stationId' => (int) ($row['incident_station_id'] ?? $row['report_station_id'] ?? 0),
                    'stationName' => (string) ($row['report_station_name'] ?? ''),
                    'updatedByUserId' => (int) ($row['updated_by_user_id'] ?? 0),
                    'updatedBy' => (string) ($row['updated_by_username'] ?? ''),
                    'title' => (string) ($row['title'] ?? ''),
                    'assignedStationName' => (string) ($row['assigned_station_name'] ?? ''),
                    'incidentLocation' => (string) ($row['incident_location'] ?? ''),
                    'alarmLevel' => (int) ($row['alarm_level'] ?? 0),
                    'incidentStatus' => (string) ($row['incident_status'] ?? ''),
                    'stage' => (string) ($row['stage_code'] ?? ''),
                    'incidentStartedAt' => (string) ($row['incident_started_at'] ?? ''),
                    'incidentFinishedAt' => (string) ($row['incident_finished_at'] ?? ''),
                    'submittedBy' => (string) ($row['creator_username'] ?? ''),
                    'submittedAt' => (string) ($row['created_at'] ?? ''),
                    'updatedAt' => (string) ($row['updated_at'] ?? ''),
                    'callerName' => (string) ($row['caller_name'] ?? ''),
                    'remarks' => (string) ($row['incident_remarks'] ?? ($row['description'] ?? '')),
                    'timelineUpdates' => $timelineUpdates,
                    'timelineChanges' => $timelineChanges
                ];
            }

            $fireOutCount = count($logs);

            $cloudSync = firenet_auto_backup_pending_reports(
                $pdo,
                array_map(static fn (array $log): int => (int) ($log['id'] ?? 0), $logs),
                $userId
            );

            $backupMap = [];
            if ($logs !== []) {
                $reportIds = array_values(array_unique(array_map(static fn (array $log): int => (int) ($log['id'] ?? 0), $logs)));
                $reportIds = array_values(array_filter($reportIds, static fn (int $id): bool => $id > 0));
                if ($reportIds !== []) {
                    $placeholders = implode(',', array_fill(0, count($reportIds), '?'));
                    $backupStmt = $pdo->prepare('
                        SELECT report_id, r2_key, central_r2_key, file_name, file_size, backed_up_at
                        FROM report_cloud_backups
                        WHERE report_id IN (' . $placeholders . ')
                    ');
                    $backupStmt->execute($reportIds);
                    foreach ($backupStmt->fetchAll(PDO::FETCH_ASSOC) as $backupRow) {
                        $backupMap[(int) ($backupRow['report_id'] ?? 0)] = firenet_report_cloud_backup_payload($backupRow);
                    }
                }
            }

            foreach ($logs as $index => $log) {
                $reportId = (int) ($log['id'] ?? 0);
                $logs[$index]['cloudBackup'] = $backupMap[$reportId] ?? firenet_report_cloud_backup_payload(null);
            }

            $backedUpCount = count(array_filter($logs, static fn (array $log): bool => !empty($log['cloudBackup']['backedUp'])));

            $stations = [];
            if ($isCentralStation) {
                $stationsStmt = $pdo->query('
                    SELECT station_id, station_name, station_code
                    FROM stations
                    WHERE status = "active"
                    ORDER BY station_name ASC
                ');
                $stations = array_map(static function (array $station): array {
                    return [
                        'id' => (int) ($station['station_id'] ?? 0),
                        'name' => (string) ($station['station_name'] ?? ''),
                        'code' => (string) ($station['station_code'] ?? ''),
                    ];
                }, $stationsStmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
            }

            echo json_encode([
                'ok' => true,
                'logs' => $logs,
                'isCentralStation' => $isCentralStation,
                'stations' => $stations,
                'cloudStorageEnabled' => firenet_r2_enabled(),
                'cloudSync' => $cloudSync,
                'summary' => [
                    'total' => $fireOutCount,
                    'fireOut' => $fireOutCount,
                    'backedUp' => $backedUpCount,
                    'pendingBackup' => max(0, $fireOutCount - $backedUpCount),
                    'stationCount' => count(array_unique(array_map(static fn (array $log): int => (int) ($log['stationId'] ?? 0), $logs)))
                ]
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'message' => 'Unable to load incident logs right now']);
        }
        exit;
    }

    try {
        $pdo = firenet_get_pdo();
        firenet_ensure_equipment_reports_table($pdo);
        firenet_ensure_incident_report_columns($pdo);
        $completedIncidentSql = firenet_incident_completed_sql();
        $sql = '
            SELECT DISTINCT r.report_id, r.report_type_id, r.station_id AS report_station_id, rt.type_name,
                    r.title,
                    r.description,
                    r.created_at, r.updated_at, r.created_by,
                    u.username AS creator_username,
                    s_report.station_name AS report_station_name,
                    i.incident_report_id, i.incident_case_id, i.station_id AS incident_station_id,
                    i.updated_by_user_id, u_updated.username AS updated_by_username,
                    i.incident_location, i.alarm_level,
                    i.incident_status, i.incident_started_at, i.incident_finished_at,
                    i.caller_name, i.remarks AS incident_remarks, i.incident_report_stage_id, s.stage_code,
                    i.latitude, i.longitude, i.geocode_status, i.assignment_method, i.assignment_distance_km,
                    i.dispatched_station_id, ds.station_name AS assigned_station_name,
                    e.equipment_name, e.equipment_category, e.issue_type, e.urgency,
                    e.last_service_date, e.operational_status,
                    e.action_taken, e.recommendation, e.issue_summary
            FROM reports r
            LEFT JOIN report_type rt ON r.report_type_id = rt.report_type_id
            LEFT JOIN incident_reports i ON r.report_id = i.report_id
            LEFT JOIN equipment_reports e ON r.report_id = e.report_id
            LEFT JOIN incident_report_stage s ON i.incident_report_stage_id = s.incident_report_stage_id
            LEFT JOIN stations ds ON ds.station_id = i.dispatched_station_id
            LEFT JOIN stations s_report ON s_report.station_id = r.station_id
            LEFT JOIN users u ON u.user_id = r.created_by
            LEFT JOIN users u_updated ON u_updated.user_id = i.updated_by_user_id
            WHERE (r.created_by = ? OR COALESCE(i.updated_by_user_id, 0) = ?)
              AND (rt.type_name <> \'incident_report\' OR NOT ' . $completedIncidentSql . ')
        ';
        $params = [$userId, $userId];
        $sql .= ' ORDER BY r.updated_at DESC, r.created_at DESC LIMIT 200';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $reports = [];
        foreach ($rows as $row) {
            $reportId = (int) $row['report_id'];
            $reportType = $row['type_name'] ?? 'incident_report';

            $rawLocation = $reportType === 'equipment_report'
                ? ''
                : (string) ($row['incident_location'] ?? '');
            $locationParts = firenet_extract_incident_location_parts($rawLocation);
            $report = [
                'id' => $reportId,
                'type' => $reportType,
                'stationId' => (int) ($row['report_station_id'] ?? 0),
                'stationName' => (string) ($row['report_station_name'] ?? ''),
                'title' => ($row['title'] ?? '') !== '' ? $row['title'] : ($rawLocation !== '' ? $rawLocation : (string) ($row['equipment_name'] ?? '')),
                'location' => $rawLocation,
                'barangay' => $locationParts['barangay'] ?? '',
                'streetName' => $locationParts['street'] ?? '',
                'landmark' => $locationParts['landmark'] ?? '',
                'remarks' => $reportType === 'equipment_report'
                    ? ((string) ($row['issue_summary'] ?? '') !== '' ? (string) $row['issue_summary'] : (string) ($row['description'] ?? ''))
                    : ((string) ($row['incident_remarks'] ?? '') !== '' ? (string) $row['incident_remarks'] : (string) ($row['description'] ?? '')),
                'stage' => $row['stage_code'] ?? '',
                'submittedAt' => $row['created_at'] ?? '',
                'updatedAt' => $row['updated_at'] ?? '',
                'submittedBy' => $row['creator_username'] ?? $username
            ];
            
            if ($reportType === 'incident_report') {
                $incidentCaseId = (int) ($row['incident_case_id'] ?? 0);
                if ($incidentCaseId < 1) {
                    $incidentCaseId = $reportId;
                }
                $report['incidentCaseId'] = $incidentCaseId;
                $report['displayId'] = '#' . $incidentCaseId;
                $report['incidentStationId'] = (int) ($row['incident_station_id'] ?? $row['report_station_id'] ?? 0);
                $report['updatedByUserId'] = (int) ($row['updated_by_user_id'] ?? 0);
                $report['updatedBy'] = (string) ($row['updated_by_username'] ?? '');
                $report['alarmLevel'] = (int) ($row['alarm_level'] ?? 0);
                $report['incidentStatus'] = $row['incident_status'] ?? '';
                $report['incidentStartedAt'] = $row['incident_started_at'] ?? '';
                $report['incidentFinishedAt'] = $row['incident_finished_at'] ?? '';
                $report['callerName'] = $row['caller_name'] ?? '';
                $report['latitude'] = isset($row['latitude']) ? (float) $row['latitude'] : null;
                $report['longitude'] = isset($row['longitude']) ? (float) $row['longitude'] : null;
                $report['geocodeStatus'] = $row['geocode_status'] ?? '';
                $report['assignmentMethod'] = $row['assignment_method'] ?? '';
                $report['assignmentDistanceKm'] = isset($row['assignment_distance_km']) ? (float) $row['assignment_distance_km'] : null;
                $report['assignedStationId'] = isset($row['dispatched_station_id']) ? (int) $row['dispatched_station_id'] : null;
                $report['assignedStationName'] = $row['assigned_station_name'] ?? '';

                $assignedStationsStmt = $pdo->prepare('
                    SELECT d.station_id, s.station_name, d.assignment_method, d.assignment_distance_km, d.dispatch_order
                    FROM incident_report_dispatch_stations d
                    JOIN stations s ON s.station_id = d.station_id
                    WHERE d.incident_report_id = ?
                    ORDER BY d.dispatch_order ASC, d.incident_report_dispatch_station_id ASC
                ');
                $assignedStationsStmt->execute([(int) $row['incident_report_id']]);
                $report['assignedStations'] = array_map(static function (array $stationRow): array {
                    return [
                        'id' => (int) ($stationRow['station_id'] ?? 0),
                        'name' => (string) ($stationRow['station_name'] ?? ''),
                        'method' => (string) ($stationRow['assignment_method'] ?? ''),
                        'distanceKm' => isset($stationRow['assignment_distance_km']) ? (float) $stationRow['assignment_distance_km'] : null,
                        'order' => (int) ($stationRow['dispatch_order'] ?? 0)
                    ];
                }, $assignedStationsStmt->fetchAll(PDO::FETCH_ASSOC));

                if (empty($report['assignedStations']) && !empty($report['assignedStationId']) && !empty($report['assignedStationName'])) {
                    $report['assignedStations'] = [[
                        'id' => (int) $report['assignedStationId'],
                        'name' => (string) $report['assignedStationName'],
                        'method' => (string) ($report['assignmentMethod'] ?? ''),
                        'distanceKm' => $report['assignmentDistanceKm'],
                        'order' => 1
                    ]];
                }
                
                // Fetch incident updates
                $updateStmt = $pdo->prepare('
                    SELECT alarm_level, incident_status, recorded_at
                    FROM incident_report_updates
                    WHERE incident_report_id = ?
                    ORDER BY recorded_at ASC
                ');
                $updateStmt->execute([(int) $row['incident_report_id']]);
                $report['incidentUpdates'] = array_map(static function ($upd) {
                    return [
                        'alarmLevel' => (int) $upd['alarm_level'],
                        'incidentStatus' => $upd['incident_status'],
                        'recordedAt' => $upd['recorded_at']
                    ];
                }, $updateStmt->fetchAll(PDO::FETCH_ASSOC));

                $changeStmt = $pdo->prepare('
                    SELECT from_alarm_level, to_alarm_level, from_incident_status, to_incident_status, changed_at
                    FROM incident_report_change_logs
                    WHERE incident_report_id = ?
                    ORDER BY changed_at ASC
                ');
                $changeStmt->execute([(int) $row['incident_report_id']]);
                $report['incidentChangeLogs'] = array_map(static function ($log) {
                    return [
                        'fromAlarmLevel' => isset($log['from_alarm_level']) ? (int) $log['from_alarm_level'] : null,
                        'toAlarmLevel' => isset($log['to_alarm_level']) ? (int) $log['to_alarm_level'] : null,
                        'fromIncidentStatus' => $log['from_incident_status'] ?? '',
                        'toIncidentStatus' => $log['to_incident_status'] ?? '',
                        'changedAt' => $log['changed_at'] ?? ''
                    ];
                }, $changeStmt->fetchAll(PDO::FETCH_ASSOC));
            } elseif ($reportType === 'equipment_report') {
                $report['equipmentName'] = (string) ($row['equipment_name'] ?? '');
                $report['equipmentCategory'] = (string) ($row['equipment_category'] ?? '');
                $report['equipmentIssueType'] = (string) ($row['issue_type'] ?? '');
                $report['equipmentUrgency'] = (string) ($row['urgency'] ?? '');
                $report['equipmentLastService'] = (string) ($row['last_service_date'] ?? '');
                $report['equipmentOperationalStatus'] = (string) ($row['operational_status'] ?? '');
                $report['equipmentActionTaken'] = (string) ($row['action_taken'] ?? '');
                $report['equipmentRecommendation'] = (string) ($row['recommendation'] ?? '');
            }
            
            $reports[] = $report;
        }
        
        echo json_encode([
            'ok' => true,
            'reports' => $reports
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Database error']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

$postAction = trim((string) ($_GET['action'] ?? ''));
if ($postAction === 'backup-report') {
    try {
        $pdo = firenet_get_pdo();
        $input = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($input)) {
            $input = $_POST;
        }

        $reportId = (int) ($input['reportId'] ?? 0);
        $force = !empty($input['force']);

        if ($reportId < 1) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'Invalid report ID.']);
            exit;
        }

        if (!firenet_can_access_report_for_backup($pdo, $reportId, $sessionStationId)) {
            http_response_code(403);
            echo json_encode(['ok' => false, 'message' => 'You cannot back up this report.']);
            exit;
        }

        $result = firenet_backup_incident_report_to_r2($pdo, $reportId, $userId, $force);
        echo json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

$input = $_POST;
if (empty($input)) {
    $raw = file_get_contents('php://input');
    if (is_string($raw) && trim($raw) !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $input = $decoded;
        }
    }
}

$reportType = trim((string) ($input['reportType'] ?? ''));
$incidentStage = trim((string) ($input['incidentStage'] ?? ''));
$alarmLevel = (int) ($input['alarmLevel'] ?? 0);
$incidentStatus = trim((string) ($input['incidentStatus'] ?? ''));
$title = trim((string) ($input['title'] ?? ''));
$stationId = $sessionStationId;
$callerName = trim((string) ($input['callerName'] ?? ''));
$barangay = trim((string) ($input['barangay'] ?? ''));
$streetName = trim((string) ($input['streetName'] ?? ''));
$landmark = trim((string) ($input['landmark'] ?? ''));
$locationLatitudeRaw = trim((string) ($input['locationLatitude'] ?? ''));
$locationLongitudeRaw = trim((string) ($input['locationLongitude'] ?? ''));
$incidentStartedAt = trim((string) ($input['incidentStartedAt'] ?? ''));
$incidentFinishedAt = trim((string) ($input['incidentFinishedAt'] ?? ''));
$remarks = trim((string) ($input['remarks'] ?? ''));
$equipmentName = trim((string) ($input['equipmentName'] ?? ''));
$equipmentCategory = trim((string) ($input['equipmentCategory'] ?? ''));
$equipmentIssueType = trim((string) ($input['equipmentIssueType'] ?? ''));
$equipmentUrgency = trim((string) ($input['equipmentUrgency'] ?? ''));
$equipmentLastService = trim((string) ($input['equipmentLastService'] ?? ''));
$equipmentOperationalStatus = trim((string) ($input['equipmentOperationalStatus'] ?? ''));
$equipmentActionTaken = trim((string) ($input['equipmentActionTaken'] ?? ''));
$equipmentRecommendation = trim((string) ($input['equipmentRecommendation'] ?? ''));
$action = trim((string) ($input['action'] ?? 'create'));
$updateMode = trim((string) ($input['updateMode'] ?? 'correction'));
$reportId = !empty($input['id']) ? (int) $input['id'] : 0;

if ($reportType === 'equipment_report' && strpos($remarks, '[EQUIPMENT_REPORT_V1]') === 0) {
    $legacyDetails = firenet_extract_equipment_payload_from_remarks($remarks);

    if ($equipmentName === '' && isset($legacyDetails['equipmentName'])) {
        $equipmentName = (string) $legacyDetails['equipmentName'];
    }
    if ($equipmentLastService === '' && isset($legacyDetails['equipmentLastService'])) {
        $equipmentLastService = (string) $legacyDetails['equipmentLastService'];
    }
    if ($equipmentActionTaken === '' && isset($legacyDetails['equipmentActionTaken'])) {
        $equipmentActionTaken = (string) $legacyDetails['equipmentActionTaken'];
    }
    if ($equipmentRecommendation === '' && isset($legacyDetails['equipmentRecommendation'])) {
        $equipmentRecommendation = (string) $legacyDetails['equipmentRecommendation'];
    }
    if (isset($legacyDetails['remarks']) && trim((string) $legacyDetails['remarks']) !== '') {
        $remarks = trim((string) $legacyDetails['remarks']);
    }

    $categoryMap = [
        'vehicle' => 'vehicle',
        'pump' => 'pump',
        'hose' => 'hose',
        'communication device' => 'communication',
        'ppe' => 'ppe',
        'other' => 'other'
    ];
    $issueTypeMap = [
        'mechanical' => 'mechanical',
        'electrical' => 'electrical',
        'damage' => 'damage',
        'maintenance due' => 'maintenance',
        'missing part' => 'missing',
        'other' => 'other'
    ];
    $urgencyMap = [
        'low' => 'low',
        'medium' => 'medium',
        'high' => 'high',
        'critical' => 'critical'
    ];
    $operationalMap = [
        'operational' => 'operational',
        'limited use' => 'limited',
        'limited' => 'limited',
        'out of service' => 'out_of_service',
        'out_of_service' => 'out_of_service'
    ];

    if ($equipmentCategory === '' && isset($legacyDetails['equipmentCategoryLabel'])) {
        $equipmentCategory = $categoryMap[strtolower((string) $legacyDetails['equipmentCategoryLabel'])] ?? '';
    }
    if ($equipmentIssueType === '' && isset($legacyDetails['equipmentIssueTypeLabel'])) {
        $equipmentIssueType = $issueTypeMap[strtolower((string) $legacyDetails['equipmentIssueTypeLabel'])] ?? '';
    }
    if ($equipmentUrgency === '' && isset($legacyDetails['equipmentUrgencyLabel'])) {
        $equipmentUrgency = $urgencyMap[strtolower((string) $legacyDetails['equipmentUrgencyLabel'])] ?? '';
    }
    if ($equipmentOperationalStatus === '' && isset($legacyDetails['equipmentOperationalStatusLabel'])) {
        $equipmentOperationalStatus = $operationalMap[strtolower((string) $legacyDetails['equipmentOperationalStatusLabel'])] ?? '';
    }
}

$isIncidentReport = $reportType === 'incident_report';
$isCallIntake = $isIncidentReport && $incidentStage === 'call_intake';
$isProgressionUpdate = $action === 'update' && $updateMode === 'progression';

$locationLatitude = null;
$locationLongitude = null;
if ($locationLatitudeRaw !== '' || $locationLongitudeRaw !== '') {
    if ($locationLatitudeRaw === '' || $locationLongitudeRaw === '') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Both latitude and longitude are required when setting map coordinates']);
        exit;
    }

    $locationLatitude = (float) $locationLatitudeRaw;
    $locationLongitude = (float) $locationLongitudeRaw;
    if ($locationLatitude < -90 || $locationLatitude > 90 || $locationLongitude < -180 || $locationLongitude > 180) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Invalid location coordinates']);
        exit;
    }
}

try {
    $pdo = firenet_get_pdo();
    firenet_ensure_equipment_reports_table($pdo);
    firenet_ensure_incident_report_columns($pdo);
    
    if ($action === 'delete') {
        http_response_code(403);
        echo json_encode(['ok' => false, 'message' => 'Report removal is disabled.']);
        exit;
    }
    
    $allowedTypes = ['incident_report', 'equipment_report'];
    $allowedStages = ['call_intake', 'during_incident', 'after_incident'];
    $allowedIncidentStatuses = ['under_control', 'fire_out'];
    $allowedEquipmentUrgencies = ['low', 'medium', 'high', 'critical'];
    $allowedEquipmentOperationalStatuses = ['operational', 'limited', 'out_of_service'];
    
    if (!in_array($reportType, $allowedTypes, true)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Invalid report type']);
        exit;
    }

    if ($action === 'create') {
        if ($reportType === 'incident_report' && !$canCreateIncidentReports) {
            http_response_code(403);
            echo json_encode(['ok' => false, 'message' => 'Your position can only submit equipment reports.']);
            exit;
        }

        if ($reportType === 'equipment_report' && !$canCreateEquipmentReports) {
            http_response_code(403);
            echo json_encode(['ok' => false, 'message' => 'Your position can only submit incident reports.']);
            exit;
        }
    }
    
    if ($reportType === 'incident_report' && !in_array($incidentStage, $allowedStages, true)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Invalid incident stage']);
        exit;
    }

    if ($action === 'create' && $reportType === 'incident_report' && $incidentStage !== 'call_intake') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'New incident reports must start at Call Intake stage']);
        exit;
    }
    
    if ($reportType === 'incident_report' && ($alarmLevel < 1 || $alarmLevel > 5)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Alarm level must be between 1 and 5']);
        exit;
    }
    
    if ($reportType === 'incident_report' && $incidentStage !== 'call_intake' && !in_array($incidentStatus, $allowedIncidentStatuses, true)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Invalid incident status']);
        exit;
    }
    
    if ($reportType === 'incident_report' && $barangay === '') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Please select a barangay']);
        exit;
    }
    
    if ($reportType === 'incident_report' && !$isCallIntake && !$isProgressionUpdate && $streetName === '') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Please provide the street']);
        exit;
    }
    
    if ($reportType === 'incident_report' && $incidentStage === 'call_intake') {
        $incidentFinishedAt = '';
        $incidentStatus = '';
    }

    if ($reportType === 'incident_report' && $incidentStatus === 'fire_out') {
        $incidentFinishedAt = date('Y-m-d H:i:s');
    }

    if ($isProgressionUpdate && $reportType === 'incident_report' && $incidentStage === 'call_intake') {
        $incidentStage = 'during_incident';
        $isCallIntake = false;
    }
    
    if ($reportType !== 'incident_report') {
        $alarmLevel = 0;
        $incidentStatus = '';
        $callerName = '';
        $barangay = '';
        $landmark = '';
        $streetName = '';
        if (!in_array($equipmentUrgency, $allowedEquipmentUrgencies, true)) {
            $equipmentUrgency = 'medium';
        }
        if (!in_array($equipmentOperationalStatus, $allowedEquipmentOperationalStatuses, true)) {
            $equipmentOperationalStatus = 'limited';
        }

        if ($equipmentName === '' || $equipmentCategory === '' || $equipmentIssueType === '' || $remarks === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'Please complete all required equipment report fields']);
            exit;
        }
    }
    
    $locationParts = [];
    if ($streetName !== '') {
        $locationParts[] = $streetName;
    }
    if ($landmark !== '') {
        $locationParts[] = $landmark;
    }
    if ($barangay !== '') {
        $locationParts[] = firenet_normalize_barangay_label($barangay);
    }
    $location = trim(implode(', ', $locationParts));

    if ($isCallIntake) {
        if ($title === '') {
            $title = 'Call Intake ' . date('Y-m-d H:i');
        }
        if ($location === '') {
            $location = 'Unspecified location';
        }
        if ($remarks === '') {
            $remarks = 'No remarks provided during call intake.';
        }
    }
    
    if ($reportType === 'incident_report' && !$isProgressionUpdate && !$isCallIntake && ($title === '' || $location === '' || $remarks === '')) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Please complete required report fields']);
        exit;
    }

    $geoContext = [
        'latitude' => null,
        'longitude' => null,
        'geocodeStatus' => 'skipped',
        'assignmentMethod' => null,
        'assignmentDistanceKm' => null,
        'assignedStationId' => null,
        'assignedStationName' => '',
        'assignedStations' => []
    ];

    if ($reportType === 'incident_report' && !$isProgressionUpdate) {
        $resolvedLat = $locationLatitude;
        $resolvedLng = $locationLongitude;

        if ($resolvedLat !== null && $resolvedLng !== null) {
            $geoContext['geocodeStatus'] = 'resolved';
        } else {
            $queryParts = [];
            if ($streetName !== '') {
                $queryParts[] = $streetName;
            }
            if ($landmark !== '') {
                $queryParts[] = $landmark;
            }
            if ($barangay !== '') {
                $queryParts[] = firenet_normalize_barangay_label($barangay);
            }
            $queryParts[] = 'Makati City';
            $queryParts[] = 'Metro Manila';
            $queryParts[] = 'Philippines';

            $geocodeQuery = implode(', ', array_filter($queryParts, static fn ($value) => trim((string) $value) !== ''));
            if (trim($geocodeQuery) !== '') {
                $geocodeResult = firenet_geocode_address($pdo, $geocodeQuery);
                if ($geocodeResult) {
                    $resolvedLat = (float) $geocodeResult['latitude'];
                    $resolvedLng = (float) $geocodeResult['longitude'];
                    $geoContext['geocodeStatus'] = 'resolved';
                } else {
                    $geoContext['geocodeStatus'] = 'failed';
                }
            }
        }

        if ($resolvedLat !== null && $resolvedLng !== null) {
            $geoContext['latitude'] = $resolvedLat;
            $geoContext['longitude'] = $resolvedLng;
            $assignments = firenet_find_station_assignments($pdo, $resolvedLat, $resolvedLng, $alarmLevel);
            $assignment = $assignments[0] ?? null;
            $geoContext['assignedStations'] = $assignments;
            if ($assignment) {
                $geoContext['assignedStationId'] = (int) $assignment['stationId'];
                $geoContext['assignedStationName'] = (string) $assignment['stationName'];
                $geoContext['assignmentMethod'] = (string) $assignment['method'];
                $geoContext['assignmentDistanceKm'] = $assignment['distanceKm'] !== null ? (float) $assignment['distanceKm'] : null;
            } else {
                $geoContext['assignmentMethod'] = 'pending';
            }
        } elseif ($geoContext['geocodeStatus'] === 'resolved') {
            $geoContext['geocodeStatus'] = 'failed';
            $geoContext['assignmentMethod'] = 'pending';
        }
    }
    
    // Get report type ID
    $reportTypeStmt = $pdo->prepare('SELECT report_type_id FROM report_type WHERE type_name = ?');
    $reportTypeStmt->execute([$reportType]);
    $reportTypeRow = $reportTypeStmt->fetch(PDO::FETCH_ASSOC);
    if (!$reportTypeRow) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Invalid report type in database']);
        exit;
    }
    $reportTypeId = (int) $reportTypeRow['report_type_id'];
    
    if ($action === 'update') {
        $cloudSyncResult = null;

        if ($reportId < 1) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'Missing report ID']);
            exit;
        }

        if ($reportType === 'incident_report') {
            if ($isProgressionUpdate) {
                if (!$canUpdateIncidentReports) {
                    http_response_code(403);
                    echo json_encode(['ok' => false, 'message' => 'Only Position 1 can update incident progress.']);
                    exit;
                }
                if (!firenet_report_belongs_to_station($pdo, $reportId, $sessionStationId)) {
                    http_response_code(404);
                    echo json_encode(['ok' => false, 'message' => 'Report not found for your station']);
                    exit;
                }
            } else {
                $ownershipStmt = $pdo->prepare('SELECT report_id FROM reports WHERE report_id = ? AND created_by = ?');
                $ownershipStmt->execute([$reportId, $userId]);
                if (!$ownershipStmt->fetch()) {
                    http_response_code(404);
                    echo json_encode(['ok' => false, 'message' => 'Report not found']);
                    exit;
                }
            }
        } else {
            // Verify ownership for non-incident reports
            $stmt = $pdo->prepare('SELECT report_id FROM reports WHERE report_id = ? AND created_by = ?');
            $stmt->execute([$reportId, $userId]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['ok' => false, 'message' => 'Report not found']);
                exit;
            }
        }
        
        if ($isProgressionUpdate) {
            // Progress updates should not overwrite initial intake fields.
            $pdo->prepare('UPDATE reports SET updated_at = NOW() WHERE report_id = ?')->execute([$reportId]);
        } else {
            $pdo->prepare('UPDATE reports SET report_type_id = ?, title = ?, description = ?, status = ?, updated_at = NOW() WHERE report_id = ?')
                ->execute([$reportTypeId, $title, $remarks, 'submitted', $reportId]);

            if ($reportType === 'equipment_report') {
                $pdo->prepare('DELETE FROM incident_reports WHERE report_id = ?')->execute([$reportId]);

                $pdo->prepare('INSERT INTO equipment_reports
                    (report_id, equipment_name, equipment_category, issue_type, urgency, last_service_date, operational_status, action_taken, recommendation, issue_summary)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        equipment_name = VALUES(equipment_name),
                        equipment_category = VALUES(equipment_category),
                        issue_type = VALUES(issue_type),
                        urgency = VALUES(urgency),
                        last_service_date = VALUES(last_service_date),
                        operational_status = VALUES(operational_status),
                        action_taken = VALUES(action_taken),
                        recommendation = VALUES(recommendation),
                        issue_summary = VALUES(issue_summary),
                        updated_at = CURRENT_TIMESTAMP
                ')->execute([
                    $reportId,
                    $equipmentName,
                    $equipmentCategory,
                    $equipmentIssueType,
                    $equipmentUrgency,
                    $equipmentLastService !== '' ? $equipmentLastService : null,
                    $equipmentOperationalStatus,
                    $equipmentActionTaken !== '' ? $equipmentActionTaken : null,
                    $equipmentRecommendation !== '' ? $equipmentRecommendation : null,
                    $remarks
                ]);
            }
        }
        
        // Fetch and update incident report if exists
        if ($reportType === 'incident_report') {
            $incidentStmt = $pdo->prepare('
                SELECT i.incident_report_id, i.alarm_level, i.incident_status, i.latitude, i.longitude, s.stage_code
                FROM incident_reports i
                LEFT JOIN incident_report_stage s ON s.incident_report_stage_id = i.incident_report_stage_id
                WHERE i.report_id = ?
            ');
            $incidentStmt->execute([$reportId]);
            $incident = $incidentStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($incident) {
                $incidentId = (int) $incident['incident_report_id'];
                $currentStage = strtolower((string) ($incident['stage_code'] ?? ''));
                $currentStatus = strtolower((string) ($incident['incident_status'] ?? ''));

                $updatesCountStmt = $pdo->prepare('SELECT COUNT(*) FROM incident_report_updates WHERE incident_report_id = ?');
                $updatesCountStmt->execute([$incidentId]);
                $updatesCount = (int) $updatesCountStmt->fetchColumn();

                $changeCountStmt = $pdo->prepare('SELECT COUNT(*) FROM incident_report_change_logs WHERE incident_report_id = ?');
                $changeCountStmt->execute([$incidentId]);
                $changeCount = (int) $changeCountStmt->fetchColumn();

                $hasFirstProgressUpdate = $updatesCount > 1 || $changeCount > 0;
                $isCompletedIncident = $currentStage === 'after_incident' || $currentStatus === 'fire_out';

                if ($isProgressionUpdate) {
                    if ($isCompletedIncident) {
                        http_response_code(422);
                        echo json_encode(['ok' => false, 'message' => 'Incident is already completed and cannot be updated.']);
                        exit;
                    }
                } else {
                    if ($isCompletedIncident) {
                        http_response_code(422);
                        echo json_encode(['ok' => false, 'message' => 'Incident is already completed and can no longer be edited.']);
                        exit;
                    }

                    if ($hasFirstProgressUpdate) {
                        http_response_code(422);
                        echo json_encode(['ok' => false, 'message' => 'Incident can only be edited before the first progress update.']);
                        exit;
                    }
                }

                $stageStmt = $pdo->prepare('SELECT incident_report_stage_id FROM incident_report_stage WHERE stage_code = ?');
                $stageStmt->execute([$incidentStage]);
                $stageRow = $stageStmt->fetch(PDO::FETCH_ASSOC);
                $stageId = $stageRow ? (int) $stageRow['incident_report_stage_id'] : 1;
                
                if ($isProgressionUpdate) {
                    $progressAssignments = [];
                    $incidentLat = isset($incident['latitude']) ? (float) $incident['latitude'] : 0.0;
                    $incidentLng = isset($incident['longitude']) ? (float) $incident['longitude'] : 0.0;
                    $shouldRefreshProgressAssignments = ($incidentLat !== 0.0 || $incidentLng !== 0.0);
                    if ($shouldRefreshProgressAssignments) {
                        $progressAssignments = firenet_find_station_assignments($pdo, $incidentLat, $incidentLng, $alarmLevel);
                    }
                    $primaryProgressAssignment = $progressAssignments[0] ?? null;

                    if ($shouldRefreshProgressAssignments) {
                        $pdo->prepare('
                            UPDATE incident_reports SET
                                incident_report_stage_id = ?,
                                alarm_level = ?,
                                incident_status = ?,
                                incident_finished_at = ?,
                                assignment_method = ?,
                                assignment_distance_km = ?,
                                dispatched_station_id = ?,
                                updated_by_user_id = ?
                            WHERE report_id = ?
                        ')->execute([
                            $stageId,
                            $alarmLevel,
                            $incidentStatus,
                            $incidentFinishedAt ?: null,
                            $primaryProgressAssignment['method'] ?? null,
                            isset($primaryProgressAssignment['distanceKm']) ? (float) $primaryProgressAssignment['distanceKm'] : null,
                            isset($primaryProgressAssignment['stationId']) ? (int) $primaryProgressAssignment['stationId'] : null,
                            $userId,
                            $reportId
                        ]);

                        firenet_sync_incident_dispatch_stations($pdo, $incidentId, $progressAssignments);

                        $caseStmt = $pdo->prepare('SELECT COALESCE(NULLIF(incident_case_id, 0), report_id) FROM incident_reports WHERE incident_report_id = ? LIMIT 1');
                        $caseStmt->execute([$incidentId]);
                        $caseReportId = (int) ($caseStmt->fetchColumn() ?: $reportId);
                        firenet_sync_responder_station_reports($pdo, $caseReportId, $incidentId, $reportTypeId, $userId, $progressAssignments, [
                            'stageId' => $stageId,
                            'title' => $title !== '' ? $title : ('Incident ' . $caseReportId),
                            'remarks' => $remarks,
                            'callerName' => $callerName,
                            'location' => $location,
                            'latitude' => isset($incident['latitude']) ? (float) $incident['latitude'] : null,
                            'longitude' => isset($incident['longitude']) ? (float) $incident['longitude'] : null,
                            'geocodeStatus' => $geoContext['geocodeStatus'] ?? 'skipped',
                            'assignmentMethod' => $primaryProgressAssignment['method'] ?? null,
                            'assignmentDistanceKm' => isset($primaryProgressAssignment['distanceKm']) ? (float) $primaryProgressAssignment['distanceKm'] : null,
                            'alarmLevel' => $alarmLevel,
                            'incidentStatus' => $incidentStatus ?: null,
                            'incidentStartedAt' => $incidentStartedAt ?: null,
                            'incidentFinishedAt' => $incidentFinishedAt ?: null
                        ]);
                    } else {
                        $pdo->prepare('
                            UPDATE incident_reports SET
                                incident_report_stage_id = ?,
                                alarm_level = ?,
                                incident_status = ?,
                                incident_finished_at = ?,
                                updated_by_user_id = ?
                            WHERE report_id = ?
                        ')->execute([
                            $stageId,
                            $alarmLevel,
                            $incidentStatus,
                            $incidentFinishedAt ?: null,
                            $userId,
                            $reportId
                        ]);
                    }
                } else {
                    $pdo->prepare('
                        UPDATE incident_reports SET
                            incident_report_stage_id = ?,
                            incident_location = ?,
                            alarm_level = ?,
                            incident_status = ?,
                            incident_started_at = ?,
                            incident_finished_at = ?,
                            latitude = ?,
                            longitude = ?,
                            geocode_status = ?,
                            assignment_method = ?,
                            assignment_distance_km = ?,
                            dispatched_station_id = ?,
                            caller_name = ?,
                            remarks = ?,
                            updated_by_user_id = ?
                        WHERE report_id = ?
                    ')->execute([
                        $stageId,
                        $location,
                        $alarmLevel,
                        $incidentStatus,
                        $incidentStartedAt ?: null,
                        $incidentFinishedAt ?: null,
                        $geoContext['latitude'],
                        $geoContext['longitude'],
                        $geoContext['geocodeStatus'],
                        $geoContext['assignmentMethod'],
                        $geoContext['assignmentDistanceKm'],
                        $geoContext['assignedStationId'],
                        $callerName,
                        $remarks,
                        $userId,
                        $reportId
                    ]);

                        firenet_sync_incident_dispatch_stations($pdo, $incidentId, $geoContext['assignedStations']);

                        firenet_sync_responder_station_reports($pdo, $reportId, $incidentId, $reportTypeId, $userId, $geoContext['assignedStations'], [
                            'stageId' => $stageId,
                            'title' => $title,
                            'remarks' => $remarks,
                            'callerName' => $callerName,
                            'location' => $location,
                            'latitude' => $geoContext['latitude'],
                            'longitude' => $geoContext['longitude'],
                            'geocodeStatus' => $geoContext['geocodeStatus'],
                            'assignmentMethod' => $geoContext['assignmentMethod'],
                            'assignmentDistanceKm' => $geoContext['assignmentDistanceKm'],
                            'alarmLevel' => $alarmLevel,
                            'incidentStatus' => $incidentStatus ?: null,
                            'incidentStartedAt' => $incidentStartedAt ?: null,
                            'incidentFinishedAt' => $incidentFinishedAt ?: null
                        ]);
                }
                
                $oldAlarm = (int) $incident['alarm_level'];
                $oldStatus = $incident['incident_status'];

                if ($updateMode === 'progression') {
                    // Record change log if alarm or status changed during incident progression.
                    if ($oldAlarm !== $alarmLevel || $oldStatus !== $incidentStatus) {
                        $pdo->prepare('
                            INSERT INTO incident_report_change_logs (incident_report_id, from_alarm_level, to_alarm_level, from_incident_status, to_incident_status, changed_by_user_id, notes)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ')->execute([
                            $incidentId,
                            $oldAlarm ?: null,
                            $alarmLevel,
                            $oldStatus ?: null,
                            $incidentStatus ?: null,
                            $userId,
                            'Incident progression update from Reports UI'
                        ]);
                    }

                    // Record timeline snapshot for progression updates only.
                    $pdo->prepare('
                        INSERT INTO incident_report_updates (incident_report_id, alarm_level, incident_status, recorded_by_user_id)
                        VALUES (?, ?, ?, ?)
                    ')->execute([
                        $incidentId,
                        $alarmLevel,
                        $incidentStatus ?: null,
                        $userId
                    ]);

                    if (strtolower((string) $incidentStatus) === 'fire_out' && strtolower((string) ($oldStatus ?? '')) !== 'fire_out') {
                        $cloudSyncResult = firenet_sync_incident_case_to_r2($pdo, $reportId, $userId);
                    }
                }
            }
        }
        
        echo json_encode([
            'ok' => true,
            'cloudSync' => $cloudSyncResult,
        ]);
        exit;
    }
    
    // CREATE
    $pdo->prepare('
        INSERT INTO reports (report_type_id, station_id, title, description, created_by, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ')->execute([$reportTypeId, $stationId, $title, $remarks, $userId, 'submitted']);
    
    $newReportId = (int) $pdo->lastInsertId();
    
    if ($reportType === 'incident_report') {
        $stageStmt = $pdo->prepare('SELECT incident_report_stage_id FROM incident_report_stage WHERE stage_code = ?');
        $stageStmt->execute([$incidentStage]);
        $stageRow = $stageStmt->fetch(PDO::FETCH_ASSOC);
        $stageId = $stageRow ? (int) $stageRow['incident_report_stage_id'] : 1;
        
        $pdo->prepare('
            INSERT INTO incident_reports (report_id, incident_case_id, station_id, incident_report_stage_id, received_by_user_id, updated_by_user_id, caller_name, incident_location, latitude, longitude, geocode_status, assignment_method, assignment_distance_km, dispatched_station_id, alarm_level, incident_status, incident_started_at, incident_finished_at, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ')->execute([
            $newReportId,
            $newReportId,
            $stationId,
            $stageId,
            $userId,
            $userId,
            $callerName,
            $location,
            $geoContext['latitude'],
            $geoContext['longitude'],
            $geoContext['geocodeStatus'],
            $geoContext['assignmentMethod'],
            $geoContext['assignmentDistanceKm'],
            $geoContext['assignedStationId'],
            $alarmLevel,
            $incidentStatus ?: null,
            $incidentStartedAt ?: null,
            $incidentFinishedAt ?: null,
            $remarks
        ]);
        
        $newIncidentId = (int) $pdo->lastInsertId();

        firenet_sync_incident_dispatch_stations($pdo, $newIncidentId, $geoContext['assignedStations']);

        firenet_sync_responder_station_reports($pdo, $newReportId, $newIncidentId, $reportTypeId, $userId, $geoContext['assignedStations'], [
            'stageId' => $stageId,
            'title' => $title,
            'remarks' => $remarks,
            'callerName' => $callerName,
            'location' => $location,
            'latitude' => $geoContext['latitude'],
            'longitude' => $geoContext['longitude'],
            'geocodeStatus' => $geoContext['geocodeStatus'],
            'assignmentMethod' => $geoContext['assignmentMethod'],
            'assignmentDistanceKm' => $geoContext['assignmentDistanceKm'],
            'alarmLevel' => $alarmLevel,
            'incidentStatus' => $incidentStatus ?: null,
            'incidentStartedAt' => $incidentStartedAt ?: null,
            'incidentFinishedAt' => $incidentFinishedAt ?: null
        ]);
        
        // Record initial incident update snapshot
        $pdo->prepare('
            INSERT INTO incident_report_updates (incident_report_id, alarm_level, incident_status, recorded_by_user_id)
            VALUES (?, ?, ?, ?)
        ')->execute([
            $newIncidentId,
            $alarmLevel,
            $incidentStatus ?: null,
            $userId
        ]);
    } else {
        $pdo->prepare('DELETE FROM incident_reports WHERE report_id = ?')->execute([$newReportId]);

        $pdo->prepare('INSERT INTO equipment_reports
            (report_id, equipment_name, equipment_category, issue_type, urgency, last_service_date, operational_status, action_taken, recommendation, issue_summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ')->execute([
            $newReportId,
            $equipmentName,
            $equipmentCategory,
            $equipmentIssueType,
            $equipmentUrgency,
            $equipmentLastService !== '' ? $equipmentLastService : null,
            $equipmentOperationalStatus,
            $equipmentActionTaken !== '' ? $equipmentActionTaken : null,
            $equipmentRecommendation !== '' ? $equipmentRecommendation : null,
            $remarks
        ]);
    }
    
    echo json_encode([
        'ok' => true,
        'report' => [
            'id' => $newReportId,
            'type' => $reportType,
            'title' => $title,
            'location' => $location
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
