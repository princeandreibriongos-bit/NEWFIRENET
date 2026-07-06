<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();

$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
$username = (string) ($_SESSION['user']['username'] ?? 'Unknown User');
$role = strtolower((string) ($_SESSION['user']['role'] ?? 'user'));
$stationId = (int) ($_SESSION['user']['station_id'] ?? 1);
$stationName = 'Station ' . $stationId;
$canManageCalendar = in_array($role, ['admin', 'superadmin'], true);

try {
	$pdo = firenet_get_pdo();
	$stationStmt = $pdo->prepare('SELECT station_name FROM stations WHERE station_id = ? LIMIT 1');
	$stationStmt->execute([$stationId]);
	$stationName = (string) ($stationStmt->fetchColumn() ?: $stationName);
} catch (Throwable $e) {
	// Keep page usable when station lookup fails.
}

$calendarContext = [
	'userId' => $userId,
	'username' => $username,
	'role' => $role,
	'canManageCalendar' => $canManageCalendar,
	'stationId' => $stationId,
	'stationName' => $stationName,
	'calendarApiUrl' => '/firenet/NEWFIRENET/backend/controllers/calendar.php'
];

$calendarCssPath = __DIR__ . '/../../assets/css/calendar.css';
$calendarJsPath = __DIR__ . '/../../assets/js/calendar.js';
$calendarCssVersion = is_file($calendarCssPath) ? (string) filemtime($calendarCssPath) : (string) time();
$calendarJsVersion = is_file($calendarJsPath) ? (string) filemtime($calendarJsPath) : (string) time();

$pageStyles = ['/firenet/NEWFIRENET/assets/css/calendar.css?v=' . $calendarCssVersion];
$pageScripts = ['/firenet/NEWFIRENET/assets/js/calendar.js?v=' . $calendarJsVersion];

$bodyClass = 'has-reports-bg';

require_once __DIR__ . '/../../includes/header.php';
?>
<script id="calendarContext" type="application/json"><?php echo json_encode($calendarContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php
readfile(__DIR__ . '/../../pages/calendar.html');
require_once __DIR__ . '/../../includes/footer.php';