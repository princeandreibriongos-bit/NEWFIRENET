<?php
/**
 * Incident Report View - Readonly access for operational mail
 */

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();
firenet_start_session();

$reportId = (int) ($_GET['report_id'] ?? 0);

if ($reportId < 1) {
    http_response_code(404);
    die('Report not found');
}

try {
    $pdo = firenet_get_pdo();
    $currentUserId = (int) ($_SESSION['user']['user_id'] ?? 0);
    $currentStationId = (int) ($_SESSION['user']['station_id'] ?? 0);

    $stmt = $pdo->prepare('
        SELECT
            r.report_id,
            r.title,
            r.description,
            r.created_at,
            r.station_id,
            s.station_name,
            i.incident_location,
            i.incident_status,
            COUNT(ra.attachment_id) AS attachment_count
        FROM reports r
        LEFT JOIN incident_reports i ON i.report_id = r.report_id
        LEFT JOIN stations s ON s.station_id = r.station_id
        LEFT JOIN report_attachments ra ON ra.report_id = r.report_id
        WHERE r.report_id = ?
            AND r.station_id = ?
            AND EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = "incident_report")
        GROUP BY r.report_id
        LIMIT 1
    ');
    $stmt->execute([$reportId, $currentStationId]);
    $report = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$report) {
        http_response_code(403);
        die('Access denied or report not found');
    }

    header('Content-Type: text/html; charset=utf-8');
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title><?php echo htmlspecialchars($report['title'] ?: 'Incident Report'); ?> - Readonly</title>
        <style>
            * { box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
                background: #f5f7fa;
                color: #2d3748;
                margin: 0;
                padding: 20px;
            }
            .report-container {
                max-width: 900px;
                margin: 0 auto;
                background: white;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            }
            .report-header {
                border-bottom: 2px solid #dee2e6;
                padding-bottom: 20px;
                margin-bottom: 20px;
            }
            .report-header h1 {
                margin: 0 0 10px 0;
                font-size: 24px;
                font-weight: 700;
                color: #2d3748;
            }
            .report-meta {
                display: flex;
                gap: 20px;
                font-size: 13px;
                color: #718096;
                flex-wrap: wrap;
            }
            .meta-item {
                display: flex;
                gap: 6px;
            }
            .meta-item strong {
                color: #2d3748;
            }
            .report-section {
                margin: 20px 0;
                padding: 16px;
                background: #f8f9fa;
                border-radius: 6px;
                border-left: 3px solid #0066cc;
            }
            .report-section h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                color: #2d3748;
                letter-spacing: 0.5px;
            }
            .report-section p {
                margin: 0;
                font-size: 14px;
                color: #2d3748;
                line-height: 1.6;
                word-break: break-word;
            }
            .readonly-badge {
                display: inline-block;
                background: rgba(220, 53, 69, 0.1);
                color: #721c24;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                margin-bottom: 16px;
            }
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                text-transform: capitalize;
                background: rgba(255, 193, 7, 0.15);
                color: #856404;
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <div class="report-header">
                <div class="readonly-badge">READONLY - FOR OPERATIONAL MAIL</div>
                <h1><?php echo htmlspecialchars($report['title'] ?: 'Untitled Incident'); ?></h1>
                <div class="report-meta">
                    <div class="meta-item">
                        <strong>Station:</strong>
                        <span><?php echo htmlspecialchars($report['station_name'] ?? ''); ?></span>
                    </div>
                    <div class="meta-item">
                        <strong>Date:</strong>
                        <span><?php echo htmlspecialchars($report['created_at'] ? date('Y-m-d H:i', strtotime($report['created_at'])) : 'Unknown'); ?></span>
                    </div>
                    <div class="meta-item">
                        <strong>Status:</strong>
                        <span class="status-badge"><?php echo htmlspecialchars($report['incident_status'] ?? 'newly_reported'); ?></span>
                    </div>
                </div>
            </div>

            <?php if ($report['incident_location']): ?>
            <div class="report-section">
                <h3>Location</h3>
                <p><?php echo htmlspecialchars($report['incident_location']); ?></p>
            </div>
            <?php endif; ?>

            <?php if ($report['description']): ?>
            <div class="report-section">
                <h3>Description</h3>
                <p><?php echo htmlspecialchars($report['description']); ?></p>
            </div>
            <?php endif; ?>

            <?php if ($report['attachment_count'] > 0): ?>
            <div class="report-section">
                <h3>Attachments</h3>
                <p><?php echo (int) $report['attachment_count']; ?> file(s) attached to this report</p>
            </div>
            <?php endif; ?>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #718096; text-align: center;">
                <p>This report is displayed as read-only for operational mail reference.</p>
            </div>
        </div>
    </body>
    </html>
    <?php

} catch (Exception $e) {
    error_log('Incident report view error: ' . $e->getMessage());
    http_response_code(500);
    die('Error retrieving report: ' . htmlspecialchars($e->getMessage()));
}
