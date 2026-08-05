<?php

function firenet_app_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $configFile = __DIR__ . '/../config/config.php';
    if (!is_file($configFile)) {
        $config = [];
        return $config;
    }

    // config.php already merges r2.local.php + environment overrides.
    $loaded = require $configFile;
    $config = is_array($loaded) ? $loaded : [];

    return $config;
}

function firenet_r2_config(): array
{
    $cfg = firenet_app_config()['r2'] ?? [];
    return is_array($cfg) ? $cfg : [];
}

function firenet_r2_enabled(): bool
{
    $r2 = firenet_r2_config();
    return !empty($r2['enabled'])
        && trim((string) ($r2['account_id'] ?? '')) !== ''
        && trim((string) ($r2['access_key_id'] ?? '')) !== ''
        && trim((string) ($r2['secret_access_key'] ?? '')) !== ''
        && trim((string) ($r2['bucket'] ?? '')) !== '';
}

function firenet_r2_base_prefix(): string
{
    $base = trim((string) (firenet_r2_config()['base_prefix'] ?? 'firenet'));
    return $base === '' ? 'firenet' : rtrim($base, '/');
}

function firenet_r2_reports_prefix(string $stationCode): string
{
    $code = strtoupper(preg_replace('/[^A-Z0-9_-]+/i', '', trim($stationCode)) ?: 'STATION');
    return firenet_r2_base_prefix() . '/reports/' . $code;
}

function firenet_r2_orgmail_prefix(string $stationCode): string
{
    $code = strtoupper(preg_replace('/[^A-Z0-9_-]+/i', '', trim($stationCode)) ?: 'STATION');
    return firenet_r2_base_prefix() . '/orgmail/' . $code;
}

function firenet_r2_station_code(PDO $pdo, int $stationId): string
{
    $stmt = $pdo->prepare('SELECT station_code FROM stations WHERE station_id = ? LIMIT 1');
    $stmt->execute([$stationId]);
    $code = strtoupper(trim((string) ($stmt->fetchColumn() ?: '')));
    return $code !== '' ? $code : ('STATION_' . $stationId);
}

function firenet_r2_prefixed_safe_filename(string $stationCode, string $originalName): string
{
    $code = strtoupper(trim(preg_replace('/[^A-Z0-9_-]+/i', '', $stationCode) ?: ''));
    $safeName = preg_replace('/[^A-Za-z0-9._-]+/', '_', basename($originalName)) ?: 'upload.bin';
    if ($code === '') {
        return $safeName;
    }

    $prefix = $code . '_';
    if (stripos($safeName, $prefix) === 0) {
        return $safeName;
    }

    return $prefix . $safeName;
}

function firenet_r2_is_central_station(PDO $pdo, int $stationId): bool
{
    return strtolower(firenet_r2_station_code($pdo, $stationId)) === 'mcfs';
}

function firenet_r2_canonical_uri(string $path): string
{
    if ($path === '' || $path === '/') {
        return '/';
    }

    $segments = array_values(array_filter(explode('/', $path), static fn (string $part): bool => $part !== ''));
    if ($segments === []) {
        return '/';
    }

    return '/' . implode('/', array_map('rawurlencode', $segments));
}

function firenet_r2_canonical_query_string(array $query): string
{
    $normalized = [];
    foreach ($query as $key => $value) {
        if ($value === null || $value === '') {
            continue;
        }
        $normalized[(string) $key] = (string) $value;
    }

    ksort($normalized, SORT_STRING);
    $parts = [];
    foreach ($normalized as $key => $value) {
        $parts[] = rawurlencode($key) . '=' . rawurlencode($value);
    }

    return implode('&', $parts);
}

function firenet_r2_list_prefix_for_station_id(PDO $pdo, int $stationId, string $area = 'reports'): string
{
    $code = firenet_r2_station_code($pdo, $stationId);
    if ($area === 'orgmail') {
        return firenet_r2_orgmail_prefix($code);
    }
    if (firenet_r2_is_central_station($pdo, $stationId)) {
        return firenet_r2_base_prefix() . '/reports';
    }

    return firenet_r2_reports_prefix($code);
}

function firenet_r2_user_can_list_station(PDO $pdo, int $sessionStationId, int $targetStationId): bool
{
    if ($targetStationId < 1) {
        return false;
    }

    if ($targetStationId === $sessionStationId) {
        return true;
    }

    return firenet_r2_is_central_station($pdo, $sessionStationId);
}

function firenet_r2_list_prefix_for_station(PDO $pdo, int $stationId, string $area = 'reports'): string
{
    return firenet_r2_list_prefix_for_station_id($pdo, $stationId, $area);
}

function firenet_r2_user_can_access_key(PDO $pdo, int $stationId, string $objectKey): bool
{
    $key = ltrim(str_replace('\\', '/', trim($objectKey)), '/');
    $base = firenet_r2_base_prefix();
    if ($key === '' || strpos($key, $base . '/') !== 0) {
        return false;
    }

    if (firenet_r2_is_central_station($pdo, $stationId)) {
        return true;
    }

    $code = firenet_r2_station_code($pdo, $stationId);
    $allowedPrefixes = [
        firenet_r2_reports_prefix($code) . '/',
        firenet_r2_orgmail_prefix($code) . '/',
    ];

    foreach ($allowedPrefixes as $prefix) {
        if (strpos($key, $prefix) === 0) {
            return true;
        }
    }

    return false;
}

function firenet_r2_download_proxy_url(string $objectKey): string
{
    return '/firenet/NEWFIRENET/backend/controllers/r2_storage.php?action=download&key=' . rawurlencode($objectKey);
}

final class FirenetR2Client
{
    private string $accountId;
    private string $accessKey;
    private string $secretKey;
    private string $bucket;

    public function __construct(array $r2)
    {
        $this->accountId = trim((string) ($r2['account_id'] ?? ''));
        $this->accessKey = trim((string) ($r2['access_key_id'] ?? ''));
        $this->secretKey = trim((string) ($r2['secret_access_key'] ?? ''));
        $this->bucket = trim((string) ($r2['bucket'] ?? ''));
    }

    public static function fromConfig(): self
    {
        return new self(firenet_r2_config());
    }

    public function testConnection(): array
    {
        $response = $this->request('GET', '/' . $this->bucket, ['max-keys' => '1']);
        $ok = $response['status'] >= 200 && $response['status'] < 300;
        return [
            'ok' => $ok,
            'status' => $response['status'],
            'message' => $ok ? 'R2 bucket is reachable.' : ($response['error'] ?: 'Unable to reach R2 bucket.'),
        ];
    }

    public function listObjects(string $prefix, int $maxKeys = 500): array
    {
        $query = [
            'list-type' => '2',
            'max-keys' => (string) max(1, min(1000, $maxKeys)),
        ];
        if ($prefix !== '') {
            $query['prefix'] = rtrim($prefix, '/') . '/';
        }

        $response = $this->request('GET', '/' . $this->bucket, $query);
        if ($response['status'] < 200 || $response['status'] >= 300) {
            throw new RuntimeException($response['error'] ?: 'Failed to list R2 objects.');
        }

        $xml = @simplexml_load_string($response['body'] ?: '<ListBucketResult/>');
        if ($xml === false) {
            throw new RuntimeException('Invalid response from R2 while listing objects.');
        }

        $items = [];
        foreach ($xml->Contents ?? [] as $node) {
            $key = (string) ($node->Key ?? '');
            if ($key === '' || str_ends_with($key, '/')) {
                continue;
            }
            $items[] = [
                'key' => $key,
                'filename' => basename($key),
                'bytes' => (int) ($node->Size ?? 0),
                'last_modified' => (string) ($node->LastModified ?? ''),
            ];
        }

        return $items;
    }

    public function putObject(string $key, string $filePath, string $contentType): array
    {
        if (!is_file($filePath)) {
            throw new RuntimeException('Upload file is missing.');
        }

        $body = file_get_contents($filePath);
        if ($body === false) {
            throw new RuntimeException('Unable to read upload file.');
        }

        return $this->putObjectContents($key, $body, $contentType);
    }

    public function putObjectContents(string $key, string $body, string $contentType = 'application/octet-stream'): array
    {
        $response = $this->request(
            'PUT',
            '/' . $this->bucket . '/' . ltrim(str_replace('\\', '/', $key), '/'),
            [],
            $body,
            ['content-type' => $contentType !== '' ? $contentType : 'application/octet-stream']
        );

        if ($response['status'] < 200 || $response['status'] >= 300) {
            throw new RuntimeException($response['error'] ?: 'R2 upload failed.');
        }

        return [
            'key' => $key,
            'bytes' => strlen($body),
            'url' => firenet_r2_download_proxy_url($key),
        ];
    }

    /**
     * Create a visible "folder" marker in R2/S3 (zero-byte object ending with /).
     */
    public function ensureFolder(string $prefix): string
    {
        $folderKey = rtrim(str_replace('\\', '/', $prefix), '/') . '/';
        $this->putObjectContents($folderKey, '', 'application/x-directory');
        return $folderKey;
    }

    public function getObject(string $key): array
    {
        $response = $this->request(
            'GET',
            '/' . $this->bucket . '/' . ltrim(str_replace('\\', '/', $key), '/'),
            []
        );

        if ($response['status'] === 404) {
            throw new RuntimeException('File not found in R2.');
        }
        if ($response['status'] < 200 || $response['status'] >= 300) {
            throw new RuntimeException($response['error'] ?: 'Failed to download from R2.');
        }

        return [
            'body' => $response['body'],
            'content_type' => $response['headers']['content-type'] ?? 'application/octet-stream',
        ];
    }

    private function request(string $method, string $path, array $query, ?string $body = null, array $extraHeaders = []): array
    {
        $endpoint = 'https://' . $this->accountId . '.r2.cloudflarestorage.com';
        $canonicalPath = firenet_r2_canonical_uri($path);
        $queryString = firenet_r2_canonical_query_string($query);
        $url = $endpoint . $canonicalPath . ($queryString !== '' ? ('?' . $queryString) : '');
        $payload = $body ?? '';
        $payloadHash = hash('sha256', $payload);
        $amzDate = gmdate('Ymd\THis\Z');
        $dateStamp = gmdate('Ymd');
        $region = 'auto';
        $service = 's3';

        $headers = array_merge([
            'host' => $this->accountId . '.r2.cloudflarestorage.com',
            'x-amz-content-sha256' => $payloadHash,
            'x-amz-date' => $amzDate,
        ], array_change_key_case($extraHeaders, CASE_LOWER));

        ksort($headers);
        $canonicalHeaders = '';
        $signedHeaderNames = [];
        foreach ($headers as $name => $value) {
            $canonicalHeaders .= strtolower($name) . ':' . trim((string) $value) . "\n";
            $signedHeaderNames[] = strtolower($name);
        }
        $signedHeaders = implode(';', $signedHeaderNames);
        $canonicalRequest = implode("\n", [
            $method,
            $canonicalPath,
            $queryString,
            $canonicalHeaders,
            $signedHeaders,
            $payloadHash,
        ]);

        $credentialScope = $dateStamp . '/' . $region . '/' . $service . '/aws4_request';
        $stringToSign = implode("\n", [
            'AWS4-HMAC-SHA256',
            $amzDate,
            $credentialScope,
            hash('sha256', $canonicalRequest),
        ]);

        $signingKey = firenet_r2_signing_key($this->secretKey, $dateStamp, $region, $service);
        $signature = hash_hmac('sha256', $stringToSign, $signingKey);

        $authorization = 'AWS4-HMAC-SHA256 Credential=' . $this->accessKey . '/' . $credentialScope
            . ', SignedHeaders=' . $signedHeaders
            . ', Signature=' . $signature;

        $curlHeaders = [];
        foreach ($headers as $name => $value) {
            $curlHeaders[] = firenet_r2_header_name($name) . ': ' . $value;
        }
        $curlHeaders[] = 'Authorization: ' . $authorization;

        $ch = curl_init($url);
        $curlOptions = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
            CURLOPT_HTTPHEADER => $curlHeaders,
            CURLOPT_CONNECTTIMEOUT => 15,
            CURLOPT_TIMEOUT => 45,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        ];

        if ($method === 'HEAD') {
            $curlOptions[CURLOPT_NOBODY] = true;
            $curlOptions[CURLOPT_CUSTOMREQUEST] = 'HEAD';
        } elseif ($method === 'GET') {
            $curlOptions[CURLOPT_HTTPGET] = true;
        } else {
            $curlOptions[CURLOPT_CUSTOMREQUEST] = $method;
            $curlOptions[CURLOPT_POSTFIELDS] = $payload;
        }

        curl_setopt_array($ch, $curlOptions);

        $raw = curl_exec($ch);
        if ($raw === false) {
            $error = curl_error($ch);
            curl_close($ch);
            return ['status' => 0, 'body' => '', 'headers' => [], 'error' => $error];
        }

        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        $rawHeaders = substr($raw, 0, $headerSize);
        $responseBody = substr($raw, $headerSize);
        $parsedHeaders = [];
        foreach (preg_split('/\r\n|\n|\r/', (string) $rawHeaders) as $line) {
            if (strpos($line, ':') === false) {
                continue;
            }
            [$name, $value] = explode(':', $line, 2);
            $parsedHeaders[strtolower(trim($name))] = trim($value);
        }

        $error = '';
        if ($status >= 400 && $responseBody !== '') {
            $xml = @simplexml_load_string($responseBody);
            if ($xml && isset($xml->Message)) {
                $error = (string) $xml->Message;
            } else {
                $error = trim($responseBody);
            }
        }

        return [
            'status' => $status,
            'body' => $responseBody,
            'headers' => $parsedHeaders,
            'error' => $error,
        ];
    }
}

function firenet_r2_encode_object_path(string $key): string
{
    $parts = array_filter(explode('/', str_replace('\\', '/', $key)), static function ($part) {
        return $part !== '';
    });
    return implode('/', array_map('rawurlencode', $parts));
}

function firenet_r2_signing_key(string $secret, string $dateStamp, string $region, string $service): string
{
    $kDate = hash_hmac('sha256', $dateStamp, 'AWS4' . $secret, true);
    $kRegion = hash_hmac('sha256', $region, $kDate, true);
    $kService = hash_hmac('sha256', $service, $kRegion, true);
    return hash_hmac('sha256', 'aws4_request', $kService, true);
}

function firenet_r2_header_name(string $name): string
{
    $parts = explode('-', strtolower($name));
    return implode('-', array_map(static function ($part) {
        return $part === '' ? '' : ucfirst($part);
    }, $parts));
}

function firenet_r2_map_list_for_browser(array $objects): array
{
    $files = [];
    foreach ($objects as $object) {
        $key = (string) ($object['key'] ?? '');
        if ($key === '') {
            continue;
        }
        $files[] = [
            'public_id' => $key,
            'filename' => (string) ($object['filename'] ?? basename($key)),
            'url' => firenet_r2_download_proxy_url($key),
            'type' => 'file',
            'resource_type' => 'raw',
            'bytes' => (int) ($object['bytes'] ?? 0),
            'created_at' => (string) ($object['last_modified'] ?? ''),
            'format' => strtolower((string) pathinfo($key, PATHINFO_EXTENSION)),
        ];
    }
    return $files;
}

/**
 * Ensure R2 "folders" exist for a station under:
 *   firenet/reports/{STATION_CODE}/
 *   firenet/orgmail/{STATION_CODE}/
 *
 * @return array{ok:bool,enabled:bool,reportsPrefix:string,orgmailPrefix:string,message:string}
 */
function firenet_r2_ensure_station_folders(string $stationCode): array
{
    $code = strtoupper(preg_replace('/[^A-Z0-9_-]+/i', '', trim($stationCode)) ?: '');
    $reportsPrefix = firenet_r2_reports_prefix($code !== '' ? $code : 'STATION');
    $orgmailPrefix = firenet_r2_orgmail_prefix($code !== '' ? $code : 'STATION');

    if ($code === '') {
        return [
            'ok' => false,
            'enabled' => firenet_r2_enabled(),
            'reportsPrefix' => $reportsPrefix,
            'orgmailPrefix' => $orgmailPrefix,
            'message' => 'Station code is required to create cloud folders.',
        ];
    }

    if (!firenet_r2_enabled()) {
        return [
            'ok' => false,
            'enabled' => false,
            'reportsPrefix' => $reportsPrefix,
            'orgmailPrefix' => $orgmailPrefix,
            'message' => 'Cloud storage is not enabled, so station folders were not created.',
        ];
    }

    try {
        $client = FirenetR2Client::fromConfig();
        $client->ensureFolder($reportsPrefix);
        $client->ensureFolder($orgmailPrefix);

        // Central archive path used by completed report backups.
        if (strtoupper($code) === 'MCFS') {
            $client->ensureFolder($reportsPrefix . '/archive');
        }

        return [
            'ok' => true,
            'enabled' => true,
            'reportsPrefix' => $reportsPrefix,
            'orgmailPrefix' => $orgmailPrefix,
            'message' => 'Cloud folders ready: ' . $reportsPrefix . ' and ' . $orgmailPrefix,
        ];
    } catch (Throwable $e) {
        return [
            'ok' => false,
            'enabled' => true,
            'reportsPrefix' => $reportsPrefix,
            'orgmailPrefix' => $orgmailPrefix,
            'message' => 'Unable to create cloud folders: ' . $e->getMessage(),
        ];
    }
}
