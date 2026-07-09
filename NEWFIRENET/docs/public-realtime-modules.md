# Public Realtime Modules

This document defines the first citizen-facing modules for the separate FireNet public website.

## Goal

Build a read-only public website that shows safe, real-time city information derived from FireNet without exposing internal workflows or personal data.

## Recommended First Release

Launch the public site with five modules:

1. Live status
2. Advisory feed
3. Incident map
4. Station directory
5. Hydrant map

These modules can be built using data already present in the internal system.

## Module 1: Live Status

### Purpose

Provide a quick, trustworthy snapshot of current fire activity and system updates.

### Public content

- active incidents count
- resolved incidents today
- currently updated timestamp
- optional status breakdown:
  - active
  - under control
  - resolved

### Data sources

- `reports`
- `incident_reports`
- `incident_report_stage`

### Recommended UI

- top hero counters
- last refresh timestamp
- badge like `Realtime city update`

## Module 2: Advisory Feed

### Purpose

Show official public announcements and urgent notices.

### Existing system fit

FireNet already has a `news_feed` workflow in `backend/controllers/news.php`, including:

- `is_announcement`
- `announcement_type`
- `audience`
- `expires_at`

This should be reused as the source for public advisories.

### Public content

- title
- short body
- image if approved
- advisory type
- created at
- expires at

### Filtering rules

Only publish items that are:

- approved
- marked as announcement
- intended for public audience
- not expired

### Recommended UI

- alert banner for urgent items
- advisory cards for standard announcements
- category filters such as:
  - incident notice
  - weather-related warning
  - road advisory
  - public information

## Module 3: Incident Map

### Purpose

Show where activity is happening in a public-safe way.

### Public content

- barangay-level or generalized incident markers
- status badge
- updated timestamp
- optional alarm level if approved

### Privacy and safety rule

Never show raw incident coordinates from the internal system.

Use:

- barangay centroid
- generalized location bucket
- rounded coordinates
- area heat layer instead of exact pins

### Recommended UI

- toggle between:
  - map view
  - barangay list view
- filters:
  - active
  - under control
  - resolved
- summary chips:
  - most active barangay
  - total active incidents

## Module 4: Station Directory

### Purpose

Help citizens know which stations serve which areas and how to contact them.

### Public content

- station name
- station code
- published hotline or contact number
- location
- AOR name and radius
- AOR map visualization

### Existing system fit

Data already exists for:

- stations
- station geolocation
- AOR zones

### Recommended UI

- directory cards
- map with station markers and AOR circles
- nearest station lookup by barangay or map tap

## Module 5: Hydrant Map

### Purpose

Provide transparency and awareness around hydrant coverage.

### Public content

- hydrant name
- barangay
- status
- last inspected date
- map location if approved

### Existing system fit

The analytics layer already uses:

- local hydrants from `fire_hydrants`
- public hydrants from cached OpenStreetMap data

### Recommended UI

- map markers
- status filters:
  - active
  - inactive
  - maintenance
- optional table for inspection history

## Suggested Public Navigation

- Home
- Live status
- Incident map
- Stations
- Hydrants
- Advisories
- Safety tips

## Recommended Public Homepage Layout

1. Hero with live counters
2. Urgent advisory banner
3. Public incident map preview
4. Station directory preview
5. Hydrant coverage preview
6. Safety tips and emergency hotline block

## Realtime Update Strategy

Recommended refresh model:

- hero counters: every 30 to 60 seconds
- advisory feed: every 1 to 5 minutes
- incident map: every 30 to 60 seconds
- station directory: cached, refresh less often
- hydrant map: cached, refresh less often unless hydrant status changes

## Recommended Backend Shape

Create public-safe endpoints rather than exposing internal pages.

Suggested endpoints:

- `/backend/public/live_status.php`
- `/backend/public/advisories.php`
- `/backend/public/incidents_map.php`
- `/backend/public/stations.php`
- `/backend/public/hydrants.php`

Each endpoint should:

- be read-only
- return only approved fields
- transform internal records into public-safe responses

## Suggested Delivery Order

### Phase 1

- live status
- advisory feed
- station directory

### Phase 2

- public incident map
- hydrant map

### Phase 3

- historical insights
- nearest station finder
- safety content expansion

## Notes For Implementation

- Reuse existing internal news approval flow for advisories instead of creating a second CMS
- Keep the public site visually simpler than the internal command center
- Prefer aggregate and generalized incident views over detailed operational views
