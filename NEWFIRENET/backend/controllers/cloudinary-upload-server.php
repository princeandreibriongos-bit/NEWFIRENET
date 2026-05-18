<?php
/**
 * Server-side Cloudinary upload endpoint for incident reports
 * Automatically generates PDF and uploads to Cloudinary
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

    // Get report ID
    $reportId = (int) ($_POST['reportId'] ?? 0);

    if ($reportId < 1) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Missing report ID']);
        exit;
    }

    // Verify report exists and user has access
    $pdo = firenet_get_pdo();
    $stmt = $pdo->prepare('
        SELECT r.report_id, r.title, r.description, r.created_at, r.updated_at,
               u.username, s.station_name, s.station_id
        FROM reports r
        LEFT JOIN users u ON u.user_id = r.created_by
        LEFT JOIN stations s ON s.station_id = r.station_id
        WHERE r.report_id = ? AND (r.station_id = ? OR r.created_by = ?)
        LIMIT 1
    ');
    $stmt->execute([$reportId, $stationId, $userId]);
    $report = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$report) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'message' => 'Report not found or access denied']);
        exit;
    }

    // Create temporary PDF file
    $tempDir = sys_get_temp_dir();
    $tempPdfPath = $tempDir . DIRECTORY_SEPARATOR . 'report_' . $reportId . '_' . time() . '.pdf';

    // Generate simple PDF content (basic text-based PDF)
    $pdfContent = generateSimplePDF($report);
    file_put_contents($tempPdfPath, $pdfContent);

    if (!file_exists($tempPdfPath)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Failed to generate PDF']);
        exit;
    }

    // Prepare upload to Cloudinary
    $stationName = $report['station_name'] ?? 'Station-' . $report['station_id'];
    $folderPath = 'firenet/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $stationName);
    $publicId = 'report_' . $reportId . '_' . time();
    $fileName = 'firenet_report_' . $reportId . '.pdf';

    // Upload via Cloudinary API
    $ch = curl_init();

    $postData = [
        'file' => new CURLFile($tempPdfPath, 'application/pdf', $fileName),
        'public_id' => $publicId,
        'folder' => $folderPath,
        'resource_type' => 'auto',
        'tags' => $stationName . ',incident_report,report_' . $reportId,
        'context' => 'reportId=' . $reportId . '|station=' . urlencode($stationName) . '|title=' . urlencode($report['title'])
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

    // Clean up temp file
    if (file_exists($tempPdfPath)) {
        unlink($tempPdfPath);
    }

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

    // Success
    echo json_encode([
        'ok' => true,
        'message' => 'Report uploaded to Cloudinary',
        'data' => [
            'public_id' => $result['public_id'] ?? '',
            'url' => $result['secure_url'] ?? $result['url'] ?? '',
            'fileName' => $fileName,
            'size' => $result['bytes'] ?? 0
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

function generateSimplePDF($report) {
    $pdf = '%PDF-1.4' . "\n";
    $pdf .= '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj' . "\n";
    $pdf .= '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj' . "\n";
    $pdf .= '3 0 obj<</Type/Page/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/MediaBox[0 0 612 792]/Contents 5 0 R>>endobj' . "\n";
    $pdf .= '4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj' . "\n";

    $title = $report['title'] ?? 'Report';
    $createdAt = $report['created_at'] ?? '';
    $station = $report['station_name'] ?? 'Station';
    $createdBy = $report['username'] ?? 'User';
    $description = substr($report['description'] ?? '', 0, 500);

    $content = "FireNet Report\n\n";
    $content .= "Report ID: " . $report['report_id'] . "\n";
    $content .= "Title: " . $title . "\n";
    $content .= "Station: " . $station . "\n";
    $content .= "Created By: " . $createdBy . "\n";
    $content .= "Created: " . $createdAt . "\n\n";
    $content .= "Description:\n" . $description;

    $pdf .= '5 0 obj<</Length ' . strlen($content) . '>>stream' . "\n";
    $pdf .= 'BT /F1 12 Tf 50 750 Td (' . addcslashes($content, '()\\') . ') Tj ET' . "\n";
    $pdf .= 'endstream endobj' . "\n";
    $pdf .= 'xref 0 6' . "\n";
    $pdf .= '0000000000 65535 f' . "\n";
    $pdf .= '0000000009 00000 n' . "\n";
    $pdf .= '0000000058 00000 n' . "\n";
    $pdf .= '0000000115 00000 n' . "\n";
    $pdf .= '0000000265 00000 n' . "\n";
    $pdf .= '0000000341 00000 n' . "\n";
    $pdf .= 'trailer<</Size 6/Root 1 0 R>>' . "\n";
    $pdf .= 'startxref' . "\n";
    $pdf .= strlen($pdf) . "\n";
    $pdf .= '%%EOF';

    return $pdf;
}

