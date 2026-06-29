# TODO — Login ribbon + modern minimalist styling

- [ ] Add a top ribbon to `NEWFIRENET/pages/login.html` with items: login, news, announcements, civilian reporting, about
- [ ] Add modern ribbon styling + transitions to `NEWFIRENET/assets/css/login.css`
- [ ] Ensure active/disabled styling for "login" and hover transitions for other pills
- [ ] Quick manual verification: load login page and confirm ribbon layout on desktop + mobile

# TODO — Login left-side News Feed + Admin publishing

- [x] Backend JSON API implemented in `NEWFIRENET/backend/controllers/news.php`
  - [x] `action=list` (public)
  - [x] `action=create` (admin; multipart photo upload)
  - [x] Auto-create DB table if missing
- [x] Frontend login module markup added to `NEWFIRENET/pages/login.html`
  - [x] News module DOM containers (`loginNews*`)
  - [x] Script include for `../assets/js/login-news.js`
- [x] Slideshow/flash behavior implemented in `NEWFIRENET/assets/js/login-news.js`
  - [x] Fetch list
  - [x] Render items
  - [x] Rotate every 5 seconds
  - [x] Fallback behavior when empty/failure
- [x] Styling for news module appended to `NEWFIRENET/assets/css/login.css`
- [x] Admin News Manager UI added to `NEWFIRENET/pages/users.html`
  - [x] Modal + form template (photo, title, body, status)
- [x] Admin publishing wired in `NEWFIRENET/assets/js/users.js`
  - [x] Modal open/close/cancel
  - [x] Submit `multipart/form-data` to `backend/controllers/news.php?action=create`
  - [x] Success/error display
- [ ] Manual verification:
  - [ ] Login page shows rotating news module every ~5 seconds
  - [ ] Admin publishes a new item and it becomes visible on login feed (approved)
  - [ ] Draft items are hidden (if implemented server-side behavior applies)
