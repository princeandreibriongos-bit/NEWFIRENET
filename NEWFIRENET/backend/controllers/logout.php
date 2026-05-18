<?php
require_once __DIR__ . '/../../includes/auth.php';

firenet_start_session();
$_SESSION = [];
session_destroy();

header('Location: /firenet/NEWFIRENET/pages/login.html?success=You+have+been+logged+out');
exit;
