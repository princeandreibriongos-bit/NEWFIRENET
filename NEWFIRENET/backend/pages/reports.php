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
$quickMode = strtolower((string) ($_GET['quick'] ?? ''));

$barangays = [
    'Barangay 1',
    'Barangay 2',
    'Barangay 3'
];

function firenet_load_app_config(): array {
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $configFile = __DIR__ . '/../../config/config.php';
    if (!is_file($configFile)) {
        $config = [];
        return $config;
    }

    $loaded = require $configFile;
    $config = is_array($loaded) ? $loaded : [];
    return $config;
}

$appConfig = firenet_load_app_config();
$googleMapsConfig = is_array($appConfig['google_maps'] ?? null) ? $appConfig['google_maps'] : [];
$googleMapsApiKey = trim((string) ($googleMapsConfig['api_key'] ?? ''));
if ($googleMapsApiKey === '' || strpos($googleMapsApiKey, 'YOUR_GOOGLE_MAPS_API_KEY') === 0) {
    $googleMapsApiKey = '';
}

$streetsByBarangay = [
    'Barangay 1' => ['A. Reyes St', 'Mabini St', 'Sampaguita St'],
    'Barangay 2' => ['Rizal Ave', 'Bonifacio St', 'Acacia St'],
    'Barangay 3' => ['JP Rizal Extension', 'Kalayaan Ave', 'Narra St']
];

$canCreateIncidentReports = $positionCode !== 'position2';
$canCreateEquipmentReports = $positionCode === 'position2' || $positionCode === '';
$canCreateReports = $canCreateIncidentReports || $canCreateEquipmentReports;
$canUpdateIncidentReports = $positionCode === 'position1';
$canViewAllReports = $positionCode === 'position1';
$defaultReportsScope = 'mine';

$stationGeo = [];
try {
    $pdo = firenet_get_pdo();
    $stationNameStmt = $pdo->prepare('SELECT station_name FROM stations WHERE station_id = ? LIMIT 1');
    $stationNameStmt->execute([$stationId]);
    $stationName = (string) ($stationNameStmt->fetchColumn() ?: $stationName);

    $stationStmt = $pdo->query('SELECT station_id, station_name, latitude, longitude, status FROM stations ORDER BY station_id ASC');
    $stationRows = $stationStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($stationRows as $row) {
        $lat = isset($row['latitude']) ? (float) $row['latitude'] : 0.0;
        $lng = isset($row['longitude']) ? (float) $row['longitude'] : 0.0;
        if ($lat === 0.0 && $lng === 0.0) {
            continue;
        }

        $stationGeo[] = [
            'stationId' => (int) $row['station_id'],
            'stationName' => (string) ($row['station_name'] ?? ''),
            'latitude' => $lat,
            'longitude' => $lng,
            'status' => (string) ($row['status'] ?? 'active')
        ];
    }
} catch (Throwable $ignored) {
    $stationGeo = [];
}

$reportsContext = [
    'userId' => $userId,
    'user' => $user,
    'role' => $role,
    'positionCode' => $positionCode,
    'positionName' => $positionName,
    'stationId' => $stationId,
    'stationName' => $stationName,
    'stationLogoUrl' => '/firenet/NEWFIRENET/assets/img/bfpmakatilogo.jpg',
    'canCreateReports' => $canCreateReports,
    'canCreateIncidentReports' => $canCreateIncidentReports,
    'canCreateEquipmentReports' => $canCreateEquipmentReports,
    'canUpdateIncidentReports' => $canUpdateIncidentReports,
    'canViewAllReports' => $canViewAllReports,
    'defaultReportsScope' => $defaultReportsScope,
    'quickMode' => $quickMode,
    'barangays' => $barangays,
    'streetsByBarangay' => $streetsByBarangay,
    'stationGeo' => $stationGeo,
    'geocodeEndpoint' => '/firenet/NEWFIRENET/backend/controllers/reports.php?action=locate',
    'googleMapsConfigured' => $googleMapsApiKey !== '',
    'googleGeocodingEnabled' => false
];

$reportsCssPath = __DIR__ . '/../../assets/css/reports.css';
$reportsJsPath = __DIR__ . '/../../assets/js/reports.js';
$reportsCssVersion = is_file($reportsCssPath) ? (string) filemtime($reportsCssPath) : (string) time();
$reportsJsVersion = is_file($reportsJsPath) ? (string) filemtime($reportsJsPath) : (string) time();

$pageStyles = [
    '/firenet/NEWFIRENET/assets/css/reports.css?v=' . $reportsCssVersion
];
$pageScripts = [];
if ($googleMapsApiKey !== '') {
    $pageScripts[] = 'https://maps.googleapis.com/maps/api/js?key=' . rawurlencode($googleMapsApiKey) . '&v=weekly';
}
$pageScripts[] = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
$pageScripts[] = '/firenet/NEWFIRENET/assets/js/reports.js?v=' . $reportsJsVersion;

$bodyClass = 'has-reports-bg';

require_once __DIR__ . '/../../includes/header.php';
?>
<script id="reportsContext" type="application/json"><?php echo json_encode($reportsContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php
readfile(__DIR__ . '/../../pages/reports.html');
require_once __DIR__ . '/../../includes/footer.php';
