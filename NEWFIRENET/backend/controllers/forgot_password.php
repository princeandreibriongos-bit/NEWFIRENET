<?php
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/mailer.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed.']);
    exit;
}

const FIRENET_OTP_TTL_MINUTES = 10;
const FIRENET_RESET_TOKEN_TTL_MINUTES = 15;
const FIRENET_OTP_LENGTH = 6;
const FIRENET_OTP_MAX_ATTEMPTS = 5;
const FIRENET_OTP_RESEND_SECONDS = 60;
const FIRENET_OTP_HOURLY_LIMIT = 5;
const FIRENET_MIN_PASSWORD_LENGTH = 6;

function firenet_fp_read_input(): array
{
    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    if (strpos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $decoded = is_string($raw) ? json_decode($raw, true) : null;
        return is_array($decoded) ? $decoded : [];
    }

    return is_array($_POST) ? $_POST : [];
}

function firenet_fp_json(bool $ok, string $message, array $data = [], int $status = 200): void
{
    http_response_code($status);
    echo json_encode([
        'ok' => $ok,
        'message' => $message,
        'data' => $data,
    ]);
    exit;
}

function firenet_fp_ensure_table(PDO $pdo): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS password_reset_otps (
            reset_id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            email VARCHAR(100) NOT NULL,
            otp_hash VARCHAR(255) NOT NULL,
            reset_token_hash VARCHAR(255) NULL,
            attempts INT NOT NULL DEFAULT 0,
            expires_at DATETIME NOT NULL,
            verified_at DATETIME NULL,
            used_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_password_reset_email (email),
            INDEX idx_password_reset_user (user_id),
            INDEX idx_password_reset_expires (expires_at),
            CONSTRAINT fk_password_reset_user
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $ready = true;
}

function firenet_fp_normalize_email(string $email): string
{
    return strtolower(trim($email));
}

function firenet_fp_generate_otp(): string
{
    $max = (10 ** FIRENET_OTP_LENGTH) - 1;
    return str_pad((string) random_int(0, $max), FIRENET_OTP_LENGTH, '0', STR_PAD_LEFT);
}

function firenet_fp_mask_email(string $email): string
{
    $parts = explode('@', $email, 2);
    if (count($parts) !== 2) {
        return '***';
    }

    $local = $parts[0];
    $domain = $parts[1];
    $localLen = strlen($local);
    if ($localLen <= 2) {
        $maskedLocal = str_repeat('*', $localLen);
    } else {
        $maskedLocal = substr($local, 0, 1) . str_repeat('*', max(1, $localLen - 2)) . substr($local, -1);
    }

    return $maskedLocal . '@' . $domain;
}

function firenet_fp_find_users_by_email(PDO $pdo, string $email, string $username = ''): array
{
    if ($username !== '') {
        $stmt = $pdo->prepare('
            SELECT u.user_id, u.username, u.email, u.station_id,
                   COALESCE(s.station_name, CONCAT("Station ", u.station_id)) AS station_name
            FROM users u
            LEFT JOIN stations s ON s.station_id = u.station_id
            WHERE LOWER(u.email) = ? AND u.username = ? AND LOWER(u.status) = "active"
            LIMIT 5
        ');
        $stmt->execute([$email, $username]);
    } else {
        $stmt = $pdo->prepare('
            SELECT u.user_id, u.username, u.email, u.station_id,
                   COALESCE(s.station_name, CONCAT("Station ", u.station_id)) AS station_name
            FROM users u
            LEFT JOIN stations s ON s.station_id = u.station_id
            WHERE LOWER(u.email) = ? AND LOWER(u.status) = "active"
            LIMIT 5
        ');
        $stmt->execute([$email]);
    }

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return is_array($rows) ? $rows : [];
}

function firenet_fp_build_otp_email(string $username, string $stationName, string $otp, int $ttlMinutes): array
{
    $safeName = htmlspecialchars($username !== '' ? $username : 'Firefighter', ENT_QUOTES, 'UTF-8');
    $safeStation = htmlspecialchars($stationName, ENT_QUOTES, 'UTF-8');
    $safeOtp = htmlspecialchars($otp, ENT_QUOTES, 'UTF-8');
    $safeTtl = (int) $ttlMinutes;

    $otpBoxes = '';
    foreach (str_split($otp) as $digit) {
        $otpBoxes .= '<td style="width:42px;height:52px;border-radius:10px;background:#f4f7fb;border:1px solid #cfd8e6;color:#152033;font-size:24px;font-weight:800;text-align:center;letter-spacing:0;">'
            . htmlspecialchars($digit, ENT_QUOTES, 'UTF-8')
            . '</td><td style="width:8px;"></td>';
    }

    $inner = '
      <p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#152033;">
        Hello <strong>' . $safeName . '</strong>,
      </p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#5a667d;">
        We received a request to reset your FireNet password for
        <strong style="color:#152033;">' . $safeStation . '</strong>.
        Use the one-time code below to continue.
      </p>
      <div style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7a879c;font-weight:700;">
        Your verification code
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
        <tr>' . $otpBoxes . '</tr>
      </table>
      <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:#fff1f2;border:1px solid #f0b4ba;">
        <div style="font-size:13px;line-height:1.55;color:#9b1c28;">
          This code expires in <strong>' . $safeTtl . ' minutes</strong>.
          If you did not request a password reset, you can ignore this email — your account remains secure.
        </div>
      </div>
      <p style="margin:0;font-size:13px;line-height:1.55;color:#5a667d;">
        For your security, never share this code with anyone. FireNet staff will never ask for your OTP.
      </p>
    ';

    $html = firenet_email_shell('Password reset code', $inner);
    $text = "Hello {$username},\n\n"
        . "We received a request to reset your FireNet password for {$stationName}.\n\n"
        . "Your verification code: {$otp}\n"
        . "This code expires in {$safeTtl} minutes.\n\n"
        . "If you did not request this, ignore this email.\n\n"
        . "FireNet Security Team";

    return [$html, $text];
}

$input = firenet_fp_read_input();
$action = strtolower(trim((string) ($input['action'] ?? '')));

try {
    $pdo = firenet_get_pdo();
    firenet_fp_ensure_table($pdo);

    if ($action === 'request_otp') {
        $email = firenet_fp_normalize_email((string) ($input['email'] ?? ''));
        $username = trim((string) ($input['username'] ?? ''));

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            firenet_fp_json(false, 'Please enter a valid email address.', [], 422);
        }

        $users = firenet_fp_find_users_by_email($pdo, $email, $username);

        if (count($users) > 1 && $username === '') {
            firenet_fp_json(false, 'Multiple accounts use this email. Enter your username to continue.', [
                'needsUsername' => true,
            ], 409);
        }

        // Always respond neutrally when no match (avoid account enumeration).
        $genericMessage = 'If an account matches that email, a verification code is on the way.';
        if (count($users) !== 1) {
            firenet_fp_json(true, $genericMessage, [
                'sent' => false,
                'maskedEmail' => firenet_fp_mask_email($email),
                'cooldownSeconds' => FIRENET_OTP_RESEND_SECONDS,
            ]);
        }

        $user = $users[0];
        $userId = (int) ($user['user_id'] ?? 0);

        $recentStmt = $pdo->prepare('
            SELECT reset_id, created_at
            FROM password_reset_otps
            WHERE user_id = ? AND used_at IS NULL
            ORDER BY reset_id DESC
            LIMIT 1
        ');
        $recentStmt->execute([$userId]);
        $recent = $recentStmt->fetch(PDO::FETCH_ASSOC);
        if ($recent) {
            $createdAt = strtotime((string) ($recent['created_at'] ?? ''));
            if ($createdAt && (time() - $createdAt) < FIRENET_OTP_RESEND_SECONDS) {
                $wait = FIRENET_OTP_RESEND_SECONDS - (time() - $createdAt);
                firenet_fp_json(false, 'Please wait a moment before requesting another code.', [
                    'cooldownSeconds' => max(1, $wait),
                ], 429);
            }
        }

        $hourCountStmt = $pdo->prepare('
            SELECT COUNT(*) FROM password_reset_otps
            WHERE user_id = ? AND created_at >= (NOW() - INTERVAL 1 HOUR)
        ');
        $hourCountStmt->execute([$userId]);
        if ((int) $hourCountStmt->fetchColumn() >= FIRENET_OTP_HOURLY_LIMIT) {
            firenet_fp_json(false, 'Too many reset attempts. Try again later or contact your administrator.', [], 429);
        }

        $otp = firenet_fp_generate_otp();
        $otpHash = password_hash($otp, PASSWORD_DEFAULT);
        $expiresAt = (new DateTimeImmutable('now'))->modify('+' . FIRENET_OTP_TTL_MINUTES . ' minutes')->format('Y-m-d H:i:s');

        // Invalidate previous unused codes for this user.
        $pdo->prepare('
            UPDATE password_reset_otps
            SET used_at = NOW()
            WHERE user_id = ? AND used_at IS NULL
        ')->execute([$userId]);

        $insert = $pdo->prepare('
            INSERT INTO password_reset_otps (user_id, email, otp_hash, expires_at)
            VALUES (?, ?, ?, ?)
        ');
        $insert->execute([$userId, $email, $otpHash, $expiresAt]);
        $resetId = (int) $pdo->lastInsertId();

        [$htmlBody, $textBody] = firenet_fp_build_otp_email(
            (string) ($user['username'] ?? ''),
            (string) ($user['station_name'] ?? 'your station'),
            $otp,
            FIRENET_OTP_TTL_MINUTES
        );

        try {
            firenet_send_mail(
                $email,
                (string) ($user['username'] ?? $email),
                'Your FireNet password reset code',
                $htmlBody,
                $textBody
            );
        } catch (Throwable $mailError) {
            $pdo->prepare('UPDATE password_reset_otps SET used_at = NOW() WHERE reset_id = ?')->execute([$resetId]);
            error_log('FireNet forgot_password mail error: ' . $mailError->getMessage());

            $hint = 'Unable to send email right now. Please try again later or contact your administrator.';
            $detail = trim((string) $mailError->getMessage());
            // Surface setup problems locally without exposing secrets.
            if ($detail !== '' && (
                stripos($detail, 'SMTP') !== false
                || stripos($detail, 'authenticate') !== false
                || stripos($detail, 'PHPMailer') !== false
                || stripos($detail, 'config') !== false
            )) {
                $hint = 'Email could not be sent. Check SMTP settings in config/config.php. (' . $detail . ')';
            }

            firenet_fp_json(false, $hint, [], 503);
        }

        firenet_fp_json(true, $genericMessage, [
            'sent' => true,
            'resetId' => $resetId,
            'maskedEmail' => firenet_fp_mask_email($email),
            'expiresInSeconds' => FIRENET_OTP_TTL_MINUTES * 60,
            'cooldownSeconds' => FIRENET_OTP_RESEND_SECONDS,
            'needsUsername' => false,
        ]);
    }

    if ($action === 'verify_otp') {
        $resetId = (int) ($input['resetId'] ?? 0);
        $otp = preg_replace('/\D+/', '', (string) ($input['otp'] ?? ''));

        if ($resetId < 1 || strlen($otp) !== FIRENET_OTP_LENGTH) {
            firenet_fp_json(false, 'Enter the 6-digit code from your email.', [], 422);
        }

        $stmt = $pdo->prepare('
            SELECT reset_id, user_id, otp_hash, attempts, expires_at, verified_at, used_at
            FROM password_reset_otps
            WHERE reset_id = ?
            LIMIT 1
        ');
        $stmt->execute([$resetId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || !empty($row['used_at'])) {
            firenet_fp_json(false, 'This code is no longer valid. Request a new one.', [], 400);
        }

        if (strtotime((string) $row['expires_at']) < time()) {
            firenet_fp_json(false, 'This code has expired. Request a new one.', [], 400);
        }

        $attempts = (int) ($row['attempts'] ?? 0);
        if ($attempts >= FIRENET_OTP_MAX_ATTEMPTS) {
            $pdo->prepare('UPDATE password_reset_otps SET used_at = NOW() WHERE reset_id = ?')->execute([$resetId]);
            firenet_fp_json(false, 'Too many incorrect attempts. Request a new code.', [], 429);
        }

        if (!password_verify($otp, (string) ($row['otp_hash'] ?? ''))) {
            $pdo->prepare('UPDATE password_reset_otps SET attempts = attempts + 1 WHERE reset_id = ?')->execute([$resetId]);
            $remaining = max(0, FIRENET_OTP_MAX_ATTEMPTS - ($attempts + 1));
            firenet_fp_json(false, 'Incorrect code. ' . $remaining . ' attempt' . ($remaining === 1 ? '' : 's') . ' remaining.', [
                'attemptsRemaining' => $remaining,
            ], 400);
        }

        $resetToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $resetToken);
        $tokenExpires = (new DateTimeImmutable('now'))
            ->modify('+' . FIRENET_RESET_TOKEN_TTL_MINUTES . ' minutes')
            ->format('Y-m-d H:i:s');

        $pdo->prepare('
            UPDATE password_reset_otps
            SET verified_at = NOW(),
                reset_token_hash = ?,
                expires_at = ?,
                attempts = attempts
            WHERE reset_id = ?
            LIMIT 1
        ')->execute([$tokenHash, $tokenExpires, $resetId]);

        firenet_fp_json(true, 'Code verified. Choose a new password.', [
            'resetId' => $resetId,
            'resetToken' => $resetToken,
            'expiresInSeconds' => FIRENET_RESET_TOKEN_TTL_MINUTES * 60,
        ]);
    }

    if ($action === 'reset_password') {
        $resetId = (int) ($input['resetId'] ?? 0);
        $resetToken = trim((string) ($input['resetToken'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        $confirm = (string) ($input['confirmPassword'] ?? '');

        if ($resetId < 1 || $resetToken === '') {
            firenet_fp_json(false, 'Reset session expired. Start again.', [], 400);
        }

        if (strlen($password) < FIRENET_MIN_PASSWORD_LENGTH) {
            firenet_fp_json(false, 'New password must be at least ' . FIRENET_MIN_PASSWORD_LENGTH . ' characters.', [], 422);
        }

        if (!hash_equals($password, $confirm)) {
            firenet_fp_json(false, 'Password confirmation does not match.', [], 422);
        }

        $stmt = $pdo->prepare('
            SELECT reset_id, user_id, reset_token_hash, expires_at, verified_at, used_at
            FROM password_reset_otps
            WHERE reset_id = ?
            LIMIT 1
        ');
        $stmt->execute([$resetId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (
            !$row
            || empty($row['verified_at'])
            || !empty($row['used_at'])
            || empty($row['reset_token_hash'])
            || strtotime((string) $row['expires_at']) < time()
        ) {
            firenet_fp_json(false, 'Reset session expired. Start again.', [], 400);
        }

        $tokenHash = hash('sha256', $resetToken);
        if (!hash_equals((string) $row['reset_token_hash'], $tokenHash)) {
            firenet_fp_json(false, 'Reset session expired. Start again.', [], 400);
        }

        $userId = (int) ($row['user_id'] ?? 0);
        $userStmt = $pdo->prepare('
            SELECT u.user_id, u.username, u.email,
                   COALESCE(s.station_name, CONCAT("Station ", u.station_id)) AS station_name
            FROM users u
            LEFT JOIN stations s ON s.station_id = u.station_id
            WHERE u.user_id = ? AND LOWER(u.status) = "active"
            LIMIT 1
        ');
        $userStmt->execute([$userId]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            firenet_fp_json(false, 'Account is unavailable. Contact your administrator.', [], 400);
        }

        $pdo->beginTransaction();
        try {
            $update = $pdo->prepare('UPDATE users SET password = ? WHERE user_id = ? LIMIT 1');
            $update->execute([password_hash($password, PASSWORD_DEFAULT), $userId]);

            $pdo->prepare('UPDATE password_reset_otps SET used_at = NOW() WHERE reset_id = ? LIMIT 1')
                ->execute([$resetId]);

            $pdo->prepare('
                UPDATE password_reset_otps
                SET used_at = NOW()
                WHERE user_id = ? AND used_at IS NULL
            ')->execute([$userId]);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        // Best-effort confirmation email (same channel as settings password change).
        try {
            $safeName = htmlspecialchars((string) ($user['username'] ?? ''), ENT_QUOTES, 'UTF-8');
            $safeStation = htmlspecialchars((string) ($user['station_name'] ?? ''), ENT_QUOTES, 'UTF-8');
            $timestamp = date('Y-m-d H:i:s');
            $inner = '
              <p style="margin:0 0 14px;font-size:16px;color:#152033;">Hello <strong>' . $safeName . '</strong>,</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#5a667d;">
                Your FireNet password was changed successfully.
              </p>
              <div style="margin:0 0 14px;padding:14px 16px;border-radius:12px;background:#f4f7fb;border:1px solid #d7deea;font-size:13px;line-height:1.55;color:#314057;">
                <strong style="color:#152033;">Station:</strong> ' . $safeStation . '<br>
                <strong style="color:#152033;">Time:</strong> ' . htmlspecialchars($timestamp, ENT_QUOTES, 'UTF-8') . '
              </div>
              <p style="margin:0;font-size:13px;line-height:1.55;color:#9b1c28;">
                If you did not make this change, contact your station administrator immediately.
              </p>
            ';
            firenet_send_mail(
                (string) $user['email'],
                (string) ($user['username'] ?? ''),
                'FireNet password changed',
                firenet_email_shell('Password changed', $inner),
                "Hello {$user['username']},\n\nYour FireNet password was changed successfully.\nStation: {$user['station_name']}\nTime: {$timestamp}\n\nIf you did not make this change, contact your administrator.\n"
            );
        } catch (Throwable $ignored) {
            // Password already updated; confirmation email is optional.
        }

        firenet_fp_json(true, 'Password updated. You can sign in with your new password.', [
            'username' => (string) ($user['username'] ?? ''),
        ]);
    }

    firenet_fp_json(false, 'Unknown action.', [], 400);
} catch (Throwable $e) {
    firenet_fp_json(false, 'Password reset service is temporarily unavailable.', [], 500);
}
