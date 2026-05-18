<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';

firenet_require_login();
firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

$sessionUser = $_SESSION['user'] ?? [];
$currentUserId = (int)($sessionUser['user_id'] ?? 0);
$currentRole = strtolower((string)($sessionUser['role'] ?? 'user'));
$currentStationId = (int)($sessionUser['station_id'] ?? 0);

if (!in_array($currentRole, ['admin', 'superadmin'], true)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Only administrators can manage user accounts']);
    exit;
}

try {
    $pdo = firenet_get_pdo();
    
    // Test data
    $username = 'testuser789';
    $email = 'testuser789@firenet.local';
    $password = 'TestPass123!';
    $roleId = 1; // user role
    $stationId = 1;
    $status = 'active';
    
    // Test if we can insert
    $stmt = $pdo->prepare('INSERT INTO users (station_id, username, password, email, role_id, position_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$stationId, $username, password_hash($password, PASSWORD_DEFAULT), $email, $roleId, null, $status]);
    $newUserId = (int)$pdo->lastInsertId();
    
    if ($newUserId > 0) {
        // Try to save user settings
        $settingsStmt = $pdo->prepare('INSERT INTO user_settings (user_id, security_alerts, hide_sensitive, auto_logout_minutes) VALUES (?, ?, ?, ?)');
        $settingsStmt->execute([$newUserId, 1, 0, 30]);
    }
    
    echo json_encode([
        'ok' => true,
        'message' => 'User created successfully',
        'newUserId' => $newUserId
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ]);
}
