(function () {
  'use strict';

  const VALID_VIEWS = ['login', 'news', 'announcements'];
  const pills = Array.from(document.querySelectorAll('.login-ribbon-pill[data-portal-view], .login-mobile-tab[data-portal-view]'));
  const viewTriggers = Array.from(document.querySelectorAll('[data-portal-view]'));
  const views = {
    login: document.getElementById('portalLoginView'),
    news: document.getElementById('portalNewsView'),
    announcements: document.getElementById('portalAnnouncementsView')
  };

  const articleModal = document.getElementById('portalArticleModal');
  const articleTitle = document.getElementById('portalArticleTitle');
  const articleMeta = document.getElementById('portalArticleMeta');
  const articleBody = document.getElementById('portalArticleBody');
  const articleImage = document.getElementById('portalArticleImage');
  const articleKicker = document.getElementById('portalArticleKicker');
  const closeArticleBtn = document.getElementById('closePortalArticleModal');

  const newsFeaturedTitle = document.getElementById('portalNewsFeaturedTitle');
  const newsFeaturedBody = document.getElementById('portalNewsFeaturedBody');
  const newsFeaturedMeta = document.getElementById('portalNewsFeaturedMeta');
  const newsFeaturedImage = document.getElementById('portalNewsFeaturedImage');
  const newsFeaturedOpen = document.getElementById('portalNewsFeaturedOpen');
  const newsListEl = document.getElementById('portalNewsList');
  const newsCountPill = document.getElementById('portalNewsCountPill');
  const newsLoading = document.getElementById('portalNewsLoading');

  const announcementsListEl = document.getElementById('portalAnnouncementsList');
  const announcementsCountPill = document.getElementById('portalAnnouncementsCountPill');
  const announcementsLoading = document.getElementById('portalAnnouncementsLoading');

  let newsItems = [];
  let announcementItems = [];
  let newsLoaded = false;
  let announcementsLoaded = false;
  let currentView = 'login';

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

  function setView(viewName, options) {
    const opts = options || {};
    const next = VALID_VIEWS.indexOf(viewName) >= 0 ? viewName : 'login';
    currentView = next;

    Object.keys(views).forEach(function (key) {
      const el = views[key];
      if (!el) return;
      const active = key === next;
      el.hidden = !active;
      el.classList.toggle('is-active-portal-view', active);
    });

    const opsActive = Boolean(opts.opsActive) && next === 'login';

    pills.forEach(function (pill) {
      const value = String(pill.getAttribute('data-portal-view') || '');
      const isOpsShortcut = pill.hasAttribute('data-scroll-ops');
      let active = value === next;
      if (isOpsShortcut) {
        active = opsActive;
      } else if (value === 'login' && opsActive) {
        active = false;
      }
      pill.classList.toggle('is-active', active);
      if (active) {
        pill.setAttribute('aria-current', 'page');
      } else {
        pill.removeAttribute('aria-current');
      }
    });

    document.body.setAttribute('data-portal-view', next);
    document.body.classList.toggle('login-ops-focus', opsActive);

    document.body.classList.remove('login-m-enter');
    requestAnimationFrame(function () {
      document.body.classList.add('login-m-enter');
    });

    if (!opts.skipHistory) {
      const url = new URL(window.location.href);
      if (next === 'login') {
        url.searchParams.delete('view');
      } else {
        url.searchParams.set('view', next);
      }
      if (!opts.keepNewsId) {
        url.searchParams.delete('newsId');
      }
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }

    if (next === 'news') {
      ensureNewsLoaded().then(function () {
        const newsId = opts.newsId || new URLSearchParams(window.location.search).get('newsId');
        if (newsId) {
          openArticleById(newsId, 'news');
        }
      });
    }

    if (next === 'announcements') {
      ensureAnnouncementsLoaded().then(function () {
        const newsId = opts.newsId || new URLSearchParams(window.location.search).get('newsId');
        if (newsId) {
          openArticleById(newsId, 'announcement');
        }
      });
    }

    if (opsActive) {
      requestAnimationFrame(function () {
        window.scrollTo({ top: 0, behavior: 'auto' });
      });
    } else if (!opts.skipScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function openArticleModal(item, kind) {
    if (!articleModal || !item) return;

    if (articleKicker) {
      articleKicker.textContent = kind === 'announcement' ? 'Announcement' : 'News';
    }
    if (articleTitle) {
      articleTitle.textContent = String(item.title || 'Untitled');
    }
    if (articleMeta) {
      const parts = [];
      if (item.sourceName) parts.push(String(item.sourceName));
      if (item.announcementType) parts.push(String(item.announcementType));
      if (item.createdAt) parts.push(formatDate(item.createdAt));
      articleMeta.textContent = parts.join(' · ');
    }
    if (articleBody) {
      articleBody.textContent = String(item.body || '');
    }
    if (articleImage) {
      const imageUrl = String(item.imageUrl || '').trim();
      if (imageUrl) {
        articleImage.src = imageUrl;
        articleImage.alt = String(item.title || 'Article image');
        articleImage.hidden = false;
      } else {
        articleImage.hidden = true;
        articleImage.removeAttribute('src');
      }
    }

    articleModal.hidden = false;
    document.body.classList.add('portal-article-open');
  }

  function closeArticleModal() {
    if (!articleModal) return;
    articleModal.hidden = true;
    document.body.classList.remove('portal-article-open');
    if (articleImage) {
      articleImage.hidden = true;
      articleImage.removeAttribute('src');
    }
  }

  async function fetchItem(newsId) {
    const response = await fetch(
      '/firenet/NEWFIRENET/backend/controllers/news.php?action=get&newsId=' + encodeURIComponent(String(newsId)),
      { method: 'GET', credentials: 'same-origin', cache: 'no-store' }
    );
    const payload = await response.json().catch(function () { return null; });
    if (!response.ok || !payload || payload.ok !== true || !payload.data) {
      throw new Error((payload && payload.message) || 'Unable to open article.');
    }
    return payload.data;
  }

  async function openArticleById(newsId, preferredKind) {
    try {
      const localNews = newsItems.find(function (item) { return String(item.newsId) === String(newsId); });
      const localAnnouncement = announcementItems.find(function (item) { return String(item.newsId) === String(newsId); });
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

  function renderNewsPortal(items) {
    if (newsLoading) newsLoading.hidden = true;
    if (newsCountPill) {
      newsCountPill.textContent = items.length + (items.length === 1 ? ' update' : ' updates');
    }

    if (!items.length) {
      if (newsFeaturedTitle) newsFeaturedTitle.textContent = 'No recent news';
      if (newsFeaturedBody) newsFeaturedBody.textContent = 'District updates will appear here when published.';
      if (newsFeaturedMeta) newsFeaturedMeta.textContent = '';
      if (newsFeaturedImage) {
        newsFeaturedImage.hidden = true;
        newsFeaturedImage.removeAttribute('src');
      }
      if (newsFeaturedOpen) newsFeaturedOpen.hidden = true;
      if (newsListEl) {
        newsListEl.innerHTML = '<p class="portal-empty">No news items yet.</p>';
      }
      return;
    }

    const featured = items[0];
    if (newsFeaturedTitle) newsFeaturedTitle.textContent = String(featured.title || 'Update');
    if (newsFeaturedBody) newsFeaturedBody.textContent = truncateText(featured.body || '', 220);
    if (newsFeaturedMeta) {
      const parts = [];
      if (featured.sourceName) parts.push(String(featured.sourceName));
      if (featured.createdAt) parts.push(formatDate(featured.createdAt));
      newsFeaturedMeta.textContent = parts.join(' · ');
    }
    if (newsFeaturedImage) {
      const imageUrl = String(featured.imageUrl || '').trim();
      if (imageUrl) {
        newsFeaturedImage.src = imageUrl;
        newsFeaturedImage.alt = String(featured.title || 'Featured news');
        newsFeaturedImage.hidden = false;
      } else {
        newsFeaturedImage.hidden = true;
        newsFeaturedImage.removeAttribute('src');
      }
    }
    if (newsFeaturedOpen) {
      newsFeaturedOpen.hidden = false;
      newsFeaturedOpen.setAttribute('data-news-id', String(featured.newsId || ''));
    }

    if (!newsListEl) return;
    newsListEl.innerHTML = items.map(function (item) {
      const id = String(item.newsId || '');
      const title = escapeHtml(truncateText(item.title || 'Update', 80));
      const excerpt = escapeHtml(truncateText(item.body || '', 110));
      const meta = escapeHtml(formatDate(item.createdAt));
      const thumb = String(item.imageUrl || '').trim();
      return (
        '<button type="button" class="portal-feed-row" data-open-news="' + escapeHtml(id) + '">' +
          '<div class="portal-feed-copy">' +
            '<strong>' + title + '</strong>' +
            '<span>' + excerpt + '</span>' +
            '<small>' + meta + '</small>' +
          '</div>' +
          (thumb
            ? '<img class="portal-feed-thumb" src="' + escapeHtml(thumb) + '" alt="" loading="lazy">'
            : '<span class="portal-feed-thumb portal-feed-thumb--empty" aria-hidden="true"></span>') +
        '</button>'
      );
    }).join('');
  }

  function renderAnnouncementsPortal(items) {
    if (announcementsLoading) announcementsLoading.hidden = true;
    if (announcementsCountPill) {
      announcementsCountPill.textContent = items.length + (items.length === 1 ? ' notice' : ' notices');
    }
    if (!announcementsListEl) return;

    if (!items.length) {
      announcementsListEl.innerHTML = '<p class="portal-empty">No current announcements.</p>';
      return;
    }

    announcementsListEl.innerHTML = items.map(function (item) {
      const id = String(item.newsId || '');
      const title = escapeHtml(String(item.title || 'Announcement'));
      const excerpt = escapeHtml(truncateText(item.body || '', 140));
      const type = escapeHtml(String(item.announcementType || 'Notice'));
      const meta = escapeHtml(formatDate(item.createdAt));
      const thumb = String(item.imageUrl || '').trim();
      return (
        '<button type="button" class="portal-feed-row portal-feed-row--announce" data-open-announcement="' + escapeHtml(id) + '">' +
          '<div class="portal-feed-copy">' +
            '<span class="portal-feed-badge">' + type + '</span>' +
            '<strong>' + title + '</strong>' +
            '<span>' + excerpt + '</span>' +
            '<small>' + meta + '</small>' +
          '</div>' +
          (thumb
            ? '<img class="portal-feed-thumb" src="' + escapeHtml(thumb) + '" alt="" loading="lazy">'
            : '<span class="portal-feed-thumb portal-feed-thumb--empty" aria-hidden="true"></span>') +
        '</button>'
      );
    }).join('');
  }

  async function ensureNewsLoaded() {
    if (newsLoaded) return newsItems;
    if (newsLoading) {
      newsLoading.hidden = false;
      newsLoading.textContent = 'Loading district news…';
    }
    try {
      const response = await fetch('/firenet/NEWFIRENET/backend/controllers/news.php?action=list&limit=12', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store'
      });
      const payload = await response.json().catch(function () { return null; });
      newsItems = (payload && payload.ok && payload.data && Array.isArray(payload.data.items))
        ? payload.data.items
        : [];
      newsLoaded = true;
      renderNewsPortal(newsItems);
    } catch (error) {
      newsItems = [];
      newsLoaded = true;
      renderNewsPortal([]);
      if (newsLoading) {
        newsLoading.hidden = false;
        newsLoading.textContent = 'Unable to load news right now.';
      }
    }
    return newsItems;
  }

  async function ensureAnnouncementsLoaded() {
    if (announcementsLoaded) return announcementItems;
    if (announcementsLoading) {
      announcementsLoading.hidden = false;
      announcementsLoading.textContent = 'Loading announcements…';
    }
    try {
      const response = await fetch('/firenet/NEWFIRENET/backend/controllers/news.php?action=announcements_list&limit=12', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store'
      });
      const payload = await response.json().catch(function () { return null; });
      announcementItems = (payload && payload.ok && payload.data && Array.isArray(payload.data.items))
        ? payload.data.items
        : [];
      announcementsLoaded = true;
      renderAnnouncementsPortal(announcementItems);
    } catch (error) {
      announcementItems = [];
      announcementsLoaded = true;
      renderAnnouncementsPortal([]);
      if (announcementsLoading) {
        announcementsLoading.hidden = false;
        announcementsLoading.textContent = 'Unable to load announcements right now.';
      }
    }
    return announcementItems;
  }

  viewTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      const view = trigger.getAttribute('data-portal-view') || 'login';
      const isOpsShortcut = trigger.hasAttribute('data-scroll-ops');
      setView(view, {
        skipScroll: isOpsShortcut,
        opsActive: isOpsShortcut
      });
    });
  });

  document.addEventListener('click', function (event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const openNews = target.closest('[data-open-news]');
    if (openNews) {
      event.preventDefault();
      openArticleById(openNews.getAttribute('data-open-news'), 'news');
      return;
    }

    const openAnnouncement = target.closest('[data-open-announcement]');
    if (openAnnouncement) {
      event.preventDefault();
      openArticleById(openAnnouncement.getAttribute('data-open-announcement'), 'announcement');
      return;
    }

    if (target.getAttribute('data-close-portal-article') === 'true') {
      closeArticleModal();
    }
  });

  if (newsFeaturedOpen) {
    newsFeaturedOpen.addEventListener('click', function (event) {
      event.preventDefault();
      const id = newsFeaturedOpen.getAttribute('data-news-id');
      if (id) openArticleById(id, 'news');
    });
  }

  if (closeArticleBtn) {
    closeArticleBtn.addEventListener('click', function (event) {
      event.preventDefault();
      closeArticleModal();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && articleModal && !articleModal.hidden) {
      closeArticleModal();
    }
  });

  // Keep preview cards inside the portal (legacy news.html + soft links)
  document.addEventListener('click', function (event) {
    const link = event.target instanceof Element
      ? event.target.closest('a[href*="news.html"], a[href*="view=news"], a[href*="view=announcements"]')
      : null;
    if (!link) return;
    if (link.hasAttribute('data-open-news') || link.hasAttribute('data-open-announcement')) {
      return; // handled by the open-* listeners above
    }
    const href = String(link.getAttribute('href') || '');
    try {
      const url = new URL(href, window.location.origin);
      const newsId = url.searchParams.get('newsId');
      const viewParam = String(url.searchParams.get('view') || '').toLowerCase();
      event.preventDefault();
      if (viewParam === 'announcements' || href.indexOf('announcement') !== -1 || link.closest('.login-announcement-slot')) {
        setView('announcements', { newsId: newsId || '', keepNewsId: Boolean(newsId) });
      } else {
        setView('news', { newsId: newsId || '', keepNewsId: Boolean(newsId) });
      }
    } catch (error) {
      // ignore bad urls
    }
  });

  const bootParams = new URLSearchParams(window.location.search);
  const bootView = String(bootParams.get('view') || '').toLowerCase();
  const bootNewsId = bootParams.get('newsId');
  setView(VALID_VIEWS.indexOf(bootView) >= 0 ? bootView : 'login', {
    skipHistory: true,
    newsId: bootNewsId || '',
    keepNewsId: Boolean(bootNewsId)
  });
})();
