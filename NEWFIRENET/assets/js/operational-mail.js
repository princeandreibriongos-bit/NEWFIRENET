(function () {
  const contextElement = document.getElementById('operationalMailContext');
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
  const composeForm = document.getElementById('composeForm');
  const threadActions = document.getElementById('threadActions');
  const requestTimeline = document.getElementById('requestTimeline');
  const timelineRequestTitle = document.getElementById('timelineRequestTitle');
  const timelineStepsContainer = document.getElementById('timelineSteps');
  const timelineNote = document.getElementById('timelineNote');
  const composeSubject = document.getElementById('composeSubject');
  const composeStationSelect = document.getElementById('composeStationSelect');
  const composeCloudinaryUrl = document.getElementById('composeCloudinaryUrl');
  const composeOrgmailHint = document.getElementById('composeOrgmailHint');
  const composeOrgmailUploadRow = document.getElementById('composeOrgmailUploadRow');
  const composeOrgmailFile = document.getElementById('composeOrgmailFile');
  const composeOrgmailUploadBtn = document.getElementById('composeOrgmailUploadBtn');
  const composeBody = document.getElementById('composeBody');
  const composeMessage = document.getElementById('composeMessage');
  const sendBtn = document.getElementById('sendBtn');
  const saveDraftBtn = document.getElementById('saveDraftBtn');
  const inboxCount = document.getElementById('inboxCount');
  const unreadCount = document.getElementById('unreadCount');
  const sentCount = document.getElementById('sentCount');
  const draftCount = document.getElementById('draftCount');
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
  const filePickerSelectBtn = document.getElementById('filePickerSelectBtn');

  if (!contextElement || !mailList || !threadPanel || !threadContent || !threadEmpty || !threadTitle || !threadActions || !requestTimeline || !timelineRequestTitle || !timelineStepsContainer || !timelineNote || !composeModal || !openComposeBtn || !closeComposeBtn || !refreshBtn || !searchInput || !stationFilterSelect || !sortSelect || !composeForm || !composeSubject || !composeStationSelect || !composeCloudinaryUrl || !composeBody || !composeMessage || !sendBtn || !saveDraftBtn || !inboxCount || !unreadCount || !sentCount || !draftCount || !mailFolderTitle || !mailActiveFilter) {
    return;
  }

  const apiUrl = String((JSON.parse(contextElement.textContent || '{}') || {}).mailApiUrl || '/firenet/NEWFIRENET/backend/controllers/station_mails.php');
  const cloudinaryBrowserUrl = '/firenet/NEWFIRENET/backend/controllers/cloudinary_browser.php';
  const cloudinaryShareUrl = '/firenet/NEWFIRENET/backend/controllers/cloudinary_share.php';
  
  // Share link elements
  const generateShareLinkBtn = document.getElementById('generateShareLinkBtn');
  const generatedShareLinkRow = document.getElementById('generatedShareLinkRow');
  const generatedShareLink = document.getElementById('generatedShareLink');
  const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
  
  const state = {
    folder: 'inbox',
    search: '',
    stationFilter: '',
    sort: 'latest',
    bootstrap: null,
    items: [],
    requestTracking: [],
    activeThread: null,
    threadDetail: null,
    composeReplyMode: false,
    composeReplyThreadId: 0,
    composeReplyOriginStationId: 0,
    // File picker state
    filePickerLoading: false,
    filePickerFiles: [],
    filePickerFolder: '',
    filePickerSelectedFile: null
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

    composeStationSelect.innerHTML = '<option value="">Choose target station</option>' + stations.map(function (entry) {
      return '<option value="' + escapeHtml(String(entry.stationId)) + '">' + escapeHtml(entry.stationName) + '</option>';
    }).join('');
  }

  function applyBootstrap(payload) {
    state.bootstrap = payload.data || {};
    state.requestTracking = Array.isArray(state.bootstrap.requestTracking) ? state.bootstrap.requestTracking : [];
    updateCounts(state.bootstrap);
    renderStationOptions();
    mailActiveFilter.textContent = 'Showing operational mail';
    const om = state.bootstrap.operationalOrgmail || {};
    if (composeOrgmailHint) {
      composeOrgmailHint.textContent = om.uploadsEnabled
        ? 'Use a URL under ' + String(om.stationFolder || 'your station folder') + ', or upload a file directly into that folder.'
        : 'Paste a full https Cloudinary URL under ' + String(om.stationFolder || 'firenet/orgmail/station_<id>') + ' (enable Cloudinary in config to upload from here).';
    }
    if (composeOrgmailUploadRow) {
      composeOrgmailUploadRow.hidden = !om.uploadsEnabled;
    }
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  function visibleItems() {
    const sourceItems = state.bootstrap && state.bootstrap.currentUser && state.bootstrap.currentUser.isComl ? state.requestTracking : state.items;
    return (Array.isArray(sourceItems) ? sourceItems : []).filter(function (item) {
      if (state.bootstrap && state.bootstrap.currentUser && state.bootstrap.currentUser.isComl) {
        return true;
      }
      return item.mailType === 'request' && item.requestFiles;
    }).filter(function (item) {
      const matchesStation = state.stationFilter === '' || String(item.senderStationId || item.originStationId || item.targetStationId || '') === state.stationFilter;
      const matchesSearch = state.search === '' || String(item.subject || '').toLowerCase().includes(state.search.toLowerCase()) || String(item.snippet || item.body || '').toLowerCase().includes(state.search.toLowerCase()) || String(item.senderUsername || item.requestUsername || '').toLowerCase().includes(state.search.toLowerCase());
      return matchesStation && matchesSearch;
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
      mailList.innerHTML = '<div class="mail-empty-list">No operational requests found.</div>';
      return;
    }

    mailList.innerHTML = items.map(function (item) {
      const unreadClass = item.readAt ? '' : ' unread';
      const selectedClass = state.activeThread && state.activeThread.threadId === item.threadId ? ' is-active' : '';
      const status = item.requestRoute ? escapeHtml((item.requestRoute.status || '').replace(/_/g, ' ')) : escapeHtml(String(item.status || 'Open'));
      const senderLabel = item.senderStationName || item.originStationName || '';
      const senderUserLabel = item.senderUsername || item.requestUsername || '';
      const stationPath = item.originStationName && item.targetStationName ? escapeHtml(item.originStationName + ' → ' + item.targetStationName) : '';
      const infoLabel = stationPath || senderLabel || senderUserLabel ? stationPath || escapeHtml(senderLabel + (senderLabel && senderUserLabel ? ' / ' : '') + senderUserLabel) : 'Operational request';
      const snippet = item.snippet || item.body || '';
      return '<article class="mail-list-item' + unreadClass + selectedClass + '" data-thread-id="' + escapeHtml(String(item.threadId)) + '">' +
        '<div class="mail-list-title"><strong>' + escapeHtml(item.subject || '(No subject)') + '</strong><span>' + escapeHtml(formatDate(item.sentAt || item.createdAt)) + '</span></div>' +
        '<div class="mail-list-meta"><span>' + infoLabel + '</span>' +
        '<span class="mail-badge">' + status + '</span></div>' +
        '<p class="mail-list-snippet">' + escapeHtml(snippet) + '</p>' +
        '<button type="button" class="mail-request-reply-btn" data-reply-thread-id="' + escapeHtml(String(item.threadId)) + '">Reply</button>' +
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

  function renderThread(detail) {
    state.threadDetail = detail;
    const thread = detail.thread || {};
    const messages = Array.isArray(detail.messages) ? detail.messages : [];
    threadTitle.textContent = thread.subject || 'Request detail';
    renderRequestTimeline(detail);
    if (messages.length === 0) {
      const assignedUserInfo = detail.requestRoute && detail.requestRoute.assignedUsername ? '<p>Assigned user: ' + escapeHtml(detail.requestRoute.assignedUsername || '') + '</p>' : '';
      const routeInfo = detail.requestRoute ? '<div class="mail-thread-message"><strong>Request route</strong><p>Status: ' + escapeHtml((detail.requestRoute.status || '').replace(/_/g, ' ')) + '</p><p>From: ' + escapeHtml(detail.requestRoute.originStationName || '') + '</p><p>To: ' + escapeHtml(detail.requestRoute.targetStationName || '') + '</p>' + assignedUserInfo + '</div>' : '';
      threadContent.innerHTML = routeInfo + '<div class="mail-empty-list">No messages available for this request yet.</div>';
      threadContent.hidden = false;
      threadEmpty.hidden = true;
      threadActions.innerHTML = renderThreadActions(detail);
      threadActions.hidden = threadActions.innerHTML === '';
      bindThreadActionButtons(detail);
      return;
    }

    const assignedUserInfo = detail.requestRoute && detail.requestRoute.assignedUsername ? '<p>Assigned user: ' + escapeHtml(detail.requestRoute.assignedUsername || '') + '</p>' : '';
    const rr = detail.requestRoute || {};
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
    const routeInfo = detail.requestRoute ? '<div class="mail-thread-message"><strong>Request route</strong><p>Status: ' + escapeHtml((detail.requestRoute.status || '').replace(/_/g, ' ')) + '</p><p>From: ' + escapeHtml(detail.requestRoute.originStationName || '') + '</p><p>To: ' + escapeHtml(detail.requestRoute.targetStationName || '') + '</p>' + confParts.join(' ') + assignedUserInfo + '</div>' : '';
    threadContent.innerHTML = routeInfo + messages.map(function (message) {
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
        '<p>' + escapeHtml(message.body || '') + '</p>' +
        (attachments ? '<div class="mail-attachments">' + attachments + '</div>' : '') +
      '</article>';
    }).join('');

    threadContent.hidden = false;
    threadEmpty.hidden = true;
    threadActions.innerHTML = renderThreadActions(detail);
    threadActions.hidden = threadActions.innerHTML === '';
    bindThreadActionButtons(detail);
  }

  function isComlUser() {
    return Boolean(state.bootstrap && state.bootstrap.currentUser && state.bootstrap.currentUser.isComl);
  }

  function requestTimelineSteps() {
    return [
      {
        title: 'Request submitted',
        note: 'The original request is created and sent to the origin station ComL.',
        feature: 'Create request and assign it to the origin station ComL for review.'
      },
      {
        title: 'Origin review',
        note: 'Origin station ComL reviews the request and decides whether to approve it.',
        feature: 'Origin ComL checks the request details and verifies the request can be forwarded.'
      },
      {
        title: 'Origin approved',
        note: 'The origin station ComL has approved the request for forwarding.',
        feature: 'Mark the request approved and prepare it for target station delivery.'
      },
      {
        title: 'Sent to target ComL',
        note: 'The request is forwarded to the target station ComL for their action.',
        feature: 'Forward the approved request to the target station ComL to continue processing.'
      },
      {
        title: 'Target review',
        note: 'Target station ComL is reviewing the request after receiving it.',
        feature: 'Target ComL evaluates the request before routing it to the correct user.'
      },
      {
        title: 'User attachment',
        note: 'Target ComL routes the request to the designated user to attach the required file.',
        feature: 'Assign the file upload task to the user who will attach the requested document.'
      },
      {
        title: 'File returned to ComL',
        note: 'The user has attached the file and returned the request back to target ComL.',
        feature: 'Receive the attached file through the request and prepare it for return routing.'
      },
      {
        title: 'Returned to origin',
        note: 'Target ComL sends the file back to the origin station ComL.',
        feature: 'Return the attached file to the origin station ComL for final routing.'
      },
      {
        title: 'Delivered to requester',
        note: 'Origin station ComL routes the completed file to the original requester.',
        feature: 'Deliver the final file package to the original requestor through the origin ComL.'
      }
    ];
  }

  function requestTimelineActiveIndex(status) {
    switch (String(status || '').toLowerCase()) {
      case 'pending_origin_review':
        return 1;
      case 'approved':
        return 2;
      case 'forwarded_to_target':
        return 4;
      case 'routed_to_user':
        return 5;
      case 'file_returned_to_coml':
        return 6;
      case 'returned_to_origin':
        return 7;
      case 'completed':
        return 8;
      case 'rejected':
        return 1;
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

    const steps = requestTimelineSteps();
    const activeIndex = requestTimelineActiveIndex(route.status);
    if (state.timelineSelectedIndex === undefined || state.timelineSelectedIndex < 0 || state.timelineSelectedIndex >= steps.length) {
      state.timelineSelectedIndex = activeIndex;
    }

    timelineRequestTitle.textContent = detail.thread.subject || 'Operational request timeline';
    timelineStepsContainer.innerHTML = steps.map(function (step, index) {
      const completed = index <= activeIndex;
      const active = index === state.timelineSelectedIndex;
      return '<button type="button" class="timeline-step' + (completed ? ' completed' : '') + (active ? ' active' : '') + '" data-step-index="' + index + '">' +
        '<span class="timeline-marker">' + (index + 1) + '</span>' +
        '<span class="timeline-step-title">' + escapeHtml(step.title) + '</span>' +
      '</button>';
    }).join('');

    const selectedStep = steps[state.timelineSelectedIndex];
    if (selectedStep) {
      let selectedNote = selectedStep.note || 'Select a step to view progress details.';
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

  function renderThreadActions(detail) {
    const requestRoute = detail.requestRoute || {};
    const currentUser = (state.bootstrap && state.bootstrap.currentUser) || {};
    const canAssignedReply = canAssignedRequestUserReply(detail);
    const canReviewOrigin = Boolean(
      isComlUser() &&
      requestRoute.routeId &&
      requestRoute.status === 'pending_origin_review' &&
      Number(requestRoute.originStationId || 0) === Number(currentUser.stationId || 0)
    );
    const canReviewTarget = Boolean(
      isComlUser() &&
      requestRoute.routeId &&
      requestRoute.status === 'forwarded_to_target' &&
      Number(requestRoute.targetStationId || 0) === Number(currentUser.stationId || 0)
    );
    const canAssignTarget = Boolean(
      isComlUser() &&
      requestRoute.routeId &&
      ['forwarded_to_target', 'routed_to_user', 'file_returned_to_coml'].includes(String(requestRoute.status || '')) &&
      Number(requestRoute.targetStationId || 0) === Number(currentUser.stationId || 0)
    );
    const canReturnToOrigin = Boolean(
      isComlUser() &&
      requestRoute.routeId &&
      requestRoute.status === 'file_returned_to_coml' &&
      Number(requestRoute.targetStationId || 0) === Number(currentUser.stationId || 0)
    );
    const canAssignOrigin = Boolean(
      isComlUser() &&
      requestRoute.routeId &&
      String(requestRoute.status || '') === 'returned_to_origin' &&
      Number(requestRoute.originStationId || 0) === Number(currentUser.stationId || 0)
    );

    if (canReviewOrigin) {
      return '<div class="mail-form-actions"><button type="button" class="secondary-btn" id="rejectRequestBtn">Reject</button><button type="button" class="primary-btn" id="approveRequestBtn">Approve</button></div>';
    }

    let html = '';
    const assignableUsers = Array.isArray((state.bootstrap || {}).stationUsers)
      ? (state.bootstrap.stationUsers || [])
      : [];

    if (canReviewTarget && requestRoute.isConfidential && !requestRoute.targetConfidentialConfirmed) {
      html += '<div class="mail-form-actions"><button type="button" class="primary-btn" id="targetConfirmConfidentialBtn">Confirm confidentiality (Target ComL)</button></div>';
    }

    if (canReviewTarget) {
      html += '<div class="mail-form-actions"><button type="button" class="secondary-btn" id="targetRejectRequestBtn">Reject</button><button type="button" class="secondary-btn" id="targetEditRequestBtn">Edit request</button></div>';
    }

    if (canAssignTarget) {
      html += '<div class="mail-form-actions"><label for="assignTargetUserSelect">Assign request to target station user</label><select id="assignTargetUserSelect">' +
        '<option value="">Select user</option>' +
        assignableUsers.map(function (user) {
          const label = String(user.username || 'User') + (user.positionName ? (' (' + String(user.positionName) + ')') : '');
          return '<option value="' + escapeHtml(String(user.userId || '')) + '">' + escapeHtml(label) + '</option>';
        }).join('') +
        '</select><button type="button" class="primary-btn" id="assignTargetUserBtn">Assign User</button></div>';
    }

    if (canReturnToOrigin) {
      html += '<div class="mail-form-actions"><button type="button" class="secondary-btn" id="markFileReturnedBtn">Mark file returned</button><button type="button" class="primary-btn" id="returnToOriginBtn">Return to origin</button></div>';
    }

    if (canAssignOrigin) {
      html += '<div class="mail-form-actions"><p class="form-note">After target ComL returns the file, validate it and release it to the original requester.</p><button type="button" class="primary-btn" id="assignOriginUserBtn">Release to requester</button></div>';
    }

    if (html !== '') {
      return html;
    }

    if (isComlUser()) {
      return '<div class="mail-form-actions"><p class="form-note">This request is visible to ComL. Review actions appear when the request is pending on your station, or you can assign it to a station user once it arrives.</p></div>';
    }

    return '';
  }

  function bindThreadActionButtons(detail) {
    const approveRequestBtn = document.getElementById('approveRequestBtn');
    const rejectRequestBtn = document.getElementById('rejectRequestBtn');
    const targetRejectRequestBtn = document.getElementById('targetRejectRequestBtn');
    const targetEditRequestBtn = document.getElementById('targetEditRequestBtn');
    const assignTargetUserBtn = document.getElementById('assignTargetUserBtn');
    const markFileReturnedBtn = document.getElementById('markFileReturnedBtn');
    const returnToOriginBtn = document.getElementById('returnToOriginBtn');
    const assignOriginUserBtn = document.getElementById('assignOriginUserBtn');
    const targetConfirmConfidentialBtn = document.getElementById('targetConfirmConfidentialBtn');
    const replyAssignedBtn = document.getElementById('replyAssignedBtn');
    const threadPanel = document.getElementById('threadPanel');

    if (threadPanel && threadPanel.dataset.replyAffordanceBound !== '1') {
      threadPanel.dataset.replyAffordanceBound = '1';
      threadPanel.style.position = 'relative';
      threadPanel.style.overflow = 'visible';
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
    if (targetRejectRequestBtn) {
      targetRejectRequestBtn.addEventListener('click', function () {
        rejectTargetRequest(detail);
      });
    }
    if (targetEditRequestBtn) {
      targetEditRequestBtn.addEventListener('click', function () {
        editTargetRequest(detail);
      });
    }
    if (assignTargetUserBtn) {
      assignTargetUserBtn.addEventListener('click', function () {
        assignRequestToTargetUser(detail);
      });
    }
    if (markFileReturnedBtn) {
      markFileReturnedBtn.addEventListener('click', function () {
        markFileReturned(detail);
      });
    }
    if (returnToOriginBtn) {
      returnToOriginBtn.addEventListener('click', function () {
        returnToOrigin(detail);
      });
    }
    if (assignOriginUserBtn) {
      assignOriginUserBtn.addEventListener('click', function () {
        assignRequestToOriginUser(detail);
      });
    }
    if (targetConfirmConfidentialBtn) {
      targetConfirmConfidentialBtn.addEventListener('click', function () {
        confirmTargetConfidential(detail);
      });
    }
    if (replyAssignedBtn) {
      replyAssignedBtn.hidden = !canAssignedReply;
      replyAssignedBtn.textContent = 'Reply';
      replyAssignedBtn.style.position = 'absolute';
      replyAssignedBtn.style.top = '50%';
      replyAssignedBtn.style.right = '-14px';
      replyAssignedBtn.style.transform = 'translate(100%, -50%) translateX(10px)';
      replyAssignedBtn.style.opacity = '0';
      replyAssignedBtn.style.pointerEvents = 'none';
      replyAssignedBtn.style.zIndex = '3';
      replyAssignedBtn.style.whiteSpace = 'nowrap';
      replyAssignedBtn.style.transition = 'opacity 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease';
      replyAssignedBtn.style.writingMode = 'horizontal-tb';
      replyAssignedBtn.style.textOrientation = 'mixed';
      replyAssignedBtn.style.letterSpacing = '0.06em';
      replyAssignedBtn.style.textTransform = 'uppercase';
      replyAssignedBtn.style.boxShadow = '0 12px 24px rgba(166, 29, 42, 0.22)';

      function showReplyButton() {
        if (!canAssignedReply || replyAssignedBtn.hidden) {
          return;
        }
        replyAssignedBtn.style.opacity = '1';
        replyAssignedBtn.style.pointerEvents = 'auto';
        replyAssignedBtn.style.transform = 'translate(100%, -50%) translateX(0)';
      }

      function hideReplyButton() {
        if (!canAssignedReply || replyAssignedBtn.hidden) {
          return;
        }
        replyAssignedBtn.style.opacity = '0';
        replyAssignedBtn.style.pointerEvents = 'none';
        replyAssignedBtn.style.transform = 'translate(100%, -50%) translateX(10px)';
      }

      if (threadPanel && threadPanel.dataset.replyHoverBound !== '1') {
        threadPanel.dataset.replyHoverBound = '1';
        threadPanel.addEventListener('mouseenter', showReplyButton);
        threadPanel.addEventListener('mouseleave', hideReplyButton);
        threadPanel.addEventListener('focusin', showReplyButton);
        threadPanel.addEventListener('focusout', function () {
          window.setTimeout(function () {
            if (threadPanel && !threadPanel.contains(document.activeElement)) {
              hideReplyButton();
            }
          }, 0);
        });
      }

      if (canAssignedReply) {
        showReplyButton();
      } else {
        hideReplyButton();
      }

      replyAssignedBtn.addEventListener('click', function () {
        openAssignedReply(detail);
      });
    }
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
    composeBody.value = '\n\n--- Replying to request ---\n' + String(latest.body || '');
    composeStationSelect.value = String(requestRoute.originStationId || '');
    composeCloudinaryUrl.value = '';
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
    const reason = window.prompt('Enter rejection reason:');
    if (reason === null) {
      return;
    }

    try {
      setMessage('Rejecting request...', false);
      await submitRouteAction('request-reject', { routeId: Number(detail.requestRoute.routeId || 0), reason: reason.trim() });
      await openThread(detail.thread.threadId);
      await fetchBootstrap();
      await fetchList();
      setMessage('Request rejected.', false);
    } catch (error) {
      setMessage(error.message, true);
    }
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
    const cloudUrl = window.prompt('Optional: paste the final Cloudinary URL if not already in the thread (must be under origin or target station folder). Leave blank to release without attaching a new link:', '');
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
    const reason = window.prompt('Enter rejection reason for target station:');
    if (reason === null) {
      return;
    }

    submitRouteAction('request-target-reject', {
      routeId: Number(detail.requestRoute.routeId || 0),
      reason: reason.trim()
    }).then(function () {
      return openThread(detail.thread.threadId);
    }).then(function () {
      return fetchBootstrap();
    }).then(function () {
      return fetchList();
    }).then(function () {
      setMessage('Target ComL rejection recorded.', false);
    }).catch(function (error) {
      setMessage(error.message, true);
    });
  }

  function editTargetRequest(detail) {
    const note = window.prompt('Enter note for target station request edit:', '');
    if (note === null || note.trim() === '') {
      setMessage('Edit note cannot be empty.', true);
      return;
    }

    submitRouteAction('request-target-edit', {
      routeId: Number(detail.requestRoute.routeId || 0),
      note: note.trim()
    }).then(function () {
      return openThread(detail.thread.threadId);
    }).then(function () {
      return fetchBootstrap();
    }).then(function () {
      return fetchList();
    }).then(function () {
      setMessage('Target ComL edit has been saved.', false);
    }).catch(function (error) {
      setMessage(error.message, true);
    });
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
    const cloudUrl = window.prompt('Paste the Cloudinary secure URL for the file (must be in your station folder). Required:');
    if (cloudUrl === null) {
      return;
    }
    if (!String(cloudUrl).trim()) {
      setMessage('Cloudinary URL is required to return the file to origin ComL.', true);
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
    const query = new URLSearchParams({ action: 'list', folder: state.folder, search: state.search || '' });
    const response = await fetch(apiUrl + '?' + query.toString(), { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true) {
      throw new Error((payload && payload.message) || 'Unable to load requests.');
    }
    state.items = Array.isArray(payload.items) ? payload.items : [];
    renderList();
  }

  async function openThread(threadId) {
    const response = await fetch(apiUrl + '?action=thread&threadId=' + encodeURIComponent(String(threadId)), { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok || !payload || payload.ok !== true || !payload.data) {
      throw new Error((payload && payload.message) || 'Unable to open thread.');
    }
    state.activeThread = payload.data.thread || null;
    renderThread(payload.data);
    renderList();
  }

  function openCompose() {
    composeModal.hidden = false;
    document.body.style.overflow = 'hidden';
    setMessage('', false);
    updateComposeMode();
  }

  function closeCompose() {
    composeModal.hidden = true;
    composeModal.style.display = '';
    document.body.style.overflow = '';
    composeForm.reset();
    state.composeReplyMode = false;
    state.composeReplyThreadId = 0;
    state.composeReplyOriginStationId = 0;
    updateComposeMode();
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
      assignedUserId > 0 &&
      assignedUserId === currentUserId &&
      targetStationId === currentStationId &&
      ['forwarded_to_target', 'routed_to_user'].includes(routeStatus)
    );
  }

  // ===== File Picker Functions =====
  function openFilePicker() {
    cloudinaryFilePicker.hidden = false;
    document.body.style.overflow = 'hidden';
    state.filePickerSelectedFile = null;
    filePickerSelectedInfo.textContent = '';
    filePickerSelected.hidden = true;
    filePickerSelectBtn.disabled = true;
    loadCloudinaryFiles();
  }

  function closeFilePicker() {
    cloudinaryFilePicker.hidden = true;
    document.body.style.overflow = '';
    state.filePickerSelectedFile = null;
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

    const url = new URL(cloudinaryBrowserUrl, window.location.origin);
    url.searchParams.append('action', 'list');

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
      showFilePickerError((error && error.message) || 'Failed to load files from Cloudinary');
    });
  }

  function renderFilePickerList() {
    if (state.filePickerFiles.length === 0) {
      filePickerList.innerHTML = '<div class="file-picker-empty"><p>No files or reports found in your station.</p></div>';
      return;
    }

    filePickerList.innerHTML = state.filePickerFiles.map(function(file) {
      const selected = state.filePickerSelectedFile && state.filePickerSelectedFile.public_id === file.public_id ? ' selected' : '';
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

  function bindFilePickerItems() {
    Array.from(filePickerList.querySelectorAll('.file-picker-item')).forEach(function(item) {
      item.addEventListener('click', function() {
        const fileId = item.getAttribute('data-file-id');
        state.filePickerSelectedFile = state.filePickerFiles.find(function(f) {
          return f.public_id === fileId;
        });

        if (state.filePickerSelectedFile) {
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
    if (!state.filePickerSelectedFile) {
      setMessage('Please select a valid file', true);
      return;
    }

    const url = state.filePickerSelectedFile && state.filePickerSelectedFile.url ? String(state.filePickerSelectedFile.url) : '';
    if (!url) {
      setMessage('Please select a valid file', true);
      return;
    }

    composeCloudinaryUrl.value = url;
    closeFilePicker();
  }

  function updateComposeMode() {
    const modalKicker = composeModal.querySelector('.mail-kicker');
    const modalTitle = composeModal.querySelector('h2');
    const stationLabel = composeStationSelect.closest('label');
    const isReplyMode = Boolean(state.composeReplyMode);

    if (modalKicker) {
      modalKicker.textContent = isReplyMode ? 'Operational Reply' : 'New request';
    }
    if (modalTitle) {
      modalTitle.textContent = isReplyMode ? 'Attach file and return to ComL' : 'Create operational request';
    }
    if (stationLabel) {
      stationLabel.hidden = isReplyMode;
    }
    if (saveDraftBtn) {
      saveDraftBtn.hidden = isReplyMode;
    }
    if (sendBtn) {
      sendBtn.textContent = isReplyMode ? 'Return to target ComL' : 'Send request';
    }
    if (composeOrgmailHint) {
      if (isReplyMode) {
        composeOrgmailHint.textContent = 'Paste or upload a Cloudinary file from your station folder, then return it to the target station ComL.';
      } else if (state.bootstrap && state.bootstrap.operationalOrgmail && state.bootstrap.operationalOrgmail.uploadsEnabled) {
        composeOrgmailHint.textContent = 'Use a URL under your station folder, or upload a file directly into that folder.';
      } else {
        composeOrgmailHint.textContent = 'Operational files must live under your station folder on Cloudinary.';
      }
    }
  }

  function validateUrl(url) {
    return /^https:\/\//i.test(String(url || '').trim());
  }

  function cloudinaryUrlInMyStationFolder(url) {
    const stationCode = state.bootstrap && state.bootstrap.operationalOrgmail && state.bootstrap.operationalOrgmail.stationCode;
    if (!stationCode || !url) {
      return true;
    }
    return String(url).toLowerCase().indexOf('/' + String(stationCode) + '/') !== -1;
  }

  async function submitRequest(isDraft) {
    const subject = String(composeSubject.value || '').trim();
    const body = String(composeBody.value || '').trim();
    const stationId = Number(composeStationSelect.value || 0);
    const cloudinaryUrl = String(composeCloudinaryUrl.value || '').trim();

    if (state.composeReplyMode && isDraft) {
      throw new Error('Drafts are not available for request replies.');
    }

    if (!isDraft) {
      if (subject === '') {
        throw new Error(state.composeReplyMode ? 'Please add a reply subject.' : 'Please add a subject for this request.');
      }
      if (!state.composeReplyMode && stationId < 1) {
        throw new Error('Choose a target station.');
      }
      if (cloudinaryUrl !== '' && !validateUrl(cloudinaryUrl)) {
        throw new Error('Please provide a valid Cloudinary URL beginning with https://');
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
      formData.append('recipientStationIds[]', String(stationId));
    }
    if (cloudinaryUrl !== '') {
      formData.append('cloudinaryUrl', cloudinaryUrl);
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

  openComposeBtn.addEventListener('click', openCompose);
  closeComposeBtn.addEventListener('click', closeCompose);
  composeModal.addEventListener('click', function (event) {
    if (event.target && event.target.closest('[data-close="true"]')) {
      closeCompose();
    }
  });
  refreshBtn.addEventListener('click', function () {
    fetchList().catch(function (error) { setMessage(error.message, true); });
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
        'inbox': 'Pending',
        'sent': 'Sent',
        'drafts': 'Drafts'
      };
      mailFolderTitle.textContent = titles[folder] || 'Requests';

      // Fetch and render
      fetchList().catch(function (error) { setMessage(error.message, true); });
      threadEmpty.hidden = false;
      threadContent.hidden = true;
      threadTitle.textContent = 'Select a request';
    });
  });

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
      if (!composeOrgmailFile.files || !composeOrgmailFile.files[0]) {
        return;
      }
      const fd = new FormData();
      fd.append('file', composeOrgmailFile.files[0]);
      setMessage('Uploading…', false);
      fetch('/firenet/NEWFIRENET/backend/controllers/demo-file-upload.php', { method: 'POST', body: fd, credentials: 'same-origin' })
        .then(function (r) {
          return r.json().then(function (p) {
            return { r: r, p: p };
          });
        })
        .then(function (out) {
          if (!out || !out.r || !out.p || !out.r.ok || out.p.ok !== true) {
            throw new Error((out && out.p && out.p.message) || 'Upload failed');
          }
          const url = out.p && out.p.file && out.p.file.url ? String(out.p.file.url) : '';
          if (url) {
            composeCloudinaryUrl.value = url;
            setMessage('Upload complete. URL filled in.', false);
            if (!state.composeReplyMode) {
              setTimeout(function() {
                loadCloudinaryFiles();
              }, 500);
            }
          } else {
            throw new Error('No URL returned from upload');
          }
        })
        .catch(function (e) {
          setMessage((e && e.message) || 'Upload failed', true);
        })
        .then(function () {
          composeOrgmailFile.value = '';
        });
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
    if (event.key === 'Escape' && !composeModal.hidden) {
      closeCompose();
    }
  });

  async function init() {
    composeModal.hidden = true;
    document.body.style.overflow = '';
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

  init();
})();
