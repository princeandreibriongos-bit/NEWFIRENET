<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();
firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
if ($userId < 1) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Unauthorized']);
    exit;
}

const FIRENET_PROFILE_UPLOAD_DIR = __DIR__ . '/../../uploads/photos';
const FIRENET_PROFILE_UPLOAD_WEB_PREFIX = '/firenet/NEWFIRENET/uploads/photos/';

function firenet_load_app_config(): array {
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $configFile = __DIR__ . '/../../config/config.php';
    if (!is_file($configFile)) {
        $config = [];
        return $config;
    }

    $loaded = require $configFile;
    $config = is_array($loaded) ? $loaded : [];
    return $config;
}

function firenet_mailer_is_ready(): bool {
    static $loaded = false;
    if ($loaded) {
        return class_exists('\\PHPMailer\\PHPMailer\\PHPMailer');
    }

    $autoloadPath = __DIR__ . '/../../vendor/autoload.php';
    if (!is_file($autoloadPath)) {
        return false;
    }

    require_once $autoloadPath;
    $loaded = true;
    return class_exists('\\PHPMailer\\PHPMailer\\PHPMailer');
}

function firenet_send_password_change_email(string $toEmail, string $toUsername, string $stationName): void {
    if (!firenet_mailer_is_ready()) {
        throw new RuntimeException('PHPMailer is not installed. Run Composer install first.');
    }

    $config = firenet_load_app_config();
    $mailConfig = is_array($config['mail'] ?? null) ? $config['mail'] : [];

    $smtpHost = trim((string) ($mailConfig['smtp_host'] ?? ''));
    $smtpPort = (int) ($mailConfig['smtp_port'] ?? 587);
    $smtpUser = trim((string) ($mailConfig['smtp_username'] ?? ''));
    $smtpPass = (string) ($mailConfig['smtp_password'] ?? '');
    $smtpEncryption = strtolower(trim((string) ($mailConfig['smtp_encryption'] ?? 'tls')));
    $fromEmail = trim((string) ($mailConfig['from_email'] ?? $smtpUser));
    $fromName = trim((string) ($mailConfig['from_name'] ?? 'FireNet Security'));

    if ($smtpHost === '' || $smtpPort < 1 || $smtpUser === '' || $smtpPass === '' || $fromEmail === '') {
        throw new RuntimeException('SMTP settings are incomplete. Please configure mail settings in config/config.php.');
    }

    $secureTransport = $smtpEncryption;
    if (!in_array($secureTransport, ['ssl', 'tls'], true)) {
        $secureTransport = 'tls';
    }

    $timestamp = date('Y-m-d H:i:s');
    $safeUsername = htmlspecialchars($toUsername, ENT_QUOTES, 'UTF-8');
    $safeStation = htmlspecialchars($stationName, ENT_QUOTES, 'UTF-8');
    $htmlBody = '<p>Hello <strong>' . $safeUsername . '</strong>,</p>'
        . '<p>Your FireNet account password was changed successfully.</p>'
        . '<p><strong>Station:</strong> ' . $safeStation . '<br>'
        . '<strong>Time:</strong> ' . htmlspecialchars($timestamp, ENT_QUOTES, 'UTF-8') . '</p>'
        . '<p>If you did not perform this change, please contact your station administrator immediately.</p>'
        . '<p>FireNet Security Team</p>';
    $textBody = "Hello {$toUsername},\n\n"
        . "Your FireNet account password was changed successfully.\n"
        . "Station: {$stationName}\n"
        . "Time: {$timestamp}\n\n"
        . "If you did not perform this change, please contact your station administrator immediately.\n\n"
        . "FireNet Security Team";

    $mailerClass = '\\PHPMailer\\PHPMailer\\PHPMailer';
    $mailer = new $mailerClass(true);
    $mailer->isSMTP();
    $mailer->Host = $smtpHost;
    $mailer->SMTPAuth = true;
    $mailer->Username = $smtpUser;
    $mailer->Password = $smtpPass;
    $mailer->SMTPSecure = $secureTransport;
    $mailer->Port = $smtpPort;
    $mailer->CharSet = 'UTF-8';

    $mailer->setFrom($fromEmail, $fromName);
    $mailer->addAddress($toEmail, $toUsername !== '' ? $toUsername : $toEmail);
    $mailer->isHTML(true);
    $mailer->Subject = 'FireNet Password Change Confirmation';
    $mailer->Body = $htmlBody;
    $mailer->AltBody = $textBody;
    $mailer->send();
}

function firenet_read_input(): array {
    $input = $_POST;
    if (!empty($input)) {
        return is_array($input) ? $input : [];
    }

    $raw = file_get_contents('php://input');
    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function firenet_verify_password_input(string $provided, string $stored): bool {
    $passwordInfo = password_get_info($stored);
    if (!empty($passwordInfo['algo'])) {
        return password_verify($provided, $stored);
    }

    return hash_equals($stored, $provided);
}

function firenet_profile_photo_table_exists(PDO $pdo): bool {
    static $exists = null;
    if ($exists !== null) {
        return $exists;
    }

    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profile_photos'");
    $exists = (int) ($stmt->fetchColumn() ?: 0) > 0;
    return $exists;
}

function firenet_user_settings_defaults(): array {
    return [
        'compactMode' => false,
        'reduceMotion' => false,
        'darkMode' => false,
        'securityAlerts' => true,
        'hideSensitive' => false,
        'autoLogoutMinutes' => 30
    ];
}

function firenet_user_settings_table_exists(PDO $pdo): bool {
    if (array_key_exists('firenet_user_settings_table_exists_cache', $GLOBALS)) {
        return (bool) $GLOBALS['firenet_user_settings_table_exists_cache'];
    }

    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_settings'");
    $exists = (int) ($stmt->fetchColumn() ?: 0) > 0;
    $GLOBALS['firenet_user_settings_table_exists_cache'] = $exists;
    return $exists;
}

function firenet_ensure_user_settings_table(PDO $pdo): void {
    if (firenet_user_settings_table_exists($pdo)) {
        return;
    }

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

    $GLOBALS['firenet_user_settings_table_exists_cache'] = true;
}

function firenet_load_user_settings(PDO $pdo, int $userId): array {
    $settings = firenet_user_settings_defaults();

    if (!firenet_user_settings_table_exists($pdo)) {
        return $settings;
    }

    $stmt = $pdo->prepare('SELECT compact_mode, reduce_motion, dark_mode, security_alerts, hide_sensitive, auto_logout_minutes FROM user_settings WHERE user_id = ? LIMIT 1');
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return $settings;
    }

    return [
        'compactMode' => ((int) ($row['compact_mode'] ?? 0)) === 1,
        'reduceMotion' => ((int) ($row['reduce_motion'] ?? 0)) === 1,
        'darkMode' => ((int) ($row['dark_mode'] ?? 0)) === 1,
        'securityAlerts' => ((int) ($row['security_alerts'] ?? 0)) === 1,
        'hideSensitive' => ((int) ($row['hide_sensitive'] ?? 0)) === 1,
        'autoLogoutMinutes' => max(0, (int) ($row['auto_logout_minutes'] ?? 30))
    ];
}

function firenet_save_user_settings(PDO $pdo, int $userId, array $patch): array {
    firenet_ensure_user_settings_table($pdo);

    $current = firenet_load_user_settings($pdo, $userId);
    $merged = array_merge($current, array_intersect_key($patch, $current));
    $merged['autoLogoutMinutes'] = max(0, (int) ($patch['autoLogoutMinutes'] ?? $current['autoLogoutMinutes'] ?? 30));

    $upsert = $pdo->prepare('
        INSERT INTO user_settings (user_id, compact_mode, reduce_motion, dark_mode, security_alerts, hide_sensitive, auto_logout_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            compact_mode = VALUES(compact_mode),
            reduce_motion = VALUES(reduce_motion),
            dark_mode = VALUES(dark_mode),
            security_alerts = VALUES(security_alerts),
            hide_sensitive = VALUES(hide_sensitive),
            auto_logout_minutes = VALUES(auto_logout_minutes),
            updated_at = CURRENT_TIMESTAMP
    ');
    $upsert->execute([
        $userId,
        $merged['compactMode'] ? 1 : 0,
        $merged['reduceMotion'] ? 1 : 0,
        $merged['darkMode'] ? 1 : 0,
        $merged['securityAlerts'] ? 1 : 0,
        $merged['hideSensitive'] ? 1 : 0,
        $merged['autoLogoutMinutes']
    ]);

    return firenet_load_user_settings($pdo, $userId);
}

function firenet_get_profile_photo_path(PDO $pdo, int $userId): ?string {
    if (!firenet_profile_photo_table_exists($pdo)) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT file_path FROM user_profile_photos WHERE user_id = ? LIMIT 1');
    $stmt->execute([$userId]);
    $path = (string) ($stmt->fetchColumn() ?: '');
    return $path !== '' ? $path : null;
}

function firenet_profile_photo_url_from_path(?string $path): ?string {
    if (!is_string($path) || trim($path) === '') {
        return null;
    }

    $normalized = str_replace('\\', '/', $path);
    $normalized = ltrim($normalized, '/');
    if (strpos($normalized, 'uploads/photos/') === 0) {
        return '/firenet/NEWFIRENET/' . $normalized;
    }

    return FIRENET_PROFILE_UPLOAD_WEB_PREFIX . basename($normalized);
}

function firenet_delete_previous_profile_photo(?string $existingPath): void {
    if (!is_string($existingPath) || trim($existingPath) === '') {
        return;
    }

    $normalized = str_replace('\\', '/', $existingPath);
    $normalized = ltrim($normalized, '/');
    if (strpos($normalized, 'uploads/photos/') !== 0) {
        return;
    }

    $fullPath = __DIR__ . '/../../' . $normalized;
    if (is_file($fullPath)) {
        @unlink($fullPath);
    }
}

function firenet_save_processed_profile_photo(string $tmpName, string $mime, string $destinationPath): bool {
    if (!extension_loaded('gd') || !function_exists('imagecreatetruecolor')) {
        return false;
    }

    if ($mime === 'image/gif') {
        // Keep GIF as-is to avoid stripping animation frames.
        return false;
    }

    $imageInfo = @getimagesize($tmpName);
    if (!is_array($imageInfo) || count($imageInfo) < 2) {
        return false;
    }

    $sourceWidth = (int) $imageInfo[0];
    $sourceHeight = (int) $imageInfo[1];
    if ($sourceWidth < 1 || $sourceHeight < 1) {
        return false;
    }

    switch ($mime) {
        case 'image/jpeg':
            $source = function_exists('imagecreatefromjpeg') ? @imagecreatefromjpeg($tmpName) : false;
            break;
        case 'image/png':
            $source = function_exists('imagecreatefrompng') ? @imagecreatefrompng($tmpName) : false;
            break;
        case 'image/webp':
            $source = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($tmpName) : false;
            break;
        default:
            $source = false;
            break;
    }

    if ($source === false) {
        return false;
    }

    $maxDimension = 640;
    $scale = min(1, $maxDimension / max($sourceWidth, $sourceHeight));
    $targetWidth = max(1, (int) floor($sourceWidth * $scale));
    $targetHeight = max(1, (int) floor($sourceHeight * $scale));

    $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
    if ($canvas === false) {
        imagedestroy($source);
        return false;
    }

    if ($mime === 'image/png' || $mime === 'image/webp') {
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefilledrectangle($canvas, 0, 0, $targetWidth, $targetHeight, $transparent);
    }

    $resampled = imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $sourceWidth, $sourceHeight);
    if (!$resampled) {
        imagedestroy($canvas);
        imagedestroy($source);
        return false;
    }

    $saved = false;
    if ($mime === 'image/jpeg') {
        $saved = imagejpeg($canvas, $destinationPath, 82);
    } elseif ($mime === 'image/png') {
        $saved = imagepng($canvas, $destinationPath, 6);
    } elseif ($mime === 'image/webp' && function_exists('imagewebp')) {
        $saved = imagewebp($canvas, $destinationPath, 82);
    }

    imagedestroy($canvas);
    imagedestroy($source);
    return (bool) $saved;
}

function firenet_load_profile(PDO $pdo, int $userId): ?array {
    $stmt = $pdo->prepare('
        SELECT u.user_id, u.username, u.email, u.station_id, u.status,
               r.role_name,
               s.station_name
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN stations s ON s.station_id = u.station_id
        WHERE u.user_id = ?
        LIMIT 1
    ');
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        return null;
    }

    $profilePhotoPath = firenet_get_profile_photo_path($pdo, $userId);
    $settings = firenet_load_user_settings($pdo, $userId);

    return [
        'userId' => (int) ($row['user_id'] ?? 0),
        'username' => (string) ($row['username'] ?? ''),
        'email' => (string) ($row['email'] ?? ''),
        'role' => strtolower((string) ($row['role_name'] ?? 'user')),
        'stationId' => (int) ($row['station_id'] ?? 0),
        'stationName' => (string) ($row['station_name'] ?? ''),
        'status' => (string) ($row['status'] ?? 'active'),
        'profilePhotoUrl' => firenet_profile_photo_url_from_path($profilePhotoPath),
        'settings' => $settings
    ];
}

try {
    $pdo = firenet_get_pdo();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $profile = firenet_load_profile($pdo, $userId);
        if ($profile === null) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'message' => 'Profile not found']);
            exit;
        }

        echo json_encode(['ok' => true, 'profile' => $profile]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $input = firenet_read_input();
    $action = strtolower(trim((string) ($input['action'] ?? 'update_profile')));

    if ($action === 'upload_profile_photo') {
        if (!firenet_profile_photo_table_exists($pdo)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'message' => 'Profile photo table is missing. Please run the latest database migration.']);
            exit;
        }

        if (!isset($_FILES['profilePhoto']) || !is_array($_FILES['profilePhoto'])) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'No profile photo file was uploaded.']);
            exit;
        }

        $file = $_FILES['profilePhoto'];
        $errorCode = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($errorCode !== UPLOAD_ERR_OK) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'Upload failed. Please try another image.']);
            exit;
        }

        $size = (int) ($file['size'] ?? 0);
        if ($size < 1 || $size > 2 * 1024 * 1024) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'Image size must be between 1 byte and 2MB.']);
            exit;
        }

        $tmpName = (string) ($file['tmp_name'] ?? '');
        if ($tmpName === '' || !is_uploaded_file($tmpName)) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'Invalid uploaded file.']);
            exit;
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = $finfo ? (string) (finfo_file($finfo, $tmpName) ?: '') : '';
        if ($finfo) {
            finfo_close($finfo);
        }
        $allowedMime = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif'
        ];

        if (!isset($allowedMime[$mime])) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'Unsupported image format. Use JPG, PNG, WEBP, or GIF.']);
            exit;
        }

        if (!is_dir(FIRENET_PROFILE_UPLOAD_DIR) && !mkdir(FIRENET_PROFILE_UPLOAD_DIR, 0775, true)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'message' => 'Unable to prepare upload directory.']);
            exit;
        }

        $extension = $allowedMime[$mime];
        $storedFileName = 'user_' . $userId . '_' . date('YmdHis') . '_' . bin2hex(random_bytes(6)) . '.' . $extension;
        $storedPath = FIRENET_PROFILE_UPLOAD_DIR . '/' . $storedFileName;

        $savedByProcessor = firenet_save_processed_profile_photo($tmpName, $mime, $storedPath);
        if (!$savedByProcessor && !move_uploaded_file($tmpName, $storedPath)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'message' => 'Unable to save uploaded image.']);
            exit;
        }

        $finalFileSize = is_file($storedPath) ? (int) (filesize($storedPath) ?: 0) : 0;
        if ($finalFileSize < 1) {
            @unlink($storedPath);
            http_response_code(500);
            echo json_encode(['ok' => false, 'message' => 'Uploaded image was invalid after processing.']);
            exit;
        }

        $relativePath = 'uploads/photos/' . $storedFileName;
        $originalName = basename((string) ($file['name'] ?? $storedFileName));

        $pdo->beginTransaction();
        try {
            $existingPath = firenet_get_profile_photo_path($pdo, $userId);

            $upsert = $pdo->prepare('
                INSERT INTO user_profile_photos (user_id, original_file_name, stored_file_name, file_path, mime_type, file_size_bytes)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    original_file_name = VALUES(original_file_name),
                    stored_file_name = VALUES(stored_file_name),
                    file_path = VALUES(file_path),
                    mime_type = VALUES(mime_type),
                    file_size_bytes = VALUES(file_size_bytes),
                    updated_at = CURRENT_TIMESTAMP
            ');
                    $upsert->execute([$userId, $originalName, $storedFileName, $relativePath, $mime, $finalFileSize]);
            $pdo->commit();

            firenet_delete_previous_profile_photo($existingPath);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            @unlink($storedPath);
            throw $e;
        }

        $profile = firenet_load_profile($pdo, $userId);
        echo json_encode([
            'ok' => true,
            'message' => 'Profile photo uploaded successfully.',
            'profile' => $profile
        ]);
        exit;
    }

    if ($action === 'remove_profile_photo') {
        if (!firenet_profile_photo_table_exists($pdo)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'message' => 'Profile photo table is missing. Please run the latest database migration.']);
            exit;
        }

        $existingPath = firenet_get_profile_photo_path($pdo, $userId);
        if ($existingPath !== null) {
            $deleteStmt = $pdo->prepare('DELETE FROM user_profile_photos WHERE user_id = ? LIMIT 1');
            $deleteStmt->execute([$userId]);
            firenet_delete_previous_profile_photo($existingPath);
        }

        $profile = firenet_load_profile($pdo, $userId);
        echo json_encode([
            'ok' => true,
            'message' => 'Profile photo removed successfully.',
            'profile' => $profile
        ]);
        exit;
    }

    if ($action === 'change_password') {
        $currentPassword = (string) ($input['currentPassword'] ?? '');
        $newPassword = (string) ($input['newPassword'] ?? '');
        $confirmPassword = (string) ($input['confirmPassword'] ?? '');
        $confirmChange = filter_var($input['confirmChange'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'Please complete all password fields.']);
            exit;
        }

        if (strlen($newPassword) < 6) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'New password must be at least 6 characters.']);
            exit;
        }

        if ($newPassword !== $confirmPassword) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'New password and confirmation do not match.']);
            exit;
        }

        if ($newPassword === $currentPassword) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'New password must be different from current password.']);
            exit;
        }

        if (!$confirmChange) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'Password change confirmation is required.']);
            exit;
        }

        $currentStmt = $pdo->prepare('SELECT u.password, u.email, u.username, COALESCE(s.station_name, CONCAT("Station ", u.station_id)) AS station_name FROM users u LEFT JOIN stations s ON s.station_id = u.station_id WHERE u.user_id = ? LIMIT 1');
        $currentStmt->execute([$userId]);
        $row = $currentStmt->fetch(PDO::FETCH_ASSOC);
        $storedPassword = (string) ($row['password'] ?? '');
        $userEmail = trim((string) ($row['email'] ?? ''));
        $username = trim((string) ($row['username'] ?? ''));
        $stationName = trim((string) ($row['station_name'] ?? 'Station'));

        if ($userEmail === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'Your account email is missing. Contact admin before changing password.']);
            exit;
        }

        if ($storedPassword === '' || !firenet_verify_password_input($currentPassword, $storedPassword)) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'message' => 'Current password is incorrect.']);
            exit;
        }

        $pdo->beginTransaction();
        try {
            $updatePasswordStmt = $pdo->prepare('UPDATE users SET password = ? WHERE user_id = ? LIMIT 1');
            $updatePasswordStmt->execute([password_hash($newPassword, PASSWORD_DEFAULT), $userId]);

            firenet_send_password_change_email($userEmail, $username, $stationName);

            $pdo->commit();
        } catch (Throwable $mailError) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            http_response_code(500);
            echo json_encode(['ok' => false, 'message' => 'Password was not changed because confirmation email could not be sent. Check mail settings.']);
            exit;
        }

        echo json_encode([
            'ok' => true,
            'message' => 'Password changed successfully. A confirmation email was sent to your Gmail address.'
        ]);
        exit;
    }

    if ($action === 'save_preferences' || $action === 'save_security') {
        $patch = [];
        if ($action === 'save_preferences' || array_key_exists('compactMode', $input) || array_key_exists('reduceMotion', $input) || array_key_exists('darkMode', $input)) {
            $patch['compactMode'] = filter_var($input['compactMode'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $patch['reduceMotion'] = filter_var($input['reduceMotion'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $patch['darkMode'] = filter_var($input['darkMode'] ?? false, FILTER_VALIDATE_BOOLEAN);
        }

        if ($action === 'save_security' || array_key_exists('securityAlerts', $input) || array_key_exists('hideSensitive', $input) || array_key_exists('autoLogoutMinutes', $input)) {
            $patch['securityAlerts'] = filter_var($input['securityAlerts'] ?? true, FILTER_VALIDATE_BOOLEAN);
            $patch['hideSensitive'] = filter_var($input['hideSensitive'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $patch['autoLogoutMinutes'] = max(0, (int) ($input['autoLogoutMinutes'] ?? 30));
        }

        $settings = firenet_save_user_settings($pdo, $userId, $patch);
        echo json_encode([
            'ok' => true,
            'message' => $action === 'save_security' ? 'Security settings saved.' : 'Preferences saved.',
            'settings' => $settings
        ]);
        exit;
    }

    if ($action === 'update_profile') {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'message' => 'Username and email are managed by administrators. Please contact an admin for account changes.'
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'message' => 'Unknown settings action.'
    ]);
    exit;
} catch (PDOException $e) {
    if ((string) $e->getCode() === '23000') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Username or email is already in use for this station.']);
        exit;
    }

    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Unable to save settings right now.']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Unable to save settings right now.']);
}
