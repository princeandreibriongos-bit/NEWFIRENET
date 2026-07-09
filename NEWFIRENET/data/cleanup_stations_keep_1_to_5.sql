-- =============================================================================
-- FireNet: keep original stations 1-5 only, delete test/extra stations + data
--
-- HOW TO RUN IN phpMyAdmin:
--   1. Click "newfirenet" in the LEFT sidebar (do NOT use USE newfirenet)
--   2. Open the SQL tab
--   3. Paste and run STEP A (preview) first
--   4. Paste and run STEP B (cleanup) as one block
--   5. Paste and run STEP C (verify)
--
-- KEEPS stations 1-5:
--   1 MCFS  New Makati Central Fire Station
--   2 LPS   La Paz Sub Station
--   3 PDPSS Pio Del Pilar Sub Station
--   4 PSS   Poblacion Sub Station
--   5 ASSS  Ayala Satellite Sub Station
--
-- WARNING: Permanently deletes stations > 5 and ALL accounts (users) at those
--          stations, plus their settings, photos, warnings, mail, reports, etc.
--          Back up first.
-- =============================================================================


-- =============================================================================
-- STEP A — PREVIEW (safe, read-only)
-- =============================================================================

SELECT station_id, station_name, station_code, status
FROM stations
WHERE station_id > 5
ORDER BY station_id;

SELECT u.user_id, u.username, u.email, u.station_id, s.station_name
FROM users u
LEFT JOIN stations s ON s.station_id = u.station_id
WHERE u.station_id > 5
ORDER BY u.station_id, u.user_id;


-- =============================================================================
-- STEP B — CLEANUP (run this whole block after you confirm STEP A)
-- =============================================================================

START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;

-- ----- Accounts: warnings block user delete (sender_user_id = RESTRICT) -----
DELETE uw
FROM user_warnings uw
INNER JOIN users u ON u.user_id = uw.user_id OR u.user_id = uw.sender_user_id
WHERE u.station_id > 5;

DELETE FROM user_settings
WHERE user_id IN (SELECT user_id FROM (SELECT user_id FROM users WHERE station_id > 5) t);

DELETE FROM user_profile_photos
WHERE user_id IN (SELECT user_id FROM (SELECT user_id FROM users WHERE station_id > 5) t);

-- ----- Mail audit (skip this line if table does not exist) -----
DELETE FROM station_mail_operational_audit
WHERE actor_station_id > 5;

-- ----- Mail / file routes for extra stations -----
DELETE FROM station_mail_request_routes
WHERE origin_station_id > 5 OR target_station_id > 5;

-- file_request_routes is optional (only if you installed file-request module)
-- DELETE FROM file_request_routes
-- WHERE origin_station_id > 5 OR target_station_id > 5;

-- ----- Station operational data -----
DELETE FROM demo_cloudinary_files WHERE station_id > 5;
DELETE FROM calendar_events WHERE station_id > 5;
DELETE FROM station_aor_zones WHERE station_id > 5;
DELETE FROM incident_report_dispatch_stations WHERE station_id > 5;

UPDATE incident_reports SET dispatched_station_id = NULL WHERE dispatched_station_id > 5;
UPDATE incident_reports SET station_id = NULL WHERE station_id > 5;

DELETE FROM reports WHERE station_id > 5;

DELETE FROM station_mail_recipients WHERE recipient_station_id > 5;
DELETE FROM station_mail_messages WHERE sender_station_id > 5;

-- ----- Delete ALL accounts tied to extra stations -----
DELETE FROM users WHERE station_id > 5;

-- ----- Delete extra stations -----
DELETE FROM stations WHERE station_id > 5;

-- ----- Next new station should be ID 6 -----
ALTER TABLE stations AUTO_INCREMENT = 6;

SET FOREIGN_KEY_CHECKS = 1;

COMMIT;


-- =============================================================================
-- STEP C — VERIFY (safe, read-only)
-- =============================================================================

SELECT station_id, station_name, station_code, status
FROM stations
ORDER BY station_id;

SHOW TABLE STATUS LIKE 'stations';

SELECT u.station_id, COUNT(*) AS account_count
FROM users u
GROUP BY u.station_id
ORDER BY u.station_id;
