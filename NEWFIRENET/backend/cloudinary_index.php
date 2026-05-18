<?php
/**
 * Public Cloudinary folder index (shareable)
 *
 * Usage: /backend/cloudinary_index.php?station=ASSS
 * Optional signed link: add `e=<unix_ts>&t=<token>` where token = base64url(HMAC_SHA256(station|e, api_secret))
 */

require_once __DIR__ . '/../../includes/db.php';

header('Content-Type: text/html; charset=utf-8');

function hmac_token(string $data, string $secret): string {
    $raw = hash_hmac('sha256', $data, $secret, true);
    // base64url
    return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

try {
    $config = require __DIR__ . '/../../config/config.php';
    $cloud = $config['cloudinary'] ?? [];
    $cloudName = $cloud['cloud_name'] ?? '';
    $apiKey = $cloud['api_key'] ?? '';
    $apiSecret = $cloud['api_secret'] ?? '';
    $baseFolder = $cloud['orgmail_folder'] ?? 'firenet/orgmail';

    $station = trim((string)($_GET['station'] ?? ''));
    if ($station === '') {
        http_response_code(400);
        echo '<h1>Missing station</h1><p>Provide ?station=STATION_CODE</p>';
        exit;
    }

    // token optional
    $e = isset($_GET['e']) ? (int)$_GET['e'] : 0;
    $t = isset($_GET['t']) ? trim((string)$_GET['t']) : '';
    if ($e > 0 && $t !== '' && $apiSecret !== '') {
        if (time() > $e) {
            http_response_code(403);
            echo '<h1>Link expired</h1>';
            exit;
        }
        $data = $station . '|' . $e;
        $expected = hmac_token($data, $apiSecret);
        if (!hash_equals($expected, $t)) {
            http_response_code(403);
            echo '<h1>Invalid token</h1>';
            exit;
        }
    }

    // Build folder path
    $folderPath = rtrim($baseFolder, '/') . '/' . $station;

    // Call Cloudinary Admin API search
    $auth = base64_encode($apiKey . ':' . $apiSecret);
    $expression = urlencode('folder="' . $folderPath . '"');
    $url = 'https://api.cloudinary.com/v1_1/' . $cloudName . '/resources/search?expression=' . $expression . '&max_results=500';

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'Authorization: Basic ' . $auth,
                'Content-Type: application/json'
            ],
            'timeout' => 10
        ]
    ]);

    $response = @file_get_contents($url, false, $context);
    $resources = [];
    if ($response !== false) {
        $data = json_decode($response, true) ?: [];
        $resources = $data['resources'] ?? [];
    }

    // Render simple HTML
    ?><!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Cloudinary folder: <?php echo htmlspecialchars($folderPath); ?></title>
      <style>
        body{font-family:Segoe UI,Roboto,Arial;margin:18px;color:#111}
        h1{font-size:20px}
        .file{padding:10px;border:1px solid #e6e9ee;margin:8px 0;border-radius:6px}
        .meta{color:#556;font-size:13px}
        a{color:#0b66c3}
      </style>
    </head>
    <body>
      <h1>Folder: <?php echo htmlspecialchars($folderPath); ?></h1>
      <p><?php echo count($resources); ?> files</p>
      <?php if (count($resources) === 0): ?>
        <p>No files found in this folder.</p>
      <?php else: ?>
        <?php foreach ($resources as $res):
          $url = $res['secure_url'] ?? $res['url'] ?? '';
          $name = basename($res['public_id'] ?? '');
          $bytes = (int)($res['bytes'] ?? 0);
          $date = $res['created_at'] ?? '';
        ?>
          <div class="file">
            <div><a href="<?php echo htmlspecialchars($url); ?>" target="_blank" rel="noreferrer noopener"><?php echo htmlspecialchars($name); ?></a></div>
            <div class="meta"><?php echo htmlspecialchars($date); ?> — <?php echo round($bytes/1024,2); ?> KB</div>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </body>
    </html>
    <?php

} catch (Throwable $e) {
    http_response_code(500);
    echo '<h1>Error</h1><p>' . htmlspecialchars($e->getMessage()) . '</p>';
}
