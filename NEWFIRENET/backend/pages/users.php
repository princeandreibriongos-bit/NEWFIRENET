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

$adminSettingsContext = [
    'role' => $role,
    'stationId' => $stationId,
    'stationName' => $stationName,
    'adminSettingsApiUrl' => '/firenet/NEWFIRENET/backend/controllers/users.php',
    'geocodeEndpoint' => '/firenet/NEWFIRENET/backend/controllers/reports.php?action=locate',
    'googleMapsConfigured' => false,
    'googleGeocodingEnabled' => false
];

$initialUsersTab = strtolower(trim((string) ($_GET['tab'] ?? 'accounts')));
if (!in_array($initialUsersTab, ['accounts', 'news', 'notices', 'substations', 'alerts', 'system'], true)) {
    $initialUsersTab = 'accounts';
}
$adminSettingsContext['activeTab'] = $initialUsersTab;
$adminSettingsContext['civilianAlertsApiUrl'] = '/firenet/NEWFIRENET/backend/controllers/admin_civilian_alerts.php';
$adminSettingsContext['systemSettingsApiUrl'] = '/firenet/NEWFIRENET/backend/controllers/admin_system_settings.php';

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

$adminSettingsContext['googleMapsConfigured'] = $googleMapsApiKey !== '';

$bodyClass = 'has-dashboard-bg';
$pageStyles = ['/firenet/NEWFIRENET/assets/css/users.css?v=' . filemtime(__DIR__ . '/../../assets/css/users.css')];
$pageScripts = ['https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'];
if ($googleMapsApiKey !== '') {
    $pageScripts[] = 'https://maps.googleapis.com/maps/api/js?key=' . rawurlencode($googleMapsApiKey) . '&v=weekly&loading=async';
}
$pageScripts[] = '/firenet/NEWFIRENET/assets/js/users.js?v=' . filemtime(__DIR__ . '/../../assets/js/users.js');

require_once __DIR__ . '/../../includes/header.php';
?>
<script id="adminSettingsContext" type="application/json"><?php echo json_encode($adminSettingsContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php
require __DIR__ . '/../../pages/users.php';
require_once __DIR__ . '/../../includes/footer.php';