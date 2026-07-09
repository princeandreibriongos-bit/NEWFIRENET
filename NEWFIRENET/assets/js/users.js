(function () {
  const contextElement = document.getElementById('adminSettingsContext');
  const usersTableBody = document.getElementById('usersTableBody');
  const usersWelcomeText = document.getElementById('usersWelcomeText');
  const usersHeroTitle = document.getElementById('usersHeroTitle');
  const openUserModalBtn = document.getElementById('openUserModalBtn');
  const openSubstationModalBtn = document.getElementById('openSubstationModalBtn');
  const refreshUsersBtn = document.getElementById('refreshUsersBtn');
  const userModal = document.getElementById('userModal');
  const closeUserModalBtn = document.getElementById('closeUserModalBtn');
  const userForm = document.getElementById('userForm');
  const userIdInput = document.getElementById('userIdInput');
  const usernameInput = document.getElementById('usernameInput');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const roleSelect = document.getElementById('roleSelect');
  const stationSelect = document.getElementById('stationSelect');
  const positionSelect = document.getElementById('positionSelect');
  const statusSelect = document.getElementById('statusSelect');
  const securityAlertsInput = document.getElementById('securityAlertsInput');
  const hideSensitiveInput = document.getElementById('hideSensitiveInput');
  const autoLogoutInput = document.getElementById('autoLogoutInput');
  const warningModal = document.getElementById('warningModal');
  const closeWarningModalBtn = document.getElementById('closeWarningModalBtn');
  const warningForm = document.getElementById('warningForm');
  const warningUserIdInput = document.getElementById('warningUserIdInput');
  const warningTypeInput = document.getElementById('warningTypeInput');
  const warningTemplateInput = document.getElementById('warningTemplateInput');
  const warningMessageInput = document.getElementById('warningMessageInput');
  const warningPrintBtn = document.getElementById('warningPrintBtn');
  const cancelWarningBtn = document.getElementById('cancelWarningBtn');
  const warningFormMessage = document.getElementById('warningFormMessage');
  const userActionsModal = document.getElementById('userActionsModal');
  const closeUserActionsModalBtn = document.getElementById('closeUserActionsModalBtn');
  const actionUserName = document.getElementById('actionUserName');
  const actionUserRole = document.getElementById('actionUserRole');
  const actionUserEmail = document.getElementById('actionUserEmail');
  const actionUserStation = document.getElementById('actionUserStation');
  const actionUserStatus = document.getElementById('actionUserStatus');
  const actionUserWarnings = document.getElementById('actionUserWarnings');
  const openEditFromActionsBtn = document.getElementById('openEditFromActionsBtn');
  const openWarningFromActionsBtn = document.getElementById('openWarningFromActionsBtn');
  const toggleStatusBtn = document.getElementById('toggleStatusBtn');
  const deleteUserBtn = document.getElementById('deleteUserBtn');
  const userActionsFormMessage = document.getElementById('userActionsFormMessage');
  const deleteUserModal = document.getElementById('deleteUserModal');
  const closeDeleteUserModalBtn = document.getElementById('closeDeleteUserModalBtn');
  const cancelDeleteUserBtn = document.getElementById('cancelDeleteUserBtn');
  const confirmDeleteUserBtn = document.getElementById('confirmDeleteUserBtn');
  const deleteUserName = document.getElementById('deleteUserName');
  const deleteUserMeta = document.getElementById('deleteUserMeta');
  const deleteUserMessage = document.getElementById('deleteUserMessage');
  const userFormMessage = document.getElementById('userFormMessage');
  const userTotalCount = document.getElementById('userTotalCount');
  const userAdminCount = document.getElementById('userAdminCount');
  const userActiveCount = document.getElementById('userActiveCount');
  const userStationCount = document.getElementById('userStationCount');
  const usersVisibleCount = document.getElementById('usersVisibleCount');
  const usersTotalMetaCount = document.getElementById('usersTotalMetaCount');
  const userSearchInput = document.getElementById('userSearchInput');
  const userStationFilter = document.getElementById('userStationFilter');
  const userStationFilterWrap = document.getElementById('userStationFilterWrap');
  const userRoleFilter = document.getElementById('userRoleFilter');
  const userWarningsFilter = document.getElementById('userWarningsFilter');
  const usersTabButtons = Array.prototype.slice.call(document.querySelectorAll('[data-users-tab]'));
  const usersTabPanels = Array.prototype.slice.call(document.querySelectorAll('[data-users-panel]'));
  const barangayPanel = document.getElementById('barangayPanel');
  const barangayForm = document.getElementById('barangayForm');
  const barangayNameInput = document.getElementById('barangayNameInput');
  const barangayCodeInput = document.getElementById('barangayCodeInput');
  const barangayLocationInput = document.getElementById('barangayLocationInput');
  const barangayLatitudeInput = document.getElementById('barangayLatitudeInput');
  const barangayLongitudeInput = document.getElementById('barangayLongitudeInput');
  const barangayStatusInput = document.getElementById('barangayStatusInput');
  const barangayAorRadiusInput = document.getElementById('barangayAorRadiusInput');
  const barangayMap = document.getElementById('barangayMap');
  const barangayMapMeta = document.getElementById('barangayMapMeta');
  const barangayModal = document.getElementById('barangayModal');
  const barangayModalTitle = document.getElementById('barangayModalTitle');
  const closeBarangayModalBtn = document.getElementById('closeBarangayModalBtn');
  const createBarangayAdminInput = document.getElementById('createBarangayAdminInput');
  const barangayAdminFields = document.getElementById('barangayAdminFields');
  const barangayAdminUsernameInput = document.getElementById('barangayAdminUsernameInput');
  const barangayAdminEmailInput = document.getElementById('barangayAdminEmailInput');
  const barangayAdminPasswordInput = document.getElementById('barangayAdminPasswordInput');
  const barangayFormMessage = document.getElementById('barangayFormMessage');
  const barangayStationIdInput = document.getElementById('barangayStationIdInput');
  const resetBarangayBtn = document.getElementById('resetBarangayBtn');
  const substationsTableBody = document.getElementById('substationsTableBody');
  const substationTotalCount = document.getElementById('substationTotalCount');

  // News manager (optional - only for admin settings page)
  const openNewsModalBtn = document.getElementById('openNewsModalBtn');
  const newsModal = document.getElementById('newsModal');
  const closeNewsModalBtn = document.getElementById('closeNewsModalBtn');
  const newsForm = document.getElementById('newsForm');
  const newsPhotoInput = document.getElementById('newsPhotoInput');
  const newsTitleInput = document.getElementById('newsTitleInput');
  const newsBodyInput = document.getElementById('newsBodyInput');
  const newsStatusSelect = document.getElementById('newsStatusSelect');
  const cancelNewsBtn = document.getElementById('cancelNewsBtn');
  const publishNewsBtn = document.getElementById('publishNewsBtn');
  const newsFormMessage = document.getElementById('newsFormMessage');

  // Announcements manager (optional - only for admin settings page)
  const openAnnouncementModalBtn = document.getElementById('openAnnouncementModalBtn');
  const announcementModal = document.getElementById('announcementModal');
  const closeAnnouncementModalBtn = document.getElementById('closeAnnouncementModalBtn');
  const announcementForm = document.getElementById('announcementForm');
  const announcementPhotoInput = document.getElementById('announcementPhotoInput');
  const announcementTitleInput = document.getElementById('announcementTitleInput');
  const announcementBodyInput = document.getElementById('announcementBodyInput');
  const announcementTypeInput = document.getElementById('announcementTypeInput');
  const announcementAudienceInput = document.getElementById('announcementAudienceInput');
  const announcementExpiresAtInput = document.getElementById('announcementExpiresAtInput');
  const announcementStatusSelect = document.getElementById('announcementStatusSelect');
  const cancelAnnouncementBtn = document.getElementById('cancelAnnouncementBtn');
  const publishAnnouncementBtn = document.getElementById('publishAnnouncementBtn');
  const announcementFormMessage = document.getElementById('announcementFormMessage');

  if (
    !contextElement ||
    !usersTableBody || !usersWelcomeText || !openUserModalBtn || !refreshUsersBtn || !userModal ||
    !closeUserModalBtn || !userForm || !userIdInput || !usernameInput || !emailInput || !passwordInput || !roleSelect ||
    !stationSelect || !positionSelect || !statusSelect || !securityAlertsInput || !hideSensitiveInput || !autoLogoutInput ||
    !warningModal || !closeWarningModalBtn || !warningForm || !warningUserIdInput || !warningTypeInput || !warningTemplateInput || !warningMessageInput || !warningPrintBtn || !cancelWarningBtn || !warningFormMessage ||
    !userFormMessage
  ) {
    // Continue so news publishing can still work even if the users UI is partially missing.
  }

  let context = {};
  try {
    context = JSON.parse(contextElement.textContent || '{}') || {};
  } catch (error) {
    context = {};
  }

  const apiUrl = String(context.adminSettingsApiUrl || '/firenet/NEWFIRENET/backend/controllers/users.php');
  const isAdminPage = String(context.role || 'user').toLowerCase() === 'admin';
  const isSuperadminPage = String(context.role || 'user').toLowerCase() === 'superadmin';
  const usersTabStorageKey = 'firenet.usersActiveTab';
  const state = {
    bootstrap: null,
    users: [],
    roles: [],
    stations: [],
    positions: [],
    search: '',
    stationFilter: String(context.stationId || ''),
    roleFilter: '',
    warningsFilter: ''
  };

  let activeActionUser = null;
  let pendingDeleteUser = null;
  let barangayMapInstance = null;
  let barangayMapMarker = null;
  let barangayAorCircle = null;
  let pendingBarangayStation = null;
  let barangayAutosaveTimer = null;
  let barangayGeocoder = null;
  let barangayGeocodeTimer = null;
  let barangayGeocodeSeq = 0;
  let barangayIsPopulating = false;
  let toastHost = null;

  function ensureToastHost() {
    if (toastHost) {
      return toastHost;
    }
    toastHost = document.createElement('div');
    toastHost.className = 'users-toast-host';
    toastHost.setAttribute('aria-live', 'polite');
    toastHost.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastHost);
    return toastHost;
  }

  function showToast(message, isError) {
    const text = String(message || '').trim();
    if (text === '') {
      return;
    }

    const host = ensureToastHost();
    const toast = document.createElement('div');
    toast.className = 'users-toast' + (isError ? ' is-error' : ' is-success');
    toast.textContent = text;
    host.appendChild(toast);

    window.setTimeout(function () {
      toast.classList.add('is-leaving');
      window.setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 220);
    }, 3200);
  }

  function readRequestedTab() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const requested = String(params.get('tab') || '').toLowerCase();
      return ['accounts', 'news', 'notices', 'substations'].indexOf(requested) >= 0 ? requested : '';
    } catch (error) {
      return '';
    }
  }

  function setActiveTab(tabName) {
    const nextTab = ['accounts', 'news', 'notices', 'substations'].indexOf(String(tabName || '')) >= 0 ? String(tabName) : 'accounts';

    usersTabButtons.forEach(function (button) {
      const isActive = button.getAttribute('data-users-tab') === nextTab;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    usersTabPanels.forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-users-panel') !== nextTab;
    });

    try {
      localStorage.setItem(usersTabStorageKey, nextTab);
    } catch (error) {
      // ignore storage failures
    }

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', nextTab);
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      // ignore URL update failures
    }

    if (usersHeroTitle) {
      usersHeroTitle.textContent = nextTab === 'substations' ? 'Substations' : 'Admin Settings';
    }
    if (usersWelcomeText) {
      if (nextTab === 'substations') {
        usersWelcomeText.textContent = 'Create, edit, and review all substations and assigned coordinates across the district.';
      } else if (isSuperadminPage) {
        usersWelcomeText.textContent = 'Manage substations, assigned admins, personnel accounts, login updates, and public notices across all stations.';
      } else {
        usersWelcomeText.textContent = 'Manage users, publishing tools, and station activity for ' + String((state.bootstrap && state.bootstrap.currentStation && state.bootstrap.currentStation.stationName) || context.stationName || 'your station') + '.';
      }
    }
    if (openUserModalBtn) {
      openUserModalBtn.hidden = nextTab === 'substations';
    }
    if (openSubstationModalBtn) {
      openSubstationModalBtn.hidden = nextTab !== 'substations' || !isSuperadminPage;
    }
  }

  function setBarangayMessage(text, isError) {
    if (!barangayFormMessage) {
      return;
    }
    barangayFormMessage.textContent = text;
    barangayFormMessage.style.color = isError ? '#a61d2a' : '#2e5b3f';
  }

  function setBarangayCoordinates(lat, lng) {
    if (!barangayLatitudeInput || !barangayLongitudeInput) {
      return;
    }
    barangayLatitudeInput.value = Number(lat).toFixed(8);
    barangayLongitudeInput.value = Number(lng).toFixed(8);
  }

  function initBarangayMap() {
    if (!isSuperadminPage || !barangayMap) {
      return true;
    }

    if (!window.google || !window.google.maps) {
      return false;
    }

    if (!barangayGeocoder && window.google.maps.Geocoder) {
      barangayGeocoder = new window.google.maps.Geocoder();
    }

    barangayMapInstance = new window.google.maps.Map(barangayMap, {
      center: { lat: 14.5547, lng: 121.0244 },
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    barangayMapInstance.addListener('click', function (event) {
      if (!event || !event.latLng) {
        return;
      }

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setBarangayCoordinates(lat, lng);

      if (barangayMapMarker) {
        barangayMapMarker.setMap(null);
      }

      barangayMapMarker = new window.google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: barangayMapInstance,
        title: 'New barangay pin'
      });

      if (barangayMapMeta) {
        barangayMapMeta.textContent = 'Substation pinned at ' + Number(lat).toFixed(6) + ', ' + Number(lng).toFixed(6) + '.';
      }
    });

    return true;
  }

  function activateBarangayMap() {
    if (!isSuperadminPage || !barangayMap) {
      return;
    }

    if (initBarangayMap()) {
      return;
    }

    if (context.googleMapsConfigured) {
      if (barangayMapMeta) {
        barangayMapMeta.textContent = 'Loading map...';
      }

      let attempts = 0;
      const maxAttempts = 25;
      const timer = window.setInterval(function () {
        attempts += 1;
        if (initBarangayMap()) {
          window.clearInterval(timer);
          if (barangayMapMeta) {
            barangayMapMeta.textContent = 'Click on the map to pin the new substation location.';
          }
          return;
        }

        if (attempts >= maxAttempts) {
          window.clearInterval(timer);
          barangayLatitudeInput.readOnly = false;
          barangayLongitudeInput.readOnly = false;
          if (barangayMapMeta) {
            barangayMapMeta.textContent = 'Google Maps is unavailable. Enter the substation latitude and longitude manually.';
          }
        }
      }, 400);
      return;
    }

    barangayLatitudeInput.readOnly = false;
    barangayLongitudeInput.readOnly = false;
    if (barangayMapMeta) {
      barangayMapMeta.textContent = 'Google Maps is unavailable. Enter the substation latitude and longitude manually.';
    }
  }

  function toggleBarangayAdminFields() {
    if (!createBarangayAdminInput || !barangayAdminFields) {
      return;
    }
    barangayAdminFields.hidden = !createBarangayAdminInput.checked;
  }

  function resetBarangayForm() {
    barangayIsPopulating = true;
    if (barangayForm) {
      barangayForm.reset();
    }
    if (barangayStationIdInput) {
      barangayStationIdInput.value = '';
    }
    if (barangayStatusInput) {
      barangayStatusInput.value = 'active';
    }
    if (barangayAorRadiusInput) {
      barangayAorRadiusInput.value = '2.5';
    }
    if (createBarangayAdminInput) {
      createBarangayAdminInput.checked = false;
    }
    toggleBarangayAdminFields();
    if (barangayMapMarker) {
      barangayMapMarker.setMap(null);
      barangayMapMarker = null;
    }
    if (barangayAorCircle) {
      barangayAorCircle.setMap(null);
      barangayAorCircle = null;
    }
    pendingBarangayStation = null;
    if (barangayMapMeta) {
      barangayMapMeta.textContent = 'Click on the map to pin the new substation location.';
    }
    setBarangayMessage('Ready to create a new substation.', false);
    if (barangayModalTitle) {
      barangayModalTitle.textContent = 'Create Substation';
    }
    if (barangayAutosaveTimer) {
      window.clearTimeout(barangayAutosaveTimer);
      barangayAutosaveTimer = null;
    }
    barangayIsPopulating = false;
  }

  function openBarangayModal() {
    if (!barangayModal) {
      return;
    }
    barangayModal.hidden = false;
    document.body.style.overflow = 'hidden';
    activateBarangayMap();
    if (barangayMapInstance && window.google && window.google.maps) {
      window.setTimeout(function () {
        window.google.maps.event.trigger(barangayMapInstance, 'resize');
        if (pendingBarangayStation) {
          renderBarangayMapSelection(pendingBarangayStation);
        }
      }, 80);
    }
  }

  function closeBarangayModal() {
    if (!barangayModal) {
      return;
    }
    barangayModal.hidden = true;
    document.body.style.overflow = '';
  }

  function renderBarangayMapSelection(station) {
    if (!station || !barangayMapInstance || !window.google || !window.google.maps) {
      return;
    }

    const stationLat = Number(station.latitude);
    const stationLng = Number(station.longitude);
    if (!Number.isFinite(stationLat) || !Number.isFinite(stationLng)) {
      return;
    }

    const position = { lat: stationLat, lng: stationLng };
    if (barangayMapMarker) {
      barangayMapMarker.setMap(null);
    }
    if (barangayAorCircle) {
      barangayAorCircle.setMap(null);
      barangayAorCircle = null;
    }

    barangayMapMarker = new window.google.maps.Marker({
      position: position,
      map: barangayMapInstance,
      title: String(station.stationName || 'Substation'),
      animation: window.google.maps.Animation ? window.google.maps.Animation.DROP : undefined
    });

    const aorCenterLat = Number(station.aorCenterLat != null ? station.aorCenterLat : station.latitude);
    const aorCenterLng = Number(station.aorCenterLng != null ? station.aorCenterLng : station.longitude);
    const aorRadiusKm = Number(station.aorRadiusKm != null ? station.aorRadiusKm : 0);
    if (Number.isFinite(aorCenterLat) && Number.isFinite(aorCenterLng) && Number.isFinite(aorRadiusKm) && aorRadiusKm > 0) {
      barangayAorCircle = new window.google.maps.Circle({
        map: barangayMapInstance,
        center: { lat: aorCenterLat, lng: aorCenterLng },
        radius: aorRadiusKm * 1000,
        strokeColor: '#ff5f6d',
        strokeOpacity: 0.95,
        strokeWeight: 2,
        fillColor: '#ff5f6d',
        fillOpacity: 0.14
      });
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(position);
      bounds.extend(new window.google.maps.LatLng(aorCenterLat, aorCenterLng));
      const latOffset = aorRadiusKm / 111;
      const lngOffset = aorRadiusKm / Math.max(0.2, 111 * Math.cos((aorCenterLat * Math.PI) / 180));
      bounds.extend(new window.google.maps.LatLng(aorCenterLat + latOffset, aorCenterLng + lngOffset));
      bounds.extend(new window.google.maps.LatLng(aorCenterLat - latOffset, aorCenterLng - lngOffset));
      barangayMapInstance.fitBounds(bounds, 32);
    } else {
      barangayMapInstance.setCenter(position);
      barangayMapInstance.setZoom(15);
    }
  }

  function readBarangayDraft() {
    return {
      stationId: String(barangayStationIdInput ? barangayStationIdInput.value : '').trim(),
      stationName: String(barangayNameInput ? barangayNameInput.value : '').trim(),
      stationCode: String(barangayCodeInput ? barangayCodeInput.value : '').trim(),
      location: String(barangayLocationInput ? barangayLocationInput.value : '').trim(),
      latitude: barangayLatitudeInput ? Number(barangayLatitudeInput.value || 0) : 0,
      longitude: barangayLongitudeInput ? Number(barangayLongitudeInput.value || 0) : 0,
      status: String(barangayStatusInput ? barangayStatusInput.value : 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active',
      aorRadiusKm: barangayAorRadiusInput ? Number(barangayAorRadiusInput.value || 0) : 0
    };
  }

  function buildBarangayGeocodeQuery() {
    const address = String(barangayLocationInput ? barangayLocationInput.value : '').trim();
    const stationName = String(barangayNameInput ? barangayNameInput.value : '').trim();
    if (address === '') {
      return '';
    }
    const parts = [];
    if (stationName !== '') {
      parts.push(stationName);
    }
    parts.push(address);
    const joined = parts.join(', ');
    if (/makati/i.test(joined)) {
      return joined;
    }
    return joined + ', Makati City, Metro Manila, Philippines';
  }

  function buildBarangayGeocodeCandidates() {
    const address = String(barangayLocationInput ? barangayLocationInput.value : '').trim();
    const stationName = String(barangayNameInput ? barangayNameInput.value : '').trim();
    if (address === '') {
      return [];
    }

    const candidates = [];
    function pushCandidate(parts) {
      const text = parts.filter(Boolean).join(', ').replace(/\s{2,}/g, ' ').trim();
      if (text !== '') {
        candidates.push(text);
      }
    }

    pushCandidate([address]);
    pushCandidate([address, 'Makati City']);
    pushCandidate([address, 'Makati City', 'Metro Manila']);
    pushCandidate([address, 'Makati City', 'Metro Manila', 'Philippines']);

    if (stationName !== '') {
      pushCandidate([stationName, address]);
      pushCandidate([stationName, address, 'Makati City']);
      pushCandidate([stationName, address, 'Makati City', 'Metro Manila']);
    }

    return Array.from(new Set(candidates)).slice(0, 8);
  }

  function parseBarangayAddressParts() {
    const raw = String(barangayLocationInput ? barangayLocationInput.value : '').trim();
    const parts = raw.split(',').map(function (part) {
      return String(part || '').trim();
    }).filter(Boolean);

    let streetName = parts[0] || raw;
    let barangay = '';
    let landmark = '';

    parts.forEach(function (part, index) {
      if (/^(?:barangay|brgy\.?|brgy)\b/i.test(part)) {
        barangay = part.replace(/^(?:barangay|brgy\.?|brgy)\s*/i, '').trim();
      } else if (index > 0) {
        landmark = landmark ? (landmark + ', ' + part) : part;
      }
    });

    if (barangay === '' && /(?:barangay|brgy\.?|brgy)\s+([a-z0-9\-\s]+)/i.test(raw)) {
      const match = raw.match(/(?:barangay|brgy\.?|brgy)\s+([a-z0-9\-\s]+)/i);
      barangay = match && match[1] ? String(match[1]).trim() : '';
    }

    return {
      streetName: streetName,
      barangay: barangay,
      landmark: landmark
    };
  }

  function updateBarangayInputsFromGeocode(lat, lng, formattedAddress) {
    if (!barangayLatitudeInput || !barangayLongitudeInput) {
      return;
    }
    barangayIsPopulating = true;
    barangayLatitudeInput.value = Number(lat).toFixed(8);
    barangayLongitudeInput.value = Number(lng).toFixed(8);
    if (barangayLocationInput && formattedAddress && String(barangayLocationInput.value || '').trim() === '') {
      barangayLocationInput.value = formattedAddress;
    }
    barangayIsPopulating = false;
  }

  function geocodeBarangayAddress() {
    if (!context.googleMapsConfigured || !window.google || !window.google.maps || !barangayGeocoder) {
      return;
    }
    const candidates = buildBarangayGeocodeCandidates();
    if (candidates.length === 0) {
      return;
    }
    const seq = ++barangayGeocodeSeq;
    if (barangayMapMeta) {
      barangayMapMeta.textContent = 'Locating address on the map...';
    }

    const addressParts = parseBarangayAddressParts();
    const locateUrl = new URL('/firenet/NEWFIRENET/backend/controllers/reports.php', window.location.origin);
    locateUrl.searchParams.set('action', 'locate');
    locateUrl.searchParams.set('streetName', addressParts.streetName);
    if (addressParts.barangay) {
      locateUrl.searchParams.set('barangay', addressParts.barangay);
    }
    if (addressParts.landmark) {
      locateUrl.searchParams.set('landmark', addressParts.landmark);
    }
    locateUrl.searchParams.set('alarmLevel', '1');

    fetch(locateUrl.toString(), { method: 'GET', credentials: 'same-origin' })
      .then(function (response) {
        return response.text().then(function (text) {
          return { ok: response.ok, text: text };
        });
      })
      .then(function (result) {
        if (seq !== barangayGeocodeSeq) {
          return;
        }
        let payload = null;
        try {
          payload = result.text ? JSON.parse(result.text) : null;
        } catch (error) {
          payload = null;
        }

        const latitude = payload && payload.latitude != null ? Number(payload.latitude) : null;
        const longitude = payload && payload.longitude != null ? Number(payload.longitude) : null;
        const displayAddress = payload && payload.displayAddress ? String(payload.displayAddress) : '';
        if (result.ok && payload && payload.ok === true && Number.isFinite(latitude) && Number.isFinite(longitude)) {
          updateBarangayInputsFromGeocode(latitude, longitude, displayAddress);
          updateBarangayMapPreviewFromInputs();
          if (barangayMapMeta) {
            barangayMapMeta.textContent = 'Address located near ' + Number(latitude).toFixed(6) + ', ' + Number(longitude).toFixed(6) + '.';
          }
          const stationId = String(barangayStationIdInput ? barangayStationIdInput.value : '').trim();
          if (stationId !== '') {
            queueBarangayAutosave();
          }
          return;
        }

        runCandidate(0);
      })
      .catch(function () {
        if (seq !== barangayGeocodeSeq) {
          return;
        }
        runCandidate(0);
      });

    function runCandidate(index) {
      if (seq !== barangayGeocodeSeq) {
        return;
      }
      if (index >= candidates.length) {
        if (barangayMapMeta) {
          barangayMapMeta.textContent = 'Address could not be located exactly. You can still click the map or enter coordinates manually.';
        }
        return;
      }

      const address = candidates[index];
      const requests = [
        {
          address: address,
          region: 'ph',
          componentRestrictions: { country: 'PH' },
          bounds: new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(14.49, 120.98),
            new window.google.maps.LatLng(14.62, 121.09)
          )
        },
        { address: address, region: 'ph', componentRestrictions: { country: 'PH' } },
        { address: address }
      ];

      function runRequest(requestIndex) {
        if (requestIndex >= requests.length) {
          runCandidate(index + 1);
          return;
        }

        barangayGeocoder.geocode(requests[requestIndex], function (results, status) {
          if (seq !== barangayGeocodeSeq) {
            return;
          }
          if (status !== 'OK' || !Array.isArray(results) || results.length === 0 || !results[0].geometry || !results[0].geometry.location) {
            runRequest(requestIndex + 1);
            return;
          }

          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          updateBarangayInputsFromGeocode(lat, lng, String(results[0].formatted_address || address));
          updateBarangayMapPreviewFromInputs();
          if (barangayMapMeta) {
            barangayMapMeta.textContent = 'Address located near ' + Number(lat).toFixed(6) + ', ' + Number(lng).toFixed(6) + '.';
          }
          const stationId = String(barangayStationIdInput ? barangayStationIdInput.value : '').trim();
          if (stationId !== '') {
            queueBarangayAutosave();
          }
        });
      }

      runRequest(0);
    }
  }

  function queueBarangayGeocode() {
    if (barangayIsPopulating) {
      return;
    }
    if (barangayGeocodeTimer) {
      window.clearTimeout(barangayGeocodeTimer);
    }
    barangayGeocodeTimer = window.setTimeout(function () {
      geocodeBarangayAddress();
    }, 650);
  }

  function updateBarangayMapPreviewFromInputs() {
    if (barangayIsPopulating) {
      return;
    }
    const draft = readBarangayDraft();
    const safeRadius = Number.isFinite(draft.aorRadiusKm) && draft.aorRadiusKm > 0 ? draft.aorRadiusKm : 0;
    pendingBarangayStation = {
      stationId: draft.stationId,
      stationName: draft.stationName,
      stationCode: draft.stationCode,
      location: draft.location,
      latitude: draft.latitude,
      longitude: draft.longitude,
      status: draft.status,
      aorCenterLat: draft.latitude,
      aorCenterLng: draft.longitude,
      aorRadiusKm: safeRadius
    };
    renderBarangayMapSelection(pendingBarangayStation);
    if (barangayMapMeta) {
      barangayMapMeta.textContent = safeRadius > 0
        ? 'Live preview. Current AOR radius: ' + safeRadius.toFixed(2) + ' km.'
        : 'Live preview. Add an AOR radius to draw the coverage circle.';
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

  function setMessage(text, isError) {
    userFormMessage.textContent = text;
    userFormMessage.style.color = isError ? '#a61d2a' : '#2e5b3f';
  }

  function openModal() {
    userModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    userModal.hidden = true;
    document.body.style.overflow = '';
    userForm.reset();
    userIdInput.value = '';
    passwordInput.value = '';
    setMessage('', false);
  }

  function renderOptions() {
    const roleOptions = isAdminPage ? state.roles.filter(function (role) {
      return String(role.roleName || '').toLowerCase() === 'user';
    }) : state.roles;

    roleSelect.innerHTML = roleOptions.map(function (role) {
      return '<option value="' + escapeHtml(String(role.roleId)) + '">' + escapeHtml(role.roleName) + '</option>';
    }).join('');
    stationSelect.innerHTML = state.stations.map(function (station) {
      return '<option value="' + escapeHtml(String(station.stationId)) + '">' + escapeHtml(compactStationName(station.stationName)) + '</option>';
    }).join('');

    if (isAdminPage) {
      stationSelect.disabled = true;
    } else {
      stationSelect.disabled = false;
    }
    positionSelect.innerHTML = '<option value="">No position</option>' + state.positions.map(function (position) {
      return '<option value="' + escapeHtml(String(position.positionId)) + '">' + escapeHtml(position.positionName) + '</option>';
    }).join('');

    userStationFilter.innerHTML = '<option value="">All stations</option>' + state.stations.map(function (station) {
      return '<option value="' + escapeHtml(String(station.stationId)) + '">' + escapeHtml(compactStationName(station.stationName)) + '</option>';
    }).join('');

    if (state.stationFilter === '' && context.stationId) {
      state.stationFilter = String(context.stationId);
    }
    if (userStationFilter) {
      userStationFilter.value = state.stationFilter;
    }

    userRoleFilter.innerHTML = '<option value="">All roles</option>' + state.roles.map(function (role) {
      return '<option value="' + escapeHtml(String(role.roleId)) + '">' + escapeHtml(role.roleName) + '</option>';
    }).join('');

    if (userStationFilterWrap) {
      userStationFilterWrap.hidden = isAdminPage;
    }
  }

  function renderStats() {
    userTotalCount.textContent = String(state.users.length);
    userAdminCount.textContent = String(state.users.filter(function (user) {
      return ['admin', 'superadmin'].includes(String(user.roleName || '').toLowerCase());
    }).length);
    userActiveCount.textContent = String(state.users.filter(function (user) {
      return String(user.status || '') === 'active';
    }).length);
    userStationCount.textContent = String(state.stations.length);
    if (usersTotalMetaCount) {
      usersTotalMetaCount.textContent = String(state.users.length);
    }
  }

  function getInitials(value) {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      return 'U';
    }
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function humanizeWord(value) {
    const word = String(value || '').trim().toLowerCase();
    if (!word) {
      return '-';
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function compactStationName(value) {
    const raw = String(value || '').trim();
    if (raw === '') {
      return '-';
    }

    let compact = raw.replace(/^New\s+/i, '');
    compact = compact.replace(/\bFire Station\b/gi, 'FS');
    compact = compact.replace(/\s{2,}/g, ' ').trim();
    return compact;
  }

  function warningCountClass(count) {
    const value = Number(count || 0);
    if (value === 0) {
      return 'warning-count-0';
    }
    if (value === 1) {
      return 'warning-count-1';
    }
    if (value === 2) {
      return 'warning-count-2';
    }
    return 'warning-count-3';
  }

  function filteredUsers() {
    return state.users.filter(function (user) {
      const search = state.search.toLowerCase();
      const warningCount = Number(user.warningCount || 0);
      const matchesSearch = search === '' || [user.username, user.email, user.stationName, user.roleName].some(function (value) {
        return String(value || '').toLowerCase().includes(search);
      });
      const matchesStation = state.stationFilter === '' || String(user.stationId) === String(state.stationFilter);
      const matchesRole = state.roleFilter === '' || String(user.roleId) === state.roleFilter;
      const matchesWarnings =
        state.warningsFilter === '' ||
        (state.warningsFilter === 'with-warnings' && warningCount > 0) ||
        (state.warningsFilter === 'no-warnings' && warningCount === 0) ||
        (state.warningsFilter === '2-plus' && warningCount >= 2) ||
        (state.warningsFilter === '3-plus' && warningCount >= 3);
      return matchesSearch && matchesStation && matchesRole && matchesWarnings;
    });
  }

  function renderTable() {
    const users = filteredUsers();
    if (usersVisibleCount) {
      usersVisibleCount.textContent = String(users.length);
    }
    if (!users.length) {
      usersTableBody.innerHTML = '<tr><td colspan="7" class="muted-text users-empty-row">No users match the current filters.</td></tr>';
      return;
    }

    usersTableBody.innerHTML = users.map(function (user) {
      const statusClass = String(user.status || '') === 'active' ? 'is-active' : 'is-inactive';
      const roleClass = String(user.roleName || '').toLowerCase() === 'admin' ? 'is-admin' : 'is-user';
      const username = String(user.username || 'Unknown User');
      const stationName = compactStationName(user.stationName || '-');
      return (
        '<tr>' +
          '<td class="users-col-account">' +
            '<div class="users-account-cell">' +
              '<span class="users-avatar" aria-hidden="true">' + escapeHtml(getInitials(username)) + '</span>' +
              '<div class="users-account-meta">' +
                '<strong>' + escapeHtml(username) + '</strong>' +
                '<span>ID: #' + escapeHtml(String(user.userId || '')) + '</span>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td class="users-col-email"><span class="users-email-text">' + escapeHtml(user.email || '-') + '</span></td>' +
          '<td><span class="users-role-badge ' + roleClass + '">' + escapeHtml(humanizeWord(user.roleName || '')) + '</span></td>' +
          '<td class="users-col-station"><div class="users-station-cell"><span class="users-station-chip">' + escapeHtml(stationName) + '</span></div></td>' +
          '<td><button type="button" class="users-warning-pill ' + warningCountClass(user.warningCount || 0) + '" data-user-actions="' + escapeHtml(String(user.userId)) + '" aria-label="Manage ' + escapeHtml(username) + ' account warnings">' + escapeHtml(String(Math.min(3, user.warningCount || 0))) + (user.warningCount > 3 ? '+': '') + '</button></td>' +
          '<td><span class="users-pill ' + statusClass + '">' + escapeHtml(humanizeWord(user.status || '')) + '</span></td>' +
          '<td class="users-col-actions"><div class="users-actions"><button type="button" class="secondary-btn users-edit-btn" data-edit-user="' + escapeHtml(String(user.userId)) + '">Edit</button> <button type="button" class="secondary-btn users-warning-btn" data-warning-user="' + escapeHtml(String(user.userId)) + '">Warn</button> <button type="button" class="secondary-btn users-delete-btn" data-delete-user="' + escapeHtml(String(user.userId)) + '">Delete</button></div></td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderSubstationTable() {
    if (!substationsTableBody) {
      return;
    }
    const stations = Array.isArray(state.stations) ? state.stations : [];
    if (substationTotalCount) {
      substationTotalCount.textContent = String(stations.length);
    }
    if (!stations.length) {
      substationsTableBody.innerHTML = '<tr><td colspan="6" class="muted-text users-empty-row">No substations found.</td></tr>';
      return;
    }

    substationsTableBody.innerHTML = stations.map(function (station) {
      const status = String(station.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';
      const latitude = station.latitude == null ? '-' : Number(station.latitude).toFixed(5);
      const longitude = station.longitude == null ? '-' : Number(station.longitude).toFixed(5);
      return (
        '<tr>' +
          '<td><strong>' + escapeHtml(String(station.stationName || '-')) + '</strong></td>' +
          '<td>' + escapeHtml(String(station.stationCode || '-')) + '</td>' +
          '<td>' + escapeHtml(String(station.location || '-')) + '</td>' +
          '<td><span class="users-mono">' + escapeHtml(latitude + ', ' + longitude) + '</span></td>' +
          '<td><span class="users-pill ' + (status === 'active' ? 'is-active' : 'is-inactive') + '">' + escapeHtml(humanizeWord(status)) + '</span></td>' +
          '<td><button type="button" class="secondary-btn users-inline-btn" data-edit-station="' + escapeHtml(String(station.stationId || '')) + '">Edit</button></td>' +
        '</tr>'
      );
    }).join('');
  }

  function openBarangayEditor(station) {
    if (!station) {
      return;
    }
    barangayIsPopulating = true;
    if (barangayStationIdInput) {
      barangayStationIdInput.value = String(station.stationId || '');
    }
    if (barangayNameInput) {
      barangayNameInput.value = String(station.stationName || '');
    }
    if (barangayCodeInput) {
      barangayCodeInput.value = String(station.stationCode || '');
    }
    if (barangayLocationInput) {
      barangayLocationInput.value = String(station.location || '');
    }
    if (barangayLatitudeInput) {
      barangayLatitudeInput.value = station.latitude == null ? '' : String(station.latitude);
    }
    if (barangayLongitudeInput) {
      barangayLongitudeInput.value = station.longitude == null ? '' : String(station.longitude);
    }
    if (barangayStatusInput) {
      barangayStatusInput.value = String(station.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';
    }
    if (barangayAorRadiusInput) {
      barangayAorRadiusInput.value = station.aorRadiusKm != null && Number(station.aorRadiusKm) > 0 ? String(station.aorRadiusKm) : '2.5';
    }
    if (barangayModalTitle) {
      barangayModalTitle.textContent = 'Edit Substation';
    }
    if (createBarangayAdminInput) {
      createBarangayAdminInput.checked = false;
    }
    toggleBarangayAdminFields();
    pendingBarangayStation = station;
    if (barangayMapMeta) {
      if (station.aorRadiusKm != null && Number(station.aorRadiusKm) > 0) {
        barangayMapMeta.textContent = 'Editing existing substation location. Current AOR radius: ' + Number(station.aorRadiusKm).toFixed(2) + ' km.';
      } else {
        barangayMapMeta.textContent = 'Editing existing substation location.';
      }
    }
    setBarangayMessage('Editing ' + String(station.stationName || 'substation') + '.', false);
    barangayIsPopulating = false;
    openBarangayModal();
    if (barangayMapInstance && window.google && window.google.maps) {
      window.setTimeout(function () {
        renderBarangayMapSelection(station);
      }, 120);
    }
  }

  function populateForm(user) {
    userIdInput.value = String(user.userId || '');
    usernameInput.value = String(user.username || '');
    emailInput.value = String(user.email || '');
    passwordInput.value = '';
    roleSelect.value = String(user.roleId || '');
    stationSelect.value = String(user.stationId || '');
    positionSelect.value = String(user.positionId || '');
    statusSelect.value = String(user.status || 'active');
    securityAlertsInput.checked = Boolean((user.settings || {}).securityAlerts ?? true);
    hideSensitiveInput.checked = Boolean((user.settings || {}).hideSensitive ?? false);
    autoLogoutInput.value = String((user.settings || {}).autoLogoutMinutes ?? 30);
  }

  function populateWarningForm(user) {
    warningUserIdInput.value = String(user.userId || '');
    warningTypeInput.value = 'warning';
    warningTemplateInput.value = 'standard_warning';
    warningMessageInput.value = getWarningTemplateMessage('standard_warning', user);
    warningMessageInput.dataset.autoFilled = 'true';
    warningFormMessage.textContent = '';
  }

  function getStatusLabel(status) {
    return String(status || 'inactive').toLowerCase() === 'active' ? 'Active' : 'Inactive';
  }

  function getStatusActionLabel(status) {
    return String(status || 'inactive').toLowerCase() === 'active' ? 'Deactivate Account' : 'Reactivate Account';
  }

  function openUserActionsModal() {
    if (!userActionsModal) {
      return;
    }
    userActionsModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeUserActionsModal() {
    if (!userActionsModal) {
      return;
    }
    userActionsModal.hidden = true;
    document.body.style.overflow = '';
    userActionsFormMessage.textContent = '';
    activeActionUser = null;
  }

  function setDeleteUserMessage(text, isError) {
    if (!deleteUserMessage) {
      return;
    }
    deleteUserMessage.textContent = text;
    deleteUserMessage.style.color = isError ? '#ffb4bd' : '#9ee6ba';
  }

  function openDeleteUserModal(user) {
    if (!deleteUserModal || !user) {
      return;
    }
    pendingDeleteUser = user;
    if (deleteUserName) {
      deleteUserName.textContent = String(user.username || 'Unknown user');
    }
    if (deleteUserMeta) {
      deleteUserMeta.textContent = 'ID #' + String(user.userId || '-') + ' • ' + String(user.email || 'No email');
    }
    setDeleteUserMessage('', false);
    deleteUserModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeDeleteUserModal() {
    if (!deleteUserModal) {
      return;
    }
    deleteUserModal.hidden = true;
    document.body.style.overflow = '';
    pendingDeleteUser = null;
    setDeleteUserMessage('', false);
  }

  function setUserActionsMessage(text, isError) {
    if (!userActionsFormMessage) {
      return;
    }
    userActionsFormMessage.textContent = text;
    userActionsFormMessage.style.color = isError ? '#a61d2a' : '#2e5b3f';
  }

  function populateUserActions(user) {
    activeActionUser = user || null;
    if (!user) {
      return;
    }
    if (actionUserName) {
      actionUserName.textContent = user.username || '-';
    }
    if (actionUserRole) {
      actionUserRole.textContent = String(user.roleName || '-').toUpperCase();
    }
    if (actionUserEmail) {
      actionUserEmail.textContent = user.email || '-';
    }
    if (actionUserStation) {
      actionUserStation.textContent = user.stationName || '-';
    }
    if (actionUserStatus) {
      actionUserStatus.textContent = getStatusLabel(user.status);
    }
    if (actionUserWarnings) {
      actionUserWarnings.textContent = String(user.warningCount || 0);
    }
    if (toggleStatusBtn) {
      toggleStatusBtn.textContent = getStatusActionLabel(user.status);
    }
    setUserActionsMessage('', false);
  }

  async function updateUserStatus(user, nextStatus) {
    if (!user || !nextStatus) {
      return;
    }

    const formData = new FormData();
    formData.append('action', 'update');
    formData.append('userId', String(user.userId || ''));
    formData.append('username', String(user.username || ''));
    formData.append('email', String(user.email || ''));
    formData.append('password', '');
    formData.append('roleId', String(user.roleId || ''));
    formData.append('stationId', String(user.stationId || ''));
    formData.append('positionId', user.positionId ? String(user.positionId) : '');
    formData.append('status', String(nextStatus));
    formData.append('securityAlerts', user.settings && user.settings.securityAlerts ? '1' : '0');
    formData.append('hideSensitive', user.settings && user.settings.hideSensitive ? '1' : '0');
    formData.append('autoLogoutMinutes', String((user.settings && user.settings.autoLogoutMinutes) || 30));

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        setUserActionsMessage((payload && payload.message) ? payload.message : 'Unable to update account status.', true);
        return;
      }

      await loadBootstrap();
      closeUserActionsModal();
      setMessage(payload.message || 'Account status updated successfully.', false);
      showToast(payload.message || 'Account status updated successfully.', false);
    } catch (error) {
      setUserActionsMessage('Unable to update account status.', true);
    }
  }

  async function deleteUser(user) {
    if (!user) {
      return;
    }

    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('userId', String(user.userId || ''));

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        setUserActionsMessage((payload && payload.message) ? payload.message : 'Unable to delete user.', true);
        return;
      }

      await loadBootstrap();
      closeUserActionsModal();
      setMessage(payload.message || 'User deleted successfully.', false);
      showToast(payload.message || 'User deleted successfully.', false);
    } catch (error) {
      setUserActionsMessage('Unable to delete user.', true);
      setDeleteUserMessage('Unable to delete user.', true);
    }
  }

  function getWarningTemplateMessage(templateId, user) {
    const userName = String(user.username || 'the user');
    const templates = {
      standard_warning: 'MEMORANDUM\n\nTo: ' + userName + '\nFrom: [Your Name / Position]\nDate: [Insert Date]\nSubject: Formal Warning\n\nThis memorandum is issued to inform you that conduct observed on [date] is inconsistent with station policies and expectations. You are required to correct this behavior immediately and adhere to applicable standards going forward. Continued violations may result in further disciplinary action.',
      final_warning: 'MEMORANDUM\n\nTo: ' + userName + '\nFrom: [Your Name / Position]\nDate: [Insert Date]\nSubject: Final Written Warning\n\nThis memorandum serves as a final written warning regarding repeated or serious conduct concerns. Your behavior must improve without delay. Failure to comply with station policies may result in suspension, termination, or other disciplinary measures. Please treat this matter with the utmost seriousness.',
      performance_memo: 'MEMORANDUM\n\nTo: ' + userName + '\nFrom: [Your Name / Position]\nDate: [Insert Date]\nSubject: Performance Improvement Memo\n\nThis memorandum outlines the expectations for your professional performance. Recent observations indicate that improvement is required in meeting established duties and standards. Please address the specific concerns, implement corrective actions, and maintain consistent performance in accordance with station policy.',
      conduct_reminder: 'MEMORANDUM\n\nTo: ' + userName + '\nFrom: [Your Name / Position]\nDate: [Insert Date]\nSubject: Conduct Reminder\n\nThis memorandum is issued as a formal reminder of expected professional conduct. All personnel are required to uphold a respectful, disciplined, and cooperative work environment. You are expected to adhere to applicable rules, maintain a professional demeanor, and avoid behavior that may reflect negatively on the station.',
      attendance_notice: 'MEMORANDUM\n\nTo: ' + userName + '\nFrom: [Your Name / Position]\nDate: [Insert Date]\nSubject: Attendance Notice\n\nThis memorandum addresses concerns regarding your attendance and punctuality. Reliable presence and timely reporting are essential to station operations. Please ensure that you arrive for scheduled assignments on time and follow proper procedures when requesting leave or reporting absences.',
      misconduct_memo: 'MEMORANDUM\n\nTo: ' + userName + '\nFrom: [Your Name / Position]\nDate: [Insert Date]\nSubject: Notice of Inappropriate Behavior / Misconduct\n\nThis memorandum is issued to formally address a concern regarding your behavior observed on [date of incident] at [location or context].\n\nIt has been reported that you engaged in the following conduct:\n\n[Clearly describe the inappropriate behavior or misconduct. Be specific, factual, and objective.]\n\nSuch behavior is considered a violation of [company/school policies, code of conduct, or guidelines], particularly [cite specific rule if applicable].\n\nAll personnel are expected to maintain professionalism, respect, and compliance with established standards at all times. You are expected to:\n\n- Refrain from repeating such behavior\n- Demonstrate appropriate conduct moving forward\n- Comply with all organizational policies\n\nPlease be advised that any repetition of this behavior may result in further disciplinary action, which may include warning, suspension, or termination.\n\nYou are required to acknowledge receipt of this memorandum by signing below.\n\nAcknowledged by:\nSignature: ________________________\nName: ___________________________\nDate: ___________________________',
      custom: ''
    };
    return String(templates[templateId] ?? templates.standard_warning);
  }

  function openWarningModal() {
    warningModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function updateWarningMessageFromTemplate() {
    const templateId = String(warningTemplateInput.value || 'standard_warning');
    const currentMessage = String(warningMessageInput.value || '').trim();
    const templateMessage = getWarningTemplateMessage(templateId, { username: 'the user' });

    if (currentMessage === '' || warningMessageInput.dataset.autoFilled === 'true') {
      warningMessageInput.value = templateMessage;
      warningMessageInput.dataset.autoFilled = templateId !== 'custom' ? 'true' : 'false';
    }
  }

  function loadImageAsDataUrl(url) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Unable to load image');
        }
        return response.blob();
      })
      .then(function (blob) {
        return new Promise(function (resolve, reject) {
          const reader = new FileReader();
          reader.onload = function () {
            resolve(reader.result);
          };
          reader.onerror = function () {
            reject(new Error('Unable to read image data')); 
          };
          reader.readAsDataURL(blob);
        });
      });
  }

  async function generateWarningPdf() {
    const jsPDFCtor = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : null;
    if (!jsPDFCtor) {
      window.alert('PDF generator is not loaded yet. Please wait and try again.');
      return;
    }

    const user = state.users.find(function (entry) {
      return String(entry.userId) === String(warningUserIdInput.value);
    });
    if (!user) {
      window.alert('Unable to identify the selected user for the notice.');
      return;
    }

    const noticeType = String(warningTypeInput.value || 'warning');
    const templateId = String(warningTemplateInput.value || 'standard_warning');
    const messageText = String(warningMessageInput.value || '').trim();
    const noticeLabel = noticeType === 'memo' ? 'Official Memo' : 'Official Warning';
    const noticeSubtitle = noticeType === 'memo' ? 'Personnel Memo Notice' : 'Personnel Warning Notice';

    const doc = new jsPDFCtor({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 42;
    let y = 48;
    const generatedAtLabel = new Date().toLocaleString();
    const logoUrl = '/firenet/NEWFIRENET/assets/img/bfpmakatilogo.jpg';
    let logoDataUrl = null;

    try {
      logoDataUrl = await loadImageAsDataUrl(logoUrl);
    } catch (error) {
      logoDataUrl = null;
    }

    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'JPEG', marginX, y - 8, 52, 52);
      } catch (error) {
        // Continue without logo
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Station ' + String(user.stationName || 'Unknown Station'), marginX + 62, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(String(noticeSubtitle), marginX + 62, y + 32);
    y += 64;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(noticeLabel, marginX, y);
    y += 28;
    doc.setDrawColor(170, 176, 185);
    doc.setLineWidth(1);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const certificateLines = [
      'Recipient: ' + String(user.username || 'Unknown User') + ' (ID ' + String(user.userId || '-') + ')',
      'Station: ' + String(user.stationName || '-'),
      'Notice type: ' + noticeType.charAt(0).toUpperCase() + noticeType.slice(1),
      'Template: ' + String(templateId).replace(/_/g, ' '),
      'Prepared by: ' + (String(window.firenetSessionContext.stationName || '').trim() || 'Station Staff'),
      'Date: ' + generatedAtLabel
    ];
    certificateLines.forEach(function (line) {
      const wrapped = doc.splitTextToSize(line, pageWidth - marginX * 2);
      wrapped.forEach(function (textLine) {
        doc.text(textLine, marginX, y);
        y += 14;
      });
      y += 2;
    });
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Notice', marginX, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const messageLines = doc.splitTextToSize(messageText || 'No message provided.', pageWidth - marginX * 2);
    messageLines.forEach(function (line) {
      if (y > pageHeight - 72) {
        doc.addPage();
        y = 48;
      }
      doc.text(line, marginX, y);
      y += 16;
    });
    y += 24;

    if (y > pageHeight - 100) {
      doc.addPage();
      y = 48;
    }

    doc.setDrawColor(170, 176, 185);
    doc.setLineWidth(0.5);
    doc.line(marginX, y + 30, marginX + 180, y + 30);
    doc.line(pageWidth - marginX - 180, y + 30, pageWidth - marginX, y + 30);
    doc.setFontSize(10);
    doc.text('Issued by', marginX, y + 45);
    doc.text('Authorized signature', pageWidth - marginX - 180, y + 45);

    const safeTitle = String(user.username || 'notice').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'notice';
    const fileName = 'firenet_' + noticeType + '_' + safeTitle + '_' + Date.now() + '.pdf';
    doc.save(fileName);
  }

  function closeWarningModal() {
    warningModal.hidden = true;
    document.body.style.overflow = '';
    warningForm.reset();
    warningUserIdInput.value = '';
    warningTypeInput.value = 'warning';
    warningTemplateInput.value = 'standard_warning';
    warningMessageInput.value = '';
    warningMessageInput.dataset.autoFilled = 'false';
    warningFormMessage.textContent = '';
  }

  async function loadBootstrap() {
    const response = await fetch(apiUrl + '?action=bootstrap', { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true || !payload.data) {
      throw new Error((payload && payload.message) || 'Unable to load user management data.');
    }

    state.bootstrap = payload.data;
    state.roles = Array.isArray(payload.data.roles) ? payload.data.roles : [];
    state.stations = Array.isArray(payload.data.stations) ? payload.data.stations : [];
    state.positions = Array.isArray(payload.data.positions) ? payload.data.positions : [];
    state.users = Array.isArray(payload.data.users) ? payload.data.users : [];
    if (isSuperadminPage) {
      usersWelcomeText.textContent = 'Manage substations, assigned admins, personnel accounts, login updates, and public notices across all stations.';
    } else {
      usersWelcomeText.textContent = 'Manage users, publishing tools, and station activity for ' + String((payload.data.currentStation && payload.data.currentStation.stationName) || 'your station') + '.';
    }
    renderOptions();
    renderStats();
    renderTable();
    renderSubstationTable();
    setActiveTab(readRequestedTab() || localStorage.getItem(usersTabStorageKey) || 'accounts');
  }

  async function saveBarangay() {
    if (!barangayNameInput || !barangayLatitudeInput || !barangayLongitudeInput) {
      return;
    }

    const stationName = barangayNameInput.value.trim();
    const stationId = String(barangayStationIdInput ? barangayStationIdInput.value : '').trim();
    const latitude = Number(barangayLatitudeInput.value || 0);
    const longitude = Number(barangayLongitudeInput.value || 0);
    const aorRadiusKm = Number(barangayAorRadiusInput ? barangayAorRadiusInput.value || 0 : 0);
    const createAdmin = Boolean(createBarangayAdminInput && createBarangayAdminInput.checked);

    if (stationName.length < 2) {
      throw new Error('Substation name is required.');
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      throw new Error('Please pin a valid location on the map.');
    }
    if (!Number.isFinite(aorRadiusKm) || aorRadiusKm <= 0) {
      throw new Error('Please enter a valid AOR radius in kilometers.');
    }

    if (createAdmin && !stationId) {
      const adminUsername = String(barangayAdminUsernameInput ? barangayAdminUsernameInput.value : '').trim();
      const adminEmail = String(barangayAdminEmailInput ? barangayAdminEmailInput.value : '').trim();
      const adminPassword = String(barangayAdminPasswordInput ? barangayAdminPasswordInput.value : '');
      if (adminUsername === '' || adminEmail === '' || adminPassword.trim() === '') {
        throw new Error('Admin username, email, and password are required when creating a substation admin.');
      }
    }

    const formData = new FormData();
    formData.append('action', stationId ? 'update_station' : 'create_station');
    if (stationId) {
      formData.append('stationId', stationId);
    }
    formData.append('stationName', stationName);
    formData.append('stationCode', String(barangayCodeInput ? barangayCodeInput.value : '').trim());
    formData.append('location', String(barangayLocationInput ? barangayLocationInput.value : '').trim());
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));
    formData.append('stationStatus', String(barangayStatusInput ? barangayStatusInput.value : 'active'));
    formData.append('aorRadiusKm', String(aorRadiusKm));
    formData.append('createAdmin', createAdmin ? '1' : '0');
    if (!stationId && createAdmin) {
      formData.append('adminUsername', String(barangayAdminUsernameInput ? barangayAdminUsernameInput.value : '').trim());
      formData.append('adminEmail', String(barangayAdminEmailInput ? barangayAdminEmailInput.value : '').trim());
      formData.append('adminPassword', String(barangayAdminPasswordInput ? barangayAdminPasswordInput.value : ''));
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || (stationId ? 'Unable to update substation.' : 'Unable to create substation.'));
    }

    resetBarangayForm();
    closeBarangayModal();
    showToast(payload.message || (stationId ? 'Substation updated successfully.' : 'Substation created successfully.'), false);
    await loadBootstrap();
  }

  async function autosaveBarangay() {
    const draft = readBarangayDraft();
    if (draft.stationId === '') {
      return;
    }
    setBarangayMessage('Saving changes automatically...', false);
    const formData = new FormData();
    formData.append('action', 'update_station');
    formData.append('stationId', draft.stationId);
    formData.append('stationName', draft.stationName);
    formData.append('stationCode', draft.stationCode);
    formData.append('location', draft.location);
    formData.append('latitude', String(draft.latitude));
    formData.append('longitude', String(draft.longitude));
    formData.append('stationStatus', draft.status);
    formData.append('aorRadiusKm', String(draft.aorRadiusKm));

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to auto-save substation changes.');
    }

    const saved = payload.data || {};
    state.stations = (Array.isArray(state.stations) ? state.stations : []).map(function (station) {
      if (String(station.stationId || '') !== String(draft.stationId)) {
        return station;
      }
      return Object.assign({}, station, saved);
    });
    pendingBarangayStation = Object.assign({}, pendingBarangayStation || {}, saved);
    renderSubstationTable();
    setBarangayMessage('Changes saved automatically.', false);
  }

  function queueBarangayAutosave() {
    if (barangayIsPopulating) {
      return;
    }
    updateBarangayMapPreviewFromInputs();
    const stationId = String(barangayStationIdInput ? barangayStationIdInput.value : '').trim();
    if (stationId === '') {
      return;
    }
    if (barangayAutosaveTimer) {
      window.clearTimeout(barangayAutosaveTimer);
    }
    barangayAutosaveTimer = window.setTimeout(function () {
      autosaveBarangay().catch(function (error) {
        setBarangayMessage(error.message || 'Unable to auto-save substation changes.', true);
      });
    }, 450);
  }

  async function saveUser() {
    const formData = new FormData();
    formData.append('action', userIdInput.value ? 'update' : 'create');
    if (userIdInput.value) {
      formData.append('userId', userIdInput.value);
    }
    formData.append('username', usernameInput.value.trim());
    formData.append('email', emailInput.value.trim());
    formData.append('password', passwordInput.value);
    formData.append('roleId', roleSelect.value);
    formData.append('stationId', stationSelect.value);
    formData.append('positionId', positionSelect.value);
    formData.append('status', statusSelect.value);
    formData.append('securityAlerts', securityAlertsInput.checked ? '1' : '0');
    formData.append('hideSensitive', hideSensitiveInput.checked ? '1' : '0');
    formData.append('autoLogoutMinutes', autoLogoutInput.value);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to save user.');
    }

    closeModal();
    await loadBootstrap();
  }

  openUserModalBtn.addEventListener('click', function () {
    userForm.reset();
    userIdInput.value = '';
    securityAlertsInput.checked = true;
    hideSensitiveInput.checked = false;
    autoLogoutInput.value = '30';
    setMessage('', false);
    openModal();
  });

  if (openSubstationModalBtn) {
    openSubstationModalBtn.addEventListener('click', function () {
      resetBarangayForm();
      openBarangayModal();
    });
  }

  if (isSuperadminPage && barangayPanel) {
    barangayPanel.hidden = false;
  }

  if (createBarangayAdminInput) {
    createBarangayAdminInput.addEventListener('change', toggleBarangayAdminFields);
    toggleBarangayAdminFields();
  }

  if (barangayForm) {
    barangayForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setBarangayMessage('Saving substation...', false);
      saveBarangay().catch(function (error) {
        setBarangayMessage(error.message, true);
      });
    });
  }

  if (resetBarangayBtn) {
    resetBarangayBtn.addEventListener('click', resetBarangayForm);
  }

  [
    barangayNameInput,
    barangayCodeInput,
    barangayLatitudeInput,
    barangayLongitudeInput,
    barangayStatusInput,
    barangayAorRadiusInput
  ].forEach(function (field) {
    if (!field) {
      return;
    }
    field.addEventListener('input', queueBarangayAutosave);
    field.addEventListener('change', queueBarangayAutosave);
  });

  if (barangayLocationInput) {
    barangayLocationInput.addEventListener('input', function () {
      queueBarangayGeocode();
      queueBarangayAutosave();
    });
    barangayLocationInput.addEventListener('change', function () {
      geocodeBarangayAddress();
      queueBarangayAutosave();
    });
    barangayLocationInput.addEventListener('blur', function () {
      geocodeBarangayAddress();
    });
  }

  if (closeBarangayModalBtn) {
    closeBarangayModalBtn.addEventListener('click', closeBarangayModal);
  }

  if (barangayModal) {
    barangayModal.addEventListener('click', function (event) {
      if (event.target && event.target.getAttribute('data-close-barangay-modal') === 'true') {
        closeBarangayModal();
      }
    });
  }

  closeWarningModalBtn.addEventListener('click', closeWarningModal);
  cancelWarningBtn.addEventListener('click', closeWarningModal);

  warningTemplateInput.addEventListener('change', function () {
    updateWarningMessageFromTemplate();
  });

  warningMessageInput.addEventListener('input', function () {
    if (warningMessageInput.dataset.autoFilled === 'true') {
      warningMessageInput.dataset.autoFilled = 'false';
    }
  });

  warningPrintBtn.addEventListener('click', function () {
    generateWarningPdf();
  });

  warningModal.addEventListener('click', function (event) {
    if (event.target && event.target.getAttribute('data-close-warning-modal') === 'true') {
      closeWarningModal();
    }
  });

  if (closeUserActionsModalBtn) {
    closeUserActionsModalBtn.addEventListener('click', closeUserActionsModal);
  }

  if (userActionsModal) {
    userActionsModal.addEventListener('click', function (event) {
      if (event.target && event.target.getAttribute('data-close-user-actions-modal') === 'true') {
        closeUserActionsModal();
      }
    });
  }

  if (openEditFromActionsBtn) {
    openEditFromActionsBtn.addEventListener('click', function () {
      if (!activeActionUser) {
        return;
      }
      populateForm(activeActionUser);
      closeUserActionsModal();
      openModal();
    });
  }

  if (openWarningFromActionsBtn) {
    openWarningFromActionsBtn.addEventListener('click', function () {
      if (!activeActionUser) {
        return;
      }
      populateWarningForm(activeActionUser);
      closeUserActionsModal();
      openWarningModal();
    });
  }

  if (toggleStatusBtn) {
    toggleStatusBtn.addEventListener('click', function () {
      if (!activeActionUser) {
        return;
      }
      const nextStatus = String(activeActionUser.status || 'active').toLowerCase() === 'active' ? 'inactive' : 'active';
      updateUserStatus(activeActionUser, nextStatus);
    });
  }

  if (deleteUserBtn) {
    deleteUserBtn.addEventListener('click', function () {
      if (!activeActionUser) {
        return;
      }
      openDeleteUserModal(activeActionUser);
    });
  }

  if (closeDeleteUserModalBtn) {
    closeDeleteUserModalBtn.addEventListener('click', closeDeleteUserModal);
  }

  if (cancelDeleteUserBtn) {
    cancelDeleteUserBtn.addEventListener('click', closeDeleteUserModal);
  }

  if (confirmDeleteUserBtn) {
    confirmDeleteUserBtn.addEventListener('click', function () {
      if (!pendingDeleteUser) {
        return;
      }
      deleteUser(pendingDeleteUser).then(function () {
        if (!deleteUserMessage || deleteUserMessage.textContent === '') {
          closeDeleteUserModal();
        }
      });
    });
  }

  if (deleteUserModal) {
    deleteUserModal.addEventListener('click', function (event) {
      if (event.target && event.target.getAttribute('data-close-delete-user-modal') === 'true') {
        closeDeleteUserModal();
      }
    });
  }

  function setWarningMessage(text, isError) {
    warningFormMessage.textContent = text;
    warningFormMessage.style.color = isError ? '#a61d2a' : '#2e5b3f';
  }

  function validateWarning() {
    const message = warningMessageInput.value.trim();
    if (message === '') {
      setWarningMessage('Please provide a warning or memo message.', true);
      return false;
    }
    if (message.length < 10) {
      setWarningMessage('Warning or memo must be at least 10 characters.', true);
      return false;
    }
    return true;
  }

  async function sendWarning() {
    if (!validateWarning()) {
      return;
    }

    const formData = new FormData();
    formData.append('action', 'send_warning');
    formData.append('userId', warningUserIdInput.value);
    formData.append('warningType', warningTypeInput.value || 'warning');
    formData.append('warningTemplate', warningTemplateInput.value || 'standard_warning');
    formData.append('message', warningMessageInput.value.trim());

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        setWarningMessage((payload && payload.message) ? payload.message : 'Unable to send the warning.', true);
        return;
      }

      closeWarningModal();
      setMessage(payload.message || 'Warning or memo sent successfully.', false);
      showToast(payload.message || 'Warning or memo sent successfully.', false);
      await loadBootstrap();
    } catch (error) {
      setWarningMessage('Unable to send the warning.', true);
    }
  }

  warningForm.addEventListener('submit', function (event) {
    event.preventDefault();
    sendWarning();
  });

  usersTableBody.addEventListener('click', function (event) {
    const editButton = event.target.closest('[data-edit-user]');
    if (editButton) {
      const user = state.users.find(function (entry) {
        return String(entry.userId) === String(editButton.getAttribute('data-edit-user'));
      });
      if (!user) {
        return;
      }

      populateForm(user);
      setMessage('Edit the user and save your changes.', false);
      openModal();
      return;
    }

    const actionsButton = event.target.closest('[data-user-actions]');
    if (actionsButton) {
      const user = state.users.find(function (entry) {
        return String(entry.userId) === String(actionsButton.getAttribute('data-user-actions'));
      });
      if (!user) {
        return;
      }

      populateUserActions(user);
      openUserActionsModal();
      return;
    }

    const warningButton = event.target.closest('[data-warning-user]');
    if (warningButton) {
      const user = state.users.find(function (entry) {
        return String(entry.userId) === String(warningButton.getAttribute('data-warning-user'));
      });
      if (!user) {
        return;
      }

      populateWarningForm(user);
      openWarningModal();
      return;
    }

    const deleteButton = event.target.closest('[data-delete-user]');
    if (deleteButton) {
      const user = state.users.find(function (entry) {
        return String(entry.userId) === String(deleteButton.getAttribute('data-delete-user'));
      });
      if (!user) {
        return;
      }

      openDeleteUserModal(user);
    }
  });

  if (substationsTableBody) {
    substationsTableBody.addEventListener('click', function (event) {
      const editButton = event.target.closest('[data-edit-station]');
      if (!editButton) {
        return;
      }
      const station = state.stations.find(function (entry) {
        return String(entry.stationId) === String(editButton.getAttribute('data-edit-station'));
      });
      if (!station) {
        return;
      }
      openBarangayEditor(station);
    });
  }

  refreshUsersBtn.addEventListener('click', function () {
    loadBootstrap().catch(function (error) {
      setMessage(error.message, true);
    });
  });

  closeUserModalBtn.addEventListener('click', closeModal);
  userModal.addEventListener('click', function (event) {
    if (event.target && event.target.getAttribute('data-close-user-modal') === 'true') {
      closeModal();
    }
  });

  userForm.addEventListener('submit', function (event) {
    event.preventDefault();
    saveUser().catch(function (error) {
      setMessage(error.message, true);
    });
  });

  userSearchInput.addEventListener('input', function () {
    state.search = userSearchInput.value.trim();
    renderTable();
  });
  userStationFilter.addEventListener('change', function () {
    state.stationFilter = userStationFilter.value;
    renderTable();
  });
  userRoleFilter.addEventListener('change', function () {
    state.roleFilter = userRoleFilter.value;
    renderTable();
  });
  if (userWarningsFilter) {
    userWarningsFilter.addEventListener('change', function () {
      state.warningsFilter = userWarningsFilter.value;
      renderTable();
    });
  }

  usersTabButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setActiveTab(button.getAttribute('data-users-tab') || 'accounts');
    });
  });

  function setNewsMessage(text, isError) {
    if (!newsFormMessage) {
      return;
    }
    newsFormMessage.textContent = text;
    newsFormMessage.style.color = isError ? '#a61d2a' : '#2e5b3f';
  }

  function openNewsModal() {
    if (!newsModal) {
      return;
    }
    newsModal.hidden = false;
    document.body.style.overflow = 'hidden';
    setNewsMessage('', false);
  }

  function closeNewsModal() {
    if (!newsModal) {
      return;
    }
    newsModal.hidden = true;
    document.body.style.overflow = '';
    if (newsForm) {
      newsForm.reset();
    }
    setNewsMessage('', false);
  }

  function setAnnouncementMessage(text, isError) {
    if (!announcementFormMessage) {
      return;
    }
    announcementFormMessage.textContent = text;
    announcementFormMessage.style.color = isError ? '#a61d2a' : '#2e5b3f';
  }

  function openAnnouncementModal() {
    if (!announcementModal) {
      return;
    }
    announcementModal.hidden = false;
    document.body.style.overflow = 'hidden';
    setAnnouncementMessage('', false);
  }

  function closeAnnouncementModal() {
    if (!announcementModal) {
      return;
    }
    announcementModal.hidden = true;
    document.body.style.overflow = '';
    if (announcementForm) {
      announcementForm.reset();
    }
    setAnnouncementMessage('', false);
  }

  if (openNewsModalBtn) {
    openNewsModalBtn.addEventListener('click', function () {
      openNewsModal();
    });
  }

  if (openAnnouncementModalBtn) {
    openAnnouncementModalBtn.addEventListener('click', function () {
      openAnnouncementModal();
    });
  }

  if (closeNewsModalBtn) {
    closeNewsModalBtn.addEventListener('click', closeNewsModal);
  }

  if (cancelNewsBtn) {
    cancelNewsBtn.addEventListener('click', closeNewsModal);
  }

  if (closeAnnouncementModalBtn) {
    closeAnnouncementModalBtn.addEventListener('click', closeAnnouncementModal);
  }

  if (cancelAnnouncementBtn) {
    cancelAnnouncementBtn.addEventListener('click', closeAnnouncementModal);
  }

  if (newsModal) {
    newsModal.addEventListener('click', function (event) {
      if (!event || !event.target || !event.target.getAttribute) {
        return;
      }
      if (event.target.getAttribute('data-close-news-modal') === 'true') {
        closeNewsModal();
      }
    });
  }

  if (announcementModal) {
    announcementModal.addEventListener('click', function (event) {
      if (!event || !event.target || !event.target.getAttribute) {
        return;
      }
      if (event.target.getAttribute('data-close-announcement-modal') === 'true') {
        closeAnnouncementModal();
      }
    });
  }

  async function publishNews() {
    if (!newsPhotoInput || !newsTitleInput || !newsBodyInput || !newsStatusSelect) {
      throw new Error('News form is incomplete.');
    }

    const title = String(newsTitleInput.value || '').trim();
    const body = String(newsBodyInput.value || '').trim();
    const status = String(newsStatusSelect.value || 'approved');

    const file = newsPhotoInput.files && newsPhotoInput.files[0] ? newsPhotoInput.files[0] : null;
    if (!file) {
      throw new Error('Please upload a news photo.');
    }

    if (title.length < 3) {
      throw new Error('Title must be at least 3 characters.');
    }
    if (body.length < 10) {
      throw new Error('What happened must be at least 10 characters.');
    }

    const formData = new FormData();
    formData.append('action', 'create');
    formData.append('photo', file);
    formData.append('title', title);
    formData.append('body', body);
    formData.append('status', status);

    const endpoint = '/firenet/NEWFIRENET/backend/controllers/news.php';

    setNewsMessage('Publishing news...', false);

    const response = await fetch(endpoint + '?action=create', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (e) {
      payload = null;
    }

    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) ? payload.message : 'Unable to publish news.');
    }

    closeNewsModal();
    if (newsForm) {
      newsForm.reset();
    }
    window.alert(payload.message || 'News published successfully.');
  }

  if (newsForm) {
    newsForm.addEventListener('submit', function (event) {
      event.preventDefault();
      publishNews().catch(function (error) {
        setNewsMessage(error.message || 'Unable to publish news.', true);
      });
    });
  }

  async function publishAnnouncement() {
    if (!announcementPhotoInput || !announcementTitleInput || !announcementBodyInput || !announcementTypeInput || !announcementAudienceInput || !announcementStatusSelect) {
      throw new Error('Announcement form is incomplete.');
    }

    const title = String(announcementTitleInput.value || '').trim();
    const body = String(announcementBodyInput.value || '').trim();
    const type = String(announcementTypeInput.value || '').trim();
    const audience = String(announcementAudienceInput.value || '').trim();
    const status = String(announcementStatusSelect.value || 'approved');

    const file = announcementPhotoInput.files && announcementPhotoInput.files[0] ? announcementPhotoInput.files[0] : null;
    if (!file) {
      throw new Error('Please upload an announcement photo.');
    }

    const expiresAtRaw = announcementExpiresAtInput ? String(announcementExpiresAtInput.value || '').trim() : '';
    const expiresAt = expiresAtRaw;

    if (title.length < 3) {
      throw new Error('Announcement title must be at least 3 characters.');
    }
    if (body.length < 10) {
      throw new Error('Announcement details must be at least 10 characters.');
    }
    if (!type || !audience) {
      throw new Error('Please select announcement type and audience.');
    }

    const formData = new FormData();
    formData.append('action', 'create_announcement');
    formData.append('photo', file);
    formData.append('title', title);
    formData.append('body', body);
    formData.append('announcementType', type);
    formData.append('audience', audience);
    formData.append('status', status);
    if (expiresAt) {
      formData.append('expiresAt', expiresAt);
    }

    const endpoint = '/firenet/NEWFIRENET/backend/controllers/news.php?action=create_announcement';

    setAnnouncementMessage('Publishing announcement...', false);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (e) {
      payload = null;
    }

    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) ? payload.message : 'Unable to publish announcement.');
    }

    closeAnnouncementModal();
    if (announcementForm) {
      announcementForm.reset();
    }
    window.alert(payload.message || 'Announcement published successfully.');
  }

  if (announcementForm) {
    announcementForm.addEventListener('submit', function (event) {
      event.preventDefault();
      publishAnnouncement().catch(function (error) {
        setAnnouncementMessage(error.message || 'Unable to publish announcement.', true);
      });
    });
  }

  try {
    setActiveTab(readRequestedTab() || localStorage.getItem(usersTabStorageKey) || 'accounts');
  } catch (error) {
    setActiveTab(readRequestedTab() || 'accounts');
  }

  loadBootstrap().catch(function (error) {
    usersTableBody.innerHTML = '<tr><td colspan="7" class="muted-text">Unable to load users.</td></tr>';
    setMessage(error.message, true);
  });
})();
