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
  const deleteStationModal = document.getElementById('deleteStationModal');
  const closeDeleteStationModalBtn = document.getElementById('closeDeleteStationModalBtn');
  const cancelDeleteStationBtn = document.getElementById('cancelDeleteStationBtn');
  const confirmDeleteStationBtn = document.getElementById('confirmDeleteStationBtn');
  const deleteStationName = document.getElementById('deleteStationName');
  const deleteStationMeta = document.getElementById('deleteStationMeta');
  const deleteStationMessage = document.getElementById('deleteStationMessage');
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
  const barangayFullAddressInput = document.getElementById('barangayFullAddressInput');
  const barangayStreetInput = document.getElementById('barangayStreetInput');
  const barangayBarangayInput = document.getElementById('barangayBarangayInput');
  const barangayLandmarkInput = document.getElementById('barangayLandmarkInput');
  const locateBarangayBtn = document.getElementById('locateBarangayBtn');
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
  const saveBarangayBtn = document.getElementById('saveBarangayBtn');
  const cancelBarangayBtn = document.getElementById('cancelBarangayBtn');
  const barangayAdminToggleWrap = document.getElementById('barangayAdminToggleWrap');
  const barangayAdminHelpText = document.getElementById('barangayAdminHelpText');
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
  let pendingDeleteStation = null;
  let barangayAutosaveTimer = null;
  let barangayGeocoder = null;
  let barangayGeocodeTimer = null;
  let barangayGeocodeSeq = 0;
  let barangayGeocodeActive = false;
  let googleGeocodeDisabled = true;
  let barangayIsPopulating = false;
  let toastHost = null;

  googleGeocodeDisabled = context.googleGeocodingEnabled !== true;

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

  const usersTabNames = ['accounts', 'news', 'notices', 'substations', 'alerts', 'system'];

  function readRequestedTab() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const requested = String(params.get('tab') || '').toLowerCase();
      return usersTabNames.indexOf(requested) >= 0 ? requested : '';
    } catch (error) {
      return '';
    }
  }

  function getPreferredUsersTab() {
    const fromContext = String(context.activeTab || '').toLowerCase();
    if (usersTabNames.indexOf(fromContext) >= 0) {
      return fromContext;
    }
    const fromUrl = readRequestedTab();
    if (fromUrl !== '') {
      return fromUrl;
    }
    try {
      const stored = String(localStorage.getItem(usersTabStorageKey) || '').toLowerCase();
      if (usersTabNames.indexOf(stored) >= 0) {
        return stored;
      }
    } catch (error) {
      // ignore storage failures
    }
    return 'accounts';
  }

  function setActiveTab(tabName) {
    const nextTab = usersTabNames.indexOf(String(tabName || '')) >= 0 ? String(tabName) : 'accounts';

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
      if (nextTab === 'substations') {
        usersHeroTitle.textContent = 'Substations';
      } else if (nextTab === 'alerts') {
        usersHeroTitle.textContent = 'Public Alerts';
      } else if (nextTab === 'system') {
        usersHeroTitle.textContent = 'System Settings';
      } else {
        usersHeroTitle.textContent = 'Admin Settings';
      }
    }
    if (usersWelcomeText) {
      if (nextTab === 'substations') {
        usersWelcomeText.textContent = 'Create, edit, and review all substations and assigned coordinates across the district.';
      } else if (nextTab === 'alerts') {
        usersWelcomeText.textContent = 'Broadcast Gmail and SMS alerts to civilians who subscribed on the public portal.';
      } else if (nextTab === 'system') {
        usersWelcomeText.textContent = 'District identity, integrations, public portal, and security defaults in one place.';
      } else if (isSuperadminPage) {
        usersWelcomeText.textContent = 'Manage substations, assigned admins, personnel accounts, login updates, and public notices across all stations.';
      } else {
        usersWelcomeText.textContent = 'Manage users, publishing tools, and station activity for ' + String((state.bootstrap && state.bootstrap.currentStation && state.bootstrap.currentStation.stationName) || context.stationName || 'your station') + '.';
      }
    }
    if (openUserModalBtn) {
      openUserModalBtn.hidden = nextTab === 'substations' || nextTab === 'alerts' || nextTab === 'news' || nextTab === 'notices' || nextTab === 'system';
    }
    if (openSubstationModalBtn) {
      openSubstationModalBtn.hidden = nextTab !== 'substations' || !isSuperadminPage;
    }
    if (nextTab === 'alerts') {
      loadCivilianAlertStats().catch(function () {
        // surface via form message inside loader
      });
    }
    if (nextTab === 'system') {
      loadSystemSettings().catch(function () {
        // surface via form message inside loader
      });
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
      updateBarangayMapPreviewFromInputs();

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

  function readBarangayAdminDraft() {
    return {
      username: String(barangayAdminUsernameInput ? barangayAdminUsernameInput.value : '').trim(),
      email: String(barangayAdminEmailInput ? barangayAdminEmailInput.value : '').trim(),
      password: String(barangayAdminPasswordInput ? barangayAdminPasswordInput.value : '')
    };
  }

  function shouldCreateBarangayAdmin() {
    const draft = readBarangayAdminDraft();
    const hasFieldInput = draft.username !== '' || draft.email !== '' || draft.password.trim() !== '';
    return Boolean(createBarangayAdminInput && createBarangayAdminInput.checked) || hasFieldInput;
  }

  function syncBarangayAdminToggle() {
    if (!createBarangayAdminInput) {
      return;
    }
    const draft = readBarangayAdminDraft();
    const hasFieldInput = draft.username !== '' || draft.email !== '' || draft.password.trim() !== '';
    if (hasFieldInput && !createBarangayAdminInput.checked) {
      createBarangayAdminInput.checked = true;
      toggleBarangayAdminFields();
    }
  }

  function clearBarangayAdminFields() {
    if (barangayAdminUsernameInput) {
      barangayAdminUsernameInput.value = '';
    }
    if (barangayAdminEmailInput) {
      barangayAdminEmailInput.value = '';
    }
    if (barangayAdminPasswordInput) {
      barangayAdminPasswordInput.value = '';
    }
    if (createBarangayAdminInput) {
      createBarangayAdminInput.checked = false;
    }
    toggleBarangayAdminFields();
  }

  function isBarangayEditMode() {
    return String(barangayStationIdInput ? barangayStationIdInput.value : '').trim() !== '';
  }

  function updateBarangayFormActions() {
    const editing = isBarangayEditMode();
    if (saveBarangayBtn) {
      saveBarangayBtn.textContent = editing ? 'Save Changes' : 'Create Substation';
    }
    if (barangayAdminHelpText) {
      barangayAdminHelpText.textContent = editing
        ? 'Turn on, then enter details to add an admin for this substation.'
        : 'Turn on, then enter username, email, and password for the new substation admin.';
    }
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
    clearBarangayAdminFields();
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
    updateBarangayFormActions();
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

    const stationLat = station.latitude != null ? Number(station.latitude) : NaN;
    const stationLng = station.longitude != null ? Number(station.longitude) : NaN;
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

  function readBarangayCoordinateValue(input) {
    if (!input) {
      return null;
    }
    const raw = String(input.value || '').trim();
    if (raw === '') {
      return null;
    }
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  function readBarangayDraft() {
    return {
      stationId: String(barangayStationIdInput ? barangayStationIdInput.value : '').trim(),
      stationName: String(barangayNameInput ? barangayNameInput.value : '').trim(),
      stationCode: String(barangayCodeInput ? barangayCodeInput.value : '').trim(),
      location: composeBarangayLocationString(readBarangayAddressParts()),
      latitude: readBarangayCoordinateValue(barangayLatitudeInput),
      longitude: readBarangayCoordinateValue(barangayLongitudeInput),
      status: String(barangayStatusInput ? barangayStatusInput.value : 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active',
      aorRadiusKm: barangayAorRadiusInput ? Number(barangayAorRadiusInput.value || 0) : 0
    };
  }

  const reportsLocateUrl = '/firenet/NEWFIRENET/backend/controllers/reports.php?action=locate';

  function getSubstationLocateUrl(params) {
    const endpoint = String(context.geocodeEndpoint || reportsLocateUrl);
    const separator = endpoint.indexOf('?') === -1 ? '?' : '&';
    return endpoint + separator + params.toString();
  }

  async function fetchSubstationLocate(params, timeoutMs) {
    const controller = new AbortController();
    const timer = window.setTimeout(function () {
      controller.abort();
    }, timeoutMs || 18000);

    try {
      const response = await fetch(getSubstationLocateUrl(params), {
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

  function isBarangayGoogleMapsReady() {
    return Boolean(window.google && window.google.maps);
  }

  function buildSubstationStreetVariants(value) {
    const input = String(value || '').trim();
    if (input === '') {
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

  function normalizeBarangayAddressText(value) {
    return String(value || '')
      .replace(/\r\n/g, '\n')
      .replace(/\n+/g, ', ')
      .replace(/\s{2,}/g, ' ')
      .replace(/,\s*,+/g, ', ')
      .trim();
  }

  function isBarangayAddressLocalityPart(part) {
    return /^(?:makati(?:\s+city)?|city\s+of\s+makati|metro\s+manila|philippines|\d{4,5}(?:\s+metro\s+manila)?)$/i.test(String(part || '').replace(/\s{2,}/g, ' ').trim());
  }

  function barangayAddressLooksLikeStreet(part) {
    return /\b(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|highway|hwy\.?|corner|cor\.?)\b|\d{2,5}\s+\S+/i.test(String(part || ''));
  }

  function barangayAddressLooksLikeBuilding(part) {
    return /\b(?:tower|center|centre|plaza|building|bldg\.?|mall|arcade|suites?)\b/i.test(String(part || ''));
  }

  function barangayAddressLooksLikeVillage(part) {
    return /\bvillage\b/i.test(String(part || ''));
  }

  function parseBarangayComplexAddress(raw) {
    const fullNormalized = normalizeBarangayAddressText(raw);
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
      if (isBarangayAddressLocalityPart(part)) {
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
          if (barangayAddressLooksLikeVillage(left) || !barangayAddressLooksLikeStreet(left)) {
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

      if (barangayAddressLooksLikeVillage(part)) {
        area = area !== '' ? area + ', ' + part : part;
        segments.push(part);
        return;
      }

      if (barangayAddressLooksLikeStreet(part)) {
        street = street !== '' ? street : part;
        segments.push(part);
        return;
      }

      if (barangayAddressLooksLikeBuilding(part) && street === '') {
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

  function resolveBarangayAddressPartsForLocate(street, landmark, barangayValue, altAddress) {
    const parsed = parseBarangayComplexAddress(altAddress);
    let resolvedStreet = String(street || '').trim() || parsed.street;
    let resolvedLandmark = String(landmark || '').trim() || parsed.building;
    let resolvedBarangay = String(barangayValue || '').trim() || parsed.barangay;
    const resolvedAlt = parsed.fullNormalized || normalizeBarangayAddressText(altAddress);

    if (resolvedLandmark === '' && parsed.area !== '') {
      resolvedLandmark = parsed.area;
    }

    if (resolvedStreet === '' && parsed.segments.length > 0) {
      const streetSegment = parsed.segments.find(function (segment) {
        return barangayAddressLooksLikeStreet(segment);
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

  function readBarangayAddressParts() {
    const street = String(barangayStreetInput ? barangayStreetInput.value : '').trim();
    const landmark = String(barangayLandmarkInput ? barangayLandmarkInput.value : '').trim();
    const barangayValue = String(barangayBarangayInput ? barangayBarangayInput.value : '').trim();
    const altAddress = normalizeBarangayAddressText(barangayFullAddressInput ? barangayFullAddressInput.value : '');
    return resolveBarangayAddressPartsForLocate(street, landmark, barangayValue, altAddress);
  }

  function hasBarangayAddressInput() {
    const resolved = readBarangayAddressParts();
    return resolved.streetName !== '' || resolved.landmark !== '' || resolved.barangay !== '' || resolved.altAddress !== '';
  }

  function composeBarangayLocationString(resolved) {
    const fullAddress = String(resolved.altAddress || '').trim();
    const combined = [
      resolved.landmark,
      resolved.streetName,
      resolved.barangay ? ('Barangay ' + resolved.barangay) : ''
    ].filter(function (part) {
      return String(part || '').trim() !== '';
    }).join(', ');

    if (fullAddress !== '') {
      return fullAddress;
    }
    return combined;
  }

  function buildSubstationAddressCandidates(street, landmark, barangayValue, altAddress) {
    const resolved = resolveBarangayAddressPartsForLocate(street, landmark, barangayValue, altAddress);
    const streetVariants = buildSubstationStreetVariants(resolved.streetName);
    const altVariants = buildSubstationStreetVariants(resolved.altAddress);
    const segmentVariants = [];
    resolved.segments.forEach(function (segment) {
      buildSubstationStreetVariants(segment).forEach(function (variant) {
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

  function geocodeSubstationWithGoogleMaps(address) {
    return new Promise(function (resolve) {
      if (googleGeocodeDisabled || !isBarangayGoogleMapsReady() || !address) {
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

      const requests = [
        boundedRequest,
        { address: address, region: 'ph', componentRestrictions: { country: 'PH' } },
        { address: address }
      ];
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

  async function geocodeSubstationCandidatesWithGoogleMaps(candidates) {
    for (let i = 0; i < candidates.length; i += 1) {
      const result = await geocodeSubstationWithGoogleMaps(candidates[i]);
      if (result) {
        return result;
      }
    }
    return null;
  }

  function updateBarangayInputsFromGeocode(lat, lng, formattedAddress) {
    if (!barangayLatitudeInput || !barangayLongitudeInput) {
      return;
    }
    barangayIsPopulating = true;
    barangayLatitudeInput.value = Number(lat).toFixed(8);
    barangayLongitudeInput.value = Number(lng).toFixed(8);
    if (barangayFullAddressInput && formattedAddress && String(barangayFullAddressInput.value || '').trim() === '') {
      barangayFullAddressInput.value = formattedAddress;
    }
    barangayIsPopulating = false;
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

  function clearBarangayCoordinatesForRelocate() {
    barangayIsPopulating = true;
    if (barangayLatitudeInput) {
      barangayLatitudeInput.value = '';
    }
    if (barangayLongitudeInput) {
      barangayLongitudeInput.value = '';
    }
    barangayIsPopulating = false;
    if (barangayMapMarker) {
      barangayMapMarker.setMap(null);
      barangayMapMarker = null;
    }
    if (barangayAorCircle) {
      barangayAorCircle.setMap(null);
      barangayAorCircle = null;
    }
  }

  async function geocodeBarangayAddress() {
    const resolved = readBarangayAddressParts();
    const street = resolved.streetName;
    const barangayValue = resolved.barangay;
    const landmarkValue = resolved.landmark;
    const altAddressValue = resolved.altAddress;

    if (street === '' && landmarkValue === '' && altAddressValue === '') {
      barangayGeocodeActive = false;
      if (barangayMapMeta) {
        barangayMapMeta.textContent = 'Type an address to locate this substation on the map.';
      }
      return;
    }

    const seq = ++barangayGeocodeSeq;
    barangayGeocodeActive = true;
    if (barangayMapMeta) {
      barangayMapMeta.textContent = 'Locating address on the map...';
    }

    const addressCandidates = buildSubstationAddressCandidates(street, landmarkValue, barangayValue, altAddressValue);

    try {
      const params = new URLSearchParams({
        barangay: barangayValue,
        streetName: street,
        landmark: landmarkValue,
        altAddress: altAddressValue,
        alarmLevel: '1'
      });

      const backendResult = await fetchSubstationLocate(params, 18000);

      if (seq !== barangayGeocodeSeq) {
        return;
      }

      const response = backendResult.response;
      const payload = backendResult.payload;
      let latitude = payload && payload.latitude != null ? Number(payload.latitude) : null;
      let longitude = payload && payload.longitude != null ? Number(payload.longitude) : null;
      let displayAddress = payload && payload.displayAddress ? String(payload.displayAddress) : '';
      let backendOk = Boolean(response && response.ok && payload && payload.ok === true && latitude != null && longitude != null);

      if (!backendOk && addressCandidates.length > 0 && !googleGeocodeDisabled) {
        const googleResult = await geocodeSubstationCandidatesWithGoogleMaps(addressCandidates);
        if (googleResult) {
          latitude = Number(googleResult.latitude);
          longitude = Number(googleResult.longitude);
          if (!displayAddress) {
            displayAddress = String(googleResult.displayAddress || '');
          }
        }
      }

      if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        if (barangayMapMeta) {
          barangayMapMeta.textContent = (payload && payload.message)
            ? payload.message
            : 'Address lookup did not return coordinates. Try a more complete street and barangay address.';
        }
        return;
      }

      updateBarangayInputsFromGeocode(latitude, longitude, displayAddress);
      updateBarangayMapPreviewFromInputs();

      if (barangayMapMeta) {
        barangayMapMeta.textContent = displayAddress
          ? ('Located: ' + displayAddress)
          : ('Address located near ' + Number(latitude).toFixed(6) + ', ' + Number(longitude).toFixed(6) + '.');
      }

      const stationId = String(barangayStationIdInput ? barangayStationIdInput.value : '').trim();
      if (stationId !== '') {
        queueBarangayAutosave();
      }
    } catch (error) {
      if (seq !== barangayGeocodeSeq) {
        return;
      }
      if (barangayMapMeta) {
        barangayMapMeta.textContent = 'Unable to locate this address right now.';
      }
    } finally {
      if (seq === barangayGeocodeSeq) {
        barangayGeocodeActive = false;
      }
    }
  }

  function queueBarangayGeocode() {
    if (barangayIsPopulating) {
      return;
    }
    if (hasBarangayAddressInput()) {
      clearBarangayCoordinatesForRelocate();
    }
    if (barangayGeocodeTimer) {
      window.clearTimeout(barangayGeocodeTimer);
    }
    barangayGeocodeTimer = window.setTimeout(function () {
      geocodeBarangayAddress();
    }, 700);
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
    if (barangayMapMeta && !barangayGeocodeActive) {
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
      const stationId = String(station.stationId || '');
      const stationCode = String(station.stationCode || '').toLowerCase();
      const isProtected = stationCode === 'mcfs' || String(stationId) === String(context.stationId || '');
      const actions =
        '<div class="users-actions">' +
          '<button type="button" class="secondary-btn users-inline-btn" data-edit-station="' + escapeHtml(stationId) + '">Edit</button>' +
          (isSuperadminPage && !isProtected
            ? ' <button type="button" class="secondary-btn users-inline-btn users-delete-btn" data-delete-station="' + escapeHtml(stationId) + '">Delete</button>'
            : '') +
        '</div>';
      return (
        '<tr>' +
          '<td><strong>' + escapeHtml(String(station.stationName || '-')) + '</strong></td>' +
          '<td>' + escapeHtml(String(station.stationCode || '-')) + '</td>' +
          '<td>' + escapeHtml(String(station.location || '-')) + '</td>' +
          '<td><span class="users-mono">' + escapeHtml(latitude + ', ' + longitude) + '</span></td>' +
          '<td><span class="users-pill ' + (status === 'active' ? 'is-active' : 'is-inactive') + '">' + escapeHtml(humanizeWord(status)) + '</span></td>' +
          '<td>' + actions + '</td>' +
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
    if (barangayFullAddressInput) {
      barangayFullAddressInput.value = String(station.location || '');
    }
    if (barangayStreetInput) {
      barangayStreetInput.value = '';
    }
    if (barangayBarangayInput) {
      barangayBarangayInput.value = '';
    }
    if (barangayLandmarkInput) {
      barangayLandmarkInput.value = '';
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
    clearBarangayAdminFields();
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
    updateBarangayFormActions();
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

  function setDeleteStationMessage(text, isError) {
    if (!deleteStationMessage) {
      return;
    }
    deleteStationMessage.textContent = text;
    deleteStationMessage.style.color = isError ? '#ffb4bd' : '#9ee6ba';
  }

  function openDeleteStationModal(station) {
    if (!deleteStationModal || !station) {
      return;
    }
    pendingDeleteStation = station;
    if (deleteStationName) {
      deleteStationName.textContent = String(station.stationName || 'Unknown station');
    }
    if (deleteStationMeta) {
      deleteStationMeta.textContent = 'Code ' + String(station.stationCode || '-') +
        ' • ID #' + String(station.stationId || '-') +
        (station.location ? (' • ' + String(station.location)) : '');
    }
    setDeleteStationMessage('', false);
    if (confirmDeleteStationBtn) {
      confirmDeleteStationBtn.disabled = false;
      confirmDeleteStationBtn.textContent = 'Delete Station';
    }
    deleteStationModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeDeleteStationModal() {
    if (!deleteStationModal) {
      return;
    }
    deleteStationModal.hidden = true;
    pendingDeleteStation = null;
    setDeleteStationMessage('', false);
    document.body.style.overflow = '';
  }

  async function deleteStation(station) {
    if (!station) {
      return;
    }

    const formData = new FormData();
    formData.append('action', 'delete_station');
    formData.append('stationId', String(station.stationId || ''));

    if (confirmDeleteStationBtn) {
      confirmDeleteStationBtn.disabled = true;
      confirmDeleteStationBtn.textContent = 'Deleting…';
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        setDeleteStationMessage((payload && payload.message) ? payload.message : 'Unable to delete station.', true);
        if (confirmDeleteStationBtn) {
          confirmDeleteStationBtn.disabled = false;
          confirmDeleteStationBtn.textContent = 'Delete Station';
        }
        return;
      }

      await loadBootstrap();
      closeDeleteStationModal();
      setMessage(payload.message || 'Station deleted successfully.', false);
      showToast(payload.message || 'Station deleted successfully.', false);
    } catch (error) {
      setDeleteStationMessage('Unable to delete station.', true);
      if (confirmDeleteStationBtn) {
        confirmDeleteStationBtn.disabled = false;
        confirmDeleteStationBtn.textContent = 'Delete Station';
      }
    }
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
    renderOptions();
    renderStats();
    renderTable();
    renderSubstationTable();
    setActiveTab(getPreferredUsersTab());
  }

  async function saveBarangay() {
    if (!barangayNameInput || !barangayLatitudeInput || !barangayLongitudeInput) {
      return;
    }

    const stationName = barangayNameInput.value.trim();
    const stationId = String(barangayStationIdInput ? barangayStationIdInput.value : '').trim();
    const latitude = readBarangayCoordinateValue(barangayLatitudeInput);
    const longitude = readBarangayCoordinateValue(barangayLongitudeInput);
    const aorRadiusKm = Number(barangayAorRadiusInput ? barangayAorRadiusInput.value || 0 : 0);
    syncBarangayAdminToggle();
    const createAdmin = shouldCreateBarangayAdmin();

    if (stationName.length < 2) {
      throw new Error('Substation name is required.');
    }

    if (latitude == null || longitude == null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      throw new Error('Please pin a valid location on the map.');
    }
    if (!Number.isFinite(aorRadiusKm) || aorRadiusKm <= 0) {
      throw new Error('Please enter a valid AOR radius in kilometers.');
    }

    if (createAdmin) {
      const adminDraft = readBarangayAdminDraft();
      if (adminDraft.username === '' || adminDraft.email === '' || adminDraft.password.trim() === '') {
        throw new Error('Admin username, email, and password are all required to create a substation admin.');
      }
    }

    const formData = new FormData();
    formData.append('action', stationId ? 'update_station' : 'create_station');
    if (stationId) {
      formData.append('stationId', stationId);
    }
    formData.append('stationName', stationName);
    formData.append('stationCode', String(barangayCodeInput ? barangayCodeInput.value : '').trim());
    formData.append('location', composeBarangayLocationString(readBarangayAddressParts()));
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));
    formData.append('stationStatus', String(barangayStatusInput ? barangayStatusInput.value : 'active'));
    formData.append('aorRadiusKm', String(aorRadiusKm));
    formData.append('createAdmin', createAdmin ? '1' : '0');
    if (createAdmin) {
      const adminDraft = readBarangayAdminDraft();
      formData.append('adminUsername', adminDraft.username);
      formData.append('adminEmail', adminDraft.email);
      formData.append('adminPassword', adminDraft.password);
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
    let toastMessage = payload.message || (stationId ? 'Substation updated successfully.' : 'Substation created successfully.');
    const cloudFolders = payload.data && payload.data.cloudFolders ? payload.data.cloudFolders : null;
    if (cloudFolders && cloudFolders.ok && cloudFolders.reportsPrefix) {
      toastMessage += ' Cloud folder: ' + String(cloudFolders.reportsPrefix) + '/';
    } else if (cloudFolders && cloudFolders.message && !cloudFolders.ok) {
      toastMessage += ' (' + String(cloudFolders.message) + ')';
    }
    showToast(toastMessage, false);
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

  if (createBarangayAdminInput) {
    createBarangayAdminInput.addEventListener('change', toggleBarangayAdminFields);
    toggleBarangayAdminFields();
  }

  [barangayAdminUsernameInput, barangayAdminEmailInput, barangayAdminPasswordInput].forEach(function (field) {
    if (!field) {
      return;
    }
    field.addEventListener('input', syncBarangayAdminToggle);
    field.addEventListener('change', syncBarangayAdminToggle);
  });

  if (barangayForm) {
    barangayForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setBarangayMessage(isBarangayEditMode() ? 'Saving changes...' : 'Creating substation...', false);
      saveBarangay().catch(function (error) {
        setBarangayMessage(error.message, true);
      });
    });
  }

  if (cancelBarangayBtn) {
    cancelBarangayBtn.addEventListener('click', closeBarangayModal);
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

  if (barangayFullAddressInput) {
    barangayFullAddressInput.addEventListener('input', function () {
      queueBarangayGeocode();
    });
    barangayFullAddressInput.addEventListener('change', function () {
      geocodeBarangayAddress();
    });
    barangayFullAddressInput.addEventListener('blur', function () {
      geocodeBarangayAddress();
    });
  }

  [barangayStreetInput, barangayBarangayInput, barangayLandmarkInput].forEach(function (field) {
    if (!field) {
      return;
    }
    field.addEventListener('input', function () {
      queueBarangayGeocode();
    });
    field.addEventListener('change', function () {
      geocodeBarangayAddress();
    });
    field.addEventListener('blur', function () {
      geocodeBarangayAddress();
    });
  });

  if (locateBarangayBtn) {
    locateBarangayBtn.addEventListener('click', function () {
      if (barangayGeocodeTimer) {
        window.clearTimeout(barangayGeocodeTimer);
        barangayGeocodeTimer = null;
      }
      clearBarangayCoordinatesForRelocate();
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
      const deleteButton = event.target.closest('[data-delete-station]');
      if (deleteButton) {
        if (!isSuperadminPage) {
          return;
        }
        const station = state.stations.find(function (entry) {
          return String(entry.stationId) === String(deleteButton.getAttribute('data-delete-station'));
        });
        if (!station) {
          return;
        }
        openDeleteStationModal(station);
        return;
      }

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

  if (confirmDeleteStationBtn) {
    confirmDeleteStationBtn.addEventListener('click', function () {
      if (!pendingDeleteStation) {
        return;
      }
      deleteStation(pendingDeleteStation);
    });
  }

  if (closeDeleteStationModalBtn) {
    closeDeleteStationModalBtn.addEventListener('click', closeDeleteStationModal);
  }
  if (cancelDeleteStationBtn) {
    cancelDeleteStationBtn.addEventListener('click', closeDeleteStationModal);
  }
  if (deleteStationModal) {
    deleteStationModal.addEventListener('click', function (event) {
      if (event.target && event.target.getAttribute('data-close-delete-station-modal') === 'true') {
        closeDeleteStationModal();
      }
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

  const civilianAlertsApiUrl = String(context.civilianAlertsApiUrl || '/firenet/NEWFIRENET/backend/controllers/admin_civilian_alerts.php');
  const refreshCivilianAlertsBtn = document.getElementById('refreshCivilianAlertsBtn');
  const civilianAlertBroadcastForm = document.getElementById('civilianAlertBroadcastForm');
  const civilianAlertSubject = document.getElementById('civilianAlertSubject');
  const civilianAlertBody = document.getElementById('civilianAlertBody');
  const civilianAlertTopic = document.getElementById('civilianAlertTopic');
  const civilianAlertBarangay = document.getElementById('civilianAlertBarangay');
  const civilianAlertSendEmail = document.getElementById('civilianAlertSendEmail');
  const civilianAlertSendSms = document.getElementById('civilianAlertSendSms');
  const civilianAlertSendBtn = document.getElementById('civilianAlertSendBtn');
  const civilianAlertFormMessage = document.getElementById('civilianAlertFormMessage');
  const civilianAlertsHistoryBody = document.getElementById('civilianAlertsHistoryBody');
  const civilianAlertTemplateId = document.getElementById('civilianAlertTemplateId');
  const civilianAlertTestEmailBtn = document.getElementById('civilianAlertTestEmailBtn');
  const civilianAlertAutoWeatherBtn = document.getElementById('civilianAlertAutoWeatherBtn');
  const civilianAlertTemplateButtons = Array.prototype.slice.call(document.querySelectorAll('[data-alert-template]'));
  let civilianAlertTemplates = {};

  function setCivilianAlertMessage(text, isError) {
    if (!civilianAlertFormMessage) {
      return;
    }
    civilianAlertFormMessage.textContent = text || '';
    civilianAlertFormMessage.style.color = isError ? '#ffb4b4' : '#9be7b5';
  }

  function formatAlertWhen(value) {
    const raw = String(value || '');
    if (!raw) {
      return '—';
    }
    const date = new Date(raw.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) {
      return raw;
    }
    return date.toLocaleString();
  }

  function renderCivilianAlertHistory(rows) {
    if (!civilianAlertsHistoryBody) {
      return;
    }
    const list = Array.isArray(rows) ? rows : [];
    if (list.length === 0) {
      civilianAlertsHistoryBody.innerHTML = '<tr><td colspan="6" class="muted-text users-empty-row">No broadcasts yet.</td></tr>';
      return;
    }
    civilianAlertsHistoryBody.innerHTML = list.map(function (row) {
      const emailPart = Number(row.send_email) === 1
        ? (Number(row.email_sent || 0) + ' ok' + (Number(row.email_failed || 0) ? (', ' + Number(row.email_failed) + ' fail') : ''))
        : '—';
      const smsPart = Number(row.send_sms) === 1
        ? (Number(row.sms_sent || 0) + ' ok' + (Number(row.sms_failed || 0) ? (', ' + Number(row.sms_failed) + ' fail') : ''))
        : '—';
      const topicLabel = row.template_id
        ? (String(row.topic || '') + ' · ' + String(row.template_id))
        : String(row.topic || '');
      return '<tr>'
        + '<td>' + formatAlertWhen(row.created_at) + '</td>'
        + '<td>' + escapeHtml(String(row.subject || '')) + '</td>'
        + '<td>' + escapeHtml(topicLabel) + '</td>'
        + '<td>' + escapeHtml(emailPart) + '</td>'
        + '<td>' + escapeHtml(smsPart) + '</td>'
        + '<td>' + Number(row.recipient_count || 0) + '</td>'
        + '</tr>';
    }).join('');
  }

  function setChipReady(el, label, ready, detail) {
    if (!el) {
      return;
    }
    el.textContent = label + (ready ? (' ready' + (detail ? ' · ' + detail : '')) : ' not ready');
    el.classList.toggle('is-ready', !!ready);
    el.classList.toggle('is-warn', !ready);
  }

  function applyCivilianAlertTemplate(templateId) {
    const tpl = civilianAlertTemplates[templateId];
    if (!tpl) {
      return;
    }
    if (civilianAlertTemplateId) {
      civilianAlertTemplateId.value = String(tpl.id || templateId);
    }
    if (civilianAlertSubject) {
      civilianAlertSubject.value = String(tpl.subject || '');
    }
    if (civilianAlertBody) {
      civilianAlertBody.value = String(tpl.body || '');
    }
    if (civilianAlertTopic) {
      civilianAlertTopic.value = String(tpl.topic || 'weather');
    }
    civilianAlertTemplateButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-alert-template') === templateId);
    });
    setCivilianAlertMessage('Loaded "' + (tpl.label || templateId) + '" template. Review and click Send alert.', false);
  }

  async function loadCivilianAlertStats() {
    if (!document.getElementById('civilianAlertsSection')) {
      return;
    }
    setCivilianAlertMessage('Loading subscriber stats…', false);
    const response = await fetch(civilianAlertsApiUrl + '?action=stats', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch (e) {
      payload = null;
    }
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) ? payload.message : 'Unable to load alert stats.');
    }
    const data = payload.data || {};
    const subs = data.subscribers || {};
    const setText = function (id, value) {
      const node = document.getElementById(id);
      if (node) {
        node.textContent = String(Number(value || 0));
      }
    };
    setText('civilianAlertsTotal', subs.total);
    setText('civilianAlertsEmail', subs.email);
    setText('civilianAlertsSms', subs.sms);
    setText('civilianAlertsTopicWeather', subs.topicWeather);
    setText('civilianAlertsTopicAnnouncements', subs.topicAnnouncements);
    setText('civilianAlertsTopicSafety', subs.topicSafety);
    setChipReady(document.getElementById('civilianAlertsMailReadyChip'), 'Email', !!data.mailReady, '');
    setChipReady(
      document.getElementById('civilianAlertsSmsReadyChip'),
      'SMS',
      !!data.smsReady,
      data.smsMode === 'local-log' ? 'log mode' : String(data.smsProvider || '')
    );

    const defaults = data.defaults || {};
    if (civilianAlertSendEmail && typeof defaults.sendEmail === 'boolean') {
      civilianAlertSendEmail.checked = defaults.sendEmail;
    }
    if (civilianAlertSendSms && typeof defaults.sendSms === 'boolean') {
      civilianAlertSendSms.checked = defaults.sendSms;
    }
    if (civilianAlertAutoWeatherBtn) {
      civilianAlertAutoWeatherBtn.disabled = defaults.weatherAutoEnabled === false;
      civilianAlertAutoWeatherBtn.title = defaults.weatherAutoEnabled === false
        ? 'Enable weather auto-send in System Settings'
        : 'Scan live Makati weather and auto-send matching templates';
    }

    civilianAlertTemplates = {};
    (Array.isArray(data.templates) ? data.templates : []).forEach(function (tpl) {
      if (tpl && tpl.id) {
        civilianAlertTemplates[String(tpl.id)] = tpl;
      }
    });

    renderCivilianAlertHistory(data.recentBroadcasts || []);
    if (Number(subs.total || 0) === 0) {
      setCivilianAlertMessage('No active subscribers yet. Civilians must opt in on the public portal before broadcasts can deliver.', true);
    } else {
      setCivilianAlertMessage('', false);
    }
  }

  async function sendCivilianAlertBroadcast() {
    const subject = civilianAlertSubject ? civilianAlertSubject.value.trim() : '';
    const body = civilianAlertBody ? civilianAlertBody.value.trim() : '';
    const topic = civilianAlertTopic ? civilianAlertTopic.value : 'weather';
    const barangay = civilianAlertBarangay ? civilianAlertBarangay.value.trim() : '';
    const sendEmail = !!(civilianAlertSendEmail && civilianAlertSendEmail.checked);
    const sendSms = !!(civilianAlertSendSms && civilianAlertSendSms.checked);
    const templateId = civilianAlertTemplateId ? civilianAlertTemplateId.value.trim() : '';

    if (!subject || !body) {
      throw new Error('Subject and message are required. Pick a template or write your own.');
    }
    if (!sendEmail && !sendSms) {
      throw new Error('Choose Email and/or SMS.');
    }

    const channels = [];
    if (sendEmail) {
      channels.push('email');
    }
    if (sendSms) {
      channels.push('SMS');
    }
    if (!window.confirm('Send this alert via ' + channels.join(' + ') + ' to matching subscribers?')) {
      return;
    }

    if (civilianAlertSendBtn) {
      civilianAlertSendBtn.disabled = true;
    }
    setCivilianAlertMessage('Sending alert…', false);

    try {
      const response = await fetch(civilianAlertsApiUrl + '?action=broadcast', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: subject,
          body: body,
          topic: topic,
          barangay: barangay,
          sendEmail: sendEmail,
          sendSms: sendSms,
          templateId: templateId
        })
      });
      let payload = null;
      try {
        payload = await response.json();
      } catch (e) {
        payload = null;
      }
      if (!response.ok || !payload || payload.ok !== true) {
        throw new Error((payload && payload.message) ? payload.message : 'Unable to send alert.');
      }

      const result = payload.data || {};
      let detail = payload.message || 'Alert sent.';
      if (Array.isArray(result.emailErrors) && result.emailErrors.length) {
        detail += ' Email errors: ' + result.emailErrors.join(' | ');
      }
      if (Array.isArray(result.smsErrors) && result.smsErrors.length) {
        detail += ' SMS errors: ' + result.smsErrors.join(' | ');
      }
      setCivilianAlertMessage(detail, Number(result.emailFailed || 0) > 0 || Number(result.smsFailed || 0) > 0);
      showToast(payload.message || 'Alert sent.', false);
      if (civilianAlertBroadcastForm) {
        civilianAlertBroadcastForm.reset();
        if (civilianAlertSendEmail) {
          civilianAlertSendEmail.checked = true;
        }
        if (civilianAlertSendSms) {
          civilianAlertSendSms.checked = true;
        }
        if (civilianAlertTopic) {
          civilianAlertTopic.value = 'weather';
        }
        if (civilianAlertTemplateId) {
          civilianAlertTemplateId.value = '';
        }
        civilianAlertTemplateButtons.forEach(function (btn) {
          btn.classList.remove('is-active');
        });
      }
      await loadCivilianAlertStats();
    } finally {
      if (civilianAlertSendBtn) {
        civilianAlertSendBtn.disabled = false;
      }
    }
  }

  async function testCivilianAlertEmail() {
    setCivilianAlertMessage('Sending Gmail SMTP test…', false);
    if (civilianAlertTestEmailBtn) {
      civilianAlertTestEmailBtn.disabled = true;
    }
    try {
      const response = await fetch(civilianAlertsApiUrl + '?action=test_email', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      let payload = null;
      try {
        payload = await response.json();
      } catch (e) {
        payload = null;
      }
      if (!response.ok || !payload || payload.ok !== true) {
        throw new Error((payload && payload.message) ? payload.message : 'Test email failed.');
      }
      setCivilianAlertMessage(payload.message || 'Test email sent.', false);
      showToast(payload.message || 'Test email sent.', false);
    } finally {
      if (civilianAlertTestEmailBtn) {
        civilianAlertTestEmailBtn.disabled = false;
      }
    }
  }

  async function autoSendWeatherAlerts() {
    const sendEmail = !!(civilianAlertSendEmail && civilianAlertSendEmail.checked);
    const sendSms = !!(civilianAlertSendSms && civilianAlertSendSms.checked);
    if (!sendEmail && !sendSms) {
      throw new Error('Turn on Email and/or SMS before auto-scan.');
    }
    if (!window.confirm('Scan live Makati weather and auto-send matching templates (heat / cold / flash flood / typhoon) to subscribers?')) {
      return;
    }
    setCivilianAlertMessage('Scanning weather and sending matched templates…', false);
    if (civilianAlertAutoWeatherBtn) {
      civilianAlertAutoWeatherBtn.disabled = true;
    }
    try {
      const response = await fetch(civilianAlertsApiUrl + '?action=auto_weather', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sendEmail: sendEmail,
          sendSms: sendSms
        })
      });
      let payload = null;
      try {
        payload = await response.json();
      } catch (e) {
        payload = null;
      }
      if (!response.ok || !payload || payload.ok !== true) {
        throw new Error((payload && payload.message) ? payload.message : 'Weather auto-send failed.');
      }
      const data = payload.data || {};
      const detected = Array.isArray(data.detected) ? data.detected.join(', ') : '';
      const sentCount = Array.isArray(data.sent) ? data.sent.length : 0;
      setCivilianAlertMessage(
        (payload.message || 'Weather scan complete.')
          + (detected ? (' Detected: ' + detected + '.') : '')
          + (sentCount ? (' Sent templates: ' + sentCount + '.') : ''),
        false
      );
      showToast(payload.message || 'Weather scan complete.', false);
      await loadCivilianAlertStats();
    } finally {
      if (civilianAlertAutoWeatherBtn) {
        civilianAlertAutoWeatherBtn.disabled = false;
      }
    }
  }

  if (refreshCivilianAlertsBtn) {
    refreshCivilianAlertsBtn.addEventListener('click', function () {
      loadCivilianAlertStats().catch(function (error) {
        setCivilianAlertMessage(error.message || 'Unable to load alert stats.', true);
      });
    });
  }

  civilianAlertTemplateButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-alert-template') || '';
      if (!civilianAlertTemplates[id]) {
        // Fallback local copies if stats not loaded yet
        const fallback = {
          typhoon: {
            id: 'typhoon',
            label: 'Typhoon / storm',
            subject: 'Typhoon watch — Makati Fire District advisory',
            body: 'PAGASA-level storm conditions may affect Metro Manila.\n\nStay indoors, prepare a go-bag, and call 168 only for emergencies.',
            topic: 'weather'
          },
          flashflood: {
            id: 'flashflood',
            label: 'Flash flood',
            subject: 'Flash flood watch — avoid flooded roads',
            body: 'Heavy rainfall may cause sudden flooding in low-lying Makati areas.\n\nDo not walk or drive through floodwater. Call 168 if someone is trapped.',
            topic: 'weather'
          },
          heat: {
            id: 'heat',
            label: 'Extreme heat',
            subject: 'Extreme heat advisory — stay hydrated',
            body: 'Temperatures are dangerously high in Metro Manila.\n\nLimit outdoor activity from 10 AM–3 PM and drink water often.',
            topic: 'weather'
          },
          cold: {
            id: 'cold',
            label: 'Cold / chill',
            subject: 'Cold weather advisory — keep warm and dry',
            body: 'Unusually cool conditions are affecting Metro Manila.\n\nDress in layers and check on children and elderly household members.',
            topic: 'weather'
          },
          tsunami: {
            id: 'tsunami',
            label: 'Tsunami warning',
            subject: 'Tsunami warning — move to higher ground if advised',
            body: 'A tsunami advisory/warning has been issued for Philippine coastal areas.\n\nIf near the coast, move inland/higher ground and follow official instructions.',
            topic: 'weather'
          }
        };
        civilianAlertTemplates[id] = fallback[id];
      }
      applyCivilianAlertTemplate(id);
    });
  });

  if (civilianAlertTestEmailBtn) {
    civilianAlertTestEmailBtn.addEventListener('click', function () {
      testCivilianAlertEmail().catch(function (error) {
        setCivilianAlertMessage(error.message || 'Test email failed.', true);
      });
    });
  }

  if (civilianAlertAutoWeatherBtn) {
    civilianAlertAutoWeatherBtn.addEventListener('click', function () {
      autoSendWeatherAlerts().catch(function (error) {
        setCivilianAlertMessage(error.message || 'Weather auto-send failed.', true);
      });
    });
  }

  if (civilianAlertBroadcastForm) {
    civilianAlertBroadcastForm.addEventListener('submit', function (event) {
      event.preventDefault();
      sendCivilianAlertBroadcast().catch(function (error) {
        setCivilianAlertMessage(error.message || 'Unable to send alert.', true);
      });
    });
  }

  const systemSettingsApiUrl = String(context.systemSettingsApiUrl || '/firenet/NEWFIRENET/backend/controllers/admin_system_settings.php');
  const refreshSystemSettingsBtn = document.getElementById('refreshSystemSettingsBtn');
  const saveSystemSettingsBtn = document.getElementById('saveSystemSettingsBtn');
  const systemSettingsMessage = document.getElementById('systemSettingsMessage');
  let systemSettingsState = null;

  function setSystemSettingsMessage(text, isError) {
    if (!systemSettingsMessage) {
      return;
    }
    systemSettingsMessage.textContent = text || '';
    systemSettingsMessage.style.color = isError ? '#ffb4b4' : '#9be7b5';
  }

  function setSysStatus(id, ready, readyText, warnText) {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.textContent = ready ? (readyText || 'Ready') : (warnText || 'Not ready');
    const card = el.closest('.sys-status-card');
    if (card) {
      card.classList.toggle('is-ready', !!ready);
      card.classList.toggle('is-warn', !ready);
    }
  }

  function fillSystemSettingsForm(settings, integrations) {
    const s = settings || {};
    const setVal = function (id, value) {
      const el = document.getElementById(id);
      if (el) {
        el.value = value == null ? '' : String(value);
      }
    };
    const setCheck = function (id, value) {
      const el = document.getElementById(id);
      if (el) {
        el.checked = value === true || value === 1 || value === '1';
      }
    };

    setVal('sysAppName', s.app_name);
    setVal('sysDistrictName', s.district_name);
    setVal('sysPublicTagline', s.public_tagline);
    setVal('sysEmergencyHotline', s.emergency_hotline);
    setVal('sysCentralPhone', s.central_phone);
    setVal('sysMailFromName', s.mail_from_name);
    setCheck('sysSmsEnabled', s.sms_enabled);
    setVal('sysSmsProvider', s.sms_provider || 'log');
    setVal('sysSmsSenderName', s.sms_sender_name);
    setVal('sysSmsApiKey', '');
    setCheck('sysPortalSubscribeEnabled', s.portal_subscribe_enabled);
    setCheck('sysPortalMaintenanceEnabled', s.portal_maintenance_enabled);
    setVal('sysPortalMaintenanceMessage', s.portal_maintenance_message);
    setVal('sysDefaultAutoLogout', s.default_auto_logout_minutes || '30');
    setCheck('sysSecurityAlertsDefault', s.security_alerts_default);
    setCheck('sysAlertDefaultEmail', s.alert_default_send_email);
    setCheck('sysAlertDefaultSms', s.alert_default_send_sms);
    setCheck('sysWeatherAutoEnabled', s.weather_auto_enabled);

    const keyHint = document.getElementById('sysSmsKeyHint');
    if (keyHint) {
      keyHint.textContent = s.sms_api_key_set === '1'
        ? 'A live API key is stored. Leave the field blank to keep it, or paste a new key to replace it.'
        : 'No live API key stored yet. Use Log mode for free testing, or paste a Semaphore key for real SMS.';
    }

    const integ = integrations || {};
    setSysStatus('sysStatusMail', !!integ.mailReady, 'Ready', 'Check SMTP');
    setSysStatus(
      'sysStatusSms',
      !!integ.smsReady,
      integ.smsMode === 'local-log' ? 'Log mode' : 'Ready',
      'Not ready'
    );
    setSysStatus('sysStatusMaps', !!integ.mapsReady, 'Ready', 'No API key');
    setSysStatus('sysStatusAuth', !!integ.googleAuthReady, 'Ready', 'Not configured');
  }

  async function loadSystemSettings() {
    if (!document.getElementById('systemSettingsSection')) {
      return;
    }
    setSystemSettingsMessage('Loading system settings…', false);
    const response = await fetch(systemSettingsApiUrl + '?action=get', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch (e) {
      payload = null;
    }
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) ? payload.message : 'Unable to load system settings.');
    }
    systemSettingsState = payload.data || {};
    fillSystemSettingsForm(systemSettingsState.settings || {}, systemSettingsState.integrations || {});
    setSystemSettingsMessage('', false);
  }

  function readSystemSettingsForm() {
    const checked = function (id) {
      const el = document.getElementById(id);
      return !!(el && el.checked);
    };
    const value = function (id) {
      const el = document.getElementById(id);
      return el ? String(el.value || '').trim() : '';
    };
    const payload = {
      app_name: value('sysAppName'),
      district_name: value('sysDistrictName'),
      public_tagline: value('sysPublicTagline'),
      emergency_hotline: value('sysEmergencyHotline'),
      central_phone: value('sysCentralPhone'),
      mail_from_name: value('sysMailFromName'),
      sms_enabled: checked('sysSmsEnabled') ? '1' : '0',
      sms_provider: value('sysSmsProvider') || 'log',
      sms_sender_name: value('sysSmsSenderName'),
      portal_subscribe_enabled: checked('sysPortalSubscribeEnabled') ? '1' : '0',
      portal_maintenance_enabled: checked('sysPortalMaintenanceEnabled') ? '1' : '0',
      portal_maintenance_message: value('sysPortalMaintenanceMessage'),
      default_auto_logout_minutes: value('sysDefaultAutoLogout') || '30',
      security_alerts_default: checked('sysSecurityAlertsDefault') ? '1' : '0',
      alert_default_send_email: checked('sysAlertDefaultEmail') ? '1' : '0',
      alert_default_send_sms: checked('sysAlertDefaultSms') ? '1' : '0',
      weather_auto_enabled: checked('sysWeatherAutoEnabled') ? '1' : '0'
    };
    const apiKey = value('sysSmsApiKey');
    if (apiKey !== '') {
      payload.sms_api_key = apiKey;
    }
    return payload;
  }

  async function saveSystemSettings() {
    if (saveSystemSettingsBtn) {
      saveSystemSettingsBtn.disabled = true;
    }
    setSystemSettingsMessage('Saving…', false);
    try {
      const response = await fetch(systemSettingsApiUrl + '?action=save', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: readSystemSettingsForm() })
      });
      let payload = null;
      try {
        payload = await response.json();
      } catch (e) {
        payload = null;
      }
      if (!response.ok || !payload || payload.ok !== true) {
        throw new Error((payload && payload.message) ? payload.message : 'Unable to save system settings.');
      }
      systemSettingsState = payload.data || {};
      fillSystemSettingsForm(systemSettingsState.settings || {}, systemSettingsState.integrations || {});
      setSystemSettingsMessage(payload.message || 'System settings saved.', false);
      showToast(payload.message || 'System settings saved.', false);
    } finally {
      if (saveSystemSettingsBtn) {
        saveSystemSettingsBtn.disabled = false;
      }
    }
  }

  if (refreshSystemSettingsBtn) {
    refreshSystemSettingsBtn.addEventListener('click', function () {
      loadSystemSettings().catch(function (error) {
        setSystemSettingsMessage(error.message || 'Unable to load system settings.', true);
      });
    });
  }
  if (saveSystemSettingsBtn) {
    saveSystemSettingsBtn.addEventListener('click', function () {
      saveSystemSettings().catch(function (error) {
        setSystemSettingsMessage(error.message || 'Unable to save system settings.', true);
      });
    });
  }

  setActiveTab(getPreferredUsersTab());

  loadBootstrap().catch(function (error) {
    usersTableBody.innerHTML = '<tr><td colspan="7" class="muted-text">Unable to load users.</td></tr>';
    setMessage(error.message, true);
  });
})();
