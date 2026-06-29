<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();

$user = (string) ($_SESSION['user']['username'] ?? 'Unknown User');
$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
$role = strtolower((string) ($_SESSION['user']['role'] ?? 'user'));
$positionCode = strtolower((string) ($_SESSION['user']['position_code'] ?? ''));
$positionName = (string) ($_SESSION['user']['position_name'] ?? '');
$stationId = (int) ($_SESSION['user']['station_id'] ?? 1);
$stationName = 'Station ' . $stationId;

try {
  $pdo = firenet_get_pdo();
  $stmt = $pdo->prepare('SELECT station_name FROM stations WHERE station_id = ? LIMIT 1');
  $stmt->execute([$stationId]);
  $stationName = (string) ($stmt->fetchColumn() ?: $stationName);
} catch (Throwable $ignored) {
}

$logsContext = [
  'userId' => $userId,
  'user' => $user,
  'role' => $role,
  'positionCode' => $positionCode,
  'positionName' => $positionName,
  'stationId' => $stationId,
  'stationName' => $stationName,
  'apiUrl' => '/firenet/NEWFIRENET/backend/controllers/reports.php?action=logs'
];

$logsCssPath = __DIR__ . '/../../assets/css/station-incident-logs.css';
$logsJsPath = __DIR__ . '/../../assets/js/station-incident-logs.js';
$logsCssVersion = is_file($logsCssPath) ? (string) filemtime($logsCssPath) : (string) time();
$logsJsVersion = is_file($logsJsPath) ? (string) filemtime($logsJsPath) : (string) time();

$pageStyles = [
  '/firenet/NEWFIRENET/assets/css/station-incident-logs.css?v=' . $logsCssVersion
];
$pageScripts = [
  '/firenet/NEWFIRENET/assets/js/station-incident-logs.js?v=' . $logsJsVersion
];

require_once __DIR__ . '/../../includes/header.php';
?>
<script id="stationIncidentLogsContext" type="application/json"><?php echo json_encode($logsContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php readfile(__DIR__ . '/../../pages/station_incident_logs.html'); ?>
<?php require_once __DIR__ . '/../../includes/footer.php'; ?>
