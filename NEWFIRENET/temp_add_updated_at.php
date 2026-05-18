<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';

firenet_require_login();

try {
    $pdo = firenet_get_pdo();
    
    // Add updated_at column to user_settings table
    $pdo->exec('ALTER TABLE user_settings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    
    echo json_encode([
        'status' => 'ok',
        'message' => 'user_settings table updated successfully'
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'error' => $e->getMessage()
    ]);
}
