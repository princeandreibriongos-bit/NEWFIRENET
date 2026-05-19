(function () {
  const contextElement = document.getElementById('reportsContext');
  const openReportModal = document.getElementById('openReportModal');
  const reportTypeModal = document.getElementById('reportTypeModal');
  const closeReportTypeModal = document.getElementById('closeReportTypeModal');
  const chooseIncidentReport = document.getElementById('chooseIncidentReport');
  const chooseEquipmentReport = document.getElementById('chooseEquipmentReport');
  const closeReportModal = document.getElementById('closeReportModal');
  const reportModal = document.getElementById('reportModal');
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
  const sidebar = document.querySelector('.app-sidebar');
  const reportsApiUrl = '/firenet/NEWFIRENET/backend/controllers/reports.php';
  const reportsById = new Map();
  let updateMode = 'correction';
  let incidentFinishedAutoFilled = false;
  let incidentFinishedAutoValue = '';
  let mapInstance = null;
  let incidentMarker = null;
  let incidentProximityCircle = null;
  let stationLabelOverlays = [];
  let manualPinMode = false;
  let locateDebounceTimer = null;
  let activeReportStep = 'details';
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
    !alarmPriorityMeta
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

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const canCreate = Boolean(context.canCreateReports);

  welcome.textContent =
    'Signed in as ' +
    (context.user || 'Unknown User') +
    ' | role: ' +
    (context.role || 'user') +
    ' | station: ' +
    String(context.stationId || 1) +
    '. This page displays only your report transactions.';

  if (!canCreate) {
    openReportModal.hidden = true;
  }

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

  function buildAddressCandidates(street, landmark, barangayValue, altAddress) {
    const streetVariants = buildStreetVariants(street);
    const altVariants = buildStreetVariants(altAddress);
    const barangayVariants = Array.from(new Set([
      String(barangayValue || '').trim(),
      String(barangayValue || '').trim() ? ('Barangay ' + String(barangayValue || '').trim()) : ''
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
      streetVariants.forEach(function (sv) {
        barangayVariants.forEach(function (bg) {
          pushCandidate([sv, landmark, bg], locality);
          pushCandidate([sv, bg], locality);
          pushCandidate([sv, landmark], locality);
        });
        pushCandidate([sv], locality);
      });

      altVariants.forEach(function (av) {
        barangayVariants.forEach(function (bg) {
          pushCandidate([av, bg], locality);
          pushCandidate([av, landmark, bg], locality);
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

      if (landmark) {
        barangayVariants.forEach(function (bg) {
          pushCandidate([landmark, bg], locality);
        });
        pushCandidate([landmark], locality);
      }
    });

    return Array.from(new Set(candidates)).slice(0, 30);
  }

  function geocodeWithGoogleMaps(address) {
    return new Promise(function (resolve) {
      if (!isGoogleMapsReady() || !address) {
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
    const altAddressValue = String(altAddressInput.value || '').trim();
    return street !== '' || barangayValue !== '' || landmarkValue !== '' || altAddressValue !== '';
  }

  function setCoordinateFields(latitude, longitude) {
    incidentLatitudeInput.value = latitude == null ? '' : Number(latitude).toFixed(7);
    incidentLongitudeInput.value = longitude == null ? '' : Number(longitude).toFixed(7);
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
    const altAddressValue = String(altAddressInput.value || '').trim();

    if (street === '' && landmarkValue === '' && altAddressValue === '') {
      setMapStatus('Type at least a street or landmark to locate this incident.');
      return;
    }

    setMapStatus('Locating address on map...');
    try {
      const addressCandidates = buildAddressCandidates(street, landmarkValue, barangayValue, altAddressValue);

      const params = new URLSearchParams({
        barangay: barangayValue,
        streetName: street,
        landmark: landmarkValue,
        altAddress: altAddressValue,
        alarmLevel: String(alarmLevel.value || '1')
      });
      let response = null;
      let payload = null;
      try {
        response = await fetch(getLocateUrl(params), {
          method: 'GET',
          credentials: 'same-origin'
        });

        const raw = await response.text();
        payload = raw ? JSON.parse(raw) : null;
      } catch (backendError) {
        response = null;
        payload = null;
      }

      let latitude = payload && payload.latitude != null ? Number(payload.latitude) : null;
      let longitude = payload && payload.longitude != null ? Number(payload.longitude) : null;
      let displayAddress = payload && payload.displayAddress ? String(payload.displayAddress) : '';
      const backendOk = Boolean(response && response.ok && payload && payload.ok === true);

      if ((!backendOk || latitude == null || longitude == null) && addressCandidates.length > 0) {
        const googleResult = await geocodeCandidatesWithGoogleMaps(addressCandidates);
        if (googleResult) {
          latitude = Number(googleResult.latitude);
          longitude = Number(googleResult.longitude);
          if (!displayAddress) {
            displayAddress = String(googleResult.displayAddress || '');
          }
        }
      }

      if (latitude == null || longitude == null) {
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
          ensureMapReady();
          placeIncidentMarker(latitude, longitude);
        }, 200);
      }

      const stations = buildStationsFromPayload(payload);
      if (stations.length > 0) {
        setAssignmentPreview('Responsible stations (' + String(stations.length) + '): ' + formatStationsSummary(stations));
        setResponderStationsText(stations);
      } else {
        setAssignmentPreview('No active station assignments found for this location.');
        setResponderStationText('', '', null);
      }

      if (displayAddress) {
        setMapStatus('Located: ' + displayAddress);
      } else {
        setMapStatus('Address pin updated successfully.');
      }
    } catch (error) {
      setMapStatus('Unable to locate this address right now.');
      setAssignmentPreview('Responsible station will appear after successful lookup.');
      setResponderStationText('', '', null);
    }
  }

  function queueAddressLocate() {
    if (locateDebounceTimer) {
      clearTimeout(locateDebounceTimer);
    }
    locateDebounceTimer = setTimeout(function () {
      locateAddressFromForm();
    }, 700);
  }

  function resetIncidentFinishedAutoTracking() {
    incidentFinishedAutoFilled = false;
    incidentFinishedAutoValue = '';
  }

  function handleIncidentStatusAutoFinish() {
    // Finished-at is managed server-side on submit when status becomes fire_out.
    incidentFinishedAtInput.value = '';
    resetIncidentFinishedAutoTracking();
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
    alarmLevel.disabled = !isIncident;
    incidentStatusField.hidden = !isIncident || isCallIntake;
    incidentStatus.disabled = !isIncident || isCallIntake;

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
      if (!incidentStatus.value) {
        incidentStatus.value = 'under_control';
      }
      incidentStatus.disabled = false;
      alarmLevel.disabled = false;
      if (incidentStatusField) {
        incidentStatusField.hidden = false;
      }
      if (incidentFinishedField) {
        incidentFinishedField.hidden = true;
      }
      incidentFinishedAtInput.disabled = true;
      return;
    }

    incidentStartedAtInput.readOnly = true;
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
        incidentStatus.value = 'under_control';
      }
    } else {
      incidentStage.value = 'call_intake';
      alarmLevel.value = '1';
      incidentStatus.value = 'under_control';
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

    if (item.type !== 'incident_report') {
      return true;
    }

    return !isIncidentCompleted(item) && !hasIncidentFirstProgressUpdate(item);
  }

  function renderRows(reports) {
    reportsById.clear();

    if (!Array.isArray(reports) || reports.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="muted-text">No reports found for your account yet.</td></tr>';
      return;
    }

    reports.forEach(function (item) {
      reportsById.set(String(item.id), item);
    });

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
          if (isIncidentActive(item)) {
            actionsHtml +=
              '<button type="button" class="table-action-btn progress" data-action="progress" data-id="' + escapeHtml(itemId) + '">Update Incident</button>' +
              '<span class="incident-ongoing-note" title="This incident is active and needs continuous monitoring">' +
              '<span class="incident-ongoing-dot" aria-hidden="true"></span>' +
              'Ongoing Incident' +
              '</span>';
          } else {
            actionsHtml +=
              '<span class="incident-completed-note" title="This incident is completed and locked from progression updates">' +
              '<span class="incident-completed-dot" aria-hidden="true"></span>' +
              'Completed' +
              '</span>';
          }

          if (!canEditReport(item) && !isCompleted) {
            actionsHtml +=
              '<span class="incident-completed-note" title="Edit is only available before the first incident progress update">' +
              '<span class="incident-completed-dot" aria-hidden="true"></span>' +
              'Edit Locked' +
              '</span>';
          }
        }

        actionsHtml +=
          '<button type="button" class="table-action-btn download" data-action="download" data-id="' + escapeHtml(itemId) + '"><span aria-hidden="true">\u2B07</span> Download PDF</button>' +
          '<button type="button" class="table-action-btn upload" data-action="upload" data-id="' + escapeHtml(itemId) + '" title="Upload report to Cloudinary">Upload to Cloud</button>';

        return (
          '<tr>' +
          '<td>' + escapeHtml(normalizeType(item.type || '')) + '</td>' +
          '<td>' + escapeHtml(item.title || '-') + '</td>' +
          '<td>' + escapeHtml(timestampLabel) + '</td>' +
          '<td><div class="table-action-group">' +
          actionsHtml +
          '</div></td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function updateOngoingIncidentHint(reports) {
    if (!reportsOngoingHint) {
      return;
    }

    const activeCount = Array.isArray(reports)
      ? reports.filter(isIncidentActive).length
      : 0;

    if (activeCount === 0) {
      reportsOngoingHint.textContent = 'No ongoing incidents right now. Update actions are hidden until a new incident becomes active.';
      return;
    }

    reportsOngoingHint.textContent = activeCount + ' ongoing incident(s). Update actions are available only for active incidents.';
  }

  async function loadMyReports() {
    tableBody.innerHTML = '<tr><td colspan="4" class="muted-text">Loading your reports...</td></tr>';
    try {
      const response = await fetch(reportsApiUrl, { method: 'GET', credentials: 'same-origin' });
      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        tableBody.innerHTML = '<tr><td colspan="4" class="muted-text">Unable to load your reports right now.</td></tr>';
        return [];
      }

      const reports = payload.reports || [];
      renderRows(reports);
      updateOngoingIncidentHint(reports);
      return reports;
    } catch (error) {
      tableBody.innerHTML = '<tr><td colspan="4" class="muted-text">Unable to load your reports right now.</td></tr>';
      updateOngoingIncidentHint([]);
      return [];
    }
  }

  function openProgressFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const mode = String(params.get('mode') || '').toLowerCase();
    const id = String(params.get('id') || '');
    if (mode !== 'progress' || id === '') {
      return false;
    }

    const item = reportsById.get(String(id));
    if (!item || (item.type || '') !== 'incident_report' || isIncidentCompleted(item)) {
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
  incidentStatus.addEventListener('change', handleIncidentStatusAutoFinish);
  incidentFinishedAtInput.addEventListener('input', function () {
    incidentFinishedAtInput.value = '';
    resetIncidentFinishedAutoTracking();
  });
  toggleIncidentStage();
  renderAlarmPriorityBadge();
  setReportStep('details');

  function openTypeChooserModal() {
    reportTypeModal.hidden = false;
  }

  function closeTypeChooserModal() {
    reportTypeModal.hidden = true;
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
    incidentStatus.value = 'under_control';
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
    incidentStatus.value = item.incidentStatus || '';
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
    if (event.key === 'Escape' && !reportTypeModal.hidden) {
      closeTypeChooserModal();
      return;
    }

    if (event.key === 'Escape' && !reportModal.hidden) {
      closeModal();
    }
  });

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
    let payloadStreet = street;
    let payloadLandmark = landmark;
    let payloadBarangay = barangay.value;
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

    if (isIncident && !isProgression && !isCallIntake && (title === '' || remarks === '' || street === '')) {
      formMessage.textContent = 'Please complete title, street, and remarks before submitting.';
      return;
    }

    if (isProgression && (!alarmLevel.value || !incidentStatus.value)) {
      formMessage.textContent = 'Please set the alarm level and incident status for this update.';
      return;
    }

    const payload = {
      action: reportId.value ? 'update' : 'create',
      id: reportId.value,
      updateMode: updateMode,
      reportType: reportType.value,
      incidentStage: incidentStage.value,
      alarmLevel: alarmLevel.value,
      incidentStatus: incidentStage.value === 'call_intake' ? '' : incidentStatus.value,
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
        formMessage.textContent = 'Incident progress updated successfully.';
      } else {
        formMessage.textContent = 'Report edited successfully.';
      }

      if (!reportId.value && result.report && result.report.id) {
        saveSubmissionNotification(result.report);
      }
      await loadMyReports();
      setTimeout(function () {
        closeModal();
        resetFormForCreate();
      }, 250);
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
    if (action !== 'edit' && action !== 'progress' && action !== 'download' && action !== 'upload') {
      console.log('Action not recognized, ignoring');
      return;
    }

    const item = reportsById.get(String(id));
    if (!item) {
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
      if ((item.type || '') !== 'incident_report') {
        return;
      }
      if (isIncidentCompleted(item)) {
        window.alert('This incident is already completed and can no longer be updated.');
        return;
      }
      populateFormForEdit(item);
      openModal('progress');
      return;
    }

    if (action === 'download') {
      generateReportPdf(item);
      return;
    }

    if (action === 'upload') {
      const reportId = String(item.id || '');

      if (!reportId) {
        window.alert('Report ID not found');
        return;
      }

      const uploadBtn = target;
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Uploading...';

      const formData = new FormData();
      formData.append('reportId', reportId);

      fetch('/firenet/NEWFIRENET/backend/controllers/cloudinary-upload-server.php', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
      })
        .then(response => response.json())
        .then(result => {
          uploadBtn.disabled = false;
          uploadBtn.textContent = 'Upload to Cloud';

          if (!result.ok) {
            window.alert('Upload failed: ' + (result.message || 'Unknown error'));
            return;
          }

          window.alert('Report uploaded to Cloudinary!\n\nURL:\n' + (result.data.url || 'Upload successful'));
          console.log('Upload successful:', result.data);
        })
        .catch(error => {
          uploadBtn.disabled = false;
          uploadBtn.textContent = 'Upload to Cloud';
          console.error('Upload error:', error);
          window.alert('Upload failed: ' + error.message);
        });

      return;
    }

    function openUploadWidget(stationName, reportId, reportTitle, folderPath) {
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
            tags: [stationName, 'incident_report', reportId],
            publicId: reportId + '_' + Date.now(),
            clientAllowedFormats: ['image', 'video', 'pdf', 'doc', 'docx', 'txt', 'xlsx', 'pptx'],
            context: { reportId: reportId, stationType: stationName, title: reportTitle }
          },
          function(error, result) {
            if (error) {
              console.error('Cloudinary error during upload:', error);
            } else if (result && result.event === 'success') {
              const fileName = String(result.info.display_name || result.info.public_id || 'file');
              const messageEl = document.getElementById('reportsUploadMessage');
              if (messageEl) {
                messageEl.textContent = 'File uploaded successfully to: ' + folderPath;
                messageEl.hidden = false;
                messageEl.style.color = '#1f5e2d';
                setTimeout(function() {
                  messageEl.hidden = true;
                }, 5000);
              }
              console.log('Report attachment uploaded:', result.info);
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
    }
  });

  (async function initReportsPage() {
    await loadMyReports();

    if (openProgressFromQuery()) {
      return;
    }

    if (context.quickMode === 'intake' && canCreate) {
      openQuickIntake();
    }

    // Initialize Cloudinary upload
    const stationName = String(context.stationName || 'AYALA');
    createUploadButton(stationName, 'reportsCloudinaryContainer', function(uploadInfo) {
      const messageEl = document.getElementById('reportsCloudinaryMessage');
      if (messageEl) {
        messageEl.textContent = 'File uploaded successfully: ' + (uploadInfo.display_name || uploadInfo.public_id);
        messageEl.style.color = '#1f5e2d';
      }
    });
  })();
})();


