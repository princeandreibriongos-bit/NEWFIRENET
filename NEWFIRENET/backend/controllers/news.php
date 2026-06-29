<?php
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
    $pdo->exec('CREATE TABLE IF NOT EXISTS news_feed (
        news_id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(160) NOT NULL,
        body TEXT NOT NULL,
        image_path TEXT NULL,
        status VARCHAR(16) NOT NULL DEFAULT "approved",
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )');
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
            WHERE status = "approved"
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
                'createdAt' => (string) ($row['created_at'] ?? '')
            ];
        }, $rows);

        echo json_encode([
            'ok' => true,
            'data' => [
                'items' => $items
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

    firenet_news_fail('Unsupported action.', 405);
} catch (Throwable $e) {
    firenet_news_fail('News service unavailable.', 500);
}
?>
