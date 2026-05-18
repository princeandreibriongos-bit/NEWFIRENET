<?php

require_once __DIR__ . '/db.php';

function firenet_start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function firenet_is_logged_in(): bool
{
    firenet_start_session();
    return isset($_SESSION['user']);
}

function firenet_require_login(): void
{
    firenet_start_session();

    if (!isset($_SESSION['user'])) {
        header('Location: /firenet/NEWFIRENET/pages/login.html');
        exit;
    }

    $userId = (int) ($_SESSION['user']['user_id'] ?? 0);
    $timeoutMinutes = 30;

    if ($userId > 0) {
        try {
            $pdo = firenet_get_pdo();
            $stmt = $pdo->prepare('SELECT auto_logout_minutes FROM user_settings WHERE user_id = ? LIMIT 1');
            $stmt->execute([$userId]);
            $storedTimeout = (int) ($stmt->fetchColumn() ?: 0);
            if ($storedTimeout >= 0) {
                $timeoutMinutes = $storedTimeout;
            }
        } catch (Throwable $e) {
            $timeoutMinutes = 30;
        }
    }

    $now = time();
    $lastActivity = (int) ($_SESSION['last_activity'] ?? $now);
    if ($timeoutMinutes > 0 && ($now - $lastActivity) > ($timeoutMinutes * 60)) {
        $_SESSION = [];
        session_destroy();
        header('Location: /firenet/NEWFIRENET/backend/controllers/logout.php');
        exit;
    }

    $_SESSION['last_activity'] = $now;
}
