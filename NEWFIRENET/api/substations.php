<?php
header('Content-Type: application/json');

echo json_encode([
    ['id' => 1, 'name' => 'Substation A', 'status' => 'Active'],
    ['id' => 2, 'name' => 'Substation B', 'status' => 'Standby']
]);
