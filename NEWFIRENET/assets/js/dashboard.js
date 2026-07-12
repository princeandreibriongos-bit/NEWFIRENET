(function () {
  'use strict';

  const REPORTS_URL = '/firenet/NEWFIRENET/backend/pages/reports.php';

  let context = {};

  try {
    const contextElement = document.getElementById('dashboardContext');
    if (contextElement) {
      context = JSON.parse(contextElement.textContent || '{}');
    }
  } catch (error) {
    console.warn('Could not parse dashboard context:', error);
    context = {};
  }

  function getReportIncidentUrl() {
    return String(context.reportIncidentUrl || (REPORTS_URL + '?quick=intake'));
  }

  let charts = {};

  const elements = {
    panelRoleTitle: document.getElementById('headerRoleChip'),
    panelStationName: document.getElementById('headerStationName'),
    dashStationHint: document.getElementById('dashStationHint'),
    dashSearchField: document.getElementById('dashSearchField'),
    dashSearchPanel: document.getElementById('dashSearchPanel'),
    dashSearchResults: document.getElementById('dashSearchResults'),
    dashSearchClearBtn: document.getElementById('dashSearchClearBtn'),
    dashHeroStationName: document.getElementById('dashHeroStationName'),
    dashHeroRoleChip: document.getElementById('dashHeroRoleChip'),
    dashHeroStatusChip: document.getElementById('dashHeroStatusChip'),
    dashHeroUpdatedChip: document.getElementById('dashHeroUpdatedChip'),
    heroOpenCount: document.getElementById('heroOpenCount'),
    heroResolutionRate: document.getElementById('heroResolutionRate'),
    heroStationCoverage: document.getElementById('heroStationCoverage'),
    heroOfflineCount: document.getElementById('heroOfflineCount'),
    openIncidentsCount: document.getElementById('openIncidentsCount'),
    openIncidentsSummary: document.getElementById('openIncidentsSummary'),
    completedIncidentCount: document.getElementById('completedIncidentCount'),
    totalIncidentCount: document.getElementById('totalIncidentCount'),
    readinessScore: document.getElementById('readinessScore'),
    stationStatusSummary: document.getElementById('stationStatusSummary'),
    stationStatusList: document.getElementById('stationStatusList'),
    ongoingIncidentTitle: document.getElementById('ongoingIncidentTitle'),
    ongoingIncidentMeta: document.getElementById('ongoingIncidentMeta'),
    kpiDeltaActive: document.getElementById('kpiDeltaActive'),
    kpiDeltaCompleted: document.getElementById('kpiDeltaCompleted'),
    kpiDeltaReadiness: document.getElementById('kpiDeltaReadiness'),
    dashOpsBigNumber: document.getElementById('dashOpsBigNumber'),
    dashOpsCaption: document.getElementById('dashOpsCaption'),
    dashOpsMiniList: document.getElementById('dashOpsMiniList'),
    dashLoadBalanceSummary: document.getElementById('dashLoadBalanceSummary'),
    dashLoadBalanceLead: document.getElementById('dashLoadBalanceLead'),
    dashLoadBalanceMeta: document.getElementById('dashLoadBalanceMeta'),
    dashLoadBalanceList: document.getElementById('dashLoadBalanceList'),
    dashNewsFeed: document.getElementById('dashNewsFeed'),
    darkReadiness: document.getElementById('darkReadiness'),
    darkOpen: document.getElementById('darkOpen'),
    darkResolution: document.getElementById('darkResolution'),
    sparkActiveIncidents: document.getElementById('sparkActiveIncidents'),
    sparkCompleted: document.getElementById('sparkCompleted'),
    sparkReadiness: document.getElementById('sparkReadiness'),
    incidentTrendChart: document.getElementById('incidentTrendChart'),
    weeklyBarChart: document.getElementById('weeklyBarChart'),
    stationHealthChart: document.getElementById('stationHealthChart')
  };

  const SEARCH_TYPES = {
    report: { badge: 'Report', icon: 'R' },
    incident: { badge: 'Incident', icon: '!' },
    event: { badge: 'Event', icon: 'E' },
    page: { badge: 'Page', icon: '↗' },
    station: { badge: 'Station', icon: 'S' },
    info: { badge: 'Info', icon: 'i' }
  };

  let searchState = {
    items: [],
    visibleItems: [],
    query: '',
    activeIndex: 0
  };

  function escapeHtml(value) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(value).replace(/[&<>"']/g, (char) => map[char]);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeSearchText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenizeSearchText(value) {
    const normalized = normalizeSearchText(value);
    if (!normalized) {
      return [];
    }

    const stopWords = new Set(['the', 'and', 'for', 'to', 'of', 'a', 'an', 'in', 'on', 'at', 'with', 'by', 'from']);
    return normalized
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token && !stopWords.has(token));
  }

  function uniqueTokens(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function buildSearchItem(options) {
    const type = String(options.type || 'page');
    const meta = SEARCH_TYPES[type] || SEARCH_TYPES.page;
    return {
      id: String(options.id || options.title || Math.random()),
      type,
      title: String(options.title || ''),
      subtitle: String(options.subtitle || ''),
      url: String(options.url || REPORTS_URL),
      keywords: uniqueTokens((Array.isArray(options.keywords) ? options.keywords : []).map(normalizeSearchText)),
      weight: Number(options.weight || 0),
      urgent: Boolean(options.urgent),
      badge: String(options.badge || meta.badge),
      icon: String(options.icon || meta.icon),
      hint: String(options.hint || '')
    };
  }

  function buildSearchIndex() {
    const items = [];
    const openCount = Number(context.openIncidentCount || 0);
    const completedCount = Number(context.completedIncidentCount || 0);
    const totalCount = Number(context.totalIncidentCount || 0);
    const recentNews = Array.isArray(context.recentNews) ? context.recentNews : [];
    const stations = Array.isArray(context.stationStatuses) ? context.stationStatuses : [];
    const latestIncident = String(context.ongoingIncidentTitle || '').replace(/^No active incidents\.?$/i, '').trim();
    const latestMeta = String(context.ongoingIncidentMeta || '').trim();

    if (context.canCreateIncidentReports) {
      items.push(buildSearchItem({
        id: 'report-incident-quick',
        type: 'report',
        title: 'Report incident',
        subtitle: 'Start call intake immediately — opens the incident form.',
        url: getReportIncidentUrl(),
        keywords: ['report', 'incident', 'fire', 'alarm', 'dispatch', 'intake', 'emergency', 'quick report'],
        weight: 110,
        urgent: true,
        hint: 'Fastest way to file an incident'
      }));
    }

    items.push(buildSearchItem({
      id: 'reports-overview',
      type: 'report',
      title: 'Reports',
      subtitle: 'Open incident reports and equipment reports.',
      url: REPORTS_URL,
      keywords: ['reports', 'report', 'incident report', 'equipment report', 'submit report'],
      weight: 100,
      hint: 'Useful for report creation and history'
    }));

    items.push(buildSearchItem({
      id: 'calendar-events',
      type: 'event',
      title: 'Calendar / Events',
      subtitle: 'View schedules, events, and assigned dates.',
      url: '/firenet/NEWFIRENET/backend/pages/calendar.php',
      keywords: ['calendar', 'event', 'events', 'schedule', 'schedules', 'meeting'],
      weight: 92,
      hint: 'Useful for events and scheduling'
    }));

    items.push(buildSearchItem({
      id: 'analytics',
      type: 'page',
      title: 'Analytics',
      subtitle: 'Station map, hydrants, incident heat, and metrics.',
      url: '/firenet/NEWFIRENET/backend/pages/analytics.php',
      keywords: ['analytics', 'map', 'station', 'hydrant', 'heatmap', 'statistics'],
      weight: 88,
      hint: 'Useful for map and station overview'
    }));

    items.push(buildSearchItem({
      id: 'settings',
      type: 'page',
      title: 'Settings',
      subtitle: 'Profile, preferences, and security controls.',
      url: '/firenet/NEWFIRENET/backend/pages/settings.php',
      keywords: ['settings', 'security', 'preferences', 'profile', 'password'],
      weight: 80,
      hint: 'Useful for account settings'
    }));

    items.push(buildSearchItem({
      id: 'users',
      type: 'page',
      title: 'Admin Settings',
      subtitle: 'Manage user accounts, news, notices, and admin tools.',
      url: '/firenet/NEWFIRENET/backend/pages/admin_settings.php',
      keywords: ['users', 'admin settings', 'admin', 'superadmin', 'accounts', 'login news', 'public notices', 'audit log', 'station access'],
      weight: 78,
      hint: 'Useful for account management'
    }));

    items.push(buildSearchItem({
      id: 'audit-log',
      type: 'page',
      title: 'Audit Log',
      subtitle: 'Review user actions, reports, calendar changes, and request workflow history.',
      url: '/firenet/NEWFIRENET/backend/pages/audit_log.php',
      keywords: ['audit', 'audit log', 'activity', 'history', 'reports', 'calendar', 'accepted request', 'rejected request'],
      weight: 77,
      hint: 'Useful for activity review'
    }));

    items.push(buildSearchItem({
      id: 'current-station-summary',
      type: 'station',
      title: String(context.stationName || 'Current station'),
      subtitle: `${openCount} open incident(s), ${completedCount} completed, ${totalCount} total for this station.`,
      url: '/firenet/NEWFIRENET/backend/pages/analytics.php',
      keywords: [String(context.stationName || ''), 'station', 'current station', 'dispatch'],
      weight: 85,
      hint: 'Useful station snapshot'
    }));

    if (openCount > 0) {
      items.push(buildSearchItem({
        id: 'open-incidents-summary',
        type: 'incident',
        title: 'Open Incidents',
        subtitle: context.openIncidentSummary || `${openCount} active incident(s) requiring attention.`,
        url: REPORTS_URL,
        keywords: ['open incident', 'active incident', 'responding', 'fire out', 'alarm'],
        weight: 97,
        urgent: true,
        hint: 'High priority result'
      }));
    }

    if (latestIncident) {
      items.push(buildSearchItem({
        id: 'latest-incident',
        type: 'incident',
        title: latestIncident,
        subtitle: latestMeta || 'Latest incident update',
        url: REPORTS_URL,
        keywords: uniqueTokens([latestIncident, latestMeta, 'incident', 'alarm', 'fire', 'response']),
        weight: 93,
        urgent: true,
        hint: 'Latest open incident'
      }));
    }

    stations.forEach((station, index) => {
      const stationName = String(station.stationName || '').trim();
      if (!stationName) {
        return;
      }
      const statusCode = String(station.statusCode || 'standby').toLowerCase();
      const statusLabel = statusCode === 'responding' ? 'Responding' : statusCode === 'offline' ? 'Offline' : 'Standby';
      const activeCount = Number(station.activeAssignmentCount || 0);
      items.push(buildSearchItem({
        id: `station-${station.stationId || index}`,
        type: 'station',
        title: stationName,
        subtitle: `${statusLabel}${activeCount > 0 ? ` · ${activeCount} active assignment(s)` : ''}`,
        url: '/firenet/NEWFIRENET/backend/pages/analytics.php',
        keywords: [stationName, statusLabel, statusCode, 'station', 'dispatch', 'map'],
        weight: 70,
        hint: 'Station status'
      }));
    });

    recentNews.forEach((item, index) => {
      const text = String(item || '').trim();
      if (!text) {
        return;
      }
      items.push(buildSearchItem({
        id: `briefing-${index}`,
        type: 'info',
        title: 'Briefing item',
        subtitle: text,
        url: '/firenet/NEWFIRENET/backend/pages/dashboard.php',
        keywords: tokenizeSearchText(text),
        weight: 44,
        hint: 'Current briefing'
      }));
    });

    return items;
  }

  function scoreSearchItem(item, query, terms) {
    const normalizedQuery = normalizeSearchText(query);
    const title = normalizeSearchText(item.title);
    const subtitle = normalizeSearchText(item.subtitle);
    const keywords = Array.isArray(item.keywords) ? item.keywords : [];
    let score = Number(item.weight || 0);

    if (!normalizedQuery) {
      return score;
    }

    if (title === normalizedQuery) {
      score += 250;
    } else if (title.startsWith(normalizedQuery)) {
      score += 160;
    } else if (title.includes(normalizedQuery)) {
      score += 120;
    }

    if (subtitle.includes(normalizedQuery)) {
      score += 45;
    }

    if (keywords.some((keyword) => keyword.includes(normalizedQuery))) {
      score += 60;
    }

    terms.forEach((term) => {
      if (!term) {
        return;
      }
      if (title.includes(term)) {
        score += 24;
      }
      if (subtitle.includes(term)) {
        score += 10;
      }
      if (keywords.some((keyword) => keyword.includes(term) || term.includes(keyword))) {
        score += 18;
      }
    });

    const queryTerms = new Set(terms);
    if (queryTerms.has('incident') || queryTerms.has('incidents') || queryTerms.has('alarm')) {
      if (item.type === 'incident') {
        score += 30;
      }
    }
    if (queryTerms.has('report') || queryTerms.has('reports')) {
      if (item.type === 'report') {
        score += 30;
      }
    }
    if (queryTerms.has('event') || queryTerms.has('events') || queryTerms.has('calendar')) {
      if (item.type === 'event') {
        score += 30;
      }
    }
    if (queryTerms.has('settings') || queryTerms.has('security') || queryTerms.has('profile')) {
      if (item.id === 'settings') {
        score += 20;
      }
    }
    if (queryTerms.has('users') || queryTerms.has('admin') || queryTerms.has('accounts')) {
      if (item.id === 'users') {
        score += 20;
      }
    }

    if (!normalizedQuery) {
      score += item.urgent ? 50 : 0;
    }

    return score;
  }

  function getSearchResults(query) {
    const terms = tokenizeSearchText(query);
    const normalizedQuery = normalizeSearchText(query);
    const items = searchState.items.length ? searchState.items : buildSearchIndex();

    const ranked = items
      .map((item) => {
        const score = scoreSearchItem(item, normalizedQuery, terms);
        return Object.assign({}, item, { score });
      })
      .filter((item) => {
        if (!normalizedQuery) {
          return item.score >= 60;
        }
        return item.score >= 85;
      })
      .sort((a, b) => b.score - a.score || b.weight - a.weight || a.title.localeCompare(b.title));

    return ranked.slice(0, 8);
  }

  function closeSearchPanel() {
    if (elements.dashSearchPanel) {
      elements.dashSearchPanel.hidden = true;
    }
    searchState.activeIndex = 0;
  }

  function openSearchPanel() {
    if (elements.dashSearchPanel) {
      elements.dashSearchPanel.hidden = false;
    }
  }

  function renderSearchResults(query) {
    if (!elements.dashSearchResults) {
      return;
    }

    searchState.visibleItems = getSearchResults(query);
    searchState.query = String(query || '');
    searchState.activeIndex = clamp(searchState.activeIndex, 0, Math.max(0, searchState.visibleItems.length - 1));

    if (searchState.visibleItems.length === 0) {
      elements.dashSearchResults.innerHTML = '<li class="dash-search-empty">No useful matches. Try reports, incidents, events, logs, analytics, settings, or users.</li>';
      openSearchPanel();
      return;
    }

    elements.dashSearchResults.innerHTML = searchState.visibleItems
      .map((item, index) => {
        const activeClass = index === searchState.activeIndex ? ' is-active' : '';
        return `
          <li>
            <button type="button" class="dash-search-result${activeClass}" data-search-index="${index}" data-search-url="${escapeHtml(item.url)}">
              <span class="dash-search-result-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
              <span class="dash-search-result-main">
                <span class="dash-search-result-title">${escapeHtml(item.title)}</span>
                <span class="dash-search-result-subtitle">${escapeHtml(item.subtitle)}</span>
              </span>
              <span class="dash-search-result-meta">
                <span class="dash-search-result-badge">${escapeHtml(item.badge)}</span>
              </span>
            </button>
          </li>`;
      })
      .join('');

    openSearchPanel();
  }

  function navigateSearchResult(index) {
    const item = searchState.visibleItems[index];
    if (!item || !item.url) {
      return;
    }
    window.location.href = item.url;
  }

  function getTrendArrays() {
    const labels = Array.isArray(context.dailyIncidentLabels) ? context.dailyIncidentLabels : [];
    const counts = Array.isArray(context.dailyIncidentCounts) ? context.dailyIncidentCounts : [];
    const n = Math.min(labels.length, counts.length, 7);
    const L = labels.slice(-n);
    const C = counts.slice(-n).map((v) => Number(v) || 0);
    return { labels: L, counts: C };
  }

  function renderHeader() {
    const name = String(context.stationName || 'Your station');
    if (elements.panelStationName) {
      elements.panelStationName.textContent = name;
    }
    if (elements.panelRoleTitle && context.roleTitle) {
      elements.panelRoleTitle.textContent = String(context.roleTitle || context.role || 'User');
    }
    if (elements.dashStationHint) {
      elements.dashStationHint.textContent = name;
    }

    if (elements.dashHeroStationName) {
      elements.dashHeroStationName.textContent = name;
    }
    if (elements.dashHeroRoleChip) {
      elements.dashHeroRoleChip.textContent = String(context.roleTitle || context.role || 'User');
    }
    if (elements.dashHeroUpdatedChip) {
      const now = new Date();
      elements.dashHeroUpdatedChip.textContent = 'Updated ' + now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    if (elements.dashHeroStatusChip) {
      elements.dashHeroStatusChip.textContent = Number(context.openIncidentCount || 0) > 0 ? 'Attention required' : 'System stable';
    }
  }

  function setDelta(el, direction, label) {
    if (!el) {
      return;
    }
    el.textContent = label;
    el.classList.remove('dash-kpi-delta--up', 'dash-kpi-delta--down', 'dash-kpi-delta--neutral');
    el.classList.add('dash-kpi-delta--' + direction);
  }

  function renderMetrics() {
    const openCount = Number(context.openIncidentCount || 0);
    const completedCount = Number(context.completedIncidentCount || 0);
    const totalCount = Number(context.totalIncidentCount || 0);
    const stationCount = Array.isArray(context.stationStatuses) ? context.stationStatuses.length : 0;
    const offlineCount = Array.isArray(context.stationStatuses)
      ? context.stationStatuses.filter((s) => String(s.statusCode || '').toLowerCase() === 'offline').length
      : 0;
    const { counts } = getTrendArrays();
    const completedRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (elements.openIncidentsCount) {
      elements.openIncidentsCount.textContent = String(openCount);
    }
    if (elements.openIncidentsSummary) {
      elements.openIncidentsSummary.textContent = String(context.openIncidentSummary || 'No active incidents');
    }
    if (elements.completedIncidentCount) {
      elements.completedIncidentCount.textContent = String(completedCount);
    }
    if (elements.totalIncidentCount) {
      elements.totalIncidentCount.textContent = String(totalCount);
    }

    if (elements.heroOpenCount) {
      elements.heroOpenCount.textContent = String(openCount);
    }
    if (elements.heroResolutionRate) {
      elements.heroResolutionRate.textContent = completedRate + '%';
    }
    if (elements.heroStationCoverage) {
      const coverage = stationCount > 0 ? Math.round(((stationCount - offlineCount) / stationCount) * 100) : 0;
      elements.heroStationCoverage.textContent = coverage + '%';
    }
    if (elements.heroOfflineCount) {
      elements.heroOfflineCount.textContent = String(offlineCount);
    }
    const rawScore = 100 - openCount * 4 - offlineCount * 12;
    const score = clamp(rawScore, 18, 100);

    if (elements.readinessScore) {
      elements.readinessScore.textContent = score + '%';
    }
    const readinessCard = document.querySelector('.dash-kpi-card--readiness');
    if (readinessCard) {
      const bar = readinessCard.querySelector('.dash-kpi-bar-fill');
      if (bar) {
        bar.style.width = score + '%';
      }
    }

    if (counts.length >= 2) {
      const last = counts[counts.length - 1];
      const prev = counts[counts.length - 2];
      if (last > prev) {
        setDelta(elements.kpiDeltaActive, 'up', '▲');
      } else if (last < prev) {
        setDelta(elements.kpiDeltaActive, 'down', '▼');
      } else {
        setDelta(elements.kpiDeltaActive, 'neutral', '—');
      }
    } else {
      setDelta(elements.kpiDeltaActive, 'neutral', '—');
    }

    if (totalCount > 0 && completedCount >= totalCount * 0.5) {
      setDelta(elements.kpiDeltaCompleted, 'up', '▲');
    } else if (totalCount > 0) {
      setDelta(elements.kpiDeltaCompleted, 'neutral', '—');
    } else {
      setDelta(elements.kpiDeltaCompleted, 'neutral', '—');
    }

    setDelta(elements.kpiDeltaReadiness, score >= 80 ? 'up' : score >= 50 ? 'neutral' : 'down', score >= 80 ? '▲' : score >= 50 ? '—' : '▼');

    if (elements.dashOpsBigNumber) {
      elements.dashOpsBigNumber.textContent = String(openCount);
    }
    if (elements.dashOpsCaption) {
      elements.dashOpsCaption.textContent = openCount > 0 ? 'Open incidents requiring attention' : 'Monitoring is steady';
    }
    if (elements.dashOpsMiniList) {
      const stations = Array.isArray(context.stationStatuses) ? context.stationStatuses : [];
      const responding = stations.filter((s) => String(s.statusCode || '').toLowerCase() === 'responding').length;
      const standby = stations.filter((s) => String(s.statusCode || '').toLowerCase() === 'standby').length;
      const offline = stations.filter((s) => String(s.statusCode || '').toLowerCase() === 'offline').length;
      elements.dashOpsMiniList.innerHTML = [
        `<li><span>Responding</span><span>${responding}</span></li>`,
        `<li><span>Standby</span><span>${standby}</span></li>`,
        `<li><span>Offline</span><span>${offline}</span></li>`
      ].join('');
    }

    if (elements.darkReadiness) {
      elements.darkReadiness.textContent = score + '%';
    }
    if (elements.darkOpen) {
      elements.darkOpen.textContent = String(openCount);
    }
    if (elements.darkResolution) {
      elements.darkResolution.textContent = completedRate + '%';
    }
  }

  function renderBriefing() {
    if (!elements.dashNewsFeed) {
      return;
    }
    const items = Array.isArray(context.recentNews) ? context.recentNews : [];
    if (items.length === 0) {
      elements.dashNewsFeed.innerHTML =
        '<li class="dash-feed-item dash-feed-item--info"><span class="dash-feed-avatar" aria-hidden="true"></span><p class="dash-feed-text">No briefing items. All quiet on the network.</p></li>';
      return;
    }
    const toneClasses = ['dash-feed-item--info', 'dash-feed-item--ok', 'dash-feed-item--warn', 'dash-feed-item--alert'];
    elements.dashNewsFeed.innerHTML = items
      .map((text, i) => {
        const cls = toneClasses[i % toneClasses.length];
        return `<li class="dash-feed-item ${cls}"><span class="dash-feed-avatar" aria-hidden="true"></span><p class="dash-feed-text">${escapeHtml(text)}</p></li>`;
      })
      .join('');
  }

  function renderStationStatuses() {
    if (!elements.stationStatusSummary || !elements.stationStatusList) {
      return;
    }

    const stations = Array.isArray(context.stationStatuses) ? context.stationStatuses : [];
    if (stations.length === 0) {
      elements.stationStatusSummary.textContent = 'No station data';
      elements.stationStatusList.innerHTML = '<p class="dash-loading">No stations to display</p>';
      return;
    }

    const respondingCount = stations.filter((s) => String(s.statusCode || '').toLowerCase() === 'responding').length;
    const standbyCount = stations.filter((s) => String(s.statusCode || '').toLowerCase() === 'standby').length;
    const offlineCount = stations.filter((s) => String(s.statusCode || '').toLowerCase() === 'offline').length;
    elements.stationStatusSummary.textContent = `Responding ${respondingCount} · Standby ${standbyCount} · Offline ${offlineCount}`;

    elements.stationStatusList.innerHTML = stations
      .map((station) => {
        const statusCode = String(station.statusCode || 'standby').toLowerCase();
        const activeCount = Number(station.activeAssignmentCount || 0);
        const statusLabel = statusCode === 'responding' ? 'Responding' : statusCode === 'offline' ? 'Offline' : 'Standby';
        const metaText =
          statusCode === 'responding'
            ? `${activeCount} active assignment(s)`
            : statusCode === 'offline'
              ? 'Station inactive'
              : 'Available for dispatch';
        const badgeClass =
          statusCode === 'responding' ? 'dash-row-badge--responding' : statusCode === 'offline' ? 'dash-row-badge--offline' : 'dash-row-badge--standby';
        const sid = Number(station.stationId || 0);
        const href = REPORTS_URL;
        const rowClass = station.isCurrentStation ? 'dash-row dash-row--current' : 'dash-row';
        return `
        <div class="${rowClass}" data-station-status="${escapeHtml(statusCode)}">
          <span class="dash-row-id">S${sid || '—'}</span>
          <div class="dash-row-main">
            <span class="dash-row-name">${escapeHtml(station.stationName || 'Unknown')}</span>
            <span class="dash-row-sub">${escapeHtml(metaText)}</span>
          </div>
          <span class="dash-row-badge ${badgeClass}">${escapeHtml(statusLabel)}</span>
          <a class="dash-row-btn" href="${escapeHtml(href)}">View</a>
        </div>`;
      })
      .join('');
  }

  function renderDispatchLoadBalance() {
    if (!elements.dashLoadBalanceSummary || !elements.dashLoadBalanceLead || !elements.dashLoadBalanceMeta || !elements.dashLoadBalanceList) {
      return;
    }

    const summary = context.dispatchLoadSummary && typeof context.dispatchLoadSummary === 'object' ? context.dispatchLoadSummary : {};
    const topStations = Array.isArray(summary.topStations) ? summary.topStations : [];
    const busiestStationName = String(summary.busiestStationName || 'No active dispatch load');
    const busiestAssignments = Number(summary.busiestStationActiveAssignments || 0);
    const stationsHandlingCount = Number(summary.stationsHandlingCount || 0);
    const zeroAvailabilityCount = Number(summary.zeroAvailabilityCount || 0);
    const fallbackDispatchCountToday = Number(summary.fallbackDispatchCountToday || 0);

    elements.dashLoadBalanceSummary.textContent =
      `${stationsHandlingCount} station(s) handling incidents now · ${zeroAvailabilityCount} idle station(s)`;
    elements.dashLoadBalanceLead.textContent = busiestStationName;
    elements.dashLoadBalanceMeta.textContent =
      busiestAssignments > 0
        ? `${busiestAssignments} active assignment(s) · ${fallbackDispatchCountToday} fallback dispatch(es) today`
        : 'Waiting for live assignments';

    if (topStations.length === 0) {
      elements.dashLoadBalanceList.innerHTML = '<li class="dash-load-item dash-load-item--empty">No dispatch activity yet.</li>';
      return;
    }

    elements.dashLoadBalanceList.innerHTML = topStations
      .map((station, index) => {
        const stationName = escapeHtml(station.stationName || 'Station');
        const activeAssignmentCount = Number(station.activeAssignmentCount || 0);
        const incidentsHandledToday = Number(station.incidentsHandledToday || 0);
        const fallbackCount = Number(station.fallbackDispatchCountToday || 0);
        const itemClass = station.isCurrentStation ? 'dash-load-item dash-load-item--current' : 'dash-load-item';
        const sub = `${incidentsHandledToday} handled today${fallbackCount > 0 ? ` · ${fallbackCount} fallback` : ''}`;
        return `
          <li class="${itemClass}">
            <span class="dash-load-rank">${index + 1}</span>
            <div class="dash-load-main">
              <span class="dash-load-name">${stationName}</span>
              <span class="dash-load-sub">${escapeHtml(sub)}</span>
            </div>
            <span class="dash-load-count">${activeAssignmentCount} active</span>
          </li>
        `;
      })
      .join('');
  }

  function renderAlarmRaiseBanner() {
    const banner = document.getElementById('dashAlarmRaiseBanner');
    const title = document.getElementById('dashAlarmRaiseTitle');
    const meta = document.getElementById('dashAlarmRaiseMeta');
    const btn = document.getElementById('dashAlarmRaiseBtn');
    if (!banner) {
      return;
    }

    const isCentral = Boolean(context.isCentralStation);
    const count = Math.max(0, Number(context.pendingAlarmRaiseCount || 0));
    if (!isCentral || count < 1) {
      banner.hidden = true;
      return;
    }

    banner.hidden = false;
    if (title) {
      title.textContent = count === 1
        ? '1 urgent fire alarm raise request needs MCFS review'
        : (count + ' urgent fire alarm raise requests need MCFS review');
    }
    if (meta) {
      meta.textContent = 'Responding stations asked to escalate the live alarm. Approve only after confirming the field situation.';
    }
    if (btn) {
      btn.href = String(context.alarmRaiseRequestsUrl || (REPORTS_URL + '?tab=alarm_requests'));
    }
  }

  function renderOngoingIncident() {
    if (elements.ongoingIncidentTitle && context.ongoingIncidentTitle) {
      elements.ongoingIncidentTitle.textContent = String(context.ongoingIncidentTitle);
    }
    if (elements.ongoingIncidentMeta && context.ongoingIncidentMeta) {
      elements.ongoingIncidentMeta.textContent = String(context.ongoingIncidentMeta);
    }
    const dot = document.querySelector('.dash-activity-dot');
    renderAlarmRaiseBanner();
    if (dot) {
      const open = Number(context.openIncidentCount || 0) > 0;
      dot.style.background = open ? '#dc2626' : '#16a34a';
      dot.style.boxShadow = open ? '0 0 0 6px rgba(220, 38, 38, 0.2)' : '0 0 0 6px rgba(22, 163, 74, 0.15)';
    }
  }

  const sparkOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false, min: 0 }
    },
    elements: { point: { radius: 0 } },
    interaction: { mode: 'nearest', intersect: false }
  };

  function initSpark(canvas, series, stroke, fill) {
    if (!canvas || typeof Chart === 'undefined') {
      return;
    }
    const key = 'spark_' + canvas.id;
    if (charts[key]) {
      charts[key].destroy();
    }
    const data = Array.isArray(series) && series.length ? series : [0, 0, 0, 0, 1];
    const labels = data.map((_, i) => String(i));
    charts[key] = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data,
            borderColor: stroke,
            backgroundColor: fill,
            borderWidth: 2,
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: sparkOpts
    });
  }

  function initIncidentTrendChart() {
    if (!elements.incidentTrendChart || typeof Chart === 'undefined') {
      return;
    }
    const ctx = elements.incidentTrendChart.getContext('2d');
    const { labels, counts } = getTrendArrays();
    const L = labels.length ? labels : ['1', '2', '3', '4', '5', '6', '7'];
    const D = counts.length ? counts : [0, 0, 0, 0, 0, 0, 0];

    if (charts.incidentTrend) {
      charts.incidentTrend.destroy();
    }

    charts.incidentTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: L,
        datasets: [
          {
            label: 'Incidents',
            data: D,
            borderColor: '#b31926',
            backgroundColor: 'rgba(179, 25, 38, 0.12)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#b31926',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          filler: { propagate: true },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 12 },
            bodyFont: { size: 13 },
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.25)', drawBorder: false },
            ticks: { color: '#64748b', font: { size: 11 } }
          },
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { color: '#64748b', font: { size: 11 }, maxRotation: 0 }
          }
        }
      }
    });
  }

  function initWeeklyBarChart() {
    if (!elements.weeklyBarChart || typeof Chart === 'undefined') {
      return;
    }
    const ctx = elements.weeklyBarChart.getContext('2d');
    const { labels, counts } = getTrendArrays();
    const L = labels.length ? labels.map((d) => (d.length > 5 ? d.slice(5) : d)) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const D = counts.length ? counts : [0, 0, 0, 0, 0, 0, 0];

    if (charts.weeklyBar) {
      charts.weeklyBar.destroy();
    }

    charts.weeklyBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: L,
        datasets: [
          {
            label: 'Reports',
            data: D,
            backgroundColor: 'rgba(179, 25, 38, 0.78)',
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#64748b', font: { size: 11 } },
            grid: { color: 'rgba(148, 163, 184, 0.2)' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 45 }
          }
        }
      }
    });
  }

  function initStationHealthChart() {
    if (!elements.stationHealthChart || typeof Chart === 'undefined') {
      return;
    }

    const ctx = elements.stationHealthChart.getContext('2d');
    const stations = Array.isArray(context.stationStatuses) ? context.stationStatuses : [];
    const responding = stations.filter((s) => String(s.statusCode || '').toLowerCase() === 'responding').length;
    const standby = stations.filter((s) => String(s.statusCode || '').toLowerCase() === 'standby').length;
    const offline = stations.filter((s) => String(s.statusCode || '').toLowerCase() === 'offline').length;

    if (charts.stationHealth) {
      charts.stationHealth.destroy();
    }

    charts.stationHealth = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Responding', 'Standby', 'Offline'],
        datasets: [
          {
            data: [responding, standby, offline],
            backgroundColor: ['#16a34a', '#c9a24d', '#64748b'],
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            titleFont: { size: 12 },
            bodyFont: { size: 13 },
            padding: 10,
            cornerRadius: 8
          }
        }
      }
    });
  }

  function initSparks() {
    const { counts } = getTrendArrays();
    const openCount = Number(context.openIncidentCount || 0);
    const completed = Number(context.completedIncidentCount || 0);
    const offlineCount = Array.isArray(context.stationStatuses)
      ? context.stationStatuses.filter((s) => String(s.statusCode || '').toLowerCase() === 'offline').length
      : 0;
    const score = clamp(100 - openCount * 4 - offlineCount * 12, 18, 100);

    initSpark(elements.sparkActiveIncidents, counts.length ? counts : [0, 0, 0, openCount], '#dc2626', 'rgba(220, 38, 38, 0.08)');
    initSpark(elements.sparkCompleted, counts.length ? counts : [0, 0, 0, completed], '#16a34a', 'rgba(22, 163, 74, 0.08)');
    const rLine = counts.map(() => score);
    initSpark(elements.sparkReadiness, rLine.length ? rLine : [score, score, score, score], '#b31926', 'rgba(179, 25, 38, 0.1)');
  }

  function waitForChartJs(callback, maxAttempts = 100) {
    if (typeof Chart !== 'undefined') {
      callback();
    } else if (maxAttempts > 0) {
      setTimeout(() => waitForChartJs(callback, maxAttempts - 1), 100);
    } else {
      showChartLoadFailure();
    }
  }

  function showChartLoadFailure() {
    const msg =
      'Charts did not load (Chart.js missing). Hard-refresh (Ctrl+F5) and confirm chart.umd.js returns 200. Try Firefox or Edge InPrivate if a blocker strips scripts.';
    const ids = ['sparkActiveIncidents', 'sparkCompleted', 'sparkReadiness', 'incidentTrendChart', 'weeklyBarChart'];
    ids.forEach((id) => {
      const canvas = document.getElementById(id);
      if (!canvas || !canvas.parentNode) {
        return;
      }
      const wrap = canvas.parentNode;
      if (wrap.querySelector('.firenet-chart-error')) {
        return;
      }
      const note = document.createElement('p');
      note.className = 'firenet-chart-error';
      note.textContent = msg;
      wrap.insertBefore(note, canvas);
      canvas.hidden = true;
    });
    console.error('FireNet dashboard: Chart is undefined after wait.');
  }

  function resizeChartsIfNeeded() {
    requestAnimationFrame(() => {
      Object.keys(charts).forEach((key) => {
        const ch = charts[key];
        if (ch && typeof ch.resize === 'function') {
          ch.resize();
        }
      });
    });
  }

  function setupQuickIncidentReporting() {
    const canReport = Boolean(context.canCreateIncidentReports);
    const url = getReportIncidentUrl();
    const targets = [
      document.getElementById('dashReportIncidentBtn'),
      document.getElementById('dashReportIncidentFab'),
      document.getElementById('dashLiveReportBtn')
    ];

    targets.forEach(function (target) {
      if (!target) {
        return;
      }
      target.href = url;
      target.hidden = !canReport;
    });
  }

  function initializeDashboard() {
    const refreshed = document.getElementById('dashRefreshedAt');
    if (refreshed) {
      refreshed.textContent =
        'Updated — ' +
        new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    renderHeader();
    renderMetrics();
    setupQuickIncidentReporting();
    renderBriefing();
    renderStationStatuses();
    renderDispatchLoadBalance();
    renderOngoingIncident();
    searchState.items = buildSearchIndex();

    if (elements.dashSearchField && elements.dashSearchPanel && elements.dashSearchResults) {
      const syncSearch = () => {
        renderSearchResults(elements.dashSearchField.value);
      };

      elements.dashSearchField.addEventListener('focus', syncSearch);
      elements.dashSearchField.addEventListener('input', syncSearch);
      elements.dashSearchField.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          elements.dashSearchField.value = '';
          closeSearchPanel();
          return;
        }

        if (event.key === 'ArrowDown' && searchState.visibleItems.length > 0) {
          event.preventDefault();
          searchState.activeIndex = Math.min(searchState.activeIndex + 1, searchState.visibleItems.length - 1);
          renderSearchResults(elements.dashSearchField.value);
          return;
        }

        if (event.key === 'ArrowUp' && searchState.visibleItems.length > 0) {
          event.preventDefault();
          searchState.activeIndex = Math.max(searchState.activeIndex - 1, 0);
          renderSearchResults(elements.dashSearchField.value);
          return;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          if (searchState.visibleItems.length > 0) {
            navigateSearchResult(searchState.activeIndex);
          }
        }
      });

      elements.dashSearchResults.addEventListener('click', (event) => {
        const button = event.target.closest('[data-search-index]');
        if (!button) {
          return;
        }
        const index = Number(button.getAttribute('data-search-index') || '0');
        navigateSearchResult(index);
      });

      if (elements.dashSearchClearBtn) {
        elements.dashSearchClearBtn.addEventListener('click', () => {
          elements.dashSearchField.value = '';
          elements.dashSearchField.focus();
          renderSearchResults('');
        });
      }

      document.addEventListener('click', (event) => {
        if (!elements.dashSearchPanel.contains(event.target) && event.target !== elements.dashSearchField) {
          closeSearchPanel();
        }
      });

      renderSearchResults('');
      closeSearchPanel();
    }

    waitForChartJs(() => {
      initSparks();
      initIncidentTrendChart();
      initWeeklyBarChart();
      initStationHealthChart();
      resizeChartsIfNeeded();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
  } else {
    initializeDashboard();
  }
})();
