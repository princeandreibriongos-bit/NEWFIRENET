-- Demo Cloudinary Files Table (for development/demo purposes)
USE newfirenet;

CREATE TABLE IF NOT EXISTS demo_cloudinary_files (
    file_id INT PRIMARY KEY AUTO_INCREMENT,
    station_id INT NOT NULL,
    folder_name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    public_id VARCHAR(255) NOT NULL UNIQUE,
    secure_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    resource_type VARCHAR(50) DEFAULT 'image',
    bytes INT DEFAULT 0,
    format VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_demo_cloudinary_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    INDEX idx_demo_cloudinary_station (station_id),
    INDEX idx_demo_cloudinary_folder (station_id, folder_name)
);

-- Sample demo data for MCFS station
INSERT IGNORE INTO demo_cloudinary_files (station_id, folder_name, filename, public_id, secure_url, file_type, resource_type, bytes, format) VALUES
(1, 'firenet/orgmail/MCFS', 'incident_report_001.pdf', 'firenet/orgmail/MCFS/incident_001', 'https://res.cloudinary.com/dq80tx04u/image/upload/v1/firenet/orgmail/MCFS/incident_001.pdf', 'application/pdf', 'raw', 245000, 'pdf'),
(1, 'firenet/orgmail/MCFS', 'station_photo.jpg', 'firenet/orgmail/MCFS/station_photo', 'https://res.cloudinary.com/dq80tx04u/image/upload/v1/firenet/orgmail/MCFS/station_photo.jpg', 'image/jpeg', 'image', 512000, 'jpg'),
(1, 'firenet/orgmail/MCFS', 'equipment_inventory.xlsx', 'firenet/orgmail/MCFS/equipment_inventory', 'https://res.cloudinary.com/dq80tx04u/image/upload/v1/firenet/orgmail/MCFS/equipment_inventory.xlsx', 'application/vnd.ms-excel', 'raw', 128000, 'xlsx'),
(1, 'firenet/orgmail/MCFS', 'incident_scene_01.jpg', 'firenet/orgmail/MCFS/scene_01', 'https://res.cloudinary.com/dq80tx04u/image/upload/v1/firenet/orgmail/MCFS/scene_01.jpg', 'image/jpeg', 'image', 892000, 'jpg'),
(1, 'firenet/orgmail/MCFS', 'incident_scene_02.jpg', 'firenet/orgmail/MCFS/scene_02', 'https://res.cloudinary.com/dq80tx04u/image/upload/v1/firenet/orgmail/MCFS/scene_02.jpg', 'image/jpeg', 'image', 756000, 'jpg'),
(1, 'firenet/orgmail/MCFS', 'incident_scene_03.jpg', 'firenet/orgmail/MCFS/scene_03', 'https://res.cloudinary.com/dq80tx04u/image/upload/v1/firenet/orgmail/MCFS/scene_03.jpg', 'image/jpeg', 'image', 634000, 'jpg');

-- Sample data for other stations (Ayala, etc.)
INSERT IGNORE INTO demo_cloudinary_files (station_id, folder_name, filename, public_id, secure_url, file_type, resource_type, bytes, format) VALUES
(2, 'firenet/orgmail/AYALA', 'incident_report_002.pdf', 'firenet/orgmail/AYALA/incident_002', 'https://res.cloudinary.com/dq80tx04u/image/upload/v1/firenet/orgmail/AYALA/incident_002.pdf', 'application/pdf', 'raw', 287000, 'pdf'),
(2, 'firenet/orgmail/AYALA', 'dispatch_log.txt', 'firenet/orgmail/AYALA/dispatch_log', 'https://res.cloudinary.com/dq80tx04u/image/upload/v1/firenet/orgmail/AYALA/dispatch_log.txt', 'text/plain', 'raw', 45000, 'txt'),
(2, 'firenet/orgmail/AYALA', 'station_photo.jpg', 'firenet/orgmail/AYALA/station_photo', 'https://res.cloudinary.com/dq80tx04u/image/upload/v1/firenet/orgmail/AYALA/station_photo.jpg', 'image/jpeg', 'image', 623000, 'jpg'),
(2, 'firenet/orgmail/AYALA', 'drill_exercise.jpg', 'firenet/orgmail/AYALA/drill_exercise', 'https://res.cloudinary.com/dq80tx04u/image/upload/v1/firenet/orgmail/AYALA/drill_exercise.jpg', 'image/jpeg', 'image', 445000, 'jpg');
