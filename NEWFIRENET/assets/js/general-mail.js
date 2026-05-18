(function () {
  const contextElement = document.getElementById('generalMailContext');
  const mailList = document.getElementById('mailList');
  const threadPanel = document.getElementById('threadPanel');
  const threadContent = document.getElementById('threadContent');
  const threadEmpty = document.getElementById('threadEmpty');
  const threadTitle = document.getElementById('threadTitle');
  const composeModal = document.getElementById('composeModal');
  const openComposeBtn = document.getElementById('openComposeBtn');
  const closeComposeBtn = document.getElementById('closeComposeBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const searchInput = document.getElementById('searchInput');
  const stationFilterSelect = document.getElementById('stationFilterSelect');
  const sortSelect = document.getElementById('sortSelect');
  const unreadOnlyToggle = document.getElementById('unreadOnlyToggle');
  const composeForm = document.getElementById('composeForm');
  const composeSubject = document.getElementById('composeSubject');
  const composeStationSelect = document.getElementById('composeStationSelect');
  const composeUserSelect = document.getElementById('composeUserSelect');
  const composeImportance = document.getElementById('composeImportance');
  const composeThreadId = document.getElementById('composeThreadId');
  const composeParentMailId = document.getElementById('composeParentMailId');
  const composeBody = document.getElementById('composeBody');
  const composeAttachments = document.getElementById('composeAttachments');
  const composeMessage = document.getElementById('composeMessage');
  const saveDraftBtn = document.getElementById('saveDraftBtn');
  const inboxCount = document.getElementById('inboxCount');
  const unreadCount = document.getElementById('unreadCount');
  const sentCount = document.getElementById('sentCount');
  const draftCount = document.getElementById('draftCount');
  const mailFolderTitle = document.getElementById('mailFolderTitle');
  const mailActiveFilter = document.getElementById('mailActiveFilter');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const markReadBtn = document.getElementById('markReadBtn');
  const markUnreadBtn = document.getElementById('markUnreadBtn');
  const starBtn = document.getElementById('starBtn');
  const archiveBtn = document.getElementById('archiveBtn');
  const trashBtn = document.getElementById('trashBtn');
  const quickFilters = document.getElementById('quickFilters');
  const inlineReplyContainer = document.getElementById('inlineReply');
  const inlineReplyForm = document.getElementById('inlineReplyForm');
  const inlineReplyThreadId = document.getElementById('inlineReplyThreadId');
  const inlineReplyParentMailId = document.getElementById('inlineReplyParentMailId');
  const inlineReplyBody = document.getElementById('inlineReplyBody');
  const inlineReplyAttachments = document.getElementById('inlineReplyAttachments');
  const inlineReplyCancel = document.getElementById('inlineReplyCancel');
  const inlineReplyMessage = document.getElementById('inlineReplyMessage');
  const showShortcutsBtn = document.getElementById('showShortcutsBtn');
  const threadActions = document.getElementById('threadActions');
  const threadReplyBtn = document.getElementById('threadReplyBtn');
  const threadMarkReadBtn = document.getElementById('threadMarkReadBtn');
  const threadMarkUnreadBtn = document.getElementById('threadMarkUnreadBtn');
  const threadStarBtn = document.getElementById('threadStarBtn');
  const threadArchiveBtn = document.getElementById('threadArchiveBtn');
  const threadDeleteBtn = document.getElementById('threadDeleteBtn');

  if (!contextElement || !mailList || !threadPanel || !threadContent || !threadEmpty || !threadTitle || !composeModal || !openComposeBtn || !closeComposeBtn || !refreshBtn || !searchInput || !stationFilterSelect || !sortSelect || !unreadOnlyToggle || !composeForm || !composeSubject || !composeStationSelect || !composeUserSelect || !composeImportance || !composeThreadId || !composeParentMailId || !composeBody || !composeAttachments || !composeMessage || !saveDraftBtn || !inboxCount || !unreadCount || !sentCount || !draftCount || !mailFolderTitle || !mailActiveFilter) {
    return;
  }

  const apiUrl = String((JSON.parse(contextElement.textContent || '{}') || {}).mailApiUrl || '/firenet/NEWFIRENET/backend/controllers/station_mails.php');
  const state = {
    folder: 'inbox',
    search: '',
    stationFilter: '',
    unreadOnly: false,
    sort: 'latest',
    bootstrap: null,
    items: [],
    activeThread: null,
    smartFilters: []
  };

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setMessage(text, isError) {
    composeMessage.textContent = text;
    composeMessage.style.color = isError ? '#b8333b' : '#1f5e2d';
  }

  function updateCounts(meta) {
    inboxCount.textContent = String((meta.folders && meta.folders.inbox) || 0);
    unreadCount.textContent = String((meta.folders && meta.folders.unread) || 0);
    sentCount.textContent = String((meta.folders && meta.folders.sent) || 0);
    draftCount.textContent = String((meta.folders && meta.folders.drafts) || 0);
  }

  function renderStationOptions() {
    const stations = Array.isArray(state.bootstrap.stations) ? state.bootstrap.stations : [];
    stationFilterSelect.innerHTML = '<option value="">All stations</option>' + stations.map(function (entry) {
      return '<option value="' + escapeHtml(String(entry.stationId)) + '">' + escapeHtml(entry.stationName) + '</option>';
    }).join('');

    composeStationSelect.innerHTML = '<option value="">Choose station</option>' + stations.map(function (entry) {
      return '<option value="' + escapeHtml(String(entry.stationId)) + '">' + escapeHtml(entry.stationName) + '</option>';
    }).join('');
  }

  function renderUserOptions() {
    const users = Array.isArray(state.bootstrap.networkUsers) ? state.bootstrap.networkUsers : [];
    composeUserSelect.innerHTML = users.map(function (user) {
      const label = (user.stationCode ? '[' + escapeHtml(user.stationCode) + '] ' : '') + escapeHtml(user.stationName) + ' — ' + escapeHtml(user.username);
      return '<option value="' + escapeHtml(String(user.userId)) + '">' + label + '</option>';
    }).join('');
  }

  function applyBootstrap(payload) {
    state.bootstrap = payload.data || {};
    updateCounts(state.bootstrap);
    renderStationOptions();
    renderUserOptions();
    mailActiveFilter.textContent = 'Showing general mail';
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  function visibleItems() {
    return (state.items || []).filter(function (item) {
      const isOperational = item.mailType === 'request' && item.requestFiles;
      if (isOperational) {
        return false;
      }
      const matchesStation = state.stationFilter === '' || String(item.senderStationId) === state.stationFilter;
      const matchesUnread = !state.unreadOnly || !item.readAt;
      const matchesSearch = state.search === '' || String(item.subject || '').toLowerCase().includes(state.search.toLowerCase()) || String(item.snippet || '').toLowerCase().includes(state.search.toLowerCase()) || String(item.senderUsername || '').toLowerCase().includes(state.search.toLowerCase());
      // client-side filter hints (server will apply filters too on fetch)
      if (Array.isArray(state.smartFilters) && state.smartFilters.length > 0) {
        for (const f of state.smartFilters) {
          if (f === 'unread' && item.readAt) return false;
          if (f === 'attachments' && (!item.attachmentCount || item.attachmentCount < 1)) return false;
          if (f === 'high' && (item.importance !== 'high' && item.importance !== 'urgent')) return false;
          if (f === 'station' && state.bootstrap && state.bootstrap.currentUser && Number(item.senderStationId) !== Number(state.bootstrap.currentUser.stationId)) return false;
        }
      }
      return matchesStation && matchesUnread && matchesSearch;
    }).sort(function (a, b) {
      if (state.sort === 'oldest') {
        return new Date(a.sentAt || a.createdAt).getTime() - new Date(b.sentAt || b.createdAt).getTime();
      }
      if (state.sort === 'unread') {
        const unreadA = a.readAt ? 1 : 0;
        const unreadB = b.readAt ? 1 : 0;
        if (unreadA !== unreadB) {
          return unreadA - unreadB;
        }
      }
      return new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime();
    });
  }

  function renderList() {
    const items = visibleItems();
    if (items.length === 0) {
      mailList.innerHTML = '<div class="mail-empty-list">No general mail messages found.</div>';
      return;
    }
    mailList.innerHTML = items.map(function (item) {
      const unreadClass = item.readAt ? '' : ' unread';
      const selectedClass = state.activeThread && state.activeThread.threadId === item.threadId ? ' is-active' : '';
      const snippet = escapeHtml(item.snippet || item.body || '');
      return '<article class="mail-list-item' + unreadClass + selectedClass + '" data-thread-id="' + escapeHtml(String(item.threadId)) + '" data-thread-mailid="' + escapeHtml(String(item.mailId)) + '">' +
        '<input type="checkbox" class="select-checkbox" data-thread-id="' + escapeHtml(String(item.threadId)) + '">' +
        '<div class="mail-list-title"><strong>' + escapeHtml(item.subject || '(No subject)') + '</strong><span>' + escapeHtml(formatDate(item.sentAt || item.createdAt)) + '</span></div>' +
        '<div class="mail-list-meta"><span>' + escapeHtml(item.senderStationName || '') + ' / ' + escapeHtml(item.senderUsername || '') + '</span>' +
        '<span class="mail-badge">' + escapeHtml(item.mailType || 'message') + '</span></div>' +
        '<p class="mail-list-snippet">' + snippet + '</p>' +
      '</article>';
    }).join('');
  }

  function getSelectedThreadIds() {
    return Array.from(mailList.querySelectorAll('.select-checkbox:checked')).map(function (el) {
      return Number(el.getAttribute('data-thread-id') || 0);
    }).filter(Boolean);
  }

  async function applyBulkAction(action) {
    const selected = getSelectedThreadIds();
    if (selected.length === 0) {
      setMessage('No messages selected.', true);
      return;
    }
    try {
      for (const threadId of selected) {
        const fd = new FormData();
        fd.append('action', action);
        fd.append('threadId', String(threadId));
        await fetch(apiUrl, { method: 'POST', body: fd, credentials: 'same-origin' });
      }
      await fetchBootstrap();
      await fetchList();
      setMessage('Bulk action completed.', false);
    } catch (err) {
      setMessage(err.message || 'Bulk action failed.', true);
    }
  }

  function renderThread(detail) {
    const thread = detail.thread || {};
    const messages = Array.isArray(detail.messages) ? detail.messages : [];
    threadTitle.textContent = thread.subject || 'Conversation';
    if (messages.length === 0) {
      threadContent.innerHTML = '<div class="mail-empty-list">No messages in this thread.</div>';
      threadContent.hidden = false;
      threadEmpty.hidden = true;
      return;
    }

    threadContent.innerHTML = messages.map(function (message) {
      const attachments = Array.isArray(message.attachments) ? message.attachments.map(function (attachment) {
        return '<a class="mail-attachment-link" href="' + escapeHtml(attachment.downloadUrl) + '" target="_blank" rel="noreferrer">' + escapeHtml(attachment.originalFileName) + '</a>';
      }).join('') : '';
      return '<article class="mail-thread-message" data-mail-id="' + escapeHtml(String(message.mailId)) + '">' +
        '<div class="mail-thread-message-head"><strong>' + escapeHtml(message.senderStationName || '') + '</strong><span>' + escapeHtml(formatDate(message.sentAt || message.createdAt)) + '</span></div>' +
        '<div class="mail-thread-message-meta"><span>' + escapeHtml(message.senderUsername || '') + '</span><span>' + escapeHtml(message.importance || 'normal') + '</span></div>' +
        '<p>' + escapeHtml(message.body || '') + '</p>' +
        (attachments ? '<div class="mail-attachments">' + attachments + '</div>' : '') +
        '<div class="thread-message-actions"><button type="button" class="inline-reply-btn secondary-btn" data-mail-id="' + escapeHtml(String(message.mailId)) + '">Reply</button> <button type="button" class="edit-msg-btn secondary-btn" data-mail-id="' + escapeHtml(String(message.mailId)) + '">Edit</button></div>' +
      '</article>';
    }).join('');

    threadContent.hidden = false;
    threadEmpty.hidden = true;
  }

  async function fetchBootstrap() {
    const response = await fetch(apiUrl + '?action=bootstrap', { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to load mail context.');
    }
    applyBootstrap(payload);
  }

  async function fetchList() {
    const query = new URLSearchParams({ action: 'list', folder: state.folder, search: state.search || '' });
    if (Array.isArray(state.smartFilters) && state.smartFilters.length > 0) {
      query.append('filter', state.smartFilters.join(','));
    }
    const response = await fetch(apiUrl + '?' + query.toString(), { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to load messages.');
    }
    state.items = Array.isArray(payload.items) ? payload.items : [];
    renderList();
  }

  async function openThread(threadId) {
    const response = await fetch(apiUrl + '?action=thread&threadId=' + encodeURIComponent(String(threadId)), { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true || !payload.data) {
      throw new Error((payload && payload.message) || 'Unable to load thread.');
    }
    state.activeThread = payload.data.thread || null;
    renderThread(payload.data);
    renderList();
    // Show thread actions when thread is open
    if (threadActions) {
      threadActions.hidden = false;
    }
    // Hide inline reply form when opening new thread
    if (inlineReplyContainer) {
      inlineReplyContainer.hidden = true;
    }
  }

  function openCompose() {
    composeModal.hidden = false;
    document.body.style.overflow = 'hidden';
    setMessage('', false);
  }

  function closeCompose() {
    composeModal.hidden = true;
    document.body.style.overflow = '';
    composeForm.reset();
    composeSubject.value = '';
    composeBody.value = '';
    composeAttachments.value = '';
    composeStationSelect.value = '';
    renderUserOptions();
  }

  function selectedRecipients() {
    return Array.from(composeUserSelect.selectedOptions).map(function (option) {
      return Number(option.value || 0);
    }).filter(function (id) {
      return id > 0;
    });
  }

  function selectedStationIds() {
    const stationId = Number(composeStationSelect.value || 0);
    return stationId > 0 ? [stationId] : [];
  }

  async function submitMail(isDraft) {
    const subject = composeSubject.value.trim();
    const body = composeBody.value.trim();
    const recipients = selectedRecipients();
    const stations = selectedStationIds();
    const files = Array.from(composeAttachments.files || []);

    if (!isDraft && subject === '' && body === '' && files.length === 0) {
      throw new Error('Write a message or attach files before sending.');
    }

    if (!isDraft && recipients.length === 0 && stations.length === 0) {
      throw new Error('Select at least one recipient user or station.');
    }

    const formData = new FormData();
    formData.append('action', isDraft ? 'save-draft' : 'send');
    if (composeThreadId.value) {
      formData.append('threadId', composeThreadId.value);
    }
    if (composeParentMailId.value) {
      formData.append('parentMailId', composeParentMailId.value);
    }
    formData.append('subject', subject);
    formData.append('body', body);
    formData.append('mailType', 'message');
    formData.append('importance', composeImportance.value || 'normal');
    formData.append('requestFiles', '0');
    recipients.forEach(function (userId) {
      formData.append('recipientUserIds[]', String(userId));
    });
    stations.forEach(function (stationId) {
      formData.append('recipientStationIds[]', String(stationId));
    });
    files.forEach(function (file) {
      formData.append('attachments[]', file);
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to submit message.');
    }
    setMessage(payload.message || (isDraft ? 'Draft saved.' : 'Message sent.'), false);
    closeCompose();
    await fetchBootstrap();
    await fetchList();
  }

  async function updateThreadAction(action, threadId) {
    if (!threadId && !state.activeThread) {
      return;
    }
    const id = threadId || state.activeThread.threadId;
    const formData = new FormData();
    formData.append('action', action);
    formData.append('threadId', String(id));

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to update thread.');
    }
    await fetchList();
    if (state.activeThread && state.activeThread.threadId === id) {
      await openThread(id);
    }
  }

  openComposeBtn.addEventListener('click', openCompose);
  closeComposeBtn.addEventListener('click', closeCompose);
  refreshBtn.addEventListener('click', function () {
    fetchList().catch(function (error) { setMessage(error.message, true); });
  });
  composeForm.addEventListener('submit', function (event) {
    event.preventDefault();
    submitMail(false).catch(function (error) { setMessage(error.message, true); });
  });
  saveDraftBtn.addEventListener('click', function () {
    submitMail(true).catch(function (error) { setMessage(error.message, true); });
  });
  composeStationSelect.addEventListener('change', renderUserOptions);
  searchInput.addEventListener('input', function () {
    state.search = searchInput.value.trim();
    renderList();
  });
  stationFilterSelect.addEventListener('change', function () {
    state.stationFilter = stationFilterSelect.value;
    renderList();
  });
  sortSelect.addEventListener('change', function () {
    state.sort = sortSelect.value || 'latest';
    renderList();
  });
  unreadOnlyToggle.addEventListener('change', function () {
    state.unreadOnly = unreadOnlyToggle.checked;
    renderList();
  });

  // Folder navigation
  document.querySelectorAll('.mail-folder-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const folder = btn.getAttribute('data-folder');
      state.folder = folder;
      state.activeThread = null;

      // Update active button
      document.querySelectorAll('.mail-folder-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      // Update title
      const titles = {
        'inbox': 'Inbox',
        'sent': 'Sent',
        'drafts': 'Drafts'
      };
      mailFolderTitle.textContent = titles[folder] || 'Inbox';

      // Fetch and render
      fetchList().catch(function (error) { setMessage(error.message, true); });
      threadEmpty.hidden = false;
      threadContent.hidden = true;
      threadTitle.textContent = 'Select a message';
    });
  });

  mailList.addEventListener('click', function (event) {
    if (event.target.classList && event.target.classList.contains('select-checkbox')) {
      return; // ignore checkbox clicks
    }
    const item = event.target.closest('[data-thread-id]');
    if (!item) return;
    openThread(Number(item.getAttribute('data-thread-id') || 0)).catch(function (error) { setMessage(error.message, true); });
  });

  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', function () {
      const checkboxes = Array.from(mailList.querySelectorAll('.select-checkbox'));
      const anyUnchecked = checkboxes.some(function (c) { return !c.checked; });
      checkboxes.forEach(function (c) { c.checked = anyUnchecked; });
    });
  }

  // Smart action handler: works on active thread OR selected items
  function smartAction(action) {
    if (action === 'reply') {
      if (state.activeThread) {
        if (!inlineReplyContainer) {
          setMessage('Reply form not available.', true);
          return;
        }
        inlineReplyContainer.hidden = false;
        inlineReplyThreadId.value = String(state.activeThread.threadId || '');
        inlineReplyParentMailId.value = '';
        inlineReplyBody.value = '';
        inlineReplyBody.focus();
      } else {
        setMessage('Open a message to reply.', true);
      }
      return;
    }

    const selected = getSelectedThreadIds();
    const activeThreadId = state.activeThread && state.activeThread.threadId ? Number(state.activeThread.threadId) : 0;

    if (selected.length === 0 && !activeThreadId) {
      setMessage('Select or open a message to perform this action.', true);
      return;
    }

    if (selected.length === 0 && activeThreadId) {
      updateThreadAction(action, activeThreadId).catch(function (err) {
        setMessage('✗ ' + (err.message || 'Action failed'), true);
      });
      return;
    }

    const threadIds = selected;

    // Execute action asynchronously
    (async function() {
      try {
        for (const threadId of threadIds) {
          const fd = new FormData();
          fd.append('action', action);
          fd.append('threadId', String(threadId));
          const response = await fetch(apiUrl, { method: 'POST', body: fd, credentials: 'same-origin' });
          const result = await response.json();
          if (!result.ok) {
            throw new Error(result.message || 'Action failed');
          }
        }
        await fetchBootstrap();
        await fetchList();
        if (state.activeThread && state.activeThread.threadId && action !== 'delete') {
          await openThread(Number(state.activeThread.threadId));
        }
        setMessage('✓ Action completed', false);
      } catch (err) {
        setMessage('✗ ' + (err.message || 'Action failed'), true);
      }
    })();
  }

  if (markReadBtn) markReadBtn.addEventListener('click', function () { smartAction('mark-read'); });
  if (markUnreadBtn) markUnreadBtn.addEventListener('click', function () { smartAction('mark-unread'); });
  if (starBtn) starBtn.addEventListener('click', function () { smartAction('star'); });
  if (archiveBtn) archiveBtn.addEventListener('click', function () { smartAction('archive'); });
  if (trashBtn) trashBtn.addEventListener('click', function () { smartAction('delete'); });

  // Thread action buttons (in the thread detail panel header)
  if (threadReplyBtn) threadReplyBtn.addEventListener('click', function () { smartAction('reply'); });
  if (threadMarkReadBtn) threadMarkReadBtn.addEventListener('click', function () { smartAction('mark-read'); });
  if (threadMarkUnreadBtn) threadMarkUnreadBtn.addEventListener('click', function () { smartAction('mark-unread'); });
  if (threadStarBtn) threadStarBtn.addEventListener('click', function () { smartAction('star'); });
  if (threadArchiveBtn) threadArchiveBtn.addEventListener('click', function () { smartAction('archive'); });
  if (threadDeleteBtn) threadDeleteBtn.addEventListener('click', function () { smartAction('delete'); });

  // attachment preview modal handlers
  const attachmentPreviewModal = document.getElementById('attachmentPreviewModal');
  const attachmentPreviewContent = document.getElementById('attachmentPreviewContent');
  const attachmentPreviewTitle = document.getElementById('attachmentPreviewTitle');
  const closeAttachmentPreviewBtn = document.getElementById('closeAttachmentPreviewBtn');
  if (closeAttachmentPreviewBtn) {
    closeAttachmentPreviewBtn.addEventListener('click', function () {
      if (!attachmentPreviewModal) return;
      attachmentPreviewModal.hidden = true;
      attachmentPreviewContent.innerHTML = '';
    });
  }

  document.addEventListener('click', function (event) {
    const att = event.target.closest('.mail-attachment-link');
    if (!att) return;
    event.preventDefault();
    const url = att.getAttribute('href');
    const name = att.textContent || 'Attachment';
    if (!attachmentPreviewModal) return;
    attachmentPreviewTitle.textContent = name;
    // simple preview for images; otherwise provide download link
    if (/\.(jpe?g|png|gif|webp|svg)$/i.test(url)) {
      attachmentPreviewContent.innerHTML = '<img src="' + escapeHtml(url) + '" alt="' + escapeHtml(name) + '">';
    } else {
      attachmentPreviewContent.innerHTML = '<p><a href="' + escapeHtml(url) + '" target="_blank" rel="noreferrer">Open attachment</a></p>';
    }
    attachmentPreviewModal.hidden = false;
  });

  // thread message actions (reply/edit)
  threadContent.addEventListener('click', function (event) {
    const replyBtn = event.target.closest('.inline-reply-btn');
    if (replyBtn) {
      const mailId = Number(replyBtn.getAttribute('data-mail-id') || 0);
      if (!inlineReplyContainer || !inlineReplyForm) return;
      inlineReplyContainer.hidden = false;
      inlineReplyThreadId.value = String(state.activeThread.threadId || '');
      inlineReplyParentMailId.value = String(mailId || '');
      inlineReplyBody.value = '';
      inlineReplyBody.focus();
      return;
    }

    const editBtn = event.target.closest('.edit-msg-btn');
    if (editBtn) {
      const mailId = Number(editBtn.getAttribute('data-mail-id') || 0);
      // open compose populated for reply/edit
      openCompose();
      composeThreadId.value = String(state.activeThread.threadId || '');
      composeParentMailId.value = String(mailId || '');
      // attempt to load message body from rendered DOM
      const article = event.target.closest('article[data-mail-id]');
      if (article) {
        const p = article.querySelector('p');
        composeBody.value = p ? p.textContent || '' : '';
      }
      composeBody.focus();
      return;
    }
  });

  // Keyboard shortcuts state
  const shortcutState = { lastKey: null, lastKeyTime: 0 };
  const SHORTCUT_TIMEOUT = 1500; // ms for multi-key sequences

  function isInputFocused() {
    return document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
  }

  // Main keyboard shortcut handler
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !composeModal.hidden) {
      closeCompose();
      return;
    }
  });

  document.addEventListener('keydown', function (e) {
    // Skip if user is typing in input/textarea
    if (isInputFocused()) return;

    // Check for multi-key sequences (g + letter)
    if (e.key === 'g') {
      e.preventDefault();
      shortcutState.lastKey = 'g';
      shortcutState.lastKeyTime = Date.now();
      return;
    }

    // Handle 'g' sequences
    if (shortcutState.lastKey === 'g' && Date.now() - shortcutState.lastKeyTime < SHORTCUT_TIMEOUT) {
      shortcutState.lastKey = null;
      if (e.key === 'i') {
        e.preventDefault();
        state.folder = 'inbox';
        fetchList().catch(function(err) { setMessage(err.message, true); });
        return;
      }
      if (e.key === 's') {
        e.preventDefault();
        state.folder = 'sent';
        fetchList().catch(function(err) { setMessage(err.message, true); });
        return;
      }
      if (e.key === 'd') {
        e.preventDefault();
        state.folder = 'drafts';
        fetchList().catch(function(err) { setMessage(err.message, true); });
        return;
      }
      if (e.key === 'a') {
        e.preventDefault();
        state.folder = 'archive';
        fetchList().catch(function(err) { setMessage(err.message, true); });
        return;
      }
    }

    // Check for '*' sequences (selection)
    if (e.key === '*') {
      e.preventDefault();
      shortcutState.lastKey = '*';
      shortcutState.lastKeyTime = Date.now();
      return;
    }

    if (shortcutState.lastKey === '*' && Date.now() - shortcutState.lastKeyTime < SHORTCUT_TIMEOUT) {
      shortcutState.lastKey = null;
      if (e.key === 'a') {
        e.preventDefault();
        if (selectAllBtn) selectAllBtn.click();
        return;
      }
      if (e.key === 'n') {
        e.preventDefault();
        document.querySelectorAll('.mail-list-item input[type="checkbox"]').forEach(function(cb) {
          cb.checked = false;
        });
        return;
      }
    }

    // Single-key shortcuts
    shortcutState.lastKey = null;

    if (e.key === '?') {
      e.preventDefault();
      openShortcutsModal();
      return;
    }

    if (e.key === '/') {
      e.preventDefault();
      searchInput.focus();
      return;
    }

    if (e.key === 'c') {
      e.preventDefault();
      openCompose();
      composeSubject.focus();
      return;
    }

    if (e.key === 'l') {
      e.preventDefault();
      if (quickFilters) {
        quickFilters.style.display = quickFilters.style.display === 'none' ? 'flex' : 'none';
      }
      return;
    }

    if (e.key === 'z') {
      e.preventDefault();
      if (refreshBtn) refreshBtn.click();
      return;
    }

    if (e.key === 'x') {
      e.preventDefault();
      const activeItem = mailList.querySelector('.mail-list-item.is-active');
      if (activeItem) {
        const checkbox = activeItem.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = !checkbox.checked;
      }
      return;
    }

    // Thread-specific actions (only if a thread is active)
    if (!state.activeThread) return;

    if (e.key === 'j') {
      e.preventDefault();
      const next = mailList.querySelector('.mail-list-item:not(.is-active)');
      if (next) next.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (e.key === 'k') {
      e.preventDefault();
      mailList.scrollBy({ top: -120, behavior: 'smooth' });
      return;
    }

    if (e.key === 'o') {
      e.preventDefault();
      const active = mailList.querySelector('.mail-list-item.is-active');
      if (active) openThread(Number(active.getAttribute('data-thread-id') || 0)).catch(function(err) { setMessage(err.message, true); });
      return;
    }

    if (e.key === 'r') {
      e.preventDefault();
      openCompose();
      composeThreadId.value = String(state.activeThread.threadId || '');
      composeSubject.value = 'Re: ' + (state.activeThread.subject || '');
      composeBody.focus();
      return;
    }

    if (e.key === 'a') {
      e.preventDefault();
      openCompose();
      composeThreadId.value = String(state.activeThread.threadId || '');
      composeSubject.value = 'Re: ' + (state.activeThread.subject || '');
      composeBody.focus();
      return;
    }

    if (e.key === 's') {
      e.preventDefault();
      smartAction('star');
      return;
    }

    if (e.key === 'm') {
      e.preventDefault();
      smartAction('mark-read');
      return;
    }

    if (e.key === 'u') {
      e.preventDefault();
      smartAction('mark-unread');
      return;
    }

    if (e.key === 'e') {
      e.preventDefault();
      smartAction('archive');
      return;
    }

    if (e.key === '#') {
      e.preventDefault();
      smartAction('delete');
      return;
    }

    if (e.key === '!') {
      e.preventDefault();
      smartAction('spam');
      return;
    }
  });

  // inline reply submit
  if (inlineReplyForm) {
    inlineReplyForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const threadId = Number(inlineReplyThreadId.value || 0);
      const parentMailId = Number(inlineReplyParentMailId.value || 0);
      const body = inlineReplyBody.value.trim();
      const files = Array.from(inlineReplyAttachments.files || []);
      if (!body && files.length === 0) {
        inlineReplyMessage.textContent = 'Write a reply or attach files before sending.';
        inlineReplyMessage.style.color = '#b8333b';
        return;
      }
      const fd = new FormData();
      fd.append('action', 'reply');
      fd.append('threadId', String(threadId));
      if (parentMailId > 0) fd.append('parentMailId', String(parentMailId));
      fd.append('body', body);
      files.forEach(function (f) { fd.append('attachments[]', f); });
      fetch(apiUrl, { method: 'POST', body: fd, credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (payload) {
          if (!payload || payload.ok !== true) {
            inlineReplyMessage.textContent = (payload && payload.message) || 'Reply failed.';
            inlineReplyMessage.style.color = '#b8333b';
            return;
          }
          inlineReplyMessage.textContent = 'Reply sent.';
          inlineReplyMessage.style.color = '#1f5e2d';
          inlineReplyForm.reset();
          inlineReplyContainer.hidden = true;
          fetchBootstrap().then(fetchList).then(function () { openThread(threadId).catch(function (e) { setMessage(e.message, true); }); });
        }).catch(function (err) {
          inlineReplyMessage.textContent = err.message || 'Reply error.';
          inlineReplyMessage.style.color = '#b8333b';
        });
    });
  }

  if (inlineReplyCancel) {
    inlineReplyCancel.addEventListener('click', function () {
      if (!inlineReplyContainer) return;
      inlineReplyContainer.hidden = true;
      inlineReplyForm.reset();
    });
  }

  // quick filters
  if (quickFilters) {
    quickFilters.addEventListener('click', function (ev) {
      const btn = ev.target.closest('button[data-filter]');
      if (!btn) return;
      const f = btn.getAttribute('data-filter');
      if (f === 'clear') {
        state.smartFilters = [];
        // remove active classes
        Array.from(quickFilters.querySelectorAll('button[data-filter]')).forEach(function (b) { b.classList.remove('is-active-filter'); });
        // reload from server
        fetchList().catch(function (e) { setMessage(e.message, true); });
        return;
      }

      const idx = state.smartFilters.indexOf(f);
      if (idx === -1) {
        state.smartFilters.push(f);
        btn.classList.add('is-active-filter');
      } else {
        state.smartFilters.splice(idx, 1);
        btn.classList.remove('is-active-filter');
      }
      // fetch server-side filtered list
      fetchList().catch(function (e) { setMessage(e.message, true); });
    });
  }

  // Shortcuts modal
  function openShortcutsModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'shortcuts-modal-backdrop';
    
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-modal-header">
        <h2>⌨️ Keyboard Shortcuts</h2>
        <button class="shortcuts-modal-close" type="button">✕</button>
      </div>
      <div class="shortcuts-modal-content">
        <div>
          <div class="shortcuts-group">
            <strong>Navigation</strong>
            <div class="shortcut-item"><kbd>j</kbd><span>Next message</span></div>
            <div class="shortcut-item"><kbd>k</kbd><span>Previous</span></div>
            <div class="shortcut-item"><kbd>o</kbd><span>Open</span></div>
            <div class="shortcut-item"><kbd>/</kbd><span>Search</span></div>
          </div>
        </div>
        <div>
          <div class="shortcuts-group">
            <strong>Compose & Reply</strong>
            <div class="shortcut-item"><kbd>c</kbd><span>Compose</span></div>
            <div class="shortcut-item"><kbd>r</kbd><span>Reply</span></div>
            <div class="shortcut-item"><kbd>a</kbd><span>Reply all</span></div>
            <div class="shortcut-item"><kbd>Esc</kbd><span>Close</span></div>
          </div>
        </div>
        <div>
          <div class="shortcuts-group">
            <strong>Actions</strong>
            <div class="shortcut-item"><kbd>s</kbd><span>Star</span></div>
            <div class="shortcut-item"><kbd>m</kbd><span>Mark read</span></div>
            <div class="shortcut-item"><kbd>u</kbd><span>Mark unread</span></div>
            <div class="shortcut-item"><kbd>e</kbd><span>Archive</span></div>
            <div class="shortcut-item"><kbd>#</kbd><span>Delete</span></div>
          </div>
        </div>
        <div>
          <div class="shortcuts-group">
            <strong>Selection</strong>
            <div class="shortcut-item"><kbd>x</kbd><span>Select</span></div>
            <div class="shortcut-item"><kbd>*a</kbd><span>Select all</span></div>
            <div class="shortcut-item"><kbd>*n</kbd><span>Deselect</span></div>
          </div>
        </div>
        <div>
          <div class="shortcuts-group">
            <strong>Folders</strong>
            <div class="shortcut-item"><kbd>gi</kbd><span>Inbox</span></div>
            <div class="shortcut-item"><kbd>gs</kbd><span>Sent</span></div>
            <div class="shortcut-item"><kbd>gd</kbd><span>Drafts</span></div>
            <div class="shortcut-item"><kbd>ga</kbd><span>Archive</span></div>
          </div>
        </div>
        <div>
          <div class="shortcuts-group">
            <strong>Other</strong>
            <div class="shortcut-item"><kbd>?</kbd><span>Help</span></div>
            <div class="shortcut-item"><kbd>l</kbd><span>Filters</span></div>
            <div class="shortcut-item"><kbd>z</kbd><span>Refresh</span></div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.shortcuts-modal-close');
    const closeModal = function() {
      modal.remove();
      backdrop.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    
    document.addEventListener('keydown', function closeOnEsc(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', closeOnEsc);
      }
    });
  }
  
  if (showShortcutsBtn) {
    showShortcutsBtn.addEventListener('click', openShortcutsModal);
  }

  // Context menu for mail items
  function showContextMenu(event, threadId, threadMailId) {
    event.preventDefault();
    event.stopPropagation();

    // Remove any existing menu
    const existingMenu = document.querySelector('.mail-context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'mail-context-menu';
    menu.innerHTML = `
      <div class="mail-context-menu-item" data-action="reply">✏️ Reply</div>
      <div class="mail-context-menu-item" data-action="mark-read">👁️ Mark as read</div>
      <div class="mail-context-menu-item" data-action="mark-unread">💬 Mark as unread</div>
      <div class="mail-context-menu-item" data-action="star">⭐ Star</div>
      <div class="mail-context-menu-item" data-action="archive">📁 Archive</div>
      <div class="mail-context-menu-item danger" data-action="delete">🗑️ Delete</div>
    `;

    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';

    document.body.appendChild(menu);

    // Handle menu item clicks
    menu.addEventListener('click', function(e) {
      const item = e.target.closest('.mail-context-menu-item');
      if (!item) return;

      const action = item.getAttribute('data-action');
      if (action === 'reply') {
        openThread(threadId).then(function () {
          inlineReplyContainer.hidden = false;
          inlineReplyThreadId.value = String(threadId || '');
          inlineReplyParentMailId.value = '';
          inlineReplyBody.value = '';
          inlineReplyBody.focus();
        }).catch(function (err) { setMessage(err.message, true); });
      } else {
        updateThreadAction(action, threadId).catch(function (err) { setMessage(err.message, true); });
      }
      menu.remove();
    });

    // Close menu when clicking elsewhere (only once)
    const closeHandler = function(e) {
      if (!e.target.closest('.mail-context-menu')) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(function() {
      document.addEventListener('click', closeHandler);
    }, 0);
  }

  // Attach context menu to mail list items (after render)
  function attachContextMenuListeners() {
    Array.from(mailList.querySelectorAll('.mail-list-item')).forEach(function (item) {
      item.addEventListener('contextmenu', function (e) {
        const threadId = Number(item.getAttribute('data-thread-id') || 0);
        const threadMailId = Number(item.getAttribute('data-thread-mailid') || 0);
        showContextMenu(e, threadId, threadMailId);
      });
    });
  }

  // Update renderList to attach context menu listeners
  const originalRenderList = renderList;
  renderList = function () {
    originalRenderList();
    attachContextMenuListeners();
  };

  async function init() {
    try {
      setMessage('Loading general mail...', false);
      await fetchBootstrap();
      await fetchList();
      setMessage('Ready.', false);
    } catch (error) {
      setMessage(error.message, true);
      mailList.innerHTML = '<div class="mail-empty-list">Unable to load messages.</div>';
    }
  }

  init();
})();
