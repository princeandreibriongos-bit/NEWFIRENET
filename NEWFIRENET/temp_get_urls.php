<?php
$config = require 'config/config.php';
$cloud = $config['cloudinary'];

// List all resources in the account
echo "=== Listing ALL resources (first 100) ===\n";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.cloudinary.com/v1_1/' . $cloud['cloud_name'] . '/resources/image?type=upload&max_results=100',
    CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
    CURLOPT_USERPWD => $cloud['api_key'] . ':' . $cloud['api_secret'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);

echo "HTTP Code: $httpCode\n";

if (isset($data['resources']) && count($data['resources']) > 0) {
    echo "Found " . count($data['resources']) . " files:\n\n";
    foreach ($data['resources'] as $r) {
        echo "Public ID: " . $r['public_id'] . "\n";
        echo "URL: " . $r['secure_url'] . "\n";
        echo "Format: " . $r['format'] . "\n";
        echo "---\n";
    }
} else {
    echo "No resources found or API error\n";
    echo "Response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
}
