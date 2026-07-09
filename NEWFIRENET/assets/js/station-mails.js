(function () {
  const contextElement = document.getElementById('stationMailsContext');
  const mailList = document.getElementById('mailList');
  const threadModal = document.getElementById('threadMailModal');
  const closeThreadBtn = document.getElementById('closeThreadMailBtn');
  const mailDetail = document.getElementById('mailDetail');
  const mailDetailEmpty = document.getElementById('mailDetailEmpty');
  const mailDetailTitle = document.getElementById('mailDetailTitle');
  const mailThreadSummary = document.getElementById('mailThreadSummary');
  const mailFolderTitle = document.getElementById('mailFolderTitle');
  const composeModal = document.getElementById('composeMailModal');
  const composeBtn = document.getElementById('composeMailBtn');
  const refreshBtn = document.getElementById('refreshMailBtn');
  const closeComposeBtn = document.getElementById('closeComposeMailBtn');
  const composeMailTitle = document.getElementById('composeMailTitle');
  const composeForm = document.getElementById('composeMailForm');
  const composeThreadId = document.getElementById('composeThreadId');
  const composeParentMailId = document.getElementById('composeParentMailId');
  const composeSubject = document.getElementById('composeSubject');
  const composeModule = document.getElementById('composeModule');
  const composeType = document.getElementById('composeType');
  const composeImportance = document.getElementById('composeImportance');
  const composeRequestFiles = document.getElementById('composeRequestFiles');
  const composeStationNotice = document.getElementById('composeStationNotice');
  const composeRecipientHint = document.getElementById('composeRecipientHint');
  const composeRecipientStation = document.getElementById('composeRecipientStation');
  const composeRecipientUsers = document.getElementById('composeRecipientUsers');
  const composeRecipients = document.getElementById('composeRecipients');
  const composeBody = document.getElementById('composeBody');
  const composeAttachments = document.getElementById('composeAttachments');
  const composeMailMessage = document.getElementById('composeMailMessage');
  const saveDraftBtn = document.getElementById('saveDraftBtn');
  const sendMailBtn = document.getElementById('sendMailBtn');
  const searchInput = document.getElementById('mailSearchInput');
  const stationFilterSelect = document.getElementById('stationFilterSelect');
  const unreadOnlyToggle = document.getElementById('unreadOnlyToggle');
  const mailSortSelect = document.getElementById('mailSortSelect');
  const mailActiveFilter = document.getElementById('mailActiveFilter');
  const inboxCount = document.getElementById('inboxCount');
  const unreadCount = document.getElementById('unreadCount');
  const sentCount = document.getElementById('sentCount');
  const draftCount = document.getElementById('draftCount');
  const markReadBtn = document.getElementById('markReadBtn');
  const archiveBtn = document.getElementById('archiveBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const markUnreadBtn = document.getElementById('markUnreadBtn');
  const toggleStarBtn = document.getElementById('toggleStarBtn');
  const stationUserDirectory = document.getElementById('stationUserDirectory');
  const requestTrackingList = document.getElementById('requestTrackingList');

  if (
    !contextElement || !mailList || !threadModal || !closeThreadBtn || !mailDetail || !mailDetailEmpty || !mailDetailTitle || !mailThreadSummary || !mailFolderTitle ||
    !composeModal || !composeBtn || !refreshBtn || !closeComposeBtn || !composeMailTitle || !composeForm || !composeThreadId ||
    !composeParentMailId || !composeSubject || !composeModule || !composeType || !composeImportance || !composeRequestFiles ||
    !composeStationNotice || !composeRecipientHint ||
    !composeRecipientStation || !composeRecipientUsers || !composeRecipients || !composeBody || !composeAttachments || !composeMailMessage || !saveDraftBtn ||
    !sendMailBtn || !searchInput || !stationFilterSelect || !unreadOnlyToggle || !mailSortSelect || !mailActiveFilter ||
    !inboxCount || !unreadCount || !sentCount || !draftCount || !markReadBtn || !archiveBtn || !deleteBtn ||
    !markUnreadBtn || !toggleStarBtn || !stationUserDirectory
  ) {
    return;
  }

  const apiUrl = String((JSON.parse(contextElement.textContent || '{}') || {}).mailApiUrl || '/firenet/NEWFIRENET/backend/controllers/station_mails.php');
  const state = {
    folder: 'inbox',
    search: '',
    stationFilter: '',
    moduleFilter: 'general',
    unreadOnly: false,
    sort: 'latest',
    stations: [],
    networkUsers: [],
    currentThreadId: 0,
    items: [],
    activeItem: null,
    bootstrap: null,
    requestTracking: [],
    composeReplyRequestMode: false,
    composeFixedTargetStationId: 0
  };

  function isComlUser() {
    return Boolean(state.bootstrap && state.bootstrap.currentUser && state.bootstrap.currentUser.isComl);
  }

  function currentUserId() {
    return Number((state.bootstrap && state.bootstrap.currentUser && state.bootstrap.currentUser.userId) || 0);
  }

  function routeActiveComlStationId(requestRoute) {
    const status = String((requestRoute && requestRoute.status) || '').toLowerCase();
    if (status === 'pending_origin_review') {
      return Number(requestRoute.originStationId || 0);
    }
    if (['approved', 'forwarded_to_target', 'routed_to_user', 'file_returned_to_coml', 'returned_to_origin'].indexOf(status) !== -1) {
      return Number(requestRoute.targetStationId || 0);
    }
    return 0;
  }

  function routeHandlerContext(requestRoute) {
    const rr = requestRoute || {};
    const me = currentUserId();
    const myStationId = Number((state.bootstrap && state.bootstrap.currentUser && state.bootstrap.currentUser.stationId) || 0);
    const activeStationId = routeActiveComlStationId(rr);
    const handlerId = Number(rr.handlingComlUserId || 0);
    const onMyQueue = activeStationId > 0 && activeStationId === myStationId;
    return {
      handlerId: handlerId,
      handlerName: String(rr.handlingComlUsername || ''),
      onMyQueue: onMyQueue,
      isMine: onMyQueue && handlerId > 0 && handlerId === me,
      isTaken: onMyQueue && handlerId > 0 && handlerId !== me
    };
  }

  function comlBlockedByOtherHandler(detail) {
    return isComlUser() && routeHandlerContext((detail && detail.requestRoute) || {}).isTaken;
  }

  function renderRouteHandlerBanner(detail) {
    const rr = (detail && detail.requestRoute) || {};
    if (!rr.routeId || !isComlUser()) {
      return '';
    }
    const ctx = routeHandlerContext(rr);
    if (ctx.isMine) {
      return '<div class="mail-route-handler-banner is-mine"><i class="bi bi-person-check-fill" aria-hidden="true"></i><span>You are handling this request</span></div>';
    }
    if (ctx.isTaken) {
      return '<div class="mail-route-handler-banner is-taken"><i class="bi bi-person-lock-fill" aria-hidden="true"></i><span>Being handled by <strong>' + escapeHtml(ctx.handlerName || 'another ComL') + '</strong></span></div>';
    }
    if (ctx.onMyQueue && ctx.handlerId < 1) {
      return '<div class="mail-route-handler-banner is-available"><i class="bi bi-inbox" aria-hidden="true"></i><span>Unclaimed — you can read this request now. Claim it when you are ready to work on it.</span></div>';
    }
    return '';
  }

  function canClaimRequest(detail) {
    if (!isComlUser()) {
      return false;
    }
    return routeHandlerContext((detail && detail.requestRoute) || {}).isAvailable;
  }

  function canActOnClaimedRequest(detail) {
    if (!isComlUser()) {
      return true;
    }
    const ctx = routeHandlerContext((detail && detail.requestRoute) || {});
    if (!ctx.onMyQueue) {
      return true;
    }
    return ctx.isMine;
  }

  async function claimThreadRoute(detail) {
    if (!isComlUser() || !detail || !detail.requestRoute || !detail.requestRoute.routeId) {
      return detail;
    }
    const formData = new FormData();
    formData.append('action', 'request-claim');
    formData.append('routeId', String(detail.requestRoute.routeId));
    const response = await fetch(apiUrl, { method: 'POST', body: formData, credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to claim this request.');
    }
    if (payload.data && payload.data.requestRoute) {
      detail.requestRoute = payload.data.requestRoute;
    }
    return detail;
  }

  async function claimRequestTicket(detail) {
    const updated = await claimThreadRoute(detail);
    if (Number((updated.requestRoute && updated.requestRoute.handlingComlUserId) || 0) !== currentUserId()) {
      throw new Error('Unable to claim this request.');
    }
    renderThread(updated);
    renderList();
    setMessage('Request claimed. You can now work on it.', false);
    return updated;
  }

  async function takeoverThreadRoute(detail) {
    if (!detail || !detail.requestRoute || !detail.requestRoute.routeId) {
      throw new Error('Unable to locate this request.');
    }
    if (!window.confirm('Take over this request from the other ComL? They will no longer be able to act on it until you finish.')) {
      return detail;
    }
    await reviewRequest(detail, 'request-takeover', { routeId: Number(detail.requestRoute.routeId || 0) });
    return detail;
  }

  function canAssignedRequestUserReply(detail) {
    const requestRoute = (detail && detail.requestRoute) ? detail.requestRoute : {};
    if (!requestRoute.routeId) {
      return false;
    }

    const currentUser = (state.bootstrap && state.bootstrap.currentUser) ? state.bootstrap.currentUser : {};
    const routeStatus = String(requestRoute.status || '');
    const currentUserId = Number(currentUser.userId || 0);
    const currentStationId = Number(currentUser.stationId || 0);
    const assignedUserId = Number(requestRoute.assignedUserId || 0);
    const targetStationId = Number(requestRoute.targetStationId || 0);

    return Boolean(
      !isComlUser() &&
      assignedUserId > 0 &&
      assignedUserId === currentUserId &&
      targetStationId === currentStationId &&
      ['forwarded_to_target', 'routed_to_user', 'file_returned_to_coml', 'completed'].includes(routeStatus)
    );
  }

  function canCurrentUserReply(detail) {
    if (isComlUser()) {
      return true;
    }

    const requestRoute = (detail && detail.requestRoute) ? detail.requestRoute : {};
    if (!requestRoute.routeId) {
      return true;
    }

    return canAssignedRequestUserReply(detail);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setMessage(text, isError) {
    composeMailMessage.textContent = text;
    composeMailMessage.style.color = isError ? '#a61d2a' : '#2e5b3f';
  }

  function syncBodyScrollLock() {
    document.body.style.overflow = (!composeModal.hidden || !threadModal.hidden) ? 'hidden' : '';
  }

  function openCompose() {
    composeModal.hidden = false;
    syncBodyScrollLock();
    updateComposeLabels();
    updateComposeNoticeMode();
  }

  function closeCompose() {
    composeModal.hidden = true;
    syncBodyScrollLock();
    composeForm.reset();
    composeThreadId.value = '';
    composeParentMailId.value = '';
    state.composeReplyRequestMode = false;
    state.composeFixedTargetStationId = 0;
    setMessage('', false);
    updateComposeLabels();
    updateComposeNoticeMode();
  }

  function updateComposeLabels() {
    const moduleValue = state.composeReplyRequestMode ? 'operational' : String(composeModule.value || 'general');
    const isOperational = moduleValue === 'operational';

    composeBtn.textContent = 'Compose Mail';
    composeMailTitle.textContent = state.composeReplyRequestMode
      ? 'Operational File Request Reply'
      : (isOperational ? 'Operational File Request/Reply' : 'General Mail');
    sendMailBtn.textContent = state.composeReplyRequestMode
      ? 'Reply to Request'
      : (isOperational ? 'Send Operational Request' : 'Send Message');

    const kicker = composeModal.querySelector('.mail-kicker');
    if (kicker) {
      kicker.textContent = state.composeReplyRequestMode
        ? 'Operational Reply'
        : (isOperational ? 'Operational File Request/Reply' : 'General Mail');
    }
  }

  function openThreadModal() {
    threadModal.hidden = false;
    syncBodyScrollLock();
  }

  function closeThreadModal() {
    threadModal.hidden = true;
    syncBodyScrollLock();
  }

  function updateComposeNoticeMode() {
    const moduleValue = state.composeReplyRequestMode ? 'operational' : String(composeModule.value || 'general');
    const isOperational = moduleValue === 'operational';
    const isNotice = composeStationNotice.checked;
    const canRouteStations = isComlUser();
    const currentStationId = (state.bootstrap && state.bootstrap.currentUser && state.bootstrap.currentUser.stationId) || 0;
    const recipientLabel = composeRecipients.closest('label');
    const stationLabel = composeRecipientStation.closest('label');
    const userLabel = composeRecipientUsers.closest('label');

    composeStationNotice.disabled = !canRouteStations;
    composeType.disabled = true;
    composeRequestFiles.disabled = true;
    composeRecipients.disabled = false;
    composeRecipientStation.disabled = false;
    composeRecipientUsers.disabled = false;

    if (state.composeReplyRequestMode) {
      composeType.value = 'message';
      composeType.disabled = true;
      composeRequestFiles.checked = false;
      composeRequestFiles.disabled = true;
      composeStationNotice.checked = false;
      composeStationNotice.disabled = true;
      composeRecipients.multiple = false;
      composeRecipients.size = 1;
      composeRecipients.disabled = true;
      if (recipientLabel) {
        recipientLabel.firstChild.textContent = 'Requester Station (auto)';
      }
      if (stationLabel) {
        stationLabel.firstChild.textContent = 'Recipient Station (Brgy)';
      }
      if (userLabel) {
        userLabel.firstChild.textContent = 'Recipient Users';
      }
      composeRecipientHint.textContent = 'Reply is automatically routed to the requester station ComL.';
      composeRecipientStation.disabled = true;
      composeRecipientUsers.disabled = true;

      const fixedTargetStationId = Number(state.composeFixedTargetStationId || 0);
      if (fixedTargetStationId > 0) {
        Array.from(composeRecipients.options).forEach(function (option) {
          option.selected = Number(option.value) === fixedTargetStationId;
        });
      }
      return;
    }

    if (isOperational) {
      composeType.value = 'request';
      composeRequestFiles.checked = true;
      composeStationNotice.checked = false;
      composeStationNotice.disabled = true;
      composeRecipientStation.disabled = true;
      composeRecipientUsers.disabled = true;
      composeRecipients.disabled = false;

      if (!canRouteStations) {
      composeType.value = 'request';
      composeRequestFiles.checked = true;
      composeRecipientHint.textContent = 'Operational File Request/Reply routes through ComL for incident reports and operational files.';
      composeRecipients.multiple = false;
      composeRecipients.size = 1;
      if (recipientLabel) {
          recipientLabel.firstChild.textContent = 'Operational Target Station';
        }
      } else {
        composeRecipientHint.textContent = 'ComL can route operational requests to target stations.';
        composeRecipients.multiple = true;
        composeRecipients.size = 6;
        if (recipientLabel) {
          recipientLabel.firstChild.textContent = 'Operational Target Stations';
        }
      }

      if (stationLabel) {
        stationLabel.firstChild.textContent = 'Recipient Station (Brgy)';
      }
      if (userLabel) {
        userLabel.firstChild.textContent = 'Recipient Users';
      }
      return;
    }

    composeType.value = 'message';
    composeRequestFiles.checked = false;
    composeStationNotice.checked = false;
    composeStationNotice.disabled = !canRouteStations;
    composeRecipients.disabled = true;
    composeRecipients.multiple = false;
    composeRecipients.size = 1;
    composeRecipientStation.disabled = false;
    composeRecipientUsers.disabled = false;
    composeRecipientHint.textContent = 'General Mail supports end-to-end conversations. Select station and specific user recipients.';
    if (recipientLabel) {
      recipientLabel.firstChild.textContent = 'Operational Target Station';
    }
    if (stationLabel) {
      stationLabel.firstChild.textContent = 'Recipient Station (Brgy)';
    }
    if (userLabel) {
      userLabel.firstChild.textContent = 'Recipient Users (multiple allowed)';
    }

    if (isNotice) {
      Array.from(composeRecipients.options).forEach(function (option) {
        option.selected = Number(option.value) === Number(currentStationId);
      });
      composeRecipients.disabled = true;
      composeRecipientStation.disabled = true;
      composeRecipientUsers.disabled = true;
      composeRecipientHint.textContent = 'Station Notice targets your own station users only.';
    }
  }

  function renderRecipientUserOptions() {
    const networkUsers = Array.isArray(state.networkUsers) ? state.networkUsers : [];
    const selectedStationId = Number(composeRecipientStation.value || 0);
    const currentUserId = Number((state.bootstrap && state.bootstrap.currentUser && state.bootstrap.currentUser.userId) || 0);

    const eligibleUsers = networkUsers.filter(function (user) {
      const userId = Number(user.userId || 0);
      const stationId = Number(user.stationId || 0);
      const isActive = String(user.status || '').toLowerCase() === 'active';
      if (!isActive || userId < 1 || userId === currentUserId) {
        return false;
      }
      if (selectedStationId < 1) {
        return true;
      }
      return stationId === selectedStationId;
    });

    composeRecipientUsers.innerHTML = eligibleUsers.map(function (user) {
      const stationCode = user.stationCode ? ('[' + String(user.stationCode) + '] ') : '';
      const label = stationCode + String(user.stationName || '') + ' - ' + String(user.username || 'User');
      return '<option value="' + escapeHtml(String(user.userId)) + '">' + escapeHtml(label) + '</option>';
    }).join('');
  }

  function selectedRecipientUserIds() {
    return Array.from(composeRecipientUsers.selectedOptions || []).map(function (option) {
      return Number(option.value || 0);
    }).filter(function (userId) {
      return userId > 0;
    });
  }

  function renderStationDirectory() {
    const users = (state.bootstrap && Array.isArray(state.bootstrap.stationUsers)) ? state.bootstrap.stationUsers : [];
    if (!users.length) {
      stationUserDirectory.innerHTML = '<p class="mail-empty-list">No station users found.</p>';
      return;
    }

    stationUserDirectory.innerHTML = users.map(function (user) {
      const statusClass = String(user.status || '').toLowerCase() === 'active' ? 'mail-tag' : 'mail-tag is-high';
      return (
        '<article class="mail-station-user-card">' +
          '<div class="mail-station-user-head"><strong>' + escapeHtml(user.username || 'User') + '</strong><span class="' + statusClass + '">' + escapeHtml(user.status || 'inactive') + '</span></div>' +
          '<div class="mail-station-user-meta">' +
            '<span>' + escapeHtml(user.role || 'user') + (user.positionName ? (' / ' + escapeHtml(user.positionName)) : '') + '</span>' +
            '<a class="mail-station-email" href="mailto:' + escapeHtml(user.email || '') + '">' + escapeHtml(user.email || '') + '</a>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderRequestTracking() {
    if (!requestTrackingList) {
      return;
    }

    const items = Array.isArray(state.requestTracking) ? state.requestTracking : [];
    if (!items.length) {
      requestTrackingList.innerHTML = '<p class="mail-empty-list">No tracked requests yet.</p>';
      return;
    }

    requestTrackingList.innerHTML = items.map(function (item) {
      const title = item.subject || '(No subject)';
      const fromTo = (item.originStationName || 'Origin') + ' -> ' + (item.targetStationName || 'Target');
      const status = String(item.status || '').replace(/_/g, ' ');
      return '<article class="mail-directory-item" data-track-thread-id="' + escapeHtml(String(item.threadId || 0)) + '" tabindex="0" role="button" aria-label="Open tracked request thread">' +
        '<strong>' + escapeHtml(title) + '</strong>' +
        '<span>' + escapeHtml(fromTo) + '</span>' +
        '<span>Status: ' + escapeHtml(status || 'unknown') + '</span>' +
      '</article>';
    }).join('');
  }

  function formatDate(value) {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleString();
  }

  function folderLabel(folder) {
    return {
      inbox: 'Inbox',
      starred: 'Starred',
      sent: 'Sent',
      drafts: 'Drafts',
      archive: 'Archive'
    }[folder] || 'Inbox';
  }

  function updateFilterHint() {
    const parts = [];
    if (state.stationFilter) {
      const station = (state.stations || []).find(function (entry) {
        return String(entry.stationId) === String(state.stationFilter);
      });
      parts.push('station: ' + (station ? station.stationName : 'selected'));
    }
    if (state.unreadOnly) {
      parts.push('unread only');
    }
    if (state.search) {
      parts.push('search: "' + state.search + '"');
    }
    if (state.moduleFilter === 'general') {
      parts.push('general mail');
    } else if (state.moduleFilter === 'operational') {
      parts.push('operational file request/reply');
    }
    mailActiveFilter.textContent = parts.length ? ('Showing ' + parts.join(' | ')) : 'Showing all messages';
  }

  function updateThreadActionLabels() {
    const hasStar = Boolean(state.activeItem && state.activeItem.starredAt);
    toggleStarBtn.textContent = hasStar ? 'Unstar' : 'Star';
  }

  function setActiveFolder(folder) {
    state.folder = folder;
    state.activeItem = null;
    state.stationFilter = '';
    state.search = '';
    state.sort = 'latest';
    stationFilterSelect.value = '';
    searchInput.value = '';
    mailSortSelect.value = 'latest';
    closeThreadModal();
    mailDetail.hidden = true;
    mailDetailEmpty.hidden = false;
    mailThreadSummary.innerHTML = '';
    mailDetailTitle.textContent = 'Select a conversation';
    document.querySelectorAll('.mail-folder-btn').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-folder') === folder);
    });
    document.querySelectorAll('.mail-module-btn').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-mail-module') === state.moduleFilter);
    });
    mailFolderTitle.textContent = folderLabel(folder);
    updateFilterHint();
    updateThreadActionLabels();
  }

  function renderStats(data) {
    inboxCount.textContent = String((data.folders && data.folders.inbox) || 0);
    unreadCount.textContent = String((data.folders && data.folders.unread) || 0);
    sentCount.textContent = String((data.folders && data.folders.sent) || 0);
    draftCount.textContent = String((data.folders && data.folders.drafts) || 0);
  }

  function renderStations() {
    const stations = state.stations || [];
    const currentStationId = (state.bootstrap && state.bootstrap.currentUser && state.bootstrap.currentUser.stationId) || 0;
    const canRouteStations = isComlUser();
    state.networkUsers = Array.isArray((state.bootstrap || {}).networkUsers) ? state.bootstrap.networkUsers : [];
    
    if (!canRouteStations) {
      const allowedStations = stations.filter(function (station) {
        return Number(station.stationId) !== Number(currentStationId);
      });
      composeRecipients.innerHTML = allowedStations.map(function (station) {
        return '<option value="' + escapeHtml(String(station.stationId)) + '">' + escapeHtml(station.stationName) + ' (' + escapeHtml(station.stationCode || '') + ')</option>';
      }).join('');
    } else {
      composeRecipients.innerHTML = stations.map(function (station) {
        return '<option value="' + escapeHtml(String(station.stationId)) + '">' + escapeHtml(station.stationName) + ' (' + escapeHtml(station.stationCode || '') + ')</option>';
      }).join('');
    }

    stationFilterSelect.innerHTML = '<option value="">All active stations</option>' + stations.map(function (station) {
      return '<option value="' + escapeHtml(String(station.stationId)) + '">' + escapeHtml(station.stationName) + '</option>';
    }).join('');
    stationFilterSelect.value = '';

    composeRecipientStation.innerHTML = '<option value="">All stations</option>' + stations.map(function (station) {
      return '<option value="' + escapeHtml(String(station.stationId)) + '">' + escapeHtml(station.stationName) + ' (' + escapeHtml(station.stationCode || '') + ')</option>';
    }).join('');
    composeRecipientStation.value = '';
    renderRecipientUserOptions();

    if (!canRouteStations && composeRecipients.options.length > 0) {
      composeRecipients.selectedIndex = 0;
      composeRecipients.options[0].selected = true;
    } else {
      Array.from(composeRecipients.options).forEach(function (option) {
        if (Number(option.value) === Number(currentStationId)) {
          option.selected = true;
        }
      });
    }
  }

  function visibleItems() {
    const items = state.items.filter(function (item) {
      const stationFilter = String(state.stationFilter || '');
      const matchesStation = stationFilter === '' || String(item.senderStationId || '') === stationFilter;
      const matchesUnread = !state.unreadOnly || !item.readAt;
      const isOperational = item.mailType === 'request' && Boolean(item.requestFiles);
      const matchesModule = state.moduleFilter === 'all' || (state.moduleFilter === 'general' ? !isOperational : isOperational);
      return matchesStation && matchesUnread && matchesModule;
    });

    if (state.sort === 'unread') {
      return items.sort(function (a, b) {
        const unreadA = a.readAt ? 1 : 0;
        const unreadB = b.readAt ? 1 : 0;
        if (unreadA !== unreadB) {
          return unreadA - unreadB;
        }

        const timeA = new Date(a.sentAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.sentAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    }

    if (state.sort === 'oldest') {
      return items.sort(function (a, b) {
        const timeA = new Date(a.sentAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.sentAt || b.createdAt || 0).getTime();
        return timeA - timeB;
      });
    }

    return items.sort(function (a, b) {
      const timeA = new Date(a.sentAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.sentAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }

  function renderList() {
    const items = visibleItems();

    if (!items.length) {
      mailList.innerHTML = '<div class="mail-empty-list">No messages match the current folder and filters.</div>';
      return;
    }

    mailList.innerHTML = items.map(function (item) {
      const unreadClass = item.readAt ? '' : ' unread';
      const activeClass = state.activeItem && state.activeItem.mailId === item.mailId ? ' is-active' : '';
      const tags = [];
      if (item.importance === 'urgent') {
        tags.push('<span class="mail-tag is-urgent">Urgent</span>');
      } else if (item.importance === 'high') {
        tags.push('<span class="mail-tag is-high">High</span>');
      }
      if (item.mailType === 'request') {
        tags.push('<span class="mail-tag is-request">Request</span>');
      }
      if (item.requestFiles) {
        tags.push('<span class="mail-tag">Needs files</span>');
      }
      if (item.attachmentCount > 0) {
        tags.push('<span class="mail-tag">' + escapeHtml(String(item.attachmentCount)) + ' attachment(s)</span>');
      }

      const starClass = item.starredAt ? ' is-starred' : '';
      const starLabel = item.starredAt ? 'Unstar thread' : 'Star thread';
      const senderLine = 'From: ' + escapeHtml(item.senderStationName || '') + ' / ' + escapeHtml(item.senderUsername || '');
      const recipientLine = item.recipientStations ? ('To: ' + escapeHtml(item.recipientStations)) : '';
        const isOperationalFileRequest = item.mailType === 'request' && Boolean(item.requestFiles);
        const requestClass = isOperationalFileRequest ? ' is-operational-request' : '';

      return (
          '<article class="mail-list-item' + unreadClass + activeClass + requestClass + '" data-mail-id="' + escapeHtml(String(item.mailId)) + '" data-thread-id="' + escapeHtml(String(item.threadId)) + '" tabindex="0" role="button" aria-label="Open mail thread">' +
          '<div class="mail-list-item-header"><p class="mail-list-item-subject"><strong>' + escapeHtml(item.subject || '(No subject)') + '</strong></p><span>' + escapeHtml(formatDate(item.sentAt || item.createdAt)) + '</span></div>' +
          '<div class="mail-list-item-meta"><span class="mail-sender-line">' + senderLine + '</span><span class="mail-list-meta-right"><button type="button" class="mail-star-btn' + starClass + '" data-star-thread="' + escapeHtml(String(item.threadId)) + '" aria-label="' + starLabel + '">&#9733;</button>' + escapeHtml(item.mailType || 'message') + '</span></div>' +
          (recipientLine ? ('<div class="mail-list-item-meta"><span class="mail-recipient-line">' + recipientLine + '</span></div>') : '') +
          '<p class="mail-list-item-snippet">' + escapeHtml(item.snippet || '') + '</p>' +
          '<div class="mail-recipient-list">' + tags.join('') + '</div>' +
        '</article>'
      );
    }).join('');

    updateFilterHint();
    updateThreadActionLabels();
  }

  function renderThread(detail) {
    const thread = detail.thread || {};
    const messages = Array.isArray(detail.messages) ? detail.messages : [];
    const participantSet = {};
    const canReply = canCurrentUserReply(detail);
    const requestRoute = detail.requestRoute || {};
    const currentUser = (state.bootstrap && state.bootstrap.currentUser) ? state.bootstrap.currentUser : {};
    const canAssignTargetRequest = Boolean(
      isComlUser() &&
      requestRoute.routeId &&
      (requestRoute.status === 'forwarded_to_target' || requestRoute.status === 'completed') &&
      Number(requestRoute.targetStationId || 0) === Number(currentUser.stationId || 0) &&
      !comlBlockedByOtherHandler(detail) &&
      canActOnClaimedRequest(detail)
    );
    const canAssignOriginRequest = Boolean(
      isComlUser() &&
      requestRoute.routeId &&
      (requestRoute.status === 'forwarded_to_target' || requestRoute.status === 'completed') &&
      Number(requestRoute.originStationId || 0) === Number(currentUser.stationId || 0) &&
      !comlBlockedByOtherHandler(detail) &&
      canActOnClaimedRequest(detail)
    );
    const canAssignedReply = canAssignedRequestUserReply(detail);
    const assignableUsers = Array.isArray((state.bootstrap || {}).stationUsers)
      ? state.bootstrap.stationUsers.filter(function (user) {
        return String(user.status || '').toLowerCase() === 'active' && Number(user.userId || 0) > 0;
      })
      : [];
    const assignmentControlHtml = canAssignTargetRequest
      ? ('<div class="mail-form-actions"><label for="assignTargetUserSelect">Forward to station user</label><select id="assignTargetUserSelect">' +
        '<option value="">Select user</option>' +
        assignableUsers.map(function (user) {
          const label = String(user.username || 'User') + (user.positionName ? (' (' + String(user.positionName) + ')') : '');
          return '<option value="' + escapeHtml(String(user.userId)) + '">' + escapeHtml(label) + '</option>';
        }).join('') +
        '</select><button type="button" class="primary-btn" id="assignTargetUserBtn">Assign User</button></div>')
      : '';
    const originAssignmentControlHtml = canAssignOriginRequest
      ? ('<div class="mail-form-actions"><label for="assignOriginUserSelect">Route back to requester station user</label><select id="assignOriginUserSelect">' +
        '<option value="">Select user</option>' +
        assignableUsers.map(function (user) {
          const label = String(user.username || 'User') + (user.positionName ? (' (' + String(user.positionName) + ')') : '');
          return '<option value="' + escapeHtml(String(user.userId)) + '">' + escapeHtml(label) + '</option>';
        }).join('') +
        '</select><button type="button" class="primary-btn" id="assignOriginUserBtn">Route to User</button></div>')
      : '';
    let totalAttachments = 0;
    messages.forEach(function (message) {
      const participantKey = String(message.senderStationName || '') + '|' + String(message.senderUsername || '');
      if (participantKey !== '|') {
        participantSet[participantKey] = (message.senderStationName || 'Station') + ' / ' + (message.senderUsername || 'User');
      }
      totalAttachments += Array.isArray(message.attachments) ? message.attachments.length : 0;
    });
    const participants = Object.keys(participantSet).map(function (key) {
      return participantSet[key];
    });
    const lastMessage = messages[messages.length - 1] || {};

    mailDetailTitle.textContent = thread.subject || 'Conversation';
    mailDetail.hidden = false;
    mailDetailEmpty.hidden = true;
    mailThreadSummary.innerHTML = renderRouteHandlerBanner(detail) + [
      '<span class="mail-thread-summary-chip"><strong>' + escapeHtml(String(messages.length)) + '</strong> message(s)</span>',
      '<span class="mail-thread-summary-chip"><strong>' + escapeHtml(String(participants.length)) + '</strong> participant(s)</span>',
      '<span class="mail-thread-summary-chip"><strong>' + escapeHtml(String(totalAttachments)) + '</strong> attachment(s)</span>',
      requestRoute.routeId ? '<span class="mail-thread-summary-chip">Request target: <strong>' + escapeHtml(requestRoute.targetStationName || ('Station ' + String(requestRoute.targetStationId || ''))) + '</strong></span>' : '',
      requestRoute.status ? '<span class="mail-thread-summary-chip">Request status: <strong>' + escapeHtml(String(requestRoute.status).replace(/_/g, ' ')) + '</strong></span>' : '',
      requestRoute.handlingComlUsername && isComlUser() ? '<span class="mail-thread-summary-chip">ComL handler: <strong>' + escapeHtml(Number(requestRoute.handlingComlUserId || 0) === currentUserId() ? 'You' : requestRoute.handlingComlUsername) + '</strong></span>' : '',
      '<span class="mail-thread-summary-chip">Last activity: <strong>' + escapeHtml(formatDate(lastMessage.sentAt || lastMessage.createdAt || thread.lastMessageAt || '')) + '</strong></span>'
    ].join('');

    if (!messages.length) {
      mailDetail.innerHTML = '<div class="mail-empty-list">This thread has no messages.</div>';
      openThreadModal();
      return;
    }

    const canReviewRequest = Boolean(
      canReply &&
      requestRoute.routeId &&
      requestRoute.status === 'pending_origin_review' &&
      Number(requestRoute.originStationId || 0) === Number((state.bootstrap.currentUser || {}).stationId || 0) &&
      !comlBlockedByOtherHandler(detail) &&
      canActOnClaimedRequest(detail)
    );
    const showClaimRequest = canClaimRequest(detail);

    mailDetail.innerHTML = messages.map(function (message) {
      const isOperationalFileRequest = message.mailType === 'request' && Boolean(message.requestFiles);
      const requestClass = isOperationalFileRequest ? ' is-operational-request' : '';
      const attachments = (message.attachments || []).map(function (attachment) {
        return '<a class="mail-attachment-link" href="' + escapeHtml(attachment.downloadUrl) + '">' + escapeHtml(attachment.originalFileName) + '</a>';
      }).join('');
      const tags = [];
      if (message.mailType === 'request') {
        tags.push('<span class="mail-tag is-request">Request</span>');
      }
      if (message.importance === 'urgent') {
        tags.push('<span class="mail-tag is-urgent">Urgent</span>');
      } else if (message.importance === 'high') {
        tags.push('<span class="mail-tag is-high">High</span>');
      }
      if (message.requestFiles) {
        tags.push('<span class="mail-tag">Files requested</span>');
      }

      return (
        '<article class="mail-thread-message' + (message.senderUserId === (state.bootstrap.currentUser.userId || 0) ? ' is-sent' : '') + requestClass + '" data-mail-id="' + escapeHtml(String(message.mailId)) + '">' +
          '<div class="mail-thread-message-head"><strong>' + escapeHtml(message.senderStationName || '') + '</strong><span>' + escapeHtml(formatDate(message.sentAt || message.createdAt)) + '</span></div>' +
          '<div class="mail-thread-message-meta"><span>From: ' + escapeHtml(message.senderUsername || '') + '</span><span>' + tags.join(' ') + '</span></div>' +
          (message.recipientStations ? ('<div class="mail-thread-message-meta"><span>To: ' + escapeHtml(message.recipientStations) + '</span></div>') : '') +
          '<p class="mail-thread-message-body">' + escapeHtml(message.body || '') + '</p>' +
          (attachments ? '<div class="mail-attachments">' + attachments + '</div>' : '') +
        '</article>'
      );
    }).join('') + (showClaimRequest
      ? '<div class="mail-form-actions"><button type="button" class="primary-btn" id="claimRequestBtn"><i class="bi bi-hand-index-thumb" aria-hidden="true"></i> Claim request</button><p class="form-note">Review the request first, then claim it when you are ready to handle it.</p></div>'
      : (canReviewRequest
      ? '<div class="mail-form-actions"><button type="button" class="secondary-btn" id="editRequestBtn">Edit</button><button type="button" class="primary-btn" id="approveRequestBtn">Approve</button><button type="button" class="secondary-btn" id="rejectRequestBtn">Reject</button></div>'
        : (canReply
          ? (assignmentControlHtml + originAssignmentControlHtml + '<div class="mail-form-actions"><button type="button" class="secondary-btn" id="replyThreadBtn">' + (canAssignedReply ? 'Open Conversation / Attach File' : 'Reply') + '</button>' + (isComlUser() && !requestRoute.routeId ? '<button type="button" class="secondary-btn" id="forwardThreadBtn">Forward</button>' : '') + '</div>')
          : '<div class="mail-empty-list">Only ComL users or the assigned request user can reply to station mail.</div>')));

    const editRequestBtn = document.getElementById('editRequestBtn');
    const approveRequestBtn = document.getElementById('approveRequestBtn');
    const rejectRequestBtn = document.getElementById('rejectRequestBtn');
    const assignTargetUserBtn = document.getElementById('assignTargetUserBtn');
    const assignOriginUserBtn = document.getElementById('assignOriginUserBtn');
    const replyThreadBtn = document.getElementById('replyThreadBtn');
    const forwardThreadBtn = document.getElementById('forwardThreadBtn');
    if (editRequestBtn) {
      editRequestBtn.addEventListener('click', function () {
        editRequest(detail);
      });
    }
    if (approveRequestBtn) {
      approveRequestBtn.addEventListener('click', function () {
        approveRequest(detail);
      });
    }
    if (rejectRequestBtn) {
      rejectRequestBtn.addEventListener('click', function () {
        rejectRequest(detail);
      });
    }
    if (assignTargetUserBtn) {
      assignTargetUserBtn.addEventListener('click', function () {
        assignRequestToTargetUser(detail);
      });
    }
    if (assignOriginUserBtn) {
      assignOriginUserBtn.addEventListener('click', function () {
        assignRequestToOriginUser(detail);
      });
    }
    if (replyThreadBtn) {
      replyThreadBtn.addEventListener('click', function () {
        prepareReply(detail);
      });
    }
    if (forwardThreadBtn) {
      forwardThreadBtn.addEventListener('click', function () {
        prepareForward(detail);
      });
    }
    const claimRequestBtn = document.getElementById('claimRequestBtn');
    if (claimRequestBtn) {
      claimRequestBtn.addEventListener('click', function () {
        claimRequestTicket(detail).catch(function (error) {
          setMessage(error.message, true);
        });
      });
    }

    openThreadModal();
  }

  function applyBootstrap(payload) {
    state.bootstrap = payload.data || {};
    state.requestTracking = Array.isArray(state.bootstrap.requestTracking) ? state.bootstrap.requestTracking : [];
    state.stations = Array.isArray(state.bootstrap.stations) ? state.bootstrap.stations.filter(function (station) {
      return String(station.status || '') === 'active';
    }) : [];
    const currentUser = state.bootstrap.currentUser || {};
    const positionLabel = currentUser.positionName ? (' / ' + String(currentUser.positionName)) : '';
    const routingLabel = currentUser.isComl ? 'ComL routing enabled.' : 'Request-only mode; direct station communication is blocked.';
    document.getElementById('mailWelcomeText').textContent = 'Sending from ' + String(currentUser.stationName || 'your station') + ' as ' + String(currentUser.role || 'user') + positionLabel + '. ' + routingLabel;
    updateComposeLabels();
    renderStats(state.bootstrap);
    renderStations();
    renderStationDirectory();
    renderRequestTracking();
    updateComposeNoticeMode();
  }

  async function fetchBootstrap() {
    const response = await fetch(apiUrl + '?action=bootstrap', { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to load station mail data.');
    }

    applyBootstrap(payload);
  }

  async function fetchList() {
    const query = new URLSearchParams({
      action: 'list',
      folder: state.folder,
      search: state.search || ''
    });
    if (state.unreadOnly) {
      query.set('search', (state.search || '') + '');
    }

    const response = await fetch(apiUrl + '?' + query.toString(), { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true || !Array.isArray(payload.items)) {
      throw new Error((payload && payload.message) || 'Unable to load mail list.');
    }

    state.items = Array.isArray(payload.items) ? payload.items : [];
    renderList();
  }

  async function openThread(threadId) {
    const response = await fetch(apiUrl + '?action=thread&threadId=' + encodeURIComponent(String(threadId)), { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true || !payload.data) {
      throw new Error((payload && payload.message) || 'Unable to load mail thread.');
    }

    let detail = payload.data;

    state.activeItem = state.items.find(function (item) {
      return String(item.threadId) === String(threadId);
    }) || null;
    renderList();
    renderThread(detail);

    updateThreadActionLabels();
  }

  function selectedRecipientStationIds() {
    return Array.from(composeRecipients.selectedOptions || []).map(function (option) {
      return Number(option.value || 0);
    }).filter(function (stationId) {
      return stationId > 0;
    });
  }

  function prepareReply(detail) {
    if (!canCurrentUserReply(detail)) {
      setMessage('You do not have permission to reply to this thread.', true);
      return;
    }

    const thread = detail.thread || {};
    const messages = Array.isArray(detail.messages) ? detail.messages : [];
    const latest = messages[messages.length - 1] || {};
    const requestRoute = detail.requestRoute || {};
    const isOperationalFileRequest = Boolean(
      !isComlUser() &&
      requestRoute.routeId &&
      Number(requestRoute.originStationId || 0) > 0
    );

    state.composeReplyRequestMode = isOperationalFileRequest;
    state.composeFixedTargetStationId = isOperationalFileRequest ? Number(requestRoute.originStationId || 0) : 0;

    composeThreadId.value = String(thread.threadId || '');
    composeParentMailId.value = String(latest.mailId || '');
    composeSubject.value = thread.subject ? ('Re: ' + thread.subject) : 'Re: Mail';
    composeType.value = 'message';
    composeImportance.value = latest.importance || 'normal';
    composeRequestFiles.checked = false;
    composeBody.value = '\n\n--- Replying to ---\n' + (latest.body || '');
    openCompose();
  }

  function prepareForward(detail) {
    if (!isComlUser()) {
      setMessage('Only ComL users can forward station threads.', true);
      return;
    }

    const thread = detail.thread || {};
    const messages = Array.isArray(detail.messages) ? detail.messages : [];
    const latest = messages[messages.length - 1] || {};
    composeThreadId.value = '';
    composeParentMailId.value = String(latest.mailId || '');
    composeSubject.value = thread.subject ? ('Fwd: ' + thread.subject) : 'Fwd: Mail';
    composeType.value = latest.mailType || 'message';
    composeImportance.value = latest.importance || 'normal';
    composeRequestFiles.checked = Boolean(latest.requestFiles);
    composeBody.value = '\n\n--- Forwarded message ---\n' + (latest.body || '');
    openCompose();
  }

  async function reviewRequest(detail, action, payload) {
    const requestRoute = detail.requestRoute || {};
    if (!requestRoute.routeId) {
      setMessage('No request route is attached to this thread.', true);
      return;
    }

    const formData = new FormData();
    formData.append('action', action);
    formData.append('routeId', String(requestRoute.routeId));
    Object.keys(payload || {}).forEach(function (key) {
      formData.append(key, String(payload[key]));
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const responsePayload = await response.json();
    if (!response.ok || !responsePayload || responsePayload.ok !== true) {
      throw new Error((responsePayload && responsePayload.message) || 'Unable to review request.');
    }

    setMessage(responsePayload.message || 'Request updated.', false);
    await fetchBootstrap();
    await fetchList();
    await openThread(detail.thread.threadId);
  }

  function editRequest(detail) {
    const requestRoute = detail.requestRoute || {};
    const baseMessage = Array.isArray(detail.messages) && detail.messages.length > 0 ? detail.messages[0] : {};
    const currentSubject = requestRoute.editedSubject || (detail.thread && detail.thread.subject) || baseMessage.subject || '';
    const currentBody = requestRoute.editedBody || baseMessage.body || '';
    const newSubject = window.prompt('Edit request subject', currentSubject);
    if (newSubject === null) {
      return;
    }
    const newBody = window.prompt('Edit request body', currentBody);
    if (newBody === null) {
      return;
    }
    const newTargetStationId = window.prompt('Target station id', String(requestRoute.targetStationId || ''));
    if (newTargetStationId === null) {
      return;
    }

    reviewRequest(detail, 'request-edit', {
      subject: newSubject,
      body: newBody,
      targetStationId: newTargetStationId
    }).catch(function (error) {
      setMessage(error.message, true);
    });
  }

  function approveRequest(detail) {
    reviewRequest(detail, 'request-approve', {}).catch(function (error) {
      setMessage(error.message, true);
    });
  }

  function rejectRequest(detail) {
    const reason = window.prompt('Enter rejection reason');
    if (reason === null) {
      return;
    }

    reviewRequest(detail, 'request-reject', { reason: reason }).catch(function (error) {
      setMessage(error.message, true);
    });
  }

  function assignRequestToTargetUser(detail) {
    const selectElement = document.getElementById('assignTargetUserSelect');
    const assignedUserId = Number((selectElement && selectElement.value) || 0);
    if (assignedUserId < 1) {
      setMessage('Select a user from your station to assign this request.', true);
      return;
    }

    const note = window.prompt('Optional instruction for the selected user', '');
    if (note === null) {
      return;
    }

    reviewRequest(detail, 'request-target-assign', {
      assignedUserId: assignedUserId,
      note: note
    }).catch(function (error) {
      setMessage(error.message, true);
    });
  }

  function assignRequestToOriginUser(detail) {
    const selectElement = document.getElementById('assignOriginUserSelect');
    const assignedUserId = Number((selectElement && selectElement.value) || 0);
    if (assignedUserId < 1) {
      setMessage('Select a user from your requester station.', true);
      return;
    }

    const note = window.prompt('Optional note for requester station user', '');
    if (note === null) {
      return;
    }

    reviewRequest(detail, 'request-origin-assign', {
      assignedUserId: assignedUserId,
      note: note
    }).catch(function (error) {
      setMessage(error.message, true);
    });
  }

  async function submitMail(asDraft) {
    const formData = new FormData();
    const canRouteStations = isComlUser();
    const isReplyToRequest = Boolean(state.composeReplyRequestMode && composeThreadId.value && !canRouteStations && !asDraft);
    const composeModuleValue = state.composeReplyRequestMode ? 'operational' : String(composeModule.value || 'general');
    const isOperational = composeModuleValue === 'operational';
    
    formData.append('action', isReplyToRequest ? 'reply' : (asDraft ? 'save-draft' : 'send'));
    if (composeThreadId.value) {
      formData.append('threadId', composeThreadId.value);
    }
    if (composeParentMailId.value) {
      formData.append('parentMailId', composeParentMailId.value);
    }
    formData.append('subject', composeSubject.value || '');
    formData.append('body', composeBody.value || '');
    formData.append('mailType', isOperational ? 'request' : 'message');
    formData.append('importance', composeImportance.value || 'normal');
    formData.append('requestFiles', isOperational ? '1' : '0');
    formData.append('isStationNotice', canRouteStations && composeStationNotice.checked ? '1' : '0');

    let recipientStationIds = selectedRecipientStationIds();
    let recipientUserIds = selectedRecipientUserIds();

    if (!isReplyToRequest) {
      if (isOperational) {
        if (!canRouteStations && recipientStationIds.length !== 1) {
          throw new Error('Select one operational target station.');
        }
        if (canRouteStations && recipientStationIds.length < 1) {
          throw new Error('Select at least one operational target station.');
        }
      } else if (recipientUserIds.length < 1) {
        throw new Error('Select at least one recipient user.');
      }
    }

    if (isReplyToRequest) {
      recipientStationIds = [];
      recipientUserIds = [];
    }

    recipientStationIds.forEach(function (stationId) {
      formData.append('recipientStationIds[]', String(stationId));
    });
    recipientUserIds.forEach(function (userId) {
      formData.append('recipientUserIds[]', String(userId));
    });
    Array.from(composeAttachments.files || []).forEach(function (file) {
      formData.append('attachments[]', file);
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to send mail.');
    }

    setMessage(payload.message || (asDraft ? 'Draft saved.' : 'Mail sent.'), false);
    closeCompose();
    await fetchBootstrap();
    await fetchList();
  }

  async function updateCurrentThread(action) {
    if (!state.activeItem) {
      return;
    }

    const formData = new FormData();
    formData.append('threadId', String(state.activeItem.threadId));
    formData.append('action', action);
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to update mail.');
    }

    await fetchList();
    if (state.activeItem) {
      await openThread(state.activeItem.threadId);
    }
  }

  async function deleteCurrentThread() {
    if (!state.activeItem) {
      return;
    }

    const formData = new FormData();
    formData.append('threadId', String(state.activeItem.threadId));
    formData.append('action', 'delete');
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to delete mail.');
    }

    state.activeItem = null;
    closeThreadModal();
    mailDetail.hidden = true;
    mailDetailEmpty.hidden = false;
    mailThreadSummary.innerHTML = '';
    await fetchList();
  }

  composeBtn.addEventListener('click', openCompose);
  closeComposeBtn.addEventListener('click', closeCompose);
  composeModal.addEventListener('click', function (event) {
    if (event.target && event.target.getAttribute('data-close-compose') === 'true') {
      closeCompose();
    }
  });

  closeThreadBtn.addEventListener('click', closeThreadModal);
  threadModal.addEventListener('click', function (event) {
    if (event.target && event.target.getAttribute('data-close-thread') === 'true') {
      closeThreadModal();
    }
  });

  refreshBtn.addEventListener('click', function () {
    fetchList().catch(function (error) {
      setMessage(error.message, true);
    });
  });

  saveDraftBtn.addEventListener('click', function () {
    submitMail(true).catch(function (error) {
      setMessage(error.message, true);
    });
  });

  composeStationNotice.addEventListener('change', function () {
    updateComposeNoticeMode();
  });

  composeModule.addEventListener('change', function () {
    updateComposeLabels();
    updateComposeNoticeMode();
  });

  composeRecipientStation.addEventListener('change', function () {
    renderRecipientUserOptions();
  });

  composeForm.addEventListener('submit', function (event) {
    event.preventDefault();
    submitMail(false).catch(function (error) {
      setMessage(error.message, true);
    });
  });

  mailList.addEventListener('click', function (event) {
    const starButton = event.target.closest('[data-star-thread]');
    if (starButton) {
      event.preventDefault();
      const threadId = Number(starButton.getAttribute('data-star-thread') || 0);
      if (threadId > 0) {
        const starredItem = state.items.find(function (entry) {
          return String(entry.threadId) === String(threadId);
        });
        const action = starredItem && starredItem.starredAt ? 'unstar' : 'star';
        const previous = state.activeItem;
        state.activeItem = starredItem || previous;
        updateCurrentThread(action).catch(function (error) {
          setMessage(error.message, true);
        });
      }
      return;
    }

    const item = event.target.closest('[data-mail-id]');
    if (!item) {
      return;
    }

    const mailId = Number(item.getAttribute('data-mail-id') || 0);
    if (mailId < 1) {
      return;
    }

    const selectedItem = state.items.find(function (entry) {
      return String(entry.mailId) === String(mailId);
    });
    if (!selectedItem) {
      return;
    }

    state.activeItem = selectedItem;
    openThread(selectedItem.threadId).catch(function (error) {
      setMessage(error.message, true);
    });
  });

  mailList.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    const item = event.target.closest('[data-mail-id]');
    if (!item) {
      return;
    }
    event.preventDefault();
    const threadId = Number(item.getAttribute('data-thread-id') || 0);
    if (threadId < 1) {
      return;
    }
    openThread(threadId).catch(function (error) {
      setMessage(error.message, true);
    });
  });

  if (requestTrackingList) {
    requestTrackingList.addEventListener('click', function (event) {
      const item = event.target.closest('[data-track-thread-id]');
      if (!item) {
        return;
      }
      const threadId = Number(item.getAttribute('data-track-thread-id') || 0);
      if (threadId < 1) {
        return;
      }
      openThread(threadId).catch(function (error) {
        setMessage(error.message, true);
      });
    });

    requestTrackingList.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      const item = event.target.closest('[data-track-thread-id]');
      if (!item) {
        return;
      }
      event.preventDefault();
      const threadId = Number(item.getAttribute('data-track-thread-id') || 0);
      if (threadId < 1) {
        return;
      }
      openThread(threadId).catch(function (error) {
        setMessage(error.message, true);
      });
    });
  }

  document.querySelectorAll('.mail-folder-btn').forEach(function (button) {
    button.addEventListener('click', function () {
      setActiveFolder(button.getAttribute('data-folder') || 'inbox');
      fetchList().catch(function (error) {
        setMessage(error.message, true);
      });
    });
  });

  document.querySelectorAll('.mail-module-btn').forEach(function (button) {
    button.addEventListener('click', function () {
      state.moduleFilter = button.getAttribute('data-mail-module') || 'general';
      if (composeModule) {
        composeModule.value = state.moduleFilter;
      }
      document.querySelectorAll('.mail-module-btn').forEach(function (btn) {
        btn.classList.toggle('is-active', btn === button);
      });
      updateFilterHint();
      if (!composeModal.hidden) {
        updateComposeLabels();
        updateComposeNoticeMode();
      }
      renderList();
    });
  });

  searchInput.addEventListener('input', function () {
    state.search = searchInput.value.trim();
    fetchList().catch(function (error) {
      setMessage(error.message, true);
    });
  });

  stationFilterSelect.addEventListener('change', function () {
    state.stationFilter = stationFilterSelect.value;
    state.search = searchInput.value.trim();
    fetchList().catch(function (error) {
      setMessage(error.message, true);
    });
  });

  unreadOnlyToggle.addEventListener('change', function () {
    state.unreadOnly = unreadOnlyToggle.checked;
    fetchList().catch(function (error) {
      setMessage(error.message, true);
    });
  });

  mailSortSelect.addEventListener('change', function () {
    state.sort = mailSortSelect.value || 'latest';
    renderList();
  });

  markReadBtn.addEventListener('click', function () {
    updateCurrentThread('mark-read').catch(function (error) {
      setMessage(error.message, true);
    });
  });

  archiveBtn.addEventListener('click', function () {
    updateCurrentThread('archive').catch(function (error) {
      setMessage(error.message, true);
    });
  });

  markUnreadBtn.addEventListener('click', function () {
    updateCurrentThread('mark-unread').catch(function (error) {
      setMessage(error.message, true);
    });
  });

  toggleStarBtn.addEventListener('click', function () {
    const action = state.activeItem && state.activeItem.starredAt ? 'unstar' : 'star';
    updateCurrentThread(action).catch(function (error) {
      setMessage(error.message, true);
    });
  });

  deleteBtn.addEventListener('click', function () {
    deleteCurrentThread().catch(function (error) {
      setMessage(error.message, true);
    });
  });

  async function init() {
    setMessage('Loading mail center...', false);
    try {
      await fetchBootstrap();
      setActiveFolder('inbox');
      await fetchList();
      setMessage('Mail center ready.', false);
    } catch (error) {
      setMessage(error.message, true);
      mailList.innerHTML = '<div class="mail-empty-list">Unable to load mail right now.</div>';
    }
  }

  document.addEventListener('keydown', function (event) {
    const target = event.target;
    const tag = target && target.tagName ? String(target.tagName).toLowerCase() : '';
    const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || (target && target.isContentEditable);

    if (event.key === 'Escape') {
      if (!composeModal.hidden) {
        closeCompose();
        return;
      }
      if (!threadModal.hidden) {
        closeThreadModal();
        return;
      }
    }

    if (event.key === '/' && !isTyping) {
      event.preventDefault();
      searchInput.focus();
      return;
    }

    if ((event.key === 'c' || event.key === 'C') && !isTyping) {
      event.preventDefault();
      openCompose();
      return;
    }

    if ((event.key === 'r' || event.key === 'R') && !isTyping && !composeModal.hidden) {
      return;
    }

    if ((event.key === 'r' || event.key === 'R') && !isTyping && state.activeItem) {
      event.preventDefault();
      const currentItem = state.activeItem;
      const threadData = {
        thread: { threadId: currentItem.threadId, subject: currentItem.subject || '' },
        messages: [{ mailId: currentItem.mailId, body: currentItem.body || '', importance: currentItem.importance || 'normal' }]
      };
      prepareReply(threadData);
    }
  });

  init();
})();