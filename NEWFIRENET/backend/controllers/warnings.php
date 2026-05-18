<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();
firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

$sessionUser = $_SESSION['user'] ?? [];
$currentUserId = (int) ($sessionUser['user_id'] ?? 0);
$action = strtolower(trim((string) ($_GET['action'] ?? $_POST['action'] ?? 'alerts')));

function firenet_user_settings_defaults(): array
{
    return [
        'securityAlerts' => true,
        'hideSensitive' => false,
        'autoLogoutMinutes' => 30
    ];
}

function firenet_user_settings_table_exists(PDO $pdo): bool
{
    static $exists = null;
    if ($exists !== null) {
        return $exists;
    }

    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_settings'");
    $exists = (int) ($stmt->fetchColumn() ?: 0) > 0;
    return $exists;
}

function firenet_load_user_settings(PDO $pdo, int $userId): array
{
    $settings = firenet_user_settings_defaults();
    if (!firenet_user_settings_table_exists($pdo)) {
        return $settings;
    }

    $stmt = $pdo->prepare('SELECT security_alerts, hide_sensitive, auto_logout_minutes FROM user_settings WHERE user_id = ? LIMIT 1');
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return $settings;
    }

    return [
        'securityAlerts' => ((int) ($row['security_alerts'] ?? 1)) === 1,
        'hideSensitive' => ((int) ($row['hide_sensitive'] ?? 0)) === 1,
        'autoLogoutMinutes' => max(0, (int) ($row['auto_logout_minutes'] ?? 30))
    ];
}

function firenet_user_warning_table_exists(PDO $pdo): bool
{
    static $exists = null;
    if ($exists !== null) {
        return $exists;
    }

    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_warnings'");
    $exists = (int) ($stmt->fetchColumn() ?: 0) > 0;
    return $exists;
}

function firenet_build_warning_alert(array $warning): array
{
    $type = strtolower((string) ($warning['warning_type'] ?? 'warning'));
    $sender = trim((string) ($warning['sender_username'] ?? 'Station Admin'));
    $label = $type === 'memo' ? 'Station Memo' : 'Station Warning';
    $title = ucfirst($type) . ' issued by ' . ($sender !== '' ? $sender : 'Station Admin');
    $message = trim((string) ($warning['warning_message'] ?? ''));

    return [
        'id' => 'warning-' . ((int) ($warning['warning_id'] ?? 0)),
        'label' => $label,
        'title' => $title,
        'url' => '/firenet/NEWFIRENET/backend/pages/settings.php',
        'createdAt' => (string) ($warning['created_at'] ?? ''),
        'message' => $message
    ];
}

try {
    if ($currentUserId < 1) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'message' => 'Authentication required.']);
        exit;
    }

    $pdo = firenet_get_pdo();
    // Warning alerts should always be available to the recipient.
    // User security alert settings do not suppress important memo/warning notifications.
    if ($action === 'alerts') {
        if (!firenet_user_warning_table_exists($pdo)) {
            echo json_encode(['ok' => true, 'alerts' => []]);
            exit;
        }

        $stmt = $pdo->prepare(<<<'SQL'
SELECT w.warning_id, w.warning_type, w.warning_template, w.warning_message, w.created_at, u.username AS sender_username
FROM user_warnings w
LEFT JOIN users u ON u.user_id = w.sender_user_id
WHERE w.user_id = ?
ORDER BY w.created_at DESC
LIMIT 10
SQL
        );
        $stmt->execute([$currentUserId]);
        $alerts = array_map(static function (array $row): array {
            return firenet_build_warning_alert($row);
        }, $stmt->fetchAll(PDO::FETCH_ASSOC));

        echo json_encode(['ok' => true, 'alerts' => $alerts], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Unsupported action.']);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Warning service unavailable.']);
}
