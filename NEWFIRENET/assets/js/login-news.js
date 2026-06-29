(function () {
  const asideNews = document.getElementById('loginNewsModule');
  const newsImg = document.getElementById('loginNewsImage');
  const newsTitle = document.getElementById('loginNewsTitle');
  const newsBody = document.getElementById('loginNewsBody');
  const newsPulse = document.getElementById('loginNewsPulse');
  const newsLoading = document.getElementById('loginNewsLoading');

  if (!asideNews || !newsImg || !newsTitle || !newsBody) {
    return;
  }

  const NEWS_LIST_ENDPOINT = '/firenet/NEWFIRENET/backend/controllers/news.php?action=list&limit=5';
  const ROTATE_MS = 5000;

  let items = [];
  let index = 0;
  let timer = null;

  function setLoading(isLoading) {
    if (newsLoading) {
      newsLoading.hidden = !isLoading;
    }
  }

  function showFallback() {
    if (newsPulse) newsPulse.hidden = true;
    setLoading(false);

    newsImg.hidden = true;
    newsTitle.textContent = 'No recent updates';
    newsBody.textContent = 'News will appear here when administrators publish updates.';
  }

  function renderItem(item) {
    if (!item) return;

    const title = String(item.title || '').trim();
    const body = String(item.body || '').trim();
    const imageUrl = String(item.imageUrl || '').trim();

    newsTitle.textContent = title || 'Breaking Update';
    newsBody.textContent = body || 'Details will be provided soon.';

    if (imageUrl) {
      newsImg.src = imageUrl;
      newsImg.hidden = false;
    } else {
      newsImg.hidden = true;
    }
  }

  function next() {
    if (!items.length) return;
    index = (index + 1) % items.length;
    renderItem(items[index]);
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

      items = payload.data.items;

      if (!items.length) {
        showFallback();
        return;
      }

      setLoading(false);
      index = 0;
      renderItem(items[index]);

      if (newsPulse) {
        newsPulse.hidden = false;
      }

      if (timer) window.clearInterval(timer);
      timer = window.setInterval(next, ROTATE_MS);
    } catch (e) {
      showFallback();
    }
  }

  bootstrap();

  // Safety: clear timer when navigating away within SPA-ish flows
  window.addEventListener('pagehide', function () {
    if (timer) window.clearInterval(timer);
    timer = null;
  });
})();
