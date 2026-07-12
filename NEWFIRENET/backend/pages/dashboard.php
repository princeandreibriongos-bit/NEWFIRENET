<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';
firenet_require_login();
$user = (string) ($_SESSION['user']['username'] ?? 'Unknown User');
$role = strtolower((string) ($_SESSION['user']['role'] ?? 'user'));
$positionCode = strtolower((string) ($_SESSION['user']['position_code'] ?? ''));
$stationId = (int) ($_SESSION['user']['station_id'] ?? 1);
$canCreateIncidentReports = $positionCode !== 'position2';
$reportIncidentUrl = '/firenet/NEWFIRENET/backend/pages/reports.php?quick=intake';

$roleTitle = 'User';
$roleSummary = 'You can view dashboard updates and station information.';
$stationName = 'Unknown Station';

if ($role === 'admin') {
    $roleTitle = 'Admin';
    $roleSummary = 'You can manage station users, operations settings, and daily dispatch records.';
} elseif ($role === 'superadmin') {
    $roleTitle = 'Superadmin';
    $roleSummary = 'You can oversee all system-level controls and branch-wide configuration.';
}

$openIncidentCount = 0;
$openIncidentSummary = 'No active incidents right now.';
$ongoingIncidentTitle = 'No active incidents.';
$ongoingIncidentMeta = 'Updates will appear here when incidents are active.';
$completedIncidentCount = 0;
$totalIncidentCount = 0;
$isCentralStation = false;
$pendingAlarmRaiseCount = 0;
$stationStatuses = [];
$dispatchLoadSummary = [
    'busiestStationName' => 'No active dispatch load',
    'busiestStationActiveAssignments' => 0,
    'stationsHandlingCount' => 0,
    'zeroAvailabilityCount' => 0,
    'fallbackDispatchCountToday' => 0,
    'topStations' => []
];

try {
    $pdo = firenet_get_pdo();

    $stationStmt = $pdo->prepare('SELECT station_name, station_code FROM stations WHERE station_id = ? LIMIT 1');
    $stationStmt->execute([$stationId]);
    $stationRow = $stationStmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $stationName = (string) ($stationRow['station_name'] ?? ('Station ' . $stationId));
    $isCentralStation = strtolower(trim((string) ($stationRow['station_code'] ?? ''))) === 'mcfs';

    if ($isCentralStation) {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS incident_alarm_raise_requests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                incident_case_id INT NOT NULL,
                from_incident_report_id INT NOT NULL,
                from_report_id INT NOT NULL,
                from_station_id INT NOT NULL,
                requested_by_user_id INT NOT NULL,
                from_alarm_level TINYINT NOT NULL,
                requested_alarm_level TINYINT NOT NULL,
                status ENUM('pending','approved','denied','cancelled') NOT NULL DEFAULT 'pending',
                notes VARCHAR(500) NULL,
                reviewed_by_user_id INT NULL,
                reviewed_at DATETIME NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_alarm_raise_status_created (status, created_at),
                INDEX idx_alarm_raise_case_status (incident_case_id, status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        $pendingAlarmRaiseCount = (int) ($pdo->query("SELECT COUNT(*) FROM incident_alarm_raise_requests WHERE status = 'pending'")->fetchColumn() ?: 0);
    }

    $countStmt = $pdo->prepare("
        SELECT COUNT(DISTINCT i.incident_report_id) AS open_count
        FROM incident_reports i
        JOIN reports r ON r.report_id = i.report_id
        LEFT JOIN incident_report_stage s ON s.incident_report_stage_id = i.incident_report_stage_id
        LEFT JOIN incident_report_dispatch_stations d ON d.incident_report_id = i.incident_report_id
        WHERE (
            r.station_id = ?
            OR i.dispatched_station_id = ?
            OR d.station_id = ?
        )
          AND (s.stage_code IS NULL OR s.stage_code <> 'after_incident')
          AND (i.incident_status IS NULL OR i.incident_status <> 'fire_out')
    ");
    $countStmt->execute([$stationId, $stationId, $stationId]);
    $openIncidentCount = (int) ($countStmt->fetchColumn() ?: 0);

    $analyticsStmt = $pdo->prepare("\n        SELECT\n            SUM(CASE WHEN (s.stage_code = 'after_incident' OR i.incident_status = 'fire_out' OR i.incident_finished_at IS NOT NULL) THEN 1 ELSE 0 END) AS completed_count,\n            COUNT(*) AS total_count\n        FROM incident_reports i\n        JOIN reports r ON r.report_id = i.report_id\n        LEFT JOIN incident_report_stage s ON s.incident_report_stage_id = i.incident_report_stage_id\n        WHERE r.station_id = ?\n    ");
    $analyticsStmt->execute([$stationId]);
    $analyticsRow = $analyticsStmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $completedIncidentCount = (int) ($analyticsRow['completed_count'] ?? 0);
    $totalIncidentCount = (int) ($analyticsRow['total_count'] ?? 0);

    if ($openIncidentCount > 0) {
        $openIncidentSummary = $openIncidentCount . ' active incident(s) requiring attention.';
    }

    $latestStmt = $pdo->prepare("
        SELECT
            COALESCE(NULLIF(r.title, ''), NULLIF(i.incident_location, ''), 'Unspecified location') AS incident_title,
            COALESCE(i.incident_status, 'newly_reported') AS incident_status,
            COALESCE(i.alarm_level, 1) AS alarm_level,
            COALESCE(i.updated_at, i.created_at, r.updated_at, r.created_at) AS incident_time
        FROM incident_reports i
        JOIN reports r ON r.report_id = i.report_id
        LEFT JOIN incident_report_stage s ON s.incident_report_stage_id = i.incident_report_stage_id
        LEFT JOIN incident_report_dispatch_stations d ON d.incident_report_id = i.incident_report_id
        WHERE (
            r.station_id = ?
            OR i.dispatched_station_id = ?
            OR d.station_id = ?
        )
          AND (s.stage_code IS NULL OR s.stage_code <> 'after_incident')
          AND (i.incident_status IS NULL OR i.incident_status <> 'fire_out')
        ORDER BY COALESCE(i.updated_at, i.created_at, r.updated_at, r.created_at) DESC
        LIMIT 1
    ");
    $latestStmt->execute([$stationId, $stationId, $stationId]);
    $latest = $latestStmt->fetch(PDO::FETCH_ASSOC);

    if ($latest) {
        $ongoingIncidentTitle = 'Alarm ' . (int) ($latest['alarm_level'] ?? 1) . ' - ' . (string) ($latest['incident_title'] ?? 'Unspecified location');
        $status = (string) ($latest['incident_status'] ?? 'newly_reported');
        $statusLabel = $status === 'ongoing'
            ? 'Ongoing'
            : ($status === 'under_control'
                ? 'Under Control'
                : ($status === 'fire_out' ? 'Fire Out' : 'Newly Reported'));
        $ongoingIncidentMeta = 'Status: ' . $statusLabel . ' | Last update: ' . (string) ($latest['incident_time'] ?? '-');
    }

    $dispatchTableExistsStmt = $pdo->query("\n        SELECT COUNT(*)\n        FROM information_schema.TABLES\n        WHERE TABLE_SCHEMA = DATABASE()\n          AND TABLE_NAME = 'incident_report_dispatch_stations'\n    ");
    $dispatchTableExists = (int) ($dispatchTableExistsStmt->fetchColumn() ?: 0) > 0;

    if ($dispatchTableExists) {
        $stationStatusStmt = $pdo->query("\n            SELECT\n                s.station_id,\n                s.station_name,\n                s.status AS station_record_status,\n                COALESCE(active_assignments.active_count, 0) AS active_assignment_count\n            FROM stations s\n            LEFT JOIN (\n                SELECT d.station_id, COUNT(*) AS active_count\n                FROM incident_report_dispatch_stations d\n                JOIN incident_reports i ON i.incident_report_id = d.incident_report_id\n                LEFT JOIN incident_report_stage st ON st.incident_report_stage_id = i.incident_report_stage_id\n                WHERE (st.stage_code IS NULL OR st.stage_code <> 'after_incident')\n                  AND (i.incident_status IS NULL OR i.incident_status <> 'fire_out')\n                  AND i.incident_finished_at IS NULL\n                GROUP BY d.station_id\n            ) active_assignments ON active_assignments.station_id = s.station_id\n            ORDER BY s.station_id ASC\n        ");
    } else {
        $stationStatusStmt = $pdo->query("\n            SELECT\n                s.station_id,\n                s.station_name,\n                s.status AS station_record_status,\n                0 AS active_assignment_count\n            FROM stations s\n            ORDER BY s.station_id ASC\n        ");
    }

    $stationStatusRows = $stationStatusStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($stationStatusRows as $statusRow) {
        $recordStatus = strtolower((string) ($statusRow['station_record_status'] ?? 'active'));
        $activeAssignmentCount = (int) ($statusRow['active_assignment_count'] ?? 0);

        $statusCode = 'standby';
        $statusLabel = 'Standby';
        if ($recordStatus !== 'active') {
            $statusCode = 'offline';
            $statusLabel = 'Offline';
        } elseif ($activeAssignmentCount > 0) {
            $statusCode = 'responding';
            $statusLabel = 'Responding';
        }

        $stationStatuses[] = [
            'stationId' => (int) ($statusRow['station_id'] ?? 0),
            'stationName' => (string) ($statusRow['station_name'] ?? ''),
            'statusCode' => $statusCode,
            'statusLabel' => $statusLabel,
            'activeAssignmentCount' => $activeAssignmentCount,
            'incidentsHandledToday' => 0,
            'fallbackDispatchCountToday' => 0,
            'isCurrentStation' => ((int) ($statusRow['station_id'] ?? 0) === $stationId)
        ];
    }

    if ($dispatchTableExists) {
        $workloadStmt = $pdo->query("
            SELECT
                s.station_id,
                s.station_name,
                s.status AS station_record_status,
                COALESCE(active_assignments.active_count, 0) AS active_assignment_count,
                COALESCE(today_assignments.handled_today_count, 0) AS incidents_handled_today,
                COALESCE(today_assignments.fallback_count, 0) AS fallback_dispatch_count_today
            FROM stations s
            LEFT JOIN (
                SELECT d.station_id, COUNT(*) AS active_count
                FROM incident_report_dispatch_stations d
                JOIN incident_reports i ON i.incident_report_id = d.incident_report_id
                LEFT JOIN incident_report_stage st ON st.incident_report_stage_id = i.incident_report_stage_id
                WHERE (st.stage_code IS NULL OR st.stage_code <> 'after_incident')
                  AND (i.incident_status IS NULL OR i.incident_status <> 'fire_out')
                  AND i.incident_finished_at IS NULL
                GROUP BY d.station_id
            ) active_assignments ON active_assignments.station_id = s.station_id
            LEFT JOIN (
                SELECT
                    d.station_id,
                    COUNT(DISTINCT d.incident_report_id) AS handled_today_count,
                    SUM(CASE WHEN d.assignment_method <> 'aor' THEN 1 ELSE 0 END) AS fallback_count
                FROM incident_report_dispatch_stations d
                WHERE DATE(d.created_at) = CURDATE()
                GROUP BY d.station_id
            ) today_assignments ON today_assignments.station_id = s.station_id
            ORDER BY active_assignment_count DESC, incidents_handled_today DESC, s.station_name ASC
        ");
        $workloadRows = $workloadStmt ? $workloadStmt->fetchAll(PDO::FETCH_ASSOC) : [];
        $topStations = [];

        foreach ($workloadRows as $index => $workloadRow) {
            $currentStationId = (int) ($workloadRow['station_id'] ?? 0);
            $activeAssignmentCount = (int) ($workloadRow['active_assignment_count'] ?? 0);
            $incidentsHandledToday = (int) ($workloadRow['incidents_handled_today'] ?? 0);
            $fallbackDispatchCountToday = (int) ($workloadRow['fallback_dispatch_count_today'] ?? 0);

            foreach ($stationStatuses as &$stationStatus) {
                if ((int) ($stationStatus['stationId'] ?? 0) !== $currentStationId) {
                    continue;
                }

                $stationStatus['incidentsHandledToday'] = $incidentsHandledToday;
                $stationStatus['fallbackDispatchCountToday'] = $fallbackDispatchCountToday;
                break;
            }
            unset($stationStatus);

            $recordStatus = strtolower((string) ($workloadRow['station_record_status'] ?? 'active'));
            if ($recordStatus === 'active' && $activeAssignmentCount === 0) {
                $dispatchLoadSummary['zeroAvailabilityCount']++;
            }
            if ($activeAssignmentCount > 0) {
                $dispatchLoadSummary['stationsHandlingCount']++;
            }
            $dispatchLoadSummary['fallbackDispatchCountToday'] += $fallbackDispatchCountToday;

            if ($index === 0 && $activeAssignmentCount > 0) {
                $dispatchLoadSummary['busiestStationName'] = (string) ($workloadRow['station_name'] ?? 'Station');
                $dispatchLoadSummary['busiestStationActiveAssignments'] = $activeAssignmentCount;
            }

            if (count($topStations) < 4) {
                $topStations[] = [
                    'stationId' => $currentStationId,
                    'stationName' => (string) ($workloadRow['station_name'] ?? ''),
                    'activeAssignmentCount' => $activeAssignmentCount,
                    'incidentsHandledToday' => $incidentsHandledToday,
                    'fallbackDispatchCountToday' => $fallbackDispatchCountToday,
                    'isCurrentStation' => $currentStationId === $stationId
                ];
            }
        }

        $dispatchLoadSummary['topStations'] = $topStations;
    }

    $trendStmt = $pdo->prepare("SELECT DATE(i.created_at) AS report_date, COUNT(*) AS report_count
        FROM incident_reports i
        JOIN reports r ON r.report_id = i.report_id
        WHERE r.station_id = ?
          AND i.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(i.created_at)
        ORDER BY DATE(i.created_at) ASC
    ");
    $trendStmt->execute([$stationId]);
    $trendRows = $trendStmt->fetchAll(PDO::FETCH_ASSOC);

    $dailyIncidentCounts = [];
    $today = new DateTimeImmutable('today');
    for ($offset = 6; $offset >= 0; $offset--) {
        $day = $today->sub(new DateInterval('P' . $offset . 'D'));
        $dailyIncidentCounts[$day->format('Y-m-d')] = 0;
    }
    foreach ($trendRows as $trendRow) {
        $dateKey = (string) ($trendRow['report_date'] ?? '');
        if (array_key_exists($dateKey, $dailyIncidentCounts)) {
            $dailyIncidentCounts[$dateKey] = (int) ($trendRow['report_count'] ?? 0);
        }
    }

    $offlineStationCount = 0;
    foreach ($stationStatuses as $details) {
        if (isset($details['statusCode']) && $details['statusCode'] === 'offline') {
            $offlineStationCount++;
        }
    }

    $recentNews = [];
    if ($openIncidentCount > 0) {
        $recentNews[] = 'There are ' . $openIncidentCount . ' active incident(s) pending response at your station.';
    } else {
        $recentNews[] = 'No active incidents now. Station monitoring is normal.';
    }
    if ($offlineStationCount > 0) {
        $recentNews[] = $offlineStationCount . ' station(s) are currently offline or not available for dispatch.';
    }
    if ($dispatchLoadSummary['stationsHandlingCount'] > 0) {
        $recentNews[] = $dispatchLoadSummary['busiestStationName'] . ' currently has the heaviest load with ' . $dispatchLoadSummary['busiestStationActiveAssignments'] . ' active assignment(s).';
    }
    if ($completedIncidentCount > 0 && $totalIncidentCount > 0) {
        $recentNews[] = 'Resolution progress: ' . round(($completedIncidentCount / $totalIncidentCount) * 100) . '% of reported incidents have been completed recently.';
    }
    if ($role === 'admin') {
        $recentNews[] = 'Reminder: review pending user warnings and incident assignments for your station.';
    } elseif ($role === 'superadmin') {
        $recentNews[] = 'Reminder: verify branch-wide readiness and confirm any open station alerts.';
    }
} catch (Throwable $e) {
    // Keep dashboard usable even if incident query fails.
    $dailyIncidentCounts = [];
    $recentNews = [];
}

$dashboardContext = [
    'user' => $user,
    'role' => $role,
    'roleTitle' => $roleTitle,
    'roleSummary' => $roleSummary,
    'stationId' => $stationId,
    'stationName' => $stationName,
    'isCentralStation' => $isCentralStation,
    'pendingAlarmRaiseCount' => $pendingAlarmRaiseCount,
    'alarmRaiseRequestsUrl' => '/firenet/NEWFIRENET/backend/pages/reports.php?tab=alarm_requests',
    'canCreateIncidentReports' => $canCreateIncidentReports,
    'reportIncidentUrl' => $reportIncidentUrl,
    'openIncidentCount' => $openIncidentCount,
    'openIncidentSummary' => $openIncidentSummary,
    'ongoingIncidentTitle' => $ongoingIncidentTitle,
    'ongoingIncidentMeta' => $ongoingIncidentMeta,
    'activeIncidentCount' => $openIncidentCount,
    'completedIncidentCount' => $completedIncidentCount,
    'totalIncidentCount' => $totalIncidentCount,
    'dailyIncidentCounts' => array_values($dailyIncidentCounts),
    'dailyIncidentLabels' => array_keys($dailyIncidentCounts),
    'recentNews' => $recentNews,
    'stationStatuses' => $stationStatuses,
    'dispatchLoadSummary' => $dispatchLoadSummary
];

$pageStyles = ['/firenet/NEWFIRENET/assets/css/dashboard.css?v=' . (is_file(__DIR__ . '/../../assets/css/dashboard.css') ? filemtime(__DIR__ . '/../../assets/css/dashboard.css') : time())];
$pageScripts = [
    '/firenet/NEWFIRENET/assets/vendor/chart.umd.js',
    '/firenet/NEWFIRENET/assets/js/dashboard.js',
];

$bodyClass = 'has-dashboard-bg';

require_once __DIR__ . '/../../includes/header.php';
?>
<script id="dashboardContext" type="application/json"><?php echo json_encode($dashboardContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php
readfile(__DIR__ . '/../../pages/dashboard.html');
require_once __DIR__ . '/../../includes/footer.php';
