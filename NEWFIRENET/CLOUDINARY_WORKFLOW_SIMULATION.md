# Operational Mail Workflow Simulation: MCFS → ASSS (Ayala)

## Station Setup
- **Requester Station**: MCFS (New Makati Central Fire Station) - Code: `MCFS`
- **Target Station**: ASSS (Ayala Satellite Sub Station) - Code: `ASSS`
- **Cloud Name**: `dq80tx04u`
- **Base Folder**: `firenet/orgmail`

---

## Scenario Overview

```
1. Admin of MCFS creates request
   ↓
2. ComL (Pos1) of MCFS approves request
   ↓
3. Request forwarded to ComL of ASSS (Ayala)
   ↓
4. ComL of ASSS receives request
   ↓
5. ComL of ASSS forwards to Admin of ASSS
   ↓
6. Admin of ASSS attaches file from ASSS Cloudinary folder
   ↓
7. File returned to ComL of ASSS
   ↓
8. ComL of ASSS returns file to ComL of MCFS
   ↓
9. ComL of MCFS releases file to Admin of MCFS (original requestor)
```

---

## Step-by-Step Workflow

### STEP 1: Admin of MCFS Creates Request
**Actor**: admin_mcfs (Non-Position1 - Regular Admin)
**Station**: MCFS
**Action**: Create operational mail request to ASSS

**Request Details**:
```json
{
  "action": "send",
  "subject": "Request for Fire Incident Report - May 18, 2026",
  "body": "We need the detailed incident report and response photos from the fire incident that occurred in the Ayala area on May 18, 2026.",
  "mailType": "request",
  "importance": "normal",
  "requestFiles": 1,
  "recipientStationIds": [5],  // ASSS (station_id = 5)
  "cloudinaryUrl": ""  // No file attached yet
}
```

**System Processing**:
- Creates thread in `station_mail_threads`
- Creates request message in `station_mail_messages` with `mailType = 'request'`
- Creates route entry in `station_mail_request_routes` with status `pending_origin_review`
- **Recipients**: ComL users of MCFS station (position_code = 'position1')

**Database State After Step 1**:
```
station_mail_request_routes:
  route_id: 1
  thread_id: 1
  request_mail_id: 1
  request_user_id: [admin_mcfs user_id]
  origin_station_id: 1 (MCFS)
  origin_station_code: "MCFS"
  target_station_id: 5 (ASSS)
  target_station_code: "ASSS"
  status: "pending_origin_review"
  
station_mail_recipients:
  - mail_id: 1, recipient_type: "user", recipient_user_id: [coml_mcfs user_id]
```

**UI Message to Admin**: "Your request has been sent to your station's Communications Officer for review."

---

### STEP 2: ComL of MCFS Reviews & Approves Request
**Actor**: coml_mcfs (Position1 - Communications Officer/ComL)
**Station**: MCFS
**Action**: Approve the request from admin_mcfs

**Inbox**: ComL sees the request in their operational mail inbox
- Subject: "Request for Fire Incident Report - May 18, 2026"
- From: admin_mcfs @ MCFS
- Status: "pending_origin_review"

**ComL Action**:
```json
{
  "action": "approve-request",
  "routeId": 1,
  "subject": "Request for Fire Incident Report - May 18, 2026",
  "body": "Forwarding to Ayala station for the requested incident report and photos.",
  "cloudinaryUrl": ""
}
```

**System Processing**:
- Creates forwarded message in `station_mail_messages`
- Updates route status to `approved`
- Creates recipients: ComL users of ASSS station
- **New Recipients**: ComL users of ASSS (position_code = 'position1')

**Database State After Step 2**:
```
station_mail_request_routes:
  status: "approved" → "forwarded_to_target"
  
station_mail_messages:
  - mail_id: 2
    thread_id: 1
    sender_user_id: [coml_mcfs user_id]
    sender_station_id: 1 (MCFS)
    parent_mail_id: 1
    subject: "Request for Fire Incident Report - May 18, 2026"
    mailType: "message"
    
station_mail_recipients:
  - mail_id: 2, recipient_type: "user", recipient_user_id: [coml_asss user_id]
```

**UI Message to ComL MCFS**: "Request approved and forwarded to Ayala Station (ASSS)."
**UI Message to ComL ASSS**: "New file request received from MCFS requesting incident report."

---

### STEP 3: ComL of ASSS Receives & Reviews Request
**Actor**: coml_asss (Position1 - Communications Officer/ComL)
**Station**: ASSS (Ayala)
**Action**: Review the forwarded request

**Inbox**: ComL of ASSS sees:
- Subject: "Request for Fire Incident Report - May 18, 2026"
- From: coml_mcfs @ MCFS
- Request Route: Pending target review

**ComL reads the request thread showing**:
1. Original request from admin_mcfs @ MCFS
2. ComL_mcfs approved it

**ComL Decision**: Forward to admin_asss (non-position1 admin of ASSS) to locate and prepare the file

---

### STEP 4: ComL of ASSS Forwards to Admin of ASSS
**Actor**: coml_asss (Position1)
**Station**: ASSS
**Action**: Route request to their station's admin

```json
{
  "action": "reply",
  "threadId": 1,
  "parentMailId": 2,
  "subject": "Re: Request for Fire Incident Report - May 18, 2026",
  "body": "Please prepare the incident report and photos from the May 18 incident. File needs to be sent to MCFS. Please attach the file from our station's Cloudinary folder.",
  "recipientUserIds": [[admin_asss user_id]],  // Forward to specific admin
  "cloudinaryUrl": ""
}
```

**System Processing**:
- Creates reply message in thread
- Creates recipient entry for admin_asss user
- ComL can now see the request routing information

**Database State After Step 4**:
```
station_mail_messages:
  - mail_id: 3
    thread_id: 1
    sender_user_id: [coml_asss user_id]
    sender_station_id: 5 (ASSS)
    parent_mail_id: 2
    mailType: "message"
    
station_mail_recipients:
  - mail_id: 3, recipient_type: "user", recipient_user_id: [admin_asss user_id]
```

**UI Message to ComL ASSS**: "Message sent to admin for file preparation."
**UI Message to Admin ASSS**: "ComL has assigned you to prepare the requested file."

---

### STEP 5: Admin of ASSS Prepares & Attaches File
**Actor**: admin_asss (Non-Position1 Admin)
**Station**: ASSS (Ayala)
**Action**: Attach file from ASSS Cloudinary folder

**Available File in Cloudinary**:
```
URL: https://res.cloudinary.com/dq80tx04u/image/upload/v1715804400/firenet/orgmail/ASSS/fire-incident-report-may18.jpg
Path Components:
  - Cloud: dq80tx04u
  - Base: firenet/orgmail
  - Station: ASSS ✓ (matches admin's station code)
  - File: fire-incident-report-may18.jpg
```

**Admin Action**:
```json
{
  "action": "reply",
  "threadId": 1,
  "parentMailId": 3,
  "subject": "Re: Request for Fire Incident Report - May 18, 2026",
  "body": "Attached is the complete incident report and response photos from May 18. Please confirm receipt.",
  "recipientStationIds": [],  // Will be automatically routed based on route
  "cloudinaryUrl": "https://res.cloudinary.com/dq80tx04u/image/upload/v1715804400/firenet/orgmail/ASSS/fire-incident-report-may18.jpg"
}
```

**System Validation**:
1. ✓ URL is HTTPS
2. ✓ URL is from correct Cloudinary cloud (dq80tx04u)
3. ✓ URL contains station code (`/ASSS/`)
4. ✓ Station code matches admin's station (ASSS)

**Result**: URL passes validation! Attachment created.

**Database State After Step 5**:
```
station_mail_messages:
  - mail_id: 4
    thread_id: 1
    sender_user_id: [admin_asss user_id]
    sender_station_id: 5 (ASSS)
    parent_mail_id: 3
    mailType: "message"
    request_files: 1
    
station_mail_attachments:
  - attachment_id: 1
    mail_id: 4
    original_file_name: "fire-incident-report-may18.jpg"
    stored_file_name: "cloudinary_[uuid]"
    file_path: "https://res.cloudinary.com/dq80tx04u/image/upload/v1715804400/firenet/orgmail/ASSS/fire-incident-report-may18.jpg"
    mime_type: "image/jpeg"
    file_size_bytes: 0  // Cloudinary file
    
station_mail_recipients:
  - mail_id: 4, recipient_type: "user", recipient_user_id: [coml_asss user_id]
```

**UI Message to Admin ASSS**: "File attached and sent to your Communications Officer for final routing."

---

### STEP 6: ComL of ASSS Reviews & Returns File
**Actor**: coml_asss (Position1)
**Station**: ASSS
**Action**: Route file back to MCFS

**ComL sees**:
- Thread with original request
- Admin has attached the file
- Can see file is from their station folder (/ASSS/)

**ComL Action** (Return to Origin):
```json
{
  "action": "return-to-origin",
  "routeId": 1,
  "note": "File request has been completed. Incident report with photos attached.",
  "cloudinaryUrl": "https://res.cloudinary.com/dq80tx04u/image/upload/v1715804400/firenet/orgmail/ASSS/fire-incident-report-may18.jpg"
}
```

**System Validation**:
1. URL contains ASSS code ✓ (Target station code matches)
2. Can also accept MCFS code (would be for origin station) ✓
3. File URL from either origin or target station is acceptable

**Database State After Step 6**:
```
station_mail_request_routes:
  status: "file_returned_to_coml"
  
station_mail_messages:
  - mail_id: 5
    thread_id: 1
    sender_user_id: [coml_asss user_id]
    sender_station_id: 5 (ASSS)
    subject: "Re: Request for Fire Incident Report - May 18, 2026"
    body: "File request has been completed. Incident report with photos attached."
    
station_mail_recipients:
  - mail_id: 5, recipient_type: "user", recipient_user_id: [coml_mcfs user_id]
```

**UI Message to ComL ASSS**: "File returned to MCFS Communications Officer."
**UI Message to ComL MCFS**: "File request completed! File received from ASSS with incident report."

---

### STEP 7: ComL of MCFS Reviews & Releases to Requestor
**Actor**: coml_mcfs (Position1)
**Station**: MCFS
**Action**: Release file to original requestor (admin_mcfs)

**ComL sees**:
- Original request from admin_mcfs
- File now available from ASSS
- Can release to the requesting user

**ComL Action** (Release to Requestor):
```json
{
  "action": "release-to-requestor",
  "routeId": 1,
  "releasedAccessMode": "full",
  "note": "Request completed. You may now download the incident report from Ayala station.",
  "cloudinaryUrl": "https://res.cloudinary.com/dq80tx04u/image/upload/v1715804400/firenet/orgmail/ASSS/fire-incident-report-may18.jpg"
}
```

**System Validation**:
1. URL contains either MCFS or ASSS code ✓
2. In this case, it's ASSS (target station) ✓
3. Both are acceptable for release

**Database State After Step 7**:
```
station_mail_request_routes:
  status: "completed"
  released_access_mode: "full"
  
station_mail_messages:
  - mail_id: 6
    thread_id: 1
    sender_user_id: [coml_mcfs user_id]
    sender_station_id: 1 (MCFS)
    subject: "Re: Request for Fire Incident Report - May 18, 2026"
    body: "Request completed. You may now download the incident report from Ayala station."
    
station_mail_recipients:
  - mail_id: 6, recipient_type: "user", recipient_user_id: [admin_mcfs user_id]
```

**UI Message to ComL MCFS**: "File released to requestor."
**UI Message to Admin MCFS**: "Your requested file is now ready for download! ✓ File: fire-incident-report-may18.jpg"

---

### STEP 8: Admin of MCFS Downloads File
**Actor**: admin_mcfs (Non-Position1)
**Station**: MCFS
**Action**: Download the file

**Admin clicks download**:
```
GET /firenet/NEWFIRENET/backend/controllers/station_mails.php?action=download&attachmentId=1
```

**System Processing**:
1. Validates user has access to attachment
2. Checks route status (completed - access granted)
3. Redirects to Cloudinary URL:
   ```
   https://res.cloudinary.com/dq80tx04u/image/upload/v1715804400/firenet/orgmail/ASSS/fire-incident-report-may18.jpg
   ```
4. Logs download in operational audit

**Admin receives**: ✓ fire-incident-report-may18.jpg

---

## Complete Message Thread Timeline

```
THREAD ID: 1
SUBJECT: "Request for Fire Incident Report - May 18, 2026"

Timeline:
├─ Message 1 [REQUEST] (2026-05-18 10:00)
│  From: admin_mcfs @ MCFS
│  To: coml_mcfs @ MCFS
│  Body: "We need the detailed incident report and response photos..."
│  Status: pending_origin_review
│
├─ Message 2 [FORWARD] (2026-05-18 10:15)
│  From: coml_mcfs @ MCFS
│  To: coml_asss @ ASSS
│  Body: "Forwarding to Ayala station for the requested incident report..."
│  Status: approved → forwarded_to_target
│
├─ Message 3 [ROUTE] (2026-05-18 10:30)
│  From: coml_asss @ ASSS
│  To: admin_asss @ ASSS
│  Body: "Please prepare the incident report and photos from the May 18 incident..."
│
├─ Message 4 [ATTACHMENT] (2026-05-18 11:00)
│  From: admin_asss @ ASSS
│  To: coml_asss @ ASSS
│  Body: "Attached is the complete incident report and response photos..."
│  Attachments: fire-incident-report-may18.jpg (FROM /ASSS/ FOLDER)
│
├─ Message 5 [RETURN] (2026-05-18 11:15)
│  From: coml_asss @ ASSS
│  To: coml_mcfs @ MCFS
│  Body: "File request has been completed. Incident report with photos attached."
│  Status: file_returned_to_coml
│
├─ Message 6 [RELEASE] (2026-05-18 11:30)
│  From: coml_mcfs @ MCFS
│  To: admin_mcfs @ MCFS
│  Body: "Request completed. You may now download the incident report..."
│  Status: completed
│  released_access_mode: full
│
└─ [FILE DOWNLOADED] (2026-05-18 11:45)
   By: admin_mcfs @ MCFS
   File: fire-incident-report-may18.jpg
   URL: https://res.cloudinary.com/dq80tx04u/image/upload/v1715804400/firenet/orgmail/ASSS/fire-incident-report-may18.jpg
```

---

## Folder Structure Validation

Throughout this workflow, the system validates folder paths:

```
MCFS Station:
  Cloudinary Folder: firenet/orgmail/MCFS
  URL Pattern Required for MCFS: /firenet/orgmail/MCFS/
  
ASSS Station:
  Cloudinary Folder: firenet/orgmail/ASSS
  URL Pattern Required for ASSS: /firenet/orgmail/ASSS/
  
File Used:
  URL: https://res.cloudinary.com/dq80tx04u/image/upload/v1715804400/firenet/orgmail/ASSS/fire-incident-report-may18.jpg
  ✓ Contains /ASSS/ - Valid for ASSS station
  ✓ File attached by admin_asss - Station code matches requester station
  ✓ File accepted by coml_asss - Same station folder
  ✓ File accepted by coml_mcfs - Either origin or target station folder acceptable
```

---

## Key Implementation Features Verified

### ✓ 1. Station Code-Based Folders
- Folders created per station code (MCFS, ASSS, LPS, PSS, PDPSS)
- No longer using station_id format

### ✓ 2. URL Validation with Station Codes
```php
// Old: /station_1/ format
// New: /ASSS/ format
```

### ✓ 3. Multi-Station Routing
- Request goes: Admin → Station ComL → Target ComL → Target Admin → Target ComL → Origin ComL → Original Admin
- File follows the route back

### ✓ 4. File Attachment Points
- Only ComL and terminal admins can attach files
- Files must be in their station's Cloudinary folder
- System validates folder path matches station code

### ✓ 5. Approval Chain
- 3 levels of approval/review: Origin ComL → Target ComL → Target Admin
- Status tracking: pending → approved → forwarded → returned → completed

---

## Testing Checklist

- [ ] Admin of MCFS can create request to ASSS
- [ ] ComL of MCFS sees request in inbox, can approve
- [ ] Request shows status "pending_origin_review"
- [ ] After approval, status becomes "forwarded_to_target"
- [ ] ComL of ASSS receives forwarded request
- [ ] ComL of ASSS can forward to admin of ASSS
- [ ] Admin of ASSS can paste ASSS Cloudinary URL: `https://res.cloudinary.com/dq80tx04u/image/upload/.../firenet/orgmail/ASSS/...`
- [ ] URL validation passes (contains /ASSS/)
- [ ] ComL of ASSS can return file to MCFS
- [ ] ComL of MCFS can release file to original requestor
- [ ] Status becomes "completed"
- [ ] Admin of MCFS can download the file
- [ ] File links back to Cloudinary folder correctly
