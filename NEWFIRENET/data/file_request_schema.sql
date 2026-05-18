-- File Request Workflow Tables
-- Implements multi-stage approval process for inter-station file requests

USE newfirenet;

SET @file_request_routes_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'file_request_routes'
);

SET @sql_create_file_request_routes_table := IF(
	@file_request_routes_table_exists = 0,
	'CREATE TABLE file_request_routes (
		route_id INT PRIMARY KEY AUTO_INCREMENT,
		request_user_id INT NOT NULL,
		origin_station_id INT NOT NULL,
		target_station_id INT NOT NULL,
		subject VARCHAR(255) NOT NULL,
		description LONGTEXT NOT NULL,
		is_confidential TINYINT(1) NOT NULL DEFAULT 0,
		confidentiality_level ENUM(''public'', ''restricted'', ''confidential'', ''highly_confidential'') NOT NULL DEFAULT ''public'',
		status ENUM(''pending_origin_approval'', ''pending_target_approval'', ''approved'', ''rejected'', ''file_received'', ''delivered_to_user'') NOT NULL DEFAULT ''pending_origin_approval'',
		origin_coml_user_id INT NULL,
		target_coml_user_id INT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		CONSTRAINT fk_file_route_request_user FOREIGN KEY (request_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
		CONSTRAINT fk_file_route_origin_station FOREIGN KEY (origin_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
		CONSTRAINT fk_file_route_target_station FOREIGN KEY (target_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
		CONSTRAINT fk_file_route_origin_coml FOREIGN KEY (origin_coml_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
		CONSTRAINT fk_file_route_target_coml FOREIGN KEY (target_coml_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
		INDEX idx_file_route_status (status, created_at),
		INDEX idx_file_route_user (request_user_id, created_at),
		INDEX idx_file_route_stations (origin_station_id, target_station_id, status)
	)',
	'SELECT 1'
);

PREPARE stmt_create_file_request_routes FROM @sql_create_file_request_routes_table;
EXECUTE stmt_create_file_request_routes;
DEALLOCATE PREPARE stmt_create_file_request_routes;

-- Track approvals/rejections at each stage
SET @file_request_approvals_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'file_request_approvals'
);

SET @sql_create_file_request_approvals_table := IF(
	@file_request_approvals_table_exists = 0,
	'CREATE TABLE file_request_approvals (
		approval_id INT PRIMARY KEY AUTO_INCREMENT,
		route_id INT NOT NULL,
		approval_stage ENUM(''origin_review'', ''target_review'', ''file_delivery'') NOT NULL,
		approver_user_id INT NOT NULL,
		action ENUM(''approved'', ''rejected'', ''rejected_with_modification'') NOT NULL,
		notes LONGTEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		CONSTRAINT fk_file_approval_route FOREIGN KEY (route_id) REFERENCES file_request_routes(route_id) ON DELETE CASCADE,
		CONSTRAINT fk_file_approval_user FOREIGN KEY (approver_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
		INDEX idx_file_approval_route (route_id, approval_stage),
		INDEX idx_file_approval_user (approver_user_id, created_at)
	)',
	'SELECT 1'
);

PREPARE stmt_create_file_request_approvals FROM @sql_create_file_request_approvals_table;
EXECUTE stmt_create_file_request_approvals;
DEALLOCATE PREPARE stmt_create_file_request_approvals;

-- Track files in the approval workflow
SET @file_request_files_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'file_request_files'
);

SET @sql_create_file_request_files_table := IF(
	@file_request_files_table_exists = 0,
	'CREATE TABLE file_request_files (
		file_id INT PRIMARY KEY AUTO_INCREMENT,
		route_id INT NOT NULL,
		stage ENUM(''request'', ''response'') NOT NULL,
		uploaded_by_user_id INT NULL,
		original_file_name VARCHAR(255) NOT NULL,
		stored_file_name VARCHAR(255) NOT NULL,
		file_path VARCHAR(500) NOT NULL,
		mime_type VARCHAR(120) NOT NULL,
		file_size_bytes INT UNSIGNED NOT NULL,
		view_only TINYINT(1) NOT NULL DEFAULT 0,
		download_allowed TINYINT(1) NOT NULL DEFAULT 1,
		print_allowed TINYINT(1) NOT NULL DEFAULT 1,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		CONSTRAINT fk_file_request_file_route FOREIGN KEY (route_id) REFERENCES file_request_routes(route_id) ON DELETE CASCADE,
		CONSTRAINT fk_file_request_file_uploader FOREIGN KEY (uploaded_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
		UNIQUE KEY unique_file_request_file (stored_file_name),
		INDEX idx_file_request_file_route (route_id, stage)
	)',
	'SELECT 1'
);

PREPARE stmt_create_file_request_files FROM @sql_create_file_request_files_table;
EXECUTE stmt_create_file_request_files;
DEALLOCATE PREPARE stmt_create_file_request_files;

-- Access logs for confidential files
SET @file_request_access_logs_table_exists := (
	SELECT COUNT(*)
	FROM information_schema.TABLES
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'file_request_access_logs'
);

SET @sql_create_file_request_access_logs_table := IF(
	@file_request_access_logs_table_exists = 0,
	'CREATE TABLE file_request_access_logs (
		log_id INT PRIMARY KEY AUTO_INCREMENT,
		file_id INT NOT NULL,
		route_id INT NOT NULL,
		user_id INT NOT NULL,
		action ENUM(''viewed'', ''downloaded'', ''printed'', ''shared'') NOT NULL,
		ip_address VARCHAR(45),
		user_agent VARCHAR(500),
		accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		CONSTRAINT fk_file_access_log_file FOREIGN KEY (file_id) REFERENCES file_request_files(file_id) ON DELETE CASCADE,
		CONSTRAINT fk_file_access_log_route FOREIGN KEY (route_id) REFERENCES file_request_routes(route_id) ON DELETE CASCADE,
		CONSTRAINT fk_file_access_log_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
		INDEX idx_file_access_log_file (file_id),
		INDEX idx_file_access_log_route (route_id),
		INDEX idx_file_access_log_user (user_id, accessed_at)
	)',
	'SELECT 1'
);

PREPARE stmt_create_file_request_access_logs FROM @sql_create_file_request_access_logs_table;
EXECUTE stmt_create_file_request_access_logs;
DEALLOCATE PREPARE stmt_create_file_request_access_logs;

-- Add Cloudinary columns to file_request_files if they don't exist
SET @cloudinary_url_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'file_request_files'
		AND COLUMN_NAME = 'cloudinary_url'
);

SET @sql_add_cloudinary_url := IF(
	@cloudinary_url_exists = 0,
	'ALTER TABLE file_request_files ADD COLUMN cloudinary_url LONGTEXT NULL AFTER print_allowed',
	'SELECT 1'
);

PREPARE stmt_add_cloudinary_url FROM @sql_add_cloudinary_url;
EXECUTE stmt_add_cloudinary_url;
DEALLOCATE PREPARE stmt_add_cloudinary_url;

SET @cloudinary_public_id_exists := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'file_request_files'
		AND COLUMN_NAME = 'cloudinary_public_id'
);

SET @sql_add_cloudinary_public_id := IF(
	@cloudinary_public_id_exists = 0,
	'ALTER TABLE file_request_files ADD COLUMN cloudinary_public_id VARCHAR(255) NULL AFTER cloudinary_url',
	'SELECT 1'
);

PREPARE stmt_add_cloudinary_public_id FROM @sql_add_cloudinary_public_id;
EXECUTE stmt_add_cloudinary_public_id;
DEALLOCATE PREPARE stmt_add_cloudinary_public_id;
