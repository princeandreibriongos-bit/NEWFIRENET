(function () {
  const contextElement = document.getElementById('settingsContext');
  const form = document.getElementById('settingsForm');
  const usernameInput = document.getElementById('settingsUsername');
  const emailInput = document.getElementById('settingsEmail');
  const avatar = document.getElementById('settingsAvatar');
  const avatarImage = document.getElementById('settingsAvatarImage');
  const avatarInitials = document.getElementById('settingsAvatarInitials');
  const displayName = document.getElementById('settingsDisplayName');
  const displayEmail = document.getElementById('settingsDisplayEmail');
  const profilePhotoInput = document.getElementById('profilePhotoInput');
  const uploadProfilePhotoBtn = document.getElementById('uploadProfilePhotoBtn');
  const removeProfilePhotoBtn = document.getElementById('removeProfilePhotoBtn');

  const preferencesForm = document.getElementById('preferencesForm');
  const compactModeToggle = document.getElementById('compactModeToggle');
  const reduceMotionToggle = document.getElementById('reduceMotionToggle');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const savePreferencesBtn = document.getElementById('savePreferencesBtn');
  const preferencesMessage = document.getElementById('preferencesMessage');

  const securityForm = document.getElementById('securityForm');
  const securityAlertsToggle = document.getElementById('securityAlertsToggle');
  const hideSensitiveToggle = document.getElementById('hideSensitiveToggle');
  const autoLogoutSelect = document.getElementById('autoLogoutSelect');
  const saveSecurityBtn = document.getElementById('saveSecurityBtn');
  const securityMessage = document.getElementById('securityMessage');

  const openPasswordModalBtn = document.getElementById('openPasswordModalBtn');
  const passwordModal = document.getElementById('passwordModal');
  const closePasswordModalBtn = document.getElementById('closePasswordModalBtn');
  const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
  const passwordForm = document.getElementById('passwordForm');
  const currentPasswordInput = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const showPasswordToggle = document.getElementById('showPasswordToggle');
  const passwordMessage = document.getElementById('passwordMessage');

  const saveBtn = document.getElementById('settingsSaveBtn');
  const message = document.getElementById('settingsMessage');

  if (
    !contextElement ||
    !form ||
    !usernameInput ||
    !emailInput ||
    !avatar ||
    !avatarImage ||
    !avatarInitials ||
    !displayName ||
    !displayEmail ||
    !profilePhotoInput ||
    !uploadProfilePhotoBtn ||
    !removeProfilePhotoBtn ||
    !preferencesForm ||
    !compactModeToggle ||
    !reduceMotionToggle ||
    !darkModeToggle ||
    !savePreferencesBtn ||
    !preferencesMessage ||
    !securityForm ||
    !securityAlertsToggle ||
    !hideSensitiveToggle ||
    !autoLogoutSelect ||
    !saveSecurityBtn ||
    !securityMessage ||
    !openPasswordModalBtn ||
    !passwordModal ||
    !closePasswordModalBtn ||
    !cancelPasswordBtn ||
    !passwordForm ||
    !currentPasswordInput ||
    !newPasswordInput ||
    !confirmPasswordInput ||
    !showPasswordToggle ||
    !passwordMessage ||
    !saveBtn ||
    !message
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

  const endpoint = String(context.settingsApiUrl || '/firenet/NEWFIRENET/backend/controllers/settings.php');
  const logoutUrl = '/firenet/NEWFIRENET/backend/controllers/logout.php';
  const preferenceStorageKey = 'firenet.userSettingsState';
  let inactivityTimerId = null;

  function loadLocalSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(preferenceStorageKey) || '{}');
      return stored && typeof stored === 'object' ? stored : {};
    } catch (error) {
      return {};
    }
  }

  function saveLocalSettings(values) {
    localStorage.setItem(preferenceStorageKey, JSON.stringify(values || {}));
  }

  function setInfo(target, text, isError) {
    target.textContent = text;
    target.style.color = isError ? '#b51f2c' : '#2e5b3f';
  }

  function setMessage(text, isError) {
    setInfo(message, text, isError);
  }

  function setPasswordMessage(text, isError) {
    setInfo(passwordMessage, text, isError);
  }

  function setPreferencesMessage(text, isError) {
    setInfo(preferencesMessage, text, isError);
  }

  function setSecurityMessage(text, isError) {
    setInfo(securityMessage, text, isError);
  }

  function getInitials(username, email, role) {
    const primary = String(username || '').trim();
    const rawRole = String(role || '').trim();
    let roleLabel = rawRole;
    if (roleLabel.toLowerCase() === 'superadmin') {
      roleLabel = 'Super Admin';
    }

    const userKey = primary.toLowerCase().replace(/\s+/g, '');
    const roleKey = roleLabel.toLowerCase().replace(/\s+/g, '');
    let source = primary;

    if (source === '' || (roleKey && userKey === roleKey)) {
      source = roleLabel || String(email || '').trim();
    }

    if (source === '') {
      return 'FN';
    }

    const parts = source.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  }

  function closeModal(modal) {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function openModal(modal) {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function applyProfile(profile) {
    usernameInput.value = String(profile.username || '');
    emailInput.value = String(profile.email || '');
    displayName.textContent = String(profile.username || 'FireNet User');
    displayEmail.textContent = String(profile.email || 'No email set');
    avatarInitials.textContent = getInitials(profile.username, profile.email, profile.role);

    const photoUrl = String(profile.profilePhotoUrl || '').trim();
    if (photoUrl !== '') {
      avatarImage.src = photoUrl + (photoUrl.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
      avatarImage.hidden = false;
      avatarInitials.hidden = true;
    } else {
      avatarImage.hidden = true;
      avatarImage.removeAttribute('src');
      avatarInitials.hidden = false;
    }

    const headerProfilePhoto = document.getElementById('headerProfilePhoto');
    const headerProfileInitials = document.getElementById('headerProfileInitials');
    if (headerProfilePhoto && headerProfileInitials) {
      headerProfileInitials.textContent = getInitials(profile.username, profile.email, profile.role);
      if (photoUrl !== '') {
        headerProfilePhoto.src = photoUrl + (photoUrl.indexOf('?') === -1 ? '?v=' : '&v=') + Date.now();
        headerProfilePhoto.hidden = false;
        headerProfileInitials.hidden = true;
      } else {
        headerProfilePhoto.hidden = true;
        headerProfilePhoto.removeAttribute('src');
        headerProfileInitials.hidden = false;
      }
    }

    const headerStationName = document.getElementById('headerStationName');
    const stationName = String(profile.stationName || ('Station ' + String(profile.stationId || '')));
    if (headerStationName && stationName !== '') {
      headerStationName.textContent = stationName;
      headerStationName.hidden = false;
    }
  }

  function applyPreferences(settings) {
    const values = settings || {};
    compactModeToggle.checked = Boolean(values.compactMode);
    reduceMotionToggle.checked = Boolean(values.reduceMotion);
    darkModeToggle.checked = Boolean(values.darkMode);
    securityAlertsToggle.checked = Boolean(values.securityAlerts);
    hideSensitiveToggle.checked = Boolean(values.hideSensitive);
    autoLogoutSelect.value = String(values.autoLogoutMinutes || 0);

    saveLocalSettings({
      compactMode: compactModeToggle.checked,
      reduceMotion: reduceMotionToggle.checked,
      darkMode: darkModeToggle.checked,
      securityAlerts: securityAlertsToggle.checked,
      hideSensitive: hideSensitiveToggle.checked,
      autoLogoutMinutes: Number(autoLogoutSelect.value || 0)
    });

    document.body.classList.toggle('is-compact-ui', compactModeToggle.checked);
    document.body.classList.toggle('is-reduced-motion', reduceMotionToggle.checked);
    document.body.classList.toggle('is-dark-dashboard', darkModeToggle.checked);
    document.body.classList.toggle('is-sensitive-hidden', hideSensitiveToggle.checked);

    resetInactivityTimer();
  }

  function resetInactivityTimer() {
    if (inactivityTimerId) {
      window.clearTimeout(inactivityTimerId);
      inactivityTimerId = null;
    }

    const minutes = Number(autoLogoutSelect.value || 0);
    if (minutes < 1) {
      return;
    }

    inactivityTimerId = window.setTimeout(function () {
      window.location.href = logoutUrl;
    }, minutes * 60000);
  }

  function bindActivityReset() {
    const resetEvents = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    resetEvents.forEach(function (name) {
      document.addEventListener(name, resetInactivityTimer, { passive: true });
    });
  }

  async function loadProfile() {
    setMessage('Loading your settings...', false);

    try {
      const response = await fetch(endpoint, { method: 'GET', credentials: 'same-origin' });
      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true || !payload.profile) {
        setMessage((payload && payload.message) ? payload.message : 'Unable to load profile settings.', true);
        return;
      }

      applyProfile(payload.profile);
      applyPreferences(payload.profile.settings || loadLocalSettings());
      setMessage('Profile loaded.', false);
    } catch (error) {
      setMessage('Unable to load profile settings.', true);
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();

    if (username.length < 3) {
      setMessage('Username must be at least 3 characters.', true);
      return;
    }

    if (email === '') {
      setMessage('Email is required.', true);
      return;
    }

    saveBtn.disabled = true;
    setMessage('Saving settings...', false);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_profile',
          username: username,
          email: email
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        setMessage((payload && payload.message) ? payload.message : 'Unable to save settings.', true);
        return;
      }

      if (payload.profile) {
        applyProfile(payload.profile);
      }
      setMessage(payload.message || 'Profile settings updated successfully.', false);
    } catch (error) {
      setMessage('Unable to save settings.', true);
    } finally {
      saveBtn.disabled = false;
    }
  });

  uploadProfilePhotoBtn.addEventListener('click', function () {
    profilePhotoInput.click();
  });

  profilePhotoInput.addEventListener('change', async function () {
    const file = profilePhotoInput.files && profilePhotoInput.files[0] ? profilePhotoInput.files[0] : null;
    if (!file) {
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.indexOf(file.type) === -1) {
      setMessage('Unsupported image format. Use JPG, PNG, WEBP, or GIF.', true);
      profilePhotoInput.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage('Image is too large. Maximum file size is 2MB.', true);
      profilePhotoInput.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('action', 'upload_profile_photo');
    formData.append('profilePhoto', file);

    uploadProfilePhotoBtn.disabled = true;
    setMessage('Uploading profile photo...', false);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
      });
      const payload = await response.json();

      if (!response.ok || !payload || payload.ok !== true) {
        setMessage((payload && payload.message) ? payload.message : 'Unable to upload profile photo.', true);
        return;
      }

      if (payload.profile) {
        applyProfile(payload.profile);
      }
      setMessage(payload.message || 'Profile photo uploaded successfully.', false);
    } catch (error) {
      setMessage('Unable to upload profile photo.', true);
    } finally {
      uploadProfilePhotoBtn.disabled = false;
      profilePhotoInput.value = '';
    }
  });

  removeProfilePhotoBtn.addEventListener('click', async function () {
    if (!window.confirm('Remove your profile photo?')) {
      return;
    }

    removeProfilePhotoBtn.disabled = true;
    setMessage('Removing profile photo...', false);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'remove_profile_photo'
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        setMessage((payload && payload.message) ? payload.message : 'Unable to remove profile photo.', true);
        return;
      }

      if (payload.profile) {
        applyProfile(payload.profile);
      }
      setMessage(payload.message || 'Profile photo removed.', false);
    } catch (error) {
      setMessage('Unable to remove profile photo.', true);
    } finally {
      removeProfilePhotoBtn.disabled = false;
    }
  });

  preferencesForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    savePreferencesBtn.disabled = true;
    setPreferencesMessage('Saving preferences...', false);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'save_preferences',
          compactMode: compactModeToggle.checked,
          reduceMotion: reduceMotionToggle.checked,
          darkMode: darkModeToggle.checked
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        setPreferencesMessage((payload && payload.message) ? payload.message : 'Unable to save preferences.', true);
        return;
      }

      applyPreferences((payload.settings || {}));
      setPreferencesMessage(payload.message || 'Preferences saved.', false);
    } catch (error) {
      setPreferencesMessage('Unable to save preferences.', true);
    } finally {
      savePreferencesBtn.disabled = false;
    }
  });

  securityForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    saveSecurityBtn.disabled = true;
    setSecurityMessage('Saving security settings...', false);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'save_security',
          securityAlerts: securityAlertsToggle.checked,
          hideSensitive: hideSensitiveToggle.checked,
          autoLogoutMinutes: autoLogoutSelect.value
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        setSecurityMessage((payload && payload.message) ? payload.message : 'Unable to save security settings.', true);
        return;
      }

      applyPreferences((payload.settings || {}));
      setSecurityMessage(payload.message || 'Security settings saved.', false);
    } catch (error) {
      setSecurityMessage('Unable to save security settings.', true);
    } finally {
      saveSecurityBtn.disabled = false;
    }
  });

  [compactModeToggle, reduceMotionToggle, darkModeToggle, securityAlertsToggle, hideSensitiveToggle, autoLogoutSelect].forEach(function (input) {
    input.addEventListener('change', function () {
      applyPreferences({
        compactMode: compactModeToggle.checked,
        reduceMotion: reduceMotionToggle.checked,
        darkMode: darkModeToggle.checked,
        securityAlerts: securityAlertsToggle.checked,
        hideSensitive: hideSensitiveToggle.checked,
        autoLogoutMinutes: Number(autoLogoutSelect.value || 0)
      });
    });
  });

  bindActivityReset();

  function resetPasswordForm() {
    passwordForm.reset();
    setPasswordMessage('', false);
    currentPasswordInput.type = 'password';
    newPasswordInput.type = 'password';
    confirmPasswordInput.type = 'password';
  }

  function closePasswordModal() {
    closeModal(passwordModal);
    resetPasswordForm();
  }

  openPasswordModalBtn.addEventListener('click', function () {
    resetPasswordForm();
    openModal(passwordModal);
    currentPasswordInput.focus();
  });

  closePasswordModalBtn.addEventListener('click', closePasswordModal);
  cancelPasswordBtn.addEventListener('click', closePasswordModal);

  showPasswordToggle.addEventListener('change', function () {
    const nextType = showPasswordToggle.checked ? 'text' : 'password';
    currentPasswordInput.type = nextType;
    newPasswordInput.type = nextType;
    confirmPasswordInput.type = nextType;
  });

  passwordModal.addEventListener('click', function (event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest('[data-close-password-modal="true"]')) {
      closePasswordModal();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') {
      return;
    }

    if (!passwordModal.hidden) {
      closePasswordModal();
    }
  });

  passwordForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const currentPassword = currentPasswordInput.value;
    const nextPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (currentPassword.trim() === '') {
      setPasswordMessage('Current password is required.', true);
      return;
    }

    if (nextPassword.length < 6) {
      setPasswordMessage('New password must be at least 6 characters.', true);
      return;
    }

    if (nextPassword !== confirmPassword) {
      setPasswordMessage('New password and confirmation do not match.', true);
      return;
    }

    if (nextPassword === currentPassword) {
      setPasswordMessage('New password must be different from current password.', true);
      return;
    }

    if (!window.confirm('Are you sure you want to change your password now?')) {
      return;
    }

    const payloadToSend = {
      action: 'change_password',
      currentPassword: currentPassword,
      newPassword: nextPassword,
      confirmPassword: confirmPassword,
      confirmChange: true
    };

    setPasswordMessage('Updating password...', false);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadToSend)
      });

      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        const msg = (payload && payload.message) ? payload.message : 'Unable to change password.';
        setPasswordMessage(msg, true);
        return;
      }

      closePasswordModal();
      setMessage(payload.message || 'Password changed successfully.', false);
    } catch (error) {
      setPasswordMessage('Unable to change password.', true);
    }
  });

  loadProfile();
})();
