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
  const layerFilterButtons = Array.from(document.querySelectorAll('[data-layer-filter]'));

  let analyticsMapInstance = null;
  let heatmapLayer = null;
  let stationMarkers = [];
  let hydrantMarkers = [];
  let routePolylines = [];
  let routeMarkers = [];
  let selectedLiveIncidentId = null;
  let routeRenderSequence = 0;
  let activeLayerFilter = 'all';

  if (analyticsWelcome) {
    const scopeText = context.incidentScopeLabel || 'Current incidents';
    analyticsWelcome.textContent = 'Signed in as ' + (context.user || 'Unknown User') + '. This page shows ' + scopeText.toLowerCase() + ' across Makati.';
  }

  if (analyticsRoleTitle) {
    analyticsRoleTitle.textContent = context.roleTitle || 'User';
  }

  if (analyticsRoleSummary) {
    analyticsRoleSummary.textContent = context.roleSummary || '';
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
    const hydrantLabel = context.hydrantSourceLabel || 'OpenStreetMap public hydrants';
    analyticsMapMeta.textContent = scopeLabel + ' | ' + String(stationCount) + ' stations, ' + String(incidentCount) + ' incident heat points, ' + String(hydrantCount) + ' hydrants, and ' + String(liveIncidentCount) + ' live incidents. Source: ' + hydrantLabel + '.';
  }

  if (analyticsMapSource) {
    analyticsMapSource.textContent = context.hydrantNotice || 'Hydrants will use the public OpenStreetMap layer when available.';
  }

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
      analyticsRouteEtaList.innerHTML = '<div class="analytics-route-eta-item"><div class="analytics-route-eta-meta">No live incident is currently available for route ETA.</div></div>';
      return;
    }

    if (!items || items.length === 0) {
      analyticsRouteEtaList.innerHTML = '<div class="analytics-route-eta-item"><div class="analytics-route-eta-meta">No responding station route is available for this incident yet.</div></div>';
      return;
    }

    const html = items.map(function (item, index) {
      const stationName = item.stationName || 'Station';
      const stationCode = item.stationCode ? ' (' + item.stationCode + ')' : '';
      const etaLabelRaw = item.etaText || formatDurationSeconds(item.etaSeconds);
      const etaLabel = /^eta\b/i.test(String(etaLabelRaw)) ? String(etaLabelRaw) : ('ETA ' + String(etaLabelRaw));
      const distanceLabel = item.distanceText || formatDistanceMeters(item.distanceMeters);
      const dispatchLabel = item.dispatchOrder ? 'Dispatch #' + String(item.dispatchOrder) : 'Assigned';
      return '<div class="analytics-route-eta-item">'
        + '<div class="analytics-route-eta-top">'
        + '<span class="analytics-route-eta-name">' + String(index + 1) + '. ' + stationName + stationCode + '</span>'
        + '<span class="analytics-route-eta-chip">' + etaLabel + '</span>'
        + '</div>'
        + '<div class="analytics-route-eta-meta">' + dispatchLabel + ' | ' + distanceLabel + '</div>'
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

  function normalizeLayerFilter(value) {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'heatmap' || normalized === 'hydrants') {
      return normalized;
    }
    return 'all';
  }

  function syncLayerFilterButtons() {
    layerFilterButtons.forEach(function (button) {
      const isActive = String(button.getAttribute('data-layer-filter') || '') === activeLayerFilter;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function setLayerFilter(value) {
    activeLayerFilter = normalizeLayerFilter(value);
    syncLayerFilterButtons();
    renderAnalyticsMap();
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

    hydrantMarkers.forEach(function (marker) {
      marker.setMap(null);
    });
    hydrantMarkers = [];

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
      stylers: [{ color: '#edf2f7' }]
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#516176' }]
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#edf2f7' }]
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
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [{ color: '#d5dde7' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9e2f4' }]
    },
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#cad5e2' }]
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
    const incidents = Array.isArray(context.incidentHeatmapPoints) ? context.incidentHeatmapPoints : [];
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
        backgroundColor: '#edf2f7',
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
    const showStations = activeLayerFilter === 'all';
    const showHeatmap = activeLayerFilter !== 'hydrants';
    const showHydrants = activeLayerFilter !== 'heatmap';

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    if (showStations) {
      stations.forEach(function (station) {
        const latitude = Number(station.latitude || 0);
        const longitude = Number(station.longitude || 0);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
          return;
        }

        const position = { lat: latitude, lng: longitude };
        hasPoints = true;
        bounds.extend(position);

        const marker = new window.google.maps.Marker({
          position: position,
          map: map,
          title: String(station.stationName || station.stationCode || 'Station'),
          icon: buildStationSymbol('#1e6bd6')
        });
        stationMarkers.push(marker);
      });
    }

    const heatmapData = [];
    if (showHeatmap) {
      incidents.forEach(function (incident) {
        const latitude = Number(incident.lat || 0);
        const longitude = Number(incident.lng || 0);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
          return;
        }

        hasPoints = true;
        bounds.extend({ lat: latitude, lng: longitude });
        heatmapData.push({
          location: new window.google.maps.LatLng(latitude, longitude),
          weight: Number(incident.weight || 1)
        });
      });

      if (heatmapData.length > 0) {
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

        const marker = new window.google.maps.Marker({
          position: position,
          map: map,
          title: String(hydrant.hydrantName || 'Fire Hydrant'),
          icon: buildHydrantSymbol('#ff8a2a')
        });
        hydrantMarkers.push(marker);
      });
    }

    renderLiveRoutes(map, bounds);

    if (hasPoints) {
      map.fitBounds(bounds, 36);
    }

    const layerLabel = activeLayerFilter === 'hydrants' ? 'Hydrants only' : activeLayerFilter === 'heatmap' ? 'Heatmap only' : 'All useful layers';
    updateMapStatus(layerLabel + ' loaded with ' + String(showStations ? stations.length : 0) + ' stations, ' + String(showHeatmap ? heatmapData.length : 0) + ' incident heat points, and ' + String(showHydrants ? hydrants.length : 0) + ' hydrants. Select a live incident to view station route ETAs.');
  }

  function waitForGoogleMapsAndRender() {
    if (window.google && window.google.maps && window.google.maps.Map && window.google.maps.visualization && window.google.maps.visualization.HeatmapLayer) {
      renderAnalyticsMap();
    } else {
      setTimeout(waitForGoogleMapsAndRender, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForGoogleMapsAndRender);
  } else {
    waitForGoogleMapsAndRender();
  }

  syncLiveIncidentSelector();
  syncLayerFilterButtons();

  if (analyticsLiveIncidentSelect) {
    analyticsLiveIncidentSelect.addEventListener('change', function () {
      selectedLiveIncidentId = normalizeIncidentId(analyticsLiveIncidentSelect.value);
      renderAnalyticsMap();
    });
  }

  layerFilterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setLayerFilter(button.getAttribute('data-layer-filter'));
    });
  });
})();