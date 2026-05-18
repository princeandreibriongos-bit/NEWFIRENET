<?php
$host = '127.0.0.1';
$port = 3306;
$user = 'root';
$pass = '';
$dbName = 'newfirenet';

// MySQLi connection (for backward compatibility)
$conn = new mysqli($host, $user, $pass, $dbName, $port);
if ($conn->connect_error) {
    die('Database connection failed: ' . $conn->connect_error);
}

// PDO connection (for new code)
function firenet_get_pdo() {
    static $pdo = null;
    if ($pdo === null) {
        $host = '127.0.0.1';
        $port = 3306;
        $user = 'root';
        $pass = '';
        $dbName = 'newfirenet';
        try {
            $pdo = new PDO(
                "mysql:host=$host;port=$port;dbname=$dbName;charset=utf8mb4",
                $user,
                $pass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (PDOException $e) {
            die('PDO Database connection failed: ' . $e->getMessage());
        }
    }
    return $pdo;
}
