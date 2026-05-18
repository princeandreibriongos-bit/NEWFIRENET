<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

$configFile = __DIR__ . '/../../config/config.php';
if (!is_file($configFile)) {
    echo json_encode(['ok' => true, 'enabled' => false, 'clientId' => '']);
    exit;
}

$loaded = require $configFile;
if (!is_array($loaded)) {
    echo json_encode(['ok' => true, 'enabled' => false, 'clientId' => '']);
    exit;
}

$google = $loaded['google_auth'] ?? [];
$google = is_array($google) ? $google : [];
$enabled = !empty($google['enabled']);
$clientId = trim((string) ($google['client_id'] ?? ''));

$missing = [];
if (!$enabled) {
    $missing[] = 'google_auth.enabled';
}

if ($clientId === '' || strpos($clientId, 'YOUR_GOOGLE_WEB_CLIENT_ID') === 0) {
    $missing[] = 'google_auth.client_id';
    $clientId = '';
}

$ready = empty($missing);
$message = $ready
    ? 'Google sign-in is configured.'
    : 'Google sign-in is not configured. Missing: ' . implode(', ', $missing);

echo json_encode([
    'ok' => true,
    'enabled' => $ready,
    'clientId' => $ready ? $clientId : '',
    'missing' => $missing,
    'message' => $message
]);
