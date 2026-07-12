(function () {
  const contextElement = document.getElementById('generalMailContext');
  const mailBackLink = document.getElementById('mailBackLink');
  const composeChooserModal = document.getElementById('composeChooserModal');
  const closeComposeChooserBtn = document.getElementById('closeComposeChooserBtn');
  const openGeneralComposeBtn = document.getElementById('openGeneralComposeBtn');
  const openRequestComposeBtn = document.getElementById('openRequestComposeBtn');
  const mailList = document.getElementById('mailList');
  const mailListPanel = document.getElementById('mailListPanel');
  const mailMain = document.querySelector('.mail-main');
  const backToListBtn = document.getElementById('backToListBtn');
  const threadRequestSummaryInline = document.getElementById('threadRequestSummaryInline');
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
  const composeUserSearch = document.getElementById('composeUserSearch');
  const composeUserResults = document.getElementById('composeUserResults');
  const composeRecipientChips = document.getElementById('composeRecipientChips');
  const composeAttachFilesBtn = document.getElementById('composeAttachFilesBtn');
  const composeAttachmentList = document.getElementById('composeAttachmentList');
  const composeImportance = document.getElementById('composeImportance');
  const composeThreadId = document.getElementById('composeThreadId');
  const composeParentMailId = document.getElementById('composeParentMailId');
  const composeBody = document.getElementById('composeBody');
  const composeBodyEditor = document.getElementById('composeBodyEditor');
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
  const inlineReplyBodyEditor = document.getElementById('inlineReplyBodyEditor');
  const inlineReplyAttachments = document.getElementById('inlineReplyAttachments');
  const inlineReplyCancel = document.getElementById('inlineReplyCancel');
  const inlineReplyDiscard = document.getElementById('inlineReplyDiscard');
  const inlineReplyMessage = document.getElementById('inlineReplyMessage');
  const inlineReplyToLabel = document.getElementById('inlineReplyToLabel');
  const inlineReplyAttachName = document.getElementById('inlineReplyAttachName');
  const mailApp = document.querySelector('.mail-app');
  const showShortcutsBtn = document.getElementById('showShortcutsBtn');
  const threadActions = document.getElementById('threadActions');
  const threadReplyBtn = document.getElementById('threadReplyBtn');
  const threadMarkReadBtn = document.getElementById('threadMarkReadBtn');
  const threadMarkUnreadBtn = document.getElementById('threadMarkUnreadBtn');
  const threadStarBtn = document.getElementById('threadStarBtn');
  const threadArchiveBtn = document.getElementById('threadArchiveBtn');
  const threadDeleteBtn = document.getElementById('threadDeleteBtn');
  const requestComposeModal = document.getElementById('requestComposeModal');
  const closeRequestComposeBtn = document.getElementById('closeRequestComposeBtn');
  const requestComposeForm = document.getElementById('requestComposeForm');
  const requestComposeSubject = document.getElementById('requestComposeSubject');
  const requestComposeRoutedToLabel = document.getElementById('requestComposeRoutedToLabel');
  const requestComposeRefIncidentDateFrom = document.getElementById('requestComposeRefIncidentDateFrom');
  const requestComposeRefIncidentDateTo = document.getElementById('requestComposeRefIncidentDateTo');
  const requestComposeRefAllResponders = document.getElementById('requestComposeRefAllResponders');
  const requestComposeRefRespondersList = document.getElementById('requestComposeRefRespondersList');
  const requestComposeRefLocation = document.getElementById('requestComposeRefLocation');
  const requestComposeRefCaseId = document.getElementById('requestComposeRefCaseId');
  const requestComposeBody = document.getElementById('requestComposeBody');
  const requestComposeAttachFilesBtn = document.getElementById('requestComposeAttachFilesBtn');
  const requestComposeLocalAttachments = document.getElementById('requestComposeLocalAttachments');
  const requestComposeAttachmentList = document.getElementById('requestComposeAttachmentList');
  const requestComposeMessage = document.getElementById('requestComposeMessage');
  const saveRequestDraftBtn = document.getElementById('saveRequestDraftBtn');
  const requestThreadModal = document.getElementById('requestThreadModal');
  const closeRequestThreadBtn = document.getElementById('closeRequestThreadBtn');
  const requestThreadTitle = document.getElementById('requestThreadTitle');
  const requestThreadModalKicker = document.getElementById('requestThreadModalKicker');
  const requestThreadTimeline = document.getElementById('requestThreadTimeline');
  const requestTimelineRequestTitle = document.getElementById('requestTimelineRequestTitle');
  const requestTimelineSteps = document.getElementById('requestTimelineSteps');
  const requestTimelineNote = document.getElementById('requestTimelineNote');
  const requestThreadSummary = document.getElementById('requestThreadSummary');
  const requestThreadContent = document.getElementById('requestThreadContent');

  if (!contextElement || !mailList || !threadPanel || !threadContent || !threadEmpty || !threadTitle || !composeModal || !openComposeBtn || !closeComposeBtn || !refreshBtn || !searchInput || !stationFilterSelect || !sortSelect || !unreadOnlyToggle || !composeForm || !composeSubject || !composeStationSelect || !composeUserSelect || !composeImportance || !composeThreadId || !composeParentMailId || !composeBody || !composeAttachments || !composeMessage || !saveDraftBtn || !inboxCount || !unreadCount || !sentCount || !draftCount || !mailFolderTitle || !mailActiveFilter) {
    return;
  }

  const attachmentPreviewModal = document.getElementById('attachmentPreviewModal');

  function mountMailModalsToBody() {
    [composeChooserModal, composeModal, requestComposeModal, requestThreadModal, attachmentPreviewModal].forEach(function (el) {
      if (el && el.parentElement !== document.body) {
        document.body.appendChild(el);
      }
    });
  }

  function syncMailModalScrollLock() {
    const anyOpen =
      !composeModal.hidden ||
      !(composeChooserModal && composeChooserModal.hidden) ||
      !(requestComposeModal && requestComposeModal.hidden) ||
      !(requestThreadModal && requestThreadModal.hidden) ||
      (attachmentPreviewModal && !attachmentPreviewModal.hidden);
    document.body.classList.toggle('mail-modal-open', anyOpen);
  }

  const apiUrl = String((JSON.parse(contextElement.textContent || '{}') || {}).mailApiUrl || '/firenet/NEWFIRENET/backend/controllers/station_mails.php');
  const pageContext = JSON.parse(contextElement.textContent || '{}') || {};
  const state = {
    folder: 'inbox',
    search: '',
    stationFilter: '',
    unreadOnly: false,
    sort: 'latest',
    bootstrap: null,
    items: [],
    activeThread: null,
    activeRequestDetail: null,
    conversationOpen: false,
    listScrollTop: 0,
    pageScrollY: 0,
    smartFilters: [],
    requestLocalAttachments: [],
    composeSelectedRecipients: [],
    composeLocalAttachments: [],
    inlineReplyLocalAttachments: [],
    requestTimelineSelectedIndex: 0
  };

  function isCentralStation() {
    return Boolean(pageContext.isCentralStation);
  }

  function formatMessageBody(body) {
    const value = String(body || '');
    if (/<[a-z][\s\S]*>/i.test(value)) {
      return '<div class="mail-thread-message-body">' + value + '</div>';
    }
    if (value === '') {
      return '';
    }
    return '<div class="mail-thread-message-body">' + escapeHtml(value).replace(/\n/g, '<br>') + '</div>';
  }

  function getEditorHtml(editorEl) {
    return editorEl ? String(editorEl.innerHTML || '').trim() : '';
  }

  function isEditorEmpty(editorEl) {
    const text = getEditorHtml(editorEl)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .trim();
    return text === '';
  }

  function setEditorHtml(editorEl, hiddenField, value) {
    if (!editorEl) {
      return;
    }
    const html = String(value || '');
    if (/<[a-z][\s\S]*>/i.test(html)) {
      editorEl.innerHTML = html;
    } else if (html === '') {
      editorEl.innerHTML = '';
    } else {
      editorEl.innerHTML = escapeHtml(html).replace(/\n/g, '<br>');
    }
    if (hiddenField) {
      hiddenField.value = getEditorHtml(editorEl);
    }
  }

  function syncEditorToHidden(editorEl, hiddenField) {
    if (hiddenField) {
      hiddenField.value = getEditorHtml(editorEl);
    }
  }

  function getComposeBodyHtml() {
    return getEditorHtml(composeBodyEditor);
  }

  function getInlineReplyBodyHtml() {
    return getEditorHtml(inlineReplyBodyEditor);
  }

  function clearComposeBody() {
    setEditorHtml(composeBodyEditor, composeBody, '');
  }

  function renderInlineReplyAttachments() {
    if (!inlineReplyAttachName) {
      return;
    }
    if (!state.inlineReplyLocalAttachments.length) {
      inlineReplyAttachName.textContent = '';
      return;
    }
    inlineReplyAttachName.textContent = state.inlineReplyLocalAttachments.map(function (file) {
      return file.name;
    }).join(', ');
  }

  function clearInlineReplyAttachments() {
    state.inlineReplyLocalAttachments = [];
    if (inlineReplyAttachments) {
      inlineReplyAttachments.value = '';
    }
    renderInlineReplyAttachments();
  }

  function clearInlineReplyBody() {
    setEditorHtml(inlineReplyBodyEditor, inlineReplyBody, '');
  }

  function getEditorByKey(key) {
    if (key === 'compose') return composeBodyEditor;
    if (key === 'inlineReply') return inlineReplyBodyEditor;
    return null;
  }

  function getHiddenByKey(key) {
    if (key === 'compose') return composeBody;
    if (key === 'inlineReply') return inlineReplyBody;
    return null;
  }

  function runEditorCommand(editorKey, command, value) {
    const editorEl = getEditorByKey(editorKey);
    if (!editorEl || !command) return;
    editorEl.focus();
    let arg = value == null ? null : value;

    if (command === 'createLink') {
      const url = window.prompt('Enter link URL', 'https://');
      if (!url) return;
      arg = url;
    } else if (command === 'formatBlock') {
      arg = value || 'blockquote';
    } else if (command === 'fontName' && !arg) {
      arg = 'Arial';
    } else if (command === 'fontSize' && !arg) {
      arg = '3';
    }

    try {
      document.execCommand(command, false, arg);
    } catch (ignored) {
      // Some browsers reject unsupported commands.
    }
    syncEditorToHidden(editorEl, getHiddenByKey(editorKey));
  }

  function bindRichEditor(editorKey) {
    const editorEl = getEditorByKey(editorKey);
    const hiddenField = getHiddenByKey(editorKey);
    if (!editorEl) return;

    editorEl.addEventListener('input', function () {
      syncEditorToHidden(editorEl, hiddenField);
    });
    editorEl.addEventListener('blur', function () {
      syncEditorToHidden(editorEl, hiddenField);
    });

    document.querySelectorAll('.mail-compose-tool[data-editor="' + editorKey + '"]').forEach(function (button) {
      button.addEventListener('mousedown', function (event) {
        event.preventDefault();
      });
      button.addEventListener('click', function () {
        runEditorCommand(editorKey, button.getAttribute('data-cmd'), button.getAttribute('data-value'));
      });
    });

    document.querySelectorAll('.mail-format-select[data-editor="' + editorKey + '"]').forEach(function (select) {
      select.addEventListener('change', function () {
        runEditorCommand(editorKey, select.getAttribute('data-cmd'), select.value);
        editorEl.focus();
      });
    });

    document.querySelectorAll('.mail-format-color[data-editor="' + editorKey + '"]').forEach(function (input) {
      input.addEventListener('input', function () {
        runEditorCommand(editorKey, input.getAttribute('data-cmd'), input.value);
        editorEl.focus();
      });
    });
  }

  function formatRequestStatus(status) {
    const value = String(status || '').toLowerCase();
    const labels = {
      pending_origin_review: 'Pending review',
      approved: 'Approved',
      rejected: 'Rejected',
      forwarded_to_target: 'Awaiting MCFS review',
      routed_to_user: 'Assigned to user',
      file_returned_to_coml: 'File ready',
      returned_to_origin: 'Returned to requester station',
      completed: 'Delivered'
    };
    return labels[value] || value.replace(/_/g, ' ');
  }

  function requestTrackingMap() {
    const map = new Map();
    const items = Array.isArray(state.bootstrap && state.bootstrap.requestTracking) ? state.bootstrap.requestTracking : [];
    items.forEach(function (entry) {
      const threadId = Number(entry.threadId || 0);
      if (threadId > 0) {
        map.set(threadId, String(entry.status || '').toLowerCase());
      }
    });
    return map;
  }

  function inferRequestStatusFromSnippet(snippet, threadId, tracking) {
    const tracked = tracking.get(threadId);
    if (tracked) {
      return tracked;
    }
    const text = String(snippet || '').toLowerCase();
    if (text.indexOf('rejected the request') !== -1 || text.indexOf('was rejected') !== -1) {
      return 'rejected';
    }
    if (text.indexOf('request completed') !== -1 || text.indexOf('file sent to the requester') !== -1) {
      return 'completed';
    }
    return '';
  }

  function requestOutcomeMeta(status) {
    const value = String(status || '').toLowerCase();
    if (value === 'rejected') {
      return { tone: 'rejected', label: 'Rejected', icon: 'bi-x-circle-fill', rowClass: 'is-request-rejected' };
    }
    if (value === 'completed') {
      return { tone: 'completed', label: 'Delivered', icon: 'bi-check-circle-fill', rowClass: 'is-request-completed' };
    }
    return null;
  }

  function renderRequestOutcomeBadge(status) {
    const meta = requestOutcomeMeta(status);
    if (!meta) {
      return '';
    }
    return '<span class="mail-request-outcome-badge mail-request-outcome-badge--' + meta.tone + '">' +
      '<i class="bi ' + meta.icon + '" aria-hidden="true"></i><span>' + escapeHtml(meta.label) + '</span>' +
    '</span>';
  }

  function renderRequestStatusValue(status) {
    const meta = requestOutcomeMeta(status);
    if (meta) {
      return renderRequestOutcomeBadge(status);
    }
    return '<strong>' + escapeHtml(formatRequestStatus(status)) + '</strong>';
  }

  function openRequestThreadModal() {
    if (!requestThreadModal) return;
    requestThreadModal.hidden = false;
    syncMailModalScrollLock();
  }

  function closeRequestThreadModal() {
    if (!requestThreadModal) return;
    requestThreadModal.hidden = true;
    state.activeRequestDetail = null;
    syncMailModalScrollLock();
  }

  function renderRequestReferenceBlock(rr) {
    if (!rr) return '';
    const items = [];
    function addItem(label, valueHtml, wide) {
      if (!valueHtml) return;
      items.push(
        '<div class="mail-request-ref-item' + (wide ? ' mail-request-ref-item--wide' : '') + '">' +
          '<span>' + escapeHtml(label) + '</span>' +
          '<div class="mail-request-ref-value">' + valueHtml + '</div>' +
        '</div>'
      );
    }
    if (rr.refIncidentDate) {
      const dateLabel = rr.refIncidentDateTo
        ? (escapeHtml(rr.refIncidentDate) + ' – ' + escapeHtml(rr.refIncidentDateTo))
        : escapeHtml(rr.refIncidentDate);
      addItem('Incident date' + (rr.refIncidentDateTo ? ' range' : ''), '<strong>' + dateLabel + '</strong>');
    }
    if (rr.refAllRespondingStations) {
      addItem('Responding stations', '<strong>All stations that responded</strong>', true);
    } else if (Array.isArray(rr.refRespondingStations) && rr.refRespondingStations.length) {
      const chips = rr.refRespondingStations.map(function (station) {
        return '<span class="mail-request-ref-chip">' + escapeHtml(station.stationName || '') + '</span>';
      }).join('');
      addItem(
        'Responding station' + (rr.refRespondingStations.length > 1 ? 's' : ''),
        '<div class="mail-request-ref-chips">' + chips + '</div>',
        true
      );
    } else if (rr.refRespondingStationName) {
      addItem('Responding station', '<strong>' + escapeHtml(rr.refRespondingStationName) + '</strong>', true);
    }
    if (rr.refLocation) {
      addItem('Location / address', '<strong>' + escapeHtml(rr.refLocation) + '</strong>', true);
    }
    if (rr.refCaseId) {
      addItem('Case / incident ID', '<strong>' + escapeHtml(rr.refCaseId) + '</strong>');
    }
    if (!items.length) return '';
    return '<section class="mail-request-ref">' +
      '<h3 class="mail-request-ref-title">Reference details</h3>' +
      '<div class="mail-request-ref-grid">' + items.join('') + '</div>' +
    '</section>';
  }

  function renderRequestMetaBlock(rr) {
    if (!rr || !rr.routeId) return '';
    const cards = [
      '<div class="mail-request-meta-card"><span>Status</span>' + renderRequestStatusValue(rr.status) + '</div>',
      '<div class="mail-request-meta-card"><span>From station</span><strong>' + escapeHtml(rr.originStationName || '—') + '</strong></div>',
      '<div class="mail-request-meta-card"><span>Requested by</span><strong>' + escapeHtml(rr.requestUsername || '—') + '</strong></div>'
    ];
    const rejectReason = String(rr.targetReviewNotes || rr.originReviewNotes || '').trim();
    if (String(rr.status || '').toLowerCase() === 'rejected' && rejectReason) {
      cards.push('<div class="mail-request-meta-card mail-request-meta-card--wide"><span>Rejection reason</span><strong>' + escapeHtml(rejectReason) + '</strong></div>');
    }
    return '<div class="mail-request-meta">' + cards.join('') + '</div>';
  }

  function getRequestTimelineSteps(status) {
    const rejected = String(status || '').toLowerCase() === 'rejected';
    if (rejected) {
      return [
        {
          title: 'Submitted',
          note: 'Your request was sent to Makati Central Fire Station.'
        },
        {
          title: 'Central review',
          note: 'MCFS ComL reviewed your reference details.'
        },
        {
          title: 'Rejected',
          note: 'This request was declined by MCFS ComL.'
        }
      ];
    }
    return [
      {
        title: 'Submitted',
        note: 'Your request was sent to Makati Central Fire Station.'
      },
      {
        title: 'Central review',
        note: 'MCFS ComL is locating the requested report(s) from central records.'
      },
      {
        title: 'Delivered',
        note: 'The requested file has been released back to you.'
      }
    ];
  }

  function requestTimelineActiveIndex(status, steps) {
    const value = String(status || '').toLowerCase();
    const lastIndex = Math.max(0, (steps || []).length - 1);
    if (value === 'rejected') {
      return lastIndex;
    }
    switch (value) {
      case 'forwarded_to_target':
      case 'routed_to_user':
      case 'file_returned_to_coml':
      case 'returned_to_origin':
        return 1;
      case 'completed':
        return lastIndex;
      default:
        return 0;
    }
  }

  function resolveRequestDescription(detail) {
    const rr = (detail && detail.requestRoute) || {};
    const edited = String(rr.editedBody || '').trim();
    if (edited) {
      return edited;
    }
    const messages = Array.isArray(detail && detail.messages) ? detail.messages : [];
    const requestMessage = messages.find(function (message) {
      return message.mailType === 'request' && message.requestFiles;
    }) || messages.find(function (message) {
      return message.mailType === 'request';
    }) || messages[0];
    if (requestMessage) {
      const body = String(requestMessage.body || '').trim();
      if (body) {
        return body;
      }
    }
    return '';
  }

  function messageDisplayBody(message, detail) {
    const body = String((message && message.body) || '').trim();
    if (body) {
      return body;
    }
    if (message && message.mailType === 'request') {
      return resolveRequestDescription(detail);
    }
    return '';
  }

  function renderRequestDescriptionBlock(detail) {
    const text = resolveRequestDescription(detail);
    if (!text) {
      return '';
    }
    return '<section class="mail-request-description">' +
      '<h3 class="mail-request-ref-title">Request description</h3>' +
      formatMessageBody(text) +
    '</section>';
  }

  function renderRequestTimeline(detail) {
    if (!requestThreadTimeline || !requestTimelineSteps || !requestTimelineNote || !requestTimelineRequestTitle) {
      return;
    }
    const route = detail.requestRoute || {};
    if (!route.routeId) {
      requestThreadTimeline.hidden = true;
      return;
    }
    const steps = getRequestTimelineSteps(route.status);
    const activeIndex = requestTimelineActiveIndex(route.status, steps);
    const rejected = String(route.status || '').toLowerCase() === 'rejected';
    state.requestTimelineSelectedIndex = activeIndex;
    requestTimelineRequestTitle.textContent = (detail.thread && detail.thread.subject) || 'Operational request timeline';
    requestTimelineSteps.innerHTML = steps.map(function (step, index) {
      const isRejectedStep = rejected && index === steps.length - 1;
      const completed = isRejectedStep ? false : (rejected ? index < activeIndex : index <= activeIndex);
      const active = index === state.requestTimelineSelectedIndex;
      return '<button type="button" class="timeline-step' +
        (completed ? ' completed' : '') +
        (isRejectedStep ? ' rejected' : '') +
        (active ? ' active' : '') +
        '" data-step-index="' + index + '">' +
        '<span class="timeline-marker">' + (index + 1) + '</span>' +
        '<span class="timeline-step-title">' + escapeHtml(step.title) + '</span>' +
      '</button>';
    }).join('');
    const selectedStep = steps[state.requestTimelineSelectedIndex];
    let noteText = selectedStep ? selectedStep.note : '';
    if (rejected && state.requestTimelineSelectedIndex === steps.length - 1) {
      const reason = String(route.targetReviewNotes || route.originReviewNotes || '').trim();
      if (reason) {
        noteText = 'Reason: ' + reason;
      }
    }
    requestTimelineNote.textContent = noteText;
    requestThreadTimeline.hidden = false;
  }

  function renderRequestThreadSummary(detail) {
    if (!requestThreadSummary) return;
    const rr = detail.requestRoute || {};
    const html = renderRequestMetaBlock(rr) + renderRequestDescriptionBlock(detail) + renderRequestReferenceBlock(rr);
    requestThreadSummary.innerHTML = html;
    requestThreadSummary.hidden = html === '';
  }

  function renderRequestThreadMessages(detail) {
    if (!requestThreadContent) return;
    const messages = Array.isArray(detail.messages) ? detail.messages : [];
    if (messages.length === 0) {
      requestThreadContent.innerHTML = '';
      requestThreadContent.hidden = true;
      return;
    }
    requestThreadContent.innerHTML = messages.map(function (message) {
      const attachments = Array.isArray(message.attachments) ? message.attachments.map(function (attachment) {
        return '<a class="mail-attachment-link" href="' + escapeHtml(attachment.downloadUrl || '#') + '" target="_blank" rel="noreferrer">' + escapeHtml(attachment.originalFileName) + '</a>';
      }).join('') : '';
      const requestTags = message.mailType === 'request' ? '<span class="mail-badge">Request</span>' : '';
      const mineClass = isCurrentUserMessage(message) ? ' is-mine' : '';
      return '<article class="mail-thread-message' + mineClass + '">' +
        '<div class="mail-thread-message-head">' +
          '<div class="mail-thread-message-from">' + renderThreadMeBadge(message) +
            '<strong>' + escapeHtml(message.senderStationName || '') + ' / ' + escapeHtml(message.senderUsername || '') + '</strong>' +
          '</div>' +
          '<span>' + escapeHtml(formatDate(message.sentAt || message.createdAt)) + '</span>' +
        '</div>' +
        '<div class="mail-thread-message-meta"><span>' + escapeHtml(message.senderUsername || '') + '</span>' + requestTags + '</div>' +
        formatMessageBody(messageDisplayBody(message, detail)) +
        (attachments ? '<div class="mail-attachments">' + attachments + '</div>' : '') +
      '</article>';
    }).join('');
    requestThreadContent.hidden = false;
  }

  function renderRequestThreadModal(detail) {
    state.activeRequestDetail = detail;
    const thread = detail.thread || {};
    if (requestThreadTitle) {
      requestThreadTitle.textContent = thread.subject || 'Request detail';
    }
    if (requestThreadModalKicker) {
      requestThreadModalKicker.textContent = 'Your request';
    }
    state.requestTimelineSelectedIndex = requestTimelineActiveIndex((detail.requestRoute || {}).status, getRequestTimelineSteps((detail.requestRoute || {}).status));
    renderRequestTimeline(detail);
    renderRequestThreadSummary(detail);
    renderRequestThreadMessages(detail);
    openRequestThreadModal();
  }

  function setRequestComposeMessage(text, isError) {
    if (!requestComposeMessage) return;
    requestComposeMessage.textContent = text;
    requestComposeMessage.style.color = isError ? '#b8333b' : '#1f5e2d';
  }

  function renderRequestResponderOptions() {
    if (!requestComposeRefRespondersList) return;
    const stations = Array.isArray(state.bootstrap && state.bootstrap.stations) ? state.bootstrap.stations : [];
    requestComposeRefRespondersList.innerHTML = stations.map(function (entry) {
      return '<label class="mail-compose-checkline"><input type="checkbox" value="' + escapeHtml(String(entry.stationId)) + '"' +
        (requestComposeRefAllResponders && requestComposeRefAllResponders.checked ? ' disabled' : '') +
        '><span>' + escapeHtml(entry.stationName) + '</span></label>';
    }).join('');
  }

  function selectedRequestResponderIds() {
    if (!requestComposeRefRespondersList) return [];
    return Array.from(requestComposeRefRespondersList.querySelectorAll('input[type="checkbox"]:checked')).map(function (input) {
      return Number(input.value || 0);
    }).filter(Boolean);
  }

  function renderRequestAttachmentList() {
    if (!requestComposeAttachmentList) return;
    if (!state.requestLocalAttachments.length) {
      requestComposeAttachmentList.hidden = true;
      requestComposeAttachmentList.innerHTML = '';
      return;
    }
    requestComposeAttachmentList.hidden = false;
    requestComposeAttachmentList.innerHTML = state.requestLocalAttachments.map(function (file, index) {
      return '<li class="mail-compose-attachment-chip"><span>' + escapeHtml(file.name || 'attachment') + '</span><button type="button" data-request-attachment-index="' + index + '" aria-label="Remove attachment">×</button></li>';
    }).join('');
  }

  function addRequestAttachments(fileList) {
    Array.from(fileList || []).forEach(function (file) {
      const duplicate = state.requestLocalAttachments.some(function (existing) {
        return existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified;
      });
      if (!duplicate) {
        state.requestLocalAttachments.push(file);
      }
    });
    renderRequestAttachmentList();
  }

  function clearRequestComposeForm() {
    if (requestComposeForm) requestComposeForm.reset();
    if (requestComposeSubject) requestComposeSubject.value = '';
    if (requestComposeBody) requestComposeBody.value = '';
    state.requestLocalAttachments = [];
    renderRequestAttachmentList();
    renderRequestResponderOptions();
    setRequestComposeMessage('', false);
  }

  function openComposeChooser() {
    composeChooserModal.hidden = false;
    syncMailModalScrollLock();
  }

  function closeComposeChooser() {
    composeChooserModal.hidden = true;
    syncMailModalScrollLock();
  }

  function openRequestCompose() {
    closeComposeChooser();
    if (requestComposeRoutedToLabel) {
      const centralStation = state.bootstrap && state.bootstrap.centralStation ? state.bootstrap.centralStation : null;
      requestComposeRoutedToLabel.textContent = (centralStation && centralStation.stationName) || 'Makati Central Fire Station';
    }
    renderRequestResponderOptions();
    requestComposeModal.hidden = false;
    syncMailModalScrollLock();
    setRequestComposeMessage('', false);
    if (requestComposeBody) requestComposeBody.focus();
  }

  function closeRequestCompose() {
    requestComposeModal.hidden = true;
    syncMailModalScrollLock();
    clearRequestComposeForm();
  }

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

    composeStationSelect.innerHTML = '<option value="">All stations</option>' + stations.map(function (entry) {
      const code = entry.stationCode ? ('[' + String(entry.stationCode) + '] ') : '';
      return '<option value="' + escapeHtml(String(entry.stationId)) + '">' + escapeHtml(code + entry.stationName) + '</option>';
    }).join('');
  }

  function currentUserId() {
    return Number((state.bootstrap && state.bootstrap.currentUser && state.bootstrap.currentUser.userId) || 0);
  }

  function isCurrentUserMessage(message) {
    const senderId = Number(message && message.senderUserId);
    const me = currentUserId();
    return me > 0 && senderId > 0 && senderId === me;
  }

  function renderThreadMeBadge(message) {
    if (!isCurrentUserMessage(message)) {
      return '';
    }
    return '<span class="mail-thread-me-badge" title="Your message" aria-label="Your message">' +
      '<i class="bi bi-person-check-fill" aria-hidden="true"></i><span>Me</span>' +
    '</span>';
  }

  function isComposeRecipientSelected(userId) {
    return state.composeSelectedRecipients.some(function (entry) {
      return Number(entry.userId) === Number(userId);
    });
  }

  function eligibleComposeUsers() {
    const users = Array.isArray(state.bootstrap && state.bootstrap.networkUsers) ? state.bootstrap.networkUsers : [];
    const selectedStationId = Number(composeStationSelect && composeStationSelect.value || 0);
    const search = String(composeUserSearch && composeUserSearch.value || '').trim().toLowerCase();
    const me = currentUserId();

    return users.filter(function (user) {
      const userId = Number(user.userId || 0);
      const stationId = Number(user.stationId || 0);
      const isActive = String(user.status || '').toLowerCase() === 'active';
      if (!isActive || userId < 1 || userId === me) {
        return false;
      }
      if (selectedStationId > 0 && stationId !== selectedStationId) {
        return false;
      }
      if (isComposeRecipientSelected(userId)) {
        return false;
      }
      if (search === '') {
        return true;
      }
      const haystack = [
        user.username || '',
        user.stationName || '',
        user.stationCode || '',
        user.positionName || ''
      ].join(' ').toLowerCase();
      return haystack.indexOf(search) !== -1;
    }).slice(0, 8);
  }

  function renderComposeRecipientChips() {
    if (!composeRecipientChips) return;
    if (!state.composeSelectedRecipients.length) {
      composeRecipientChips.hidden = true;
      composeRecipientChips.innerHTML = '';
      return;
    }
    composeRecipientChips.hidden = false;
    composeRecipientChips.innerHTML = state.composeSelectedRecipients.map(function (user) {
      const code = user.stationCode ? ('[' + escapeHtml(user.stationCode) + '] ') : '';
      return '<span class="mail-recipient-chip">' +
        '<strong>' + escapeHtml(user.username || 'User') + '</strong>' +
        '<em>' + code + escapeHtml(user.stationName || '') + '</em>' +
        '<button type="button" data-remove-recipient="' + escapeHtml(String(user.userId)) + '" aria-label="Remove recipient">×</button>' +
      '</span>';
    }).join('');
  }

  function renderComposeUserResults() {
    if (!composeUserResults) return;
    const users = eligibleComposeUsers();
    if (!users.length) {
      const hasSearch = String(composeUserSearch && composeUserSearch.value || '').trim() !== '';
      composeUserResults.innerHTML = '<div class="mail-recipient-empty">' +
        escapeHtml(hasSearch ? 'No matching people found.' : 'Choose a station or start typing a name.') +
      '</div>';
      return;
    }
    composeUserResults.innerHTML = users.map(function (user) {
      const initials = String(user.username || 'U').slice(0, 2).toUpperCase();
      return '<button type="button" class="mail-recipient-result" data-add-recipient="' + escapeHtml(String(user.userId)) + '">' +
        '<span class="mail-recipient-avatar" aria-hidden="true">' + escapeHtml(initials) + '</span>' +
        '<span class="mail-recipient-result-body">' +
          '<strong>' + escapeHtml(user.username || 'User') + '</strong>' +
          '<span>' + escapeHtml((user.stationCode ? '[' + user.stationCode + '] ' : '') + (user.stationName || '')) + '</span>' +
        '</span>' +
        '<span class="mail-recipient-add" aria-hidden="true"><i class="bi bi-plus-lg"></i></span>' +
      '</button>';
    }).join('');
  }

  function addComposeRecipient(userId) {
    const users = Array.isArray(state.bootstrap && state.bootstrap.networkUsers) ? state.bootstrap.networkUsers : [];
    const found = users.find(function (user) {
      return Number(user.userId) === Number(userId);
    });
    if (!found || isComposeRecipientSelected(userId)) {
      return;
    }
    state.composeSelectedRecipients.push({
      userId: Number(found.userId),
      username: found.username || 'User',
      stationId: Number(found.stationId || 0),
      stationName: found.stationName || '',
      stationCode: found.stationCode || ''
    });
    renderComposeRecipientChips();
    renderComposeUserResults();
    if (composeUserSearch) {
      composeUserSearch.value = '';
      composeUserSearch.focus();
    }
  }

  function removeComposeRecipient(userId) {
    state.composeSelectedRecipients = state.composeSelectedRecipients.filter(function (entry) {
      return Number(entry.userId) !== Number(userId);
    });
    renderComposeRecipientChips();
    renderComposeUserResults();
  }

  function renderComposeAttachments() {
    if (!composeAttachmentList) return;
    if (!state.composeLocalAttachments.length) {
      composeAttachmentList.hidden = true;
      composeAttachmentList.innerHTML = '';
      return;
    }
    composeAttachmentList.hidden = false;
    composeAttachmentList.innerHTML = state.composeLocalAttachments.map(function (file, index) {
      return '<li class="mail-compose-attachment-chip"><span>' + escapeHtml(file.name || 'attachment') + '</span><button type="button" data-compose-attachment-index="' + index + '" aria-label="Remove attachment">×</button></li>';
    }).join('');
  }

  function renderUserOptions() {
    renderComposeRecipientChips();
    renderComposeUserResults();
  }

  function applyBootstrap(payload) {
    state.bootstrap = payload.data || {};
    updateCounts(state.bootstrap);
    renderStationOptions();
    renderUserOptions();
    mailActiveFilter.textContent = isCentralStation() ? 'Showing general mail' : 'Showing station mail';
    if (mailBackLink && pageContext.mailHomeUrl) {
      mailBackLink.href = String(pageContext.mailHomeUrl);
      if (!isCentralStation()) {
        mailBackLink.hidden = true;
      }
    }
    renderRequestResponderOptions();
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  function visibleItems() {
    return (state.items || []).filter(function (item) {
      const isOperational = item.mailType === 'request' && item.requestFiles;
      if (isOperational && isCentralStation()) {
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
          if (f === 'request' && item.mailType !== 'request') return false;
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

  function itemTimestamp(item) {
    return new Date(item.sentAt || item.createdAt || 0).getTime() || 0;
  }

  function groupedVisibleItems() {
    const raw = visibleItems();
    const byThread = new Map();

    raw.forEach(function (item) {
      const threadId = Number(item.threadId || 0);
      if (threadId < 1) {
        return;
      }
      const existing = byThread.get(threadId);
      if (!existing) {
        byThread.set(threadId, Object.assign({}, item, {
          messageCount: 1,
          latestMailId: item.mailId
        }));
        return;
      }
      existing.messageCount += 1;
      if (itemTimestamp(item) >= itemTimestamp(existing)) {
        existing.mailId = item.mailId;
        existing.latestMailId = item.mailId;
        existing.subject = item.subject || existing.subject;
        existing.snippet = item.snippet || existing.snippet;
        existing.body = item.body || existing.body;
        existing.sentAt = item.sentAt || existing.sentAt;
        existing.createdAt = item.createdAt || existing.createdAt;
        existing.senderUsername = item.senderUsername || existing.senderUsername;
        existing.senderStationName = item.senderStationName || existing.senderStationName;
        existing.importance = item.importance || existing.importance;
        existing.attachmentCount = Math.max(Number(existing.attachmentCount || 0), Number(item.attachmentCount || 0));
      }
      if (item.mailType === 'request' && item.requestFiles) {
        existing.mailType = 'request';
        existing.requestFiles = true;
      }
      if (!item.readAt) {
        existing.readAt = '';
      }
      if (item.starredAt) {
        existing.starredAt = item.starredAt;
      }
    });

    return Array.from(byThread.values()).sort(function (a, b) {
      if (state.sort === 'oldest') {
        return itemTimestamp(a) - itemTimestamp(b);
      }
      if (state.sort === 'unread') {
        const unreadA = a.readAt ? 1 : 0;
        const unreadB = b.readAt ? 1 : 0;
        if (unreadA !== unreadB) {
          return unreadA - unreadB;
        }
      }
      return itemTimestamp(b) - itemTimestamp(a);
    });
  }

  function saveListScrollPosition() {
    state.pageScrollY = window.scrollY || window.pageYOffset || 0;
    state.listScrollTop = mailList ? mailList.scrollTop : 0;
  }

  function restoreListScrollPosition() {
    window.requestAnimationFrame(function () {
      if (mailList) {
        mailList.scrollTop = state.listScrollTop || 0;
      }
      window.scrollTo(0, state.pageScrollY || 0);
    });
  }

  function showConversationView() {
    state.conversationOpen = true;
    if (mailApp) {
      mailApp.classList.add('is-conversation-open');
    }
    if (mailMain) {
      mailMain.classList.add('is-conversation-open');
    }
    if (threadPanel) {
      threadPanel.hidden = false;
    }
    if (mailListPanel) {
      mailListPanel.hidden = true;
    }
  }

  function showListView(restoreScroll) {
    state.conversationOpen = false;
    state.activeThread = null;
    state.activeRequestDetail = null;
    if (mailApp) {
      mailApp.classList.remove('is-conversation-open');
    }
    if (mailMain) {
      mailMain.classList.remove('is-conversation-open');
    }
    if (threadPanel) {
      threadPanel.hidden = true;
    }
    if (mailListPanel) {
      mailListPanel.hidden = false;
    }
    if (threadActions) threadActions.hidden = true;
    if (inlineReplyContainer) inlineReplyContainer.hidden = true;
    if (threadRequestSummaryInline) {
      threadRequestSummaryInline.hidden = true;
      threadRequestSummaryInline.innerHTML = '';
    }
    if (threadTitle) threadTitle.textContent = 'Select a message';
    if (threadContent) {
      threadContent.hidden = true;
      threadContent.innerHTML = '';
    }
    if (threadEmpty) {
      threadEmpty.hidden = false;
      threadEmpty.textContent = 'Open a message to view the full conversation.';
    }
    renderList();
    if (restoreScroll !== false) {
      restoreListScrollPosition();
    }
  }

  function openInlineReply(parentMailId, replyToText) {
    if (!inlineReplyContainer || !state.activeThread) {
      setMessage('Open a message to reply.', true);
      return;
    }
    const hasRequestRoute = Boolean(state.activeRequestDetail && state.activeRequestDetail.requestRoute && state.activeRequestDetail.requestRoute.routeId);
    if (hasRequestRoute && !isCentralStation()) {
      setMessage('This request conversation is tracked separately once completed files are delivered.', true);
      return;
    }
    inlineReplyContainer.hidden = false;
    inlineReplyThreadId.value = String(state.activeThread.threadId || '');
    inlineReplyParentMailId.value = parentMailId ? String(parentMailId) : '';
    clearInlineReplyBody();
    clearInlineReplyAttachments();
    if (inlineReplyMessage) inlineReplyMessage.textContent = '';
    if (inlineReplyToLabel) {
      inlineReplyToLabel.textContent = replyToText ? ('Reply to ' + replyToText) : 'Reply';
    }
    if (inlineReplyBodyEditor) {
      inlineReplyBodyEditor.focus();
    }
    window.requestAnimationFrame(function () {
      if (inlineReplyContainer) {
        inlineReplyContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function renderList() {
    const items = groupedVisibleItems();
    if (items.length === 0) {
      mailList.innerHTML = '<div class="mail-empty-list">No general mail messages found.</div>';
      return;
    }
    const tracking = requestTrackingMap();
    mailList.innerHTML = items.map(function (item) {
      const unreadClass = item.readAt ? '' : ' unread';
      const selectedClass = state.activeThread && state.activeThread.threadId === item.threadId ? ' is-active' : '';
      const snippet = escapeHtml(item.snippet || item.body || '');
      const isOperational = item.mailType === 'request' && item.requestFiles;
      const threadId = Number(item.threadId || 0);
      const requestStatus = inferRequestStatusFromSnippet(item.snippet || item.body || '', threadId, tracking);
      const outcome = requestOutcomeMeta(requestStatus);
      const outcomeClass = outcome ? (' ' + outcome.rowClass) : '';
      const outcomeBadge = outcome ? renderRequestOutcomeBadge(requestStatus) : '';
      const count = Number(item.messageCount || 1);
      const countHtml = count > 1
        ? '<span class="mail-thread-count" title="' + escapeHtml(String(count) + ' messages in this conversation') + '">' + escapeHtml(String(count)) + '</span>'
        : '';
      const typeBadge = isOperational
        ? '<span class="mail-badge">request</span>'
        : '<span class="mail-badge">' + escapeHtml(item.mailType || 'message') + '</span>';
      return '<article class="mail-list-item' + unreadClass + selectedClass + outcomeClass + '" data-thread-id="' + escapeHtml(String(item.threadId)) + '" data-thread-mailid="' + escapeHtml(String(item.mailId)) + '">' +
        '<input type="checkbox" class="select-checkbox" data-thread-id="' + escapeHtml(String(item.threadId)) + '">' +
        '<div class="mail-list-title"><span class="mail-list-item-subject"><strong>' + escapeHtml(item.subject || '(No subject)') + '</strong>' + countHtml + outcomeBadge + '</span><span>' + escapeHtml(formatDate(item.sentAt || item.createdAt)) + '</span></div>' +
        '<div class="mail-list-meta"><span>' + escapeHtml(item.senderStationName || '') + ' / ' + escapeHtml(item.senderUsername || '') + '</span>' +
        typeBadge + '</div>' +
        '<p class="mail-list-snippet' + (outcome ? ' mail-list-snippet--' + outcome.tone : '') + '">' + snippet + '</p>' +
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
    const hasRequestRoute = Boolean(detail.requestRoute && detail.requestRoute.routeId);
    threadTitle.textContent = thread.subject || 'Conversation';

    if (threadRequestSummaryInline) {
      if (hasRequestRoute) {
        const html = renderRequestMetaBlock(detail.requestRoute) + renderRequestDescriptionBlock(detail) + renderRequestReferenceBlock(detail.requestRoute);
        threadRequestSummaryInline.innerHTML = html;
        threadRequestSummaryInline.hidden = html === '';
      } else {
        threadRequestSummaryInline.hidden = true;
        threadRequestSummaryInline.innerHTML = '';
      }
    }

    if (messages.length === 0) {
      threadContent.innerHTML = '<div class="mail-empty-list">No messages in this thread.</div>';
      threadContent.hidden = false;
      threadEmpty.hidden = true;
      return;
    }

    threadContent.innerHTML = messages.map(function (message, index) {
      const attachments = Array.isArray(message.attachments) ? message.attachments.map(function (attachment) {
        return '<a class="mail-attachment-link" href="' + escapeHtml(attachment.downloadUrl) + '" target="_blank" rel="noreferrer">' + escapeHtml(attachment.originalFileName) + '</a>';
      }).join('') : '';
      const isLatest = index === messages.length - 1;
      const collapsedClass = (!isLatest && messages.length > 2) ? ' is-collapsed' : '';
      const latestClass = isLatest ? ' is-latest' : '';
      const mineClass = isCurrentUserMessage(message) ? ' is-mine' : '';
      return '<article class="mail-thread-message' + collapsedClass + latestClass + mineClass + '" data-mail-id="' + escapeHtml(String(message.mailId)) + '">' +
        '<div class="mail-thread-message-head">' +
          '<div class="mail-thread-message-from">' + renderThreadMeBadge(message) +
            '<strong>' + escapeHtml(message.senderStationName || '') + ' / ' + escapeHtml(message.senderUsername || '') + '</strong>' +
          '</div>' +
          '<span>' + escapeHtml(formatDate(message.sentAt || message.createdAt)) + '</span>' +
        '</div>' +
        '<div class="mail-thread-message-meta"><span>' + escapeHtml(message.importance || 'normal') + '</span>' +
        (message.mailType === 'request' ? '<span class="mail-badge">Request</span>' : '') + '</div>' +
        formatMessageBody(messageDisplayBody(message, detail)) +
        (attachments ? '<div class="mail-attachments">' + attachments + '</div>' : '') +
        (isLatest && !(hasRequestRoute && !isCentralStation())
          ? '<div class="thread-message-actions">' +
              '<button type="button" class="mail-pill-reply-btn inline-reply-btn" data-mail-id="' + escapeHtml(String(message.mailId)) + '" data-reply-to="' + escapeHtml((message.senderStationName || '') + ' / ' + (message.senderUsername || '')) + '">' +
                '<i class="bi bi-reply" aria-hidden="true"></i><span>Reply</span>' +
              '</button>' +
            '</div>'
          : '') +
      '</article>';
    }).join('');

    if (messages.length > 2) {
      const expandBtn = '<button type="button" class="mail-thread-expand-btn" id="expandOlderMessagesBtn">Show ' + (messages.length - 1) + ' earlier messages</button>';
      threadContent.insertAdjacentHTML('afterbegin', expandBtn);
      const expandEl = document.getElementById('expandOlderMessagesBtn');
      if (expandEl) {
        expandEl.addEventListener('click', function () {
          Array.from(threadContent.querySelectorAll('.mail-thread-message.is-collapsed')).forEach(function (el) {
            el.classList.remove('is-collapsed');
          });
          expandEl.remove();
        });
      }
    }

    threadContent.hidden = false;
    threadEmpty.hidden = true;
    if (threadActions) {
      threadActions.hidden = hasRequestRoute && !isCentralStation();
    }
    if (inlineReplyContainer && hasRequestRoute && !isCentralStation()) {
      inlineReplyContainer.hidden = true;
    }
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
    saveListScrollPosition();
    const response = await fetch(apiUrl + '?action=thread&threadId=' + encodeURIComponent(String(threadId)), { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true || !payload.data) {
      throw new Error((payload && payload.message) || 'Unable to load thread.');
    }
    state.activeThread = payload.data.thread || null;
    state.activeRequestDetail = payload.data;
    const hasRequestRoute = Boolean(payload.data.requestRoute && payload.data.requestRoute.routeId);
    if (hasRequestRoute && !isCentralStation()) {
      if (state.conversationOpen) {
        showListView(false);
      }
      closeRequestThreadModal();
      renderRequestThreadModal(payload.data);
      renderList();
      return;
    }
    closeRequestThreadModal();
    showConversationView();
    renderThread(payload.data);
    renderList();
    if (inlineReplyContainer) {
      inlineReplyContainer.hidden = true;
    }
    const scrollArea = document.getElementById('threadScrollArea');
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }
  }

  function openCompose() {
    composeModal.hidden = false;
    syncMailModalScrollLock();
    setMessage('', false);
    renderUserOptions();
    if (composeUserSearch) {
      composeUserSearch.focus();
    }
  }

  function closeCompose() {
    composeModal.hidden = true;
    syncMailModalScrollLock();
    composeForm.reset();
    composeSubject.value = '';
    clearComposeBody();
    composeAttachments.value = '';
    composeStationSelect.value = '';
    if (composeUserSearch) composeUserSearch.value = '';
    state.composeSelectedRecipients = [];
    state.composeLocalAttachments = [];
    renderComposeAttachments();
    renderUserOptions();
  }

  function selectedRecipients() {
    return state.composeSelectedRecipients.map(function (entry) {
      return Number(entry.userId || 0);
    }).filter(function (id) {
      return id > 0;
    });
  }

  function selectedStationIds() {
    return [];
  }

  async function submitMail(isDraft) {
    const subject = composeSubject.value.trim();
    syncEditorToHidden(composeBodyEditor, composeBody);
    const body = getComposeBodyHtml();
    const recipients = selectedRecipients();
    const stations = selectedStationIds();
    const files = state.composeLocalAttachments.slice();

    if (!subject && !isDraft) {
      setMessage('Subject is required.', true);
      return;
    }
    if (!isDraft && isEditorEmpty(composeBodyEditor) && files.length === 0) {
      setMessage('Write a message or attach files before sending.', true);
      return;
    }
    if (!isDraft && recipients.length === 0 && stations.length === 0) {
      setMessage('Select at least one person to message.', true);
      return;
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

  async function submitRequestMail(isDraft) {
    const subject = String(requestComposeSubject && requestComposeSubject.value || '').trim();
    const body = String(requestComposeBody && requestComposeBody.value || '').trim();
    const centralStationId = Number((state.bootstrap && state.bootstrap.centralStation && state.bootstrap.centralStation.stationId) || 0);

    if (!isDraft && subject === '' && body === '' && state.requestLocalAttachments.length === 0) {
      throw new Error('Write a request or attach reference files before sending.');
    }
    if (centralStationId < 1) {
      throw new Error('Central station routing is not configured.');
    }

    const formData = new FormData();
    formData.append('action', isDraft ? 'save-draft' : 'send');
    formData.append('subject', subject);
    formData.append('body', body);
    formData.append('mailType', 'request');
    formData.append('importance', 'normal');
    formData.append('requestFiles', '1');
    formData.append('sourceStationId', String((state.bootstrap && state.bootstrap.currentUser && state.bootstrap.currentUser.stationId) || 0));
    formData.append('recipientStationIds[]', String(centralStationId));

    if (requestComposeRefIncidentDateFrom && requestComposeRefIncidentDateFrom.value) {
      formData.append('refIncidentDateFrom', requestComposeRefIncidentDateFrom.value);
    }
    if (requestComposeRefIncidentDateTo && requestComposeRefIncidentDateTo.value) {
      formData.append('refIncidentDateTo', requestComposeRefIncidentDateTo.value);
    }
    if (requestComposeRefAllResponders && requestComposeRefAllResponders.checked) {
      formData.append('refAllRespondingStations', '1');
    } else {
      selectedRequestResponderIds().forEach(function (stationId) {
        formData.append('refRespondingStationIds[]', String(stationId));
      });
    }
    if (requestComposeRefLocation && requestComposeRefLocation.value.trim() !== '') {
      formData.append('refLocation', requestComposeRefLocation.value.trim());
    }
    if (requestComposeRefCaseId && requestComposeRefCaseId.value.trim() !== '') {
      formData.append('refCaseId', requestComposeRefCaseId.value.trim());
    }
    state.requestLocalAttachments.forEach(function (file) {
      formData.append('attachments[]', file);
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to submit request.');
    }
    setRequestComposeMessage(payload.message || (isDraft ? 'Draft saved.' : 'Request sent.'), false);
    closeRequestCompose();
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

  openComposeBtn.addEventListener('click', function () {
    if (isCentralStation()) {
      openCompose();
      return;
    }
    openComposeChooser();
  });
  if (backToListBtn) {
    backToListBtn.addEventListener('click', function () {
      showListView(true);
    });
  }
  closeComposeBtn.addEventListener('click', closeCompose);
  if (closeComposeChooserBtn) {
    closeComposeChooserBtn.addEventListener('click', closeComposeChooser);
  }
  if (openGeneralComposeBtn) {
    openGeneralComposeBtn.addEventListener('click', function () {
      closeComposeChooser();
      openCompose();
    });
  }
  if (openRequestComposeBtn) {
    openRequestComposeBtn.addEventListener('click', openRequestCompose);
  }
  if (closeRequestComposeBtn) {
    closeRequestComposeBtn.addEventListener('click', closeRequestCompose);
  }
  if (closeRequestThreadBtn) {
    closeRequestThreadBtn.addEventListener('click', closeRequestThreadModal);
  }
  if (requestThreadModal) {
    requestThreadModal.addEventListener('click', function (event) {
      if (event.target && event.target.hasAttribute('data-close-request-thread')) {
        closeRequestThreadModal();
      }
    });
  }
  if (requestTimelineSteps) {
    requestTimelineSteps.addEventListener('click', function (event) {
      const stepBtn = event.target.closest('[data-step-index]');
      if (!stepBtn || !state.activeRequestDetail) return;
      state.requestTimelineSelectedIndex = Number(stepBtn.getAttribute('data-step-index') || 0);
      renderRequestTimeline(state.activeRequestDetail);
    });
  }
  if (composeChooserModal) {
    composeChooserModal.addEventListener('click', function (event) {
      if (event.target && event.target.hasAttribute('data-close-chooser')) {
        closeComposeChooser();
      }
    });
  }
  if (composeModal) {
    composeModal.addEventListener('click', function (event) {
      if (event.target && event.target.hasAttribute('data-close')) {
        closeCompose();
      }
    });
  }
  if (requestComposeModal) {
    requestComposeModal.addEventListener('click', function (event) {
      if (event.target && event.target.hasAttribute('data-close-request-compose')) {
        closeRequestCompose();
      }
    });
  }
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
  if (composeUserSearch) {
    composeUserSearch.addEventListener('input', renderComposeUserResults);
  }
  if (composeUserResults) {
    composeUserResults.addEventListener('click', function (event) {
      const button = event.target.closest('[data-add-recipient]');
      if (!button) return;
      addComposeRecipient(Number(button.getAttribute('data-add-recipient') || 0));
    });
  }
  if (composeRecipientChips) {
    composeRecipientChips.addEventListener('click', function (event) {
      const button = event.target.closest('[data-remove-recipient]');
      if (!button) return;
      removeComposeRecipient(Number(button.getAttribute('data-remove-recipient') || 0));
    });
  }
  if (composeAttachFilesBtn && composeAttachments) {
    composeAttachFilesBtn.addEventListener('click', function () {
      composeAttachments.click();
    });
    composeAttachments.addEventListener('change', function () {
      Array.from(composeAttachments.files || []).forEach(function (file) {
        const duplicate = state.composeLocalAttachments.some(function (existing) {
          return existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified;
        });
        if (!duplicate) {
          state.composeLocalAttachments.push(file);
        }
      });
      composeAttachments.value = '';
      renderComposeAttachments();
    });
  }
  if (composeAttachmentList) {
    composeAttachmentList.addEventListener('click', function (event) {
      const button = event.target.closest('[data-compose-attachment-index]');
      if (!button) return;
      const index = Number(button.getAttribute('data-compose-attachment-index') || -1);
      if (index < 0 || index >= state.composeLocalAttachments.length) return;
      state.composeLocalAttachments.splice(index, 1);
      renderComposeAttachments();
    });
  }
  if (requestComposeForm) {
    requestComposeForm.addEventListener('submit', function (event) {
      event.preventDefault();
      submitRequestMail(false).catch(function (error) { setRequestComposeMessage(error.message, true); });
    });
  }
  if (saveRequestDraftBtn) {
    saveRequestDraftBtn.addEventListener('click', function () {
      submitRequestMail(true).catch(function (error) { setRequestComposeMessage(error.message, true); });
    });
  }
  if (requestComposeAttachFilesBtn && requestComposeLocalAttachments) {
    requestComposeAttachFilesBtn.addEventListener('click', function () {
      requestComposeLocalAttachments.click();
    });
    requestComposeLocalAttachments.addEventListener('change', function () {
      if (!requestComposeLocalAttachments.files || !requestComposeLocalAttachments.files.length) {
        return;
      }
      addRequestAttachments(requestComposeLocalAttachments.files);
      requestComposeLocalAttachments.value = '';
    });
  }
  if (requestComposeAttachmentList) {
    requestComposeAttachmentList.addEventListener('click', function (event) {
      const button = event.target.closest('[data-request-attachment-index]');
      if (!button) return;
      const index = Number(button.getAttribute('data-request-attachment-index') || -1);
      if (index < 0 || index >= state.requestLocalAttachments.length) return;
      state.requestLocalAttachments.splice(index, 1);
      renderRequestAttachmentList();
    });
  }
  if (requestComposeRefAllResponders) {
    requestComposeRefAllResponders.addEventListener('change', function () {
      renderRequestResponderOptions();
    });
  }
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

      showListView(false);
      fetchList().catch(function (error) { setMessage(error.message, true); });
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
  function latestReplyTarget() {
    const detail = state.activeRequestDetail;
    const messages = detail && Array.isArray(detail.messages) ? detail.messages : [];
    if (!messages.length) return { mailId: 0, label: 'Reply' };
    const latest = messages[messages.length - 1] || {};
    return {
      mailId: Number(latest.mailId || 0),
      label: ((latest.senderStationName || '') + ' / ' + (latest.senderUsername || '')).replace(/^\s*\/\s*$/, '').trim() || 'Reply'
    };
  }

  function smartAction(action) {
    if (action === 'reply') {
      if (!state.activeThread) {
        setMessage('Open a message to reply.', true);
        return;
      }
      const target = latestReplyTarget();
      openInlineReply(target.mailId, target.label === 'Reply' ? '' : target.label);
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
        setMessage('Action failed: ' + (err.message || 'Unknown error'), true);
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
        setMessage('Action completed', false);
      } catch (err) {
        setMessage('Action failed: ' + (err.message || 'Unknown error'), true);
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
  const attachmentPreviewContent = document.getElementById('attachmentPreviewContent');
  const attachmentPreviewTitle = document.getElementById('attachmentPreviewTitle');
  const closeAttachmentPreviewBtn = document.getElementById('closeAttachmentPreviewBtn');
  if (closeAttachmentPreviewBtn) {
    closeAttachmentPreviewBtn.addEventListener('click', function () {
      if (!attachmentPreviewModal) return;
      attachmentPreviewModal.hidden = true;
      attachmentPreviewContent.innerHTML = '';
      syncMailModalScrollLock();
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
    syncMailModalScrollLock();
  });

  // thread message actions (reply/edit)
  threadContent.addEventListener('click', function (event) {
    const replyBtn = event.target.closest('.inline-reply-btn');
    if (replyBtn) {
      const mailId = Number(replyBtn.getAttribute('data-mail-id') || 0);
      const replyTo = replyBtn.getAttribute('data-reply-to') || '';
      openInlineReply(mailId, replyTo);
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
        const bodyEl = article.querySelector('.mail-thread-message-body');
        setEditorHtml(composeBodyEditor, composeBody, bodyEl ? bodyEl.innerHTML : '');
      }
      if (composeBodyEditor) composeBodyEditor.focus();
      return;
    }
  });

  // Keyboard shortcuts state
  const shortcutState = { lastKey: null, lastKeyTime: 0 };
  const SHORTCUT_TIMEOUT = 1500; // ms for multi-key sequences

  function isInputFocused() {
    const el = document.activeElement;
    if (!el) return false;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  // Main keyboard shortcut handler
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      if (inlineReplyContainer && !inlineReplyContainer.hidden) {
        closeInlineReply();
        return;
      }
      if (!composeModal.hidden) {
        closeCompose();
        return;
      }
      if (attachmentPreviewModal && !attachmentPreviewModal.hidden) {
        attachmentPreviewModal.hidden = true;
        if (attachmentPreviewContent) {
          attachmentPreviewContent.innerHTML = '';
        }
        syncMailModalScrollLock();
      }
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
      smartAction('reply');
      return;
    }

    if (e.key === 'a') {
      e.preventDefault();
      openCompose();
      composeThreadId.value = String(state.activeThread.threadId || '');
      composeSubject.value = 'Re: ' + (state.activeThread.subject || '');
      if (composeBodyEditor) composeBodyEditor.focus();
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
      syncEditorToHidden(inlineReplyBodyEditor, inlineReplyBody);
      const body = getInlineReplyBodyHtml();
      const files = state.inlineReplyLocalAttachments.slice();
      if (isEditorEmpty(inlineReplyBodyEditor) && files.length === 0) {
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
          clearInlineReplyBody();
          clearInlineReplyAttachments();
          inlineReplyContainer.hidden = true;
          fetchBootstrap().then(fetchList).then(function () { openThread(threadId).catch(function (e) { setMessage(e.message, true); }); });
        }).catch(function (err) {
          inlineReplyMessage.textContent = err.message || 'Reply error.';
          inlineReplyMessage.style.color = '#b8333b';
        });
    });
  }

  function closeInlineReply() {
    if (!inlineReplyContainer) return;
    inlineReplyContainer.hidden = true;
    if (inlineReplyForm) inlineReplyForm.reset();
    clearInlineReplyBody();
    clearInlineReplyAttachments();
    if (inlineReplyMessage) inlineReplyMessage.textContent = '';
  }

  if (inlineReplyCancel) {
    inlineReplyCancel.addEventListener('click', closeInlineReply);
  }
  if (inlineReplyDiscard) {
    inlineReplyDiscard.addEventListener('click', closeInlineReply);
  }
  if (inlineReplyAttachments && inlineReplyAttachName) {
    inlineReplyAttachments.addEventListener('change', function () {
      Array.from(inlineReplyAttachments.files || []).forEach(function (file) {
        const duplicate = state.inlineReplyLocalAttachments.some(function (existing) {
          return existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified;
        });
        if (!duplicate) {
          state.inlineReplyLocalAttachments.push(file);
        }
      });
      inlineReplyAttachments.value = '';
      renderInlineReplyAttachments();
    });
  }

  bindRichEditor('compose');
  bindRichEditor('inlineReply');

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
        <button class="shortcuts-modal-close" type="button" aria-label="Close"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
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
      <div class="mail-context-menu-item" data-action="reply"><i class="bi bi-reply icon-inline" aria-hidden="true"></i>Reply</div>
      <div class="mail-context-menu-item" data-action="mark-read"><i class="bi bi-eye icon-inline" aria-hidden="true"></i>Mark as read</div>
      <div class="mail-context-menu-item" data-action="mark-unread"><i class="bi bi-eye-slash icon-inline" aria-hidden="true"></i>Mark as unread</div>
      <div class="mail-context-menu-item" data-action="star"><i class="bi bi-star icon-inline" aria-hidden="true"></i>Star</div>
      <div class="mail-context-menu-item" data-action="archive"><i class="bi bi-archive icon-inline" aria-hidden="true"></i>Archive</div>
      <div class="mail-context-menu-item danger" data-action="delete"><i class="bi bi-trash icon-inline" aria-hidden="true"></i>Delete</div>
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
          const target = latestReplyTarget();
          openInlineReply(target.mailId, target.label === 'Reply' ? '' : target.label);
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
      showListView(false);
      await fetchBootstrap();
      await fetchList();
      const threadIdFromUrl = Number(new URLSearchParams(window.location.search).get('thread') || 0);
      if (threadIdFromUrl > 0) {
        try {
          await openThread(threadIdFromUrl);
        } catch (threadError) {
          setMessage((threadError && threadError.message) || 'Unable to open the linked message.', true);
        }
      }
      setMessage('Ready.', false);
    } catch (error) {
      setMessage(error.message, true);
      mailList.innerHTML = '<div class="mail-empty-list">Unable to load messages.</div>';
    }
  }

  mountMailModalsToBody();
  init();
})();
