<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();

$role = strtolower((string) ($_SESSION['user']['role'] ?? 'user'));
if (!in_array($role, ['admin', 'superadmin'], true)) {
    header('Location: /firenet/NEWFIRENET/backend/pages/dashboard.php');
    exit;
}

$stationId = (int) ($_SESSION['user']['station_id'] ?? 1);
$stationName = 'Station ' . $stationId;

try {
    $pdo = firenet_get_pdo();
    $stmt = $pdo->prepare('SELECT station_name FROM stations WHERE station_id = ? LIMIT 1');
    $stmt->execute([$stationId]);
    $stationName = (string) ($stmt->fetchColumn() ?: $stationName);
} catch (Throwable $ignored) {
}

$usersContext = [
    'role' => $role,
    'stationId' => $stationId,
    'stationName' => $stationName,
    'usersApiUrl' => '/firenet/NEWFIRENET/backend/controllers/users.php',
    'googleMapsConfigured' => false
];

$googleMapsApiKey = '';
try {
    $appConfig = require __DIR__ . '/../../config/config.php';
    $googleMapsConfig = is_array($appConfig['google_maps'] ?? null) ? $appConfig['google_maps'] : [];
    $candidateKey = trim((string) ($googleMapsConfig['api_key'] ?? ''));
    if ($candidateKey !== '' && strpos($candidateKey, 'YOUR_GOOGLE_MAPS_API_KEY') !== 0) {
        $googleMapsApiKey = $candidateKey;
    }
} catch (Throwable $ignored) {
}

$usersContext['googleMapsConfigured'] = $googleMapsApiKey !== '';

$pageStyles = ['/firenet/NEWFIRENET/assets/css/users.css'];
$pageScripts = ['https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'];
if ($googleMapsApiKey !== '') {
    $pageScripts[] = 'https://maps.googleapis.com/maps/api/js?key=' . rawurlencode($googleMapsApiKey) . '&v=weekly&loading=async';
}
$pageScripts[] = '/firenet/NEWFIRENET/assets/js/users.js';

require_once __DIR__ . '/../../includes/header.php';
?>
<script id="usersContext" type="application/json"><?php echo json_encode($usersContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php
readfile(__DIR__ . '/../../pages/users.html');
require_once __DIR__ . '/../../includes/footer.php';