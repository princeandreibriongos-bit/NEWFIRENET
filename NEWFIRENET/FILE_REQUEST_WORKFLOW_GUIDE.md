# File Request Workflow Implementation Guide

## Overview

This document describes the complete multi-stage file request workflow implemented in FireNet. The system enforces strict ComL (Communication Leader) mediation for all inter-station file exchanges, ensuring security, tracking, and proper access controls.

## Architecture

### Three Core Flows

#### 1. NORMAL FILE REQUEST FLOW
```
User → Origin ComL (Review) → Target Station ComL (Review) → File Preparation → Origin ComL (Validate) → User
```

**Steps:**
1. Regular user creates a request for a file or information
2. Request is automatically sent to the origin station's ComL
3. Origin ComL reviews the request (can approve, reject, or request modifications)
4. If approved, Origin ComL forwards the request to target station's ComL
5. Target ComL reviews the request (can approve or reject)
6. If approved, Target ComL prepares the file and sends it back
7. Origin ComL receives and validates the file
8. Origin ComL forwards the file to the requesting user
9. User receives and accesses the file

#### 2. CONFIDENTIAL FILE REQUEST FLOW
```
User → Origin ComL (Review/Tag) → Target ComL (Verify Level) → File Prep (Restricted) → Origin ComL (Apply Controls) → User (Must Confirm)
+ System logs all access
```

**Steps:**
1. Regular user creates a request and marks it as confidential
2. User specifies confidentiality level (Restricted / Confidential / Highly Confidential)
3. Request is sent to Origin Station ComL
4. Origin ComL reviews and tags the request as confidential (if applicable)
5. If approved, Origin ComL sends to Target Station ComL
6. Target ComL reviews the request and confirms confidentiality level
7. If approved, Target ComL prepares file with restrictions (view-only, limited download/print)
8. Target ComL sends file back to Origin ComL
9. Origin ComL verifies the file and applies access control settings
10. Origin ComL releases the file to requesting user with restrictions
11. User must confirm acknowledgment before opening
12. System logs all access and actions performed on the file

#### 3. REJECTION FLOW (APPLIES TO BOTH)
```
If Origin ComL Rejects → Request returned to user with reason
If Target ComL Rejects → Response sent back to Origin ComL → Origin ComL informs user with explanation
```

**Process:**
- If Origin ComL rejects at initial review → immediate rejection to user
- If Target ComL rejects → message goes back to Origin ComL
- Origin ComL forwards rejection explanation to requesting user

## Database Schema

### Tables Created

#### `file_request_routes`
Main table tracking each file request through the workflow.

```sql
route_id INT PRIMARY KEY
request_user_id INT - User who initiated the request
origin_station_id INT - Station where request originated
target_station_id INT - Station from which file is requested
subject VARCHAR(255) - Request subject
description LONGTEXT - Request details
is_confidential TINYINT - Boolean flag
confidentiality_level ENUM('public', 'restricted', 'confidential', 'highly_confidential')
status ENUM('pending_origin_approval', 'pending_target_approval', 'approved', 'rejected', 'file_received', 'delivered_to_user')
origin_coml_user_id INT - ComL reviewing at origin station
target_coml_user_id INT - ComL reviewing at target station
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `file_request_approvals`
Records all approvals and rejections at each stage.

```sql
approval_id INT PRIMARY KEY
route_id INT
approval_stage ENUM('origin_review', 'target_review', 'file_delivery')
approver_user_id INT
action ENUM('approved', 'rejected', 'rejected_with_modification')
notes LONGTEXT - Comments from approver
created_at TIMESTAMP
```

#### `file_request_files`
Tracks uploaded files in the request workflow.

```sql
file_id INT PRIMARY KEY
route_id INT
stage ENUM('request', 'response') - Whether this is the initial request file or response file
uploaded_by_user_id INT
original_file_name VARCHAR(255)
stored_file_name VARCHAR(255) - UUID-based name for security
file_path VARCHAR(500)
mime_type VARCHAR(120)
file_size_bytes INT UNSIGNED
view_only TINYINT(1) - Confidentiality restriction
download_allowed TINYINT(1)
print_allowed TINYINT(1)
created_at TIMESTAMP
```

#### `file_request_access_logs`
Audit trail for all confidential file access.

```sql
log_id INT PRIMARY KEY
file_id INT
route_id INT
user_id INT - Who accessed the file
action ENUM('viewed', 'downloaded', 'printed', 'shared')
ip_address VARCHAR(45)
user_agent VARCHAR(500)
accessed_at TIMESTAMP
```

## API Endpoints

All endpoints are at: `/backend/controllers/file_request_routes.php`

### Authentication
All endpoints require login via `firenet_require_login()`.

### Actions

#### `bootstrap` (POST)
Initializes the file request system for the current user.

**Response:**
```json
{
  "ok": true,
  "currentUser": {
    "userId": 123,
    "username": "officer",
    "stationId": 1,
    "isComl": true
  },
  "stations": [...],
  "pendingOriginApprovals": [...],
  "pendingTargetApprovals": [...]
}
```

#### `create` (POST)
Creates a new file request.

**Parameters:**
- `targetStationId`: Target station ID
- `subject`: Request subject
- `description`: Request description
- `isConfidential`: Boolean
- `confidentialityLevel`: If confidential, level specification

**Response:**
```json
{
  "ok": true,
  "route_id": 42,
  "status": "pending_origin_approval",
  "message": "File request created and sent to origin ComL for review"
}
```

#### `list` (POST)
Lists file requests with filtering.

**Parameters:**
- `filter`: all | outgoing | pending_origin | pending_target | incoming

**Response:**
```json
{
  "ok": true,
  "requests": [...]
}
```

#### `detail` (POST)
Gets full details of a specific request.

**Parameters:**
- `routeId`: Route ID

**Response:**
```json
{
  "ok": true,
  "request": {...},
  "approvals": [...],
  "files": [...]
}
```

#### `approve` (POST)
ComL approves a request at specified stage.

**Parameters:**
- `routeId`: Route ID
- `stage`: origin_review | target_review
- `notes`: Optional approval notes

**Response:**
```json
{
  "ok": true,
  "status": "pending_target_approval",
  "message": "Request approved"
}
```

#### `reject` (POST)
ComL rejects a request.

**Parameters:**
- `routeId`: Route ID
- `stage`: origin_review | target_review
- `reason`: Rejection reason

**Response:**
```json
{
  "ok": true,
  "status": "rejected",
  "message": "Request rejected"
}
```

#### `upload-response` (POST)
ComL uploads response file.

**Parameters:**
- `routeId`: Route ID
- `responseFile`: File upload
- `viewOnly`: Boolean
- `downloadAllowed`: Boolean
- `printAllowed`: Boolean

**Response:**
```json
{
  "ok": true,
  "file_id": 456,
  "message": "Response file uploaded"
}
```

#### `log-access` (POST)
Logs access to confidential file.

**Parameters:**
- `fileId`: File ID
- `routeId`: Route ID
- `action`: viewed | downloaded | printed | shared

**Response:**
```json
{
  "ok": true,
  "message": "Access logged"
}
```

## Frontend Implementation

### File: `/backend/pages/file_requests.php`
- PHP page controller that renders the file requests interface
- Sets up user context and passes data to frontend
- Handles authentication and authorization

### File: `/pages/file_requests.html`
- HTML template for file request UI (deprecated - use PHP page instead)
- Serves as reference for structure and styling

### File: `/assets/js/file-requests.js`
- Main JavaScript application
- Implements:
  - Request creation UI
  - List filtering and display
  - Detail view with actions
  - ComL approval/rejection workflow
  - File upload handling
  - Access logging for confidential files

## User Interface

### For Regular Users
1. **Create Request Tab** - Create new file request
   - Select target station
   - Enter subject and description
   - Mark as confidential (optional)
   - System automatically routes to ComL

2. **My Requests Tab** - View personal requests
   - Filter by status
   - See approval timeline
   - Download approved files

3. **Incoming Tab** - View responses
   - See files from other stations
   - Access restrictions displayed
   - Acknowledgment required for confidential files

### For ComL Users
1. **Pending Origin Review** - Requests needing approval
   - Review request details
   - Approve or reject with comments
   - Route to target ComL if approved

2. **Pending Target Review** - Forwarded requests
   - Review target station's response
   - Approve or reject
   - Move to file delivery phase

3. **Upload Response** - Send files back
   - Upload file
   - Set access restrictions
   - Forward to origin ComL

4. **All Requests** - Full workflow visibility
   - See complete history
   - Check approval timeline
   - Manage files

## Access Controls

### Position-Based Access
- Only **Position 1 (ComL)** users can:
  - Approve/reject requests
  - Upload response files
  - Set confidentiality restrictions
  - View confidential file access logs

- **All users** can:
  - Create file requests
  - View their own requests
  - Download approved files (if permissions allow)

### File-Level Restrictions
For confidential files, the system enforces:
- **View Only**: User cannot download the document
- **No Download**: File cannot be extracted from system
- **No Print**: File cannot be printed to physical medium

### Audit Logging
- All access to confidential files is logged with:
  - User ID
  - Action taken (viewed/downloaded/printed/shared)
  - IP address
  - Timestamp
  - User agent string

## Workflow Examples

### Example 1: Normal Request Approval
```
1. Officer creates request: "Need fire truck maintenance records from Station 2"
2. Origin ComL (Station 1) receives request, approves
3. System sends to Station 2's ComL
4. Station 2's ComL approves, uploads maintenance records PDF
5. Station 1's ComL receives file, validates, forwards to officer
6. Officer downloads the records
```

### Example 2: Rejection with Explanation
```
1. Officer requests "Incident response plans from Station 3"
2. Station 1 ComL reviews, sees it's restricted, rejects with note: "Restricted - contact station chief"
3. Officer sees rejection with explanation
4. Officer contacts Station 3 chief directly
```

### Example 3: Confidential File with Restrictions
```
1. Officer marks request as "Highly Confidential": "Need personnel medical records"
2. Station 1 ComL reviews, tags as confidential, approves to Station 2
3. Station 2 ComL reviews, confirms confidential level, prepares file with view-only + no-print
4. Station 1 ComL applies restrictions, forwards to officer
5. Officer must click acknowledgment before opening
6. System logs every view of the document
```

## Security Considerations

### ComL-Only Authority
- Only ComL users can authorize inter-station communication
- Non-ComL users cannot directly contact other stations
- All requests are mediated and tracked

### File Storage
- Files stored with UUID-based names (not original names)
- Separate directory: `/uploads/file_requests/`
- Original filenames preserved in database for user display

### Access Logging
- All confidential file access logged immutably
- Includes timestamp, user, IP address, action taken
- Cannot be modified or deleted (audit trail)

### Transmission
- Files transmitted through authenticated sessions only
- HTTP-only and secure cookie flags recommended
- Session validation on each request

## Implementation Notes

### Database Initialization
The schema is auto-created via `ensure_file_request_schema()` in the controller. The SQL file `/data/file_request_schema.sql` contains all table definitions.

### File Upload Directory
Create `/uploads/file_requests/` directory with appropriate permissions:
```bash
mkdir -p /path/to/uploads/file_requests
chmod 755 /path/to/uploads/file_requests
```

### ComL Status Detection
User's ComL status is determined by:
- User has `position_id` in users table
- Position has `position_code = 'position1'`
- User status is 'active'

### Integration with Existing Mail System
The file request system:
- Operates independently from station_mails system
- Uses same authentication (`firenet_require_login()`)
- Uses same database connection (`firenet_get_pdo()`)
- Can be extended to integrate with mail threads if needed

## Testing Checklist

- [ ] Create normal file request as regular user
- [ ] ComL approves request, routes to target
- [ ] Target ComL receives and approves
- [ ] ComL uploads response file
- [ ] Original user receives file
- [ ] Create confidential request
- [ ] Mark with confidentiality level
- [ ] Verify access restrictions applied
- [ ] Test rejection at origin stage
- [ ] Test rejection at target stage
- [ ] Verify access logs recorded
- [ ] Test with different file types
- [ ] Verify ComL-only actions are blocked for non-ComL users
- [ ] Test all filter tabs
- [ ] Verify UI updates in real-time
- [ ] Test file download restrictions
- [ ] Test approval timeline display
- [ ] Verify rejection reasons transmitted

## Future Enhancements

1. **Email Notifications** - Email ComL when requests arrive
2. **Request Modifications** - Allow back-and-forth refinement
3. **Bulk Uploads** - Multiple file response uploads
4. **Expiration Dates** - Auto-expire old requests
5. **Workflow Templates** - Pre-configured request types
6. **Integration with Mail** - Link to station_mail threads
7. **Digital Signatures** - Sign documents in workflow
8. **Encryption** - Encrypt highly confidential files at rest
9. **Retention Policies** - Auto-archive after period
10. **Analytics** - Request volume and approval metrics

## Support & Troubleshooting

### Issue: "Only ComL users can approve requests"
**Solution**: User is not Position 1. Verify in database:
```sql
SELECT u.username, p.position_code 
FROM users u 
LEFT JOIN positions p ON u.position_id = p.position_id 
WHERE u.station_id = ?;
```

### Issue: File not uploading
**Solution**: Check directory permissions on `/uploads/file_requests/` and ensure PHP can write to it.

### Issue: Requests not appearing
**Solution**: Check that:
1. Database tables created (check `file_request_routes` table exists)
2. User has active session
3. Station IDs are valid

### Issue: Files not downloading
**Solution**: Verify file permissions and that `file_path` column contains correct path.

