<?php
$config = [
    'app_name' => 'FireNet',
    'main_station' => 'Main Branch',
    'google_auth' => [
        'enabled' => true,
        'client_id' => '85923943057-gf9khnsio519m85qjs3os3h8n06qjbm9.apps.googleusercontent.com'
    ],
    'google_maps' => [
        'enabled' => true,
        'api_key' => 'AIzaSyB1T6zhOhNbr6njK1CnomxZVuDmZIPkzwo'
    ],
    'news_api' => [
        'enabled' => true,
        'api_key' => '3387c6e010d64b89add96502b60bccaa',
        'country' => 'ph',
        'query' => 'fire'
    ],
    'cloudinary' => [
        'enabled' => false,
        'cloud_name' => 'dq80tx04u',
        'api_key' => '944789179414581',
        'api_secret' => 'S1bEQOmU7K4rjCFhm49HbQeB-qM',
        'upload_preset' => 'YOUR_UNSIGNED_UPLOAD_PRESET',
        'folder' => 'firenet/incidents',
        'orgmail_folder' => 'firenet/orgmail'
    ],
    'r2' => [
        'enabled' => false,
        'account_id' => '',
        'access_key_id' => '',
        'secret_access_key' => '',
        'bucket' => '',
        'base_prefix' => 'firenet',
    ],
    'mail' => [
        'smtp_host' => 'smtp.gmail.com',
        'smtp_port' => 587,
        'smtp_username' => 'waterworldtest.noreply@gmail.com',
        // Gmail app passwords work with or without spaces; keep without spaces for SMTP.
        'smtp_password' => 'cwukzkykitrlynvt',
        'smtp_encryption' => 'tls',
        'from_email' => 'waterworldtest.noreply@gmail.com',
        'from_name' => 'FireNet Alerts'
    ],
    'sms' => [
        // provider=log stores SMS locally (no paid gateway needed for testing).
        // For live PH SMS: set provider=semaphore, enabled=true, and your Semaphore api_key.
        'enabled' => true,
        'provider' => 'log',
        'api_key' => '',
        'sender_name' => 'FireNet',
        'api_url' => ''
    ],
];
$localR2 = __DIR__ . '/r2.local.php';
if (is_file($localR2)) {
    $override = require $localR2;
    if (is_array($override)) {
        $config = array_replace_recursive($config, $override);
    }
}

require_once __DIR__ . '/env_overrides.php';
$config = firenet_apply_env_config($config);

return $config;

