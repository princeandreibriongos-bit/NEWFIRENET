<?php
/**
 * Civilian public alert subscription (email + SMS opt-in).
 * SMS numbers are stored for district broadcast; email gets a confirmation when SMTP is configured.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/mailer.php';

function civilian_alerts_fail(string $message, int $status = 400): void
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function civilian_alerts_ok(array $data = [], string $message = 'OK'): void
{
    echo json_encode(['ok' => true, 'message' => $message, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function civilian_alerts_ensure_table(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS civilian_alert_subscribers (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(190) NULL,
            phone VARCHAR(32) NULL,
            channel_email TINYINT(1) NOT NULL DEFAULT 0,
            channel_sms TINYINT(1) NOT NULL DEFAULT 0,
            topics VARCHAR(255) NOT NULL DEFAULT "weather,announcements",
            barangay VARCHAR(120) NULL,
            unsubscribe_token VARCHAR(64) NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            UNIQUE KEY uq_email (email),
            UNIQUE KEY uq_phone (phone),
            KEY idx_active (is_active, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
}

function civilian_alerts_normalize_phone(string $phone): string
{
    $digits = preg_replace('/\D+/', '', $phone);
    if ($digits === null) {
        return '';
    }
    if (strpos($digits, '63') === 0 && strlen($digits) === 12) {
        return '0' . substr($digits, 2);
    }
    if (strpos($digits, '9') === 0 && strlen($digits) === 10) {
        return '0' . $digits;
    }
    return $digits;
}

try {
    $pdo = firenet_get_pdo();
    civilian_alerts_ensure_table($pdo);
} catch (Throwable $e) {
    civilian_alerts_fail('Unable to connect to the alert service.', 500);
}

$action = trim((string) ($_GET['action'] ?? $_POST['action'] ?? 'subscribe'));

if ($action === 'portal_config' && strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    require_once __DIR__ . '/../../includes/system_settings.php';
    $settings = firenet_system_settings_all();
    civilian_alerts_ok([
        'appName' => (string) ($settings['app_name'] ?? 'FireNet'),
        'districtName' => (string) ($settings['district_name'] ?? 'Makati Fire District'),
        'tagline' => (string) ($settings['public_tagline'] ?? ''),
        'emergencyHotline' => (string) ($settings['emergency_hotline'] ?? '168'),
        'centralPhone' => (string) ($settings['central_phone'] ?? ''),
        'subscribeEnabled' => (($settings['portal_subscribe_enabled'] ?? '1') === '1'),
        'maintenanceEnabled' => (($settings['portal_maintenance_enabled'] ?? '0') === '1'),
        'maintenanceMessage' => (string) ($settings['portal_maintenance_message'] ?? ''),
    ]);
}

if ($action === 'subscribe') {
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        civilian_alerts_fail('Use POST to subscribe.', 405);
    }

    require_once __DIR__ . '/../../includes/system_settings.php';
    if (!firenet_system_setting_bool('portal_subscribe_enabled', true)) {
        civilian_alerts_fail('Alert subscriptions are temporarily disabled by the district.');
    }

    $raw = file_get_contents('php://input');
    $json = [];
    if (is_string($raw) && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $json = $decoded;
        }
    }

    $email = strtolower(trim((string) ($json['email'] ?? $_POST['email'] ?? '')));
    $phone = civilian_alerts_normalize_phone((string) ($json['phone'] ?? $_POST['phone'] ?? ''));
    $barangay = trim((string) ($json['barangay'] ?? $_POST['barangay'] ?? ''));
    $wantEmail = !empty($json['channelEmail'] ?? $_POST['channelEmail'] ?? false);
    $wantSms = !empty($json['channelSms'] ?? $_POST['channelSms'] ?? false);
    $topics = $json['topics'] ?? $_POST['topics'] ?? ['weather', 'announcements'];

    if (is_string($topics)) {
        $topics = array_filter(array_map('trim', explode(',', $topics)));
    }
    if (!is_array($topics) || !$topics) {
        $topics = ['weather', 'announcements'];
    }
    $topics = array_values(array_intersect($topics, ['weather', 'announcements', 'safety']));
    $topicsCsv = implode(',', $topics ?: ['weather', 'announcements']);

    if (!$wantEmail && !$wantSms) {
        $wantEmail = $email !== '';
        $wantSms = $phone !== '';
    }

    if ($wantEmail && ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL))) {
        civilian_alerts_fail('Enter a valid email address for email alerts.');
    }
    if ($wantSms) {
        if ($phone === '' || !preg_match('/^09\d{9}$/', $phone)) {
            civilian_alerts_fail('Enter a valid PH mobile number (09XXXXXXXXX) for SMS alerts.');
        }
    }
    if (!$wantEmail && !$wantSms) {
        civilian_alerts_fail('Choose email and/or SMS, and provide the matching contact.');
    }
    if ($barangay !== '' && strlen($barangay) > 120) {
        civilian_alerts_fail('Barangay name is too long.');
    }

    $token = bin2hex(random_bytes(16));

    try {
        // Upsert by email and/or phone without wiping the other channel.
        if ($wantEmail && $email !== '') {
            $stmt = $pdo->prepare(
                'SELECT id, phone, channel_sms FROM civilian_alert_subscribers WHERE email = ? LIMIT 1'
            );
            $stmt->execute([$email]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                $nextPhone = $wantSms && $phone !== '' ? $phone : (string) ($existing['phone'] ?? '');
                $nextSms = $wantSms ? 1 : (int) ($existing['channel_sms'] ?? 0);
                $upd = $pdo->prepare(
                    'UPDATE civilian_alert_subscribers
                     SET phone = NULLIF(?, ""), channel_email = 1, channel_sms = ?, topics = ?, barangay = NULLIF(?, ""),
                         is_active = 1, updated_at = NOW(), unsubscribe_token = ?
                     WHERE id = ?'
                );
                $upd->execute([$nextPhone, $nextSms, $topicsCsv, $barangay, $token, (int) $existing['id']]);
            } else {
                $ins = $pdo->prepare(
                    'INSERT INTO civilian_alert_subscribers
                        (email, phone, channel_email, channel_sms, topics, barangay, unsubscribe_token, is_active)
                     VALUES (?, NULLIF(?, ""), 1, ?, ?, NULLIF(?, ""), ?, 1)'
                );
                $ins->execute([$email, $wantSms ? $phone : '', $wantSms ? 1 : 0, $topicsCsv, $barangay, $token]);
            }
        } elseif ($wantSms && $phone !== '') {
            $stmt = $pdo->prepare(
                'SELECT id, email, channel_email FROM civilian_alert_subscribers WHERE phone = ? LIMIT 1'
            );
            $stmt->execute([$phone]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                $upd = $pdo->prepare(
                    'UPDATE civilian_alert_subscribers
                     SET channel_sms = 1, topics = ?, barangay = NULLIF(?, ""),
                         is_active = 1, updated_at = NOW(), unsubscribe_token = ?
                     WHERE id = ?'
                );
                $upd->execute([$topicsCsv, $barangay, $token, (int) $existing['id']]);
            } else {
                $ins = $pdo->prepare(
                    'INSERT INTO civilian_alert_subscribers
                        (email, phone, channel_email, channel_sms, topics, barangay, unsubscribe_token, is_active)
                     VALUES (NULL, ?, 0, 1, ?, NULLIF(?, ""), ?, 1)'
                );
                $ins->execute([$phone, $topicsCsv, $barangay, $token]);
            }
        }
    } catch (PDOException $e) {
        if ((int) ($e->errorInfo[1] ?? 0) === 1062) {
            civilian_alerts_fail('That contact is already linked to another subscription. Try the other channel only.');
        }
        civilian_alerts_fail('Could not save your subscription right now.', 500);
    }

    $emailSent = false;
    if ($wantEmail && $email !== '') {
        try {
            $inner = '<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">You are subscribed to FireNet public alerts for Makati Fire District.</p>'
                . '<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#5a667d;">Topics: <strong>'
                . htmlspecialchars($topicsCsv, ENT_QUOTES, 'UTF-8')
                . '</strong></p>'
                . '<p style="margin:0;font-size:14px;line-height:1.5;color:#5a667d;">You will receive weather warnings, district announcements, and safety notices based on your choices.</p>';
            $html = firenet_email_shell('Public alert subscription', $inner);
            $text = "You are subscribed to FireNet public alerts.\nTopics: {$topicsCsv}\n";
            firenet_send_mail($email, '', 'FireNet · Alert subscription confirmed', $html, $text);
            $emailSent = true;
        } catch (Throwable $e) {
            $emailSent = false;
        }
    }

    civilian_alerts_ok(
        [
            'email' => $wantEmail ? $email : null,
            'phone' => $wantSms ? $phone : null,
            'emailConfirmationSent' => $emailSent,
            'smsQueued' => $wantSms,
        ],
        $wantSms && $wantEmail
            ? 'Subscribed. Email confirmation sent when mail is configured; SMS number saved for district alerts.'
            : ($wantEmail
                ? ($emailSent ? 'Subscribed. Check your inbox for confirmation.' : 'Subscribed. Email saved (confirmation mail could not be sent yet).')
                : 'Subscribed. Your mobile number is saved for SMS alerts.')
    );
}

civilian_alerts_fail('Unknown action.', 404);
