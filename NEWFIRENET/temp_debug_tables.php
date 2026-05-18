<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';

firenet_require_login();

try {
    $pdo = firenet_get_pdo();
    
    // Test user_settings table
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_settings'");
    $userSettingsExists = (int)($stmt->fetchColumn() ?: 0) > 0;
    
    // Test user_warnings table
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_warnings'");
    $userWarningsExists = (int)($stmt->fetchColumn() ?: 0) > 0;
    
    // Get current database
    $dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();
    
    echo json_encode([
        'status' => 'ok',
        'database' => $dbName,
        'userSettingsTableExists' => $userSettingsExists,
        'userWarningsTableExists' => $userWarningsExists
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
