<?php
$host="localhost";
$user="root";
$pass="";
$db="newfirenet";
$pdo=new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4",$user,$pass,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$stmt=$pdo->query("SHOW TABLES LIKE \"user_warnings\"");
$exists=$stmt->fetchColumn();
echo "TABLE_EXISTS=".($exists?1:0)."\n";
if ($exists) {
    $stmt=$pdo->query("SELECT COUNT(*) FROM user_warnings");
echo "COUNT=".$stmt->fetchColumn()."\n";
    $stmt=$pdo->query("SELECT warning_id,user_id,sender_user_id,warning_type,warning_template,LEFT(warning_message,80) as msg,created_at FROM user_warnings ORDER BY warning_id DESC LIMIT 5");
    while ($row=$stmt->fetch(PDO::FETCH_ASSOC)) {
        echo implode('|',$row)."\n";
    }
}
