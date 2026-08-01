-- =============================================================================
-- FireNet: keep original 5 stations only (by station_code)
--
-- KEEPS:
--   MCFS  New Makati Central Fire Station
--   LPS   La Paz Sub Station
--   PDPSS Pio Del Pilar Sub Station
--   PSS   Poblacion Sub Station
--   ASSS  Ayala Satellite Sub Station
--
-- WARNING: Permanently deletes every other station and cascaded users/reports/mail.
--          Cloud folders for deleted codes (e.g. firenet/reports/TS) must be
--          removed manually in Cloudflare R2 if present.
-- =============================================================================

START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;

-- Preview helper (optional):
-- SELECT station_id, station_code, station_name FROM stations
-- WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS');

DELETE uw
FROM user_warnings uw
INNER JOIN users u ON u.user_id = uw.user_id OR u.user_id = uw.sender_user_id
WHERE UPPER((SELECT s.station_code FROM stations s WHERE s.station_id = u.station_id LIMIT 1))
      NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS');

DELETE FROM user_settings
WHERE user_id IN (
  SELECT user_id FROM (
    SELECT u.user_id
    FROM users u
    JOIN stations s ON s.station_id = u.station_id
    WHERE UPPER(s.station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
  ) t
);

DELETE FROM user_profile_photos
WHERE user_id IN (
  SELECT user_id FROM (
    SELECT u.user_id
    FROM users u
    JOIN stations s ON s.station_id = u.station_id
    WHERE UPPER(s.station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
  ) t
);

DELETE FROM station_mail_operational_audit
WHERE actor_station_id IN (
  SELECT station_id FROM stations
  WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

DELETE FROM station_mail_request_routes
WHERE origin_station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
) OR target_station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

DELETE FROM demo_cloudinary_files
WHERE station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

DELETE FROM calendar_events
WHERE station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

DELETE FROM station_aor_zones
WHERE station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

DELETE FROM incident_report_dispatch_stations
WHERE station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

DELETE FROM report_cloud_backups
WHERE station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

UPDATE incident_reports
SET dispatched_station_id = NULL
WHERE dispatched_station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

UPDATE incident_reports
SET station_id = NULL
WHERE station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

DELETE FROM reports
WHERE station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

DELETE FROM station_mail_recipients
WHERE recipient_station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

DELETE FROM station_mail_messages
WHERE sender_station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

DELETE FROM users
WHERE station_id IN (
  SELECT station_id FROM stations WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS')
);

DELETE FROM stations
WHERE UPPER(station_code) NOT IN ('MCFS','LPS','PDPSS','PSS','ASSS');

ALTER TABLE stations AUTO_INCREMENT = 6;

SET FOREIGN_KEY_CHECKS = 1;

COMMIT;

-- Verify
SELECT station_id, station_code, station_name, status
FROM stations
ORDER BY station_id;
