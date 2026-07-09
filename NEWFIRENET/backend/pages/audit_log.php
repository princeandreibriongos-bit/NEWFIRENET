<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();

$role = strtolower((string) ($_SESSION['user']['role'] ?? 'user'));
if (!in_array($role, ['admin', 'superadmin'], true)) {
    header('Location: /firenet/NEWFIRENET/backend/pages/dashboard.php');
    exit;
}

$currentUserId = (int) ($_SESSION['user']['user_id'] ?? 0);
$currentStationId = (int) ($_SESSION['user']['station_id'] ?? 0);
$currentStationName = 'Station ' . $currentStationId;

function firenet_audit_table_exists(PDO $pdo, string $table): bool
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?");
    $stmt->execute([$table]);
    return (int) ($stmt->fetchColumn() ?: 0) > 0;
}

function firenet_audit_chip_class(string $type): string
{
    switch ($type) {
        case 'warning':
            return 'audit-chip audit-chip--warn';
        case 'report':
            return 'audit-chip audit-chip--report';
        case 'calendar':
            return 'audit-chip audit-chip--calendar';
        case 'mail':
            return 'audit-chip audit-chip--mail';
        default:
            return 'audit-chip';
    }
}

function firenet_audit_station_scope_label(string $role, string $stationName): string
{
    return $role === 'superadmin'
        ? 'All stations and all admin-visible action history.'
        : ('Current station scope: ' . $stationName . '.');
}

function firenet_audit_slug(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';
    return trim($value, '-');
}

function firenet_audit_relative_day_label(string $value): string
{
    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return 'Unknown date';
    }

    $entryDate = date('Y-m-d', $timestamp);
    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));

    if ($entryDate === $today) {
        return 'Today';
    }
    if ($entryDate === $yesterday) {
        return 'Yesterday';
    }

    return date('M j, Y', $timestamp);
}

function firenet_audit_time_label(string $value): string
{
    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return trim($value) !== '' ? $value : '-';
    }

    return date('g:i A', $timestamp);
}

function firenet_audit_matches_date_filter(string $value, string $filter): bool
{
    if ($filter === '') {
        return true;
    }

    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return false;
    }

    $entryDate = date('Y-m-d', $timestamp);
    $today = date('Y-m-d');

    if ($filter === 'today') {
        return $entryDate === $today;
    }
    if ($filter === 'yesterday') {
        return $entryDate === date('Y-m-d', strtotime('-1 day'));
    }
    if ($filter === 'last-7-days') {
        return $timestamp >= strtotime('-7 days midnight');
    }
    if ($filter === 'this-month') {
        return date('Y-m', $timestamp) === date('Y-m');
    }

    return true;
}

$entries = [];
$stats = [
    'total' => 0,
    'warnings' => 0,
    'reports' => 0,
    'calendar' => 0,
    'mail' => 0,
];

try {
    $pdo = firenet_get_pdo();

    $stationStmt = $pdo->prepare('SELECT station_name FROM stations WHERE station_id = ? LIMIT 1');
    $stationStmt->execute([$currentStationId]);
    $currentStationName = (string) ($stationStmt->fetchColumn() ?: $currentStationName);

    if (firenet_audit_table_exists($pdo, 'user_warnings')) {
        try {
        $warningSql = '
            SELECT
                uw.warning_id AS item_id,
                uw.created_at AS happened_at,
                uw.warning_type,
                uw.warning_template,
                uw.warning_message,
                sender.username AS actor_name,
                sender_station.station_name AS actor_station_name,
                target.username AS target_name,
                target_station.station_name AS target_station_name
            FROM user_warnings uw
            JOIN users target ON target.user_id = uw.user_id
            LEFT JOIN stations target_station ON target_station.station_id = target.station_id
            LEFT JOIN users sender ON sender.user_id = uw.sender_user_id
            LEFT JOIN stations sender_station ON sender_station.station_id = sender.station_id
        ';
        $warningParams = [];
        if ($role === 'admin') {
            $warningSql .= ' WHERE target.station_id = ?';
            $warningParams[] = $currentStationId;
        }
        $warningSql .= ' ORDER BY uw.created_at DESC LIMIT 80';
        $warningStmt = $pdo->prepare($warningSql);
        $warningStmt->execute($warningParams);
        foreach ($warningStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $isMemo = strtolower((string) ($row['warning_type'] ?? 'warning')) === 'memo';
            $typeLabel = $isMemo ? 'Memo sent' : 'Warning sent';
            $entries[] = [
                'type' => 'warning',
                'actionKey' => $isMemo ? 'memo-sent' : 'warning-sent',
                'time' => (string) ($row['happened_at'] ?? ''),
                'actor' => (string) ($row['actor_name'] ?? 'Unknown admin'),
                'actorStation' => (string) ($row['actor_station_name'] ?? '-'),
                'action' => $typeLabel,
                'target' => (string) ($row['target_name'] ?? 'Unknown user'),
                'targetStation' => (string) ($row['target_station_name'] ?? '-'),
                'detail' => substr(trim((string) ($row['warning_message'] ?? '')), 0, 180),
            ];
            $stats['warnings'] += 1;
        }
        } catch (Throwable $e) {
            // Keep other audit sources visible even if this source fails.
        }
    }

    if (firenet_audit_table_exists($pdo, 'reports')) {
        try {
        $reportCreateSql = '
            SELECT
                r.report_id AS item_id,
                r.created_at AS happened_at,
                r.title,
                r.status,
                u.username AS actor_name,
                s.station_name AS station_name
            FROM reports r
            LEFT JOIN users u ON u.user_id = r.created_by
            LEFT JOIN stations s ON s.station_id = r.station_id
        ';
        $reportCreateParams = [];
        if ($role === 'admin') {
            $reportCreateSql .= ' WHERE r.station_id = ?';
            $reportCreateParams[] = $currentStationId;
        }
        $reportCreateSql .= ' ORDER BY r.created_at DESC LIMIT 80';
        $reportCreateStmt = $pdo->prepare($reportCreateSql);
        $reportCreateStmt->execute($reportCreateParams);
        foreach ($reportCreateStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $entries[] = [
                'type' => 'report',
                'actionKey' => 'report-created',
                'time' => (string) ($row['happened_at'] ?? ''),
                'actor' => (string) ($row['actor_name'] ?? 'Unknown user'),
                'actorStation' => (string) ($row['station_name'] ?? '-'),
                'action' => 'Report created',
                'target' => 'Report #' . (int) ($row['item_id'] ?? 0),
                'targetStation' => (string) ($row['station_name'] ?? '-'),
                'detail' => trim((string) ($row['title'] ?? 'Untitled report')),
            ];
            $stats['reports'] += 1;
        }
        } catch (Throwable $e) {
            // Keep other audit sources visible even if this source fails.
        }
    }

    if (firenet_audit_table_exists($pdo, 'incident_report_updates') && firenet_audit_table_exists($pdo, 'incident_reports')) {
        try {
        $reportUpdateSql = '
            SELECT
                iru.incident_report_update_id AS item_id,
                iru.created_at AS happened_at,
                iru.incident_status,
                iru.alarm_level,
                actor.username AS actor_name,
                s.station_name AS station_name,
                r.title
            FROM incident_report_updates iru
            JOIN incident_reports ir ON ir.incident_report_id = iru.incident_report_id
            JOIN reports r ON r.report_id = ir.report_id
            LEFT JOIN users actor ON actor.user_id = iru.recorded_by_user_id
            LEFT JOIN stations s ON s.station_id = r.station_id
        ';
        $reportUpdateParams = [];
        if ($role === 'admin') {
            $reportUpdateSql .= ' WHERE r.station_id = ?';
            $reportUpdateParams[] = $currentStationId;
        }
        $reportUpdateSql .= ' ORDER BY iru.created_at DESC LIMIT 80';
        $reportUpdateStmt = $pdo->prepare($reportUpdateSql);
        $reportUpdateStmt->execute($reportUpdateParams);
        foreach ($reportUpdateStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $entries[] = [
                'type' => 'report',
                'actionKey' => 'incident-updated',
                'time' => (string) ($row['happened_at'] ?? ''),
                'actor' => (string) ($row['actor_name'] ?? 'Unknown user'),
                'actorStation' => (string) ($row['station_name'] ?? '-'),
                'action' => 'Incident updated',
                'target' => trim((string) ($row['title'] ?? 'Incident report')),
                'targetStation' => (string) ($row['station_name'] ?? '-'),
                'detail' => 'Status: ' . (string) ($row['incident_status'] ?? 'unknown') . ' | Alarm level: ' . (int) ($row['alarm_level'] ?? 0),
            ];
            $stats['reports'] += 1;
        }
        } catch (Throwable $e) {
            // Keep other audit sources visible even if this source fails.
        }
    }

    if (firenet_audit_table_exists($pdo, 'calendar_events')) {
        try {
        $calendarSql = '
            SELECT
                e.calendar_event_id AS item_id,
                e.title,
                e.created_at,
                e.updated_at,
                u.username AS actor_name,
                s.station_name
            FROM calendar_events e
            LEFT JOIN users u ON u.user_id = e.created_by
            LEFT JOIN stations s ON s.station_id = e.station_id
        ';
        $calendarParams = [];
        if ($role === 'admin') {
            $calendarSql .= ' WHERE e.station_id = ?';
            $calendarParams[] = $currentStationId;
        }
        $calendarSql .= ' ORDER BY GREATEST(COALESCE(e.updated_at, e.created_at), e.created_at) DESC LIMIT 80';
        $calendarStmt = $pdo->prepare($calendarSql);
        $calendarStmt->execute($calendarParams);
        foreach ($calendarStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $createdAt = (string) ($row['created_at'] ?? '');
            $updatedAt = (string) ($row['updated_at'] ?? '');
            $isUpdated = $updatedAt !== '' && $updatedAt !== $createdAt;
            $entries[] = [
                'type' => 'calendar',
                'actionKey' => $isUpdated ? 'calendar-updated' : 'calendar-created',
                'time' => $isUpdated ? $updatedAt : $createdAt,
                'actor' => (string) ($row['actor_name'] ?? 'Unknown admin'),
                'actorStation' => (string) ($row['station_name'] ?? '-'),
                'action' => $isUpdated ? 'Calendar event updated' : 'Calendar event created',
                'target' => trim((string) ($row['title'] ?? 'Calendar event')),
                'targetStation' => (string) ($row['station_name'] ?? '-'),
                'detail' => $isUpdated ? 'Event details were modified.' : 'New calendar event created.',
            ];
            $stats['calendar'] += 1;
        }
        } catch (Throwable $e) {
            // Keep other audit sources visible even if this source fails.
        }
    }

    if (firenet_audit_table_exists($pdo, 'station_mail_operational_audit')) {
        try {
        $mailSql = '
            SELECT
                a.audit_id AS item_id,
                a.created_at AS happened_at,
                a.action,
                a.detail_json,
                actor.username AS actor_name,
                actor_station.station_name AS actor_station_name
            FROM station_mail_operational_audit a
            LEFT JOIN users actor ON actor.user_id = a.actor_user_id
            LEFT JOIN stations actor_station ON actor_station.station_id = a.actor_station_id
        ';
        $mailParams = [];
        if ($role === 'admin') {
            $mailSql .= ' WHERE a.actor_station_id = ?';
            $mailParams[] = $currentStationId;
        }
        $mailSql .= ' ORDER BY a.created_at DESC LIMIT 120';
        $mailStmt = $pdo->prepare($mailSql);
        $mailStmt->execute($mailParams);
        foreach ($mailStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $rawMailAction = str_replace('_', ' ', (string) ($row['action'] ?? 'updated'));
            $detail = json_decode((string) ($row['detail_json'] ?? ''), true);
            $detailSummary = '';
            if (is_array($detail) && $detail !== []) {
                $pairs = [];
                foreach ($detail as $key => $value) {
                    if (is_scalar($value)) {
                        $pairs[] = $key . ': ' . (string) $value;
                    }
                }
                $detailSummary = implode(' | ', array_slice($pairs, 0, 3));
            }
            $entries[] = [
                'type' => 'mail',
                'actionKey' => 'mail-' . firenet_audit_slug((string) ($row['action'] ?? 'updated')),
                'time' => (string) ($row['happened_at'] ?? ''),
                'actor' => (string) ($row['actor_name'] ?? 'Unknown user'),
                'actorStation' => (string) ($row['actor_station_name'] ?? '-'),
                'action' => 'Operational mail ' . $rawMailAction,
                'target' => 'Operational route action',
                'targetStation' => (string) ($row['actor_station_name'] ?? '-'),
                'detail' => $detailSummary !== '' ? $detailSummary : 'Operational mail workflow event recorded.',
            ];
            $stats['mail'] += 1;
        }
        } catch (Throwable $e) {
            // Keep other audit sources visible even if this source fails.
        }
    }
} catch (Throwable $e) {
    $entries = [];
    $stats = [
        'total' => 0,
        'warnings' => 0,
        'reports' => 0,
        'calendar' => 0,
        'mail' => 0,
    ];
}

usort($entries, static function (array $a, array $b): int {
    return strcmp((string) ($b['time'] ?? ''), (string) ($a['time'] ?? ''));
});

$sourceFilter = strtolower(trim((string) ($_GET['source'] ?? '')));
$actionFilter = strtolower(trim((string) ($_GET['action'] ?? '')));
$dateFilter = strtolower(trim((string) ($_GET['date'] ?? '')));

$availableSources = [];
foreach ($entries as $entry) {
    $entryType = strtolower((string) ($entry['type'] ?? ''));
    if ($entryType !== '' && !isset($availableSources[$entryType])) {
        $availableSources[$entryType] = ucfirst($entryType);
    }
}

$actionEntries = array_values(array_filter($entries, static function (array $entry) use ($sourceFilter, $dateFilter): bool {
    $entryType = strtolower((string) ($entry['type'] ?? ''));
    if ($sourceFilter !== '' && $entryType !== $sourceFilter) {
        return false;
    }
    if (!firenet_audit_matches_date_filter((string) ($entry['time'] ?? ''), $dateFilter)) {
        return false;
    }
    return true;
}));

$availableActions = [];
foreach ($actionEntries as $entry) {
    $entryActionKey = strtolower((string) ($entry['actionKey'] ?? ''));
    $entryActionLabel = (string) ($entry['action'] ?? '');
    if ($entryActionKey !== '' && !isset($availableActions[$entryActionKey])) {
        $availableActions[$entryActionKey] = $entryActionLabel;
    }
}

if ($actionFilter !== '' && !isset($availableActions[$actionFilter])) {
    $actionFilter = '';
}

$entries = array_values(array_filter($entries, static function (array $entry) use ($sourceFilter, $actionFilter, $dateFilter): bool {
    $entryType = strtolower((string) ($entry['type'] ?? ''));
    $entryActionKey = strtolower((string) ($entry['actionKey'] ?? ''));
    if ($sourceFilter !== '' && $entryType !== $sourceFilter) {
        return false;
    }
    if ($actionFilter !== '' && $entryActionKey !== $actionFilter) {
        return false;
    }
    if (!firenet_audit_matches_date_filter((string) ($entry['time'] ?? ''), $dateFilter)) {
        return false;
    }
    return true;
}));

$entries = array_slice($entries, 0, 200);
$stats['total'] = count($entries);

$bodyClass = 'has-dashboard-bg';
$pageStyles = ['/firenet/NEWFIRENET/assets/css/audit-log.css?v=' . filemtime(__DIR__ . '/../../assets/css/audit-log.css')];

require_once __DIR__ . '/../../includes/header.php';
?>
<div class="audit-pro">
  <div class="audit-page-bg" aria-hidden="true"></div>
  <div class="audit-body">
    <header class="audit-hero">
      <p class="audit-kicker">Administrator tools</p>
      <h1 class="audit-title">Audit Log</h1>
      <p class="audit-subtitle"><?php echo htmlspecialchars(firenet_audit_station_scope_label($role, $currentStationName)); ?></p>
    </header>

    <section class="audit-stats" aria-label="Audit summary">
      <article class="audit-stat"><strong><?php echo (int) $stats['total']; ?></strong><span>Total entries shown</span></article>
      <article class="audit-stat"><strong><?php echo (int) $stats['warnings']; ?></strong><span>Warnings / memos</span></article>
      <article class="audit-stat"><strong><?php echo (int) $stats['reports']; ?></strong><span>Report activity</span></article>
      <article class="audit-stat"><strong><?php echo (int) ($stats['calendar'] + $stats['mail']); ?></strong><span>Calendar + mail actions</span></article>
    </section>

    <section class="audit-card">
      <div class="audit-card-head">
        <h2>Recent Activity</h2>
        <p>Latest admin-visible actions across users, reports, calendar, and operational mail workflows.</p>
      </div>
      <form class="audit-filters" method="get" action="">
        <label class="audit-filter-field">
          <span>Source</span>
          <select name="source" onchange="this.form.submit()">
            <option value="">All sources</option>
            <?php foreach ($availableSources as $sourceValue => $sourceLabel): ?>
              <option value="<?php echo htmlspecialchars($sourceValue); ?>"<?php echo $sourceFilter === $sourceValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($sourceLabel); ?></option>
            <?php endforeach; ?>
          </select>
        </label>
        <label class="audit-filter-field">
          <span>Action</span>
          <select name="action" onchange="this.form.submit()">
            <option value="">All actions</option>
            <?php foreach ($availableActions as $actionValue => $actionLabel): ?>
              <option value="<?php echo htmlspecialchars($actionValue); ?>"<?php echo $actionFilter === $actionValue ? ' selected' : ''; ?>><?php echo htmlspecialchars($actionLabel); ?></option>
            <?php endforeach; ?>
          </select>
        </label>
        <div class="audit-filter-actions">
          <label class="audit-filter-field">
            <span>Date</span>
            <select name="date" onchange="this.form.submit()">
              <option value="">All dates</option>
              <option value="today"<?php echo $dateFilter === 'today' ? ' selected' : ''; ?>>Today</option>
              <option value="yesterday"<?php echo $dateFilter === 'yesterday' ? ' selected' : ''; ?>>Yesterday</option>
              <option value="last-7-days"<?php echo $dateFilter === 'last-7-days' ? ' selected' : ''; ?>>Last 7 days</option>
              <option value="this-month"<?php echo $dateFilter === 'this-month' ? ' selected' : ''; ?>>This month</option>
            </select>
          </label>
        </div>
      </form>
      <div class="audit-filter-state">
        Viewing
        <strong><?php echo htmlspecialchars($availableSources[$sourceFilter] ?? 'All sources'); ?></strong>
        /
        <strong><?php echo htmlspecialchars($availableActions[$actionFilter] ?? 'All actions'); ?></strong>
        /
        <strong><?php echo htmlspecialchars($dateFilter === '' ? 'All dates' : str_replace('-', ' ', ucfirst($dateFilter))); ?></strong>
      </div>
      <?php if ($entries === []): ?>
        <div class="audit-empty">No audit entries match the current filters for this scope.</div>
      <?php else: ?>
        <div class="audit-table-wrap">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($entries as $entry): ?>
                <tr>
                  <td>
                    <span class="audit-time-label"><?php echo htmlspecialchars(firenet_audit_relative_day_label((string) ($entry['time'] ?? ''))); ?></span>
                    <span class="audit-time"><?php echo htmlspecialchars(firenet_audit_time_label((string) ($entry['time'] ?? ''))); ?></span>
                    <span class="audit-time-stamp"><?php echo htmlspecialchars((string) ($entry['time'] ?? '')); ?></span>
                  </td>
                  <td><span class="<?php echo htmlspecialchars(firenet_audit_chip_class((string) ($entry['type'] ?? ''))); ?>"><?php echo htmlspecialchars(ucfirst((string) ($entry['type'] ?? 'log'))); ?></span></td>
                  <td>
                    <div class="audit-actor">
                      <strong><?php echo htmlspecialchars((string) ($entry['actor'] ?? '-')); ?></strong>
                      <span><?php echo htmlspecialchars((string) ($entry['actorStation'] ?? '-')); ?></span>
                    </div>
                  </td>
                  <td><span class="audit-action"><?php echo htmlspecialchars((string) ($entry['action'] ?? '-')); ?></span></td>
                  <td>
                    <div class="audit-target">
                      <strong><?php echo htmlspecialchars((string) ($entry['target'] ?? '-')); ?></strong>
                      <span><?php echo htmlspecialchars((string) ($entry['targetStation'] ?? '-')); ?></span>
                    </div>
                  </td>
                  <td><span class="audit-detail"><?php echo htmlspecialchars((string) ($entry['detail'] ?? '-')); ?></span></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>
    </section>
  </div>
</div>
<?php
require_once __DIR__ . '/../../includes/footer.php';
