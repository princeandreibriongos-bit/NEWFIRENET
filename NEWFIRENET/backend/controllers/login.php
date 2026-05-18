<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /firenet/NEWFIRENET/pages/login.html');
    exit;
}

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if ($username === '' || $password === '') {
    header('Location: /firenet/NEWFIRENET/pages/login.html?error=Invalid+username+or+password');
    exit;
}

$allowedRoles = ['user', 'admin', 'superadmin'];
$dbUser = null;

function firenet_verify_login_password(string $provided, string $stored): bool {
    $passwordInfo = password_get_info($stored);
    if (!empty($passwordInfo['algo'])) {
        return password_verify($provided, $stored);
    }

    return hash_equals($stored, $provided);
}

try {
    $pdo = firenet_get_pdo();
    $stmt = $pdo->prepare('
        SELECT u.user_id, u.username, u.password, u.station_id, u.status, r.role_name
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        WHERE u.username = ?
        LIMIT 1
    ');
    $stmt->execute([$username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row && strtolower((string) ($row['status'] ?? 'inactive')) === 'active' && firenet_verify_login_password($password, (string) ($row['password'] ?? ''))) {
        $role = strtolower((string) ($row['role_name'] ?? ''));
        if (in_array($role, $allowedRoles, true)) {
            $dbUser = [
                'user_id' => (int) ($row['user_id'] ?? 0),
                'username' => (string) ($row['username'] ?? ''),
                'role' => $role,
                'station_id' => (int) ($row['station_id'] ?? 1)
            ];
        }
    }
} catch (Throwable $e) {
    header('Location: /firenet/NEWFIRENET/pages/login.html?error=Login+service+temporarily+unavailable');
    exit;
}

if ($dbUser === null) {
    header('Location: /firenet/NEWFIRENET/pages/login.html?error=Invalid+username+or+password');
    exit;
}

session_regenerate_id(true);
$_SESSION['user'] = [
    'user_id' => (int) ($dbUser['user_id'] ?? 0),
    'username' => (string) ($dbUser['username'] ?? $username),
    'role' => (string) ($dbUser['role'] ?? 'user'),
    'station_id' => (int) ($dbUser['station_id'] ?? 1)
];

$role = (string) $_SESSION['user']['role'];

switch ($role) {
    case 'superadmin':
    case 'admin':
    case 'user':
        header('Location: /firenet/NEWFIRENET/backend/pages/dashboard.php');
        break;
    default:
        header('Location: /firenet/NEWFIRENET/pages/login.html?error=Unable+to+route+account');
        break;
}
exit;
