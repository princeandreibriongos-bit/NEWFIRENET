/* FireNet portal FX controller — loader, scroll reveal, ripple, nav progress, back-to-top, toasts */
(function () {
  'use strict';

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    reduceMotion = false;
  }

  /* ── 1. Branded loading screen ───────────────────────── */
  (function initLoader() {
    var loader = document.getElementById('fnLoader');
    if (!loader) return;

    var statusEl = loader.querySelector('.fn-loader-status');
    var messages = [
      'Establishing secure dispatch link…',
      'Syncing station roster…',
      'Loading incident intelligence…',
      'Warming up the command deck…'
    ];
    if (loader.dataset && loader.dataset.messages) {
      var custom = loader.dataset.messages.split('|').map(function (m) { return m.trim(); }).filter(Boolean);
      if (custom.length) messages = custom;
    }
    var msgIndex = 0;
    var msgTimer = null;

    if (statusEl && !reduceMotion) {
      statusEl.textContent = messages[0];
      msgTimer = window.setInterval(function () {
        msgIndex = (msgIndex + 1) % messages.length;
        statusEl.classList.add('is-swapping');
        window.setTimeout(function () {
          statusEl.textContent = messages[msgIndex];
          statusEl.classList.remove('is-swapping');
        }, 300);
      }, 1100);
    }

    var start = Date.now();
    var minVisible = reduceMotion ? 0 : 650;
    var hidden = false;

    function hideLoader() {
      if (hidden) return;
      hidden = true;
      var elapsed = Date.now() - start;
      var wait = Math.max(0, minVisible - elapsed);
      window.setTimeout(function () {
        if (msgTimer) window.clearInterval(msgTimer);
        loader.classList.add('is-hiding');
        window.setTimeout(function () {
          loader.classList.add('is-removed');
        }, 600);
      }, wait);
    }

    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader);
    }
    // Safety net: never trap the user behind the loader.
    window.setTimeout(hideLoader, 6000);
  })();

  /* ── 2. Top navigation progress bar ──────────────────── */
  (function initNavProgress() {
    var bar = document.getElementById('fnNavbar');
    if (!bar) return;
    var timer = null;
    var width = 0;

    function begin() {
      if (reduceMotion) return;
      window.clearInterval(timer);
      width = 8;
      bar.classList.add('is-active');
      bar.style.width = width + '%';
      timer = window.setInterval(function () {
        width += (90 - width) * 0.12;
        bar.style.width = width + '%';
      }, 180);
    }

    document.addEventListener('click', function (event) {
      var link = event.target && event.target.closest ? event.target.closest('a') : null;
      if (!link) return;
      var href = link.getAttribute('href') || '';
      var target = link.getAttribute('target');
      if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
      if (target === '_blank' || link.hasAttribute('download')) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      // Only same-origin navigations.
      try {
        var url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.hash) return;
      } catch (e) { return; }
      begin();
    }, true);

    window.addEventListener('pagehide', function () {
      window.clearInterval(timer);
      bar.style.width = '100%';
    });
    window.addEventListener('beforeunload', function () {
      window.clearInterval(timer);
      bar.style.width = '100%';
    });
  })();

  /* ── 3. Scroll reveal (safe: content shows even if JS/observer fails) ── */
  (function initReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    function run() {
      var selectors = [
        '.portal-card', '.dash-kpi-card', '.dash-panel', '.dash-summary-card',
        '.ana-panel', '.ana-stat-card', '.reports-panel', '.reports-stat-card',
        '.settings-section-card', '.users-table-card', '.users-filter-card',
        '.mail-hub-card', '.mail-stat-card', '.cal-panel', '.logs-panel',
        '.audit-panel', '.settings-tip-card'
      ];
      var nodes = [];
      selectors.forEach(function (sel) {
        var found = document.querySelectorAll('.app-main ' + sel);
        for (var i = 0; i < found.length; i++) {
          if (nodes.indexOf(found[i]) === -1) nodes.push(found[i]);
        }
      });
      if (!nodes.length) return;

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('fx-in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

      nodes.forEach(function (node, i) {
        // Skip elements already scrolled into view at load for snappier feel.
        var rect = node.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          node.classList.add('fx-reveal');
          node.style.transitionDelay = Math.min(i * 45, 260) + 'ms';
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { node.classList.add('fx-in'); });
          });
          return;
        }
        node.classList.add('fx-reveal');
        node.style.transitionDelay = '0ms';
        observer.observe(node);
      });

      // Absolute safety net: reveal everything after 2.2s no matter what.
      window.setTimeout(function () {
        nodes.forEach(function (node) { node.classList.add('fx-in'); });
      }, 2200);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  })();

  /* ── 4. Ripple effect on buttons/pills ───────────────── */
  (function initRipple() {
    if (reduceMotion) return;
    var selector = '.primary-btn, .secondary-btn, .quick-action-btn, .ribbon-pill, .apps-tile, .sidebar-link, .fn-to-top';
    document.addEventListener('click', function (event) {
      var host = event.target && event.target.closest ? event.target.closest(selector) : null;
      if (!host) return;
      var rect = host.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var ripple = document.createElement('span');
      ripple.className = 'fx-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
      var priorPosition = window.getComputedStyle(host).position;
      if (priorPosition === 'static') host.classList.add('fx-ripple-host');
      else host.style.overflow = host.style.overflow || 'hidden';
      host.appendChild(ripple);
      window.setTimeout(function () {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      }, 650);
    });
  })();

  /* ── 5. Back-to-top button ───────────────────────────── */
  (function initBackToTop() {
    var scroller = document.querySelector('.app-main');
    var btn = document.getElementById('fnToTop');
    if (!btn) return;
    var watch = scroller && scroller.scrollHeight > scroller.clientHeight ? scroller : window;

    function currentScroll() {
      return watch === window ? (window.scrollY || document.documentElement.scrollTop) : watch.scrollTop;
    }

    function onScroll() {
      btn.classList.toggle('is-visible', currentScroll() > 320);
    }

    (watch === window ? window : watch).addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    btn.addEventListener('click', function () {
      if (watch === window) {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      } else {
        watch.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  })();

  /* ── 6. Toast helper (available app-wide) ────────────── */
  (function initToasts() {
    var stack = document.getElementById('fnToastStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'fn-toast-stack';
      stack.id = 'fnToastStack';
      document.body.appendChild(stack);
    }

    var icons = { success: 'bi-check-circle-fill', error: 'bi-exclamation-octagon-fill', info: 'bi-info-circle-fill' };

    window.FireNetToast = function (message, options) {
      options = options || {};
      var type = options.type || 'info';
      var title = options.title || (type === 'success' ? 'Success' : type === 'error' ? 'Something went wrong' : 'Heads up');
      var toast = document.createElement('div');
      toast.className = 'fn-toast fn-toast--' + type;
      toast.innerHTML = '<i class="bi ' + (icons[type] || icons.info) + '" aria-hidden="true"></i>'
        + '<div class="fn-toast-body"><strong></strong><span></span></div>';
      toast.querySelector('strong').textContent = title;
      toast.querySelector('span').textContent = message || '';
      stack.appendChild(toast);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { toast.classList.add('is-in'); });
      });
      var life = options.duration || 4200;
      window.setTimeout(function () {
        toast.classList.remove('is-in');
        window.setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 450);
      }, life);
    };
  })();
})();
