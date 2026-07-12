(function () {
  const contextElement = document.getElementById('reportsContext');
  const openReportModal = document.getElementById('openReportModal');
  const reportTypeModal = document.getElementById('reportTypeModal');
  const closeReportTypeModal = document.getElementById('closeReportTypeModal');
  const chooseIncidentReport = document.getElementById('chooseIncidentReport');
  const chooseEquipmentReport = document.getElementById('chooseEquipmentReport');
  const closeReportModal = document.getElementById('closeReportModal');
  const reportModal = document.getElementById('reportModal');
  const releaseConfirmModal = document.getElementById('releaseConfirmModal');
  const closeReleaseConfirmModal = document.getElementById('closeReleaseConfirmModal');
  const cancelReleaseConfirmBtn = document.getElementById('cancelReleaseConfirmBtn');
  const confirmReleaseBtn = document.getElementById('confirmReleaseBtn');
  const releaseConfirmSummary = document.getElementById('releaseConfirmSummary');
  const releaseConfirmLead = document.getElementById('releaseConfirmLead');
  const fireOutConfirmModal = document.getElementById('fireOutConfirmModal');
  const closeFireOutConfirmModal = document.getElementById('closeFireOutConfirmModal');
  const cancelFireOutConfirmBtn = document.getElementById('cancelFireOutConfirmBtn');
  const confirmFireOutBtn = document.getElementById('confirmFireOutBtn');
  const fireOutToggleBtn = document.getElementById('fireOutToggleBtn');
  const fireOutToggleLabel = document.getElementById('fireOutToggleLabel');
  const fireOutToggleMeta = document.getElementById('fireOutToggleMeta');
  const fireOutHint = document.getElementById('fireOutHint');
  const alarmRaiseConfirmModal = document.getElementById('alarmRaiseConfirmModal');
  const closeAlarmRaiseConfirmModal = document.getElementById('closeAlarmRaiseConfirmModal');
  const cancelAlarmRaiseConfirmBtn = document.getElementById('cancelAlarmRaiseConfirmBtn');
  const confirmAlarmRaiseBtn = document.getElementById('confirmAlarmRaiseBtn');
  const alarmRaiseConfirmKicker = document.getElementById('alarmRaiseConfirmKicker');
  const alarmRaiseConfirmTitle = document.getElementById('alarmRaiseConfirmTitle');
  const alarmRaiseConfirmLead = document.getElementById('alarmRaiseConfirmLead');
  const alarmRaiseConfirmSummary = document.getElementById('alarmRaiseConfirmSummary');
  const alarmRaiseConfirmNote = document.getElementById('alarmRaiseConfirmNote');
  const form = document.getElementById('reportForm');
  const reportId = document.getElementById('reportId');
  const reportSubmitBtn = document.getElementById('reportSubmitBtn');
  const reportModalTitle = document.getElementById('reportModalTitle');
  const reportTypeField = document.getElementById('reportTypeField');
  const reportType = document.getElementById('reportType');
  const incidentStageField = document.getElementById('incidentStageField');
  const incidentStage = document.getElementById('incidentStage');
  const alarmLevelField = document.getElementById('alarmLevelField');
  const alarmLevel = document.getElementById('alarmLevel');
  const incidentStatusField = document.getElementById('incidentStatusField');
  const incidentStatus = document.getElementById('incidentStatus');
  const fireOutField = document.getElementById('fireOutField');
  const fireOutCheckbox = document.getElementById('fireOutCheckbox');
  const barangayField = document.getElementById('barangayField');
  const barangay = document.getElementById('barangay');
  const callerNameField = document.getElementById('callerNameField');
  const streetField = document.getElementById('streetField');
  const landmarkField = document.getElementById('landmarkField');
  const altAddressField = document.getElementById('altAddressField');
  const equipmentFields = document.getElementById('equipmentFields');
  const equipmentName = document.getElementById('equipmentName');
  const equipmentCategory = document.getElementById('equipmentCategory');
  const equipmentIssueType = document.getElementById('equipmentIssueType');
  const equipmentUrgency = document.getElementById('equipmentUrgency');
  const equipmentLastService = document.getElementById('equipmentLastService');
  const equipmentOperationalStatus = document.getElementById('equipmentOperationalStatus');
  const equipmentActionTaken = document.getElementById('equipmentActionTaken');
  const equipmentRecommendation = document.getElementById('equipmentRecommendation');
  const streetName = document.getElementById('streetName');
  const altAddressInput = document.getElementById('altAddressInput');
  const incidentFinishedField = document.getElementById('incidentFinishedField');
  const incidentTimelineCard = document.getElementById('incidentTimelineCard');
  const incidentTimelineList = document.getElementById('incidentTimelineList');
  const welcome = document.getElementById('reportsWelcome');
  const reportsMetaChips = document.getElementById('reportsMetaChips');
  const formMessage = document.getElementById('formMessage');
  const tableBody = document.getElementById('reportsTableBody');
  const reportTitle = document.getElementById('reportTitle');
  const callerNameInput = document.getElementById('callerName');
  const landmarkInput = document.getElementById('landmark');
  const incidentMapField = document.getElementById('incidentMapField');
  const locateIncidentBtn = document.getElementById('locateIncidentBtn');
  const manualPinToggle = document.getElementById('manualPinToggle');
  const incidentMapStatus = document.getElementById('incidentMapStatus');
  const incidentAssignmentPreview = document.getElementById('incidentAssignmentPreview');
  const incidentResponderStationInput = document.getElementById('incidentResponderStation');
  const incidentLatitudeInput = document.getElementById('incidentLatitude');
  const incidentLongitudeInput = document.getElementById('incidentLongitude');
  const incidentMapCanvas = document.getElementById('incidentMap');
  const incidentStartedAtInput = document.getElementById('incidentStartedAt');
  const incidentFinishedAtInput = document.getElementById('incidentFinishedAt');
  const reportRemarks = document.getElementById('reportRemarks');
  const reportStepTabDetails = document.getElementById('reportStepTabDetails');
  const reportStepTabTimeline = document.getElementById('reportStepTabTimeline');
  const reportStepDetails = document.getElementById('reportStepDetails');
  const reportStepTimeline = document.getElementById('reportStepTimeline');
  const reportStepPrev = document.getElementById('reportStepPrev');
  const alarmPriorityBadge = document.getElementById('alarmPriorityBadge');
  const alarmPriorityLevel = document.getElementById('alarmPriorityLevel');
  const alarmPriorityMeta = document.getElementById('alarmPriorityMeta');
  const reportsOngoingHint = document.getElementById('reportsOngoingHint');
  const reportsHistoryTitle = document.getElementById('reportsHistoryTitle');
  const reportsTicketTabs = document.getElementById('reportsTicketTabs');
  const reportsDateFilters = document.getElementById('reportsDateFilters');
  const reportsDateFilterInput = document.getElementById('reportsDateFilterInput');
  const reportsScopeCard = document.getElementById('reportsScopeCard');
  const reportsScopeMine = document.getElementById('reportsScopeMine');
  const reportsScopeAll = document.getElementById('reportsScopeAll');
  const reportsScopeDescription = document.getElementById('reportsScopeDescription');
  const sidebar = document.querySelector('.app-sidebar');
  const reportsApiUrl = '/firenet/NEWFIRENET/backend/controllers/reports.php';
  const reportsById = new Map();
  let allReportsCache = [];
  let ticketTab = 'queue';
  let dateFilter = 'all';
  let dateFilterValue = '';
  let updateMode = 'correction';
  let incidentFinishedAutoFilled = false;
  let incidentFinishedAutoValue = '';
  let mapInstance = null;
  let incidentMarker = null;
  let incidentProximityCircle = null;
  let stationLabelOverlays = [];
  let manualPinMode = false;
  let locateDebounceTimer = null;
  let locateSeq = 0;
  let locateActive = false;
  let googleGeocodeDisabled = true;
  let activeReportStep = 'details';
  let reportsScope = 'mine';
  const STATION_PROXIMITY_RADIUS_METERS = 1200;
  const INCIDENT_PROXIMITY_RADIUS_METERS = 280;

  if (
    !contextElement ||
    !openReportModal ||
    !reportTypeModal ||
    !closeReportTypeModal ||
    !chooseIncidentReport ||
    !chooseEquipmentReport ||
    !closeReportModal ||
    !reportModal ||
    !form ||
    !reportId ||
    !reportSubmitBtn ||
    !reportModalTitle ||
    !reportTypeField ||
    !reportType ||
    !incidentStageField ||
    !incidentStage ||
    !alarmLevelField ||
    !alarmLevel ||
    !incidentStatusField ||
    !incidentStatus ||
    !fireOutField ||
    !fireOutCheckbox ||
    !fireOutToggleBtn ||
    !fireOutConfirmModal ||
    !barangayField ||
    !barangay ||
    !callerNameField ||
    !streetField ||
    !landmarkField ||
    !altAddressField ||
    !equipmentFields ||
    !equipmentName ||
    !equipmentCategory ||
    !equipmentIssueType ||
    !equipmentUrgency ||
    !equipmentLastService ||
    !equipmentOperationalStatus ||
    !equipmentActionTaken ||
    !equipmentRecommendation ||
    !streetName ||
    !altAddressInput ||
    !incidentFinishedField ||
    !incidentTimelineCard ||
    !incidentTimelineList ||
    !welcome ||
    !formMessage ||
    !tableBody ||
    !reportTitle ||
    !callerNameInput ||
    !landmarkInput ||
    !incidentMapField ||
    !locateIncidentBtn ||
    !manualPinToggle ||
    !incidentMapStatus ||
    !incidentAssignmentPreview ||
    !incidentResponderStationInput ||
    !incidentLatitudeInput ||
    !incidentLongitudeInput ||
    !incidentMapCanvas ||
    !incidentStartedAtInput ||
    !incidentFinishedAtInput ||
    !reportRemarks ||
    !reportStepTabDetails ||
    !reportStepTabTimeline ||
    !reportStepDetails ||
    !reportStepTimeline ||
    !reportStepPrev ||
    !alarmPriorityBadge ||
    !alarmPriorityLevel ||
    !alarmPriorityMeta ||
    !reportsScopeCard ||
    !reportsScopeMine ||
    !reportsScopeAll ||
    !reportsScopeDescription
  ) {
    return;
  }

  function mountReportModalsToBody() {
    [reportTypeModal, reportModal, releaseConfirmModal, fireOutConfirmModal, alarmRaiseConfirmModal].forEach(function (modal) {
      if (modal && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
    });
  }

  function syncReportModalScrollLock() {
    const isOpen = !reportModal.hidden
      || !reportTypeModal.hidden
      || (releaseConfirmModal && !releaseConfirmModal.hidden)
      || (fireOutConfirmModal && !fireOutConfirmModal.hidden)
      || (alarmRaiseConfirmModal && !alarmRaiseConfirmModal.hidden);
    document.body.classList.toggle('report-modal-open', isOpen);
  }

  function resetReportModalScroll(modal) {
    if (!modal) {
      return;
    }
    window.scrollTo(0, 0);
    const dialog = modal.querySelector('.report-modal-dialog, .report-type-dialog');
    const scroll = modal.querySelector('.rm-form-scroll');
    if (scroll) {
      scroll.scrollTop = 0;
    }
    if (dialog) {
      dialog.scrollTop = 0;
    }
  }

  mountReportModalsToBody();

  let context = null;
  try {
    context = JSON.parse(contextElement.textContent || '{}');
  } catch (error) {
    context = null;
  }

  if (!context) {
    return;
  }

  googleGeocodeDisabled = context.googleGeocodingEnabled !== true;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const canCreateIncidentReports = Boolean(context.canCreateIncidentReports);
  const canCreateEquipmentReports = Boolean(context.canCreateEquipmentReports);
  const canUpdateIncidentReports = Boolean(context.canUpdateIncidentReports);
  const canViewAllReports = Boolean(context.canViewAllReports);
  const isCentralStation = Boolean(context.isCentralStation);
  const canCreate = canCreateIncidentReports || canCreateEquipmentReports;
  reportsScope = 'mine';
  let alarmRaiseRequestsCache = [];
  let pendingAlarmRaiseCount = 0;
  const alarmLevelReadonlyRow = document.getElementById('alarmLevelReadonlyRow');
  const alarmLevelDisplay = document.getElementById('alarmLevelDisplay');
  const requestAlarmRaiseBtn = document.getElementById('requestAlarmRaiseBtn');
  const alarmRaiseRequestStatus = document.getElementById('alarmRaiseRequestStatus');
  const alarmLevelHint = document.getElementById('alarmLevelHint');
  const alarmRequestsBadge = document.getElementById('alarmRequestsBadge');
  const reportsAlarmRequestsTab = document.getElementById('reportsAlarmRequestsTab');
  const incidentTypeOption = reportType.querySelector('option[value="incident_report"]');
  const equipmentTypeOption = reportType.querySelector('option[value="equipment_report"]');

  // Deep-link: ?tab=alarm_requests
  try {
    const bootParams = new URLSearchParams(window.location.search || '');
    const bootTab = String(bootParams.get('tab') || '').trim();
    if (bootTab === 'alarm_requests' && isCentralStation) {
      ticketTab = 'alarm_requests';
    }
  } catch (ignored) {
    // ignore
  }

  function getAllowedCreateTypes() {
    const allowedTypes = [];
    if (canCreateIncidentReports) {
      allowedTypes.push('incident_report');
    }
    if (canCreateEquipmentReports) {
      allowedTypes.push('equipment_report');
    }
    return allowedTypes;
  }

  function getDefaultCreateType() {
    const allowedTypes = getAllowedCreateTypes();
    if (allowedTypes.indexOf('incident_report') !== -1) {
      return 'incident_report';
    }
    if (allowedTypes.indexOf('equipment_report') !== -1) {
      return 'equipment_report';
    }
    return 'incident_report';
  }

  function renderReportsScopeToggle() {
    if (reportsScopeCard) {
      reportsScopeCard.hidden = true;
    }
  }

  function renderSessionMeta() {
    const stationLabel = String(context.stationName || ('Station ' + String(context.stationId || 1)));
    welcome.textContent = 'File and track incident and equipment reports you create or update. Completed incidents move to Incident Logs.';

    if (!reportsMetaChips) {
      return;
    }

    const chips = [
      { label: 'Signed in', value: context.user || 'Unknown User' },
      { label: 'Role', value: context.role || 'user' }
    ];

    if (context.positionName) {
      chips.push({ label: 'Position', value: context.positionName });
    }

    chips.push({ label: 'Station', value: stationLabel });

    reportsMetaChips.innerHTML = chips
      .map(function (chip) {
        return (
          '<li class="reports-meta-chip">' +
          '<span class="reports-meta-chip-label">' + escapeHtml(chip.label) + '</span>' +
          '<span class="reports-meta-chip-value">' + escapeHtml(chip.value) + '</span>' +
          '</li>'
        );
      })
      .join('');
  }

  renderSessionMeta();

  if (!canCreate) {
    openReportModal.hidden = true;
  }

  if (incidentTypeOption) {
    incidentTypeOption.hidden = !canCreateIncidentReports;
    incidentTypeOption.disabled = !canCreateIncidentReports;
  }

  if (equipmentTypeOption) {
    equipmentTypeOption.hidden = !canCreateEquipmentReports;
    equipmentTypeOption.disabled = !canCreateEquipmentReports;
  }

  renderReportsScopeToggle();

  function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
  }

  function parseCoordinate(value) {
    if (value == null) {
      return null;
    }

    const raw = String(value).trim();
    if (raw === '') {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function getSelectLabel(selectElement, value) {
    if (!selectElement || !Array.isArray(selectElement.options)) {
      return String(value || '');
    }

    for (let i = 0; i < selectElement.options.length; i += 1) {
      const option = selectElement.options[i];
      if (String(option.value) === String(value)) {
        return String(option.textContent || option.value || '');
      }
    }

    return String(value || '');
  }

  function buildEquipmentRemarks(summaryText) {
    const details = {
      equipmentName: String(equipmentName.value || '').trim(),
      equipmentCategory: String(equipmentCategory.value || '').trim(),
      equipmentIssueType: String(equipmentIssueType.value || '').trim(),
      equipmentUrgency: String(equipmentUrgency.value || '').trim(),
      equipmentLastService: String(equipmentLastService.value || '').trim(),
      equipmentOperationalStatus: String(equipmentOperationalStatus.value || '').trim(),
      equipmentActionTaken: String(equipmentActionTaken.value || '').trim(),
      equipmentRecommendation: String(equipmentRecommendation.value || '').trim()
    };

    const lines = [
      '[EQUIPMENT_REPORT_V1]',
      'Equipment Name: ' + details.equipmentName,
      'Category: ' + getSelectLabel(equipmentCategory, details.equipmentCategory),
      'Issue Type: ' + getSelectLabel(equipmentIssueType, details.equipmentIssueType),
      'Urgency: ' + getSelectLabel(equipmentUrgency, details.equipmentUrgency),
      'Last Service Date: ' + (details.equipmentLastService || '-'),
      'Operational Status: ' + getSelectLabel(equipmentOperationalStatus, details.equipmentOperationalStatus),
      'Initial Action Taken: ' + (details.equipmentActionTaken || '-'),
      'Recommended Follow-up: ' + (details.equipmentRecommendation || '-'),
      '',
      'Issue Summary:',
      summaryText
    ];

    return {
      serialized: lines.join('\n'),
      details: details
    };
  }

  function parseEquipmentRemarks(rawRemarks) {
    const remarksText = String(rawRemarks || '');
    const marker = '[EQUIPMENT_REPORT_V1]';
    if (!remarksText.startsWith(marker)) {
      return null;
    }

    const details = {
      equipmentName: '',
      equipmentCategory: '',
      equipmentIssueType: '',
      equipmentUrgency: '',
      equipmentLastService: '',
      equipmentOperationalStatus: '',
      equipmentActionTaken: '',
      equipmentRecommendation: ''
    };

    const lines = remarksText.split('\n');
    let inSummary = false;
    const summaryLines = [];

    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line === 'Issue Summary:') {
        inSummary = true;
        continue;
      }

      if (inSummary) {
        summaryLines.push(line);
        continue;
      }

      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (key === 'Equipment Name') {
        details.equipmentName = value;
      } else if (key === 'Category') {
        const match = Array.from(equipmentCategory.options).find(function (option) {
          return String(option.textContent || '').trim().toLowerCase() === value.toLowerCase();
        });
        details.equipmentCategory = match ? String(match.value) : '';
      } else if (key === 'Issue Type') {
        const match = Array.from(equipmentIssueType.options).find(function (option) {
          return String(option.textContent || '').trim().toLowerCase() === value.toLowerCase();
        });
        details.equipmentIssueType = match ? String(match.value) : '';
      } else if (key === 'Urgency') {
        const match = Array.from(equipmentUrgency.options).find(function (option) {
          return String(option.textContent || '').trim().toLowerCase() === value.toLowerCase();
        });
        details.equipmentUrgency = match ? String(match.value) : '';
      } else if (key === 'Last Service Date') {
        details.equipmentLastService = value === '-' ? '' : value;
      } else if (key === 'Operational Status') {
        const match = Array.from(equipmentOperationalStatus.options).find(function (option) {
          return String(option.textContent || '').trim().toLowerCase() === value.toLowerCase();
        });
        details.equipmentOperationalStatus = match ? String(match.value) : '';
      } else if (key === 'Initial Action Taken') {
        details.equipmentActionTaken = value === '-' ? '' : value;
      } else if (key === 'Recommended Follow-up') {
        details.equipmentRecommendation = value === '-' ? '' : value;
      }
    }

    return {
      details: details,
      summary: summaryLines.join('\n').trim()
    };
  }

  function setMapStatus(message) {
    incidentMapStatus.textContent = message;
  }

  function setAssignmentPreview(message) {
    incidentAssignmentPreview.textContent = message;
  }

  function setManualPinMode(enabled) {
    manualPinMode = Boolean(enabled);
    manualPinToggle.setAttribute('aria-pressed', manualPinMode ? 'true' : 'false');
    manualPinToggle.textContent = manualPinMode ? 'Pin on Map: On' : 'Pin on Map: Off';
    if (mapInstance) {
      mapInstance.setOptions({
        draggableCursor: manualPinMode ? 'crosshair' : null
      });
    }
  }

  function buildStreetVariants(value) {
    const input = String(value || '').trim();
    if (!input) {
      return [];
    }

    const expanded = input
      .replace(/\bst\.?\b/gi, 'Street')
      .replace(/\bave\.?\b/gi, 'Avenue')
      .replace(/\brd\.?\b/gi, 'Road')
      .replace(/\bblvd\.?\b/gi, 'Boulevard')
      .replace(/\bext\.?\b/gi, 'Extension');

    const abbreviated = input
      .replace(/\bstreet\b/gi, 'St')
      .replace(/\bavenue\b/gi, 'Ave')
      .replace(/\broad\b/gi, 'Rd')
      .replace(/\bboulevard\b/gi, 'Blvd')
      .replace(/\bextension\b/gi, 'Ext');

    const stripped = input.replace(/\s+(street|st|avenue|ave|road|rd|boulevard|blvd|extension|ext)\.?$/i, '').trim();

    return Array.from(new Set([input, expanded, abbreviated, stripped].filter(Boolean)));
  }

  function normalizeAddressText(value) {
    return String(value || '')
      .replace(/\r\n/g, '\n')
      .replace(/\n+/g, ', ')
      .replace(/\s{2,}/g, ' ')
      .replace(/,\s*,+/g, ', ')
      .trim();
  }

  function isAddressLocalityPart(part) {
    return /^(?:makati(?:\s+city)?|city\s+of\s+makati|metro\s+manila|philippines|\d{4,5}(?:\s+metro\s+manila)?)$/i.test(String(part || '').replace(/\s{2,}/g, ' ').trim());
  }

  function addressLooksLikeStreet(part) {
    return /\b(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|highway|hwy\.?|corner|cor\.?)\b|\d{2,5}\s+\S+/i.test(String(part || ''));
  }

  function addressLooksLikeBuilding(part) {
    return /\b(?:tower|center|centre|plaza|building|bldg\.?|mall|arcade|suites?)\b/i.test(String(part || ''));
  }

  function addressLooksLikeVillage(part) {
    return /\bvillage\b/i.test(String(part || ''));
  }

  function parseComplexAddress(raw) {
    const fullNormalized = normalizeAddressText(raw);
    if (fullNormalized === '') {
      return {
        building: '',
        street: '',
        area: '',
        barangay: '',
        segments: [],
        fullNormalized: ''
      };
    }

    const parts = fullNormalized.split(',').map(function (part) {
      return String(part || '').trim();
    }).filter(Boolean);

    let building = '';
    let street = '';
    let area = '';
    let barangay = '';
    const segments = [];

    parts.forEach(function (part) {
      if (isAddressLocalityPart(part)) {
        return;
      }

      if (/^(?:barangay|brgy\.?)\s+/i.test(part)) {
        barangay = part.replace(/^(?:barangay|brgy\.?)\s*/i, '').replace(/\s+makati(?:\s+city)?$/i, '').trim();
        if (barangay !== '') {
          segments.push('Barangay ' + barangay);
        }
        return;
      }

      const compoundMatch = part.match(/^(.+?),\s*(?:barangay|brgy\.?)\s+(.+)$/i);
      if (compoundMatch) {
        const left = String(compoundMatch[1] || '').trim();
        barangay = String(compoundMatch[2] || '').trim().replace(/\s+makati(?:\s+city)?$/i, '').trim();
        if (left !== '') {
          if (addressLooksLikeVillage(left) || !addressLooksLikeStreet(left)) {
            area = area !== '' ? area + ', ' + left : left;
          } else {
            street = street !== '' ? street : left;
          }
          segments.push(left);
        }
        if (barangay !== '') {
          segments.push('Barangay ' + barangay);
        }
        return;
      }

      if (addressLooksLikeVillage(part)) {
        area = area !== '' ? area + ', ' + part : part;
        segments.push(part);
        return;
      }

      if (addressLooksLikeStreet(part)) {
        street = street !== '' ? street : part;
        segments.push(part);
        return;
      }

      if (addressLooksLikeBuilding(part) && street === '') {
        building = building !== '' ? building : part;
        segments.push(part);
        return;
      }

      if (building === '' && street === '' && area === '') {
        building = part;
      } else if (street === '' && /\d/.test(part)) {
        street = part;
      } else if (area === '') {
        area = part;
      }
      segments.push(part);
    });

    if (barangay === '' && /(?:barangay|brgy\.?)\s+([^,]+)/i.test(fullNormalized)) {
      const inlineMatch = fullNormalized.match(/(?:barangay|brgy\.?)\s+([^,]+)/i);
      if (inlineMatch && inlineMatch[1]) {
        barangay = String(inlineMatch[1]).trim().replace(/\s+makati(?:\s+city)?$/i, '').trim();
      }
    }

    return {
      building: building,
      street: street,
      area: area,
      barangay: barangay,
      segments: Array.from(new Set(segments.filter(Boolean))),
      fullNormalized: fullNormalized
    };
  }

  function resolveAddressPartsForLocate(street, landmark, barangayValue, altAddress) {
    const parsed = parseComplexAddress(altAddress);
    let resolvedStreet = String(street || '').trim() || parsed.street;
    let resolvedLandmark = String(landmark || '').trim() || parsed.building;
    let resolvedBarangay = String(barangayValue || '').trim() || parsed.barangay;
    const resolvedAlt = parsed.fullNormalized || normalizeAddressText(altAddress);

    if (resolvedLandmark === '' && parsed.area !== '') {
      resolvedLandmark = parsed.area;
    }

    if (resolvedStreet === '' && parsed.segments.length > 0) {
      const streetSegment = parsed.segments.find(function (segment) {
        return addressLooksLikeStreet(segment);
      });
      resolvedStreet = streetSegment || parsed.segments[0];
    }

    return {
      streetName: resolvedStreet,
      landmark: resolvedLandmark,
      barangay: resolvedBarangay,
      altAddress: resolvedAlt,
      segments: parsed.segments
    };
  }

  function buildAddressCandidates(street, landmark, barangayValue, altAddress) {
    const resolved = resolveAddressPartsForLocate(street, landmark, barangayValue, altAddress);
    const streetVariants = buildStreetVariants(resolved.streetName);
    const altVariants = buildStreetVariants(resolved.altAddress);
    const segmentVariants = [];
    resolved.segments.forEach(function (segment) {
      buildStreetVariants(segment).forEach(function (variant) {
        segmentVariants.push(variant);
      });
    });
    const barangayVariants = Array.from(new Set([
      String(resolved.barangay || '').trim(),
      String(resolved.barangay || '').trim() ? ('Barangay ' + String(resolved.barangay || '').trim()) : ''
    ].filter(Boolean)));

    const localityVariants = [
      ['Makati City', 'Metro Manila', 'Philippines'],
      ['City of Makati', 'Metro Manila', 'Philippines'],
      ['Makati', 'Metro Manila', 'Philippines'],
      ['Makati City', 'Philippines'],
      ['Metro Manila', 'Philippines'],
      ['Philippines']
    ];

    const candidates = [];
    function pushCandidate(parts, locality) {
      const candidate = parts
        .concat(locality)
        .map(function (part) {
          return String(part || '').trim();
        })
        .filter(function (part) {
          return part !== '';
        })
        .join(', ');
      if (candidate) {
        candidates.push(candidate);
      }
    }

    localityVariants.forEach(function (locality) {
      if (resolved.altAddress) {
        pushCandidate([resolved.altAddress], locality);
      }

      const combinedParts = [resolved.landmark, resolved.streetName, resolved.barangay].filter(function (part) {
        return String(part || '').trim() !== '';
      });
      if (combinedParts.length >= 2) {
        pushCandidate(combinedParts, locality);
      }

      segmentVariants.forEach(function (segment) {
        pushCandidate([segment], locality);
        barangayVariants.forEach(function (bg) {
          pushCandidate([segment, bg], locality);
        });
      });

      streetVariants.forEach(function (sv) {
        barangayVariants.forEach(function (bg) {
          pushCandidate([sv, resolved.landmark, bg], locality);
          pushCandidate([sv, bg], locality);
          pushCandidate([sv, resolved.landmark], locality);
        });
        pushCandidate([sv], locality);
      });

      altVariants.forEach(function (av) {
        barangayVariants.forEach(function (bg) {
          pushCandidate([av, bg], locality);
          pushCandidate([av, resolved.landmark, bg], locality);
        });
        pushCandidate([av], locality);
      });

      streetVariants.forEach(function (sv) {
        altVariants.forEach(function (av) {
          barangayVariants.forEach(function (bg) {
            pushCandidate([sv, av, bg], locality);
            pushCandidate([sv, av], locality);
          });
        });
      });

      if (resolved.landmark) {
        barangayVariants.forEach(function (bg) {
          pushCandidate([resolved.landmark, bg], locality);
        });
        pushCandidate([resolved.landmark], locality);
      }
    });

    return Array.from(new Set(candidates)).slice(0, 36);
  }

  function geocodeWithGoogleMaps(address) {
    return new Promise(function (resolve) {
      if (googleGeocodeDisabled || !isGoogleMapsReady() || !address) {
        resolve(null);
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      const boundedRequest = {
        address: address,
        region: 'ph',
        componentRestrictions: { country: 'PH' },
        bounds: new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(14.49, 120.98),
          new window.google.maps.LatLng(14.62, 121.09)
        )
      };

      const requests = [boundedRequest, { address: address, region: 'ph', componentRestrictions: { country: 'PH' } }, { address: address }];
      let index = 0;

      function runNext() {
        if (index >= requests.length) {
          resolve(null);
          return;
        }

        geocoder.geocode(requests[index], function (results, status) {
          if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT') {
            googleGeocodeDisabled = true;
            resolve(null);
            return;
          }
          if (status !== 'OK' || !Array.isArray(results) || results.length === 0) {
            index += 1;
            runNext();
            return;
          }

          const location = results[0] && results[0].geometry && results[0].geometry.location;
          if (!location || typeof location.lat !== 'function' || typeof location.lng !== 'function') {
            index += 1;
            runNext();
            return;
          }

          resolve({
            latitude: location.lat(),
            longitude: location.lng(),
            displayAddress: String(results[0].formatted_address || address)
          });
        });
      }

      runNext();
    });
  }

  async function geocodeCandidatesWithGoogleMaps(candidates) {
    for (let i = 0; i < candidates.length; i += 1) {
      const result = await geocodeWithGoogleMaps(candidates[i]);
      if (result) {
        return result;
      }
    }
    return null;
  }

  function isGoogleMapsReady() {
    return Boolean(window.google && window.google.maps);
  }

  function refreshMapSize() {
    if (mapInstance && isGoogleMapsReady()) {
      window.google.maps.event.trigger(mapInstance, 'resize');
    }
  }

  function clearIncidentOverlays() {
    if (incidentMarker && typeof incidentMarker.setMap === 'function') {
      incidentMarker.setMap(null);
    }
    incidentMarker = null;

    if (incidentProximityCircle && typeof incidentProximityCircle.setMap === 'function') {
      incidentProximityCircle.setMap(null);
    }
    incidentProximityCircle = null;
  }

  function clearStationLabelOverlays() {
    stationLabelOverlays.forEach(function (overlay) {
      if (overlay && typeof overlay.setMap === 'function') {
        overlay.setMap(null);
      }
    });
    stationLabelOverlays = [];
  }

  function createStationLabelOverlay(map, position, text) {
    if (!isGoogleMapsReady()) {
      return null;
    }

    function StationLabelOverlay() {
      this.position = position;
      this.text = text;
      this.div = null;
    }

    StationLabelOverlay.prototype = Object.create(window.google.maps.OverlayView.prototype);
    StationLabelOverlay.prototype.constructor = StationLabelOverlay;

    StationLabelOverlay.prototype.onAdd = function () {
      const div = document.createElement('div');
      div.className = 'station-name-tooltip';
      div.textContent = this.text;
      div.setAttribute('role', 'presentation');
      this.div = div;
      const panes = this.getPanes();
      if (panes && panes.overlayLayer) {
        panes.overlayLayer.appendChild(div);
      }
    };

    StationLabelOverlay.prototype.draw = function () {
      if (!this.div) {
        return;
      }

      const projection = this.getProjection();
      if (!projection) {
        return;
      }

      const point = projection.fromLatLngToDivPixel(this.position);
      if (!point) {
        return;
      }

      this.div.style.left = point.x + 'px';
      this.div.style.top = point.y + 'px';
    };

    StationLabelOverlay.prototype.onRemove = function () {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
      this.div = null;
    };

    const overlay = new StationLabelOverlay();
    overlay.setMap(map);
    return overlay;
  }

  function getAssignmentMethodLabel(method) {
    return method === 'aor' ? 'Within station radius (AOR)' : 'Nearest station fallback';
  }

  function formatStationEntry(station) {
    if (!station || !station.name) {
      return '';
    }

    return String(station.name);
  }

  function formatStationsSummary(stations) {
    if (!Array.isArray(stations) || stations.length === 0) {
      return '';
    }

    const names = stations
      .filter(function (station) {
        return Boolean(station && station.name);
      })
      .map(function (station) {
        return formatStationEntry(station);
      })
      .filter(function (name) {
        return name !== '';
      });

    return names.join(', ');
  }

  function formatDispatchedStationsLabel(item) {
    const stations = Array.isArray(item && item.assignedStations) ? item.assignedStations : [];
    let names = formatStationsSummary(stations);
    if (!names && item && item.assignedStationName) {
      names = String(item.assignedStationName);
    }
    if (!names) {
      return 'Handed to responders';
    }
    return 'Handed to ' + names;
  }

  function formatDispatchedActionLabel(item) {
    const stations = Array.isArray(item && item.assignedStations) ? item.assignedStations : [];
    let names = formatStationsSummary(stations);
    if (!names && item && item.assignedStationName) {
      names = String(item.assignedStationName);
    }
    if (!names) {
      return 'Dispatched to responders';
    }
    return 'Dispatched to ' + names;
  }

  function buildStationsFromPayload(payload) {
    if (payload && Array.isArray(payload.stations) && payload.stations.length > 0) {
      return payload.stations;
    }

    if (payload && payload.station && payload.station.name) {
      return [payload.station];
    }

    return [];
  }

  function setResponderStationText(stationName, method, distanceKm) {
    if (!stationName) {
      incidentResponderStationInput.value = '';
      return;
    }

    const methodLabel = getAssignmentMethodLabel(method);
    const distanceLabel = distanceKm != null && distanceKm !== '' ? ' | Distance: ' + distanceKm + ' km' : '';
    incidentResponderStationInput.value = stationName + ' (' + methodLabel + distanceLabel + ')';
  }

  function setResponderStationsText(stations) {
    incidentResponderStationInput.value = formatStationsSummary(stations);
  }

  function getReportNotificationLabel(type) {
    if (type === 'incident_report') {
      return 'Incident Submission';
    }
    if (type === 'equipment_report') {
      return 'Equipment Submission';
    }
    return 'Submission';
  }

  function saveSubmissionNotification(report) {
    if (!report || !report.id) {
      return;
    }

    const notification = {
      id: String(report.id),
      title: String(report.title || report.location || 'Submission'),
      type: String(report.type || 'submission'),
      label: getReportNotificationLabel(report.type),
      url: '/firenet/NEWFIRENET/backend/pages/reports.php?mode=edit&id=' + encodeURIComponent(String(report.id)),
      createdAt: new Date().toISOString(),
      read: false
    };

    try {
      const storageKey = 'firenet.reportNotifications';
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const list = Array.isArray(stored) ? stored : [];
      const filtered = list.filter(function (item) {
        return String(item && item.id ? item.id : '') !== notification.id;
      });
      filtered.unshift(notification);
      localStorage.setItem(storageKey, JSON.stringify(filtered.slice(0, 12)));
      window.dispatchEvent(new CustomEvent('firenet:notifications-updated', { detail: { source: 'reports' } }));
    } catch (error) {
      // Ignore storage issues; report submission should still succeed.
    }
  }

  function hasAddressDetails() {
    const street = String(streetName.value || '').trim();
    const barangayValue = String(barangay.value || '').trim();
    const landmarkValue = String(landmarkInput.value || '').trim();
    const altAddressValue = normalizeAddressText(altAddressInput.value);
    const resolved = resolveAddressPartsForLocate(street, landmarkValue, barangayValue, altAddressValue);
    return resolved.streetName !== '' || resolved.barangay !== '' || resolved.landmark !== '' || resolved.altAddress !== '';
  }

  function setCoordinateFields(latitude, longitude) {
    incidentLatitudeInput.value = latitude == null ? '' : Number(latitude).toFixed(7);
    incidentLongitudeInput.value = longitude == null ? '' : Number(longitude).toFixed(7);
  }

  function coordinateDistanceKm(lat1, lon1, lat2, lon2) {
    const toRad = function (value) {
      return value * (Math.PI / 180);
    };
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function clearIncidentLocationForRelocate() {
    setCoordinateFields(null, null);
    if (incidentMarker) {
      incidentMarker.setMap(null);
      incidentMarker = null;
    }
    if (incidentProximityCircle) {
      incidentProximityCircle.setMap(null);
      incidentProximityCircle = null;
    }
    setAssignmentPreview('Responsible station will appear after successful lookup.');
    setResponderStationText('', '', null);
  }

  async function fetchLocateWithTimeout(params, timeoutMs) {
    const controller = new AbortController();
    const timer = window.setTimeout(function () {
      controller.abort();
    }, timeoutMs || 18000);

    try {
      const response = await fetch(getLocateUrl(params), {
        method: 'GET',
        credentials: 'same-origin',
        signal: controller.signal
      });
      const raw = await response.text();
      return {
        response: response,
        payload: raw ? JSON.parse(raw) : null
      };
    } catch (error) {
      return {
        response: null,
        payload: null
      };
    } finally {
      window.clearTimeout(timer);
    }
  }

  function getAlarmPriorityMeta(level) {
    if (level >= 4) {
      return '5 stations will auto-respond';
    }
    if (level === 3) {
      return '4 stations will auto-respond';
    }
    if (level === 2) {
      return '3 stations will auto-respond';
    }
    return '2 stations will auto-respond';
  }

  function renderAlarmPriorityBadge() {
    const isIncident = reportType.value === 'incident_report';
    alarmPriorityBadge.hidden = !isIncident;

    if (!isIncident) {
      return;
    }

    const level = Math.max(1, Math.min(5, Number(alarmLevel.value || 1)));
    alarmPriorityLevel.textContent = 'Level ' + String(level);
    alarmPriorityMeta.textContent = getAlarmPriorityMeta(level);
  }

  function renderStepTabs() {
    const isIncident = reportType.value === 'incident_report';

    reportStepTabTimeline.hidden = !isIncident;
    reportStepTabDetails.classList.toggle('is-active', activeReportStep === 'details');
    reportStepTabTimeline.classList.toggle('is-active', activeReportStep === 'timeline');
    reportStepTabDetails.setAttribute('aria-selected', activeReportStep === 'details' ? 'true' : 'false');
    reportStepTabTimeline.setAttribute('aria-selected', activeReportStep === 'timeline' ? 'true' : 'false');

    reportStepDetails.hidden = activeReportStep !== 'details';
    reportStepTimeline.hidden = activeReportStep !== 'timeline';
    reportStepDetails.classList.toggle('is-active', activeReportStep === 'details');
    reportStepTimeline.classList.toggle('is-active', activeReportStep === 'timeline');

    reportStepPrev.hidden = activeReportStep !== 'timeline';
    reportSubmitBtn.hidden = false;
  }

  function setReportStep(step) {
    const isIncident = reportType.value === 'incident_report';
    if (step === 'timeline' && !isIncident) {
      activeReportStep = 'details';
    } else {
      activeReportStep = step;
    }

    renderStepTabs();

    if (activeReportStep === 'details' && isIncident) {
      ensureMapReady();
      setTimeout(refreshMapSize, 80);
    }
  }

  function canProceedToTimelineStep() {
    if (reportType.value !== 'incident_report') {
      return false;
    }

    formMessage.textContent = '';
    return true;
  }

  function ensureMapReady() {
    if (mapInstance) {
      return;
    }

    if (!isGoogleMapsReady()) {
      if (!context.googleMapsConfigured) {
        setMapStatus('Google Maps API key is not configured yet.');
      }
      return;
    }

    clearStationLabelOverlays();
    clearIncidentOverlays();

    mapInstance = new window.google.maps.Map(incidentMapCanvas, {
      center: { lat: 14.5547, lng: 121.0244 },
      zoom: 13,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      mapTypeId: 'roadmap'
    });

    mapInstance.addListener('click', function (event) {
      if (!manualPinMode || !event || !event.latLng) {
        return;
      }

      const latitude = Number(event.latLng.lat());
      const longitude = Number(event.latLng.lng());
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return;
      }

      setCoordinateFields(latitude, longitude);
      placeIncidentMarker(latitude, longitude, true);
      setMapStatus('Manual pin placed. Coordinates captured from map click.');
      lookupByCoordinates(latitude, longitude);
    });

    const stationGeo = Array.isArray(context.stationGeo) ? context.stationGeo : [];
    stationGeo.forEach(function (station) {
      const lat = Number(station.latitude || 0);
      const lng = Number(station.longitude || 0);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
        return;
      }

      const stationPosition = { lat: lat, lng: lng };

      new window.google.maps.Circle({
        map: mapInstance,
        center: stationPosition,
        radius: STATION_PROXIMITY_RADIUS_METERS,
        strokeColor: '#1d74b8',
        strokeOpacity: 0.85,
        strokeWeight: 1,
        fillColor: '#1d74b8',
        fillOpacity: 0.08,
        clickable: false
      });

      new window.google.maps.Marker({
        position: stationPosition,
        map: mapInstance,
        title: String(station.stationName || 'Station'),
        clickable: false
      });

      const labelOverlay = createStationLabelOverlay(mapInstance, stationPosition, String(station.stationName || 'Station'));
      if (labelOverlay) {
        stationLabelOverlays.push(labelOverlay);
      }
    });

    setTimeout(function () {
      if (mapInstance) {
        refreshMapSize();
      }
    }, 100);
  }

  function placeIncidentMarker(latitude, longitude, keepView) {
    if (!mapInstance) {
      return;
    }

    const position = { lat: latitude, lng: longitude };

    if (incidentMarker) {
      incidentMarker.setPosition(position);
    } else {
      incidentMarker = new window.google.maps.Marker({
        position: position,
        map: mapInstance,
        draggable: false,
        title: 'Incident location'
      });
    }

    if (incidentProximityCircle) {
      incidentProximityCircle.setCenter(position);
    } else {
      incidentProximityCircle = new window.google.maps.Circle({
        map: mapInstance,
        center: position,
        radius: INCIDENT_PROXIMITY_RADIUS_METERS,
        strokeColor: '#bc1f2d',
        strokeOpacity: 0.9,
        strokeWeight: 1,
        fillColor: '#bc1f2d',
        fillOpacity: 0.12,
        clickable: false
      });
    }

    if (!keepView) {
      mapInstance.setCenter(position);
      mapInstance.setZoom(16);
    }
  }

  function getLocateUrl(params) {
    const endpoint = String(context.geocodeEndpoint || (reportsApiUrl + '?action=locate'));
    const separator = endpoint.indexOf('?') === -1 ? '?' : '&';
    return endpoint + separator + params.toString();
  }

  async function lookupByCoordinates(latitude, longitude) {
    try {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        alarmLevel: String(alarmLevel.value || '1')
      });
      const response = await fetch(getLocateUrl(params), {
        method: 'GET',
        credentials: 'same-origin'
      });
      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        setAssignmentPreview('Station assignment could not be resolved for this point.');
        setResponderStationText('', '', null);
        return;
      }

      const stations = buildStationsFromPayload(payload);
      if (stations.length > 0) {
        setAssignmentPreview('Responsible stations (' + String(stations.length) + '): ' + formatStationsSummary(stations));
        setResponderStationsText(stations);
      } else {
        setAssignmentPreview('No active station assignments found for this point.');
        setResponderStationText('', '', null);
      }
    } catch (error) {
      setAssignmentPreview('Unable to compute station assignment right now.');
      setResponderStationText('', '', null);
    }
  }

  async function locateAddressFromForm() {
    if (reportType.value !== 'incident_report') {
      return;
    }

    const street = String(streetName.value || '').trim();
    const barangayValue = String(barangay.value || '').trim();
    const landmarkValue = String(landmarkInput.value || '').trim();
    const altAddressValue = normalizeAddressText(altAddressInput.value);
    const resolved = resolveAddressPartsForLocate(street, landmarkValue, barangayValue, altAddressValue);

    if (resolved.streetName === '' && resolved.landmark === '' && resolved.altAddress === '') {
      locateActive = false;
      setMapStatus('Type at least a street, building, village, or full address to locate this incident.');
      return;
    }

    const seq = ++locateSeq;
    locateActive = true;
    setMapStatus('Locating address on map...');

    try {
      const addressCandidates = buildAddressCandidates(
        resolved.streetName,
        resolved.landmark,
        resolved.barangay,
        resolved.altAddress
      );
      const params = new URLSearchParams({
        barangay: resolved.barangay,
        streetName: resolved.streetName,
        landmark: resolved.landmark,
        altAddress: resolved.altAddress,
        alarmLevel: String(alarmLevel.value || '1')
      });

      const backendResult = await fetchLocateWithTimeout(params, 18000);

      if (seq !== locateSeq) {
        return;
      }

      const response = backendResult.response;
      const payload = backendResult.payload;
      let latitude = payload && payload.latitude != null ? Number(payload.latitude) : null;
      let longitude = payload && payload.longitude != null ? Number(payload.longitude) : null;
      let displayAddress = payload && payload.displayAddress ? String(payload.displayAddress) : '';
      let backendOk = Boolean(response && response.ok && payload && payload.ok === true && latitude != null && longitude != null);

      if (!backendOk && addressCandidates.length > 0 && !googleGeocodeDisabled) {
        const googleResult = await geocodeCandidatesWithGoogleMaps(addressCandidates);
        if (googleResult) {
          latitude = Number(googleResult.latitude);
          longitude = Number(googleResult.longitude);
          if (!displayAddress) {
            displayAddress = String(googleResult.displayAddress || '');
          }
          backendOk = false;
        }
      }

      if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        setMapStatus((payload && payload.message) ? payload.message : 'Address lookup did not return coordinates. Try Street + Barangay + Alternative Address.');
        setAssignmentPreview('Responsible station will appear after successful lookup.');
        setResponderStationText('', '', null);
        return;
      }

      setCoordinateFields(latitude, longitude);
      ensureMapReady();
      placeIncidentMarker(latitude, longitude);

      if (!mapInstance) {
        setTimeout(function () {
          if (seq !== locateSeq) {
            return;
          }
          ensureMapReady();
          placeIncidentMarker(latitude, longitude);
        }, 200);
      }

      if (backendOk) {
        const stations = buildStationsFromPayload(payload);
        if (stations.length > 0) {
          setAssignmentPreview('Responsible stations (' + String(stations.length) + '): ' + formatStationsSummary(stations));
          setResponderStationsText(stations);
        } else {
          setAssignmentPreview('No active station assignments found for this location.');
          setResponderStationText('', '', null);
        }
      } else {
        lookupByCoordinates(latitude, longitude);
      }

      if (displayAddress) {
        setMapStatus('Located: ' + displayAddress);
      } else {
        setMapStatus('Address pin updated successfully.');
      }
    } catch (error) {
      if (seq !== locateSeq) {
        return;
      }
      setMapStatus('Unable to locate this address right now.');
      setAssignmentPreview('Responsible station will appear after successful lookup.');
      setResponderStationText('', '', null);
    } finally {
      if (seq === locateSeq) {
        locateActive = false;
      }
    }
  }

  function queueAddressLocate() {
    if (locateDebounceTimer) {
      clearTimeout(locateDebounceTimer);
    }
    if (hasAddressDetails()) {
      clearIncidentLocationForRelocate();
    }
    locateDebounceTimer = setTimeout(function () {
      locateAddressFromForm();
    }, 700);
  }

  function resetIncidentFinishedAutoTracking() {
    incidentFinishedAutoFilled = false;
    incidentFinishedAutoValue = '';
  }

  function getEffectiveIncidentStatus() {
    if (fireOutCheckbox && fireOutCheckbox.checked) {
      return 'fire_out';
    }
    return String(incidentStatus.value || '').trim();
  }

  function applyIncidentStatusToForm(statusCode) {
    const code = String(statusCode || '').trim().toLowerCase();
    if (code === 'fire_out') {
      fireOutCheckbox.checked = true;
      // Keep a progression status in the listbox for when Fire Out is unchecked later.
      if (incidentStatus.value !== 'under_control' && incidentStatus.value !== 'ongoing') {
        incidentStatus.value = 'under_control';
      }
      syncFireOutButtonUi();
      return;
    }

    fireOutCheckbox.checked = false;
    if (code === 'under_control' || code === 'ongoing') {
      incidentStatus.value = code;
      syncFireOutButtonUi();
      return;
    }

    incidentStatus.value = code === '' ? '' : 'ongoing';
    syncFireOutButtonUi();
  }

  function syncFireOutButtonUi() {
    const marked = Boolean(fireOutCheckbox && fireOutCheckbox.checked);
    if (fireOutToggleBtn) {
      fireOutToggleBtn.classList.toggle('is-active', marked);
      fireOutToggleBtn.setAttribute('aria-pressed', marked ? 'true' : 'false');
      fireOutToggleBtn.disabled = marked || fireOutCheckbox.disabled;
    }
    if (fireOutToggleLabel) {
      fireOutToggleLabel.textContent = marked ? 'Fire out marked' : 'Mark fire out';
    }
    if (fireOutToggleMeta) {
      fireOutToggleMeta.textContent = marked
        ? 'Locked for this update — save to complete'
        : 'Completes this incident permanently';
    }
    if (fireOutToggleBtn) {
      const icon = fireOutToggleBtn.querySelector('.rm-fire-out-btn-icon');
      if (icon) {
        icon.textContent = marked ? '✓' : '';
      }
    }
    if (fireOutHint) {
      fireOutHint.textContent = marked
        ? 'Fire Out is set. Save progress to complete the incident. This cannot be unmarked here.'
        : 'Only mark when the fire is fully extinguished.';
    }
  }

  function syncFireOutControls(isIncident, isCallIntake) {
    const show = isIncident && !isCallIntake;
    fireOutField.hidden = !show;
    fireOutCheckbox.disabled = !show;
    if (!show) {
      fireOutCheckbox.checked = false;
    }

    if (show && fireOutCheckbox.checked) {
      incidentStatus.disabled = true;
    }
    syncFireOutButtonUi();
  }

  function handleIncidentStatusAutoFinish() {
    // Finished-at is managed server-side on submit when status becomes fire_out.
    incidentFinishedAtInput.value = '';
    resetIncidentFinishedAutoTracking();
  }

  function openFireOutConfirmModal() {
    if (!fireOutConfirmModal || fireOutCheckbox.checked || fireOutCheckbox.disabled) {
      return;
    }
    fireOutConfirmModal.hidden = false;
    syncReportModalScrollLock();
    if (confirmFireOutBtn) {
      confirmFireOutBtn.focus();
    }
  }

  function closeFireOutConfirmModalDialog() {
    if (!fireOutConfirmModal) {
      return;
    }
    fireOutConfirmModal.hidden = true;
    syncReportModalScrollLock();
  }

  function confirmFireOutMark() {
    fireOutCheckbox.checked = true;
    const isIncident = reportType.value === 'incident_report';
    const isCallIntake = isIncident && incidentStage.value === 'call_intake';
    if (isIncident && !isCallIntake) {
      incidentStatus.disabled = true;
      if (!incidentStatus.value) {
        incidentStatus.value = 'ongoing';
      }
    }
    syncFireOutButtonUi();
    handleIncidentStatusAutoFinish();
    closeFireOutConfirmModalDialog();
  }

  function syncModalReportKind() {
    const currentType = reportType.value === 'equipment_report' ? 'equipment_report' : 'incident_report';
    reportModal.setAttribute('data-report-kind', currentType);
    reportStepTabDetails.textContent = currentType === 'equipment_report' ? 'Equipment Details' : 'Details';
  }

  function toggleIncidentStage() {
    const isIncident = reportType.value === 'incident_report';
    const isCallIntake = isIncident && incidentStage.value === 'call_intake';

    incidentStageField.hidden = !isIncident;
    incidentStage.disabled = !isIncident;
    alarmLevelField.hidden = !isIncident;
    // Visibility/edit mode for alarm is finalized in syncAlarmLevelAuthority().
    if (!isIncident) {
      alarmLevel.disabled = true;
      alarmLevel.classList.remove('is-hidden-control');
      if (alarmLevelReadonlyRow) {
        alarmLevelReadonlyRow.hidden = true;
      }
      if (requestAlarmRaiseBtn) {
        requestAlarmRaiseBtn.hidden = true;
      }
    }
    incidentStatusField.hidden = !isIncident || isCallIntake;
    incidentStatus.disabled = !isIncident || isCallIntake || (isIncident && !isCallIntake && fireOutCheckbox.checked);
    syncFireOutControls(isIncident, isCallIntake);

    barangayField.hidden = !isIncident;
    barangay.disabled = !isIncident;
    callerNameField.hidden = !isIncident;
    callerNameInput.disabled = !isIncident;
    streetField.hidden = !isIncident;
    landmarkField.hidden = !isIncident;
    altAddressField.hidden = !isIncident;
    streetName.disabled = !isIncident;
    landmarkInput.disabled = !isIncident;
    altAddressInput.disabled = !isIncident;

    equipmentFields.hidden = isIncident;
    equipmentName.disabled = isIncident;
    equipmentCategory.disabled = isIncident;
    equipmentIssueType.disabled = isIncident;
    equipmentUrgency.disabled = isIncident;
    equipmentLastService.disabled = isIncident;
    equipmentOperationalStatus.disabled = isIncident;
    equipmentActionTaken.disabled = isIncident;
    equipmentRecommendation.disabled = isIncident;

    incidentMapField.hidden = !isIncident;
    locateIncidentBtn.disabled = !isIncident;
    incidentLatitudeInput.disabled = !isIncident;
    incidentLongitudeInput.disabled = !isIncident;
    incidentFinishedField.hidden = true;
    if (incidentFinishedAtInput) {
      incidentFinishedAtInput.disabled = true;
      incidentFinishedAtInput.value = '';
      resetIncidentFinishedAutoTracking();

      if (isCallIntake) {
        incidentStatus.value = '';
      }
    }

    setProgressModeFields(updateMode === 'progression');
    enforceCreateIncidentIntakeStage();
    handleIncidentStatusAutoFinish();
    syncAlarmLevelAuthority(updateMode === 'progression');

    if (isIncident) {
      ensureMapReady();
      setTimeout(refreshMapSize, 100);
      manualPinToggle.disabled = false;
    } else {
      setCoordinateFields(null, null);
      setMapStatus('Map tools are available for incident reports only.');
      setAssignmentPreview('Responsible station will appear after location lookup.');
      setResponderStationText('', '', null);
      setManualPinMode(false);
      manualPinToggle.disabled = true;
    }

    if (!isIncident && activeReportStep === 'timeline') {
      activeReportStep = 'details';
    }
    renderAlarmPriorityBadge();
    renderStepTabs();

    if (isIncident) {
      setTimeout(refreshMapSize, 100);
    }

    syncModalReportKind();
  }

  function enforceCreateIncidentIntakeStage() {
    const isCreating = !reportId.value;
    const isIncident = reportType.value === 'incident_report';
    const isProgressMode = updateMode === 'progression';

    if (isCreating && isIncident && !isProgressMode) {
      if (incidentStage.value !== 'call_intake') {
        incidentStage.value = 'call_intake';
      }
      incidentStage.disabled = true;
      return;
    }

    if (isIncident && !isProgressMode) {
      incidentStage.disabled = false;
    }
  }

  function syncAlarmLevelAuthority(isProgressMode) {
    const isIncident = reportType.value === 'incident_report';
    const isCallIntake = isIncident && incidentStage.value === 'call_intake';
    const item = reportId.value ? reportsById.get(String(reportId.value)) : null;
    const liveAlarm = Math.max(
      1,
      Number((item && (item.caseAlarmLevel || item.alarmLevel)) || alarmLevel.value || 1)
    );

    if (!isIncident) {
      if (alarmLevelReadonlyRow) {
        alarmLevelReadonlyRow.hidden = true;
      }
      if (requestAlarmRaiseBtn) {
        requestAlarmRaiseBtn.hidden = true;
      }
      alarmLevel.classList.remove('is-hidden-control');
      return;
    }

    if (isProgressMode || !isCallIntake) {
      alarmLevel.value = String(liveAlarm);
    }

    const canEditAlarm = isCentralStation && (
      (!reportId.value && isCallIntake) ||
      (isProgressMode && isCentralStation) ||
      (!isCallIntake && isCentralStation && !!reportId.value && !isProgressMode)
    );
    // MCFS new intake / MCFS editing: keep the listbox.
    // Responding stations (and MCFS viewing locked live level on progress from stations): show value + request.
    const useReadonly = isProgressMode ? !isCentralStation : (reportId.value !== '' && !canEditAlarm);

    if (useReadonly || (isProgressMode && !isCentralStation)) {
      alarmLevel.classList.add('is-hidden-control');
      if (alarmLevelReadonlyRow) {
        alarmLevelReadonlyRow.hidden = false;
      }
      if (alarmLevelDisplay) {
        alarmLevelDisplay.textContent = 'Level ' + String(liveAlarm);
      }
      const showRequest = !isCentralStation && isProgressMode && canUpdateIncidentReports && liveAlarm < 5;
      if (requestAlarmRaiseBtn) {
        requestAlarmRaiseBtn.hidden = !showRequest;
        requestAlarmRaiseBtn.disabled = !showRequest;
        requestAlarmRaiseBtn.textContent = showRequest
          ? ('Request raise to ' + String(Math.min(5, liveAlarm + 1)))
          : 'Request raise';
        requestAlarmRaiseBtn.setAttribute('data-next-level', String(Math.min(5, liveAlarm + 1)));
      }
      if (alarmLevelHint) {
        alarmLevelHint.textContent = showRequest
          ? 'MCFS controls the live alarm. Request the next level if the fire has escalated.'
          : (liveAlarm >= 5
            ? 'Live fire alarm is already at the highest level.'
            : 'Live fire alarm is controlled by MCFS.');
      }
    } else {
      alarmLevel.classList.remove('is-hidden-control');
      if (alarmLevelReadonlyRow) {
        alarmLevelReadonlyRow.hidden = true;
      }
      if (requestAlarmRaiseBtn) {
        requestAlarmRaiseBtn.hidden = true;
      }
      alarmLevel.disabled = isCallIntake && !!reportId.value ? true : !canEditAlarm && !(!reportId.value && isCentralStation);
      if (!reportId.value && isCentralStation && isCallIntake) {
        alarmLevel.disabled = false;
      }
      if (alarmLevelHint) {
        alarmLevelHint.textContent = isCentralStation
          ? 'MCFS controls the live fire alarm for all responding stations.'
          : 'Live fire alarm is controlled by MCFS.';
      }
    }

    if (alarmRaiseRequestStatus) {
      alarmRaiseRequestStatus.hidden = true;
      alarmRaiseRequestStatus.textContent = '';
    }
  }

  function setProgressModeFields(isProgressMode) {
    const lockIntake = isProgressMode && reportType.value === 'incident_report';

    reportType.disabled = true;
    incidentStage.disabled = lockIntake;
    barangay.disabled = lockIntake;
    streetName.disabled = lockIntake;
    reportTitle.readOnly = lockIntake;
    callerNameInput.readOnly = lockIntake;
    landmarkInput.readOnly = lockIntake;
    incidentStartedAtInput.readOnly = true;
    reportRemarks.readOnly = lockIntake;

    if (lockIntake) {
      if (incidentStage.value === 'call_intake') {
        incidentStage.value = 'during_incident';
      }
      if (!incidentStatus.value || incidentStatus.value === 'fire_out') {
        incidentStatus.value = 'ongoing';
      }
      if (!fireOutCheckbox.checked) {
        incidentStatus.disabled = false;
      }
      if (incidentStatusField) {
        incidentStatusField.hidden = false;
      }
      syncFireOutControls(true, false);
      if (incidentFinishedField) {
        incidentFinishedField.hidden = true;
      }
      incidentFinishedAtInput.disabled = true;
      syncAlarmLevelAuthority(true);
      return;
    }

    incidentStartedAtInput.readOnly = true;
    syncAlarmLevelAuthority(false);
  }

  function syncReportTypeDefaults() {
    const isIncident = reportType.value === 'incident_report';

    if (isIncident) {
      if (!incidentStage.value) {
        incidentStage.value = 'call_intake';
      }
      if (!alarmLevel.value) {
        alarmLevel.value = '1';
      }
      if (incidentStage.value !== 'call_intake' && !incidentStatus.value) {
        incidentStatus.value = 'ongoing';
      }
    } else {
      incidentStage.value = 'call_intake';
      alarmLevel.value = '1';
      incidentStatus.value = 'ongoing';
      fireOutCheckbox.checked = false;
      if (!equipmentCategory.value) {
        equipmentCategory.value = 'vehicle';
      }
      if (!equipmentIssueType.value) {
        equipmentIssueType.value = 'mechanical';
      }
      if (!equipmentUrgency.value) {
        equipmentUrgency.value = 'medium';
      }
      if (!equipmentOperationalStatus.value) {
        equipmentOperationalStatus.value = 'limited';
      }
    }

    toggleIncidentStage();
    enforceCreateIncidentIntakeStage();
  }

  function normalizeType(value) {
    if (value === 'incident_report') {
      return 'Incident Report';
    }
    if (value === 'equipment_report') {
      return 'Equipment Report';
    }
    return value;
  }

  function normalizeStage(value, typeValue) {
    if (typeValue !== 'incident_report') {
      return '-';
    }

    const map = {
      call_intake: 'Call Intake',
      during_incident: 'During Incident',
      after_incident: 'After Incident'
    };

    return map[value] || value;
  }

  function formatIncidentStatus(value) {
    if (value === 'fire_out') {
      return 'Fire Out';
    }
    if (value === 'under_control') {
      return 'Under Control';
    }
    if (value === 'ongoing') {
      return 'Ongoing';
    }
    return value || '-';
  }

  function buildPdfTimelineEntries(item) {
    const updates = item && Array.isArray(item.incidentUpdates) ? item.incidentUpdates : [];
    const changeLogs = item && Array.isArray(item.incidentChangeLogs) ? item.incidentChangeLogs : [];
    const entries = [];

    updates.forEach(function (update) {
      entries.push({
        at: update.recordedAt || '',
        text: 'Snapshot - Alarm ' + String(update.alarmLevel || '-') + ', Status: ' + formatIncidentStatus(update.incidentStatus)
      });
    });

    changeLogs.forEach(function (log) {
      entries.push({
        at: log.changedAt || '',
        text: buildTransitionLabel(log)
      });
    });

    entries.sort(function (a, b) {
      const aTime = Date.parse(a.at || '');
      const bTime = Date.parse(b.at || '');
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return String(a.at || '').localeCompare(String(b.at || ''));
      }
      return aTime - bTime;
    });

    return entries;
  }

  async function loadImageAsDataUrl(url) {
    try {
      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      return await new Promise(function (resolve) {
        const reader = new FileReader();
        reader.onload = function () {
          resolve(typeof reader.result === 'string' ? reader.result : null);
        };
        reader.onerror = function () {
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return null;
    }
  }

  function addPdfFooter(doc, pageNumber, pageWidth, pageHeight, marginX, generatedAtLabel) {
    doc.setDrawColor(220, 226, 235);
    doc.line(marginX, pageHeight - 34, pageWidth - marginX, pageHeight - 34);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 103, 122);
    doc.text('Generated: ' + generatedAtLabel, marginX, pageHeight - 20);
    doc.text('Page ' + String(pageNumber), pageWidth - marginX, pageHeight - 20, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  async function generateReportPdf(item) {
    const jsPDFCtor = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : null;
    if (!jsPDFCtor) {
      window.alert('PDF generator is still loading. Please try again in a second.');
      return;
    }

    const doc = new jsPDFCtor({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 42;
    const contentWidth = pageWidth - marginX * 2;
    let y = 44;
    const generatedAtLabel = new Date().toLocaleString();

    const logoUrl = String(context.stationLogoUrl || '').trim();
    const logoDataUrl = logoUrl !== '' ? await loadImageAsDataUrl(logoUrl) : null;

    function addSectionTitle(title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      if (y > pageHeight - 60) {
        addPdfFooter(doc, doc.getNumberOfPages(), pageWidth, pageHeight, marginX, generatedAtLabel);
        doc.addPage();
        y = 44;
      }
      doc.text(String(title), marginX, y);
      y += 18;
    }

    function addTextLine(label, value) {
      const text = String(label) + ': ' + String(value || '-');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(text, contentWidth);
      lines.forEach(function (line) {
        if (y > pageHeight - 44) {
          addPdfFooter(doc, doc.getNumberOfPages(), pageWidth, pageHeight, marginX, generatedAtLabel);
          doc.addPage();
          y = 44;
        }
        doc.text(String(line), marginX, y);
        y += 15;
      });
    }

    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'JPEG', marginX, y - 8, 44, 44);
      } catch (error) {
        // Ignore logo draw failures and continue exporting.
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(String(context.stationName || 'Fire Station'), marginX + 54, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Official Incident Report Export', marginX + 54, y + 27);
    y += 58;

    doc.setDrawColor(215, 221, 231);
    doc.line(marginX, y - 8, pageWidth - marginX, y - 8);

    addSectionTitle('Overview');
    addTextLine('Report ID', item.id || '-');
    addTextLine('Type', normalizeType(item.type || ''));
    addTextLine('Title', item.title || '-');
    addTextLine('Submitted By', item.submittedBy || context.user || '-');
    addTextLine('Submitted At', formatDateTimeForTimeline(item.submittedAt || ''));
    addTextLine('Updated At', formatDateTimeForTimeline(item.updatedAt || ''));

    if ((item.type || '') === 'incident_report') {
      addSectionTitle('Incident Details');
      addTextLine('Incident Case ID', item.displayId || (item.incidentCaseId ? '#' + String(item.incidentCaseId) : '-'));
      addTextLine('Station Report ID', item.id ? String(item.id) : '-');
      addTextLine('Responding Station', item.stationName || context.stationName || '-');
      addTextLine('Last Updated By', item.updatedBy || item.submittedBy || '-');
      addTextLine('Caller Name', item.callerName || '-');
      addTextLine('Stage', normalizeStage(item.stage || '', item.type || ''));
      addTextLine('Alarm Level', item.alarmLevel ? String(item.alarmLevel) : '-');
      addTextLine('Incident Status', formatIncidentStatus(item.incidentStatus || ''));
      addTextLine('Location', item.location || '-');
      addTextLine('Incident Started', formatDateTimeForTimeline(item.incidentStartedAt || ''));
      addTextLine('Incident Finished', formatDateTimeForTimeline(item.incidentFinishedAt || ''));

      const stations = Array.isArray(item.assignedStations) ? item.assignedStations : [];
      const stationsText = stations.length > 0
        ? stations.map(function (station) { return station.name || '-'; }).join(', ')
        : (item.assignedStationName || '-');
      addTextLine('Responding Station(s)', stationsText);
      addTextLine('Remarks', item.remarks || '-');

      addSectionTitle('Incident Timeline');
      const timelineEntries = buildPdfTimelineEntries(item);
      if (timelineEntries.length === 0) {
        addTextLine('Timeline', 'No timeline entries recorded.');
      } else {
        timelineEntries.forEach(function (entry, index) {
          addTextLine('Entry ' + String(index + 1), formatDateTimeForTimeline(entry.at) + ' - ' + String(entry.text || ''));
        });
      }
    } else {
      const equipmentParsed = parseEquipmentRemarks(item.remarks || '');
      const equipmentDetails = {
        equipmentName: item.equipmentName || (equipmentParsed ? equipmentParsed.details.equipmentName : ''),
        equipmentCategory: item.equipmentCategory || (equipmentParsed ? equipmentParsed.details.equipmentCategory : ''),
        equipmentIssueType: item.equipmentIssueType || (equipmentParsed ? equipmentParsed.details.equipmentIssueType : ''),
        equipmentUrgency: item.equipmentUrgency || (equipmentParsed ? equipmentParsed.details.equipmentUrgency : ''),
        equipmentLastService: item.equipmentLastService || (equipmentParsed ? equipmentParsed.details.equipmentLastService : ''),
        equipmentOperationalStatus: item.equipmentOperationalStatus || (equipmentParsed ? equipmentParsed.details.equipmentOperationalStatus : ''),
        equipmentActionTaken: item.equipmentActionTaken || (equipmentParsed ? equipmentParsed.details.equipmentActionTaken : ''),
        equipmentRecommendation: item.equipmentRecommendation || (equipmentParsed ? equipmentParsed.details.equipmentRecommendation : '')
      };
      const equipmentSummary = item.remarks || (equipmentParsed ? equipmentParsed.summary : '');

      addSectionTitle('Equipment Details');
      addTextLine('Equipment Name', equipmentDetails.equipmentName || '-');
      addTextLine('Category', equipmentDetails.equipmentCategory ? getSelectLabel(equipmentCategory, equipmentDetails.equipmentCategory) : '-');
      addTextLine('Issue Type', equipmentDetails.equipmentIssueType ? getSelectLabel(equipmentIssueType, equipmentDetails.equipmentIssueType) : '-');
      addTextLine('Urgency', equipmentDetails.equipmentUrgency ? getSelectLabel(equipmentUrgency, equipmentDetails.equipmentUrgency) : '-');
      addTextLine('Last Service Date', equipmentDetails.equipmentLastService || '-');
      addTextLine('Operational Status', equipmentDetails.equipmentOperationalStatus ? getSelectLabel(equipmentOperationalStatus, equipmentDetails.equipmentOperationalStatus) : '-');
      addTextLine('Initial Action Taken', equipmentDetails.equipmentActionTaken || '-');
      addTextLine('Recommended Follow-up', equipmentDetails.equipmentRecommendation || '-');
      addTextLine('Issue Summary', equipmentSummary || '-');
    }

    y += 10;
    addSectionTitle('Certification');
    addTextLine('Prepared By', context.user || '-');
    addTextLine('Station', context.stationName || ('Station ' + String(context.stationId || '')));
    addTextLine('Generated At', generatedAtLabel);

    y += 8;
    if (y > pageHeight - 120) {
      addPdfFooter(doc, doc.getNumberOfPages(), pageWidth, pageHeight, marginX, generatedAtLabel);
      doc.addPage();
      y = 44;
    }

    doc.setDrawColor(185, 194, 207);
    doc.line(marginX, y + 44, marginX + 230, y + 44);
    doc.line(pageWidth - marginX - 230, y + 44, pageWidth - marginX, y + 44);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Prepared by', marginX, y + 58);
    doc.text('Reviewed by', pageWidth - marginX - 230, y + 58);

    for (let page = 1; page <= doc.getNumberOfPages(); page += 1) {
      doc.setPage(page);
      addPdfFooter(doc, page, pageWidth, pageHeight, marginX, generatedAtLabel);
    }

    const safeTitle = String(item.title || 'report').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'report';
    const fileName = 'firenet_report_' + String(item.id || 'item') + '_' + safeTitle + '.pdf';
    doc.save(fileName);
  }
  function renderTimelineGuideForCreate() {
    const isIncident = reportType.value === 'incident_report';
    incidentTimelineCard.hidden = false;

    if (!isIncident) {
      incidentTimelineList.innerHTML =
        '<li class="incident-timeline-item">' +
        '<strong>No incident timeline for this type</strong>' +
        '<span class="incident-timeline-meta">Timeline updates are only recorded for Incident Reports.</span>' +
        '</li>';
      return;
    }

    incidentTimelineList.innerHTML = [
      '<li class="incident-timeline-item">',
      '<strong>Timeline starts after first save</strong>',
      '<span class="incident-timeline-meta">Your initial call intake is recorded when you submit this report.</span>',
      '</li>',
      '<li class="incident-timeline-item">',
      '<strong>Each progress update gets a timestamp</strong>',
      '<span class="incident-timeline-meta">Alarm/status changes are logged with date and time for tracking.</span>',
      '</li>',
      '<li class="incident-timeline-item">',
      '<strong>Edit is only available before first progress update</strong>',
      '<span class="incident-timeline-meta">After progression starts, use Update Incident until it is completed.</span>',
      '</li>'
    ].join('');
  }

  function formatDateTimeForTimeline(value) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function buildTransitionLabel(log) {
    const parts = [];

    const fromAlarm = log.fromAlarmLevel;
    const toAlarm = log.toAlarmLevel;
    if ((fromAlarm || 0) !== (toAlarm || 0)) {
      parts.push('Alarm ' + escapeHtml(String(fromAlarm || '-')) + ' to ' + escapeHtml(String(toAlarm || '-')));
    }

    const fromStatus = String(log.fromIncidentStatus || '');
    const toStatus = String(log.toIncidentStatus || '');
    if (fromStatus !== toStatus) {
      parts.push('Status ' + escapeHtml(formatIncidentStatus(fromStatus || '-')) + ' to ' + escapeHtml(formatIncidentStatus(toStatus || '-')));
    }

    if (parts.length === 0) {
      return 'Incident progression update';
    }

    return parts.join(' | ');
  }

  function renderIncidentTimeline(item) {
    const updates = item && Array.isArray(item.incidentUpdates) ? item.incidentUpdates : [];
    const changeLogs = item && Array.isArray(item.incidentChangeLogs) ? item.incidentChangeLogs : [];

    if ((item && item.type) !== 'incident_report') {
      incidentTimelineCard.hidden = true;
      incidentTimelineList.innerHTML = '';
      return;
    }

    incidentTimelineCard.hidden = false;

    if (updates.length === 0 && changeLogs.length === 0) {
      incidentTimelineList.innerHTML = '<li class="incident-timeline-item"><strong>No timeline yet</strong><span class="incident-timeline-meta">Save or update the incident report to record alarm and status changes.</span></li>';
      return;
    }

    const timelineEntries = [];

    updates.forEach(function (update) {
      timelineEntries.push({
        at: update.recordedAt || '',
        title: 'Snapshot: Alarm ' + escapeHtml(String(update.alarmLevel || '-')) + ' | ' + escapeHtml(formatIncidentStatus(update.incidentStatus)),
        meta: 'Recorded at ' + escapeHtml(formatDateTimeForTimeline(update.recordedAt))
      });
    });

    changeLogs.forEach(function (log) {
      timelineEntries.push({
        at: log.changedAt || '',
        title: buildTransitionLabel(log),
        meta: 'Changed at ' + escapeHtml(formatDateTimeForTimeline(log.changedAt))
      });
    });

    timelineEntries.sort(function (a, b) {
      const aTime = Date.parse(a.at || '');
      const bTime = Date.parse(b.at || '');
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return String(a.at || '').localeCompare(String(b.at || ''));
      }
      return aTime - bTime;
    });

    incidentTimelineList.innerHTML = timelineEntries
      .map(function (entry) {
        return (
          '<li class="incident-timeline-item">' +
          '<strong>' + entry.title + '</strong>' +
          '<span class="incident-timeline-meta">' + entry.meta + '</span>' +
          '</li>'
        );
      })
      .join('');
  }

  function splitLocation(rawLocation) {
    const location = String(rawLocation || '');
    if (location === '') {
      return { street: '', landmark: '' };
    }

    const parts = location.split(',').map(function (part) {
      return part.trim();
    }).filter(function (part) {
      return part !== '';
    });

    if (parts.length === 0) {
      return { street: '', landmark: '' };
    }

    if (parts.length === 1) {
      return { street: parts[0], landmark: '' };
    }

    return {
      street: parts[0],
      landmark: parts.slice(1).join(', ')
    };
  }

  function isIncidentCompleted(item) {
    if (!item || item.type !== 'incident_report') {
      return false;
    }

    const stage = String(item.stage || '').toLowerCase();
    const status = String(item.incidentStatus || '').toLowerCase();
    const finishedAt = String(item.incidentFinishedAt || '').trim();
    return stage === 'after_incident' || status === 'fire_out' || finishedAt !== '';
  }

  function isIncidentActive(item) {
    return Boolean(item && item.type === 'incident_report' && !isIncidentCompleted(item));
  }

  function hasIncidentFirstProgressUpdate(item) {
    if (!item || item.type !== 'incident_report') {
      return false;
    }

    const updates = Array.isArray(item.incidentUpdates) ? item.incidentUpdates : [];
    const changeLogs = Array.isArray(item.incidentChangeLogs) ? item.incidentChangeLogs : [];
    return updates.length > 1 || changeLogs.length > 0;
  }

  function canEditReport(item) {
    if (!item) {
      return false;
    }

    if (typeof item.canEdit === 'boolean') {
      return item.canEdit;
    }

    if (item.type !== 'incident_report') {
      return true;
    }

    return !isIncidentCompleted(item) && !hasIncidentFirstProgressUpdate(item);
  }

  function canProgressIncidentReport(item) {
    if (!item || (item.type || '') !== 'incident_report') {
      return false;
    }

    if (typeof item.canProgress === 'boolean') {
      return item.canProgress;
    }

    return isIncidentActive(item) && canUpdateIncidentReports;
  }

  function canClaimIncidentReport(item) {
    return Boolean(item && item.type === 'incident_report' && item.canClaim);
  }

  function canReleaseIncidentReport(item) {
    return Boolean(item && item.type === 'incident_report' && item.canRelease);
  }

  function toLocalDateKey(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function shiftLocalDateKey(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + Number(days || 0));
    return toLocalDateKey(date);
  }

  function itemDateKey(item) {
    return toLocalDateKey(item.updatedAt || item.submittedAt || item.incidentFinishedAt || '');
  }

  function matchesDateFilter(item) {
    if (dateFilter === 'all') {
      return true;
    }
    const key = itemDateKey(item);
    if (!key) {
      return false;
    }
    if (dateFilter === 'today') {
      return key === shiftLocalDateKey(0);
    }
    if (dateFilter === 'yesterday') {
      return key === shiftLocalDateKey(-1);
    }
    if (dateFilter === 'specific') {
      return dateFilterValue !== '' && key === dateFilterValue;
    }
    return true;
  }

  function reportTicketCategory(item) {
    if (!item) {
      return 'queue';
    }
    if ((item.type || '') !== 'incident_report') {
      return 'queue';
    }
    if (isIncidentCompleted(item)) {
      return 'completed';
    }
    // Central intake handed to other responders — MCFS-only Dispatched tab.
    if (item.isAssignedResponder === false) {
      return isCentralStation ? 'dispatched' : 'queue';
    }
    if (item.isClaimedByMe || item.isClaimedByOther || Number(item.handlingUserId || 0) > 0) {
      return 'claimed';
    }
    return 'queue';
  }

  function ticketTabMeta() {
    return {
      queue: {
        title: 'Incident queue',
        hint: 'Unclaimed active incidents waiting for a ComL to pick up.'
      },
      claimed: {
        title: 'In progress',
        hint: 'Incidents claimed by a ComL and still being updated.'
      },
      alarm_requests: {
        title: 'Alarm raise requests',
        hint: 'Urgent requests from responding stations to raise the live fire alarm.'
      },
      dispatched: {
        title: 'Dispatched',
        hint: 'Intake filed here and passed to responding stations. Your station is not updating these.'
      },
      completed: {
        title: 'Completed',
        hint: 'Finished incidents for your station. Full archives also appear under Incident Logs.'
      }
    };
  }

  function updateAlarmRequestsBadge(count) {
    pendingAlarmRaiseCount = Math.max(0, Number(count || 0));
    if (!alarmRequestsBadge) {
      return;
    }
    if (!isCentralStation || pendingAlarmRaiseCount < 1) {
      alarmRequestsBadge.hidden = true;
      alarmRequestsBadge.textContent = '0';
      return;
    }
    alarmRequestsBadge.hidden = false;
    alarmRequestsBadge.textContent = String(pendingAlarmRaiseCount);
  }

  function syncTicketTabUi() {
    const dispatchedTab = document.getElementById('reportsDispatchedTab');
    if (dispatchedTab) {
      dispatchedTab.hidden = !isCentralStation;
    }
    if (reportsAlarmRequestsTab) {
      reportsAlarmRequestsTab.hidden = !isCentralStation;
    }
    if (!isCentralStation && (ticketTab === 'dispatched' || ticketTab === 'alarm_requests')) {
      ticketTab = 'queue';
    }
    if (reportsTicketTabs) {
      Array.from(reportsTicketTabs.querySelectorAll('[data-ticket-tab]')).forEach(function (button) {
        const value = String(button.getAttribute('data-ticket-tab') || '');
        if ((value === 'dispatched' || value === 'alarm_requests') && !isCentralStation) {
          return;
        }
        const isActive = value === ticketTab;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }
    const meta = ticketTabMeta()[ticketTab] || ticketTabMeta().queue;
    if (reportsHistoryTitle) {
      reportsHistoryTitle.textContent = meta.title;
    }
    if (reportsOngoingHint && !reportsOngoingHint.classList.contains('is-active')) {
      reportsOngoingHint.textContent = meta.hint;
    }
    updateAlarmRequestsBadge(pendingAlarmRaiseCount);
  }

  function syncDateFilterUi() {
    if (!reportsDateFilters) {
      return;
    }
    Array.from(reportsDateFilters.querySelectorAll('[data-date-filter]')).forEach(function (button) {
      const value = String(button.getAttribute('data-date-filter') || 'all');
      const isActive = dateFilter === value;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    if (reportsDateFilterInput) {
      reportsDateFilterInput.value = dateFilter === 'specific' ? (dateFilterValue || '') : '';
    }
  }

  function setDateFilter(mode, specificDate) {
    const nextMode = String(mode || 'all');
    if (nextMode === 'specific') {
      const value = String(specificDate || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return;
      }
      dateFilter = 'specific';
      dateFilterValue = value;
    } else if (nextMode === 'today' || nextMode === 'yesterday') {
      dateFilter = nextMode;
      dateFilterValue = '';
    } else {
      dateFilter = 'all';
      dateFilterValue = '';
    }
    syncDateFilterUi();
    renderVisibleReports();
  }

  function visibleReports() {
    if (ticketTab === 'alarm_requests') {
      return [];
    }
    return (Array.isArray(allReportsCache) ? allReportsCache : []).filter(function (item) {
      if (reportTicketCategory(item) !== ticketTab) {
        return false;
      }
      return matchesDateFilter(item);
    });
  }

  function emptyTicketMessage() {
    const dateNote = dateFilter === 'today'
      ? ' for today'
      : (dateFilter === 'yesterday'
        ? ' for yesterday'
        : (dateFilter === 'specific' && dateFilterValue ? (' for ' + dateFilterValue) : ''));
    if (ticketTab === 'claimed') {
      return 'No incidents are in progress' + dateNote + '.';
    }
    if (ticketTab === 'alarm_requests') {
      return 'No pending fire alarm raise requests' + dateNote + '.';
    }
    if (ticketTab === 'dispatched') {
      return 'No dispatched intake reports' + dateNote + '.';
    }
    if (ticketTab === 'completed') {
      return 'No completed incidents' + dateNote + '.';
    }
    return dateNote
      ? ('No unclaimed incidents' + dateNote + '.')
      : 'The queue is empty — no unclaimed incidents.';
  }

  let pendingReleaseReportId = 0;

  function openReleaseConfirmModal(item) {
    if (!releaseConfirmModal || !item) {
      return;
    }
    pendingReleaseReportId = Number(item.id || 0);
    if (releaseConfirmSummary) {
      releaseConfirmSummary.innerHTML =
        '<strong>' + escapeHtml(formatReportTitle(item)) + '</strong>' +
        '<span>' + escapeHtml(item.stationName || 'Your station') + ' report</span>';
    }
    if (releaseConfirmLead) {
      releaseConfirmLead.textContent = 'This returns the ticket to the queue so another ComL can claim and update it.';
      releaseConfirmLead.style.color = '';
    }
    if (confirmReleaseBtn) {
      confirmReleaseBtn.disabled = false;
      confirmReleaseBtn.textContent = 'Release to queue';
    }
    releaseConfirmModal.hidden = false;
    syncReportModalScrollLock();
    if (confirmReleaseBtn) {
      confirmReleaseBtn.focus();
    }
  }

  function closeReleaseConfirmModalDialog() {
    if (!releaseConfirmModal) {
      return;
    }
    releaseConfirmModal.hidden = true;
    pendingReleaseReportId = 0;
    if (confirmReleaseBtn) {
      confirmReleaseBtn.disabled = false;
      confirmReleaseBtn.textContent = 'Release to queue';
    }
    syncReportModalScrollLock();
  }

  async function confirmReleaseIncident() {
    const reportIdToRelease = pendingReleaseReportId;
    if (reportIdToRelease < 1) {
      closeReleaseConfirmModalDialog();
      return;
    }
    if (confirmReleaseBtn) {
      confirmReleaseBtn.disabled = true;
      confirmReleaseBtn.textContent = 'Releasing…';
    }
    try {
      await claimOrReleaseIncident(reportIdToRelease, 'release');
      closeReleaseConfirmModalDialog();
    } catch (error) {
      if (confirmReleaseBtn) {
        confirmReleaseBtn.disabled = false;
        confirmReleaseBtn.textContent = 'Release to queue';
      }
      if (releaseConfirmLead) {
        releaseConfirmLead.textContent = error.message || 'Unable to release this incident.';
        releaseConfirmLead.style.color = '#fecaca';
      }
    }
  }

  async function claimOrReleaseIncident(reportId, mode) {
    const action = mode === 'release' ? 'release' : 'claim';
    const response = await fetch(
      reportsApiUrl + '?action=' + encodeURIComponent(action) + '&reportId=' + encodeURIComponent(String(reportId)),
      { method: 'GET', credentials: 'same-origin' }
    );
    const payload = await response.json().catch(function () { return null; });
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || ('Unable to ' + action + ' this incident.'));
    }
    await loadMyReports();
    if (action === 'claim') {
      switchTicketTab('claimed');
    } else if (action === 'release') {
      switchTicketTab('queue');
    }
    return payload;
  }

  function formatReportTitle(item) {
    const title = item.title || '-';
    if ((item.type || '') === 'incident_report' && item.displayId) {
      return String(item.displayId) + ' · ' + title;
    }
    return title;
  }

  function normalizeTypeBadge(type) {
    const value = String(type || '').toLowerCase();
    if (value === 'incident_report') {
      return { className: 'reports-type-badge reports-type-badge--incident', label: 'Incident' };
    }
    if (value === 'equipment_report') {
      return { className: 'reports-type-badge reports-type-badge--equipment', label: 'Equipment' };
    }
    return { className: 'reports-type-badge', label: normalizeType(type) };
  }

  function renderAlarmRaiseRequestRows(requests) {
    if (!Array.isArray(requests) || requests.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="reports-empty-cell">' + escapeHtml(emptyTicketMessage()) + '</td></tr>';
      return;
    }

    tableBody.innerHTML = requests.map(function (item) {
      const requestId = String(item.requestId || '');
      const createdAt = item.createdAt ? new Date(item.createdAt).toLocaleString() : '-';
      const title = item.title || ('Case #' + String(item.incidentCaseId || ''));
      const fromLevel = Number(item.fromAlarmLevel || item.caseAlarmLevel || 1);
      const toLevel = Number(item.requestedAlarmLevel || fromLevel + 1);
      const actions =
        '<button type="button" class="table-action-btn progress" data-action="approve-alarm-raise" data-id="' + escapeHtml(requestId) + '">Raise to ' + escapeHtml(String(toLevel)) + '</button>' +
        '<button type="button" class="table-action-btn release" data-action="deny-alarm-raise" data-id="' + escapeHtml(requestId) + '">Deny</button>';

      return (
        '<tr>' +
          '<td><span class="reports-type-badge reports-type-badge--incident">Urgent</span></td>' +
          '<td>' +
            '<div class="reports-alarm-request-card">' +
              '<strong>' + escapeHtml(title) + '</strong>' +
              '<span class="reports-alarm-request-meta">' +
                escapeHtml(item.fromStationName || 'Station') + ' · ' +
                escapeHtml(item.requestedByUsername || 'ComL') +
                (item.location ? (' · ' + escapeHtml(item.location)) : '') +
              '</span>' +
              '<span class="reports-alarm-urgent">Request Alarm ' + escapeHtml(String(fromLevel)) + ' → ' + escapeHtml(String(toLevel)) +
              ' · Live now: ' + escapeHtml(String(item.caseAlarmLevel || fromLevel)) + '</span>' +
            '</div>' +
          '</td>' +
          '<td>' + escapeHtml(createdAt) + '</td>' +
          '<td>' + actions + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderVisibleReports() {
    rebuildReportsById();
    syncTicketTabUi();
    syncDateFilterUi();
    if (ticketTab === 'alarm_requests') {
      renderAlarmRaiseRequestRows(alarmRaiseRequestsCache);
      if (reportsOngoingHint) {
        if (pendingAlarmRaiseCount > 0) {
          reportsOngoingHint.textContent = pendingAlarmRaiseCount + ' urgent fire alarm raise request' +
            (pendingAlarmRaiseCount === 1 ? '' : 's') + ' waiting for MCFS.';
          reportsOngoingHint.classList.add('is-active');
        } else {
          reportsOngoingHint.textContent = ticketTabMeta().alarm_requests.hint;
          reportsOngoingHint.classList.remove('is-active');
        }
      }
      return;
    }
    renderRows(visibleReports());
    updateOngoingIncidentHint(allReportsCache);
  }

  function renderRows(reports) {
    if (!Array.isArray(reports) || reports.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="reports-empty-cell">' + escapeHtml(emptyTicketMessage()) + '</td></tr>';
      return;
    }

    tableBody.innerHTML = reports
      .map(function (item) {
        const submittedAt = item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '-';
        const updatedAt = item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '';
        const timestampLabel = updatedAt !== '' ? (submittedAt + ' | Updated: ' + updatedAt) : submittedAt;
        const itemId = String(item.id || '');
        let actionsHtml = '';

        if (canEditReport(item)) {
          actionsHtml +=
            '<button type="button" class="table-action-btn" data-action="edit" data-id="' + escapeHtml(itemId) + '">Edit</button>';
        }

        if ((item.type || '') === 'incident_report') {
          const isCompleted = isIncidentCompleted(item);
          const canProgress = canProgressIncidentReport(item);
          const canClaim = canClaimIncidentReport(item);
          const canRelease = canReleaseIncidentReport(item);
          const handlerName = String(item.handlingUsername || '').trim();

          if (canClaim) {
            actionsHtml +=
              '<button type="button" class="table-action-btn claim" data-action="claim" data-id="' + escapeHtml(itemId) + '">Claim</button>' +
              '<span class="incident-ongoing-note is-unclaimed" title="Unclaimed — claim this ticket before updating">' +
              '<span class="incident-ongoing-dot" aria-hidden="true"></span>' +
              'Unclaimed' +
              '</span>';
          } else if (canProgress) {
            actionsHtml +=
              '<button type="button" class="table-action-btn progress" data-action="progress" data-id="' + escapeHtml(itemId) + '">Update Incident</button>';
            if (canRelease) {
              actionsHtml +=
                '<button type="button" class="table-action-btn release" data-action="release" data-id="' + escapeHtml(itemId) + '">Release</button>';
            }
            actionsHtml +=
              '<span class="incident-ongoing-note is-claimed-mine" title="You claimed this incident and can update it">' +
              '<span class="incident-ongoing-dot" aria-hidden="true"></span>' +
              'Claimed by you' +
              '</span>';
          } else if (item.isClaimedByOther) {
            actionsHtml +=
              '<span class="incident-ongoing-note is-claimed-other" title="Another ComL is already processing this incident">' +
              '<span class="incident-ongoing-dot" aria-hidden="true"></span>' +
              'Claimed by ' + escapeHtml(handlerName || 'another ComL') +
              '</span>';
          } else if (isIncidentActive(item)) {
            const dispatchedActionLabel = formatDispatchedActionLabel(item);
            actionsHtml +=
              '<span class="incident-ongoing-note' +
              (item.isAssignedResponder === false ? ' is-dispatched' : '') +
              '" title="' +
              escapeHtml(
                item.isAssignedResponder === false
                  ? dispatchedActionLabel
                  : 'This incident is active at your station'
              ) +
              '">' +
              '<span class="incident-ongoing-dot" aria-hidden="true"></span>' +
              (item.isAssignedResponder === false
                ? escapeHtml(dispatchedActionLabel)
                : 'Awaiting Update') +
              '</span>';
          } else {
            actionsHtml +=
              '<span class="incident-completed-note" title="This incident is completed and locked from progression updates">' +
              '<span class="incident-completed-dot" aria-hidden="true"></span>' +
              'Completed' +
              '</span>';
          }

          if (!canEditReport(item) && !isCompleted && !item.isClaimedByOther) {
            actionsHtml +=
              '<span class="incident-completed-note" title="Edit is only available before the first incident progress update">' +
              '<span class="incident-completed-dot" aria-hidden="true"></span>' +
              'Edit Locked' +
              '</span>';
          }
        }

        actionsHtml +=
          '<button type="button" class="table-action-btn download" data-action="download" data-id="' + escapeHtml(itemId) + '"><span aria-hidden="true">\u2B07</span> Download PDF</button>';

        const typeBadge = normalizeTypeBadge(item.type || '');
        const dispatchedLabel = formatDispatchedStationsLabel(item);
        const titleHtml =
          '<div class="reports-row-title">' + escapeHtml(formatReportTitle(item)) + '</div>' +
          ((item.type || '') === 'incident_report' && item.stationName
            ? '<div class="reports-row-sub">' + escapeHtml(item.stationName) + ' report' +
              (item.handlingUsername
                ? (item.isClaimedByMe
                  ? ' · <span class="reports-claimed-you-label">Claimed by you</span>'
                  : ' · Claimed by ' + escapeHtml(item.handlingUsername))
                : (item.isAssignedResponder === false
                  ? ' · <span class="reports-dispatched-label" title="' + escapeHtml(dispatchedLabel) + '">' + escapeHtml(dispatchedLabel) + '</span>'
                  : (item.updatedBy ? ' · Updated by ' + escapeHtml(item.updatedBy) : ''))) +
              '</div>'
            : '');

        return (
          '<tr>' +
          '<td><span class="' + escapeHtml(typeBadge.className) + '">' + escapeHtml(typeBadge.label) + '</span></td>' +
          '<td>' + titleHtml + '</td>' +
          '<td><span class="reports-time">' + escapeHtml(timestampLabel) + '</span></td>' +
          '<td><div class="table-action-group">' +
          actionsHtml +
          '</div></td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function rebuildReportsById() {
    reportsById.clear();
    (Array.isArray(allReportsCache) ? allReportsCache : []).forEach(function (item) {
      if (item && item.id != null) {
        reportsById.set(String(item.id), item);
      }
    });
  }

  function updateOngoingIncidentHint(reports) {
    if (!reportsOngoingHint) {
      return;
    }
    if (ticketTab === 'alarm_requests') {
      return;
    }

    const meta = ticketTabMeta()[ticketTab] || ticketTabMeta().queue;
    const source = Array.isArray(reports) ? reports : [];
    const queueCount = source.filter(function (item) { return reportTicketCategory(item) === 'queue' && (item.type || '') === 'incident_report'; }).length;
    const claimedCount = source.filter(function (item) { return reportTicketCategory(item) === 'claimed'; }).length;
    const dispatchedCount = source.filter(function (item) { return reportTicketCategory(item) === 'dispatched'; }).length;
    const myClaimedCount = source.filter(function (item) { return item && item.isClaimedByMe; }).length;

    if (ticketTab === 'queue') {
      if (queueCount === 0) {
        reportsOngoingHint.textContent = meta.hint;
        reportsOngoingHint.classList.remove('is-active');
        return;
      }
      reportsOngoingHint.textContent = queueCount + ' unclaimed incident' + (queueCount === 1 ? '' : 's') + ' waiting for a ComL claim.';
      reportsOngoingHint.classList.add('is-active');
      return;
    }

    if (ticketTab === 'claimed') {
      if (claimedCount === 0) {
        reportsOngoingHint.textContent = meta.hint;
        reportsOngoingHint.classList.remove('is-active');
        return;
      }
      reportsOngoingHint.innerHTML = claimedCount + ' in progress' +
        (myClaimedCount > 0
          ? (' · <span class="reports-claimed-you-count">' + myClaimedCount + ' claimed by you</span>')
          : '') + '.';
      reportsOngoingHint.classList.add('is-active');
      return;
    }

    if (ticketTab === 'dispatched') {
      if (dispatchedCount === 0) {
        reportsOngoingHint.textContent = meta.hint;
        reportsOngoingHint.classList.remove('is-active');
        return;
      }
      reportsOngoingHint.textContent = dispatchedCount + ' intake report' + (dispatchedCount === 1 ? '' : 's') +
        ' handed off to responding stations.';
      reportsOngoingHint.classList.add('is-active');
      return;
    }

    reportsOngoingHint.textContent = meta.hint;
    reportsOngoingHint.classList.remove('is-active');
  }

  async function loadMyReports() {
    tableBody.innerHTML = '<tr><td colspan="4" class="reports-empty-cell">Loading your reports…</td></tr>';
    try {
      const activeUrl = new URL(reportsApiUrl, window.location.origin);
      const completedUrl = new URL(reportsApiUrl, window.location.origin);
      completedUrl.searchParams.set('includeCompleted', '1');

      const [activeResponse, completedResponse] = await Promise.all([
        fetch(activeUrl.toString(), { method: 'GET', credentials: 'same-origin' }),
        fetch(completedUrl.toString(), { method: 'GET', credentials: 'same-origin' })
      ]);
      const activePayload = await activeResponse.json();
      const completedPayload = await completedResponse.json();

      if (!activeResponse.ok || !activePayload || activePayload.ok !== true) {
        tableBody.innerHTML = '<tr><td colspan="4" class="reports-empty-cell">Unable to load your reports right now.</td></tr>';
        return [];
      }

      const activeReports = Array.isArray(activePayload.reports) ? activePayload.reports : [];
      const completedReports = (completedResponse.ok && completedPayload && completedPayload.ok === true && Array.isArray(completedPayload.reports))
        ? completedPayload.reports.filter(function (item) {
            return (item.type || '') === 'incident_report' && isIncidentCompleted(item);
          })
        : [];

      const byId = new Map();
      activeReports.concat(completedReports).forEach(function (item) {
        if (item && item.id != null) {
          byId.set(String(item.id), item);
        }
      });
      allReportsCache = Array.from(byId.values());
      if (typeof activePayload.pendingAlarmRaiseCount === 'number') {
        updateAlarmRequestsBadge(activePayload.pendingAlarmRaiseCount);
      }
      if (isCentralStation) {
        await loadAlarmRaiseRequests(false);
      }
      renderVisibleReports();
      return allReportsCache;
    } catch (error) {
      tableBody.innerHTML = '<tr><td colspan="4" class="reports-empty-cell">Unable to load your reports right now.</td></tr>';
      updateOngoingIncidentHint([]);
      return [];
    }
  }

  async function loadAlarmRaiseRequests(shouldRender) {
    if (!isCentralStation) {
      alarmRaiseRequestsCache = [];
      updateAlarmRequestsBadge(0);
      return [];
    }
    try {
      const response = await fetch(reportsApiUrl + '?action=alarm_raise_requests&status=pending', {
        method: 'GET',
        credentials: 'same-origin'
      });
      const payload = await response.json().catch(function () { return null; });
      if (!response.ok || !payload || payload.ok !== true) {
        alarmRaiseRequestsCache = [];
        return [];
      }
      alarmRaiseRequestsCache = Array.isArray(payload.requests) ? payload.requests : [];
      updateAlarmRequestsBadge(payload.pendingCount != null ? payload.pendingCount : alarmRaiseRequestsCache.length);
      if (shouldRender !== false && ticketTab === 'alarm_requests') {
        renderVisibleReports();
      }
      return alarmRaiseRequestsCache;
    } catch (error) {
      alarmRaiseRequestsCache = [];
      return [];
    }
  }

  function switchTicketTab(tab) {
    const next = String(tab || 'queue');
    const allowed = isCentralStation
      ? ['queue', 'claimed', 'alarm_requests', 'dispatched', 'completed']
      : ['queue', 'claimed', 'completed'];
    if (allowed.indexOf(next) === -1) {
      return;
    }
    ticketTab = next;
    if (next === 'alarm_requests') {
      loadAlarmRaiseRequests(true);
      return;
    }
    renderVisibleReports();
  }

  function openProgressFromQuery() {
    if (!canUpdateIncidentReports) {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    const mode = String(params.get('mode') || '').toLowerCase();
    const id = String(params.get('id') || '');
    if (mode !== 'progress' || id === '') {
      return false;
    }

    const item = reportsById.get(String(id));
    if (!item || !canProgressIncidentReport(item)) {
      return false;
    }

    populateFormForEdit(item);
    openModal('progress');
    return true;
  }

  reportType.addEventListener('change', toggleIncidentStage);
  reportType.addEventListener('change', syncReportTypeDefaults);
  incidentStage.addEventListener('change', toggleIncidentStage);
  reportStepTabDetails.addEventListener('click', function () {
    setReportStep('details');
  });
  reportStepTabTimeline.addEventListener('click', function () {
    if (canProceedToTimelineStep()) {
      setReportStep('timeline');
    }
  });
  reportStepPrev.addEventListener('click', function () {
    setReportStep('details');
  });
  alarmLevel.addEventListener('change', function () {
    renderAlarmPriorityBadge();
    if (reportType.value !== 'incident_report') {
      return;
    }

    if (!hasAddressDetails()) {
      setAssignmentPreview('Type address details first, then click Locate Address to determine responders.');
      setResponderStationText('', '', null);
      return;
    }

    const latitude = parseCoordinate(incidentLatitudeInput.value);
    const longitude = parseCoordinate(incidentLongitudeInput.value);
    if (latitude == null || longitude == null) {
      setAssignmentPreview('Address entered. Click Locate Address to determine responsible stations.');
      return;
    }

    lookupByCoordinates(latitude, longitude);
  });
  barangay.addEventListener('input', queueAddressLocate);
  streetName.addEventListener('input', function () {
    queueAddressLocate();
  });
  landmarkInput.addEventListener('input', queueAddressLocate);
  altAddressInput.addEventListener('input', queueAddressLocate);
  locateIncidentBtn.addEventListener('click', function () {
    if (locateDebounceTimer) {
      clearTimeout(locateDebounceTimer);
      locateDebounceTimer = null;
    }
    if (hasAddressDetails()) {
      clearIncidentLocationForRelocate();
    }
    locateAddressFromForm();
  });
  manualPinToggle.addEventListener('click', function () {
    const nextMode = !manualPinMode;
    setManualPinMode(nextMode);
    if (nextMode) {
      setMapStatus('Manual pin mode is ON. Click anywhere on the map to place incident pin.');
    } else {
      setMapStatus('Manual pin mode is OFF. Use Locate Address or re-enable manual pin mode.');
    }
  });
  if (requestAlarmRaiseBtn) {
    requestAlarmRaiseBtn.addEventListener('click', async function () {
      const id = Number(reportId.value || 0);
      const item = reportsById.get(String(id));
      const liveAlarm = Math.max(
        1,
        Number((item && (item.caseAlarmLevel || item.alarmLevel)) || alarmLevel.value || 1)
      );
      const level = Math.min(
        5,
        Number(requestAlarmRaiseBtn.getAttribute('data-next-level') || (liveAlarm + 1))
      );
      if (id < 1 || level <= liveAlarm || level > 5) {
        return;
      }
      requestAlarmRaiseBtn.disabled = true;
      if (alarmRaiseRequestStatus) {
        alarmRaiseRequestStatus.hidden = false;
        alarmRaiseRequestStatus.textContent = 'Sending urgent request to MCFS…';
      }
      try {
        const response = await fetch(reportsApiUrl, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'request_alarm_raise',
            reportId: id,
            requestedAlarmLevel: level
          })
        });
        const result = await response.json().catch(function () { return null; });
        if (!response.ok || !result || result.ok !== true) {
          throw new Error((result && result.message) || 'Unable to send alarm raise request.');
        }
        if (alarmRaiseRequestStatus) {
          alarmRaiseRequestStatus.textContent = result.message || ('Raise to Alarm ' + level + ' requested.');
        }
        requestAlarmRaiseBtn.textContent = 'Request sent';
      } catch (error) {
        if (alarmRaiseRequestStatus) {
          alarmRaiseRequestStatus.textContent = error.message || 'Unable to send alarm raise request.';
        }
        requestAlarmRaiseBtn.disabled = false;
      }
    });
  }

  async function reviewAlarmRaiseRequest(requestId, decision) {
    const response = await fetch(reportsApiUrl, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'review_alarm_raise_request',
        requestId: Number(requestId),
        decision: decision
      })
    });
    const result = await response.json().catch(function () { return null; });
    if (!response.ok || !result || result.ok !== true) {
      throw new Error((result && result.message) || 'Unable to review this request.');
    }
    await loadAlarmRaiseRequests(false);
    await loadMyReports();
    switchTicketTab('alarm_requests');
    return result;
  }

  let pendingAlarmRaiseReview = null;

  function findAlarmRaiseRequest(requestId) {
    const id = String(requestId || '');
    return (Array.isArray(alarmRaiseRequestsCache) ? alarmRaiseRequestsCache : []).find(function (item) {
      return String(item.requestId || '') === id;
    }) || null;
  }

  function closeAlarmRaiseConfirmModalDialog() {
    if (!alarmRaiseConfirmModal) {
      return;
    }
    alarmRaiseConfirmModal.hidden = true;
    pendingAlarmRaiseReview = null;
    if (confirmAlarmRaiseBtn) {
      confirmAlarmRaiseBtn.disabled = false;
      confirmAlarmRaiseBtn.textContent = 'Raise alarm';
    }
    if (alarmRaiseConfirmLead) {
      alarmRaiseConfirmLead.style.color = '';
    }
    syncReportModalScrollLock();
  }

  function openAlarmRaiseConfirmModal(requestId, decision) {
    if (!alarmRaiseConfirmModal || !isCentralStation) {
      return;
    }
    const item = findAlarmRaiseRequest(requestId);
    if (!item) {
      return;
    }

    const fromLevel = Number(item.fromAlarmLevel || item.caseAlarmLevel || 1);
    const toLevel = Number(item.requestedAlarmLevel || fromLevel + 1);
    const isApprove = decision === 'approve';
    pendingAlarmRaiseReview = {
      requestId: Number(item.requestId || 0),
      decision: isApprove ? 'approve' : 'deny',
      toLevel: toLevel
    };

    if (alarmRaiseConfirmKicker) {
      alarmRaiseConfirmKicker.textContent = isApprove ? 'Urgent · Raise live alarm' : 'Alarm request · Deny';
    }
    if (alarmRaiseConfirmTitle) {
      alarmRaiseConfirmTitle.textContent = isApprove
        ? ('Raise live fire alarm to Level ' + toLevel + '?')
        : 'Deny this alarm raise request?';
    }
    if (alarmRaiseConfirmLead) {
      alarmRaiseConfirmLead.style.color = '';
      alarmRaiseConfirmLead.textContent = isApprove
        ? 'This applies to every responding station copy and may dispatch additional stations automatically.'
        : 'The requesting station will keep the current live alarm level. They can submit a new request later if needed.';
    }
    if (alarmRaiseConfirmSummary) {
      alarmRaiseConfirmSummary.innerHTML =
        '<strong>' + escapeHtml(item.title || ('Case #' + String(item.incidentCaseId || ''))) + '</strong>' +
        '<span>' + escapeHtml(item.fromStationName || 'Responding station') +
        (item.requestedByUsername ? (' · ' + escapeHtml(item.requestedByUsername)) : '') +
        '</span>' +
        '<span class="report-confirm-alarm-chip">' +
          'Alarm ' + escapeHtml(String(fromLevel)) + ' → ' + escapeHtml(String(toLevel)) +
          ' · Live now: ' + escapeHtml(String(item.caseAlarmLevel || fromLevel)) +
        '</span>' +
        (item.location
          ? ('<span>' + escapeHtml(item.location) + '</span>')
          : '');
    }
    if (alarmRaiseConfirmNote) {
      alarmRaiseConfirmNote.textContent = isApprove
        ? 'Once raised, the live alarm cannot be lowered from this queue. Confirm only if the field situation requires it.'
        : 'Denying does not change the live alarm. The request will leave the urgent queue.';
    }
    if (confirmAlarmRaiseBtn) {
      confirmAlarmRaiseBtn.disabled = false;
      confirmAlarmRaiseBtn.textContent = isApprove
        ? ('Raise to Level ' + toLevel)
        : 'Deny request';
      confirmAlarmRaiseBtn.classList.toggle('rm-btn--danger-outline', !isApprove);
    }

    alarmRaiseConfirmModal.hidden = false;
    syncReportModalScrollLock();
    if (confirmAlarmRaiseBtn) {
      confirmAlarmRaiseBtn.focus();
    }
  }

  async function confirmAlarmRaiseReview() {
    if (!pendingAlarmRaiseReview || pendingAlarmRaiseReview.requestId < 1) {
      closeAlarmRaiseConfirmModalDialog();
      return;
    }
    const decision = pendingAlarmRaiseReview.decision;
    const requestId = pendingAlarmRaiseReview.requestId;
    if (confirmAlarmRaiseBtn) {
      confirmAlarmRaiseBtn.disabled = true;
      confirmAlarmRaiseBtn.textContent = decision === 'approve' ? 'Raising…' : 'Denying…';
    }
    try {
      const result = await reviewAlarmRaiseRequest(requestId, decision);
      closeAlarmRaiseConfirmModalDialog();
      if (reportsOngoingHint) {
        reportsOngoingHint.textContent = result.message || (decision === 'approve'
          ? 'Live fire alarm raised for all responding stations.'
          : 'Alarm raise request denied.');
        reportsOngoingHint.classList.add('is-active');
      }
    } catch (error) {
      if (confirmAlarmRaiseBtn) {
        confirmAlarmRaiseBtn.disabled = false;
        confirmAlarmRaiseBtn.textContent = decision === 'approve'
          ? ('Raise to Level ' + String(pendingAlarmRaiseReview.toLevel || ''))
          : 'Deny request';
      }
      if (alarmRaiseConfirmLead) {
        alarmRaiseConfirmLead.textContent = error.message || 'Unable to review this request.';
        alarmRaiseConfirmLead.style.color = '#fecaca';
      }
    }
  }

  incidentStatus.addEventListener('change', handleIncidentStatusAutoFinish);
  if (fireOutToggleBtn) {
    fireOutToggleBtn.addEventListener('click', function () {
      if (fireOutCheckbox.checked || fireOutCheckbox.disabled) {
        return;
      }
      openFireOutConfirmModal();
    });
  }
  incidentFinishedAtInput.addEventListener('input', function () {
    incidentFinishedAtInput.value = '';
    resetIncidentFinishedAutoTracking();
  });
  toggleIncidentStage();
  renderAlarmPriorityBadge();
  setReportStep('details');

  function openTypeChooserModal() {
    const allowedTypes = getAllowedCreateTypes();
    if (allowedTypes.length === 1) {
      openCreateModalForType(allowedTypes[0]);
      return;
    }

    chooseIncidentReport.hidden = !canCreateIncidentReports;
    chooseEquipmentReport.hidden = !canCreateEquipmentReports;
    reportTypeModal.hidden = false;
    resetReportModalScroll(reportTypeModal);
    syncReportModalScrollLock();
  }

  function closeTypeChooserModal() {
    reportTypeModal.hidden = true;
    syncReportModalScrollLock();
  }

  function openCreateModalForType(type) {
    const nextType = type === 'equipment_report' ? 'equipment_report' : 'incident_report';
    resetFormForCreate();
    reportType.value = nextType;
    syncReportTypeDefaults();
    openModal('create');
  }

  function openModal(mode) {
    formMessage.textContent = '';
    closeTypeChooserModal();
    reportModal.hidden = false;
    resetReportModalScroll(reportModal);
    syncReportModalScrollLock();
    if (mode === 'progress') {
      reportModalTitle.textContent = 'Update Incident Progress';
      reportSubmitBtn.textContent = 'Save Progress Update';
      updateMode = 'progression';
    } else if (mode === 'edit') {
      reportModalTitle.textContent = 'Edit Submission Details';
      reportSubmitBtn.textContent = 'Save Edit';
      updateMode = 'correction';
    } else {
      if (reportType.value === 'equipment_report') {
        reportModalTitle.textContent = 'Equipment Report';
        reportSubmitBtn.textContent = 'Submit Equipment Report';
      } else {
        reportModalTitle.textContent = 'Incident Report';
        reportSubmitBtn.textContent = 'Submit Incident Report';
      }
      updateMode = 'correction';
    }

    setProgressModeFields(updateMode === 'progression');
    enforceCreateIncidentIntakeStage();
    renderAlarmPriorityBadge();

    if (mode !== 'edit' && mode !== 'progress') {
      renderTimelineGuideForCreate();
    }

    reportTypeField.hidden = true;
    reportType.disabled = true;

    setReportStep('details');
  }
  reportType.addEventListener('change', function () {
    if (!reportId.value) {
      renderTimelineGuideForCreate();
    }
  });

  function closeModal() {
    reportModal.hidden = true;
    resetIncidentFinishedAutoTracking();
    syncReportModalScrollLock();
  }

  // Force hidden state on page load to avoid any browser restore quirks.
  closeModal();

  function resetFormForCreate() {
    reportId.value = '';
    updateMode = 'correction';
    resetIncidentFinishedAutoTracking();
    
        form.reset();
    
    barangay.value = '';
    alarmLevel.value = '1';
    incidentStatus.value = 'ongoing';
    fireOutCheckbox.checked = false;
    streetName.value = '';
    equipmentName.value = '';
    equipmentCategory.value = 'vehicle';
    equipmentIssueType.value = 'mechanical';
    equipmentUrgency.value = 'medium';
    equipmentLastService.value = '';
    equipmentOperationalStatus.value = 'limited';
    equipmentActionTaken.value = '';
    equipmentRecommendation.value = '';
    
        // Set incident started at LAST after all form resets to ensure value persists and field stays readonly
    if (incidentStartedAtInput) {
      const now = formatDateTimeLocal(new Date());
      incidentStartedAtInput.value = now;
      incidentStartedAtInput.readOnly = true;
    }

    setCoordinateFields(null, null);
    setManualPinMode(false);
    setMapStatus('Type address details to place the incident pin.');
    setAssignmentPreview('Responsible station will appear after location lookup.');
    setResponderStationText('', '', null);
    if (incidentMarker && mapInstance) {
      clearIncidentOverlays();
    }
    
    syncReportTypeDefaults();
    setProgressModeFields(false);
    enforceCreateIncidentIntakeStage();
    setReportStep('details');
  }

  function openQuickIntake() {
    resetFormForCreate();
    reportType.value = 'incident_report';
    incidentStage.value = 'call_intake';
    alarmLevel.value = '1';
    incidentStatus.value = '';
    fireOutCheckbox.checked = false;
    incidentFinishedAtInput.value = '';
    syncReportTypeDefaults();
    openModal('create');
  }

  function populateFormForEdit(item) {
    resetIncidentFinishedAutoTracking();
    const isIncident = (item.type || '') === 'incident_report';

    reportId.value = item.id || '';
    reportType.value = item.type || 'incident_report';
    incidentStage.value = item.stage || 'call_intake';
    alarmLevel.value = String(item.alarmLevel || '1');
    applyIncidentStatusToForm(item.incidentStatus || '');
    reportTitle.value = item.title || '';
    callerNameInput.value = item.callerName || '';
    barangay.value = item.barangay || '';
    const locationParts = splitLocation(item.location || '');
    streetName.value = item.streetName || locationParts.street || '';
    landmarkInput.value = item.landmark || locationParts.landmark || '';
    incidentStartedAtInput.value = item.incidentStartedAt || '';
    incidentFinishedAtInput.value = '';
    reportRemarks.value = item.remarks || '';

    equipmentName.value = '';
    equipmentCategory.value = 'vehicle';
    equipmentIssueType.value = 'mechanical';
    equipmentUrgency.value = 'medium';
    equipmentLastService.value = '';
    equipmentOperationalStatus.value = 'limited';
    equipmentActionTaken.value = '';
    equipmentRecommendation.value = '';

    if (!isIncident) {
      equipmentName.value = String(item.equipmentName || '');
      if (item.equipmentCategory) {
        equipmentCategory.value = String(item.equipmentCategory);
      }
      if (item.equipmentIssueType) {
        equipmentIssueType.value = String(item.equipmentIssueType);
      }
      if (item.equipmentUrgency) {
        equipmentUrgency.value = String(item.equipmentUrgency);
      }
      equipmentLastService.value = String(item.equipmentLastService || '');
      if (item.equipmentOperationalStatus) {
        equipmentOperationalStatus.value = String(item.equipmentOperationalStatus);
      }
      equipmentActionTaken.value = String(item.equipmentActionTaken || '');
      equipmentRecommendation.value = String(item.equipmentRecommendation || '');

      if (
        !item.equipmentName &&
        !item.equipmentCategory &&
        !item.equipmentIssueType
      ) {
        const parsedEquipment = parseEquipmentRemarks(item.remarks || '');
        if (parsedEquipment) {
          equipmentName.value = parsedEquipment.details.equipmentName || '';
          if (parsedEquipment.details.equipmentCategory) {
            equipmentCategory.value = parsedEquipment.details.equipmentCategory;
          }
          if (parsedEquipment.details.equipmentIssueType) {
            equipmentIssueType.value = parsedEquipment.details.equipmentIssueType;
          }
          if (parsedEquipment.details.equipmentUrgency) {
            equipmentUrgency.value = parsedEquipment.details.equipmentUrgency;
          }
          equipmentLastService.value = parsedEquipment.details.equipmentLastService || '';
          if (parsedEquipment.details.equipmentOperationalStatus) {
            equipmentOperationalStatus.value = parsedEquipment.details.equipmentOperationalStatus;
          }
          equipmentActionTaken.value = parsedEquipment.details.equipmentActionTaken || '';
          equipmentRecommendation.value = parsedEquipment.details.equipmentRecommendation || '';
          reportRemarks.value = parsedEquipment.summary || '';
        }
      }
    }
    setCoordinateFields(item.latitude, item.longitude);

    if (item.latitude && item.longitude) {
      ensureMapReady();
      placeIncidentMarker(Number(item.latitude), Number(item.longitude));
      setMapStatus('Showing saved incident location.');
    } else {
      clearIncidentOverlays();
      setMapStatus('Saved incident has no coordinates yet. Use Locate Address.');
      setAssignmentPreview('Responsible station will appear after location lookup.');
    }

    const assignedStations = Array.isArray(item.assignedStations) ? item.assignedStations : [];
    if (assignedStations.length > 0) {
      setAssignmentPreview('Responsible stations (' + String(assignedStations.length) + '): ' + formatStationsSummary(assignedStations));
      setResponderStationsText(assignedStations);
    } else if (item.assignedStationName) {
      const fallbackStation = [{
        name: item.assignedStationName,
        method: item.assignmentMethod,
        distanceKm: item.assignmentDistanceKm
      }];
      setAssignmentPreview('Responsible stations (1): ' + formatStationsSummary(fallbackStation));
      setResponderStationsText(fallbackStation);
    } else {
      setResponderStationText('', '', null);
    }

    syncReportTypeDefaults();
    renderIncidentTimeline(item);
    setProgressModeFields(updateMode === 'progression');
    handleIncidentStatusAutoFinish();
    renderAlarmPriorityBadge();
    setReportStep('details');
  }
  syncReportTypeDefaults();

  openReportModal.addEventListener('click', function () {
    if (!canCreate) {
      return;
    }
    openTypeChooserModal();
  });

  closeReportTypeModal.addEventListener('click', function (event) {
    event.preventDefault();
    closeTypeChooserModal();
  });

  chooseIncidentReport.addEventListener('click', function () {
    openCreateModalForType('incident_report');
  });

  chooseEquipmentReport.addEventListener('click', function () {
    openCreateModalForType('equipment_report');
  });

  closeReportModal.addEventListener('click', function (event) {
    event.preventDefault();
    closeModal();
  });

  reportTypeModal.addEventListener('click', function (event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.getAttribute('data-close-type-modal') === 'true') {
      closeTypeChooserModal();
    }
  });

  reportModal.addEventListener('click', function (event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.getAttribute('data-close-modal') === 'true') {
      closeModal();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && alarmRaiseConfirmModal && !alarmRaiseConfirmModal.hidden) {
      closeAlarmRaiseConfirmModalDialog();
      return;
    }

    if (event.key === 'Escape' && fireOutConfirmModal && !fireOutConfirmModal.hidden) {
      closeFireOutConfirmModalDialog();
      return;
    }

    if (event.key === 'Escape' && releaseConfirmModal && !releaseConfirmModal.hidden) {
      closeReleaseConfirmModalDialog();
      return;
    }

    if (event.key === 'Escape' && !reportTypeModal.hidden) {
      closeTypeChooserModal();
      return;
    }

    if (event.key === 'Escape' && !reportModal.hidden) {
      closeModal();
    }
  });

  if (releaseConfirmModal) {
    releaseConfirmModal.addEventListener('click', function (event) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (target.getAttribute('data-close-release-modal') === 'true') {
        closeReleaseConfirmModalDialog();
      }
    });
  }

  if (fireOutConfirmModal) {
    fireOutConfirmModal.addEventListener('click', function (event) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (target.getAttribute('data-close-fireout-modal') === 'true') {
        closeFireOutConfirmModalDialog();
      }
    });
  }

  if (alarmRaiseConfirmModal) {
    alarmRaiseConfirmModal.addEventListener('click', function (event) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (target.getAttribute('data-close-alarm-raise-modal') === 'true') {
        closeAlarmRaiseConfirmModalDialog();
      }
    });
  }

  if (closeAlarmRaiseConfirmModal) {
    closeAlarmRaiseConfirmModal.addEventListener('click', function (event) {
      event.preventDefault();
      closeAlarmRaiseConfirmModalDialog();
    });
  }
  if (cancelAlarmRaiseConfirmBtn) {
    cancelAlarmRaiseConfirmBtn.addEventListener('click', function (event) {
      event.preventDefault();
      closeAlarmRaiseConfirmModalDialog();
    });
  }
  if (confirmAlarmRaiseBtn) {
    confirmAlarmRaiseBtn.addEventListener('click', function (event) {
      event.preventDefault();
      confirmAlarmRaiseReview();
    });
  }

  if (closeFireOutConfirmModal) {
    closeFireOutConfirmModal.addEventListener('click', function (event) {
      event.preventDefault();
      closeFireOutConfirmModalDialog();
    });
  }
  if (cancelFireOutConfirmBtn) {
    cancelFireOutConfirmBtn.addEventListener('click', function (event) {
      event.preventDefault();
      closeFireOutConfirmModalDialog();
    });
  }
  if (confirmFireOutBtn) {
    confirmFireOutBtn.addEventListener('click', function (event) {
      event.preventDefault();
      confirmFireOutMark();
    });
  }

  if (closeReleaseConfirmModal) {
    closeReleaseConfirmModal.addEventListener('click', closeReleaseConfirmModalDialog);
  }
  if (cancelReleaseConfirmBtn) {
    cancelReleaseConfirmBtn.addEventListener('click', closeReleaseConfirmModalDialog);
  }
  if (confirmReleaseBtn) {
    confirmReleaseBtn.addEventListener('click', function () {
      confirmReleaseIncident().catch(function () {});
    });
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!canCreate) {
      formMessage.textContent = 'You do not have permission to submit reports.';
      return;
    }

    if (!streetName) {
      return;
    }

    const title = reportTitle.value.trim();
    const remarksInput = reportRemarks.value.trim();
    const street = streetName.value.trim();
    const landmark = landmarkInput.value.trim();
    const altAddressValue = normalizeAddressText(altAddressInput.value);
    const resolvedAddress = resolveAddressPartsForLocate(street, landmark, barangay.value, altAddressValue);

    const isIncident = reportType.value === 'incident_report';
    const isCallIntake = isIncident && incidentStage.value === 'call_intake';
    const isProgression = updateMode === 'progression';
    const equipmentNameValue = String(equipmentName.value || '').trim();
    const equipmentCategoryValue = String(equipmentCategory.value || '').trim();
    const equipmentIssueTypeValue = String(equipmentIssueType.value || '').trim();
    const equipmentUrgencyValue = String(equipmentUrgency.value || '').trim();
    const equipmentLastServiceValue = String(equipmentLastService.value || '').trim();
    const equipmentOperationalStatusValue = String(equipmentOperationalStatus.value || '').trim();
    const equipmentActionTakenValue = String(equipmentActionTaken.value || '').trim();
    const equipmentRecommendationValue = String(equipmentRecommendation.value || '').trim();

    let remarks = remarksInput;
    let payloadStreet = resolvedAddress.streetName || street;
    let payloadLandmark = resolvedAddress.landmark || landmark;
    let payloadBarangay = resolvedAddress.barangay || barangay.value;
    let payloadCallerName = callerNameInput.value.trim();
    let payloadStartedAt = incidentStartedAtInput.value;
    let payloadLatitude = incidentLatitudeInput.value;
    let payloadLongitude = incidentLongitudeInput.value;

    if (!isIncident) {
      if (title === '' || equipmentNameValue === '' || equipmentCategoryValue === '' || equipmentIssueTypeValue === '' || remarksInput === '') {
        formMessage.textContent = 'Please complete title, equipment name, category, issue type, and issue summary before submitting.';
        return;
      }

      remarks = remarksInput;
      payloadStreet = '';
      payloadLandmark = '';
      payloadBarangay = '';
      payloadCallerName = '';
      payloadStartedAt = '';
      payloadLatitude = '';
      payloadLongitude = '';
    }

    if (isIncident && !isProgression && !isCallIntake && (title === '' || remarks === '')) {
      formMessage.textContent = 'Please complete title and remarks before submitting.';
      return;
    }

    if (isIncident && !isProgression && !isCallIntake && payloadStreet === '' && altAddressValue === '') {
      formMessage.textContent = 'Please provide a street or paste a full address before submitting.';
      return;
    }

    if (isProgression && (!alarmLevel.value || (!fireOutCheckbox.checked && !incidentStatus.value))) {
      formMessage.textContent = 'Please set the alarm level and incident status for this update.';
      return;
    }

    const effectiveIncidentStatus = getEffectiveIncidentStatus();

    const payload = {
      action: reportId.value ? 'update' : 'create',
      id: reportId.value,
      updateMode: updateMode,
      reportType: reportType.value,
      incidentStage: incidentStage.value,
      alarmLevel: alarmLevel.value,
      incidentStatus: incidentStage.value === 'call_intake' ? '' : effectiveIncidentStatus,
      title: title,
      callerName: payloadCallerName,
      barangay: payloadBarangay,
      streetName: payloadStreet,
      landmark: payloadLandmark,
      incidentStartedAt: payloadStartedAt,
      incidentFinishedAt: incidentFinishedAtInput.value,
      locationLatitude: payloadLatitude,
      locationLongitude: payloadLongitude,
      remarks: remarks,
      equipmentName: equipmentNameValue,
      equipmentCategory: equipmentCategoryValue,
      equipmentIssueType: equipmentIssueTypeValue,
      equipmentUrgency: equipmentUrgencyValue,
      equipmentLastService: equipmentLastServiceValue,
      equipmentOperationalStatus: equipmentOperationalStatusValue,
      equipmentActionTaken: equipmentActionTakenValue,
      equipmentRecommendation: equipmentRecommendationValue
    };

    formMessage.textContent = 'Submitting report...';

    try {
      const response = await fetch(reportsApiUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok || !result || result.ok !== true) {
        formMessage.textContent = (result && result.message) ? result.message : 'Failed to submit report.';
        return;
      }

      if (!reportId.value) {
        formMessage.textContent = 'Report submitted successfully.';
      } else if (updateMode === 'progression') {
        let progressMessage = 'Incident progress updated successfully.';
        const cloudSync = result.cloudSync || null;
        if (cloudSync && cloudSync.enabled !== false && String(effectiveIncidentStatus || '') === 'fire_out') {
          if ((cloudSync.synced || 0) > 0) {
            progressMessage += ' Synced to cloud.';
          } else if ((cloudSync.failed || 0) > 0) {
            progressMessage += ' Cloud sync will retry automatically.';
          }
        }
        formMessage.textContent = progressMessage;
      } else {
        formMessage.textContent = 'Report edited successfully.';
      }

      if (!reportId.value && result.report && result.report.id) {
        saveSubmissionNotification(result.report);
      }
      await loadMyReports();
      const closeDelay = updateMode === 'progression' && String(effectiveIncidentStatus || '') === 'fire_out' ? 1400 : 250;
      setTimeout(function () {
        closeModal();
        resetFormForCreate();
      }, closeDelay);
    } catch (error) {
      formMessage.textContent = 'Failed to submit report.';
    }
  });

  tableBody.addEventListener('click', async function (event) {
    console.log('Table body clicked, target:', event.target);
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const action = target.getAttribute('data-action');
    const id = target.getAttribute('data-id') || '';
    console.log('Click detected - action:', action, 'id:', id);
    if (action !== 'edit' && action !== 'progress' && action !== 'download' && action !== 'claim' && action !== 'release' && action !== 'approve-alarm-raise' && action !== 'deny-alarm-raise') {
      console.log('Action not recognized, ignoring');
      return;
    }

    if (action === 'approve-alarm-raise' || action === 'deny-alarm-raise') {
      if (!isCentralStation || !canUpdateIncidentReports) {
        return;
      }
      openAlarmRaiseConfirmModal(id, action === 'approve-alarm-raise' ? 'approve' : 'deny');
      return;
    }

    const item = reportsById.get(String(id));
    if (!item) {
      return;
    }

    if (action === 'claim' || action === 'release') {
      if (!canUpdateIncidentReports) {
        return;
      }
      if (action === 'claim' && !canClaimIncidentReport(item)) {
        window.alert('This incident cannot be claimed right now.');
        return;
      }
      if (action === 'release' && !canReleaseIncidentReport(item)) {
        window.alert('Only the ComL handling this incident can release it.');
        return;
      }
      if (action === 'release') {
        openReleaseConfirmModal(item);
        return;
      }
      claimOrReleaseIncident(item.id, action).catch(function (error) {
        window.alert(error.message || 'Unable to update claim status.');
      });
      return;
    }

    if (action === 'edit') {
      if (!canCreate) {
        return;
      }
      if (!canEditReport(item)) {
        window.alert('You can only edit this incident before the first progress update and while it is not completed.');
        return;
      }
      populateFormForEdit(item);
      openModal('edit');
      return;
    }

    if (action === 'progress') {
      if (!canCreate) {
        return;
      }
      if (!canProgressIncidentReport(item)) {
        if (item && item.isClaimedByOther) {
          window.alert('This incident is already being handled by ' + (item.handlingUsername || 'another ComL') + '.');
        } else if (item && item.isUnclaimed) {
          window.alert('Claim this incident first before updating progress.');
        } else {
          window.alert('Only assigned responding stations can update incident progress on their station report.');
        }
        return;
      }
      populateFormForEdit(item);
      openModal('progress');
      return;
    }

    if (action === 'download') {
      if ((item.type || '') === 'incident_report') {
        const reportId = String(item.id || '').trim();
        if (!reportId) {
          window.alert('Report ID not found.');
          return;
        }
        window.open(reportsApiUrl + '?action=download-pdf&reportId=' + encodeURIComponent(reportId), '_blank', 'noopener,noreferrer');
        return;
      }

      generateReportPdf(item);
      return;
    }
  });

  if (reportsTicketTabs) {
    reportsTicketTabs.addEventListener('click', function (event) {
      const button = event.target.closest('[data-ticket-tab]');
      if (!button || !reportsTicketTabs.contains(button)) {
        return;
      }
      switchTicketTab(button.getAttribute('data-ticket-tab') || 'queue');
    });
  }

  if (reportsDateFilters) {
    reportsDateFilters.addEventListener('click', function (event) {
      const button = event.target.closest('[data-date-filter]');
      if (!button || !reportsDateFilters.contains(button)) {
        return;
      }
      setDateFilter(button.getAttribute('data-date-filter') || 'all');
    });
  }

  if (reportsDateFilterInput) {
    reportsDateFilterInput.addEventListener('change', function () {
      const value = String(reportsDateFilterInput.value || '').trim();
      if (value === '') {
        setDateFilter('all');
        return;
      }
      setDateFilter('specific', value);
    });
  }

  (async function initReportsPage() {
    syncTicketTabUi();
    syncDateFilterUi();
    await loadMyReports();

    if (openProgressFromQuery()) {
      return;
    }

    if (context.quickMode === 'intake' && canCreateIncidentReports) {
      openQuickIntake();
    }
  })();
})();


