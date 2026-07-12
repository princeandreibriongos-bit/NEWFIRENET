CREATE DATABASE IF NOT EXISTS newfirenet
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE newfirenet;

CREATE TABLE IF NOT EXISTS roles (
	role_id INT PRIMARY KEY AUTO_INCREMENT,
	role_name VARCHAR(50) NOT NULL UNIQUE,
	description VARCHAR(255)
);

INSERT INTO roles (role_name, description) VALUES
('user', 'Regular system user'),
('admin', 'Branch administrator'),
('superadmin', 'System super administrator')
ON DUPLICATE KEY UPDATE
	description = VALUES(description);

CREATE TABLE IF NOT EXISTS positions (
	position_id INT PRIMARY KEY AUTO_INCREMENT,
	position_code VARCHAR(50) NOT NULL UNIQUE,
	position_name VARCHAR(120) NOT NULL,
	description VARCHAR(255)
);

INSERT INTO positions (position_code, position_name, description) VALUES
('position1', 'Position 1', 'Receives fire incident calls and records initial call intake details'),
('position2', 'Position 2', 'Supports incident operations and reporting based on assigned duties')
ON DUPLICATE KEY UPDATE
	position_name = VALUES(position_name),
	description = VALUES(description);

CREATE TABLE IF NOT EXISTS stations (
	station_id INT PRIMARY KEY AUTO_INCREMENT,
	station_name VARCHAR(120) NOT NULL UNIQUE,
	station_code VARCHAR(20) NOT NULL UNIQUE,
	location VARCHAR(255),
	latitude DECIMAL(10,8) NULL,
	longitude DECIMAL(11,8) NULL,
	status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
	user_id INT PRIMARY KEY AUTO_INCREMENT,
	station_id INT NOT NULL,
	username VARCHAR(50) NOT NULL,
	password VARCHAR(255) NOT NULL,
	email VARCHAR(100) NOT NULL,
	role_id INT NOT NULL,
	position_id INT,
	status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_users_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
	CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id),
	CONSTRAINT fk_users_position FOREIGN KEY (position_id) REFERENCES positions(position_id) ON DELETE SET NULL,
	UNIQUE KEY unique_username_station (username, station_id),
	UNIQUE KEY unique_email_station (email, station_id)
);

CREATE TABLE IF NOT EXISTS password_reset_otps (
	reset_id INT PRIMARY KEY AUTO_INCREMENT,
	user_id INT NOT NULL,
	email VARCHAR(100) NOT NULL,
	otp_hash VARCHAR(255) NOT NULL,
	reset_token_hash VARCHAR(255) NULL,
	attempts INT NOT NULL DEFAULT 0,
	expires_at DATETIME NOT NULL,
	verified_at DATETIME NULL,
	used_at DATETIME NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	INDEX idx_password_reset_email (email),
	INDEX idx_password_reset_user (user_id),
	INDEX idx_password_reset_expires (expires_at),
	CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_profile_photos (
	user_profile_photo_id INT PRIMARY KEY AUTO_INCREMENT,
	user_id INT NOT NULL,
	original_file_name VARCHAR(255) NOT NULL,
	stored_file_name VARCHAR(255) NOT NULL,
	file_path VARCHAR(500) NOT NULL,
	mime_type VARCHAR(120) NOT NULL,
	file_size_bytes INT UNSIGNED NOT NULL,
	uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_user_profile_photos_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
	UNIQUE KEY unique_user_profile_photo (user_id),
	UNIQUE KEY unique_profile_photo_file (stored_file_name)
);

CREATE TABLE IF NOT EXISTS user_settings (
	user_setting_id INT PRIMARY KEY AUTO_INCREMENT,
	user_id INT NOT NULL,
	compact_mode TINYINT(1) NOT NULL DEFAULT 0,
	reduce_motion TINYINT(1) NOT NULL DEFAULT 0,
	dark_mode TINYINT(1) NOT NULL DEFAULT 0,
	security_alerts TINYINT(1) NOT NULL DEFAULT 1,
	hide_sensitive TINYINT(1) NOT NULL DEFAULT 0,
	auto_logout_minutes INT NOT NULL DEFAULT 30,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
	UNIQUE KEY unique_user_settings (user_id)
);

SET @stations_latitude_exists_preseed := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'stations'
		AND COLUMN_NAME = 'latitude'
);

SET @sql_add_stations_latitude_preseed := IF(
	@stations_latitude_exists_preseed = 0,
	'ALTER TABLE stations ADD COLUMN latitude DECIMAL(10,8) NULL AFTER location',
	'SELECT 1'
);
PREPARE stmt_add_stations_latitude_preseed FROM @sql_add_stations_latitude_preseed;
EXECUTE stmt_add_stations_latitude_preseed;
DEALLOCATE PREPARE stmt_add_stations_latitude_preseed;

SET @stations_longitude_exists_preseed := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'stations'
		AND COLUMN_NAME = 'longitude'
);

SET @sql_add_stations_longitude_preseed := IF(
	@stations_longitude_exists_preseed = 0,
	'ALTER TABLE stations ADD COLUMN longitude DECIMAL(11,8) NULL AFTER latitude',
	'SELECT 1'
);
PREPARE stmt_add_stations_longitude_preseed FROM @sql_add_stations_longitude_preseed;
EXECUTE stmt_add_stations_longitude_preseed;
DEALLOCATE PREPARE stmt_add_stations_longitude_preseed;

INSERT INTO stations (station_id, station_name, station_code, location, latitude, longitude, status) VALUES
(1, 'New Makati Central Fire Station', 'MCFS', 'Senator Gil J. Puyat Avenue, San Antonio, Makati City', 14.55844500, 121.00818000, 'active'),
(2, 'La Paz Sub Station', 'LPS', 'Archimedes Street, La Paz, Makati City, Metro Manila', 14.56834460, 121.00730770, 'active'),
(3, 'Pio Del Pilar Sub Station', 'PDPSS', 'Batangas Street corner Arnaiz Street, Pio Del Pilar, Makati City, Metro Manila', 14.55097860, 121.00964460, 'active'),
(4, 'Poblacion Sub Station', 'PSS', 'J. P. Rizal St, Poblacion, Makati City, Metro Manila', 14.56719750, 121.03310870, 'active'),
(5, 'Ayala Satellite Sub Station', 'ASSS', 'Park Square, East Street, Makati City, Metro Manila', 14.54910280, 121.02549580, 'active')
ON DUPLICATE KEY UPDATE
	station_name = VALUES(station_name),
	station_code = VALUES(station_code),
	location = VALUES(location),
	latitude = VALUES(latitude),
	longitude = VALUES(longitude),
	status = VALUES(status);

CREATE TABLE IF NOT EXISTS station_aor_zones (
	station_aor_zone_id INT PRIMARY KEY AUTO_INCREMENT,
	station_id INT NOT NULL,
	zone_name VARCHAR(150) NOT NULL,
	shape_type ENUM('circle', 'polygon') NOT NULL DEFAULT 'circle',
	center_latitude DECIMAL(10,8) NULL,
	center_longitude DECIMAL(11,8) NULL,
	radius_km DECIMAL(6,3) NULL,
	polygon_points_json LONGTEXT,
	is_active TINYINT(1) NOT NULL DEFAULT 1,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_station_aor_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
	UNIQUE KEY unique_station_aor_zone (station_id)
);

CREATE TABLE IF NOT EXISTS fire_hydrants (
	hydrant_id INT PRIMARY KEY AUTO_INCREMENT,
	hydrant_name VARCHAR(150) NOT NULL,
	barangay VARCHAR(120) NULL,
	address VARCHAR(255) NULL,
	latitude DECIMAL(10,8) NOT NULL,
	longitude DECIMAL(11,8) NOT NULL,
	pressure_psi INT NULL,
	status ENUM('active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active',
	last_inspected_at DATE NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	INDEX idx_fire_hydrants_status (status),
	INDEX idx_fire_hydrants_location (latitude, longitude)
);

INSERT INTO station_aor_zones (station_id, zone_name, shape_type, center_latitude, center_longitude, radius_km, is_active)
SELECT s.station_id, CONCAT(s.station_name, ' AOR'), 'circle', s.latitude, s.longitude, 2.500, 1
FROM stations s
ON DUPLICATE KEY UPDATE
	zone_name = VALUES(zone_name),
	shape_type = VALUES(shape_type),
	center_latitude = VALUES(center_latitude),
	center_longitude = VALUES(center_longitude),
	radius_km = VALUES(radius_km),
	is_active = VALUES(is_active);

CREATE TABLE IF NOT EXISTS geocode_cache (
	geocode_cache_id INT PRIMARY KEY AUTO_INCREMENT,
	query_key VARCHAR(255) NOT NULL,
	query_text VARCHAR(500) NOT NULL,
	latitude DECIMAL(10,8) NOT NULL,
	longitude DECIMAL(11,8) NOT NULL,
	display_name VARCHAR(500),
	source VARCHAR(50) NOT NULL DEFAULT 'nominatim',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY unique_geocode_query_key (query_key)
);

CREATE TABLE IF NOT EXISTS report_type (
	report_type_id INT PRIMARY KEY AUTO_INCREMENT,
	type_name VARCHAR(50) NOT NULL UNIQUE,
	description VARCHAR(255)
);

INSERT INTO report_type (type_name, description) VALUES
('incident_report', 'Report for fire incidents and emergencies'),
('equipment_report', 'Report for equipment maintenance and issues')
ON DUPLICATE KEY UPDATE
	description = VALUES(description);

CREATE TABLE IF NOT EXISTS reports (
	report_id INT PRIMARY KEY AUTO_INCREMENT,
	station_id INT NOT NULL,
	report_type_id INT NOT NULL,
	title VARCHAR(255) NULL,
	description LONGTEXT,
	created_by INT,
	status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_reports_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
	CONSTRAINT fk_reports_type FOREIGN KEY (report_type_id) REFERENCES report_type(report_type_id),
	CONSTRAINT fk_reports_user FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS report_attachments (
	attachment_id INT PRIMARY KEY AUTO_INCREMENT,
	report_id INT NOT NULL,
	file_name VARCHAR(255) NOT NULL,
	file_type VARCHAR(50),
	file_size INT,
	file_path VARCHAR(500) NOT NULL,
	uploaded_by INT,
	uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_attachments_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
	CONSTRAINT fk_attachments_user FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS incident_report_stage (
	incident_report_stage_id INT PRIMARY KEY AUTO_INCREMENT,
	stage_code VARCHAR(50) NOT NULL UNIQUE,
	stage_name VARCHAR(120) NOT NULL,
	description VARCHAR(255)
);

INSERT INTO incident_report_stage (stage_code, stage_name, description) VALUES
('call_intake', 'Call Intake Report', 'Initial report recorded when call is received'),
('during_incident', 'During Incident Report', 'Operational updates while response is ongoing'),
('after_incident', 'After Incident Report', 'Final report after operations are completed')
ON DUPLICATE KEY UPDATE
	stage_name = VALUES(stage_name),
	description = VALUES(description);

CREATE TABLE IF NOT EXISTS incident_reports (
	incident_report_id INT PRIMARY KEY AUTO_INCREMENT,
	report_id INT NOT NULL,
	incident_case_id INT NULL,
	station_id INT NULL,
	incident_report_stage_id INT NOT NULL,
	received_by_user_id INT,
	updated_by_user_id INT,
	caller_name VARCHAR(120),
	caller_contact VARCHAR(50),
	incident_location VARCHAR(255) NULL,
	latitude DECIMAL(10,8) NULL,
	longitude DECIMAL(11,8) NULL,
	geocode_status ENUM('resolved', 'failed', 'skipped') NOT NULL DEFAULT 'skipped',
	assignment_method ENUM('aor', 'nearest', 'manual', 'pending') NULL,
	assignment_distance_km DECIMAL(8,3) NULL,
	alarm_level TINYINT UNSIGNED,
	incident_status ENUM('ongoing', 'under_control', 'fire_out') DEFAULT NULL,
	incident_started_at DATETIME,
	incident_finished_at DATETIME,
	dispatched_station_id INT,
	incident_commander_name VARCHAR(120),
	remarks LONGTEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY unique_incident_report_reference (report_id),
	CONSTRAINT fk_incident_reports_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
	CONSTRAINT fk_incident_reports_stage FOREIGN KEY (incident_report_stage_id) REFERENCES incident_report_stage(incident_report_stage_id),
	CONSTRAINT fk_incident_reports_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
	CONSTRAINT fk_incident_reports_receiver FOREIGN KEY (received_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
	CONSTRAINT fk_incident_reports_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
	CONSTRAINT fk_incident_reports_dispatch_station FOREIGN KEY (dispatched_station_id) REFERENCES stations(station_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS equipment_reports (
	equipment_report_id INT PRIMARY KEY AUTO_INCREMENT,
	report_id INT NOT NULL,
	equipment_name VARCHAR(120) NOT NULL,
	equipment_category VARCHAR(50) NOT NULL,
	issue_type VARCHAR(50) NOT NULL,
	urgency ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
	last_service_date DATE NULL,
	operational_status ENUM('operational', 'limited', 'out_of_service') NOT NULL DEFAULT 'limited',
	action_taken LONGTEXT,
	recommendation LONGTEXT,
	issue_summary LONGTEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY unique_equipment_report_reference (report_id),
	CONSTRAINT fk_equipment_reports_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
);

SET @equipment_reports_location_col_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'equipment_reports'
		AND COLUMN_NAME = 'equipment_location'
);

SET @sql_drop_equipment_reports_location_col := IF(
	@equipment_reports_location_col_exists = 1,
	'ALTER TABLE equipment_reports DROP COLUMN equipment_location',
	'SELECT 1'
);
PREPARE stmt_drop_equipment_reports_location_col FROM @sql_drop_equipment_reports_location_col;
EXECUTE stmt_drop_equipment_reports_location_col;
DEALLOCATE PREPARE stmt_drop_equipment_reports_location_col;

CREATE TABLE IF NOT EXISTS incident_report_updates (
	incident_report_update_id INT PRIMARY KEY AUTO_INCREMENT,
	incident_report_id INT NOT NULL,
	alarm_level TINYINT UNSIGNED NOT NULL,
	incident_status ENUM('ongoing', 'under_control', 'fire_out') NULL,
	recorded_by_user_id INT,
	recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	notes LONGTEXT,
	CONSTRAINT fk_incident_updates_report FOREIGN KEY (incident_report_id) REFERENCES incident_reports(incident_report_id) ON DELETE CASCADE,
	CONSTRAINT fk_incident_updates_user FOREIGN KEY (recorded_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
	CONSTRAINT chk_incident_updates_alarm_level CHECK (alarm_level BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS incident_report_change_logs (
	incident_report_change_log_id INT PRIMARY KEY AUTO_INCREMENT,
	incident_report_id INT NOT NULL,
	from_alarm_level TINYINT UNSIGNED,
	to_alarm_level TINYINT UNSIGNED NOT NULL,
	from_incident_status ENUM('ongoing', 'under_control', 'fire_out') NULL,
	to_incident_status ENUM('ongoing', 'under_control', 'fire_out') NULL,
	changed_by_user_id INT,
	changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	notes LONGTEXT,
	CONSTRAINT fk_incident_change_logs_report FOREIGN KEY (incident_report_id) REFERENCES incident_reports(incident_report_id) ON DELETE CASCADE,
	CONSTRAINT fk_incident_change_logs_user FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
	CONSTRAINT chk_incident_change_logs_alarm_level CHECK (to_alarm_level BETWEEN 1 AND 5),
	CONSTRAINT chk_incident_change_logs_from_alarm_level CHECK (from_alarm_level IS NULL OR from_alarm_level BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS incident_report_dispatch_stations (
	incident_report_dispatch_station_id INT PRIMARY KEY AUTO_INCREMENT,
	incident_report_id INT NOT NULL,
	station_id INT NOT NULL,
	dispatch_order TINYINT UNSIGNED NOT NULL,
	assignment_method ENUM('aor', 'nearest', 'manual', 'pending') NOT NULL DEFAULT 'nearest',
	assignment_distance_km DECIMAL(8,3) NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE KEY unique_incident_dispatch_order (incident_report_id, dispatch_order),
	UNIQUE KEY unique_incident_dispatch_station (incident_report_id, station_id),
	CONSTRAINT fk_incident_dispatch_report FOREIGN KEY (incident_report_id) REFERENCES incident_reports(incident_report_id) ON DELETE CASCADE,
	CONSTRAINT fk_incident_dispatch_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE
);

-- Migration block for existing databases.
SET @users_position_col_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'users'
		AND COLUMN_NAME = 'position_id'
);

SET @sql_add_users_position_col := IF(
	@users_position_col_exists = 0,
	'ALTER TABLE users ADD COLUMN position_id INT NULL AFTER role_id',
	'SELECT 1'
);
PREPARE stmt_add_users_position_col FROM @sql_add_users_position_col;
EXECUTE stmt_add_users_position_col;
DEALLOCATE PREPARE stmt_add_users_position_col;

SET @users_position_fk_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLE_CONSTRAINTS
	WHERE CONSTRAINT_SCHEMA = DATABASE()
		AND TABLE_NAME = 'users'
		AND CONSTRAINT_NAME = 'fk_users_position'
		AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql_add_users_position_fk := IF(
	@users_position_fk_exists = 0,
	'ALTER TABLE users ADD CONSTRAINT fk_users_position FOREIGN KEY (position_id) REFERENCES positions(position_id) ON DELETE SET NULL',
	'SELECT 1'
);
PREPARE stmt_add_users_position_fk FROM @sql_add_users_position_fk;
EXECUTE stmt_add_users_position_fk;
DEALLOCATE PREPARE stmt_add_users_position_fk;

SET @incident_dispatch_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_report_dispatch_stations'
);

SET @sql_create_incident_dispatch_table := IF(
	@incident_dispatch_table_exists = 0,
	'CREATE TABLE incident_report_dispatch_stations (
		incident_report_dispatch_station_id INT PRIMARY KEY AUTO_INCREMENT,
		incident_report_id INT NOT NULL,
		station_id INT NOT NULL,
		dispatch_order TINYINT UNSIGNED NOT NULL,
		assignment_method ENUM(''aor'', ''nearest'', ''manual'', ''pending'') NOT NULL DEFAULT ''nearest'',
		assignment_distance_km DECIMAL(8,3) NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE KEY unique_incident_dispatch_order (incident_report_id, dispatch_order),
		UNIQUE KEY unique_incident_dispatch_station (incident_report_id, station_id),
		CONSTRAINT fk_incident_dispatch_report FOREIGN KEY (incident_report_id) REFERENCES incident_reports(incident_report_id) ON DELETE CASCADE,
		CONSTRAINT fk_incident_dispatch_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE
	)',
	'SELECT 1'
);
PREPARE stmt_create_incident_dispatch_table FROM @sql_create_incident_dispatch_table;
EXECUTE stmt_create_incident_dispatch_table;
DEALLOCATE PREPARE stmt_create_incident_dispatch_table;

SET @incident_case_id_col_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_reports'
		AND COLUMN_NAME = 'incident_case_id'
);

SET @sql_add_incident_case_id_col := IF(
	@incident_case_id_col_exists = 0,
	'ALTER TABLE incident_reports ADD COLUMN incident_case_id INT NULL AFTER report_id',
	'SELECT 1'
);
PREPARE stmt_add_incident_case_id_col FROM @sql_add_incident_case_id_col;
EXECUTE stmt_add_incident_case_id_col;
DEALLOCATE PREPARE stmt_add_incident_case_id_col;

SET @incident_station_id_col_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_reports'
		AND COLUMN_NAME = 'station_id'
);

SET @sql_add_incident_station_id_col := IF(
	@incident_station_id_col_exists = 0,
	'ALTER TABLE incident_reports ADD COLUMN station_id INT NULL AFTER incident_case_id',
	'SELECT 1'
);
PREPARE stmt_add_incident_station_id_col FROM @sql_add_incident_station_id_col;
EXECUTE stmt_add_incident_station_id_col;
DEALLOCATE PREPARE stmt_add_incident_station_id_col;

SET @incident_updated_by_col_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_reports'
		AND COLUMN_NAME = 'updated_by_user_id'
);

SET @sql_add_incident_updated_by_col := IF(
	@incident_updated_by_col_exists = 0,
	'ALTER TABLE incident_reports ADD COLUMN updated_by_user_id INT NULL AFTER received_by_user_id',
	'SELECT 1'
);
PREPARE stmt_add_incident_updated_by_col FROM @sql_add_incident_updated_by_col;
EXECUTE stmt_add_incident_updated_by_col;
DEALLOCATE PREPARE stmt_add_incident_updated_by_col;

UPDATE incident_reports i
JOIN reports r ON r.report_id = i.report_id
SET i.station_id = r.station_id
WHERE i.station_id IS NULL;

UPDATE incident_reports i
JOIN reports r ON r.report_id = i.report_id
SET i.updated_by_user_id = COALESCE(i.received_by_user_id, r.created_by)
WHERE i.updated_by_user_id IS NULL;

CREATE TABLE IF NOT EXISTS calendar_events (
	calendar_event_id INT PRIMARY KEY AUTO_INCREMENT,
	station_id INT NOT NULL,
	title VARCHAR(255) NOT NULL,
	description LONGTEXT NULL,
	location VARCHAR(255) NULL,
	start_at DATETIME NOT NULL,
	end_at DATETIME NULL,
	color_theme VARCHAR(30) NOT NULL DEFAULT 'crimson',
	notify_users TINYINT(1) NOT NULL DEFAULT 0,
	notify_minutes_before INT NOT NULL DEFAULT 60,
	created_by INT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_calendar_events_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
	CONSTRAINT fk_calendar_events_user FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
	INDEX idx_calendar_events_station_start (station_id, start_at),
	INDEX idx_calendar_events_notify (station_id, notify_users, start_at)
);

SET @station_mail_threads_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'station_mail_threads'
);

SET @sql_create_station_mail_threads_table := IF(
	@station_mail_threads_table_exists = 0,
	'CREATE TABLE station_mail_threads (
		thread_id INT PRIMARY KEY AUTO_INCREMENT,
		subject VARCHAR(255) NOT NULL,
		created_by_user_id INT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		last_message_at DATETIME NULL,
		CONSTRAINT fk_station_mail_threads_user FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
		INDEX idx_station_mail_threads_last_message (last_message_at),
		INDEX idx_station_mail_threads_creator (created_by_user_id)
	)',
	'SELECT 1'
);
PREPARE stmt_create_station_mail_threads_table FROM @sql_create_station_mail_threads_table;
EXECUTE stmt_create_station_mail_threads_table;
DEALLOCATE PREPARE stmt_create_station_mail_threads_table;

SET @station_mail_messages_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'station_mail_messages'
);
SET @sql_create_station_mail_messages_table := IF(
	@station_mail_messages_table_exists = 0,
	'CREATE TABLE station_mail_messages (
		mail_id INT PRIMARY KEY AUTO_INCREMENT,
		thread_id INT NOT NULL,
		parent_mail_id INT NULL,
		sender_user_id INT NOT NULL,
		sender_station_id INT NOT NULL,
		subject VARCHAR(255) NOT NULL,
		body LONGTEXT NOT NULL,
		mail_type ENUM(''message'', ''request'', ''file_share'') NOT NULL DEFAULT ''message'',
		importance ENUM(''normal'', ''high'', ''urgent'') NOT NULL DEFAULT ''normal'',
		request_files TINYINT(1) NOT NULL DEFAULT 0,
		is_draft TINYINT(1) NOT NULL DEFAULT 0,
		sent_at DATETIME NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT fk_station_mail_messages_thread FOREIGN KEY (thread_id) REFERENCES station_mail_threads(thread_id) ON DELETE CASCADE,
		CONSTRAINT fk_station_mail_messages_parent FOREIGN KEY (parent_mail_id) REFERENCES station_mail_messages(mail_id) ON DELETE SET NULL,
		CONSTRAINT fk_station_mail_messages_sender FOREIGN KEY (sender_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
		CONSTRAINT fk_station_mail_messages_station FOREIGN KEY (sender_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
		INDEX idx_station_mail_messages_thread (thread_id, mail_id),
		INDEX idx_station_mail_messages_sender (sender_user_id, sent_at),
		INDEX idx_station_mail_messages_station (sender_station_id, sent_at),
		INDEX idx_station_mail_messages_draft (sender_user_id, is_draft, updated_at)
	)',
	'SELECT 1'
);
PREPARE stmt_create_station_mail_messages_table FROM @sql_create_station_mail_messages_table;
EXECUTE stmt_create_station_mail_messages_table;
DEALLOCATE PREPARE stmt_create_station_mail_messages_table;

SET @station_mail_recipients_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'station_mail_recipients'
);
SET @sql_create_station_mail_recipients_table := IF(
	@station_mail_recipients_table_exists = 0,
	'CREATE TABLE station_mail_recipients (
		recipient_id INT PRIMARY KEY AUTO_INCREMENT,
		mail_id INT NOT NULL,
		recipient_user_id INT NULL,
		recipient_station_id INT NULL,
		recipient_type ENUM(''user'', ''station'') NOT NULL,
		read_at DATETIME NULL,
		archived_at DATETIME NULL,
		deleted_at DATETIME NULL,
		starred_at DATETIME NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT fk_station_mail_recipients_mail FOREIGN KEY (mail_id) REFERENCES station_mail_messages(mail_id) ON DELETE CASCADE,
		CONSTRAINT fk_station_mail_recipients_user FOREIGN KEY (recipient_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
		CONSTRAINT fk_station_mail_recipients_station FOREIGN KEY (recipient_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
		UNIQUE KEY unique_station_mail_recipient (mail_id, recipient_type, recipient_user_id, recipient_station_id),
		INDEX idx_station_mail_recipients_user_folder (recipient_user_id, read_at, archived_at, deleted_at),
		INDEX idx_station_mail_recipients_station_folder (recipient_station_id, read_at, archived_at, deleted_at)
	)',
	'SELECT 1'
);
PREPARE stmt_create_station_mail_recipients_table FROM @sql_create_station_mail_recipients_table;
EXECUTE stmt_create_station_mail_recipients_table;
DEALLOCATE PREPARE stmt_create_station_mail_recipients_table;

SET @station_mail_attachments_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'station_mail_attachments'
);
SET @sql_create_station_mail_attachments_table := IF(
	@station_mail_attachments_table_exists = 0,
	'CREATE TABLE station_mail_attachments (
		attachment_id INT PRIMARY KEY AUTO_INCREMENT,
		mail_id INT NOT NULL,
		original_file_name VARCHAR(255) NOT NULL,
		stored_file_name VARCHAR(255) NOT NULL,
		file_path VARCHAR(500) NOT NULL,
		mime_type VARCHAR(120) NOT NULL,
		file_size_bytes INT UNSIGNED NOT NULL,
		uploaded_by INT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		CONSTRAINT fk_station_mail_attachments_mail FOREIGN KEY (mail_id) REFERENCES station_mail_messages(mail_id) ON DELETE CASCADE,
		CONSTRAINT fk_station_mail_attachments_user FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL,
		UNIQUE KEY unique_station_mail_attachment_file (stored_file_name),
		INDEX idx_station_mail_attachments_mail (mail_id)
	)',
	'SELECT 1'
);
PREPARE stmt_create_station_mail_attachments_table FROM @sql_create_station_mail_attachments_table;
EXECUTE stmt_create_station_mail_attachments_table;
DEALLOCATE PREPARE stmt_create_station_mail_attachments_table;

SET @user_profile_photos_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'user_profile_photos'
);

SET @sql_create_user_profile_photos_table := IF(
	@user_profile_photos_table_exists = 0,
	'CREATE TABLE user_profile_photos (
		user_profile_photo_id INT PRIMARY KEY AUTO_INCREMENT,
		user_id INT NOT NULL,
		original_file_name VARCHAR(255) NOT NULL,
		stored_file_name VARCHAR(255) NOT NULL,
		file_path VARCHAR(500) NOT NULL,
		mime_type VARCHAR(120) NOT NULL,
		file_size_bytes INT UNSIGNED NOT NULL,
		uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT fk_user_profile_photos_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
		UNIQUE KEY unique_user_profile_photo (user_id),
		UNIQUE KEY unique_profile_photo_file (stored_file_name)
	)',
	'SELECT 1'
);
PREPARE stmt_create_user_profile_photos_table FROM @sql_create_user_profile_photos_table;
EXECUTE stmt_create_user_profile_photos_table;
DEALLOCATE PREPARE stmt_create_user_profile_photos_table;

UPDATE users u
JOIN roles r ON r.role_id = u.role_id
LEFT JOIN positions p_user ON p_user.position_code = 'position1'
LEFT JOIN positions p_legacy3 ON p_legacy3.position_code = 'position3'
SET u.position_id = CASE
	WHEN r.role_name = 'user' AND (u.position_id IS NULL OR u.position_id = p_legacy3.position_id) THEN p_user.position_id
	WHEN r.role_name IN ('admin', 'superadmin') THEN NULL
	ELSE u.position_id
END
WHERE (r.role_name = 'user' AND (u.position_id IS NULL OR u.position_id = p_legacy3.position_id))
	OR r.role_name IN ('admin', 'superadmin');

DELETE FROM positions
WHERE position_code = 'position3';

INSERT INTO users (station_id, username, password, email, role_id, status)
SELECT 1, 'admin', 'admin123', 'admin@newfirenet.local', r.role_id, 'active'
FROM roles r
WHERE r.role_name = 'admin'
	AND NOT EXISTS (
		SELECT 1
		FROM users u
		WHERE u.username = 'admin' AND u.station_id = 1
	);

INSERT INTO users (station_id, username, password, email, role_id, status)
SELECT 1, 'superadmin', 'superadmin123', 'superadmin@newfirenet.local', r.role_id, 'active'
FROM roles r
WHERE r.role_name = 'superadmin'
	AND NOT EXISTS (
		SELECT 1
		FROM users u
		WHERE u.username = 'superadmin' AND u.station_id = 1
	);

INSERT INTO users (station_id, username, password, email, role_id, position_id, status)
SELECT 1, 'user1', 'user123', 'user1@newfirenet.local', r.role_id, p.position_id, 'active'
FROM roles r
JOIN positions p ON p.position_code = 'position1'
WHERE r.role_name = 'user'
	AND NOT EXISTS (
		SELECT 1
		FROM users u
		WHERE u.username = 'user1' AND u.station_id = 1
	);

UPDATE users u
JOIN roles r ON r.role_id = u.role_id
SET u.position_id = NULL
WHERE r.role_name IN ('admin', 'superadmin');

SET @incident_alarm_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_reports'
		AND COLUMN_NAME = 'alarm_level'
);

SET @sql_add_incident_alarm := IF(
	@incident_alarm_exists = 0,
	'ALTER TABLE incident_reports ADD COLUMN alarm_level TINYINT UNSIGNED NULL AFTER incident_location',
	'SELECT 1'
);
PREPARE stmt_add_incident_alarm FROM @sql_add_incident_alarm;
EXECUTE stmt_add_incident_alarm;
DEALLOCATE PREPARE stmt_add_incident_alarm;

SET @incident_status_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_reports'
		AND COLUMN_NAME = 'incident_status'
);

SET @sql_add_incident_status := IF(
	@incident_status_exists = 0,
	"ALTER TABLE incident_reports ADD COLUMN incident_status ENUM('ongoing', 'under_control', 'fire_out') NULL DEFAULT NULL AFTER alarm_level",
	'SELECT 1'
);
PREPARE stmt_add_incident_status FROM @sql_add_incident_status;
EXECUTE stmt_add_incident_status;
DEALLOCATE PREPARE stmt_add_incident_status;

SET @reports_title_nullable := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'reports'
		AND COLUMN_NAME = 'title'
		AND IS_NULLABLE = 'YES'
);

SET @sql_reports_title_nullable := IF(
	@reports_title_nullable = 0,
	'ALTER TABLE reports MODIFY COLUMN title VARCHAR(255) NULL',
	'SELECT 1'
);
PREPARE stmt_reports_title_nullable FROM @sql_reports_title_nullable;
EXECUTE stmt_reports_title_nullable;
DEALLOCATE PREPARE stmt_reports_title_nullable;

SET @incident_location_nullable := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_reports'
		AND COLUMN_NAME = 'incident_location'
		AND IS_NULLABLE = 'YES'
);

SET @sql_incident_location_nullable := IF(
	@incident_location_nullable = 0,
	'ALTER TABLE incident_reports MODIFY COLUMN incident_location VARCHAR(255) NULL',
	'SELECT 1'
);
PREPARE stmt_incident_location_nullable FROM @sql_incident_location_nullable;
EXECUTE stmt_incident_location_nullable;
DEALLOCATE PREPARE stmt_incident_location_nullable;

SET @incident_updates_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_report_updates'
);

SET @sql_create_incident_updates := IF(
	@incident_updates_table_exists = 0,
	'CREATE TABLE incident_report_updates (
		incident_report_update_id INT PRIMARY KEY AUTO_INCREMENT,
		incident_report_id INT NOT NULL,
		alarm_level TINYINT UNSIGNED NOT NULL,
		incident_status ENUM(''ongoing'', ''under_control'', ''fire_out'') NULL,
		recorded_by_user_id INT,
		recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		notes LONGTEXT,
		CONSTRAINT fk_incident_updates_report FOREIGN KEY (incident_report_id) REFERENCES incident_reports(incident_report_id) ON DELETE CASCADE,
		CONSTRAINT fk_incident_updates_user FOREIGN KEY (recorded_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
		CONSTRAINT chk_incident_updates_alarm_level CHECK (alarm_level BETWEEN 1 AND 5)
	)',
	'SELECT 1'
);
PREPARE stmt_create_incident_updates FROM @sql_create_incident_updates;
EXECUTE stmt_create_incident_updates;
DEALLOCATE PREPARE stmt_create_incident_updates;

SET @incident_change_logs_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_report_change_logs'
);

SET @sql_create_incident_change_logs := IF(
	@incident_change_logs_table_exists = 0,
	'CREATE TABLE incident_report_change_logs (
		incident_report_change_log_id INT PRIMARY KEY AUTO_INCREMENT,
		incident_report_id INT NOT NULL,
		from_alarm_level TINYINT UNSIGNED,
		to_alarm_level TINYINT UNSIGNED NOT NULL,
		from_incident_status ENUM(''ongoing'', ''under_control'', ''fire_out'') NULL,
		to_incident_status ENUM(''ongoing'', ''under_control'', ''fire_out'') NULL,
		changed_by_user_id INT,
		changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		notes LONGTEXT,
		CONSTRAINT fk_incident_change_logs_report FOREIGN KEY (incident_report_id) REFERENCES incident_reports(incident_report_id) ON DELETE CASCADE,
		CONSTRAINT fk_incident_change_logs_user FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
		CONSTRAINT chk_incident_change_logs_alarm_level CHECK (to_alarm_level BETWEEN 1 AND 5),
		CONSTRAINT chk_incident_change_logs_from_alarm_level CHECK (from_alarm_level IS NULL OR from_alarm_level BETWEEN 1 AND 5)
	)',
	'SELECT 1'
);
PREPARE stmt_create_incident_change_logs FROM @sql_create_incident_change_logs;
EXECUTE stmt_create_incident_change_logs;
DEALLOCATE PREPARE stmt_create_incident_change_logs;

SET @stations_latitude_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'stations'
		AND COLUMN_NAME = 'latitude'
);

SET @sql_add_stations_latitude := IF(
	@stations_latitude_exists = 0,
	'ALTER TABLE stations ADD COLUMN latitude DECIMAL(10,8) NULL AFTER location',
	'SELECT 1'
);
PREPARE stmt_add_stations_latitude FROM @sql_add_stations_latitude;
EXECUTE stmt_add_stations_latitude;
DEALLOCATE PREPARE stmt_add_stations_latitude;

SET @stations_longitude_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'stations'
		AND COLUMN_NAME = 'longitude'
);

SET @sql_add_stations_longitude := IF(
	@stations_longitude_exists = 0,
	'ALTER TABLE stations ADD COLUMN longitude DECIMAL(11,8) NULL AFTER latitude',
	'SELECT 1'
);
PREPARE stmt_add_stations_longitude FROM @sql_add_stations_longitude;
EXECUTE stmt_add_stations_longitude;
DEALLOCATE PREPARE stmt_add_stations_longitude;

SET @incident_latitude_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_reports'
		AND COLUMN_NAME = 'latitude'
);

SET @sql_add_incident_latitude := IF(
	@incident_latitude_exists = 0,
	'ALTER TABLE incident_reports ADD COLUMN latitude DECIMAL(10,8) NULL AFTER incident_location',
	'SELECT 1'
);
PREPARE stmt_add_incident_latitude FROM @sql_add_incident_latitude;
EXECUTE stmt_add_incident_latitude;
DEALLOCATE PREPARE stmt_add_incident_latitude;

SET @incident_longitude_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_reports'
		AND COLUMN_NAME = 'longitude'
);

SET @sql_add_incident_longitude := IF(
	@incident_longitude_exists = 0,
	'ALTER TABLE incident_reports ADD COLUMN longitude DECIMAL(11,8) NULL AFTER latitude',
	'SELECT 1'
);
PREPARE stmt_add_incident_longitude FROM @sql_add_incident_longitude;
EXECUTE stmt_add_incident_longitude;
DEALLOCATE PREPARE stmt_add_incident_longitude;

SET @incident_geocode_status_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_reports'
		AND COLUMN_NAME = 'geocode_status'
);

SET @sql_add_incident_geocode_status := IF(
	@incident_geocode_status_exists = 0,
	"ALTER TABLE incident_reports ADD COLUMN geocode_status ENUM('resolved', 'failed', 'skipped') NOT NULL DEFAULT 'skipped' AFTER longitude",
	'SELECT 1'
);
PREPARE stmt_add_incident_geocode_status FROM @sql_add_incident_geocode_status;
EXECUTE stmt_add_incident_geocode_status;
DEALLOCATE PREPARE stmt_add_incident_geocode_status;

SET @incident_assignment_method_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_reports'
		AND COLUMN_NAME = 'assignment_method'
);

SET @sql_add_incident_assignment_method := IF(
	@incident_assignment_method_exists = 0,
	"ALTER TABLE incident_reports ADD COLUMN assignment_method ENUM('aor', 'nearest', 'manual', 'pending') NULL AFTER geocode_status",
	'SELECT 1'
);
PREPARE stmt_add_incident_assignment_method FROM @sql_add_incident_assignment_method;
EXECUTE stmt_add_incident_assignment_method;
DEALLOCATE PREPARE stmt_add_incident_assignment_method;

SET @incident_assignment_distance_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'incident_reports'
		AND COLUMN_NAME = 'assignment_distance_km'
);

SET @sql_add_incident_assignment_distance := IF(
	@incident_assignment_distance_exists = 0,
	'ALTER TABLE incident_reports ADD COLUMN assignment_distance_km DECIMAL(8,3) NULL AFTER assignment_method',
	'SELECT 1'
);
PREPARE stmt_add_incident_assignment_distance FROM @sql_add_incident_assignment_distance;
EXECUTE stmt_add_incident_assignment_distance;
DEALLOCATE PREPARE stmt_add_incident_assignment_distance;

SET @station_aor_zones_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'station_aor_zones'
);

SET @sql_create_station_aor_zones := IF(
	@station_aor_zones_table_exists = 0,
	'CREATE TABLE station_aor_zones (
		station_aor_zone_id INT PRIMARY KEY AUTO_INCREMENT,
		station_id INT NOT NULL,
		zone_name VARCHAR(150) NOT NULL,
		shape_type ENUM(''circle'', ''polygon'') NOT NULL DEFAULT ''circle'',
		center_latitude DECIMAL(10,8) NULL,
		center_longitude DECIMAL(11,8) NULL,
		radius_km DECIMAL(6,3) NULL,
		polygon_points_json LONGTEXT,
		is_active TINYINT(1) NOT NULL DEFAULT 1,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT fk_station_aor_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
		UNIQUE KEY unique_station_aor_zone (station_id)
	)',
	'SELECT 1'
);
PREPARE stmt_create_station_aor_zones FROM @sql_create_station_aor_zones;
EXECUTE stmt_create_station_aor_zones;
DEALLOCATE PREPARE stmt_create_station_aor_zones;

INSERT INTO station_aor_zones (station_id, zone_name, shape_type, center_latitude, center_longitude, radius_km, is_active)
SELECT s.station_id, CONCAT(s.station_name, ' AOR'), 'circle', s.latitude, s.longitude, 2.500, 1
FROM stations s
ON DUPLICATE KEY UPDATE
	zone_name = VALUES(zone_name),
	shape_type = VALUES(shape_type),
	center_latitude = VALUES(center_latitude),
	center_longitude = VALUES(center_longitude),
	radius_km = VALUES(radius_km),
	is_active = VALUES(is_active);

SET @geocode_cache_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'geocode_cache'
);

SET @sql_create_geocode_cache := IF(
	@geocode_cache_table_exists = 0,
	'CREATE TABLE geocode_cache (
		geocode_cache_id INT PRIMARY KEY AUTO_INCREMENT,
		query_key VARCHAR(255) NOT NULL,
		query_text VARCHAR(500) NOT NULL,
		latitude DECIMAL(10,8) NOT NULL,
		longitude DECIMAL(11,8) NOT NULL,
		display_name VARCHAR(500),
		source VARCHAR(50) NOT NULL DEFAULT ''nominatim'',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		UNIQUE KEY unique_geocode_query_key (query_key)
	)',
	'SELECT 1'
);
PREPARE stmt_create_geocode_cache FROM @sql_create_geocode_cache;
EXECUTE stmt_create_geocode_cache;
DEALLOCATE PREPARE stmt_create_geocode_cache;
