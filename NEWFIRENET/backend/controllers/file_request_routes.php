<?php
/**
 * File Request Routes Controller
 * 
 * Implements multi-stage approval workflow for inter-station file requests:
 * - User creates request (sent to origin ComL)
 * - Origin ComL approves/rejects
 * - If approved, sent to target station ComL
 * - Target ComL approves/rejects
 * - If approved, file is prepared and sent back
 * - Origin ComL forwards to requesting user
 */

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();
firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

$sessionUser = $_SESSION['user'] ?? [];
$currentUserId = (int) ($sessionUser['user_id'] ?? 0);
$currentStationId = (int) ($sessionUser['station_id'] ?? 0);
$currentRole = strtolower((string) ($sessionUser['role'] ?? 'user'));
$currentPositionCode = (string) ($sessionUser['position_code'] ?? '');
$action = strtolower(trim((string) ($_GET['action'] ?? $_POST['action'] ?? 'list')));

if ($currentUserId < 1 || $currentStationId < 1) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Invalid file request context']);
    exit;
}

function file_request_fail(string $message, int $status = 400): void {
    http_response_code($status);
    echo json_encode(['ok' => false, 'message' => $message]);
    exit;
}

function file_request_success(array $data = []): void {
    echo json_encode(array_merge(['ok' => true], $data));
    exit;
}

function is_coml_user(array $user): bool {
    return ($user['position_code'] ?? '') === 'position1';
}

function ensure_file_request_schema(PDO $pdo): void {
    $schemaFile = __DIR__ . '/../../data/file_request_schema.sql';
    if (file_exists($schemaFile)) {
        $sql = file_get_contents($schemaFile);
        $pdo->exec($sql);
    }
}

function get_station_coml_users(PDO $pdo, int $stationId): array {
    $stmt = $pdo->prepare(<<<'SQL'
        SELECT u.user_id, u.username, u.email
        FROM users u
        JOIN positions p ON u.position_id = p.position_id
        WHERE u.station_id = ? AND p.position_code = 'position1' AND u.status = 'active'
        LIMIT 10
    SQL);
    $stmt->execute([$stationId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function get_all_stations_for_request(PDO $pdo, int $currentStationId): array {
    $stmt = $pdo->prepare(<<<'SQL'
        SELECT station_id, station_name, station_code
        FROM stations
        WHERE status = 'active' AND station_id != ?
        ORDER BY station_name
    SQL);
    $stmt->execute([$currentStationId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function create_file_request(PDO $pdo, int $requestUserId, int $originStationId, int $targetStationId, 
                            string $subject, string $description, bool $isConfidential, 
                            string $confidentialityLevel): array {
    
    $stmt = $pdo->prepare(<<<'SQL'
        INSERT INTO file_request_routes 
        (request_user_id, origin_station_id, target_station_id, subject, description, 
         is_confidential, confidentiality_level, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_origin_approval')
    SQL);
    
    $stmt->execute([
        $requestUserId, $originStationId, $targetStationId, $subject, $description,
        $isConfidential ? 1 : 0, $confidentialityLevel
    ]);
    
    return [
        'route_id' => (int) $pdo->lastInsertId(),
        'status' => 'pending_origin_approval'
    ];
}

function get_file_requests(PDO $pdo, int $userId, int $stationId, string $filter = 'all'): array {
    $filters = [];
    $params = [$userId, $stationId];
    
    $baseQuery = <<<'SQL'
        SELECT 
            r.route_id, r.subject, r.description, r.is_confidential, r.confidentiality_level,
            r.status, r.request_user_id, r.origin_station_id, r.target_station_id,
            r.created_at, r.updated_at,
            ru.username as request_username,
            os.station_name as origin_station_name, os.station_code as origin_station_code,
            ts.station_name as target_station_name, ts.station_code as target_station_code,
            COUNT(DISTINCT fa.approval_id) as approval_count
        FROM file_request_routes r
        LEFT JOIN users ru ON r.request_user_id = ru.user_id
        LEFT JOIN stations os ON r.origin_station_id = os.station_id
        LEFT JOIN stations ts ON r.target_station_id = ts.station_id
        LEFT JOIN file_request_approvals fa ON r.route_id = fa.route_id
    SQL;
    
    switch ($filter) {
        case 'pending_origin':
            $filters[] = "r.status = 'pending_origin_approval' AND r.origin_station_id = ?";
            $params[] = $stationId;
            break;
        case 'pending_target':
            $filters[] = "r.status = 'pending_target_approval' AND r.target_station_id = ?";
            $params[] = $stationId;
            break;
        case 'outgoing':
            $filters[] = "r.request_user_id = ? AND r.origin_station_id = ?";
            break;
        case 'incoming':
            $filters[] = "r.target_station_id = ? AND r.status != 'pending_origin_approval'";
            $params = [$stationId];
            break;
        default:
            $filters[] = "(r.request_user_id = ? OR r.origin_station_id = ? OR r.target_station_id = ?)";
            $params = [$userId, $stationId, $stationId];
    }
    
    $whereClause = implode(' AND ', $filters);
    $query = $baseQuery . ' WHERE ' . $whereClause . ' GROUP BY r.route_id ORDER BY r.updated_at DESC LIMIT 100';
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function approve_file_request(PDO $pdo, int $routeId, int $approverUserId, string $stage, 
                             string $notes = ''): array {
    
    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare('SELECT status FROM file_request_routes WHERE route_id = ?');
        $stmt->execute([$routeId]);
        $route = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$route) {
            throw new Exception('File request not found');
        }
        
        // Record approval
        $approvalStmt = $pdo->prepare(<<<'SQL'
            INSERT INTO file_request_approvals 
            (route_id, approval_stage, approver_user_id, action, notes)
            VALUES (?, ?, ?, 'approved', ?)
        SQL);
        
        $approvalStmt->execute([$routeId, $stage, $approverUserId, $notes]);
        
        // Update route status based on stage
        $newStatus = 'pending_target_approval';
        if ($stage === 'target_review') {
            $newStatus = 'approved';
        }
        
        $updateStmt = $pdo->prepare('UPDATE file_request_routes SET status = ? WHERE route_id = ?');
        $updateStmt->execute([$newStatus, $routeId]);
        
        $pdo->commit();
        
        return ['status' => $newStatus, 'message' => 'Request approved'];
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function reject_file_request(PDO $pdo, int $routeId, int $rejectorUserId, string $stage, 
                            string $reason = ''): array {
    
    try {
        $pdo->beginTransaction();
        
        // Record rejection
        $approvalStmt = $pdo->prepare(<<<'SQL'
            INSERT INTO file_request_approvals 
            (route_id, approval_stage, approver_user_id, action, notes)
            VALUES (?, ?, ?, 'rejected', ?)
        SQL);
        
        $approvalStmt->execute([$routeId, $stage, $rejectorUserId, $reason]);
        
        // Update route to rejected
        $updateStmt = $pdo->prepare('UPDATE file_request_routes SET status = ? WHERE route_id = ?');
        $updateStmt->execute(['rejected', $routeId]);
        
        $pdo->commit();
        
        return ['status' => 'rejected', 'message' => 'Request rejected'];
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function upload_response_file(PDO $pdo, int $routeId, int $uploaderUserId, array $fileInfo, 
                             bool $viewOnly = false, bool $downloadAllowed = true, 
                             bool $printAllowed = true): array {
    
    $storedFileName = 'file_' . time() . '_' . bin2hex(random_bytes(8)) . '.' . 
                     pathinfo($fileInfo['name'], PATHINFO_EXTENSION);
    
    $filePath = __DIR__ . '/../../uploads/file_requests/' . $storedFileName;
    @mkdir(dirname($filePath), 0755, true);
    
    if (!move_uploaded_file($fileInfo['tmp_name'], $filePath)) {
        throw new Exception('Failed to store file');
    }
    
    $stmt = $pdo->prepare(<<<'SQL'
        INSERT INTO file_request_files
        (route_id, stage, uploaded_by_user_id, original_file_name, stored_file_name, 
         file_path, mime_type, file_size_bytes, view_only, download_allowed, print_allowed)
        VALUES (?, 'response', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    SQL);
    
    $stmt->execute([
        $routeId, $uploaderUserId, $fileInfo['name'], $storedFileName,
        $filePath, $fileInfo['type'], $fileInfo['size'],
        $viewOnly ? 1 : 0, $downloadAllowed ? 1 : 0, $printAllowed ? 1 : 0
    ]);
    
    return ['file_id' => (int) $pdo->lastInsertId(), 'message' => 'File uploaded'];
}

function log_file_access(PDO $pdo, int $fileId, int $routeId, int $userId, 
                        string $action, string $ipAddress = '', string $userAgent = ''): void {
    
    $stmt = $pdo->prepare(<<<'SQL'
        INSERT INTO file_request_access_logs
        (file_id, route_id, user_id, action, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
    SQL);
    
    $stmt->execute([$fileId, $routeId, $userId, $action, $ipAddress, $userAgent]);
}

function get_file_request_details(PDO $pdo, int $routeId): array {
    $stmt = $pdo->prepare(<<<'SQL'
        SELECT 
            r.*, 
            u.username as request_username, u.email as request_email,
            os.station_name as origin_station_name, os.station_code as origin_station_code,
            ts.station_name as target_station_name, ts.station_code as target_station_code
        FROM file_request_routes r
        LEFT JOIN users u ON r.request_user_id = u.user_id
        LEFT JOIN stations os ON r.origin_station_id = os.station_id
        LEFT JOIN stations ts ON r.target_station_id = ts.station_id
        WHERE r.route_id = ?
    SQL);
    
    $stmt->execute([$routeId]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
}

function get_route_approvals(PDO $pdo, int $routeId): array {
    $stmt = $pdo->prepare(<<<'SQL'
        SELECT 
            fa.*,
            u.username as approver_name
        FROM file_request_approvals fa
        LEFT JOIN users u ON fa.approver_user_id = u.user_id
        WHERE fa.route_id = ?
        ORDER BY fa.created_at DESC
    SQL);
    
    $stmt->execute([$routeId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function get_route_files(PDO $pdo, int $routeId): array {
    $stmt = $pdo->prepare(<<<'SQL'
        SELECT 
            frf.*,
            u.username as uploader_name
        FROM file_request_files frf
        LEFT JOIN users u ON frf.uploaded_by_user_id = u.user_id
        WHERE frf.route_id = ?
        ORDER BY frf.created_at DESC
    SQL);
    
    $stmt->execute([$routeId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

try {
    $pdo = firenet_get_pdo();
    ensure_file_request_schema($pdo);
    
    // Get current user profile
    $userStmt = $pdo->prepare(<<<'SQL'
        SELECT u.*, p.position_code
        FROM users u
        LEFT JOIN positions p ON u.position_id = p.position_id
        WHERE u.user_id = ?
    SQL);
    $userStmt->execute([$currentUserId]);
    $currentUser = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$currentUser) {
        file_request_fail('User profile not found');
    }
    
    $isComl = is_coml_user($currentUser);
    
    switch ($action) {
        case 'bootstrap':
            $stations = get_all_stations_for_request($pdo, $currentStationId);
            $pendingOrigin = $isComl ? get_file_requests($pdo, $currentUserId, $currentStationId, 'pending_origin') : [];
            $pendingTarget = $isComl ? get_file_requests($pdo, $currentUserId, $currentStationId, 'pending_target') : [];
            
            file_request_success([
                'currentUser' => [
                    'userId' => $currentUser['user_id'],
                    'username' => $currentUser['username'],
                    'stationId' => $currentStationId,
                    'isComl' => $isComl
                ],
                'stations' => $stations,
                'pendingOriginApprovals' => $pendingOrigin,
                'pendingTargetApprovals' => $pendingTarget
            ]);
            break;
            
        case 'create':
            if (!isset($_POST['targetStationId'], $_POST['subject'], $_POST['description'])) {
                file_request_fail('Missing required fields');
            }
            
            $targetStationId = (int) $_POST['targetStationId'];
            $subject = trim((string) $_POST['subject']);
            $description = trim((string) $_POST['description']);
            $isConfidential = (bool) ($_POST['isConfidential'] ?? false);
            $confidentialityLevel = isset($_POST['confidentialityLevel']) ? 
                strtolower(trim((string) $_POST['confidentialityLevel'])) : 'public';
            
            if (!$subject || !$description) {
                file_request_fail('Subject and description are required');
            }
            
            $result = create_file_request($pdo, $currentUserId, $currentStationId, $targetStationId,
                                         $subject, $description, $isConfidential, $confidentialityLevel);
            
            file_request_success($result + ['message' => 'File request created and sent to origin ComL for review']);
            break;
            
        case 'list':
            $filter = strtolower(trim((string) ($_POST['filter'] ?? 'all')));
            $requests = get_file_requests($pdo, $currentUserId, $currentStationId, $filter);
            
            file_request_success(['requests' => $requests]);
            break;
            
        case 'detail':
            if (!isset($_POST['routeId'])) {
                file_request_fail('Route ID required');
            }
            
            $routeId = (int) $_POST['routeId'];
            $detail = get_file_request_details($pdo, $routeId);
            
            if (!$detail) {
                file_request_fail('Request not found', 404);
            }
            
            $approvals = get_route_approvals($pdo, $routeId);
            $files = get_route_files($pdo, $routeId);
            
            file_request_success([
                'request' => $detail,
                'approvals' => $approvals,
                'files' => $files
            ]);
            break;
            
        case 'approve':
            if (!$isComl) {
                file_request_fail('Only ComL users can approve requests', 403);
            }
            
            if (!isset($_POST['routeId'], $_POST['stage'])) {
                file_request_fail('Route ID and stage required');
            }
            
            $routeId = (int) $_POST['routeId'];
            $stage = strtolower(trim((string) $_POST['stage']));
            $notes = trim((string) ($_POST['notes'] ?? ''));
            
            $result = approve_file_request($pdo, $routeId, $currentUserId, $stage, $notes);
            file_request_success($result);
            break;
            
        case 'reject':
            if (!$isComl) {
                file_request_fail('Only ComL users can reject requests', 403);
            }
            
            if (!isset($_POST['routeId'], $_POST['stage'])) {
                file_request_fail('Route ID and stage required');
            }
            
            $routeId = (int) $_POST['routeId'];
            $stage = strtolower(trim((string) $_POST['stage']));
            $reason = trim((string) ($_POST['reason'] ?? ''));
            
            $result = reject_file_request($pdo, $routeId, $currentUserId, $stage, $reason);
            file_request_success($result);
            break;
            
        case 'upload-response':
            if (!$isComl) {
                file_request_fail('Only ComL users can upload responses', 403);
            }
            
            if (!isset($_POST['routeId']) || empty($_FILES['responseFile'] ?? [])) {
                file_request_fail('Route ID and file required');
            }
            
            $routeId = (int) $_POST['routeId'];
            $viewOnly = (bool) ($_POST['viewOnly'] ?? false);
            $downloadAllowed = (bool) ($_POST['downloadAllowed'] ?? true);
            $printAllowed = (bool) ($_POST['printAllowed'] ?? true);
            
            $result = upload_response_file($pdo, $routeId, $currentUserId, $_FILES['responseFile'],
                                          $viewOnly, $downloadAllowed, $printAllowed);
            
            file_request_success($result + ['message' => 'Response file uploaded']);
            break;
            
        case 'log-access':
            if (!isset($_POST['fileId'], $_POST['routeId'], $_POST['action'])) {
                file_request_fail('Missing access log parameters');
            }
            
            $fileId = (int) $_POST['fileId'];
            $routeId = (int) $_POST['routeId'];
            $fileAction = strtolower(trim((string) $_POST['action']));
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            
            log_file_access($pdo, $fileId, $routeId, $currentUserId, $fileAction, $ipAddress, $userAgent);
            
            file_request_success(['message' => 'Access logged']);
            break;
            
        default:
            file_request_fail('Unknown action: ' . $action);
    }
    
} catch (Exception $e) {
    file_request_fail($e->getMessage());
}
