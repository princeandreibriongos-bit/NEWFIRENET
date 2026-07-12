(function () {
  'use strict';

  const ENDPOINT = '/firenet/NEWFIRENET/backend/controllers/forgot_password.php';

  const openLink = document.getElementById('forgotPasswordLink');
  const modal = document.getElementById('forgotPasswordModal');
  if (!openLink || !modal) {
    return;
  }

  const closeButtons = Array.from(modal.querySelectorAll('[data-fp-close]'));
  const steps = {
    email: document.getElementById('fpStepEmail'),
    otp: document.getElementById('fpStepOtp'),
    password: document.getElementById('fpStepPassword'),
    done: document.getElementById('fpStepDone')
  };

  const emailForm = document.getElementById('fpEmailForm');
  const otpForm = document.getElementById('fpOtpForm');
  const passwordForm = document.getElementById('fpPasswordForm');
  const emailInput = document.getElementById('fpEmail');
  const usernameWrap = document.getElementById('fpUsernameWrap');
  const usernameInput = document.getElementById('fpUsername');
  const otpInputs = Array.from(modal.querySelectorAll('.fp-otp-digit'));
  const otpHidden = document.getElementById('fpOtpValue');
  const passwordInput = document.getElementById('fpPassword');
  const confirmInput = document.getElementById('fpConfirmPassword');
  const messageEl = document.getElementById('fpMessage');
  const maskedEmailEl = document.getElementById('fpMaskedEmail');
  const resendBtn = document.getElementById('fpResendBtn');
  const backButtons = Array.from(modal.querySelectorAll('[data-fp-back]'));
  const doneCloseBtn = document.getElementById('fpDoneClose');
  const progressPills = Array.from(modal.querySelectorAll('[data-fp-progress]'));

  const state = {
    step: 'email',
    email: '',
    username: '',
    resetId: 0,
    resetToken: '',
    cooldownUntil: 0,
    cooldownTimer: null
  };

  function showMessage(text, type) {
    if (!messageEl) return;
    if (!text) {
      messageEl.hidden = true;
      messageEl.textContent = '';
      messageEl.className = 'fp-message';
      return;
    }
    messageEl.hidden = false;
    messageEl.textContent = text;
    messageEl.className = 'fp-message' + (type ? ' is-' + type : '');
  }

  function setBusy(form, busy) {
    if (!form) return;
    const button = form.querySelector('button[type="submit"]');
    const inputs = form.querySelectorAll('input, button');
    inputs.forEach(function (el) {
      if (el.hasAttribute('data-fp-close') || el.hasAttribute('data-fp-back')) return;
      if (el === resendBtn) return;
      el.disabled = Boolean(busy);
    });
    if (button) {
      button.classList.toggle('is-loading', Boolean(busy));
    }
  }

  function setStep(step) {
    state.step = step;
    Object.keys(steps).forEach(function (key) {
      const el = steps[key];
      if (!el) return;
      el.hidden = key !== step;
    });

    progressPills.forEach(function (pill) {
      const value = pill.getAttribute('data-fp-progress');
      const order = ['email', 'otp', 'password', 'done'];
      const currentIndex = order.indexOf(step);
      const pillIndex = order.indexOf(value);
      pill.classList.toggle('is-active', value === step);
      pill.classList.toggle('is-complete', pillIndex > -1 && pillIndex < currentIndex);
    });

    showMessage('');
    window.setTimeout(function () {
      if (step === 'email' && emailInput) emailInput.focus();
      if (step === 'otp' && otpInputs[0]) otpInputs[0].focus();
      if (step === 'password' && passwordInput) passwordInput.focus();
    }, 40);
  }

  function openModal() {
    modal.hidden = false;
    document.body.classList.add('fp-modal-open');
    resetFlow(false);
    setStep('email');
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('fp-modal-open');
    if (state.cooldownTimer) {
      window.clearInterval(state.cooldownTimer);
      state.cooldownTimer = null;
    }
  }

  function resetFlow(keepEmail) {
    const email = keepEmail ? state.email : '';
    state.email = email;
    state.username = '';
    state.resetId = 0;
    state.resetToken = '';
    if (emailForm) emailForm.reset();
    if (otpForm) otpForm.reset();
    if (passwordForm) passwordForm.reset();
    otpInputs.forEach(function (input) { input.value = ''; });
    if (otpHidden) otpHidden.value = '';
    if (usernameWrap) usernameWrap.hidden = true;
    if (emailInput && email) emailInput.value = email;
    showMessage('');
    updateResendButton();
  }

  function readOtp() {
    return otpInputs.map(function (input) {
      return String(input.value || '').replace(/\D/g, '').slice(-1);
    }).join('');
  }

  function syncOtpHidden() {
    if (otpHidden) otpHidden.value = readOtp();
  }

  function updateResendButton() {
    if (!resendBtn) return;
    const remaining = Math.max(0, Math.ceil((state.cooldownUntil - Date.now()) / 1000));
    if (remaining > 0) {
      resendBtn.disabled = true;
      resendBtn.textContent = 'Resend in ' + remaining + 's';
    } else {
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend code';
    }
  }

  function startCooldown(seconds) {
    const sec = Math.max(0, Number(seconds) || 0);
    state.cooldownUntil = Date.now() + (sec * 1000);
    updateResendButton();
    if (state.cooldownTimer) {
      window.clearInterval(state.cooldownTimer);
    }
    state.cooldownTimer = window.setInterval(function () {
      updateResendButton();
      if (Date.now() >= state.cooldownUntil && state.cooldownTimer) {
        window.clearInterval(state.cooldownTimer);
        state.cooldownTimer = null;
      }
    }, 250);
  }

  async function api(action, payload) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(Object.assign({ action: action }, payload || {}))
    });

    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    if (!data) {
      throw new Error('Unable to reach the password reset service.');
    }

    return { response: response, data: data };
  }

  async function requestOtp(fromResend) {
    const email = String((emailInput && emailInput.value) || state.email || '').trim();
    const username = String((usernameInput && usernameInput.value) || state.username || '').trim();

    if (!email) {
      showMessage('Enter the email on your FireNet account.', 'error');
      return;
    }

    state.email = email;
    state.username = username;

    const form = fromResend ? otpForm : emailForm;
    setBusy(form, true);
    showMessage(fromResend ? 'Sending a new code…' : 'Sending verification code…', 'info');

    try {
      const result = await api('request_otp', {
        email: email,
        username: username
      });
      const data = result.data;
      const payload = data.data || {};

      if (payload.needsUsername) {
        if (usernameWrap) usernameWrap.hidden = false;
        if (usernameInput) usernameInput.focus();
        showMessage(data.message || 'Enter your username to continue.', 'error');
        return;
      }

      if (!data.ok) {
        if (payload.cooldownSeconds) startCooldown(payload.cooldownSeconds);
        showMessage(data.message || 'Unable to send code.', 'error');
        return;
      }

      if (payload.resetId) {
        state.resetId = Number(payload.resetId) || 0;
      }

      if (maskedEmailEl) {
        maskedEmailEl.textContent = payload.maskedEmail || email;
      }

      startCooldown(payload.cooldownSeconds || 60);

      if (state.resetId) {
        setStep('otp');
        showMessage('Check your inbox for a 6-digit code.', 'success');
      } else {
        showMessage(data.message || 'If an account matches that email, a verification code is on the way.', 'success');
      }
    } catch (error) {
      showMessage(error.message || 'Unable to send code.', 'error');
    } finally {
      setBusy(form, false);
    }
  }

  openLink.addEventListener('click', function (event) {
    event.preventDefault();
    openModal();
  });

  closeButtons.forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      closeModal();
    });
  });

  if (doneCloseBtn) {
    doneCloseBtn.addEventListener('click', function (event) {
      event.preventDefault();
      closeModal();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modal && !modal.hidden) {
      closeModal();
    }
  });

  backButtons.forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      const target = btn.getAttribute('data-fp-back') || 'email';
      if (target === 'email') {
        state.resetId = 0;
        state.resetToken = '';
        setStep('email');
      } else if (target === 'otp') {
        state.resetToken = '';
        setStep('otp');
      }
    });
  });

  if (emailForm) {
    emailForm.addEventListener('submit', function (event) {
      event.preventDefault();
      requestOtp(false);
    });
  }

  if (resendBtn) {
    resendBtn.addEventListener('click', function (event) {
      event.preventDefault();
      if (resendBtn.disabled) return;
      requestOtp(true);
    });
  }

  otpInputs.forEach(function (input, index) {
    input.addEventListener('input', function () {
      const value = String(input.value || '').replace(/\D/g, '');
      input.value = value.slice(-1);
      syncOtpHidden();
      if (input.value && otpInputs[index + 1]) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Backspace' && !input.value && otpInputs[index - 1]) {
        otpInputs[index - 1].focus();
      }
    });

    input.addEventListener('paste', function (event) {
      event.preventDefault();
      const text = String((event.clipboardData || window.clipboardData).getData('text') || '')
        .replace(/\D/g, '')
        .slice(0, otpInputs.length);
      text.split('').forEach(function (digit, i) {
        if (otpInputs[i]) otpInputs[i].value = digit;
      });
      syncOtpHidden();
      const focusIndex = Math.min(text.length, otpInputs.length - 1);
      if (otpInputs[focusIndex]) otpInputs[focusIndex].focus();
    });
  });

  if (otpForm) {
    otpForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const otp = readOtp();
      syncOtpHidden();

      if (otp.length !== 6) {
        showMessage('Enter the full 6-digit code.', 'error');
        return;
      }

      if (!state.resetId) {
        showMessage('Request a code first.', 'error');
        setStep('email');
        return;
      }

      setBusy(otpForm, true);
      showMessage('Verifying code…', 'info');

      try {
        const result = await api('verify_otp', {
          resetId: state.resetId,
          otp: otp
        });
        const data = result.data;
        if (!data.ok) {
          showMessage(data.message || 'Incorrect code.', 'error');
          return;
        }

        state.resetToken = String((data.data && data.data.resetToken) || '');
        setStep('password');
        showMessage('Create a new password for your account.', 'success');
      } catch (error) {
        showMessage(error.message || 'Unable to verify code.', 'error');
      } finally {
        setBusy(otpForm, false);
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const password = String((passwordInput && passwordInput.value) || '');
      const confirm = String((confirmInput && confirmInput.value) || '');

      if (password.length < 6) {
        showMessage('Password must be at least 6 characters.', 'error');
        return;
      }

      if (password !== confirm) {
        showMessage('Password confirmation does not match.', 'error');
        return;
      }

      setBusy(passwordForm, true);
      showMessage('Updating password…', 'info');

      try {
        const result = await api('reset_password', {
          resetId: state.resetId,
          resetToken: state.resetToken,
          password: password,
          confirmPassword: confirm
        });
        const data = result.data;
        if (!data.ok) {
          showMessage(data.message || 'Unable to update password.', 'error');
          return;
        }

        const username = String((data.data && data.data.username) || '');
        const loginUsername = document.getElementById('username');
        if (loginUsername && username) {
          loginUsername.value = username;
        }

        setStep('done');
      } catch (error) {
        showMessage(error.message || 'Unable to update password.', 'error');
      } finally {
        setBusy(passwordForm, false);
      }
    });
  }
})();
