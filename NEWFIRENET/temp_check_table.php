<?php
require __DIR__ . '/includes/db.php';
try {
    $pdo = firenet_get_pdo();
    $stmt = $pdo->query("SELECT TABLE_NAME, ENGINE FROM information_schema.tables WHERE table_schema='newfirenet' AND table_name='station_mail_request_routes'");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
