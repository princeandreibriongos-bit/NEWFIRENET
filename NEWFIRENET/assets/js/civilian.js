(function () {
  'use strict';

  const NEWS_LIST = '/firenet/NEWFIRENET/backend/controllers/news.php?action=list&limit=12';
  const NEWS_GET = '/firenet/NEWFIRENET/backend/controllers/news.php?action=get&newsId=';
  const ANNOUNCEMENTS_LIST =
    '/firenet/NEWFIRENET/backend/controllers/news.php?action=announcements_list&limit=12';
  const ALERTS_SUBSCRIBE = '/firenet/NEWFIRENET/backend/controllers/civilian_alerts.php?action=subscribe';
  const WEATHER_URL =
    'https://api.open-meteo.com/v1/forecast?latitude=14.5547&longitude=121.0244'
    + '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m,precipitation'
    + '&hourly=precipitation_probability,weather_code,wind_speed_10m'
    + '&daily=weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max'
    + '&timezone=Asia%2FManila&forecast_days=3';

  const ROTATE_MS = 5000;
  const ANNOUNCE_VISIBLE = 2;

  const VIEW_META = {
    home: { title: 'FireNet for Civilians', kicker: 'Public Safety Portal' },
    hotlines: { title: 'Emergency Hotlines', kicker: 'Tap to call' },
    news: { title: 'District News', kicker: 'Public updates' },
    announcements: { title: 'Announcements', kicker: 'Official notices' },
    alerts: { title: 'Alert Opt-in', kicker: 'Email & SMS' },
    safety: { title: 'Safety Guide', kicker: 'Preparedness' }
  };

  const SAFETY_TIPS = [
    {
      title: 'What to say when you call',
      body: 'Give your exact location (street, landmark, floor), what you see (smoke, flames, trapped people), and a callback number. Stay on the line until the dispatcher says you can hang up.'
    },
    {
      title: 'If you smell smoke',
      body: 'Do not open hot doors. Feel the door with the back of your hand. Stay low under smoke. Exit if safe; otherwise seal gaps and signal from a window while calling 168.'
    },
    {
      title: 'Kitchen fire basics',
      body: 'Turn off the heat if safe. Never pour water on oil fires — cover with a lid or use a Class K / dry chemical extinguisher. Evacuate if the fire grows beyond the pan.'
    },
    {
      title: 'Evacuation at home',
      body: 'Plan two exits from every room. Keep keys and phones near the door. Practice a meeting point outside. Help children, elders, and pets first when alarms sound.'
    },
    {
      title: 'Electrical safety',
      body: 'Unplug damaged cords. Avoid daisy-chaining extension cords. Keep outlets clear of dust and water. Call a licensed electrician for burning smells from panels.'
    }
  ];

  const CHECKLIST_ITEMS = [
    'Working smoke alarms on every floor',
    'Fire extinguisher within easy reach',
    'Evacuation plan posted for the household',
    'Emergency contacts saved on phones',
    'Clear hallway and exit paths',
    'Flashlight and spare batteries ready'
  ];

  const WMO_LABELS = {
    0: 'Clear',
    1: 'Mostly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Drizzle',
    61: 'Rain',
    63: 'Rain',
    65: 'Heavy rain',
    80: 'Showers',
    81: 'Showers',
    82: 'Heavy showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Severe storm'
  };

  const els = {
    body: document.body,
    menuToggle: document.getElementById('menuToggle'),
    navScrim: document.getElementById('navScrim'),
    viewTitle: document.getElementById('viewTitle'),
    viewKicker: document.getElementById('viewKicker'),
    liveClock: document.getElementById('liveClock'),
    liveDate: document.getElementById('liveDate'),
    weatherChip: document.getElementById('weatherChip'),
    weatherChipIcon: document.getElementById('weatherChipIcon'),
    weatherTemp: document.getElementById('weatherTemp'),
    weatherLabel: document.getElementById('weatherLabel'),
    fireRiskValue: document.getElementById('fireRiskValue'),
    fireRiskMeta: document.getElementById('fireRiskMeta'),
    fireRiskBar: document.getElementById('fireRiskBar'),
    windValue: document.getElementById('windValue'),
    humidityValue: document.getElementById('humidityValue'),
    rainChanceValue: document.getElementById('rainChanceValue'),
    warningsList: document.getElementById('warningsList'),
    warningBanner: document.getElementById('warningBanner'),
    warningBannerTitle: document.getElementById('warningBannerTitle'),
    warningBannerText: document.getElementById('warningBannerText'),
    warningBannerClose: document.getElementById('warningBannerClose'),
    homeAnnouncements: document.getElementById('homeAnnouncements'),
    announceDots: document.getElementById('announceDots'),
    announcePulse: document.getElementById('announcePulse'),
    homeNewsRail: document.getElementById('homeNewsRail'),
    newsPulse: document.getElementById('newsPulse'),
    newsProgress: document.getElementById('newsProgress'),
    newsLoading: document.getElementById('newsLoading'),
    newsCountPill: document.getElementById('newsCountPill'),
    newsFeatured: document.getElementById('newsFeatured'),
    newsFeaturedImage: document.getElementById('newsFeaturedImage'),
    newsFeaturedTitle: document.getElementById('newsFeaturedTitle'),
    newsFeaturedBody: document.getElementById('newsFeaturedBody'),
    newsFeaturedMeta: document.getElementById('newsFeaturedMeta'),
    newsFeaturedOpen: document.getElementById('newsFeaturedOpen'),
    newsFeed: document.getElementById('newsFeed'),
    announcementsLoading: document.getElementById('announcementsLoading'),
    announcementsCountPill: document.getElementById('announcementsCountPill'),
    announcementsFeed: document.getElementById('announcementsFeed'),
    tipStack: document.getElementById('tipStack'),
    safetyChecklist: document.getElementById('safetyChecklist'),
    resetChecklist: document.getElementById('resetChecklist'),
    articleModal: document.getElementById('articleModal'),
    articleKicker: document.getElementById('articleKicker'),
    articleTitle: document.getElementById('articleTitle'),
    articleMeta: document.getElementById('articleMeta'),
    articleImage: document.getElementById('articleImage'),
    articleBody: document.getElementById('articleBody'),
    canvas: document.getElementById('emberCanvas'),
    alertForm: document.getElementById('alertSubscribeForm'),
    channelEmail: document.getElementById('channelEmail'),
    channelSms: document.getElementById('channelSms'),
    alertEmail: document.getElementById('alertEmail'),
    alertPhone: document.getElementById('alertPhone'),
    alertBarangay: document.getElementById('alertBarangay'),
    alertFormMessage: document.getElementById('alertFormMessage'),
    alertSubmitBtn: document.getElementById('alertSubmitBtn'),
    alertsLiveSummary: document.getElementById('alertsLiveSummary')
  };

  let newsItems = [];
  let announcementItems = [];
  let newsLoaded = false;
  let announcementsLoaded = false;
  let featuredNewsId = '';
  let newsRotateIndex = 0;
  let announceRotateIndex = 0;
  let newsTimer = null;
  let announceTimer = null;
  let latestWarnings = [];

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

  function closeNav() {
    els.body.classList.remove('nav-open');
    if (els.navScrim) els.navScrim.hidden = true;
  }

  function openNav() {
    els.body.classList.add('nav-open');
    if (els.navScrim) els.navScrim.hidden = false;
  }

  function setView(viewName, options) {
    const opts = options || {};
    const next = VIEW_META[viewName] ? viewName : 'home';

    document.querySelectorAll('.view-panel').forEach(function (panel) {
      const active = panel.getAttribute('data-panel') === next;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });

    document.querySelectorAll('.side-nav-item[data-view]').forEach(function (btn) {
      const active = btn.getAttribute('data-view') === next;
      btn.classList.toggle('is-active', active);
      if (active) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    els.body.setAttribute('data-view', next);
    if (els.viewTitle) els.viewTitle.textContent = VIEW_META[next].title;
    if (els.viewKicker) els.viewKicker.textContent = VIEW_META[next].kicker;

    if (!opts.skipHistory) {
      const url = new URL(window.location.href);
      if (next === 'home') url.searchParams.delete('view');
      else url.searchParams.set('view', next);
      if (!opts.keepNewsId) url.searchParams.delete('newsId');
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }

    closeNav();

    if (next === 'news') {
      ensureNewsLoaded().then(function () {
        const newsId = opts.newsId || new URLSearchParams(window.location.search).get('newsId');
        if (newsId) openArticleById(newsId, 'news');
      });
    }

    if (next === 'announcements') {
      ensureAnnouncementsLoaded().then(function () {
        const newsId = opts.newsId || new URLSearchParams(window.location.search).get('newsId');
        if (newsId) openArticleById(newsId, 'announcement');
      });
    }

    if (opts.openTip != null) {
      const tip = document.querySelectorAll('#tipStack details')[Number(opts.openTip)];
      if (tip) tip.open = true;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openArticleModal(item, kind) {
    if (!els.articleModal || !item) return;
    if (els.articleKicker) els.articleKicker.textContent = kind === 'announcement' ? 'Announcement' : 'News';
    if (els.articleTitle) els.articleTitle.textContent = String(item.title || 'Untitled');
    if (els.articleMeta) {
      const parts = [];
      if (item.sourceName) parts.push(String(item.sourceName));
      if (item.announcementType) parts.push(String(item.announcementType));
      if (item.createdAt) parts.push(formatDate(item.createdAt));
      els.articleMeta.textContent = parts.join(' · ');
    }
    if (els.articleBody) els.articleBody.textContent = String(item.body || '');
    if (els.articleImage) {
      const imageUrl = String(item.imageUrl || '').trim();
      if (imageUrl) {
        els.articleImage.src = imageUrl;
        els.articleImage.alt = String(item.title || 'Article image');
        els.articleImage.hidden = false;
      } else {
        els.articleImage.hidden = true;
        els.articleImage.removeAttribute('src');
      }
    }
    els.articleModal.hidden = false;
  }

  function closeArticleModal() {
    if (!els.articleModal) return;
    els.articleModal.hidden = true;
    if (els.articleImage) {
      els.articleImage.hidden = true;
      els.articleImage.removeAttribute('src');
    }
  }

  async function fetchItem(newsId) {
    const response = await fetch(NEWS_GET + encodeURIComponent(String(newsId)), {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store'
    });
    const payload = await response.json().catch(function () { return null; });
    if (!response.ok || !payload || payload.ok !== true || !payload.data) {
      throw new Error((payload && payload.message) || 'Unable to open article.');
    }
    return payload.data;
  }

  async function openArticleById(newsId, preferredKind) {
    try {
      const localNews = newsItems.find(function (item) { return String(item.newsId) === String(newsId); });
      const localAnnouncement = announcementItems.find(function (item) {
        return String(item.newsId) === String(newsId);
      });
      if (localNews) {
        openArticleModal(localNews, 'news');
        return;
      }
      if (localAnnouncement) {
        openArticleModal(localAnnouncement, 'announcement');
        return;
      }
      const item = await fetchItem(newsId);
      openArticleModal(item, preferredKind || (item.isAnnouncement ? 'announcement' : 'news'));
    } catch (error) {
      window.alert(error.message || 'Unable to open article.');
    }
  }

  function restartNewsProgress() {
    const wrap = els.newsProgress && els.newsProgress.parentElement;
    if (!wrap) return;
    wrap.classList.remove('is-running');
    void wrap.offsetWidth;
    wrap.classList.add('is-running');
  }

  function renderNewsWidgetFrame() {
    if (!els.homeNewsRail) return;
    if (!newsItems.length) {
      if (els.newsPulse) els.newsPulse.hidden = true;
      els.homeNewsRail.innerHTML = '<p class="soft-empty">No recent updates yet.</p>';
      return;
    }

    if (els.newsPulse) els.newsPulse.hidden = false;
    const item = newsItems[newsRotateIndex % newsItems.length];
    const id = escapeHtml(String(item.newsId || ''));
    const title = escapeHtml(truncateText(item.title || 'Update', 78));
    const excerpt = escapeHtml(truncateText(item.body || '', 140));
    const meta = escapeHtml(formatDate(item.createdAt));
    const thumb = escapeHtml(String(item.imageUrl || '').trim());

    const existing = els.homeNewsRail.querySelector('.news-feature');
    if (existing) existing.classList.add('is-swap');

    window.setTimeout(function () {
      els.homeNewsRail.innerHTML =
        '<button type="button" class="news-feature is-swap" data-open-news="' + id + '">' +
          '<div class="news-feature-media">' +
            (thumb ? '<img src="' + thumb + '" alt="" loading="lazy">' : '') +
          '</div>' +
          '<div class="news-feature-copy">' +
            '<p class="section-tag">Now showing</p>' +
            '<h4>' + title + '</h4>' +
            '<p>' + excerpt + '</p>' +
            '<small>' + meta + ' · ' + (newsRotateIndex % newsItems.length + 1) + '/' + newsItems.length + '</small>' +
          '</div>' +
        '</button>';

      requestAnimationFrame(function () {
        const card = els.homeNewsRail.querySelector('.news-feature');
        if (card) card.classList.remove('is-swap');
      });
      restartNewsProgress();
    }, existing ? 220 : 0);
  }

  function startNewsRotation() {
    if (newsTimer) window.clearInterval(newsTimer);
    renderNewsWidgetFrame();
    if (newsItems.length < 2) return;
    newsTimer = window.setInterval(function () {
      newsRotateIndex = (newsRotateIndex + 1) % newsItems.length;
      renderNewsWidgetFrame();
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

  function renderAnnounceWidgetFrame() {
    if (!els.homeAnnouncements) return;
    if (!announcementItems.length) {
      if (els.announcePulse) els.announcePulse.hidden = true;
      els.homeAnnouncements.classList.remove('is-single');
      els.homeAnnouncements.innerHTML = '<p class="soft-empty">No current announcements.</p>';
      renderAnnounceDots(0, 0);
      return;
    }

    if (els.announcePulse) els.announcePulse.hidden = false;
    const pageCount = Math.ceil(announcementItems.length / ANNOUNCE_VISIBLE);
    const pageIndex = announceRotateIndex % pageCount;
    const start = pageIndex * ANNOUNCE_VISIBLE;
    const visible = announcementItems.slice(start, start + ANNOUNCE_VISIBLE);

    els.homeAnnouncements.classList.toggle('is-single', visible.length === 1);
    renderAnnounceDots(pageCount, pageIndex);

    const slots = els.homeAnnouncements.querySelectorAll('.announce-slot');
    slots.forEach(function (slot) { slot.classList.add('is-swap'); });

    window.setTimeout(function () {
      els.homeAnnouncements.innerHTML = visible.map(function (item) {
        const id = escapeHtml(String(item.newsId || ''));
        const title = escapeHtml(truncateText(item.title || 'Announcement', 64));
        const excerpt = escapeHtml(truncateText(item.body || '', 90));
        const type = escapeHtml(String(item.announcementType || 'Notice'));
        const thumb = escapeHtml(String(item.imageUrl || '').trim());
        return (
          '<button type="button" class="announce-slot is-swap" data-open-announcement="' + id + '">' +
            (thumb ? '<img src="' + thumb + '" alt="" loading="lazy">' : '') +
            '<div class="announce-slot-shade"></div>' +
            '<div class="announce-slot-copy">' +
              '<span class="feed-badge">' + type + '</span>' +
              '<strong>' + title + '</strong>' +
              '<span>' + excerpt + '</span>' +
            '</div>' +
          '</button>'
        );
      }).join('');

      requestAnimationFrame(function () {
        els.homeAnnouncements.querySelectorAll('.announce-slot').forEach(function (slot) {
          slot.classList.remove('is-swap');
        });
      });
    }, slots.length ? 220 : 0);
  }

  function startAnnounceRotation() {
    if (announceTimer) window.clearInterval(announceTimer);
    renderAnnounceWidgetFrame();
    if (announcementItems.length <= ANNOUNCE_VISIBLE) return;
    announceTimer = window.setInterval(function () {
      const pageCount = Math.ceil(announcementItems.length / ANNOUNCE_VISIBLE);
      announceRotateIndex = (announceRotateIndex + 1) % pageCount;
      renderAnnounceWidgetFrame();
    }, ROTATE_MS);
  }

  function renderNewsPortal(items) {
    if (els.newsLoading) els.newsLoading.hidden = true;
    if (els.newsCountPill) {
      els.newsCountPill.textContent = items.length + (items.length === 1 ? ' update' : ' updates');
    }

    if (!items.length) {
      if (els.newsFeatured) els.newsFeatured.hidden = true;
      if (els.newsFeed) els.newsFeed.innerHTML = '<p class="soft-empty">No news items yet.</p>';
      return;
    }

    const featured = items[0];
    featuredNewsId = String(featured.newsId || '');
    if (els.newsFeatured) els.newsFeatured.hidden = false;
    if (els.newsFeaturedTitle) els.newsFeaturedTitle.textContent = String(featured.title || 'Update');
    if (els.newsFeaturedBody) els.newsFeaturedBody.textContent = truncateText(featured.body || '', 220);
    if (els.newsFeaturedMeta) {
      const parts = [];
      if (featured.sourceName) parts.push(String(featured.sourceName));
      if (featured.createdAt) parts.push(formatDate(featured.createdAt));
      els.newsFeaturedMeta.textContent = parts.join(' · ');
    }
    if (els.newsFeaturedImage) {
      const imageUrl = String(featured.imageUrl || '').trim();
      if (imageUrl) {
        els.newsFeaturedImage.src = imageUrl;
        els.newsFeaturedImage.alt = String(featured.title || 'Featured news');
        els.newsFeaturedImage.hidden = false;
      } else {
        els.newsFeaturedImage.hidden = true;
        els.newsFeaturedImage.removeAttribute('src');
      }
    }

    if (!els.newsFeed) return;
    els.newsFeed.innerHTML = items.map(function (item) {
      const id = escapeHtml(String(item.newsId || ''));
      const title = escapeHtml(truncateText(item.title || 'Update', 80));
      const excerpt = escapeHtml(truncateText(item.body || '', 110));
      const meta = escapeHtml(formatDate(item.createdAt));
      const thumb = String(item.imageUrl || '').trim();
      return (
        '<button type="button" class="feed-row" data-open-news="' + id + '">' +
          '<div>' +
            '<strong>' + title + '</strong>' +
            '<span>' + excerpt + '</span>' +
            '<small>' + meta + '</small>' +
          '</div>' +
          (thumb
            ? '<img class="feed-thumb" src="' + escapeHtml(thumb) + '" alt="" loading="lazy">'
            : '<span class="feed-thumb feed-thumb--empty" aria-hidden="true"></span>') +
        '</button>'
      );
    }).join('');
  }

  function renderAnnouncementsPortal(items) {
    if (els.announcementsLoading) els.announcementsLoading.hidden = true;
    if (els.announcementsCountPill) {
      els.announcementsCountPill.textContent =
        items.length + (items.length === 1 ? ' notice' : ' notices');
    }
    if (!els.announcementsFeed) return;
    if (!items.length) {
      els.announcementsFeed.innerHTML = '<p class="soft-empty">No current announcements.</p>';
      return;
    }
    els.announcementsFeed.innerHTML = items.map(function (item) {
      const id = escapeHtml(String(item.newsId || ''));
      const title = escapeHtml(String(item.title || 'Announcement'));
      const excerpt = escapeHtml(truncateText(item.body || '', 140));
      const type = escapeHtml(String(item.announcementType || 'Notice'));
      const meta = escapeHtml(formatDate(item.createdAt));
      const thumb = String(item.imageUrl || '').trim();
      return (
        '<button type="button" class="feed-row" data-open-announcement="' + id + '">' +
          '<div>' +
            '<span class="feed-badge">' + type + '</span>' +
            '<strong>' + title + '</strong>' +
            '<span>' + excerpt + '</span>' +
            '<small>' + meta + '</small>' +
          '</div>' +
          (thumb
            ? '<img class="feed-thumb" src="' + escapeHtml(thumb) + '" alt="" loading="lazy">'
            : '<span class="feed-thumb feed-thumb--empty" aria-hidden="true"></span>') +
        '</button>'
      );
    }).join('');
  }

  async function ensureNewsLoaded() {
    if (newsLoaded) return newsItems;
    try {
      const response = await fetch(NEWS_LIST, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store'
      });
      const payload = await response.json().catch(function () { return null; });
      newsItems =
        payload && payload.ok && payload.data && Array.isArray(payload.data.items)
          ? payload.data.items
          : [];
      newsLoaded = true;
      renderNewsPortal(newsItems);
      startNewsRotation();
    } catch (error) {
      newsItems = [];
      newsLoaded = true;
      renderNewsPortal([]);
      startNewsRotation();
      if (els.newsLoading) {
        els.newsLoading.hidden = false;
        els.newsLoading.textContent = 'Unable to load news right now.';
      }
    }
    return newsItems;
  }

  async function ensureAnnouncementsLoaded() {
    if (announcementsLoaded) return announcementItems;
    try {
      const response = await fetch(ANNOUNCEMENTS_LIST, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store'
      });
      const payload = await response.json().catch(function () { return null; });
      announcementItems =
        payload && payload.ok && payload.data && Array.isArray(payload.data.items)
          ? payload.data.items
          : [];
      announcementsLoaded = true;
      renderAnnouncementsPortal(announcementItems);
      startAnnounceRotation();
    } catch (error) {
      announcementItems = [];
      announcementsLoaded = true;
      renderAnnouncementsPortal([]);
      startAnnounceRotation();
      if (els.announcementsLoading) {
        els.announcementsLoading.hidden = false;
        els.announcementsLoading.textContent = 'Unable to load announcements right now.';
      }
    }
    return announcementItems;
  }

  function updateClock() {
    const now = new Date();
    if (els.liveClock) {
      els.liveClock.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (els.liveDate) {
      els.liveDate.textContent = now.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
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

  function buildWeatherWarnings(data) {
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
        title: 'Thunderstorm / severe weather',
        text: 'Storm activity possible over Metro Manila in the next day. Secure outdoor items and avoid flood-prone roads.'
      });
    }

    if (maxDailyWind >= 45 || maxDailyGust >= 60 || wind >= 40) {
      warnings.push({
        level: 'high',
        icon: 'bi-wind',
        title: 'Strong wind advisory',
        text: 'Peak winds near ' + Math.round(Math.max(maxDailyWind, wind)) + ' km/h'
          + (maxDailyGust ? ' (gusts ~' + Math.round(maxDailyGust) + ' km/h)' : '')
          + '. Watch for falling debris and unstable structures.'
      });
    } else if (maxDailyWind >= 30 || wind >= 28) {
      warnings.push({
        level: 'med',
        icon: 'bi-wind',
        title: 'Breezy conditions',
        text: 'Elevated winds expected. Secure light outdoor objects and stay updated.'
      });
    }

    if (maxRainChance >= 70 || maxPrecipSum >= 20 || precip >= 2) {
      warnings.push({
        level: 'high',
        icon: 'bi-cloud-rain-heavy',
        title: 'Heavy rain / flood watch',
        text: 'Rain chance up to ' + Math.round(maxRainChance) + '% with possible heavy showers. Avoid flooded streets and underground parking.'
      });
    } else if (maxRainChance >= 45 || maxPrecipSum >= 8) {
      warnings.push({
        level: 'med',
        icon: 'bi-cloud-drizzle',
        title: 'Rain likely',
        text: 'Showers possible in the next 24–48 hours. Keep an umbrella and check local flood-prone areas.'
      });
    }

    // Typhoon-like heuristic for tropical conditions
    if ((maxDailyWind >= 62 || maxDailyGust >= 80) && (maxRainChance >= 60 || maxPrecipSum >= 25 || code >= 80)) {
      warnings.unshift({
        level: 'high',
        icon: 'bi-tropical-storm',
        title: 'Tropical storm–like conditions',
        text: 'Combined strong wind and heavy rain signal storm-level risk for Makati. Prepare go-bags and monitor official PAGASA bulletins.'
      });
    }

    if (!warnings.length) {
      warnings.push({
        level: 'clear',
        icon: 'bi-shield-check',
        title: 'No severe weather flags',
        text: 'Makati forecast looks manageable right now. Stay subscribed for sudden storm updates.'
      });
    }

    return {
      warnings: warnings.slice(0, 3),
      maxRainChance: maxRainChance
    };
  }

  function renderWarnings(warnings) {
    latestWarnings = warnings;
    if (!els.warningsList) return;

    els.warningsList.innerHTML = warnings.map(function (w) {
      const levelClass = w.level === 'high' ? 'is-high' : (w.level === 'clear' ? 'is-clear' : '');
      return (
        '<article class="warning-item ' + levelClass + '">' +
          '<i class="bi ' + escapeHtml(w.icon) + '" aria-hidden="true"></i>' +
          '<div><strong>' + escapeHtml(w.title) + '</strong><p>' + escapeHtml(w.text) + '</p></div>' +
        '</article>'
      );
    }).join('');

    const top = warnings.find(function (w) { return w.level === 'high'; });
    if (top && els.warningBanner && !sessionStorage.getItem('firenet_warning_dismissed')) {
      els.warningBanner.hidden = false;
      if (els.warningBannerTitle) els.warningBannerTitle.textContent = top.title;
      if (els.warningBannerText) els.warningBannerText.textContent = top.text;
      if (els.weatherChip) els.weatherChip.classList.add('is-alert');
      if (els.weatherChipIcon) {
        els.weatherChipIcon.className = 'bi bi-exclamation-triangle-fill';
      }
    } else if (els.warningBanner && !top) {
      els.warningBanner.hidden = true;
      if (els.weatherChip) els.weatherChip.classList.remove('is-alert');
    }

    if (els.alertsLiveSummary) {
      els.alertsLiveSummary.textContent = warnings[0]
        ? warnings[0].title + ' — ' + warnings[0].text
        : 'Conditions look calm in Makati right now.';
    }
  }

  async function loadWeather() {
    try {
      const response = await fetch(WEATHER_URL, { cache: 'no-store' });
      const data = await response.json();
      const current = data && data.current ? data.current : null;
      if (!current) throw new Error('No weather data');

      const temp = Number(current.temperature_2m);
      const humidity = Number(current.relative_humidity_2m);
      const wind = Number(current.wind_speed_10m);
      const code = Number(current.weather_code);
      const label = WMO_LABELS[code] || 'Makati now';

      if (els.weatherTemp) els.weatherTemp.textContent = Math.round(temp) + '°';
      if (els.weatherLabel) els.weatherLabel.textContent = label;
      if (els.windValue) els.windValue.textContent = Math.round(wind);
      if (els.humidityValue) els.humidityValue.textContent = Math.round(humidity) + '%';

      const risk = computeFireRisk(temp, humidity, wind);
      if (els.fireRiskValue) els.fireRiskValue.textContent = risk.label;
      if (els.fireRiskMeta) els.fireRiskMeta.textContent = 'Index ' + risk.score + ' · advisory';
      if (els.fireRiskBar) els.fireRiskBar.style.width = risk.score + '%';

      const built = buildWeatherWarnings(data);
      if (els.rainChanceValue) {
        els.rainChanceValue.textContent = Math.round(built.maxRainChance || 0) + '%';
      }
      renderWarnings(built.warnings);
    } catch (error) {
      if (els.weatherTemp) els.weatherTemp.textContent = '—°';
      if (els.weatherLabel) els.weatherLabel.textContent = 'Weather offline';
      if (els.fireRiskValue) els.fireRiskValue.textContent = '—';
      if (els.warningsList) {
        els.warningsList.innerHTML = '<p class="soft-empty">Unable to load weather advisories.</p>';
      }
      if (els.alertsLiveSummary) {
        els.alertsLiveSummary.textContent = 'Weather feed is offline. You can still subscribe for district notices.';
      }
    }
  }

  function initSafety() {
    if (els.tipStack) {
      els.tipStack.innerHTML = SAFETY_TIPS.map(function (tip, index) {
        return (
          '<details class="tip-item" role="listitem"' + (index === 0 ? ' open' : '') + '>' +
            '<summary>' + escapeHtml(tip.title) + '</summary>' +
            '<div class="tip-body">' + escapeHtml(tip.body) + '</div>' +
          '</details>'
        );
      }).join('');
    }

    const storageKey = 'firenet_civilian_checklist_v1';
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
    } catch (e) {
      saved = {};
    }

    function renderChecklist(state) {
      if (!els.safetyChecklist) return;
      els.safetyChecklist.innerHTML = CHECKLIST_ITEMS.map(function (item, index) {
        const checked = !!state[index];
        return (
          '<li>' +
            '<label class="' + (checked ? 'is-done' : '') + '">' +
              '<input type="checkbox" data-check-index="' + index + '"' + (checked ? ' checked' : '') + '>' +
              '<span>' + escapeHtml(item) + '</span>' +
            '</label>' +
          '</li>'
        );
      }).join('');
    }

    renderChecklist(saved);

    if (els.safetyChecklist) {
      els.safetyChecklist.addEventListener('change', function (event) {
        const input = event.target.closest('input[data-check-index]');
        if (!input) return;
        const index = input.getAttribute('data-check-index');
        saved[index] = !!input.checked;
        localStorage.setItem(storageKey, JSON.stringify(saved));
        input.closest('label').classList.toggle('is-done', input.checked);
      });
    }

    if (els.resetChecklist) {
      els.resetChecklist.addEventListener('click', function () {
        saved = {};
        localStorage.removeItem(storageKey);
        renderChecklist(saved);
      });
    }
  }

  function initAlertForm() {
    if (!els.alertForm) return;

    els.alertForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!els.alertFormMessage || !els.alertSubmitBtn) return;

      const wantEmail = !!(els.channelEmail && els.channelEmail.checked);
      const wantSms = !!(els.channelSms && els.channelSms.checked);
      const topics = Array.from(document.querySelectorAll('input[name="topic"]:checked')).map(function (el) {
        return el.value;
      });

      const payload = {
        email: els.alertEmail ? els.alertEmail.value.trim() : '',
        phone: els.alertPhone ? els.alertPhone.value.trim() : '',
        barangay: els.alertBarangay ? els.alertBarangay.value.trim() : '',
        channelEmail: wantEmail,
        channelSms: wantSms,
        topics: topics
      };

      const btnText = els.alertSubmitBtn.querySelector('.btn-text');
      const btnLoader = els.alertSubmitBtn.querySelector('.btn-loader');
      els.alertSubmitBtn.disabled = true;
      if (btnText) btnText.hidden = true;
      if (btnLoader) btnLoader.hidden = false;
      els.alertFormMessage.hidden = true;

      try {
        const response = await fetch(ALERTS_SUBSCRIBE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(function () { return null; });
        if (!response.ok || !result || result.ok !== true) {
          throw new Error((result && result.message) || 'Subscription failed.');
        }
        els.alertFormMessage.textContent = result.message || 'Subscribed successfully.';
        els.alertFormMessage.className = 'form-message is-ok';
        els.alertFormMessage.hidden = false;
        els.alertForm.reset();
        if (els.channelEmail) els.channelEmail.checked = true;
        if (els.channelSms) els.channelSms.checked = true;
        document.querySelectorAll('input[name="topic"]').forEach(function (el) {
          el.checked = el.value === 'weather' || el.value === 'announcements';
        });
      } catch (error) {
        els.alertFormMessage.textContent = error.message || 'Unable to subscribe right now.';
        els.alertFormMessage.className = 'form-message is-err';
        els.alertFormMessage.hidden = false;
      } finally {
        els.alertSubmitBtn.disabled = false;
        if (btnText) btnText.hidden = false;
        if (btnLoader) btnLoader.hidden = true;
      }
    });
  }

  function initSceneRotation() {
    const layers = Array.from(document.querySelectorAll('.scene-layer'));
    if (layers.length < 2) return;
    let index = 0;
    window.setInterval(function () {
      layers[index].classList.remove('is-active');
      index = (index + 1) % layers.length;
      layers[index].classList.add('is-active');
    }, 9000);
  }

  function initEmbers() {
    const canvas = els.canvas;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return;
    }

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let particles = [];
    let pointer = { x: 0.5, y: 0.5 };
    let raf = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * window.devicePixelRatio);
      canvas.height = Math.floor(height * window.devicePixelRatio);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      const count = Math.min(80, Math.floor((width * height) / 19000));
      particles = Array.from({ length: count }, function () {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.6 + Math.random() * 2.2,
          vy: -0.2 - Math.random() * 0.85,
          vx: (Math.random() - 0.5) * 0.35,
          a: 0.15 + Math.random() * 0.5,
          hue: 18 + Math.random() * 28
        };
      });
    }

    function frame() {
      ctx.clearRect(0, 0, width, height);
      const pullX = (pointer.x - 0.5) * 0.35;
      particles.forEach(function (p) {
        p.x += p.vx + pullX;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        ctx.beginPath();
        ctx.fillStyle = 'hsla(' + p.hue + ', 95%, 62%, ' + p.a + ')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = window.requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', function (event) {
      pointer.x = event.clientX / Math.max(1, width);
      pointer.y = event.clientY / Math.max(1, height);
    });

    resize();
    raf = window.requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) window.cancelAnimationFrame(raf);
      else raf = window.requestAnimationFrame(frame);
    });
  }

  function initHotlineGlow() {
    document.querySelectorAll('.hotline-card').forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((event.clientX - rect.left) / rect.width) * 100 + '%');
        card.style.setProperty('--my', ((event.clientY - rect.top) / rect.height) * 100 + '%');
      });
    });
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      const viewBtn = event.target.closest('[data-view]');
      if (viewBtn && viewBtn.tagName !== 'A') {
        const tip = viewBtn.getAttribute('data-open-tip');
        setView(viewBtn.getAttribute('data-view'), tip != null ? { openTip: tip } : {});
        return;
      }

      const newsBtn = event.target.closest('[data-open-news]');
      if (newsBtn) {
        openArticleById(newsBtn.getAttribute('data-open-news'), 'news');
        return;
      }

      const announceBtn = event.target.closest('[data-open-announcement]');
      if (announceBtn) {
        openArticleById(announceBtn.getAttribute('data-open-announcement'), 'announcement');
        return;
      }

      if (event.target.closest('[data-close-article]')) closeArticleModal();
    });

    if (els.newsFeaturedOpen) {
      els.newsFeaturedOpen.addEventListener('click', function () {
        if (featuredNewsId) openArticleById(featuredNewsId, 'news');
      });
    }

    if (els.menuToggle) {
      els.menuToggle.addEventListener('click', function () {
        if (els.body.classList.contains('nav-open')) closeNav();
        else openNav();
      });
    }

    if (els.navScrim) els.navScrim.addEventListener('click', closeNav);

    if (els.warningBannerClose) {
      els.warningBannerClose.addEventListener('click', function () {
        if (els.warningBanner) els.warningBanner.hidden = true;
        sessionStorage.setItem('firenet_warning_dismissed', '1');
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeArticleModal();
        closeNav();
      }
    });

    document.querySelectorAll('.hotline-card--hero').forEach(function (card) {
      card.addEventListener('click', function (event) {
        if (event.target.closest('.underline-link')) {
          event.preventDefault();
          window.open('https://www.makati.gov.ph/content/makati-hotlines', '_blank', 'noopener,noreferrer');
        }
      });
    });
  }

  function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    const label = document.getElementById('themeToggleLabel');
    const storageKey = 'firenet_civilian_theme';

    function currentTheme() {
      const theme = document.documentElement.getAttribute('data-theme');
      return theme === 'light' ? 'light' : 'dark';
    }

    function syncLabel(theme) {
      if (!btn || !label) return;
      const nextIsLight = theme === 'dark';
      label.textContent = nextIsLight ? 'Light' : 'Dark';
      btn.setAttribute('aria-label', nextIsLight ? 'Switch to light mode' : 'Switch to dark mode');
    }

    syncLabel(currentTheme());

    if (!btn) return;
    btn.addEventListener('click', function () {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
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

  function boot() {
    updateClock();
    window.setInterval(updateClock, 1000);
    initSceneRotation();
    initEmbers();
    initHotlineGlow();
    initSafety();
    initAlertForm();
    initThemeToggle();
    bindEvents();
    loadWeather();
    ensureNewsLoaded();
    ensureAnnouncementsLoaded();

    const params = new URLSearchParams(window.location.search);
    const initialView = params.get('view') || 'home';
    const newsId = params.get('newsId');
    setView(initialView, { skipHistory: true, keepNewsId: !!newsId, newsId: newsId });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
