<?php
/**
 * Same-origin proxy for Open-Meteo weather + air quality (avoids CSP/network blocks).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=120');

$lat = 14.5547;
$lng = 121.0244;
$kind = strtolower(trim((string) ($_GET['kind'] ?? 'weather')));

if ($kind === 'aqi') {
    $url =
        'https://air-quality-api.open-meteo.com/v1/air-quality'
        . '?latitude=' . rawurlencode((string) $lat)
        . '&longitude=' . rawurlencode((string) $lng)
        . '&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone'
        . '&hourly=us_aqi&timezone=Asia%2FManila&forecast_days=1';
} else {
    $url =
        'https://api.open-meteo.com/v1/forecast'
        . '?latitude=' . rawurlencode((string) $lat)
        . '&longitude=' . rawurlencode((string) $lng)
        . '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m,apparent_temperature,visibility,surface_pressure'
        . '&hourly=precipitation_probability,weather_code,wind_speed_10m'
        . '&daily=precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunrise,sunset'
        . '&timezone=Asia%2FManila&forecast_days=3';
}

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 8,
        'header' => "Accept: application/json\r\nUser-Agent: FireNet-EnvIntel/1.0\r\n",
    ],
]);

$raw = @file_get_contents($url, false, $context);
if ($raw === false || $raw === '') {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'upstream_unavailable']);
    exit;
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'invalid_upstream']);
    exit;
}

$data['ok'] = true;
$data['source'] = 'open-meteo';
echo json_encode($data);
