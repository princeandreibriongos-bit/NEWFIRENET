<?php
/**
 * File Request Cloudinary upload endpoint
 * Automatically uploads response files to Cloudinary
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
    $config = require __DIR__ . '/../../config/config.php';
    $cloudinary = $config['cloudinary'] ?? [];

    if (!($cloudinary['enabled'] ?? false)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Cloudinary is not enabled']);
        exit;
    }

    $cloudName = $cloudinary['cloud_name'] ?? '';
    $apiKey = $cloudinary['api_key'] ?? '';
    $apiSecret = $cloudinary['api_secret'] ?? '';

    if (!$cloudName || !$apiKey || !$apiSecret) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Cloudinary credentials are missing']);
        exit;
    }

    $fileId = (int) ($_POST['fileId'] ?? 0);
    $routeId = (int) ($_POST['routeId'] ?? 0);

    if ($fileId < 1 || $routeId < 1) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Missing file ID or route ID']);
        exit;
    }

    $pdo = firenet_get_pdo();

    // Get route details
    $routeStmt = $pdo->prepare('
        SELECT r.*, s.station_name
        FROM file_request_routes r
        LEFT JOIN stations s ON s.station_id = r.origin_station_id
        WHERE r.route_id = ? AND (r.origin_station_id = ? OR r.target_station_id = ? OR r.request_user_id = ?)
        LIMIT 1
    ');
    $routeStmt->execute([$routeId, $stationId, $stationId, $userId]);
    $route = $routeStmt->fetch(PDO::FETCH_ASSOC);

    if (!$route) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'message' => 'Route not found or access denied']);
        exit;
    }

    // Get file details
    $fileStmt = $pdo->prepare('
        SELECT * FROM file_request_files
        WHERE file_id = ? AND route_id = ?
        LIMIT 1
    ');
    $fileStmt->execute([$fileId, $routeId]);
    $file = $fileStmt->fetch(PDO::FETCH_ASSOC);

    if (!$file) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'message' => 'File not found']);
        exit;
    }

    $filePath = $file['file_path'];
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'message' => 'File does not exist on disk']);
        exit;
    }

    // Prepare upload to Cloudinary
    $stationName = $route['station_name'] ?? 'Station-' . $route['origin_station_id'];
    $folderPath = 'firenet/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $stationName);
    $publicId = 'filereq_' . $routeId . '_' . $fileId . '_' . time();

    // Upload via Cloudinary API
    $ch = curl_init();

    $postData = [
        'file' => new CURLFile($filePath, $file['mime_type'], $file['original_file_name']),
        'public_id' => $publicId,
        'folder' => $folderPath,
        'resource_type' => 'auto',
        'tags' => $stationName . ',file_request,route_' . $routeId,
        'context' => 'routeId=' . $routeId . '|fileId=' . $fileId . '|station=' . urlencode($stationName)
    ];

    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://api.cloudinary.com/v1_1/' . $cloudName . '/auto/upload',
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postData,
        CURLOPT_USERPWD => $apiKey . ':' . $apiSecret,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json'
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Upload failed: ' . $curlError]);
        exit;
    }

    $result = json_decode($response, true);

    if ($httpCode !== 200 || !$result) {
        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'message' => 'Cloudinary upload failed',
            'details' => $result['error'] ?? 'Unknown error'
        ]);
        exit;
    }

    // Store Cloudinary URL in database
    $cloudinaryUrl = $result['secure_url'] ?? $result['url'] ?? '';
    $updateStmt = $pdo->prepare('
        UPDATE file_request_files
        SET cloudinary_url = ?, cloudinary_public_id = ?
        WHERE file_id = ?
    ');
    $updateStmt->execute([$cloudinaryUrl, $result['public_id'] ?? '', $fileId]);

    // Success
    echo json_encode([
        'ok' => true,
        'message' => 'File uploaded to Cloudinary',
        'data' => [
            'public_id' => $result['public_id'] ?? '',
            'url' => $cloudinaryUrl,
            'fileName' => $file['original_file_name'],
            'size' => $result['bytes'] ?? 0
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
