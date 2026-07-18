<?php
/**
 * District-wide system settings (Admin Settings → System).
 */

require_once __DIR__ . '/db.php';

function firenet_system_settings_defaults(): array
{
    return [
        'app_name' => 'FireNet',
        'district_name' => 'Makati Fire District',
        'public_tagline' => 'Public safety portal for civilians — hotlines, weather, and district alerts.',
        'emergency_hotline' => '168',
        'central_phone' => '09311451493',
        'mail_from_name' => 'FireNet Alerts',
        'sms_enabled' => '1',
        'sms_provider' => 'log',
        'sms_api_key' => '',
        'sms_sender_name' => 'FireNet',
        'portal_subscribe_enabled' => '1',
        'portal_maintenance_enabled' => '0',
        'portal_maintenance_message' => 'The public portal is temporarily under maintenance. For emergencies call 168.',
        'default_auto_logout_minutes' => '30',
        'security_alerts_default' => '1',
        'alert_default_send_email' => '1',
        'alert_default_send_sms' => '1',
        'weather_auto_enabled' => '1',
    ];
}

function firenet_system_settings_ensure_table(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS system_settings (
            setting_key VARCHAR(80) NOT NULL,
            setting_value TEXT NULL,
            updated_at DATETIME NULL,
            updated_by INT NULL,
            PRIMARY KEY (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
}

/**
 * @return array<string,string>
 */
function firenet_system_settings_all(?PDO $pdo = null, bool $reload = false): array
{
    static $cached = null;
    if ($reload) {
        $cached = null;
    }
    if ($cached !== null && $pdo === null) {
        return $cached;
    }

    $defaults = firenet_system_settings_defaults();
    try {
        $pdo = $pdo ?: firenet_get_pdo();
        firenet_system_settings_ensure_table($pdo);
        $rows = $pdo->query('SELECT setting_key, setting_value FROM system_settings')->fetchAll(PDO::FETCH_KEY_PAIR);
        if (!is_array($rows)) {
            $rows = [];
        }
        foreach ($rows as $key => $value) {
            if (array_key_exists($key, $defaults)) {
                $defaults[$key] = (string) ($value ?? '');
            }
        }
    } catch (Throwable $ignored) {
        // Keep defaults when DB is unavailable.
    }

    $cached = $defaults;
    return $defaults;
}

function firenet_system_setting(string $key, ?string $default = null): string
{
    $all = firenet_system_settings_all();
    if (array_key_exists($key, $all)) {
        return (string) $all[$key];
    }
    return (string) ($default ?? '');
}

function firenet_system_setting_bool(string $key, bool $default = false): bool
{
    $raw = strtolower(trim(firenet_system_setting($key, $default ? '1' : '0')));
    return in_array($raw, ['1', 'true', 'yes', 'on'], true);
}

/**
 * @param array<string,mixed> $input
 * @return array<string,string>
 */
function firenet_system_settings_save(PDO $pdo, array $input, ?int $updatedBy = null): array
{
    firenet_system_settings_ensure_table($pdo);
    $defaults = firenet_system_settings_defaults();
    $allowed = array_keys($defaults);
    $saved = firenet_system_settings_all($pdo);

    $stmt = $pdo->prepare(
        'INSERT INTO system_settings (setting_key, setting_value, updated_at, updated_by)
         VALUES (?, ?, NOW(), ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW(), updated_by = VALUES(updated_by)'
    );

    foreach ($allowed as $key) {
        if (!array_key_exists($key, $input)) {
            continue;
        }
        $value = trim((string) $input[$key]);

        if ($key === 'emergency_hotline') {
            $value = preg_replace('/\D+/', '', $value) ?: '168';
        }
        if ($key === 'central_phone') {
            $digits = preg_replace('/\D+/', '', $value);
            $value = is_string($digits) ? $digits : '';
        }
        if ($key === 'default_auto_logout_minutes') {
            $mins = (int) $value;
            if ($mins < 5) {
                $mins = 5;
            }
            if ($mins > 240) {
                $mins = 240;
            }
            $value = (string) $mins;
        }
        if (in_array($key, [
            'sms_enabled',
            'portal_subscribe_enabled',
            'portal_maintenance_enabled',
            'security_alerts_default',
            'alert_default_send_email',
            'alert_default_send_sms',
            'weather_auto_enabled',
        ], true)) {
            $value = in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true) ? '1' : '0';
        }
        if ($key === 'sms_provider') {
            $value = strtolower($value);
            if (!in_array($value, ['log', 'semaphore', 'http'], true)) {
                $value = 'log';
            }
        }
        if ($key === 'sms_api_key' && $value === '') {
            // Keep existing key when blank (UI sends empty to mean "unchanged").
            continue;
        }
        if (in_array($key, ['app_name', 'district_name', 'sms_sender_name', 'mail_from_name'], true)) {
            $value = mb_substr($value, 0, 80);
        }
        if (in_array($key, ['public_tagline', 'portal_maintenance_message'], true)) {
            $value = mb_substr($value, 0, 400);
        }

        $stmt->execute([$key, $value, $updatedBy]);
        $saved[$key] = $value;
    }

    $fresh = firenet_system_settings_all($pdo, true);
    if (function_exists('firenet_load_app_config')) {
        firenet_load_app_config(true);
    }
    return $fresh;
}

/**
 * Overlay district settings onto app config (mail/SMS/app name).
 *
 * @param array<string,mixed> $config
 * @return array<string,mixed>
 */
function firenet_apply_system_settings_to_config(array $config): array
{
    try {
        $settings = firenet_system_settings_all();
    } catch (Throwable $e) {
        return $config;
    }

    if (($settings['app_name'] ?? '') !== '') {
        $config['app_name'] = $settings['app_name'];
    }
    if (!isset($config['mail']) || !is_array($config['mail'])) {
        $config['mail'] = [];
    }
    if (($settings['mail_from_name'] ?? '') !== '') {
        $config['mail']['from_name'] = $settings['mail_from_name'];
    }
    if (!isset($config['sms']) || !is_array($config['sms'])) {
        $config['sms'] = [];
    }
    $config['sms']['enabled'] = (($settings['sms_enabled'] ?? '1') === '1');
    $config['sms']['provider'] = $settings['sms_provider'] ?? 'log';
    $config['sms']['sender_name'] = $settings['sms_sender_name'] ?? 'FireNet';
    if (($settings['sms_api_key'] ?? '') !== '') {
        $config['sms']['api_key'] = $settings['sms_api_key'];
    }

    return $config;
}

/**
 * Integration / health snapshot for admin UI.
 *
 * @return array<string,mixed>
 */
function firenet_system_integrations_status(): array
{
    require_once __DIR__ . '/mailer.php';
    require_once __DIR__ . '/sms.php';

    $config = firenet_load_app_config();
    $mail = firenet_mail_config();
    $sms = firenet_sms_config();
    $maps = is_array($config['google_maps'] ?? null) ? $config['google_maps'] : [];
    $auth = is_array($config['google_auth'] ?? null) ? $config['google_auth'] : [];
    $mapsKey = trim((string) ($maps['api_key'] ?? ''));
    $mapsOk = $mapsKey !== '' && strpos($mapsKey, 'YOUR_GOOGLE_MAPS_API_KEY') !== 0;

    return [
        'mailReady' => firenet_mailer_is_ready() && firenet_mail_config_is_complete($mail),
        'mailFrom' => (string) ($mail['from_email'] ?? ''),
        'smsReady' => firenet_sms_is_ready(),
        'smsProvider' => (string) ($sms['provider'] ?? ''),
        'smsMode' => (($sms['provider'] ?? '') === 'log') ? 'local-log' : 'gateway',
        'mapsReady' => $mapsOk,
        'googleAuthReady' => !empty($auth['enabled']) && trim((string) ($auth['client_id'] ?? '')) !== '',
        'phpMailerReady' => firenet_mailer_is_ready(),
    ];
}
