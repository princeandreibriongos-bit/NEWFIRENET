# Public Data Contract

This document defines which FireNet data can be exposed to the future citizen-facing website and which data must remain internal-only.

## Purpose

The public website should be a safe, real-time informational surface. It must never expose personal data, sensitive operational details, or data that could interfere with response operations.

## Allowed Public Data

These fields are safe to expose directly or after minor formatting.

### Station Directory

Safe fields:

- `stations.station_id`
- `stations.station_name`
- `stations.station_code`
- `stations.location`
- `stations.latitude`
- `stations.longitude`
- `stations.status` only if presented as coarse public availability, not internal readiness
- `station_aor_zones.zone_name`
- `station_aor_zones.center_latitude`
- `station_aor_zones.center_longitude`
- `station_aor_zones.radius_km`

Public use:

- station directory
- AOR map
- nearest station finder

### Hydrants

Safe fields:

- `fire_hydrants.hydrant_id`
- `fire_hydrants.hydrant_name`
- `fire_hydrants.barangay`
- `fire_hydrants.address`
- `fire_hydrants.latitude`
- `fire_hydrants.longitude`
- `fire_hydrants.status`
- `fire_hydrants.last_inspected_at`

Public use:

- hydrant map
- hydrant inspection transparency

### Public Incident Summary

Safe fields after masking or aggregation:

- count of active incidents
- count of incidents today
- count of resolved incidents today
- incident status grouped as:
  - `active`
  - `under_control`
  - `resolved`
- alarm level only if leadership approves it
- last updated timestamp
- barangay or zone name

Public use:

- citywide counters
- barangay heat indicators
- public incident map with reduced precision

### Public Trends

Safe aggregated outputs:

- incidents by day
- incidents by month
- incidents by barangay
- resolved trend
- hydrants inspected this month

Public use:

- public charts
- annual transparency pages

## Internal-Only Data

These fields must never be exposed on the citizen site.

### Personal Or Reporter Data

- `users.username`
- `users.email`
- `users.password`
- `incident_reports.caller_contact`
- any complainant name
- any attached file paths
- any internal mail/account data

### Internal Workflow Data

- `reports.created_by`
- `incident_reports.received_by_user_id`
- `incident_reports.updated_by_user_id`
- `incident_report_updates.recorded_by_user_id`
- `incident_report_change_logs.changed_by_user_id`
- operational notes
- rejection reasons
- internal message threads

### Sensitive Live Operations Data

- exact dispatch route polylines
- exact route ETA per responding station
- exact dispatch order
- exact assigned unit movement in real time
- internal station overload or downtime reasoning
- exact incident coordinates for residences or buildings

## Public Incident Location Rules

Do not expose exact incident coordinates from `incident_reports.latitude` and `incident_reports.longitude`.

Instead, expose one of these:

- barangay name
- approximate zone centroid
- rounded coordinates with strong precision reduction
- heatmap tiles rather than exact marker pins

Recommended rule:

- internal app uses precise coordinates
- public site uses barangay-level or generalized map positions only

## Public Status Rules

Map internal statuses to public-safe labels.

- `newly_reported` -> `Active`
- `under_control` -> `Under control`
- `fire_out` -> `Resolved`
- internal workflow states beyond these should stay private

## Public API Shape Recommendations

Every public endpoint should be filtered and read-only.

### Example: `/public/live-status`

Allowed:

- `activeIncidentCount`
- `resolvedTodayCount`
- `updatedAt`

### Example: `/public/incidents-map`

Allowed:

- `incidentIdPublic`
- `barangay`
- `statusLabel`
- `updatedAt`
- `approximateLat`
- `approximateLng`

Not allowed:

- reporter fields
- exact address
- exact unit assignment

### Example: `/public/stations`

Allowed:

- station name
- station code
- location
- contact number if officially published
- AOR center and radius

### Example: `/public/hydrants`

Allowed:

- hydrant name
- barangay
- approximate or exact coordinates if approved
- status
- last inspected date

## Release Rules

Before a field becomes public, verify:

1. it does not identify a person
2. it does not reveal internal operations in exploitable detail
3. it is understandable to citizens
4. it is updated from an approved source

## Recommended Implementation Rule

Do not connect the public site directly to raw internal tables.

Instead:

1. create filtered backend endpoints or view-model builders
2. map internal fields to public-safe DTOs
3. remove or generalize sensitive values before response output
