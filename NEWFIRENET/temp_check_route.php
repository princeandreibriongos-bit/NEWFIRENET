<?php
require dirname(__FILE__) . '/config/config.php';
try {
  $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS);
  $stmt = $pdo->query("SELECT route_id, status FROM station_mail_request_routes WHERE thread_id = (SELECT thread_id FROM station_mails WHERE subject LIKE '%Fire Incident%' ORDER BY created_at DESC LIMIT 1) ORDER BY created_at DESC LIMIT 1");
  $row = $stmt->fetch();
  echo 'Route ID: ' . ($row['route_id'] ?? 'not found') . ', Status: ' . ($row['status'] ?? 'unknown');
} catch(Exception $e) {
  echo 'Error: ' . $e->getMessage();
}
?>
