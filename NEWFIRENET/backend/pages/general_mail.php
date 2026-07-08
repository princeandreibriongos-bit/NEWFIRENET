<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();

$role = strtolower((string) ($_SESSION['user']['role'] ?? 'user'));
$stationId = (int) ($_SESSION['user']['station_id'] ?? 1);
$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
$stationName = 'Station ' . $stationId;
$user = (string) ($_SESSION['user']['username'] ?? 'Unknown User');

try {
    $pdo = firenet_get_pdo();
    $stmt = $pdo->prepare('SELECT station_name, station_code FROM stations WHERE station_id = ? LIMIT 1');
    $stmt->execute([$stationId]);
    $stationRow = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $stationName = (string) ($stationRow['station_name'] ?? $stationName);
    $isCentralStation = strtolower((string) ($stationRow['station_code'] ?? '')) === 'mcfs';
} catch (Throwable $ignored) {
    // Use default station label.
    $isCentralStation = false;
}

$generalMailContext = [
    'stationId' => $stationId,
    'stationName' => $stationName,
    'user' => $user,
    'role' => $role,
    'mailApiUrl' => '/firenet/NEWFIRENET/backend/controllers/station_mails.php',
    'isCentralStation' => $isCentralStation,
    'mailHomeUrl' => $isCentralStation ? '/firenet/NEWFIRENET/backend/pages/station_mails.php' : '/firenet/NEWFIRENET/backend/pages/general_mail.php'
];

$mailCssPath = __DIR__ . '/../../assets/css/mail-pro.css';
$mailJsPath = __DIR__ . '/../../assets/js/general-mail.js';
$mailCssVersion = is_file($mailCssPath) ? (string) filemtime($mailCssPath) : (string) time();
$mailJsVersion = is_file($mailJsPath) ? (string) filemtime($mailJsPath) : (string) time();

$pageStyles = ['/firenet/NEWFIRENET/assets/css/mail-pro.css?v=' . $mailCssVersion];
$pageScripts = ['/firenet/NEWFIRENET/assets/js/general-mail.js?v=' . $mailJsVersion];
$bodyClass = 'has-reports-bg';

require_once __DIR__ . '/../../includes/header.php';
?>
<script id="generalMailContext" type="application/json"><?php echo json_encode($generalMailContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php
readfile(__DIR__ . '/../../pages/general_mail.html');
require_once __DIR__ . '/../../includes/footer.php';
