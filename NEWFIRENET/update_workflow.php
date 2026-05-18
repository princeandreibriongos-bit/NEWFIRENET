<?php
$pdo = new PDO('mysql:host=localhost;dbname=newfirenet', 'root', '');
$stmt = $pdo->query("SELECT thread_id FROM station_mails WHERE subject LIKE '%Fire Incident%' ORDER BY created_at DESC LIMIT 1");
$row = $stmt->fetch();
$threadId = $row['thread_id'];
echo "Thread ID: $threadId\n";

$stmt2 = $pdo->prepare("UPDATE station_mail_routes SET status = 'file_returned_to_coml' WHERE thread_id = ?");
$stmt2->execute([$threadId]);
echo "Updated status to file_returned_to_coml\n";

$stmt3 = $pdo->query("SELECT status FROM station_mail_routes WHERE thread_id = $threadId");
$row3 = $stmt3->fetch();
echo "New status: " . $row3['status'] . "\n";
