<?php
function firenet_load_dotenv_file(string $filePath): void
{
    if (!is_file($filePath)) {
        return;
    }
    
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($lines)) {
        return;
    }
    
    foreach ($lines as $line) {
        $line = trim($line);
        // Skip comments
        if ($line === '' || $line[0] === '#') {
            continue;
        }
        // Parse KEY=VALUE
        if (strpos($line, '=') === false) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        
        // Only set if not already in environment
        if (!empty($key) && getenv($key) === false && !isset($_ENV[$key]) && !isset($_SERVER[$key])) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

// Load .env.production if it exists (Vercel deployment fallback)
firenet_load_dotenv_file(__DIR__ . '/../.env.production');

// Load .env.local for local development (if it exists)
firenet_load_dotenv_file(__DIR__ . '/../.env.local');

function firenet_env_get(string $key): ?string
{
    $candidates = [];

    // Try getenv() - standard PHP
    $fromGetenv = getenv($key);
    if ($fromGetenv !== false) {
        $candidates[] = $fromGetenv;
    }

    // Try $_ENV - environment variables superglobal
    if (array_key_exists($key, $_ENV)) {
        $candidates[] = $_ENV[$key];
    }

    // Try $_SERVER - server/CGI variables
    if (array_key_exists($key, $_SERVER)) {
        $candidates[] = $_SERVER[$key];
    }

    // Try getenv() with full environment map (some PHP hosts)
    if ($candidates === [] && function_exists('getenv')) {
        $all = getenv();
        if (is_array($all) && array_key_exists($key, $all)) {
            $candidates[] = $all[$key];
        }
    }

    // Vercel-specific: Try reading from Vercel API via environment
    // In Vercel Functions, env vars may be injected differently
    if ($candidates === [] && function_exists('getenv')) {
        // Some Vercel deployments require specific prefixes or alternative detection
        $allEnv = getenv();
        if (is_array($allEnv)) {
            // Log all available vars starting with FIRENET for debugging
            if (strpos($key, 'FIRENET_') === 0) {
                $firenetVars = array_keys(array_filter($allEnv, fn($k) => strpos($k, 'FIRENET_') === 0, ARRAY_FILTER_USE_KEY));
                if (empty($firenetVars)) {
                    // No FIRENET vars found at all - log diagnostic info
                    error_log("ENV DEBUG: Searching for $key but no FIRENET_ vars found in getenv() map. Keys in getenv(): " . count($allEnv) . " total");
                }
            }
        }
    }

    foreach ($candidates as $raw) {
        if ($raw === null || $raw === false) {
            continue;
        }
        $value = trim((string) $raw);
        // Strip accidental wrapping quotes from pasted dashboard values.
        if (
            strlen($value) >= 2
            && (
                ($value[0] === '"' && substr($value, -1) === '"')
                || ($value[0] === "'" && substr($value, -1) === "'")
            )
        ) {
            $value = trim(substr($value, 1, -1));
        }
        if ($value !== '') {
            return $value;
        }
    }

    return null;
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
