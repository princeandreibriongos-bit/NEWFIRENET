<?php
/**
 * Cloudinary File Browser API (Demo Mode)
 *
 * In demo mode, returns files from database instead of real Cloudinary API
 */

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/r2_storage.php';

firenet_require_login();
firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

$sessionUser = $_SESSION['user'] ?? [];
$currentUserId = (int) ($sessionUser['user_id'] ?? 0);
$currentStationId = (int) ($sessionUser['station_id'] ?? 0);
$action = strtolower(trim((string) ($_GET['action'] ?? $_POST['action'] ?? 'list')));

if ($currentUserId < 1 || $currentStationId < 1) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Invalid browser context']);
    exit;
}

if (firenet_r2_enabled() && $action === 'list') {
    try {
        $pdo = firenet_get_pdo();
        $client = FirenetR2Client::fromConfig();
        $area = strtolower(trim((string) ($_GET['area'] ?? 'orgmail')));
        if (!in_array($area, ['reports', 'orgmail'], true)) {
            $area = 'orgmail';
        }
        $prefix = firenet_r2_list_prefix_for_station($pdo, $currentStationId, $area);
        $files = firenet_r2_map_list_for_browser($client->listObjects($prefix));

        $incidentStmt = $pdo->prepare('
            SELECT
                r.report_id,
                COALESCE(NULLIF(r.title, ""), NULLIF(i.incident_location, ""), "Untitled Incident") AS incident_title,
                r.created_at,
                i.incident_status,
                (SELECT COUNT(*) FROM report_attachments ra WHERE ra.report_id = r.report_id) AS attachment_count
            FROM reports r
            LEFT JOIN incident_reports i ON i.report_id = r.report_id
            WHERE r.station_id = ?
                AND EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = "incident_report")
            ORDER BY r.created_at DESC
            LIMIT 500
        ');
        $incidentStmt->execute([$currentStationId]);
        $incidents = $incidentStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        foreach ($incidents as $incident) {
            $reportId = (int) ($incident['report_id'] ?? 0);
            $title = (string) ($incident['incident_title'] ?? 'Untitled Incident');
            $status = (string) ($incident['incident_status'] ?? 'newly_reported');
            $attachmentCount = (int) ($incident['attachment_count'] ?? 0);

            $files[] = [
                'file_id' => $reportId,
                'public_id' => 'incident_report_' . $reportId,
                'filename' => $title,
                'url' => '/firenet/NEWFIRENET/backend/controllers/incident_report_view.php?report_id=' . $reportId,
                'type' => 'incident',
                'resource_type' => 'incident',
                'bytes' => 0,
                'created_at' => $incident['created_at'] ?? '',
                'format' => 'incident',
                'status' => $status,
                'attachment_count' => $attachmentCount,
            ];
        }

        echo json_encode([
            'ok' => true,
            'folder' => $prefix,
            'files' => $files,
            'count' => count($files),
            'storage' => 'r2',
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => $e->getMessage()]);
        exit;
    }
}

// Prefer R2 for cloud browse. If R2 is not configured, do not fall back to fake demo files
// (that made orgmail look populated while Logs correctly said cloud was off).
if ($action === 'list') {
    $r2 = firenet_r2_config();
    $missing = [];
    if (empty($r2['enabled'])) {
        $missing[] = 'FIRENET_R2_ENABLED';
    }
    foreach (['account_id' => 'FIRENET_R2_ACCOUNT_ID', 'access_key_id' => 'FIRENET_R2_ACCESS_KEY_ID', 'secret_access_key' => 'FIRENET_R2_SECRET_ACCESS_KEY', 'bucket' => 'FIRENET_R2_BUCKET'] as $field => $envName) {
        if (trim((string) ($r2[$field] ?? '')) === '') {
            $missing[] = $envName;
        }
    }

    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'message' => 'Cloud storage (R2) is not configured on this server.'
            . ($missing !== [] ? (' Missing: ' . implode(', ', $missing) . '.') : ''),
        'folder' => '',
        'files' => [],
        'storage' => 'none',
        'data' => [
            'missing' => $missing,
            'hint' => 'Set Vercel Environment Variables, ensure env_overrides.php is deployed, then redeploy. Fire-out PDFs sync under firenet/reports/, not firenet/orgmail/.',
        ],
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = firenet_get_pdo();

    // Create demo table if it doesn't exist
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

    // Auto-populate demo data if table is empty or missing data for this station
    $checkStmt = $pdo->prepare('SELECT COUNT(*) FROM demo_cloudinary_files WHERE station_id = ?');
    $checkStmt->execute([$currentStationId]);
    if ($checkStmt->fetchColumn() == 0) {
        // Get station info
        $stationStmt = $pdo->prepare('SELECT station_id, station_code FROM stations WHERE station_id = ? LIMIT 1');
        $stationStmt->execute([$currentStationId]);
        $station = $stationStmt->fetch(PDO::FETCH_ASSOC);

        if ($station) {
            $stationCode = $station['station_code'];
            $folder = 'firenet/orgmail/' . $stationCode;

            // Create demo files for this station
            $demoFiles = [
                ['incident_report_001.pdf', 'pdf', 'raw', 245000, 'pdf'],
                ['station_photo.jpg', 'jpg', 'image', 512000, 'jpg'],
                ['equipment_inventory.xlsx', 'xlsx', 'raw', 128000, 'xlsx'],
                ['incident_scene_01.jpg', 'jpg', 'image', 892000, 'jpg'],
                ['incident_scene_02.jpg', 'jpg', 'image', 756000, 'jpg'],
                ['dispatch_log.txt', 'txt', 'raw', 45000, 'txt'],
            ];

            $insertStmt = $pdo->prepare('
                INSERT IGNORE INTO demo_cloudinary_files
                (station_id, folder_name, filename, public_id, secure_url, format, resource_type, bytes, file_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');

            foreach ($demoFiles as $file) {
                $filename = $file[0];
                $format = $file[1];
                $resourceType = $file[2];
                $bytes = $file[3];
                $fileType = $file[4];
                $publicId = $folder . '/' . str_replace('.', '_', substr($filename, 0, -4));
                $secureUrl = 'https://res.cloudinary.com/dq80tx04u/image/upload/v1/' . $publicId . '.' . $format;

                $insertStmt->execute([
                    $currentStationId,
                    $folder,
                    $filename,
                    $publicId,
                    $secureUrl,
                    $format,
                    $resourceType,
                    $bytes,
                    $fileType
                ]);
            }
        }
    }

    // Get station code for folder path
    $stmt = $pdo->prepare('SELECT station_code FROM stations WHERE station_id = ? LIMIT 1');
    $stmt->execute([$currentStationId]);
    $stationCode = (string) ($stmt->fetchColumn() ?: 'station_' . $currentStationId);
    $stationFolder = 'firenet/orgmail/' . $stationCode;

    // ACTION: List files from station folder
    if ($action === 'list') {
        $stmt = $pdo->prepare('
            SELECT file_id, filename, public_id, secure_url, resource_type, bytes, format, created_at
            FROM demo_cloudinary_files
            WHERE station_id = ? AND folder_name = ?
            ORDER BY created_at DESC
            LIMIT 500
        ');
        $stmt->execute([$currentStationId, $stationFolder]);
        $resources = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $files = [];
        foreach ($resources as $resource) {
            $files[] = [
                'file_id' => $resource['file_id'],
                'public_id' => $resource['public_id'] ?? '',
                'filename' => $resource['filename'] ?? '',
                'url' => $resource['secure_url'] ?? '',
                'type' => 'file',
                'resource_type' => $resource['resource_type'] ?? 'image',
                'bytes' => (int) ($resource['bytes'] ?? 0),
                'created_at' => $resource['created_at'] ?? '',
                'format' => $resource['format'] ?? ''
            ];
        }

        // Add incident reports from current station
        $incidentStmt = $pdo->prepare('
            SELECT
                r.report_id,
                COALESCE(NULLIF(r.title, ""), NULLIF(i.incident_location, ""), "Untitled Incident") AS incident_title,
                r.created_at,
                i.incident_status,
                (SELECT COUNT(*) FROM report_attachments ra WHERE ra.report_id = r.report_id) AS attachment_count
            FROM reports r
            LEFT JOIN incident_reports i ON i.report_id = r.report_id
            WHERE r.station_id = ?
                AND EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = "incident_report")
            ORDER BY r.created_at DESC
            LIMIT 500
        ');
        $incidentStmt->execute([$currentStationId]);
        $incidents = $incidentStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        foreach ($incidents as $incident) {
            $reportId = (int) ($incident['report_id'] ?? 0);
            $title = (string) ($incident['incident_title'] ?? 'Untitled Incident');
            $status = (string) ($incident['incident_status'] ?? 'newly_reported');
            $attachmentCount = (int) ($incident['attachment_count'] ?? 0);

            $files[] = [
                'file_id' => $reportId,
                'public_id' => 'incident_report_' . $reportId,
                'filename' => $title,
                'url' => '/firenet/NEWFIRENET/backend/controllers/incident_report_view.php?report_id=' . $reportId,
                'type' => 'incident',
                'resource_type' => 'incident',
                'bytes' => 0,
                'created_at' => $incident['created_at'] ?? '',
                'format' => 'incident',
                'status' => $status,
                'attachment_count' => $attachmentCount
            ];
        }

        http_response_code(200);
        echo json_encode([
            'ok' => true,
            'folder' => $stationFolder,
            'files' => $files,
            'count' => count($files),
            'cloud_name' => 'demo',
            'demo_mode' => true
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Unknown action: ' . $action]);
    exit;

} catch (Exception $e) {
    error_log('Demo file browser error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Server error: ' . $e->getMessage()]);
    exit;
}


