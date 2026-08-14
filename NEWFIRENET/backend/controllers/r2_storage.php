<?php

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/r2_storage.php';

firenet_require_login();
firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

$sessionUser = $_SESSION['user'] ?? [];
$currentUserId = (int) ($sessionUser['user_id'] ?? 0);
$currentStationId = (int) ($sessionUser['station_id'] ?? 0);
$action = strtolower(trim((string) ($_GET['action'] ?? $_POST['action'] ?? 'status')));

if ($currentUserId < 1 || $currentStationId < 1) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Invalid session context.']);
    exit;
}

if (!firenet_r2_enabled()) {
    $r2 = firenet_r2_config();
    $missing = [];
    if (empty($r2['enabled'])) {
        $missing[] = 'FIRENET_R2_ENABLED';
    }
    foreach ([
        'account_id' => 'FIRENET_R2_ACCOUNT_ID',
        'access_key_id' => 'FIRENET_R2_ACCESS_KEY_ID',
        'secret_access_key' => 'FIRENET_R2_SECRET_ACCESS_KEY',
        'bucket' => 'FIRENET_R2_BUCKET',
    ] as $field => $envName) {
        if (trim((string) ($r2[$field] ?? '')) === '') {
            $missing[] = $envName;
        }
    }

    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'message' => 'R2 is not configured on this server.'
            . ($missing !== [] ? (' Missing: ' . implode(', ', $missing) . '.') : ''),
        'data' => [
            'missing' => $missing,
            'envOverridesLoaded' => function_exists('firenet_apply_env_config'),
            'hint' => 'Add the FIRENET_R2_* variables in Vercel → Settings → Environment Variables for Production, then Redeploy. Fire-out reports sync to firenet/reports/, not firenet/orgmail/.',
        ],
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = firenet_get_pdo();
    $client = FirenetR2Client::fromConfig();
    $stationCode = firenet_r2_station_code($pdo, $currentStationId);

    if ($action === 'status') {
        $test = $client->testConnection();
        echo json_encode([
            'ok' => $test['ok'],
            'message' => $test['message'],
            'data' => [
                'bucket' => firenet_r2_config()['bucket'] ?? '',
                'stationCode' => $stationCode,
                'reportsFolder' => firenet_r2_list_prefix_for_station($pdo, $currentStationId, 'reports'),
                'orgmailFolder' => firenet_r2_list_prefix_for_station($pdo, $currentStationId, 'orgmail'),
                'isCentralStation' => firenet_r2_is_central_station($pdo, $currentStationId),
            ],
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'list') {
        $area = strtolower(trim((string) ($_GET['area'] ?? 'reports')));
        if (!in_array($area, ['reports', 'orgmail'], true)) {
            $area = 'reports';
        }

        $listStationId = (int) ($_GET['stationId'] ?? $currentStationId);
        if (!firenet_r2_user_can_list_station($pdo, $currentStationId, $listStationId)) {
            http_response_code(403);
            echo json_encode(['ok' => false, 'message' => 'You cannot browse that station folder.']);
            exit;
        }

        $prefix = firenet_r2_list_prefix_for_station_id($pdo, $listStationId, $area);
        $objects = $client->listObjects($prefix);
        $files = firenet_r2_map_list_for_browser($objects);

        echo json_encode([
            'ok' => true,
            'folder' => $prefix,
            'files' => $files,
            'count' => count($files),
            'storage' => 'r2',
            'stationId' => $listStationId,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'upload') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'message' => 'Method not allowed.']);
            exit;
        }

        if (!isset($_FILES['file']) || !is_uploaded_file((string) ($_FILES['file']['tmp_name'] ?? ''))) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'No file uploaded.']);
            exit;
        }

        $area = strtolower(trim((string) ($_POST['area'] ?? 'reports')));
        if (!in_array($area, ['reports', 'orgmail'], true)) {
            $area = 'reports';
        }

        $originalName = (string) ($_FILES['file']['name'] ?? 'upload.bin');
        $stationCode = firenet_r2_station_code($pdo, $currentStationId);
        $safeName = firenet_r2_prefixed_safe_filename($stationCode, $originalName);
        $prefix = firenet_r2_list_prefix_for_station($pdo, $currentStationId, $area);
        $objectKey = rtrim($prefix, '/') . '/' . date('Ymd_His') . '_' . $safeName;
        $mime = (string) ($_FILES['file']['type'] ?? 'application/octet-stream');

        $uploaded = $client->putObject($objectKey, (string) $_FILES['file']['tmp_name'], $mime);

        echo json_encode([
            'ok' => true,
            'message' => 'File uploaded to R2.',
            'data' => $uploaded,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'download') {
        $key = trim((string) ($_GET['key'] ?? ''));
        if ($key === '' || !firenet_r2_user_can_access_key($pdo, $currentStationId, $key)) {
            http_response_code(403);
            echo json_encode(['ok' => false, 'message' => 'You do not have access to this file.']);
            exit;
        }

        $object = $client->getObject($key);
        $filename = basename($key);
        header('Content-Type: ' . ($object['content_type'] ?? 'application/octet-stream'));
        header('Content-Disposition: inline; filename="' . str_replace('"', '', $filename) . '"');
        header('Cache-Control: private, max-age=300');
        echo $object['body'];
        exit;
    }

    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Unknown action.']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => $e->getMessage()]);
}
