(function () {
  'use strict';

  const endpoint =
    '/firenet/NEWFIRENET/backend/controllers/news.php?action=announcements_list&limit=4';

  const slotEl = document.querySelector('.login-announcement-slot');
  const announcementsContainer = document.getElementById('loginAnnouncementsContainer');
  const templateEl = document.getElementById('loginAnnouncementCardTemplate');
  const loadingEl = document.getElementById('loginAnnouncementsLoading');

  function safeText(v) {
    return String(v ?? '');
  }

  function truncateText(str, maxChars) {
    const s = String(str ?? '').trim();
    if (!s) return '';
    if (s.length <= maxChars) return s;
    return s.slice(0, Math.max(0, maxChars - 1)).trimEnd() + '…';
  }

  function buildCard(item) {
    const t = templateEl;
    const frag = t.content.cloneNode(true);

    const a = frag.querySelector('a[data-announcement-id]');
    const img = frag.querySelector('img[data-announcement-image]');
    const title = frag.querySelector('[data-announcement-title]');
    const excerpt = frag.querySelector('[data-announcement-excerpt]');
    const meta = frag.querySelector('[data-announcement-meta]');
    const typeBadge = frag.querySelector('[data-announcement-type]');

    const newsId = item?.newsId ? String(item.newsId) : '';
    const titleText = safeText(item?.title || 'Announcement');
    const body = safeText(item?.body || '');
    const excerptText = truncateText(body, 140);

    a.setAttribute('href', '/firenet/NEWFIRENET/pages/login.html?view=announcements&newsId=' + encodeURIComponent(newsId));
    a.setAttribute('data-open-announcement', newsId);
    a.setAttribute('aria-label', 'Open announcement: ' + titleText);

    title.textContent = titleText;
    excerpt.textContent = excerptText;

    const created = item?.createdAt ? new Date(item.createdAt) : null;
    const createdLabel = created && !Number.isNaN(created.getTime())
      ? created.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
      : '';

    const type = safeText(item?.announcementType || '');
    typeBadge.textContent = type ? type.toUpperCase() : 'PUBLIC NOTICE';

    const expiresAt = safeText(item?.expiresAt || '');
    let metaText = '';
    if (createdLabel) metaText += 'Published: ' + createdLabel;
    if (expiresAt) {
      const exp = new Date(expiresAt);
      if (!Number.isNaN(exp.getTime())) {
        metaText += metaText ? ' • Expires: ' + exp.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : 'Expires: ' + exp.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
      }
    }
    meta.textContent = metaText;

    const imageUrl = safeText(item?.imageUrl || '');
    if (imageUrl) {
      img.src = imageUrl;
      img.alt = titleText + ' image';
      img.style.display = 'block';
    } else {
      img.style.display = 'none';
    }

    return frag;
  }

  async function loadAnnouncements() {
    try {
      if (!announcementsContainer || !templateEl) return;

      if (loadingEl) loadingEl.hidden = false;
      announcementsContainer.innerHTML = '';

      const res = await fetch(endpoint, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store'
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch (e) {
        payload = null;
      }

      if (!res.ok || !payload || payload.ok !== true) {
        const msg = (payload && payload.message) ? payload.message : 'Unable to load announcements.';
        throw new Error(msg);
      }

      const items = (payload.data && Array.isArray(payload.data.items)) ? payload.data.items : [];
      if (!items.length) {
        if (loadingEl) {
          loadingEl.textContent = 'No current announcements.';
          loadingEl.hidden = false;
        }
        return;
      }

      items.forEach(function (item) {
        announcementsContainer.appendChild(buildCard(item));
      });

      if (loadingEl) loadingEl.hidden = true;
    } catch (err) {
      if (loadingEl) {
        loadingEl.textContent = 'Announcements unavailable.';
        loadingEl.hidden = false;
      }
      // do not throw further; login should still work
      if (slotEl) slotEl.dataset.announcementsError = safeText(err?.message || err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAnnouncements);
  } else {
    loadAnnouncements();
  }
})();
