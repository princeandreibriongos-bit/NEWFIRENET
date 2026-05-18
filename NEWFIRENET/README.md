# FireNet Web Portal (Student Version)

Simple web portal structure for a fire station system that connects substations to the main branch.

## Suggested Folder Structure

- `index.php` - main landing page
- `assets/` - static files (CSS, JS, images)
- `includes/` - reusable PHP parts (header, footer, db)
- `pages/` - portal pages
- `config/` - app configuration
- `api/` - simple backend endpoints
- `data/` - local JSON/sample data
- `uploads/` - uploaded files
- `logs/` - app logs

This structure is intentionally simple and beginner-friendly.

## Database Setup

The database schema and seed data are in:

- `data/newfirenet.sql`

### Option 1: phpMyAdmin (XAMPP)

1. Open phpMyAdmin.
2. Go to `Import`.
3. Select `data/newfirenet.sql`.
4. Click `Go`.

### Option 2: MySQL CLI

```sql
SOURCE data/newfirenet.sql;
```

The script creates and uses database `firenet_db` automatically.

## Progress Update

What has been completed so far:

- Built the station mail system with inbox, sent, drafts, archive, replies, attachments, and thread handling.
- Added the mail database tables and related SQL structure.
- Added the admin user management page, backend controller, and station-scoped account filtering.
- Updated login handling so it supports both legacy plain-text passwords and hashed passwords.
- Modernized the UI for the users page so it matches the rest of the portal.
- Standardized button styling across the system so buttons now follow the same Calendar-style visual language.

Current status:

- Mail, settings, calendar, reports, dashboard, analytics, and user management pages now share a more uniform look and feel.
- Account management is restricted by station context on the backend.
- The system-wide button styles now use one consistent design pattern.

## Password Change Gmail Confirmation (PHPMailer)

When users change password from settings, FireNet now sends a confirmation email to their account Gmail.

### 1. Install PHPMailer

This project now includes `composer.json` with PHPMailer dependency.

Run in project root:

```bash
composer install
```

### 2. Configure Gmail SMTP

Edit `config/config.php` and set valid values under `mail`:

- `smtp_host` -> `smtp.gmail.com`
- `smtp_port` -> `587`
- `smtp_username` -> your Gmail address
- `smtp_password` -> Gmail App Password (not your normal Gmail password)
- `smtp_encryption` -> `tls`
- `from_email` -> sender Gmail address
- `from_name` -> sender display name

### 3. Gmail security requirement

Use a Gmail App Password:

1. Enable 2-Step Verification on the Gmail account.
2. Generate an App Password in Google Account security settings.
3. Use that App Password in `smtp_password`.
