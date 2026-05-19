<?php
$config = require 'config/config.php';
$cloud = $config['cloudinary'];

// Create a simple 1x1 pixel JPG image
$jpgData = base64_decode(
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k='
);

// Save as temporary file
$tmpFile = sys_get_temp_dir() . '/firenet_test_image.jpg';
file_put_contents($tmpFile, $jpgData);

// Prepare signed upload data
$timestamp = time();
$publicId = 'firenet/orgmail/ASSS/incident-report-test';
$toSign = 'public_id=' . $publicId . '&timestamp=' . $timestamp . $cloud['api_secret'];
$signature = sha1($toSign);

// Upload to Cloudinary using signed upload
$postData = [
    'file' => new CURLFile($tmpFile, 'image/jpeg'),
    'public_id' => $publicId,
    'api_key' => $cloud['api_key'],
    'timestamp' => $timestamp,
    'signature' => $signature
];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.cloudinary.com/v1_1/' . $cloud['cloud_name'] . '/image/upload',
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $postData,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Upload Response (HTTP $httpCode):\n\n";
$data = json_decode($response, true);

if ($httpCode === 200 && isset($data['secure_url'])) {
    echo "File uploaded successfully!\n\n";
    echo "Public ID: " . $data['public_id'] . "\n";
    echo "Secure URL: " . $data['secure_url'] . "\n";
    echo "Format: " . $data['format'] . "\n";
    echo "\n=== USE THIS URL IN THE WORKFLOW ===\n";
    echo $data['secure_url'] . "\n";
} else {
    echo "Upload failed or HTTP error\n";
    echo "Response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
}

// Clean up
@unlink($tmpFile);
