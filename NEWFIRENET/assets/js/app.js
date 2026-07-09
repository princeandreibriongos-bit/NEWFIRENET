console.log('FireNet portal loaded.');

const navLinks = document.querySelectorAll('nav a');
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const currentUrl = window.location.pathname;
const headerDateTime = document.getElementById('headerDateTime');
const alertsToggle = document.getElementById('alertsMenuToggle');
const alertsMenu = document.getElementById('alertsMenuPanel');
const alertsCount = document.querySelector('.alerts-count');
const alertsMenuTitle = document.querySelector('.alerts-menu-title');
const alertsMenuList = document.querySelector('.alerts-menu-list');
const alertsMenuLink = document.querySelector('.alerts-menu-link');
const notificationsStorageKey = 'firenet.reportNotifications';
const sessionContext = window.firenetSessionContext || {};
const calendarAlertsEndpoint = '/firenet/NEWFIRENET/backend/controllers/calendar.php?action=alerts';
const warningAlertsEndpoint = '/firenet/NEWFIRENET/backend/controllers/warnings.php?action=alerts';
const mailAlertsEndpoint = '/firenet/NEWFIRENET/backend/controllers/station_mails.php?action=alerts';
const calendarPageUrl = String(sessionContext.calendarUrl || '/firenet/NEWFIRENET/backend/pages/calendar.php');

navLinks.forEach(function (link) {
	const href = link.getAttribute('href') || '';
	if (href !== '' && currentUrl.endsWith(href.replace('/firenet/NEWFIRENET/', ''))) {
		link.style.fontWeight = 'bold';
	}
});

sidebarLinks.forEach(function (link) {
	const href = link.getAttribute('href') || '';
	if (href !== '#' && href !== '' && currentUrl.endsWith(href.replace('/firenet/NEWFIRENET/', ''))) {
		link.classList.add('is-active');
	}
});

const profileToggle = document.getElementById('profileMenuToggle');
const profileMenu = document.getElementById('profileMenuPanel');
const appsToggle = document.getElementById('appsMenuToggle');
const appsPanel = document.getElementById('appsMenuPanel');
const sidebarLayout = document.getElementById('appLayout');
const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
const sidebarCollapsedKey = 'firenet.sidebarCollapsed';

function closeAllHeaderPanels() {
	[profileToggle, alertsToggle, appsToggle].forEach(function (toggle) {
		if (toggle) {
			toggle.setAttribute('aria-expanded', 'false');
		}
	});
	if (profileMenu) {
		profileMenu.hidden = true;
	}
	if (alertsMenu) {
		alertsMenu.hidden = true;
	}
	if (appsPanel) {
		appsPanel.hidden = true;
	}
}

function safeJsonParse(value, fallback) {
	try {
		return JSON.parse(value);
	} catch (error) {
		return fallback;
	}
}

function loadNotifications() {
	const stored = safeJsonParse(localStorage.getItem(notificationsStorageKey) || '[]', []);
	return Array.isArray(stored) ? stored : [];
}

function saveNotifications(notifications) {
	localStorage.setItem(notificationsStorageKey, JSON.stringify(Array.isArray(notifications) ? notifications : []));
}

function mergeNotifications(existingNotifications, incomingNotifications) {
	const mergedById = new Map();
	const pushNotification = function (notification) {
		if (!notification || !notification.id) {
			return;
		}

		const notificationId = String(notification.id);
		const current = mergedById.get(notificationId);
		if (current) {
			mergedById.set(notificationId, Object.assign({}, current, notification, {
				read: current.read === true || notification.read === true
			}));
			return;
		}

		mergedById.set(notificationId, Object.assign({}, notification));
	};

	(existingNotifications || []).forEach(pushNotification);
	(incomingNotifications || []).forEach(pushNotification);

	return Array.from(mergedById.values()).sort(function (left, right) {
		const leftTime = left && left.createdAt ? new Date(left.createdAt).getTime() : 0;
		const rightTime = right && right.createdAt ? new Date(right.createdAt).getTime() : 0;
		return rightTime - leftTime;
	});
}

function replaceCalendarNotifications(existingNotifications, calendarNotifications) {
	const existing = Array.isArray(existingNotifications) ? existingNotifications : [];
	const incoming = Array.isArray(calendarNotifications) ? calendarNotifications : [];
	const existingReadMap = new Map();

	existing.forEach(function (notification) {
		if (!notification || !notification.id) {
			return;
		}
		const notificationId = String(notification.id);
		if (notificationId.indexOf('calendar-event-') === 0) {
			existingReadMap.set(notificationId, notification.read === true);
		}
	});

	const keptNonCalendar = existing.filter(function (notification) {
		return !(notification && notification.id && String(notification.id).indexOf('calendar-event-') === 0);
	});

	const normalizedIncoming = incoming.map(function (notification) {
		if (!notification || !notification.id) {
			return notification;
		}
		const notificationId = String(notification.id);
		return Object.assign({}, notification, {
			read: existingReadMap.get(notificationId) === true || notification.read === true
		});
	});

	return mergeNotifications(keptNonCalendar, normalizedIncoming);
}

function getNotificationParts(notification) {
	const label = String(notification.label || 'Alert').trim();
	const title = String(notification.title || 'Update').trim();
	return { label: label, title: title };
}

function resolveNotificationRequestStatus(notification) {
	let status = String(notification && notification.requestStatus || '').toLowerCase();
	if (status) {
		return status;
	}
	const haystack = String((notification && notification.message) || '') + ' ' + String((notification && notification.title) || '');
	const text = haystack.toLowerCase();
	if (text.indexOf('rejected the request') !== -1 || text.indexOf('was rejected') !== -1) {
		return 'rejected';
	}
	if (text.indexOf('request completed') !== -1 || text.indexOf('file sent to the requester') !== -1) {
		return 'completed';
	}
	return '';
}

function renderNotificationStatusBadge(notification) {
	const status = resolveNotificationRequestStatus(notification);
	if (status === 'rejected') {
		return '<span class="alerts-menu-item-status alerts-menu-item-status--rejected"><i class="bi bi-x-circle-fill" aria-hidden="true"></i><span>Rejected</span></span>';
	}
	if (status === 'completed') {
		return '<span class="alerts-menu-item-status alerts-menu-item-status--completed"><i class="bi bi-check-circle-fill" aria-hidden="true"></i><span>Delivered</span></span>';
	}
	return '';
}

function notificationOutcomeClass(notification) {
	const status = resolveNotificationRequestStatus(notification);
	if (status === 'rejected') {
		return ' is-request-rejected';
	}
	if (status === 'completed') {
		return ' is-request-completed';
	}
	return '';
}

function renderNotifications() {
	if (!alertsToggle || !alertsMenu || !alertsMenuList) {
		return;
	}

	const notifications = loadNotifications();
	const unreadCount = notifications.filter(function (notification) {
		return notification && notification.read !== true;
	}).length;

	if (alertsCount) {
		alertsCount.textContent = String(unreadCount);
		alertsCount.hidden = unreadCount === 0;
	}

	if (alertsMenuTitle) {
		alertsMenuTitle.textContent = unreadCount > 0 ? 'Recent Alerts' : 'No Recent Alerts';
	}

	if (notifications.length === 0) {
		alertsMenuList.innerHTML = '<li class="alerts-empty">No alerts yet.</li>';
		if (alertsMenuLink) {
			alertsMenuLink.textContent = 'Open calendar';
			alertsMenuLink.href = calendarPageUrl;
		}
		return;
	}

	alertsMenuList.innerHTML = notifications.slice(0, 5).map(function (notification) {
		const isRead = notification.read === true;
		const className = (isRead ? 'is-read' : 'is-unread') + notificationOutcomeClass(notification);
		const subtitle = notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '';
		const href = String(notification.url || '#');
		const parts = getNotificationParts(notification);
		const statusBadge = renderNotificationStatusBadge(notification);
		return (
			'<li>' +
				'<a class="alerts-menu-item ' + className + '" href="' + href + '" data-notification-id="' + escapeHtml(String(notification.id || '')) + '">' +
					'<span class="alerts-menu-item-head">' +
						'<span class="alerts-menu-item-kicker">' + escapeHtml(parts.label) + '</span>' +
						statusBadge +
					'</span>' +
					'<span class="alerts-menu-item-title">' + escapeHtml(parts.title) + '</span>' +
					'<span class="alerts-menu-item-meta">' + escapeHtml(subtitle) + '</span>' +
				'</a>' +
			'</li>'
		);
	}).join('');

	if (alertsMenuLink) {
		alertsMenuLink.textContent = 'Open calendar';
		alertsMenuLink.href = calendarPageUrl;
	}
}

async function syncCalendarAlerts() {
	if (!sessionContext || !sessionContext.stationId) {
		return;
	}

	try {
		const response = await fetch(calendarAlertsEndpoint, {
			method: 'GET',
			credentials: 'same-origin'
		});
		const payload = await response.json();
		if (!response.ok || !payload || payload.ok !== true || !Array.isArray(payload.alerts)) {
			return;
		}

		const nextNotifications = replaceCalendarNotifications(loadNotifications(), payload.alerts);
		saveNotifications(nextNotifications);
		renderNotifications();
		window.dispatchEvent(new CustomEvent('firenet:notifications-updated', { detail: { source: 'calendar' } }));
	} catch (error) {
		return;
	}
}

async function syncWarningAlerts() {
	if (!sessionContext || !sessionContext.userId) {
		return;
	}

	try {
		const response = await fetch(warningAlertsEndpoint, {
			method: 'GET',
			credentials: 'same-origin'
		});
		const payload = await response.json();
		if (!response.ok || !payload || payload.ok !== true || !Array.isArray(payload.alerts)) {
			return;
		}

		const nextNotifications = mergeNotifications(loadNotifications(), payload.alerts);
		saveNotifications(nextNotifications);
		renderNotifications();
		window.dispatchEvent(new CustomEvent('firenet:notifications-updated', { detail: { source: 'warnings' } }));
	} catch (error) {
		return;
	}
}

async function syncMailAlerts() {
	if (!sessionContext || !sessionContext.userId) {
		return;
	}

	try {
		const response = await fetch(mailAlertsEndpoint, {
			method: 'GET',
			credentials: 'same-origin'
		});
		const payload = await response.json();
		if (!response.ok || !payload || payload.ok !== true || !Array.isArray(payload.alerts)) {
			return;
		}

		const nextNotifications = mergeNotifications(loadNotifications(), payload.alerts);
		saveNotifications(nextNotifications);
		renderNotifications();
		window.dispatchEvent(new CustomEvent('firenet:notifications-updated', { detail: { source: 'mail' } }));
	} catch (error) {
		return;
	}
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function markNotificationRead(notificationId) {
	const notifications = loadNotifications();
	let changed = false;
	const next = notifications.map(function (notification) {
		if (String(notification.id || '') === String(notificationId || '')) {
			changed = true;
			return Object.assign({}, notification, { read: true });
		}
		return notification;
	});

	if (changed) {
		saveNotifications(next);
		renderNotifications();
	}
}

function updateHeaderDateTime() {
	if (!headerDateTime) {
		return;
	}

	const now = new Date();
	headerDateTime.textContent = now.toLocaleString(undefined, {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
}

if (headerDateTime) {
	updateHeaderDateTime();
	window.setInterval(updateHeaderDateTime, 1000);
}

renderNotifications();
syncCalendarAlerts();
syncWarningAlerts();
syncMailAlerts();

window.addEventListener('focus', function () {
    syncWarningAlerts();
    syncMailAlerts();
});

window.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
        syncWarningAlerts();
        syncMailAlerts();
    }
});

window.setInterval(function () {
    syncWarningAlerts();
    syncMailAlerts();
}, 30000);

window.addEventListener('storage', function (event) {
	if (event.key === notificationsStorageKey) {
		renderNotifications();
	}
});

window.addEventListener('firenet:notifications-updated', function () {
	renderNotifications();
});

if (alertsMenuList) {
	alertsMenuList.addEventListener('click', function (event) {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		const link = target.closest('[data-notification-id]');
		if (!link) {
			return;
		}

		const notificationId = link.getAttribute('data-notification-id');
		if (notificationId) {
			markNotificationRead(notificationId);
		}
	});
}

function setupDropdown(toggle, panel, closeOthersCallback) {
	if (!toggle || !panel) {
		return;
	}

	toggle.addEventListener('click', function (event) {
		event.stopPropagation();
		const isOpen = panel.hidden === false;

		if (isOpen) {
			panel.hidden = true;
			toggle.setAttribute('aria-expanded', 'false');
			return;
		}

		if (typeof closeOthersCallback === 'function') {
			closeOthersCallback(toggle);
		}

		panel.hidden = false;
		toggle.setAttribute('aria-expanded', 'true');
	});
}

setupDropdown(profileToggle, profileMenu, function (self) {
	if (alertsToggle && alertsMenu && self !== alertsToggle) {
		alertsToggle.setAttribute('aria-expanded', 'false');
		alertsMenu.hidden = true;
	}
	if (appsToggle && appsPanel && self !== appsToggle) {
		appsToggle.setAttribute('aria-expanded', 'false');
		appsPanel.hidden = true;
	}
});
setupDropdown(alertsToggle, alertsMenu, function (self) {
	if (profileToggle && profileMenu && self !== profileToggle) {
		profileToggle.setAttribute('aria-expanded', 'false');
		profileMenu.hidden = true;
	}
	if (appsToggle && appsPanel && self !== appsToggle) {
		appsToggle.setAttribute('aria-expanded', 'false');
		appsPanel.hidden = true;
	}
});
setupDropdown(appsToggle, appsPanel, function (self) {
	if (profileToggle && profileMenu && self !== profileToggle) {
		profileToggle.setAttribute('aria-expanded', 'false');
		profileMenu.hidden = true;
	}
	if (alertsToggle && alertsMenu && self !== alertsToggle) {
		alertsToggle.setAttribute('aria-expanded', 'false');
		alertsMenu.hidden = true;
	}
});

if ((profileToggle && profileMenu) || (alertsToggle && alertsMenu) || (appsToggle && appsPanel)) {
	document.addEventListener('click', function (event) {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		if (profileMenu && profileToggle && !target.closest('.profile-menu')) {
			profileToggle.setAttribute('aria-expanded', 'false');
			profileMenu.hidden = true;
		}

		if (alertsMenu && alertsToggle && !target.closest('.alerts-menu')) {
			alertsToggle.setAttribute('aria-expanded', 'false');
			alertsMenu.hidden = true;
		}

		if (appsPanel && appsToggle && !target.closest('.apps-menu')) {
			appsToggle.setAttribute('aria-expanded', 'false');
			appsPanel.hidden = true;
		}
	});

	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape') {
			closeAllHeaderPanels();
		}
	});
}

if (sidebarLayout && sidebarCollapseBtn) {
	try {
		if (localStorage.getItem(sidebarCollapsedKey) === '1') {
			sidebarLayout.classList.add('sidebar-collapsed');
			sidebarCollapseBtn.setAttribute('aria-expanded', 'false');
		}
	} catch (e) {
		// ignore
	}
	sidebarCollapseBtn.addEventListener('click', function () {
		const collapsed = sidebarLayout.classList.toggle('sidebar-collapsed');
		sidebarCollapseBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
		try {
			localStorage.setItem(sidebarCollapsedKey, collapsed ? '1' : '0');
		} catch (e2) {
			// ignore
		}
	});
}
