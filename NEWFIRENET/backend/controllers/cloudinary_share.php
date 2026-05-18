<?php
/**
 * Cloudinary share link generator
 * POST (logged-in): { station: 'ASSS', ttl: 3600 }
 * Returns: { ok: true, url: '/backend/cloudinary_index.php?station=ASSS&e=...&t=...' }
 */

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();
firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

$sessionUser = $_SESSION['user'] ?? [];
$currentUserId = (int) ($sessionUser['user_id'] ?? 0);

if ($currentUserId < 1) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Not authenticated']);
    exit;
}

try {
    $config = require __DIR__ . '/../../config/config.php';
    $cloud = $config['cloudinary'] ?? [];
    $apiSecret = $cloud['api_secret'] ?? '';
    if (empty($apiSecret)) {
        throw new Exception('Server not configured for share links');
    }

    $station = trim((string)($_POST['station'] ?? $_GET['station'] ?? ''));
    $ttl = (int)($_POST['ttl'] ?? $_GET['ttl'] ?? 3600);
    if ($station === '') {
        // Resolve station code from current user's station_id if not provided
        $sessionUser = $_SESSION['user'] ?? [];
        $userStationId = (int) ($sessionUser['station_id'] ?? 0);
        if ($userStationId > 0) {
            $pdo = firenet_get_pdo();
            $stmt = $pdo->prepare('SELECT station_code FROM stations WHERE station_id = ? LIMIT 1');
            $stmt->execute([$userStationId]);
            $code = $stmt->fetchColumn();
            if ($code) {
                $station = $code;
            }
        }
        if ($station === '') {
            throw new Exception('Missing station');
        }
    }
    if ($ttl < 60) $ttl = 60;
    if ($ttl > 60*60*24*7) $ttl = 60*60*24*7; // max 7 days

    $e = time() + $ttl;
    $data = $station . '|' . $e;
    $raw = hash_hmac('sha256', $data, $apiSecret, true);
    $t = rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');

    $url = sprintf('/firenet/NEWFIRENET/backend/cloudinary_index.php?station=%s&e=%d&t=%s', rawurlencode($station), $e, rawurlencode($t));

    echo json_encode(['ok' => true, 'url' => $url, 'expires_at' => $e]);
    exit;

} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => $e->getMessage()]);
    exit;
}
