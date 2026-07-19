<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';
firenet_start_session();

// Security HTTP headers - practical defaults for the app
// These headers help mitigate XSS, clickjacking, MIME sniffing and enforce HTTPS.
// Adjust CSP `script-src` and `style-src` to match your loaded external resources.
if (!headers_sent()) {
  header('X-Frame-Options: DENY');
  header('X-Content-Type-Options: nosniff');
  header('Referrer-Policy: no-referrer-when-downgrade');
  header('Permissions-Policy: geolocation=(), microphone=()');
  header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
  header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://www.gstatic.com https://accounts.google.com https://apis.google.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; img-src 'self' data: https:; connect-src 'self' https://maps.googleapis.com https://accounts.google.com https://www.googleapis.com https://api.open-meteo.com https://air-quality-api.open-meteo.com; frame-src 'self' https://accounts.google.com https://www.google.com;");
}

$currentPath = (string) parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$reportsPath = '/firenet/NEWFIRENET/backend/pages/reports.php';
$calendarPath = '/firenet/NEWFIRENET/backend/pages/calendar.php';
$stationIncidentLogsPath = '/firenet/NEWFIRENET/backend/pages/station_incident_logs.php';
$stationMailsPath = '/firenet/NEWFIRENET/backend/pages/station_mails.php';
$adminSettingsPath = '/firenet/NEWFIRENET/backend/pages/admin_settings.php';
$auditLogPath = '/firenet/NEWFIRENET/backend/pages/audit_log.php';
$legacyUsersPath = '/firenet/NEWFIRENET/backend/pages/users.php';
$analyticsPath = '/firenet/NEWFIRENET/backend/pages/analytics.php';
$dashboardPath = '/firenet/NEWFIRENET/backend/pages/dashboard.php';
$settingsPath = '/firenet/NEWFIRENET/backend/pages/settings.php';
$generalMailPath = '/firenet/NEWFIRENET/backend/pages/general_mail.php';
$operationalMailPath = '/firenet/NEWFIRENET/backend/pages/operational_mail.php';

$sessionUser = $_SESSION['user'] ?? [];
$sessionUsername = (string) ($sessionUser['username'] ?? 'Unknown User');
$sessionRole = ucfirst(strtolower((string) ($sessionUser['role'] ?? 'user')));
$sessionRoleKey = strtolower((string) ($sessionUser['role'] ?? 'user'));
$sessionStationId = (int) ($sessionUser['station_id'] ?? 1);
$sidebarMailOpen = in_array(
  $currentPath,
  [$stationMailsPath, $generalMailPath, $operationalMailPath],
  true
);
$adminSettingsPaths = [$adminSettingsPath, $legacyUsersPath, $auditLogPath];
$adminSettingsOpen = in_array($currentPath, $adminSettingsPaths, true);
$adminSettingsTab = strtolower(trim((string) ($_GET['tab'] ?? 'accounts')));
if (!in_array($adminSettingsTab, ['accounts', 'news', 'notices', 'substations', 'alerts', 'system'], true)) {
  $adminSettingsTab = 'accounts';
}
$sessionUserId = (int) ($sessionUser['user_id'] ?? 0);
$sessionStationName = 'Station ' . $sessionStationId;
$headerProfilePhotoUrl = '';
$headerProfileInitials = 'FN';
$sessionIsCentralStation = false;

function firenet_build_initials(string $primary, string $fallback): string {
  $source = trim($primary) !== '' ? $primary : $fallback;
  $clean = preg_replace('/[^A-Za-z0-9\s]+/', ' ', $source) ?? '';
  $parts = preg_split('/\s+/', trim($clean)) ?: [];
  $parts = array_values(array_filter($parts, 'strlen'));

  if (count($parts) >= 2) {
    $initials = substr($parts[0], 0, 1) . substr($parts[1], 0, 1);
  } elseif (count($parts) === 1) {
    $initials = substr($parts[0], 0, 2);
  } else {
    $initials = 'FN';
  }

  return strtoupper($initials);
}
$roleLabelForInitials = $sessionRole;
if ($sessionRoleKey === 'superadmin') {
  $roleLabelForInitials = 'Super Admin';
}
$usernameKey = strtolower(trim($sessionUsername));
$roleLabelKey = strtolower(str_replace(' ', '', $roleLabelForInitials));
$initialsSource = $sessionUsername;
if ($usernameKey === $sessionRoleKey || $usernameKey === $roleLabelKey) {
  $initialsSource = $roleLabelForInitials;
}
$headerProfileInitials = firenet_build_initials($initialsSource, $roleLabelForInitials);

if ($sessionStationId > 0) {
  try {
    $pdo = firenet_get_pdo();
    $stationNameStmt = $pdo->prepare('SELECT station_name, station_code FROM stations WHERE station_id = ? LIMIT 1');
    $stationNameStmt->execute([$sessionStationId]);
    $stationRow = $stationNameStmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $sessionStationName = (string) ($stationRow['station_name'] ?? $sessionStationName);
    $sessionIsCentralStation = strtolower((string) ($stationRow['station_code'] ?? '')) === 'mcfs';
  } catch (Throwable $e) {
    $sessionStationName = 'Station ' . $sessionStationId;
  }
}

$mailHomePath = $sessionIsCentralStation ? $stationMailsPath : $generalMailPath;

if ($sessionUserId > 0) {
  try {
    $pdo = firenet_get_pdo();
    $photoTableExistsStmt = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profile_photos'");
    $photoTableExists = (int) ($photoTableExistsStmt->fetchColumn() ?: 0) > 0;

    if ($photoTableExists) {
      $photoStmt = $pdo->prepare('SELECT file_path FROM user_profile_photos WHERE user_id = ? LIMIT 1');
      $photoStmt->execute([$sessionUserId]);
      $photoPath = (string) ($photoStmt->fetchColumn() ?: '');
      if ($photoPath !== '') {
        $normalizedPath = str_replace('\\', '/', $photoPath);
        $normalizedPath = ltrim($normalizedPath, '/');
        if (strpos($normalizedPath, 'uploads/photos/') === 0) {
          $headerProfilePhotoUrl = '/firenet/NEWFIRENET/' . $normalizedPath;
        }
      }
    }
  } catch (Throwable $e) {
    $headerProfilePhotoUrl = '';
  }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FireNet Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
  <link rel="stylesheet" href="/firenet/NEWFIRENET/assets/css/style.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/style.css'); ?>">
  <link rel="stylesheet" href="/firenet/NEWFIRENET/assets/css/portal-theme.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/portal-theme.css'); ?>">
  <link rel="stylesheet" href="/firenet/NEWFIRENET/assets/css/portal-chrome.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/portal-chrome.css'); ?>">
  <link rel="stylesheet" href="/firenet/NEWFIRENET/assets/css/portal-fx.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/portal-fx.css'); ?>">
  <?php if (isset($pageStyles) && is_array($pageStyles)): ?>
    <?php foreach ($pageStyles as $stylePath): ?>
      <link rel="stylesheet" href="<?php echo htmlspecialchars($stylePath); ?>">
    <?php endforeach; ?>
  <?php endif; ?>
  <link rel="stylesheet" href="/firenet/NEWFIRENET/assets/css/portal-premium.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/portal-premium.css'); ?>">
  <link rel="stylesheet" href="/firenet/NEWFIRENET/assets/css/portal-theme-light.css?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/css/portal-theme-light.css'); ?>">
  <script>
    (function () {
      try {
        var theme = localStorage.getItem('firenet_system_theme');
        if (theme !== 'light' && theme !== 'dark') theme = 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  </script>
</head>
<body class="<?php echo trim(((isset($_SESSION['user']) ? 'is-authenticated' : '') . ' ' . ($bodyClass ?? ''))); ?>">
  <div class="fn-loader" id="fnLoader" role="status" aria-live="polite" aria-label="Loading FireNet">
    <div class="fn-loader-core">
      <div class="fn-loader-badge">
        <img class="fn-loader-logo" src="/firenet/NEWFIRENET/assets/img/bfpmakatilogo.jpg" alt="Makati Fire District">
      </div>
      <div class="fn-loader-wordmark">FIRENET</div>
      <div class="fn-loader-sub">Makati Fire District</div>
      <div class="fn-loader-track" aria-hidden="true"><span></span></div>
      <p class="fn-loader-status">Establishing secure dispatch link…</p>
    </div>
  </div>
  <div class="fn-navbar" id="fnNavbar" aria-hidden="true"></div>
  <header class="app-header">
    <div class="app-header-inner">
      <div class="header-brand">
        <?php if (isset($_SESSION['user'])): ?>
          <button type="button" class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Open navigation" aria-expanded="false" aria-controls="appSidebar">
            <i class="bi bi-list" aria-hidden="true"></i>
          </button>
        <?php endif; ?>
        <a class="app-brand" href="<?php echo htmlspecialchars($dashboardPath); ?>" aria-label="FireNet — Home">
          <span class="brand-mark" aria-hidden="true">
            <img class="app-brand-logo" src="/firenet/NEWFIRENET/assets/img/bfpmakatilogo.jpg" alt="">
          </span>
          <span class="brand-text">
            <span class="brand-title">FireNet</span>
            <?php if (isset($_SESSION['user'])): ?>
              <span class="brand-station" id="headerStationName"><?php echo htmlspecialchars($sessionStationName); ?></span>
            <?php else: ?>
              <span class="brand-station brand-station--muted">Makati Fire District</span>
            <?php endif; ?>
          </span>
        </a>
      </div>

      <?php if (isset($_SESSION['user'])): ?>
        <nav class="header-ribbon" aria-label="Quick navigation">
          <a class="ribbon-pill<?php echo $currentPath === $dashboardPath ? ' is-active' : ''; ?>" href="<?php echo htmlspecialchars($dashboardPath); ?>"><i class="bi bi-grid-1x2-fill" aria-hidden="true"></i>Overview</a>
          <a class="ribbon-pill<?php echo $currentPath === $reportsPath ? ' is-active' : ''; ?>" href="<?php echo htmlspecialchars($reportsPath); ?>"><i class="bi bi-file-earmark-text-fill" aria-hidden="true"></i>Reports</a>
          <a class="ribbon-pill<?php echo $currentPath === $calendarPath ? ' is-active' : ''; ?>" href="<?php echo htmlspecialchars($calendarPath); ?>"><i class="bi bi-calendar3" aria-hidden="true"></i>Calendar</a>
          <a class="ribbon-pill<?php echo $currentPath === $stationIncidentLogsPath ? ' is-active' : ''; ?>" href="<?php echo htmlspecialchars($stationIncidentLogsPath); ?>"><i class="bi bi-journal-text" aria-hidden="true"></i>Logs</a>
          <a class="ribbon-pill<?php echo $currentPath === $analyticsPath ? ' is-active' : ''; ?>" href="<?php echo htmlspecialchars($analyticsPath); ?>"><i class="bi bi-graph-up-arrow" aria-hidden="true"></i>Analytics</a>
        </nav>
      <?php else: ?>
        <nav class="header-ribbon header-ribbon--guest" aria-label="Account">
          <a class="ribbon-pill ribbon-pill--accent" href="/firenet/NEWFIRENET/pages/login.html"><i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>Sign in</a>
        </nav>
      <?php endif; ?>

      <?php if (isset($_SESSION['user'])): ?>
        <div class="header-right">
          <div class="header-weather-host" id="headerWeatherHost">
            <button type="button" class="header-weather is-loading" id="headerWeatherBtn" aria-expanded="false" aria-controls="headerWeatherPopover" title="Makati weather — click for details">
              <span class="header-weather-icon" aria-hidden="true"><i class="bi bi-cloud-sun" id="headerWeatherIcon"></i></span>
              <span class="header-weather-copy">
                <span class="header-weather-temp" id="headerWeatherTemp">—°</span>
                <span class="header-weather-label" id="headerWeatherLabel">Makati weather</span>
              </span>
            </button>
            <div class="header-weather-popover" id="headerWeatherPopover" hidden role="dialog" aria-label="Weather details">
              <h3 id="headerWeatherPopoverTitle">Makati Fire District</h3>
              <p id="headerWeatherPopoverDesc">Loading live conditions…</p>
              <div class="header-weather-meta">
                <span><small>Humidity</small><strong id="headerWeatherHumidity">—</strong></span>
                <span><small>Wind</small><strong id="headerWeatherWind">—</strong></span>
                <span><small>Rain chance</small><strong id="headerWeatherRain">—</strong></span>
                <span><small>Updated</small><strong id="headerWeatherUpdated">—</strong></span>
              </div>
              <button type="button" class="header-weather-refresh" id="headerWeatherRefresh"><i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Refresh</button>
            </div>
          </div>
          <button type="button" class="theme-toggle" id="themeToggle" aria-label="Switch to light mode" title="Toggle theme">
            <span class="theme-icon-orbit" aria-hidden="true">
              <i class="bi bi-sun-fill theme-icon-sun"></i>
              <i class="bi bi-moon-stars-fill theme-icon-moon"></i>
            </span>
            <span class="theme-toggle-label" id="themeToggleLabel">Light</span>
          </button>
          <div class="header-datetime" id="headerDateTime" aria-live="polite">
            <span class="header-datetime-time" id="headerDateTimeClock">--:--</span>
            <span class="header-datetime-date" id="headerDateTimeDate">Loading…</span>
          </div>
          <span class="header-role-chip" id="headerRoleChip"><?php echo htmlspecialchars($sessionRole); ?></span>
          <div class="header-quick-actions" aria-label="Quick actions">
            <div class="apps-menu" id="appsMenuHost">
              <button type="button" class="quick-action-btn" id="appsMenuToggle" aria-expanded="false" aria-controls="appsMenuPanel" title="App launcher (Ctrl+K)" aria-label="App launcher">
                <span class="quick-icon" aria-hidden="true"><i class="bi bi-grid-3x3-gap-fill"></i></span>
              </button>
              <div id="appsMenuPanel" class="apps-menu-panel" hidden>
                <p class="apps-menu-title">Go to</p>
                <div class="apps-menu-grid">
                  <a class="apps-tile" href="<?php echo htmlspecialchars($dashboardPath); ?>"><span class="apps-tile-icon" aria-hidden="true"><i class="bi bi-speedometer2"></i></span><span>Dashboard</span></a>
                  <a class="apps-tile" href="<?php echo htmlspecialchars($reportsPath); ?>"><span class="apps-tile-icon" aria-hidden="true"><i class="bi bi-file-earmark-text"></i></span><span>Reports</span></a>
                  <a class="apps-tile" href="<?php echo htmlspecialchars($calendarPath); ?>"><span class="apps-tile-icon" aria-hidden="true"><i class="bi bi-calendar3"></i></span><span>Calendar</span></a>
                  <a class="apps-tile" href="<?php echo htmlspecialchars($stationIncidentLogsPath); ?>"><span class="apps-tile-icon" aria-hidden="true"><i class="bi bi-clipboard-data"></i></span><span>Incident logs</span></a>
                  <?php if ($sessionIsCentralStation): ?>
                    <a class="apps-tile" href="<?php echo htmlspecialchars($stationMailsPath); ?>"><span class="apps-tile-icon" aria-hidden="true"><i class="bi bi-envelope"></i></span><span>Station mail</span></a>
                    <a class="apps-tile" href="<?php echo htmlspecialchars($generalMailPath); ?>"><span class="apps-tile-icon" aria-hidden="true"><i class="bi bi-envelope-paper"></i></span><span>General mail</span></a>
                    <a class="apps-tile" href="<?php echo htmlspecialchars($operationalMailPath); ?>"><span class="apps-tile-icon" aria-hidden="true"><i class="bi bi-envelope-exclamation"></i></span><span>Ops mail</span></a>
                  <?php else: ?>
                    <a class="apps-tile" href="<?php echo htmlspecialchars($generalMailPath); ?>"><span class="apps-tile-icon" aria-hidden="true"><i class="bi bi-envelope-paper"></i></span><span>Mail</span></a>
                  <?php endif; ?>
                  <a class="apps-tile" href="<?php echo htmlspecialchars($analyticsPath); ?>"><span class="apps-tile-icon" aria-hidden="true"><i class="bi bi-graph-up"></i></span><span>Analytics</span></a>
                  <a class="apps-tile" href="<?php echo htmlspecialchars($settingsPath); ?>"><span class="apps-tile-icon" aria-hidden="true"><i class="bi bi-gear"></i></span><span>Settings</span></a>
                  <?php if (in_array($sessionRoleKey, ['admin', 'superadmin'], true)): ?>
                    <a class="apps-tile" href="<?php echo htmlspecialchars($adminSettingsPath); ?>"><span class="apps-tile-icon" aria-hidden="true"><i class="bi bi-shield-lock"></i></span><span>Admin Settings</span></a>
                  <?php endif; ?>
                </div>
              </div>
            </div>
            <a class="quick-action-btn quick-mail-btn" href="<?php echo htmlspecialchars($mailHomePath); ?>" title="Station mail" aria-label="Open station mail">
              <span class="quick-icon" aria-hidden="true"><i class="bi bi-envelope-fill"></i></span>
            </a>

            <div class="alerts-menu">
              <button type="button" class="quick-action-btn alerts-btn" id="alertsMenuToggle" aria-expanded="false" aria-controls="alertsMenuPanel" title="Notifications" aria-label="Notifications">
                <span class="quick-icon" aria-hidden="true"><i class="bi bi-bell-fill"></i></span>
                <span class="alerts-count" aria-hidden="true">0</span>
              </button>
              <div id="alertsMenuPanel" class="alerts-menu-panel" hidden>
                <p class="alerts-menu-title">Recent Alerts</p>
                <ul class="alerts-menu-list"></ul>
                <a href="<?php echo htmlspecialchars($calendarPath); ?>" class="alerts-menu-link"><i class="bi bi-calendar3" aria-hidden="true"></i>Open calendar</a>
              </div>
            </div>

            <div class="profile-menu">
              <button type="button" class="quick-action-btn profile-btn" id="profileMenuToggle" aria-expanded="false" aria-controls="profileMenuPanel" title="Account menu" aria-label="Account menu">
                <span class="quick-icon header-profile-icon" aria-hidden="true">
                  <?php if ($headerProfilePhotoUrl !== ''): ?>
                    <img id="headerProfilePhoto" class="header-profile-photo" src="<?php echo htmlspecialchars($headerProfilePhotoUrl); ?>" alt="">
                    <span id="headerProfileInitials" class="header-profile-initials" hidden><?php echo htmlspecialchars($headerProfileInitials); ?></span>
                  <?php else: ?>
                    <img id="headerProfilePhoto" class="header-profile-photo" alt="" hidden>
                    <span id="headerProfileInitials" class="header-profile-initials"><?php echo htmlspecialchars($headerProfileInitials); ?></span>
                  <?php endif; ?>
                </span>
                <span class="online-dot" aria-hidden="true"></span>
              </button>
              <div id="profileMenuPanel" class="profile-menu-panel" hidden>
                <div class="profile-menu-header">
                  <p class="profile-menu-name"><?php echo htmlspecialchars($sessionUsername); ?></p>
                  <p class="profile-menu-role"><span class="role-chip"><?php echo htmlspecialchars($sessionRole); ?></span></p>
                </div>
                <a href="<?php echo htmlspecialchars($settingsPath); ?>" class="profile-menu-link profile-settings-link"><i class="bi bi-gear" aria-hidden="true"></i>Settings</a>
                <a href="<?php echo htmlspecialchars($calendarPath); ?>" class="profile-menu-link"><i class="bi bi-calendar-check" aria-hidden="true"></i>My calendar</a>
                <a href="/firenet/NEWFIRENET/pages/civilian.html" class="profile-menu-link" target="_blank" rel="noopener"><i class="bi bi-broadcast" aria-hidden="true"></i>Public portal</a>
                <a href="/firenet/NEWFIRENET/backend/controllers/logout.php" class="profile-logout-link"><i class="bi bi-box-arrow-right" aria-hidden="true"></i>Log out</a>
              </div>
            </div>
          </div>
        </div>
      <?php endif; ?>
    </div>
  </header>

  <?php if (isset($_SESSION['user'])): ?>
    <script>
      window.firenetSessionContext = <?php echo json_encode([
        'userId' => $sessionUserId,
        'role' => $sessionUser['role'] ?? 'user',
        'username' => $sessionUsername,
        'roleLabel' => $sessionRole,
        'stationId' => $sessionStationId,
        'stationName' => $sessionStationName,
        'dashboardUrl' => $dashboardPath,
        'reportsUrl' => $reportsPath,
        'calendarUrl' => $calendarPath,
        'mailUrl' => $mailHomePath,
        'adminSettingsUrl' => $adminSettingsPath,
        'auditLogUrl' => $auditLogPath,
        'usersUrl' => $legacyUsersPath,
        'generalMailUrl' => $generalMailPath,
        'operationalMailUrl' => $operationalMailPath,
        'isCentralStation' => $sessionIsCentralStation,
      ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?>;
    </script>
    <div class="app-layout" id="appLayout">
      <aside class="app-sidebar" id="appSidebar" aria-label="Main navigation">
        <div class="sidebar-head">
          <button type="button" class="sidebar-collapse-btn" id="sidebarCollapseBtn" aria-expanded="true" aria-controls="sidebarNav" title="Collapse sidebar">
            <span class="sidebar-collapse-icon" aria-hidden="true">⟨</span>
          </button>
          <button type="button" class="mobile-sidebar-close" id="mobileSidebarClose" aria-label="Close navigation">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <nav class="sidebar-nav" id="sidebarNav">
          <a href="<?php echo htmlspecialchars($dashboardPath); ?>" class="sidebar-link<?php echo $currentPath === $dashboardPath ? ' is-active' : ''; ?>">
            <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"/></svg></span>
            <span class="sidebar-link-text">Dashboard</span>
          </a>
          <a href="<?php echo htmlspecialchars($reportsPath); ?>" class="sidebar-link<?php echo $currentPath === $reportsPath ? ' is-active' : ''; ?>">
            <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4zM8 18v-2h8v2H8zm0-4v-2h8v2H8zm0-4V8h4v2H8z"/></svg></span>
            <span class="sidebar-link-text">Reports</span>
          </a>
          <a href="<?php echo htmlspecialchars($calendarPath); ?>" class="sidebar-link<?php echo $currentPath === $calendarPath ? ' is-active' : ''; ?>">
            <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14v11z"/></svg></span>
            <span class="sidebar-link-text">Calendar</span>
          </a>
          <a href="<?php echo htmlspecialchars($stationIncidentLogsPath); ?>" class="sidebar-link<?php echo $currentPath === $stationIncidentLogsPath ? ' is-active' : ''; ?>">
            <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"/></svg></span>
            <span class="sidebar-link-text">Logs</span>
          </a>

          <div class="sidebar-divider" role="presentation"></div>

          <?php if ($sessionIsCentralStation): ?>
            <details class="sidebar-details"<?php echo $sidebarMailOpen ? ' open' : ''; ?>>
              <summary class="sidebar-group-summary">
                <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"/></svg></span>
                <span class="sidebar-link-text">Mail</span>
                <span class="sidebar-summary-chevron" aria-hidden="true"></span>
              </summary>
              <div class="sidebar-submenu">
                <a href="<?php echo htmlspecialchars($stationMailsPath); ?>" class="sidebar-link sidebar-link--sub<?php echo $currentPath === $stationMailsPath ? ' is-active' : ''; ?>">
                  <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"/></svg></span>
                  <span class="sidebar-link-text">Station</span>
                </a>
                <a href="<?php echo htmlspecialchars($generalMailPath); ?>" class="sidebar-link sidebar-link--sub<?php echo $currentPath === $generalMailPath ? ' is-active' : ''; ?>">
                  <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 5h18v2H3V5zm0 4h18v10H3V9zm2 2v6h14v-6H5zm2 2h10v2H7v-2z"/></svg></span>
                  <span class="sidebar-link-text">General</span>
                </a>
                <a href="<?php echo htmlspecialchars($operationalMailPath); ?>" class="sidebar-link sidebar-link--sub<?php echo $currentPath === $operationalMailPath ? ' is-active' : ''; ?>">
                  <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2l4 4h-3v6h2l-5 6-5-6h2V6H8l4-4z"/></svg></span>
                  <span class="sidebar-link-text">Ops</span>
                </a>
              </div>
            </details>
          <?php else: ?>
            <a href="<?php echo htmlspecialchars($generalMailPath); ?>" class="sidebar-link<?php echo $currentPath === $generalMailPath ? ' is-active' : ''; ?>">
              <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"/></svg></span>
              <span class="sidebar-link-text">Mail</span>
            </a>
          <?php endif; ?>

          <div class="sidebar-divider" role="presentation"></div>

          <a href="<?php echo htmlspecialchars($analyticsPath); ?>" class="sidebar-link<?php echo $currentPath === $analyticsPath ? ' is-active' : ''; ?>">
            <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg></span>
            <span class="sidebar-link-text">Analytics</span>
          </a>
          <a href="<?php echo htmlspecialchars($settingsPath); ?>" class="sidebar-link<?php echo $currentPath === $settingsPath ? ' is-active' : ''; ?>">
            <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.74 8.84c-.12.21-.08.47.12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.41.35.67.25l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.27.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.26.1.53 0 .67-.25l1.92-3.32c.12-.22.07-.49-.12-.64l-2.01-1.58zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z"/></svg></span>
            <span class="sidebar-link-text">Settings</span>
          </a>

          <?php if (in_array($sessionRoleKey, ['admin', 'superadmin'], true)): ?>
            <div class="sidebar-divider" role="presentation"></div>
            <details class="sidebar-details"<?php echo $adminSettingsOpen ? ' open' : ''; ?>>
              <summary class="sidebar-group-summary">
                <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></span>
                <span class="sidebar-link-text">Admin Settings</span>
                <span class="sidebar-summary-chevron" aria-hidden="true"></span>
              </summary>
              <div class="sidebar-submenu">
                <a href="<?php echo htmlspecialchars($adminSettingsPath . '?tab=accounts'); ?>" class="sidebar-link sidebar-link--sub<?php echo $adminSettingsOpen && $adminSettingsTab === 'accounts' ? ' is-active' : ''; ?>">
                  <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></span>
                  <span class="sidebar-link-text">Users</span>
                </a>
                <a href="<?php echo htmlspecialchars($adminSettingsPath . '?tab=news'); ?>" class="sidebar-link sidebar-link--sub<?php echo $adminSettingsOpen && $adminSettingsTab === 'news' ? ' is-active' : ''; ?>">
                  <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M4 5h16v14H4V5zm2 2v2h12V7H6zm0 4v6h5v-6H6zm7 0h5v2h-5v-2zm0 4h5v2h-5v-2z"/></svg></span>
                  <span class="sidebar-link-text">Login News</span>
                </a>
                <a href="<?php echo htmlspecialchars($adminSettingsPath . '?tab=notices'); ?>" class="sidebar-link sidebar-link--sub<?php echo $adminSettingsOpen && $adminSettingsTab === 'notices' ? ' is-active' : ''; ?>">
                  <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 3h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2zm2 4v2h8V7H8zm0 4v2h8v-2H8z"/></svg></span>
                  <span class="sidebar-link-text">Public Notices</span>
                </a>
                <a href="<?php echo htmlspecialchars($adminSettingsPath . '?tab=alerts'); ?>" class="sidebar-link sidebar-link--sub<?php echo $adminSettingsOpen && $adminSettingsTab === 'alerts' ? ' is-active' : ''; ?>">
                  <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z"/></svg></span>
                  <span class="sidebar-link-text">Public Alerts</span>
                </a>
                <a href="<?php echo htmlspecialchars($adminSettingsPath . '?tab=system'); ?>" class="sidebar-link sidebar-link--sub<?php echo $adminSettingsOpen && $adminSettingsTab === 'system' ? ' is-active' : ''; ?>">
                  <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.54c.58-.22 1.13-.54 1.63-.94l2.39.96c.24.1.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z"/></svg></span>
                  <span class="sidebar-link-text">System</span>
                </a>
                <?php if ($sessionRoleKey === 'superadmin'): ?>
                <a href="<?php echo htmlspecialchars($adminSettingsPath . '?tab=substations'); ?>" class="sidebar-link sidebar-link--sub<?php echo $adminSettingsOpen && $adminSettingsTab === 'substations' ? ' is-active' : ''; ?>">
                  <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M4 20h16v2H4v-2zm2-2V8l5-4 5 4v10h2V9l-7-5-7 5v9h2zm3 0h4v-5H9v5z"/></svg></span>
                  <span class="sidebar-link-text">Substations</span>
                </a>
                <?php endif; ?>
                <a href="<?php echo htmlspecialchars($auditLogPath); ?>" class="sidebar-link sidebar-link--sub<?php echo $currentPath === $auditLogPath ? ' is-active' : ''; ?>">
                  <span class="sidebar-link-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M4 4h16v2H4V4zm0 4h16v14H4V8zm3 3v2h10v-2H7zm0 4v2h7v-2H7z"/></svg></span>
                  <span class="sidebar-link-text">Audit Log</span>
                </a>
              </div>
            </details>
          <?php endif; ?>
        </nav>
        <div class="sidebar-foot">
          <a class="sidebar-user-card" href="<?php echo htmlspecialchars($settingsPath); ?>" title="Open your settings">
            <span class="sidebar-user-avatar" aria-hidden="true">
              <?php if ($headerProfilePhotoUrl !== ''): ?>
                <img src="<?php echo htmlspecialchars($headerProfilePhotoUrl); ?>" alt="">
              <?php else: ?>
                <span><?php echo htmlspecialchars($headerProfileInitials); ?></span>
              <?php endif; ?>
            </span>
            <span class="sidebar-user-copy">
              <span class="sidebar-user-name"><?php echo htmlspecialchars($sessionUsername); ?></span>
              <span class="sidebar-user-station"><?php echo htmlspecialchars($sessionStationName); ?></span>
            </span>
            <i class="bi bi-chevron-right sidebar-user-go" aria-hidden="true"></i>
          </a>
        </div>
      </aside>
      <main class="app-main">
  <?php else: ?>
      <main class="app-main">
  <?php endif; ?>
