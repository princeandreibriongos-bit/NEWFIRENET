(function () {
  const contextElement = document.getElementById('settingsContext');
  if (!contextElement) return;

  let context = {};
  try {
    context = JSON.parse(contextElement.textContent || '{}') || {};
  } catch (e) {
    context = {};
  }

  const endpoint = String(context.settingsApiUrl || '/firenet/NEWFIRENET/backend/controllers/settings.php');
  const logoutUrl = '/firenet/NEWFIRENET/backend/controllers/logout.php';
  const preferenceStorageKey = 'firenet.userSettingsState';
  const sidebarCollapsedKey = 'firenet.sidebarCollapsed';

  const els = {
    displayName: document.getElementById('settingsDisplayName'),
    displayRole: document.getElementById('settingsDisplayRole'),
    displayStation: document.getElementById('settingsDisplayStation'),
    avatar: document.getElementById('settingsAvatar'),
    avatarImage: document.getElementById('settingsAvatarImage'),
    avatarInitials: document.getElementById('settingsAvatarInitials'),
    username: document.getElementById('settingsUsername'),
    email: document.getElementById('settingsEmail'),
    status: document.getElementById('settingsStatus'),
    station: document.getElementById('settingsStation'),
    message: document.getElementById('settingsMessage'),
    photoInput: document.getElementById('profilePhotoInput'),
    uploadPhoto: document.getElementById('uploadProfilePhotoBtn'),
    removePhoto: document.getElementById('removeProfilePhotoBtn'),
    copyEmail: document.getElementById('copyEmailBtn'),
    preferencesForm: document.getElementById('preferencesForm'),
    compactMode: document.getElementById('compactModeToggle'),
    reduceMotion: document.getElementById('reduceMotionToggle'),
    largeText: document.getElementById('largeTextToggle'),
    sidebarCompact: document.getElementById('sidebarCompactToggle'),
    preferredLanding: document.getElementById('preferredLandingSelect'),
    preferencesMessage: document.getElementById('preferencesMessage'),
    securityForm: document.getElementById('securityForm'),
    securityAlerts: document.getElementById('securityAlertsToggle'),
    soundNotifications: document.getElementById('soundNotificationsToggle'),
    desktopNotifications: document.getElementById('desktopNotificationsToggle'),
    hideSensitive: document.getElementById('hideSensitiveToggle'),
    autoLogout: document.getElementById('autoLogoutSelect'),
    securityMessage: document.getElementById('securityMessage'),
    passwordModal: document.getElementById('passwordModal'),
    passwordForm: document.getElementById('passwordForm'),
    currentPassword: document.getElementById('currentPassword'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    showPassword: document.getElementById('showPasswordToggle'),
    passwordMessage: document.getElementById('passwordMessage'),
    strengthBar: document.getElementById('passwordStrengthBar'),
    strengthLabel: document.getElementById('passwordStrengthLabel')
  };

  let inactivityTimerId = null;
  let currentProfile = null;

  function setInfo(target, text, isError) {
    if (!target) return;
    target.textContent = text || '';
    target.style.color = isError ? '#ffb4b4' : '#9be7b5';
  }

  function getInitials(username, email, role) {
    const primary = String(username || '').trim();
    const roleLabel = String(role || '').trim();
    let source = primary;
    if (!source || source.toLowerCase() === roleLabel.toLowerCase()) {
      source = roleLabel || String(email || '').trim();
    }
    if (!source) return 'FN';
    const parts = source.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return source.slice(0, 2).toUpperCase();
  }

  function saveLocalSettings(values) {
    try {
      localStorage.setItem(preferenceStorageKey, JSON.stringify(values || {}));
    } catch (e) {}
  }

  function syncSidebar(collapsed) {
    try {
      localStorage.setItem(sidebarCollapsedKey, collapsed ? '1' : '0');
    } catch (e) {}
    const layout = document.getElementById('appLayout');
    const btn = document.getElementById('sidebarCollapseBtn');
    if (layout) layout.classList.toggle('sidebar-collapsed', !!collapsed);
    if (btn) btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }

  function applyBodyPrefs(values) {
    const v = values || {};
    document.body.classList.toggle('is-compact-ui', !!v.compactMode);
    document.body.classList.toggle('is-reduced-motion', !!v.reduceMotion);
    document.body.classList.toggle('is-large-text', !!v.largeText);
    document.body.classList.toggle('is-sensitive-hidden', !!v.hideSensitive);
    document.body.classList.toggle('is-alerts-muted', v.securityAlerts === false);
    syncSidebar(!!v.darkMode);
    saveLocalSettings(v);
    if (window.FireNetPrefs && typeof window.FireNetPrefs.apply === 'function') {
      window.FireNetPrefs.apply(v);
    }
  }

  function resetInactivityTimer() {
    if (window.FireNetPrefs && typeof window.FireNetPrefs.resetIdle === 'function') {
      window.FireNetPrefs.resetIdle();
      return;
    }
    if (inactivityTimerId) {
      window.clearTimeout(inactivityTimerId);
      inactivityTimerId = null;
    }
    const minutes = Number((els.autoLogout && els.autoLogout.value) || 0);
    if (minutes < 1) return;
    inactivityTimerId = window.setTimeout(function () {
      window.location.href = logoutUrl;
    }, minutes * 60000);
  }

  function readWorkspaceValues() {
    return {
      compactMode: !!(els.compactMode && els.compactMode.checked),
      reduceMotion: !!(els.reduceMotion && els.reduceMotion.checked),
      largeText: !!(els.largeText && els.largeText.checked),
      darkMode: !!(els.sidebarCompact && els.sidebarCompact.checked),
      preferredLanding: els.preferredLanding ? els.preferredLanding.value : 'dashboard',
      securityAlerts: !!(els.securityAlerts && els.securityAlerts.checked),
      soundNotifications: !!(els.soundNotifications && els.soundNotifications.checked),
      desktopNotifications: !!(els.desktopNotifications && els.desktopNotifications.checked),
      hideSensitive: !!(els.hideSensitive && els.hideSensitive.checked),
      autoLogoutMinutes: Number((els.autoLogout && els.autoLogout.value) || 0)
    };
  }

  function fillPrefs(settings) {
    const s = settings || {};
    if (els.compactMode) els.compactMode.checked = !!s.compactMode;
    if (els.reduceMotion) els.reduceMotion.checked = !!s.reduceMotion;
    if (els.largeText) els.largeText.checked = !!s.largeText;
    if (els.sidebarCompact) els.sidebarCompact.checked = !!s.darkMode;
    if (els.preferredLanding) els.preferredLanding.value = s.preferredLanding || 'dashboard';
    if (els.securityAlerts) els.securityAlerts.checked = s.securityAlerts !== false;
    if (els.soundNotifications) els.soundNotifications.checked = !!s.soundNotifications;
    if (els.desktopNotifications) els.desktopNotifications.checked = !!s.desktopNotifications;
    if (els.hideSensitive) els.hideSensitive.checked = !!s.hideSensitive;
    if (els.autoLogout) els.autoLogout.value = String(s.autoLogoutMinutes != null ? s.autoLogoutMinutes : 30);
    applyBodyPrefs(readWorkspaceValues());
    resetInactivityTimer();
  }

  function applyProfile(profile) {
    currentProfile = profile || {};
    const username = String(profile.username || '');
    const email = String(profile.email || '');
    const role = String(profile.role || context.role || 'user');
    const station = String(profile.stationName || context.stationName || 'Station');
    const status = String(profile.status || 'active');

    if (els.username) els.username.value = username;
    if (els.email) els.email.value = email;
    if (els.status) els.status.value = status;
    if (els.station) els.station.value = station;
    if (els.displayName) els.displayName.textContent = username || 'FireNet User';
    if (els.displayRole) els.displayRole.textContent = role;
    if (els.displayStation) els.displayStation.textContent = station;

    const initials = getInitials(username, email, role);
    if (els.avatarInitials) els.avatarInitials.textContent = initials;

    const photoUrl = String(profile.profilePhotoUrl || '').trim();
    if (els.avatarImage && els.avatar) {
      if (photoUrl) {
        els.avatarImage.src = photoUrl + (photoUrl.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
        els.avatarImage.hidden = false;
        if (els.avatarInitials) els.avatarInitials.hidden = true;
        els.avatar.classList.add('has-photo');
      } else {
        els.avatarImage.hidden = true;
        els.avatarImage.removeAttribute('src');
        if (els.avatarInitials) els.avatarInitials.hidden = false;
        els.avatar.classList.remove('has-photo');
      }
    }

    const headerPhoto = document.getElementById('headerProfilePhoto');
    const headerInitials = document.getElementById('headerProfileInitials');
    if (headerPhoto && headerInitials) {
      headerInitials.textContent = initials;
      if (photoUrl) {
        headerPhoto.src = photoUrl + (photoUrl.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
        headerPhoto.hidden = false;
        headerInitials.hidden = true;
      } else {
        headerPhoto.hidden = true;
        headerPhoto.removeAttribute('src');
        headerInitials.hidden = false;
      }
    }
  }

  function openPasswordModal() {
    if (!els.passwordModal) return;
    if (els.passwordForm) els.passwordForm.reset();
    setInfo(els.passwordMessage, '', false);
    updateStrength('');
    els.passwordModal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (els.currentPassword) els.currentPassword.focus();
  }

  function closePasswordModal() {
    if (!els.passwordModal) return;
    els.passwordModal.hidden = true;
    document.body.style.overflow = '';
  }

  function updateStrength(password) {
    const value = String(password || '');
    let score = 0;
    if (value.length >= 6) score += 1;
    if (value.length >= 10) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    const pct = Math.min(100, score * 20);
    if (els.strengthBar) {
      els.strengthBar.style.width = pct + '%';
      els.strengthBar.dataset.score = String(score);
    }
    if (els.strengthLabel) {
      const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
      els.strengthLabel.textContent = value ? labels[score] : 'Use at least 6 characters.';
    }
  }

  // Section rail
  document.querySelectorAll('[data-settings-section]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const section = btn.getAttribute('data-settings-section');
      document.querySelectorAll('[data-settings-section]').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      document.querySelectorAll('[data-settings-panel]').forEach(function (panel) {
        const active = panel.getAttribute('data-settings-panel') === section;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    });
  });

  if (els.avatarImage) {
    els.avatarImage.addEventListener('error', function () {
      els.avatarImage.hidden = true;
      if (els.avatarInitials) els.avatarInitials.hidden = false;
      if (els.avatar) els.avatar.classList.remove('has-photo');
    });
  }

  if (els.copyEmail) {
    els.copyEmail.addEventListener('click', async function () {
      const email = els.email ? els.email.value.trim() : '';
      if (!email) {
        setInfo(els.message, 'No email on this account.', true);
        return;
      }
      try {
        await navigator.clipboard.writeText(email);
        setInfo(els.message, 'Email copied.', false);
      } catch (e) {
        setInfo(els.message, 'Unable to copy email.', true);
      }
    });
  }

  if (els.uploadPhoto && els.photoInput) {
    els.uploadPhoto.addEventListener('click', function () {
      els.photoInput.click();
    });
    els.photoInput.addEventListener('change', async function () {
      const file = els.photoInput.files && els.photoInput.files[0] ? els.photoInput.files[0] : null;
      if (!file) return;
      if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].indexOf(file.type) === -1) {
        setInfo(els.message, 'Use JPG, PNG, WEBP, or GIF.', true);
        els.photoInput.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setInfo(els.message, 'Max image size is 2MB.', true);
        els.photoInput.value = '';
        return;
      }
      const formData = new FormData();
      formData.append('action', 'upload_profile_photo');
      formData.append('profilePhoto', file);
      els.uploadPhoto.disabled = true;
      setInfo(els.message, 'Uploading photo…', false);
      try {
        const response = await fetch(endpoint, { method: 'POST', credentials: 'same-origin', body: formData });
        const payload = await response.json();
        if (!response.ok || !payload || payload.ok !== true) {
          throw new Error((payload && payload.message) || 'Upload failed.');
        }
        if (payload.profile) applyProfile(payload.profile);
        setInfo(els.message, payload.message || 'Photo updated.', false);
      } catch (error) {
        setInfo(els.message, error.message || 'Upload failed.', true);
      } finally {
        els.uploadPhoto.disabled = false;
        els.photoInput.value = '';
      }
    });
  }

  if (els.removePhoto) {
    els.removePhoto.addEventListener('click', async function () {
      if (!window.confirm('Remove your profile photo?')) return;
      els.removePhoto.disabled = true;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'remove_profile_photo' })
        });
        const payload = await response.json();
        if (!response.ok || !payload || payload.ok !== true) {
          throw new Error((payload && payload.message) || 'Unable to remove photo.');
        }
        if (payload.profile) applyProfile(payload.profile);
        setInfo(els.message, payload.message || 'Photo removed.', false);
      } catch (error) {
        setInfo(els.message, error.message || 'Unable to remove photo.', true);
      } finally {
        els.removePhoto.disabled = false;
      }
    });
  }

  if (els.preferencesForm) {
    els.preferencesForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const values = readWorkspaceValues();
      setInfo(els.preferencesMessage, 'Saving workspace…', false);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_preferences',
            compactMode: values.compactMode,
            reduceMotion: values.reduceMotion,
            darkMode: values.darkMode,
            largeText: values.largeText,
            preferredLanding: values.preferredLanding
          })
        });
        const payload = await response.json();
        if (!response.ok || !payload || payload.ok !== true) {
          throw new Error((payload && payload.message) || 'Unable to save workspace.');
        }
        fillPrefs(Object.assign(values, payload.settings || {}));
        setInfo(els.preferencesMessage, payload.message || 'Workspace saved.', false);
      } catch (error) {
        setInfo(els.preferencesMessage, error.message || 'Unable to save workspace.', true);
      }
    });
  }

  if (els.securityForm) {
    els.securityForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const values = readWorkspaceValues();
      if (values.desktopNotifications && window.Notification && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (e) {}
      }
      setInfo(els.securityMessage, 'Saving security…', false);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_security',
            securityAlerts: values.securityAlerts,
            hideSensitive: values.hideSensitive,
            soundNotifications: values.soundNotifications,
            desktopNotifications: values.desktopNotifications,
            autoLogoutMinutes: values.autoLogoutMinutes
          })
        });
        const payload = await response.json();
        if (!response.ok || !payload || payload.ok !== true) {
          throw new Error((payload && payload.message) || 'Unable to save security.');
        }
        fillPrefs(Object.assign(values, payload.settings || {}));
        setInfo(els.securityMessage, payload.message || 'Security saved.', false);
      } catch (error) {
        setInfo(els.securityMessage, error.message || 'Unable to save security.', true);
      }
    });
  }

  ['compactMode', 'reduceMotion', 'largeText', 'sidebarCompact', 'preferredLanding', 'securityAlerts', 'soundNotifications', 'desktopNotifications', 'hideSensitive', 'autoLogout'].forEach(function (key) {
    const el = els[key];
    if (!el) return;
    el.addEventListener('change', function () {
      applyBodyPrefs(readWorkspaceValues());
      resetInactivityTimer();
    });
  });

  document.querySelectorAll('#openPasswordModalBtn, #openPasswordModalBtn2').forEach(function (btn) {
    btn.addEventListener('click', openPasswordModal);
  });
  document.querySelectorAll('[data-close-password-modal="true"], #cancelPasswordBtn, #closePasswordModalBtn').forEach(function (btn) {
    btn.addEventListener('click', closePasswordModal);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && els.passwordModal && !els.passwordModal.hidden) {
      closePasswordModal();
    }
  });

  if (els.showPassword) {
    els.showPassword.addEventListener('change', function () {
      const type = els.showPassword.checked ? 'text' : 'password';
      [els.currentPassword, els.newPassword, els.confirmPassword].forEach(function (input) {
        if (input) input.type = type;
      });
    });
  }
  if (els.newPassword) {
    els.newPassword.addEventListener('input', function () {
      updateStrength(els.newPassword.value);
    });
  }

  if (els.passwordForm) {
    els.passwordForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const currentPassword = els.currentPassword ? els.currentPassword.value : '';
      const nextPassword = els.newPassword ? els.newPassword.value : '';
      const confirmPassword = els.confirmPassword ? els.confirmPassword.value : '';
      if (!currentPassword || !nextPassword || !confirmPassword) {
        setInfo(els.passwordMessage, 'Complete all password fields.', true);
        return;
      }
      if (nextPassword.length < 6) {
        setInfo(els.passwordMessage, 'New password must be at least 6 characters.', true);
        return;
      }
      if (nextPassword !== confirmPassword) {
        setInfo(els.passwordMessage, 'New password and confirmation do not match.', true);
        return;
      }
      if (!window.confirm('Change your password now? A confirmation email will be sent.')) {
        return;
      }
      setInfo(els.passwordMessage, 'Updating password…', false);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'change_password',
            currentPassword: currentPassword,
            newPassword: nextPassword,
            confirmPassword: confirmPassword,
            confirmChange: true
          })
        });
        const payload = await response.json();
        if (!response.ok || !payload || payload.ok !== true) {
          throw new Error((payload && payload.message) || 'Unable to change password.');
        }
        setInfo(els.passwordMessage, payload.message || 'Password changed.', false);
        window.setTimeout(closePasswordModal, 900);
      } catch (error) {
        setInfo(els.passwordMessage, error.message || 'Unable to change password.', true);
      }
    });
  }

  ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'].forEach(function (name) {
    document.addEventListener(name, resetInactivityTimer, { passive: true });
  });

  async function boot() {
    setInfo(els.message, 'Loading…', false);
    try {
      const response = await fetch(endpoint, { method: 'GET', credentials: 'same-origin' });
      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true || !payload.profile) {
        throw new Error((payload && payload.message) || 'Unable to load settings.');
      }
      applyProfile(payload.profile);
      fillPrefs(payload.profile.settings || {});
      setInfo(els.message, '', false);
    } catch (error) {
      if (els.displayName) els.displayName.textContent = String(context.username || 'FireNet User');
      if (els.displayStation) els.displayStation.textContent = String(context.stationName || 'Station');
      setInfo(els.message, error.message || 'Unable to load settings.', true);
    }
  }

  boot();
})();
