(function () {
  const contextElement = document.getElementById('operationalMailContext');
  const mailList = document.getElementById('mailList');
  const threadModal = document.getElementById('threadModal');
  const closeThreadBtn = document.getElementById('closeThreadBtn');
  const threadContent = document.getElementById('threadContent');
  const threadTitle = document.getElementById('threadTitle');
  const composeModal = document.getElementById('composeModal');
  const rejectRequestModal = document.getElementById('rejectRequestModal');
  const rejectRequestForm = document.getElementById('rejectRequestForm');
  const rejectRequestReason = document.getElementById('rejectRequestReason');
  const rejectRequestSubject = document.getElementById('rejectRequestSubject');
  const rejectRequestMessage = document.getElementById('rejectRequestMessage');
  const closeRejectModalBtn = document.getElementById('closeRejectModalBtn');
  const cancelRejectBtn = document.getElementById('cancelRejectBtn');
  const openComposeBtn = document.getElementById('openComposeBtn');
  const closeComposeBtn = document.getElementById('closeComposeBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const searchInput = document.getElementById('searchInput');
  const stationFilterSelect = document.getElementById('stationFilterSelect');
  const sortSelect = document.getElementById('sortSelect');
  const composeForm = document.getElementById('composeForm');
  const threadActions = document.getElementById('threadActions');
  const threadRequestSummary = document.getElementById('threadRequestSummary');
  const threadMessagesLabel = document.getElementById('threadMessagesLabel');
  const threadActionButtons = document.getElementById('threadActionButtons');
  const threadReplyComposer = document.getElementById('threadReplyComposer');
  const threadReplyToLabel = document.getElementById('threadReplyToLabel');
  const threadReplyBodyEditor = document.getElementById('threadReplyBodyEditor');
  const closeThreadReplyBtn = document.getElementById('closeThreadReplyBtn');
  const cancelThreadReplyBtn = document.getElementById('cancelThreadReplyBtn');
  const sendThreadReplyBtn = document.getElementById('sendThreadReplyBtn');
  const requestTimeline = document.getElementById('requestTimeline');
  const timelineRequestTitle = document.getElementById('timelineRequestTitle');
  const timelineStepsContainer = document.getElementById('timelineSteps');
  const timelineNote = document.getElementById('timelineNote');
  const composeSubject = document.getElementById('composeSubject');
  const composeStationSelect = document.getElementById('composeSourceStationSelect');
  const composeRoutedToLabel = document.getElementById('composeRoutedToLabel');
  const composeSourceStationHint = document.getElementById('composeSourceStationHint');
  const composeCloudinaryUrl = document.getElementById('composeCloudinaryUrl');
  const composeSelectedCloudFiles = document.getElementById('composeSelectedCloudFiles');
  const composeFulfillRequestSummary = document.getElementById('composeFulfillRequestSummary');
  const composeOrgmailHint = document.getElementById('composeOrgmailHint');
  const composeOrgmailUploadRow = document.getElementById('composeOrgmailUploadRow');
  const composeOrgmailFile = document.getElementById('composeOrgmailFile');
  const composeOrgmailUploadBtn = document.getElementById('composeOrgmailUploadBtn');
  const composeBodyEditor = document.getElementById('composeBodyEditor');
  const composeBody = document.getElementById('composeBody');
  const composeCloudSection = document.getElementById('composeCloudSection');
  const composeRefFields = document.getElementById('composeRefFields');
  const composeRefIncidentDateFrom = document.getElementById('composeRefIncidentDateFrom');
  const composeRefIncidentDateTo = document.getElementById('composeRefIncidentDateTo');
  const composeRefRespondersList = document.getElementById('composeRefRespondersList');
  const composeRefAllResponders = document.getElementById('composeRefAllResponders');
  const composeRefLocation = document.getElementById('composeRefLocation');
  const composeRefCaseId = document.getElementById('composeRefCaseId');
  const composeLocalAttachmentsField = document.getElementById('composeLocalAttachmentsField');
  const composeAttachFilesBtn = document.getElementById('composeAttachFilesBtn');
  const composeLocalAttachments = document.getElementById('composeLocalAttachments');
  const composeAttachmentList = document.getElementById('composeAttachmentList');
  const composeMessage = document.getElementById('composeMessage');
  const sendBtn = document.getElementById('sendBtn');
  const saveDraftBtn = document.getElementById('saveDraftBtn');
  const inboxCount = document.getElementById('ticketQueueCount');
  const unreadCount = document.getElementById('ticketClaimedCount');
  const sentCount = document.getElementById('ticketCompletedCount');
  const draftCount = document.getElementById('ticketDraftCount');
  const opsDraftStatCard = document.getElementById('opsDraftStatCard');
  const opsTicketTabsCentral = document.getElementById('opsTicketTabsCentral');
  const opsTicketTabsRequester = document.getElementById('opsTicketTabsRequester');
  const opsMailFilters = document.getElementById('opsMailFilters');
  const stationFilterField = document.getElementById('stationFilterField');
  const opsTicketStats = document.getElementById('opsTicketStats');
  const mailFolderTitle = document.getElementById('mailFolderTitle');
  const mailActiveFilter = document.getElementById('mailActiveFilter');
  
  // File picker elements
  const cloudinaryFilePicker = document.getElementById('cloudinaryFilePicker');
  const closeFilePickerBtn = document.getElementById('closeFilePicker');
  const browseCloudinareFilesBtn = document.getElementById('browseCloudinareFilesBtn');
  const filePickerLoading = document.getElementById('filePickerLoading');
  const filePickerError = document.getElementById('filePickerError');
  const filePickerErrorMessage = document.getElementById('filePickerErrorMessage');
  const filePickerContent = document.getElementById('filePickerContent');
  const filePickerFolder = document.getElementById('filePickerFolder');
  const filePickerCount = document.getElementById('filePickerCount');
  const filePickerList = document.getElementById('filePickerList');
  const filePickerSelected = document.getElementById('filePickerSelected');
  const filePickerSelectedInfo = document.getElementById('filePickerSelectedInfo');
  const filePickerRefreshBtn = document.getElementById('filePickerRefreshBtn');
  const filePickerBackBtn = document.getElementById('filePickerBackBtn');
  const filePickerSelectBtn = document.getElementById('filePickerSelectBtn');

  if (!contextElement || !mailList || !threadModal || !threadContent || !threadTitle || !threadActions || !requestTimeline || !timelineRequestTitle || !timelineStepsContainer || !timelineNote || !composeModal || !openComposeBtn || !closeComposeBtn || !closeThreadBtn || !refreshBtn || !searchInput || !stationFilterSelect || !sortSelect || !composeForm || !composeSubject || !composeStationSelect || !composeBodyEditor || !composeMessage || !sendBtn || !saveDraftBtn || !inboxCount || !unreadCount || !sentCount || !draftCount || !mailFolderTitle || !mailActiveFilter) {
    return;
  }

  function mountMailModalsToBody() {
    [composeModal, threadModal, rejectRequestModal, cloudinaryFilePicker].forEach(function (el) {
      if (el && el.parentElement !== document.body) {
        document.body.appendChild(el);
      }
    });
  }

  function syncMailModalScrollLock() {
    const composeOpen = !composeModal.hidden;
    const threadOpen = threadModal && !threadModal.hidden;
    const rejectOpen = rejectRequestModal && !rejectRequestModal.hidden;
    const pickerOpen = cloudinaryFilePicker && !cloudinaryFilePicker.hidden;
    document.body.classList.toggle('mail-modal-open', composeOpen || threadOpen || rejectOpen || pickerOpen);
  }

  function openThreadModal() {
    if (!threadModal) {
      return;
    }
    threadModal.hidden = false;
    syncMailModalScrollLock();
  }

  function hideThreadModalForOverlay() {
    if (!threadModal) {
      return;
    }
    threadModal.hidden = true;
    syncMailModalScrollLock();
  }

  function reopenThreadModalIfNeeded() {
    if (state.threadDetail && state.threadDetail.thread && threadModal) {
      threadModal.hidden = false;
      syncMailModalScrollLock();
    }
  }

  function setRejectModalMessage(text, isError) {
    if (!rejectRequestMessage) {
      return;
    }
    rejectRequestMessage.textContent = text;
    rejectRequestMessage.style.color = isError ? '#fca5a5' : '#86efac';
  }

  function openRejectModal(detail, action) {
    if (!rejectRequestModal || !detail || !detail.requestRoute) {
      return;
    }
    state.rejectModalDetail = detail;
    state.rejectModalAction = action || 'request-target-reject';
    if (rejectRequestSubject) {
      rejectRequestSubject.textContent = (detail.thread && detail.thread.subject) ? detail.thread.subject : 'Operational request';
    }
    if (rejectRequestReason) {
      rejectRequestReason.value = '';
    }
    setRejectModalMessage('', false);
    hideThreadModalForOverlay();
    rejectRequestModal.hidden = false;
    syncMailModalScrollLock();
    if (rejectRequestReason) {
      rejectRequestReason.focus();
    }
  }

  function closeRejectModal() {
    if (!rejectRequestModal) {
      return;
    }
    rejectRequestModal.hidden = true;
    state.rejectModalDetail = null;
    syncMailModalScrollLock();
    reopenThreadModalIfNeeded();
  }

  async function submitRejectModal(event) {
    if (event) {
      event.preventDefault();
    }
    const detail = state.rejectModalDetail;
    if (!detail || !detail.requestRoute || !detail.requestRoute.routeId) {
      setRejectModalMessage('Unable to locate this request.', true);
      return;
    }
    const reason = rejectRequestReason ? String(rejectRequestReason.value || '').trim() : '';
    if (reason === '') {
      setRejectModalMessage('Enter a rejection reason before continuing.', true);
      if (rejectRequestReason) {
        rejectRequestReason.focus();
      }
      return;
    }

    try {
      setRejectModalMessage('Submitting rejection…', false);
      await submitRouteAction(state.rejectModalAction || 'request-target-reject', {
        routeId: Number(detail.requestRoute.routeId || 0),
        reason: reason
      });
      closeRejectModal();
      closeThreadModal();
      await fetchBootstrap();
      await fetchList();
      setMessage('Request rejected.', false);
    } catch (error) {
      setRejectModalMessage(error.message || 'Unable to reject this request.', true);
    }
  }

  function hideThreadModalForCompose() {
    if (!threadModal) {
      return;
    }
    threadModal.hidden = true;
    syncMailModalScrollLock();
  }

  function closeThreadModal() {
    if (!threadModal) {
      return;
    }
    closeThreadReply();
    threadModal.hidden = true;
    state.activeThread = null;
    state.threadDetail = null;
    syncMailModalScrollLock();
    if (isCentralReviewer()) {
      fetchList().catch(function () { renderList(); });
    } else {
      renderList();
    }
  }

  function getThreadReplyBodyHtml() {
    return threadReplyBodyEditor ? String(threadReplyBodyEditor.innerHTML || '').trim() : '';
  }

  function clearThreadReplyBody() {
    if (threadReplyBodyEditor) {
      threadReplyBodyEditor.innerHTML = '';
    }
  }

  function isThreadReplyBodyEmpty() {
    const text = getThreadReplyBodyHtml()
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .trim();
    return text === '';
  }

  function closeThreadReply() {
    if (threadReplyComposer) {
      threadReplyComposer.hidden = true;
    }
    if (threadActionButtons) {
      threadActionButtons.hidden = false;
    }
    clearThreadReplyBody();
    state.threadReplyDetail = null;
  }

  function openThreadReply(detail) {
    const requestRoute = (detail && detail.requestRoute) ? detail.requestRoute : {};
    state.threadReplyDetail = detail;
    if (threadReplyToLabel) {
      const who = String(requestRoute.requestUsername || 'requester');
      const station = requestRoute.originStationName ? (' · ' + String(requestRoute.originStationName)) : '';
      threadReplyToLabel.textContent = 'To: ' + who + station;
    }
    clearThreadReplyBody();
    if (threadReplyComposer) {
      threadReplyComposer.hidden = false;
    }
    if (threadActionButtons) {
      threadActionButtons.hidden = true;
    }
    if (threadReplyBodyEditor) {
      threadReplyBodyEditor.focus();
    }
  }

  async function submitThreadReply() {
    const detail = state.threadReplyDetail || state.threadDetail;
    if (!detail || !detail.requestRoute || !detail.requestRoute.routeId) {
      throw new Error('Unable to locate this request.');
    }
    if (isThreadReplyBodyEmpty()) {
      throw new Error('Write your reply before sending.');
    }

    await submitRouteAction('request-target-edit', {
      routeId: Number(detail.requestRoute.routeId || 0),
      body: getThreadReplyBodyHtml()
    });

    closeThreadReply();
    setMessage('Reply sent to the requester.', false);
    await openThread(detail.thread.threadId);
    await fetchBootstrap();
    await fetchList();
  }

  function syncThreadFooterVisibility(hasActions) {
    if (!threadActions) {
      return;
    }
    const replyOpen = threadReplyComposer && !threadReplyComposer.hidden;
    threadActions.hidden = !hasActions && !replyOpen;
  }

  function formatRequestStatus(status) {
    const value = String(status || '').toLowerCase();
    const labels = {
      pending_origin_review: 'Pending review',
      approved: 'Approved',
      rejected: 'Rejected',
      forwarded_to_target: 'Awaiting MCFS review',
      routed_to_user: 'Being processed',
      file_returned_to_coml: 'File ready',
      returned_to_origin: 'Returned to station',
      completed: 'Completed'
    };
    return labels[value] || value.replace(/_/g, ' ');
  }

  function ticketStatusValue(item) {
    return String(item.status || (item.requestRoute && item.requestRoute.status) || '').toLowerCase();
  }

  function ticketHandlerId(item) {
    return Number(item.handlingComlUserId || (item.requestRoute && item.requestRoute.handlingComlUserId) || 0);
  }

  function ticketHandlerName(item) {
    return String(item.handlingComlUsername || (item.requestRoute && item.requestRoute.handlingComlUsername) || '');
  }

  function isTicketTerminalStatus(status) {
    return ['completed', 'rejected'].indexOf(String(status || '').toLowerCase()) !== -1;
  }

  function ticketTabCategory(item) {
    const status = ticketStatusValue(item);
    if (isTicketTerminalStatus(status)) {
      return 'completed';
    }
    if (ticketHandlerId(item) > 0) {
      return 'claimed';
    }
    return 'queue';
  }

  function getTicketStatusPresentation(item) {
    const status = ticketStatusValue(item);
    const handlerId = ticketHandlerId(item);
    const handlerName = ticketHandlerName(item);
    const me = currentUserId();
    const handlerLabel = handlerId > 0
      ? (handlerId === me ? 'You' : handlerName || 'ComL user')
      : '';

    if (status === 'completed') {
      return { label: 'Completed', tone: 'completed', handlerLabel: handlerLabel };
    }
    if (status === 'rejected') {
      return { label: 'Rejected', tone: 'rejected', handlerLabel: handlerLabel };
    }
    if (handlerId > 0) {
      if (['routed_to_user', 'file_returned_to_coml', 'returned_to_origin'].indexOf(status) !== -1) {
        return { label: 'Being processed', tone: 'processing', handlerLabel: handlerLabel };
      }
      return { label: 'Claimed', tone: 'claimed', handlerLabel: handlerLabel };
    }
    return { label: 'Open', tone: 'queue', handlerLabel: '' };
  }

  function allTicketItems() {
    const reviewer = isCentralReviewer();
    const sourceItems = reviewer ? state.requestTracking : state.items;
    return (Array.isArray(sourceItems) ? sourceItems : []).filter(function (item) {
      if (reviewer || isCentralStation()) {
        return true;
      }
      return item.mailType === 'request' && item.requestFiles;
    });
  }

  function countTicketsByTab() {
    const counts = { queue: 0, claimed: 0, completed: 0 };
    allTicketItems().forEach(function (item) {
      const tab = ticketTabCategory(item);
      if (counts[tab] !== undefined) {
        counts[tab] += 1;
      }
    });
    return counts;
  }

  const apiUrl = String((JSON.parse(contextElement.textContent || '{}') || {}).mailApiUrl || '/firenet/NEWFIRENET/backend/controllers/station_mails.php');
  const storageBrowserUrl = '/firenet/NEWFIRENET/backend/controllers/r2_storage.php';
  const legacyStorageBrowserUrl = '/firenet/NEWFIRENET/backend/controllers/cloudinary_browser.php';
  const cloudinaryShareUrl = '/firenet/NEWFIRENET/backend/controllers/cloudinary_share.php';
  
  // Share link elements
  const generateShareLinkBtn = document.getElementById('generateShareLinkBtn');
  const generatedShareLinkRow = document.getElementById('generatedShareLinkRow');
  const generatedShareLink = document.getElementById('generatedShareLink');
  const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
  
  const state = {
    ticketTab: 'queue',
    folder: 'inbox',
    search: '',
    stationFilter: '',
    sort: 'latest',
    bootstrap: null,
    items: [],
    requestTracking: [],
    activeThread: null,
    threadDetail: null,
    threadReplyDetail: null,
    reopenThreadAfterCompose: false,
    composeReplyMode: false,
    composeCentralFulfillMode: false,
    composeReplyThreadId: 0,
    composeFulfillRouteId: 0,
    composeReplyOriginStationId: 0,
    rejectModalDetail: null,
    rejectModalAction: 'request-target-reject',
    composeSelectedCloudFiles: [],
    localAttachments: [],
    // File picker state
    filePickerLoading: false,
    filePickerFiles: [],
    filePickerFolder: '',
    filePickerSelectedFile: null,
    filePickerSelectedFiles: [],
    filePickerVirtualPath: ''
  };

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getComposeBodyHtml() {
    return composeBodyEditor ? String(composeBodyEditor.innerHTML || '').trim() : '';
  }

  function isComposeBodyEmpty() {
    const text = getComposeBodyHtml()
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .trim();
    return text === '';
  }

  function setComposeBodyHtml(value) {
    if (!composeBodyEditor) {
      return;
    }
    const html = String(value || '');
    if (/<[a-z][\s\S]*>/i.test(html)) {
      composeBodyEditor.innerHTML = html;
    } else if (html === '') {
      composeBodyEditor.innerHTML = '';
    } else {
      composeBodyEditor.innerHTML = escapeHtml(html).replace(/\n/g, '<br>');
    }
    if (composeBody) {
      composeBody.value = getComposeBodyHtml();
    }
  }

  function clearComposeBody() {
    setComposeBodyHtml('');
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

  function isRejectedRequestStatus(status) {
    return String(status || '').toLowerCase() === 'rejected';
  }

  function requestOutcomeMeta(status) {
    const value = String(status || '').toLowerCase();
    if (value === 'rejected') {
      return { tone: 'rejected', label: 'Rejected', icon: 'bi-x-circle-fill' };
    }
    if (value === 'completed') {
      return { tone: 'completed', label: 'Delivered', icon: 'bi-check-circle-fill' };
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

  function clearLocalAttachments() {
    state.localAttachments = [];
    if (composeLocalAttachments) {
      composeLocalAttachments.value = '';
    }
    renderComposeAttachments();
  }

  function clearSelectedCloudFiles() {
    state.composeSelectedCloudFiles = [];
    if (composeCloudinaryUrl) {
      composeCloudinaryUrl.value = '';
    }
    renderSelectedCloudFiles();
    updateComposeMode();
  }

  function usesMultiCloudAttachmentMode() {
    return Boolean(state.composeCentralFulfillMode || state.composeReplyMode);
  }

  function appendCloudFilesToSelection(files) {
    (Array.isArray(files) ? files : []).forEach(function (file) {
      const url = String(file && file.url ? file.url : '').trim();
      if (url === '') {
        return;
      }
      const exists = state.composeSelectedCloudFiles.some(function (entry) {
        return String(entry.url || '').trim() === url;
      });
      if (!exists) {
        state.composeSelectedCloudFiles.push({
          public_id: file.public_id || '',
          filename: file.filename || 'Attached file',
          url: url
        });
      }
    });
    if (composeCloudinaryUrl) {
      composeCloudinaryUrl.value = state.composeSelectedCloudFiles.map(function (file) {
        return file.url;
      }).join('\n');
    }
    renderSelectedCloudFiles();
    updateComposeMode();
  }

  function collectComposeCloudinaryUrls() {
    const urls = state.composeSelectedCloudFiles.map(function (file) {
      return String(file.url || '').trim();
    }).filter(Boolean);
    const manual = composeCloudinaryUrl ? String(composeCloudinaryUrl.value || '').trim() : '';
    if (manual !== '') {
      manual.split(/\r?\n/).map(function (line) {
        return String(line || '').trim();
      }).filter(Boolean).forEach(function (url) {
        if (urls.indexOf(url) === -1) {
          urls.push(url);
        }
      });
    }
    return urls;
  }

  function renderSelectedCloudFiles() {
    if (!composeSelectedCloudFiles) {
      return;
    }
    const files = Array.isArray(state.composeSelectedCloudFiles) ? state.composeSelectedCloudFiles : [];
    if (!files.length) {
      composeSelectedCloudFiles.hidden = true;
      composeSelectedCloudFiles.innerHTML = '';
      return;
    }

    composeSelectedCloudFiles.hidden = false;
    composeSelectedCloudFiles.innerHTML = '<div class="mail-selected-cloud-files-head">' +
      '<span class="mail-selected-cloud-files-title">Selected file' + (files.length > 1 ? 's' : '') + '</span>' +
      '<button type="button" class="secondary-btn" id="clearSelectedCloudFilesBtn">Clear</button>' +
      '</div>' +
      '<div class="mail-selected-cloud-files-list">' +
      files.map(function (file, index) {
        return '<div class="mail-selected-cloud-file-chip">' +
          '<span>' + escapeHtml(file.filename || ('File ' + (index + 1))) + '</span>' +
          '<button type="button" data-remove-cloud-file="' + index + '" aria-label="Remove file">×</button>' +
        '</div>';
      }).join('') +
      '</div>';

    const clearBtn = document.getElementById('clearSelectedCloudFilesBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        clearSelectedCloudFiles();
      });
    }
    Array.from(composeSelectedCloudFiles.querySelectorAll('[data-remove-cloud-file]')).forEach(function (button) {
      button.addEventListener('click', function () {
        const index = Number(button.getAttribute('data-remove-cloud-file') || -1);
        if (index < 0) {
          return;
        }
        state.composeSelectedCloudFiles.splice(index, 1);
        if (composeCloudinaryUrl) {
          composeCloudinaryUrl.value = state.composeSelectedCloudFiles.map(function (file) { return file.url; }).join('\n');
        }
        renderSelectedCloudFiles();
      });
    });
  }

  function clearReferenceFields() {
    if (composeRefIncidentDateFrom) composeRefIncidentDateFrom.value = '';
    if (composeRefIncidentDateTo) composeRefIncidentDateTo.value = '';
    respondingCheckboxes().forEach(function (checkbox) {
      checkbox.checked = false;
    });
    if (composeRefAllResponders) composeRefAllResponders.checked = false;
    if (composeRefLocation) composeRefLocation.value = '';
    if (composeRefCaseId) composeRefCaseId.value = '';
    updateRespondersUi();
  }

  function respondingCheckboxes() {
    if (!composeRefRespondersList) {
      return [];
    }
    return Array.prototype.slice.call(composeRefRespondersList.querySelectorAll('.mail-compose-responder-check'));
  }

  function updateRespondersUi() {
    if (!composeRefRespondersList || !composeRefAllResponders) {
      return;
    }
    const all = composeRefAllResponders.checked;
    composeRefRespondersList.classList.toggle('is-disabled', all);
    if (all) {
      respondingCheckboxes().forEach(function (checkbox) {
        checkbox.checked = false;
      });
    }
  }

  function selectedRespondingStationIds() {
    return respondingCheckboxes().filter(function (checkbox) {
      return checkbox.checked && checkbox.value !== '';
    }).map(function (checkbox) {
      return checkbox.value;
    });
  }

  function renderComposeAttachments() {
    if (!composeAttachmentList) {
      return;
    }
    if (!state.localAttachments.length) {
      composeAttachmentList.hidden = true;
      composeAttachmentList.innerHTML = '';
      return;
    }

    composeAttachmentList.hidden = false;
    composeAttachmentList.innerHTML = state.localAttachments.map(function (file, index) {
      return '<li class="mail-compose-attachment-chip">' +
        '<span>' + escapeHtml(file.name) + '</span>' +
        '<button type="button" data-remove-attachment="' + String(index) + '" aria-label="Remove ' + escapeHtml(file.name) + '">×</button>' +
      '</li>';
    }).join('');
  }

  function addLocalAttachments(fileList) {
    const files = Array.from(fileList || []);
    files.forEach(function (file) {
      if (!file || !file.name) {
        return;
      }
      const duplicate = state.localAttachments.some(function (existing) {
        return existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified;
      });
      if (!duplicate) {
        state.localAttachments.push(file);
      }
    });
    renderComposeAttachments();
  }

  function setMessage(text, isError) {
    composeMessage.textContent = text;
    composeMessage.style.color = isError ? '#b8333b' : '#1f5e2d';
  }

  function updateCounts(meta) {
    if (isCentralReviewer()) {
      const counts = countTicketsByTab();
      if (inboxCount) inboxCount.textContent = String(counts.queue);
      if (unreadCount) unreadCount.textContent = String(counts.claimed);
      if (sentCount) sentCount.textContent = String(counts.completed);
      if (draftCount) draftCount.textContent = '0';
      return;
    }
    if (inboxCount) inboxCount.textContent = String((meta.folders && meta.folders.inbox) || 0);
    if (unreadCount) unreadCount.textContent = String((meta.folders && meta.folders.unread) || 0);
    if (sentCount) sentCount.textContent = String((meta.folders && meta.folders.sent) || 0);
    if (draftCount) draftCount.textContent = String((meta.folders && meta.folders.drafts) || 0);
  }

  function getOperationalOrgmailMeta() {
    return state.bootstrap && state.bootstrap.operationalOrgmail ? state.bootstrap.operationalOrgmail : {};
  }

  function storageProviderLabel() {
    const om = getOperationalOrgmailMeta();
    return String(om.storageLabel || (om.provider === 'r2' ? 'Cloudflare R2' : 'cloud storage'));
  }

  function getCentralStation() {
    const om = getOperationalOrgmailMeta();
    return om.centralStation || state.bootstrap.centralStation || null;
  }

  function getCentralStationId() {
    const central = getCentralStation();
    return central && central.stationId ? String(central.stationId) : '';
  }

  function getCurrentStationId() {
    const currentUser = state.bootstrap && state.bootstrap.currentUser ? state.bootstrap.currentUser : {};
    return String(currentUser.stationId || '');
  }

  function isCentralStation() {
    const om = getOperationalOrgmailMeta();
    if (om.isCentralStation) {
      return true;
    }
    const currentUser = state.bootstrap && state.bootstrap.currentUser ? state.bootstrap.currentUser : {};
    return Boolean(currentUser.isCentralStation);
  }

  function isCentralReviewer() {
    return isComlUser() && isCentralStation();
  }

  function ticketTabTitles() {
    if (isCentralReviewer()) {
      return {
        queue: 'Ticket queue',
        claimed: 'In progress',
        completed: 'Completed'
      };
    }
    return {
      updates: 'Updates from central',
      sent: 'My requests',
      drafts: 'Draft requests'
    };
  }

  function ticketTabDescriptions() {
    if (isCentralReviewer()) {
      return {
        queue: 'Unclaimed requests waiting for a ComL to pick up',
        claimed: 'Requests claimed by a ComL and still being worked on',
        completed: 'Finished or rejected requests'
      };
    }
    return {
      updates: 'Responses and releases from central ComL',
      sent: 'Requests you have submitted to MCFS',
      drafts: 'Saved drafts not yet sent'
    };
  }

  function ticketEmptyMessage() {
    if (isCentralReviewer()) {
      if (state.ticketTab === 'claimed') {
        return 'No requests are in progress right now.';
      }
      if (state.ticketTab === 'completed') {
        return 'No completed requests yet.';
      }
      return 'The queue is empty — no unclaimed requests.';
    }
    if (state.ticketTab === 'sent') {
      return 'You have not submitted any file requests yet.';
    }
    if (state.ticketTab === 'drafts') {
      return 'No draft requests.';
    }
    return 'No updates from central yet.';
  }

  function syncTicketTabUi() {
    const reviewer = isCentralReviewer();
    const activeTab = reviewer ? state.ticketTab : state.ticketTab;
    const titles = ticketTabTitles();
    const descriptions = ticketTabDescriptions();

    if (opsTicketTabsCentral) {
      opsTicketTabsCentral.hidden = !reviewer;
    }
    if (opsTicketTabsRequester) {
      opsTicketTabsRequester.hidden = reviewer;
    }
    if (opsDraftStatCard) {
      opsDraftStatCard.hidden = reviewer;
    }
    if (opsTicketStats) {
      opsTicketStats.classList.toggle('is-requester-stats', !reviewer);
    }
    if (opsMailFilters && stationFilterField) {
      stationFilterField.hidden = !reviewer;
    }

    const tabContainer = reviewer ? opsTicketTabsCentral : opsTicketTabsRequester;
    if (tabContainer) {
      Array.from(tabContainer.querySelectorAll('.ops-ticket-tab')).forEach(function (button) {
        const tab = button.getAttribute('data-ticket-tab');
        const isActive = tab === activeTab;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    mailFolderTitle.textContent = titles[activeTab] || 'Requests';
    mailActiveFilter.textContent = descriptions[activeTab] || '';
  }

  function applyOperationalModeUi() {
    const central = isCentralStation();
    const reviewer = isCentralReviewer();
    const heroNote = document.querySelector('.mail-hero-operational .muted-text');
    const statLabels = document.querySelectorAll('.ops-ticket-stats .mail-stat-card span');

    if (heroNote) {
      heroNote.textContent = reviewer
        ? 'Review incoming file requests from all stations. MCFS locates and releases reports from central records.'
        : 'Submit file requests to Makati Central Fire Station. Only central ComL approves and fulfills requests.';
    }

    if (statLabels.length >= 4) {
      if (reviewer) {
        statLabels[0].textContent = 'Queue';
        statLabels[1].textContent = 'In progress';
        statLabels[2].textContent = 'Completed';
        statLabels[3].textContent = 'Drafts';
      } else {
        statLabels[0].textContent = 'Updates';
        statLabels[1].textContent = 'Unread';
        statLabels[2].textContent = 'My requests';
        statLabels[3].textContent = 'Drafts';
      }
    }

    if (!central && !state._operationalModeInitialized && state.ticketTab === 'queue') {
      state.ticketTab = 'sent';
      state.folder = 'sent';
    }
    state._operationalModeInitialized = true;
    syncTicketTabUi();
  }

  function getDefaultSourceStationId() {
    return getCurrentStationId();
  }

  function setDefaultSourceStation() {
    if (state.composeReplyMode || !composeStationSelect) {
      return;
    }

    const defaultStationId = getDefaultSourceStationId();
    if (defaultStationId !== '') {
      composeStationSelect.value = defaultStationId;
    }
    updateSourceStationUi();
  }

  function updateRoutedToLabel() {
    const central = getCentralStation();
    if (composeRoutedToLabel) {
      composeRoutedToLabel.textContent = central && central.stationName
        ? central.stationName
        : 'Makati Central Fire Station';
    }
  }

  function getSelectedSourceStation() {
    const stations = Array.isArray(state.bootstrap.stations) ? state.bootstrap.stations : [];
    const selectedId = String(composeStationSelect ? composeStationSelect.value : '');
    return stations.find(function (entry) {
      return String(entry.stationId) === selectedId;
    }) || null;
  }

  function updateSourceStationUi() {
    const selected = getSelectedSourceStation();
    const om = getOperationalOrgmailMeta();
    const code = selected && selected.stationCode ? String(selected.stationCode) : String(om.stationCode || '');
    const folderLabel = state.composeCentralFulfillMode
      ? (code !== '' ? ('firenet/reports/' + code) : 'firenet/reports')
      : (code !== '' ? ('firenet/orgmail/' + code) : String(om.stationFolder || 'your station folder'));

    if (composeSourceStationHint) {
      composeSourceStationHint.textContent = selected && selected.stationName
        ? 'Central ComL will retrieve files from ' + selected.stationName + ' (' + folderLabel + ').'
        : 'Choose which station\'s files central ComL should pull from.';
    }

    if (composeOrgmailHint) {
      if (state.composeCentralFulfillMode) {
        composeOrgmailHint.textContent = 'Browse files in ' + folderLabel + ' or upload directly to ' + storageProviderLabel() + ' before sending them to the requester.';
      } else if (state.composeReplyMode) {
        composeOrgmailHint.textContent = 'Attach a file from ' + folderLabel + ' or upload to ' + storageProviderLabel() + ', then return it to the origin ComL.';
      } else if (om.uploadsEnabled) {
        composeOrgmailHint.textContent = 'Browse files in ' + folderLabel + ' or upload directly to ' + storageProviderLabel() + '.';
      } else {
        composeOrgmailHint.textContent = 'Paste a file URL from ' + folderLabel + '.';
      }
    }
  }

  function renderStationOptions() {
    const stations = Array.isArray(state.bootstrap.stations) ? state.bootstrap.stations : [];
    const defaultSourceId = getDefaultSourceStationId();

    stationFilterSelect.innerHTML = '<option value="">All stations</option>' + stations.map(function (entry) {
      return '<option value="' + escapeHtml(String(entry.stationId)) + '">' + escapeHtml(entry.stationName) + '</option>';
    }).join('');

    composeStationSelect.innerHTML = stations.map(function (entry) {
      const selected = String(entry.stationId) === defaultSourceId ? ' selected' : '';
      return '<option value="' + escapeHtml(String(entry.stationId)) + '"' + selected + '>' + escapeHtml(entry.stationName) + '</option>';
    }).join('');

    if (composeRefRespondersList) {
      composeRefRespondersList.innerHTML = stations.map(function (entry) {
        const id = escapeHtml(String(entry.stationId));
        return '<label class="mail-compose-responder-item">' +
          '<input type="checkbox" class="mail-compose-responder-check" value="' + id + '">' +
          '<span>' + escapeHtml(entry.stationName) + '</span>' +
        '</label>';
      }).join('');
    }

    setDefaultSourceStation();
    updateRoutedToLabel();
  }

  function applyBootstrap(payload) {
    state.bootstrap = payload.data || {};
    state.requestTracking = Array.isArray(state.bootstrap.requestTracking) ? state.bootstrap.requestTracking : [];
    updateCounts(state.bootstrap);
    renderStationOptions();
    applyOperationalModeUi();
    if (composeOrgmailUploadRow) {
      composeOrgmailUploadRow.hidden = !getOperationalOrgmailMeta().uploadsEnabled;
    }
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  function visibleItems() {
    const reviewer = isCentralReviewer();
    const items = allTicketItems();

    return items.filter(function (item) {
      if (reviewer && ticketTabCategory(item) !== state.ticketTab) {
        return false;
      }

      const matchesStation = state.stationFilter === '' || String(item.senderStationId || item.originStationId || item.targetStationId || '') === state.stationFilter;
      const matchesSearch = state.search === '' || String(item.subject || '').toLowerCase().includes(state.search.toLowerCase()) || String(item.snippet || item.body || '').toLowerCase().includes(state.search.toLowerCase()) || String(item.senderUsername || item.requestUsername || '').toLowerCase().includes(state.search.toLowerCase());
      return matchesStation && matchesSearch;
    }).sort(function (a, b) {
      if (state.sort === 'oldest') {
        return new Date(a.sentAt || a.createdAt || a.updatedAt).getTime() - new Date(b.sentAt || b.createdAt || b.updatedAt).getTime();
      }
      if (state.sort === 'unread') {
        const unreadA = a.readAt ? 1 : 0;
        const unreadB = b.readAt ? 1 : 0;
        if (unreadA !== unreadB) {
          return unreadA - unreadB;
        }
      }
      return new Date(b.sentAt || b.createdAt || b.updatedAt).getTime() - new Date(a.sentAt || a.createdAt || a.updatedAt).getTime();
    });
  }

  function renderList() {
    const items = visibleItems();
    updateCounts(state.bootstrap || {});
    if (items.length === 0) {
      mailList.innerHTML = '<div class="mail-empty-list">' + escapeHtml(ticketEmptyMessage()) + '</div>';
      return;
    }

    mailList.innerHTML = items.map(function (item) {
      const unreadClass = item.readAt ? '' : ' unread';
      const selectedClass = state.activeThread && state.activeThread.threadId === item.threadId ? ' is-active' : '';
      const presentation = getTicketStatusPresentation(item);
      const detailStatus = formatRequestStatus(ticketStatusValue(item));
      const stationPath = item.originStationName && item.targetStationName
        ? escapeHtml(item.originStationName + ' → ' + item.targetStationName)
        : '';
      const infoLabel = stationPath || escapeHtml(item.originStationName || item.senderStationName || 'Operational request');
      const snippet = item.snippet || item.body || '';
      const handlerLine = presentation.handlerLabel
        ? '<p class="ops-ticket-handler"><i class="bi bi-person-badge" aria-hidden="true"></i> Claimed by <strong>' + escapeHtml(presentation.handlerLabel) + '</strong></p>'
        : (presentation.tone === 'queue' ? '<p class="ops-ticket-handler is-unclaimed"><i class="bi bi-inbox" aria-hidden="true"></i> Unclaimed</p>' : '');
      return '<article class="mail-list-item ops-ticket-item ops-ticket-item--' + escapeHtml(presentation.tone) + unreadClass + selectedClass + '" data-thread-id="' + escapeHtml(String(item.threadId)) + '">' +
        '<div class="mail-list-title"><strong>' + escapeHtml(item.subject || '(No subject)') + '</strong><span>' + escapeHtml(formatDate(item.sentAt || item.createdAt || item.updatedAt)) + '</span></div>' +
        '<div class="mail-list-meta ops-ticket-meta"><span>' + infoLabel + '</span>' +
        '<span class="ops-ticket-status ops-ticket-status--' + escapeHtml(presentation.tone) + '">' + escapeHtml(presentation.label) + '</span>' +
        '<span class="ops-ticket-status-detail">' + escapeHtml(detailStatus) + '</span></div>' +
        handlerLine +
        '<p class="mail-list-snippet">' + escapeHtml(snippet) + '</p>' +
      '</article>';
    }).join('');

    bindListReplyButtons();
  }

  function bindListReplyButtons() {
    Array.from(mailList.querySelectorAll('.mail-list-item')).forEach(function (item) {
      const replyButton = item.querySelector('.mail-request-reply-btn');
      if (!replyButton) {
        return;
      }

      item.style.position = 'relative';
      item.style.overflow = 'visible';
      item.style.paddingRight = '92px';
      replyButton.style.position = 'absolute';
      replyButton.style.top = '50%';
      replyButton.style.right = '12px';
      replyButton.style.transform = 'translateY(-50%)';
      replyButton.style.opacity = '1';
      replyButton.style.pointerEvents = 'auto';
      replyButton.style.zIndex = '3';
      replyButton.style.whiteSpace = 'nowrap';
      replyButton.style.textTransform = 'uppercase';
      replyButton.style.letterSpacing = '0.06em';

      replyButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const threadId = Number(replyButton.getAttribute('data-reply-thread-id') || 0);
        if (threadId < 1) {
          return;
        }
        openThread(threadId).then(function () {
          if (state.threadDetail && canAssignedRequestUserReply(state.threadDetail)) {
            openAssignedReply(state.threadDetail);
          }
        }).catch(function (error) {
          setMessage(error.message, true);
        });
      });
    });
  }

  function renderRequestReferenceBlock(rr) {
    if (!rr) {
      return '';
    }
    const items = [];

    function addItem(label, valueHtml, wide) {
      if (!valueHtml) {
        return;
      }
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

    if (!items.length) {
      return '';
    }

    return '<section class="mail-request-ref">' +
      '<h3 class="mail-request-ref-title">Reference details</h3>' +
      '<div class="mail-request-ref-grid">' + items.join('') + '</div>' +
    '</section>';
  }

  function renderFulfillSummary(detail) {
    if (!composeFulfillRequestSummary) {
      return;
    }
    if (!state.composeCentralFulfillMode || !detail || !detail.requestRoute) {
      composeFulfillRequestSummary.hidden = true;
      composeFulfillRequestSummary.innerHTML = '';
      return;
    }

    const rr = detail.requestRoute || {};
    const bullets = [];
    if (rr.refIncidentDate) {
      bullets.push('Check reports around ' + escapeHtml(rr.refIncidentDate) + (rr.refIncidentDateTo ? (' to ' + escapeHtml(rr.refIncidentDateTo)) : '') + '.');
    }
    if (Array.isArray(rr.refRespondingStations) && rr.refRespondingStations.length) {
      bullets.push('Requested station reports: ' + rr.refRespondingStations.map(function (station) {
        return escapeHtml(station.stationName || '');
      }).join(', ') + '.');
    } else if (rr.refAllRespondingStations) {
      bullets.push('Requester asked for reports from all responding stations.');
    }
    if (rr.refLocation) {
      bullets.push('Location reference: ' + escapeHtml(rr.refLocation) + '.');
    }
    if (rr.refCaseId) {
      bullets.push('Case / incident ID: ' + escapeHtml(rr.refCaseId) + '.');
    }

    const note = bullets.length
      ? '<ul class="file-picker-selected-list">' + bullets.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>'
      : '<p class="mail-fulfill-summary-note">Review the thread details, then select the matching report file(s) from the reports folder.</p>';

    composeFulfillRequestSummary.hidden = false;
    composeFulfillRequestSummary.innerHTML =
      '<div class="mail-fulfill-summary-head">' +
        '<div>' +
          '<p class="mail-fulfill-summary-title">What to send</p>' +
          '<p class="mail-fulfill-summary-note">Use these request clues to match the correct report file(s) before sending.</p>' +
        '</div>' +
      '</div>' +
      note;
  }

  function renderThreadSummary(detail) {
    const rr = detail.requestRoute || {};
    const metaBlock = renderRequestMetaBlock(rr);
    const refBlock = renderRequestReferenceBlock(rr);
    const confParts = [];
    if (rr.isConfidential) {
      confParts.push('<span class="mail-badge">Confidential</span>');
    }
    if (rr.targetConfidentialConfirmed) {
      confParts.push('<span class="mail-badge">Target confirmed</span>');
    }
    if (rr.releasedAccessMode) {
      confParts.push('<span class="mail-badge">' + escapeHtml(String(rr.releasedAccessMode).replace(/_/g, ' ')) + '</span>');
    }
    const confBlock = confParts.length
      ? '<div class="mail-thread-summary-badges">' + confParts.join(' ') + '</div>'
      : '';
    const html = renderRouteHandlerBanner(detail) + metaBlock + confBlock + renderRequestDescriptionBlock(detail) + refBlock;
    if (threadRequestSummary) {
      threadRequestSummary.innerHTML = html;
      threadRequestSummary.hidden = html === '';
    }
  }

  function renderThreadMessages(detail) {
    const messages = Array.isArray(detail.messages) ? detail.messages : [];
    if (messages.length === 0) {
      threadContent.innerHTML = '';
      threadContent.hidden = true;
      return;
    }

    threadContent.innerHTML = messages.map(function (message) {
      const attachments = Array.isArray(message.attachments) ? message.attachments.map(function (attachment) {
        const aid = String(attachment.attachmentId || '');
        const href = escapeHtml(attachment.downloadUrl || '#');
        return '<a class="mail-attachment-link" href="' + href + '" data-attachment-id="' + escapeHtml(aid) + '" target="_blank" rel="noreferrer">' + escapeHtml(attachment.originalFileName) + '</a>';
      }).join('') : '';

      const requestTags = [];
      if (message.mailType === 'request') {
        requestTags.push('<span class="mail-badge">Request</span>');
      }
      return '<article class="mail-thread-message">' +
        '<div class="mail-thread-message-head"><strong>' + escapeHtml(message.senderStationName || '') + '</strong><span>' + escapeHtml(formatDate(message.sentAt || message.createdAt)) + '</span></div>' +
        '<div class="mail-thread-message-meta"><span>' + escapeHtml(message.senderUsername || '') + '</span>' + requestTags.join(' ') + '</div>' +
        formatMessageBody(messageDisplayBody(message, detail)) +
        (attachments ? '<div class="mail-attachments">' + attachments + '</div>' : '') +
      '</article>';
    }).join('');
    threadContent.hidden = false;
  }

  function renderRequestMetaBlock(rr) {
    if (!rr || !rr.routeId) {
      return '';
    }
    const cards = [
      '<div class="mail-request-meta-card"><span>Status</span>' + renderRequestStatusValue(rr.status) + '</div>',
      '<div class="mail-request-meta-card"><span>From station</span><strong>' + escapeHtml(rr.originStationName || '—') + '</strong></div>',
      '<div class="mail-request-meta-card"><span>Requested by</span><strong>' + escapeHtml(rr.requestUsername || '—') + '</strong></div>'
    ];
    if (rr.assignedUsername && !isCentralReviewer()) {
      cards.push('<div class="mail-request-meta-card"><span>Assigned to</span><strong>' + escapeHtml(rr.assignedUsername) + '</strong></div>');
    }
    if (rr.handlingComlUsername && isComlUser()) {
      const handlerLabel = Number(rr.handlingComlUserId || 0) === currentUserId() ? 'You' : rr.handlingComlUsername;
      cards.push('<div class="mail-request-meta-card"><span>ComL handler</span><strong>' + escapeHtml(handlerLabel) + '</strong></div>');
    }
    const rejectReason = String(rr.targetReviewNotes || rr.originReviewNotes || '').trim();
    if (String(rr.status || '').toLowerCase() === 'rejected' && rejectReason) {
      cards.push('<div class="mail-request-meta-card mail-request-meta-card--wide"><span>Rejection reason</span><strong>' + escapeHtml(rejectReason) + '</strong></div>');
    }
    return '<div class="mail-request-meta">' + cards.join('') + '</div>';
  }

  function renderThread(detail) {
    state.threadDetail = detail;
    closeThreadReply();
    const thread = detail.thread || {};
    threadTitle.textContent = thread.subject || 'Request detail';
    const kicker = document.getElementById('threadModalKicker');
    if (kicker) {
      kicker.textContent = isCentralReviewer() ? 'Incoming request' : 'Your request';
    }
    renderRequestTimeline(detail);
    renderThreadSummary(detail);
    renderThreadMessages(detail);
    if (threadActionButtons) {
      threadActionButtons.innerHTML = renderThreadActions(detail);
    }
    syncThreadFooterVisibility(Boolean(threadActionButtons && threadActionButtons.innerHTML !== ''));
    bindThreadActionButtons(detail);
    openThreadModal();
  }

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
    const handlerName = String(rr.handlingComlUsername || '');
    const onMyQueue = activeStationId > 0 && activeStationId === myStationId;
    return {
      handlerId: handlerId,
      handlerName: handlerName,
      onMyQueue: onMyQueue,
      isMine: onMyQueue && handlerId > 0 && handlerId === me,
      isTaken: onMyQueue && handlerId > 0 && handlerId !== me,
      isAvailable: onMyQueue && handlerId < 1
    };
  }

  function comlBlockedByOtherHandler(detail) {
    if (!isComlUser()) {
      return false;
    }
    return routeHandlerContext((detail && detail.requestRoute) || {}).isTaken;
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
    if (ctx.isAvailable) {
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
    const threadId = detail && detail.thread && detail.thread.threadId;
    let updated = await claimThreadRoute(detail);
    if (Number((updated.requestRoute && updated.requestRoute.handlingComlUserId) || 0) !== currentUserId()) {
      throw new Error('Unable to claim this request.');
    }
    if (isCentralReviewer()) {
      await fetchBootstrap();
    }
    state.threadDetail = updated;
    renderThread(updated);
    renderList();
    return updated;
  }

  async function takeoverThreadRoute(detail) {
    if (!detail || !detail.requestRoute || !detail.requestRoute.routeId) {
      throw new Error('Unable to locate this request.');
    }
    const confirmed = window.confirm('Take over this request from the other ComL? They will no longer be able to act on it until you finish.');
    if (!confirmed) {
      return detail;
    }
    await submitRouteAction('request-takeover', {
      routeId: Number(detail.requestRoute.routeId || 0)
    });
    return openThread(detail.thread.threadId).then(function () {
      return state.threadDetail;
    });
  }

  function requestTimelineSteps(status) {
    const rejected = isRejectedRequestStatus(status);
    if (!isCentralReviewer()) {
      if (rejected) {
        return [
          {
            title: 'Submitted',
            note: 'Your request was sent to Makati Central Fire Station.',
            feature: 'Request submitted to central ComL.'
          },
          {
            title: 'Central review',
            note: 'MCFS ComL reviewed your reference details.',
            feature: 'Central ComL evaluated the request.'
          },
          {
            title: 'Rejected',
            note: 'This request was declined by MCFS ComL.',
            feature: 'Request rejected.'
          }
        ];
      }
      return [
        {
          title: 'Submitted',
          note: 'Your request was sent to Makati Central Fire Station.',
          feature: 'Request submitted to central ComL.'
        },
        {
          title: 'Central review',
          note: 'MCFS ComL is locating the requested report(s) from central records.',
          feature: 'Central ComL reviews your reference details and finds the file(s).'
        },
        {
          title: 'Delivered',
          note: 'The requested file has been released back to you.',
          feature: 'Central ComL completes the request and sends the file.'
        }
      ];
    }

    if (rejected) {
      return [
        {
          title: 'Received',
          note: 'A station submitted a file request to MCFS.',
          feature: 'Request received at central ComL.'
        },
        {
          title: 'Under review',
          note: 'The request was reviewed by MCFS ComL.',
          feature: 'MCFS ComL evaluated the request.'
        },
        {
          title: 'Rejected',
          note: 'This request was declined and returned to the requester.',
          feature: 'Request rejected.'
        }
      ];
    }

    return [
      {
        title: 'Received',
        note: 'A station submitted a file request to MCFS.',
        feature: 'Request received at central ComL.'
      },
      {
        title: 'Under review',
        note: 'Review the reference details and locate the requested report(s).',
        feature: 'MCFS ComL evaluates the request.'
      },
      {
        title: 'Processing',
        note: 'Locate the report in central records and attach it for the requester.',
        feature: 'MCFS ComL attaches the file and sends it to the requesting station user.'
      },
      {
        title: 'Delivered',
        note: 'The file has been sent back to the requesting station.',
        feature: 'Request completed.'
      }
    ];
  }

  function requestTimelineActiveIndex(status, steps) {
    const value = String(status || '').toLowerCase();
    const lastIndex = Math.max(0, (steps || []).length - 1);
    if (value === 'rejected') {
      return lastIndex;
    }

    if (!isCentralReviewer()) {
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

    switch (value) {
      case 'pending_origin_review':
      case 'forwarded_to_target':
        return 1;
      case 'approved':
      case 'routed_to_user':
      case 'file_returned_to_coml':
      case 'returned_to_origin':
        return Math.min(2, lastIndex);
      case 'completed':
        return lastIndex;
      default:
        return 0;
    }
  }

  function renderRequestTimeline(detail) {
    const route = detail.requestRoute || {};
    if (!route.routeId) {
      requestTimeline.hidden = true;
      return;
    }

    const steps = requestTimelineSteps(route.status);
    const activeIndex = requestTimelineActiveIndex(route.status, steps);
    const rejected = isRejectedRequestStatus(route.status);
    state.timelineSelectedIndex = activeIndex;

    timelineRequestTitle.textContent = detail.thread.subject || 'Operational request timeline';
    timelineStepsContainer.innerHTML = steps.map(function (step, index) {
      const isRejectedStep = rejected && index === steps.length - 1;
      const completed = isRejectedStep ? false : (rejected ? index < activeIndex : index <= activeIndex);
      const active = index === state.timelineSelectedIndex;
      return '<button type="button" class="timeline-step' +
        (completed ? ' completed' : '') +
        (isRejectedStep ? ' rejected' : '') +
        (active ? ' active' : '') +
        '" data-step-index="' + index + '">' +
        '<span class="timeline-marker">' + (index + 1) + '</span>' +
        '<span class="timeline-step-title">' + escapeHtml(step.title) + '</span>' +
      '</button>';
    }).join('');

    const selectedStep = steps[state.timelineSelectedIndex];
    if (selectedStep) {
      let selectedNote = selectedStep.note || 'Select a step to view progress details.';
      if (rejected && state.timelineSelectedIndex === steps.length - 1) {
        const reason = String(route.targetReviewNotes || route.originReviewNotes || '').trim();
        if (reason) {
          selectedNote = 'Reason: ' + reason;
        }
      }
      if (selectedStep.title === 'User attachment' && detail.requestRoute && detail.requestRoute.assignedUsername) {
        selectedNote = 'Assigned user: ' + detail.requestRoute.assignedUsername + '. ' + selectedNote;
      }
      timelineNote.innerHTML = '<strong>' + escapeHtml(selectedStep.feature || selectedStep.title) + '</strong><br>' + escapeHtml(selectedNote);
    } else {
      timelineNote.textContent = 'Select a step to view progress details.';
    }
    requestTimeline.hidden = false;
    bindTimelineStepButtons(detail);
  }

  function bindTimelineStepButtons(detail) {
    Array.from(timelineStepsContainer.querySelectorAll('.timeline-step')).forEach(function (button) {
      button.addEventListener('click', function () {
        state.timelineSelectedIndex = Number(button.dataset.stepIndex || 0);
        renderRequestTimeline(detail);
      });
    });
  }

  function canReleaseClaimedRequest(detail) {
    if (!isComlUser()) {
      return false;
    }
    const rr = (detail && detail.requestRoute) || {};
    if (isTicketTerminalStatus(rr.status)) {
      return false;
    }
    return routeHandlerContext(rr).isMine;
  }

  function renderReleaseToQueueButton() {
    return '<button type="button" class="secondary-btn ops-release-btn" id="releaseRequestBtn" title="Return to unclaimed queue">' +
      '<i class="bi bi-arrow-return-left" aria-hidden="true"></i><span>Release to queue</span>' +
    '</button>';
  }

  async function releaseRequestTicket(detail) {
    if (!detail || !detail.requestRoute || !detail.requestRoute.routeId) {
      throw new Error('Unable to locate this request.');
    }
    const confirmed = window.confirm('Release this request back to the queue? Another ComL will be able to claim it.');
    if (!confirmed) {
      return;
    }
    await submitRouteAction('request-release', {
      routeId: Number(detail.requestRoute.routeId || 0)
    });
    closeThreadModal();
    await fetchBootstrap();
    await fetchList();
    setMessage('Request released back to the queue.', false);
  }

  function renderThreadActions(detail) {
    const requestRoute = detail.requestRoute || {};
    const currentUser = (state.bootstrap && state.bootstrap.currentUser) || {};
    const routeStatus = String(requestRoute.status || '');
    const atTargetStation = Number(requestRoute.targetStationId || 0) === Number(currentUser.stationId || 0);

    if (canClaimRequest(detail)) {
      return '<div class="mail-thread-action-row mail-thread-action-row--primary">' +
        '<button type="button" class="primary-btn" id="claimRequestBtn"><i class="bi bi-hand-index-thumb" aria-hidden="true"></i><span>Claim request</span></button>' +
        '<p class="form-note ops-claim-hint">You are viewing only. Claim this ticket when you want to handle it.</p>' +
      '</div>';
    }

    if (comlBlockedByOtherHandler(detail)) {
      return '';
    }

    if (!canActOnClaimedRequest(detail)) {
      return '';
    }

    if (isCentralReviewer() && requestRoute.routeId && atTargetStation) {
      let html = '';
      const canFulfillCentral = ['forwarded_to_target', 'routed_to_user', 'file_returned_to_coml', 'returned_to_origin'].includes(routeStatus);
      const canReviewTarget = routeStatus === 'forwarded_to_target';
      const releaseBtn = canReleaseClaimedRequest(detail) ? renderReleaseToQueueButton() : '';

      if (canReviewTarget && requestRoute.isConfidential && !requestRoute.targetConfidentialConfirmed) {
        html += '<div class="mail-thread-action-row"><button type="button" class="primary-btn" id="targetConfirmConfidentialBtn">Confirm confidentiality</button></div>';
      }

      if (canReviewTarget) {
        html += '<div class="mail-thread-action-row mail-thread-action-row--secondary">' +
          releaseBtn +
          '<button type="button" class="secondary-btn" id="targetRejectRequestBtn">Reject</button>' +
          '<button type="button" class="secondary-btn" id="threadReplyBtn">Reply</button>' +
        '</div>';
      } else if (releaseBtn) {
        html += '<div class="mail-thread-action-row mail-thread-action-row--secondary">' + releaseBtn + '</div>';
      }

      if (canFulfillCentral) {
        html += '<div class="mail-thread-action-row mail-thread-action-row--primary">' +
          '<button type="button" class="primary-btn" id="centralFulfillBtn">Attach file and send to requester</button>' +
        '</div>';
      }

      return html;
    }

    if (canReleaseClaimedRequest(detail)) {
      return '<div class="mail-thread-action-row mail-thread-action-row--secondary">' + renderReleaseToQueueButton() + '</div>';
    }

    const canAssignedReply = canAssignedRequestUserReply(detail);
    if (canAssignedReply) {
      return '<div class="mail-form-actions"><button type="button" class="primary-btn" id="replyAssignedBtn">Attach file and reply</button></div>';
    }

    return '';
  }

  function bindThreadActionButtons(detail) {
    const targetRejectRequestBtn = document.getElementById('targetRejectRequestBtn');
    const threadReplyBtn = document.getElementById('threadReplyBtn');
    const targetConfirmConfidentialBtn = document.getElementById('targetConfirmConfidentialBtn');
    const centralFulfillBtn = document.getElementById('centralFulfillBtn');
    const replyAssignedBtn = document.getElementById('replyAssignedBtn');
    const claimRequestBtn = document.getElementById('claimRequestBtn');
    const releaseRequestBtn = document.getElementById('releaseRequestBtn');

    if (releaseRequestBtn) {
      releaseRequestBtn.addEventListener('click', function () {
        releaseRequestTicket(detail).catch(function (error) {
          setMessage(error.message, true);
        });
      });
    }

    if (claimRequestBtn) {
      claimRequestBtn.addEventListener('click', function () {
        claimRequestTicket(detail).catch(function (error) {
          setMessage(error.message, true);
        });
      });
    }

    if (targetRejectRequestBtn) {
      targetRejectRequestBtn.addEventListener('click', function () {
        rejectTargetRequest(detail);
      });
    }
    if (threadReplyBtn) {
      threadReplyBtn.addEventListener('click', function () {
        openThreadReply(detail);
      });
    }
    if (targetConfirmConfidentialBtn) {
      targetConfirmConfidentialBtn.addEventListener('click', function () {
        confirmTargetConfidential(detail);
      });
    }
    if (centralFulfillBtn) {
      centralFulfillBtn.addEventListener('click', function () {
        openCentralFulfill(detail);
      });
    }
    if (replyAssignedBtn) {
      replyAssignedBtn.addEventListener('click', function () {
        openAssignedReply(detail);
      });
    }
  }

  function openCentralFulfill(detail) {
    const requestRoute = detail.requestRoute || {};
    const thread = detail.thread || {};

    if (!isCentralReviewer() || !requestRoute.routeId) {
      setMessage('Only central ComL can fulfill this request.', true);
      return;
    }

    state.composeCentralFulfillMode = true;
    state.composeReplyMode = false;
    state.composeReplyThreadId = Number(thread.threadId || 0);
    state.composeFulfillRouteId = Number(requestRoute.routeId || 0);
    state.composeReplyOriginStationId = 0;
    state.reopenThreadAfterCompose = true;

    composeForm.reset();
    const baseSubject = String(thread.subject || requestRoute.editedSubject || 'Operational request');
    composeSubject.value = /^re:\s*/i.test(baseSubject) ? baseSubject : ('Re: ' + baseSubject);
    setComposeBodyHtml('');
    if (composeStationSelect) {
      composeStationSelect.value = String(getCurrentStationId());
    }
    if (composeCloudinaryUrl) {
      composeCloudinaryUrl.value = '';
    }
    clearSelectedCloudFiles();
    setMessage('', false);
    updateComposeMode();
    renderFulfillSummary(detail);
    hideThreadModalForCompose();
    openCompose();
  }

  function openAssignedReply(detail) {
    const requestRoute = detail.requestRoute || {};
    const thread = detail.thread || {};
    const messages = Array.isArray(detail.messages) ? detail.messages : [];
    const latest = messages[messages.length - 1] || {};

    if (!canAssignedRequestUserReply(detail)) {
      setMessage('You are not assigned to this request.', true);
      return;
    }

    state.composeReplyMode = true;
    state.composeReplyThreadId = Number(thread.threadId || 0);
    state.composeReplyOriginStationId = Number(requestRoute.originStationId || 0);

    composeForm.reset();
    composeSubject.value = thread.subject ? ('Re: ' + thread.subject) : 'Re: Operational request';
    setComposeBodyHtml('\n\n--- Replying to request ---\n' + String(latest.body || ''));
    composeStationSelect.value = String(requestRoute.originStationId || '');
    if (composeCloudinaryUrl) {
      composeCloudinaryUrl.value = '';
    }
    clearSelectedCloudFiles();
    setMessage('', false);
    updateComposeMode();
    openCompose();
  }

  function confirmTargetConfidential(detail) {
    submitRouteAction('request-target-confirm-confidential', {
      routeId: Number(detail.requestRoute.routeId || 0)
    }).then(function () {
      return openThread(detail.thread.threadId);
    }).then(function () {
      return fetchBootstrap();
    }).then(function () {
      return fetchList();
    }).then(function () {
      setMessage('Confidentiality confirmation saved.', false);
    }).catch(function (error) {
      setMessage(error.message, true);
    });
  }

  async function submitRouteAction(action, data) {
    // If no routeId provided, include the current threadId as a fallback so
    // backend can resolve the latest route for this thread.
    if ((!data || !data.routeId) && window.state && window.state.threadDetail && window.state.threadDetail.threadId) {
      data = Object.assign({}, data, { threadId: window.state.threadDetail.threadId });
    }

    const formData = new FormData();
    formData.append('action', action);
    Object.keys(data || {}).forEach(function (key) {
      const value = data[key];
      if (value === undefined || value === null) {
        return;
      }
      formData.append(key, String(value));
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to perform request action.');
    }
    return payload;
  }

  async function openAttachmentLink(attachmentId) {
    if (attachmentId < 1) {
      return;
    }
    const r = await fetch(apiUrl + '?action=operational-attachment-access&attachmentId=' + encodeURIComponent(String(attachmentId)), { credentials: 'same-origin' });
    const p = await r.json();
    if (!r.ok || !p || p.ok !== true) {
      throw new Error((p && p.message) || 'Unable to verify attachment access.');
    }
    if (p.data && p.data.needAck) {
      const ok = window.confirm('Confidential file: access is logged. Confirm you understand before opening.');
      if (!ok) {
        return;
      }
      const routeId = state.threadDetail && state.threadDetail.requestRoute && state.threadDetail.requestRoute.routeId;
      if (!routeId) {
        throw new Error('Missing route context for acknowledgement.');
      }
      await submitRouteAction('request-confidential-ack', { routeId: Number(routeId) });
      return openAttachmentLink(attachmentId);
    }
    if (p.data && p.data.downloadUrl) {
      window.open(p.data.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  }

  async function approveRequest(detail) {
    try {
      setMessage('Approving request...', false);
      const confidential = window.confirm('Mark this request as CONFIDENTIAL? (Target ComL must confirm; requester must acknowledge before opening files.)');
      await submitRouteAction('request-approve', {
        routeId: Number(detail.requestRoute.routeId || 0),
        isConfidential: confidential ? '1' : '0'
      });
      await openThread(detail.thread.threadId);
      await fetchBootstrap();
      await fetchList();
      setMessage('Request approved.', false);
    } catch (error) {
      setMessage(error.message, true);
    }
  }

  async function rejectRequest(detail) {
    openRejectModal(detail, 'request-reject');
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

    submitRouteAction('request-target-assign', {
      routeId: Number(detail.requestRoute.routeId || 0),
      assignedUserId: assignedUserId,
      note: note.trim()
    }).then(function () {
      return openThread(detail.thread.threadId);
    }).then(function () {
      return fetchBootstrap();
    }).then(function () {
      return fetchList();
    }).then(function () {
      setMessage('Request assigned to the selected station user.', false);
    }).catch(function (error) {
      setMessage(error.message, true);
    });
  }

  function assignRequestToOriginUser(detail) {
    const cloudUrl = window.prompt('Optional: paste the cloud storage file URL if not already in the thread (must be under origin or target station folder). Leave blank to release without attaching a new link:', '');
    if (cloudUrl === null) {
      return;
    }

    const note = window.prompt('Optional note for the requester', '');
    if (note === null) {
      return;
    }

    let releasedAccessMode = 'full';
    if (!(detail.requestRoute && detail.requestRoute.isConfidential)) {
      releasedAccessMode = window.confirm('Deliver as view-only / tracked access? (Cancel = full access)') ? 'view_only' : 'full';
    }

    submitRouteAction('request-origin-assign', {
      routeId: Number(detail.requestRoute.routeId || 0),
      note: String(note).trim(),
      cloudinaryUrl: String(cloudUrl).trim(),
      releasedAccessMode: releasedAccessMode
    }).then(function () {
      return openThread(detail.thread.threadId);
    }).then(function () {
      return fetchBootstrap();
    }).then(function () {
      return fetchList();
    }).then(function () {
      setMessage('Request released to the original requester.', false);
    }).catch(function (error) {
      setMessage(error.message, true);
    });
  }

  function rejectTargetRequest(detail) {
    openRejectModal(detail, 'request-target-reject');
  }

  function markFileReturned(detail) {
    const note = window.prompt('Enter note for file return to target ComL:', '');
    if (note === null) {
      return;
    }

    submitRouteAction('request-target-file-returned', {
      routeId: Number(detail.requestRoute.routeId || 0),
      note: note.trim()
    }).then(function () {
      return openThread(detail.thread.threadId);
    }).then(function () {
      return fetchBootstrap();
    }).then(function () {
      return fetchList();
    }).then(function () {
      setMessage('File return noted on the request.', false);
    }).catch(function (error) {
      setMessage(error.message, true);
    });
  }

  function returnToOrigin(detail) {
    const cloudUrl = window.prompt('Paste the cloud storage file URL (must be in your station folder). Required:');
    if (cloudUrl === null) {
      return;
    }
    if (!String(cloudUrl).trim()) {
      setMessage('A cloud storage file URL is required to return the file to origin ComL.', true);
      return;
    }

    const note = window.prompt('Optional note for origin ComL:', '');
    if (note === null) {
      return;
    }

    submitRouteAction('request-target-return-origin', {
      routeId: Number(detail.requestRoute.routeId || 0),
      note: String(note).trim(),
      cloudinaryUrl: String(cloudUrl).trim()
    }).then(function () {
      return openThread(detail.thread.threadId);
    }).then(function () {
      return fetchBootstrap();
    }).then(function () {
      return fetchList();
    }).then(function () {
      setMessage('Request returned to origin station.', false);
    }).catch(function (error) {
      setMessage(error.message, true);
    });
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
    if (isCentralReviewer()) {
      await fetchBootstrap();
    } else {
      const folderMap = { updates: 'inbox', sent: 'sent', drafts: 'drafts' };
      state.folder = folderMap[state.ticketTab] || state.folder || 'inbox';
      const query = new URLSearchParams({ action: 'list', folder: state.folder, search: state.search || '' });
      const response = await fetch(apiUrl + '?' + query.toString(), { credentials: 'same-origin' });
      const payload = await response.json();
      if (!response.ok || !payload || payload.ok !== true) {
        throw new Error((payload && payload.message) || 'Unable to load requests.');
      }
      state.items = Array.isArray(payload.items) ? payload.items : [];
    }
    renderList();
  }

  function switchTicketTab(tab) {
    state.ticketTab = tab;
    if (!isCentralReviewer()) {
      const folderMap = { updates: 'inbox', sent: 'sent', drafts: 'drafts' };
      state.folder = folderMap[tab] || 'inbox';
    }
    state.activeThread = null;
    closeThreadModal();
    syncTicketTabUi();
    fetchList().catch(function (error) { setMessage(error.message, true); });
  }

  async function openThread(threadId) {
    const response = await fetch(apiUrl + '?action=thread&threadId=' + encodeURIComponent(String(threadId)), { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true || !payload.data) {
      throw new Error((payload && payload.message) || 'Unable to open thread.');
    }
    let detail = payload.data;
    state.activeThread = detail.thread || null;
    renderThread(detail);
    renderList();
  }

  function openCompose() {
    if (!state.composeReplyMode && !state.composeCentralFulfillMode) {
      setDefaultSourceStation();
      updateRoutedToLabel();
    }
    composeModal.hidden = false;
    syncMailModalScrollLock();
    setMessage('', false);
    updateComposeMode();
    if (!state.composeReplyMode && !state.composeCentralFulfillMode) {
      updateSourceStationUi();
    }
    if (composeBodyEditor) {
      composeBodyEditor.focus();
    }
  }

  function closeCompose() {
    composeModal.hidden = true;
    composeModal.style.display = '';
    syncMailModalScrollLock();
    composeForm.reset();
    clearComposeBody();
    clearLocalAttachments();
    clearReferenceFields();
    state.composeReplyMode = false;
    state.composeCentralFulfillMode = false;
    state.composeReplyThreadId = 0;
    state.composeFulfillRouteId = 0;
    state.composeReplyOriginStationId = 0;
    clearSelectedCloudFiles();
    renderFulfillSummary(null);
    const shouldReopenThread = state.reopenThreadAfterCompose && state.threadDetail && state.threadDetail.thread;
    state.reopenThreadAfterCompose = false;
    setDefaultSourceStation();
    updateComposeMode();
    if (shouldReopenThread) {
      openThreadModal();
    }
  }

  function canAssignedRequestUserReply(detail) {
    const requestRoute = (detail && detail.requestRoute) ? detail.requestRoute : {};
    if (!requestRoute.routeId) {
      return false;
    }

    const currentUser = (state.bootstrap && state.bootstrap.currentUser) ? state.bootstrap.currentUser : {};
    const currentUserId = Number(currentUser.userId || 0);
    const currentStationId = Number(currentUser.stationId || 0);
    const assignedUserId = Number(requestRoute.assignedUserId || 0);
    const targetStationId = Number(requestRoute.targetStationId || 0);
    const routeStatus = String(requestRoute.status || '');

    return Boolean(
      !isComlUser() &&
      !isCentralStation() &&
      assignedUserId > 0 &&
      assignedUserId === currentUserId &&
      targetStationId === currentStationId &&
      ['forwarded_to_target', 'routed_to_user'].includes(routeStatus)
    );
  }

  // ===== File Picker Functions =====
  function openFilePicker() {
    cloudinaryFilePicker.hidden = false;
    syncMailModalScrollLock();
    state.filePickerSelectedFile = null;
    state.filePickerSelectedFiles = [];
    state.filePickerVirtualPath = '';
    filePickerSelectedInfo.textContent = '';
    filePickerSelected.hidden = true;
    filePickerSelectBtn.disabled = true;
    filePickerSelectBtn.textContent = usesMultiCloudAttachmentMode() ? 'Attach selected files' : 'Select file';
    loadCloudinaryFiles();
  }

  function closeFilePicker() {
    cloudinaryFilePicker.hidden = true;
    syncMailModalScrollLock();
    state.filePickerSelectedFile = null;
    state.filePickerSelectedFiles = [];
    state.filePickerVirtualPath = '';
  }

  function showFilePickerLoading() {
    filePickerLoading.hidden = false;
    filePickerError.hidden = true;
    filePickerContent.hidden = true;
  }

  function showFilePickerError(message) {
    filePickerErrorMessage.textContent = String(message || 'An error occurred while loading files.');
    filePickerError.hidden = false;
    filePickerLoading.hidden = true;
    filePickerContent.hidden = true;
  }

  function showFilePickerContent() {
    filePickerContent.hidden = false;
    filePickerLoading.hidden = true;
    filePickerError.hidden = true;
  }

  function loadCloudinaryFiles() {
    showFilePickerLoading();

    const om = getOperationalOrgmailMeta();
    const useR2 = om.provider === 'r2';
    const area = state.composeCentralFulfillMode ? 'reports' : 'orgmail';
    const sourceStationId = String(composeStationSelect ? composeStationSelect.value : getCurrentStationId());
    const url = new URL(useR2 ? storageBrowserUrl : legacyStorageBrowserUrl, window.location.origin);
    url.searchParams.set('action', 'list');
    url.searchParams.set('area', area);
    if (useR2 && sourceStationId !== '') {
      url.searchParams.set('stationId', sourceStationId);
    }

    fetch(url.toString(), {
      method: 'GET',
      credentials: 'same-origin'
    })
    .then(function(response) {
      return response.json().then(function(data) {
        return { ok: response.ok, data: data };
      });
    })
    .then(function(result) {
      if (!result.ok || !result.data || result.data.ok !== true) {
        throw new Error((result.data && result.data.message) || 'Failed to load files');
      }

      state.filePickerFiles = Array.isArray(result.data.files) ? result.data.files : [];
      state.filePickerFolder = String(result.data.folder || '');

      filePickerFolder.textContent = state.filePickerFolder;
      filePickerCount.textContent = String(state.filePickerFiles.length) + ' file' + (state.filePickerFiles.length !== 1 ? 's' : '');

      renderFilePickerList();
      showFilePickerContent();
    })
    .catch(function(error) {
      showFilePickerError((error && error.message) || 'Failed to load files from cloud storage');
    });
  }

  function renderFilePickerList() {
    if (state.filePickerFiles.length === 0) {
      const emptyLabel = state.composeCentralFulfillMode
        ? 'No files were found in the MCFS reports folder yet.'
        : 'No files or reports found in your station.';
      filePickerList.innerHTML = '<div class="file-picker-empty"><p>' + escapeHtml(emptyLabel) + '</p></div>';
      return;
    }

    const isCentralReportsRoot = state.composeCentralFulfillMode && /\/reports$/i.test(String(state.filePickerFolder || ''));
    if (isCentralReportsRoot) {
      renderCentralReportsFolderView();
      return;
    }

    filePickerList.innerHTML = state.filePickerFiles.map(function(file) {
      const selected = usesMultiCloudAttachmentMode()
        ? (state.filePickerSelectedFiles.some(function (entry) { return entry.public_id === file.public_id; }) ? ' selected' : '')
        : (state.filePickerSelectedFile && state.filePickerSelectedFile.public_id === file.public_id ? ' selected' : '');
      const isIncident = file.resource_type === 'incident';

      if (isIncident) {
        const status = (file.status || 'newly_reported').replace(/_/g, ' ');
        const attachmentInfo = file.attachment_count > 0 ? ' (' + file.attachment_count + ' attachment' + (file.attachment_count !== 1 ? 's' : '') + ')' : '';
        return '<div class="file-picker-item file-picker-item-incident' + selected + '" data-file-id="' + escapeHtml(file.public_id) + '">' +
          '<div class="file-picker-item-incident-box">Report</div>' +
          '<div class="file-picker-item-name">' + escapeHtml(file.filename) + '</div>' +
          '<div class="file-picker-item-meta">' +
            '<span style="text-transform: capitalize;">' + escapeHtml(status) + '</span>' +
            '<span>' + escapeHtml(attachmentInfo) + '</span>' +
            '<span>' + (file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown date') + '</span>' +
          '</div>' +
        '</div>';
      }

      const sizeKb = Math.round((file.bytes || 0) / 1024);
      const sizeLabel = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + ' MB' : sizeKb + ' KB';
      const isImage = file.resource_type === 'image';
      const format = (file.format || '').toLowerCase();
      let label = 'FILE';
      if (format === 'pdf') label = 'PDF';
      else if (format === 'xlsx' || format === 'xls') label = 'XLSX';
      else if (format === 'txt') label = 'TXT';
      const thumbnail = isImage ? '<img class="file-picker-item-thumbnail" src="' + escapeHtml(file.url) + '" alt="' + escapeHtml(file.filename) + '" loading="lazy">' : '<div class="file-picker-item-placeholder"><span>' + label + '</span></div>';
      return '<div class="file-picker-item' + selected + '" data-file-id="' + escapeHtml(file.public_id) + '">' +
        thumbnail +
        '<div class="file-picker-item-name">' + escapeHtml(file.filename) + '</div>' +
        '<div class="file-picker-item-meta">' +
          '<span>' + sizeLabel + '</span>' +
          '<span>' + (file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown date') + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    bindFilePickerItems();
  }

  function renderCentralReportsFolderView() {
    const rootPrefix = String(state.filePickerFolder || '').replace(/\/+$/, '');
    const currentPath = String(state.filePickerVirtualPath || '').replace(/^\/+|\/+$/g, '');
    const basePrefix = currentPath ? (rootPrefix + '/' + currentPath) : rootPrefix;
    const folders = [];
    const files = [];
    const seenFolders = {};

    state.filePickerFiles.forEach(function (file) {
      const fullKey = String(file.public_id || '');
      const rootWithSlash = rootPrefix + '/';
      if (fullKey.indexOf(rootWithSlash) !== 0) {
        return;
      }
      const relative = fullKey.slice(rootWithSlash.length);
      if (!relative) {
        return;
      }
      if (currentPath) {
        const folderPrefix = currentPath + '/';
        if (relative.indexOf(folderPrefix) !== 0) {
          return;
        }
      }

      const relativeWithinCurrent = currentPath ? relative.slice((currentPath + '/').length) : relative;
      if (!relativeWithinCurrent) {
        return;
      }

      const slashIndex = relativeWithinCurrent.indexOf('/');
      if (slashIndex >= 0) {
        const folderName = relativeWithinCurrent.slice(0, slashIndex);
        const folderPath = currentPath ? (currentPath + '/' + folderName) : folderName;
        if (!seenFolders[folderPath]) {
          seenFolders[folderPath] = true;
          folders.push({
            type: 'folder',
            folderName: folderName,
            folderPath: folderPath
          });
        }
      } else {
        files.push(file);
      }
    });

    const displayFolder = currentPath ? (rootPrefix + '/' + currentPath) : rootPrefix;
    filePickerFolder.textContent = displayFolder;
    filePickerCount.textContent = String(folders.length + files.length) + ' item' + (folders.length + files.length !== 1 ? 's' : '');
    if (filePickerBackBtn) {
      filePickerBackBtn.hidden = currentPath === '';
    }

    const folderHtml = folders.sort(function (a, b) {
      return a.folderName.localeCompare(b.folderName);
    }).map(function (folder) {
      return '<div class="file-picker-item file-picker-item-folder" data-folder-path="' + escapeHtml(folder.folderPath) + '">' +
        '<div class="file-picker-item-placeholder"><span><i class="bi bi-folder2-open" aria-hidden="true"></i></span></div>' +
        '<div class="file-picker-item-name">' + escapeHtml(folder.folderName) + '/</div>' +
        '<div class="file-picker-item-meta"><span>Folder</span></div>' +
      '</div>';
    }).join('');

    const fileHtml = files.map(function (file) {
      const selected = state.filePickerSelectedFiles.some(function (entry) { return entry.public_id === file.public_id; }) ? ' selected' : '';
      const sizeKb = Math.round((file.bytes || 0) / 1024);
      const sizeLabel = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + ' MB' : sizeKb + ' KB';
      const format = (file.format || '').toLowerCase();
      let label = 'FILE';
      if (format === 'pdf') label = 'PDF';
      else if (format === 'xlsx' || format === 'xls') label = 'XLSX';
      else if (format === 'txt') label = 'TXT';
      return '<div class="file-picker-item' + selected + '" data-file-id="' + escapeHtml(file.public_id) + '">' +
        '<div class="file-picker-item-placeholder"><span>' + label + '</span></div>' +
        '<div class="file-picker-item-name">' + escapeHtml(file.filename) + '</div>' +
        '<div class="file-picker-item-meta"><span>' + sizeLabel + '</span><span>' + (file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown date') + '</span></div>' +
      '</div>';
    }).join('');

    filePickerList.innerHTML = folderHtml + fileHtml || '<div class="file-picker-empty"><p>No folders or files found here.</p></div>';
    bindFilePickerItems();
  }

  function bindFilePickerItems() {
    Array.from(filePickerList.querySelectorAll('[data-folder-path]')).forEach(function (item) {
      item.addEventListener('click', function () {
        state.filePickerVirtualPath = String(item.getAttribute('data-folder-path') || '');
        renderFilePickerList();
      });
    });
    Array.from(filePickerList.querySelectorAll('.file-picker-item')).forEach(function(item) {
      if (item.hasAttribute('data-folder-path')) {
        return;
      }
      item.addEventListener('click', function() {
        const fileId = item.getAttribute('data-file-id');
        const clickedFile = state.filePickerFiles.find(function(f) {
          return f.public_id === fileId;
        });

        if (!clickedFile) {
          return;
        }

        if (usesMultiCloudAttachmentMode()) {
          const existingIndex = state.filePickerSelectedFiles.findIndex(function (entry) {
            return entry.public_id === clickedFile.public_id;
          });
          if (existingIndex >= 0) {
            state.filePickerSelectedFiles.splice(existingIndex, 1);
          } else {
            state.filePickerSelectedFiles.push(clickedFile);
          }
          renderFilePickerList();
          if (state.filePickerSelectedFiles.length) {
            filePickerSelectedInfo.innerHTML = '<strong>' + String(state.filePickerSelectedFiles.length) + ' file' + (state.filePickerSelectedFiles.length > 1 ? 's' : '') + ' selected</strong>' +
              '<ul class="file-picker-selected-list">' +
              state.filePickerSelectedFiles.map(function (file) {
                return '<li>' + escapeHtml(file.filename || 'File') + '</li>';
              }).join('') +
              '</ul>';
            filePickerSelected.hidden = false;
            filePickerSelectBtn.disabled = false;
          } else {
            filePickerSelectedInfo.textContent = '';
            filePickerSelected.hidden = true;
            filePickerSelectBtn.disabled = true;
          }
        } else {
          state.filePickerSelectedFile = clickedFile;
          renderFilePickerList();
          filePickerSelectedInfo.innerHTML =
            '<strong>' + escapeHtml(state.filePickerSelectedFile.filename) + '</strong><br>' +
            '<small>' + escapeHtml(state.filePickerSelectedFile.url) + '</small>';
          filePickerSelected.hidden = false;
          filePickerSelectBtn.disabled = false;
        }
      });
    });
  }

  function selectCloudinaryFile() {
    if (usesMultiCloudAttachmentMode()) {
      if (!state.filePickerSelectedFiles.length) {
        setMessage('Please select at least one valid file', true);
        return;
      }
      const picked = state.filePickerSelectedFiles.map(function (file) {
        return {
          public_id: file.public_id,
          filename: file.filename,
          url: file.url
        };
      });
      if (state.composeCentralFulfillMode) {
        state.composeSelectedCloudFiles = picked.slice();
      } else {
        appendCloudFilesToSelection(picked);
      }
      if (composeCloudinaryUrl) {
        composeCloudinaryUrl.value = state.composeSelectedCloudFiles.map(function (file) { return file.url; }).join('\n');
      }
      renderSelectedCloudFiles();
      closeFilePicker();
      if (composeModal && !composeModal.hidden && composeBodyEditor) {
        composeBodyEditor.focus();
      }
      return;
    }

    if (!state.filePickerSelectedFile) {
      setMessage('Please select a valid file', true);
      return;
    }

    const url = state.filePickerSelectedFile && state.filePickerSelectedFile.url ? String(state.filePickerSelectedFile.url) : '';
    if (!url) {
      setMessage('Please select a valid file', true);
      return;
    }

    if (composeCloudinaryUrl) {
      composeCloudinaryUrl.value = url;
    }
    closeFilePicker();
    if (composeModal && !composeModal.hidden && composeBodyEditor) {
      composeBodyEditor.focus();
    }
  }

  function updateComposeMode() {
    const modalKicker = composeModal.querySelector('.mail-kicker');
    const modalTitle = composeModal.querySelector('h2');
    const stationLabel = composeStationSelect ? composeStationSelect.closest('label') : null;
    const routedToField = composeRoutedToLabel ? composeRoutedToLabel.closest('.form-field') : null;
    const isFulfillMode = Boolean(state.composeCentralFulfillMode);
    const isReplyMode = Boolean(state.composeReplyMode) && !isFulfillMode;
    const usesCloudAttachment = isReplyMode || isFulfillMode;
    const uploadField = composeOrgmailUploadRow || null;
    const shareLinkField = generateShareLinkBtn ? generateShareLinkBtn.closest('.form-field--inline-action') : null;

    if (modalKicker) {
      modalKicker.textContent = isFulfillMode ? 'Fulfill request' : (isReplyMode ? 'Operational Reply' : 'New request');
    }
    if (modalTitle) {
      modalTitle.textContent = isFulfillMode
        ? 'Attach file and send to requester'
        : (isReplyMode ? 'Attach file and return to ComL' : 'Create operational request');
    }
    if (stationLabel) {
      stationLabel.hidden = usesCloudAttachment;
      stationLabel.style.display = usesCloudAttachment ? 'none' : '';
    }
    if (routedToField) {
      routedToField.hidden = usesCloudAttachment;
      routedToField.style.display = usesCloudAttachment ? 'none' : '';
    }
    if (composeCloudSection) {
      composeCloudSection.hidden = !usesCloudAttachment;
      composeCloudSection.style.display = usesCloudAttachment ? '' : 'none';
    }
    if (composeLocalAttachmentsField) {
      composeLocalAttachmentsField.hidden = usesCloudAttachment;
      composeLocalAttachmentsField.style.display = usesCloudAttachment ? 'none' : '';
    }
    if (composeRefFields) {
      composeRefFields.hidden = usesCloudAttachment;
      composeRefFields.style.display = usesCloudAttachment ? 'none' : '';
    }
    if (uploadField) {
      uploadField.hidden = isFulfillMode;
      uploadField.style.display = isFulfillMode ? 'none' : '';
    }
    if (shareLinkField) {
      shareLinkField.hidden = isFulfillMode;
      shareLinkField.style.display = isFulfillMode ? 'none' : '';
    }
    if (composeBodyEditor) {
      composeBodyEditor.dataset.placeholder = isFulfillMode
        ? 'Add a note for the requester (optional)…'
        : (isReplyMode ? 'Add a note with the file you are returning…' : 'Write your request…');
    }
    if (saveDraftBtn) {
      saveDraftBtn.hidden = usesCloudAttachment;
    }
    if (sendBtn) {
      sendBtn.textContent = isFulfillMode
        ? 'Send file to requester'
        : (isReplyMode ? 'Return to target ComL' : 'Send request');
    }
    if (composeRoutedToLabel) {
      composeRoutedToLabel.textContent = isFulfillMode
        ? 'Requester'
        : ((getCentralStation() && getCentralStation().stationName) ? getCentralStation().stationName : 'Makati Central Fire Station');
    }
    if (composeSelectedCloudFiles) {
      composeSelectedCloudFiles.hidden = !usesMultiCloudAttachmentMode() || state.composeSelectedCloudFiles.length === 0;
    }
    if (composeOrgmailHint && usesCloudAttachment) {
      updateSourceStationUi();
    }
  }

  function validateUrl(url) {
    const value = String(url || '').trim();
    if (/^https:\/\//i.test(value)) {
      return true;
    }
    return value.indexOf('/firenet/NEWFIRENET/backend/controllers/r2_storage.php') === 0;
  }

  function cloudinaryUrlInMyStationFolder(url) {
    const stationCode = state.bootstrap && state.bootstrap.operationalOrgmail && state.bootstrap.operationalOrgmail.stationCode;
    if (!stationCode || !url) {
      return true;
    }
    return String(url).toLowerCase().indexOf('/' + String(stationCode) + '/') !== -1;
  }

  async function submitCentralFulfill() {
    const subject = String(composeSubject.value || '').trim();
    const body = getComposeBodyHtml();
    const cloudinaryUrls = state.composeSelectedCloudFiles.map(function (file) { return String(file.url || '').trim(); }).filter(Boolean);
    const cloudinaryUrl = composeCloudinaryUrl ? String(composeCloudinaryUrl.value || '').trim() : '';
    const routeId = Number(state.composeFulfillRouteId || 0);
    const threadId = Number(state.composeReplyThreadId || 0);

    if (subject === '') {
      throw new Error('Please add a subject.');
    }
    if (!cloudinaryUrls.length && cloudinaryUrl === '') {
      throw new Error('Attach at least one requested file from cloud storage before sending to the requester.');
    }
    if (cloudinaryUrls.some(function (url) { return !validateUrl(url); }) || (cloudinaryUrls.length === 0 && !validateUrl(cloudinaryUrl))) {
      throw new Error('Please provide a valid cloud storage file URL.');
    }
    if (routeId < 1 || threadId < 1) {
      throw new Error('Unable to locate this request route.');
    }

    const formData = new FormData();
    formData.append('action', 'request-central-fulfill');
    formData.append('routeId', String(routeId));
    formData.append('threadId', String(threadId));
    formData.append('note', body);
    if (cloudinaryUrls.length) {
      cloudinaryUrls.forEach(function (url) {
        formData.append('cloudinaryUrls[]', url);
      });
    } else {
      formData.append('cloudinaryUrl', cloudinaryUrl);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to send the file to the requester.');
    }
    state.reopenThreadAfterCompose = false;
    setMessage(payload.message || 'File sent to the requester.', false);
    closeCompose();
    closeThreadModal();
    await fetchBootstrap();
    await fetchList();
  }

  async function submitRequest(isDraft) {
    if (state.composeCentralFulfillMode) {
      if (isDraft) {
        throw new Error('Drafts are not available when fulfilling a request.');
      }
      await submitCentralFulfill();
      return;
    }

    const subject = String(composeSubject.value || '').trim();
    const body = getComposeBodyHtml();
    const sourceStationId = Number(composeStationSelect.value || 0);
    const centralStationId = Number(getCentralStationId() || 0);
    const cloudinaryUrls = collectComposeCloudinaryUrls();

    if (state.composeReplyMode && isDraft) {
      throw new Error('Drafts are not available for request replies.');
    }

    if (!isDraft) {
      if (subject === '') {
        throw new Error(state.composeReplyMode ? 'Please add a reply subject.' : 'Please add a subject for this request.');
      }
      if (!state.composeReplyMode && centralStationId < 1) {
        throw new Error('Central station routing is not configured.');
      }
      if (state.composeReplyMode && !cloudinaryUrls.length) {
        throw new Error('Attach at least one file from cloud storage before returning to ComL.');
      }
      if (cloudinaryUrls.some(function (url) { return !validateUrl(url); })) {
        throw new Error('Please provide valid cloud storage file URLs.');
      }
      if (!state.composeReplyMode && isComposeBodyEmpty() && state.localAttachments.length === 0) {
        throw new Error('Write your request or attach a reference file before sending.');
      }
    }

    const formData = new FormData();
    formData.append('action', state.composeReplyMode ? 'reply' : (isDraft ? 'save-draft' : 'send'));
    if (state.composeReplyMode && state.composeReplyThreadId > 0) {
      formData.append('threadId', String(state.composeReplyThreadId));
    }
    formData.append('subject', subject);
    formData.append('body', body);
    formData.append('mailType', 'request');
    formData.append('importance', 'normal');
    formData.append('requestFiles', '1');
    if (!state.composeReplyMode) {
      formData.append('recipientStationIds[]', String(centralStationId));
      formData.append('sourceStationId', String(sourceStationId > 0 ? sourceStationId : getCurrentStationId()));
      if (composeRefIncidentDateFrom && composeRefIncidentDateFrom.value) {
        formData.append('refIncidentDateFrom', composeRefIncidentDateFrom.value);
      }
      if (composeRefIncidentDateTo && composeRefIncidentDateTo.value) {
        formData.append('refIncidentDateTo', composeRefIncidentDateTo.value);
      }
      if (composeRefAllResponders && composeRefAllResponders.checked) {
        formData.append('refAllRespondingStations', '1');
      } else {
        selectedRespondingStationIds().forEach(function (stationId) {
          formData.append('refRespondingStationIds[]', stationId);
        });
      }
      if (composeRefLocation && composeRefLocation.value.trim()) {
        formData.append('refLocation', composeRefLocation.value.trim());
      }
      if (composeRefCaseId && composeRefCaseId.value.trim()) {
        formData.append('refCaseId', composeRefCaseId.value.trim());
      }
      state.localAttachments.forEach(function (file) {
        formData.append('attachments[]', file);
      });
    }
    if (cloudinaryUrls.length) {
      cloudinaryUrls.forEach(function (url) {
        formData.append('cloudinaryUrls[]', url);
      });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to submit request.');
    }
    setMessage(payload.message || (isDraft ? 'Draft saved.' : 'Request sent.'), false);
    closeCompose();
    await fetchBootstrap();
    await fetchList();
  }

  openComposeBtn.addEventListener('click', function () {
    state.composeReplyMode = false;
    state.composeCentralFulfillMode = false;
    state.composeReplyThreadId = 0;
    state.composeFulfillRouteId = 0;
    state.composeReplyOriginStationId = 0;
    composeForm.reset();
    clearComposeBody();
    clearLocalAttachments();
    clearReferenceFields();
    setDefaultSourceStation();
    if (composeCloudinaryUrl) {
      composeCloudinaryUrl.value = '';
    }
    setMessage('', false);
    openCompose();
  });
  if (composeStationSelect) {
    composeStationSelect.addEventListener('change', function () {
      updateSourceStationUi();
    });
  }
  closeComposeBtn.addEventListener('click', closeCompose);
  composeModal.addEventListener('click', function (event) {
    if (event.target && event.target.closest('[data-close="true"]')) {
      closeCompose();
    }
  });
  refreshBtn.addEventListener('click', function () {
    fetchList().catch(function (error) { setMessage(error.message, true); });
  });

  function bindTicketTabs(container) {
    if (!container) {
      return;
    }
    Array.from(container.querySelectorAll('.ops-ticket-tab')).forEach(function (button) {
      button.addEventListener('click', function () {
        switchTicketTab(button.getAttribute('data-ticket-tab') || 'queue');
      });
    });
  }

  bindTicketTabs(opsTicketTabsCentral);
  bindTicketTabs(opsTicketTabsRequester);

  if (opsTicketStats) {
    opsTicketStats.addEventListener('click', function (event) {
      const card = event.target.closest('.mail-stat-card');
      if (!card || !isCentralReviewer()) {
        return;
      }
      if (card.classList.contains('ops-stat-card--queue')) {
        switchTicketTab('queue');
      } else if (card.classList.contains('ops-stat-card--claimed')) {
        switchTicketTab('claimed');
      } else if (card.classList.contains('ops-stat-card--completed')) {
        switchTicketTab('completed');
      }
    });
  }

  if (closeThreadBtn) {
    closeThreadBtn.addEventListener('click', closeThreadModal);
  }
  if (closeThreadReplyBtn) {
    closeThreadReplyBtn.addEventListener('click', closeThreadReply);
  }
  if (cancelThreadReplyBtn) {
    cancelThreadReplyBtn.addEventListener('click', closeThreadReply);
  }
  if (sendThreadReplyBtn) {
    sendThreadReplyBtn.addEventListener('click', function () {
      submitThreadReply().catch(function (error) {
        setMessage(error.message, true);
      });
    });
  }
  if (threadModal) {
    threadModal.querySelectorAll('.mail-compose-tool[data-editor="threadReply"]').forEach(function (button) {
      button.addEventListener('mousedown', function (event) {
        event.preventDefault();
      });
      button.addEventListener('click', function () {
        const command = button.getAttribute('data-cmd');
        if (!command || !threadReplyBodyEditor) {
          return;
        }
        threadReplyBodyEditor.focus();
        document.execCommand(command, false, null);
      });
    });
  }
  if (threadModal) {
    threadModal.addEventListener('click', function (event) {
      if (event.target && event.target.closest('[data-close-thread="true"]')) {
        closeThreadModal();
      }
    });
  }

  if (rejectRequestForm) {
    rejectRequestForm.addEventListener('submit', submitRejectModal);
  }
  if (closeRejectModalBtn) {
    closeRejectModalBtn.addEventListener('click', closeRejectModal);
  }
  if (cancelRejectBtn) {
    cancelRejectBtn.addEventListener('click', closeRejectModal);
  }
  if (rejectRequestModal) {
    rejectRequestModal.addEventListener('click', function (event) {
      if (event.target && event.target.closest('[data-close-reject="true"]')) {
        closeRejectModal();
      }
    });
  }

  composeForm.addEventListener('submit', function (event) {
    event.preventDefault();
    submitRequest(false).catch(function (error) { setMessage(error.message, true); });
  });
  saveDraftBtn.addEventListener('click', function () {
    submitRequest(true).catch(function (error) { setMessage(error.message, true); });
  });
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

  composeModal.querySelectorAll('.mail-compose-tool').forEach(function (button) {
    button.addEventListener('mousedown', function (event) {
      event.preventDefault();
    });
    button.addEventListener('click', function () {
      const command = button.getAttribute('data-cmd');
      if (!command || !composeBodyEditor) {
        return;
      }
      composeBodyEditor.focus();
      document.execCommand(command, false, null);
      if (composeBody) {
        composeBody.value = getComposeBodyHtml();
      }
    });
  });

  if (composeRefAllResponders) {
    composeRefAllResponders.addEventListener('change', updateRespondersUi);
  }

  if (composeAttachFilesBtn && composeLocalAttachments) {
    composeAttachFilesBtn.addEventListener('click', function () {
      composeLocalAttachments.click();
    });
    composeLocalAttachments.addEventListener('change', function () {
      if (!composeLocalAttachments.files || !composeLocalAttachments.files.length) {
        return;
      }
      addLocalAttachments(composeLocalAttachments.files);
      composeLocalAttachments.value = '';
    });
  }

  if (composeAttachmentList) {
    composeAttachmentList.addEventListener('click', function (event) {
      const removeButton = event.target.closest('[data-remove-attachment]');
      if (!removeButton) {
        return;
      }
      const index = Number(removeButton.getAttribute('data-remove-attachment') || -1);
      if (index < 0 || index >= state.localAttachments.length) {
        return;
      }
      state.localAttachments.splice(index, 1);
      renderComposeAttachments();
    });
  }

  // ===== File Picker Event Listeners =====
  if (browseCloudinareFilesBtn) {
    browseCloudinareFilesBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openFilePicker();
    });
  }

  if (closeFilePickerBtn) {
    closeFilePickerBtn.addEventListener('click', closeFilePicker);
  }

  if (cloudinaryFilePicker) {
    cloudinaryFilePicker.addEventListener('click', function(event) {
      if (event.target && event.target.closest('[data-close="true"]')) {
        closeFilePicker();
      }
    });
  }

  if (filePickerRefreshBtn) {
    filePickerRefreshBtn.addEventListener('click', loadCloudinaryFiles);
  }

  if (filePickerBackBtn) {
    filePickerBackBtn.addEventListener('click', function () {
      const current = String(state.filePickerVirtualPath || '');
      if (!current) {
        return;
      }
      const next = current.split('/').slice(0, -1).join('/');
      state.filePickerVirtualPath = next;
      renderFilePickerList();
    });
  }

  if (filePickerSelectBtn) {
    filePickerSelectBtn.addEventListener('click', selectCloudinaryFile);
  }

  // Share link generation
  if (generateShareLinkBtn) {
    generateShareLinkBtn.addEventListener('click', function () {
      generateShareLinkBtn.disabled = true;
      setMessage('Generating share link…', false);
      fetch(cloudinaryShareUrl, { method: 'POST', credentials: 'same-origin' })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          if (!data || data.ok !== true) {
            throw new Error((data && data.message) || 'Failed to generate link');
          }
          const url = String(data.url || '');
          if (generatedShareLink) {
            generatedShareLink.href = url;
            generatedShareLink.textContent = url;
          }
          if (generatedShareLinkRow) {
            generatedShareLinkRow.hidden = false;
          }
          const expiresAt = data.expires_at ? new Date(Number(data.expires_at) * 1000).toLocaleString() : 'unknown';
          setMessage('Share link created (expires ' + expiresAt + ')', false);
        })
        .catch(function (e) {
          setMessage((e && e.message) || 'Unable to create share link', true);
        })
        .finally(function () {
          generateShareLinkBtn.disabled = false;
        });
    });
  }

  if (copyShareLinkBtn) {
    copyShareLinkBtn.addEventListener('click', function () {
      try {
        const href = generatedShareLink && generatedShareLink.href ? generatedShareLink.href : '';
        if (!href) throw new Error('No link to copy');
        navigator.clipboard.writeText(href).then(function () {
          setMessage('Link copied to clipboard', false);
        }, function () {
          setMessage('Copy failed', true);
        });
      } catch (err) {
        setMessage(err.message || 'Copy failed', true);
      }
    });
  }

  if (composeOrgmailUploadBtn && composeOrgmailFile) {
    composeOrgmailUploadBtn.addEventListener('click', function () {
      composeOrgmailFile.click();
    });
    composeOrgmailFile.addEventListener('change', function () {
      const files = Array.from(composeOrgmailFile.files || []);
      if (!files.length) {
        return;
      }

      let uploadIndex = 0;
      function uploadNext() {
        if (uploadIndex >= files.length) {
          composeOrgmailFile.value = '';
          return;
        }

        const file = files[uploadIndex];
        uploadIndex += 1;
        const fd = new FormData();
        fd.append('action', 'orgmail-upload');
        fd.append('file', file);
        setMessage('Uploading ' + String(uploadIndex) + ' of ' + String(files.length) + ' to cloud storage…', false);
        fetch(apiUrl, { method: 'POST', body: fd, credentials: 'same-origin' })
          .then(function (r) {
            return r.json().then(function (p) {
              return { r: r, p: p };
            });
          })
          .then(function (out) {
            if (!out || !out.r || !out.p || !out.r.ok || out.p.ok !== true) {
              throw new Error((out && out.p && out.p.message) || 'Upload failed');
            }
            const url = out.p && out.p.data && out.p.data.secureUrl ? String(out.p.data.secureUrl) : '';
            if (!url) {
              throw new Error('No file URL returned from upload');
            }
            appendCloudFilesToSelection([{
              filename: file.name || 'Uploaded file',
              url: url
            }]);
          })
          .catch(function (e) {
            setMessage((e && e.message) || 'Upload failed', true);
            composeOrgmailFile.value = '';
          })
          .then(function () {
            if (uploadIndex < files.length) {
              uploadNext();
            } else {
              setMessage(files.length > 1 ? 'Uploads complete. Files attached.' : 'Upload complete. File attached.', false);
              composeOrgmailFile.value = '';
            }
          });
      }

      uploadNext();
    });
  }

  threadContent.addEventListener('click', function (event) {
    const link = event.target.closest('a.mail-attachment-link');
    if (!link) {
      return;
    }
    const id = Number(link.getAttribute('data-attachment-id') || 0);
    if (id < 1) {
      return;
    }
    event.preventDefault();
    openAttachmentLink(id).catch(function (err) { setMessage(err.message, true); });
  });

  mailList.addEventListener('click', function (event) {
    const item = event.target.closest('[data-thread-id]');
    if (!item) return;
    openThread(Number(item.getAttribute('data-thread-id') || 0)).catch(function (error) { setMessage(error.message, true); });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') {
      return;
    }
    if (cloudinaryFilePicker && !cloudinaryFilePicker.hidden) {
      closeFilePicker();
      return;
    }
    if (rejectRequestModal && !rejectRequestModal.hidden) {
      closeRejectModal();
      return;
    }
    if (threadModal && !threadModal.hidden) {
      closeThreadModal();
      return;
    }
    if (!composeModal.hidden) {
      closeCompose();
    }
  });

  async function init() {
    composeModal.hidden = true;
    if (rejectRequestModal) {
      rejectRequestModal.hidden = true;
    }
    if (threadModal) {
      threadModal.hidden = true;
    }
    syncMailModalScrollLock();
    try {
      setMessage('Loading operational mail...', false);
      await fetchBootstrap();
      await fetchList();
      setMessage('Ready.', false);
    } catch (error) {
      setMessage(error.message, true);
      mailList.innerHTML = '<div class="mail-empty-list">Unable to load requests.</div>';
    }
  }

  mountMailModalsToBody();
  init();
})();
