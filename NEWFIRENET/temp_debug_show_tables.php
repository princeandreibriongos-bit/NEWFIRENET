<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';

firenet_require_login();

try {
    $pdo = firenet_get_pdo();
    
    // Check if users table exists and has data
    $stmt = $pdo->query('SELECT COUNT(*) FROM users');
    $userCount = $stmt->fetchColumn();
    
    // Try to get table status
    $stmt = $pdo->query('SHOW TABLE STATUS LIKE "user_warnings"');
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result === false) {
        echo json_encode(['message' => 'user_warnings table does not exist', 'userCount' => $userCount]);
    } else {
        echo json_encode(['message' => 'user_warnings table exists', 'tableInfo' => $result, 'userCount' => $userCount]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'error' => $e->getMessage(),
        'userCount' => null
    ]);
}
