console.log('FireNet portal loaded.');

(function bootUserPreferences() {
	const preferenceStorageKey = 'firenet.userSettingsState';
	let lastUnread = 0;

	function readPrefs() {
		try {
			const stored = JSON.parse(localStorage.getItem(preferenceStorageKey) || '{}');
			return stored && typeof stored === 'object' ? stored : {};
		} catch (e) {
			return {};
		}
	}

	function applyPrefs(values) {
		const v = values || readPrefs();
		document.body.classList.toggle('is-compact-ui', !!v.compactMode);
		document.body.classList.toggle('is-reduced-motion', !!v.reduceMotion);
		document.body.classList.toggle('is-large-text', !!v.largeText);
		document.body.classList.toggle('is-sensitive-hidden', !!v.hideSensitive);
		document.body.classList.toggle('is-alerts-muted', v.securityAlerts === false);
		if (typeof v.autoLogoutMinutes !== 'undefined') {
			window.setTimeout(function () {
				if (window.FireNetPrefs && typeof window.FireNetPrefs.resetIdle === 'function') {
					window.FireNetPrefs.resetIdle();
				}
			}, 0);
		}
	}

	function playAlertChime() {
		try {
			const Ctx = window.AudioContext || window.webkitAudioContext;
			if (!Ctx) return;
			const ctx = new Ctx();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = 880;
			gain.gain.value = 0.0001;
			osc.connect(gain);
			gain.connect(ctx.destination);
			const now = ctx.currentTime;
			gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
			osc.start(now);
			osc.stop(now + 0.3);
		} catch (e) {}
	}

	function maybeNotify(unreadCount) {
		const prefs = readPrefs();
		if (prefs.securityAlerts === false) return;
		if (unreadCount > lastUnread && lastUnread > 0) {
			if (prefs.soundNotifications) playAlertChime();
			if (prefs.desktopNotifications && window.Notification && Notification.permission === 'granted') {
				try {
					new Notification('FireNet', { body: 'You have new portal alerts.', silent: true });
				} catch (e) {}
			}
		}
		lastUnread = unreadCount;
	}

	let idleTimerId = null;
	const logoutUrl = '/firenet/NEWFIRENET/backend/controllers/logout.php';

	function resetIdleTimer() {
		if (idleTimerId) {
			window.clearTimeout(idleTimerId);
			idleTimerId = null;
		}
		const prefs = readPrefs();
		const minutes = Number(prefs.autoLogoutMinutes || 0);
		if (minutes < 1) return;
		idleTimerId = window.setTimeout(function () {
			window.location.href = logoutUrl;
		}, minutes * 60000);
	}

	window.FireNetPrefs = {
		apply: applyPrefs,
		read: readPrefs,
		onUnreadCount: maybeNotify,
		resetIdle: resetIdleTimer
	};

	applyPrefs(readPrefs());
	resetIdleTimer();
	['mousemove', 'keydown', 'touchstart', 'scroll', 'click'].forEach(function (name) {
		document.addEventListener(name, resetIdleTimer, { passive: true });
	});
})();

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
	const weatherBtn = document.getElementById('headerWeatherBtn');
	const weatherPopover = document.getElementById('headerWeatherPopover');
	if (weatherBtn) weatherBtn.setAttribute('aria-expanded', 'false');
	if (weatherPopover) weatherPopover.hidden = true;
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
		if (alertsToggle) {
			alertsToggle.classList.toggle('has-unread', unreadCount > 0);
		}
		if (window.FireNetPrefs && typeof window.FireNetPrefs.onUnreadCount === 'function') {
			window.FireNetPrefs.onUnreadCount(unreadCount);
		}
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

function markAllNotificationsRead() {
	const notifications = loadNotifications();
	let changed = false;
	const next = notifications.map(function (notification) {
		if (notification && notification.read !== true) {
			changed = true;
			return Object.assign({}, notification, { read: true });
		}
		return notification;
	});

	if (changed) {
		saveNotifications(next);
		renderNotifications();
		window.dispatchEvent(new CustomEvent('firenet:notifications-updated', { detail: { source: 'alerts-opened' } }));
	} else {
		renderNotifications();
	}
}

function updateHeaderDateTime() {
	const clockEl = document.getElementById('headerDateTimeClock');
	const dateEl = document.getElementById('headerDateTimeDate');
	if (!headerDateTime && !clockEl) {
		return;
	}

	const now = new Date();
	const timeText = now.toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
	const dateText = now.toLocaleDateString(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});

	if (clockEl && dateEl) {
		clockEl.textContent = timeText;
		dateEl.textContent = dateText;
		return;
	}

	if (headerDateTime) {
		headerDateTime.textContent = dateText + ' · ' + timeText;
	}
}

if (headerDateTime || document.getElementById('headerDateTimeClock')) {
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

		if (toggle === alertsToggle) {
			markAllNotificationsRead();
		}
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

		if (!target.closest('#headerWeatherHost')) {
			const weatherBtn = document.getElementById('headerWeatherBtn');
			const weatherPopover = document.getElementById('headerWeatherPopover');
			if (weatherBtn) weatherBtn.setAttribute('aria-expanded', 'false');
			if (weatherPopover) weatherPopover.hidden = true;
		}
	});

	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape') {
			closeAllHeaderPanels();
		}
		if ((event.ctrlKey || event.metaKey) && String(event.key || '').toLowerCase() === 'k') {
			const tag = (event.target && event.target.tagName) || '';
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (event.target && event.target.isContentEditable)) {
				return;
			}
			event.preventDefault();
			if (appsToggle && appsPanel) {
				const open = appsPanel.hidden;
				closeAllHeaderPanels();
				if (open) {
					appsPanel.hidden = false;
					appsToggle.setAttribute('aria-expanded', 'true');
				}
			}
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

(function initStaffMobileNav() {
	const menuToggle = document.getElementById('mobileMenuToggle');
	const moreBtn = document.getElementById('staffMobileMoreBtn');
	const closeBtn = document.getElementById('mobileSidebarClose');
	const scrim = document.getElementById('staffNavScrim');
	if (!menuToggle && !moreBtn) return;

	function closeStaffNav() {
		document.body.classList.remove('staff-nav-open');
		if (scrim) {
			scrim.hidden = true;
			scrim.setAttribute('aria-hidden', 'true');
		}
		if (menuToggle) {
			menuToggle.setAttribute('aria-expanded', 'false');
			menuToggle.setAttribute('aria-label', 'Open navigation');
		}
	}

	function openStaffNav() {
		document.body.classList.add('staff-nav-open');
		if (scrim) {
			scrim.hidden = false;
			scrim.setAttribute('aria-hidden', 'false');
		}
		if (menuToggle) {
			menuToggle.setAttribute('aria-expanded', 'true');
			menuToggle.setAttribute('aria-label', 'Close navigation');
		}
		try {
			closeAllHeaderPanels();
		} catch (e) {
			// ignore if not defined yet
		}
	}

	function toggleStaffNav(event) {
		if (event) event.stopPropagation();
		if (document.body.classList.contains('staff-nav-open')) closeStaffNav();
		else openStaffNav();
	}

	if (menuToggle) menuToggle.addEventListener('click', toggleStaffNav);
	if (moreBtn) moreBtn.addEventListener('click', toggleStaffNav);
	if (closeBtn) closeBtn.addEventListener('click', closeStaffNav);
	if (scrim) scrim.addEventListener('click', closeStaffNav);

	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape') closeStaffNav();
	});

	window.addEventListener('resize', function () {
		if (window.innerWidth > 900) closeStaffNav();
	});
})();

(function initSystemThemeToggle() {
	const btn = document.getElementById('themeToggle');
	const label = document.getElementById('themeToggleLabel');
	const storageKey = 'firenet_system_theme';
	if (!btn) return;

	function currentTheme() {
		const theme = document.documentElement.getAttribute('data-theme');
		return theme === 'light' ? 'light' : 'dark';
	}

	function syncLabel(theme) {
		if (!label) return;
		const nextIsLight = theme === 'dark';
		label.textContent = nextIsLight ? 'Light' : 'Dark';
		btn.setAttribute('aria-label', nextIsLight ? 'Switch to light mode' : 'Switch to dark mode');
	}

	// Migrate first-time users: old default "light" still looked dark because chrome is dark.
	try {
		if (!localStorage.getItem(storageKey)) {
			document.documentElement.setAttribute('data-theme', 'dark');
			localStorage.setItem(storageKey, 'dark');
		}
	} catch (e) {
		document.documentElement.setAttribute('data-theme', 'dark');
	}

	syncLabel(currentTheme());

	btn.addEventListener('click', function () {
		const next = currentTheme() === 'dark' ? 'light' : 'dark';
		btn.classList.remove('is-toggling');
		void btn.offsetWidth;
		btn.classList.add('is-toggling');
		document.documentElement.setAttribute('data-theme', next);
		try {
			localStorage.setItem(storageKey, next);
		} catch (e) {
			// ignore
		}
		syncLabel(next);
		try {
			window.dispatchEvent(new CustomEvent('firenet:themechange', { detail: { theme: next } }));
		} catch (e) {
			// ignore
		}
		window.setTimeout(function () {
			btn.classList.remove('is-toggling');
		}, 560);
	});
})();

(function initHeaderWeather() {
	const btn = document.getElementById('headerWeatherBtn');
	const popover = document.getElementById('headerWeatherPopover');
	const refreshBtn = document.getElementById('headerWeatherRefresh');
	if (!btn || !popover) return;

	const iconEl = document.getElementById('headerWeatherIcon');
	const tempEl = document.getElementById('headerWeatherTemp');
	const labelEl = document.getElementById('headerWeatherLabel');
	const descEl = document.getElementById('headerWeatherPopoverDesc');
	const humidEl = document.getElementById('headerWeatherHumidity');
	const windEl = document.getElementById('headerWeatherWind');
	const rainEl = document.getElementById('headerWeatherRain');
	const updatedEl = document.getElementById('headerWeatherUpdated');
	const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=14.5547&longitude=121.0244'
		+ '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m'
		+ '&hourly=precipitation_probability'
		+ '&timezone=Asia%2FManila';

	const labels = {
		0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
		45: 'Foggy', 48: 'Foggy', 51: 'Drizzle', 61: 'Rain', 63: 'Rain',
		65: 'Heavy rain', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
		95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Severe storm'
	};

	function iconForCode(code) {
		if (code === 0 || code === 1) return 'bi-sun-fill';
		if (code === 2) return 'bi-cloud-sun-fill';
		if (code === 3) return 'bi-clouds-fill';
		if (code === 45 || code === 48) return 'bi-cloud-fog2-fill';
		if (code >= 51 && code < 70) return 'bi-cloud-drizzle-fill';
		if (code >= 80 && code < 90) return 'bi-cloud-rain-fill';
		if (code >= 95) return 'bi-cloud-lightning-rain-fill';
		return 'bi-cloud-sun';
	}

	function setText(el, value) {
		if (el) el.textContent = value;
	}

	async function loadWeather() {
		btn.classList.add('is-loading');
		try {
			const response = await fetch(weatherUrl);
			if (!response.ok) throw new Error('Weather request failed');
			const data = await response.json();
			const current = data && data.current ? data.current : null;
			if (!current) throw new Error('No weather data');

			const code = Number(current.weather_code || 0);
			const temp = Math.round(Number(current.temperature_2m || 0));
			const humidity = Math.round(Number(current.relative_humidity_2m || 0));
			const wind = Math.round(Number(current.wind_speed_10m || 0));
			const rainSeries = data.hourly && Array.isArray(data.hourly.precipitation_probability)
				? data.hourly.precipitation_probability.slice(0, 6)
				: [];
			const rainChance = rainSeries.length
				? Math.round(Math.max.apply(null, rainSeries.map(function (n) { return Number(n) || 0; })))
				: 0;
			const label = labels[code] || 'Makati now';
			const alertish = code >= 65 || code >= 80 || code >= 95 || temp >= 37;

			if (iconEl) iconEl.className = 'bi ' + iconForCode(code);
			setText(tempEl, temp + '°');
			setText(labelEl, label);
			setText(descEl, label + ' across Makati · useful for heat / flood situational awareness.');
			setText(humidEl, humidity + '%');
			setText(windEl, wind + ' km/h');
			setText(rainEl, rainChance + '%');
			setText(updatedEl, new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
			btn.classList.toggle('is-alert', alertish);
			btn.title = 'Makati weather: ' + temp + '° · ' + label;
		} catch (error) {
			setText(tempEl, '—°');
			setText(labelEl, 'Offline');
			setText(descEl, 'Weather feed is temporarily unavailable.');
			setText(humidEl, '—');
			setText(windEl, '—');
			setText(rainEl, '—');
			setText(updatedEl, '—');
			btn.classList.remove('is-alert');
		} finally {
			btn.classList.remove('is-loading');
		}
	}

	btn.addEventListener('click', function (event) {
		event.stopPropagation();
		const opening = popover.hidden;
		closeAllHeaderPanels();
		if (opening) {
			popover.hidden = false;
			btn.setAttribute('aria-expanded', 'true');
		}
	});

	if (refreshBtn) {
		refreshBtn.addEventListener('click', function (event) {
			event.stopPropagation();
			loadWeather();
		});
	}

	loadWeather();
	window.setInterval(loadWeather, 15 * 60 * 1000);
})();
