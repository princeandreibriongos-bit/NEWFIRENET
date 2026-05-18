<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';

firenet_start_session();

try {
    $pdo = firenet_get_pdo();
    $stmt = $pdo->query("SELECT u.user_id, u.username, u.station_id, u.role_id FROM users u WHERE LOWER(u.status) = 'active' LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $roleStmt = $pdo->prepare('SELECT role_name FROM roles WHERE role_id = ? LIMIT 1');
        $roleStmt->execute([(int) ($row['role_id'] ?? 0)]);
        $roleName = strtolower((string) ($roleStmt->fetchColumn() ?: 'user'));

        session_regenerate_id(true);
        $_SESSION['user'] = [
            'user_id' => (int) ($row['user_id'] ?? 0),
            'username' => (string) ($row['username'] ?? 'test'),
            'role' => $roleName,
            'station_id' => (int) ($row['station_id'] ?? 1)
        ];

        header('Location: /firenet/NEWFIRENET/backend/pages/dashboard.php');
        exit;
    }
} catch (Throwable $e) {
    // ignore and fall back to temporary session
}

// Fallback temporary login when no DB user found or DB unavailable
session_regenerate_id(true);
$_SESSION['user'] = [
    'user_id' => 0,
    'username' => 'temp_user',
    'role' => 'user',
    'station_id' => 1
];

echo "Logged in as temporary user. Open the dashboard: /firenet/NEWFIRENET/backend/pages/dashboard.php";
