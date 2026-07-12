(function () {
  'use strict';

  const moduleEl = document.getElementById('loginNewsModule');
  const gridEl = document.getElementById('loginNewsGrid');
  const pulseEl = document.getElementById('loginNewsPulse');
  const loadingEl = document.getElementById('loginNewsLoading');
  const tplEl = document.getElementById('loginNewsCardTemplate');

  if (!moduleEl || !gridEl || !loadingEl || !tplEl) {
    return;
  }

  const NEWS_LIST_ENDPOINT = '/firenet/NEWFIRENET/backend/controllers/news.php?action=list&limit=5';
  const ROTATION_INTERVAL_MS = 5000;

  let activeItems = [];
  let rotationIndex = 0;
  let rotationTimer = null;

  function setLoading(isLoading) {
    loadingEl.hidden = !isLoading;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '<',
      '>': '>',
      '"': '"',
      "'": '&#039;'
    }[ch]));
  }

  function truncateText(str, maxChars) {
    const s = String(str ?? '').trim();
    if (!s) return '';
    if (s.length <= maxChars) return s;
    return s.slice(0, Math.max(0, maxChars - 1)).trimEnd() + '…';
  }

  function getRotatedItems(items, offset) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const normalizedOffset = offset % items.length;
    return items.slice(normalizedOffset).concat(items.slice(0, normalizedOffset));
  }

  function scheduleRotation() {
    if (rotationTimer) {
      window.clearInterval(rotationTimer);
      rotationTimer = null;
    }

    if (!Array.isArray(activeItems) || activeItems.length < 2) {
      return;
    }

    rotationTimer = window.setInterval(() => {
      rotationIndex = (rotationIndex + 1) % activeItems.length;
      gridEl.style.opacity = '0';

      window.setTimeout(() => {
        renderCards(getRotatedItems(activeItems, rotationIndex));
        gridEl.style.opacity = '1';
      }, 180);
    }, ROTATION_INTERVAL_MS);
  }

  function showFallback() {
    if (pulseEl) pulseEl.hidden = true;
    setLoading(false);
    activeItems = [];

    if (rotationTimer) {
      window.clearInterval(rotationTimer);
      rotationTimer = null;
    }

    gridEl.innerHTML = `
      <div class="login-news-empty">
        <div class="login-news-empty-title">No recent updates</div>
        <div class="login-news-empty-body">News will appear here when administrators publish updates.</div>
      </div>
    `;
  }

  function renderCards(items) {
    gridEl.innerHTML = '';

    if (!Array.isArray(items) || items.length === 0) {
      showFallback();
      return;
    }

    const cardSizes = ['is-featured', 'is-tall', 'is-tall', 'is-wide', 'is-compact'];

    items.forEach((item, index) => {
      const newsId = item && item.newsId ? String(item.newsId) : '';
      const articleUrl = String(item?.articleUrl || '').trim();
      const title = truncateText(item?.title || '', 60);
      const bodyPreview = truncateText(item?.body || '', index === 0 ? 140 : 96);
      const imageUrl = String(item?.imageUrl || '').trim();
      const createdAt = item?.createdAt ? String(item.createdAt) : '';
      const sourceName = String(item?.sourceName || '').trim();

      const tpl = tplEl.content.cloneNode(true);
      const a = tpl.querySelector('a.login-news-card');
      const img = tpl.querySelector('img.login-news-card-image');
      const titleEl = tpl.querySelector('.login-news-card-title');
      const bodyEl = tpl.querySelector('.login-news-card-body');
      const metaEl = tpl.querySelector('.login-news-card-meta');

      a.classList.add(cardSizes[index] || 'is-compact');

      if (articleUrl) {
        a.setAttribute('href', articleUrl);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      } else if (newsId) {
        a.setAttribute('href', '/firenet/NEWFIRENET/pages/login.html?view=news&newsId=' + encodeURIComponent(newsId));
        a.setAttribute('data-news-id', newsId);
        a.setAttribute('data-open-news', newsId);
      } else {
        a.setAttribute('href', '#');
      }

      titleEl.textContent = title || 'Breaking Update';
      bodyEl.textContent = bodyPreview || 'Details will be provided soon.';

      if (imageUrl) {
        img.src = imageUrl;
        img.alt = titleEl.textContent + ' image';
        img.hidden = false;
      } else {
        img.hidden = true;
      }

      const parts = [];
      if (sourceName) parts.push(sourceName);
      if (createdAt) parts.push(new Date(createdAt).toLocaleDateString());
      metaEl.textContent = parts.join(' • ');
      gridEl.appendChild(tpl);
    });
  }

  async function bootstrap() {
    setLoading(true);
    try {
      const response = await fetch(NEWS_LIST_ENDPOINT, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store'
      });

      const payload = await (async function () {
        try {
          return await response.json();
        } catch (e) {
          return null;
        }
      })();

      if (!response.ok || !payload || payload.ok !== true || !payload.data || !Array.isArray(payload.data.items)) {
        showFallback();
        return;
      }

      const items = payload.data.items;
      activeItems = Array.isArray(items) ? items.slice() : [];
      rotationIndex = 0;
      setLoading(false);
      if (pulseEl) pulseEl.hidden = false;

      gridEl.style.transition = 'opacity 180ms ease';
      gridEl.style.opacity = '1';

      renderCards(getRotatedItems(activeItems, rotationIndex));
      scheduleRotation();
    } catch (e) {
      showFallback();
    }
  }

  bootstrap();
})();
