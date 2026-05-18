<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/backend/controllers/users.php';

firenet_require_login();
firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = firenet_get_pdo();
    
    // Test firenet_users_hash_password
    $hashedPassword = firenet_users_hash_password('TestPass123!');
    
    // Test firenet_user_settings_defaults
    $defaults = firenet_user_settings_defaults();
    
    // Test firenet_ensure_user_settings_table
    firenet_ensure_user_settings_table($pdo);
    
    // Test firenet_ensure_user_warning_table
    firenet_ensure_user_warning_table($pdo);
    
    // Test firenet_save_user_settings
    $testUserId = 999;
    firenet_save_user_settings($pdo, $testUserId, $defaults);
    
    echo json_encode([
        'ok' => true,
        'message' => 'All functions work',
        'hashedPasswordLength' => strlen($hashedPassword),
        'defaults' => $defaults
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
        'trace' => array_slice(explode("\n", $e->getTraceAsString()), 0, 3)
    ]);
}
