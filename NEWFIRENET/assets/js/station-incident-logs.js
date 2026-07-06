(function () {
  const contextElement = document.getElementById('stationIncidentLogsContext');
  const shell = document.querySelector('.logs-pro');
  const summary = document.getElementById('stationLogsSummary');
  const totalNode = document.getElementById('stationLogsTotal');
  const scopeNode = document.getElementById('stationLogsScope');
  const kicker = document.getElementById('stationLogsKicker');
  const searchInput = document.getElementById('stationLogsSearch');
  const caseFilterInput = document.getElementById('stationLogsCaseFilter');
  const stationFilter = document.getElementById('stationLogsStationFilter');
  const stationField = document.getElementById('stationLogsStationField');
  const sortField = document.getElementById('stationLogsSortField');
  const sortDir = document.getElementById('stationLogsSortDir');
  const downloadButton = document.getElementById('stationLogsDownloadCsv');
  const tableBody = document.getElementById('stationLogsTableBody');
  const pageTitle = document.getElementById('stationLogsTitle');
  const modal = document.getElementById('stationLogsModal');
  const closeModalButton = document.getElementById('closeStationLogsModal');
  const modalTitle = document.getElementById('stationLogsModalTitle');
  const modalCase = document.getElementById('stationLogsModalCase');
  const modalMeta = document.getElementById('stationLogsModalMeta');
  const modalLocation = document.getElementById('stationLogsModalLocation');
  const modalSubmittedBy = document.getElementById('stationLogsModalSubmittedBy');
  const modalFinishedAt = document.getElementById('stationLogsModalFinishedAt');
  const modalTimeline = document.getElementById('stationLogsModalTimeline');
  const apiUrl = '/firenet/NEWFIRENET/backend/controllers/reports.php?action=logs';

  if (
    !contextElement || !shell || !summary || !totalNode || !scopeNode || !kicker ||
    !searchInput || !caseFilterInput || !stationFilter || !sortField || !sortDir || !downloadButton ||
    !tableBody || !pageTitle || !modal || !closeModalButton || !modalTitle || !modalCase || !modalMeta ||
    !modalLocation || !modalSubmittedBy || !modalFinishedAt || !modalTimeline
  ) {
    return;
  }

  let context = null;
  try {
    context = JSON.parse(contextElement.textContent || '{}');
  } catch (error) {
    context = null;
  }

  if (!context) {
    return;
  }

  const state = {
    logs: [],
    filtered: [],
    stations: Array.isArray(context.stations) ? context.stations : [],
    isCentralStation: Boolean(context.isCentralStation),
    selectedStationId: ''
  };

  let searchDebounceTimer = null;
  let caseDebounceTimer = null;

  function mountLogsModalToBody() {
    if (modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }
  }

  function syncLogsModalScrollLock(isOpen) {
    document.body.classList.toggle('logs-modal-open', isOpen);
  }

  function configurePageChrome() {
    shell.classList.toggle('is-central', state.isCentralStation);
    if (stationField) {
      stationField.hidden = !state.isCentralStation;
    }

    if (state.isCentralStation) {
      pageTitle.textContent = 'District Incident Logs';
      kicker.textContent = 'Makati Central archive';
      scopeNode.textContent = 'All stations';
      return;
    }

    pageTitle.textContent = 'Station Incident Logs';
    kicker.textContent = 'Fire out archive';
    scopeNode.textContent = context.stationName || 'Your station';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateTime(value) {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString(undefined, {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function formatAlarmLabel(level) {
    const numeric = Number(level || 0);
    if (!Number.isFinite(numeric) || numeric < 1) {
      return '—';
    }
    return 'Alarm ' + String(numeric);
  }

  function buildTimelineEntries(log) {
    const entries = [];
    const updates = Array.isArray(log.timelineUpdates) ? log.timelineUpdates : [];
    const changes = Array.isArray(log.timelineChanges) ? log.timelineChanges : [];

    updates.forEach(function (update) {
      const status = String(update.incidentStatus || '').replace(/_/g, ' ');
      const alarmLabel = formatAlarmLabel(update.alarmLevel);
      entries.push({
        at: update.recordedAt || '',
        title: alarmLabel + ' · ' + (status || 'update'),
        meta: formatDateTime(update.recordedAt || '')
      });
    });

    changes.forEach(function (change) {
      const before = [];
      const after = [];
      if (change.fromAlarmLevel != null) {
        before.push(formatAlarmLabel(change.fromAlarmLevel));
      }
      if (change.fromIncidentStatus) {
        before.push(String(change.fromIncidentStatus).replace(/_/g, ' '));
      }
      if (change.toAlarmLevel != null) {
        after.push(formatAlarmLabel(change.toAlarmLevel));
      }
      if (change.toIncidentStatus) {
        after.push(String(change.toIncidentStatus).replace(/_/g, ' '));
      }

      entries.push({
        at: change.changedAt || '',
        title: (before.join(' / ') || 'Previous') + ' → ' + (after.join(' / ') || 'Updated'),
        meta: formatDateTime(change.changedAt || '') + (change.notes ? ' · ' + String(change.notes) : '')
      });
    });

    entries.sort(function (a, b) {
      return new Date(a.at || 0).getTime() - new Date(b.at || 0).getTime();
    });

    if (entries.length === 0 && log.incidentFinishedAt) {
      entries.push({
        at: log.incidentFinishedAt,
        title: 'Fire out recorded',
        meta: formatDateTime(log.incidentFinishedAt)
      });
    }

    return entries;
  }

  function normalizeSearchValue(value) {
    return String(value || '').toLowerCase().trim();
  }

  function getSelectedStationId() {
    if (!state.isCentralStation) {
      return String(context.stationId || '');
    }
    return String(state.selectedStationId || '');
  }

  function renderStationFilterOptions() {
    const selectedId = getSelectedStationId();

    if (state.isCentralStation) {
      const options = ['<option value="">All stations</option>'];
      state.stations.forEach(function (station) {
        const stationId = String(station.id || '');
        const stationName = String(station.name || ('Station ' + stationId));
        options.push('<option value="' + escapeHtml(stationId) + '">' + escapeHtml(stationName) + '</option>');
      });
      stationFilter.innerHTML = options.join('');
      stationFilter.disabled = false;
      stationFilter.value = selectedId;
      if (stationFilter.value !== selectedId && selectedId !== '') {
        state.selectedStationId = '';
        stationFilter.value = '';
      }
      return;
    }

    const currentStationId = String(context.stationId || '');
    const currentStationName = String(context.stationName || ('Station ' + currentStationId));
    stationFilter.innerHTML = '<option value="' + escapeHtml(currentStationId) + '">' + escapeHtml(currentStationName) + '</option>';
    stationFilter.value = currentStationId;
    stationFilter.disabled = true;
  }

  function getScopeLabel() {
    if (!state.isCentralStation) {
      return context.stationName || 'your station';
    }

    if (!stationFilter.value) {
      return 'all stations';
    }

    const match = state.stations.find(function (station) {
      return String(station.id || '') === getSelectedStationId();
    });
    return match && match.name ? match.name : 'selected station';
  }

  function renderSummary(logs) {
    const total = logs.length;
    totalNode.textContent = String(total);

    if (state.isCentralStation) {
      const scopeLabel = getScopeLabel();
      scopeNode.textContent = scopeLabel === 'all stations' ? 'All stations' : scopeLabel;
    }

    const caseLabel = caseFilterInput.value.trim().replace(/[^\d]/g, '');
    if (total === 0) {
      summary.textContent = state.isCentralStation
        ? 'No fire out cases match your filters across the district.'
        : 'No fire out cases for your station match your filters.';
      return;
    }

    let message = total === 1 ? '1 fire out case' : total + ' fire out cases';
    message += ' · ' + getScopeLabel();
    if (caseLabel) {
      message += ' · case #' + caseLabel;
    }
    summary.textContent = message;
  }

  function sortLogs(logs) {
    const field = String(sortField.value || 'date');
    const ascending = String(sortDir.value || 'desc') === 'asc';

    return logs.slice().sort(function (a, b) {
      let aValue = 0;
      let bValue = 0;

      if (field === 'name') {
        aValue = String(a.title || '').toLowerCase();
        bValue = String(b.title || '').toLowerCase();
      } else if (field === 'station') {
        aValue = String(a.stationName || '').toLowerCase();
        bValue = String(b.stationName || '').toLowerCase();
      } else if (field === 'submitted_by') {
        aValue = String(a.updatedBy || a.submittedBy || '').toLowerCase();
        bValue = String(b.updatedBy || b.submittedBy || '').toLowerCase();
      } else if (field === 'alarm') {
        aValue = Number(a.alarmLevel || 0);
        bValue = Number(b.alarmLevel || 0);
      } else {
        aValue = new Date(a.incidentFinishedAt || a.updatedAt || a.submittedAt || 0).getTime();
        bValue = new Date(b.incidentFinishedAt || b.updatedAt || b.submittedAt || 0).getTime();
      }

      if (aValue < bValue) {
        return ascending ? -1 : 1;
      }
      if (aValue > bValue) {
        return ascending ? 1 : -1;
      }
      return 0;
    });
  }

  function applyFilters() {
    const search = normalizeSearchValue(searchInput.value);
    const stationId = getSelectedStationId();
    const caseId = String(caseFilterInput.value || '').replace(/[^\d]/g, '');

    const filtered = state.logs.filter(function (log) {
      if (!state.isCentralStation && String(log.stationId || '') !== String(context.stationId || '')) {
        return false;
      }

      if (state.isCentralStation && stationId !== '' && String(log.stationId || '') !== stationId) {
        return false;
      }

      if (caseId !== '') {
        const logCaseId = String(log.incidentCaseId || log.id || '');
        if (logCaseId !== caseId) {
          return false;
        }
      }

      if (search === '') {
        return true;
      }

      const haystack = [
        log.title,
        log.stationName,
        log.submittedBy,
        log.updatedBy,
        log.incidentLocation,
        log.callerName,
        log.remarks,
        log.alarmLevel,
        log.incidentCaseId,
        log.id
      ].join(' ').toLowerCase();
      return haystack.indexOf(search) !== -1;
    });

    state.filtered = sortLogs(filtered);
    renderRows(state.filtered);
    renderSummary(state.filtered);
  }

  function colSpan() {
    return 7;
  }

  function renderRows(logs) {
    if (!logs.length) {
      tableBody.innerHTML = '<tr><td colspan="' + String(colSpan()) + '" class="logs-empty">No fire out cases match your filters.</td></tr>';
      return;
    }

    tableBody.innerHTML = logs.map(function (log) {
      const finishedAt = formatDateTime(log.incidentFinishedAt || log.updatedAt || log.submittedAt || '');
      const closedBy = log.updatedBy || log.submittedBy || '—';
      const caseId = String(log.incidentCaseId || log.id || '');
      const stationCell = '<td class="logs-col-station">' + escapeHtml(log.stationName || '—') + '</td>';

      return '<tr class="logs-row" tabindex="0" data-log-id="' + escapeHtml(String(log.id || '')) + '">' +
        '<td>' + escapeHtml(finishedAt) + '</td>' +
        '<td><span class="logs-case-id">#' + escapeHtml(caseId) + '</span>' +
        (log.incidentCaseId && String(log.incidentCaseId) !== String(log.id)
          ? '<div class="logs-case-sub">Copy ' + escapeHtml(String(log.id || '')) + '</div>'
          : '') +
        '</td>' +
        stationCell +
        '<td><div class="logs-incident-title">' + escapeHtml(log.title || 'Untitled incident') + '</div>' +
        '<div class="logs-incident-loc" title="' + escapeHtml(log.incidentLocation || '') + '">' + escapeHtml(log.incidentLocation || '—') + '</div></td>' +
        '<td>' + escapeHtml(closedBy) + '</td>' +
        '<td><span class="logs-alarm-pill">' + escapeHtml(formatAlarmLabel(log.alarmLevel)) + '</span></td>' +
        '<td><span class="logs-open-btn" aria-hidden="true">›</span></td>' +
      '</tr>';
    }).join('');
  }

  function openModal(log) {
    if (!log) {
      return;
    }

    const caseId = String(log.incidentCaseId || log.id || '—');
    modalCase.textContent = '#' + caseId;
    modalTitle.textContent = log.title || 'Incident';
    modalMeta.textContent = [
      log.stationName || 'Station',
      formatAlarmLabel(log.alarmLevel)
    ].join(' · ');
    modalLocation.textContent = log.incidentLocation || '—';
    modalSubmittedBy.textContent = log.updatedBy || log.submittedBy || '—';
    modalFinishedAt.textContent = formatDateTime(log.incidentFinishedAt || log.updatedAt || log.submittedAt || '');

    const entries = buildTimelineEntries(log);
    modalTimeline.innerHTML = entries.length ? entries.map(function (entry, index) {
      return '<li class="logs-timeline-item">' +
        '<span class="logs-timeline-dot" aria-hidden="true"></span>' +
        '<div class="logs-timeline-content">' +
          '<strong>' + escapeHtml(entry.title || ('Event ' + String(index + 1))) + '</strong>' +
          '<span>' + escapeHtml(entry.meta || '') + '</span>' +
        '</div>' +
      '</li>';
    }).join('') : '<li class="logs-timeline-item"><strong>No timeline entries</strong><span>Progress updates were not recorded for this case.</span></li>';

    modal.hidden = false;
    modal.classList.add('is-open');
    syncLogsModalScrollLock(true);
    closeModalButton.focus();
  }

  function closeModal() {
    modal.hidden = true;
    modal.classList.remove('is-open');
    syncLogsModalScrollLock(false);
  }

  async function loadLogs() {
    tableBody.innerHTML = '<tr><td colspan="' + String(colSpan()) + '" class="logs-empty">Loading logs…</td></tr>';
    const url = new URL(apiUrl, window.location.origin);
    url.searchParams.set('sort', sortField.value || 'date');
    url.searchParams.set('dir', sortDir.value || 'desc');
    if (searchInput.value.trim() !== '') {
      url.searchParams.set('q', searchInput.value.trim());
    }
    const stationId = getSelectedStationId();
    if (stationId !== '') {
      url.searchParams.set('stationId', stationId);
    }
    const caseId = String(caseFilterInput.value || '').replace(/[^\d]/g, '');
    if (caseId !== '') {
      url.searchParams.set('caseId', caseId);
    }

    try {
      const response = await fetch(url.toString(), { credentials: 'same-origin' });
      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        state.logs = [];
        state.filtered = [];
        renderRows([]);
        renderSummary([]);
        summary.textContent = 'Unable to load incident logs right now.';
        return;
      }

      state.logs = Array.isArray(payload.logs) ? payload.logs : [];
      state.isCentralStation = Boolean(payload.isCentralStation ?? state.isCentralStation);
      state.stations = Array.isArray(payload.stations) && payload.stations.length
        ? payload.stations
        : state.stations;
      configurePageChrome();
      renderStationFilterOptions();
      applyFilters();
    } catch (error) {
      state.logs = [];
      state.filtered = [];
      renderRows([]);
      renderSummary([]);
      summary.textContent = 'Unable to load incident logs right now.';
    }
  }

  function scheduleSearchReload() {
    window.clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(function () {
      loadLogs();
    }, 320);
  }

  function scheduleCaseReload() {
    window.clearTimeout(caseDebounceTimer);
    caseDebounceTimer = window.setTimeout(function () {
      loadLogs();
    }, 320);
  }

  function downloadCsv() {
    const rows = state.filtered.length ? state.filtered : state.logs;
    if (!rows.length) {
      window.alert('No logs available to export.');
      return;
    }

    const headers = ['Finished At', 'Case ID', 'Report ID', 'Station', 'Closed By', 'Title', 'Alarm', 'Location'];
    const csvRows = [headers.join(',')];
    rows.forEach(function (log) {
      const row = [
        formatDateTime(log.incidentFinishedAt || log.updatedAt || log.submittedAt || ''),
        String(log.incidentCaseId || log.id || ''),
        String(log.id || ''),
        String(log.stationName || ''),
        String(log.updatedBy || log.submittedBy || ''),
        String(log.title || ''),
        String(log.alarmLevel || ''),
        String(log.incidentLocation || '')
      ].map(function (value) {
        return '"' + String(value).replace(/"/g, '""') + '"';
      });
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = 'fire-out-logs-' + new Date().toISOString().slice(0, 10) + '.csv';
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  tableBody.addEventListener('click', function (event) {
    const row = event.target.closest('tr[data-log-id]');
    if (!row) {
      return;
    }

    const log = state.filtered.find(function (item) {
      return String(item.id || '') === String(row.getAttribute('data-log-id') || '');
    }) || state.logs.find(function (item) {
      return String(item.id || '') === String(row.getAttribute('data-log-id') || '');
    });

    if (log) {
      openModal(log);
    }
  });

  tableBody.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const row = event.target.closest('tr[data-log-id]');
    if (!row) {
      return;
    }
    event.preventDefault();
    row.click();
  });

  downloadButton.addEventListener('click', downloadCsv);
  closeModalButton.addEventListener('click', closeModal);
  modal.addEventListener('click', function (event) {
    if (event.target && event.target.getAttribute('data-close-logs-modal') === 'true') {
      closeModal();
    }
  });
  searchInput.addEventListener('input', function () {
    applyFilters();
    scheduleSearchReload();
  });
  stationFilter.addEventListener('change', function () {
    state.selectedStationId = String(stationFilter.value || '');
    loadLogs();
  });
  caseFilterInput.addEventListener('input', function () {
    applyFilters();
    scheduleCaseReload();
  });
  sortField.addEventListener('change', applyFilters);
  sortDir.addEventListener('change', applyFilters);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  mountLogsModalToBody();
  configurePageChrome();
  renderStationFilterOptions();
  summary.textContent = 'Loading fire out archive…';
  loadLogs();
})();
