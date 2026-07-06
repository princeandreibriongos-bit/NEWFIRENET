-- Reset incident report test data and restart ID counters at 1.
-- Safe: does NOT delete users, stations, equipment_reports rows (unless tied to deleted reports),
--       incident_report_stage, report_type, or other unrelated tables.
--
-- NOTE: For reports.report_id to truly start at 1, ALL rows in `reports` must be removed.
--       This script removes incident reports only. If you also want report_id = 1, uncomment
--       the "FULL REPORTS RESET" block at the bottom.

USE newfirenet;

START TRANSACTION;

-- 1) Incident child tables (explicit order)
DELETE FROM incident_report_dispatch_stations;
DELETE FROM incident_report_change_logs;
DELETE FROM incident_report_updates;

-- 2) Main incident detail table
DELETE FROM incident_reports;

-- 3) Parent report rows for incidents only (attachments cascade via FK)
DELETE r
FROM reports r
INNER JOIN report_type rt ON rt.report_type_id = r.report_type_id
WHERE rt.type_name = 'incident_report';

-- 4) Reset incident-related auto-increment counters
ALTER TABLE incident_report_dispatch_stations AUTO_INCREMENT = 1;
ALTER TABLE incident_report_change_logs AUTO_INCREMENT = 1;
ALTER TABLE incident_report_updates AUTO_INCREMENT = 1;
ALTER TABLE incident_reports AUTO_INCREMENT = 1;

-- 5) Reset reports counter (MySQL uses 1 only when table is empty; otherwise MAX(id)+1)
ALTER TABLE reports AUTO_INCREMENT = 1;

COMMIT;

-- Optional: FULL REPORTS RESET (uncomment to wipe ALL report types and force report_id = 1)
-- START TRANSACTION;
-- DELETE FROM incident_report_dispatch_stations;
-- DELETE FROM incident_report_change_logs;
-- DELETE FROM incident_report_updates;
-- DELETE FROM incident_reports;
-- DELETE FROM equipment_reports;
-- DELETE FROM report_attachments;
-- DELETE FROM reports;
-- ALTER TABLE incident_report_dispatch_stations AUTO_INCREMENT = 1;
-- ALTER TABLE incident_report_change_logs AUTO_INCREMENT = 1;
-- ALTER TABLE incident_report_updates AUTO_INCREMENT = 1;
-- ALTER TABLE incident_reports AUTO_INCREMENT = 1;
-- ALTER TABLE equipment_reports AUTO_INCREMENT = 1;
-- ALTER TABLE report_attachments AUTO_INCREMENT = 1;
-- ALTER TABLE reports AUTO_INCREMENT = 1;
-- COMMIT;
