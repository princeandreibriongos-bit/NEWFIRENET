<?php
/**
 * Admin broadcast to civilian alert subscribers (email + SMS).
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/alert_templates.php';

firenet_start_session();
firenet_require_login();

$role = strtolower((string) ($_SESSION['user']['role'] ?? ''));
if (!in_array($role, ['admin', 'superadmin'], true)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Admin access required.']);
    exit;
}

function admin_alerts_fail(string $message, int $status = 400): void
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function admin_alerts_ok(array $data = [], string $message = 'OK'): void
{
    echo json_encode(['ok' => true, 'message' => $message, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function admin_alerts_read_json(): array
{
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

try {
    $pdo = firenet_get_pdo();
    firenet_alerts_ensure_tables($pdo);
} catch (Throwable $e) {
    admin_alerts_fail('Unable to connect to the alert service.', 500);
}

$action = trim((string) ($_GET['action'] ?? $_POST['action'] ?? 'stats'));
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$createdBy = (int) ($_SESSION['user']['user_id'] ?? $_SESSION['user']['id'] ?? 0);

if ($action === 'stats' && $method === 'GET') {
    $row = $pdo->query(
        'SELECT
            COUNT(*) AS total_count,
            SUM(CASE WHEN channel_email = 1 AND email IS NOT NULL AND email <> "" THEN 1 ELSE 0 END) AS email_count,
            SUM(CASE WHEN channel_sms = 1 AND phone IS NOT NULL AND phone <> "" THEN 1 ELSE 0 END) AS sms_count,
            SUM(CASE WHEN FIND_IN_SET("weather", topics) THEN 1 ELSE 0 END) AS topic_weather,
            SUM(CASE WHEN FIND_IN_SET("announcements", topics) THEN 1 ELSE 0 END) AS topic_announcements,
            SUM(CASE WHEN FIND_IN_SET("safety", topics) THEN 1 ELSE 0 END) AS topic_safety
         FROM civilian_alert_subscribers
         WHERE is_active = 1'
    )->fetch(PDO::FETCH_ASSOC) ?: [];

    $recent = $pdo->query(
        'SELECT id, subject, topic, template_id, send_email, send_sms, email_sent, email_failed, sms_sent, sms_failed, recipient_count, created_at
         FROM civilian_alert_broadcasts
         ORDER BY created_at DESC
         LIMIT 10'
    )->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $channels = firenet_alert_channels_status();
    require_once __DIR__ . '/../../includes/system_settings.php';
    $sys = firenet_system_settings_all();
    admin_alerts_ok([
        'mailReady' => $channels['mailReady'],
        'smsReady' => $channels['smsReady'],
        'smsProvider' => $channels['smsProvider'],
        'smsMode' => $channels['smsMode'],
        'templates' => array_values(firenet_alert_templates()),
        'defaults' => [
            'sendEmail' => (($sys['alert_default_send_email'] ?? '1') === '1'),
            'sendSms' => (($sys['alert_default_send_sms'] ?? '1') === '1'),
            'weatherAutoEnabled' => (($sys['weather_auto_enabled'] ?? '1') === '1'),
        ],
        'subscribers' => [
            'total' => (int) ($row['total_count'] ?? 0),
            'email' => (int) ($row['email_count'] ?? 0),
            'sms' => (int) ($row['sms_count'] ?? 0),
            'topicWeather' => (int) ($row['topic_weather'] ?? 0),
            'topicAnnouncements' => (int) ($row['topic_announcements'] ?? 0),
            'topicSafety' => (int) ($row['topic_safety'] ?? 0),
        ],
        'recentBroadcasts' => $recent,
    ]);
}

if ($action === 'templates' && $method === 'GET') {
    admin_alerts_ok([
        'templates' => array_values(firenet_alert_templates()),
        'channels' => firenet_alert_channels_status(),
    ]);
}

if ($action === 'test_email' && $method === 'POST') {
    $json = admin_alerts_read_json();
    $to = strtolower(trim((string) ($json['email'] ?? $_POST['email'] ?? '')));
    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        $to = strtolower(trim((string) ($_SESSION['user']['email'] ?? '')));
    }
    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        admin_alerts_fail('Provide a valid email address to test.');
    }

    $channels = firenet_alert_channels_status();
    if (!$channels['mailReady']) {
        admin_alerts_fail('Email is not ready. Check Gmail SMTP in config/config.php.');
    }

    try {
        $inner = '<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#243247;">'
            . 'This is a FireNet test message. Gmail SMTP is working.</p>'
            . '<p style="margin:0;font-size:13px;color:#5a667d;">If you received this, public alerts can reach civilian subscribers.</p>';
        $html = firenet_email_shell('SMTP test', $inner);
        firenet_send_mail($to, '', 'FireNet · SMTP test OK', $html, "FireNet SMTP test OK.\n\nGmail delivery is working.");
        admin_alerts_ok(['to' => $to], 'Test email sent to ' . $to . '. Check inbox and spam.');
    } catch (Throwable $e) {
        admin_alerts_fail('Test email failed: ' . $e->getMessage(), 500);
    }
}

if ($action === 'broadcast' && $method === 'POST') {
    $json = admin_alerts_read_json();
    $templateId = strtolower(trim((string) ($json['templateId'] ?? $_POST['templateId'] ?? '')));
    $templates = firenet_alert_templates();

    $subject = trim((string) ($json['subject'] ?? $_POST['subject'] ?? ''));
    $body = trim((string) ($json['body'] ?? $_POST['body'] ?? ''));
    $topic = strtolower(trim((string) ($json['topic'] ?? $_POST['topic'] ?? 'weather')));

    if ($templateId !== '' && isset($templates[$templateId])) {
        if ($subject === '') {
            $subject = $templates[$templateId]['subject'];
        }
        if ($body === '') {
            $body = $templates[$templateId]['body'];
        }
        if ($topic === '' || $topic === 'announcements') {
            $topic = $templates[$templateId]['topic'];
        }
    }

    try {
        $result = firenet_broadcast_civilian_alert($pdo, [
            'subject' => $subject,
            'body' => $body,
            'topic' => $topic,
            'sendEmail' => !empty($json['sendEmail'] ?? $_POST['sendEmail'] ?? false),
            'sendSms' => !empty($json['sendSms'] ?? $_POST['sendSms'] ?? false),
            'barangay' => trim((string) ($json['barangay'] ?? $_POST['barangay'] ?? '')),
            'templateId' => $templateId,
            'createdBy' => $createdBy,
        ]);
        admin_alerts_ok($result, (string) ($result['message'] ?? 'Broadcast complete.'));
    } catch (InvalidArgumentException $e) {
        admin_alerts_fail($e->getMessage());
    } catch (Throwable $e) {
        admin_alerts_fail($e->getMessage(), 500);
    }
}

if ($action === 'auto_weather' && $method === 'POST') {
    require_once __DIR__ . '/../../includes/system_settings.php';
    if (!firenet_system_setting_bool('weather_auto_enabled', true)) {
        admin_alerts_fail('Weather auto-send is disabled in System Settings.');
    }

    $json = admin_alerts_read_json();
    $sendEmail = array_key_exists('sendEmail', $json)
        ? !empty($json['sendEmail'])
        : true;
    $sendSms = array_key_exists('sendSms', $json)
        ? !empty($json['sendSms'])
        : true;

    try {
        $result = firenet_auto_send_weather_alerts($pdo, $sendEmail, $sendSms, $createdBy > 0 ? $createdBy : null);
        admin_alerts_ok($result, (string) ($result['message'] ?? 'Weather scan complete.'));
    } catch (Throwable $e) {
        admin_alerts_fail($e->getMessage(), 500);
    }
}

admin_alerts_fail('Unknown action.', 404);
