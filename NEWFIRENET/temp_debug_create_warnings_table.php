<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';

firenet_require_login();

try {
    $pdo = firenet_get_pdo();
    
    // Try to create the user_warnings table
    $sql = 'CREATE TABLE IF NOT EXISTS user_warnings (
        warning_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        sender_user_id INT NOT NULL,
        warning_type VARCHAR(16) NOT NULL,
        warning_template VARCHAR(32) NOT NULL DEFAULT "standard_warning",
        warning_message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_warnings_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_user_warnings_sender FOREIGN KEY (sender_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
    )';
    
    $result = $pdo->exec($sql);
    
    echo json_encode([
        'status' => 'ok',
        'message' => 'user_warnings table created or already exists',
        'result' => $result
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
