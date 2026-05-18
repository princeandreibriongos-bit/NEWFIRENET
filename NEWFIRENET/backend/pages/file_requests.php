<?php
/**
 * File Requests Page Controller
 * Renders the file request management page with user context
 */

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();
firenet_start_session();

$sessionUser = $_SESSION['user'] ?? [];
$userId = (int) ($sessionUser['user_id'] ?? 0);
$stationId = (int) ($sessionUser['station_id'] ?? 0);

if ($userId < 1 || $stationId < 1) {
    header('Location: ../login.html');
    exit;
}

try {
    $pdo = firenet_get_pdo();
    
    // Get user profile with position info
    $stmt = $pdo->prepare(<<<'SQL'
        SELECT u.user_id, u.username, u.email, u.station_id, u.role_id,
               p.position_code, s.station_name, s.station_code
        FROM users u
        LEFT JOIN positions p ON u.position_id = p.position_id
        LEFT JOIN stations s ON u.station_id = s.station_id
        WHERE u.user_id = ?
    SQL);
    
    $stmt->execute([$userId]);
    $userProfile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$userProfile) {
        header('Location: ../login.html');
        exit;
    }
    
    $isComl = ($userProfile['position_code'] ?? '') === 'position1';
    
    // Get all active stations
    $stmt = $pdo->prepare(<<<'SQL'
        SELECT station_id, station_name, station_code
        FROM stations
        WHERE status = 'active'
        ORDER BY station_name
    SQL);
    
    $stmt->execute();
    $stations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
} catch (Exception $e) {
    header('Location: ../login.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Requests - FireNet</title>
    <link rel="stylesheet" href="../assets/css/style.css">
    <link rel="stylesheet" href="../assets/css/station-mails.css">
    <style>
        .navbar {
            background: #fff;
            border-bottom: 1px solid #ddd;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .navbar-title {
            font-size: 20px;
            font-weight: 600;
            color: #333;
            margin: 0;
        }
        
        .navbar-user {
            font-size: 14px;
            color: #666;
        }
        
        .main-container {
            height: calc(100vh - 70px);
            overflow: hidden;
        }
    </style>
</head>
<body>
    <div class="navbar">
        <h1 class="navbar-title">📨 File Requests</h1>
        <div class="navbar-user">
            <?php if ($isComl): ?>
                <span style="color: #0066cc; font-weight: 600;">🔒 ComL Position</span>
            <?php endif; ?>
            <span><?php echo htmlspecialchars($userProfile['username']); ?></span> 
            @ <?php echo htmlspecialchars($userProfile['station_name']); ?>
        </div>
    </div>
    
    <div class="main-container" id="app"></div>
    
    <!-- Inline the file requests page content -->
    <script>
        window.fileRequestPageContext = {
            currentUser: {
                userId: <?php echo $userId; ?>,
                username: <?php echo json_encode($userProfile['username']); ?>,
                email: <?php echo json_encode($userProfile['email']); ?>,
                stationId: <?php echo $stationId; ?>,
                stationName: <?php echo json_encode($userProfile['station_name']); ?>,
                stationCode: <?php echo json_encode($userProfile['station_code']); ?>,
                positionCode: <?php echo json_encode($userProfile['position_code'] ?? ''); ?>,
                isComl: <?php echo $isComl ? 'true' : 'false'; ?>
            },
            stations: <?php echo json_encode($stations); ?>
        };
    </script>
    
    <style>
        .file-request-container {
            display: flex;
            gap: 20px;
            height: calc(100vh - 120px);
            padding: 20px;
        }
        
        .file-request-sidebar {
            flex: 0 0 250px;
            background: #f5f5f5;
            border-radius: 8px;
            padding: 15px;
            overflow-y: auto;
        }
        
        .file-request-main {
            flex: 1;
            background: white;
            border-radius: 8px;
            padding: 20px;
            overflow-y: auto;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .file-request-filter {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .file-request-filter button {
            padding: 10px 15px;
            border: none;
            background: white;
            border-left: 3px solid transparent;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s;
            border-radius: 4px;
        }
        
        .file-request-filter button:hover {
            background: #e8f4f8;
        }
        
        .file-request-filter button.active {
            background: #e8f4f8;
            border-left-color: #0066cc;
            font-weight: 600;
        }
        
        .file-request-compose {
            margin-bottom: 20px;
            padding: 20px;
            background: #f0f8ff;
            border-radius: 8px;
            border: 1px solid #cce5ff;
        }
        
        .file-request-compose-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .form-group label {
            font-weight: 600;
            font-size: 14px;
            color: #333;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            font-family: inherit;
        }
        
        .form-group textarea {
            min-height: 100px;
            resize: vertical;
        }
        
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #0066cc;
            box-shadow: 0 0 0 2px rgba(0,102,204,0.1);
        }
        
        .confidentiality-options {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .checkbox-group input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        
        .confidentiality-level {
            display: none;
        }
        
        .confidentiality-level.visible {
            display: block;
        }
        
        .file-request-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .file-request-item {
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            background: white;
        }
        
        .file-request-item:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-color: #0066cc;
            transform: translateX(4px);
        }
        
        .file-request-item.active {
            background: #e8f4f8;
            border-color: #0066cc;
            border-left: 4px solid #0066cc;
        }
        
        .file-request-item-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 8px;
        }
        
        .file-request-item-subject {
            font-weight: 600;
            color: #333;
            flex: 1;
        }
        
        .file-request-status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            margin-left: 10px;
        }
        
        .status-pending_origin_approval {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-pending_target_approval {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-approved {
            background: #d4edda;
            color: #155724;
        }
        
        .status-rejected {
            background: #f8d7da;
            color: #721c24;
        }
        
        .status-file_received {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .status-delivered_to_user {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .file-request-item-meta {
            font-size: 13px;
            color: #666;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .file-request-detail {
            display: none;
        }
        
        .file-request-detail.visible {
            display: block;
        }
        
        .file-request-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #ddd;
        }
        
        .file-request-detail-header h2 {
            margin: 0;
            color: #333;
        }
        
        .file-request-detail-header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
        }
        
        .file-request-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .file-request-actions button {
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-approve {
            background: #28a745;
            color: white;
        }
        
        .btn-approve:hover {
            background: #218838;
        }
        
        .btn-reject {
            background: #dc3545;
            color: white;
        }
        
        .btn-reject:hover {
            background: #c82333;
        }
        
        .btn-primary {
            background: #0066cc;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0052a3;
        }
        
        .btn-secondary {
            background: #999;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #777;
        }
        
        .confidential-banner {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 15px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        
        .confidential-banner.highly {
            background: #f8d7da;
            border-left-color: #dc3545;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #999;
        }
        
        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
    </style>
    
    <!-- File Requests UI Container -->
    <div class="file-request-container">
        <!-- Sidebar -->
        <div class="file-request-sidebar">
            <h3 style="margin-top: 0; margin-bottom: 15px;">File Requests</h3>
            <div class="file-request-filter">
                <button class="filter-btn active" data-filter="all">All Requests</button>
                <button class="filter-btn" data-filter="outgoing">My Requests</button>
                <button class="filter-btn" id="btn-pending-origin" style="display:none;">
                    Pending Origin Review
                </button>
                <button class="filter-btn" id="btn-pending-target" style="display:none;">
                    Pending Target Review
                </button>
                <button class="filter-btn" data-filter="incoming">Incoming Requests</button>
                <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
                <button id="btn-new-request" style="background: #0066cc; color: white; padding: 12px; border: none; border-radius: 4px; cursor: pointer;">
                    + New Request
                </button>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="file-request-main">
            <!-- Compose Section -->
            <div id="file-request-compose" style="display:none;">
                <h3 style="margin-top: 0;">Create File Request</h3>
                <form class="file-request-compose-form" id="file-request-form">
                    <div class="form-group">
                        <label>Target Station *</label>
                        <select id="request-target-station" required>
                            <option value="">-- Select a station --</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Subject *</label>
                        <input type="text" id="request-subject" placeholder="Enter request subject" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Description *</label>
                        <textarea id="request-description" placeholder="Describe the files or information you need..." required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <div class="checkbox-group">
                            <input type="checkbox" id="request-is-confidential">
                            <label for="request-is-confidential" style="margin: 0;">This request contains confidential information</label>
                        </div>
                    </div>
                    
                    <div class="confidentiality-level" id="confidentiality-level-group">
                        <label>Confidentiality Level</label>
                        <select id="request-confidentiality-level">
                            <option value="restricted">Restricted</option>
                            <option value="confidential">Confidential</option>
                            <option value="highly_confidential">Highly Confidential</option>
                        </select>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn-primary" style="flex: 1; padding: 10px;">Send Request</button>
                        <button type="button" id="btn-cancel-request" style="flex: 1; padding: 10px; background: #999; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                    </div>
                </form>
            </div>
            
            <!-- Request List -->
            <div id="file-request-list-container">
                <div class="file-request-list" id="file-request-list">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <p>No file requests found</p>
                    </div>
                </div>
            </div>
            
            <!-- Detail View -->
            <div id="file-request-detail-container" class="file-request-detail">
                <div class="file-request-detail-header">
                    <div>
                        <h2 id="detail-subject"></h2>
                        <p id="detail-meta"></p>
                    </div>
                    <div id="detail-actions" class="file-request-actions"></div>
                </div>
                
                <div id="confidential-banner-container"></div>
                <div id="detail-content"></div>
            </div>
        </div>
    </div>
    
    <script src="../assets/js/file-requests.js"></script>
</body>
</html>
