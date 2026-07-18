<?php
/**
 * Civilian public-alert templates + shared broadcast helpers.
 */

require_once __DIR__ . '/mailer.php';
require_once __DIR__ . '/sms.php';

/**
 * @return array<string,array{id:string,label:string,icon:string,severity:string,subject:string,body:string,topic:string}>
 */
function firenet_alert_templates(): array
{
    return [
        'typhoon' => [
            'id' => 'typhoon',
            'label' => 'Typhoon / storm',
            'icon' => 'bi-tropical-storm',
            'severity' => 'Tropical cyclone or typhoon-like wind and rain',
            'subject' => 'Typhoon watch — Makati Fire District advisory',
            'body' => "PAGASA-level storm conditions may affect Metro Manila.\n\n"
                . "What to do now:\n"
                . "• Stay indoors and away from windows\n"
                . "• Charge phones and prepare a go-bag\n"
                . "• Move vehicles away from flood-prone streets\n"
                . "• Call 168 only for emergencies\n\n"
                . "Monitor official PAGASA and Makati Fire District updates.",
            'topic' => 'weather',
        ],
        'flashflood' => [
            'id' => 'flashflood',
            'label' => 'Flash flood',
            'icon' => 'bi-cloud-rain-heavy',
            'severity' => 'Heavy rain and flood-prone roads',
            'subject' => 'Flash flood watch — avoid flooded roads',
            'body' => "Heavy rainfall may cause sudden flooding in low-lying Makati areas.\n\n"
                . "Safety reminders:\n"
                . "• Do not walk or drive through floodwater\n"
                . "• Avoid underpasses and basement parking\n"
                . "• Move valuables to higher floors\n"
                . "• Call 168 if someone is trapped or in danger\n\n"
                . "Stay clear of open canals and blocked drainage.",
            'topic' => 'weather',
        ],
        'heat' => [
            'id' => 'heat',
            'label' => 'Extreme heat',
            'icon' => 'bi-thermometer-sun',
            'severity' => 'Dangerously hot conditions',
            'subject' => 'Extreme heat advisory — stay hydrated',
            'body' => "Temperatures are dangerously high in Metro Manila.\n\n"
                . "Protect your household:\n"
                . "• Limit outdoor activity from 10 AM–3 PM\n"
                . "• Drink water often; avoid alcohol and sugary drinks\n"
                . "• Check on children, elderly, and outdoor workers\n"
                . "• Never leave children or pets in parked vehicles\n\n"
                . "Seek cool shade and rest if you feel dizzy or nauseous.",
            'topic' => 'weather',
        ],
        'cold' => [
            'id' => 'cold',
            'label' => 'Cold / chill',
            'icon' => 'bi-snow',
            'severity' => 'Unusually cold or chilly conditions',
            'subject' => 'Cold weather advisory — keep warm and dry',
            'body' => "Unusually cool conditions are affecting Metro Manila.\n\n"
                . "Tips for households:\n"
                . "• Dress in layers, especially for children and elderly\n"
                . "• Keep living areas dry and well-ventilated\n"
                . "• Watch for fever or breathing difficulty\n"
                . "• Use safe heating only — never leave open flames unattended\n\n"
                . "Call 168 for fire or medical emergencies.",
            'topic' => 'weather',
        ],
        'tsunami' => [
            'id' => 'tsunami',
            'label' => 'Tsunami warning',
            'icon' => 'bi-tsunami',
            'severity' => 'Coastal tsunami threat (regional advisory)',
            'subject' => 'Tsunami warning — move to higher ground if advised',
            'body' => "A tsunami advisory/warning has been issued for Philippine coastal areas.\n\n"
                . "If you are near the coast or in a warned zone:\n"
                . "• Move immediately to higher ground or inland\n"
                . "• Follow LGU / NDRRMC / PHIVOLCS instructions\n"
                . "• Do not go to the shoreline to watch waves\n"
                . "• Bring go-bag, IDs, and essential medicines\n\n"
                . "Makati inland residents: stay informed and assist family in coastal LGUs if needed.\n"
                . "Emergency: Call 168.",
            'topic' => 'weather',
        ],
    ];
}

/**
 * @return array{mailReady:bool,smsReady:bool,mailerReady:bool,smsProvider:string,smsMode:string}
 */
function firenet_alert_channels_status(): array
{
    $sms = firenet_sms_config();
    $mailReady = firenet_mailer_is_ready() && firenet_mail_config_is_complete(firenet_mail_config());

    return [
        'mailReady' => $mailReady,
        'mailerReady' => firenet_mailer_is_ready(),
        'smsReady' => firenet_sms_is_ready(),
        'smsProvider' => (string) ($sms['provider'] ?? ''),
        'smsMode' => (($sms['provider'] ?? '') === 'log') ? 'local-log' : 'gateway',
    ];
}

function firenet_alerts_ensure_tables(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS civilian_alert_subscribers (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(190) NULL,
            phone VARCHAR(32) NULL,
            channel_email TINYINT(1) NOT NULL DEFAULT 0,
            channel_sms TINYINT(1) NOT NULL DEFAULT 0,
            topics VARCHAR(255) NOT NULL DEFAULT "weather,announcements",
            barangay VARCHAR(120) NULL,
            unsubscribe_token VARCHAR(64) NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            UNIQUE KEY uq_email (email),
            UNIQUE KEY uq_phone (phone),
            KEY idx_active (is_active, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS civilian_alert_broadcasts (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            subject VARCHAR(190) NOT NULL,
            body TEXT NOT NULL,
            topic VARCHAR(40) NOT NULL DEFAULT "announcements",
            template_id VARCHAR(40) NULL,
            send_email TINYINT(1) NOT NULL DEFAULT 0,
            send_sms TINYINT(1) NOT NULL DEFAULT 0,
            email_sent INT UNSIGNED NOT NULL DEFAULT 0,
            email_failed INT UNSIGNED NOT NULL DEFAULT 0,
            sms_sent INT UNSIGNED NOT NULL DEFAULT 0,
            sms_failed INT UNSIGNED NOT NULL DEFAULT 0,
            recipient_count INT UNSIGNED NOT NULL DEFAULT 0,
            created_by INT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_created (created_at),
            KEY idx_template (template_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    try {
        $pdo->exec('ALTER TABLE civilian_alert_broadcasts ADD COLUMN template_id VARCHAR(40) NULL AFTER topic');
    } catch (Throwable $ignored) {
        // column may already exist
    }

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS civilian_alert_sms_log (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            phone VARCHAR(32) NOT NULL,
            message TEXT NOT NULL,
            status VARCHAR(40) NOT NULL DEFAULT "logged",
            provider VARCHAR(40) NOT NULL DEFAULT "log",
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
}

/**
 * Detect hazard templates from Open-Meteo-like weather payload.
 *
 * @param array<string,mixed> $weather
 * @return list<string> template ids
 */
function firenet_detect_weather_template_ids(array $weather): array
{
    $current = is_array($weather['current'] ?? null) ? $weather['current'] : [];
    $daily = is_array($weather['daily'] ?? null) ? $weather['daily'] : [];
    $hourly = is_array($weather['hourly'] ?? null) ? $weather['hourly'] : [];

    $temp = (float) ($current['temperature_2m'] ?? 0);
    $code = (int) ($current['weather_code'] ?? 0);
    $wind = (float) ($current['wind_speed_10m'] ?? 0);
    $gust = (float) ($current['wind_gusts_10m'] ?? 0);
    $precip = (float) ($current['precipitation'] ?? 0);

    $rainChances = is_array($hourly['precipitation_probability'] ?? null)
        ? array_map('floatval', array_slice($hourly['precipitation_probability'], 0, 24))
        : [];
    $maxRain = $rainChances ? max($rainChances) : 0.0;

    $dailyWind = is_array($daily['wind_speed_10m_max'] ?? null)
        ? array_map('floatval', $daily['wind_speed_10m_max'])
        : [];
    $dailyGust = is_array($daily['wind_gusts_10m_max'] ?? null)
        ? array_map('floatval', $daily['wind_gusts_10m_max'])
        : [];
    $dailyPrecip = is_array($daily['precipitation_sum'] ?? null)
        ? array_map('floatval', $daily['precipitation_sum'])
        : [];
    $maxWind = $dailyWind ? max($dailyWind) : $wind;
    $maxGust = $dailyGust ? max($dailyGust) : $gust;
    $maxPrecip = $dailyPrecip ? max($dailyPrecip) : 0.0;

    $ids = [];

    if ($temp >= 36) {
        $ids[] = 'heat';
    }
    if ($temp > 0 && $temp <= 20) {
        $ids[] = 'cold';
    }
    if ($maxRain >= 70 || $maxPrecip >= 20 || $precip >= 2) {
        $ids[] = 'flashflood';
    }
    if (($maxWind >= 62 || $maxGust >= 80) && ($maxRain >= 55 || $maxPrecip >= 20 || $code >= 80)) {
        $ids[] = 'typhoon';
    } elseif ($maxWind >= 45 || $maxGust >= 60 || $code >= 95) {
        $ids[] = 'typhoon';
    }

    // Tsunami is not inferred from Open-Meteo; only included when explicitly requested.
    return array_values(array_unique($ids));
}

/**
 * Fetch Makati weather from Open-Meteo.
 *
 * @return array<string,mixed>
 */
function firenet_fetch_makati_weather(): array
{
    $url = 'https://api.open-meteo.com/v1/forecast'
        . '?latitude=14.5547&longitude=121.0244'
        . '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m,precipitation'
        . '&hourly=precipitation_probability,weather_code,wind_speed_10m'
        . '&daily=weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max'
        . '&timezone=Asia%2FManila&forecast_days=2';

    if (!function_exists('curl_init')) {
        throw new RuntimeException('cURL is required to fetch weather.');
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno !== 0) {
        throw new RuntimeException('Weather request failed: ' . $error);
    }
    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('Weather provider error (HTTP ' . $status . ').');
    }

    $decoded = json_decode((string) $raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid weather response.');
    }

    return $decoded;
}

/**
 * @param array{subject:string,body:string,topic?:string,sendEmail?:bool,sendSms?:bool,barangay?:string,templateId?:string,createdBy?:int|null} $opts
 * @return array<string,mixed>
 */
function firenet_broadcast_civilian_alert(PDO $pdo, array $opts): array
{
    firenet_alerts_ensure_tables($pdo);

    $subject = trim((string) ($opts['subject'] ?? ''));
    $body = trim((string) ($opts['body'] ?? ''));
    $topic = strtolower(trim((string) ($opts['topic'] ?? 'weather')));
    $sendEmail = !empty($opts['sendEmail']);
    $sendSms = !empty($opts['sendSms']);
    $barangay = trim((string) ($opts['barangay'] ?? ''));
    $templateId = trim((string) ($opts['templateId'] ?? ''));
    $createdBy = isset($opts['createdBy']) ? (int) $opts['createdBy'] : null;

    if (!in_array($topic, ['weather', 'announcements', 'safety', 'all'], true)) {
        $topic = 'weather';
    }
    if ($subject === '' || strlen($subject) > 160) {
        throw new InvalidArgumentException('Enter a subject (max 160 characters).');
    }
    if ($body === '' || strlen($body) > 4000) {
        throw new InvalidArgumentException('Enter an alert message (max 4000 characters).');
    }
    if (!$sendEmail && !$sendSms) {
        throw new InvalidArgumentException('Choose Email and/or SMS.');
    }

    $status = firenet_alert_channels_status();
    if ($sendEmail && !$status['mailReady']) {
        throw new RuntimeException('Email is not ready. Configure Gmail SMTP in config/config.php.');
    }
    if ($sendSms && !$status['smsReady']) {
        throw new RuntimeException('SMS is not ready. Enable sms settings in config/config.php (provider log or Semaphore API key).');
    }

    $sql = 'SELECT id, email, phone, channel_email, channel_sms, topics, barangay
            FROM civilian_alert_subscribers
            WHERE is_active = 1';
    $params = [];
    if ($topic !== 'all') {
        $sql .= ' AND FIND_IN_SET(?, topics)';
        $params[] = $topic;
    }
    if ($barangay !== '') {
        $sql .= ' AND barangay = ?';
        $params[] = $barangay;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $emailSent = 0;
    $emailFailed = 0;
    $smsSent = 0;
    $smsFailed = 0;
    $emailErrors = [];
    $smsErrors = [];
    $targeted = 0;

    $safeSubject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
    $safeBodyHtml = nl2br(htmlspecialchars($body, ENT_QUOTES, 'UTF-8'));
    $topicLabel = $topic === 'all' ? 'All topics' : ucfirst($topic);
    $badge = $templateId !== '' ? ('Template · ' . $templateId) : ('Public alert · ' . $topicLabel);
    $inner = '<p style="margin:0 0 10px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b778c;font-weight:700;">'
        . htmlspecialchars($badge, ENT_QUOTES, 'UTF-8')
        . '</p>'
        . '<h1 style="margin:0 0 14px;font-size:22px;line-height:1.2;color:#152033;">' . $safeSubject . '</h1>'
        . '<div style="font-size:15px;line-height:1.55;color:#243247;">' . $safeBodyHtml . '</div>'
        . '<p style="margin:18px 0 0;font-size:13px;color:#5a667d;">Makati Fire District · FireNet public alert service</p>';
    $html = firenet_email_shell('Public alert', $inner);
    $text = $subject . "\n\n" . $body . "\n\n— FireNet · Makati Fire District";
    $smsText = 'FireNet: ' . $subject . ' — ' . preg_replace("/\s+/", ' ', $body);

    foreach ($rows as $row) {
        $didTarget = false;

        if ($sendEmail && (int) ($row['channel_email'] ?? 0) === 1) {
            $email = strtolower(trim((string) ($row['email'] ?? '')));
            if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $didTarget = true;
                try {
                    firenet_send_mail($email, '', 'FireNet Alert · ' . $subject, $html, $text);
                    $emailSent++;
                } catch (Throwable $mailError) {
                    $emailFailed++;
                    if (count($emailErrors) < 5) {
                        $emailErrors[] = $email . ': ' . $mailError->getMessage();
                    }
                }
            }
        }

        if ($sendSms && (int) ($row['channel_sms'] ?? 0) === 1) {
            $phone = firenet_sms_normalize_phone((string) ($row['phone'] ?? ''));
            if ($phone !== '') {
                $didTarget = true;
                $result = firenet_send_sms($phone, $smsText);
                if (!empty($result['ok'])) {
                    $smsSent++;
                } else {
                    $smsFailed++;
                    if (count($smsErrors) < 5) {
                        $smsErrors[] = $phone . ': ' . (string) ($result['message'] ?? 'failed');
                    }
                }
            }
        }

        if ($didTarget) {
            $targeted++;
        }
    }

    $ins = $pdo->prepare(
        'INSERT INTO civilian_alert_broadcasts
            (subject, body, topic, template_id, send_email, send_sms, email_sent, email_failed, sms_sent, sms_failed, recipient_count, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $ins->execute([
        $subject,
        $body,
        $topic,
        $templateId !== '' ? $templateId : null,
        $sendEmail ? 1 : 0,
        $sendSms ? 1 : 0,
        $emailSent,
        $emailFailed,
        $smsSent,
        $smsFailed,
        $targeted,
        $createdBy && $createdBy > 0 ? $createdBy : null,
    ]);

    $summaryParts = [];
    if ($sendEmail) {
        $summaryParts[] = $emailSent . ' email sent' . ($emailFailed ? (', ' . $emailFailed . ' failed') : '');
    }
    if ($sendSms) {
        $summaryParts[] = $smsSent . ' SMS sent' . ($smsFailed ? (', ' . $smsFailed . ' failed') : '');
    }

    return [
        'recipientCount' => $targeted,
        'emailSent' => $emailSent,
        'emailFailed' => $emailFailed,
        'smsSent' => $smsSent,
        'smsFailed' => $smsFailed,
        'emailErrors' => $emailErrors,
        'smsErrors' => $smsErrors,
        'message' => $targeted > 0
            ? ('Broadcast complete: ' . implode('; ', $summaryParts) . '.')
            : 'No matching subscribers for the selected filters. Ask civilians to subscribe on the public portal first.',
    ];
}

/**
 * Auto-send detected weather templates with cooldown.
 *
 * @return array<string,mixed>
 */
function firenet_auto_send_weather_alerts(PDO $pdo, bool $sendEmail, bool $sendSms, ?int $createdBy = null): array
{
    $weather = firenet_fetch_makati_weather();
    $detected = firenet_detect_weather_template_ids($weather);
    $templates = firenet_alert_templates();
    $sent = [];
    $skipped = [];

    if (!$detected) {
        return [
            'detected' => [],
            'sent' => [],
            'skipped' => [],
            'message' => 'No heat, cold, flash-flood, or typhoon thresholds matched right now.',
            'weather' => [
                'temperature' => $weather['current']['temperature_2m'] ?? null,
                'wind' => $weather['current']['wind_speed_10m'] ?? null,
            ],
        ];
    }

    foreach ($detected as $id) {
        if (!isset($templates[$id])) {
            continue;
        }

        $cooldownStmt = $pdo->prepare(
            'SELECT id FROM civilian_alert_broadcasts
             WHERE template_id = ?
               AND created_at >= (NOW() - INTERVAL 6 HOUR)
             LIMIT 1'
        );
        $cooldownStmt->execute([$id]);
        if ($cooldownStmt->fetchColumn()) {
            $skipped[] = ['id' => $id, 'reason' => 'Already sent within the last 6 hours'];
            continue;
        }

        $tpl = $templates[$id];
        $result = firenet_broadcast_civilian_alert($pdo, [
            'subject' => $tpl['subject'],
            'body' => $tpl['body'],
            'topic' => $tpl['topic'],
            'sendEmail' => $sendEmail,
            'sendSms' => $sendSms,
            'templateId' => $id,
            'createdBy' => $createdBy,
        ]);
        $sent[] = [
            'id' => $id,
            'label' => $tpl['label'],
            'result' => $result,
        ];
    }

    return [
        'detected' => $detected,
        'sent' => $sent,
        'skipped' => $skipped,
        'message' => $sent
            ? ('Auto-sent ' . count($sent) . ' weather alert template(s).')
            : 'Weather hazards detected but nothing new was sent (cooldown or no recipients).',
        'weather' => [
            'temperature' => $weather['current']['temperature_2m'] ?? null,
            'wind' => $weather['current']['wind_speed_10m'] ?? null,
        ],
    ];
}
