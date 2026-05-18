<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';

firenet_require_login();

try {
    $pdo = firenet_get_pdo();
    
    // Check if all required tables exist
    $tables = ['users', 'roles', 'stations', 'positions', 'user_settings', 'user_warnings'];
    $missingTables = [];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '$table'");
        $exists = (int)($stmt->fetchColumn() ?: 0) > 0;
        if (!$exists) {
            $missingTables[] = $table;
        }
    }
    
    echo json_encode([
        'status' => 'ok',
        'allTablesExist' => count($missingTables) === 0,
        'missingTables' => $missingTables,
        'tablesChecked' => $tables
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'error' => $e->getMessage()
    ]);
}
