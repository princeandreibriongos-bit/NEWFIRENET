<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';

firenet_require_login();

try {
    $pdo = firenet_get_pdo();
    
    // Drop existing corrupted table
    $pdo->exec('DROP TABLE IF EXISTS user_warnings');
    
    // Drop user_settings if it also has the same issue
    $pdo->exec('DROP TABLE IF EXISTS user_settings');
    
    // Recreate user_warnings without foreign keys first
    $pdo->exec('CREATE TABLE user_warnings (
        warning_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        sender_user_id INT NOT NULL,
        warning_type VARCHAR(16) NOT NULL,
        warning_template VARCHAR(32) NOT NULL DEFAULT "standard_warning",
        warning_message LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_user_id (user_id),
        KEY idx_sender_user_id (sender_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    
    // Recreate user_settings without foreign keys first
    $pdo->exec('CREATE TABLE user_settings (
        setting_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        security_alerts INT DEFAULT 1,
        hide_sensitive INT DEFAULT 0,
        auto_logout_minutes INT DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    
    // Test query
    $stmt = $pdo->query('SELECT COUNT(*) FROM user_warnings');
    $count = $stmt->fetchColumn();
    
    echo json_encode([
        'status' => 'ok',
        'message' => 'Tables recreated successfully',
        'warningCount' => $count
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
