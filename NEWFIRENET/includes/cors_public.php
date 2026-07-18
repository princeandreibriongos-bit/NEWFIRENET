<?php
/**
 * Optional CORS for public civilian endpoints called from the Vercel portal.
 * Allowed origins come from system setting `civilian_cors_origins` (comma-separated)
 * or env FIRENET_CIVILIAN_CORS (comma-separated). Use * only for local testing.
 */

function firenet_cors_public_apply(): void
{
    if (headers_sent()) {
        return;
    }

    $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin === '') {
        return;
    }

    $allowedRaw = '';
    if (function_exists('firenet_system_setting')) {
        $allowedRaw = (string) firenet_system_setting('civilian_cors_origins', '');
    }
    if ($allowedRaw === '' && getenv('FIRENET_CIVILIAN_CORS') !== false) {
        $allowedRaw = (string) getenv('FIRENET_CIVILIAN_CORS');
    }

    $allowed = array_values(array_filter(array_map('trim', explode(',', $allowedRaw))));
    $ok = in_array('*', $allowed, true) || in_array($origin, $allowed, true);

    // Default: allow Vercel civilian portal origins when no allowlist is configured.
    if (!$ok && $allowedRaw === '' && preg_match('#^https://([a-z0-9-]+\.)*vercel\.app$#i', $origin)) {
        $ok = true;
    }

    if (!$ok) {
        return;
    }

    header('Access-Control-Allow-Origin: ' . (in_array('*', $allowed, true) ? '*' : $origin));
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    header('Access-Control-Max-Age: 86400');

    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
