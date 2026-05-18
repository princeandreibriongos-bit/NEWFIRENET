const passwordInput = document.getElementById('password');
const toggleButton = document.getElementById('togglePassword');
const capsLockHint = document.getElementById('capsLockHint');
const messageBox = document.getElementById('messageBox');
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const usernameInput = document.getElementById('username');
const rememberMe = document.getElementById('rememberMe');
const googleLoginBlock = document.getElementById('googleLoginBlock');
const googleSignInButton = document.getElementById('googleSignInButton');

const GOOGLE_CONFIG_ENDPOINT = '/firenet/NEWFIRENET/backend/controllers/google_config.php';
const GOOGLE_LOGIN_ENDPOINT = '/firenet/NEWFIRENET/backend/controllers/google_login.php';
const GOOGLE_INIT_MAX_RETRIES = 20;
const GOOGLE_INIT_RETRY_DELAY_MS = 300;

let googleButtonInitialized = false;

function describeMissingGoogleConfig(missing) {
    if (!Array.isArray(missing) || missing.length === 0) {
        return 'Google sign-in is not configured yet.';
    }

    const labels = {
        'google_auth.enabled': 'google_auth.enabled (must be true)',
        'google_auth.client_id': 'google_auth.client_id (Google Web Client ID)'
    };

    const formatted = missing.map(function (item) {
        return labels[item] || item;
    });

    return 'Google sign-in is unavailable. Missing: ' + formatted.join(', ');
}

async function safeJson(response) {
    try {
        return await response.json();
    } catch (error) {
        return null;
    }
}

function showMessage(text, isError) {
    if (!messageBox) {
        return;
    }

    messageBox.hidden = false;
    messageBox.classList.remove('is-error', 'is-success');
    messageBox.classList.add(isError ? 'is-error' : 'is-success');
    messageBox.textContent = text;
}

if (messageBox) {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const success = params.get('success');

    if (error) {
        messageBox.hidden = false;
        messageBox.classList.add('is-error');
        messageBox.textContent = error;
    } else if (success) {
        messageBox.hidden = false;
        messageBox.classList.add('is-success');
        messageBox.textContent = success;
    }

    if (error || success) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

if (usernameInput && rememberMe) {
    const savedUsername = localStorage.getItem('firenet_saved_username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberMe.checked = true;
    }
}

if (toggleButton && passwordInput) {
    toggleButton.addEventListener('click', function () {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleButton.textContent = isPassword ? 'Hide' : 'Show';
        toggleButton.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });

    passwordInput.addEventListener('keyup', function (event) {
        if (!capsLockHint) {
            return;
        }

        const capsOn = event.getModifierState && event.getModifierState('CapsLock');
        capsLockHint.hidden = !capsOn;
    });
}

if (loginForm && loginButton && usernameInput && rememberMe) {
    loginForm.addEventListener('submit', function () {
        const btnText = loginButton.querySelector('.btn-text');
        loginButton.disabled = true;
        loginButton.classList.add('is-loading');

        if (btnText) {
            btnText.textContent = 'Signing in...';
        }

        if (rememberMe.checked) {
            localStorage.setItem('firenet_saved_username', usernameInput.value.trim());
        } else {
            localStorage.removeItem('firenet_saved_username');
        }
    });
}

async function initGoogleLogin() {
    if (!googleLoginBlock || !googleSignInButton || googleButtonInitialized) {
        return;
    }

    try {
        const response = await fetch(GOOGLE_CONFIG_ENDPOINT, {
            method: 'GET',
            credentials: 'same-origin'
        });
        const payload = await safeJson(response);
        if (!response.ok || !payload || payload.ok !== true || !payload.enabled || !payload.clientId) {
            if (payload && Array.isArray(payload.missing) && payload.missing.length > 0) {
                showMessage(describeMissingGoogleConfig(payload.missing), true);
            }
            return;
        }

        googleLoginBlock.hidden = false;

        if (!(window.google && window.google.accounts && window.google.accounts.id)) {
            return;
        }

        window.google.accounts.id.initialize({
            client_id: String(payload.clientId),
            callback: async function (googleResponse) {
                const credential = String((googleResponse && googleResponse.credential) || '');
                if (credential === '') {
                    showMessage('Google credential was empty. Please try again.', true);
                    return;
                }

                showMessage('Signing in with Google...', false);
                try {
                    const signInResponse = await fetch(GOOGLE_LOGIN_ENDPOINT, {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ credential: credential })
                    });
                    const signInPayload = await safeJson(signInResponse);
                    if (!signInResponse.ok || !signInPayload || signInPayload.ok !== true) {
                        const message = (signInPayload && signInPayload.message) ? signInPayload.message : 'Google sign-in failed.';
                        showMessage(message, true);
                        return;
                    }

                    showMessage(signInPayload.message || 'Google sign-in successful.', false);
                    window.location.href = String(signInPayload.redirect || '/firenet/NEWFIRENET/backend/pages/dashboard.php');
                } catch (error) {
                    showMessage('Google sign-in service is unavailable right now.', true);
                }
            }
        });

        window.google.accounts.id.renderButton(googleSignInButton, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            width: 320
        });

        googleButtonInitialized = true;

        window.google.accounts.id.prompt();
    } catch (error) {
        // Keep classic login available if Google config is not reachable.
    }
}

function scheduleGoogleInit(retryCount) {
    initGoogleLogin();
    if (googleButtonInitialized || retryCount >= GOOGLE_INIT_MAX_RETRIES) {
        return;
    }

    window.setTimeout(function () {
        scheduleGoogleInit(retryCount + 1);
    }, GOOGLE_INIT_RETRY_DELAY_MS);
}

scheduleGoogleInit(0);
