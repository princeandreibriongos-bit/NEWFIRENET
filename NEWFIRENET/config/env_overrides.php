<?php
/**
 * Apply FireNet secrets from environment variables (Vercel / hosting).
 *
 * Precedence: env vars override config.php and r2.local.php when set.
 * Empty / unset env vars are ignored so local XAMPP keeps using files.
 */

function firenet_env_get(string $key): ?string
{
    $value = getenv($key);
    if ($value === false && isset($_ENV[$key])) {
        $value = $_ENV[$key];
    }
    if ($value === false && isset($_SERVER[$key])) {
        $value = $_SERVER[$key];
    }
    if ($value === false || $value === null) {
        return null;
    }

    $value = trim((string) $value);
    return $value === '' ? null : $value;
}

function firenet_env_bool(?string $value): ?bool
{
    if ($value === null) {
        return null;
    }

    $normalized = strtolower(trim($value));
    if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
        return true;
    }
    if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
        return false;
    }

    return null;
}

function firenet_apply_env_config(array $config): array
{
    if (!isset($config['r2']) || !is_array($config['r2'])) {
        $config['r2'] = [];
    }
    if (!isset($config['mail']) || !is_array($config['mail'])) {
        $config['mail'] = [];
    }

    $r2Enabled = firenet_env_bool(firenet_env_get('FIRENET_R2_ENABLED'));
    if ($r2Enabled !== null) {
        $config['r2']['enabled'] = $r2Enabled;
    }

    $r2Map = [
        'FIRENET_R2_ACCOUNT_ID' => 'account_id',
        'FIRENET_R2_ACCESS_KEY_ID' => 'access_key_id',
        'FIRENET_R2_SECRET_ACCESS_KEY' => 'secret_access_key',
        'FIRENET_R2_BUCKET' => 'bucket',
        'FIRENET_R2_BASE_PREFIX' => 'base_prefix',
    ];
    foreach ($r2Map as $envKey => $configKey) {
        $value = firenet_env_get($envKey);
        if ($value !== null) {
            $config['r2'][$configKey] = $value;
        }
    }

    $mailMap = [
        'FIRENET_MAIL_SMTP_HOST' => 'smtp_host',
        'FIRENET_MAIL_SMTP_USERNAME' => 'smtp_username',
        'FIRENET_MAIL_SMTP_PASSWORD' => 'smtp_password',
        'FIRENET_MAIL_SMTP_ENCRYPTION' => 'smtp_encryption',
        'FIRENET_MAIL_FROM_EMAIL' => 'from_email',
        'FIRENET_MAIL_FROM_NAME' => 'from_name',
    ];
    foreach ($mailMap as $envKey => $configKey) {
        $value = firenet_env_get($envKey);
        if ($value !== null) {
            $config['mail'][$configKey] = $value;
        }
    }

    $mailPort = firenet_env_get('FIRENET_MAIL_SMTP_PORT');
    if ($mailPort !== null && ctype_digit($mailPort)) {
        $config['mail']['smtp_port'] = (int) $mailPort;
    }

    return $config;
}
