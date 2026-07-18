<?php
/**
 * Admin System Settings API.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/system_settings.php';

firenet_start_session();
firenet_require_login();

$role = strtolower((string) ($_SESSION['user']['role'] ?? ''));
if (!in_array($role, ['admin', 'superadmin'], true)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Admin access required.']);
    exit;
}

function sys_settings_fail(string $message, int $status = 400): void
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function sys_settings_ok(array $data = [], string $message = 'OK'): void
{
    echo json_encode(['ok' => true, 'message' => $message, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = firenet_get_pdo();
    firenet_system_settings_ensure_table($pdo);
} catch (Throwable $e) {
    sys_settings_fail('Unable to open system settings.', 500);
}

$action = trim((string) ($_GET['action'] ?? $_POST['action'] ?? 'get'));
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$userId = (int) ($_SESSION['user']['user_id'] ?? $_SESSION['user']['id'] ?? 0);

if ($action === 'get' && $method === 'GET') {
    $settings = firenet_system_settings_all($pdo);
    $public = $settings;
    // Never send full API key — only whether one is stored.
    $public['sms_api_key_set'] = trim((string) ($settings['sms_api_key'] ?? '')) !== '' ? '1' : '0';
    $public['sms_api_key'] = '';

    sys_settings_ok([
        'settings' => $public,
        'integrations' => firenet_system_integrations_status(),
        'defaults' => firenet_system_settings_defaults(),
    ]);
}

if ($action === 'save' && $method === 'POST') {
    $raw = file_get_contents('php://input');
    $json = [];
    if (is_string($raw) && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $json = $decoded;
        }
    }

    $input = is_array($json['settings'] ?? null) ? $json['settings'] : $json;
    if (!is_array($input) || !$input) {
        sys_settings_fail('No settings provided.');
    }

    try {
        $saved = firenet_system_settings_save($pdo, $input, $userId > 0 ? $userId : null);
        $public = $saved;
        $public['sms_api_key_set'] = trim((string) ($saved['sms_api_key'] ?? '')) !== '' ? '1' : '0';
        $public['sms_api_key'] = '';
        sys_settings_ok([
            'settings' => $public,
            'integrations' => firenet_system_integrations_status(),
        ], 'System settings saved.');
    } catch (Throwable $e) {
        sys_settings_fail('Unable to save settings: ' . $e->getMessage(), 500);
    }
}

sys_settings_fail('Unknown action.', 404);
