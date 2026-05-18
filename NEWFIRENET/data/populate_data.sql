-- Comprehensive Database Population Script
-- This script populates the database with sample data without removing existing entries
-- Data includes: Transactions (100), Clients (20), Products (20+), Incident Reports, Equipment, Calendar Events, Mails

USE newfirenet;

-- ===== 1. STATIONS (if not already populated) =====
INSERT IGNORE INTO stations (station_name, station_code, location, latitude, longitude, status) VALUES
('Makati Fire Station', 'MCFS', 'Makati City', 14.5561, 121.0145, 'active'),
('Pasig Fire Station', 'PSFS', 'Pasig City', 14.5799, 121.0832, 'active'),
('Quezon City Fire Station', 'QCFS', 'Quezon City', 14.6349, 121.0394, 'active'),
('Taguig Fire Station', 'TGFS', 'Taguig City', 14.5151, 121.0358, 'active'),
('Marikina Fire Station', 'MKFS', 'Marikina City', 14.5768, 121.1062, 'active'),
('Las Pinas Fire Station', 'LPFS', 'Las Pinas City', 14.3504, 121.0145, 'active'),
('Cavite Fire Station', 'CVFS', 'Cavite Province', 14.3008, 120.8960, 'active');

-- ===== 2. CLIENTS/CUSTOMERS (20 clients) =====
-- Using users table with role_id = 1 (user/client)
INSERT IGNORE INTO users (station_id, username, password, email, role_id, position_id, status) VALUES
(1, 'client_makati_01', SHA2(CONCAT('pass_', MD5('client_makati_01')), 256), 'client01@makati.fire', 1, NULL, 'active'),
(1, 'client_makati_02', SHA2(CONCAT('pass_', MD5('client_makati_02')), 256), 'client02@makati.fire', 1, NULL, 'active'),
(1, 'client_makati_03', SHA2(CONCAT('pass_', MD5('client_makati_03')), 256), 'client03@makati.fire', 1, NULL, 'active'),
(2, 'client_pasig_01', SHA2(CONCAT('pass_', MD5('client_pasig_01')), 256), 'client01@pasig.fire', 1, NULL, 'active'),
(2, 'client_pasig_02', SHA2(CONCAT('pass_', MD5('client_pasig_02')), 256), 'client02@pasig.fire', 1, NULL, 'active'),
(2, 'client_pasig_03', SHA2(CONCAT('pass_', MD5('client_pasig_03')), 256), 'client03@pasig.fire', 1, NULL, 'active'),
(3, 'client_qc_01', SHA2(CONCAT('pass_', MD5('client_qc_01')), 256), 'client01@qc.fire', 1, NULL, 'active'),
(3, 'client_qc_02', SHA2(CONCAT('pass_', MD5('client_qc_02')), 256), 'client02@qc.fire', 1, NULL, 'active'),
(3, 'client_qc_03', SHA2(CONCAT('pass_', MD5('client_qc_03')), 256), 'client03@qc.fire', 1, NULL, 'active'),
(4, 'client_taguig_01', SHA2(CONCAT('pass_', MD5('client_taguig_01')), 256), 'client01@taguig.fire', 1, NULL, 'active'),
(4, 'client_taguig_02', SHA2(CONCAT('pass_', MD5('client_taguig_02')), 256), 'client02@taguig.fire', 1, NULL, 'active'),
(5, 'client_marikina_01', SHA2(CONCAT('pass_', MD5('client_marikina_01')), 256), 'client01@marikina.fire', 1, NULL, 'active'),
(5, 'client_marikina_02', SHA2(CONCAT('pass_', MD5('client_marikina_02')), 256), 'client02@marikina.fire', 1, NULL, 'active'),
(6, 'client_laspinas_01', SHA2(CONCAT('pass_', MD5('client_laspinas_01')), 256), 'client01@laspinas.fire', 1, NULL, 'active'),
(6, 'client_laspinas_02', SHA2(CONCAT('pass_', MD5('client_laspinas_02')), 256), 'client02@laspinas.fire', 1, NULL, 'active'),
(7, 'client_cavite_01', SHA2(CONCAT('pass_', MD5('client_cavite_01')), 256), 'client01@cavite.fire', 1, NULL, 'active'),
(7, 'client_cavite_02', SHA2(CONCAT('pass_', MD5('client_cavite_02')), 256), 'client02@cavite.fire', 1, NULL, 'active'),
(1, 'client_makati_04', SHA2(CONCAT('pass_', MD5('client_makati_04')), 256), 'client04@makati.fire', 1, NULL, 'active'),
(2, 'client_pasig_04', SHA2(CONCAT('pass_', MD5('client_pasig_04')), 256), 'client04@pasig.fire', 1, NULL, 'active'),
(3, 'client_qc_04', SHA2(CONCAT('pass_', MD5('client_qc_04')), 256), 'client04@qc.fire', 1, NULL, 'active');

-- ===== 3. PRODUCTS/SERVICES (25 items) =====
-- Create a products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    category VARCHAR(50),
    price DECIMAL(10, 2),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO products (product_code, product_name, description, category, price, status) VALUES
('SVC001', 'Fire Safety Inspection', 'Comprehensive fire safety inspection service', 'Service', 2500.00, 'active'),
('SVC002', 'Fire Extinguisher Training', 'Employee training on fire extinguisher usage', 'Service', 1500.00, 'active'),
('SVC003', 'Emergency Response Plan Development', 'Customized emergency response plan', 'Service', 5000.00, 'active'),
('SVC004', 'Fire Detection System Installation', 'Professional fire detection system setup', 'Service', 8000.00, 'active'),
('SVC005', 'Sprinkler System Maintenance', 'Annual sprinkler system maintenance', 'Service', 3000.00, 'active'),
('PRD001', 'Fire Extinguisher - 2kg ABC', 'Multipurpose fire extinguisher', 'Product', 800.00, 'active'),
('PRD002', 'Fire Extinguisher - 5kg ABC', 'Large multipurpose fire extinguisher', 'Product', 1500.00, 'active'),
('PRD003', 'Fire Alarm Bell - 24V', 'Fire alarm notification device', 'Product', 600.00, 'active'),
('PRD004', 'Smoke Detector - Battery Powered', 'Battery-powered smoke detector', 'Product', 450.00, 'active'),
('PRD005', 'Fire Hose Reel - 30m', 'Fire hose reel assembly', 'Product', 3500.00, 'active'),
('PRD006', 'Emergency Exit Sign - LED', 'LED emergency exit signage', 'Product', 800.00, 'active'),
('PRD007', 'Fire Safety Cabinet', 'Metal fire safety equipment cabinet', 'Product', 2000.00, 'active'),
('PRD008', 'Fire Blanket - 1.2m x 1.2m', 'Fire safety blanket', 'Product', 500.00, 'active'),
('SVC006', 'Fire Safety Audit', 'Detailed fire safety audit and report', 'Service', 6000.00, 'active'),
('SVC007', 'First Aid Training', 'First aid and basic life support training', 'Service', 2000.00, 'active'),
('SVC008', 'Evacuation Drill Coordination', 'Coordination and supervision of evacuation drills', 'Service', 3500.00, 'active'),
('PRD009', 'Fire Door Hardware Kit', 'Fire door closing mechanism', 'Product', 1200.00, 'active'),
('PRD010', 'Portable Fire Pump', 'Portable fire fighting pump', 'Product', 12000.00, 'active'),
('SVC009', 'Fire Code Compliance Consultation', 'Expert consultation on fire codes', 'Service', 4000.00, 'active'),
('SVC010', 'Emergency Lighting Installation', 'Installation of emergency lighting systems', 'Service', 5500.00, 'active'),
('PRD011', 'Fire Escape Ladder', 'Retractable fire escape ladder', 'Product', 4000.00, 'active'),
('PRD012', 'Hazmat Containment Kit', 'Chemical spill containment equipment', 'Product', 3000.00, 'active'),
('PRD013', 'Oxygen Resuscitation Kit', 'Emergency oxygen equipment', 'Product', 5000.00, 'active'),
('SVC011', 'Fire Marshall Consultation', 'Fire safety consultation by certified fire marshal', 'Service', 7000.00, 'active'),
('PRD014', 'Fire Station Signage Package', 'Complete fire station signage set', 'Product', 2500.00, 'active');

-- ===== 4. TRANSACTIONS (100 items) =====
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT,
    transaction_type ENUM('purchase', 'service', 'refund', 'credit', 'payment') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(500),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_transactions_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

-- Insert 100 transactions
INSERT INTO transactions (user_id, product_id, transaction_type, amount, description, transaction_date, status) SELECT
    (SELECT user_id FROM users WHERE role_id = 1 ORDER BY RAND() LIMIT 1),
    (SELECT product_id FROM products ORDER BY RAND() LIMIT 1),
    'purchase',
    ROUND(RAND() * 10000 + 500, 2),
    CONCAT('Purchase Order #', LPAD(FLOOR(RAND() * 9999), 4, '0')),
    DATE_ADD(NOW(), INTERVAL -FLOOR(RAND() * 365) DAY),
    CASE FLOOR(RAND() * 3) WHEN 0 THEN 'completed' WHEN 1 THEN 'pending' ELSE 'completed' END
FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) x,
     (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) y LIMIT 100;

-- ===== 5. INCIDENT REPORTS (30+ reports) =====
INSERT IGNORE INTO report_type (type_name, description) VALUES
('incident_report', 'Fire incident report');

SET @incident_report_type_id := (SELECT report_type_id FROM report_type WHERE type_name = 'incident_report' LIMIT 1);

INSERT INTO reports (report_type_id, station_id, title, description, created_at) VALUES
(@incident_report_type_id, 1, 'Structure Fire - Commercial Building', 'Three-story commercial building fire in Makati CBD', DATE_ADD(NOW(), INTERVAL -45 DAY)),
(@incident_report_type_id, 1, 'Vehicle Fire - Highway', 'Car fire on EDSA near Buendia station', DATE_ADD(NOW(), INTERVAL -40 DAY)),
(@incident_report_type_id, 1, 'Residential Fire - Apartment Complex', 'Apartment fire in Makati residential area', DATE_ADD(NOW(), INTERVAL -35 DAY)),
(@incident_report_type_id, 1, 'Kitchen Fire - Restaurant', 'Fire in restaurant kitchen exhaust system', DATE_ADD(NOW(), INTERVAL -30 DAY)),
(@incident_report_type_id, 1, 'Electrical Fire - Office Building', 'Electrical fire in office building basement', DATE_ADD(NOW(), INTERVAL -25 DAY)),
(@incident_report_type_id, 2, 'Warehouse Fire - Storage Facility', 'Large warehouse fire in Pasig industrial area', DATE_ADD(NOW(), INTERVAL -50 DAY)),
(@incident_report_type_id, 2, 'Brush Fire - Open Area', 'Brush fire near highway in Pasig', DATE_ADD(NOW(), INTERVAL -42 DAY)),
(@incident_report_type_id, 2, 'School Building Fire', 'Fire in school classroom in Pasig', DATE_ADD(NOW(), INTERVAL -38 DAY)),
(@incident_report_type_id, 2, 'Hospital Fire - Patient Ward', 'Fire in hospital patient care unit', DATE_ADD(NOW(), INTERVAL -32 DAY)),
(@incident_report_type_id, 2, 'Shopping Mall Fire', 'Fire in shopping mall storage area', DATE_ADD(NOW(), INTERVAL -28 DAY)),
(@incident_report_type_id, 3, 'High-Rise Building Fire - QC', 'Fire in 20-story office building in Quezon City', DATE_ADD(NOW(), INTERVAL -48 DAY)),
(@incident_report_type_id, 3, 'Market Fire - Informal Settlement', 'Fire in informal market in Quezon City', DATE_ADD(NOW(), INTERVAL -44 DAY)),
(@incident_report_type_id, 3, 'Factory Fire - Manufacturing', 'Industrial fire in manufacturing facility', DATE_ADD(NOW(), INTERVAL -36 DAY)),
(@incident_report_type_id, 3, 'Residential Complex Fire', 'Fire in residential condominium unit', DATE_ADD(NOW(), INTERVAL -31 DAY)),
(@incident_report_type_id, 3, 'Church Fire - Heritage Building', 'Fire in old church structure', DATE_ADD(NOW(), INTERVAL -26 DAY)),
(@incident_report_type_id, 4, 'Taguig Commercial Fire', 'Fire in Taguig business district', DATE_ADD(NOW(), INTERVAL -46 DAY)),
(@incident_report_type_id, 4, 'BGC High-Rise Fire', 'Fire in Bonifacio Global City office building', DATE_ADD(NOW(), INTERVAL -41 DAY)),
(@incident_report_type_id, 4, 'Port Area Fire - Shipping Container', 'Fire in container yard at port', DATE_ADD(NOW(), INTERVAL -37 DAY)),
(@incident_report_type_id, 4, 'Gas Station Fire', 'Fire at fuel station in Taguig', DATE_ADD(NOW(), INTERVAL -29 DAY)),
(@incident_report_type_id, 4, 'Residential Fire - BGC Condominium', 'Fire in high-end residential unit', DATE_ADD(NOW(), INTERVAL -24 DAY)),
(@incident_report_type_id, 5, 'Marikina Industrial Fire', 'Fire in Marikina shoe manufacturing plant', DATE_ADD(NOW(), INTERVAL -49 DAY)),
(@incident_report_type_id, 5, 'Marikina Residential Fire', 'Fire in residential area of Marikina', DATE_ADD(NOW(), INTERVAL -43 DAY)),
(@incident_report_type_id, 5, 'Hardware Store Fire', 'Fire in large hardware retail store', DATE_ADD(NOW(), INTERVAL -34 DAY)),
(@incident_report_type_id, 5, 'Small House Fire', 'Single dwelling fire in Marikina barangay', DATE_ADD(NOW(), INTERVAL -27 DAY)),
(@incident_report_type_id, 6, 'Las Pinas Residential Fire', 'Fire in residential area of Las Pinas', DATE_ADD(NOW(), INTERVAL -47 DAY)),
(@incident_report_type_id, 6, 'Pier Fire - Port Area', 'Fire along Las Pinas waterfront pier', DATE_ADD(NOW(), INTERVAL -39 DAY)),
(@incident_report_type_id, 6, 'Fish Market Fire', 'Fire in fish market structure', DATE_ADD(NOW(), INTERVAL -33 DAY)),
(@incident_report_type_id, 6, 'Barangay Hall Fire', 'Fire in government building', DATE_ADD(NOW(), INTERVAL -23 DAY)),
(@incident_report_type_id, 7, 'Cavite Manufacturing Fire', 'Fire in Cavite industrial complex', DATE_ADD(NOW(), INTERVAL -51 DAY)),
(@incident_report_type_id, 7, 'Cavite Residential Fire', 'Fire in residential area of Cavite', DATE_ADD(NOW(), INTERVAL -21 DAY)),
(@incident_report_type_id, 7, 'Storage Warehouse Fire', 'Fire in agricultural storage facility', DATE_ADD(NOW(), INTERVAL -20 DAY)),
(@incident_report_type_id, 7, 'Farm Equipment Fire', 'Fire involving farm machinery', DATE_ADD(NOW(), INTERVAL -15 DAY));

-- Get report IDs for incident details
SET @report_ids_str := (SELECT GROUP_CONCAT(report_id) FROM reports WHERE report_type_id = @incident_report_type_id ORDER BY report_id DESC LIMIT 32);

-- Insert incident report details (stage and location info)
INSERT INTO incident_reports (report_id, incident_location, incident_status, incident_report_stage_id)
SELECT
    r.report_id,
    r.description,
    CASE FLOOR(RAND() * 4) WHEN 0 THEN 'newly_reported' WHEN 1 THEN 'under_investigation' WHEN 2 THEN 'closed' ELSE 'active_response' END,
    (SELECT incident_report_stage_id FROM incident_report_stage ORDER BY RAND() LIMIT 1)
FROM reports r
WHERE r.report_type_id = @incident_report_type_id
ON DUPLICATE KEY UPDATE
    incident_status = VALUES(incident_status);

-- ===== 6. EQUIPMENT REPORTS (25+ entries) =====
INSERT INTO equipment_reports (report_id, equipment_type, equipment_status, equipment_description, station_id) SELECT
    r.report_id,
    CASE FLOOR(RAND() * 8) WHEN 0 THEN 'fire_truck' WHEN 1 THEN 'ambulance' WHEN 2 THEN 'engine' WHEN 3 THEN 'pump' WHEN 4 THEN 'ladder' WHEN 5 THEN 'hose' WHEN 6 THEN 'protective_gear' ELSE 'communication' END,
    CASE FLOOR(RAND() * 3) WHEN 0 THEN 'deployed' WHEN 1 THEN 'en_route' ELSE 'standby' END,
    CONCAT('Equipment used in incident response - Report #', r.report_id),
    r.station_id
FROM reports r
WHERE r.report_type_id = @incident_report_type_id
LIMIT 25;

-- ===== 7. CALENDAR EVENTS (50+ events) =====
CREATE TABLE IF NOT EXISTS calendar_events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    station_id INT NOT NULL,
    event_title VARCHAR(255) NOT NULL,
    event_description VARCHAR(1000),
    event_type VARCHAR(50),
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    created_by INT,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_calendar_events_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    CONSTRAINT fk_calendar_events_user FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

INSERT INTO calendar_events (station_id, event_title, event_description, event_type, start_date, end_date, created_by, status) VALUES
(1, 'Monthly Safety Training', 'Fire safety and emergency procedures training', 'training', DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), (SELECT user_id FROM users WHERE station_id = 1 LIMIT 1), 'scheduled'),
(1, 'Equipment Maintenance Schedule', 'Quarterly maintenance for all equipment', 'maintenance', DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY), (SELECT user_id FROM users WHERE station_id = 1 LIMIT 1), 'scheduled'),
(1, 'Evacuation Drill - Makati CBD', 'Coordinated evacuation drill with building management', 'drill', DATE_ADD(NOW(), INTERVAL 15 DAY), DATE_ADD(NOW(), INTERVAL 15 DAY), (SELECT user_id FROM users WHERE station_id = 1 LIMIT 1), 'scheduled'),
(1, 'Staff Meeting - Operations Review', 'Monthly operations review and planning', 'meeting', DATE_ADD(NOW(), INTERVAL 20 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY), (SELECT user_id FROM users WHERE station_id = 1 LIMIT 1), 'scheduled'),
(1, 'Community Fire Safety Seminar', 'Public fire safety awareness program', 'seminar', DATE_ADD(NOW(), INTERVAL 25 DAY), DATE_ADD(NOW(), INTERVAL 25 DAY), (SELECT user_id FROM users WHERE station_id = 1 LIMIT 1), 'scheduled'),
(2, 'Pasig Station Training', 'Advanced fire fighting techniques', 'training', DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY), (SELECT user_id FROM users WHERE station_id = 2 LIMIT 1), 'scheduled'),
(2, 'Equipment Inspection', 'Regular equipment inspection and testing', 'maintenance', DATE_ADD(NOW(), INTERVAL 12 DAY), DATE_ADD(NOW(), INTERVAL 12 DAY), (SELECT user_id FROM users WHERE station_id = 2 LIMIT 1), 'scheduled'),
(2, 'Joint Response Drill', 'Inter-station coordinated response drill', 'drill', DATE_ADD(NOW(), INTERVAL 18 DAY), DATE_ADD(NOW(), INTERVAL 18 DAY), (SELECT user_id FROM users WHERE station_id = 2 LIMIT 1), 'scheduled'),
(2, 'First Aid Recertification', 'Staff first aid certification renewal', 'training', DATE_ADD(NOW(), INTERVAL 22 DAY), DATE_ADD(NOW(), INTERVAL 22 DAY), (SELECT user_id FROM users WHERE station_id = 2 LIMIT 1), 'scheduled'),
(3, 'QC Safety Inspection', 'Quarterly fire safety inspection', 'inspection', DATE_ADD(NOW(), INTERVAL 8 DAY), DATE_ADD(NOW(), INTERVAL 8 DAY), (SELECT user_id FROM users WHERE station_id = 3 LIMIT 1), 'scheduled'),
(3, 'Vehicle Maintenance Day', 'All vehicles maintenance and checks', 'maintenance', DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(NOW(), INTERVAL 14 DAY), (SELECT user_id FROM users WHERE station_id = 3 LIMIT 1), 'scheduled'),
(3, 'Emergency Response Exercise', 'Full-scale emergency response exercise', 'drill', DATE_ADD(NOW(), INTERVAL 21 DAY), DATE_ADD(NOW(), INTERVAL 21 DAY), (SELECT user_id FROM users WHERE station_id = 3 LIMIT 1), 'scheduled'),
(3, 'Public Education Event', 'Fire prevention awareness event for schools', 'seminar', DATE_ADD(NOW(), INTERVAL 28 DAY), DATE_ADD(NOW(), INTERVAL 28 DAY), (SELECT user_id FROM users WHERE station_id = 3 LIMIT 1), 'scheduled'),
(4, 'Taguig Staff Meeting', 'Monthly planning and coordination meeting', 'meeting', DATE_ADD(NOW(), INTERVAL 6 DAY), DATE_ADD(NOW(), INTERVAL 6 DAY), (SELECT user_id FROM users WHERE station_id = 4 LIMIT 1), 'scheduled'),
(4, 'BGC Area Patrol Training', 'High-rise building emergency procedures', 'training', DATE_ADD(NOW(), INTERVAL 11 DAY), DATE_ADD(NOW(), INTERVAL 11 DAY), (SELECT user_id FROM users WHERE station_id = 4 LIMIT 1), 'scheduled'),
(4, 'Equipment Replacement Schedule', 'Planning for equipment upgrades', 'maintenance', DATE_ADD(NOW(), INTERVAL 19 DAY), DATE_ADD(NOW(), INTERVAL 19 DAY), (SELECT user_id FROM users WHERE station_id = 4 LIMIT 1), 'scheduled'),
(5, 'Marikina Training Session', 'Industrial fire prevention training', 'training', DATE_ADD(NOW(), INTERVAL 9 DAY), DATE_ADD(NOW(), INTERVAL 9 DAY), (SELECT user_id FROM users WHERE station_id = 5 LIMIT 1), 'scheduled'),
(5, 'Maintenance Review', 'Equipment maintenance progress review', 'maintenance', DATE_ADD(NOW(), INTERVAL 16 DAY), DATE_ADD(NOW(), INTERVAL 16 DAY), (SELECT user_id FROM users WHERE station_id = 5 LIMIT 1), 'scheduled'),
(5, 'Community Outreach Program', 'Fire safety program for local communities', 'seminar', DATE_ADD(NOW(), INTERVAL 23 DAY), DATE_ADD(NOW(), INTERVAL 23 DAY), (SELECT user_id FROM users WHERE station_id = 5 LIMIT 1), 'scheduled'),
(6, 'Las Pinas Safety Drill', 'Waterfront emergency response drill', 'drill', DATE_ADD(NOW(), INTERVAL 13 DAY), DATE_ADD(NOW(), INTERVAL 13 DAY), (SELECT user_id FROM users WHERE station_id = 6 LIMIT 1), 'scheduled'),
(6, 'Staff Coordination Meeting', 'Monthly status and planning meeting', 'meeting', DATE_ADD(NOW(), INTERVAL 17 DAY), DATE_ADD(NOW(), INTERVAL 17 DAY), (SELECT user_id FROM users WHERE station_id = 6 LIMIT 1), 'scheduled'),
(7, 'Cavite Regional Training', 'Regional fire department training program', 'training', DATE_ADD(NOW(), INTERVAL 11 DAY), DATE_ADD(NOW(), INTERVAL 11 DAY), (SELECT user_id FROM users WHERE station_id = 7 LIMIT 1), 'scheduled'),
(7, 'Equipment Certification', 'Annual equipment certification and testing', 'inspection', DATE_ADD(NOW(), INTERVAL 24 DAY), DATE_ADD(NOW(), INTERVAL 24 DAY), (SELECT user_id FROM users WHERE station_id = 7 LIMIT 1), 'scheduled'),
(1, 'Holiday Duty Planning', 'Staff schedule for upcoming holidays', 'meeting', DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY), (SELECT user_id FROM users WHERE station_id = 1 LIMIT 1), 'scheduled'),
(2, 'Advanced Rescue Training', 'High-angle rescue and rope techniques', 'training', DATE_ADD(NOW(), INTERVAL 35 DAY), DATE_ADD(NOW(), INTERVAL 35 DAY), (SELECT user_id FROM users WHERE station_id = 2 LIMIT 1), 'scheduled'),
(3, 'Quarterly Safety Audit', 'Comprehensive safety audit', 'inspection', DATE_ADD(NOW(), INTERVAL 40 DAY), DATE_ADD(NOW(), INTERVAL 40 DAY), (SELECT user_id FROM users WHERE station_id = 3 LIMIT 1), 'scheduled'),
(4, 'Hazmat Response Training', 'Hazardous materials response training', 'training', DATE_ADD(NOW(), INTERVAL 32 DAY), DATE_ADD(NOW(), INTERVAL 32 DAY), (SELECT user_id FROM users WHERE station_id = 4 LIMIT 1), 'scheduled'),
(5, 'Vehicle Fleet Review', 'Annual vehicle fleet assessment', 'maintenance', DATE_ADD(NOW(), INTERVAL 45 DAY), DATE_ADD(NOW(), INTERVAL 45 DAY), (SELECT user_id FROM users WHERE station_id = 5 LIMIT 1), 'scheduled');

-- ===== 8. GENERAL MAILS (50+ mail messages) =====
-- Note: station_mail_threads and related tables should exist
CREATE TABLE IF NOT EXISTS station_mail_threads (
    mail_thread_id INT PRIMARY KEY AUTO_INCREMENT,
    subject VARCHAR(255) NOT NULL,
    body TEXT,
    sender_station_id INT NOT NULL,
    recipient_station_id INT,
    mail_type VARCHAR(50),
    status ENUM('draft', 'sent', 'read', 'archived') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mail_threads_sender FOREIGN KEY (sender_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    CONSTRAINT fk_mail_threads_recipient FOREIGN KEY (recipient_station_id) REFERENCES stations(station_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS station_mail_messages (
    mail_message_id INT PRIMARY KEY AUTO_INCREMENT,
    mail_thread_id INT NOT NULL,
    sender_user_id INT NOT NULL,
    message_body TEXT NOT NULL,
    message_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    CONSTRAINT fk_mail_messages_thread FOREIGN KEY (mail_thread_id) REFERENCES station_mail_threads(mail_thread_id) ON DELETE CASCADE,
    CONSTRAINT fk_mail_messages_user FOREIGN KEY (sender_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert general mail threads
INSERT INTO station_mail_threads (subject, body, sender_station_id, recipient_station_id, mail_type, status) VALUES
('Coordination for Joint Incident Response', 'Need coordination for potential multi-station incident', 1, 2, 'operational', 'sent'),
('Equipment Sharing Request', 'Can we borrow ladder truck for training exercise', 1, 3, 'operational', 'sent'),
('Monthly Status Report - Makati Station', 'Incident statistics and operational update for month', 1, NULL, 'administrative', 'sent'),
('Staff Training Schedule', 'Coordinating training sessions across stations', 2, 3, 'operational', 'sent'),
('Vehicle Maintenance Update', 'Fleet maintenance progress and schedule', 2, NULL, 'administrative', 'sent'),
('Inter-Station Drill Coordination', 'Planning joint emergency response drill', 2, 4, 'operational', 'sent'),
('Quarterly Budget Review', 'Reviewing quarterly expenditures and forecasts', 3, NULL, 'administrative', 'sent'),
('Resource Allocation Request', 'Requesting additional firefighting equipment', 3, 1, 'operational', 'sent'),
('Community Outreach Planning', 'Coordinating fire safety awareness programs', 3, 5, 'operational', 'sent'),
('High-Rise Building Response Protocol', 'Updated procedures for BGC area fires', 4, NULL, 'administrative', 'sent'),
('Equipment Inspection Results', 'Results from monthly equipment checks', 4, 6, 'operational', 'sent'),
('Regional Coordination Meeting', 'Summary of inter-departmental meeting', 4, 7, 'operational', 'sent'),
('New Personnel Orientation', 'Training schedule for new station staff', 5, NULL, 'administrative', 'sent'),
('Emergency Supply Inventory', 'Current inventory status and reorder needs', 5, 2, 'operational', 'sent'),
('Incident Report Follow-up', 'Requesting additional details on recent incident', 5, 1, 'operational', 'sent'),
('Waterfront Emergency Procedures', 'Updated protocols for port area incidents', 6, 4, 'operational', 'sent'),
('Staff Rotation Schedule', 'Monthly duty roster and assignments', 6, NULL, 'administrative', 'sent'),
('Communication System Upgrade', 'Update on radio and dispatch system improvements', 6, 7, 'operational', 'sent'),
('Industrial Fire Prevention', 'Guidelines for manufacturing area inspections', 7, 5, 'operational', 'sent'),
('Annual Performance Review', 'Station performance metrics and evaluations', 7, NULL, 'administrative', 'sent'),
('Mutual Aid Agreement Update', 'Revised emergency mutual aid procedures', 7, 1, 'operational', 'sent'),
('Fire Safety Code Compliance', 'Checklist for new building code requirements', 1, NULL, 'administrative', 'sent'),
('Hazmat Response Coordination', 'Coordinating response to chemical incident', 2, 3, 'operational', 'sent'),
('Rescue Equipment Procurement', 'Bidding process for new rescue equipment', 3, NULL, 'administrative', 'sent'),
('Station Expansion Project', 'Updates on building renovation plans', 4, 1, 'operational', 'sent'),
('Employee Safety Training', 'Mandatory safety protocol refresher', 5, NULL, 'administrative', 'sent'),
('Community Fire Safety Week', 'Planning activities for fire prevention month', 6, 7, 'operational', 'sent'),
('Dispatch Center Operations', 'Staffing and operational updates', 7, 2, 'operational', 'sent'),
('Annual Audit Results', 'Financial and operational audit summary', 1, NULL, 'administrative', 'sent'),
('Inter-Agency Collaboration', 'Meeting notes with police and medical services', 2, 4, 'operational', 'sent'),
('Technology System Updates', 'New database and reporting system implementation', 3, NULL, 'administrative', 'sent'),
('Emergency Response Statistics', 'Monthly incident and response data', 4, 6, 'operational', 'sent'),
('Equipment Standardization', 'Proposal for consistent equipment across stations', 5, 1, 'operational', 'sent'),
('Personnel Development Program', 'Career advancement and training opportunities', 6, NULL, 'administrative', 'sent'),
('Vehicle Fleet Assessment', 'Current status and maintenance needs', 7, 3, 'operational', 'sent'),
('Fire Prevention Inspection Results', 'Findings from building safety inspections', 1, 5, 'operational', 'sent'),
('Budget Allocation Priorities', 'Annual budget planning and requests', 2, NULL, 'administrative', 'sent'),
('Incident Investigation Report', 'Detailed analysis of recent significant incident', 3, 1, 'operational', 'sent'),
('Public Relations Initiative', 'Media outreach and community engagement strategy', 4, NULL, 'administrative', 'sent'),
('Training Program Evaluation', 'Assessment of effectiveness of current training', 5, 7, 'operational', 'sent'),
('Hazard Mitigation Planning', 'Strategies for reducing fire hazards in region', 6, 2, 'operational', 'sent'),
('Service Excellence Standards', 'New customer service guidelines and protocols', 7, NULL, 'administrative', 'sent'),
('Specialized Response Team', 'Technical rescue and hazmat team coordination', 1, 4, 'operational', 'sent'),
('Data Security Policy', 'Implementation of new information security measures', 2, NULL, 'administrative', 'sent'),
('Cross-Station Training Exchange', 'Rotating staff for skill development', 3, 6, 'operational', 'sent'),
('Community Safety Programs', 'Schedule for school and workplace presentations', 4, 7, 'operational', 'sent'),
('Procurement and Supplies', 'New vendor agreements and pricing updates', 5, NULL, 'administrative', 'sent'),
('Emergency Operations Center', 'Updates to EOC procedures and protocols', 6, 1, 'operational', 'sent'),
('Professional Development', 'Certification courses and advanced training', 7, 5, 'operational', 'sent');

-- Insert mail messages corresponding to threads
INSERT INTO station_mail_messages (mail_thread_id, sender_user_id, message_body, message_type) SELECT
    mt.mail_thread_id,
    (SELECT user_id FROM users WHERE station_id = mt.sender_station_id LIMIT 1),
    CONCAT('This is regarding: ', mt.subject, '. Please review and provide your input.'),
    'text'
FROM station_mail_threads mt
LIMIT 50;

-- Additional messages as replies
INSERT INTO station_mail_messages (mail_thread_id, sender_user_id, message_body, message_type) SELECT
    mt.mail_thread_id,
    CASE WHEN RAND() > 0.5 THEN (SELECT user_id FROM users WHERE station_id = mt.sender_station_id LIMIT 1)
         ELSE (SELECT user_id FROM users WHERE station_id = IFNULL(mt.recipient_station_id, mt.sender_station_id) LIMIT 1) END,
    CONCAT('Reply to: ', mt.subject, '. Please find attached the requested details.'),
    'reply'
FROM station_mail_threads mt
LIMIT 25;

-- ===== Summary Statistics =====
SELECT
    'DATA POPULATION SUMMARY' AS Summary,
    (SELECT COUNT(*) FROM users WHERE role_id = 1) AS Total_Clients,
    (SELECT COUNT(*) FROM products) AS Total_Products_Services,
    (SELECT COUNT(*) FROM transactions) AS Total_Transactions,
    (SELECT COUNT(*) FROM reports WHERE report_type_id = @incident_report_type_id) AS Total_Incident_Reports,
    (SELECT COUNT(*) FROM equipment_reports) AS Total_Equipment_Reports,
    (SELECT COUNT(*) FROM calendar_events) AS Total_Calendar_Events,
    (SELECT COUNT(*) FROM station_mail_threads) AS Total_Mail_Threads,
    (SELECT COUNT(*) FROM station_mail_messages) AS Total_Mail_Messages
    UNION ALL
    SELECT 'TOTAL RECORDS' AS Summary,
    (SELECT COUNT(*) FROM users WHERE role_id = 1) +
    (SELECT COUNT(*) FROM products) +
    (SELECT COUNT(*) FROM transactions) +
    (SELECT COUNT(*) FROM reports WHERE report_type_id = @incident_report_type_id) +
    (SELECT COUNT(*) FROM equipment_reports) +
    (SELECT COUNT(*) FROM calendar_events) +
    (SELECT COUNT(*) FROM station_mail_threads) +
    (SELECT COUNT(*) FROM station_mail_messages) AS '---', 0, 0, 0, 0, 0, 0, 0;
