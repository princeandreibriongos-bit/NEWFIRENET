(function () {
  'use strict';

  const NEWS_LIST = '/firenet/NEWFIRENET/backend/controllers/news.php?action=list&limit=12';
  const ANNOUNCEMENTS_LIST =
    '/firenet/NEWFIRENET/backend/controllers/news.php?action=announcements_list&limit=12';
  const WEATHER_URL =
    'https://api.open-meteo.com/v1/forecast?latitude=14.5547&longitude=121.0244'
    + '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m,precipitation'
    + '&hourly=precipitation_probability,weather_code,wind_speed_10m'
    + '&daily=weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max'
    + '&timezone=Asia%2FManila&forecast_days=3';

  const ROTATE_MS = 5000;
  const ANNOUNCE_VISIBLE = 2;

  const WMO_LABELS = {
    0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Foggy', 51: 'Drizzle', 61: 'Rain', 63: 'Rain',
    65: 'Heavy rain', 80: 'Showers', 82: 'Heavy showers', 95: 'Thunderstorm', 99: 'Severe storm'
  };

  const els = {
    clockPill: document.getElementById('opsClockPill'),
    weatherPill: document.getElementById('opsWeatherPill'),
    fireRisk: document.getElementById('opsFireRisk'),
    fireRiskMeta: document.getElementById('opsFireRiskMeta'),
    fireRiskBar: document.getElementById('opsFireRiskBar'),
    wind: document.getElementById('opsWind'),
    humidity: document.getElementById('opsHumidity'),
    rain: document.getElementById('opsRain'),
    warningsList: document.getElementById('opsWarningsList'),
    warningBanner: document.getElementById('opsWarningBanner'),
    warningTitle: document.getElementById('opsWarningTitle'),
    warningText: document.getElementById('opsWarningText'),
    warningClose: document.getElementById('opsWarningClose'),
    announceRail: document.getElementById('opsAnnounceRail'),
    announceDots: document.getElementById('opsAnnounceDots'),
    announcePulse: document.getElementById('opsAnnouncePulse'),
    newsRail: document.getElementById('opsNewsRail'),
    newsPulse: document.getElementById('opsNewsPulse'),
    newsProgress: document.getElementById('opsNewsProgress'),
    authRisk: document.getElementById('opsAuthRisk'),
    authWarn: document.getElementById('opsAuthWarn'),
    reportHint: document.getElementById('opsReportHint'),
    canvas: document.getElementById('opsGridCanvas')
  };

  let newsItems = [];
  let announcementItems = [];
  let newsIndex = 0;
  let announceIndex = 0;
  let newsTimer = null;
  let announceTimer = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
    });
  }

  function truncateText(str, maxChars) {
    const s = String(str ?? '').trim();
    if (!s) return '';
    if (s.length <= maxChars) return s;
    return s.slice(0, Math.max(0, maxChars - 1)).trimEnd() + '…';
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function updateClock() {
    const now = new Date();
    if (els.clockPill) {
      els.clockPill.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
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

  function buildWarnings(data) {
    const warnings = [];
    const current = data.current || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};
    const code = Number(current.weather_code || 0);
    const wind = Number(current.wind_speed_10m || 0);
    const gust = Number(current.wind_gusts_10m || 0);
    const precip = Number(current.precipitation || 0);
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

    if (code >= 95 || (Array.isArray(hourly.weather_code) && hourly.weather_code.slice(0, 24).some(function (c) {
      return Number(c) >= 95;
    }))) {
      warnings.push({
        level: 'high',
        icon: 'bi-cloud-lightning-rain',
        title: 'Thunderstorm watch',
        text: 'Storm activity possible over Metro Manila. Brief crews and watch flood-prone AORs.'
      });
    }

    if (maxDailyWind >= 45 || maxDailyGust >= 60 || wind >= 40) {
      warnings.push({
        level: 'high',
        icon: 'bi-wind',
        title: 'Strong wind advisory',
        text: 'Peak winds ~' + Math.round(Math.max(maxDailyWind, wind)) + ' km/h'
          + (maxDailyGust ? ' (gusts ~' + Math.round(maxDailyGust) + ')' : '') + '.'
      });
    } else if (maxDailyWind >= 30 || wind >= 28) {
      warnings.push({
        level: 'med',
        icon: 'bi-wind',
        title: 'Elevated winds',
        text: 'Breezy conditions expected across Makati.'
      });
    }

    if (maxRainChance >= 70 || maxPrecipSum >= 20 || precip >= 2) {
      warnings.push({
        level: 'high',
        icon: 'bi-cloud-rain-heavy',
        title: 'Heavy rain / flood watch',
        text: 'Rain chance up to ' + Math.round(maxRainChance) + '%. Prioritize low-lying response corridors.'
      });
    } else if (maxRainChance >= 45 || maxPrecipSum >= 8) {
      warnings.push({
        level: 'med',
        icon: 'bi-cloud-drizzle',
        title: 'Rain likely',
        text: 'Showers possible in the next 24–48 hours.'
      });
    }

    if ((maxDailyWind >= 62 || maxDailyGust >= 80) && (maxRainChance >= 60 || maxPrecipSum >= 25 || code >= 80)) {
      warnings.unshift({
        level: 'high',
        icon: 'bi-tropical-storm',
        title: 'Tropical storm–like risk',
        text: 'Combined wind + rain signal elevated storm risk. Cross-check PAGASA bulletins.'
      });
    }

    if (!warnings.length) {
      warnings.push({
        level: 'clear',
        icon: 'bi-shield-check',
        title: 'No severe flags',
        text: 'Makati forecast looks manageable. Continue standard readiness.'
      });
    }

    return { warnings: warnings.slice(0, 3), maxRainChance: maxRainChance };
  }

  function renderWarnings(warnings) {
    if (!els.warningsList) return;
    els.warningsList.innerHTML = warnings.map(function (w) {
      const cls = w.level === 'high' ? 'is-high' : (w.level === 'clear' ? 'is-clear' : '');
      return (
        '<article class="ops-warning-item ' + cls + '">' +
          '<i class="bi ' + escapeHtml(w.icon) + '" aria-hidden="true"></i>' +
          '<div><strong>' + escapeHtml(w.title) + '</strong><p>' + escapeHtml(w.text) + '</p></div>' +
        '</article>'
      );
    }).join('');

    const top = warnings.find(function (w) { return w.level === 'high'; });
    if (top && els.warningBanner && !sessionStorage.getItem('firenet_ops_warning_dismissed')) {
      els.warningBanner.hidden = false;
      if (els.warningTitle) els.warningTitle.textContent = top.title;
      if (els.warningText) els.warningText.textContent = top.text;
    } else if (els.warningBanner && !top) {
      els.warningBanner.hidden = true;
    }

    if (els.authWarn) {
      els.authWarn.textContent = warnings[0] ? warnings[0].title : 'Weather nominal';
    }
  }

  async function loadWeather() {
    try {
      const response = await fetch(WEATHER_URL, { cache: 'no-store' });
      const data = await response.json();
      const current = data && data.current ? data.current : null;
      if (!current) throw new Error('No weather');

      const temp = Number(current.temperature_2m);
      const humidity = Number(current.relative_humidity_2m);
      const wind = Number(current.wind_speed_10m);
      const code = Number(current.weather_code);
      const label = WMO_LABELS[code] || 'Makati';
      const risk = computeFireRisk(temp, humidity, wind);
      const built = buildWarnings(data);

      if (els.weatherPill) els.weatherPill.textContent = Math.round(temp) + '° · ' + label;
      if (els.fireRisk) els.fireRisk.textContent = risk.label;
      if (els.fireRiskMeta) els.fireRiskMeta.textContent = 'Index ' + risk.score;
      if (els.fireRiskBar) els.fireRiskBar.style.width = risk.score + '%';
      if (els.wind) els.wind.textContent = Math.round(wind);
      if (els.humidity) els.humidity.textContent = Math.round(humidity) + '%';
      if (els.rain) els.rain.textContent = Math.round(built.maxRainChance || 0) + '%';
      if (els.authRisk) els.authRisk.textContent = 'Risk ' + risk.label;
      renderWarnings(built.warnings);
    } catch (error) {
      if (els.weatherPill) els.weatherPill.textContent = 'Weather offline';
      if (els.warningsList) els.warningsList.innerHTML = '<p class="ops-soft">Unable to load advisories.</p>';
      if (els.authWarn) els.authWarn.textContent = 'Weather feed offline';
    }
  }

  function restartNewsProgress() {
    const wrap = els.newsProgress && els.newsProgress.parentElement;
    if (!wrap) return;
    wrap.classList.remove('is-running');
    void wrap.offsetWidth;
    wrap.classList.add('is-running');
  }

  function renderNewsFrame() {
    if (!els.newsRail) return;
    if (!newsItems.length) {
      if (els.newsPulse) els.newsPulse.hidden = true;
      els.newsRail.innerHTML = '<p class="ops-soft">No recent news.</p>';
      return;
    }
    if (els.newsPulse) els.newsPulse.hidden = false;
    const item = newsItems[newsIndex % newsItems.length];
    const id = escapeHtml(String(item.newsId || ''));
    const title = escapeHtml(truncateText(item.title || 'Update', 76));
    const excerpt = escapeHtml(truncateText(item.body || '', 130));
    const meta = escapeHtml(formatDate(item.createdAt));
    const thumb = escapeHtml(String(item.imageUrl || '').trim());
    const existing = els.newsRail.querySelector('.ops-news-feature');
    if (existing) existing.classList.add('is-swap');

    window.setTimeout(function () {
      els.newsRail.innerHTML =
        '<button type="button" class="ops-news-feature is-swap" data-open-news="' + id + '">' +
          '<div class="ops-news-media">' + (thumb ? '<img src="' + thumb + '" alt="" loading="lazy">' : '') + '</div>' +
          '<div class="ops-news-copy">' +
            '<p class="login-section-tag">Rotating brief</p>' +
            '<h3>' + title + '</h3>' +
            '<p>' + excerpt + '</p>' +
            '<small>' + meta + ' · ' + ((newsIndex % newsItems.length) + 1) + '/' + newsItems.length + '</small>' +
          '</div>' +
        '</button>';
      requestAnimationFrame(function () {
        const card = els.newsRail.querySelector('.ops-news-feature');
        if (card) card.classList.remove('is-swap');
      });
      restartNewsProgress();
    }, existing ? 200 : 0);
  }

  function startNewsRotation() {
    if (newsTimer) window.clearInterval(newsTimer);
    renderNewsFrame();
    if (newsItems.length < 2) return;
    newsTimer = window.setInterval(function () {
      newsIndex = (newsIndex + 1) % newsItems.length;
      renderNewsFrame();
    }, ROTATE_MS);
  }

  function renderAnnounceDots(pageCount, pageIndex) {
    if (!els.announceDots) return;
    if (pageCount <= 1) {
      els.announceDots.innerHTML = '';
      return;
    }
    els.announceDots.innerHTML = Array.from({ length: pageCount }, function (_, i) {
      return '<span class="' + (i === pageIndex ? 'is-active' : '') + '"></span>';
    }).join('');
  }

  function renderAnnounceFrame() {
    if (!els.announceRail) return;
    if (!announcementItems.length) {
      if (els.announcePulse) els.announcePulse.hidden = true;
      els.announceRail.classList.remove('is-single');
      els.announceRail.innerHTML = '<p class="ops-soft">No current announcements.</p>';
      renderAnnounceDots(0, 0);
      return;
    }
    if (els.announcePulse) els.announcePulse.hidden = false;
    const pageCount = Math.ceil(announcementItems.length / ANNOUNCE_VISIBLE);
    const pageIndex = announceIndex % pageCount;
    const start = pageIndex * ANNOUNCE_VISIBLE;
    const visible = announcementItems.slice(start, start + ANNOUNCE_VISIBLE);
    els.announceRail.classList.toggle('is-single', visible.length === 1);
    renderAnnounceDots(pageCount, pageIndex);

    const slots = els.announceRail.querySelectorAll('.ops-announce-slot');
    slots.forEach(function (slot) { slot.classList.add('is-swap'); });

    window.setTimeout(function () {
      els.announceRail.innerHTML = visible.map(function (item) {
        const id = escapeHtml(String(item.newsId || ''));
        const title = escapeHtml(truncateText(item.title || 'Announcement', 60));
        const excerpt = escapeHtml(truncateText(item.body || '', 85));
        const type = escapeHtml(String(item.announcementType || 'Notice'));
        const thumb = escapeHtml(String(item.imageUrl || '').trim());
        return (
          '<button type="button" class="ops-announce-slot is-swap" data-open-announcement="' + id + '">' +
            (thumb ? '<img src="' + thumb + '" alt="" loading="lazy">' : '') +
            '<div class="ops-announce-shade"></div>' +
            '<div class="ops-announce-copy">' +
              '<span class="ops-badge">' + type + '</span>' +
              '<strong>' + title + '</strong>' +
              '<span>' + excerpt + '</span>' +
            '</div>' +
          '</button>'
        );
      }).join('');
      requestAnimationFrame(function () {
        els.announceRail.querySelectorAll('.ops-announce-slot').forEach(function (slot) {
          slot.classList.remove('is-swap');
        });
      });
    }, slots.length ? 200 : 0);
  }

  function startAnnounceRotation() {
    if (announceTimer) window.clearInterval(announceTimer);
    renderAnnounceFrame();
    if (announcementItems.length <= ANNOUNCE_VISIBLE) return;
    announceTimer = window.setInterval(function () {
      const pageCount = Math.ceil(announcementItems.length / ANNOUNCE_VISIBLE);
      announceIndex = (announceIndex + 1) % pageCount;
      renderAnnounceFrame();
    }, ROTATE_MS);
  }

  async function loadNews() {
    try {
      const response = await fetch(NEWS_LIST, { credentials: 'same-origin', cache: 'no-store' });
      const payload = await response.json().catch(function () { return null; });
      newsItems = payload && payload.ok && payload.data && Array.isArray(payload.data.items)
        ? payload.data.items
        : [];
    } catch (error) {
      newsItems = [];
    }
    startNewsRotation();
  }

  async function loadAnnouncements() {
    try {
      const response = await fetch(ANNOUNCEMENTS_LIST, { credentials: 'same-origin', cache: 'no-store' });
      const payload = await response.json().catch(function () { return null; });
      announcementItems = payload && payload.ok && payload.data && Array.isArray(payload.data.items)
        ? payload.data.items
        : [];
    } catch (error) {
      announcementItems = [];
    }
    startAnnounceRotation();
  }

  function initGridCanvas() {
    const canvas = els.canvas;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (canvas) canvas.style.display = 'none';
      return;
    }
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let t = 0;
    let raf = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * devicePixelRatio);
      canvas.height = Math.floor(h * devicePixelRatio);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function frame() {
      t += 0.004;
      ctx.clearRect(0, 0, w, h);
      const gap = 42;
      ctx.strokeStyle = 'rgba(24, 50, 79, 0.08)';
      ctx.lineWidth = 1;
      for (let x = (Math.sin(t) * 12) % gap; x < w; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = (Math.cos(t * 0.8) * 10) % gap; y < h; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const gx = w * (0.55 + Math.sin(t) * 0.08);
      const gy = h * (0.25 + Math.cos(t * 0.7) * 0.06);
      const grad = ctx.createRadialGradient(gx, gy, 20, gx, gy, 280);
      grad.addColorStop(0, 'rgba(188, 31, 45, 0.12)');
      grad.addColorStop(1, 'rgba(188, 31, 45, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(frame);
    });
  }

  function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    const label = document.getElementById('themeToggleLabel');
    const storageKey = 'firenet_login_theme';

    function currentTheme() {
      const theme = document.documentElement.getAttribute('data-theme');
      return theme === 'dark' ? 'dark' : 'light';
    }

    function syncLabel(theme) {
      if (!btn || !label) return;
      const nextIsDark = theme === 'light';
      label.textContent = nextIsDark ? 'Dark' : 'Light';
      btn.setAttribute('aria-label', nextIsDark ? 'Switch to dark mode' : 'Switch to light mode');
    }

    syncLabel(currentTheme());

    if (!btn) return;
    btn.addEventListener('click', function () {
      const next = currentTheme() === 'light' ? 'dark' : 'light';
      btn.classList.remove('is-toggling');
      void btn.offsetWidth;
      btn.classList.add('is-toggling');
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(storageKey, next); } catch (e) {}
      syncLabel(next);
      window.setTimeout(function () {
        btn.classList.remove('is-toggling');
      }, 560);
    });
  }

  function bindUi() {
    initThemeToggle();

    if (els.warningClose) {
      els.warningClose.addEventListener('click', function () {
        if (els.warningBanner) els.warningBanner.hidden = true;
        sessionStorage.setItem('firenet_ops_warning_dismissed', '1');
      });
    }

    if (els.reportHint) {
      els.reportHint.addEventListener('click', function () {
        const user = document.getElementById('username');
        if (user) {
          user.focus();
          user.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    document.querySelectorAll('[data-scroll-ops]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const target = document.getElementById('opsWeather');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function boot() {
    updateClock();
    window.setInterval(updateClock, 1000);
    initGridCanvas();
    bindUi();
    loadWeather();
    loadNews();
    loadAnnouncements();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
