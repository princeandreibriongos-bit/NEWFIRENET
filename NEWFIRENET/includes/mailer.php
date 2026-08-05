<?php
/**
 * Shared PHPMailer helpers for FireNet outbound email.
 */

function firenet_load_app_config(bool $reload = false): array
{
    static $config = null;
    if ($reload) {
        $config = null;
    }
    if ($config !== null) {
        return $config;
    }

    $configFile = __DIR__ . '/../config/config.php';
    if (!is_file($configFile)) {
        $config = [];
        return $config;
    }

    $loaded = require $configFile;
    $config = is_array($loaded) ? $loaded : [];

    // Overlay district System Settings (Admin → System) when available.
    $systemSettingsFile = __DIR__ . '/system_settings.php';
    if (is_file($systemSettingsFile)) {
        require_once $systemSettingsFile;
        if (function_exists('firenet_apply_system_settings_to_config')) {
            $config = firenet_apply_system_settings_to_config($config);
        }
    }

    // Env vars win last (Vercel secrets for R2 + SMTP/OTP).
    $envOverrides = __DIR__ . '/../config/env_overrides.php';
    if (is_file($envOverrides)) {
        require_once $envOverrides;
        if (function_exists('firenet_apply_env_config')) {
            $config = firenet_apply_env_config($config);
        }
    }

    return $config;
}

function firenet_mailer_is_ready(): bool
{
    static $ready = null;
    if ($ready !== null) {
        return $ready;
    }

    if (class_exists('\\PHPMailer\\PHPMailer\\PHPMailer')) {
        $ready = true;
        return true;
    }

    $autoloadPath = __DIR__ . '/../vendor/autoload.php';
    if (is_file($autoloadPath)) {
        require_once $autoloadPath;
        if (class_exists('\\PHPMailer\\PHPMailer\\PHPMailer')) {
            $ready = true;
            return true;
        }
    }

    // Fallback when Composer metadata exists but the package tree was incomplete.
    $manualFiles = [
        __DIR__ . '/../vendor/phpmailer/phpmailer/src/Exception.php',
        __DIR__ . '/../vendor/phpmailer/phpmailer/src/PHPMailer.php',
        __DIR__ . '/../vendor/phpmailer/phpmailer/src/SMTP.php',
    ];

    foreach ($manualFiles as $file) {
        if (!is_file($file)) {
            $ready = false;
            return false;
        }
    }

    require_once $manualFiles[0];
    require_once $manualFiles[1];
    require_once $manualFiles[2];

    $ready = class_exists('\\PHPMailer\\PHPMailer\\PHPMailer');
    return $ready;
}

function firenet_mail_config(): array
{
    $config = firenet_load_app_config();
    $mailConfig = is_array($config['mail'] ?? null) ? $config['mail'] : [];

    $smtpHost = trim((string) ($mailConfig['smtp_host'] ?? ''));
    $smtpPort = (int) ($mailConfig['smtp_port'] ?? 587);
    $smtpUser = trim((string) ($mailConfig['smtp_username'] ?? ''));
    $smtpPass = preg_replace('/\s+/', '', (string) ($mailConfig['smtp_password'] ?? ''));
    $smtpEncryption = strtolower(trim((string) ($mailConfig['smtp_encryption'] ?? 'tls')));
    $fromEmail = trim((string) ($mailConfig['from_email'] ?? $smtpUser));
    $fromName = trim((string) ($mailConfig['from_name'] ?? 'FireNet Security'));

    if (!in_array($smtpEncryption, ['ssl', 'tls'], true)) {
        $smtpEncryption = 'tls';
    }

    return [
        'smtp_host' => $smtpHost,
        'smtp_port' => $smtpPort,
        'smtp_username' => $smtpUser,
        'smtp_password' => $smtpPass,
        'smtp_encryption' => $smtpEncryption,
        'from_email' => $fromEmail,
        'from_name' => $fromName,
    ];
}

function firenet_mail_config_is_complete(array $mailConfig): bool
{
    return $mailConfig['smtp_host'] !== ''
        && (int) $mailConfig['smtp_port'] > 0
        && $mailConfig['smtp_username'] !== ''
        && $mailConfig['smtp_password'] !== ''
        && $mailConfig['from_email'] !== '';
}

/**
 * @throws RuntimeException
 */
function firenet_create_mailer()
{
    if (!firenet_mailer_is_ready()) {
        throw new RuntimeException('PHPMailer is not installed. Run Composer install first.');
    }

    $mailConfig = firenet_mail_config();
    if (!firenet_mail_config_is_complete($mailConfig)) {
        throw new RuntimeException('SMTP settings are incomplete. Please configure mail settings in config/config.php.');
    }

    $mailerClass = '\\PHPMailer\\PHPMailer\\PHPMailer';
    $mailer = new $mailerClass(true);
    $mailer->isSMTP();
    $mailer->Host = $mailConfig['smtp_host'];
    $mailer->SMTPAuth = true;
    $mailer->Username = $mailConfig['smtp_username'];
    $mailer->Password = $mailConfig['smtp_password'];
    $mailer->SMTPSecure = $mailConfig['smtp_encryption'];
    $mailer->Port = (int) $mailConfig['smtp_port'];
    $mailer->CharSet = 'UTF-8';
    // XAMPP/Windows often lacks a complete CA bundle; allow TLS to Gmail SMTP.
    $mailer->SMTPOptions = [
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true,
        ],
    ];
    $mailer->setFrom($mailConfig['from_email'], $mailConfig['from_name']);

    return $mailer;
}

/**
 * @throws RuntimeException
 */
function firenet_send_mail(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody): void
{
    $mailer = firenet_create_mailer();
    $mailer->addAddress($toEmail, $toName !== '' ? $toName : $toEmail);
    $mailer->isHTML(true);
    $mailer->Subject = $subject;
    $mailer->Body = $htmlBody;
    $mailer->AltBody = $textBody;

    $logoPath = __DIR__ . '/../assets/img/bfpmakatilogo.jpg';
    if (is_file($logoPath) && strpos($htmlBody, 'cid:firenet-logo') !== false) {
        $mailer->addEmbeddedImage($logoPath, 'firenet-logo', 'bfpmakatilogo.jpg');
    }

    $mailer->send();
}

function firenet_email_shell(string $title, string $innerHtml): string
{
    $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
    $year = date('Y');

    return '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>' . $safeTitle . '</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#152033;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;max-width:560px;">
    <tr>
      <td style="padding:18px 20px 16px;border-bottom:3px solid #bc1f2d;">
        <table role="presentation" cellspacing="0" cellpadding="0">
          <tr>
            <td style="vertical-align:middle;padding-right:14px;">
              <img src="cid:firenet-logo" alt="BFP Makati Fire District" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:10px;border:1px solid #d7deea;">
            </td>
            <td style="vertical-align:middle;">
              <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b778c;font-weight:700;">Makati Fire District</div>
              <div style="margin-top:2px;font-size:22px;line-height:1.1;color:#152033;font-weight:800;letter-spacing:-0.03em;">FireNet</div>
              <div style="margin-top:4px;font-size:13px;color:#5a667d;">' . $safeTitle . '</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:22px 20px;color:#152033;">
        ' . $innerHtml . '
      </td>
    </tr>
    <tr>
      <td style="padding:14px 20px 20px;border-top:1px solid #e4eaf3;color:#7a879c;font-size:12px;line-height:1.5;">
        This message was sent by FireNet Security. Do not share one-time codes with anyone.
        <br>&copy; ' . $year . ' FireNet · Makati Fire District
      </td>
    </tr>
  </table>
</body>
</html>';
}
