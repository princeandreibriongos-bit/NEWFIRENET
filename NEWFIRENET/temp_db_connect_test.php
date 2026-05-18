<?php
require __DIR__ . '/includes/db.php';

echo "Testing MySQLi connection...\n";
if (isset($conn) && $conn->ping()) {
    echo "MySQLi connected to database '" . (isset($dbName) ? $dbName : 'unknown') . "'\n";
} else {
    echo "MySQLi connection failed: " . (isset($conn) ? $conn->connect_error : 'no connection object') . "\n";
}

echo "\nSHOW TABLES (MySQLi):\n";
$res = $conn->query("SHOW TABLES");
if ($res) {
    while ($row = $res->fetch_array()) {
        echo $row[0] . "\n";
    }
    $res->free();
} else {
    echo "SHOW TABLES failed: " . $conn->error . "\n";
}

echo "\nTesting PDO connection...\n";
try {
    $pdo = firenet_get_pdo();
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_NUM);
    foreach ($tables as $t) {
        echo $t[0] . "\n";
    }

    echo "\nChecking for users table...\n";
    $stmt = $pdo->query("SELECT * FROM users LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        echo "Sample user: " . json_encode($row) . "\n";
    } else {
        echo "No rows returned from users (table may be empty or missing).\n";
    }
} catch (Exception $e) {
    echo "PDO error: " . $e->getMessage() . "\n";
}

echo "\nDone.\n";
