(function () {
  const contextNode = document.getElementById('calendarContext');
  const summaryNode = document.getElementById('calendarSummary');
  const monthLabelNode = document.getElementById('calendarMonthLabel');
  const gridNode = document.getElementById('calendarGrid');
  const agendaNode = document.getElementById('calendarAgenda');
  const selectedLabelNode = document.getElementById('calendarSelectedLabel');
  const selectedPillNode = document.getElementById('calendarSelectedPill');
  const selectedDetailsNode = document.getElementById('calendarSelectedDetails');
  const monthCountNode = document.getElementById('calendarMonthCount');
  const upcomingCountNode = document.getElementById('calendarUpcomingCount');
  const notifyCountNode = document.getElementById('calendarNotifyCount');
  const selectedCountNode = document.getElementById('calendarSelectedCount');
  const todayBtn = document.getElementById('calendarTodayBtn');
  const prevBtn = document.getElementById('calendarPrevBtn');
  const nextBtn = document.getElementById('calendarNextBtn');
  const addEventBtn = document.getElementById('calendarAddEventBtn');
  const modal = document.getElementById('calendarModal');
  const modalClose = document.getElementById('calendarModalClose');
  const cancelBtn = document.getElementById('calendarCancelBtn');
  const form = document.getElementById('calendarForm');
  const formMessage = document.getElementById('calendarFormMessage');
  const titleInput = document.getElementById('calendarEventTitle');
  const locationInput = document.getElementById('calendarEventLocation');
  const startAtInput = document.getElementById('calendarEventStartAt');
  const endAtInput = document.getElementById('calendarEventEndAt');
  const descriptionInput = document.getElementById('calendarEventDescription');
  const colorThemeInput = document.getElementById('calendarEventColorTheme');
  const notifyUsersInput = document.getElementById('calendarEventNotifyUsers');
  const notifyMinutesInput = document.getElementById('calendarEventNotifyMinutesBefore');
  const saveBtn = document.getElementById('calendarSaveBtn');
  const modalTitleNode = document.getElementById('calendarModalTitle');
  const modalDeleteBtn = document.getElementById('calendarModalDeleteBtn');
  const searchInput = document.getElementById('calendarSearchInput');
  const themeFilterInput = document.getElementById('calendarThemeFilter');
  const notifyOnlyInput = document.getElementById('calendarNotifyOnly');
  const clearFiltersBtn = document.getElementById('calendarClearFilters');
  const filterSummaryNode = document.getElementById('calendarFilterSummary');

  if (!contextNode || !summaryNode || !monthLabelNode || !gridNode || !agendaNode || !selectedLabelNode || !selectedPillNode || !selectedDetailsNode) {
    return;
  }

  let context = {};
  try {
    context = JSON.parse(contextNode.textContent || '{}');
  } catch (error) {
    context = {};
  }

  const apiUrl = String(context.calendarApiUrl || '/firenet/NEWFIRENET/backend/controllers/calendar.php');
  const canManageCalendar = Boolean(context.canManageCalendar);
  const notificationsStorageKey = 'firenet.reportNotifications';

  let currentMonth = new Date();
  currentMonth.setDate(1);
  let selectedDateKey = normalizeDateKey(new Date());
  let events = [];
  let selectedEventId = null;
  let editingEventId = null;

  if (!canManageCalendar && addEventBtn) {
    addEventBtn.hidden = true;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function parseDateTime(value) {
    const date = new Date(String(value || ''));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDateTime(value) {
    const date = parseDateTime(value);
    return date ? date.toLocaleString() : '-';
  }

  function formatTime(value) {
    const date = parseDateTime(value);
    return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  }

  function formatEventTiming(event) {
    const startAt = parseDateTime(event && event.startAt);
    const endAt = parseDateTime(event && event.endAt);

    if (!startAt) {
      return 'Time not set';
    }

    const startText = startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!endAt) {
      return startText;
    }

    const sameDay = normalizeDateKey(startAt) === normalizeDateKey(endAt);
    if (sameDay) {
      return startText + ' - ' + endAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return startAt.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + startText + ' - ' + endAt.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + endAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function toLocalInputValue(value) {
    const date = parseDateTime(value);
    if (!date) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
  }

  function eventColorClass(theme) {
    const normalized = String(theme || '').toLowerCase();
    if (normalized === 'amber') {
      return 'calendar-event--amber';
    }
    if (normalized === 'sky') {
      return 'calendar-event--sky';
    }
    if (normalized === 'emerald') {
      return 'calendar-event--emerald';
    }
    if (normalized === 'slate') {
      return 'calendar-event--slate';
    }
    return 'calendar-event--crimson';
  }

  function dayColorClass(eventsForDay) {
    if (!Array.isArray(eventsForDay) || eventsForDay.length === 0) {
      return '';
    }

    return eventColorClass(eventsForDay[0].colorTheme);
  }

  function dayKeyForEvent(event) {
    const date = parseDateTime(event.startAt);
    return date ? normalizeDateKey(date) : '';
  }

  function eventIncludesDate(event, dayKey) {
    const startAt = parseDateTime(event && event.startAt);
    if (!startAt) {
      return false;
    }

    const endAt = parseDateTime(event && event.endAt);
    const currentKey = String(dayKey || '');
    const startKey = normalizeDateKey(startAt);
    const endKey = endAt ? normalizeDateKey(endAt) : startKey;
    return currentKey >= startKey && currentKey <= endKey;
  }

  function eventSort(left, right) {
    const leftTime = parseDateTime(left.startAt);
    const rightTime = parseDateTime(right.startAt);
    return (leftTime ? leftTime.getTime() : 0) - (rightTime ? rightTime.getTime() : 0);
  }

  function eventMatchesFilters(event) {
    const query = String(searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();
    const theme = String(themeFilterInput && themeFilterInput.value ? themeFilterInput.value : '').trim().toLowerCase();
    const notifyOnly = Boolean(notifyOnlyInput && notifyOnlyInput.checked);

    if (theme !== '' && String(event.colorTheme || '').toLowerCase() !== theme) {
      return false;
    }

    if (notifyOnly && !event.notifyUsers) {
      return false;
    }

    if (query === '') {
      return true;
    }

    const haystack = [event.title || '', event.location || '', event.description || ''].join(' ').toLowerCase();
    return haystack.indexOf(query) !== -1;
  }

  function getVisibleEvents() {
    return events.filter(eventMatchesFilters);
  }

  function upcomingEvents() {
    const now = new Date();
    return getVisibleEvents()
      .filter(function (event) {
        const startAt = parseDateTime(event.startAt);
        return startAt && startAt.getTime() >= now.getTime() - 3600000;
      })
      .slice()
      .sort(eventSort)
      .slice(0, 8);
  }

  function eventsForDay(dayKey) {
    return getVisibleEvents().filter(function (event) {
      return eventIncludesDate(event, dayKey);
    }).sort(eventSort);
  }

  function buildNotificationId(event) {
    return 'calendar-event-' + String(event.id || '');
  }

  function mergeNotifications(existingNotifications, incomingNotifications) {
    const mergedById = new Map();
    function pushNotification(notification) {
      if (!notification || !notification.id) {
        return;
      }

      const key = String(notification.id);
      const current = mergedById.get(key);
      if (current) {
        mergedById.set(key, Object.assign({}, current, notification, {
          read: current.read === true || notification.read === true
        }));
        return;
      }

      mergedById.set(key, Object.assign({}, notification));
    }

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
      const id = String(notification.id);
      if (id.indexOf('calendar-event-') === 0) {
        existingReadMap.set(id, notification.read === true);
      }
    });

    const keptNonCalendar = existing.filter(function (notification) {
      return !(notification && notification.id && String(notification.id).indexOf('calendar-event-') === 0);
    });

    const normalizedIncoming = incoming.map(function (notification) {
      if (!notification || !notification.id) {
        return notification;
      }
      const id = String(notification.id);
      return Object.assign({}, notification, {
        read: existingReadMap.get(id) === true || notification.read === true
      });
    });

    return mergeNotifications(keptNonCalendar, normalizedIncoming);
  }

  function loadNotifications() {
    try {
      const stored = JSON.parse(localStorage.getItem(notificationsStorageKey) || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      return [];
    }
  }

  function saveNotifications(notifications) {
    localStorage.setItem(notificationsStorageKey, JSON.stringify(Array.isArray(notifications) ? notifications : []));
    window.dispatchEvent(new CustomEvent('firenet:notifications-updated', { detail: { source: 'calendar' } }));
  }

  function syncCalendarNotifications() {
    const eligibleEvents = events.filter(function (event) {
      if (!event.notifyUsers) {
        return false;
      }

      const startAt = parseDateTime(event.startAt);
      if (!startAt) {
        return false;
      }

      const now = new Date();
      const notifyBeforeMinutes = Number(event.notifyMinutesBefore || 0);
      const notifyWindowStart = new Date(startAt.getTime() - notifyBeforeMinutes * 60000);
      return now.getTime() >= notifyWindowStart.getTime() && now.getTime() <= startAt.getTime();
    }).map(function (event) {
      return {
        id: buildNotificationId(event),
        label: 'Calendar Event',
        title: event.title || 'Calendar Event',
        url: apiUrl.replace('/backend/controllers/calendar.php', '/backend/pages/calendar.php') + '?event=' + String(event.id || ''),
        createdAt: event.startAt,
        read: false
      };
    });

    const nextNotifications = replaceCalendarNotifications(loadNotifications(), eligibleEvents);
    saveNotifications(nextNotifications);
  }

  function setSummaryText() {
    const visibleEvents = getVisibleEvents();
    const monthEvents = visibleEvents.filter(function (event) {
      const startAt = parseDateTime(event.startAt);
      return startAt && startAt.getFullYear() === currentMonth.getFullYear() && startAt.getMonth() === currentMonth.getMonth();
    });

    const upcoming = upcomingEvents();
    const notifyCount = visibleEvents.filter(function (event) {
      return Boolean(event.notifyUsers);
    }).length;

    if (summaryNode) {
      summaryNode.textContent = (context.stationName || 'Station') + ' calendar for ' + currentMonth.toLocaleString([], { month: 'long', year: 'numeric' }) + '. ' + monthEvents.length + ' event(s) shown.';
    }
    if (monthCountNode) {
      monthCountNode.textContent = String(monthEvents.length);
    }
    if (upcomingCountNode) {
      upcomingCountNode.textContent = String(upcoming.length);
    }
    if (notifyCountNode) {
      notifyCountNode.textContent = String(notifyCount);
    }
    if (filterSummaryNode) {
      const active = [];
      if (searchInput && String(searchInput.value || '').trim() !== '') {
        active.push('search');
      }
      if (themeFilterInput && String(themeFilterInput.value || '') !== '') {
        active.push('theme');
      }
      if (notifyOnlyInput && notifyOnlyInput.checked) {
        active.push('alerts only');
      }

      filterSummaryNode.textContent = active.length > 0
        ? 'Showing ' + visibleEvents.length + ' of ' + events.length + ' event(s) with ' + active.join(', ') + ' filter(s).'
        : 'Showing all ' + events.length + ' event(s).';
    }
  }

  function renderAgenda() {
    const items = upcomingEvents();
    if (!Array.isArray(items) || items.length === 0) {
      agendaNode.innerHTML = '<p class="muted-text">No upcoming events right now.</p>';
      return;
    }

    agendaNode.innerHTML = items.map(function (event) {
      const dayLabel = parseDateTime(event.startAt) ? parseDateTime(event.startAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '-';
      return '<button type="button" class="calendar-agenda-item ' + eventColorClass(event.colorTheme) + '" data-event-id="' + escapeHtml(String(event.id || '')) + '">' +
        '<span class="calendar-agenda-date">' + escapeHtml(dayLabel) + '</span>' +
        '<span class="calendar-agenda-copy">' +
          '<strong>' + escapeHtml(event.title || '-') + '</strong>' +
          '<span>' + escapeHtml((event.location || 'Station calendar event') + ' • ' + formatEventTiming(event)) + '</span>' +
        '</span>' +
        '<span class="calendar-agenda-time">' + escapeHtml(formatEventTiming(event)) + '</span>' +
      '</button>';
    }).join('');
  }

  function renderSelectedDay() {
    const eventsForSelectedDay = eventsForDay(selectedDateKey);
    const selectedDate = new Date(selectedDateKey + 'T00:00:00');
    if (selectedLabelNode) {
      selectedLabelNode.textContent = Number.isNaN(selectedDate.getTime()) ? 'Select a date' : selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }
    if (selectedPillNode) {
      selectedPillNode.textContent = eventsForSelectedDay.length + ' event(s)';
    }
    if (selectedCountNode) {
      selectedCountNode.textContent = String(eventsForSelectedDay.length);
    }

    if (eventsForSelectedDay.length === 0) {
      selectedDetailsNode.innerHTML = '<p class="muted-text">No events are scheduled for this day.</p>';
      selectedEventId = null;
      return;
    }

    if (!eventsForSelectedDay.some(function (event) {
      return String(event.id || '') === String(selectedEventId || '');
    })) {
      selectedEventId = String(eventsForSelectedDay[0].id || '');
    }

    selectedDetailsNode.innerHTML = '<div class="calendar-day-event-list">' + eventsForSelectedDay.map(function (event) {
      const isSelected = String(event.id || '') === String(selectedEventId || '');
      const notesText = event.description ? escapeHtml(event.description) : 'No notes added';
      return '<button type="button" class="calendar-day-event ' + eventColorClass(event.colorTheme) + (isSelected ? ' is-selected' : '') + '" data-event-id="' + escapeHtml(String(event.id || '')) + '">' +
        '<span class="calendar-day-event-time">' + escapeHtml(formatEventTiming(event)) + '</span>' +
        '<span class="calendar-day-event-copy">' +
          '<strong>' + escapeHtml(event.title || '-') + '</strong>' +
          '<span>' + escapeHtml(event.location || 'No location provided') + '</span>' +
          '<span class="calendar-day-event-notes">Notes: ' + notesText + '</span>' +
        '</span>' +
      '</button>';
    }).join('') + '</div>' + (canManageCalendar && selectedEventId ? '<div class="calendar-detail-actions"><button type="button" class="secondary-btn" id="calendarEditSelectedBtn">Edit Event</button><button type="button" class="secondary-btn calendar-danger-btn" id="calendarDeleteSelectedBtn">Delete Event</button></div>' : '');

    const editSelectedBtn = document.getElementById('calendarEditSelectedBtn');
    const deleteSelectedBtn = document.getElementById('calendarDeleteSelectedBtn');
    if (editSelectedBtn) {
      editSelectedBtn.addEventListener('click', function () {
        openEditModal(selectedEventId);
      });
    }
    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener('click', function () {
        deleteEvent(selectedEventId);
      });
    }
  }

  function renderMonth() {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const cells = [];
    const todayKey = normalizeDateKey(new Date());

    if (monthLabelNode) {
      monthLabelNode.textContent = currentMonth.toLocaleString([], { month: 'long', year: 'numeric' });
    }

    for (let index = 0; index < 42; index++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + index);
      const cellKey = normalizeDateKey(cellDate);
      const inMonth = cellDate.getMonth() === currentMonth.getMonth();
      const dayEvents = eventsForDay(cellKey);
      const visibleEvents = dayEvents.slice(0, 3);
      const overflowCount = dayEvents.length - visibleEvents.length;
      const classes = ['calendar-day'];
      const dayThemeClass = dayColorClass(dayEvents);
      if (!inMonth) {
        classes.push('is-outside-month');
      }
      if (cellKey === todayKey) {
        classes.push('is-today');
      }
      if (cellKey === selectedDateKey) {
        classes.push('is-selected');
      }
      if (dayThemeClass) {
        classes.push(dayThemeClass);
      }

      cells.push(
        '<button type="button" class="' + classes.join(' ') + '" data-day-key="' + cellKey + '">' +
          '<span class="calendar-day-number">' + cellDate.getDate() + '</span>' +
          '<div class="calendar-day-events">' +
            visibleEvents.map(function (event) {
              return '<span class="calendar-event-chip ' + eventColorClass(event.colorTheme) + '" data-event-id="' + escapeHtml(String(event.id || '')) + '">' + escapeHtml(event.title || 'Event') + '</span>';
            }).join('') +
            (overflowCount > 0 ? '<span class="calendar-event-chip calendar-event-chip--more">+' + overflowCount + ' more</span>' : '') +
          '</div>' +
        '</button>'
      );
    }

    gridNode.innerHTML = cells.join('');
  }

  function selectDay(dayKey) {
    selectedDateKey = dayKey;
    selectedEventId = null;
    refreshCalendarView();
  }

  function openModal() {
    if (!canManageCalendar || !modal) {
      return;
    }

    editingEventId = null;
    formMessage.textContent = '';
    if (modalTitleNode) {
      modalTitleNode.textContent = 'Create Event';
    }
    if (modalDeleteBtn) {
      modalDeleteBtn.hidden = true;
      modalDeleteBtn.onclick = null;
    }
    const now = new Date();
    const defaultStart = new Date(now.getTime() + 3600000);
    const defaultEnd = new Date(defaultStart.getTime() + 3600000);
    if (titleInput) {
      titleInput.value = '';
    }
    if (locationInput) {
      locationInput.value = '';
    }
    if (startAtInput) {
      startAtInput.value = toLocalInputValue(defaultStart);
    }
    if (endAtInput) {
      endAtInput.value = toLocalInputValue(defaultEnd);
    }
    if (descriptionInput) {
      descriptionInput.value = '';
    }
    if (colorThemeInput) {
      colorThemeInput.value = 'crimson';
    }
    if (notifyUsersInput) {
      notifyUsersInput.checked = true;
    }
    if (notifyMinutesInput) {
      notifyMinutesInput.value = '60';
    }

    modal.hidden = false;
  }

  function openEditModal(eventId) {
    if (!canManageCalendar || !modal) {
      return;
    }

    const selectedEvent = events.find(function (entry) {
      return String(entry.id || '') === String(eventId || '');
    });
    if (!selectedEvent) {
      return;
    }

    editingEventId = String(selectedEvent.id || '');
    formMessage.textContent = '';
    if (modalTitleNode) {
      modalTitleNode.textContent = 'Edit Event';
    }
    if (modalDeleteBtn) {
      modalDeleteBtn.hidden = false;
      modalDeleteBtn.onclick = function () {
        deleteEvent(editingEventId || eventId);
      };
    }
    if (titleInput) {
      titleInput.value = selectedEvent.title || '';
    }
    if (locationInput) {
      locationInput.value = selectedEvent.location || '';
    }
    if (startAtInput) {
      startAtInput.value = toLocalInputValue(selectedEvent.startAt);
    }
    if (endAtInput) {
      endAtInput.value = toLocalInputValue(selectedEvent.endAt);
    }
    if (descriptionInput) {
      descriptionInput.value = selectedEvent.description || '';
    }
    if (colorThemeInput) {
      colorThemeInput.value = selectedEvent.colorTheme || 'crimson';
    }
    if (notifyUsersInput) {
      notifyUsersInput.checked = Boolean(selectedEvent.notifyUsers);
    }
    if (notifyMinutesInput) {
      notifyMinutesInput.value = String(selectedEvent.notifyMinutesBefore || 60);
    }

    modal.hidden = false;
  }

  async function deleteEvent(eventId) {
    if (!canManageCalendar || !eventId) {
      return;
    }

    const confirmed = window.confirm('Delete this calendar event?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'delete', eventId: eventId })
      });
      const result = await response.json();
      if (!response.ok || !result || result.ok !== true) {
        throw new Error(result && result.message ? result.message : 'Unable to delete event');
      }

      selectedEventId = null;
      editingEventId = null;
      closeModal();
      await loadEvents();
    } catch (error) {
      formMessage.textContent = error.message || 'Unable to delete event.';
    }
  }

  function closeModal() {
    if (!modal) {
      return;
    }
    modal.hidden = true;
    if (modalDeleteBtn) {
      modalDeleteBtn.hidden = true;
      modalDeleteBtn.onclick = null;
    }
  }

  function refreshCalendarView() {
    setSummaryText();
    renderMonth();
    renderAgenda();
    renderSelectedDay();
  }

  async function loadEvents() {
    try {
      const response = await fetch(apiUrl + '?action=list', {
        method: 'GET',
        credentials: 'same-origin'
      });
      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        throw new Error('Unable to load calendar');
      }

      events = Array.isArray(payload.events) ? payload.events : [];
      refreshCalendarView();
      syncCalendarNotifications();
    } catch (error) {
      if (summaryNode) {
        summaryNode.textContent = 'Unable to load calendar data right now.';
      }
      agendaNode.innerHTML = '<p class="muted-text">Unable to load upcoming events.</p>';
      gridNode.innerHTML = '<div class="calendar-empty-state">Unable to load calendar.</div>';
      selectedDetailsNode.innerHTML = '<p class="muted-text">Unable to load selected day details.</p>';
    }
  }

  async function submitEvent(event) {
    event.preventDefault();
    if (!canManageCalendar) {
      return;
    }

    formMessage.textContent = '';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const payload = {
      action: editingEventId ? 'update' : 'create',
      eventId: editingEventId,
      title: titleInput.value.trim(),
      location: locationInput.value.trim(),
      startAt: startAtInput.value,
      endAt: endAtInput.value,
      description: descriptionInput.value.trim(),
      colorTheme: colorThemeInput.value,
      notifyUsers: notifyUsersInput.checked,
      notifyMinutesBefore: notifyMinutesInput.value
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result || result.ok !== true) {
        throw new Error(result && result.message ? result.message : 'Unable to save event');
      }

      editingEventId = null;
      closeModal();
      await loadEvents();
      formMessage.textContent = 'Event saved successfully.';
    } catch (error) {
      formMessage.textContent = error.message || 'Unable to save event.';
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Event';
    }
  }

  gridNode.addEventListener('click', function (event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const eventChip = target.closest('[data-event-id]');
    if (eventChip) {
      selectedEventId = eventChip.getAttribute('data-event-id');
      const eventDay = eventChip.closest('[data-day-key]');
      if (eventDay) {
        selectedDateKey = String(eventDay.getAttribute('data-day-key') || selectedDateKey);
      }
      renderMonth();
      renderSelectedDay();
      return;
    }

    const dayButton = target.closest('[data-day-key]');
    if (dayButton) {
      selectDay(dayButton.getAttribute('data-day-key') || selectedDateKey);
    }
  });

  agendaNode.addEventListener('click', function (event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const item = target.closest('[data-event-id]');
    if (!item) {
      return;
    }

    const eventId = String(item.getAttribute('data-event-id') || '');
    const selectedEvent = events.find(function (entry) {
      return String(entry.id || '') === eventId;
    });
    if (selectedEvent) {
      selectedDateKey = dayKeyForEvent(selectedEvent);
      selectedEventId = eventId;
      renderMonth();
      renderSelectedDay();
    }
  });

  selectedDetailsNode.addEventListener('click', function (event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const item = target.closest('[data-event-id]');
    if (!item) {
      return;
    }

    selectedEventId = String(item.getAttribute('data-event-id') || '');
    renderSelectedDay();
  });

  if (todayBtn) {
    todayBtn.addEventListener('click', function () {
      currentMonth = new Date();
      currentMonth.setDate(1);
      selectedDateKey = normalizeDateKey(new Date());
      selectedEventId = null;
      refreshCalendarView();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      refreshCalendarView();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      refreshCalendarView();
    });
  }

  if (addEventBtn) {
    addEventBtn.addEventListener('click', openModal);
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', function (event) {
      const target = event.target;
      if (target instanceof Element && target.hasAttribute('data-calendar-close')) {
        closeModal();
      }
    });
  }

  if (form) {
    form.addEventListener('submit', submitEvent);
  }

  function applyFilters() {
    selectedEventId = null;
    refreshCalendarView();
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (themeFilterInput) {
    themeFilterInput.addEventListener('change', applyFilters);
  }

  if (notifyOnlyInput) {
    notifyOnlyInput.addEventListener('change', applyFilters);
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', function () {
      if (searchInput) {
        searchInput.value = '';
      }
      if (themeFilterInput) {
        themeFilterInput.value = '';
      }
      if (notifyOnlyInput) {
        notifyOnlyInput.checked = false;
      }
      applyFilters();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (!canManageCalendar) {
      return;
    }
    const isTyping = (event.target instanceof HTMLInputElement) || (event.target instanceof HTMLTextAreaElement) || (event.target instanceof HTMLSelectElement);
    if ((event.key === 'n' || event.key === 'N') && !isTyping) {
      event.preventDefault();
      openModal();
    }
  });

  refreshCalendarView();
  loadEvents();
})();