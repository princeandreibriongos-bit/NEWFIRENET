<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/db.php';

firenet_require_login();
firenet_start_session();

header('Content-Type: application/json; charset=utf-8');

$user = $_SESSION['user'] ?? [];
$userId = (int) ($user['user_id'] ?? 0);
$role = strtolower((string) ($user['role'] ?? 'user'));
$stationId = (int) ($user['station_id'] ?? 0);
$canManageCalendar = in_array($role, ['admin', 'superadmin'], true);

if ($stationId < 1) {
	http_response_code(422);
	echo json_encode(['ok' => false, 'message' => 'Invalid station context']);
	exit;
}

function firenet_ensure_calendar_schema(PDO $pdo): void
{
	$pdo->exec("\n\t\tCREATE TABLE IF NOT EXISTS calendar_events (\n\t\t\tcalendar_event_id INT PRIMARY KEY AUTO_INCREMENT,\n\t\t\tstation_id INT NOT NULL,\n\t\t\ttitle VARCHAR(255) NOT NULL,\n\t\t\tdescription LONGTEXT NULL,\n\t\t\tlocation VARCHAR(255) NULL,\n\t\t\tstart_at DATETIME NOT NULL,\n\t\t\tend_at DATETIME NULL,\n\t\t\tcolor_theme VARCHAR(30) NOT NULL DEFAULT 'crimson',\n\t\t\tnotify_users TINYINT(1) NOT NULL DEFAULT 0,\n\t\t\tnotify_minutes_before INT NOT NULL DEFAULT 60,\n\t\t\tcreated_by INT NULL,\n\t\t\tcreated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n\t\t\tupdated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n\t\t\tCONSTRAINT fk_calendar_events_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE,\n\t\t\tCONSTRAINT fk_calendar_events_user FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,\n\t\t\tINDEX idx_calendar_events_station_start (station_id, start_at),\n\t\t\tINDEX idx_calendar_events_notify (station_id, notify_users, start_at)\n\t\t) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci\n\t");
}

function firenet_calendar_normalize_event(array $row): array
{
	$startAt = (string) ($row['start_at'] ?? '');
	$endAt = (string) ($row['end_at'] ?? '');
	return [
		'id' => (int) ($row['calendar_event_id'] ?? 0),
		'stationId' => (int) ($row['station_id'] ?? 0),
		'title' => (string) ($row['title'] ?? ''),
		'description' => (string) ($row['description'] ?? ''),
		'location' => (string) ($row['location'] ?? ''),
		'startAt' => $startAt,
		'endAt' => $endAt !== '' ? $endAt : null,
		'colorTheme' => (string) ($row['color_theme'] ?? 'crimson'),
		'notifyUsers' => (bool) ((int) ($row['notify_users'] ?? 0)),
		'notifyMinutesBefore' => (int) ($row['notify_minutes_before'] ?? 60),
		'createdBy' => (int) ($row['created_by'] ?? 0),
		'createdByName' => (string) ($row['created_by_name'] ?? ''),
		'createdAt' => (string) ($row['created_at'] ?? ''),
		'updatedAt' => (string) ($row['updated_at'] ?? '')
	];
}

function firenet_calendar_build_alert(array $event): array
{
	return [
		'id' => 'calendar-event-' . (int) ($event['id'] ?? 0),
		'label' => 'Calendar Event',
		'title' => (string) ($event['title'] ?? 'Calendar Event'),
		'url' => '/firenet/NEWFIRENET/backend/pages/calendar.php?event=' . (int) ($event['id'] ?? 0),
		'createdAt' => (string) ($event['startAt'] ?? ''),
		'read' => false
	];
}

try {
	$pdo = firenet_get_pdo();
	firenet_ensure_calendar_schema($pdo);

	$action = strtolower(trim((string) ($_GET['action'] ?? 'list')));
	$eventId = (int) ($_GET['event_id'] ?? $_POST['event_id'] ?? 0);
	if ($eventId < 1 && isset($_GET['event'])) {
		$eventId = (int) $_GET['event'];
	}

	function firenet_calendar_fetch_event(PDO $pdo, int $stationId, int $eventId): ?array
	{
		$eventStmt = $pdo->prepare(<<<SQL
SELECT e.*, u.username AS created_by_name
FROM calendar_events e
LEFT JOIN users u ON u.user_id = e.created_by
WHERE e.station_id = ?
	AND e.calendar_event_id = ?
LIMIT 1
SQL);
		$eventStmt->execute([$stationId, $eventId]);
		$row = $eventStmt->fetch(PDO::FETCH_ASSOC);
		return $row ? firenet_calendar_normalize_event($row) : null;
	}

	if ($_SERVER['REQUEST_METHOD'] === 'POST') {
		if (!$canManageCalendar) {
			http_response_code(403);
			echo json_encode(['ok' => false, 'message' => 'Only admins can add calendar events']);
			exit;
		}

		$payload = json_decode((string) file_get_contents('php://input'), true);
		if (!is_array($payload)) {
			$payload = $_POST;
		}

		$requestAction = strtolower(trim((string) ($payload['action'] ?? 'create')));
		if ($requestAction === 'delete') {
			$deleteId = (int) ($payload['eventId'] ?? $payload['event_id'] ?? 0);
			if ($deleteId < 1) {
				http_response_code(422);
				echo json_encode(['ok' => false, 'message' => 'Missing event id']);
				exit;
			}

			$deleteStmt = $pdo->prepare('DELETE FROM calendar_events WHERE station_id = ? AND calendar_event_id = ? LIMIT 1');
			$deleteStmt->execute([$stationId, $deleteId]);

			echo json_encode(['ok' => true]);
			exit;
		}

		$updateId = (int) ($payload['eventId'] ?? $payload['event_id'] ?? 0);

		$title = trim((string) ($payload['title'] ?? ''));
		$description = trim((string) ($payload['description'] ?? ''));
		$location = trim((string) ($payload['location'] ?? ''));
		$startAt = trim((string) ($payload['startAt'] ?? ''));
		$endAt = trim((string) ($payload['endAt'] ?? ''));
		$colorTheme = trim((string) ($payload['colorTheme'] ?? 'crimson'));
		$notifyUsers = !empty($payload['notifyUsers']) ? 1 : 0;
		$notifyMinutesBefore = (int) ($payload['notifyMinutesBefore'] ?? 60);

		$allowedThemes = ['crimson', 'amber', 'sky', 'emerald', 'slate'];
		if (!in_array($colorTheme, $allowedThemes, true)) {
			$colorTheme = 'crimson';
		}

		if ($title === '' || $startAt === '') {
			http_response_code(422);
			echo json_encode(['ok' => false, 'message' => 'Title and start date/time are required']);
			exit;
		}

		if ($notifyMinutesBefore < 5) {
			$notifyMinutesBefore = 5;
		} elseif ($notifyMinutesBefore > 10080) {
			$notifyMinutesBefore = 10080;
		}

		$startDate = date_create($startAt);
		$endDate = $endAt !== '' ? date_create($endAt) : null;
		if (!$startDate || ($endAt !== '' && !$endDate)) {
			http_response_code(422);
			echo json_encode(['ok' => false, 'message' => 'Invalid date/time format']);
			exit;
		}

		if ($requestAction === 'update') {
			if ($updateId < 1) {
				http_response_code(422);
				echo json_encode(['ok' => false, 'message' => 'Missing event id']);
				exit;
			}

			$updateStmt = $pdo->prepare(<<<SQL
UPDATE calendar_events
SET title = ?, description = ?, location = ?, start_at = ?, end_at = ?, color_theme = ?, notify_users = ?, notify_minutes_before = ?
WHERE station_id = ? AND calendar_event_id = ?
LIMIT 1
SQL);
			$updateStmt->execute([
				$title,
				$description !== '' ? $description : null,
				$location !== '' ? $location : null,
				$startDate->format('Y-m-d H:i:s'),
				$endDate ? $endDate->format('Y-m-d H:i:s') : null,
				$colorTheme,
				$notifyUsers,
				$notifyMinutesBefore,
				$stationId,
				$updateId
			]);

			$event = firenet_calendar_fetch_event($pdo, $stationId, $updateId);
			echo json_encode(['ok' => true, 'event' => $event]);
			exit;
		}

		$insertStmt = $pdo->prepare(<<<SQL
INSERT INTO calendar_events
	(station_id, title, description, location, start_at, end_at, color_theme, notify_users, notify_minutes_before, created_by)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
SQL);
		$insertStmt->execute([
			$stationId,
			$title,
			$description !== '' ? $description : null,
			$location !== '' ? $location : null,
			$startDate->format('Y-m-d H:i:s'),
			$endDate ? $endDate->format('Y-m-d H:i:s') : null,
			$colorTheme,
			$notifyUsers,
			$notifyMinutesBefore,
			$userId > 0 ? $userId : null
		]);

		$eventId = (int) $pdo->lastInsertId();
		$eventStmt = $pdo->prepare(<<<SQL
SELECT e.*, u.username AS created_by_name
FROM calendar_events e
LEFT JOIN users u ON u.user_id = e.created_by
WHERE e.calendar_event_id = ?
LIMIT 1
SQL);
		$eventStmt->execute([$eventId]);
		$event = firenet_calendar_normalize_event($eventStmt->fetch(PDO::FETCH_ASSOC) ?: []);

		echo json_encode(['ok' => true, 'event' => $event]);
		exit;
	}

	if ($action === 'event') {
		if ($eventId < 1) {
			http_response_code(422);
			echo json_encode(['ok' => false, 'message' => 'Missing event id']);
			exit;
		}

		$event = firenet_calendar_fetch_event($pdo, $stationId, $eventId);
		if (!$event) {
			http_response_code(404);
			echo json_encode(['ok' => false, 'message' => 'Event not found']);
			exit;
		}

		echo json_encode(['ok' => true, 'event' => $event]);
		exit;
	}

	if ($action === 'alerts') {
		$alertStmt = $pdo->prepare(<<<SQL
SELECT e.*, u.username AS created_by_name
FROM calendar_events e
LEFT JOIN users u ON u.user_id = e.created_by
WHERE e.station_id = ?
	AND e.notify_users = 1
	AND e.start_at >= NOW()
	AND e.start_at <= DATE_ADD(NOW(), INTERVAL e.notify_minutes_before MINUTE)
ORDER BY e.start_at ASC
SQL);
		$alertStmt->execute([$stationId]);
		$alerts = array_map(static function (array $row): array {
			$event = firenet_calendar_normalize_event($row);
			return firenet_calendar_build_alert($event);
		}, $alertStmt->fetchAll(PDO::FETCH_ASSOC));

		echo json_encode(['ok' => true, 'alerts' => $alerts]);
		exit;
	}

		$listStmt = $pdo->prepare(<<<SQL
SELECT e.*, u.username AS created_by_name
FROM calendar_events e
LEFT JOIN users u ON u.user_id = e.created_by
WHERE e.station_id = ?
ORDER BY e.start_at ASC, e.calendar_event_id ASC
SQL);
	$listStmt->execute([$stationId]);
	$events = array_map(static function (array $row): array {
		return firenet_calendar_normalize_event($row);
	}, $listStmt->fetchAll(PDO::FETCH_ASSOC));

	echo json_encode([
		'ok' => true,
		'canManageCalendar' => $canManageCalendar,
		'events' => $events
	]);
} catch (Throwable $e) {
	http_response_code(500);
	echo json_encode(['ok' => false, 'message' => 'Unable to load calendar data']);
}