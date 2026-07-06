(function () {
  const contextElement = document.getElementById('stationIncidentLogsContext');
  const summary = document.getElementById('stationLogsSummary');
  const totalNode = document.getElementById('stationLogsTotal');
  const stationNode = document.getElementById('stationLogsStation');
  const underControlNode = document.getElementById('stationLogsUnderControl');
  const fireOutNode = document.getElementById('stationLogsFireOut');
  const searchInput = document.getElementById('stationLogsSearch');
  const stationFilter = document.getElementById('stationLogsStationFilter');
  const sortField = document.getElementById('stationLogsSortField');
  const sortDir = document.getElementById('stationLogsSortDir');
  const applyButton = document.getElementById('stationLogsApplySort');
  const downloadButton = document.getElementById('stationLogsDownloadCsv');
  const tableBody = document.getElementById('stationLogsTableBody');
  const modal = document.getElementById('stationLogsModal');
  const closeModalButton = document.getElementById('closeStationLogsModal');
  const modalTitle = document.getElementById('stationLogsModalTitle');
  const modalMeta = document.getElementById('stationLogsModalMeta');
  const modalLocation = document.getElementById('stationLogsModalLocation');
  const modalSubmittedBy = document.getElementById('stationLogsModalSubmittedBy');
  const modalFinishedAt = document.getElementById('stationLogsModalFinishedAt');
  const modalTimeline = document.getElementById('stationLogsModalTimeline');
  const apiUrl = '/firenet/NEWFIRENET/backend/controllers/reports.php?action=logs';

  if (
    !contextElement || !summary || !totalNode || !stationNode || !underControlNode || !fireOutNode ||
    !searchInput || !stationFilter || !sortField || !sortDir || !applyButton || !downloadButton ||
    !tableBody || !modal || !closeModalButton || !modalTitle || !modalMeta || !modalLocation ||
    !modalSubmittedBy || !modalFinishedAt || !modalTimeline
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
    filtered: []
  };

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
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  }

  function formatAlarmLabel(level) {
    const numeric = Number(level || 0);
    if (!Number.isFinite(numeric) || numeric < 1) {
      return 'Alarm -';
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
        title: alarmLabel + ' | ' + (status || 'status update'),
        meta: 'Recorded at ' + formatDateTime(update.recordedAt || '')
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
        title: (before.join(' / ') || 'Previous') + ' -> ' + (after.join(' / ') || 'Updated'),
        meta: formatDateTime(change.changedAt || '') + (change.notes ? ' | ' + String(change.notes) : '')
      });
    });

    entries.sort(function (a, b) {
      return new Date(a.at || 0).getTime() - new Date(b.at || 0).getTime();
    });

    if (entries.length === 0 && log.incidentFinishedAt) {
      entries.push({
        at: log.incidentFinishedAt,
        title: 'Incident completed',
        meta: 'Completed at ' + formatDateTime(log.incidentFinishedAt)
      });
    }

    return entries;
  }

  function normalizeSearchValue(value) {
    return String(value || '').toLowerCase().trim();
  }

  function renderStationFilterOptions(logs) {
    const currentStationId = String(context.stationId || '');
    const currentStationName = String(context.stationName || ('Station ' + currentStationId));
    stationFilter.innerHTML = '<option value="' + escapeHtml(currentStationId) + '">' + escapeHtml(currentStationName) + '</option>';
    stationFilter.value = currentStationId;
    stationFilter.disabled = true;
  }

  function renderSummary(logs) {
    const total = logs.length;
    totalNode.textContent = String(total);
    fireOutNode.textContent = String(total);
    underControlNode.textContent = '0';
    stationNode.textContent = context.stationName || 'All Stations';
    summary.textContent = total === 0
      ? 'No completed incident logs for your station match your filters.'
      : 'Showing ' + String(total) + ' completed incident log(s) for ' + String(context.stationName || 'your station') + '.';
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
        aValue = String(a.submittedBy || '').toLowerCase();
        bValue = String(b.submittedBy || '').toLowerCase();
      } else if (field === 'alarm') {
        aValue = Number(a.alarmLevel || 0);
        bValue = Number(b.alarmLevel || 0);
      } else if (field === 'status') {
        aValue = String(a.incidentStatus || '').toLowerCase();
        bValue = String(b.incidentStatus || '').toLowerCase();
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
    const stationId = String(stationFilter.value || '');

    const filtered = state.logs.filter(function (log) {
      if (stationId !== '' && String(log.stationId || '') !== stationId) {
        return false;
      }

      if (search === '') {
        return true;
      }

      const haystack = [
        log.title,
        log.stationName,
        log.submittedBy,
        log.incidentLocation,
        log.callerName,
        log.remarks,
        log.incidentStatus,
        log.stage,
        log.alarmLevel
      ].join(' ').toLowerCase();
      return haystack.indexOf(search) !== -1;
    });

    state.filtered = sortLogs(filtered);
    renderRows(state.filtered);
    renderSummary(state.filtered);
  }

  function renderRows(logs) {
    if (!logs.length) {
      tableBody.innerHTML = '<tr><td colspan="9" class="muted-text">No completed incident logs match your filters.</td></tr>';
      return;
    }

    tableBody.innerHTML = logs.map(function (log) {
      const finishedAt = formatDateTime(log.incidentFinishedAt || log.updatedAt || log.submittedAt || '');
      const details = [log.title || 'Untitled Incident', log.incidentLocation || '-', formatAlarmLabel(log.alarmLevel), String(log.incidentStatus || '').replace(/_/g, ' ') || 'fire out'];
      return '<tr class="logs-row" tabindex="0" data-log-id="' + escapeHtml(String(log.id || '')) + '">' +
        '<td>' + escapeHtml(finishedAt) + '</td>' +
        '<td><strong>#' + escapeHtml(String(log.incidentCaseId || log.id || '')) + '</strong>' +
        (log.incidentCaseId && String(log.incidentCaseId) !== String(log.id)
          ? '<div class="logs-row-subtitle">Station copy ' + escapeHtml(String(log.id || '')) + '</div>'
          : '') +
        '</td>' +
        '<td>' + escapeHtml(log.stationName || '-') + '</td>' +
        '<td>' + escapeHtml(details[0]) + '<div class="logs-row-subtitle">' + escapeHtml(details[1]) + '</div></td>' +
        '<td>' + escapeHtml(log.submittedBy || '-') + '</td>' +
        '<td>' + escapeHtml(String(log.stage || 'after_incident').replace(/_/g, ' ')) + '</td>' +
        '<td><span class="logs-status-pill logs-status-pill--completed">Fire Out</span></td>' +
        '<td>' + escapeHtml(formatAlarmLabel(log.alarmLevel)) + '</td>' +
        '<td><span class="logs-row-link">View timeline</span></td>' +
      '</tr>';
    }).join('');
  }

  function openModal(log) {
    if (!log) {
      return;
    }

    modalTitle.textContent = log.title || 'Incident Report';
    modalMeta.textContent = [log.stationName || 'Station', formatAlarmLabel(log.alarmLevel), String(log.incidentStatus || '').replace(/_/g, ' ') || 'fire out'].join(' • ');
    modalLocation.textContent = log.incidentLocation || '-';
    modalSubmittedBy.textContent = (log.updatedBy || log.submittedBy || '-');
    modalFinishedAt.textContent = formatDateTime(log.incidentFinishedAt || log.updatedAt || log.submittedAt || '');

    const entries = buildTimelineEntries(log);
    modalTimeline.innerHTML = entries.length ? entries.map(function (entry, index) {
      return '<li class="station-logs-timeline-item">' +
        '<span class="station-logs-timeline-dot" aria-hidden="true"></span>' +
        '<div class="station-logs-timeline-content">' +
          '<strong>' + escapeHtml(entry.title || ('Event ' + String(index + 1))) + '</strong>' +
          '<span>' + escapeHtml(entry.meta || '') + '</span>' +
        '</div>' +
      '</li>';
    }).join('') : '<li class="station-logs-timeline-item"><strong>No timeline entries recorded</strong><span>Use the incident report page to view more detail.</span></li>';

    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  async function loadLogs() {
    tableBody.innerHTML = '<tr><td colspan="9" class="muted-text">Loading logs...</td></tr>';
    const url = new URL(apiUrl, window.location.origin);
    url.searchParams.set('sort', sortField.value || 'date');
    url.searchParams.set('dir', sortDir.value || 'desc');
    if (searchInput.value.trim() !== '') {
      url.searchParams.set('q', searchInput.value.trim());
    }
    if (stationFilter.value) {
      url.searchParams.set('stationId', stationFilter.value);
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
      renderStationFilterOptions(state.logs);
      applyFilters();
    } catch (error) {
      state.logs = [];
      state.filtered = [];
      renderRows([]);
      renderSummary([]);
      summary.textContent = 'Unable to load incident logs right now.';
    }
  }

  function downloadCsv() {
    const rows = state.filtered.length ? state.filtered : state.logs;
    if (!rows.length) {
      window.alert('No logs available to export.');
      return;
    }

    const headers = ['Finished At', 'Incident Case ID', 'Station Report ID', 'Station ID', 'Station', 'Updated By', 'Title', 'Submitted By', 'Status', 'Alarm', 'Location'];
    const csvRows = [headers.join(',')];
    rows.forEach(function (log) {
      const row = [
        formatDateTime(log.incidentFinishedAt || log.updatedAt || log.submittedAt || ''),
        String(log.incidentCaseId || log.id || ''),
        String(log.id || ''),
        String(log.stationId || ''),
        String(log.stationName || ''),
        String(log.updatedBy || ''),
        String(log.title || ''),
        String(log.submittedBy || ''),
        String(log.incidentStatus || ''),
        String(log.alarmLevel || ''),
        String(log.incidentLocation || '')
      ].map(function (value) {
        return '"' + String(value).replace(/"/g, '""') + '"';
      });
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = 'completed-incident-logs-' + new Date().toISOString().slice(0, 10) + '.csv';
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

  applyButton.addEventListener('click', function () {
    loadLogs();
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
  });
  stationFilter.addEventListener('change', function () {
    applyFilters();
  });
  sortField.addEventListener('change', function () {
    applyFilters();
  });
  sortDir.addEventListener('change', function () {
    applyFilters();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !modal.hidden) {
      closeModal();
    }
  });

  stationNode.textContent = context.stationName || 'All Stations';
  summary.textContent = 'Loading completed incident logs...';
  loadLogs();
})();
