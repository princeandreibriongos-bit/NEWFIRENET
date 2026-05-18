<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/backend/controllers/users.php';

firenet_require_login();

try {
    $pdo = firenet_get_pdo();
    $result = firenet_users_bootstrap($pdo, (int)($_SESSION['user']['station_id'] ?? 1));
    
    echo json_encode([
        'status' => 'ok',
        'data' => $result
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
