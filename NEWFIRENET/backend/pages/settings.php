<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();

$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
$username = (string) ($_SESSION['user']['username'] ?? 'Unknown User');
$role = strtolower((string) ($_SESSION['user']['role'] ?? 'user'));
$stationId = (int) ($_SESSION['user']['station_id'] ?? 1);
$stationName = 'Station ' . $stationId;

try {
    $pdo = firenet_get_pdo();
    $stationStmt = $pdo->prepare('SELECT station_name FROM stations WHERE station_id = ? LIMIT 1');
    $stationStmt->execute([$stationId]);
    $stationName = (string) ($stationStmt->fetchColumn() ?: $stationName);
} catch (Throwable $e) {
    // Keep page usable when station lookup fails.
}

$settingsContext = [
    'userId' => $userId,
    'username' => $username,
    'role' => $role,
    'stationId' => $stationId,
    'stationName' => $stationName,
    'settingsApiUrl' => '/firenet/NEWFIRENET/backend/controllers/settings.php'
];

$pageStyles = ['/firenet/NEWFIRENET/assets/css/settings.css'];
$pageScripts = ['/firenet/NEWFIRENET/assets/js/settings.js'];

require_once __DIR__ . '/../../includes/header.php';
?>
<script id="settingsContext" type="application/json"><?php echo json_encode($settingsContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php
readfile(__DIR__ . '/../../pages/settings.html');
require_once __DIR__ . '/../../includes/footer.php';
