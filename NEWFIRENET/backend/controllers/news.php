<?php
$firenetConfig = require __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

$action = strtolower(trim((string) ($_GET['action'] ?? $_POST['action'] ?? 'list')));

function firenet_news_fail(string $message, int $status = 400): void
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'message' => $message], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function firenet_news_current_role(): string
{
    $sessionUser = $_SESSION['user'] ?? [];
    return strtolower((string) ($sessionUser['role'] ?? 'user'));
}

function firenet_news_is_admin(): bool
{
    $role = firenet_news_current_role();
    return in_array($role, ['admin', 'superadmin'], true);
}

function firenet_news_ensure_table(PDO $pdo): void
{
    // Base table (created if missing)
    $pdo->exec('CREATE TABLE IF NOT EXISTS news_feed (
        news_id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(160) NOT NULL,
        body TEXT NOT NULL,
        image_path TEXT NULL,
        status VARCHAR(16) NOT NULL DEFAULT "approved",
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )');

    // Announcement columns (safe to add if they do not exist)
    // MySQL: "IF NOT EXISTS" is supported for ADD COLUMN on newer versions.
    // If your MySQL is older, run the provided ALTER TABLE SQL manually.
    $pdo->exec('ALTER TABLE news_feed
        ADD COLUMN IF NOT EXISTS is_announcement TINYINT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS announcement_type VARCHAR(64) NULL,
        ADD COLUMN IF NOT EXISTS audience VARCHAR(32) NULL,
        ADD COLUMN IF NOT EXISTS expires_at DATE NULL
    ');

    // Helpful indexes (optional; safe even if they already exist on newer DBs)
    try {
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_announcement ON news_feed (is_announcement, status, expires_at, created_at)');
    } catch (Throwable $e) {
        // ignore index creation errors
    }
}

function firenet_news_public_image_url(?string $imagePath): string
{
    if (!$imagePath) {
        return '/firenet/NEWFIRENET/assets/img/.gitkeep';
    }

    $normalized = str_replace('\\', '/', $imagePath);
    $normalized = ltrim($normalized, '/');
    // Expect image_path stored like: uploads/photos/news/filename.jpg
    return '/firenet/NEWFIRENET/' . $normalized;
}

function firenet_news_settings(): array
{
    global $firenetConfig;

    $config = is_array($firenetConfig ?? null) ? $firenetConfig : [];
    $newsApi = is_array($config['news_api'] ?? null) ? $config['news_api'] : [];

    return [
        'enabled' => !empty($newsApi['enabled']),
        'api_key' => trim((string) ($newsApi['api_key'] ?? (getenv('FIRENET_NEWS_API_KEY') ?: ''))),
        'country' => trim((string) ($newsApi['country'] ?? 'ph')),
        'query' => trim((string) ($newsApi['query'] ?? 'fire')),
    ];
}

function firenet_news_http_get_json(string $url): ?array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        if ($ch === false) {
            return null;
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 6,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'User-Agent: FireNet/1.0 (+https://firenet.local)'
            ]
        ]);

        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        if ($body === false || $status < 200 || $status >= 300) {
            return null;
        }

        $decoded = json_decode($body, true);
        return is_array($decoded) ? $decoded : null;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 6,
            'header' => "Accept: application/json\r\nUser-Agent: FireNet/1.0 (+https://firenet.local)\r\n"
        ]
    ]);

    $body = @file_get_contents($url, false, $context);
    if ($body === false) {
        return null;
    }

    $decoded = json_decode($body, true);
    return is_array($decoded) ? $decoded : null;
}

function firenet_news_fetch_external_items(int $limit): array
{
    $settings = firenet_news_settings();
    if (empty($settings['enabled']) || $settings['api_key'] === '' || $limit < 1) {
        return [];
    }

    $params = [
        'apiKey' => $settings['api_key'],
        'language' => 'en',
        'sortBy' => 'publishedAt',
        'pageSize' => $limit,
    ];

    if ($settings['query'] !== '') {
        $params['q'] = $settings['query'];
    }

    $url = 'https://newsapi.org/v2/everything?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986);
    $payload = firenet_news_http_get_json($url);

    if (!$payload || (($payload['status'] ?? '') !== 'ok') || !is_array($payload['articles'] ?? null)) {
        return [];
    }

    $items = [];
    foreach ($payload['articles'] as $article) {
        if (!is_array($article)) {
            continue;
        }

        $title = trim((string) ($article['title'] ?? ''));
        $articleUrl = trim((string) ($article['url'] ?? ''));
        if ($title === '' || $articleUrl === '') {
            continue;
        }

        $body = trim((string) ($article['description'] ?? ''));
        if ($body === '') {
            $body = trim((string) ($article['content'] ?? ''));
        }

        $sourceName = '';
        if (isset($article['source']) && is_array($article['source'])) {
            $sourceName = trim((string) ($article['source']['name'] ?? ''));
        }

        $items[] = [
            'newsId' => '',
            'title' => $title,
            'body' => $body,
            'imageUrl' => trim((string) ($article['urlToImage'] ?? '')),
            'createdAt' => trim((string) ($article['publishedAt'] ?? '')),
            'articleUrl' => $articleUrl,
            'sourceName' => $sourceName,
        ];

        if (count($items) >= $limit) {
            break;
        }
    }

    return $items;
}

function firenet_news_validate_text(string $title, string $body): array
{
    $title = trim($title);
    $body = trim($body);

    if ($title === '') {
        firenet_news_fail('Title is required.', 422);
    }
    if (mb_strlen($title) > 160) {
        firenet_news_fail('Title must be 160 characters or less.', 422);
    }
    if ($body === '') {
        firenet_news_fail('What happened / body is required.', 422);
    }
    if (mb_strlen($body) > 4000) {
        firenet_news_fail('Body must be 4000 characters or less.', 422);
    }

    return [$title, $body];
}

function firenet_news_handle_upload(): string
{
    if (!isset($_FILES['photo']) || !is_array($_FILES['photo'])) {
        firenet_news_fail('News photo is required.', 422);
    }

    $file = $_FILES['photo'];
    if (!isset($file['error']) || (int) $file['error'] !== 0) {
        firenet_news_fail('Unable to upload photo.', 422);
    }

    $tmp = (string) ($file['tmp_name'] ?? '');
    if ($tmp === '' || !is_file($tmp)) {
        firenet_news_fail('Unable to upload photo.', 422);
    }

    $originalName = (string) ($file['name'] ?? '');
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!in_array($ext, $allowed, true)) {
        firenet_news_fail('Unsupported image type. Use jpg, png, webp, or gif.', 422);
    }

    $uploadDirAbs = dirname(__DIR__, 2) . '/uploads/photos/news';
    if (!is_dir($uploadDirAbs)) {
        if (!@mkdir($uploadDirAbs, 0775, true) && !is_dir($uploadDirAbs)) {
            firenet_news_fail('Unable to create uploads directory.', 500);
        }
    }

    $fileName = 'news_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $destAbs = $uploadDirAbs . '/' . $fileName;

    if (!@move_uploaded_file($tmp, $destAbs)) {
        firenet_news_fail('Unable to save uploaded photo.', 500);
    }

    // Store relative path from NEWFIRENET root for consistent url building
    // uploads/photos/news/<fileName>
    return 'uploads/photos/news/' . $fileName;
}

try {
    $pdo = firenet_get_pdo();
    firenet_news_ensure_table($pdo);

    if ($action === 'list') {
        $limit = (int) ($_GET['limit'] ?? 5);
        if ($limit < 1) $limit = 5;
        if ($limit > 10) $limit = 10;

        $stmt = $pdo->prepare('
            SELECT news_id, title, body, image_path, created_at
            FROM news_feed
            WHERE status = "approved" AND COALESCE(is_announcement, 0) = 0
            ORDER BY created_at DESC, news_id DESC
            LIMIT ?
        ');
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $items = array_map(static function (array $row): array {
            $imagePath = $row['image_path'] ?? null;
            $imageUrl = $imagePath ? firenet_news_public_image_url((string) $imagePath) : '';
            return [
                'newsId' => (int) ($row['news_id'] ?? 0),
                'title' => (string) ($row['title'] ?? ''),
                'body' => (string) ($row['body'] ?? ''),
                'imageUrl' => (string) $imageUrl,
                'createdAt' => (string) ($row['created_at'] ?? ''),
                'articleUrl' => '',
                'sourceName' => 'FireNet'
            ];
        }, $rows);

        if (count($items) < $limit) {
            $externalItems = firenet_news_fetch_external_items($limit - count($items));
            if (!empty($externalItems)) {
                $items = array_merge($items, $externalItems);
            }
        }

        $items = array_slice($items, 0, $limit);

        echo json_encode([
            'ok' => true,
            'data' => [
                'items' => $items
            ]
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'get') {
        $newsId = (int) ($_GET['newsId'] ?? 0);
        if ($newsId <= 0) {
            firenet_news_fail('Invalid newsId.', 422);
        }

        $stmt = $pdo->prepare('
            SELECT news_id, title, body, image_path, created_at, is_announcement, announcement_type, audience, expires_at
            FROM news_feed
            WHERE status = "approved" AND news_id = ?
            LIMIT 1
        ');
        $stmt->execute([$newsId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            firenet_news_fail('News not found.', 404);
        }

        // If it's an announcement, ensure it's not expired.
        $isAnnouncement = (int) ($row['is_announcement'] ?? 0);
        $expiresAt = $row['expires_at'] ?? null;

        // Treat invalid/empty expires_at as "no expiration".
        if ($isAnnouncement === 1 && $expiresAt !== null && $expiresAt !== '') {
            $expTs = strtotime((string) $expiresAt);
            if ($expTs !== false && $expTs < strtotime('today')) {
                firenet_news_fail('Announcement expired.', 404);
            }
        }

        $imagePath = $row['image_path'] ?? null;
        $imageUrl = $imagePath ? firenet_news_public_image_url((string) $imagePath) : '';

        echo json_encode([
            'ok' => true,
            'data' => [
                'newsId' => (int) ($row['news_id'] ?? 0),
                'title' => (string) ($row['title'] ?? ''),
                'body' => (string) ($row['body'] ?? ''),
                'imageUrl' => (string) $imageUrl,
                'createdAt' => (string) ($row['created_at'] ?? ''),
                'articleUrl' => '',
                'sourceName' => 'FireNet',

                // Extra fields used by login announcements renderer
                'isAnnouncement' => $isAnnouncement,
                'announcementType' => (string) ($row['announcement_type'] ?? ''),
                'audience' => (string) ($row['audience'] ?? ''),
                'expiresAt' => $row['expires_at'] ?? null
            ]
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'announcements_list') {
        // Public announcements (approved + non-expired)
        $limit = (int) ($_GET['limit'] ?? 4);
        if ($limit < 1) $limit = 4;
        if ($limit > 10) $limit = 10;

        $stmt = $pdo->prepare('
            SELECT news_id, title, body, image_path, created_at, announcement_type, audience, expires_at
            FROM news_feed
            WHERE status = "approved"
              AND COALESCE(is_announcement, 0) = 1
              AND (expires_at IS NULL OR expires_at = "" OR expires_at >= CURDATE())
            ORDER BY created_at DESC, news_id DESC
            LIMIT ?
        ');
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $items = array_map(static function (array $row): array {
            $imagePath = $row['image_path'] ?? null;
            $imageUrl = $imagePath ? firenet_news_public_image_url((string) $imagePath) : '';
            return [
                'newsId' => (int) ($row['news_id'] ?? 0),
                'title' => (string) ($row['title'] ?? ''),
                'body' => (string) ($row['body'] ?? ''),
                'imageUrl' => (string) $imageUrl,
                'createdAt' => (string) ($row['created_at'] ?? ''),
                'announcementType' => (string) ($row['announcement_type'] ?? ''),
                'audience' => (string) ($row['audience'] ?? ''),
                'expiresAt' => $row['expires_at'] ?? null
            ];
        }, $rows);

        echo json_encode([
            'ok' => true,
            'data' => ['items' => $items]
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'announcements_get') {
        $newsId = (int) ($_GET['newsId'] ?? 0);
        if ($newsId <= 0) {
            firenet_news_fail('Invalid newsId.', 422);
        }

        $stmt = $pdo->prepare('
            SELECT news_id, title, body, image_path, created_at, announcement_type, audience, expires_at
            FROM news_feed
            WHERE status = "approved"
              AND COALESCE(is_announcement, 0) = 1
              AND news_id = ?
              AND (expires_at IS NULL OR expires_at = "" OR expires_at >= CURDATE())
            LIMIT 1
        ');
        $stmt->execute([$newsId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            firenet_news_fail('Announcement not found.', 404);
        }

        $imagePath = $row['image_path'] ?? null;
        $imageUrl = $imagePath ? firenet_news_public_image_url((string) $imagePath) : '';

        echo json_encode([
            'ok' => true,
            'data' => [
                'newsId' => (int) ($row['news_id'] ?? 0),
                'title' => (string) ($row['title'] ?? ''),
                'body' => (string) ($row['body'] ?? ''),
                'imageUrl' => (string) $imageUrl,
                'createdAt' => (string) ($row['created_at'] ?? ''),
                'announcementType' => (string) ($row['announcement_type'] ?? ''),
                'audience' => (string) ($row['audience'] ?? ''),
                'expiresAt' => $row['expires_at'] ?? null
            ]
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'create') {
        if (!firenet_news_is_admin()) {
            firenet_news_fail('Only administrators can publish news.', 403);
        }

        $title = (string) ($_POST['title'] ?? '');
        $body = (string) ($_POST['body'] ?? '');

        [$title, $body] = firenet_news_validate_text($title, $body);
        $imagePath = firenet_news_handle_upload();

        $status = (string) ($_POST['status'] ?? 'approved');
        $status = strtolower(trim($status));
        if (!in_array($status, ['approved', 'draft'], true)) {
            $status = 'approved';
        }

        $stmt = $pdo->prepare('
            INSERT INTO news_feed (title, body, image_path, status)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([$title, $body, $imagePath, $status]);

        $newId = (int) $pdo->lastInsertId();
        echo json_encode([
            'ok' => true,
            'message' => 'News published successfully.',
            'data' => [
                'newsId' => $newId
            ]
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'create_announcement') {
        if (!firenet_news_is_admin()) {
            firenet_news_fail('Only administrators can publish announcements.', 403);
        }

        $title = (string) ($_POST['title'] ?? '');
        $body = (string) ($_POST['body'] ?? '');

        [$title, $body] = firenet_news_validate_text($title, $body);
        $imagePath = firenet_news_handle_upload();

        $announcementType = (string) ($_POST['announcementType'] ?? 'PUBLIC NOTICE');
        $announcementType = trim($announcementType);
        if ($announcementType === '') $announcementType = 'PUBLIC NOTICE';

        $audience = (string) ($_POST['audience'] ?? 'PUBLIC');
        $audience = trim($audience);
        if ($audience === '') $audience = 'PUBLIC';

        $expiresAtRaw = (string) ($_POST['expiresAt'] ?? '');
        $expiresAt = null;
        if ($expiresAtRaw !== '') {
            // Expect YYYY-MM-DD from HTML date input
            $d = date_create($expiresAtRaw);
            if ($d) {
                $expiresAt = $d->format('Y-m-d');
            }
        }

        $status = (string) ($_POST['status'] ?? 'approved');
        $status = strtolower(trim($status));
        if (!in_array($status, ['approved', 'draft'], true)) {
            $status = 'approved';
        }

        $stmt = $pdo->prepare('
            INSERT INTO news_feed (title, body, image_path, status, is_announcement, announcement_type, audience, expires_at)
            VALUES (?, ?, ?, ?, 1, ?, ?, ?)
        ');
        $stmt->execute([$title, $body, $imagePath, $status, $announcementType, $audience, $expiresAt]);

        $newId = (int) $pdo->lastInsertId();
        echo json_encode([
            'ok' => true,
            'message' => 'Announcement published successfully.',
            'data' => ['newsId' => $newId]
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    firenet_news_fail('Unsupported action.', 405);
} catch (Throwable $e) {
    firenet_news_fail('News service unavailable.', 500);
}

?>
