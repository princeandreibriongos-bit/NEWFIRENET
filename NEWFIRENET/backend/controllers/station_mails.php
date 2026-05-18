<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();
firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

$sessionUser = $_SESSION['user'] ?? [];
$currentUserId = (int) ($sessionUser['user_id'] ?? 0);
$currentStationId = (int) ($sessionUser['station_id'] ?? 0);
$currentRole = strtolower((string) ($sessionUser['role'] ?? 'user'));
$action = strtolower(trim((string) ($_GET['action'] ?? $_POST['action'] ?? 'bootstrap')));

if ($currentUserId < 1 || $currentStationId < 1) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Invalid mail context']);
    exit;
}

function firenet_mail_fail(string $message, int $status = 400): void
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'message' => $message]);
    exit;
}

function firenet_mail_ensure_schema(PDO $pdo): void
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
    INDEX idx_station_mail_messages_thread (thread_id, mail_id),
    INDEX idx_station_mail_messages_sender (sender_user_id, sent_at),
    INDEX idx_station_mail_messages_station (sender_station_id, sent_at),
    INDEX idx_station_mail_messages_draft (sender_user_id, is_draft, updated_at)
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
    UNIQUE KEY unique_station_mail_recipient (mail_id, recipient_type, recipient_user_id, recipient_station_id),
    INDEX idx_station_mail_recipients_user_folder (recipient_user_id, read_at, archived_at, deleted_at),
    INDEX idx_station_mail_recipients_station_folder (recipient_station_id, read_at, archived_at, deleted_at)
)
SQL);

    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS station_mail_attachments (
    attachment_id INT PRIMARY KEY AUTO_INCREMENT,
    mail_id INT NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    file_size_bytes INT UNSIGNED NOT NULL,
    uploaded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_station_mail_attachments_mail FOREIGN KEY (mail_id) REFERENCES station_mail_messages(mail_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_attachments_user FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_station_mail_attachment_file (stored_file_name),
    INDEX idx_station_mail_attachments_mail (mail_id)
)
SQL);

    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS station_mail_request_routes (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    thread_id INT NOT NULL,
    request_mail_id INT NOT NULL,
    request_user_id INT NOT NULL,
    origin_station_id INT NOT NULL,
    target_station_id INT NOT NULL,
    status ENUM('pending_origin_review', 'approved', 'rejected', 'forwarded_to_target', 'routed_to_user', 'file_returned_to_coml', 'returned_to_origin', 'completed') NOT NULL DEFAULT 'pending_origin_review',
    edited_subject VARCHAR(255) NULL,
    edited_body LONGTEXT NULL,
    origin_reviewed_by INT NULL,
    origin_reviewed_at DATETIME NULL,
    origin_review_notes LONGTEXT NULL,
    forwarded_mail_id INT NULL,
    forwarded_at DATETIME NULL,
    target_reviewed_by INT NULL,
    target_reviewed_at DATETIME NULL,
    target_review_notes LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_station_mail_request_routes_thread FOREIGN KEY (thread_id) REFERENCES station_mail_threads(thread_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_mail FOREIGN KEY (request_mail_id) REFERENCES station_mail_messages(mail_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_user FOREIGN KEY (request_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_origin_station FOREIGN KEY (origin_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_target_station FOREIGN KEY (target_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_origin_reviewer FOREIGN KEY (origin_reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_station_mail_request_routes_target_reviewer FOREIGN KEY (target_reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_station_mail_request_route_thread (thread_id),
    INDEX idx_station_mail_request_routes_status (status, created_at),
    INDEX idx_station_mail_request_routes_origin_station (origin_station_id, status),
    INDEX idx_station_mail_request_routes_target_station (target_station_id, status)
)
SQL);

    try {
        $pdo->exec(<<<'SQL'
ALTER TABLE station_mail_request_routes
    MODIFY status ENUM('pending_origin_review', 'approved', 'rejected', 'forwarded_to_target', 'routed_to_user', 'file_returned_to_coml', 'returned_to_origin', 'completed') NOT NULL DEFAULT 'pending_origin_review'
SQL);
    } catch (Throwable $error) {
        $message = $error->getMessage();
        if (strpos($message, 'station_mail_request_routes') !== false || strpos($message, '1932') !== false) {
            firenet_mail_recreate_request_routes_table($pdo);
        } else {
            throw $error;
        }
    }

    firenet_mail_ensure_operational_extras($pdo);
}

function firenet_mail_app_config(): array
{
    $configFile = __DIR__ . '/../../config/config.php';
    if (!is_file($configFile)) {
        return [];
    }

    $loaded = require $configFile;
    return is_array($loaded) ? $loaded : [];
}

function firenet_mail_table_column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?');
    $stmt->execute([$table, $column]);
    return ((int) ($stmt->fetchColumn() ?: 0)) > 0;
}

function firenet_mail_recreate_request_routes_table(PDO $pdo): void
{
    $pdo->exec(<<<'SQL'
DROP TABLE IF EXISTS station_mail_request_routes
SQL);

    $pdo->exec(<<<'SQL'
CREATE TABLE station_mail_request_routes (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    thread_id INT NOT NULL,
    request_mail_id INT NOT NULL,
    request_user_id INT NOT NULL,
    origin_station_id INT NOT NULL,
    target_station_id INT NOT NULL,
    status ENUM('pending_origin_review', 'approved', 'rejected', 'forwarded_to_target', 'routed_to_user', 'file_returned_to_coml', 'returned_to_origin', 'completed') NOT NULL DEFAULT 'pending_origin_review',
    edited_subject VARCHAR(255) NULL,
    edited_body LONGTEXT NULL,
    origin_reviewed_by INT NULL,
    origin_reviewed_at DATETIME NULL,
    origin_review_notes LONGTEXT NULL,
    forwarded_mail_id INT NULL,
    forwarded_at DATETIME NULL,
    target_reviewed_by INT NULL,
    target_reviewed_at DATETIME NULL,
    target_review_notes LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_station_mail_request_routes_thread FOREIGN KEY (thread_id) REFERENCES station_mail_threads(thread_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_mail FOREIGN KEY (request_mail_id) REFERENCES station_mail_messages(mail_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_user FOREIGN KEY (request_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_origin_station FOREIGN KEY (origin_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_target_station FOREIGN KEY (target_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_origin_reviewer FOREIGN KEY (origin_reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_station_mail_request_routes_target_reviewer FOREIGN KEY (target_reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_station_mail_request_route_thread (thread_id),
    INDEX idx_station_mail_request_routes_status (status, created_at),
    INDEX idx_station_mail_request_routes_origin_station (origin_station_id, status),
    INDEX idx_station_mail_request_routes_target_station (target_station_id, status)
)
SQL);
}

function firenet_mail_ensure_operational_extras(PDO $pdo): void
{
    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS station_mail_operational_audit (
    audit_id INT PRIMARY KEY AUTO_INCREMENT,
    thread_id INT NOT NULL,
    route_id INT NULL,
    actor_user_id INT NOT NULL,
    actor_station_id INT NOT NULL,
    action VARCHAR(80) NOT NULL,
    detail_json LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_operational_audit_thread (thread_id, created_at),
    INDEX idx_operational_audit_route (route_id, created_at)
)
SQL);

    $routeCols = [
        'is_confidential' => 'TINYINT(1) NOT NULL DEFAULT 0',
        'target_confidential_confirmed' => 'TINYINT(1) NOT NULL DEFAULT 0',
        'released_access_mode' => 'VARCHAR(16) NULL',
        'confidential_acknowledged_at' => 'DATETIME NULL',
    ];
    foreach ($routeCols as $col => $definition) {
        if (!firenet_mail_table_column_exists($pdo, 'station_mail_request_routes', $col)) {
            $pdo->exec('ALTER TABLE station_mail_request_routes ADD COLUMN `' . $col . '` ' . $definition);
        }
    }
}

function firenet_mail_cloudinary_section(array $appConfig): array
{
    $cloud = $appConfig['cloudinary'] ?? [];
    return is_array($cloud) ? $cloud : [];
}

function firenet_mail_orgmail_base_folder(array $cloudinary): string
{
    $base = trim((string) ($cloudinary['orgmail_folder'] ?? 'firenet/orgmail'));
    return $base === '' ? 'firenet/orgmail' : rtrim($base, '/');
}

function firenet_mail_orgmail_station_folder(string $stationCode, array $cloudinary): string
{
    $stationCode = trim($stationCode);
    if ($stationCode === '') {
        return firenet_mail_orgmail_base_folder($cloudinary);
    }

    return firenet_mail_orgmail_base_folder($cloudinary) . '/' . $stationCode;
}

function firenet_mail_orgmail_cloud_name(array $cloudinary): string
{
    return trim((string) ($cloudinary['cloud_name'] ?? ''));
}

function firenet_mail_orgmail_url_matches_station(string $url, string $stationCode, string $expectedCloudName): bool
{
    $url = trim($url);
    $stationCode = trim($stationCode);
    if ($url === '' || $stationCode === '' || !preg_match('#^https?://#i', $url)) {
        return false;
    }

    $parts = parse_url($url);
    if (!is_array($parts) || empty($parts['host'])) {
        return false;
    }

    $host = strtolower((string) $parts['host']);
    if ($host !== 'res.cloudinary.com') {
        return false;
    }

    $path = (string) ($parts['path'] ?? '');
    if ($path === '') {
        return false;
    }

    if ($expectedCloudName !== '') {
        $needle = '/' . $expectedCloudName . '/';
        if (stripos($path, $needle) === false) {
            return false;
        }
    }

    $marker = '/' . $stationCode . '/';
    return stripos($path, $marker) !== false;
}

function firenet_mail_orgmail_require_url_for_station(string $url, string $stationCode): void
{
    $cfg = firenet_mail_cloudinary_section(firenet_mail_app_config());
    $cloudName = firenet_mail_orgmail_cloud_name($cfg);
    if ($cloudName === '') {
        firenet_mail_fail('Cloudinary is not configured for organizational mail.', 503);
    }

    if (!firenet_mail_orgmail_url_matches_station($url, $stationCode, $cloudName)) {
        firenet_mail_fail('Operational attachments must use a Cloudinary file inside this station\'s folder (' . firenet_mail_orgmail_station_folder($stationCode, $cfg) . ').', 422);
    }
}

function firenet_mail_orgmail_require_url_for_origin_or_target(string $url, string $originStationCode, string $targetStationCode): void
{
    $cfg = firenet_mail_cloudinary_section(firenet_mail_app_config());
    $cloudName = firenet_mail_orgmail_cloud_name($cfg);
    if ($cloudName === '') {
        firenet_mail_fail('Cloudinary is not configured for organizational mail.', 503);
    }

    if (firenet_mail_orgmail_url_matches_station($url, $originStationCode, $cloudName)) {
        return;
    }

    if (firenet_mail_orgmail_url_matches_station($url, $targetStationCode, $cloudName)) {
        return;
    }

    firenet_mail_fail('The file URL must be hosted in either the origin or target station Cloudinary folder.', 422);
}

function firenet_mail_cloudinary_signature(array $params, string $apiSecret): string
{
    ksort($params);
    $pairs = [];
    foreach ($params as $key => $value) {
        $pairs[] = $key . '=' . $value;
    }

    return sha1(implode('&', $pairs) . $apiSecret);
}

function firenet_mail_orgmail_upload_signed(string $tmpPath, string $mime, string $stationCode): string
{
    if (!function_exists('curl_init')) {
        firenet_mail_fail('Cloudinary upload requires PHP cURL.', 500);
    }

    $app = firenet_mail_app_config();
    $cloudinary = firenet_mail_cloudinary_section($app);
    if (empty($cloudinary['enabled'])) {
        firenet_mail_fail('Cloudinary uploads are disabled.', 503);
    }

    $cloudName = firenet_mail_orgmail_cloud_name($cloudinary);
    $apiKey = trim((string) ($cloudinary['api_key'] ?? ''));
    $apiSecret = trim((string) ($cloudinary['api_secret'] ?? ''));
    if ($cloudName === '' || $apiKey === '' || $apiSecret === '') {
        firenet_mail_fail('Cloudinary credentials are incomplete for organizational uploads.', 503);
    }

    $folder = firenet_mail_orgmail_station_folder($stationCode, $cloudinary);
    $endpoint = 'https://api.cloudinary.com/v1_1/' . rawurlencode($cloudName) . '/auto/upload';
    $timestamp = time();
    $signParams = [
        'folder' => $folder,
        'timestamp' => $timestamp,
    ];

    $postFields = [
        'file' => new CURLFile($tmpPath, $mime !== '' ? $mime : 'application/octet-stream', basename($tmpPath)),
        'api_key' => $apiKey,
        'timestamp' => $timestamp,
        'signature' => firenet_mail_cloudinary_signature($signParams, $apiSecret),
        'folder' => $folder,
    ];

    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!is_string($response) || $response === '') {
        firenet_mail_fail('No response from Cloudinary.', 502);
    }

    $payload = json_decode($response, true);
    if (!is_array($payload)) {
        firenet_mail_fail('Invalid Cloudinary response.', 502);
    }

    if ($httpCode >= 400 || !empty($payload['error'])) {
        $msg = is_array($payload['error'] ?? null)
            ? (string) ($payload['error']['message'] ?? 'Cloudinary upload failed.')
            : 'Cloudinary upload failed.';
        firenet_mail_fail($msg, 422);
    }

    $secureUrl = trim((string) ($payload['secure_url'] ?? ''));
    if ($secureUrl === '') {
        firenet_mail_fail('Cloudinary did not return a file URL.', 502);
    }

    if (!firenet_mail_orgmail_url_matches_station($secureUrl, $stationCode, $cloudName)) {
        firenet_mail_fail('Upload landed outside the station folder (check Cloudinary preset/folder overrides).', 422);
    }

    return $secureUrl;
}

function firenet_mail_operational_audit(PDO $pdo, int $threadId, ?int $routeId, int $actorUserId, int $actorStationId, string $action, array $detail = []): void
{
    try {
        $stmt = $pdo->prepare('INSERT INTO station_mail_operational_audit (thread_id, route_id, actor_user_id, actor_station_id, action, detail_json) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $threadId,
            $routeId,
            $actorUserId,
            $actorStationId,
            $action,
            $detail === [] ? null : json_encode($detail, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        ]);
    } catch (Throwable $error) {
        error_log('Station mails operational audit failed: ' . $error->getMessage());
    }

    $threadUpdateStmt = $pdo->prepare('UPDATE station_mail_threads SET last_message_at = NOW(), updated_at = NOW() WHERE thread_id = ?');
    $threadUpdateStmt->execute([$threadId]);
}

function firenet_mail_upload_dir(): string
{
    $dir = __DIR__ . '/../../uploads/mails';
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }

    return $dir;
}

function firenet_mail_upload_web_prefix(): string
{
    return '/firenet/NEWFIRENET/uploads/mails/';
}

function firenet_mail_parse_json_input(): array
{
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function firenet_mail_active_stations(PDO $pdo): array
{
    $stmt = $pdo->query('SELECT station_id, station_name, station_code, status FROM stations ORDER BY station_name ASC');
    return array_map(static function (array $row): array {
        return [
            'stationId' => (int) ($row['station_id'] ?? 0),
            'stationName' => (string) ($row['station_name'] ?? ''),
            'stationCode' => (string) ($row['station_code'] ?? ''),
            'status' => (string) ($row['status'] ?? 'active')
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function firenet_mail_station_users(PDO $pdo, int $stationId): array
{
    $stmt = $pdo->prepare('
        SELECT u.user_id, u.username, u.email, u.status, r.role_name, COALESCE(p.position_name, "") AS position_name
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN positions p ON p.position_id = u.position_id
        WHERE u.station_id = ?
        ORDER BY u.username ASC
    ');
    $stmt->execute([$stationId]);

    return array_map(static function (array $row): array {
        return [
            'userId' => (int) ($row['user_id'] ?? 0),
            'username' => (string) ($row['username'] ?? ''),
            'email' => (string) ($row['email'] ?? ''),
            'status' => (string) ($row['status'] ?? 'inactive'),
            'role' => (string) ($row['role_name'] ?? 'user'),
            'positionName' => (string) ($row['position_name'] ?? '')
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function firenet_mail_network_users(PDO $pdo): array
{
    $stmt = $pdo->query('
        SELECT
            u.user_id,
            u.username,
            u.email,
            u.status,
            u.station_id,
            COALESCE(s.station_name, CONCAT("Station ", u.station_id)) AS station_name,
            COALESCE(s.station_code, "") AS station_code,
            r.role_name,
            COALESCE(p.position_name, "") AS position_name
        FROM users u
        LEFT JOIN stations s ON s.station_id = u.station_id
        JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN positions p ON p.position_id = u.position_id
        WHERE LOWER(u.status) = "active"
        ORDER BY s.station_name ASC, u.username ASC
    ');

    return array_map(static function (array $row): array {
        return [
            'userId' => (int) ($row['user_id'] ?? 0),
            'username' => (string) ($row['username'] ?? ''),
            'email' => (string) ($row['email'] ?? ''),
            'status' => (string) ($row['status'] ?? 'inactive'),
            'stationId' => (int) ($row['station_id'] ?? 0),
            'stationName' => (string) ($row['station_name'] ?? ''),
            'stationCode' => (string) ($row['station_code'] ?? ''),
            'role' => (string) ($row['role_name'] ?? 'user'),
            'positionName' => (string) ($row['position_name'] ?? '')
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function firenet_mail_station_coml_user_ids(PDO $pdo, int $stationId): array
{
    $stmt = $pdo->prepare('
        SELECT u.user_id
        FROM users u
        JOIN positions p ON p.position_id = u.position_id
        WHERE u.station_id = ?
          AND p.position_code = "position1"
          AND LOWER(u.status) = "active"
        ORDER BY u.user_id ASC
    ');
    $stmt->execute([$stationId]);

    return array_values(array_filter(array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN)), static function (int $value): bool {
        return $value > 0;
    }));
}

function firenet_mail_station_active_user(PDO $pdo, int $stationId, int $userId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM users WHERE user_id = ? AND station_id = ? AND LOWER(status) = "active" LIMIT 1');
    $stmt->execute([$userId, $stationId]);
    return (bool) $stmt->fetchColumn();
}

function firenet_mail_request_route_by_thread(PDO $pdo, int $threadId): array
{
    $stmt = $pdo->prepare('
        SELECT
            rr.route_id,
            rr.thread_id,
            rr.request_mail_id,
            rr.request_user_id,
            rr.origin_station_id,
            rr.target_station_id,
            rr.status,
            rr.edited_subject,
            rr.edited_body,
            rr.origin_reviewed_by,
            rr.origin_reviewed_at,
            rr.origin_review_notes,
            rr.forwarded_mail_id,
            rr.forwarded_at,
            rr.target_reviewed_by,
            rr.target_reviewed_at,
            rr.target_review_notes,
            rr.is_confidential,
            rr.target_confidential_confirmed,
            rr.released_access_mode,
            rr.confidential_acknowledged_at,
            request_user.username AS request_username,
            origin_station.station_name AS origin_station_name,
            origin_station.station_code AS origin_station_code,
            target_station.station_name AS target_station_name,
            target_station.station_code AS target_station_code,
            origin_reviewer.username AS origin_reviewer_username,
            target_reviewer.username AS target_reviewer_username
        FROM station_mail_request_routes rr
        LEFT JOIN users request_user ON request_user.user_id = rr.request_user_id
        LEFT JOIN stations origin_station ON origin_station.station_id = rr.origin_station_id
        LEFT JOIN stations target_station ON target_station.station_id = rr.target_station_id
        LEFT JOIN users origin_reviewer ON origin_reviewer.user_id = rr.origin_reviewed_by
        LEFT JOIN users target_reviewer ON target_reviewer.user_id = rr.target_reviewed_by
        WHERE rr.thread_id = ?
        LIMIT 1
    ');
    $stmt->execute([$threadId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return [];
    }

    $assignedUserId = 0;
    $assignedUsername = '';
    $assignmentStmt = $pdo->prepare('
        SELECT r.recipient_user_id, u.username
        FROM station_mail_messages m
        JOIN station_mail_recipients r ON r.mail_id = m.mail_id AND r.deleted_at IS NULL AND r.recipient_user_id IS NOT NULL
        LEFT JOIN users u ON u.user_id = r.recipient_user_id
        WHERE m.thread_id = ?
        ORDER BY m.sent_at DESC, m.mail_id DESC
        LIMIT 1
    ');
    $assignmentStmt->execute([$threadId]);
    $assignmentRow = $assignmentStmt->fetch(PDO::FETCH_ASSOC);
    if ($assignmentRow) {
        $assignedUserId = (int) ($assignmentRow['recipient_user_id'] ?? 0);
        $assignedUsername = (string) ($assignmentRow['username'] ?? '');
    }

    return [
        'routeId' => (int) ($row['route_id'] ?? 0),
        'threadId' => (int) ($row['thread_id'] ?? 0),
        'requestMailId' => (int) ($row['request_mail_id'] ?? 0),
        'requestUserId' => (int) ($row['request_user_id'] ?? 0),
        'originStationId' => (int) ($row['origin_station_id'] ?? 0),
        'targetStationId' => (int) ($row['target_station_id'] ?? 0),
        'status' => (string) ($row['status'] ?? 'pending_origin_review'),
        'editedSubject' => (string) ($row['edited_subject'] ?? ''),
        'editedBody' => (string) ($row['edited_body'] ?? ''),
        'originReviewedBy' => (int) ($row['origin_reviewed_by'] ?? 0),
        'originReviewedAt' => (string) ($row['origin_reviewed_at'] ?? ''),
        'originReviewNotes' => (string) ($row['origin_review_notes'] ?? ''),
        'forwardedMailId' => (int) ($row['forwarded_mail_id'] ?? 0),
        'forwardedAt' => (string) ($row['forwarded_at'] ?? ''),
        'targetReviewedBy' => (int) ($row['target_reviewed_by'] ?? 0),
        'targetReviewedAt' => (string) ($row['target_reviewed_at'] ?? ''),
        'targetReviewNotes' => (string) ($row['target_review_notes'] ?? ''),
        'isConfidential' => ((int) ($row['is_confidential'] ?? 0)) === 1,
        'targetConfidentialConfirmed' => ((int) ($row['target_confidential_confirmed'] ?? 0)) === 1,
        'releasedAccessMode' => (string) ($row['released_access_mode'] ?? ''),
        'confidentialAcknowledgedAt' => (string) ($row['confidential_acknowledged_at'] ?? ''),
        'requestUsername' => (string) ($row['request_username'] ?? ''),
        'originStationName' => (string) ($row['origin_station_name'] ?? ''),
        'originStationCode' => (string) ($row['origin_station_code'] ?? ''),
        'targetStationName' => (string) ($row['target_station_name'] ?? ''),
        'targetStationCode' => (string) ($row['target_station_code'] ?? ''),
        'originReviewerUsername' => (string) ($row['origin_reviewer_username'] ?? ''),
        'targetReviewerUsername' => (string) ($row['target_reviewer_username'] ?? ''),
        'assignedUserId' => $assignedUserId,
        'assignedUsername' => $assignedUsername
    ];
}

function firenet_mail_request_tracking(PDO $pdo, int $userId, int $stationId, array $userProfile): array
{
    $isComl = firenet_mail_is_coml_position($userProfile);

    if ($isComl) {
        $stmt = $pdo->prepare('
            SELECT
                rr.route_id,
                rr.thread_id,
                rr.status,
                rr.updated_at,
                t.subject AS thread_subject,
                origin_station.station_name AS origin_station_name,
                target_station.station_name AS target_station_name
            FROM station_mail_request_routes rr
            JOIN station_mail_threads t ON t.thread_id = rr.thread_id
            LEFT JOIN stations origin_station ON origin_station.station_id = rr.origin_station_id
            LEFT JOIN stations target_station ON target_station.station_id = rr.target_station_id
            WHERE rr.origin_station_id = ? OR rr.target_station_id = ?
            ORDER BY rr.updated_at DESC, rr.route_id DESC
            LIMIT 12
        ');
        $stmt->execute([$stationId, $stationId]);
    } else {
        $stmt = $pdo->prepare('
            SELECT
                rr.route_id,
                rr.thread_id,
                rr.status,
                rr.updated_at,
                t.subject AS thread_subject,
                origin_station.station_name AS origin_station_name,
                target_station.station_name AS target_station_name
            FROM station_mail_request_routes rr
            JOIN station_mail_threads t ON t.thread_id = rr.thread_id
            LEFT JOIN stations origin_station ON origin_station.station_id = rr.origin_station_id
            LEFT JOIN stations target_station ON target_station.station_id = rr.target_station_id
            WHERE rr.request_user_id = ?
               OR EXISTS (
                    SELECT 1
                    FROM station_mail_messages m
                    JOIN station_mail_recipients r ON r.mail_id = m.mail_id
                    WHERE m.thread_id = rr.thread_id
                      AND r.recipient_user_id = ?
                      AND r.deleted_at IS NULL
               )
            ORDER BY rr.updated_at DESC, rr.route_id DESC
            LIMIT 12
        ');
        $stmt->execute([$userId, $userId]);
    }

    return array_map(static function (array $row): array {
        return [
            'routeId' => (int) ($row['route_id'] ?? 0),
            'threadId' => (int) ($row['thread_id'] ?? 0),
            'status' => (string) ($row['status'] ?? ''),
            'subject' => (string) ($row['thread_subject'] ?? '(No subject)'),
            'originStationName' => (string) ($row['origin_station_name'] ?? ''),
            'targetStationName' => (string) ($row['target_station_name'] ?? ''),
            'updatedAt' => (string) ($row['updated_at'] ?? '')
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function firenet_mail_station_name(PDO $pdo, int $stationId): string
{
    $stmt = $pdo->prepare('SELECT station_name FROM stations WHERE station_id = ? LIMIT 1');
    $stmt->execute([$stationId]);
    return (string) ($stmt->fetchColumn() ?: ('Station ' . $stationId));
}

function firenet_mail_station_code(PDO $pdo, int $stationId): string
{
    $stmt = $pdo->prepare('SELECT station_code FROM stations WHERE station_id = ? LIMIT 1');
    $stmt->execute([$stationId]);
    return (string) ($stmt->fetchColumn() ?: '');
}

function firenet_mail_current_user_profile(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare('
        SELECT
            u.user_id,
            u.station_id,
            r.role_name,
            u.position_id,
            p.position_code,
            p.position_name
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN positions p ON p.position_id = u.position_id
        WHERE u.user_id = ?
        LIMIT 1
    ');
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        return [];
    }

    return [
        'userId' => (int) ($row['user_id'] ?? 0),
        'stationId' => (int) ($row['station_id'] ?? 0),
        'roleName' => strtolower((string) ($row['role_name'] ?? 'user')),
        'positionId' => (int) ($row['position_id'] ?? 0),
        'positionCode' => strtolower((string) ($row['position_code'] ?? '')),
        'positionName' => (string) ($row['position_name'] ?? '')
    ];
}

function firenet_mail_is_coml_position(array $userProfile): bool
{
    return strtolower((string) ($userProfile['positionCode'] ?? '')) === 'position1';
}

function firenet_mail_station_has_coml_user(PDO $pdo, int $stationId): bool
{
    $stmt = $pdo->prepare('
        SELECT 1
        FROM users u
        JOIN positions p ON p.position_id = u.position_id
        WHERE u.station_id = ?
          AND p.position_code = "position1"
          AND LOWER(u.status) = "active"
        LIMIT 1
    ');
    $stmt->execute([$stationId]);

    return (bool) $stmt->fetchColumn();
}

function firenet_mail_filter_coml_stations(PDO $pdo, array $stationIds): array
{
    $allowed = [];

    foreach ($stationIds as $stationId) {
        $stationId = (int) $stationId;
        if ($stationId > 0 && firenet_mail_station_has_coml_user($pdo, $stationId)) {
            $allowed[$stationId] = $stationId;
        }
    }

    return array_values($allowed);
}

function firenet_mail_clean_text(?string $value): string
{
    return trim((string) $value);
}

function firenet_mail_normalize_station_ids($value): array
{
    if (is_string($value)) {
        $value = preg_split('/[\s,]+/', $value) ?: [];
    }

    if (!is_array($value)) {
        return [];
    }

    $stationIds = [];
    foreach ($value as $item) {
        $stationId = (int) $item;
        if ($stationId > 0) {
            $stationIds[$stationId] = $stationId;
        }
    }

    return array_values($stationIds);
}

function firenet_mail_normalize_user_ids($value): array
{
    if (is_string($value)) {
        $value = preg_split('/[\s,]+/', $value) ?: [];
    }

    if (!is_array($value)) {
        return [];
    }

    $userIds = [];
    foreach ($value as $item) {
        $userId = (int) $item;
        if ($userId > 0) {
            $userIds[$userId] = $userId;
        }
    }

    return array_values($userIds);
}

function firenet_mail_recipient_users(PDO $pdo, array $userIds, int $excludeUserId = 0): array
{
    $userIds = array_values(array_filter(array_map('intval', $userIds), static function (int $value) use ($excludeUserId): bool {
        return $value > 0 && $value !== $excludeUserId;
    }));

    if ($userIds === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($userIds), '?'));
    $stmt = $pdo->prepare('SELECT user_id, station_id FROM users WHERE user_id IN (' . $placeholders . ') AND LOWER(status) = "active"');
    $stmt->execute($userIds);

    return array_map(static function (array $row): array {
        return [
            'userId' => (int) ($row['user_id'] ?? 0),
            'stationId' => (int) ($row['station_id'] ?? 0)
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function firenet_mail_summarize_message(array $row): array
{
    $body = trim((string) ($row['body'] ?? ''));
    $body = preg_replace('/\s+/', ' ', $body) ?? $body;

    return [
        'mailId' => (int) ($row['mail_id'] ?? 0),
        'threadId' => (int) ($row['thread_id'] ?? 0),
        'subject' => (string) ($row['subject'] ?? ''),
        'body' => (string) ($row['body'] ?? ''),
        'snippet' => mb_substr($body, 0, 180),
        'mailType' => (string) ($row['mail_type'] ?? 'message'),
        'importance' => (string) ($row['importance'] ?? 'normal'),
        'requestFiles' => ((int) ($row['request_files'] ?? 0)) === 1,
        'isDraft' => ((int) ($row['is_draft'] ?? 0)) === 1,
        'sentAt' => (string) ($row['sent_at'] ?? ''),
        'createdAt' => (string) ($row['created_at'] ?? ''),
        'updatedAt' => (string) ($row['updated_at'] ?? ''),
        'senderUserId' => (int) ($row['sender_user_id'] ?? 0),
        'senderStationId' => (int) ($row['sender_station_id'] ?? 0),
        'senderUsername' => (string) ($row['sender_username'] ?? 'Unknown User'),
        'senderStationName' => (string) ($row['sender_station_name'] ?? ''),
        'recipientStations' => (string) ($row['recipient_stations'] ?? ''),
        'attachmentCount' => (int) ($row['attachment_count'] ?? 0),
        'readAt' => (string) ($row['read_at'] ?? ''),
        'archivedAt' => (string) ($row['archived_at'] ?? ''),
        'starredAt' => (string) ($row['starred_at'] ?? '')
    ];
}

function firenet_mail_attachment_rows(PDO $pdo, int $mailId): array
{
    $stmt = $pdo->prepare('SELECT attachment_id, original_file_name, stored_file_name, file_path, mime_type, file_size_bytes, uploaded_by, created_at FROM station_mail_attachments WHERE mail_id = ? ORDER BY attachment_id ASC');
    $stmt->execute([$mailId]);

    return array_map(static function (array $row): array {
        return [
            'attachmentId' => (int) ($row['attachment_id'] ?? 0),
            'originalFileName' => (string) ($row['original_file_name'] ?? ''),
            'storedFileName' => (string) ($row['stored_file_name'] ?? ''),
            'filePath' => (string) ($row['file_path'] ?? ''),
            'mimeType' => (string) ($row['mime_type'] ?? ''),
            'fileSizeBytes' => (int) ($row['file_size_bytes'] ?? 0),
            'downloadUrl' => '/firenet/NEWFIRENET/backend/controllers/station_mails.php?action=download&attachmentId=' . (int) ($row['attachment_id'] ?? 0),
            'uploadedBy' => (int) ($row['uploaded_by'] ?? 0),
            'createdAt' => (string) ($row['created_at'] ?? '')
        ];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function firenet_mail_count_folder(PDO $pdo, int $userId, int $stationId, string $folder): int
{
    switch ($folder) {
        case 'starred':
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM station_mail_recipients WHERE (recipient_station_id = ? OR recipient_user_id = ?) AND starred_at IS NOT NULL AND deleted_at IS NULL');
            $stmt->execute([$stationId, $userId]);
            return (int) ($stmt->fetchColumn() ?: 0);
        case 'sent':
            // Sent mailbox includes both the current user's sent items and station-shared sent items.
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM station_mail_messages WHERE (sender_user_id = ? OR sender_station_id = ?) AND is_draft = 0');
            $stmt->execute([$userId, $stationId]);
            return (int) ($stmt->fetchColumn() ?: 0);
        case 'drafts':
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM station_mail_messages WHERE sender_user_id = ? AND is_draft = 1');
            $stmt->execute([$userId]);
            return (int) ($stmt->fetchColumn() ?: 0);
        case 'archive':
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM station_mail_recipients WHERE (recipient_station_id = ? OR recipient_user_id = ?) AND archived_at IS NOT NULL AND deleted_at IS NULL');
            $stmt->execute([$stationId, $userId]);
            return (int) ($stmt->fetchColumn() ?: 0);
        case 'inbox':
        default:
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM station_mail_recipients r JOIN station_mail_messages m ON m.mail_id = r.mail_id WHERE (r.recipient_station_id = ? OR r.recipient_user_id = ?) AND r.deleted_at IS NULL AND m.is_draft = 0');
            $stmt->execute([$stationId, $userId]);
            return (int) ($stmt->fetchColumn() ?: 0);
    }
}

function firenet_mail_count_unread(PDO $pdo, int $stationId, int $userId): int
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM station_mail_recipients r JOIN station_mail_messages m ON m.mail_id = r.mail_id WHERE (r.recipient_station_id = ? OR r.recipient_user_id = ?) AND r.deleted_at IS NULL AND r.read_at IS NULL AND r.archived_at IS NULL AND m.is_draft = 0');
    $stmt->execute([$stationId, $userId]);
    return (int) ($stmt->fetchColumn() ?: 0);
}

function firenet_mail_bootstrap(PDO $pdo, int $userId, int $stationId, string $role, array $userProfile): array
{
    $profileStationName = firenet_mail_station_name($pdo, $stationId);
    $isComl = firenet_mail_is_coml_position($userProfile);
    $requestTracking = [];

    try {
        $requestTracking = firenet_mail_request_tracking($pdo, $userId, $stationId, $userProfile);
    } catch (Throwable $error) {
        error_log('General mail bootstrap requestTracking failed: ' . $error->getMessage());
        $requestTracking = [];
    }

    return [
        'currentUser' => [
            'userId' => $userId,
            'stationId' => $stationId,
            'stationName' => $profileStationName,
            'role' => $role,
            'positionId' => (int) ($userProfile['positionId'] ?? 0),
            'positionCode' => (string) ($userProfile['positionCode'] ?? ''),
            'positionName' => (string) ($userProfile['positionName'] ?? ''),
            'isComl' => $isComl,
            'canRouteStations' => $isComl,
            'canReplyAcrossStations' => $isComl,
            'canRequestOnly' => !$isComl
        ],
        'stations' => firenet_mail_active_stations($pdo),
        'stationUsers' => firenet_mail_station_users($pdo, $stationId),
        'networkUsers' => firenet_mail_network_users($pdo),
            'requestTracking' => $requestTracking,
        'operationalOrgmail' => (static function (int $stationId) use ($pdo): array {
            $app = firenet_mail_app_config();
            $cloud = firenet_mail_cloudinary_section($app);
            $cloudName = firenet_mail_orgmail_cloud_name($cloud);
            $enabled = !empty($cloud['enabled']) && $cloudName !== '' && trim((string) ($cloud['api_key'] ?? '')) !== '' && trim((string) ($cloud['api_secret'] ?? '')) !== '';
            $stationCode = $enabled ? firenet_mail_station_code($pdo, $stationId) : '';

            return [
                'uploadsEnabled' => $enabled,
                'cloudName' => $cloudName,
                'stationCode' => $stationCode,
                'stationFolder' => firenet_mail_orgmail_station_folder($stationCode, $cloud),
            ];
        })($stationId),
        'folders' => [
            'inbox' => firenet_mail_count_folder($pdo, $userId, $stationId, 'inbox'),
            'starred' => firenet_mail_count_folder($pdo, $userId, $stationId, 'starred'),
            'sent' => firenet_mail_count_folder($pdo, $userId, $stationId, 'sent'),
            'drafts' => firenet_mail_count_folder($pdo, $userId, $stationId, 'drafts'),
            'archive' => firenet_mail_count_folder($pdo, $userId, $stationId, 'archive'),
            'unread' => firenet_mail_count_unread($pdo, $stationId, $userId)
        ]
    ];
}

function firenet_mail_thread_access_sql(): string
{
    return "(
        EXISTS (
            SELECT 1
            FROM station_mail_messages access_message
            WHERE access_message.thread_id = t.thread_id
              AND access_message.sender_user_id = :userId
        )
        OR EXISTS (
            SELECT 1
            FROM station_mail_messages access_message
            JOIN station_mail_recipients access_recipient ON access_recipient.mail_id = access_message.mail_id
            WHERE access_message.thread_id = t.thread_id
              AND access_message.is_draft = 0
              AND access_recipient.deleted_at IS NULL
              AND access_recipient.recipient_station_id = :stationId
        )
    )";
}

function firenet_mail_can_view_thread(PDO $pdo, int $threadId, int $userId, int $stationId): bool
{
    $stmt = $pdo->prepare('
        SELECT 1
        FROM station_mail_messages m
                LEFT JOIN station_mail_recipients r ON r.mail_id = m.mail_id AND r.deleted_at IS NULL AND (r.recipient_station_id = ? OR r.recipient_user_id = ?)
        WHERE m.thread_id = ?
                    AND (m.sender_user_id = ? OR (m.is_draft = 0 AND (r.recipient_station_id IS NOT NULL OR r.recipient_user_id IS NOT NULL)))
        LIMIT 1
    ');
        $stmt->execute([$stationId, $userId, $threadId, $userId]);
    return (bool) $stmt->fetchColumn();
}

function firenet_mail_fetch_list(PDO $pdo, int $userId, int $stationId, string $folder, string $search, string $filter = ''): array
{
    $folder = in_array($folder, ['inbox', 'starred', 'sent', 'drafts', 'archive'], true) ? $folder : 'inbox';
    $searchTerm = trim($search);
    $searchSql = '';
    $params = [];

    // server-side smart filter handling (optional, accepts comma-separated filters)
    $filter = strtolower(trim($filter));
    $filterForMessages = '';
    $filterForRecipients = '';
    if ($filter !== '') {
        $parts = array_values(array_filter(array_map('trim', explode(',', $filter))));
        foreach ($parts as $part) {
            switch ($part) {
                case 'unread':
                    // applies only when recipient alias 'r' is present
                    $filterForRecipients .= ' AND r.read_at IS NULL';
                    break;
                case 'attachments':
                    $filterForMessages .= ' AND EXISTS (SELECT 1 FROM station_mail_attachments a WHERE a.mail_id = m.mail_id)';
                    break;
                case 'high':
                    $filterForMessages .= " AND m.importance IN ('high','urgent')";
                    break;
                case 'station':
                    $filterForMessages .= ' AND m.sender_station_id = :filterStationId';
                    $params[':filterStationId'] = $stationId;
                    break;
                default:
                    // ignore unknown
                    break;
            }
        }
    }

    if ($searchTerm !== '') {
        $searchSql = " AND (m.subject LIKE :search OR m.body LIKE :search OR sender.username LIKE :search OR sender_station.station_name LIKE :search) ";
        $params[':search'] = '%' . $searchTerm . '%';
    }

    if ($folder === 'sent') {
        $params[':userId'] = $userId;
        $params[':stationId'] = $stationId;
        $sql = "
            SELECT
                m.mail_id,
                m.thread_id,
                m.subject,
                m.body,
                m.mail_type,
                m.importance,
                m.request_files,
                m.is_draft,
                m.sent_at,
                m.created_at,
                m.updated_at,
                m.sender_user_id,
                m.sender_station_id,
                sender.username AS sender_username,
                COALESCE(sender_station.station_name, CONCAT('Station ', m.sender_station_id)) AS sender_station_name,
                                (
                                        SELECT GROUP_CONCAT(
                                            DISTINCT COALESCE(rec_station.station_name, CONCAT('@', rec_user.username))
                                            ORDER BY COALESCE(rec_station.station_name, rec_user.username)
                                            SEPARATOR ', '
                                        )
                                        FROM station_mail_recipients rec
                                        LEFT JOIN stations rec_station ON rec_station.station_id = rec.recipient_station_id
                                        LEFT JOIN users rec_user ON rec_user.user_id = rec.recipient_user_id
                                        WHERE rec.mail_id = m.mail_id
                                            AND rec.deleted_at IS NULL
                                ) AS recipient_stations,
                (SELECT COUNT(*) FROM station_mail_attachments a WHERE a.mail_id = m.mail_id) AS attachment_count,
                NULL AS read_at,
                NULL AS archived_at,
                NULL AS starred_at
            FROM station_mail_messages m
            LEFT JOIN users sender ON sender.user_id = m.sender_user_id
            LEFT JOIN stations sender_station ON sender_station.station_id = m.sender_station_id
                        WHERE (m.sender_user_id = :userId OR m.sender_station_id = :stationId)
              AND m.is_draft = 0
                            $searchSql
                            $filterForMessages
                        ORDER BY COALESCE(m.sent_at, m.created_at) DESC, m.mail_id DESC
            LIMIT 200
        ";
    } elseif ($folder === 'drafts') {
        $params[':userId'] = $userId;
        $sql = "
            SELECT
                m.mail_id,
                m.thread_id,
                m.subject,
                m.body,
                m.mail_type,
                m.importance,
                m.request_files,
                m.is_draft,
                m.sent_at,
                m.created_at,
                m.updated_at,
                m.sender_user_id,
                m.sender_station_id,
                sender.username AS sender_username,
                COALESCE(sender_station.station_name, CONCAT('Station ', m.sender_station_id)) AS sender_station_name,
                                (
                                        SELECT GROUP_CONCAT(
                                            DISTINCT COALESCE(rec_station.station_name, CONCAT('@', rec_user.username))
                                            ORDER BY COALESCE(rec_station.station_name, rec_user.username)
                                            SEPARATOR ', '
                                        )
                                        FROM station_mail_recipients rec
                                        LEFT JOIN stations rec_station ON rec_station.station_id = rec.recipient_station_id
                                        LEFT JOIN users rec_user ON rec_user.user_id = rec.recipient_user_id
                                        WHERE rec.mail_id = m.mail_id
                                            AND rec.deleted_at IS NULL
                                ) AS recipient_stations,
                (SELECT COUNT(*) FROM station_mail_attachments a WHERE a.mail_id = m.mail_id) AS attachment_count,
                NULL AS read_at,
                NULL AS archived_at,
                NULL AS starred_at
            FROM station_mail_messages m
            LEFT JOIN users sender ON sender.user_id = m.sender_user_id
            LEFT JOIN stations sender_station ON sender_station.station_id = m.sender_station_id
            WHERE m.sender_user_id = :userId
              AND m.is_draft = 1
                            $searchSql
                            $filterForMessages
                        ORDER BY m.updated_at DESC, m.mail_id DESC
            LIMIT 200
        ";
    } else {
        $params[':stationId'] = $stationId;
        $params[':userId'] = $userId;
        if ($folder === 'archive') {
            $recipientFilter = 'r.archived_at IS NOT NULL';
        } elseif ($folder === 'starred') {
            $recipientFilter = 'r.starred_at IS NOT NULL AND r.archived_at IS NULL';
        } else {
            $recipientFilter = 'r.archived_at IS NULL';
        }
        $sql = "
            SELECT
                m.mail_id,
                m.thread_id,
                m.subject,
                m.body,
                m.mail_type,
                m.importance,
                m.request_files,
                m.is_draft,
                m.sent_at,
                m.created_at,
                m.updated_at,
                m.sender_user_id,
                m.sender_station_id,
                sender.username AS sender_username,
                COALESCE(sender_station.station_name, CONCAT('Station ', m.sender_station_id)) AS sender_station_name,
                                (
                                        SELECT GROUP_CONCAT(
                                            DISTINCT COALESCE(rec_station.station_name, CONCAT('@', rec_user.username))
                                            ORDER BY COALESCE(rec_station.station_name, rec_user.username)
                                            SEPARATOR ', '
                                        )
                                        FROM station_mail_recipients rec
                                        LEFT JOIN stations rec_station ON rec_station.station_id = rec.recipient_station_id
                                        LEFT JOIN users rec_user ON rec_user.user_id = rec.recipient_user_id
                                        WHERE rec.mail_id = m.mail_id
                                            AND rec.deleted_at IS NULL
                                ) AS recipient_stations,
                (SELECT COUNT(*) FROM station_mail_attachments a WHERE a.mail_id = m.mail_id) AS attachment_count,
                r.read_at,
                r.archived_at,
                r.starred_at
            FROM station_mail_messages m
                        JOIN station_mail_recipients r ON r.mail_id = m.mail_id
            LEFT JOIN users sender ON sender.user_id = m.sender_user_id
            LEFT JOIN stations sender_station ON sender_station.station_id = m.sender_station_id
                        WHERE (r.recipient_station_id = :stationId OR r.recipient_user_id = :userId)
              AND r.deleted_at IS NULL
              AND m.is_draft = 0
                            AND $recipientFilter
                            $searchSql
                            $filterForMessages
                            $filterForRecipients
                        ORDER BY COALESCE(m.sent_at, m.created_at) DESC, m.mail_id DESC
            LIMIT 200
        ";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return array_map('firenet_mail_summarize_message', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function firenet_mail_thread_detail(PDO $pdo, int $threadId): array
{
    $threadStmt = $pdo->prepare('SELECT thread_id, subject, created_by_user_id, created_at, updated_at, last_message_at FROM station_mail_threads WHERE thread_id = ? LIMIT 1');
    $threadStmt->execute([$threadId]);
    $thread = $threadStmt->fetch(PDO::FETCH_ASSOC);
    if (!$thread) {
        return [];
    }

    $messageStmt = $pdo->prepare('
        SELECT
            m.mail_id,
            m.thread_id,
            m.parent_mail_id,
            m.subject,
            m.body,
            m.mail_type,
            m.importance,
            m.request_files,
            m.is_draft,
            m.sent_at,
            m.created_at,
            m.updated_at,
            m.sender_user_id,
            m.sender_station_id,
            sender.username AS sender_username,
                        COALESCE(sender_station.station_name, CONCAT("Station ", m.sender_station_id)) AS sender_station_name,
                        (
                                SELECT GROUP_CONCAT(
                                    DISTINCT COALESCE(rec_station.station_name, CONCAT("@", rec_user.username))
                                    ORDER BY COALESCE(rec_station.station_name, rec_user.username)
                                    SEPARATOR ", "
                                )
                                FROM station_mail_recipients rec
                                LEFT JOIN stations rec_station ON rec_station.station_id = rec.recipient_station_id
                                LEFT JOIN users rec_user ON rec_user.user_id = rec.recipient_user_id
                                WHERE rec.mail_id = m.mail_id
                                    AND rec.deleted_at IS NULL
                        ) AS recipient_stations
        FROM station_mail_messages m
        LEFT JOIN users sender ON sender.user_id = m.sender_user_id
        LEFT JOIN stations sender_station ON sender_station.station_id = m.sender_station_id
        WHERE m.thread_id = ?
        ORDER BY COALESCE(m.sent_at, m.created_at) ASC, m.mail_id ASC
    ');
    $messageStmt->execute([$threadId]);
    $messages = $messageStmt->fetchAll(PDO::FETCH_ASSOC);

    $messages = array_map(static function (array $row) use ($pdo): array {
        $attachments = firenet_mail_attachment_rows($pdo, (int) ($row['mail_id'] ?? 0));

        return array_merge(firenet_mail_summarize_message($row), [
            'parentMailId' => (int) ($row['parent_mail_id'] ?? 0),
            'attachments' => $attachments
        ]);
    }, $messages);

    $requestRoute = firenet_mail_request_route_by_thread($pdo, $threadId);

    return [
        'thread' => [
            'threadId' => (int) ($thread['thread_id'] ?? 0),
            'subject' => (string) ($thread['subject'] ?? ''),
            'createdByUserId' => (int) ($thread['created_by_user_id'] ?? 0),
            'createdAt' => (string) ($thread['created_at'] ?? ''),
            'updatedAt' => (string) ($thread['updated_at'] ?? ''),
            'lastMessageAt' => (string) ($thread['last_message_at'] ?? '')
        ],
        'messages' => $messages,
        'requestRoute' => $requestRoute
    ];
}

function firenet_mail_mark_thread_read(PDO $pdo, int $threadId, int $stationId, int $userId): void
{
    $stmt = $pdo->prepare('
        UPDATE station_mail_recipients r
        JOIN station_mail_messages m ON m.mail_id = r.mail_id
        SET r.read_at = COALESCE(r.read_at, NOW())
        WHERE m.thread_id = ?
          AND (r.recipient_station_id = ? OR r.recipient_user_id = ?)
          AND r.deleted_at IS NULL
          AND m.is_draft = 0
    ');
    $stmt->execute([$threadId, $stationId, $userId]);
}

function firenet_mail_notify_route_users(PDO $pdo, int $threadId, int $parentMailId, int $senderUserId, int $senderStationId, string $subject, string $body, array $recipientUserIds): void
{
    $recipientUserIds = array_values(array_filter(array_map('intval', $recipientUserIds), static function (int $value): bool {
        return $value > 0;
    }));

    if ($threadId < 1 || $recipientUserIds === []) {
        return;
    }

    $subject = firenet_mail_clean_text($subject);
    if ($subject === '') {
        $subject = '(No subject)';
    }

    $body = firenet_mail_clean_text($body);
    $messageStmt = $pdo->prepare('
        INSERT INTO station_mail_messages (
            thread_id, parent_mail_id, sender_user_id, sender_station_id,
            subject, body, mail_type, importance, request_files, is_draft, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, "message", "normal", 0, 0, NOW())
    ');
    $messageStmt->execute([
        $threadId,
        $parentMailId > 0 ? $parentMailId : null,
        $senderUserId,
        $senderStationId,
        $subject,
        $body
    ]);

    $mailId = (int) $pdo->lastInsertId();
    $recipientStmt = $pdo->prepare('INSERT INTO station_mail_recipients (mail_id, recipient_type, recipient_user_id) VALUES (?, "user", ?)');
    foreach ($recipientUserIds as $recipientUserId) {
        $recipientStmt->execute([$mailId, $recipientUserId]);
    }

    $threadStmt = $pdo->prepare('UPDATE station_mail_threads SET subject = ?, last_message_at = NOW(), updated_at = NOW() WHERE thread_id = ?');
    $threadStmt->execute([$subject, $threadId]);
}

function firenet_mail_save_attachments(PDO $pdo, int $mailId, int $userId): array
{
    $saved = [];
    if (empty($_FILES['attachments']) || !is_array($_FILES['attachments'])) {
        return $saved;
    }

    $uploadDir = firenet_mail_upload_dir();
    $fileNames = $_FILES['attachments']['name'] ?? [];
    $tmpNames = $_FILES['attachments']['tmp_name'] ?? [];
    $errors = $_FILES['attachments']['error'] ?? [];
    $sizes = $_FILES['attachments']['size'] ?? [];
    $types = $_FILES['attachments']['type'] ?? [];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);

    foreach ((array) $fileNames as $index => $originalName) {
        $uploadError = (int) ($errors[$index] ?? UPLOAD_ERR_NO_FILE);
        if ($uploadError === UPLOAD_ERR_NO_FILE) {
            continue;
        }

        if ($uploadError !== UPLOAD_ERR_OK) {
            firenet_mail_fail('One of the attachments could not be uploaded.', 422);
        }

        $tmpName = (string) ($tmpNames[$index] ?? '');
        if ($tmpName === '' || !is_file($tmpName)) {
            firenet_mail_fail('Attachment upload failed.', 422);
        }

        $fileSize = (int) ($sizes[$index] ?? 0);
        if ($fileSize < 1 || $fileSize > 25 * 1024 * 1024) {
            firenet_mail_fail('Each attachment must be 25 MB or smaller.', 422);
        }

        $detectedMime = $finfo ? (string) finfo_file($finfo, $tmpName) : '';
        $mimeType = $detectedMime !== '' ? $detectedMime : (string) ($types[$index] ?? 'application/octet-stream');
        $safeOriginal = preg_replace('/[^A-Za-z0-9._-]+/', '_', (string) $originalName) ?: 'attachment';
        $storedFileName = 'mail_' . bin2hex(random_bytes(16)) . '.bin';
        $relativePath = 'uploads/mails/' . $storedFileName;
        $fullPath = $uploadDir . '/' . $storedFileName;

        if (!move_uploaded_file($tmpName, $fullPath)) {
            firenet_mail_fail('Unable to store the attachment.', 500);
        }

        $stmt = $pdo->prepare('
            INSERT INTO station_mail_attachments (mail_id, original_file_name, stored_file_name, file_path, mime_type, file_size_bytes, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$mailId, $safeOriginal, $storedFileName, $relativePath, $mimeType, $fileSize, $userId]);

        $saved[] = [
            'attachmentId' => (int) $pdo->lastInsertId(),
            'originalFileName' => $safeOriginal,
            'fileSizeBytes' => $fileSize,
            'mimeType' => $mimeType,
            'downloadUrl' => '/firenet/NEWFIRENET/backend/controllers/station_mails.php?action=download&attachmentId=' . (int) $pdo->lastInsertId()
        ];
    }

    if ($finfo) {
        finfo_close($finfo);
    }

    return $saved;
}

function firenet_mail_save_remote_attachment(PDO $pdo, int $mailId, int $userId, string $cloudinaryUrl, ?string $orgmailStationCode = null): array
{
    $url = trim($cloudinaryUrl);
    if ($url === '') {
        return [];
    }

    if (!preg_match('/^https?:\/\//i', $url)) {
        firenet_mail_fail('Cloudinary file URL must be a valid https:// address.', 422);
    }

    if ($orgmailStationCode !== null && trim($orgmailStationCode) !== '') {
        firenet_mail_orgmail_require_url_for_station($url, $orgmailStationCode);
    }

    $fileName = basename(parse_url($url, PHP_URL_PATH) ?: 'cloudinary-file');
    $safeName = preg_replace('/[^A-Za-z0-9._-]+/', '_', (string) $fileName) ?: 'cloudinary-file';
    $storedFileName = 'cloudinary_' . bin2hex(random_bytes(16));
    $relativePath = $url;
    $mimeType = 'application/octet-stream';

    $stmt = $pdo->prepare('INSERT INTO station_mail_attachments (mail_id, original_file_name, stored_file_name, file_path, mime_type, file_size_bytes, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$mailId, $safeName, $storedFileName, $relativePath, $mimeType, 0, $userId]);

    return [
        'attachmentId' => (int) $pdo->lastInsertId(),
        'originalFileName' => $safeName,
        'fileSizeBytes' => 0,
        'mimeType' => $mimeType,
        'downloadUrl' => '/firenet/NEWFIRENET/backend/controllers/station_mails.php?action=download&attachmentId=' . (int) $pdo->lastInsertId()
    ];
}

function firenet_mail_recipient_stations(PDO $pdo, array $stationIds): array
{
    if ($stationIds === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($stationIds), '?'));
    $stmt = $pdo->prepare('SELECT station_id FROM stations WHERE station_id IN (' . $placeholders . ') AND status = "active"');
    $stmt->execute($stationIds);
    return array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));
}

function firenet_mail_store_message(PDO $pdo, array $input, int $currentUserId, int $currentStationId, string $currentRole, array $currentUserProfile, bool $asDraft = false, bool $allowNonComlDirectReply = false): array
{
    $subject = firenet_mail_clean_text((string) ($input['subject'] ?? ''));
    $body = firenet_mail_clean_text((string) ($input['body'] ?? ''));
    $mailType = strtolower(trim((string) ($input['mailType'] ?? 'message')));
    $importance = strtolower(trim((string) ($input['importance'] ?? 'normal')));
    $requestFiles = !empty($input['requestFiles']) ? 1 : 0;
    $cloudinaryUrl = trim((string) ($input['cloudinaryUrl'] ?? ''));
    $threadId = (int) ($input['threadId'] ?? 0);
    $parentMailId = (int) ($input['parentMailId'] ?? 0);
    $isStationNotice = !empty($input['isStationNotice']) ? 1 : 0;
    $recipientStations = firenet_mail_normalize_station_ids($input['recipientStationIds'] ?? []);
    $recipientUserIds = firenet_mail_normalize_user_ids($input['recipientUserIds'] ?? []);
    $targetUsers = firenet_mail_recipient_users($pdo, $recipientUserIds, $currentUserId);
    $targetStations = firenet_mail_recipient_stations($pdo, $recipientStations);
    $isComl = firenet_mail_is_coml_position($currentUserProfile);

    if ($subject === '' && $threadId > 0) {
        $threadStmt = $pdo->prepare('SELECT subject FROM station_mail_threads WHERE thread_id = ? LIMIT 1');
        $threadStmt->execute([$threadId]);
        $subject = (string) ($threadStmt->fetchColumn() ?: '(No subject)');
    }

    if ($subject === '') {
        $subject = '(No subject)';
    }

    if (!in_array($mailType, ['message', 'request', 'file_share'], true)) {
        $mailType = 'message';
    }

    if (!in_array($importance, ['normal', 'high', 'urgent'], true)) {
        $importance = 'normal';
    }

    if ($mailType === 'file_share') {
        $mailType = 'message';
    }

    $requestTargetStationId = 0;
    $originComlUserIds = [];
    $directReplyComlUserIds = [];

    if ($mailType === 'request' && !$isComl && !$allowNonComlDirectReply) {
        $mailType = 'request';
        $requestFiles = 1;

        if ($targetStations === []) {
            firenet_mail_fail('Select one target station to request information from.', 422);
        }
        if (count($targetStations) > 1) {
            firenet_mail_fail('Request mail can target only one station.', 422);
        }

        $requestTargetStationId = (int) $targetStations[0];
        if (!firenet_mail_station_has_coml_user($pdo, $requestTargetStationId)) {
            firenet_mail_fail('The selected target station does not have an active ComL user.', 422);
        }

        $originComlUserIds = firenet_mail_station_coml_user_ids($pdo, $currentStationId);
        if ($originComlUserIds === []) {
            firenet_mail_fail('Your origin station does not currently have an active ComL user to receive this request.', 422);
        }

        if ($isStationNotice === 1) {
            firenet_mail_fail('Station notices are only available to ComL users.', 403);
        }
    } elseif (!$isComl && $allowNonComlDirectReply) {
        if ($targetStations === []) {
            firenet_mail_fail('Reply routing is unavailable for this request.', 422);
        }
        if (count($targetStations) > 1) {
            firenet_mail_fail('Follow-up replies can target only one station.', 422);
        }

        $targetStations = firenet_mail_filter_coml_stations($pdo, $targetStations);
        if ($targetStations === []) {
            firenet_mail_fail('The destination station does not have an active ComL user.', 422);
        }

        $replyToComlStationId = (int) ($targetStations[0] ?? 0);
        $directReplyComlUserIds = firenet_mail_station_coml_user_ids($pdo, $replyToComlStationId);
        if ($directReplyComlUserIds === []) {
            firenet_mail_fail('The requester station does not have an active ComL user to receive this reply.', 422);
        }

        $mailType = 'message';
        $requestFiles = 0;
        $isStationNotice = 0;
    } elseif ($mailType !== 'request') {
        $mailType = 'message';
        $requestFiles = 0;

        if ($targetUsers === [] && $targetStations === []) {
            firenet_mail_fail('Select at least one recipient user for this mail.', 422);
        }

        if (!$isComl) {
            $targetStations = [];
            if ($isStationNotice === 1) {
                firenet_mail_fail('Station notices are only available to ComL users.', 403);
            }
        }
    } else {
        $targetStations = firenet_mail_filter_coml_stations($pdo, $targetStations);
    }

    if ($isStationNotice === 1) {
        if (!$isComl) {
            firenet_mail_fail('Only ComL users can send station notices.', 403);
        }

        $targetStations = [$currentStationId];
        $mailType = 'message';
        $requestFiles = 0;
        if (stripos($subject, '[NOTICE]') !== 0) {
            $subject = '[NOTICE] ' . ltrim($subject);
        }
    }

    if (!$isComl && !$asDraft && $body === '' && empty($_FILES['attachments']['name']) && $cloudinaryUrl === '') {
        firenet_mail_fail('Write a message or attach a file before sending.', 422);
    }

    if ($mailType === 'request' && !empty($_FILES['attachments']['name'])) {
        firenet_mail_fail('Operational files must be attached via Cloudinary links, not local uploads.', 422);
    }

    if ($isComl && !$asDraft && $targetStations === [] && $mailType !== 'request') {
        firenet_mail_fail('Select at least one active station with an active ComL user to receive the mail.', 422);
    }

    $pdo->beginTransaction();

    try {
        if ($threadId < 1) {
            $threadStmt = $pdo->prepare('INSERT INTO station_mail_threads (subject, created_by_user_id, last_message_at) VALUES (?, ?, NOW())');
            $threadStmt->execute([$subject, $currentUserId]);
            $threadId = (int) $pdo->lastInsertId();
        } else {
            $threadStmt = $pdo->prepare('UPDATE station_mail_threads SET subject = ?, last_message_at = NOW() WHERE thread_id = ?');
            $threadStmt->execute([$subject, $threadId]);
        }

        if ($threadId < 1) {
            throw new RuntimeException('Unable to create a thread.');
        }

        $sentAt = $asDraft ? null : date('Y-m-d H:i:s');
        $messageStmt = $pdo->prepare('
            INSERT INTO station_mail_messages (
                thread_id, parent_mail_id, sender_user_id, sender_station_id,
                subject, body, mail_type, importance, request_files, is_draft, sent_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $messageStmt->execute([
            $threadId,
            $parentMailId > 0 ? $parentMailId : null,
            $currentUserId,
            $currentStationId,
            $subject,
            $body,
            $mailType,
            $importance,
            $requestFiles,
            $asDraft ? 1 : 0,
            $sentAt
        ]);

        $mailId = (int) $pdo->lastInsertId();
        $routeId = 0;

        if ($mailType === 'request' && !$isComl && !$allowNonComlDirectReply && !$asDraft) {
            $routeStmt = $pdo->prepare('
                INSERT INTO station_mail_request_routes (
                    thread_id, request_mail_id, request_user_id, origin_station_id, target_station_id, status
                ) VALUES (?, ?, ?, ?, ?, "pending_origin_review")
            ');
            $routeStmt->execute([$threadId, $mailId, $currentUserId, $currentStationId, $requestTargetStationId]);
            $routeId = (int) $pdo->lastInsertId();

            $recipientStmt = $pdo->prepare('
                INSERT INTO station_mail_recipients (mail_id, recipient_type, recipient_user_id)
                VALUES (?, "user", ?)
            ');
            foreach ($originComlUserIds as $originComlUserId) {
                $recipientStmt->execute([$mailId, $originComlUserId]);
            }
        } else {
            if ($targetUsers !== []) {
                $recipientUserStmt = $pdo->prepare('INSERT INTO station_mail_recipients (mail_id, recipient_type, recipient_user_id) VALUES (?, "user", ?)');
                foreach ($targetUsers as $targetUser) {
                    $recipientUserStmt->execute([$mailId, (int) ($targetUser['userId'] ?? 0)]);
                }
            }

            if ($targetStations === []) {
                $targetStations = array_values(array_unique(array_map(static function (array $targetUser): int {
                    return (int) ($targetUser['stationId'] ?? 0);
                }, $targetUsers)));
                $targetStations = array_values(array_filter($targetStations, static function (int $stationId): bool {
                    return $stationId > 0;
                }));
            }

            if ($targetStations !== []) {
            if (!$isComl && $allowNonComlDirectReply) {
                $recipientStmt = $pdo->prepare('INSERT INTO station_mail_recipients (mail_id, recipient_type, recipient_user_id) VALUES (?, "user", ?)');
                foreach ($directReplyComlUserIds as $comlUserId) {
                    $recipientStmt->execute([$mailId, $comlUserId]);
                }
            } else {
            $recipientStmt = $pdo->prepare('
                INSERT INTO station_mail_recipients (mail_id, recipient_type, recipient_station_id)
                VALUES (?, "station", ?)
            ');

            foreach ($targetStations as $stationId) {
                $recipientStmt->execute([$mailId, $stationId]);
            }
            }
            }
        }

        $attachments = [];
        $orgmailValidateStationCode = null;
        if ($mailType === 'request' && $requestFiles === 1) {
            $orgmailValidateStationCode = firenet_mail_station_code($pdo, $currentStationId);
        } elseif ($allowNonComlDirectReply && $cloudinaryUrl !== '') {
            $orgmailValidateStationCode = firenet_mail_station_code($pdo, $currentStationId);
        }

        if ($cloudinaryUrl !== '') {
            $attachments[] = firenet_mail_save_remote_attachment($pdo, $mailId, $currentUserId, $cloudinaryUrl, $orgmailValidateStationCode !== null && trim($orgmailValidateStationCode) !== '' ? $orgmailValidateStationCode : null);
        } else {
            $attachments = firenet_mail_save_attachments($pdo, $mailId, $currentUserId);
        }

        $pdo->commit();

        return [
            'mailId' => $mailId,
            'threadId' => $threadId,
            'routeId' => $routeId,
            'targetStationId' => $requestTargetStationId,
            'attachments' => $attachments,
            'isDraft' => $asDraft,
            'requestMode' => (!$isComl && !$asDraft)
        ];
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
}

function firenet_mail_json_list(PDO $pdo, int $userId, int $stationId, string $folder, string $search, string $filter = ''): void
{
    echo json_encode([
        'ok' => true,
        'folder' => $folder,
        'items' => firenet_mail_fetch_list($pdo, $userId, $stationId, $folder, $search, $filter)
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = null;
    $pdo = firenet_get_pdo();
    firenet_mail_ensure_schema($pdo);

    if ($action === 'download') {
        $attachmentId = (int) ($_GET['attachmentId'] ?? 0);
        if ($attachmentId < 1) {
            firenet_mail_fail('Invalid attachment.', 422);
        }

        $stmt = $pdo->prepare('
            SELECT a.attachment_id, a.mail_id, a.original_file_name, a.stored_file_name, a.file_path, a.mime_type, a.file_size_bytes, m.thread_id, m.sender_user_id, m.is_draft
            FROM station_mail_attachments a
            JOIN station_mail_messages m ON m.mail_id = a.mail_id
            WHERE a.attachment_id = ?
            LIMIT 1
        ');
        $stmt->execute([$attachmentId]);
        $attachment = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$attachment) {
            firenet_mail_fail('Attachment not found.', 404);
        }

        $threadId = (int) ($attachment['thread_id'] ?? 0);
        $accessStmt = $pdo->prepare('
            SELECT 1
            FROM station_mail_messages message
            LEFT JOIN station_mail_recipients recipient ON recipient.mail_id = message.mail_id AND recipient.deleted_at IS NULL AND (recipient.recipient_station_id = ? OR recipient.recipient_user_id = ?)
            WHERE message.thread_id = ?
              AND (message.sender_user_id = ? OR recipient.recipient_station_id IS NOT NULL OR recipient.recipient_user_id IS NOT NULL)
            LIMIT 1
        ');
        $accessStmt->execute([$currentStationId, $currentUserId, $threadId, $currentUserId]);
        if (!$accessStmt->fetchColumn()) {
            firenet_mail_fail('You do not have access to this attachment.', 403);
        }

        $route = firenet_mail_request_route_by_thread($pdo, $threadId);
        if ($route !== []) {
            $needAck = false;
            if (!empty($route['isConfidential'])
                && (int) ($route['requestUserId'] ?? 0) === $currentUserId
                && (string) ($route['releasedAccessMode'] ?? '') !== ''
                && (string) ($route['confidentialAcknowledgedAt'] ?? '') === '') {
                $needAck = true;
            }

            if ($needAck) {
                firenet_mail_fail('Confirm confidential access in the operational mail thread before downloading this file.', 403);
            }

            firenet_mail_operational_audit($pdo, $threadId, (int) ($route['routeId'] ?? 0) ?: null, $currentUserId, $currentStationId, 'attachment_download', [
                'attachmentId' => $attachmentId,
            ]);
        }

        $relativePath = str_replace('\\', '/', (string) ($attachment['file_path'] ?? ''));
        if (preg_match('/^https?:\/\//i', $relativePath)) {
            header('Location: ' . $relativePath);
            exit;
        }

        $relativePath = ltrim($relativePath, '/');
        $fullPath = __DIR__ . '/../../' . $relativePath;
        if (!is_file($fullPath)) {
            firenet_mail_fail('Attachment file is missing.', 404);
        }

        header('Content-Type: ' . (string) ($attachment['mime_type'] ?: 'application/octet-stream'));
        header('Content-Length: ' . filesize($fullPath));
        header('Content-Disposition: attachment; filename="' . str_replace('"', '', (string) ($attachment['original_file_name'] ?? 'attachment')) . '"');
        readfile($fullPath);
        exit;
    }

    if ($action === 'orgmail-upload') {
        if (empty($_FILES['file']['tmp_name']) || !is_uploaded_file((string) $_FILES['file']['tmp_name'])) {
            firenet_mail_fail('Select a file to upload to your station folder.', 422);
        }

        $currentStationCode = firenet_mail_station_code($pdo, $currentStationId);
        if ($currentStationCode === '') {
            firenet_mail_fail('Unable to determine your station code. Contact your administrator.', 422);
        }

        $mime = (string) ($_FILES['file']['type'] ?? 'application/octet-stream');
        $secureUrl = firenet_mail_orgmail_upload_signed((string) $_FILES['file']['tmp_name'], $mime, $currentStationCode);
        echo json_encode(['ok' => true, 'data' => ['secureUrl' => $secureUrl]], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'operational-attachment-access') {
        $attachmentId = (int) ($_GET['attachmentId'] ?? 0);
        if ($attachmentId < 1) {
            firenet_mail_fail('Invalid attachment.', 422);
        }

        $stmt = $pdo->prepare('
            SELECT a.attachment_id, a.mail_id, a.file_path, m.thread_id
            FROM station_mail_attachments a
            JOIN station_mail_messages m ON m.mail_id = a.mail_id
            WHERE a.attachment_id = ?
            LIMIT 1
        ');
        $stmt->execute([$attachmentId]);
        $attachment = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$attachment) {
            firenet_mail_fail('Attachment not found.', 404);
        }

        $threadId = (int) ($attachment['thread_id'] ?? 0);
        if (!firenet_mail_can_view_thread($pdo, $threadId, $currentUserId, $currentStationId)) {
            firenet_mail_fail('You do not have access to this thread.', 403);
        }

        $route = firenet_mail_request_route_by_thread($pdo, $threadId);
        $needAck = false;
        if ($route !== []) {
            if (!empty($route['isConfidential'])
                && (int) ($route['requestUserId'] ?? 0) === $currentUserId
                && (string) ($route['releasedAccessMode'] ?? '') !== ''
                && (string) ($route['confidentialAcknowledgedAt'] ?? '') === '') {
                $needAck = true;
            }
        }

        $downloadUrl = '/firenet/NEWFIRENET/backend/controllers/station_mails.php?action=download&attachmentId=' . $attachmentId;
        echo json_encode([
            'ok' => true,
            'data' => [
                'needAck' => $needAck,
                'downloadUrl' => $downloadUrl,
            ],
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'request-confidential-ack') {
        $input = array_merge($_POST, firenet_mail_parse_json_input());
        $routeId = (int) ($input['routeId'] ?? 0);
        if ($routeId < 1) {
            firenet_mail_fail('Invalid request route.', 422);
        }

        $routeStmt = $pdo->prepare('SELECT * FROM station_mail_request_routes WHERE route_id = ? LIMIT 1');
        $routeStmt->execute([$routeId]);
        $routeRow = $routeStmt->fetch(PDO::FETCH_ASSOC);
        if (!$routeRow) {
            firenet_mail_fail('Request route not found.', 404);
        }

        if ((int) ($routeRow['request_user_id'] ?? 0) !== $currentUserId) {
            firenet_mail_fail('Only the requesting user can acknowledge confidential access.', 403);
        }

        if (((int) ($routeRow['is_confidential'] ?? 0)) !== 1) {
            firenet_mail_fail('This request is not marked confidential.', 422);
        }

        $upd = $pdo->prepare('UPDATE station_mail_request_routes SET confidential_acknowledged_at = NOW(), updated_at = NOW() WHERE route_id = ?');
        $upd->execute([$routeId]);
        firenet_mail_operational_audit($pdo, (int) ($routeRow['thread_id'] ?? 0), $routeId, $currentUserId, $currentStationId, 'confidential_ack', []);

        echo json_encode(['ok' => true, 'message' => 'Acknowledgement recorded.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'bootstrap') {
        $currentUserProfile = firenet_mail_current_user_profile($pdo, $currentUserId);
        if ($currentUserProfile !== []) {
            $currentRole = (string) ($currentUserProfile['roleName'] ?? $currentRole);
        }

        echo json_encode([
            'ok' => true,
            'data' => firenet_mail_bootstrap($pdo, $currentUserId, $currentStationId, $currentRole, $currentUserProfile)
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'barangays-for-station') {
        $stationId = (int) ($_GET['stationId'] ?? $_POST['stationId'] ?? 0);
        if ($stationId < 1) {
            firenet_mail_fail('Invalid station ID.', 422);
        }

        // Verify the station exists
        $stationCheckStmt = $pdo->prepare('SELECT station_id FROM stations WHERE station_id = ? LIMIT 1');
        $stationCheckStmt->execute([$stationId]);
        if (!$stationCheckStmt->fetchColumn()) {
            firenet_mail_fail('Station not found.', 404);
        }

        // Get all unique barangays from fire_hydrants table for this station
        // Since fire_hydrants doesn't have a direct station_id, we'll get all unique barangays
        // This assumes barangays are mapped through geography or we need to create this mapping
        $stmt = $pdo->prepare('
            SELECT DISTINCT barangay
            FROM fire_hydrants
            WHERE barangay IS NOT NULL AND barangay != ""
            ORDER BY barangay ASC
        ');
        $stmt->execute();
        $barangays = array_map(function($row) {
            return ['barangayName' => (string)$row['barangay']];
        }, $stmt->fetchAll(PDO::FETCH_ASSOC));

        echo json_encode([
            'ok' => true,
            'data' => [
                'barangays' => $barangays
            ]
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'list') {
        $folder = strtolower(trim((string) ($_GET['folder'] ?? 'inbox')));
        $search = (string) ($_GET['search'] ?? '');
        $filter = strtolower(trim((string) ($_GET['filter'] ?? '')));
        firenet_mail_json_list($pdo, $currentUserId, $currentStationId, $folder, $search, $filter);
    }

    if ($action === 'thread') {
        $threadId = (int) ($_GET['threadId'] ?? $_GET['id'] ?? 0);
        if ($threadId < 1) {
            firenet_mail_fail('Invalid thread.', 422);
        }

        if (!firenet_mail_can_view_thread($pdo, $threadId, $currentUserId, $currentStationId)) {
            firenet_mail_fail('You do not have access to this thread.', 403);
        }

        firenet_mail_mark_thread_read($pdo, $threadId, $currentStationId, $currentUserId);

        $detail = firenet_mail_thread_detail($pdo, $threadId);
        if ($detail === []) {
            firenet_mail_fail('Thread not found.', 404);
        }

        echo json_encode(['ok' => true, 'data' => $detail], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'send' || $action === 'save-draft') {
        $input = array_merge($_POST, firenet_mail_parse_json_input());
        $currentUserProfile = firenet_mail_current_user_profile($pdo, $currentUserId);
        $result = firenet_mail_store_message($pdo, $input, $currentUserId, $currentStationId, $currentRole, $currentUserProfile, $action === 'save-draft');

        echo json_encode([
            'ok' => true,
            'message' => $action === 'save-draft' ? 'Draft saved.' : 'Mail sent.',
            'data' => $result
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'request-edit' || $action === 'request-approve' || $action === 'request-reject' || $action === 'request-target-assign' || $action === 'request-target-confirm-confidential' || $action === 'request-target-reject' || $action === 'request-target-edit' || $action === 'request-target-file-returned' || $action === 'request-target-return-origin' || $action === 'request-origin-assign') {
        $currentUserProfile = firenet_mail_current_user_profile($pdo, $currentUserId);
        if (!firenet_mail_is_coml_position($currentUserProfile)) {
            firenet_mail_fail('Only ComL users can review requests.', 403);
        }

        $input = array_merge($_POST, firenet_mail_parse_json_input());
        $routeId = (int) ($input['routeId'] ?? 0);

        // If no routeId supplied, allow the caller to provide threadId so we
        // can resolve the latest route for that thread. This helps UIs that
        // don't know the routeId but have the thread context.
        $route = null;
        if ($routeId < 1) {
            $threadIdFallback = (int) ($input['threadId'] ?? 0);
            if ($threadIdFallback > 0) {
                $routeStmt = $pdo->prepare('
                    SELECT rr.*, t.subject AS thread_subject, m.body AS request_body, m.sender_station_id AS request_station_id
                    FROM station_mail_request_routes rr
                    JOIN station_mail_threads t ON t.thread_id = rr.thread_id
                    JOIN station_mail_messages m ON m.mail_id = rr.request_mail_id
                    WHERE rr.thread_id = ?
                    ORDER BY rr.created_at DESC
                    LIMIT 1
                ');
                $routeStmt->execute([$threadIdFallback]);
                $route = $routeStmt->fetch(PDO::FETCH_ASSOC);
                if ($route) {
                    $routeId = (int) ($route['route_id'] ?? 0);
                }
            }
        }

        // If we still don't have a route, fail early
        if ($routeId < 1 && !$route) {
            firenet_mail_fail('Invalid request route.', 422);
        }

        // If route wasn't loaded by thread fallback above, load it by route_id
        if (!$route) {
            $routeStmt = $pdo->prepare('
                SELECT rr.*, t.subject AS thread_subject, m.body AS request_body, m.sender_station_id AS request_station_id
                FROM station_mail_request_routes rr
                JOIN station_mail_threads t ON t.thread_id = rr.thread_id
                JOIN station_mail_messages m ON m.mail_id = rr.request_mail_id
                WHERE rr.route_id = ?
                LIMIT 1
            ');
            $routeStmt->execute([$routeId]);
            $route = $routeStmt->fetch(PDO::FETCH_ASSOC);
        }

        if (!$route) {
            firenet_mail_fail('Request route not found.', 404);
        }

        if ($action === 'request-target-confirm-confidential') {
            $targetStationId = (int) ($route['target_station_id'] ?? 0);
            if ($targetStationId !== $currentStationId) {
                firenet_mail_fail('You can only confirm confidentiality for your own target station.', 403);
            }

            if (((int) ($route['is_confidential'] ?? 0)) !== 1) {
                firenet_mail_fail('This request is not marked confidential.', 422);
            }

            $status = (string) ($route['status'] ?? '');
            if (!in_array($status, ['forwarded_to_target', 'routed_to_user', 'file_returned_to_coml'], true)) {
                firenet_mail_fail('Confidentiality cannot be confirmed in the current request state.', 422);
            }

            $upd = $pdo->prepare('UPDATE station_mail_request_routes SET target_confidential_confirmed = 1, updated_at = NOW() WHERE route_id = ?');
            $upd->execute([$routeId]);
            firenet_mail_operational_audit($pdo, (int) ($route['thread_id'] ?? 0), $routeId, $currentUserId, $currentStationId, 'target_confidential_confirm', []);

            echo json_encode(['ok' => true, 'message' => 'Target station confidentiality acknowledgement recorded.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Target station: assign request to station user and keep the route open for later return
        if ($action === 'request-target-assign') {
            $targetStationId = (int) ($route['target_station_id'] ?? 0);
            if ($targetStationId !== $currentStationId) {
                firenet_mail_fail('You can only assign requests for your own target station.', 403);
            }

            $status = (string) ($route['status'] ?? '');
            if (!in_array($status, ['forwarded_to_target', 'routed_to_user', 'file_returned_to_coml'], true)) {
                firenet_mail_fail('This request is not yet available for target-station assignment.', 422);
            }

            $assignedUserId = (int) ($input['assignedUserId'] ?? 0);
            if ($assignedUserId < 1) {
                firenet_mail_fail('Select a target-station user.', 422);
            }
            if (!firenet_mail_station_active_user($pdo, $currentStationId, $assignedUserId)) {
                firenet_mail_fail('The selected user is not active in your station.', 422);
            }

            $assignmentNote = firenet_mail_clean_text((string) ($input['note'] ?? ''));
            $subject = (string) ($route['edited_subject'] ?: $route['thread_subject'] ?: '(No subject)');
            $body = $assignmentNote !== ''
                ? $assignmentNote
                : 'Target ComL assigned this request to you. Please attach the requested file and return it to ComL.';

            $pdo->beginTransaction();
            try {
                $messageStmt = $pdo->prepare('
                    INSERT INTO station_mail_messages (
                        thread_id, parent_mail_id, sender_user_id, sender_station_id,
                        subject, body, mail_type, importance, request_files, is_draft, sent_at
                    ) VALUES (?, ?, ?, ?, ?, ?, "request", "normal", 1, 0, NOW())
                ');
                $messageStmt->execute([
                    (int) ($route['thread_id'] ?? 0),
                    (int) (($route['forwarded_mail_id'] ?? 0) ?: ($route['request_mail_id'] ?? 0)),
                    $currentUserId,
                    $currentStationId,
                    $subject,
                    $body
                ]);

                $assignedMailId = (int) $pdo->lastInsertId();
                $recipientStmt = $pdo->prepare('INSERT INTO station_mail_recipients (mail_id, recipient_type, recipient_user_id) VALUES (?, "user", ?)');
                $recipientStmt->execute([$assignedMailId, $assignedUserId]);

                $threadUpdateStmt = $pdo->prepare('UPDATE station_mail_threads SET last_message_at = NOW(), updated_at = NOW() WHERE thread_id = ?');
                $threadUpdateStmt->execute([(int) ($route['thread_id'] ?? 0)]);

                $routeUpdateStmt = $pdo->prepare('
                    UPDATE station_mail_request_routes
                    SET status = "routed_to_user", target_reviewed_by = ?, target_reviewed_at = NOW(), target_review_notes = COALESCE(?, target_review_notes), updated_at = NOW()
                    WHERE route_id = ?
                ');
                $routeUpdateStmt->execute([$currentUserId, $assignmentNote !== '' ? $assignmentNote : null, $routeId]);

                $pdo->commit();
            } catch (Throwable $error) {
                $pdo->rollBack();
                throw $error;
            }

            echo json_encode(['ok' => true, 'message' => 'Request assigned to the selected station user.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($action === 'request-target-reject') {
            $targetStationId = (int) ($route['target_station_id'] ?? 0);
            if ($targetStationId !== $currentStationId) {
                firenet_mail_fail('You can only reject requests for your own target station.', 403);
            }

            $status = (string) ($route['status'] ?? '');
            if (!in_array($status, ['forwarded_to_target', 'routed_to_user', 'file_returned_to_coml'], true)) {
                firenet_mail_fail('This request cannot be rejected in its current state.', 422);
            }

            $reason = firenet_mail_clean_text((string) ($input['reason'] ?? ''));
            if ($reason === '') {
                firenet_mail_fail('Enter a reason for rejecting the request.', 422);
            }

            $pdo->beginTransaction();
            try {
                $messageStmt = $pdo->prepare('
                    INSERT INTO station_mail_messages (
                        thread_id, parent_mail_id, sender_user_id, sender_station_id,
                        subject, body, mail_type, importance, request_files, is_draft, sent_at
                    ) VALUES (?, ?, ?, ?, ?, ?, "request", "normal", 1, 0, NOW())
                ');
                $messageStmt->execute([
                    (int) ($route['thread_id'] ?? 0),
                    (int) (($route['forwarded_mail_id'] ?? 0) ?: ($route['request_mail_id'] ?? 0)),
                    $currentUserId,
                    $currentStationId,
                    (string) ($route['edited_subject'] ?: $route['thread_subject'] ?: '(No subject)'),
                    'Target ComL rejected this request: ' . $reason,
                ]);

                $threadUpdateStmt = $pdo->prepare('UPDATE station_mail_threads SET last_message_at = NOW(), updated_at = NOW() WHERE thread_id = ?');
                $threadUpdateStmt->execute([(int) ($route['thread_id'] ?? 0)]);

                $routeUpdateStmt = $pdo->prepare('
                    UPDATE station_mail_request_routes
                    SET status = "rejected", target_reviewed_by = ?, target_reviewed_at = NOW(), target_review_notes = ?, updated_at = NOW()
                    WHERE route_id = ?
                ');
                $routeUpdateStmt->execute([$currentUserId, $reason, $routeId]);

                $pdo->commit();
            } catch (Throwable $error) {
                $pdo->rollBack();
                throw $error;
            }

            $originComlIds = firenet_mail_station_coml_user_ids($pdo, (int) ($route['origin_station_id'] ?? 0));
            $threadIdT = (int) ($route['thread_id'] ?? 0);
            $subjectT = (string) ($route['edited_subject'] ?: $route['thread_subject'] ?: '(No subject)');
            $bodyT = 'Target ComL rejected the request. Reason: ' . $reason;
            firenet_mail_notify_route_users($pdo, $threadIdT, (int) ($route['request_mail_id'] ?? 0), $currentUserId, $currentStationId, $subjectT, $bodyT, $originComlIds);
            firenet_mail_operational_audit($pdo, $threadIdT, $routeId, $currentUserId, $currentStationId, 'target_reject', ['reason' => $reason]);

            echo json_encode(['ok' => true, 'message' => 'Request rejected by target ComL.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($action === 'request-target-edit') {
            $targetStationId = (int) ($route['target_station_id'] ?? 0);
            if ($targetStationId !== $currentStationId) {
                firenet_mail_fail('You can only edit requests for your own target station.', 403);
            }

            $status = (string) ($route['status'] ?? '');
            if (!in_array($status, ['forwarded_to_target', 'routed_to_user', 'file_returned_to_coml'], true)) {
                firenet_mail_fail('This request cannot be edited in its current state.', 422);
            }

            $note = firenet_mail_clean_text((string) ($input['note'] ?? ''));
            if ($note === '') {
                firenet_mail_fail('Enter the edit note for the request.', 422);
            }

            $pdo->beginTransaction();
            try {
                $messageStmt = $pdo->prepare('
                    INSERT INTO station_mail_messages (
                        thread_id, parent_mail_id, sender_user_id, sender_station_id,
                        subject, body, mail_type, importance, request_files, is_draft, sent_at
                    ) VALUES (?, ?, ?, ?, ?, ?, "request", "normal", 1, 0, NOW())
                ');
                $messageStmt->execute([
                    (int) ($route['thread_id'] ?? 0),
                    (int) (($route['forwarded_mail_id'] ?? 0) ?: ($route['request_mail_id'] ?? 0)),
                    $currentUserId,
                    $currentStationId,
                    (string) ($route['edited_subject'] ?: $route['thread_subject'] ?: '(No subject)'),
                    'Target ComL edited the request: ' . $note,
                ]);

                $threadUpdateStmt = $pdo->prepare('UPDATE station_mail_threads SET last_message_at = NOW(), updated_at = NOW() WHERE thread_id = ?');
                $threadUpdateStmt->execute([(int) ($route['thread_id'] ?? 0)]);

                $routeUpdateStmt = $pdo->prepare('
                    UPDATE station_mail_request_routes
                    SET edited_body = COALESCE(?, edited_body), updated_at = NOW()
                    WHERE route_id = ?
                ');
                $routeUpdateStmt->execute([$note, $routeId]);

                $pdo->commit();
            } catch (Throwable $error) {
                $pdo->rollBack();
                throw $error;
            }

            echo json_encode(['ok' => true, 'message' => 'Target ComL edits have been recorded.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($action === 'request-target-file-returned') {
            $targetStationId = (int) ($route['target_station_id'] ?? 0);
            if ($targetStationId !== $currentStationId) {
                firenet_mail_fail('You can only mark files returned for your own target station.', 403);
            }

            $status = (string) ($route['status'] ?? '');
            if ($status !== 'routed_to_user') {
                firenet_mail_fail('This request is not in a routed-to-user state.', 422);
            }

            $note = firenet_mail_clean_text((string) ($input['note'] ?? ''));
            $note = $note !== '' ? $note : 'The routed user has returned the attachment to target ComL.';

            $pdo->beginTransaction();
            try {
                $messageStmt = $pdo->prepare('
                    INSERT INTO station_mail_messages (
                        thread_id, parent_mail_id, sender_user_id, sender_station_id,
                        subject, body, mail_type, importance, request_files, is_draft, sent_at
                    ) VALUES (?, ?, ?, ?, ?, ?, "request", "normal", 1, 0, NOW())
                ');
                $messageStmt->execute([
                    (int) ($route['thread_id'] ?? 0),
                    (int) (($route['forwarded_mail_id'] ?? 0) ?: ($route['request_mail_id'] ?? 0)),
                    $currentUserId,
                    $currentStationId,
                    (string) ($route['edited_subject'] ?: $route['thread_subject'] ?: '(No subject)'),
                    $note,
                ]);

                $threadUpdateStmt = $pdo->prepare('UPDATE station_mail_threads SET last_message_at = NOW(), updated_at = NOW() WHERE thread_id = ?');
                $threadUpdateStmt->execute([(int) ($route['thread_id'] ?? 0)]);

                $routeUpdateStmt = $pdo->prepare('
                    UPDATE station_mail_request_routes
                    SET status = "file_returned_to_coml", target_reviewed_by = ?, target_reviewed_at = NOW(), target_review_notes = COALESCE(?, target_review_notes), updated_at = NOW()
                    WHERE route_id = ?
                ');
                $routeUpdateStmt->execute([$currentUserId, $note, $routeId]);

                $pdo->commit();
            } catch (Throwable $error) {
                $pdo->rollBack();
                throw $error;
            }

            echo json_encode(['ok' => true, 'message' => 'File return to target ComL has been recorded.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($action === 'request-target-return-origin') {
            $targetStationId = (int) ($route['target_station_id'] ?? 0);
            if ($targetStationId !== $currentStationId) {
                firenet_mail_fail('You can only return requests for your own target station.', 403);
            }

            $status = (string) ($route['status'] ?? '');
            if ($status !== 'file_returned_to_coml') {
                firenet_mail_fail('This request is not ready to be returned to the origin station.', 422);
            }

            $note = firenet_mail_clean_text((string) ($input['note'] ?? ''));
            $note = $note !== '' ? $note : 'Target ComL is returning the attached file back to the origin station ComL for final routing.';

            $cloudinaryUrl = trim((string) ($input['cloudinaryUrl'] ?? ''));
            if ($cloudinaryUrl === '') {
                firenet_mail_fail('Provide the Cloudinary URL for the file (must be in your station\'s folder).', 422);
            }

            if (((int) ($route['is_confidential'] ?? 0)) === 1 && ((int) ($route['target_confidential_confirmed'] ?? 0)) !== 1) {
                firenet_mail_fail('Target ComL must confirm confidentiality before returning files to the origin station.', 422);
            }

            firenet_mail_orgmail_require_url_for_station($cloudinaryUrl, (string) ($route['target_station_code'] ?? ''));

            $pdo->beginTransaction();
            try {
                $messageStmt = $pdo->prepare('
                    INSERT INTO station_mail_messages (
                        thread_id, parent_mail_id, sender_user_id, sender_station_id,
                        subject, body, mail_type, importance, request_files, is_draft, sent_at
                    ) VALUES (?, ?, ?, ?, ?, ?, "request", "normal", 1, 0, NOW())
                ');
                $messageStmt->execute([
                    (int) ($route['thread_id'] ?? 0),
                    (int) (($route['forwarded_mail_id'] ?? 0) ?: ($route['request_mail_id'] ?? 0)),
                    $currentUserId,
                    $currentStationId,
                    (string) ($route['edited_subject'] ?: $route['thread_subject'] ?: '(No subject)'),
                    $note,
                ]);

                $returnMailId = (int) $pdo->lastInsertId();
                firenet_mail_save_remote_attachment($pdo, $returnMailId, $currentUserId, $cloudinaryUrl, (string) ($route['target_station_code'] ?? ''));

                $originRecipientStmt = $pdo->prepare('INSERT INTO station_mail_recipients (mail_id, recipient_type, recipient_station_id) VALUES (?, "station", ?)');
                $originRecipientStmt->execute([$returnMailId, (int) ($route['origin_station_id'] ?? 0)]);

                $threadUpdateStmt = $pdo->prepare('UPDATE station_mail_threads SET last_message_at = NOW(), updated_at = NOW() WHERE thread_id = ?');
                $threadUpdateStmt->execute([(int) ($route['thread_id'] ?? 0)]);

                $routeUpdateStmt = $pdo->prepare('
                    UPDATE station_mail_request_routes
                    SET status = "returned_to_origin", target_reviewed_by = ?, target_reviewed_at = NOW(), target_review_notes = COALESCE(?, target_review_notes), updated_at = NOW()
                    WHERE route_id = ?
                ');
                $routeUpdateStmt->execute([$currentUserId, $note, $routeId]);

                firenet_mail_operational_audit($pdo, (int) ($route['thread_id'] ?? 0), $routeId, $currentUserId, $currentStationId, 'target_return_origin', ['attachment' => true]);

                $pdo->commit();
            } catch (Throwable $error) {
                $pdo->rollBack();
                throw $error;
            }

            echo json_encode(['ok' => true, 'message' => 'Request returned to the origin station.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($action === 'request-origin-assign') {
            $originStationId = (int) ($route['origin_station_id'] ?? 0);
            if ($originStationId !== $currentStationId) {
                firenet_mail_fail('You can only release requests for your own origin station.', 403);
            }

            $status = (string) ($route['status'] ?? '');
            if ($status !== 'returned_to_origin') {
                firenet_mail_fail('Files can only be released to the requester after the target station returns them to origin ComL.', 422);
            }

            $requestUserId = (int) ($route['request_user_id'] ?? 0);
            if ($requestUserId < 1) {
                firenet_mail_fail('Unable to locate the requesting user for this route.', 422);
            }

            $cloudinaryUrl = trim((string) ($input['cloudinaryUrl'] ?? ''));
            if ($cloudinaryUrl !== '') {
                firenet_mail_orgmail_require_url_for_origin_or_target(
                    $cloudinaryUrl,
                    (string) ($route['origin_station_code'] ?? ''),
                    (string) ($route['target_station_code'] ?? '')
                );
            }

            $releasedAccessMode = strtolower(trim((string) ($input['releasedAccessMode'] ?? 'full')));
            if (!in_array($releasedAccessMode, ['full', 'view_only'], true)) {
                $releasedAccessMode = 'full';
            }

            if (((int) ($route['is_confidential'] ?? 0)) === 1) {
                $releasedAccessMode = 'view_only';
            }

            $assignmentNote = firenet_mail_clean_text((string) ($input['note'] ?? ''));
            $subject = (string) ($route['edited_subject'] ?: $route['thread_subject'] ?: '(No subject)');
            $body = $assignmentNote !== ''
                ? $assignmentNote
                : 'Origin ComL is releasing the completed file to you. All inter-station coordination stays with ComL; contact your station ComL if you need follow-up.';

            $pdo->beginTransaction();
            try {
                $messageStmt = $pdo->prepare('
                    INSERT INTO station_mail_messages (
                        thread_id, parent_mail_id, sender_user_id, sender_station_id,
                        subject, body, mail_type, importance, request_files, is_draft, sent_at
                    ) VALUES (?, ?, ?, ?, ?, ?, "message", "normal", 0, 0, NOW())
                ');
                $messageStmt->execute([
                    (int) ($route['thread_id'] ?? 0),
                    (int) (($route['forwarded_mail_id'] ?? 0) ?: ($route['request_mail_id'] ?? 0)),
                    $currentUserId,
                    $currentStationId,
                    $subject,
                    $body,
                ]);

                $releaseMailId = (int) $pdo->lastInsertId();
                if ($cloudinaryUrl !== '') {
                    firenet_mail_save_remote_attachment($pdo, $releaseMailId, $currentUserId, $cloudinaryUrl, null);
                }

                $recipientStmt = $pdo->prepare('INSERT INTO station_mail_recipients (mail_id, recipient_type, recipient_user_id) VALUES (?, "user", ?)');
                $recipientStmt->execute([$releaseMailId, $requestUserId]);

                $threadUpdateStmt = $pdo->prepare('UPDATE station_mail_threads SET last_message_at = NOW(), updated_at = NOW() WHERE thread_id = ?');
                $threadUpdateStmt->execute([(int) ($route['thread_id'] ?? 0)]);

                $routeUpdateStmt = $pdo->prepare('
                    UPDATE station_mail_request_routes
                    SET status = "completed",
                        released_access_mode = ?,
                        confidential_acknowledged_at = NULL,
                        origin_review_notes = COALESCE(?, origin_review_notes),
                        updated_at = NOW()
                    WHERE route_id = ?
                ');
                $routeUpdateStmt->execute([
                    $releasedAccessMode,
                    $assignmentNote !== '' ? $assignmentNote : null,
                    $routeId,
                ]);

                firenet_mail_operational_audit($pdo, (int) ($route['thread_id'] ?? 0), $routeId, $currentUserId, $currentStationId, 'origin_release_requester', [
                    'releasedAccessMode' => $releasedAccessMode,
                ]);

                $pdo->commit();
            } catch (Throwable $error) {
                $pdo->rollBack();
                throw $error;
            }

            echo json_encode(['ok' => true, 'message' => 'File released to the requesting user.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (($route['status'] ?? '') !== 'pending_origin_review') {
            firenet_mail_fail('This request has already been reviewed.', 422);
        }

        $originStationId = (int) ($route['origin_station_id'] ?? 0);
        if ($originStationId !== $currentStationId) {
            firenet_mail_fail('You can only review requests for your own origin station.', 403);
        }

        if ($action === 'request-edit') {
            $editedSubject = firenet_mail_clean_text((string) ($input['subject'] ?? ''));
            $editedBody = firenet_mail_clean_text((string) ($input['body'] ?? ''));
            $targetStationId = (int) ($input['targetStationId'] ?? 0);
            if ($editedSubject === '') {
                $editedSubject = (string) ($route['thread_subject'] ?? '(No subject)');
            }
            if ($editedBody === '') {
                $editedBody = (string) ($route['request_body'] ?? '');
            }
            if ($targetStationId < 1) {
                $targetStationId = (int) ($route['target_station_id'] ?? 0);
            }
            if (!firenet_mail_station_has_coml_user($pdo, $targetStationId)) {
                firenet_mail_fail('The selected target station does not have an active ComL user.', 422);
            }

            $editStmt = $pdo->prepare('
                UPDATE station_mail_request_routes
                SET edited_subject = ?, edited_body = ?, target_station_id = ?, origin_review_notes = COALESCE(?, origin_review_notes), updated_at = NOW()
                WHERE route_id = ?
            ');
            $editStmt->execute([$editedSubject, $editedBody, $targetStationId, firenet_mail_clean_text((string) ($input['notes'] ?? '')), $routeId]);

            $threadUpdateStmt = $pdo->prepare('UPDATE station_mail_threads SET subject = ?, updated_at = NOW(), last_message_at = NOW() WHERE thread_id = ?');
            $threadUpdateStmt->execute([$editedSubject, (int) ($route['thread_id'] ?? 0)]);

            echo json_encode(['ok' => true, 'message' => 'Request updated.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($action === 'request-reject') {
            if ((int) ($route['origin_station_id'] ?? 0) !== $currentStationId) {
                firenet_mail_fail('You can only reject requests for your own origin station.', 403);
            }

            if ((string) ($route['status'] ?? '') !== 'pending_origin_review') {
                firenet_mail_fail('This request cannot be rejected in its current state.', 422);
            }

            $reason = firenet_mail_clean_text((string) ($input['reason'] ?? ''));
            $rejectStmt = $pdo->prepare('
                UPDATE station_mail_request_routes
                SET status = "rejected", origin_reviewed_by = ?, origin_reviewed_at = NOW(), origin_review_notes = ?, updated_at = NOW()
                WHERE route_id = ?
            ');
            $rejectStmt->execute([$currentUserId, $reason, $routeId]);

            $threadId = (int) ($route['thread_id'] ?? 0);
            $requestUserId = (int) ($route['request_user_id'] ?? 0);
            $subject = (string) ($route['thread_subject'] ?? 'Operational request');
            $body = 'Your operational request was rejected by origin ComL.' . ($reason !== '' ? ' Reason: ' . $reason : '');
            firenet_mail_notify_route_users($pdo, $threadId, (int) ($route['request_mail_id'] ?? 0), $currentUserId, $currentStationId, $subject, $body, [$requestUserId]);
            firenet_mail_operational_audit($pdo, $threadId, $routeId, $currentUserId, $currentStationId, 'origin_reject', ['reason' => $reason]);

            echo json_encode(['ok' => true, 'message' => 'Request rejected.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            exit;
        }

        $subject = firenet_mail_clean_text((string) ($input['subject'] ?? ''));
        $body = firenet_mail_clean_text((string) ($input['body'] ?? ''));
        if ($subject === '') {
            $subject = (string) ($route['edited_subject'] ?: $route['thread_subject'] ?: '(No subject)');
        }
        if ($body === '') {
            $body = (string) ($route['edited_body'] ?: $route['request_body'] ?: '');
        }
        $targetStationId = (int) ($route['target_station_id'] ?? 0);
        $targetComlUserIds = firenet_mail_station_coml_user_ids($pdo, $targetStationId);
        if ($targetComlUserIds === []) {
            firenet_mail_fail('The selected target station does not have an active ComL user.', 422);
        }

        $pdo->beginTransaction();
        try {
            $isConfidential = !empty($input['isConfidential']) || !empty($input['confidential']) ? 1 : 0;
            $updateStmt = $pdo->prepare('
                UPDATE station_mail_request_routes
                SET status = "approved", origin_reviewed_by = ?, origin_reviewed_at = NOW(), is_confidential = ?, updated_at = NOW()
                WHERE route_id = ?
            ');
            $updateStmt->execute([$currentUserId, $isConfidential, $routeId]);

            $threadStmt = $pdo->prepare('UPDATE station_mail_threads SET subject = ?, last_message_at = NOW() WHERE thread_id = ?');
            $threadStmt->execute([$subject, (int) ($route['thread_id'] ?? 0)]);

            $messageStmt = $pdo->prepare('
                INSERT INTO station_mail_messages (
                    thread_id, parent_mail_id, sender_user_id, sender_station_id,
                    subject, body, mail_type, importance, request_files, is_draft, sent_at
                ) VALUES (?, ?, ?, ?, ?, ?, "request", "normal", 1, 0, NOW())
            ');
            $messageStmt->execute([
                (int) ($route['thread_id'] ?? 0),
                (int) ($route['request_mail_id'] ?? 0),
                $currentUserId,
                $currentStationId,
                $subject,
                $body
            ]);

            $forwardMailId = (int) $pdo->lastInsertId();
            $recipientStmt = $pdo->prepare('INSERT INTO station_mail_recipients (mail_id, recipient_type, recipient_user_id) VALUES (?, "user", ?)');
            foreach ($targetComlUserIds as $targetComlUserId) {
                $recipientStmt->execute([$forwardMailId, $targetComlUserId]);
            }

            $routeUpdateStmt = $pdo->prepare('UPDATE station_mail_request_routes SET forwarded_mail_id = ?, forwarded_at = NOW(), status = "forwarded_to_target" WHERE route_id = ?');
            $routeUpdateStmt->execute([$forwardMailId, $routeId]);

            $pdo->commit();
        } catch (Throwable $error) {
            $pdo->rollBack();
            throw $error;
        }

        echo json_encode(['ok' => true, 'message' => 'Request approved and forwarded to the target station ComL.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'mark-read' || $action === 'mark-unread' || $action === 'archive' || $action === 'restore' || $action === 'star' || $action === 'unstar') {
        $threadId = (int) ($_POST['threadId'] ?? $_GET['threadId'] ?? 0);
        if ($threadId < 1) {
            firenet_mail_fail('Invalid thread.', 422);
        }

        if (!firenet_mail_can_view_thread($pdo, $threadId, $currentUserId, $currentStationId)) {
            firenet_mail_fail('You do not have access to this thread.', 403);
        }

        if ($action === 'mark-read') {
            $stmt = $pdo->prepare('
                UPDATE station_mail_recipients r
                JOIN station_mail_messages m ON m.mail_id = r.mail_id
                SET r.read_at = NOW()
                WHERE m.thread_id = ?
                  AND (r.recipient_station_id = ? OR r.recipient_user_id = ?)
                  AND r.deleted_at IS NULL
                  AND m.is_draft = 0
            ');
            $stmt->execute([$threadId, $currentStationId, $currentUserId]);
        } elseif ($action === 'mark-unread') {
            $stmt = $pdo->prepare('
                UPDATE station_mail_recipients r
                JOIN station_mail_messages m ON m.mail_id = r.mail_id
                SET r.read_at = NULL
                WHERE m.thread_id = ?
                  AND (r.recipient_station_id = ? OR r.recipient_user_id = ?)
                  AND r.deleted_at IS NULL
                  AND m.is_draft = 0
            ');
            $stmt->execute([$threadId, $currentStationId, $currentUserId]);
        } elseif ($action === 'archive') {
            $stmt = $pdo->prepare('
                UPDATE station_mail_recipients r
                JOIN station_mail_messages m ON m.mail_id = r.mail_id
                SET r.archived_at = COALESCE(r.archived_at, NOW())
                WHERE m.thread_id = ?
                  AND (r.recipient_station_id = ? OR r.recipient_user_id = ?)
                  AND r.deleted_at IS NULL
                  AND m.is_draft = 0
            ');
            $stmt->execute([$threadId, $currentStationId, $currentUserId]);
        } elseif ($action === 'star') {
            $stmt = $pdo->prepare('
                UPDATE station_mail_recipients r
                JOIN station_mail_messages m ON m.mail_id = r.mail_id
                SET r.starred_at = COALESCE(r.starred_at, NOW())
                WHERE m.thread_id = ?
                  AND (r.recipient_station_id = ? OR r.recipient_user_id = ?)
                  AND r.deleted_at IS NULL
                  AND m.is_draft = 0
            ');
            $stmt->execute([$threadId, $currentStationId, $currentUserId]);
        } elseif ($action === 'unstar') {
            $stmt = $pdo->prepare('
                UPDATE station_mail_recipients r
                JOIN station_mail_messages m ON m.mail_id = r.mail_id
                SET r.starred_at = NULL
                WHERE m.thread_id = ?
                  AND (r.recipient_station_id = ? OR r.recipient_user_id = ?)
                  AND r.deleted_at IS NULL
                  AND m.is_draft = 0
            ');
            $stmt->execute([$threadId, $currentStationId, $currentUserId]);
        } else {
            $stmt = $pdo->prepare('
                UPDATE station_mail_recipients r
                JOIN station_mail_messages m ON m.mail_id = r.mail_id
                SET r.archived_at = NULL
                WHERE m.thread_id = ?
                  AND (r.recipient_station_id = ? OR r.recipient_user_id = ?)
                  AND r.deleted_at IS NULL
                  AND m.is_draft = 0
            ');
            $stmt->execute([$threadId, $currentStationId, $currentUserId]);
        }

        echo json_encode(['ok' => true, 'message' => 'Mail updated.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'delete') {
        $threadId = (int) ($_POST['threadId'] ?? $_GET['threadId'] ?? 0);
        if ($threadId < 1) {
            firenet_mail_fail('Invalid thread.', 422);
        }

        if (!firenet_mail_can_view_thread($pdo, $threadId, $currentUserId, $currentStationId)) {
            firenet_mail_fail('You do not have access to this thread.', 403);
        }

        $stmt = $pdo->prepare('
            UPDATE station_mail_recipients r
            JOIN station_mail_messages m ON m.mail_id = r.mail_id
            SET r.deleted_at = NOW()
            WHERE m.thread_id = ?
              AND (r.recipient_station_id = ? OR r.recipient_user_id = ?)
              AND r.deleted_at IS NULL
              AND m.is_draft = 0
        ');
          $stmt->execute([$threadId, $currentStationId, $currentUserId]);

        echo json_encode(['ok' => true, 'message' => 'Mail moved to deleted items.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'reply') {
        $input = array_merge($_POST, firenet_mail_parse_json_input());
        $threadId = (int) ($input['threadId'] ?? 0);
        if ($threadId < 1) {
            firenet_mail_fail('Invalid thread.', 422);
        }

        $currentUserProfile = firenet_mail_current_user_profile($pdo, $currentUserId);

        if (!firenet_mail_can_view_thread($pdo, $threadId, $currentUserId, $currentStationId)) {
            firenet_mail_fail('You do not have access to this thread.', 403);
        }

        $isComl = firenet_mail_is_coml_position($currentUserProfile);
        $requestRoute = firenet_mail_request_route_by_thread($pdo, $threadId);
        $allowNonComlRequestReply = false;

        if (!$isComl && $requestRoute !== []) {
            $routeStatus = (string) ($requestRoute['status'] ?? '');
            $targetStationId = (int) ($requestRoute['targetStationId'] ?? 0);
            if (!in_array($routeStatus, ['forwarded_to_target', 'routed_to_user', 'file_returned_to_coml', 'completed'], true) || $targetStationId !== $currentStationId) {
                firenet_mail_fail('You are not allowed to reply to this request thread.', 403);
            }

            $recipientCheckStmt = $pdo->prepare('
                SELECT 1
                FROM station_mail_messages m
                JOIN station_mail_recipients r ON r.mail_id = m.mail_id
                WHERE m.thread_id = ?
                  AND r.recipient_user_id = ?
                  AND r.deleted_at IS NULL
                LIMIT 1
            ');
            $recipientCheckStmt->execute([$threadId, $currentUserId]);
            if (!$recipientCheckStmt->fetchColumn()) {
                firenet_mail_fail('You are not assigned to this request thread.', 403);
            }

            $allowNonComlRequestReply = true;
        }

        $threadStmt = $pdo->prepare('SELECT subject FROM station_mail_threads WHERE thread_id = ? LIMIT 1');
        $threadStmt->execute([$threadId]);
        if (!$threadStmt->fetchColumn()) {
            firenet_mail_fail('Thread not found.', 404);
        }

        if ($allowNonComlRequestReply) {
            $targetStations = [(int) ($requestRoute['originStationId'] ?? 0)];
        } else {
            $latestRecipientStmt = $pdo->prepare('
                SELECT DISTINCT r.recipient_station_id
                FROM station_mail_messages m
                JOIN station_mail_recipients r ON r.mail_id = m.mail_id
                WHERE m.thread_id = ?
                  AND m.is_draft = 0
                  AND r.deleted_at IS NULL
                  AND r.recipient_station_id IS NOT NULL
                  AND r.recipient_station_id <> ?
            ');
            $latestRecipientStmt->execute([$threadId, $currentStationId]);
            $targetStations = array_map('intval', $latestRecipientStmt->fetchAll(PDO::FETCH_COLUMN));
        }
        $input['recipientStationIds'] = $targetStations;
        $input['threadId'] = $threadId;
        if ($allowNonComlRequestReply) {
            $input['mailType'] = 'message';
            $input['requestFiles'] = 0;
        }

        $result = firenet_mail_store_message($pdo, $input, $currentUserId, $currentStationId, $currentRole, $currentUserProfile, false, $allowNonComlRequestReply);
        echo json_encode(['ok' => true, 'message' => 'Reply sent.', 'data' => $result], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    firenet_mail_fail('Unsupported mail action.', 405);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Station mails controller error: ' . $error->getMessage());
    error_log('Station mails stack: ' . $error->getTraceAsString());

    firenet_mail_fail('Mail service unavailable.', 500);
}