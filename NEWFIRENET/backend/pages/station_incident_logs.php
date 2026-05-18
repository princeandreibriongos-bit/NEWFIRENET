<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();

$stationId = (int) ($_SESSION['user']['station_id'] ?? 1);
$stationName = 'Station ' . $stationId;
$user = (string) ($_SESSION['user']['username'] ?? 'Unknown User');

try {
    $pdo = firenet_get_pdo();
    $stmt = $pdo->prepare('SELECT station_name FROM stations WHERE station_id = ? LIMIT 1');
    $stmt->execute([$stationId]);
    $stationName = (string) ($stmt->fetchColumn() ?: $stationName);
} catch (Throwable $ignored) {
    // Keep default station label.
}

$context = [
    'stationId' => $stationId,
    'stationName' => $stationName,
    'user' => $user,
    'apiUrl' => '/firenet/NEWFIRENET/backend/controllers/station_incident_logs.php'
];

$cssPath = __DIR__ . '/../../assets/css/station-incident-logs.css';
$jsPath = __DIR__ . '/../../assets/js/station-incident-logs.js';
$cssVersion = is_file($cssPath) ? (string) filemtime($cssPath) : (string) time();
$jsVersion = is_file($jsPath) ? (string) filemtime($jsPath) : (string) time();

$pageStyles = [
    '/firenet/NEWFIRENET/assets/css/station-incident-logs.css?v=' . $cssVersion
];
$pageScripts = [
    '/firenet/NEWFIRENET/assets/js/station-incident-logs.js?v=' . $jsVersion
];

require_once __DIR__ . '/../../includes/header.php';
?>
<script id="stationIncidentLogsContext" type="application/json"><?php echo json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php
readfile(__DIR__ . '/../../pages/station_incident_logs.html');
require_once __DIR__ . '/../../includes/footer.php';
