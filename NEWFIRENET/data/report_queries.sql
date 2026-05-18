-- ===== INCIDENT REPORTS - COMPREHENSIVE QUERIES =====

-- 1. ALL INCIDENT REPORTS WITH DETAILS
SELECT
    r.report_id,
    r.title,
    r.description,
    s.station_name,
    s.station_code,
    i.incident_location,
    i.incident_status,
    ist.stage_name,
    r.created_at,
    COUNT(DISTINCT ra.attachment_id) AS attachment_count,
    COUNT(DISTINCT er.equipment_report_id) AS equipment_used
FROM reports r
LEFT JOIN stations s ON s.station_id = r.station_id
LEFT JOIN incident_reports i ON i.report_id = r.report_id
LEFT JOIN incident_report_stage ist ON ist.incident_report_stage_id = i.incident_report_stage_id
LEFT JOIN report_attachments ra ON ra.report_id = r.report_id
LEFT JOIN equipment_reports er ON er.report_id = r.report_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
GROUP BY r.report_id
ORDER BY r.created_at DESC;

-- 2. INCIDENT REPORTS BY STATUS
SELECT
    i.incident_status,
    COUNT(*) AS count,
    s.station_name,
    GROUP_CONCAT(r.title SEPARATOR ', ') AS incidents
FROM reports r
LEFT JOIN incident_reports i ON i.report_id = r.report_id
LEFT JOIN stations s ON s.station_id = r.station_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
GROUP BY i.incident_status, s.station_id
ORDER BY s.station_name, i.incident_status;

-- 3. INCIDENT REPORTS BY STATION
SELECT
    s.station_id,
    s.station_name,
    s.station_code,
    COUNT(r.report_id) AS total_incidents,
    COUNT(CASE WHEN i.incident_status = 'newly_reported' THEN 1 END) AS new_reports,
    COUNT(CASE WHEN i.incident_status = 'under_investigation' THEN 1 END) AS investigating,
    COUNT(CASE WHEN i.incident_status = 'active_response' THEN 1 END) AS active,
    COUNT(CASE WHEN i.incident_status = 'closed' THEN 1 END) AS closed,
    MAX(r.created_at) AS latest_incident
FROM stations s
LEFT JOIN reports r ON r.station_id = s.station_id
LEFT JOIN incident_reports i ON i.report_id = r.report_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
   OR r.report_id IS NULL
GROUP BY s.station_id, s.station_name, s.station_code
ORDER BY total_incidents DESC;

-- 4. INCIDENT REPORTS WITH EQUIPMENT USED
SELECT
    r.report_id,
    r.title,
    i.incident_location,
    er.equipment_type,
    er.equipment_status,
    er.equipment_description,
    s.station_name,
    r.created_at
FROM reports r
LEFT JOIN incident_reports i ON i.report_id = r.report_id
LEFT JOIN equipment_reports er ON er.report_id = r.report_id
LEFT JOIN stations s ON s.station_id = r.station_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
ORDER BY r.created_at DESC, r.report_id;

-- 5. INCIDENT REPORTS WITH ATTACHMENTS
SELECT
    r.report_id,
    r.title,
    i.incident_location,
    s.station_name,
    ra.attachment_id,
    ra.file_name,
    ra.file_path,
    ra.file_size_bytes,
    ra.uploaded_at,
    r.created_at
FROM reports r
LEFT JOIN incident_reports i ON i.report_id = r.report_id
LEFT JOIN stations s ON s.station_id = r.station_id
LEFT JOIN report_attachments ra ON ra.report_id = r.report_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
   AND ra.attachment_id IS NOT NULL
ORDER BY r.created_at DESC, ra.uploaded_at DESC;

-- 6. INCIDENT REPORTS - RECENT (Last 30 days)
SELECT
    r.report_id,
    r.title,
    i.incident_location,
    s.station_name,
    i.incident_status,
    DATEDIFF(NOW(), r.created_at) AS days_ago,
    COUNT(DISTINCT er.equipment_report_id) AS equipment_count,
    COUNT(DISTINCT ra.attachment_id) AS attachment_count
FROM reports r
LEFT JOIN incident_reports i ON i.report_id = r.report_id
LEFT JOIN stations s ON s.station_id = r.station_id
LEFT JOIN equipment_reports er ON er.report_id = r.report_id
LEFT JOIN report_attachments ra ON ra.report_id = r.report_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
  AND r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY r.report_id
ORDER BY r.created_at DESC;

-- 7. INCIDENT REPORTS - OPEN/UNRESOLVED
SELECT
    r.report_id,
    r.title,
    i.incident_location,
    s.station_name,
    i.incident_status,
    ist.stage_name,
    TIME_FORMAT(TIMEDIFF(NOW(), r.created_at), '%H:%i') AS elapsed_time,
    COUNT(DISTINCT er.equipment_report_id) AS equipment_deployed
FROM reports r
LEFT JOIN incident_reports i ON i.report_id = r.report_id
LEFT JOIN stations s ON s.station_id = r.station_id
LEFT JOIN incident_report_stage ist ON ist.incident_report_stage_id = i.incident_report_stage_id
LEFT JOIN equipment_reports er ON er.report_id = r.report_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
  AND i.incident_status IN ('newly_reported', 'under_investigation', 'active_response')
GROUP BY r.report_id
ORDER BY r.created_at ASC;

-- 8. INCIDENT STATISTICS SUMMARY
SELECT
    COUNT(DISTINCT r.report_id) AS total_reports,
    COUNT(DISTINCT s.station_id) AS stations_involved,
    COUNT(DISTINCT CASE WHEN i.incident_status = 'newly_reported' THEN r.report_id END) AS new_reports,
    COUNT(DISTINCT CASE WHEN i.incident_status = 'under_investigation' THEN r.report_id END) AS investigating,
    COUNT(DISTINCT CASE WHEN i.incident_status = 'active_response' THEN r.report_id END) AS active_response,
    COUNT(DISTINCT CASE WHEN i.incident_status = 'closed' THEN r.report_id END) AS closed_reports,
    COUNT(DISTINCT er.equipment_report_id) AS total_equipment_used,
    COUNT(DISTINCT ra.attachment_id) AS total_attachments,
    AVG(DATEDIFF(NOW(), r.created_at)) AS avg_age_days,
    MIN(r.created_at) AS oldest_report,
    MAX(r.created_at) AS newest_report
FROM reports r
LEFT JOIN incident_reports i ON i.report_id = r.report_id
LEFT JOIN stations s ON s.station_id = r.station_id
LEFT JOIN equipment_reports er ON er.report_id = r.report_id
LEFT JOIN report_attachments ra ON ra.report_id = r.report_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report');

-- 9. EQUIPMENT USAGE IN INCIDENTS
SELECT
    er.equipment_type,
    COUNT(*) AS usage_count,
    COUNT(CASE WHEN er.equipment_status = 'deployed' THEN 1 END) AS deployed,
    COUNT(CASE WHEN er.equipment_status = 'en_route' THEN 1 END) AS en_route,
    COUNT(CASE WHEN er.equipment_status = 'standby' THEN 1 END) AS standby,
    GROUP_CONCAT(DISTINCT s.station_name SEPARATOR ', ') AS used_by_stations
FROM equipment_reports er
LEFT JOIN reports r ON r.report_id = er.report_id
LEFT JOIN stations s ON s.station_id = er.station_id
GROUP BY er.equipment_type
ORDER BY usage_count DESC;

-- 10. INCIDENT LOCATIONS - MOST AFFECTED AREAS
SELECT
    i.incident_location,
    COUNT(r.report_id) AS incident_count,
    s.station_name,
    GROUP_CONCAT(r.title SEPARATOR ' | ') AS incident_titles
FROM reports r
LEFT JOIN incident_reports i ON i.report_id = r.report_id
LEFT JOIN stations s ON s.station_id = r.station_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
GROUP BY i.incident_location, s.station_id
ORDER BY incident_count DESC
LIMIT 20;

-- 11. INCIDENT REPORTS WITH CHANGE LOGS
SELECT
    r.report_id,
    r.title,
    s.station_name,
    iruc.change_type,
    iruc.old_value,
    iruc.new_value,
    iruc.changed_at,
    iruc.changed_by
FROM reports r
LEFT JOIN incident_reports i ON i.report_id = r.report_id
LEFT JOIN stations s ON s.station_id = r.station_id
LEFT JOIN incident_report_change_logs iruc ON iruc.report_id = r.report_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
ORDER BY r.created_at DESC, iruc.changed_at DESC
LIMIT 100;

-- 12. INCIDENT RESPONSE TIME ANALYSIS
SELECT
    s.station_name,
    COUNT(r.report_id) AS total_incidents,
    AVG(HOUR(TIMEDIFF(r.created_at, i.created_at))) AS avg_response_hours,
    MIN(HOUR(TIMEDIFF(r.created_at, i.created_at))) AS fastest_response_hours,
    MAX(HOUR(TIMEDIFF(r.created_at, i.created_at))) AS slowest_response_hours
FROM reports r
LEFT JOIN incident_reports i ON i.report_id = r.report_id AND i.created_at > r.created_at
LEFT JOIN stations s ON s.station_id = r.station_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
GROUP BY s.station_id, s.station_name
ORDER BY total_incidents DESC;

-- 13. INCIDENT DISPATCH DETAILS
SELECT
    r.report_id,
    r.title,
    i.incident_location,
    s_origin.station_name AS origin_station,
    s_dispatch.station_name AS dispatch_station,
    ird.dispatch_count,
    r.created_at
FROM reports r
LEFT JOIN incident_reports i ON i.report_id = r.report_id
LEFT JOIN stations s_origin ON s_origin.station_id = r.station_id
LEFT JOIN incident_report_dispatch_stations ird ON ird.report_id = r.report_id
LEFT JOIN stations s_dispatch ON s_dispatch.station_id = ird.station_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
ORDER BY r.created_at DESC;

-- 14. INCIDENT REPORTS WITH DETAILED STAGE TRACKING
SELECT
    r.report_id,
    r.title,
    i.incident_location,
    s.station_name,
    ist.stage_name,
    ist.stage_sequence,
    i.incident_status,
    iru.status_update,
    iru.updated_at,
    TIMESTAMPDIFF(HOUR, r.created_at, iru.updated_at) AS hours_since_report
FROM reports r
LEFT JOIN incident_reports i ON i.report_id = r.report_id
LEFT JOIN stations s ON s.station_id = r.station_id
LEFT JOIN incident_report_stage ist ON ist.incident_report_stage_id = i.incident_report_stage_id
LEFT JOIN incident_report_updates iru ON iru.report_id = r.report_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
ORDER BY r.report_id DESC, iru.updated_at DESC;

-- 15. MONTHLY INCIDENT REPORT TREND
SELECT
    DATE_FORMAT(r.created_at, '%Y-%m') AS month,
    COUNT(*) AS incident_count,
    COUNT(CASE WHEN i.incident_status = 'closed' THEN 1 END) AS resolved,
    COUNT(CASE WHEN i.incident_status IN ('newly_reported', 'under_investigation', 'active_response') THEN 1 END) AS pending,
    ROUND(COUNT(CASE WHEN i.incident_status = 'closed' THEN 1 END) / COUNT(*) * 100, 2) AS resolution_rate
FROM reports r
LEFT JOIN incident_reports i ON i.report_id = r.report_id
WHERE EXISTS (SELECT 1 FROM report_type rt WHERE rt.report_type_id = r.report_type_id AND rt.type_name = 'incident_report')
GROUP BY DATE_FORMAT(r.created_at, '%Y-%m')
ORDER BY month DESC;
