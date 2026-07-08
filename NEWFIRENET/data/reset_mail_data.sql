-- =============================================================================
-- FireNet: reset ALL mail data only (operational + station mail)
-- Database: newfirenet
--
-- Uses DELETE + AUTO_INCREMENT reset (TRUNCATE fails on FK-linked tables in MySQL).
-- Does NOT touch users, stations, reports, incidents, or any other data.
--
-- phpMyAdmin: select "newfirenet" → SQL tab → paste → Go
--
-- Optional: delete local files in NEWFIRENET/uploads/mails/
-- =============================================================================

USE newfirenet;

SET FOREIGN_KEY_CHECKS = 0;

-- Child tables first, then parents
DELETE FROM station_mail_operational_audit;
DELETE FROM station_mail_request_routes;
DELETE FROM station_mail_attachments;
DELETE FROM station_mail_recipients;
DELETE FROM station_mail_messages;
DELETE FROM station_mail_threads;

ALTER TABLE station_mail_operational_audit AUTO_INCREMENT = 1;
ALTER TABLE station_mail_request_routes AUTO_INCREMENT = 1;
ALTER TABLE station_mail_attachments AUTO_INCREMENT = 1;
ALTER TABLE station_mail_recipients AUTO_INCREMENT = 1;
ALTER TABLE station_mail_messages AUTO_INCREMENT = 1;
ALTER TABLE station_mail_threads AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Verify (all counts should be 0)
SELECT 'station_mail_threads' AS tbl, COUNT(*) AS rows FROM station_mail_threads
UNION ALL SELECT 'station_mail_messages', COUNT(*) FROM station_mail_messages
UNION ALL SELECT 'station_mail_recipients', COUNT(*) FROM station_mail_recipients
UNION ALL SELECT 'station_mail_attachments', COUNT(*) FROM station_mail_attachments
UNION ALL SELECT 'station_mail_request_routes', COUNT(*) FROM station_mail_request_routes
UNION ALL SELECT 'station_mail_operational_audit', COUNT(*) FROM station_mail_operational_audit;
