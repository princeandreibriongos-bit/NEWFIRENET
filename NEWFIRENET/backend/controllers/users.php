<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();
firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

$sessionUser = $_SESSION['user'] ?? [];
$currentUserId = (int) ($sessionUser['user_id'] ?? 0);
$currentRole = strtolower((string) ($sessionUser['role'] ?? 'user'));
$currentStationId = (int) ($sessionUser['station_id'] ?? 0);
$action = strtolower(trim((string) ($_GET['action'] ?? $_POST['action'] ?? 'bootstrap')));

if (!in_array($currentRole, ['admin', 'superadmin'], true)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Only administrators can manage user accounts']);
    exit;
}

if ($currentRole === 'admin' && $currentStationId < 1) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Invalid station context']);
    exit;
}

function firenet_users_fail(string $message, int $status = 400): void
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'message' => $message]);
    exit;
}

function firenet_users_hash_password(string $password): string
{
    return password_hash($password, PASSWORD_DEFAULT);
}

function firenet_users_to_bool($value): bool
{
    if (is_bool($value)) {
        return $value;
    }

    $normalized = strtolower(trim((string) $value));
    return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
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

function firenet_user_warning_column_exists(PDO $pdo, string $columnName): bool
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_warnings' AND COLUMN_NAME = ?");
    $stmt->execute([$columnName]);
    return (int) ($stmt->fetchColumn() ?: 0) > 0;
}

function firenet_ensure_user_warning_table(PDO $pdo): void
{
    if (!firenet_user_warning_table_exists($pdo)) {
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
        return;
    }

    if (!firenet_user_warning_column_exists($pdo, 'warning_template')) {
        $pdo->exec('ALTER TABLE user_warnings ADD COLUMN warning_template VARCHAR(32) NOT NULL DEFAULT "standard_warning" AFTER warning_type');
    }
}

function firenet_warning_template_text(string $warningTemplate): string
{
    $templates = [
        'standard_warning' => 'MEMORANDUM\n\nTo: [Employee Name / Concerned Individual]\nFrom: [Your Name / Position]\nDate: [Insert Date]\nSubject: Formal Warning\n\nThis memorandum is issued to inform you that conduct observed on [date] is inconsistent with station policies and expectations. You are required to correct this behavior immediately and adhere to applicable standards going forward. Continued violations may result in further disciplinary action.',
        'final_warning' => 'MEMORANDUM\n\nTo: [Employee Name / Concerned Individual]\nFrom: [Your Name / Position]\nDate: [Insert Date]\nSubject: Final Written Warning\n\nThis memoranda serves as a final written warning regarding repeated or serious conduct concerns. Your behavior must improve without delay. Failure to comply with station policies may result in suspension, termination, or other disciplinary measures. Please treat this matter with the utmost seriousness.',
        'performance_memo' => 'MEMORANDUM\n\nTo: [Employee Name / Concerned Individual]\nFrom: [Your Name / Position]\nDate: [Insert Date]\nSubject: Performance Improvement Memo\n\nThis memorandum outlines the expectations for your professional performance. Recent observations indicate that improvement is required in meeting established duties and standards. Please address the specific concerns, implement corrective actions, and maintain consistent performance in accordance with station policy.',
        'conduct_reminder' => 'MEMORANDUM\n\nTo: [Employee Name / Concerned Individual]\nFrom: [Your Name / Position]\nDate: [Insert Date]\nSubject: Conduct Reminder\n\nThis memorandum is issued as a formal reminder of expected professional conduct. All personnel are required to uphold a respectful, disciplined, and cooperative work environment. You are expected to adhere to applicable rules, maintain a professional demeanor, and avoid behavior that may reflect negatively on the station.',
        'attendance_notice' => 'MEMORANDUM\n\nTo: [Employee Name / Concerned Individual]\nFrom: [Your Name / Position]\nDate: [Insert Date]\nSubject: Attendance Notice\n\nThis memorandum addresses concerns regarding your attendance and punctuality. Reliable presence and timely reporting are essential to station operations. Please ensure that you arrive for scheduled assignments on time and follow proper procedures when requesting leave or reporting absences.',
        'misconduct_memo' => 'MEMORANDUM\n\nTo: [Employee Name / Concerned Individual]\nFrom: [Your Name / Position]\nDate: [Insert Date]\nSubject: Notice of Inappropriate Behavior / Misconduct\n\nThis memorandum is issued to formally address a concern regarding your behavior observed on [date of incident] at [location or context].\n\nIt has been reported that you engaged in the following conduct:\n\n[Clearly describe the inappropriate behavior or misconduct. Be specific, factual, and objective.]\n\nSuch behavior is considered a violation of [company/school policies, code of conduct, or guidelines], particularly [cite specific rule if applicable].\n\nAll personnel are expected to maintain professionalism, respect, and compliance with established standards at all times. You are expected to:\n\n- Refrain from repeating such behavior\n- Demonstrate appropriate conduct moving forward\n- Comply with all organizational policies\n\nPlease be advised that any repetition of this behavior may result in further disciplinary action, which may include warning, suspension, or termination.\n\nYou are required to acknowledge receipt of this memorandum by signing below.\n\nAcknowledged by:\nSignature: ________________________\nName: ___________________________\nDate: ___________________________'
    ];

    return $templates[$warningTemplate] ?? $templates['standard_warning'];
}

function firenet_save_user_warning(PDO $pdo, int $userId, int $senderUserId, string $warningType, string $warningTemplate, string $message): int
{
    firenet_ensure_user_warning_table($pdo);

    $allowedTypes = ['warning', 'memo'];
    if (!in_array($warningType, $allowedTypes, true)) {
        $warningType = 'warning';
    }

    $allowedTemplates = ['standard_warning', 'final_warning', 'performance_memo', 'conduct_reminder', 'attendance_notice', 'misconduct_memo', 'custom'];
    if (!in_array($warningTemplate, $allowedTemplates, true)) {
        $warningTemplate = 'standard_warning';
    }

    if ($message === '' && $warningTemplate !== 'custom') {
        $message = firenet_warning_template_text($warningTemplate);
    }

    $stmt = $pdo->prepare('INSERT INTO user_warnings (user_id, sender_user_id, warning_type, warning_template, warning_message) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$userId, $senderUserId, $warningType, $warningTemplate, $message]);
    return (int) $pdo->lastInsertId();
}

function firenet_mail_ensure_min_schema(PDO $pdo): void
{
    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS station_mail_threads (
    thread_id INT PRIMARY KEY AUTO_INCREMENT,
    subject VARCHAR(255) NOT NULL,
    created_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_at DATETIME NULL,
    CONSTRAINT fk_station_mail_threads_user FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_station_mail_threads_last_message (last_message_at),
    INDEX idx_station_mail_threads_creator (created_by_user_id)
)
SQL);

    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS station_mail_messages (
    mail_id INT PRIMARY KEY AUTO_INCREMENT,
    thread_id INT NOT NULL,
    parent_mail_id INT NULL,
    sender_user_id INT NOT NULL,
    sender_station_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body LONGTEXT NOT NULL,
    mail_type ENUM('message', 'request', 'file_share') NOT NULL DEFAULT 'message',
    importance ENUM('normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
    request_files TINYINT(1) NOT NULL DEFAULT 0,
    is_draft TINYINT(1) NOT NULL DEFAULT 0,
    sent_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_station_mail_messages_thread FOREIGN KEY (thread_id) REFERENCES station_mail_threads(thread_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_messages_parent FOREIGN KEY (parent_mail_id) REFERENCES station_mail_messages(mail_id) ON DELETE SET NULL,
    CONSTRAINT fk_station_mail_messages_sender FOREIGN KEY (sender_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_messages_station FOREIGN KEY (sender_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    INDEX idx_station_mail_messages_thread (thread_id, mail_id)
)
SQL);

    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS station_mail_recipients (
    recipient_id INT PRIMARY KEY AUTO_INCREMENT,
    mail_id INT NOT NULL,
    recipient_user_id INT NULL,
    recipient_station_id INT NULL,
    recipient_type ENUM('user', 'station') NOT NULL,
    read_at DATETIME NULL,
    archived_at DATETIME NULL,
    deleted_at DATETIME NULL,
    starred_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_station_mail_recipients_mail FOREIGN KEY (mail_id) REFERENCES station_mail_messages(mail_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_recipients_user FOREIGN KEY (recipient_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_recipients_station FOREIGN KEY (recipient_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    UNIQUE KEY unique_station_mail_recipient (mail_id, recipient_type, recipient_user_id, recipient_station_id)
)
SQL);
}

function firenet_send_warning_mail(PDO $pdo, int $senderUserId, int $senderStationId, int $recipientUserId, string $warningType, string $message): void
{
    if ($senderUserId < 1 || $senderStationId < 1 || $recipientUserId < 1) {
        return;
    }

    firenet_mail_ensure_min_schema($pdo);

    $typeLabel = $warningType === 'memo' ? 'Memo' : 'Warning';
    $subject = '[ADMIN ' . strtoupper($typeLabel) . '] ' . $typeLabel . ' from Station Administration';
    $body = trim($message) !== ''
        ? ("This " . strtolower($typeLabel) . " was issued by station administration.\n\n" . trim($message))
        : ('This ' . strtolower($typeLabel) . ' was issued by station administration. Please review this notice in full.');

    $threadStmt = $pdo->prepare('INSERT INTO station_mail_threads (subject, created_by_user_id, last_message_at) VALUES (?, ?, NOW())');
    $threadStmt->execute([$subject, $senderUserId]);
    $threadId = (int) $pdo->lastInsertId();
    if ($threadId < 1) {
        return;
    }

    $messageStmt = $pdo->prepare('
        INSERT INTO station_mail_messages (
            thread_id, parent_mail_id, sender_user_id, sender_station_id,
            subject, body, mail_type, importance, request_files, is_draft, sent_at
        ) VALUES (?, NULL, ?, ?, ?, ?, "message", "high", 0, 0, NOW())
    ');
    $messageStmt->execute([$threadId, $senderUserId, $senderStationId, $subject, $body]);

    $mailId = (int) $pdo->lastInsertId();
    if ($mailId < 1) {
        return;
    }

    $recipientStmt = $pdo->prepare('INSERT INTO station_mail_recipients (mail_id, recipient_type, recipient_user_id) VALUES (?, "user", ?)');
    $recipientStmt->execute([$mailId, $recipientUserId]);
}

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

function firenet_user_settings_column_exists(PDO $pdo, string $columnName): bool
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_settings' AND COLUMN_NAME = ?");
    $stmt->execute([$columnName]);
    return (int) ($stmt->fetchColumn() ?: 0) > 0;
}

function firenet_ensure_user_settings_table(PDO $pdo): void
{
    if (!firenet_user_settings_table_exists($pdo)) {
        $pdo->exec('CREATE TABLE IF NOT EXISTS user_settings (
        user_setting_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        compact_mode TINYINT(1) NOT NULL DEFAULT 0,
        reduce_motion TINYINT(1) NOT NULL DEFAULT 0,
        dark_mode TINYINT(1) NOT NULL DEFAULT 0,
        security_alerts TINYINT(1) NOT NULL DEFAULT 1,
        hide_sensitive TINYINT(1) NOT NULL DEFAULT 0,
        auto_logout_minutes INT NOT NULL DEFAULT 30,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_settings (user_id)
    )');
        return;
    }

    if (!firenet_user_settings_column_exists($pdo, 'compact_mode')) {
        $pdo->exec('ALTER TABLE user_settings ADD COLUMN compact_mode TINYINT(1) NOT NULL DEFAULT 0 AFTER user_id');
    }
    if (!firenet_user_settings_column_exists($pdo, 'reduce_motion')) {
        $pdo->exec('ALTER TABLE user_settings ADD COLUMN reduce_motion TINYINT(1) NOT NULL DEFAULT 0 AFTER compact_mode');
    }
    if (!firenet_user_settings_column_exists($pdo, 'dark_mode')) {
        $pdo->exec('ALTER TABLE user_settings ADD COLUMN dark_mode TINYINT(1) NOT NULL DEFAULT 0 AFTER reduce_motion');
    }
    if (!firenet_user_settings_column_exists($pdo, 'security_alerts')) {
        $pdo->exec('ALTER TABLE user_settings ADD COLUMN security_alerts TINYINT(1) NOT NULL DEFAULT 1 AFTER dark_mode');
    }
    if (!firenet_user_settings_column_exists($pdo, 'hide_sensitive')) {
        $pdo->exec('ALTER TABLE user_settings ADD COLUMN hide_sensitive TINYINT(1) NOT NULL DEFAULT 0 AFTER security_alerts');
    }
    if (!firenet_user_settings_column_exists($pdo, 'auto_logout_minutes')) {
        $pdo->exec('ALTER TABLE user_settings ADD COLUMN auto_logout_minutes INT NOT NULL DEFAULT 30 AFTER hide_sensitive');
    }
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

function firenet_save_user_settings(PDO $pdo, int $userId, array $patch): array
{
    firenet_ensure_user_settings_table($pdo);

    $current = firenet_load_user_settings($pdo, $userId);
    $merged = array_merge($current, array_intersect_key($patch, $current));
    if (isset($patch['autoLogoutMinutes'])) {
        $merged['autoLogoutMinutes'] = max(0, (int) $patch['autoLogoutMinutes']);
    }

    $upsert = $pdo->prepare('INSERT INTO user_settings (user_id, security_alerts, hide_sensitive, auto_logout_minutes)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            security_alerts = VALUES(security_alerts),
            hide_sensitive = VALUES(hide_sensitive),
            auto_logout_minutes = VALUES(auto_logout_minutes),
            updated_at = CURRENT_TIMESTAMP');
    $upsert->execute([
        $userId,
        $merged['securityAlerts'] ? 1 : 0,
        $merged['hideSensitive'] ? 1 : 0,
        $merged['autoLogoutMinutes']
    ]);

    return firenet_load_user_settings($pdo, $userId);
}

function firenet_upsert_station_aor_zone(PDO $pdo, int $stationId, string $stationName, float $centerLat, float $centerLng, float $radiusKm): void
{
    $zoneName = trim($stationName) !== '' ? ($stationName . ' AOR') : ('Station ' . $stationId . ' AOR');
    $shapeType = 'circle';
    $safeRadiusKm = $radiusKm > 0 ? $radiusKm : 2.5;

    $stmt = $pdo->prepare('
        INSERT INTO station_aor_zones (station_id, zone_name, shape_type, center_latitude, center_longitude, radius_km, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
            zone_name = VALUES(zone_name),
            shape_type = VALUES(shape_type),
            center_latitude = VALUES(center_latitude),
            center_longitude = VALUES(center_longitude),
            radius_km = VALUES(radius_km),
            is_active = 1,
            updated_at = CURRENT_TIMESTAMP
    ');
    $stmt->execute([$stationId, $zoneName, $shapeType, $centerLat, $centerLng, $safeRadiusKm]);
}

function firenet_users_bootstrap(PDO $pdo, int $currentStationId): array
{
    global $currentRole;

    $roleFilterSql = $currentRole === 'admin' ? ' WHERE LOWER(role_name) = "user"' : '';
    $roles = $pdo->query('SELECT role_id, role_name, description FROM roles' . $roleFilterSql . ' ORDER BY role_id ASC')->fetchAll(PDO::FETCH_ASSOC);

    $stationSelectSql = '
        SELECT
            s.station_id,
            s.station_name,
            s.station_code,
            s.location,
            s.latitude,
            s.longitude,
            s.status,
            z.zone_name AS aor_zone_name,
            z.shape_type AS aor_shape_type,
            z.center_latitude AS aor_center_latitude,
            z.center_longitude AS aor_center_longitude,
            z.radius_km AS aor_radius_km
        FROM stations s
        LEFT JOIN station_aor_zones z ON z.station_id = s.station_id AND z.is_active = 1
    ';

    if ($currentRole === 'superadmin') {
        $stationStmt = $pdo->query($stationSelectSql . ' ORDER BY s.station_name ASC');
        $stations = $stationStmt ? $stationStmt->fetchAll(PDO::FETCH_ASSOC) : [];
    } else {
        $stationStmt = $pdo->prepare($stationSelectSql . ' WHERE s.station_id = ? LIMIT 1');
        $stationStmt->execute([$currentStationId]);
        $stations = $stationStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    $positions = $pdo->query('SELECT position_id, position_code, position_name FROM positions ORDER BY position_name ASC')->fetchAll(PDO::FETCH_ASSOC);

    firenet_ensure_user_settings_table($pdo);
    firenet_ensure_user_warning_table($pdo);

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

    return [
        'currentStation' => [
            'stationId' => $currentStationId,
            'stationName' => ''
        ],
        'roles' => array_map(static function (array $row): array {
            return [
                'roleId' => (int) ($row['role_id'] ?? 0),
                'roleName' => (string) ($row['role_name'] ?? ''),
                'description' => (string) ($row['description'] ?? '')
            ];
        }, $roles),
        'stations' => array_map(static function (array $row): array {
            return [
                'stationId' => (int) ($row['station_id'] ?? 0),
                'stationName' => (string) ($row['station_name'] ?? ''),
                'stationCode' => (string) ($row['station_code'] ?? ''),
                'location' => (string) ($row['location'] ?? ''),
                'latitude' => isset($row['latitude']) ? (float) $row['latitude'] : null,
                'longitude' => isset($row['longitude']) ? (float) $row['longitude'] : null,
                'status' => (string) ($row['status'] ?? 'active'),
                'aorZoneName' => (string) ($row['aor_zone_name'] ?? ''),
                'aorShapeType' => (string) ($row['aor_shape_type'] ?? 'circle'),
                'aorCenterLat' => isset($row['aor_center_latitude']) ? (float) $row['aor_center_latitude'] : null,
                'aorCenterLng' => isset($row['aor_center_longitude']) ? (float) $row['aor_center_longitude'] : null,
                'aorRadiusKm' => isset($row['aor_radius_km']) ? (float) $row['aor_radius_km'] : null
            ];
        }, $stations),
        'positions' => array_map(static function (array $row): array {
            return [
                'positionId' => (int) ($row['position_id'] ?? 0),
                'positionCode' => (string) ($row['position_code'] ?? ''),
                'positionName' => (string) ($row['position_name'] ?? '')
            ];
        }, $positions),
        'users' => array_map(static function (array $row): array {
            return [
                'userId' => (int) ($row['user_id'] ?? 0),
                'username' => (string) ($row['username'] ?? ''),
                'email' => (string) ($row['email'] ?? ''),
                'status' => (string) ($row['status'] ?? 'active'),
                'stationId' => (int) ($row['station_id'] ?? 0),
                'stationName' => (string) ($row['station_name'] ?? ''),
                'stationCode' => (string) ($row['station_code'] ?? ''),
                'positionId' => (int) ($row['position_id'] ?? 0),
                'positionName' => (string) ($row['position_name'] ?? ''),
                'roleId' => (int) ($row['role_id'] ?? 0),
                'roleName' => (string) ($row['role_name'] ?? ''),
                'warningCount' => max(0, (int) ($row['warning_count'] ?? 0)),
                'settings' => [
                    'securityAlerts' => ((int) ($row['security_alerts'] ?? 1)) === 1,
                    'hideSensitive' => ((int) ($row['hide_sensitive'] ?? 0)) === 1,
                    'autoLogoutMinutes' => max(0, (int) ($row['auto_logout_minutes'] ?? 30))
                ],
                'createdAt' => (string) ($row['created_at'] ?? '')
            ];
        }, $usersStmt->fetchAll(PDO::FETCH_ASSOC))
    ];
}

try {
    $pdo = firenet_get_pdo();

    if ($action === 'bootstrap') {
        $bootstrap = firenet_users_bootstrap($pdo, $currentStationId);
        $stationStmt = $pdo->prepare('SELECT station_name FROM stations WHERE station_id = ? LIMIT 1');
        $stationStmt->execute([$currentStationId]);
        $bootstrap['currentStation']['stationName'] = (string) ($stationStmt->fetchColumn() ?: '');

        echo json_encode(['ok' => true, 'data' => $bootstrap], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    $input = array_merge($_POST, json_decode((string) file_get_contents('php://input'), true) ?: []);
    $userId = (int) ($input['userId'] ?? 0);
    $username = trim((string) ($input['username'] ?? ''));
    $email = trim((string) ($input['email'] ?? ''));
    $password = (string) ($input['password'] ?? '');
    $roleId = (int) ($input['roleId'] ?? 0);
    $stationId = $currentRole === 'superadmin'
        ? (int) ($input['stationId'] ?? 0)
        : $currentStationId;
    $positionId = trim((string) ($input['positionId'] ?? '')) !== '' ? (int) $input['positionId'] : null;
    $status = strtolower(trim((string) ($input['status'] ?? 'active')));

    if ($action === 'create_station') {
        if ($currentRole !== 'superadmin') {
            firenet_users_fail('Only superadmins can create new substations.', 403);
        }

        $stationName = trim((string) ($input['stationName'] ?? $input['barangayName'] ?? ''));
        $stationCode = strtoupper(trim((string) ($input['stationCode'] ?? '')));
        $location = trim((string) ($input['location'] ?? $input['address'] ?? ''));
        $latitude = (float) ($input['latitude'] ?? 0);
        $longitude = (float) ($input['longitude'] ?? 0);
        $stationStatus = strtolower(trim((string) ($input['stationStatus'] ?? 'active')));
        $aorRadiusKm = (float) ($input['aorRadiusKm'] ?? 2.5);

        if ($stationName === '') {
            firenet_users_fail('Substation name is required.', 422);
        }

        if ($stationCode === '') {
            $letters = preg_replace('/[^A-Z0-9]/', '', strtoupper((string) preg_replace('/[^A-Za-z0-9 ]/', '', $stationName)));
            $stationCode = substr($letters, 0, 6);
            if ($stationCode === '') {
                $stationCode = 'BRGY' . date('His');
            }
        }

        if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
            firenet_users_fail('Please pin a valid map location for the substation.', 422);
        }

        if (!in_array($stationStatus, ['active', 'inactive'], true)) {
            $stationStatus = 'active';
        }
        if ($aorRadiusKm <= 0) {
            $aorRadiusKm = 2.5;
        }

        $insertStation = $pdo->prepare('INSERT INTO stations (station_name, station_code, location, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?)');
        try {
            $insertStation->execute([$stationName, $stationCode, $location, $latitude, $longitude, $stationStatus]);
        } catch (Throwable $e) {
            firenet_users_fail('Unable to create substation. Station name/code may already exist.', 409);
        }

        $newStationId = (int) $pdo->lastInsertId();
        if ($newStationId < 1) {
            firenet_users_fail('Unable to create substation at this time.', 500);
        }

        firenet_upsert_station_aor_zone($pdo, $newStationId, $stationName, $latitude, $longitude, $aorRadiusKm);

        $createAdmin = firenet_users_to_bool($input['createAdmin'] ?? false);
        if ($createAdmin) {
            $adminUsername = trim((string) ($input['adminUsername'] ?? ''));
            $adminEmail = trim((string) ($input['adminEmail'] ?? ''));
            $adminPassword = (string) ($input['adminPassword'] ?? '');
            $adminStatus = strtolower(trim((string) ($input['adminStatus'] ?? 'active')));
            if (!in_array($adminStatus, ['active', 'inactive'], true)) {
                $adminStatus = 'active';
            }

            if ($adminUsername === '' || $adminEmail === '' || trim($adminPassword) === '') {
                firenet_users_fail('Admin username, email, and password are required when creating a substation admin.', 422);
            }

            $adminRoleStmt = $pdo->query("SELECT role_id FROM roles WHERE LOWER(role_name) = 'admin' LIMIT 1");
            $adminRoleId = (int) ($adminRoleStmt ? $adminRoleStmt->fetchColumn() : 0);
            if ($adminRoleId < 1) {
                firenet_users_fail('Admin role is not configured.', 500);
            }

            $createAdminStmt = $pdo->prepare('INSERT INTO users (station_id, username, password, email, role_id, position_id, status) VALUES (?, ?, ?, ?, ?, NULL, ?)');
            try {
                $createAdminStmt->execute([
                    $newStationId,
                    $adminUsername,
                    firenet_users_hash_password($adminPassword),
                    $adminEmail,
                    $adminRoleId,
                    $adminStatus
                ]);
            } catch (Throwable $e) {
                firenet_users_fail('Barangay created but admin account failed. Username/email may already exist in this barangay.', 409);
            }

            $newAdminUserId = (int) $pdo->lastInsertId();
            if ($newAdminUserId > 0) {
                firenet_save_user_settings($pdo, $newAdminUserId, [
                    'securityAlerts' => true,
                    'hideSensitive' => false,
                    'autoLogoutMinutes' => 30
                ]);
            }
        }

        echo json_encode([
            'ok' => true,
            'message' => $createAdmin
                ? 'Barangay and admin account created successfully.'
                : 'Barangay created successfully.',
            'data' => [
                'stationId' => $newStationId,
                'stationName' => $stationName,
                'stationCode' => $stationCode,
                'location' => $location,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'status' => $stationStatus,
                'aorRadiusKm' => $aorRadiusKm,
                'aorCenterLat' => $latitude,
                'aorCenterLng' => $longitude
            ]
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'update_station') {
        if ($currentRole !== 'superadmin') {
            firenet_users_fail('Only superadmins can edit substations.', 403);
        }

        $editStationId = (int) ($input['stationId'] ?? 0);
        $stationName = trim((string) ($input['stationName'] ?? ''));
        $stationCode = strtoupper(trim((string) ($input['stationCode'] ?? '')));
        $location = trim((string) ($input['location'] ?? ''));
        $latitude = (float) ($input['latitude'] ?? 0);
        $longitude = (float) ($input['longitude'] ?? 0);
        $stationStatus = strtolower(trim((string) ($input['stationStatus'] ?? 'active')));
        $aorRadiusKm = (float) ($input['aorRadiusKm'] ?? 2.5);

        if ($editStationId < 1) {
            firenet_users_fail('Substation not found.', 404);
        }
        if ($stationName === '') {
            firenet_users_fail('Substation name is required.', 422);
        }
        if ($stationCode === '') {
            firenet_users_fail('Station code is required.', 422);
        }
        if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
            firenet_users_fail('Please pin a valid map location for the substation.', 422);
        }
        if (!in_array($stationStatus, ['active', 'inactive'], true)) {
            $stationStatus = 'active';
        }
        if ($aorRadiusKm <= 0) {
            $aorRadiusKm = 2.5;
        }

        $updateStation = $pdo->prepare('UPDATE stations SET station_name = ?, station_code = ?, location = ?, latitude = ?, longitude = ?, status = ? WHERE station_id = ? LIMIT 1');
        try {
            $updateStation->execute([$stationName, $stationCode, $location, $latitude, $longitude, $stationStatus, $editStationId]);
        } catch (Throwable $e) {
            firenet_users_fail('Unable to update substation. Station name/code may already exist.', 409);
        }

        firenet_upsert_station_aor_zone($pdo, $editStationId, $stationName, $latitude, $longitude, $aorRadiusKm);

        echo json_encode([
            'ok' => true,
            'message' => 'Substation updated successfully.',
            'data' => [
                'stationId' => $editStationId,
                'stationName' => $stationName,
                'stationCode' => $stationCode,
                'location' => $location,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'status' => $stationStatus,
                'aorRadiusKm' => $aorRadiusKm,
                'aorCenterLat' => $latitude,
                'aorCenterLng' => $longitude
            ]
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action !== 'send_warning' && ($username === '' || $email === '' || $roleId < 1 || $stationId < 1)) {
        firenet_users_fail('Username, email, role, and station are required.', 422);
    }

    if ($action === 'create' && trim($password) === '') {
        firenet_users_fail('Password is required when creating a new user.', 422);
    }

    if (!in_array($status, ['active', 'inactive'], true)) {
        $status = 'active';
    }

    if ($action === 'send_warning') {
        $message = trim((string) ($input['message'] ?? ''));
        $warningType = strtolower(trim((string) ($input['warningType'] ?? 'warning')));
        $warningTemplate = strtolower(trim((string) ($input['warningTemplate'] ?? 'standard_warning')));

        if ($message === '' && $warningTemplate === 'custom') {
            firenet_users_fail('Warning or memo message cannot be empty.', 422);
        }

        $targetStmt = $pdo->prepare('SELECT station_id, r.role_name FROM users u JOIN roles r ON r.role_id = u.role_id WHERE u.user_id = ? LIMIT 1');
        $targetStmt->execute([$userId]);
        $targetRow = $targetStmt->fetch(PDO::FETCH_ASSOC);
        if (!$targetRow) {
            firenet_users_fail('Target user not found.', 404);
        }

        $targetStationId = (int) ($targetRow['station_id'] ?? 0);
        $targetRoleName = strtolower((string) ($targetRow['role_name'] ?? 'user'));

        if ($currentRole === 'admin' && $targetStationId !== $currentStationId) {
            firenet_users_fail('You can only send notices to users in your own station.', 403);
        }

        if ($currentRole === 'admin' && $targetRoleName !== 'user') {
            firenet_users_fail('Station admins may only send warnings or memos to regular user accounts.', 403);
        }

        firenet_save_user_warning($pdo, $userId, $currentUserId, $warningType, $warningTemplate, $message);
        firenet_send_warning_mail($pdo, $currentUserId, $currentStationId, $userId, $warningType, $message);

        echo json_encode(['ok' => true, 'message' => 'Warning/memo sent successfully and delivered to the user inbox.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'delete') {
        if ($userId < 1) {
            firenet_users_fail('User not found.', 404);
        }

        $targetStmt = $pdo->prepare('SELECT u.station_id, r.role_name, u.username FROM users u JOIN roles r ON r.role_id = u.role_id WHERE u.user_id = ? LIMIT 1');
        $targetStmt->execute([$userId]);
        $targetRow = $targetStmt->fetch(PDO::FETCH_ASSOC);
        if (!$targetRow) {
            firenet_users_fail('User not found.', 404);
        }

        $targetStationId = (int) ($targetRow['station_id'] ?? 0);
        $targetRoleName = strtolower((string) ($targetRow['role_name'] ?? 'user'));
        $targetUsername = (string) ($targetRow['username'] ?? 'user');

        if ($currentRole === 'admin') {
            if ($targetStationId !== $currentStationId) {
                firenet_users_fail('You can only delete users in your own station.', 403);
            }
            if ($targetRoleName !== 'user') {
                firenet_users_fail('Station admins may only delete regular user accounts.', 403);
            }
        } elseif ($currentRole !== 'superadmin') {
            firenet_users_fail('You are not allowed to delete users.', 403);
        }

        if ($userId === $currentUserId) {
            firenet_users_fail('You cannot delete your own account.', 403);
        }

        $deleteStmt = $pdo->prepare('DELETE FROM users WHERE user_id = ? LIMIT 1');
        $deleteStmt->execute([$userId]);
        if ($deleteStmt->rowCount() < 1) {
            firenet_users_fail('Unable to delete user.', 500);
        }

        echo json_encode([
            'ok' => true,
            'message' => 'User "' . $targetUsername . '" deleted successfully.'
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    $roleStmt = $pdo->prepare('SELECT role_name FROM roles WHERE role_id = ? LIMIT 1');
    $roleStmt->execute([$roleId]);
    $roleName = strtolower((string) ($roleStmt->fetchColumn() ?: 'user'));
    if ($roleName === '') {
        firenet_users_fail('Invalid role selected.', 422);
    }

    if (in_array($roleName, ['admin', 'superadmin'], true)) {
        $positionId = null;
    }

    if ($currentRole === 'admin' && $roleName !== 'user') {
        firenet_users_fail('Station admins may only create or edit regular user accounts.', 403);
    }

    if ($roleName === 'superadmin' && $currentRole !== 'superadmin') {
        firenet_users_fail('Station admins cannot create or edit superadmin accounts.', 403);
    }

    if ($action === 'create') {
        $stmt = $pdo->prepare('INSERT INTO users (station_id, username, password, email, role_id, position_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$stationId, $username, firenet_users_hash_password($password), $email, $roleId, $positionId, $status]);
        $newUserId = (int) $pdo->lastInsertId();

        if ($newUserId > 0) {
            firenet_save_user_settings($pdo, $newUserId, [
                'securityAlerts' => isset($input['securityAlerts']) ? filter_var($input['securityAlerts'], FILTER_VALIDATE_BOOLEAN) : true,
                'hideSensitive' => isset($input['hideSensitive']) ? filter_var($input['hideSensitive'], FILTER_VALIDATE_BOOLEAN) : false,
                'autoLogoutMinutes' => isset($input['autoLogoutMinutes']) ? (int) $input['autoLogoutMinutes'] : 30
            ]);
        }

        echo json_encode(['ok' => true, 'message' => 'User created successfully.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'update') {
        if ($userId < 1) {
            firenet_users_fail('Invalid user selected.', 422);
        }

        $targetStmt = $pdo->prepare('SELECT station_id, r.role_name FROM users u JOIN roles r ON r.role_id = u.role_id WHERE u.user_id = ? LIMIT 1');
        $targetStmt->execute([$userId]);
        $targetRow = $targetStmt->fetch(PDO::FETCH_ASSOC);
        $targetStationId = (int) ($targetRow['station_id'] ?? 0);
        $targetRoleName = strtolower((string) ($targetRow['role_name'] ?? 'user'));

        if ($currentRole === 'admin' && $targetStationId !== $currentStationId) {
            firenet_users_fail('You can only manage accounts from your own station.', 403);
        }

        if ($currentRole === 'admin' && $targetRoleName !== 'user') {
            firenet_users_fail('Station admins may only manage regular user accounts.', 403);
        }

        if ($currentRole === 'admin' && $roleName !== 'user') {
            firenet_users_fail('Station admins may only assign the regular user role.', 403);
        }

        $updateSql = 'UPDATE users SET station_id = ?, username = ?, email = ?, role_id = ?, position_id = ?, status = ?';
        $params = [$stationId, $username, $email, $roleId, $positionId, $status];
        if (trim($password) !== '') {
            $updateSql .= ', password = ?';
            $params[] = firenet_users_hash_password($password);
        }
        $updateSql .= ' WHERE user_id = ? LIMIT 1';
        $params[] = $userId;

        $stmt = $pdo->prepare($updateSql);
        $stmt->execute($params);

        firenet_save_user_settings($pdo, $userId, [
            'securityAlerts' => isset($input['securityAlerts']) ? filter_var($input['securityAlerts'], FILTER_VALIDATE_BOOLEAN) : true,
            'hideSensitive' => isset($input['hideSensitive']) ? filter_var($input['hideSensitive'], FILTER_VALIDATE_BOOLEAN) : false,
            'autoLogoutMinutes' => isset($input['autoLogoutMinutes']) ? (int) $input['autoLogoutMinutes'] : 30
        ]);

        echo json_encode(['ok' => true, 'message' => 'User updated successfully.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    firenet_users_fail('Unsupported action.', 405);
} catch (Throwable $error) {
    // Log error for debugging
    error_log('Users API Error: ' . $error->getMessage() . ' at ' . $error->getFile() . ':' . $error->getLine());
    error_log('Stack: ' . $error->getTraceAsString());
    firenet_users_fail('User management service unavailable.', 500);
}