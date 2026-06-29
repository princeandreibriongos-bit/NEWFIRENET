<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_start_session();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

function firenet_google_config(): array
{
    $configFile = __DIR__ . '/../../config/config.php';
    if (!is_file($configFile)) {
        return [];
    }

    $loaded = require $configFile;
    if (!is_array($loaded)) {
        return [];
    }

    $google = $loaded['google_auth'] ?? [];
    return is_array($google) ? $google : [];
}

function firenet_google_input(): array
{
    $raw = (string) file_get_contents('php://input');
    if ($raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        $formDecoded = [];
        parse_str($raw, $formDecoded);
        if (is_array($formDecoded) && !empty($formDecoded)) {
            return $formDecoded;
        }
    }

    return is_array($_POST) ? $_POST : [];
}

function firenet_google_missing_config(array $googleConfig): array
{
    $missing = [];

    $enabled = !empty($googleConfig['enabled']);
    if (!$enabled) {
        $missing[] = 'google_auth.enabled';
    }

    $clientId = trim((string) ($googleConfig['client_id'] ?? ''));
    if ($clientId === '' || strpos($clientId, 'YOUR_GOOGLE_WEB_CLIENT_ID') === 0) {
        $missing[] = 'google_auth.client_id';
    }

    return $missing;
}

$googleConfig = firenet_google_config();
$clientId = trim((string) ($googleConfig['client_id'] ?? ''));
$missingConfig = firenet_google_missing_config($googleConfig);

if (!empty($missingConfig)) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'message' => 'Google sign-in is not configured. Missing: ' . implode(', ', $missingConfig),
        'missing' => $missingConfig
    ]);
    exit;
}

$input = firenet_google_input();
$idToken = trim((string) ($input['credential'] ?? ''));
if ($idToken === '') {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'message' => 'Missing Google credential from browser response (credential).'
    ]);
    exit;
}

$verifyUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($idToken);
$tokenResponse = @file_get_contents($verifyUrl);
if (!is_string($tokenResponse) || trim($tokenResponse) === '') {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Unable to verify Google token.']);
    exit;
}

$tokenData = json_decode($tokenResponse, true);
if (!is_array($tokenData)) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Invalid Google token response.']);
    exit;
}

$aud = trim((string) ($tokenData['aud'] ?? ''));
$iss = trim((string) ($tokenData['iss'] ?? ''));
$email = strtolower(trim((string) ($tokenData['email'] ?? '')));
$emailVerified = trim((string) ($tokenData['email_verified'] ?? '')) === 'true';
$exp = (int) ($tokenData['exp'] ?? 0);

$issuerValid = in_array($iss, ['accounts.google.com', 'https://accounts.google.com'], true);

if ($aud !== $clientId || !$issuerValid || $email === '' || !$emailVerified || ($exp > 0 && $exp < time())) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Google token validation failed.']);
    exit;
}

try {
    $pdo = firenet_get_pdo();
    $stmt = $pdo->prepare('
                SELECT u.user_id, u.username, u.station_id, u.status, r.role_name, p.position_code, p.position_name
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
                LEFT JOIN positions p ON p.position_id = u.position_id
        WHERE LOWER(u.email) = ?
          AND LOWER(u.status) = "active"
          AND LOWER(r.role_name) IN ("user", "admin", "superadmin")
        ORDER BY u.user_id ASC
    ');
    $stmt->execute([$email]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!is_array($rows) || count($rows) === 0) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'message' => 'No active FireNet account is linked to this Google email.']);
        exit;
    }

    if (count($rows) > 1) {
        http_response_code(409);
        echo json_encode(['ok' => false, 'message' => 'This Google email is linked to multiple station accounts. Contact administrator.']);
        exit;
    }

    $row = $rows[0];
    session_regenerate_id(true);
    $_SESSION['user'] = [
        'user_id' => (int) ($row['user_id'] ?? 0),
        'username' => (string) ($row['username'] ?? ''),
        'role' => strtolower((string) ($row['role_name'] ?? 'user')),
        'station_id' => (int) ($row['station_id'] ?? 1),
        'position_code' => strtolower((string) ($row['position_code'] ?? '')),
        'position_name' => (string) ($row['position_name'] ?? '')
    ];

    echo json_encode([
        'ok' => true,
        'message' => 'Google sign-in successful.',
        'redirect' => '/firenet/NEWFIRENET/backend/pages/dashboard.php'
    ]);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Google sign-in service is temporarily unavailable.']);
    exit;
}
