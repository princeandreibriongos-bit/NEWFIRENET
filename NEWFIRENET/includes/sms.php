<?php
/**
 * SMS helpers for FireNet (Semaphore / generic HTTP gateway).
 */

require_once __DIR__ . '/mailer.php';

function firenet_sms_config(): array
{
    $config = firenet_load_app_config();
    $sms = is_array($config['sms'] ?? null) ? $config['sms'] : [];

    return [
        'enabled' => !empty($sms['enabled']),
        'provider' => strtolower(trim((string) ($sms['provider'] ?? 'semaphore'))),
        'api_key' => trim((string) ($sms['api_key'] ?? '')),
        'sender_name' => trim((string) ($sms['sender_name'] ?? 'FireNet')),
        'api_url' => trim((string) ($sms['api_url'] ?? '')),
    ];
}

function firenet_sms_is_ready(): bool
{
    $cfg = firenet_sms_config();
    if (empty($cfg['enabled'])) {
        return false;
    }

    $provider = $cfg['provider'];
    if ($provider === 'log') {
        return true;
    }
    if ($cfg['api_key'] === '') {
        return false;
    }
    return in_array($provider, ['semaphore', 'http'], true);
}

/**
 * Normalize to PH mobile digits starting with 09…
 */
function firenet_sms_normalize_phone(string $phone): string
{
    $digits = preg_replace('/\D+/', '', $phone);
    if (!is_string($digits) || $digits === '') {
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

/**
 * @return array{ok:bool,message:string,provider_response?:mixed}
 */
function firenet_send_sms(string $phone, string $message): array
{
    $cfg = firenet_sms_config();
    $normalized = firenet_sms_normalize_phone($phone);
    $message = trim($message);

    if (!firenet_sms_is_ready()) {
        return ['ok' => false, 'message' => 'SMS gateway is not configured.'];
    }
    if ($normalized === '' || !preg_match('/^09\d{9}$/', $normalized)) {
        return ['ok' => false, 'message' => 'Invalid mobile number.'];
    }
    if ($message === '') {
        return ['ok' => false, 'message' => 'SMS message is empty.'];
    }
    if (strlen($message) > 480) {
        $message = substr($message, 0, 477) . '...';
    }

    if ($cfg['provider'] === 'log') {
        return firenet_send_sms_log($normalized, $message, $cfg);
    }
    if ($cfg['provider'] === 'semaphore') {
        return firenet_send_sms_semaphore($normalized, $message, $cfg);
    }

    return firenet_send_sms_http($normalized, $message, $cfg);
}

/**
 * Local/dev SMS sink — stores messages so broadcasts can complete without a paid gateway.
 *
 * @param array<string,mixed> $cfg
 * @return array{ok:bool,message:string,provider_response?:mixed}
 */
function firenet_send_sms_log(string $phone, string $message, array $cfg): array
{
    try {
        require_once __DIR__ . '/db.php';
        $pdo = firenet_get_pdo();
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS civilian_alert_sms_log (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                phone VARCHAR(32) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(40) NOT NULL DEFAULT "logged",
                provider VARCHAR(40) NOT NULL DEFAULT "log",
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        );
        $stmt = $pdo->prepare(
            'INSERT INTO civilian_alert_sms_log (phone, message, status, provider) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$phone, $message, 'logged', 'log']);
        return [
            'ok' => true,
            'message' => 'SMS logged locally (configure Semaphore for live delivery).',
            'provider_response' => ['mode' => 'log', 'sender' => $cfg['sender_name'] ?? 'FireNet'],
        ];
    } catch (Throwable $e) {
        return ['ok' => false, 'message' => 'Unable to log SMS: ' . $e->getMessage()];
    }
}

/**
 * @param array<string,mixed> $cfg
 * @return array{ok:bool,message:string,provider_response?:mixed}
 */
function firenet_send_sms_semaphore(string $phone, string $message, array $cfg): array
{
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'message' => 'PHP cURL is required for SMS.'];
    }

    $payload = [
        'apikey' => $cfg['api_key'],
        'number' => $phone,
        'message' => $message,
    ];
    if ($cfg['sender_name'] !== '') {
        $payload['sendername'] = $cfg['sender_name'];
    }

    $ch = curl_init('https://api.semaphore.co/api/v4/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_POSTFIELDS => http_build_query($payload),
    ]);
    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno !== 0) {
        return ['ok' => false, 'message' => 'SMS request failed: ' . $error];
    }

    $decoded = json_decode((string) $raw, true);
    if ($status >= 200 && $status < 300) {
        return [
            'ok' => true,
            'message' => 'SMS sent.',
            'provider_response' => $decoded !== null ? $decoded : $raw,
        ];
    }

    $providerMessage = '';
    if (is_array($decoded)) {
        $providerMessage = (string) ($decoded['message'] ?? $decoded['error'] ?? '');
        if ($providerMessage === '' && isset($decoded[0]['message'])) {
            $providerMessage = (string) $decoded[0]['message'];
        }
    }

    return [
        'ok' => false,
        'message' => $providerMessage !== '' ? $providerMessage : ('SMS provider error (HTTP ' . $status . ').'),
        'provider_response' => $decoded !== null ? $decoded : $raw,
    ];
}

/**
 * Generic HTTP SMS gateway: POST JSON { to, message, sender } with Authorization Bearer api_key.
 *
 * @param array<string,mixed> $cfg
 * @return array{ok:bool,message:string,provider_response?:mixed}
 */
function firenet_send_sms_http(string $phone, string $message, array $cfg): array
{
    $url = trim((string) ($cfg['api_url'] ?? ''));
    if ($url === '') {
        return ['ok' => false, 'message' => 'SMS api_url is missing for HTTP provider.'];
    }
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'message' => 'PHP cURL is required for SMS.'];
    }

    $body = json_encode([
        'to' => $phone,
        'message' => $message,
        'sender' => $cfg['sender_name'],
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            'Authorization: Bearer ' . $cfg['api_key'],
        ],
        CURLOPT_POSTFIELDS => $body,
    ]);
    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno !== 0) {
        return ['ok' => false, 'message' => 'SMS request failed: ' . $error];
    }

    $decoded = json_decode((string) $raw, true);
    if ($status >= 200 && $status < 300) {
        return [
            'ok' => true,
            'message' => 'SMS sent.',
            'provider_response' => $decoded !== null ? $decoded : $raw,
        ];
    }

    return [
        'ok' => false,
        'message' => 'SMS provider error (HTTP ' . $status . ').',
        'provider_response' => $decoded !== null ? $decoded : $raw,
    ];
}
