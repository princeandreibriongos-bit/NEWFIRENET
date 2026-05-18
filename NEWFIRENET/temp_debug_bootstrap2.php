<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/backend/controllers/users.php';

firenet_require_login();
firenet_start_session();

try {
    $pdo = firenet_get_pdo();
    $sessionUser = $_SESSION['user'] ?? [];
    $currentStationId = (int)($sessionUser['station_id'] ?? 0);
    $currentRole = strtolower((string)($sessionUser['role'] ?? 'user'));
    
    $result = firenet_users_bootstrap($pdo, $currentStationId);
    
    echo json_encode([
        'status' => 'ok',
        'currentRole' => $currentRole,
        'currentStationId' => $currentStationId,
        'userCount' => count($result['users'] ?? []),
        'roleCount' => count($result['roles'] ?? []),
        'stationCount' => count($result['stations'] ?? [])
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}
