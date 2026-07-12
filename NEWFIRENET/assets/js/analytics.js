(function () {
  const contextElement = document.getElementById('analyticsContext');
  if (!contextElement) {
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

  const analyticsWelcome = document.getElementById('analyticsWelcome');
  const analyticsRoleTitle = document.getElementById('analyticsRoleTitle');
  const analyticsRoleSummary = document.getElementById('analyticsRoleSummary');
  const analyticsStationId = document.getElementById('analyticsStationId');
  const analyticsActiveCount = document.getElementById('analyticsActiveCount');
  const analyticsCompletedCount = document.getElementById('analyticsCompletedCount');
  const analyticsTotalCount = document.getElementById('analyticsTotalCount');
  const analyticsLatestLabel = document.getElementById('analyticsLatestLabel');
  const analyticsLatestMeta = document.getElementById('analyticsLatestMeta');
  const analyticsFilterSummary = document.getElementById('analyticsFilterSummary');
  const analyticsHydrantSourceLabel = document.getElementById('analyticsHydrantSourceLabel');
  const analyticsScopeCurrent = document.getElementById('analyticsScopeCurrent');
  const analyticsScopeHistory = document.getElementById('analyticsScopeHistory');
  const analyticsIncidentFrom = document.getElementById('analyticsIncidentFrom');
  const analyticsIncidentTo = document.getElementById('analyticsIncidentTo');
  const analyticsStationCount = document.getElementById('analyticsStationCount');
  const analyticsIncidentHeatPointCount = document.getElementById('analyticsIncidentHeatPointCount');
  const analyticsHydrantCount = document.getElementById('analyticsHydrantCount');
  const analyticsMapSource = document.getElementById('analyticsMapSource');
  const analyticsMap = document.getElementById('analyticsMap');
  const analyticsMapStatus = document.getElementById('analyticsMapStatus');
  const analyticsMapMeta = document.getElementById('analyticsMapMeta');
  const analyticsLiveIncidentSelect = document.getElementById('analyticsLiveIncidentSelect');
  const analyticsRouteEtaList = document.getElementById('analyticsRouteEtaList');
  const analyticsDispatchLead = document.getElementById('analyticsDispatchLead');
  const analyticsDispatchLeadMeta = document.getElementById('analyticsDispatchLeadMeta');
  const analyticsDispatchActiveStations = document.getElementById('analyticsDispatchActiveStations');
  const analyticsDispatchZeroCoverage = document.getElementById('analyticsDispatchZeroCoverage');
  const analyticsDispatchFallbackToday = document.getElementById('analyticsDispatchFallbackToday');
  const analyticsDispatchTable = document.getElementById('analyticsDispatchTable');
  const analyticsHotspotList = document.getElementById('analyticsHotspotList');
  const analyticsAorDensityList = document.getElementById('analyticsAorDensityList');
  const analyticsHydrantRiskLead = document.getElementById('analyticsHydrantRiskLead');
  const analyticsHydrantRiskMeta = document.getElementById('analyticsHydrantRiskMeta');
  const analyticsHydrantRiskAreas = document.getElementById('analyticsHydrantRiskAreas');
  const analyticsAlarmBreakdownChart = document.getElementById('analyticsAlarmBreakdownChart');
  const analyticsStatusBreakdownChart = document.getElementById('analyticsStatusBreakdownChart');
  const analyticsReportTypeChart = document.getElementById('analyticsReportTypeChart');
  const analyticsCurrentWeekCount = document.getElementById('analyticsCurrentWeekCount');
  const analyticsPreviousWeekCount = document.getElementById('analyticsPreviousWeekCount');
  const analyticsCurrentMonthCount = document.getElementById('analyticsCurrentMonthCount');
  const analyticsPreviousMonthCount = document.getElementById('analyticsPreviousMonthCount');
  const analyticsCurrentWeekMeta = document.getElementById('analyticsCurrentWeekMeta');
  const analyticsCurrentMonthMeta = document.getElementById('analyticsCurrentMonthMeta');
  const analyticsDailyTrendChart = document.getElementById('analyticsDailyTrendChart');
  const analyticsHourlyTrendChart = document.getElementById('analyticsHourlyTrendChart');
  const analyticsDateRange = document.getElementById('analyticsDateRange');
  const analyticsToggleStationNames = document.getElementById('analyticsToggleStationNames');
  const analyticsToggleStationAor = document.getElementById('analyticsToggleStationAor');
  const analyticsIncidentStatusFilter = document.getElementById('analyticsIncidentStatusFilter');
  const analyticsIncidentAlarmFilter = document.getElementById('analyticsIncidentAlarmFilter');
  const analyticsFitBoundsBtn = document.getElementById('analyticsFitBoundsBtn');
  const analyticsRecenterBtn = document.getElementById('analyticsRecenterBtn');
  const analyticsVisibleIncidentCount = document.getElementById('analyticsVisibleIncidentCount');
  const layerToggleButtons = Array.from(document.querySelectorAll('[data-layer-toggle]'));

  let analyticsMapInstance = null;
  let heatmapLayer = null;
  let stationMarkers = [];
  let stationAorCircles = [];
  let stationLabelOverlays = [];
  let hydrantMarkers = [];
  let incidentMarkers = [];
  let incidentInfoWindow = null;
  let routePolylines = [];
  let routeMarkers = [];
  let selectedLiveIncidentId = null;
  let routeRenderSequence = 0;
  let lastMapBounds = null;
  let layerVisibility = {
    stations: true,
    incidents: true,
    heatmap: true,
    hydrants: true,
    routes: true
  };
  let showStationNames = true;
  let showStationAor = true;
  let incidentStatusFilter = 'all';
  let incidentAlarmMin = 1;
  let trendCharts = {};

  const stationColorPalette = ['#1e6bd6', '#0f766e', '#7c3aed', '#d97706', '#bc1f2d', '#0f172a'];
  const REPORTS_URL = '/firenet/NEWFIRENET/backend/pages/reports.php';
  const ENV_PROXY = '/firenet/NEWFIRENET/backend/controllers/env_intel.php';

  if (analyticsWelcome) {
    const scopeText = context.incidentScopeLabel || 'Current incidents';
    const roleLine = context.roleSummary ? ' ' + context.roleSummary : '';
    analyticsWelcome.textContent = 'Signed in as ' + (context.user || 'Unknown User') + '. Viewing ' + scopeText.toLowerCase() + ' across Makati.' + roleLine;
  }

  if (analyticsRoleSummary) {
    analyticsRoleSummary.textContent = context.roleSummary || '';
    analyticsRoleSummary.hidden = true;
  }

  if (analyticsRoleTitle) {
    analyticsRoleTitle.textContent = context.roleTitle || 'User';
  }

  if (analyticsStationId) {
    analyticsStationId.textContent = String(context.stationId || 1);
  }

  if (analyticsFilterSummary) {
    analyticsFilterSummary.textContent = context.incidentFilterSummary || 'Use current incidents or the full history with a custom time window.';
  }

  if (analyticsHydrantSourceLabel) {
    analyticsHydrantSourceLabel.textContent = context.hydrantSourceLabel || 'OpenStreetMap public hydrants';
  }

  if (analyticsScopeCurrent && analyticsScopeHistory) {
    const scope = String(context.incidentScope || 'current');
    analyticsScopeCurrent.checked = scope === 'current';
    analyticsScopeHistory.checked = scope === 'history';
  }

  if (analyticsIncidentFrom) {
    analyticsIncidentFrom.value = context.incidentFromInput || '';
  }

  if (analyticsIncidentTo) {
    analyticsIncidentTo.value = context.incidentToInput || '';
  }

  if (analyticsActiveCount) {
    analyticsActiveCount.textContent = String(context.activeIncidentCount || 0);
  }

  if (analyticsCompletedCount) {
    analyticsCompletedCount.textContent = String(context.completedIncidentCount || 0);
  }

  if (analyticsTotalCount) {
    analyticsTotalCount.textContent = String(context.totalIncidentCount || 0);
  }

  if (analyticsLatestLabel) {
    analyticsLatestLabel.textContent = context.latestIncidentLabel || 'No active incidents.';
  }

  if (analyticsLatestMeta) {
    analyticsLatestMeta.textContent = context.latestIncidentMeta || 'Analytics will update when new incidents are recorded.';
  }

  const liveBar = document.querySelector('.ana-live-bar');
  const activeCount = Number(context.activeIncidentCount || 0);
  if (liveBar) {
    liveBar.classList.toggle('ana-live-bar--idle', activeCount <= 0);
  }

  if (analyticsStationCount) {
    analyticsStationCount.textContent = String((Array.isArray(context.stationGeo) ? context.stationGeo.length : context.stationCount) || 0);
  }

  if (analyticsIncidentHeatPointCount) {
    analyticsIncidentHeatPointCount.textContent = String((Array.isArray(context.incidentHeatmapPoints) ? context.incidentHeatmapPoints.length : context.incidentHeatPointCount) || 0);
  }

  if (analyticsHydrantCount) {
    analyticsHydrantCount.textContent = String((Array.isArray(context.hydrantGeo) ? context.hydrantGeo.length : context.hydrantCount) || 0);
  }

  if (analyticsMapMeta) {
    const stationCount = Array.isArray(context.stationGeo) ? context.stationGeo.length : (context.stationCount || 0);
    const incidentCount = Array.isArray(context.incidentHeatmapPoints) ? context.incidentHeatmapPoints.length : (context.incidentHeatPointCount || 0);
    const liveIncidentCount = Array.isArray(context.liveIncidents) ? context.liveIncidents.length : 0;
    const hydrantCount = Array.isArray(context.hydrantGeo) ? context.hydrantGeo.length : (context.hydrantCount || 0);
    const scopeLabel = context.incidentScopeLabel || 'Current incidents';
    analyticsMapMeta.textContent = scopeLabel + ' · ' + String(stationCount) + ' stations · ' + String(incidentCount) + ' heat points · ' + String(hydrantCount) + ' hydrants · ' + String(liveIncidentCount) + ' live.';
  }

  function getIncidentScope() {
    if (analyticsScopeHistory && analyticsScopeHistory.checked) {
      return 'history';
    }
    return 'current';
  }

  function syncIncidentScopeUi() {
    const isHistory = getIncidentScope() === 'history';

    if (analyticsDateRange) {
      analyticsDateRange.hidden = !isHistory;
    }

    if (analyticsIncidentFrom) {
      analyticsIncidentFrom.disabled = !isHistory;
    }

    if (analyticsIncidentTo) {
      analyticsIncidentTo.disabled = !isHistory;
    }
  }

  syncIncidentScopeUi();

  if (analyticsMapSource) {
    analyticsMapSource.textContent = context.hydrantNotice || 'Hydrants will use the public OpenStreetMap layer when available.';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      })[char];
    });
  }

  function renderDispatchLoadBalance() {
    const summary = context.dispatchLoadSummary && typeof context.dispatchLoadSummary === 'object' ? context.dispatchLoadSummary : {};
    const topStations = Array.isArray(summary.topStations) ? summary.topStations : [];
    const busiestStationName = String(summary.busiestStationName || 'No active dispatch load');
    const busiestAssignments = Number(summary.busiestStationActiveAssignments || 0);
    const stationsHandlingCount = Number(summary.stationsHandlingCount || 0);
    const zeroAvailabilityCount = Number(summary.zeroAvailabilityCount || 0);
    const fallbackDispatchCountToday = Number(summary.fallbackDispatchCountToday || 0);

    if (analyticsDispatchLead) {
      analyticsDispatchLead.textContent = busiestStationName;
    }
    if (analyticsDispatchLeadMeta) {
      analyticsDispatchLeadMeta.textContent = busiestAssignments > 0
        ? `${busiestAssignments} active assignment(s) at peak station right now.`
        : 'Waiting for live assignments.';
    }
    if (analyticsDispatchActiveStations) {
      analyticsDispatchActiveStations.textContent = String(stationsHandlingCount);
    }
    if (analyticsDispatchZeroCoverage) {
      analyticsDispatchZeroCoverage.textContent = String(zeroAvailabilityCount);
    }
    if (analyticsDispatchFallbackToday) {
      analyticsDispatchFallbackToday.textContent = String(fallbackDispatchCountToday);
    }
    if (!analyticsDispatchTable) {
      return;
    }
    if (topStations.length === 0) {
      analyticsDispatchTable.innerHTML = '<p class="ana-load-empty">No station dispatch workload available yet.</p>';
      return;
    }

    analyticsDispatchTable.innerHTML = topStations.map(function (station, index) {
      const stationName = escapeHtml(station.stationName || 'Station');
      const stationCode = station.stationCode ? ' (' + escapeHtml(station.stationCode) + ')' : '';
      const activeAssignmentCount = Number(station.activeAssignmentCount || 0);
      const incidentsHandledToday = Number(station.incidentsHandledToday || 0);
      const fallbackCount = Number(station.fallbackDispatchCountToday || 0);
      const sub = `${incidentsHandledToday} handled today${fallbackCount > 0 ? ` · ${fallbackCount} fallback` : ''}`;
      return '<div class="ana-load-row">'
        + `<span class="ana-load-rank">${index + 1}</span>`
        + '<div class="ana-load-main">'
        + `<span class="ana-load-name">${stationName}${stationCode}</span>`
        + `<span class="ana-load-sub">${escapeHtml(sub)}</span>`
        + '</div>'
        + `<span class="ana-load-badge">${activeAssignmentCount} active</span>`
        + `<span class="ana-load-count">${fallbackCount > 0 ? fallbackCount + ' fb' : 'steady'}</span>`
        + '</div>';
    }).join('');
  }

  renderDispatchLoadBalance();

  function renderGeoInsights() {
    const geoInsights = context.geoInsights && typeof context.geoInsights === 'object' ? context.geoInsights : {};
    const topHotspots = Array.isArray(geoInsights.topHotspots) ? geoInsights.topHotspots : [];
    const aorDensity = Array.isArray(geoInsights.aorDensity) ? geoInsights.aorDensity : [];
    const hydrantRiskSummary = geoInsights.hydrantRiskSummary && typeof geoInsights.hydrantRiskSummary === 'object'
      ? geoInsights.hydrantRiskSummary
      : { riskIncidentCount: 0, inactiveHydrantsNearIncidents: 0, topRiskAreas: [] };
    const topRiskAreas = Array.isArray(hydrantRiskSummary.topRiskAreas) ? hydrantRiskSummary.topRiskAreas : [];

    if (analyticsHotspotList) {
      analyticsHotspotList.innerHTML = topHotspots.length > 0
        ? topHotspots.map(function (row, index) {
            return '<div class="ana-geo-row">'
              + `<span class="ana-geo-rank">${index + 1}</span>`
              + '<div class="ana-geo-main">'
              + `<span class="ana-geo-name">${escapeHtml(row.label || 'Area')}</span>`
              + `<span class="ana-geo-sub">${escapeHtml(String(row.activeCount || 0) + ' active · ' + String(row.alarmWeight || 0) + ' alarm weight')}</span>`
              + '</div>'
              + `<span class="ana-geo-count">${Number(row.incidentCount || 0)} incidents</span>`
              + '</div>';
          }).join('')
        : '<p class="ana-load-empty">No hotspot summary available yet.</p>';
    }

    if (analyticsAorDensityList) {
      analyticsAorDensityList.innerHTML = aorDensity.length > 0
        ? aorDensity.map(function (row, index) {
            const stationCode = row.stationCode ? ' (' + row.stationCode + ')' : '';
            return '<div class="ana-geo-row">'
              + `<span class="ana-geo-rank">${index + 1}</span>`
              + '<div class="ana-geo-main">'
              + `<span class="ana-geo-name">${escapeHtml((row.stationName || 'Station') + stationCode)}</span>`
              + `<span class="ana-geo-sub">${escapeHtml(String(row.activeCount || 0) + ' active inside ' + Number(row.radiusKm || 0).toFixed(1) + ' km AOR')}</span>`
              + '</div>'
              + `<span class="ana-geo-count">${Number(row.incidentCount || 0)} total</span>`
              + '</div>';
          }).join('')
        : '<p class="ana-load-empty">No AOR density summary available yet.</p>';
    }

    if (analyticsHydrantRiskLead) {
      analyticsHydrantRiskLead.textContent = String(Number(hydrantRiskSummary.riskIncidentCount || 0)) + ' affected incidents';
    }
    if (analyticsHydrantRiskMeta) {
      analyticsHydrantRiskMeta.textContent = String(Number(hydrantRiskSummary.inactiveHydrantsNearIncidents || 0)) + ' inactive or maintenance hydrants are near current incident zones.';
    }
    if (analyticsHydrantRiskAreas) {
      analyticsHydrantRiskAreas.innerHTML = topRiskAreas.length > 0
        ? topRiskAreas.map(function (row, index) {
            return '<div class="ana-geo-row">'
              + `<span class="ana-geo-rank">${index + 1}</span>`
              + '<div class="ana-geo-main">'
              + `<span class="ana-geo-name">${escapeHtml(row.label || 'Area')}</span>`
              + '<span class="ana-geo-sub">Nearby hydrant availability needs attention</span>'
              + '</div>'
              + `<span class="ana-geo-count">${Number(row.incidentCount || 0)} match(es)</span>`
              + '</div>';
          }).join('')
        : '<p class="ana-load-empty">No hydrant risk areas found.</p>';
    }
  }

  renderGeoInsights();

  function formatTrendDelta(currentValue, previousValue) {
    const current = Number(currentValue || 0);
    const previous = Number(previousValue || 0);
    if (previous <= 0 && current <= 0) {
      return 'No change';
    }
    if (previous <= 0 && current > 0) {
      return 'Up from zero';
    }
    const delta = current - previous;
    const deltaPct = Math.round((delta / previous) * 100);
    if (delta === 0) {
      return 'No change';
    }
    return (delta > 0 ? 'Up ' : 'Down ') + Math.abs(deltaPct) + '%';
  }

  function renderTimeSeriesComparisons() {
    const timeSeries = context.timeSeries && typeof context.timeSeries === 'object' ? context.timeSeries : {};
    const comparison = timeSeries.comparison && typeof timeSeries.comparison === 'object' ? timeSeries.comparison : {};
    const currentWeekCount = Number(comparison.currentWeekCount || 0);
    const previousWeekCount = Number(comparison.previousWeekCount || 0);
    const currentMonthCount = Number(comparison.currentMonthCount || 0);
    const previousMonthCount = Number(comparison.previousMonthCount || 0);

    if (analyticsCurrentWeekCount) {
      analyticsCurrentWeekCount.textContent = String(currentWeekCount);
    }
    if (analyticsPreviousWeekCount) {
      analyticsPreviousWeekCount.textContent = String(previousWeekCount);
    }
    if (analyticsCurrentMonthCount) {
      analyticsCurrentMonthCount.textContent = String(currentMonthCount);
    }
    if (analyticsPreviousMonthCount) {
      analyticsPreviousMonthCount.textContent = String(previousMonthCount);
    }
    if (analyticsCurrentWeekMeta) {
      analyticsCurrentWeekMeta.textContent = formatTrendDelta(currentWeekCount, previousWeekCount) + ' vs previous week';
    }
    if (analyticsCurrentMonthMeta) {
      analyticsCurrentMonthMeta.textContent = formatTrendDelta(currentMonthCount, previousMonthCount) + ' vs previous month';
    }
  }

  renderTimeSeriesComparisons();

  function destroyTrendChart(key) {
    if (trendCharts[key]) {
      trendCharts[key].destroy();
      trendCharts[key] = null;
    }
  }

  function buildTrendChart(canvas, key, type, labels, data, datasetOptions) {
    if (!canvas || typeof Chart === 'undefined') {
      return;
    }
    destroyTrendChart(key);
    trendCharts[key] = new Chart(canvas.getContext('2d'), {
      type: type,
      data: {
        labels: labels,
        datasets: [
          Object.assign({
            data: data,
            borderWidth: 2
          }, datasetOptions || {})
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            titleFont: { size: 12 },
            bodyFont: { size: 13 },
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 },
            grid: { color: 'rgba(148, 163, 184, 0.16)' }
          },
          x: {
            ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: type === 'bar' ? 45 : 0 },
            grid: { display: false }
          }
        }
      }
    });
  }

  function renderClassificationCharts() {
    const classification = context.classificationBreakdown && typeof context.classificationBreakdown === 'object'
      ? context.classificationBreakdown
      : { alarmLevels: [], incidentStatuses: [], reportTypes: [] };

    const alarmLevels = Array.isArray(classification.alarmLevels) ? classification.alarmLevels : [];
    const incidentStatuses = Array.isArray(classification.incidentStatuses) ? classification.incidentStatuses : [];
    const reportTypes = Array.isArray(classification.reportTypes) ? classification.reportTypes : [];

    buildTrendChart(
      analyticsAlarmBreakdownChart,
      'alarmBreakdown',
      'bar',
      alarmLevels.length ? alarmLevels.map(function (item) { return item.label; }) : ['Alarm 1'],
      alarmLevels.length ? alarmLevels.map(function (item) { return Number(item.count || 0); }) : [0],
      {
        label: 'Alarm levels',
        backgroundColor: 'rgba(248, 113, 113, 0.8)',
        borderRadius: 6,
        borderSkipped: false
      }
    );

    buildTrendChart(
      analyticsStatusBreakdownChart,
      'statusBreakdown',
      'doughnut',
      incidentStatuses.length ? incidentStatuses.map(function (item) { return item.label; }) : ['Active'],
      incidentStatuses.length ? incidentStatuses.map(function (item) { return Number(item.count || 0); }) : [0],
      {
        label: 'Status',
        backgroundColor: ['#60a5fa', '#fbbf24', '#34d399'],
        borderColor: '#0f172a',
        borderWidth: 2
      }
    );

    buildTrendChart(
      analyticsReportTypeChart,
      'reportTypeBreakdown',
      'bar',
      reportTypes.length ? reportTypes.map(function (item) { return item.label; }) : ['Incident Report'],
      reportTypes.length ? reportTypes.map(function (item) { return Number(item.count || 0); }) : [0],
      {
        label: 'Report categories',
        backgroundColor: 'rgba(96, 165, 250, 0.78)',
        borderRadius: 6,
        borderSkipped: false
      }
    );
  }

  function renderTimeSeriesCharts() {
    const timeSeries = context.timeSeries && typeof context.timeSeries === 'object' ? context.timeSeries : {};
    const dailyLabels = Array.isArray(timeSeries.dailyLabels) && timeSeries.dailyLabels.length ? timeSeries.dailyLabels : ['No data'];
    const dailyCounts = Array.isArray(timeSeries.dailyCounts) && timeSeries.dailyCounts.length ? timeSeries.dailyCounts : [0];
    const hourlyLabels = Array.isArray(timeSeries.hourlyLabels) && timeSeries.hourlyLabels.length ? timeSeries.hourlyLabels : ['00:00'];
    const hourlyCounts = Array.isArray(timeSeries.hourlyCounts) && timeSeries.hourlyCounts.length ? timeSeries.hourlyCounts : [0];

    buildTrendChart(analyticsDailyTrendChart, 'dailyTrend', 'line', dailyLabels, dailyCounts, {
      label: 'Incidents',
      borderColor: '#f87171',
      backgroundColor: 'rgba(248, 113, 113, 0.16)',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: '#fecaca',
      pointBorderColor: '#7f1d1d',
      pointBorderWidth: 1.5
    });

    buildTrendChart(analyticsHourlyTrendChart, 'hourlyTrend', 'bar', hourlyLabels, hourlyCounts, {
      label: 'Hourly incidents',
      backgroundColor: 'rgba(96, 165, 250, 0.75)',
      borderRadius: 6,
      borderSkipped: false
    });
  }

  function buildStationColor(index) {
    return stationColorPalette[index % stationColorPalette.length];
  }

  function extendBoundsForRadius(bounds, center, radiusMeters) {
    const latRadians = center.lat * Math.PI / 180;
    const latOffset = radiusMeters / 111320;
    const lngOffset = radiusMeters / (111320 * Math.cos(latRadians || 1));

    bounds.extend({ lat: center.lat + latOffset, lng: center.lng + lngOffset });
    bounds.extend({ lat: center.lat + latOffset, lng: center.lng - lngOffset });
    bounds.extend({ lat: center.lat - latOffset, lng: center.lng + lngOffset });
    bounds.extend({ lat: center.lat - latOffset, lng: center.lng - lngOffset });
  }

  function createStationLabelOverlay(map, position, text, stationCode) {
    if (!isGoogleMapsReady()) {
      return null;
    }

    const labelText = stationCode ? String(text) + ' (' + String(stationCode) + ')' : String(text);

    function StationLabelOverlay() {
      this.position = position;
      this.text = labelText;
      this.div = null;
    }

    StationLabelOverlay.prototype = Object.create(window.google.maps.OverlayView.prototype);
    StationLabelOverlay.prototype.constructor = StationLabelOverlay;

    StationLabelOverlay.prototype.onAdd = function () {
      const div = document.createElement('div');
      div.className = 'ana-station-label';
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

  function syncStationDisplayButtons() {
    if (analyticsToggleStationNames) {
      analyticsToggleStationNames.classList.toggle('is-active', showStationNames);
      analyticsToggleStationNames.setAttribute('aria-pressed', showStationNames ? 'true' : 'false');
    }

    if (analyticsToggleStationAor) {
      analyticsToggleStationAor.classList.toggle('is-active', showStationAor);
      analyticsToggleStationAor.setAttribute('aria-pressed', showStationAor ? 'true' : 'false');
    }
  }

  syncStationDisplayButtons();

  function updateMapStatus(message) {
    if (analyticsMapStatus) {
      analyticsMapStatus.textContent = message;
    }
  }

  function isGoogleMapsReady() {
    return Boolean(window.google && window.google.maps && window.google.maps.Map && window.google.maps.visualization && window.google.maps.visualization.HeatmapLayer);
  }

  function buildSymbol(fillColor) {
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: fillColor,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 7
    };
  }

  function buildStationSymbol(fillColor) {
    return {
      path: 'M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.75A2.75 2.75 0 1 1 12 6.5a2.75 2.75 0 0 1 0 5.5z',
      fillColor: fillColor,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1.55,
      anchor: new window.google.maps.Point(12, 22)
    };
  }

  function buildHydrantSymbol(fillColor) {
    return {
      path: 'M12 2.5c-2.2 0-4 1.8-4 4v1.2c-1.7.8-3 2.7-3 4.8v2.1c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-2.1c0-2.1-1.3-4-3-4.8V6.5c0-2.2-1.8-4-4-4zm-2 5.4V6.5a2 2 0 1 1 4 0v1.4h-4z',
      fillColor: fillColor,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1.6,
      anchor: new window.google.maps.Point(12, 20)
    };
  }

  function normalizeIncidentId(value) {
    const parsed = Number(value || 0);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return String(Math.trunc(parsed));
  }

  function getLiveIncidents() {
    return Array.isArray(context.liveIncidents) ? context.liveIncidents : [];
  }

  function getSelectedLiveIncident() {
    const incidents = getLiveIncidents();
    if (incidents.length === 0) {
      return null;
    }

    const wanted = normalizeIncidentId(selectedLiveIncidentId);
    const match = incidents.find(function (incident) {
      return normalizeIncidentId(incident.incidentReportId) === wanted;
    });
    return match || incidents[0] || null;
  }

  function buildRouteColor(index) {
    const palette = ['#1558b0', '#b42318', '#d97706', '#0f766e', '#7c3aed', '#0f172a'];
    return palette[index % palette.length];
  }

  function formatDurationSeconds(seconds) {
    const total = Math.max(0, Number(seconds || 0));
    if (!Number.isFinite(total) || total <= 0) {
      return 'ETA pending';
    }

    const minutes = Math.round(total / 60);
    if (minutes < 60) {
      return String(minutes) + ' min';
    }

    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    if (remMinutes === 0) {
      return String(hours) + ' hr';
    }
    return String(hours) + ' hr ' + String(remMinutes) + ' min';
  }

  function formatDistanceMeters(meters) {
    const value = Number(meters || 0);
    if (!Number.isFinite(value) || value <= 0) {
      return 'distance unavailable';
    }

    if (value >= 1000) {
      return (value / 1000).toFixed(1) + ' km';
    }

    return Math.round(value) + ' m';
  }

  function renderRouteEtaList(items, selectedIncident) {
    if (!analyticsRouteEtaList) {
      return;
    }

    if (!selectedIncident) {
      analyticsRouteEtaList.innerHTML = '<div class="ana-route-eta-item"><div class="ana-route-eta-meta">No live incident is currently available for route ETA.</div></div>';
      return;
    }

    if (!items || items.length === 0) {
      analyticsRouteEtaList.innerHTML = '<div class="ana-route-eta-item"><div class="ana-route-eta-meta">No responding station route is available for this incident yet.</div></div>';
      return;
    }

    const html = items.map(function (item, index) {
      const stationName = item.stationName || 'Station';
      const stationCode = item.stationCode ? ' (' + item.stationCode + ')' : '';
      const etaLabelRaw = item.etaText || formatDurationSeconds(item.etaSeconds);
      const etaLabel = /^eta\b/i.test(String(etaLabelRaw)) ? String(etaLabelRaw) : ('ETA ' + String(etaLabelRaw));
      const distanceLabel = item.distanceText || formatDistanceMeters(item.distanceMeters);
      const dispatchLabel = item.dispatchOrder ? 'Dispatch #' + String(item.dispatchOrder) : 'Assigned';
      return '<div class="ana-route-eta-item">'
        + '<div class="ana-route-eta-top">'
        + '<span class="ana-route-eta-name">' + String(index + 1) + '. ' + stationName + stationCode + '</span>'
        + '<span class="ana-route-eta-chip">' + etaLabel + '</span>'
        + '</div>'
        + '<div class="ana-route-eta-meta">' + dispatchLabel + ' · ' + distanceLabel + '</div>'
        + '</div>';
    }).join('');

    analyticsRouteEtaList.innerHTML = html;
  }

  function requestDirectionsRoute(directionsService, request) {
    return new Promise(function (resolve, reject) {
      directionsService.route(request, function (result, status) {
        if (status === 'OK' && result) {
          resolve(result);
          return;
        }

        reject(new Error('Directions route failed: ' + String(status || 'UNKNOWN')));
      });
    });
  }

  function normalizeLayerKey(value) {
    const normalized = String(value || '').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(layerVisibility, normalized)) {
      return normalized;
    }
    return '';
  }

  function syncLayerToggleButtons() {
    layerToggleButtons.forEach(function (button) {
      const key = normalizeLayerKey(button.getAttribute('data-layer-toggle'));
      const isActive = key ? Boolean(layerVisibility[key]) : false;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function toggleLayerVisibility(value) {
    const key = normalizeLayerKey(value);
    if (!key) {
      return;
    }
    layerVisibility[key] = !layerVisibility[key];
    const anyOn = Object.keys(layerVisibility).some(function (k) {
      return layerVisibility[k];
    });
    if (!anyOn) {
      layerVisibility[key] = true;
    }
    syncLayerToggleButtons();
    syncStationDisplayAvailability();
    renderAnalyticsMap();
  }

  function getFilteredIncidents() {
    const incidents = Array.isArray(context.incidentHeatmapPoints) ? context.incidentHeatmapPoints : [];
    return incidents.filter(function (incident) {
      const status = String(incident.status || '').toLowerCase();
      const alarm = Math.max(1, Number(incident.alarmLevel || 1));
      if (alarm < incidentAlarmMin) {
        return false;
      }
      if (incidentStatusFilter === 'all') {
        return true;
      }
      if (incidentStatusFilter === 'active') {
        return status !== 'fire_out' && status !== 'completed' && status !== 'closed';
      }
      return status === incidentStatusFilter;
    });
  }

  function buildIncidentSymbol(color) {
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 7,
      fillColor: color,
      fillOpacity: 0.95,
      strokeColor: '#ffffff',
      strokeWeight: 1.5
    };
  }

  function incidentStatusColor(status, alarmLevel) {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'fire_out' || normalized === 'completed' || normalized === 'closed') {
      return '#64748b';
    }
    if (Number(alarmLevel || 1) >= 4) {
      return '#dc2626';
    }
    if (Number(alarmLevel || 1) >= 3) {
      return '#ea580c';
    }
    if (normalized.indexOf('respond') !== -1) {
      return '#f59e0b';
    }
    return '#ef4444';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function openIncidentInfo(marker, incident) {
    if (!analyticsMapInstance) {
      return;
    }
    if (!incidentInfoWindow) {
      incidentInfoWindow = new window.google.maps.InfoWindow();
    }
    const reportId = Number(incident.reportId || 0);
    const incidentId = Number(incident.incidentReportId || 0);
    const href = reportId > 0
      ? (REPORTS_URL + '?focus=' + encodeURIComponent(String(reportId)))
      : REPORTS_URL;
    const html =
      '<div class="ana-map-infowindow">'
      + '<strong>' + escapeHtml(incident.label || ('Incident #' + incidentId)) + '</strong>'
      + '<div>Status: ' + escapeHtml(String(incident.status || '—').replace(/_/g, ' ')) + '</div>'
      + '<div>Alarm: ' + escapeHtml(String(incident.alarmLevel || 1)) + '</div>'
      + '<div>Station: ' + escapeHtml(incident.stationName || '—') + '</div>'
      + (incident.reportType ? ('<div>Type: ' + escapeHtml(incident.reportType) + '</div>') : '')
      + (incident.location ? ('<div>Loc: ' + escapeHtml(incident.location) + '</div>') : '')
      + '<div>Updated: ' + escapeHtml(incident.updatedAt || '—') + '</div>'
      + '<a href="' + escapeHtml(href) + '">Open in Reports</a>'
      + '</div>';
    incidentInfoWindow.setContent(html);
    incidentInfoWindow.open({ map: analyticsMapInstance, anchor: marker });
  }

  function syncLiveIncidentSelector() {
    if (!analyticsLiveIncidentSelect) {
      return;
    }

    const incidents = getLiveIncidents();
    const selected = getSelectedLiveIncident();

    analyticsLiveIncidentSelect.innerHTML = '';

    if (!selected) {
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = 'No live incidents available';
      analyticsLiveIncidentSelect.appendChild(emptyOption);
      analyticsLiveIncidentSelect.disabled = true;
      selectedLiveIncidentId = null;
      return;
    }

    analyticsLiveIncidentSelect.disabled = false;
    incidents.forEach(function (incident) {
      const option = document.createElement('option');
      const incidentId = normalizeIncidentId(incident.incidentReportId);
      option.value = incidentId || '';
      const alarmLevel = Math.max(1, Number(incident.alarmLevel || 1));
      option.textContent = 'Alarm ' + String(alarmLevel) + ' - ' + String(incident.label || ('Incident #' + incidentId));
      analyticsLiveIncidentSelect.appendChild(option);
    });

    selectedLiveIncidentId = normalizeIncidentId(selected.incidentReportId);
    analyticsLiveIncidentSelect.value = selectedLiveIncidentId || '';
  }

  function clearMapArtifacts() {
    if (heatmapLayer) {
      heatmapLayer.setMap(null);
      heatmapLayer = null;
    }

    stationMarkers.forEach(function (marker) {
      marker.setMap(null);
    });
    stationMarkers = [];

    stationAorCircles.forEach(function (circle) {
      circle.setMap(null);
    });
    stationAorCircles = [];

    stationLabelOverlays.forEach(function (overlay) {
      overlay.setMap(null);
    });
    stationLabelOverlays = [];

    hydrantMarkers.forEach(function (marker) {
      marker.setMap(null);
    });
    hydrantMarkers = [];

    incidentMarkers.forEach(function (marker) {
      marker.setMap(null);
    });
    incidentMarkers = [];

    if (incidentInfoWindow) {
      incidentInfoWindow.close();
    }

    routePolylines.forEach(function (routeLine) {
      routeLine.setMap(null);
    });
    routePolylines = [];

    routeMarkers.forEach(function (routeMarker) {
      routeMarker.setMap(null);
    });
    routeMarkers = [];
  }

  const modernMapStyle = [
    {
      elementType: 'geometry',
      stylers: [{ color: '#1e2838' }]
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9aa8bc' }]
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1e2838' }]
    },
    {
      featureType: 'poi',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'transit',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#2a3548' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [{ color: '#3a4a62' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#152535' }]
    },
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#3d4f68' }]
    }
  ];

  function renderLiveRoutes(map, bounds) {
    const selectedIncident = getSelectedLiveIncident();
    if (!selectedIncident) {
      renderRouteEtaList([], null);
      return;
    }

    const incidentLat = Number(selectedIncident.latitude || 0);
    const incidentLng = Number(selectedIncident.longitude || 0);
    if (!Number.isFinite(incidentLat) || !Number.isFinite(incidentLng) || (incidentLat === 0 && incidentLng === 0)) {
      renderRouteEtaList([], selectedIncident);
      return;
    }

    const destination = { lat: incidentLat, lng: incidentLng };
    bounds.extend(destination);

    const incidentMarker = new window.google.maps.Marker({
      position: destination,
      map: map,
      title: 'Selected incident: ' + String(selectedIncident.label || 'Live incident'),
      icon: buildSymbol('#d62828')
    });
    routeMarkers.push(incidentMarker);

    const responders = Array.isArray(selectedIncident.responders) ? selectedIncident.responders : [];
    if (responders.length === 0) {
      renderRouteEtaList([], selectedIncident);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const sequence = routeRenderSequence + 1;
    routeRenderSequence = sequence;

    const routeRequests = responders.map(function (responder, index) {
      const originLat = Number(responder.latitude || 0);
      const originLng = Number(responder.longitude || 0);
      if (!Number.isFinite(originLat) || !Number.isFinite(originLng) || (originLat === 0 && originLng === 0)) {
        return Promise.resolve(null);
      }

      const origin = { lat: originLat, lng: originLng };
      bounds.extend(origin);

      return requestDirectionsRoute(directionsService, {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS
        },
        provideRouteAlternatives: false
      }).then(function (result) {
        const route = result.routes && result.routes[0] ? result.routes[0] : null;
        const leg = route && route.legs && route.legs[0] ? route.legs[0] : null;
        if (!route || !leg) {
          return null;
        }

        return {
          index: index,
          responder: responder,
          route: route,
          etaText: (leg.duration_in_traffic && leg.duration_in_traffic.text) || (leg.duration && leg.duration.text) || 'ETA pending',
          etaSeconds: (leg.duration_in_traffic && leg.duration_in_traffic.value) || (leg.duration && leg.duration.value) || 0,
          distanceText: (leg.distance && leg.distance.text) || 'distance unavailable',
          distanceMeters: (leg.distance && leg.distance.value) || 0
        };
      }).catch(function () {
        return {
          index: index,
          responder: responder,
          route: null,
          etaText: 'ETA unavailable',
          etaSeconds: Number.POSITIVE_INFINITY,
          distanceText: 'distance unavailable',
          distanceMeters: 0,
          requestDenied: true
        };
      });
    });

    Promise.all(routeRequests).then(function (results) {
      if (routeRenderSequence !== sequence) {
        return;
      }

      const rows = results.filter(function (item) {
        return Boolean(item);
      });

      rows.forEach(function (item) {
        const routeColor = buildRouteColor(item.index);
        const route = item.route;
        if (route && Array.isArray(route.overview_path) && route.overview_path.length > 0) {
          const polyline = new window.google.maps.Polyline({
            path: route.overview_path,
            map: map,
            geodesic: true,
            strokeColor: routeColor,
            strokeOpacity: 0.8,
            strokeWeight: 5
          });
          routePolylines.push(polyline);
        }

        const responder = item.responder || {};
        const responderMarker = new window.google.maps.Marker({
          position: {
            lat: Number(responder.latitude || 0),
            lng: Number(responder.longitude || 0)
          },
          map: map,
          title: String(responder.stationName || responder.stationCode || 'Responding station'),
          icon: buildStationSymbol(routeColor)
        });
        routeMarkers.push(responderMarker);
      });

      rows.sort(function (a, b) {
        const firstOrder = Number(a.responder && a.responder.dispatchOrder ? a.responder.dispatchOrder : 999);
        const secondOrder = Number(b.responder && b.responder.dispatchOrder ? b.responder.dispatchOrder : 999);
        if (firstOrder !== secondOrder) {
          return firstOrder - secondOrder;
        }

        const firstEta = Number(a.etaSeconds || Number.POSITIVE_INFINITY);
        const secondEta = Number(b.etaSeconds || Number.POSITIVE_INFINITY);
        return firstEta - secondEta;
      });

      const etaRows = rows.map(function (item) {
        return {
          stationName: String((item.responder && item.responder.stationName) || 'Station'),
          stationCode: String((item.responder && item.responder.stationCode) || ''),
          dispatchOrder: Number((item.responder && item.responder.dispatchOrder) || 0),
          etaText: item.etaText,
          etaSeconds: item.etaSeconds,
          distanceText: item.distanceText,
          distanceMeters: item.distanceMeters,
          requestDenied: Boolean(item.requestDenied)
        };
      });

      renderRouteEtaList(etaRows, selectedIncident);
      const successfulEtaRows = etaRows.filter(function (row) {
        return Number.isFinite(Number(row.etaSeconds || Number.POSITIVE_INFINITY));
      });

      if (successfulEtaRows.length > 0) {
        const quickest = successfulEtaRows[0];
        updateMapStatus('Live incident routing active: ' + quickest.stationName + ' ETA ' + quickest.etaText + '.');
      } else if (etaRows.some(function (row) { return row.requestDenied; })) {
        updateMapStatus('Live incident routing needs Google Directions or Routes API enabled to compute traffic ETA.');
      } else if (etaRows.length > 0) {
        const quickest = etaRows[0];
        updateMapStatus('Live incident routing active: ' + quickest.stationName + ' ETA ' + quickest.etaText + '.');
      }
    });
  }

  function renderAnalyticsMap() {
    if (!analyticsMap) {
      return;
    }

    if (!context.googleMapsConfigured) {
      updateMapStatus('Google Maps API key is not configured.');
      return;
    }

    if (!isGoogleMapsReady()) {
      updateMapStatus('Google Maps library is still loading.');
      return;
    }

    const stations = Array.isArray(context.stationGeo) ? context.stationGeo : [];
    const hydrants = Array.isArray(context.hydrantGeo) ? context.hydrantGeo : [];
    const fallbackCenter = context.mapCenter && Number.isFinite(Number(context.mapCenter.lat)) && Number.isFinite(Number(context.mapCenter.lng))
      ? { lat: Number(context.mapCenter.lat), lng: Number(context.mapCenter.lng) }
      : { lat: 14.5547, lng: 121.0244 };

    if (!analyticsMapInstance) {
      analyticsMapInstance = new window.google.maps.Map(analyticsMap, {
        center: fallbackCenter,
        zoom: 12,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_BOTTOM
        },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        mapTypeId: 'roadmap',
        backgroundColor: '#1a2332',
        styles: modernMapStyle,
        gestureHandling: 'greedy',
        minZoom: 10,
        maxZoom: 18
      });
    } else {
      analyticsMapInstance.setCenter(fallbackCenter);
    }

    const map = analyticsMapInstance;
    clearMapArtifacts();
    const showStations = Boolean(layerVisibility.stations);
    const showIncidents = Boolean(layerVisibility.incidents);
    const showHeatmap = Boolean(layerVisibility.heatmap);
    const showHydrants = Boolean(layerVisibility.hydrants);
    const showRoutes = Boolean(layerVisibility.routes);
    const filteredIncidents = getFilteredIncidents();

    if (analyticsVisibleIncidentCount) {
      analyticsVisibleIncidentCount.textContent = String(filteredIncidents.length);
    }

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    if (showStations) {
      stations.forEach(function (station, index) {
        const latitude = Number(station.latitude || 0);
        const longitude = Number(station.longitude || 0);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
          return;
        }

        const position = { lat: latitude, lng: longitude };
        const stationColor = buildStationColor(index);
        const stationName = String(station.stationName || station.stationCode || 'Station');
        const stationCode = String(station.stationCode || '');
        const aorRadiusKm = Number(station.aorRadiusKm || 2.5);
        const aorRadiusMeters = Math.max(100, aorRadiusKm * 1000);
        const aorCenterLat = Number(station.aorCenterLat || latitude);
        const aorCenterLng = Number(station.aorCenterLng || longitude);
        const aorCenter = {
          lat: Number.isFinite(aorCenterLat) ? aorCenterLat : latitude,
          lng: Number.isFinite(aorCenterLng) ? aorCenterLng : longitude
        };
        const aorZoneName = String(station.aorZoneName || stationName + ' AOR');

        hasPoints = true;
        bounds.extend(position);

        if (showStationAor) {
          extendBoundsForRadius(bounds, aorCenter, aorRadiusMeters);

          const aorCircle = new window.google.maps.Circle({
            map: map,
            center: aorCenter,
            radius: aorRadiusMeters,
            strokeColor: stationColor,
            strokeOpacity: 0.85,
            strokeWeight: 2,
            fillColor: stationColor,
            fillOpacity: 0.12,
            clickable: false,
            zIndex: 1
          });
          stationAorCircles.push(aorCircle);
        }

        const markerTitle = showStationAor
          ? stationName + ' · AOR ' + aorRadiusKm.toFixed(1) + ' km'
          : stationName;

        const marker = new window.google.maps.Marker({
          position: position,
          map: map,
          title: markerTitle,
          icon: buildStationSymbol(stationColor),
          zIndex: 20
        });
        stationMarkers.push(marker);

        if (showStationNames) {
          const labelPosition = new window.google.maps.LatLng(position.lat, position.lng);
          const labelOverlay = createStationLabelOverlay(map, labelPosition, stationName, stationCode);
          if (labelOverlay) {
            stationLabelOverlays.push(labelOverlay);
          }
        }

        if (showStationAor && aorZoneName) {
          marker.setTitle(markerTitle + ' · ' + aorZoneName);
        }
      });
    }

    const heatmapData = [];
    if (showHeatmap || showIncidents) {
      filteredIncidents.forEach(function (incident) {
        const latitude = Number(incident.lat || 0);
        const longitude = Number(incident.lng || 0);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
          return;
        }

        hasPoints = true;
        bounds.extend({ lat: latitude, lng: longitude });

        if (showHeatmap) {
          heatmapData.push({
            location: new window.google.maps.LatLng(latitude, longitude),
            weight: Number(incident.weight || 1)
          });
        }

        if (showIncidents) {
          const color = incidentStatusColor(incident.status, incident.alarmLevel);
          const marker = new window.google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: map,
            title: String(incident.label || 'Incident') + ' · Alarm ' + String(incident.alarmLevel || 1),
            icon: buildIncidentSymbol(color),
            zIndex: 25
          });
          marker.addListener('click', function () {
            openIncidentInfo(marker, incident);
          });
          incidentMarkers.push(marker);
        }
      });

      if (showHeatmap && heatmapData.length > 0) {
        heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: map,
          radius: 28,
          dissipating: true,
          opacity: 0.84,
          gradient: ['rgba(0,0,0,0)', '#ffd98a', '#ffb26b', '#ff7a5c', '#d62828']
        });
      }
    }

    if (showHydrants) {
      hydrants.forEach(function (hydrant) {
        const latitude = Number(hydrant.latitude || 0);
        const longitude = Number(hydrant.longitude || 0);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
          return;
        }

        const position = { lat: latitude, lng: longitude };
        hasPoints = true;
        bounds.extend(position);

        const status = String(hydrant.status || 'public').toLowerCase();
        const hydrantColor = (status === 'inactive' || status === 'maintenance') ? '#94a3b8' : '#ff8a2a';
        const marker = new window.google.maps.Marker({
          position: position,
          map: map,
          title: String(hydrant.hydrantName || 'Fire Hydrant') + (status ? (' · ' + status) : ''),
          icon: buildHydrantSymbol(hydrantColor),
          zIndex: 15
        });
        hydrantMarkers.push(marker);
      });
    }

    if (showRoutes) {
      renderLiveRoutes(map, bounds);
    } else {
      renderRouteEtaList([], null);
    }

    lastMapBounds = hasPoints ? bounds : null;
    if (hasPoints) {
      map.fitBounds(bounds, 36);
    }

    const activeLayers = Object.keys(layerVisibility).filter(function (key) {
      return layerVisibility[key];
    });
    let statusMessage = 'Layers: ' + (activeLayers.join(', ') || 'none');
    statusMessage += ' · ' + String(showStations ? stations.length : 0) + ' stations';
    statusMessage += ' · ' + String(showIncidents || showHeatmap ? filteredIncidents.length : 0) + ' incidents';
    statusMessage += ' · ' + String(showHydrants ? hydrants.length : 0) + ' hydrants';
    if (showRoutes) {
      statusMessage += ' · routing ready';
    }
    updateMapStatus(statusMessage);
  }

  function syncStationDisplayAvailability() {
    const stationsVisible = Boolean(layerVisibility.stations);
    [analyticsToggleStationNames, analyticsToggleStationAor].forEach(function (button) {
      if (!button) {
        return;
      }
      button.disabled = !stationsVisible;
      button.classList.toggle('is-disabled', !stationsVisible);
    });
  }

  function toggleStationNames() {
    showStationNames = !showStationNames;
    syncStationDisplayButtons();
    if (layerVisibility.stations) {
      renderAnalyticsMap();
    }
  }

  function toggleStationAor() {
    showStationAor = !showStationAor;
    syncStationDisplayButtons();
    if (layerVisibility.stations) {
      renderAnalyticsMap();
    }
  }

  function fitVisibleBounds() {
    if (!analyticsMapInstance || !lastMapBounds) {
      return;
    }
    analyticsMapInstance.fitBounds(lastMapBounds, 36);
  }

  function recenterMakati() {
    if (!analyticsMapInstance) {
      return;
    }
    const center = context.mapCenter && Number.isFinite(Number(context.mapCenter.lat)) && Number.isFinite(Number(context.mapCenter.lng))
      ? { lat: Number(context.mapCenter.lat), lng: Number(context.mapCenter.lng) }
      : { lat: 14.5547, lng: 121.0244 };
    analyticsMapInstance.setCenter(center);
    analyticsMapInstance.setZoom(12);
  }

  function waitForGoogleMapsAndRender() {
    let attempts = 0;
    function poll() {
      if (window.google && window.google.maps && window.google.maps.Map && window.google.maps.visualization && window.google.maps.visualization.HeatmapLayer) {
        renderAnalyticsMap();
        return;
      }
      attempts += 1;
      if (attempts > 80) {
        updateMapStatus('Google Maps failed to load. Check API key and network.');
        return;
      }
      setTimeout(poll, 100);
    }
    poll();
  }

  function waitForChartJsAndRender(maxAttempts) {
    const remaining = typeof maxAttempts === 'number' ? maxAttempts : 100;
    if (typeof Chart !== 'undefined') {
      renderTimeSeriesCharts();
      renderClassificationCharts();
      renderPublicIntelCharts();
      return;
    }
    if (remaining > 0) {
      setTimeout(function () {
        waitForChartJsAndRender(remaining - 1);
      }, 100);
    }
  }

  function aqiCategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for sensitive groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very unhealthy';
    return 'Hazardous';
  }

  function computeFireRisk(tempC, humidity, windKmh) {
    let score = 20;
    score += Math.max(0, (tempC - 28) * 4);
    score += Math.max(0, (55 - humidity) * 0.9);
    score += Math.min(25, windKmh * 0.8);
    score = Math.max(5, Math.min(98, Math.round(score)));
    let label = 'Low';
    if (score >= 70) label = 'Elevated';
    else if (score >= 45) label = 'Moderate';
    else if (score >= 30) label = 'Guarded';
    return { score: score, label: label };
  }

  function buildEnvWarnings(data) {
    const warnings = [];
    const current = data.current || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};
    const code = Number(current.weather_code || 0);
    const wind = Number(current.wind_speed_10m || 0);
    const gust = Number(current.wind_gusts_10m || 0);
    const maxRainChance = Array.isArray(hourly.precipitation_probability)
      ? Math.max.apply(null, hourly.precipitation_probability.slice(0, 24).map(Number))
      : 0;
    const maxDailyWind = Array.isArray(daily.wind_speed_10m_max)
      ? Math.max.apply(null, daily.wind_speed_10m_max.map(Number))
      : wind;
    const maxDailyGust = Array.isArray(daily.wind_gusts_10m_max)
      ? Math.max.apply(null, daily.wind_gusts_10m_max.map(Number))
      : gust;
    const maxPrecipSum = Array.isArray(daily.precipitation_sum)
      ? Math.max.apply(null, daily.precipitation_sum.map(Number))
      : 0;

    if (code >= 95) {
      warnings.push({ level: 'high', icon: 'bi-cloud-lightning-rain', title: 'Thunderstorm watch', text: 'Storm activity flagged for Metro Manila.' });
    }
    if (maxDailyWind >= 45 || maxDailyGust >= 60 || wind >= 40) {
      warnings.push({ level: 'high', icon: 'bi-wind', title: 'Strong wind advisory', text: 'Peak winds near ' + Math.round(Math.max(maxDailyWind, wind)) + ' km/h.' });
    }
    if (maxRainChance >= 70 || maxPrecipSum >= 20) {
      warnings.push({ level: 'high', icon: 'bi-cloud-rain-heavy', title: 'Heavy rain / flood watch', text: 'Rain chance up to ' + Math.round(maxRainChance) + '%.' });
    }
    if ((maxDailyWind >= 62 || maxDailyGust >= 80) && (maxRainChance >= 60 || maxPrecipSum >= 25)) {
      warnings.unshift({ level: 'high', icon: 'bi-tropical-storm', title: 'Tropical storm–like risk', text: 'Combined wind + rain signal elevated storm risk.' });
    }
    if (!warnings.length) {
      warnings.push({ level: 'clear', icon: 'bi-shield-check', title: 'No severe weather flags', text: 'Conditions look manageable for standard ops.' });
    }
    return { warnings: warnings.slice(0, 3), maxRainChance: maxRainChance };
  }

  function renderPublicIntelCharts() {
    const intel = context.publicIntel && typeof context.publicIntel === 'object' ? context.publicIntel : {};
    const totalEl = document.getElementById('anaPublicTotal');
    const emailEl = document.getElementById('anaPublicEmail');
    const smsEl = document.getElementById('anaPublicSms');
    const recentEl = document.getElementById('anaPublicRecent');
    const metaEl = document.getElementById('anaPublicMeta');
    const canvas = document.getElementById('analyticsPublicTopicsChart');

    if (totalEl) totalEl.textContent = String(intel.subscribersTotal || 0);
    if (emailEl) emailEl.textContent = String(intel.subscribersEmail || 0);
    if (smsEl) smsEl.textContent = String(intel.subscribersSms || 0);
    if (recentEl) recentEl.textContent = String(intel.recent7d || 0);
    if (metaEl) {
      metaEl.textContent = (intel.subscribersTotal || 0) + ' active civilian opt-ins across email/SMS channels';
    }

    if (!canvas || typeof Chart === 'undefined') return;
    destroyTrendChart('publicTopics');
    trendCharts.publicTopics = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Weather', 'Announcements', 'Safety'],
        datasets: [{
          data: [
            Number(intel.topicWeather || 0),
            Number(intel.topicAnnouncements || 0),
            Number(intel.topicSafety || 0)
          ],
          backgroundColor: ['#1e6bd6', '#bc1f2d', '#0f766e'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, color: '#64748b' } }
        },
        cutout: '62%'
      }
    });
  }

  async function fetchEnvJson(kind) {
    const proxyUrl = ENV_PROXY + '?kind=' + encodeURIComponent(kind);
    try {
      const proxyRes = await fetch(proxyUrl, { cache: 'no-store', credentials: 'same-origin' });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && data.ok !== false) {
          return data;
        }
      }
    } catch (proxyError) {
      // Fall through to direct Open-Meteo.
    }

    const directUrl = kind === 'aqi'
      ? (
        'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=14.5547&longitude=121.0244'
        + '&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone'
        + '&hourly=us_aqi&timezone=Asia%2FManila&forecast_days=1'
      )
      : (
        'https://api.open-meteo.com/v1/forecast?latitude=14.5547&longitude=121.0244'
        + '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m,apparent_temperature,visibility,surface_pressure'
        + '&hourly=precipitation_probability,weather_code,wind_speed_10m'
        + '&daily=precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunrise,sunset'
        + '&timezone=Asia%2FManila&forecast_days=3'
      );

    const directRes = await fetch(directUrl, { cache: 'no-store' });
    if (!directRes.ok) {
      throw new Error('env_fetch_failed');
    }
    return directRes.json();
  }

  function formatClockFromIso(value) {
    if (!value) {
      return '—';
    }
    const text = String(value);
    const timePart = text.indexOf('T') !== -1 ? text.split('T')[1] : text;
    return timePart.slice(0, 5) || '—';
  }

  async function loadEnvironmentalIntel() {
    try {
      const weather = await fetchEnvJson('weather');
      const current = weather.current || {};
      const temp = Number(current.temperature_2m || 0);
      const feels = Number(current.apparent_temperature || temp);
      const humidity = Number(current.relative_humidity_2m || 0);
      const wind = Number(current.wind_speed_10m || 0);
      const visibilityM = Number(current.visibility || 0);
      const pressure = Number(current.surface_pressure || 0);
      const risk = computeFireRisk(temp, humidity, wind);
      const built = buildEnvWarnings(weather);
      const uv = Array.isArray(weather.daily && weather.daily.uv_index_max)
        ? Number(weather.daily.uv_index_max[0] || 0)
        : 0;
      const sunrise = Array.isArray(weather.daily && weather.daily.sunrise) ? weather.daily.sunrise[0] : '';
      const sunset = Array.isArray(weather.daily && weather.daily.sunset) ? weather.daily.sunset[0] : '';

      const setText = function (id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      };
      setText('anaEnvTemp', Math.round(temp) + '°');
      setText('anaEnvFeels', Math.round(feels) + '°');
      setText('anaEnvWind', Math.round(wind) + ' km/h');
      setText('anaEnvRain', Math.round(built.maxRainChance || 0) + '%');
      setText('anaEnvFireRisk', risk.label);
      setText('anaEnvUv', uv ? uv.toFixed(1) : '—');
      setText('anaEnvHumidity', Math.round(humidity) + '%');
      setText('anaEnvVisibility', visibilityM ? (Math.round(visibilityM / 1000 * 10) / 10) + ' km' : '—');
      setText('anaEnvPressure', pressure ? Math.round(pressure) + ' hPa' : '—');
      setText('anaEnvSunrise', formatClockFromIso(sunrise));
      setText('anaEnvSunset', formatClockFromIso(sunset));

      const warningsEl = document.getElementById('analyticsEnvWarnings');
      if (warningsEl) {
        warningsEl.innerHTML = built.warnings.map(function (w) {
          return (
            '<article class="ana-env-warning ' + (w.level === 'high' ? 'is-high' : (w.level === 'clear' ? 'is-clear' : '')) + '">' +
              '<i class="bi ' + w.icon + '" aria-hidden="true"></i>' +
              '<div><strong>' + w.title + '</strong><p>' + w.text + '</p></div>' +
            '</article>'
          );
        }).join('');
      }
    } catch (error) {
      const warningsEl = document.getElementById('analyticsEnvWarnings');
      if (warningsEl) warningsEl.innerHTML = '<p class="ana-load-empty">Weather intel unavailable.</p>';
    }

    try {
      const aqiData = await fetchEnvJson('aqi');
      const current = aqiData.current || {};
      const aqi = Number(current.us_aqi || 0);
      const setText = function (id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      };
      setText('anaAqiValue', aqi ? String(Math.round(aqi)) : '—');
      setText('anaAqiLabel', aqi ? aqiCategory(aqi) : 'No AQI data');
      setText('anaPm25', current.pm2_5 != null ? Number(current.pm2_5).toFixed(1) : '—');
      setText('anaPm10', current.pm10 != null ? Number(current.pm10).toFixed(1) : '—');
      setText('anaNo2', current.nitrogen_dioxide != null ? Number(current.nitrogen_dioxide).toFixed(1) : '—');
      setText('anaO3', current.ozone != null ? Number(current.ozone).toFixed(1) : '—');
      const bar = document.getElementById('anaAqiBar');
      if (bar) bar.style.width = Math.max(8, Math.min(100, aqi / 3)) + '%';

      const canvas = document.getElementById('analyticsAqiTrendChart');
      if (canvas && typeof Chart !== 'undefined' && Array.isArray(aqiData.hourly && aqiData.hourly.us_aqi)) {
        const labels = (aqiData.hourly.time || []).slice(0, 12).map(function (t) {
          return String(t).slice(11, 16);
        });
        const values = aqiData.hourly.us_aqi.slice(0, 12).map(Number);
        destroyTrendChart('aqiTrend');
        trendCharts.aqiTrend = new Chart(canvas.getContext('2d'), {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              data: values,
              borderColor: '#7c3aed',
              backgroundColor: 'rgba(124, 58, 237, 0.12)',
              fill: true,
              tension: 0.35,
              pointRadius: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#94a3b8', precision: 0 }, grid: { color: 'rgba(148,163,184,0.16)' } },
              x: { ticks: { color: '#94a3b8', maxRotation: 0 }, grid: { display: false } }
            }
          }
        });
      }
    } catch (error) {
      const label = document.getElementById('anaAqiLabel');
      if (label) label.textContent = 'Air quality feed offline';
    }
  }

  loadEnvironmentalIntel();
  renderPublicIntelCharts();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      waitForGoogleMapsAndRender();
      waitForChartJsAndRender();
    });
  } else {
    waitForGoogleMapsAndRender();
    waitForChartJsAndRender();
  }

  syncLiveIncidentSelector();
  syncLayerToggleButtons();
  syncStationDisplayAvailability();

  if (analyticsLiveIncidentSelect) {
    analyticsLiveIncidentSelect.addEventListener('change', function () {
      selectedLiveIncidentId = normalizeIncidentId(analyticsLiveIncidentSelect.value);
      renderAnalyticsMap();
    });
  }

  layerToggleButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      toggleLayerVisibility(button.getAttribute('data-layer-toggle'));
    });
  });

  if (analyticsIncidentStatusFilter) {
    analyticsIncidentStatusFilter.addEventListener('change', function () {
      incidentStatusFilter = String(analyticsIncidentStatusFilter.value || 'all').toLowerCase();
      renderAnalyticsMap();
    });
  }

  if (analyticsIncidentAlarmFilter) {
    analyticsIncidentAlarmFilter.addEventListener('change', function () {
      incidentAlarmMin = Math.max(1, Number(analyticsIncidentAlarmFilter.value || 1));
      renderAnalyticsMap();
    });
  }

  if (analyticsFitBoundsBtn) {
    analyticsFitBoundsBtn.addEventListener('click', fitVisibleBounds);
  }

  if (analyticsRecenterBtn) {
    analyticsRecenterBtn.addEventListener('click', recenterMakati);
  }

  if (analyticsScopeCurrent) {
    analyticsScopeCurrent.addEventListener('change', syncIncidentScopeUi);
  }

  if (analyticsScopeHistory) {
    analyticsScopeHistory.addEventListener('change', syncIncidentScopeUi);
  }

  if (analyticsToggleStationNames) {
    analyticsToggleStationNames.addEventListener('click', toggleStationNames);
  }

  if (analyticsToggleStationAor) {
    analyticsToggleStationAor.addEventListener('click', toggleStationAor);
  }
})();