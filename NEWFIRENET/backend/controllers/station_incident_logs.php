<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

const FIRENET_INCIDENT_UPLOAD_DIR = __DIR__ . '/../../uploads/incidents';
const FIRENET_INCIDENT_UPLOAD_WEB_PREFIX = '/firenet/NEWFIRENET/uploads/incidents/';

firenet_require_login();
firenet_start_session();

$user = $_SESSION['user'] ?? [];
$stationId = (int) ($user['station_id'] ?? 0);
$userId = (int) ($user['user_id'] ?? 0);
if ($stationId < 1) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'message' => 'Invalid station context']);
    exit;
}

$sort = strtolower(trim((string) ($_GET['sort'] ?? 'date')));
$dir = strtolower(trim((string) ($_GET['dir'] ?? 'desc')));
$action = strtolower(trim((string) ($_GET['action'] ?? $_POST['action'] ?? '')));
$format = strtolower(trim((string) ($_GET['format'] ?? 'json')));

$sortMap = [
    'date' => 'event_time',
    'name' => 'incident_title',
    'submitted_by' => 'submitted_by',
    'alarm' => 'alarm_level',
    'stage' => 'stage_code',
    'status' => 'incident_status',
    'report_id' => 'report_id'
];

$sortColumn = $sortMap[$sort] ?? $sortMap['date'];
$sortDirection = $dir === 'asc' ? 'ASC' : 'DESC';

function firenet_station_logs_fail(string $message, int $status = 400, array $extra = []): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['ok' => false, 'message' => $message], $extra));
    exit;
}

function firenet_station_logs_app_config(): array
{
    $configFile = __DIR__ . '/../../config/config.php';
    if (!is_file($configFile)) {
        return [];
    }

    $loaded = require $configFile;
    return is_array($loaded) ? $loaded : [];
}

function firenet_station_logs_cloudinary_config(array $appConfig): array
{
    $cloudinary = $appConfig['cloudinary'] ?? [];
    return is_array($cloudinary) ? $cloudinary : [];
}

function firenet_station_logs_cloudinary_missing(array $cloudinary): array
{
    $missing = [];
    $enabled = !empty($cloudinary['enabled']);
    $cloudName = trim((string) ($cloudinary['cloud_name'] ?? ''));
    $uploadPreset = trim((string) ($cloudinary['upload_preset'] ?? ''));
    $apiKey = trim((string) ($cloudinary['api_key'] ?? ''));
    $apiSecret = trim((string) ($cloudinary['api_secret'] ?? ''));

    if (!$enabled) {
        $missing[] = 'cloudinary.enabled';
    }

    if ($cloudName === '' || strpos($cloudName, 'YOUR_') === 0) {
        $missing[] = 'cloudinary.cloud_name';
    }

    $unsignedReady = $uploadPreset !== '' && strpos($uploadPreset, 'YOUR_') !== 0;
    $signedReady = $apiKey !== '' && $apiSecret !== '' && strpos($apiKey, 'YOUR_') !== 0 && strpos($apiSecret, 'YOUR_') !== 0;
    if (!$unsignedReady && !$signedReady) {
        $missing[] = 'cloudinary.upload_preset or cloudinary.api_key+api_secret';
    }

    return $missing;
}

function firenet_station_logs_attachment_url(string $path): string
{
    $normalized = str_replace('\\', '/', trim($path));
    if ($normalized === '') {
        return '';
    }

    if (preg_match('/^https?:\/\//i', $normalized)) {
        return $normalized;
    }

    if (strpos($normalized, '/firenet/NEWFIRENET/uploads/incidents/') === 0) {
        return $normalized;
    }

    if (strpos($normalized, 'uploads/incidents/') === 0) {
        return '/firenet/NEWFIRENET/' . $normalized;
    }

    return FIRENET_INCIDENT_UPLOAD_WEB_PREFIX . basename($normalized);
}

function firenet_station_logs_upload_local(array $file): array
{
    $tmpName = (string) ($file['tmp_name'] ?? '');
    if ($tmpName === '' || !is_uploaded_file($tmpName)) {
        firenet_station_logs_fail('Invalid uploaded file.', 422);
    }

    $originalName = trim((string) ($file['name'] ?? 'incident-attachment'));
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if ($extension === '') {
        $extension = 'bin';
    }

    if (!is_dir(FIRENET_INCIDENT_UPLOAD_DIR) && !mkdir(FIRENET_INCIDENT_UPLOAD_DIR, 0775, true)) {
        firenet_station_logs_fail('Unable to prepare incident upload directory.', 500);
    }

    $storedFileName = 'incident-' . date('YmdHis') . '-' . bin2hex(random_bytes(6)) . '.' . $extension;
    $storedPath = FIRENET_INCIDENT_UPLOAD_DIR . '/' . $storedFileName;

    if (!move_uploaded_file($tmpName, $storedPath)) {
        firenet_station_logs_fail('Unable to save incident attachment.', 500);
    }

    return [
        'fileName' => $originalName,
        'fileType' => (string) ($file['type'] ?? 'application/octet-stream'),
        'fileSize' => (int) ($file['size'] ?? 0),
        'filePath' => 'uploads/incidents/' . $storedFileName,
        'storage' => 'local'
    ];
}

function firenet_station_logs_cloudinary_signature(array $params, string $apiSecret): string
{
    ksort($params);
    $pairs = [];
    foreach ($params as $key => $value) {
        $pairs[] = $key . '=' . $value;
    }
    return sha1(implode('&', $pairs) . $apiSecret);
}

function firenet_station_logs_upload_cloudinary(array $file, array $cloudinary): array
{
    if (!function_exists('curl_init')) {
        firenet_station_logs_fail('Cloudinary upload requires PHP cURL extension.', 500);
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    if ($tmpName === '' || !is_uploaded_file($tmpName)) {
        firenet_station_logs_fail('Invalid uploaded file.', 422);
    }

    $cloudName = trim((string) ($cloudinary['cloud_name'] ?? ''));
    $uploadPreset = trim((string) ($cloudinary['upload_preset'] ?? ''));
    $apiKey = trim((string) ($cloudinary['api_key'] ?? ''));
    $apiSecret = trim((string) ($cloudinary['api_secret'] ?? ''));
    $folder = trim((string) ($cloudinary['folder'] ?? 'firenet/incidents'));

    $endpoint = 'https://api.cloudinary.com/v1_1/' . rawurlencode($cloudName) . '/auto/upload';

    $postFields = [
        'file' => new CURLFile($tmpName)
    ];

    if ($folder !== '') {
        $postFields['folder'] = $folder;
    }

    if ($uploadPreset !== '' && strpos($uploadPreset, 'YOUR_') !== 0) {
        $postFields['upload_preset'] = $uploadPreset;
    } else {
        $timestamp = time();
        $signParams = ['timestamp' => $timestamp];
        if ($folder !== '') {
            $signParams['folder'] = $folder;
        }

        $postFields['api_key'] = $apiKey;
        $postFields['timestamp'] = $timestamp;
        $postFields['signature'] = firenet_station_logs_cloudinary_signature($signParams, $apiSecret);
    }

    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if (!is_string($response) || $response === '') {
        firenet_station_logs_fail('No response from Cloudinary upload service.', 502);
    }

    $payload = json_decode($response, true);
    if (!is_array($payload)) {
        firenet_station_logs_fail('Invalid response from Cloudinary upload service.', 502);
    }

    if ($httpCode >= 400 || !empty($payload['error'])) {
        $errorMessage = is_array($payload['error'] ?? null)
            ? (string) ($payload['error']['message'] ?? 'Cloudinary upload failed.')
            : ((string) $curlError !== '' ? (string) $curlError : 'Cloudinary upload failed.');
        firenet_station_logs_fail($errorMessage, 422);
    }

    $secureUrl = trim((string) ($payload['secure_url'] ?? ''));
    if ($secureUrl === '') {
        firenet_station_logs_fail('Cloudinary upload did not return a file URL.', 502);
    }

    return [
        'fileName' => trim((string) ($file['name'] ?? 'incident-attachment')),
        'fileType' => (string) ($payload['resource_type'] ?? 'raw'),
        'fileSize' => (int) ($payload['bytes'] ?? ($file['size'] ?? 0)),
        'filePath' => $secureUrl,
        'storage' => 'cloudinary'
    ];
}

try {
    $pdo = firenet_get_pdo();

    if ($action === 'upload_attachment') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            firenet_station_logs_fail('Method not allowed', 405);
        }

        $reportId = (int) ($_POST['reportId'] ?? 0);
        if ($reportId < 1) {
            firenet_station_logs_fail('Please choose a valid incident report.', 422);
        }

        if (empty($_FILES['incidentFile']) || !is_array($_FILES['incidentFile'])) {
            firenet_station_logs_fail('Please choose a file to upload.', 422);
        }

        $file = $_FILES['incidentFile'];
        $errorCode = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($errorCode === UPLOAD_ERR_NO_FILE) {
            firenet_station_logs_fail('Please choose a file to upload.', 422);
        }
        if ($errorCode !== UPLOAD_ERR_OK) {
            firenet_station_logs_fail('File upload failed. Please try again.', 422);
        }

        $reportStmt = $pdo->prepare('SELECT r.report_id FROM reports r WHERE r.report_id = ? AND r.station_id = ? AND EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = "incident_report") LIMIT 1');
        $reportStmt->execute([$reportId, $stationId]);
        if ((int) ($reportStmt->fetchColumn() ?: 0) < 1) {
            firenet_station_logs_fail('Selected report does not belong to this station.', 403);
        }

        $storage = strtolower(trim((string) ($_POST['storage'] ?? 'local')));
        if (!in_array($storage, ['local', 'cloudinary'], true)) {
            $storage = 'local';
        }

        $saved = [];
        if ($storage === 'cloudinary') {
            $appConfig = firenet_station_logs_app_config();
            $cloudinary = firenet_station_logs_cloudinary_config($appConfig);
            $missing = firenet_station_logs_cloudinary_missing($cloudinary);
            if (!empty($missing)) {
                firenet_station_logs_fail(
                    'Cloudinary is not configured. Missing: ' . implode(', ', $missing),
                    422,
                    ['missing' => $missing]
                );
            }

            $saved = firenet_station_logs_upload_cloudinary($file, $cloudinary);
        } else {
            $saved = firenet_station_logs_upload_local($file);
        }

        $insertStmt = $pdo->prepare('INSERT INTO report_attachments (report_id, file_name, file_type, file_size, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)');
        $insertStmt->execute([
            $reportId,
            (string) ($saved['fileName'] ?? 'attachment'),
            (string) ($saved['fileType'] ?? 'application/octet-stream'),
            (int) ($saved['fileSize'] ?? 0),
            (string) ($saved['filePath'] ?? ''),
            $userId > 0 ? $userId : null
        ]);

        $attachmentId = (int) $pdo->lastInsertId();
        $url = firenet_station_logs_attachment_url((string) ($saved['filePath'] ?? ''));

        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok' => true,
            'message' => 'Incident attachment uploaded to ' . ($saved['storage'] ?? 'local') . '.',
            'attachment' => [
                'attachmentId' => $attachmentId,
                'reportId' => $reportId,
                'fileName' => (string) ($saved['fileName'] ?? 'attachment'),
                'filePath' => (string) ($saved['filePath'] ?? ''),
                'url' => $url,
                'storage' => (string) ($saved['storage'] ?? 'local')
            ]
        ]);
        exit;
    }

    $appConfig = firenet_station_logs_app_config();
    $cloudinaryConfig = firenet_station_logs_cloudinary_config($appConfig);
    $cloudinaryMissing = firenet_station_logs_cloudinary_missing($cloudinaryConfig);

    $sql = <<<SQL
        SELECT
            r.report_id,
            r.station_id AS report_station_id,
            COALESCE(st.station_name, CONCAT('Station ', r.station_id)) AS report_station_name,
            COALESCE(NULLIF(r.title, ''), NULLIF(i.incident_location, ''), 'Untitled Incident') AS incident_title,
            COALESCE(u.username, 'Unknown User') AS submitted_by,
            COALESCE(s.stage_code, 'call_intake') AS stage_code,
            COALESCE(i.incident_status, 'newly_reported') AS incident_status,
            COALESCE(i.alarm_level, 1) AS alarm_level,
            COALESCE(i.caller_name, '') AS caller_name,
            COALESCE(i.incident_location, '') AS incident_location,
            COALESCE(i.remarks, r.description, '') AS remarks,
            (SELECT COUNT(*) FROM report_attachments ra WHERE ra.report_id = r.report_id) AS attachment_count,
            (SELECT ra.file_name FROM report_attachments ra WHERE ra.report_id = r.report_id ORDER BY ra.attachment_id DESC LIMIT 1) AS latest_attachment_name,
            (SELECT ra.file_path FROM report_attachments ra WHERE ra.report_id = r.report_id ORDER BY ra.attachment_id DESC LIMIT 1) AS latest_attachment_path,
            COALESCE(i.updated_at, i.created_at, r.updated_at, r.created_at) AS event_time,
            r.created_at AS report_created_at
        FROM reports r
        LEFT JOIN incident_reports i ON i.report_id = r.report_id
        LEFT JOIN incident_report_stage s ON s.incident_report_stage_id = i.incident_report_stage_id
        LEFT JOIN users u ON u.user_id = r.created_by
        LEFT JOIN stations st ON st.station_id = r.station_id
        WHERE r.station_id = ?
            AND EXISTS (SELECT 1 FROM report_type rt2 WHERE rt2.report_type_id = r.report_type_id AND rt2.type_name = 'incident_report')
SQL;
    $sql .= ' ORDER BY ' . $sortColumn . ' ' . $sortDirection . ', r.report_id DESC LIMIT 1000';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$stationId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $logs = array_map(static function (array $row): array {
        return [
            'reportId' => (int) ($row['report_id'] ?? 0),
            'stationId' => (int) ($row['report_station_id'] ?? 0),
            'stationName' => (string) ($row['report_station_name'] ?? ''),
            'incidentName' => (string) ($row['incident_title'] ?? 'Untitled Incident'),
            'submittedBy' => (string) ($row['submitted_by'] ?? 'Unknown User'),
            'stage' => (string) ($row['stage_code'] ?? 'call_intake'),
            'status' => (string) ($row['incident_status'] ?? 'newly_reported'),
            'alarmLevel' => (int) ($row['alarm_level'] ?? 1),
            'callerName' => (string) ($row['caller_name'] ?? ''),
            'incidentLocation' => (string) ($row['incident_location'] ?? ''),
            'remarks' => (string) ($row['remarks'] ?? ''),
            'attachmentCount' => (int) ($row['attachment_count'] ?? 0),
            'latestAttachmentName' => (string) ($row['latest_attachment_name'] ?? ''),
            'latestAttachmentPath' => (string) ($row['latest_attachment_path'] ?? ''),
            'latestAttachmentUrl' => firenet_station_logs_attachment_url((string) ($row['latest_attachment_path'] ?? '')),
            'eventTime' => (string) ($row['event_time'] ?? ''),
            'createdAt' => (string) ($row['report_created_at'] ?? '')
        ];
    }, $rows);

    $statusCounts = [
        'under_control' => 0,
        'fire_out' => 0
    ];

    foreach ($logs as $log) {
        $status = strtolower(trim(str_replace(['-', ' '], '_', (string) ($log['status'] ?? ''))));
        if ($status === 'under_control') {
            $statusCounts['under_control']++;
        }
        if ($status === 'fire_out') {
            $statusCounts['fire_out']++;
        }
    }

    if ($action === 'download' && $format === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="station-incident-logs-' . date('Ymd-His') . '.csv"');

        $output = fopen('php://output', 'w');
        fputcsv($output, ['Date/Time', 'Report ID', 'Station', 'Incident Name', 'Submitted By', 'Stage', 'Status', 'Alarm Level', 'Caller Name', 'Location', 'Remarks']);
        foreach ($logs as $log) {
            fputcsv($output, [
                $log['eventTime'],
                $log['reportId'],
            $log['stationName'] . ' (#' . $log['stationId'] . ')',
                $log['incidentName'],
                $log['submittedBy'],
                $log['stage'],
                $log['status'],
                $log['alarmLevel'],
                $log['callerName'],
                $log['incidentLocation'],
                $log['remarks']
            ]);
        }
        fclose($output);
        exit;
    }

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => true,
        'logs' => $logs,
        'statusCounts' => $statusCounts,
        'uploadConfig' => [
            'cloudinary' => [
                'available' => empty($cloudinaryMissing),
                'missing' => $cloudinaryMissing,
                'enabled' => !empty($cloudinaryConfig['enabled'])
            ]
        ],
        'sort' => $sort,
        'dir' => strtolower($sortDirection)
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'message' => 'Unable to load station incident logs']);
}
