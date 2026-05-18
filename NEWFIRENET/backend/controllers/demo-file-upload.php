<?php
/**
 * Demo File Upload - Store actual images for the demo file picker
 */

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();
firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
$stationId = (int) ($_SESSION['user']['station_id'] ?? 0);

if ($userId < 1 || $stationId < 1) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    if (empty($_FILES['file'])) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'No file uploaded']);
        exit;
    }

    $pdo = firenet_get_pdo();

    // Get station code
    $stmt = $pdo->prepare('SELECT station_code FROM stations WHERE station_id = ? LIMIT 1');
    $stmt->execute([$stationId]);
    $stationCode = (string) ($stmt->fetchColumn() ?: 'station_' . $stationId);

    // Create demo files directory
    $demoDir = __DIR__ . '/../../uploads/demo_files/' . $stationCode;
    if (!is_dir($demoDir)) {
        mkdir($demoDir, 0755, true);
    }

    // Validate and save file
    $file = $_FILES['file'];
    $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/vnd.ms-excel', 'text/plain'];

    if (!in_array($file['type'], $allowedMimes)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'File type not allowed']);
        exit;
    }

    if ($file['size'] > 10485760) { // 10MB
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'File too large (max 10MB)']);
        exit;
    }

    // Generate filename
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = preg_replace('/[^a-z0-9_-]/i', '_', pathinfo($file['name'], PATHINFO_FILENAME)) . '_' . time() . '.' . $ext;
    $filePath = $demoDir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Failed to save file']);
        exit;
    }

    // Create table if needed
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS demo_cloudinary_files (
            file_id INT PRIMARY KEY AUTO_INCREMENT,
            station_id INT NOT NULL,
            folder_name VARCHAR(255) NOT NULL,
            filename VARCHAR(255) NOT NULL,
            public_id VARCHAR(255) NOT NULL UNIQUE,
            secure_url VARCHAR(500) NOT NULL,
            file_type VARCHAR(50),
            resource_type VARCHAR(50) DEFAULT "image",
            bytes INT DEFAULT 0,
            format VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_demo_cloudinary_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
            INDEX idx_demo_cloudinary_station (station_id),
            INDEX idx_demo_cloudinary_folder (station_id, folder_name)
        )
    ');

    // Store in database
    $folder = 'firenet/orgmail/' . $stationCode;
    $publicId = $folder . '/' . str_replace('.' . $ext, '', $filename);
    $secureUrl = '/firenet/NEWFIRENET/uploads/demo_files/' . $stationCode . '/' . $filename;

    $insertStmt = $pdo->prepare('
        INSERT INTO demo_cloudinary_files
        (station_id, folder_name, filename, public_id, secure_url, format, resource_type, bytes, file_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');

    $resourceType = strpos($file['type'], 'image') !== false ? 'image' : 'raw';
    $insertStmt->execute([
        $stationId,
        $folder,
        $file['name'],
        $publicId,
        $secureUrl,
        $ext,
        $resourceType,
        $file['size'],
        $file['type']
    ]);

    http_response_code(200);
    echo json_encode([
        'ok' => true,
        'message' => 'File uploaded successfully',
        'file' => [
            'file_id' => $pdo->lastInsertId(),
            'filename' => $file['name'],
            'public_id' => $publicId,
            'url' => $secureUrl,
            'resource_type' => $resourceType,
            'bytes' => $file['size']
        ]
    ]);
    exit;

} catch (Exception $e) {
    error_log('Demo file upload error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Server error: ' . $e->getMessage()]);
    exit;
}
