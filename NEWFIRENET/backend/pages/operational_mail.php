<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/r2_storage.php';

firenet_require_login();

$role = strtolower((string) ($_SESSION['user']['role'] ?? 'user'));
$stationId = (int) ($_SESSION['user']['station_id'] ?? 1);
$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
$stationName = 'Station ' . $stationId;
$user = (string) ($_SESSION['user']['username'] ?? 'Unknown User');

try {
    $pdo = firenet_get_pdo();
    if (!firenet_r2_is_central_station($pdo, $stationId)) {
        $query = $_SERVER['QUERY_STRING'] ?? '';
        header('Location: /firenet/NEWFIRENET/backend/pages/general_mail.php' . ($query !== '' ? ('?' . $query) : ''));
        exit;
    }
    $stmt = $pdo->prepare('SELECT station_name FROM stations WHERE station_id = ? LIMIT 1');
    $stmt->execute([$stationId]);
    $stationName = (string) ($stmt->fetchColumn() ?: $stationName);
} catch (Throwable $ignored) {
    // Use default station label.
}

$operationalMailContext = [
    'stationId' => $stationId,
    'stationName' => $stationName,
    'user' => $user,
    'role' => $role,
    'mailApiUrl' => '/firenet/NEWFIRENET/backend/controllers/station_mails.php'
];

$mailCssPath = __DIR__ . '/../../assets/css/mail-pro.css';
$mailJsPath = __DIR__ . '/../../assets/js/operational-mail.js';
$mailCssVersion = is_file($mailCssPath) ? (string) filemtime($mailCssPath) : (string) time();
$mailJsVersion = is_file($mailJsPath) ? (string) filemtime($mailJsPath) : (string) time();

$pageStyles = ['/firenet/NEWFIRENET/assets/css/mail-pro.css?v=' . $mailCssVersion];
$pageScripts = ['/firenet/NEWFIRENET/assets/js/operational-mail.js?v=' . $mailJsVersion];
$bodyClass = 'has-reports-bg';

require_once __DIR__ . '/../../includes/header.php';
?>
<script id="operationalMailContext" type="application/json"><?php echo json_encode($operationalMailContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php
readfile(__DIR__ . '/../../pages/operational_mail.html');
require_once __DIR__ . '/../../includes/footer.php';
