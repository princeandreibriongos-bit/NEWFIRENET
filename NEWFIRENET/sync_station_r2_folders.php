<?php
/**
 * Ensure R2 folders exist for every station currently in the DB:
 *   firenet-bucket / firenet / reports / {STATION_CODE}/
 *   firenet-bucket / firenet / orgmail / {STATION_CODE}/
 *
 * Requires config/r2.local.php with enabled=true and valid credentials.
 * Run: php sync_station_r2_folders.php
 */
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/r2_storage.php';

$pdo = firenet_get_pdo();
echo 'R2 enabled: ' . (firenet_r2_enabled() ? 'yes' : 'no') . PHP_EOL;
echo 'Base prefix: ' . firenet_r2_base_prefix() . PHP_EOL . PHP_EOL;

foreach ($pdo->query('SELECT station_id, station_code, station_name FROM stations ORDER BY station_id') as $row) {
    $result = firenet_r2_ensure_station_folders((string) $row['station_code']);
    echo $row['station_code'] . ' (' . $row['station_name'] . '): ' . $result['message'] . PHP_EOL;
}

echo PHP_EOL . 'Done.' . PHP_EOL;
