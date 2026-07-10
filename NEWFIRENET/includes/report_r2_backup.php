<?php

require_once __DIR__ . '/r2_storage.php';
require_once __DIR__ . '/report_pdf.php';

function firenet_ensure_report_cloud_backups_table(PDO $pdo): void
{
    $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS report_cloud_backups (
    backup_id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    station_id INT NOT NULL,
    r2_key VARCHAR(512) NOT NULL,
    central_r2_key VARCHAR(512) NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL DEFAULT 0,
    backed_up_by INT NULL,
    backed_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_report_cloud_backup (report_id),
    INDEX idx_report_cloud_backups_station (station_id, backed_up_at),
    CONSTRAINT fk_report_cloud_backups_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
    CONSTRAINT fk_report_cloud_backups_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    CONSTRAINT fk_report_cloud_backups_user FOREIGN KEY (backed_up_by) REFERENCES users(user_id) ON DELETE SET NULL
)
SQL);
}

function firenet_get_report_cloud_backup(PDO $pdo, int $reportId): ?array
{
    firenet_ensure_report_cloud_backups_table($pdo);
    $stmt = $pdo->prepare('
        SELECT backup_id, report_id, station_id, r2_key, central_r2_key, file_name, file_size, backed_up_by, backed_up_at
        FROM report_cloud_backups
        WHERE report_id = ?
        LIMIT 1
    ');
    $stmt->execute([$reportId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function firenet_report_cloud_backup_payload(?array $row): array
{
    if (!$row) {
        return [
            'backedUp' => false,
            'key' => '',
            'centralKey' => '',
            'fileName' => '',
            'fileSize' => 0,
            'backedUpAt' => '',
            'downloadUrl' => '',
        ];
    }

    $key = (string) ($row['r2_key'] ?? '');
    return [
        'backedUp' => $key !== '',
        'key' => $key,
        'centralKey' => (string) ($row['central_r2_key'] ?? ''),
        'fileName' => (string) ($row['file_name'] ?? ''),
        'fileSize' => (int) ($row['file_size'] ?? 0),
        'backedUpAt' => (string) ($row['backed_up_at'] ?? ''),
        'downloadUrl' => $key !== '' ? firenet_r2_download_proxy_url($key) : '',
    ];
}

function firenet_can_access_report_for_backup(PDO $pdo, int $reportId, int $sessionStationId): bool
{
    $stmt = $pdo->prepare('
        SELECT COALESCE(i.station_id, r.station_id) AS station_id, i.incident_status
        FROM reports r
        LEFT JOIN incident_reports i ON i.report_id = r.report_id
        WHERE r.report_id = ?
        LIMIT 1
    ');
    $stmt->execute([$reportId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return false;
    }

    if (strtolower((string) ($row['incident_status'] ?? '')) !== 'fire_out') {
        return false;
    }

    $reportStationId = (int) ($row['station_id'] ?? 0);
    if ($reportStationId < 1) {
        return false;
    }

    return $reportStationId === $sessionStationId || firenet_r2_is_central_station($pdo, $sessionStationId);
}

function firenet_load_incident_report_export_data(PDO $pdo, int $reportId, bool $requireFireOut = true): array
{
    $stmt = $pdo->prepare('
        SELECT
            r.report_id,
            r.title,
            r.description,
            r.created_at,
            r.updated_at,
            r.station_id,
            r.created_by,
            u.username AS creator_username,
            u_updated.username AS updated_by_username,
            s_report.station_name,
            s_report.station_code,
            i.incident_report_id,
            i.incident_case_id,
            i.incident_location,
            i.alarm_level,
            i.incident_status,
            i.incident_started_at,
            i.incident_finished_at,
            i.caller_name,
            i.remarks AS incident_remarks,
            i.updated_by_user_id,
            st.stage_code,
            st.stage_name
        FROM reports r
        LEFT JOIN incident_reports i ON i.report_id = r.report_id
        LEFT JOIN incident_report_stage st ON st.incident_report_stage_id = i.incident_report_stage_id
        LEFT JOIN stations s_report ON s_report.station_id = r.station_id
        LEFT JOIN users u ON u.user_id = r.created_by
        LEFT JOIN users u_updated ON u_updated.user_id = i.updated_by_user_id
        WHERE r.report_id = ?
        LIMIT 1
    ');
    $stmt->execute([$reportId]);
    $report = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$report) {
        throw new RuntimeException('Report not found.');
    }

    if ($requireFireOut && strtolower((string) ($report['incident_status'] ?? '')) !== 'fire_out') {
        throw new RuntimeException('Only fire out incidents can be backed up to cloud storage.');
    }

    $incidentReportId = (int) ($report['incident_report_id'] ?? 0);
    $timeline = [];
    if ($incidentReportId > 0) {
        $updatesStmt = $pdo->prepare('
            SELECT alarm_level, incident_status, recorded_at
            FROM incident_report_updates
            WHERE incident_report_id = ?
            ORDER BY recorded_at ASC
        ');
        $updatesStmt->execute([$incidentReportId]);
        foreach ($updatesStmt->fetchAll(PDO::FETCH_ASSOC) as $update) {
            $timeline[] = sprintf(
                '%s | Alarm %s | Status %s',
                (string) ($update['recorded_at'] ?? ''),
                (string) ($update['alarm_level'] ?? '-'),
                firenet_report_pdf_format_status((string) ($update['incident_status'] ?? '-'))
            );
        }
    }

    return [
        'report' => $report,
        'timeline' => $timeline,
    ];
}

function firenet_can_access_report_for_pdf(PDO $pdo, int $reportId, int $userId, int $sessionStationId): bool
{
    $stmt = $pdo->prepare('
        SELECT
            r.created_by,
            COALESCE(i.station_id, r.station_id) AS station_id,
            i.updated_by_user_id,
            i.incident_status
        FROM reports r
        LEFT JOIN incident_reports i ON i.report_id = r.report_id
        LEFT JOIN report_type rt ON rt.report_type_id = r.report_type_id
        WHERE r.report_id = ?
          AND rt.type_name = \'incident_report\'
        LIMIT 1
    ');
    $stmt->execute([$reportId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return false;
    }

    $status = strtolower((string) ($row['incident_status'] ?? ''));
    $reportStationId = (int) ($row['station_id'] ?? 0);

    if ($status === 'fire_out') {
        if ($reportStationId < 1) {
            return false;
        }

        return $reportStationId === $sessionStationId || firenet_r2_is_central_station($pdo, $sessionStationId);
    }

    return (int) ($row['created_by'] ?? 0) === $userId
        || (int) ($row['updated_by_user_id'] ?? 0) === $userId;
}

function firenet_incident_report_pdf_download_url(int $reportId): string
{
    return '/firenet/NEWFIRENET/backend/controllers/reports.php?action=download-pdf&reportId=' . max(0, $reportId);
}

function firenet_incident_report_pdf_filename(array $report): string
{
    $caseId = (int) ($report['incident_case_id'] ?? $report['report_id'] ?? 0);
    $reportId = (int) ($report['report_id'] ?? 0);
    $stationCode = strtoupper(trim((string) ($report['station_code'] ?? '')));

    return firenet_r2_prefixed_safe_filename($stationCode, 'case_' . $caseId . '_report_' . $reportId . '.pdf');
}

function firenet_stream_incident_report_pdf(PDO $pdo, int $reportId, int $userId, int $sessionStationId): void
{
    if ($reportId < 1) {
        throw new RuntimeException('Invalid report ID.');
    }

    if (!firenet_can_access_report_for_pdf($pdo, $reportId, $userId, $sessionStationId)) {
        throw new RuntimeException('You do not have access to this report.');
    }

    $exportData = firenet_load_incident_report_export_data($pdo, $reportId, false);
    $pdf = firenet_generate_incident_report_pdf($exportData);
    $filename = firenet_incident_report_pdf_filename($exportData['report']);

    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . str_replace('"', '', $filename) . '"');
    header('Cache-Control: private, max-age=60');
    header('Content-Length: ' . strlen($pdf));
    echo $pdf;
}

function firenet_backup_incident_report_to_r2(PDO $pdo, int $reportId, int $userId, bool $force = false): array
{
    if (!firenet_r2_enabled()) {
        throw new RuntimeException('Cloud storage (R2) is not configured.');
    }

    firenet_ensure_report_cloud_backups_table($pdo);

    $existing = firenet_get_report_cloud_backup($pdo, $reportId);
    if ($existing && !$force) {
        return [
            'ok' => true,
            'message' => 'Report is already backed up to cloud storage.',
            'data' => firenet_report_cloud_backup_payload($existing),
            'skipped' => true,
        ];
    }

    $exportData = firenet_load_incident_report_export_data($pdo, $reportId);
    $report = $exportData['report'];
    $stationId = (int) ($report['station_id'] ?? 0);
    $stationCode = strtoupper(trim((string) ($report['station_code'] ?? '')));
    if ($stationCode === '') {
        $stationCode = firenet_r2_station_code($pdo, $stationId);
    }

    $caseId = (int) ($report['incident_case_id'] ?? $reportId);
    $fileName = firenet_r2_prefixed_safe_filename($stationCode, 'case_' . $caseId . '_report_' . $reportId . '.pdf');
    $stationKey = firenet_r2_reports_prefix($stationCode) . '/' . $fileName;
    $centralKey = firenet_r2_reports_prefix('MCFS') . '/archive/' . $stationCode . '/' . $fileName;

    $pdfBinary = firenet_generate_incident_report_pdf($exportData);
    $tempPath = tempnam(sys_get_temp_dir(), 'firenet_report_');
    if ($tempPath === false) {
        throw new RuntimeException('Unable to create temporary file for report export.');
    }

    try {
        if (file_put_contents($tempPath, $pdfBinary) === false) {
            throw new RuntimeException('Unable to write report PDF.');
        }

        $client = FirenetR2Client::fromConfig();
        $stationUpload = $client->putObject($stationKey, $tempPath, 'application/pdf');
        $centralUpload = $client->putObject($centralKey, $tempPath, 'application/pdf');

        if ($existing) {
            $stmt = $pdo->prepare('
                UPDATE report_cloud_backups
                SET station_id = ?, r2_key = ?, central_r2_key = ?, file_name = ?, file_size = ?, backed_up_by = ?, backed_up_at = CURRENT_TIMESTAMP
                WHERE report_id = ?
            ');
            $stmt->execute([
                $stationId,
                $stationUpload['key'],
                $centralUpload['key'],
                $fileName,
                (int) ($stationUpload['bytes'] ?? strlen($pdfBinary)),
                $userId > 0 ? $userId : null,
                $reportId,
            ]);
        } else {
            $stmt = $pdo->prepare('
                INSERT INTO report_cloud_backups (report_id, station_id, r2_key, central_r2_key, file_name, file_size, backed_up_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $reportId,
                $stationId,
                $stationUpload['key'],
                $centralUpload['key'],
                $fileName,
                (int) ($stationUpload['bytes'] ?? strlen($pdfBinary)),
                $userId > 0 ? $userId : null,
            ]);
        }

        $saved = firenet_get_report_cloud_backup($pdo, $reportId);
        return [
            'ok' => true,
            'message' => 'Report backed up to cloud storage.',
            'data' => firenet_report_cloud_backup_payload($saved),
            'skipped' => false,
        ];
    } finally {
        if (is_file($tempPath)) {
            unlink($tempPath);
        }
    }
}

function firenet_try_backup_incident_report_to_r2(PDO $pdo, int $reportId, int $userId): void
{
    firenet_sync_incident_case_to_r2($pdo, $reportId, $userId);
}

function firenet_get_fire_out_case_report_ids(PDO $pdo, int $reportId): array
{
    if ($reportId < 1) {
        return [];
    }

    $caseStmt = $pdo->prepare('
        SELECT COALESCE(NULLIF(i.incident_case_id, 0), r.report_id) AS case_id
        FROM reports r
        JOIN incident_reports i ON i.report_id = r.report_id
        WHERE r.report_id = ?
        LIMIT 1
    ');
    $caseStmt->execute([$reportId]);
    $caseId = (int) ($caseStmt->fetchColumn() ?: 0);
    if ($caseId < 1) {
        return [$reportId];
    }

    $reportsStmt = $pdo->prepare('
        SELECT r.report_id
        FROM reports r
        JOIN incident_reports i ON i.report_id = r.report_id
        WHERE i.incident_status = \'fire_out\'
          AND (i.incident_case_id = ? OR (COALESCE(i.incident_case_id, 0) = 0 AND r.report_id = ?))
        ORDER BY r.report_id ASC
    ');
    $reportsStmt->execute([$caseId, $caseId]);
    $ids = array_values(array_unique(array_map(static fn (array $row): int => (int) ($row['report_id'] ?? 0), $reportsStmt->fetchAll(PDO::FETCH_ASSOC) ?: [])));

    return array_values(array_filter($ids, static fn (int $id): bool => $id > 0));
}

function firenet_sync_incident_case_to_r2(PDO $pdo, int $reportId, int $userId): array
{
    if (!firenet_r2_enabled() || $reportId < 1) {
        return [
            'enabled' => firenet_r2_enabled(),
            'synced' => 0,
            'failed' => 0,
            'skipped' => 0,
        ];
    }

    $synced = 0;
    $failed = 0;
    $skipped = 0;
    foreach (firenet_get_fire_out_case_report_ids($pdo, $reportId) as $caseReportId) {
        try {
            $result = firenet_backup_incident_report_to_r2($pdo, $caseReportId, $userId, false);
            if (!empty($result['skipped'])) {
                $skipped++;
            } else {
                $synced++;
            }
        } catch (Throwable $e) {
            $failed++;
            error_log('FireNet R2 backup failed for report ' . $caseReportId . ': ' . $e->getMessage());
        }
    }

    return [
        'enabled' => true,
        'synced' => $synced,
        'failed' => $failed,
        'skipped' => $skipped,
    ];
}

function firenet_auto_backup_pending_reports(PDO $pdo, array $reportIds, int $userId, int $limit = 25): array
{
    if (!firenet_r2_enabled()) {
        return [
            'enabled' => false,
            'synced' => 0,
            'failed' => 0,
            'pending' => 0,
        ];
    }

    firenet_ensure_report_cloud_backups_table($pdo);

    $reportIds = array_values(array_unique(array_filter(array_map(static fn ($id): int => (int) $id, $reportIds), static fn (int $id): bool => $id > 0)));
    $synced = 0;
    $failed = 0;
    $attempted = 0;

    foreach ($reportIds as $reportId) {
        if ($attempted >= $limit) {
            break;
        }

        if (firenet_get_report_cloud_backup($pdo, $reportId)) {
            continue;
        }

        $attempted++;
        try {
            $result = firenet_backup_incident_report_to_r2($pdo, $reportId, $userId, false);
            if (!empty($result['skipped'])) {
                continue;
            }
            $synced++;
        } catch (Throwable $e) {
            $failed++;
            error_log('FireNet R2 auto-backup failed for report ' . $reportId . ': ' . $e->getMessage());
        }
    }

    return [
        'enabled' => true,
        'synced' => $synced,
        'failed' => $failed,
        'pending' => max(0, count($reportIds) - $synced),
    ];
}
