<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';

firenet_require_login();

$currentStationId = (int)($_SESSION['user']['station_id'] ?? 1);
$currentRole = strtolower((string)($_SESSION['user']['role'] ?? 'user'));

try {
    $pdo = firenet_get_pdo();
    
    // Ensure tables exist first
    $pdo->exec('CREATE TABLE IF NOT EXISTS user_warnings (
        warning_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        sender_user_id INT NOT NULL,
        warning_type VARCHAR(16) NOT NULL,
        warning_template VARCHAR(32) NOT NULL DEFAULT "standard_warning",
        warning_message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_warnings_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_user_warnings_sender FOREIGN KEY (sender_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
    )');
    
    $pdo->exec('CREATE TABLE IF NOT EXISTS user_settings (
        setting_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        security_alerts INT DEFAULT 1,
        hide_sensitive INT DEFAULT 0,
        auto_logout_minutes INT DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )');
    
    // Test query from bootstrap
    $userWhere = '1=1';
    $userParams = [];
    if ($currentRole === 'admin') {
        $userWhere = 'u.station_id = ? AND LOWER(r.role_name) = "user"';
        $userParams[] = $currentStationId;
    }
    
    $usersStmt = $pdo->prepare('
        SELECT
            u.user_id,
            u.username,
            u.email,
            u.status,
            u.station_id,
            u.position_id,
            r.role_id,
            r.role_name,
            s.station_name,
            s.station_code,
            p.position_name,
            COALESCE(us.security_alerts, 1) AS security_alerts,
            COALESCE(us.hide_sensitive, 0) AS hide_sensitive,
            COALESCE(us.auto_logout_minutes, 30) AS auto_logout_minutes,
            COALESCE(warning_sub.warning_count, 0) AS warning_count,
            u.created_at
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN stations s ON s.station_id = u.station_id
        LEFT JOIN positions p ON p.position_id = u.position_id
        LEFT JOIN user_settings us ON us.user_id = u.user_id
        LEFT JOIN (
            SELECT user_id, COUNT(*) AS warning_count
            FROM user_warnings
            GROUP BY user_id
        ) AS warning_sub ON warning_sub.user_id = u.user_id
        WHERE ' . $userWhere . '
        ORDER BY u.user_id DESC
    ');
    $usersStmt->execute($userParams);
    $users = $usersStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'ok',
        'userCount' => count($users),
        'firstUser' => $users[0] ?? null
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
