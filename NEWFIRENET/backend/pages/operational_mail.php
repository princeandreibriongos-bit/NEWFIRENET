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

$pageStyles = ['/firenet/NEWFIRENET/assets/css/station-mails.css', '/firenet/NEWFIRENET/assets/css/general-mail-modern.css'];
$pageScripts = ['/firenet/NEWFIRENET/assets/js/operational-mail.js?v=20260519-1'];

require_once __DIR__ . '/../../includes/header.php';
?>
<script id="operationalMailContext" type="application/json"><?php echo json_encode($operationalMailContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php
readfile(__DIR__ . '/../../pages/operational_mail.html');
require_once __DIR__ . '/../../includes/footer.php';
