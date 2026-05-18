/**
 * File Request Management JavaScript
 * 
 * Handles:
 * - Creating new file requests
 * - Listing requests with filtering
 * - ComL review and approval
 * - File upload and access logging
 */

(function() {
    const apiUrl = '../backend/controllers/file_request_routes.php';
    
    const state = {
        currentUser: null,
        stations: [],
        requests: [],
        activeRequest: null,
        isComl: false
    };
    
    // DOM Elements
    const els = {
        compose: document.getElementById('file-request-compose'),
        listContainer: document.getElementById('file-request-list-container'),
        list: document.getElementById('file-request-list'),
        detailContainer: document.getElementById('file-request-detail-container'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        btnNewRequest: document.getElementById('btn-new-request'),
        btnCancelRequest: document.getElementById('btn-cancel-request'),
        btnPendingOrigin: document.getElementById('btn-pending-origin'),
        btnPendingTarget: document.getElementById('btn-pending-target'),
        form: document.getElementById('file-request-form'),
        targetStation: document.getElementById('request-target-station'),
        subject: document.getElementById('request-subject'),
        description: document.getElementById('request-description'),
        isConfidential: document.getElementById('request-is-confidential'),
        confidentialityLevel: document.getElementById('request-confidentiality-level'),
        confidentialityLevelGroup: document.getElementById('confidentiality-level-group'),
        detailSubject: document.getElementById('detail-subject'),
        detailMeta: document.getElementById('detail-meta'),
        detailActions: document.getElementById('detail-actions'),
        detailDescription: document.getElementById('detail-description'),
        detailFromUser: document.getElementById('detail-from-user'),
        detailOriginStation: document.getElementById('detail-origin-station'),
        detailTargetStation: document.getElementById('detail-target-station'),
        detailStatus: document.getElementById('detail-status'),
        detailCreated: document.getElementById('detail-created'),
        approvalTimeline: document.getElementById('approval-timeline'),
        filesSection: document.getElementById('files-section'),
        detailFiles: document.getElementById('detail-files'),
        uploadResponseSection: document.getElementById('upload-response-section'),
        uploadRouteId: document.getElementById('upload-route-id'),
        uploadForm: document.getElementById('upload-response-form'),
        uploadFile: document.getElementById('upload-response-file'),
        confidentialBannerContainer: document.getElementById('confidential-banner-container')
    };
    
    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
    
    function showMessage(message, isError = false) {
        const alertClass = isError ? 'alert-error' : 'alert-success';
        console.log((isError ? 'ERROR: ' : '') + message);
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    
    function getStatusBadgeClass(status) {
        return 'file-request-status-badge status-' + status;
    }
    
    function getStatusLabel(status) {
        const labels = {
            'pending_origin_approval': 'Pending Origin Review',
            'pending_target_approval': 'Pending Target Review',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'file_received': 'File Received',
            'delivered_to_user': 'Delivered to User'
        };
        return labels[status] || status;
    }
    
    async function bootstrap() {
        try {
            const formData = new FormData();
            formData.append('action', 'bootstrap');
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const payload = await response.json();
            
            if (!response.ok || !payload.ok) {
                throw new Error(payload.message || 'Failed to load file requests');
            }
            
            state.currentUser = payload.currentUser;
            state.stations = payload.stations || [];
            state.isComl = state.currentUser.isComl;
            
            // Update UI based on ComL status
            if (state.isComl) {
                els.btnPendingOrigin.style.display = 'block';
                els.btnPendingTarget.style.display = 'block';
            }
            
            // Populate station dropdown
            els.targetStation.innerHTML = '<option value="">-- Select a station --</option>' + 
                state.stations.map(s => 
                    `<option value="${s.station_id}">${escapeHtml(s.station_name)} (${escapeHtml(s.station_code)})</option>`
                ).join('');
            
            await loadRequests('all');
            
        } catch (error) {
            showMessage(error.message, true);
        }
    }
    
    async function loadRequests(filter = 'all') {
        try {
            const formData = new FormData();
            formData.append('action', 'list');
            formData.append('filter', filter);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const payload = await response.json();
            
            if (!response.ok || !payload.ok) {
                throw new Error(payload.message || 'Failed to load requests');
            }
            
            state.requests = payload.requests || [];
            renderRequestList();
            
        } catch (error) {
            showMessage(error.message, true);
        }
    }
    
    function renderRequestList() {
        if (!state.requests.length) {
            els.list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>No file requests found</p>
                </div>
            `;
            return;
        }
        
        els.list.innerHTML = state.requests.map(req => `
            <div class="file-request-item" data-route-id="${req.route_id}">
                <div class="file-request-item-header">
                    <div class="file-request-item-subject">${escapeHtml(req.subject)}</div>
                    <div class="${getStatusBadgeClass(req.status)}">${getStatusLabel(req.status)}</div>
                </div>
                <div class="file-request-item-meta">
                    <span>From: ${escapeHtml(req.request_username || 'Unknown')}</span>
                    <span>${escapeHtml(req.origin_station_name || '')} → ${escapeHtml(req.target_station_name || '')}</span>
                    <span>${formatDate(req.created_at)}</span>
                    ${req.is_confidential ? '<span>🔒 Confidential</span>' : ''}
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        document.querySelectorAll('.file-request-item').forEach(item => {
            item.addEventListener('click', () => selectRequest(Number(item.dataset.routeId)));
        });
    }
    
    async function selectRequest(routeId) {
        try {
            const formData = new FormData();
            formData.append('action', 'detail');
            formData.append('routeId', routeId);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const payload = await response.json();
            
            if (!response.ok || !payload.ok) {
                throw new Error(payload.message || 'Failed to load request details');
            }
            
            state.activeRequest = payload.request;
            renderRequestDetail(payload.request, payload.approvals || [], payload.files || []);
            
            // Update active highlight
            document.querySelectorAll('.file-request-item').forEach(item => {
                item.classList.toggle('active', Number(item.dataset.routeId) === routeId);
            });
            
            // Show detail and hide list
            els.listContainer.style.display = 'none';
            els.compose.style.display = 'none';
            els.detailContainer.classList.add('visible');
            
        } catch (error) {
            showMessage(error.message, true);
        }
    }
    
    function renderRequestDetail(request, approvals, files) {
        els.detailSubject.textContent = request.subject;
        els.detailDescription.textContent = request.description;
        els.detailFromUser.textContent = request.request_username;
        els.detailOriginStation.textContent = request.origin_station_name;
        els.detailTargetStation.textContent = request.target_station_name;
        els.detailStatus.textContent = getStatusLabel(request.status);
        els.detailCreated.textContent = formatDate(request.created_at);
        
        // Render confidential banner
        if (request.is_confidential) {
            const levelClass = request.confidentiality_level === 'highly_confidential' ? 'highly' : '';
            els.confidentialBannerContainer.innerHTML = `
                <div class="confidential-banner ${levelClass}">
                    🔒 <strong>Confidential Information</strong><br>
                    Level: ${request.confidentiality_level.replace(/_/g, ' ').toUpperCase()}
                </div>
            `;
        } else {
            els.confidentialBannerContainer.innerHTML = '';
        }
        
        // Render actions based on status and ComL status
        renderDetailActions(request);
        
        // Render approval timeline
        renderApprovalTimeline(approvals);
        
        // Render files
        if (files.length > 0) {
            els.filesSection.style.display = 'block';
            els.detailFiles.innerHTML = files.map(file => `
                <div class="file-item">
                    <div class="file-item-info">
                        <div class="file-item-name">📎 ${escapeHtml(file.original_file_name)}</div>
                        <div class="file-item-meta">
                            ${(file.file_size_bytes / 1024).toFixed(2)} KB • Uploaded by ${escapeHtml(file.uploader_name || 'Unknown')}
                        </div>
                        <div class="file-item-restrictions">
                            ${file.view_only ? '<span class="restriction-tag">View Only</span>' : ''}
                            ${!file.download_allowed ? '<span class="restriction-tag">No Download</span>' : ''}
                            ${!file.print_allowed ? '<span class="restriction-tag">No Print</span>' : ''}
                        </div>
                        ${file.cloudinary_url ? `<div class="file-item-cloudinary">☁️ Uploaded to Cloud</div>` : ''}
                    </div>
                    <div class="file-item-actions">
                        <a href="../uploads/file_requests/${file.stored_file_name}"
                           class="btn-primary" style="padding: 8px 12px; text-decoration: none;">
                            Download
                        </a>
                        ${!file.cloudinary_url ? `<button class="btn-secondary upload-cloud" data-file-id="${file.file_id}" data-route-id="${state.activeRequest.route_id}" style="padding: 8px 12px;">Upload to Cloud</button>` : ''}
                    </div>
                </div>
            `).join('');

            // Add upload cloud handlers
            document.querySelectorAll('.upload-cloud').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const fileId = Number(e.target.dataset.fileId);
                    const routeId = Number(e.target.dataset.routeId);
                    await uploadFileToCloudinary(fileId, routeId, e.target);
                });
            });
        } else {
            els.filesSection.style.display = 'none';
        }
        
        // Show upload section for ComL users when status is approved
        if (state.isComl && request.status === 'approved') {
            els.uploadResponseSection.style.display = 'block';
            els.uploadRouteId.value = request.route_id;
        } else {
            els.uploadResponseSection.style.display = 'none';
        }
    }
    
    function renderDetailActions(request) {
        let buttons = '';
        
        if (state.isComl && request.status === 'pending_origin_approval') {
            buttons += `
                <button class="btn-approve" onclick="window.approveRequest(${request.route_id}, 'origin_review')">Approve</button>
                <button class="btn-reject" onclick="window.rejectRequest(${request.route_id}, 'origin_review')">Reject</button>
            `;
        }
        
        if (state.isComl && request.status === 'pending_target_approval') {
            buttons += `
                <button class="btn-approve" onclick="window.approveRequest(${request.route_id}, 'target_review')">Approve</button>
                <button class="btn-reject" onclick="window.rejectRequest(${request.route_id}, 'target_review')">Reject</button>
            `;
        }
        
        buttons += '<button class="btn-secondary" onclick="window.backToList()" style="background: #999;">Back to List</button>';
        
        els.detailActions.innerHTML = buttons;
    }
    
    function renderApprovalTimeline(approvals) {
        if (!approvals.length) {
            els.approvalTimeline.innerHTML = '<p style="color: #999; text-align: center; margin: 0;">No approvals yet</p>';
            return;
        }
        
        els.approvalTimeline.innerHTML = approvals.map(approval => `
            <div class="approval-item ${approval.action === 'rejected' ? 'rejected' : ''}">
                <div class="approval-header">
                    <div>
                        <div class="approval-stage">${approval.approval_stage.replace(/_/g, ' ').toUpperCase()}</div>
                        <div class="approval-meta">By ${escapeHtml(approval.approver_name || 'Unknown')}</div>
                    </div>
                    <div class="approval-action ${approval.action === 'rejected' ? 'rejected' : ''}">
                        ${approval.action.toUpperCase()}
                    </div>
                </div>
                ${approval.notes ? `<p style="margin: 8px 0 0; color: #666; font-size: 14px;">${escapeHtml(approval.notes)}</p>` : ''}
                <div class="approval-meta">${formatDate(approval.created_at)}</div>
            </div>
        `).join('');
    }
    
    async function submitRequest(event) {
        event.preventDefault();
        
        if (!els.targetStation.value) {
            showMessage('Please select a target station', true);
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('action', 'create');
            formData.append('targetStationId', els.targetStation.value);
            formData.append('subject', els.subject.value);
            formData.append('description', els.description.value);
            formData.append('isConfidential', els.isConfidential.checked);
            if (els.isConfidential.checked) {
                formData.append('confidentialityLevel', els.confidentialityLevel.value);
            }
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const payload = await response.json();
            
            if (!response.ok || !payload.ok) {
                throw new Error(payload.message || 'Failed to create request');
            }
            
            showMessage(payload.message);
            els.form.reset();
            els.compose.style.display = 'none';
            els.listContainer.style.display = 'block';
            await loadRequests('outgoing');
            
        } catch (error) {
            showMessage(error.message, true);
        }
    }
    
    // Global functions for inline onclick handlers
    window.approveRequest = async function(routeId, stage) {
        const reason = prompt('Enter approval notes (optional):');
        
        try {
            const formData = new FormData();
            formData.append('action', 'approve');
            formData.append('routeId', routeId);
            formData.append('stage', stage);
            if (reason !== null) {
                formData.append('notes', reason);
            }
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const payload = await response.json();
            
            if (!response.ok || !payload.ok) {
                throw new Error(payload.message || 'Failed to approve');
            }
            
            showMessage(payload.message);
            await selectRequest(routeId);
            await loadRequests('all');
            
        } catch (error) {
            showMessage(error.message, true);
        }
    };
    
    window.rejectRequest = async function(routeId, stage) {
        const reason = prompt('Enter rejection reason:');
        
        if (reason === null) return;
        
        try {
            const formData = new FormData();
            formData.append('action', 'reject');
            formData.append('routeId', routeId);
            formData.append('stage', stage);
            formData.append('reason', reason);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const payload = await response.json();
            
            if (!response.ok || !payload.ok) {
                throw new Error(payload.message || 'Failed to reject');
            }
            
            showMessage(payload.message);
            window.backToList();
            await loadRequests('all');
            
        } catch (error) {
            showMessage(error.message, true);
        }
    };
    
    window.backToList = function() {
        els.detailContainer.classList.remove('visible');
        els.compose.style.display = 'none';
        els.listContainer.style.display = 'block';
        state.activeRequest = null;
    };
    
    // Upload file to Cloudinary
    async function uploadFileToCloudinary(fileId, routeId, button) {
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Uploading...';

        try {
            const formData = new FormData();
            formData.append('fileId', fileId);
            formData.append('routeId', routeId);

            const response = await fetch('../backend/controllers/file-request-cloudinary-upload.php', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            const payload = await response.json();

            if (!response.ok || !payload.ok) {
                throw new Error(payload.message || 'Upload failed');
            }

            showMessage('File uploaded to Cloudinary successfully');
            button.style.display = 'none';

            // Refresh file list
            const fileDetail = document.createElement('div');
            fileDetail.className = 'file-item-cloudinary';
            fileDetail.textContent = '☁️ Uploaded to Cloud';
            button.parentElement.parentElement.querySelector('.file-item-restrictions').parentElement.appendChild(fileDetail);

        } catch (error) {
            showMessage(error.message, true);
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    window.uploadFileToCloudinary = uploadFileToCloudinary;

        event.preventDefault();
        
        if (!els.uploadFile.files.length) {
            showMessage('Please select a file', true);
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('action', 'upload-response');
            formData.append('routeId', els.uploadRouteId.value);
            formData.append('responseFile', els.uploadFile.files[0]);
            formData.append('viewOnly', document.getElementById('upload-view-only').checked);
            formData.append('downloadAllowed', document.getElementById('upload-download-allowed').checked);
            formData.append('printAllowed', document.getElementById('upload-print-allowed').checked);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const payload = await response.json();
            
            if (!response.ok || !payload.ok) {
                throw new Error(payload.message || 'Failed to upload file');
            }
            
            showMessage(payload.message);
            els.uploadForm.reset();
            const routeId = Number(els.uploadRouteId.value);
            await selectRequest(routeId);
            
        } catch (error) {
            showMessage(error.message, true);
        }
    }
    
    // Event listeners
    els.filterBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            els.filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            els.detailContainer.classList.remove('visible');
            els.listContainer.style.display = 'block';
            els.compose.style.display = 'none';
            await loadRequests(e.target.dataset.filter);
        });
    });
    
    els.btnNewRequest.addEventListener('click', () => {
        els.listContainer.style.display = 'none';
        els.detailContainer.classList.remove('visible');
        els.compose.style.display = 'block';
        els.form.reset();
    });
    
    els.btnCancelRequest.addEventListener('click', () => {
        els.compose.style.display = 'none';
        els.listContainer.style.display = 'block';
    });
    
    els.form.addEventListener('submit', submitRequest);
    els.uploadForm.addEventListener('submit', submitUploadResponse);
    
    els.isConfidential.addEventListener('change', (e) => {
        els.confidentialityLevelGroup.classList.toggle('visible', e.target.checked);
    });
    
    // Initialize
    bootstrap();
})();
