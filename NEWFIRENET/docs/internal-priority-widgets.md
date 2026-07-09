# Internal Priority Widgets

This document converts the approved analytics roadmap into the first three internal widgets FireNet should implement next.

## Goal

Add high-value widgets to the internal dashboard and analytics pages using data that already exists in:

- `backend/pages/dashboard.php`
- `backend/pages/analytics.php`
- `backend/controllers/reports.php`
- `data/newfirenet.sql`

## Priority 1: Response Performance

### Why this goes first

This is the most operationally useful metric because it answers whether the system is responding fast enough, not just how many incidents exist.

### Recommended UI

- Dashboard hero or KPI row:
  - `Avg dispatch time today`
  - `Avg close time today`
  - `Over-target incidents`
- Analytics page:
  - line chart for average dispatch and resolution time by day
  - top delayed incidents table

### Recommended formulas

- `dispatch_time_minutes`
  - from `reports.created_at` to first dispatch station assignment or first incident update indicating dispatch
- `resolution_time_minutes`
  - from `reports.created_at` or `incident_started_at` to `incident_finished_at`
- `breached_target`
  - compare computed times against a configured target, for example 5 or 10 minutes for dispatch acknowledgement

### Likely data sources

- `reports.created_at`
- `incident_reports.incident_started_at`
- `incident_reports.incident_finished_at`
- `incident_report_dispatch_stations.created_at`
- `incident_report_updates.created_at`

### Suggested output

- Today summary
- 7-day trend
- Delayed incident list with:
  - incident label
  - station
  - alarm level
  - current status
  - elapsed time

## Priority 2: Station Workload And Dispatch Load

### Why this goes second

The dashboard already shows station health and assignments, so the next best step is to show load distribution and identify overload or underuse across stations.

### Recommended UI

- Dashboard:
  - `Busiest station now`
  - `Stations with active assignments`
  - compact workload leaderboard
- Analytics:
  - bar chart of incidents handled per station
  - stacked chart for `responding`, `standby`, and `offline`

### Recommended metrics

- active assignments per station
- incidents handled today per station
- average incidents per station for current week
- stations with zero active coverage
- stations repeatedly selected as fallback instead of AOR

### Likely data sources

- `stations`
- `incident_report_dispatch_stations`
- `incident_reports`
- `station_aor_zones`

### Suggested output

- rank stations by current load
- show which stations are overloaded
- highlight stations frequently covering outside their AOR

## Priority 3: Hotspot And Coverage Summary

### Why this goes third

You already have a map with incidents, hydrants, AOR circles, and station markers. The next improvement is converting the map into decisions: where incidents cluster, where hydrants are weak, and where coverage is thin.

### Recommended UI

- Analytics map sidebar:
  - `Top hotspot barangays`
  - `Hydrants near hotspot zones`
  - `AOR with highest incident density`
- Optional dashboard briefing tile:
  - one sentence summary such as `Bel-Air has the highest active incident density this week.`

### Recommended metrics

- incident count by barangay
- incident count inside each station AOR
- active incidents within N meters of inactive hydrants
- incidents with no nearby hydrant
- uncovered areas with high activity

### Likely data sources

- `incident_reports.latitude`
- `incident_reports.longitude`
- `fire_hydrants`
- `station_aor_zones`
- geocoded station and incident coordinates already used in analytics

### Suggested output

- ranked hotspot table
- risk badges per barangay
- map overlays for coverage gaps

## Recommended Delivery Order

1. Add response-performance cards to `dashboard.php` and `dashboard.html`
2. Add station workload comparison widgets to `dashboard.php` and `analytics.php`
3. Add hotspot and coverage summary widgets to `analytics.php` and `analytics.html`

## Deferred But Valuable

After the first three widgets:

- hydrant inspection aging
- data quality warnings
- CSV export
- printable command briefing sheets
