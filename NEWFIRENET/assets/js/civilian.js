(function () {
  'use strict';

  const NEWS_LIST = '/firenet/NEWFIRENET/backend/controllers/news.php?action=list&limit=12';
  const NEWS_GET = '/firenet/NEWFIRENET/backend/controllers/news.php?action=get&newsId=';
  const ANNOUNCEMENTS_LIST =
    '/firenet/NEWFIRENET/backend/controllers/news.php?action=announcements_list&limit=12';
  const ALERTS_SUBSCRIBE = '/firenet/NEWFIRENET/backend/controllers/civilian_alerts.php?action=subscribe';
  const PORTAL_CONFIG = '/firenet/NEWFIRENET/backend/controllers/civilian_alerts.php?action=portal_config';
  const WEATHER_URL =
    'https://api.open-meteo.com/v1/forecast?latitude=14.5547&longitude=121.0244'
    + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,'
    + 'wind_gusts_10m,wind_direction_10m,precipitation,surface_pressure,cloud_cover'
    + '&hourly=precipitation_probability,weather_code,wind_speed_10m'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,'
    + 'wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunrise,sunset'
    + '&timezone=Asia%2FManila&forecast_days=7';
  const AIR_QUALITY_URL =
    'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=14.5547&longitude=121.0244'
    + '&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide'
    + '&timezone=Asia%2FManila';
  const QUAKES_URL =
    'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson'
    + '&latitude=14.5547&longitude=121.0244&maxradiuskm=400&minmagnitude=3.5'
    + '&orderby=time&limit=6';
  const MAKATI_LAT = 14.5547;
  const MAKATI_LON = 121.0244;

  const ROTATE_MS = 5000;
  const ANNOUNCE_VISIBLE = 2;

  const VIEW_META = {
    home: { title: 'FireNet for Civilians', kicker: 'Public Safety Portal' },
    conditions: { title: 'Weather & Hazard Center', kicker: 'Live conditions' },
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

  const WMO_ICONS = {
    0: 'bi-sun',
    1: 'bi-sun',
    2: 'bi-cloud-sun',
    3: 'bi-clouds',
    45: 'bi-cloud-fog2',
    48: 'bi-cloud-fog2',
    51: 'bi-cloud-drizzle',
    61: 'bi-cloud-rain',
    63: 'bi-cloud-rain',
    65: 'bi-cloud-rain-heavy',
    80: 'bi-cloud-rain',
    81: 'bi-cloud-rain',
    82: 'bi-cloud-rain-heavy',
    95: 'bi-cloud-lightning-rain',
    96: 'bi-cloud-lightning-rain',
    99: 'bi-cloud-lightning-rain'
  };

  function wmoIcon(code) {
    return WMO_ICONS[Number(code)] || 'bi-cloud-sun';
  }

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
    alertsLiveSummary: document.getElementById('alertsLiveSummary'),
    feelsLikeValue: document.getElementById('feelsLikeValue'),
    aqiHomeValue: document.getElementById('aqiHomeValue'),
    aqiHomeMeta: document.getElementById('aqiHomeMeta'),
    condUpdatedPill: document.getElementById('condUpdatedPill'),
    condNowIcon: document.getElementById('condNowIcon'),
    condNowTemp: document.getElementById('condNowTemp'),
    condNowLabel: document.getElementById('condNowLabel'),
    condFeels: document.getElementById('condFeels'),
    condWind: document.getElementById('condWind'),
    condGusts: document.getElementById('condGusts'),
    condHumidity: document.getElementById('condHumidity'),
    condPressure: document.getElementById('condPressure'),
    condClouds: document.getElementById('condClouds'),
    condUv: document.getElementById('condUv'),
    condPrecip: document.getElementById('condPrecip'),
    sunriseTime: document.getElementById('sunriseTime'),
    sunsetTime: document.getElementById('sunsetTime'),
    daylightSpan: document.getElementById('daylightSpan'),
    sunArcDot: document.getElementById('sunArcDot'),
    forecastStrip: document.getElementById('forecastStrip'),
    rainBars: document.getElementById('rainBars'),
    aqiValue: document.getElementById('aqiValue'),
    aqiCategory: document.getElementById('aqiCategory'),
    aqiAdvice: document.getElementById('aqiAdvice'),
    aqiPollutants: document.getElementById('aqiPollutants'),
    aqiCard: document.getElementById('aqiCard'),
    quakeList: document.getElementById('quakeList'),
    shareLocationBtn: document.getElementById('shareLocationBtn'),
    shareLocationBtnText: document.getElementById('shareLocationBtnText'),
    shareLocationOut: document.getElementById('shareLocationOut'),
    shareLocationCoords: document.getElementById('shareLocationCoords'),
    shareLocationMap: document.getElementById('shareLocationMap'),
    shareLocationCopy: document.getElementById('shareLocationCopy')
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
      renderConditions(data);
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
      if (els.condUpdatedPill) els.condUpdatedPill.textContent = 'Feed offline';
      if (els.forecastStrip) {
        els.forecastStrip.innerHTML = '<p class="soft-empty">Forecast unavailable right now.</p>';
      }
      if (els.rainBars) {
        els.rainBars.innerHTML = '<p class="soft-empty">Rain outlook unavailable.</p>';
      }
    }
  }

  function windCompass(deg) {
    if (!Number.isFinite(deg)) return '';
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(((deg % 360) / 45)) % 8];
  }

  function formatClockTime(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function renderConditions(data) {
    const current = data.current || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};

    const code = Number(current.weather_code || 0);
    const feels = Number(current.apparent_temperature);

    if (els.feelsLikeValue && Number.isFinite(feels)) {
      els.feelsLikeValue.textContent = Math.round(feels) + '°';
    }

    if (els.condUpdatedPill) {
      els.condUpdatedPill.textContent =
        'Updated ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    if (els.condNowIcon) els.condNowIcon.className = 'bi ' + wmoIcon(code) + ' cond-now-icon';
    if (els.condNowTemp) els.condNowTemp.textContent = Math.round(Number(current.temperature_2m)) + '°C';
    if (els.condNowLabel) els.condNowLabel.textContent = WMO_LABELS[code] || 'Current weather';

    if (els.condFeels && Number.isFinite(feels)) els.condFeels.textContent = Math.round(feels) + '°C';
    if (els.condWind) {
      const compass = windCompass(Number(current.wind_direction_10m));
      els.condWind.textContent = Math.round(Number(current.wind_speed_10m) || 0) + ' km/h' + (compass ? ' ' + compass : '');
    }
    if (els.condGusts) els.condGusts.textContent = Math.round(Number(current.wind_gusts_10m) || 0) + ' km/h';
    if (els.condHumidity) els.condHumidity.textContent = Math.round(Number(current.relative_humidity_2m) || 0) + '%';
    if (els.condPressure) els.condPressure.textContent = Math.round(Number(current.surface_pressure) || 0) + ' hPa';
    if (els.condClouds) els.condClouds.textContent = Math.round(Number(current.cloud_cover) || 0) + '%';
    if (els.condPrecip) els.condPrecip.textContent = (Number(current.precipitation) || 0).toFixed(1) + ' mm';
    if (els.condUv && Array.isArray(daily.uv_index_max)) {
      const uv = Number(daily.uv_index_max[0]);
      let uvLabel = 'Low';
      if (uv >= 11) uvLabel = 'Extreme';
      else if (uv >= 8) uvLabel = 'Very high';
      else if (uv >= 6) uvLabel = 'High';
      else if (uv >= 3) uvLabel = 'Moderate';
      els.condUv.textContent = uv.toFixed(1) + ' · ' + uvLabel;
    }

    // Daylight card
    if (Array.isArray(daily.sunrise) && Array.isArray(daily.sunset)) {
      const sunrise = new Date(daily.sunrise[0]);
      const sunset = new Date(daily.sunset[0]);
      if (els.sunriseTime) els.sunriseTime.textContent = formatClockTime(daily.sunrise[0]);
      if (els.sunsetTime) els.sunsetTime.textContent = formatClockTime(daily.sunset[0]);
      if (els.daylightSpan && !Number.isNaN(sunrise.getTime()) && !Number.isNaN(sunset.getTime())) {
        const mins = Math.max(0, Math.round((sunset - sunrise) / 60000));
        els.daylightSpan.textContent = Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm';
        if (els.sunArcDot) {
          const now = Date.now();
          const progress = Math.min(1, Math.max(0, (now - sunrise.getTime()) / (sunset.getTime() - sunrise.getTime())));
          els.sunArcDot.style.left = (progress * 100) + '%';
          els.sunArcDot.classList.toggle('is-night', progress <= 0 || progress >= 1);
        }
      }
    }

    // 7-day forecast strip
    if (els.forecastStrip && Array.isArray(daily.time)) {
      els.forecastStrip.innerHTML = daily.time.map(function (day, i) {
        const date = new Date(day);
        const dayName = i === 0 ? 'Today' : date.toLocaleDateString([], { weekday: 'short' });
        const dCode = Number(daily.weather_code && daily.weather_code[i]);
        const tMax = Math.round(Number(daily.temperature_2m_max && daily.temperature_2m_max[i]));
        const tMin = Math.round(Number(daily.temperature_2m_min && daily.temperature_2m_min[i]));
        const rain = Math.round(Number(daily.precipitation_probability_max && daily.precipitation_probability_max[i]) || 0);
        return (
          '<article class="forecast-day' + (i === 0 ? ' is-today' : '') + '">' +
            '<p class="forecast-day-name">' + escapeHtml(dayName) + '</p>' +
            '<i class="bi ' + wmoIcon(dCode) + '" aria-hidden="true"></i>' +
            '<p class="forecast-temps"><strong>' + tMax + '°</strong><span>' + tMin + '°</span></p>' +
            '<p class="forecast-rain"><i class="bi bi-droplet" aria-hidden="true"></i>' + rain + '%</p>' +
          '</article>'
        );
      }).join('');
    }

    // 24h rain probability bars
    if (els.rainBars && Array.isArray(hourly.time) && Array.isArray(hourly.precipitation_probability)) {
      const nowMs = Date.now();
      let startIdx = hourly.time.findIndex(function (t) { return new Date(t).getTime() >= nowMs; });
      if (startIdx < 0) startIdx = 0;
      const hours = hourly.time.slice(startIdx, startIdx + 24);
      const probs = hourly.precipitation_probability.slice(startIdx, startIdx + 24);
      els.rainBars.innerHTML = hours.map(function (t, i) {
        const prob = Math.max(0, Math.min(100, Math.round(Number(probs[i]) || 0)));
        const hourLabel = new Date(t).toLocaleTimeString([], { hour: 'numeric' });
        const levelClass = prob >= 70 ? ' is-high' : (prob >= 40 ? ' is-med' : '');
        return (
          '<div class="rain-bar' + levelClass + '" title="' + escapeHtml(hourLabel + ' — ' + prob + '%') + '">' +
            '<span class="rain-bar-fill" style="height:' + Math.max(4, prob) + '%"></span>' +
            (i % 4 === 0 ? '<span class="rain-bar-label">' + escapeHtml(hourLabel) + '</span>' : '') +
          '</div>'
        );
      }).join('');
    }
  }

  const AQI_LEVELS = [
    { max: 50, label: 'Good', cls: 'aqi-good', advice: 'Air is clean. Great day for outdoor activities.' },
    { max: 100, label: 'Moderate', cls: 'aqi-moderate', advice: 'Acceptable air. Unusually sensitive people should pace outdoor exertion.' },
    { max: 150, label: 'Unhealthy for sensitive groups', cls: 'aqi-usg', advice: 'Children, elders, and people with asthma should limit prolonged outdoor effort.' },
    { max: 200, label: 'Unhealthy', cls: 'aqi-unhealthy', advice: 'Limit time outdoors. Consider a mask if you smell smoke or haze.' },
    { max: 300, label: 'Very unhealthy', cls: 'aqi-very', advice: 'Avoid outdoor exertion. Keep windows closed and use air filtration if available.' },
    { max: Infinity, label: 'Hazardous', cls: 'aqi-hazard', advice: 'Stay indoors. Follow local health advisories immediately.' }
  ];

  async function loadAirQuality() {
    try {
      const response = await fetch(AIR_QUALITY_URL, { cache: 'no-store' });
      const data = await response.json();
      const current = data && data.current ? data.current : null;
      if (!current) throw new Error('No air quality data');

      const aqi = Math.round(Number(current.us_aqi));
      if (!Number.isFinite(aqi)) throw new Error('Bad AQI');

      const level = AQI_LEVELS.find(function (l) { return aqi <= l.max; }) || AQI_LEVELS[AQI_LEVELS.length - 1];

      if (els.aqiHomeValue) els.aqiHomeValue.textContent = String(aqi);
      if (els.aqiHomeMeta) els.aqiHomeMeta.textContent = level.label;

      if (els.aqiValue) els.aqiValue.textContent = String(aqi);
      if (els.aqiCategory) els.aqiCategory.textContent = level.label;
      if (els.aqiAdvice) els.aqiAdvice.textContent = level.advice;
      if (els.aqiCard) {
        els.aqiCard.className = els.aqiCard.className.replace(/\baqi-\w+\b/g, '').trim() + ' ' + level.cls;
      }
      if (els.aqiPollutants) {
        const parts = [
          { key: 'pm2_5', label: 'PM2.5', unit: 'µg/m³' },
          { key: 'pm10', label: 'PM10', unit: 'µg/m³' },
          { key: 'ozone', label: 'O₃', unit: 'µg/m³' },
          { key: 'nitrogen_dioxide', label: 'NO₂', unit: 'µg/m³' }
        ];
        els.aqiPollutants.innerHTML = parts.map(function (p) {
          const v = Number(current[p.key]);
          if (!Number.isFinite(v)) return '';
          return '<span class="aqi-chip"><strong>' + p.label + '</strong> ' + Math.round(v) + ' ' + p.unit + '</span>';
        }).join('');
      }
    } catch (error) {
      if (els.aqiHomeValue) els.aqiHomeValue.textContent = '—';
      if (els.aqiHomeMeta) els.aqiHomeMeta.textContent = 'Offline';
      if (els.aqiCategory) els.aqiCategory.textContent = 'Feed offline';
      if (els.aqiAdvice) els.aqiAdvice.textContent = 'Air quality data is unavailable right now. Try again later.';
    }
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = function (d) { return (d * Math.PI) / 180; };
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function timeAgo(ms) {
    const diff = Date.now() - ms;
    const mins = Math.round(diff / 60000);
    if (mins < 60) return mins + ' min ago';
    const hours = Math.round(mins / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.round(hours / 24);
    return days + (days === 1 ? ' day ago' : ' days ago');
  }

  async function loadQuakes() {
    if (!els.quakeList) return;
    try {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const response = await fetch(QUAKES_URL + '&starttime=' + since, { cache: 'no-store' });
      const data = await response.json();
      const features = data && Array.isArray(data.features) ? data.features : [];

      if (!features.length) {
        els.quakeList.innerHTML =
          '<p class="soft-empty"><i class="bi bi-shield-check"></i> No magnitude 3.5+ earthquakes recorded near Metro Manila in the last 30 days.</p>';
        return;
      }

      els.quakeList.innerHTML = features.map(function (f) {
        const props = f.properties || {};
        const coords = (f.geometry && f.geometry.coordinates) || [0, 0, 0];
        const mag = Number(props.mag) || 0;
        const magCls = mag >= 6 ? 'is-severe' : (mag >= 5 ? 'is-strong' : (mag >= 4 ? 'is-moderate' : ''));
        const dist = haversineKm(MAKATI_LAT, MAKATI_LON, Number(coords[1]), Number(coords[0]));
        const depth = Math.round(Number(coords[2]) || 0);
        return (
          '<article class="quake-row">' +
            '<span class="quake-mag ' + magCls + '">' + mag.toFixed(1) + '</span>' +
            '<div class="quake-info">' +
              '<strong>' + escapeHtml(String(props.place || 'Unknown location')) + '</strong>' +
              '<span>' + escapeHtml(timeAgo(Number(props.time))) + ' · ~' + dist + ' km from Makati · depth ' + depth + ' km</span>' +
            '</div>' +
            (props.url ? '<a class="quake-link" href="' + escapeHtml(String(props.url)) + '" target="_blank" rel="noopener noreferrer" aria-label="USGS event page"><i class="bi bi-box-arrow-up-right"></i></a>' : '') +
          '</article>'
        );
      }).join('');
    } catch (error) {
      els.quakeList.innerHTML = '<p class="soft-empty">Seismic feed is unavailable right now.</p>';
    }
  }

  function initShareLocation() {
    if (!els.shareLocationBtn) return;

    let mapsLink = '';

    els.shareLocationBtn.addEventListener('click', function () {
      if (!navigator.geolocation) {
        if (els.shareLocationBtnText) els.shareLocationBtnText.textContent = 'Location not supported';
        return;
      }
      if (els.shareLocationBtnText) els.shareLocationBtnText.textContent = 'Locating…';
      els.shareLocationBtn.disabled = true;

      navigator.geolocation.getCurrentPosition(
        function (pos) {
          const lat = pos.coords.latitude.toFixed(6);
          const lon = pos.coords.longitude.toFixed(6);
          const acc = Math.round(pos.coords.accuracy || 0);
          mapsLink = 'https://maps.google.com/?q=' + lat + ',' + lon;

          if (els.shareLocationCoords) {
            els.shareLocationCoords.textContent = lat + ', ' + lon + (acc ? ' (±' + acc + ' m)' : '');
          }
          if (els.shareLocationMap) els.shareLocationMap.href = mapsLink;
          if (els.shareLocationOut) els.shareLocationOut.hidden = false;
          if (els.shareLocationBtnText) els.shareLocationBtnText.textContent = 'Refresh location';
          els.shareLocationBtn.disabled = false;
        },
        function () {
          if (els.shareLocationBtnText) els.shareLocationBtnText.textContent = 'Allow location & retry';
          els.shareLocationBtn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      );
    });

    if (els.shareLocationCopy) {
      els.shareLocationCopy.addEventListener('click', function () {
        if (!mapsLink) return;
        const done = function () {
          els.shareLocationCopy.innerHTML = '<i class="bi bi-check2"></i> Copied!';
          window.setTimeout(function () {
            els.shareLocationCopy.innerHTML = '<i class="bi bi-clipboard-check"></i> Copy link';
          }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(mapsLink).then(done).catch(function () {});
        } else {
          const tmp = document.createElement('textarea');
          tmp.value = mapsLink;
          document.body.appendChild(tmp);
          tmp.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(tmp);
        }
      });
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

  async function loadPortalConfig() {
    try {
      const response = await fetch(PORTAL_CONFIG, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      const payload = await response.json().catch(function () { return null; });
      if (!response.ok || !payload || payload.ok !== true || !payload.data) {
        return;
      }
      const data = payload.data;
      const hotline = String(data.emergencyHotline || '168').replace(/\D+/g, '') || '168';
      const central = String(data.centralPhone || '').replace(/\D+/g, '');

      document.querySelectorAll('a[href="tel:168"], a[href^="tel:168"]').forEach(function (link) {
        link.setAttribute('href', 'tel:' + hotline);
      });
      document.querySelectorAll('.hotline-chip-num, .hotline-card-number').forEach(function (node) {
        if (String(node.textContent || '').trim() === '168') {
          node.textContent = hotline;
        }
      });

      if (central) {
        const international = central.indexOf('63') === 0 ? central : ('63' + central.replace(/^0/, ''));
        const pretty = central.length === 11
          ? (central.slice(0, 4) + '-' + central.slice(4, 7) + '-' + central.slice(7))
          : central;
        document.querySelectorAll('a.top-call-btn').forEach(function (link) {
          link.setAttribute('href', 'tel:+' + international);
        });
      }

      if (data.tagline) {
        const lead = document.querySelector('.hero-lead');
        if (lead) lead.textContent = data.tagline;
      }
      if (data.districtName) {
        const eyebrow = document.querySelector('.hero-eyebrow');
        if (eyebrow) eyebrow.textContent = data.districtName + ' · Public Access';
      }

      const maint = document.getElementById('portalMaintenanceBanner');
      const maintText = document.getElementById('portalMaintenanceText');
      if (maint && maintText && data.maintenanceEnabled && data.maintenanceMessage) {
        maintText.textContent = data.maintenanceMessage;
        maint.hidden = false;
      }

      if (data.subscribeEnabled === false && els.alertForm) {
        els.alertForm.querySelectorAll('input, button, select, textarea').forEach(function (el) {
          el.disabled = true;
        });
        if (els.alertFormMessage) {
          els.alertFormMessage.textContent = 'Alert subscriptions are temporarily disabled by the district.';
          els.alertFormMessage.className = 'form-message is-err';
          els.alertFormMessage.hidden = false;
        }
      }
    } catch (e) {
      // Keep static HTML defaults when config is offline.
    }
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
    initShareLocation();
    bindEvents();
    loadPortalConfig();
    loadWeather();
    loadAirQuality();
    loadQuakes();
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
