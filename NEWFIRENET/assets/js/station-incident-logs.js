(function () {
  const contextNode = document.getElementById('stationIncidentLogsContext');
  const summary = document.getElementById('stationLogsSummary');
  const tableBody = document.getElementById('stationLogsTableBody');
  const sortField = document.getElementById('stationLogsSortField');
  const sortDir = document.getElementById('stationLogsSortDir');
  const applySortButton = document.getElementById('stationLogsApplySort');
  const downloadCsvButton = document.getElementById('stationLogsDownloadCsv');
  const totalCountNode = document.getElementById('stationLogsTotal');
  const stationNode = document.getElementById('stationLogsStation');
  const underControlCountNode = document.getElementById('stationLogsUnderControl');
  const fireOutCountNode = document.getElementById('stationLogsFireOut');
  const uploadReportId = document.getElementById('stationLogsUploadReportId');
  const uploadStorage = document.getElementById('stationLogsUploadStorage');
  const uploadFile = document.getElementById('stationLogsUploadFile');
  const uploadButton = document.getElementById('stationLogsUploadButton');
  const uploadMessage = document.getElementById('stationLogsUploadMessage');
  const cloudHint = document.getElementById('stationLogsCloudHint');

  if (!contextNode || !summary || !tableBody || !sortField || !sortDir || !applySortButton || !downloadCsvButton) {
    return;
  }

  let context = {};
  try {
    context = JSON.parse(contextNode.textContent || '{}');
  } catch (error) {
    context = {};
  }

  const apiUrl = String(context.apiUrl || '/firenet/NEWFIRENET/backend/controllers/station_incident_logs.php');
  let uploadConfig = { cloudinary: { available: false, missing: [] } };

  if (stationNode) {
    const stationLabel = context.stationName ? String(context.stationName) : 'Station';
    stationNode.textContent = stationLabel + ' (#' + String(context.stationId || '-') + ')';
  }

  function labelForStage(stageCode) {
    const normalized = String(stageCode || '').toLowerCase();
    if (normalized === 'call_intake') {
      return 'Call Intake';
    }
    if (normalized === 'during_incident') {
      return 'During Incident';
    }
    if (normalized === 'after_incident') {
      return 'After Incident';
    }
    return stageCode || '-';
  }

  function labelForStatus(statusCode) {
    const normalized = normalizeStatusCode(statusCode);
    if (normalized === 'under_control') {
      return 'Under Control';
    }
    if (normalized === 'fire_out') {
      return 'Fire Out';
    }
    if (normalized === 'newly_reported') {
      return 'Newly Reported';
    }
    return statusCode || '-';
  }

  function badgeHtml(label, toneClass) {
    return '<span class="log-badge ' + toneClass + '">' + escapeHtml(label) + '</span>';
  }

  function badgeForStage(stageCode) {
    const normalized = String(stageCode || '').toLowerCase();
    if (normalized === 'call_intake') {
      return badgeHtml('Call Intake', 'log-badge--intake');
    }
    if (normalized === 'during_incident') {
      return badgeHtml('During Incident', 'log-badge--during');
    }
    if (normalized === 'after_incident') {
      return badgeHtml('After Incident', 'log-badge--after');
    }
    return badgeHtml(stageCode || '-', 'log-badge--neutral');
  }

  function badgeForStatus(statusCode) {
    const normalized = normalizeStatusCode(statusCode);
    if (normalized === 'under_control') {
      return badgeHtml('Under Control', 'log-badge--under-control');
    }
    if (normalized === 'fire_out') {
      return badgeHtml('Fire Out', 'log-badge--fire-out');
    }
    if (normalized === 'newly_reported') {
      return badgeHtml('Newly Reported', 'log-badge--new');
    }
    return badgeHtml(statusCode || '-', 'log-badge--neutral');
  }

  function badgeForAlarm(levelValue) {
    const level = Number(levelValue || 0);
    let tone = 'log-badge--neutral';
    if (level >= 4) {
      tone = 'log-badge--alarm-high';
    } else if (level >= 2) {
      tone = 'log-badge--alarm-mid';
    } else if (level >= 1) {
      tone = 'log-badge--alarm-low';
    }

    const label = level > 0 ? ('Alarm ' + level) : '-';
    return badgeHtml(label, tone);
  }

  function normalizeStatusCode(statusCode) {
    return String(statusCode || '')
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, '_');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    if (!value) {
      return '-';
    }
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleString();
  }

  function renderRows(logs) {
    if (!Array.isArray(logs) || logs.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" class="muted-text">No incident logs found for this station.</td></tr>';
      return;
    }

    tableBody.innerHTML = logs.map(function (log) {
      return '<tr>' +
        '<td>' + escapeHtml(formatDate(log.eventTime)) + '</td>' +
        '<td>' + escapeHtml(log.reportId) + '</td>' +
        '<td>' + badgeHtml((log.stationName || 'Station') + ' #' + (log.stationId || '-'), 'log-badge--station') + '</td>' +
        '<td>' +
          '<div class="incident-title">' + escapeHtml(log.incidentName || '-') + '</div>' +
          '<div class="incident-meta">' +
            '<span>' + escapeHtml(log.incidentLocation || 'No location') + '</span>' +
            '<span>' + escapeHtml(log.callerName || 'No caller') + '</span>' +
          '</div>' +
        '</td>' +
        '<td>' + escapeHtml(log.submittedBy || '-') + '</td>' +
        '<td>' + badgeForStage(log.stage) + '</td>' +
        '<td>' + badgeForStatus(log.status) + '</td>' +
        '<td>' + badgeForAlarm(log.alarmLevel) + '</td>' +
        '<td>' + renderAttachmentCell(log) + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderAttachmentCell(log) {
    const count = Number(log.attachmentCount || 0);
    const latestUrl = String(log.latestAttachmentUrl || '');
    const latestName = String(log.latestAttachmentName || 'Latest attachment');
    const reportId = String(log.reportId || '');

    let html = '<div class="incident-attachment-meta">';

    if (count < 1) {
      html += '<span class="muted-text">No attachments</span>';
    } else {
      html += '<span class="log-badge log-badge--station">' + escapeHtml(String(count)) + ' file(s)</span>';
      if (latestUrl) {
        html += '<a class="incident-attachment-link" href="' + escapeHtml(latestUrl) + '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(latestName) +
        '</a>';
      }
    }

    html += '<button type="button" class="table-action-btn upload" data-action="upload" data-report-id="' + escapeHtml(reportId) + '">Upload</button>';
    html += '</div>';
    return html;
  }

  function setUploadMessage(text, isError) {
    if (!uploadMessage) {
      return;
    }

    uploadMessage.textContent = String(text || '');
    uploadMessage.classList.remove('upload-message--error', 'upload-message--success');
    if (!text) {
      return;
    }

    uploadMessage.classList.add(isError ? 'upload-message--error' : 'upload-message--success');
  }

  function refreshUploadReportOptions(logs) {
    if (!uploadReportId) {
      return;
    }

    if (!Array.isArray(logs) || logs.length === 0) {
      uploadReportId.innerHTML = '<option value="">No report available</option>';
      return;
    }

    const options = logs.map(function (log) {
      const reportId = String(log.reportId || '');
      const title = String(log.incidentName || 'Untitled Incident');
      return '<option value="' + escapeHtml(reportId) + '">#' + escapeHtml(reportId) + ' - ' + escapeHtml(title) + '</option>';
    });

    uploadReportId.innerHTML = options.join('');
  }

  function refreshCloudinaryHint() {
    if (!uploadStorage || !cloudHint) {
      return;
    }

    const cloud = (uploadConfig && uploadConfig.cloudinary) ? uploadConfig.cloudinary : { available: false, missing: [] };
    if (uploadStorage.value === 'cloudinary' && !cloud.available) {
      const missing = Array.isArray(cloud.missing) ? cloud.missing : [];
      cloudHint.textContent = 'Cloudinary not ready. Missing: ' + (missing.length ? missing.join(', ') : 'configuration');
    } else {
      cloudHint.textContent = '';
    }
  }

  function updateKpis(logs, payload) {
    if (!Array.isArray(logs)) {
      return;
    }

    let underControlCount = 0;
    let fireOutCount = 0;

    logs.forEach(function (log) {
      const status = normalizeStatusCode(log.status);
      if (status === 'under_control') {
        underControlCount += 1;
      }
      if (status === 'fire_out') {
        fireOutCount += 1;
      }
    });

    if (payload && payload.statusCounts) {
      const counts = payload.statusCounts;
      if (typeof counts.under_control !== 'undefined') {
        underControlCount = Number(counts.under_control) || 0;
      }
      if (typeof counts.fire_out !== 'undefined') {
        fireOutCount = Number(counts.fire_out) || 0;
      }
    }

    if (totalCountNode) {
      totalCountNode.textContent = String(logs.length);
    }
    if (underControlCountNode) {
      underControlCountNode.textContent = String(underControlCount);
    }
    if (fireOutCountNode) {
      fireOutCountNode.textContent = String(fireOutCount);
    }
  }

  async function loadLogs() {
    const params = new URLSearchParams({
      sort: String(sortField.value || 'date'),
      dir: String(sortDir.value || 'desc')
    });

    const fullUrl = apiUrl + '?' + params.toString();
    console.log('🔍 API URL:', fullUrl);
    console.log('🔍 Context:', context);
    tableBody.innerHTML = '<tr><td colspan="9" class="muted-text">Loading logs...</td></tr>';

    try {
      console.log('📡 Starting fetch with 10s timeout...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(fullUrl, {
        method: 'GET',
        credentials: 'same-origin',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('✓ Response received. Status:', response.status, response.statusText);

      const text = await response.text();
      console.log('📝 Response body (first 500 chars):', text.substring(0, 500));

      if (!text) {
        throw new Error('Empty response from server');
      }

      let payload;
      try {
        payload = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError);
        throw new Error('Invalid JSON: ' + text.substring(0, 200));
      }

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + (payload.message || 'Request failed'));
      }

      if (!payload.ok) {
        throw new Error(payload.message || 'Backend returned ok=false');
      }

      console.log('✓ Got', payload.logs?.length || 0, 'logs from backend');
      renderRows(payload.logs || []);
      updateKpis(payload.logs || [], payload);
      uploadConfig = payload.uploadConfig || { cloudinary: { available: false, missing: [] } };
      refreshUploadReportOptions(payload.logs || []);
      refreshCloudinaryHint();
      summary.textContent = (context.stationName || 'Station') + ' has ' + (payload.logs || []).length + ' incident log(s) in this view.';
      console.log('✅ Done!');
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout after 10 seconds');
        tableBody.innerHTML = '<tr><td colspan="9" class="muted-text">Request timeout - server not responding</td></tr>';
      } else {
        console.error('❌ Error:', error.message);
        tableBody.innerHTML = '<tr><td colspan="9" class="muted-text">Error: ' + escapeHtml(error.message) + '</td></tr>';
      }
      summary.textContent = 'Error: ' + error.message;
      updateKpis([]);
    }
  }

  async function uploadAttachment() {
    if (!uploadReportId || !uploadStorage || !uploadFile || !uploadButton) {
      return;
    }

    const reportId = String(uploadReportId.value || '');
    const storage = String(uploadStorage.value || 'local').toLowerCase();
    const file = (uploadFile.files && uploadFile.files[0]) ? uploadFile.files[0] : null;

    if (!reportId) {
      setUploadMessage('Please choose an incident report first.', true);
      return;
    }

    if (!file) {
      setUploadMessage('Please choose a file to upload.', true);
      return;
    }

    setUploadMessage('Uploading attachment...', false);
    uploadButton.disabled = true;

    const formData = new FormData();
    formData.append('action', 'upload_attachment');
    formData.append('reportId', reportId);
    formData.append('storage', storage);
    formData.append('incidentFile', file);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
      });
      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        const message = payload && payload.message ? payload.message : 'Upload failed.';
        setUploadMessage(message, true);
        return;
      }

      const attachment = payload.attachment || {};
      const url = String(attachment.url || '');
      const successMessage = url
        ? (String(payload.message || 'Upload successful.') + ' Open: ' + url)
        : String(payload.message || 'Upload successful.');
      setUploadMessage(successMessage, false);
      uploadFile.value = '';
      await loadLogs();
    } catch (error) {
      setUploadMessage('Upload failed. Please try again.', true);
    } finally {
      uploadButton.disabled = false;
    }
  }

  function downloadCsv() {
    const params = new URLSearchParams({
      action: 'download',
      format: 'csv',
      sort: String(sortField.value || 'date'),
      dir: String(sortDir.value || 'desc')
    });
    window.location.href = apiUrl + '?' + params.toString();
  }

  applySortButton.addEventListener('click', function () {
    loadLogs();
  });

  downloadCsvButton.addEventListener('click', function () {
    downloadCsv();
  });

  if (uploadStorage) {
    uploadStorage.addEventListener('change', function () {
      refreshCloudinaryHint();
    });
  }

  if (uploadButton) {
    uploadButton.addEventListener('click', function () {
      uploadAttachment();
    });
  }

  const logsTable = document.getElementById('stationLogsTable');
  if (logsTable) {
    logsTable.addEventListener('click', function (event) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const action = target.getAttribute('data-action');
      const reportId = target.getAttribute('data-report-id');

      if (action !== 'upload' || !reportId) {
        return;
      }

      const stationName = String(context.stationName || 'AYALA');
      const folderPath = 'FIRENET/' + stationName + '/reports';

      console.log('Upload action triggered for incident:', reportId);
      console.log('Station name:', stationName);
      console.log('CLOUDINARY_CONFIG available:', !!window.CLOUDINARY_CONFIG);
      console.log('cloudinary available:', !!window.cloudinary);

      // Check if Cloudinary is ready, wait if not
      if (!window.isCloudinaryReady || !window.isCloudinaryReady()) {
        console.log('Waiting for Cloudinary to load...');
        if (window.waitForCloudinary) {
          window.waitForCloudinary(function(isReady) {
            if (isReady) {
              openUploadWidget(stationName, reportId, folderPath);
            } else {
              window.alert('Cloudinary service failed to load. Please refresh the page and try again.');
            }
          });
        } else {
          window.alert('Cloudinary service is not ready. Please refresh the page and try again.');
        }
        return;
      }

      if (!window.CLOUDINARY_CONFIG) {
        window.alert('Upload configuration is missing. Please refresh the page.');
        console.error('CLOUDINARY_CONFIG not found');
        return;
      }

      openUploadWidget(stationName, reportId, folderPath);
    }

    function openUploadWidget(stationName, reportId, folderPath) {
      try {
        console.log('Creating upload widget...');
        console.log('Config check - cloudName:', window.CLOUDINARY_CONFIG.cloudName);
        console.log('Config check - preset:', window.CLOUDINARY_CONFIG.uploadPresets[stationName]);

        const uploadWidget = window.cloudinary.createUploadWidget(
          {
            cloudName: window.CLOUDINARY_CONFIG.cloudName,
            uploadPreset: window.CLOUDINARY_CONFIG.uploadPresets[stationName],
            multiple: false,
            maxFileSize: 52428800,
            resourceType: 'auto',
            folder: folderPath,
            tags: [stationName, 'incident_log', reportId],
            publicId: reportId + '_' + Date.now(),
            clientAllowedFormats: ['image', 'video', 'pdf', 'doc', 'docx', 'txt', 'xlsx', 'pptx'],
            context: { reportId: reportId, stationType: stationName }
          },
          function(error, result) {
            if (error) {
              console.error('Cloudinary error during upload:', error);
            } else if (result && result.event === 'success') {
              const messageEl = document.getElementById('stationLogsUploadMessage');
              if (messageEl) {
                messageEl.textContent = '✓ File uploaded successfully to: ' + folderPath;
                messageEl.hidden = false;
                messageEl.style.color = '#1f5e2d';
                setTimeout(function() {
                  messageEl.hidden = true;
                }, 5000);
              }
              console.log('Incident attachment uploaded:', result.info);
            }
          }
        );
        console.log('Widget created, opening...');
        uploadWidget.open();
      } catch (err) {
        console.error('Error creating upload widget:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          cloudName: window.CLOUDINARY_CONFIG ? window.CLOUDINARY_CONFIG.cloudName : 'undefined',
          presets: window.CLOUDINARY_CONFIG ? Object.keys(window.CLOUDINARY_CONFIG.uploadPresets) : 'undefined'
        });
        window.alert('Error opening upload dialog:\n' + err.message + '\n\nPlease check the browser console for more details.');
      }
    });
  }

  loadLogs();

  // Initialize Cloudinary upload
  const context = JSON.parse(contextNode.textContent || '{}');
  const stationName = String(context.stationName || 'AYALA');
  createUploadButton(stationName, 'stationLogsCloudinaryContainer', function(uploadInfo) {
    const messageEl = document.getElementById('stationLogsCloudinaryMessage');
    if (messageEl) {
      messageEl.textContent = 'File uploaded successfully to ' + stationName + ': ' + (uploadInfo.display_name || uploadInfo.public_id);
      messageEl.style.color = '#1f5e2d';
    }
  });
})();
