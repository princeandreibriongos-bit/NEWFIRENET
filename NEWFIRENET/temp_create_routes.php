<?php
require __DIR__ . '/includes/db.php';
try {
    $pdo = firenet_get_pdo();
    $sql = <<<'SQL'
CREATE TABLE station_mail_request_routes (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    thread_id INT NOT NULL,
    request_mail_id INT NOT NULL,
    request_user_id INT NOT NULL,
    origin_station_id INT NOT NULL,
    target_station_id INT NOT NULL,
    status ENUM('pending_origin_review', 'approved', 'rejected', 'forwarded_to_target', 'routed_to_user', 'file_returned_to_coml', 'returned_to_origin', 'completed') NOT NULL DEFAULT 'pending_origin_review',
    edited_subject VARCHAR(255) NULL,
    edited_body LONGTEXT NULL,
    origin_reviewed_by INT NULL,
    origin_reviewed_at DATETIME NULL,
    origin_review_notes LONGTEXT NULL,
    forwarded_mail_id INT NULL,
    forwarded_at DATETIME NULL,
    target_reviewed_by INT NULL,
    target_reviewed_at DATETIME NULL,
    target_review_notes LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_station_mail_request_routes_thread FOREIGN KEY (thread_id) REFERENCES station_mail_threads(thread_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_mail FOREIGN KEY (request_mail_id) REFERENCES station_mail_messages(mail_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_user FOREIGN KEY (request_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_origin_station FOREIGN KEY (origin_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_target_station FOREIGN KEY (target_station_id) REFERENCES stations(station_id) ON DELETE CASCADE,
    CONSTRAINT fk_station_mail_request_routes_origin_reviewer FOREIGN KEY (origin_reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_station_mail_request_routes_target_reviewer FOREIGN KEY (target_reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_station_mail_request_route_thread (thread_id),
    INDEX idx_station_mail_request_routes_status (status, created_at),
    INDEX idx_station_mail_request_routes_origin_station (origin_station_id, status),
    INDEX idx_station_mail_request_routes_target_station (target_station_id, status)
)
SQL;
    $pdo->exec($sql);
    echo "OK";
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
