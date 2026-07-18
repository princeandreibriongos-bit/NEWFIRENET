<?php
$usersActiveTab = $initialUsersTab ?? 'accounts';
$usersIsSuperadmin = ($role ?? '') === 'superadmin';
?>
<section class="users-shell">
  <header class="users-hero">
    <div>
      <p class="users-kicker">Administrator tools</p>
      <h2 id="usersHeroTitle"><?php
        if ($usersActiveTab === 'substations') {
          echo 'Substations';
        } elseif ($usersActiveTab === 'alerts') {
          echo 'Public Alerts';
        } elseif ($usersActiveTab === 'system') {
          echo 'System Settings';
        } else {
          echo 'Admin Settings';
        }
      ?></h2>
      <p class="muted-text" id="usersWelcomeText"><?php
        if ($usersActiveTab === 'substations') {
          echo 'Create, edit, and review all substations and assigned coordinates across the district.';
        } elseif ($usersActiveTab === 'alerts') {
          echo 'Broadcast Gmail and SMS alerts to civilians who subscribed on the public portal.';
        } elseif ($usersActiveTab === 'system') {
          echo 'District identity, integrations, public portal, and security defaults in one place.';
        } elseif ($usersIsSuperadmin) {
          echo 'Manage substations, assigned admins, personnel accounts, login updates, and public notices across all stations.';
        } else {
          echo 'Manage users, publishing tools, and station activity for ' . htmlspecialchars((string) ($stationName ?? 'your station'), ENT_QUOTES, 'UTF-8') . '.';
        }
      ?></p>
    </div>
    <div class="users-hero-actions">
      <button type="button" class="primary-btn" id="openUserModalBtn"<?php echo in_array($usersActiveTab, ['substations', 'alerts', 'news', 'notices', 'system'], true) ? ' hidden' : ''; ?>>Create User</button>
      <button type="button" class="primary-btn" id="openSubstationModalBtn"<?php echo ($usersActiveTab === 'substations' && $usersIsSuperadmin) ? '' : ' hidden'; ?>>Add Substation</button>
      <button type="button" class="secondary-btn" id="refreshUsersBtn">Refresh</button>
    </div>
  </header>

  <section class="users-news-manager" id="newsManagerSection" data-users-panel="news"<?php echo $usersActiveTab !== 'news' ? ' hidden' : ''; ?>>
    <header class="users-hero users-news-hero">
      <div>
        <p class="users-kicker">News desk</p>
        <h2>Login News Feed</h2>
          <p class="muted-text">Publish login-screen updates, response highlights, or official flash notices shown on sign-in.</p>
      </div>
      <div class="users-hero-actions">
        <button type="button" class="primary-btn" id="openNewsModalBtn">Publish News</button>
      </div>
    </header>
  </section>

  <section class="users-news-manager" id="announcementsManagerSection" data-users-panel="notices"<?php echo $usersActiveTab !== 'notices' ? ' hidden' : ''; ?>>
    <header class="users-hero users-news-hero">
      <div>
        <p class="users-kicker">Announcements desk</p>
        <h2>Public Notices</h2>
          <p class="muted-text">Publish district or station advisories for the public-facing announcement area on the login screen.</p>
      </div>
      <div class="users-hero-actions">
        <button type="button" class="primary-btn" id="openAnnouncementModalBtn">Publish Announcement</button>
      </div>
    </header>
  </section>

  <section class="users-alerts-manager" id="civilianAlertsSection" data-users-panel="alerts"<?php echo $usersActiveTab !== 'alerts' ? ' hidden' : ''; ?>>
    <header class="users-hero users-news-hero">
      <div>
        <p class="users-kicker">Civilian portal</p>
        <h2>Public Alerts Broadcast</h2>
        <p class="muted-text">Send weather, typhoon, and district alerts to civilians who opted in by Gmail/email and SMS.</p>
      </div>
      <div class="users-hero-actions">
        <button type="button" class="secondary-btn" id="refreshCivilianAlertsBtn">Refresh stats</button>
      </div>
    </header>

    <div class="users-alerts-grid">
      <article class="users-table-card users-alerts-stats-card">
        <div class="users-panel-head">
          <div>
            <p class="users-kicker">Reach</p>
            <h3>Active subscribers</h3>
          </div>
          <div class="users-panel-meta">
            <span class="users-meta-chip" id="civilianAlertsMailReadyChip">Email —</span>
            <span class="users-meta-chip" id="civilianAlertsSmsReadyChip">SMS —</span>
          </div>
        </div>
        <div class="users-alerts-stat-strip" aria-label="Subscriber counts">
          <div class="users-alerts-stat"><span>Total</span><strong id="civilianAlertsTotal">0</strong></div>
          <div class="users-alerts-stat"><span>Email</span><strong id="civilianAlertsEmail">0</strong></div>
          <div class="users-alerts-stat"><span>SMS</span><strong id="civilianAlertsSms">0</strong></div>
          <div class="users-alerts-stat"><span>Weather</span><strong id="civilianAlertsTopicWeather">0</strong></div>
          <div class="users-alerts-stat"><span>Notices</span><strong id="civilianAlertsTopicAnnouncements">0</strong></div>
          <div class="users-alerts-stat"><span>Safety</span><strong id="civilianAlertsTopicSafety">0</strong></div>
        </div>
        <p class="muted-text users-alerts-hint">
          Email uses Gmail SMTP from <code>config/config.php</code>.
          SMS is enabled in <code>log</code> mode by default (stored locally). Set <code>provider=semaphore</code> + API key for live PH SMS.
        </p>
      </article>

      <article class="users-table-card">
        <div class="users-panel-head">
          <div>
            <p class="users-kicker">Compose</p>
            <h3>Send alert</h3>
          </div>
          <div class="users-panel-meta">
            <button type="button" class="secondary-btn" id="civilianAlertTestEmailBtn">Test Gmail</button>
            <button type="button" class="secondary-btn" id="civilianAlertAutoWeatherBtn">Scan weather &amp; auto-send</button>
          </div>
        </div>

        <div class="users-alert-templates" id="civilianAlertTemplates" aria-label="Alert templates">
          <p class="users-kicker users-alert-templates-label">Auto templates</p>
          <div class="users-alert-template-grid" id="civilianAlertTemplateGrid">
            <button type="button" class="users-alert-template-btn" data-alert-template="typhoon">
              <i class="bi bi-tropical-storm" aria-hidden="true"></i>
              <span>Typhoon / storm</span>
            </button>
            <button type="button" class="users-alert-template-btn" data-alert-template="flashflood">
              <i class="bi bi-cloud-rain-heavy" aria-hidden="true"></i>
              <span>Flash flood</span>
            </button>
            <button type="button" class="users-alert-template-btn" data-alert-template="heat">
              <i class="bi bi-thermometer-sun" aria-hidden="true"></i>
              <span>Extreme heat</span>
            </button>
            <button type="button" class="users-alert-template-btn" data-alert-template="cold">
              <i class="bi bi-snow" aria-hidden="true"></i>
              <span>Cold / chill</span>
            </button>
            <button type="button" class="users-alert-template-btn" data-alert-template="tsunami">
              <i class="bi bi-water" aria-hidden="true"></i>
              <span>Tsunami warning</span>
            </button>
          </div>
          <p class="muted-text users-alerts-hint">Click a template to fill the message, then send. Auto-scan uses live Makati weather (heat / cold / flood / typhoon).</p>
        </div>

        <form id="civilianAlertBroadcastForm" class="users-form users-alerts-form" novalidate>
          <input type="hidden" id="civilianAlertTemplateId" value="">
          <div class="users-form-grid">
            <label class="users-full-width">
              Subject
              <input type="text" id="civilianAlertSubject" maxlength="160" placeholder="e.g. Signal No. 1 — Makati under typhoon watch" required>
            </label>
            <label class="users-full-width">
              Message
              <textarea id="civilianAlertBody" rows="6" maxlength="4000" placeholder="Write the advisory civilians will receive by email and/or SMS." required></textarea>
            </label>
            <label>
              Topic audience
              <select id="civilianAlertTopic">
                <option value="weather" selected>Weather / typhoon</option>
                <option value="announcements">Announcements</option>
                <option value="safety">Safety</option>
                <option value="all">All topics</option>
              </select>
            </label>
            <label>
              Barangay filter <span class="users-field-hint">(optional)</span>
              <input type="text" id="civilianAlertBarangay" maxlength="120" placeholder="Leave blank for all barangays">
            </label>
            <div class="users-full-width users-alerts-channels" role="group" aria-label="Delivery channels">
              <label class="users-channel-toggle">
                <input type="checkbox" id="civilianAlertSendEmail" checked>
                <span class="users-channel-toggle-ui">
                  <strong>Send email (Gmail)</strong>
                  <small>Uses opted-in email subscribers</small>
                </span>
              </label>
              <label class="users-channel-toggle">
                <input type="checkbox" id="civilianAlertSendSms" checked>
                <span class="users-channel-toggle-ui">
                  <strong>Send SMS</strong>
                  <small>Uses opted-in mobile numbers</small>
                </span>
              </label>
            </div>
          </div>
          <div class="users-form-actions">
            <button type="submit" class="primary-btn" id="civilianAlertSendBtn">Send alert</button>
          </div>
          <p class="muted-text" id="civilianAlertFormMessage"></p>
        </form>
      </article>
    </div>

    <section class="users-table-card users-alerts-history-card">
      <div class="users-panel-head">
        <div>
          <p class="users-kicker">History</p>
          <h3>Recent broadcasts</h3>
        </div>
      </div>
      <div class="users-table-wrap">
        <table class="portal-table users-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Subject</th>
              <th>Topic</th>
              <th>Email</th>
              <th>SMS</th>
              <th>Recipients</th>
            </tr>
          </thead>
          <tbody id="civilianAlertsHistoryBody">
            <tr><td colspan="6" class="muted-text users-empty-row">No broadcasts yet.</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>

  <section class="users-system-manager" id="systemSettingsSection" data-users-panel="system"<?php echo $usersActiveTab !== 'system' ? ' hidden' : ''; ?>>
    <header class="users-hero users-news-hero">
      <div>
        <p class="users-kicker">District control</p>
        <h2>System Settings</h2>
        <p class="muted-text">Configure district identity, integrations, public portal, and security defaults — modern and minimal.</p>
      </div>
      <div class="users-hero-actions">
        <button type="button" class="secondary-btn" id="refreshSystemSettingsBtn">Refresh</button>
        <button type="button" class="primary-btn" id="saveSystemSettingsBtn">Save changes</button>
      </div>
    </header>

    <div class="sys-status-strip" id="systemIntegrationsStrip" aria-label="Integration status">
      <article class="sys-status-card" data-status="mail"><span class="sys-status-label">Gmail</span><strong id="sysStatusMail">—</strong></article>
      <article class="sys-status-card" data-status="sms"><span class="sys-status-label">SMS</span><strong id="sysStatusSms">—</strong></article>
      <article class="sys-status-card" data-status="maps"><span class="sys-status-label">Maps</span><strong id="sysStatusMaps">—</strong></article>
      <article class="sys-status-card" data-status="auth"><span class="sys-status-label">Google Auth</span><strong id="sysStatusAuth">—</strong></article>
    </div>

    <form id="systemSettingsForm" class="sys-settings-layout" novalidate>
      <section class="users-table-card sys-settings-card">
        <div class="users-panel-head">
          <div>
            <p class="users-kicker">Identity</p>
            <h3>District profile</h3>
          </div>
        </div>
        <div class="users-form users-form-grid sys-form-pad">
          <label>
            App name
            <input type="text" id="sysAppName" maxlength="80" placeholder="FireNet">
          </label>
          <label>
            District name
            <input type="text" id="sysDistrictName" maxlength="80" placeholder="Makati Fire District">
          </label>
          <label class="users-full-width">
            Public tagline
            <input type="text" id="sysPublicTagline" maxlength="400" placeholder="Shown on the civilian portal">
          </label>
          <label>
            Emergency hotline
            <input type="text" id="sysEmergencyHotline" maxlength="20" placeholder="168">
          </label>
          <label>
            Central mobile
            <input type="text" id="sysCentralPhone" maxlength="20" placeholder="09311451493">
          </label>
          <label class="users-full-width">
            Email sender name
            <input type="text" id="sysMailFromName" maxlength="80" placeholder="FireNet Alerts">
          </label>
        </div>
      </section>

      <section class="users-table-card sys-settings-card">
        <div class="users-panel-head">
          <div>
            <p class="users-kicker">Messaging</p>
            <h3>SMS delivery</h3>
          </div>
        </div>
        <div class="users-form users-form-grid sys-form-pad">
          <label class="users-channel-toggle users-full-width">
            <input type="checkbox" id="sysSmsEnabled">
            <span class="users-channel-toggle-ui">
              <strong>Enable SMS alerts</strong>
              <small>Allow Public Alerts to use SMS channel</small>
            </span>
          </label>
          <label>
            SMS provider
            <select id="sysSmsProvider">
              <option value="log">Log (test mode — free)</option>
              <option value="semaphore">Semaphore (live PH SMS)</option>
            </select>
          </label>
          <label>
            Sender name
            <input type="text" id="sysSmsSenderName" maxlength="40" placeholder="FireNet">
          </label>
          <label class="users-full-width">
            Semaphore API key <span class="users-field-hint">(leave blank to keep current)</span>
            <input type="password" id="sysSmsApiKey" maxlength="120" placeholder="Paste API key for live SMS" autocomplete="off">
          </label>
          <p class="muted-text users-alerts-hint users-full-width" id="sysSmsKeyHint">No live API key stored yet. Use Log mode for free testing.</p>
        </div>
      </section>

      <section class="users-table-card sys-settings-card">
        <div class="users-panel-head">
          <div>
            <p class="users-kicker">Public portal</p>
            <h3>Civilian access</h3>
          </div>
        </div>
        <div class="users-form users-form-grid sys-form-pad">
          <label class="users-channel-toggle users-full-width">
            <input type="checkbox" id="sysPortalSubscribeEnabled">
            <span class="users-channel-toggle-ui">
              <strong>Allow alert subscriptions</strong>
              <small>Civilians can opt in for email / SMS alerts</small>
            </span>
          </label>
          <label class="users-channel-toggle users-full-width">
            <input type="checkbox" id="sysPortalMaintenanceEnabled">
            <span class="users-channel-toggle-ui">
              <strong>Maintenance banner</strong>
              <small>Show a notice across the public portal</small>
            </span>
          </label>
          <label class="users-full-width">
            Maintenance message
            <textarea id="sysPortalMaintenanceMessage" rows="3" maxlength="400" placeholder="Temporary maintenance notice for civilians"></textarea>
          </label>
        </div>
      </section>

      <section class="users-table-card sys-settings-card">
        <div class="users-panel-head">
          <div>
            <p class="users-kicker">Operations</p>
            <h3>Security &amp; alerts</h3>
          </div>
        </div>
        <div class="users-form users-form-grid sys-form-pad">
          <label>
            Default auto-logout (minutes)
            <input type="number" id="sysDefaultAutoLogout" min="5" max="240" step="5">
          </label>
          <label class="users-channel-toggle users-full-width">
            <input type="checkbox" id="sysSecurityAlertsDefault">
            <span class="users-channel-toggle-ui">
              <strong>Security alerts on by default</strong>
              <small>Applied when creating new personnel accounts</small>
            </span>
          </label>
          <label class="users-channel-toggle users-full-width">
            <input type="checkbox" id="sysAlertDefaultEmail">
            <span class="users-channel-toggle-ui">
              <strong>Default: send email on broadcasts</strong>
              <small>Pre-checks Email on Public Alerts</small>
            </span>
          </label>
          <label class="users-channel-toggle users-full-width">
            <input type="checkbox" id="sysAlertDefaultSms">
            <span class="users-channel-toggle-ui">
              <strong>Default: send SMS on broadcasts</strong>
              <small>Pre-checks SMS on Public Alerts</small>
            </span>
          </label>
          <label class="users-channel-toggle users-full-width">
            <input type="checkbox" id="sysWeatherAutoEnabled">
            <span class="users-channel-toggle-ui">
              <strong>Allow weather auto-send</strong>
              <small>Enables Scan weather &amp; auto-send on Public Alerts</small>
            </span>
          </label>
        </div>
      </section>
    </form>
    <p class="muted-text" id="systemSettingsMessage"></p>
  </section>

  <section class="users-layout" id="barangayPanel" data-users-panel="substations"<?php echo $usersActiveTab !== 'substations' ? ' hidden' : ''; ?>>
    <section class="users-table-card">
      <div class="users-panel-head">
        <div>
          <p class="users-kicker">Station directory</p>
          <h3>Substations</h3>
        </div>
        <div class="users-panel-meta">
          <span class="users-meta-chip">Total <strong id="substationTotalCount">0</strong></span>
        </div>
      </div>
      <div class="users-table-wrap">
        <table class="portal-table users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Location</th>
              <th>Coordinates</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="substationsTableBody">
            <tr><td colspan="6" class="muted-text users-empty-row">Loading substations...</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>

  <div id="barangayModal" class="users-modal" hidden>
    <div class="users-modal-backdrop" data-close-barangay-modal="true"></div>
    <div class="users-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="barangayModalTitle">
      <header class="users-modal-header">
        <div>
          <p class="users-kicker">Substation form</p>
          <h3 id="barangayModalTitle">Create Substation</h3>
        </div>
        <button type="button" class="modal-close-btn" id="closeBarangayModalBtn" aria-label="Close">x</button>
      </header>
      <form id="barangayForm" class="users-form" novalidate>
        <input type="hidden" id="barangayStationIdInput" value="">
        <div class="users-form-grid">
          <label>
            Substation Name
            <input type="text" id="barangayNameInput" maxlength="160" placeholder="e.g. Makati Central Substation" required>
          </label>
          <label>
            Station Code
            <input type="text" id="barangayCodeInput" maxlength="20" placeholder="e.g. MCFS">
          </label>
          <label class="users-full-width">
            Full address
            <small class="users-field-hint">Paste a complete address here (building, street, village, barangay). Multiple lines are OK.</small>
            <textarea id="barangayFullAddressInput" rows="4" maxlength="500" placeholder="Example:&#10;LKG Tower&#10;6801 Ayala Avenue&#10;Salcedo Village, Barangay Bel-Air&#10;Makati City"></textarea>
          </label>
          <div class="users-full-width users-locate-row">
            <button type="button" class="secondary-btn" id="locateBarangayBtn">Locate address</button>
          </div>
          <p class="users-field-divider users-full-width">Or fill in separately (optional if full address is provided)</p>
          <label>
            Barangay
            <input type="text" id="barangayBarangayInput" maxlength="120" placeholder="e.g. Bel-Air" autocomplete="off">
          </label>
          <label>
            Street / number
            <input type="text" id="barangayStreetInput" maxlength="255" placeholder="e.g. 6801 Ayala Avenue" autocomplete="off">
          </label>
          <label class="users-full-width">
            Building / village / landmark
            <input type="text" id="barangayLandmarkInput" maxlength="255" placeholder="e.g. LKG Tower or Salcedo Village" autocomplete="off">
          </label>
          <label>
            Latitude
            <input type="number" step="any" id="barangayLatitudeInput" placeholder="14.5547" required>
          </label>
          <label>
            Longitude
            <input type="number" step="any" id="barangayLongitudeInput" placeholder="121.0244" required>
          </label>
          <label>
            Status
            <select id="barangayStatusInput">
              <option value="active" selected>Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label>
            AOR Radius (km)
            <input type="number" step="0.1" min="0" id="barangayAorRadiusInput" placeholder="2.5">
          </label>
          <div class="users-full-width">
            <p class="muted-text">Paste a full address or fill in street and barangay separately, then click <strong>Locate address</strong> or wait for auto-locate. You can also click the map or enter coordinates manually.</p>
            <div id="barangayMap" class="users-map-panel" aria-label="Substation location map"></div>
            <p class="muted-text" id="barangayMapMeta">Click on the map to pin the new substation location.</p>
          </div>
          <label class="users-toggle-item users-full-width" id="barangayAdminToggleWrap">
            <span>
              <strong>Create admin for this substation</strong>
              <small id="barangayAdminHelpText">Turn on, then enter username, email, and password.</small>
            </span>
            <input type="checkbox" id="createBarangayAdminInput">
          </label>
          <div id="barangayAdminFields" class="users-form-grid users-full-width" hidden>
            <label>
              Admin Username
              <input type="text" id="barangayAdminUsernameInput" maxlength="50" placeholder="substation admin">
            </label>
            <label>
              Admin Email
              <input type="email" id="barangayAdminEmailInput" maxlength="100" placeholder="admin@station.local">
            </label>
            <label class="users-full-width">
              Admin Password
              <input type="password" id="barangayAdminPasswordInput" maxlength="255" placeholder="Required when enabled">
            </label>
          </div>
        </div>
        <div class="users-form-actions">
          <button type="submit" class="primary-btn" id="saveBarangayBtn">Create Substation</button>
          <button type="button" class="secondary-btn" id="cancelBarangayBtn">Cancel</button>
        </div>
        <p class="muted-text" id="barangayFormMessage"></p>
      </form>
    </div>
  </div>

  <div id="newsModal" class="users-modal" hidden>
    <div class="users-modal-backdrop" data-close-news-modal="true"></div>
    <div class="users-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="newsModalTitle">
      <header class="users-modal-header">
        <div>
          <p class="users-kicker">Publish update</p>
          <h3 id="newsModalTitle">Create News Item</h3>
        </div>
        <button type="button" class="modal-close-btn" id="closeNewsModalBtn" aria-label="Close">x</button>
      </header>

      <form id="newsForm" class="users-form" novalidate enctype="multipart/form-data">
        <div class="users-form-grid">
          <label>
            News Photo
            <input type="file" id="newsPhotoInput" name="photo" accept="image/*" required>
          </label>

          <label>
            Title
            <input type="text" id="newsTitleInput" name="title" maxlength="160" placeholder="e.g. Fire incident update - Station 1" required>
          </label>

          <label class="users-full-width">
            What happened
            <textarea id="newsBodyInput" name="body" maxlength="4000" rows="6" placeholder="Write the official update for the public/internal login news feed." required></textarea>
          </label>

          <label>
            Publish Status
            <select id="newsStatusSelect" name="status">
              <option value="approved" selected>Approved (visible)</option>
              <option value="draft">Draft (hidden)</option>
            </select>
          </label>
        </div>

        <div class="users-form-actions">
          <button type="submit" class="primary-btn" id="publishNewsBtn">Publish News</button>
          <button type="button" class="secondary-btn" id="cancelNewsBtn">Cancel</button>
        </div>

        <p class="muted-text" id="newsFormMessage"></p>
      </form>
    </div>
  </div>

  <div id="announcementModal" class="users-modal" hidden>
    <div class="users-modal-backdrop" data-close-announcement-modal="true"></div>
    <div class="users-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="announcementModalTitle">
      <header class="users-modal-header">
        <div>
          <p class="users-kicker">Publish public notice</p>
          <h3 id="announcementModalTitle">Create Announcement</h3>
        </div>
        <button type="button" class="modal-close-btn" id="closeAnnouncementModalBtn" aria-label="Close">x</button>
      </header>

      <form id="announcementForm" class="users-form" novalidate enctype="multipart/form-data">
        <div class="users-form-grid">
          <label>
            Announcement Photo
            <input type="file" id="announcementPhotoInput" name="photo" accept="image/*" required>
          </label>

          <label>
            Title
            <input type="text" id="announcementTitleInput" name="title" maxlength="160" placeholder="e.g. Fire safety advisory - Station 2" required>
          </label>

          <label class="users-full-width">
            Details / Message
            <textarea id="announcementBodyInput" name="body" maxlength="4000" rows="6" placeholder="Write the official announcement for the public." required></textarea>
          </label>

          <label>
            Announcement Type
            <select id="announcementTypeInput" name="announcementType" required>
              <option value="PUBLIC NOTICE" selected>Public Notice</option>
              <option value="DISTRICT NOTICE">District Notice</option>
              <option value="TRAINING UPDATE">Training Update</option>
              <option value="SAFETY ADVISORY">Safety Advisory</option>
            </select>
          </label>

          <label>
            Audience
            <select id="announcementAudienceInput" name="audience" required>
              <option value="PUBLIC" selected>All Public</option>
              <option value="STATION PERSONNEL">Station Personnel</option>
            </select>
          </label>

          <label>
            Expires (optional)
            <input type="date" id="announcementExpiresAtInput" name="expiresAt">
          </label>

          <label>
            Publish Status
            <select id="announcementStatusSelect" name="status">
              <option value="approved" selected>Approved (visible)</option>
              <option value="draft">Draft (hidden)</option>
            </select>
          </label>
        </div>

        <div class="users-form-actions">
          <button type="submit" class="primary-btn" id="publishAnnouncementBtn">Publish Announcement</button>
          <button type="button" class="secondary-btn" id="cancelAnnouncementBtn">Cancel</button>
        </div>

        <p class="muted-text" id="announcementFormMessage"></p>
      </form>
    </div>
  </div>

  <section class="users-grid" data-users-panel="accounts"<?php echo $usersActiveTab !== 'accounts' ? ' hidden' : ''; ?>>
    <article class="users-card"><strong id="userTotalCount">0</strong><span>Total Users</span></article>
    <article class="users-card"><strong id="userAdminCount">0</strong><span>Admins</span></article>
    <article class="users-card"><strong id="userActiveCount">0</strong><span>Active</span></article>
    <article class="users-card"><strong id="userStationCount">0</strong><span>Stations</span></article>
  </section>

  <section class="users-layout" data-users-panel="accounts"<?php echo $usersActiveTab !== 'accounts' ? ' hidden' : ''; ?>>
    <aside class="users-sidebar">
      <div class="users-filter-card">
        <h3>Filters</h3>
        <label>
          Search users
          <input type="search" id="userSearchInput" placeholder="Username, email, station">
        </label>
          <label id="userStationFilterWrap">
          Station
          <select id="userStationFilter"></select>
        </label>
        <label>
          Role
          <select id="userRoleFilter"></select>
        </label>
        <label>
          Warnings
          <select id="userWarningsFilter">
            <option value="">All users</option>
            <option value="with-warnings">With warnings / memos</option>
            <option value="no-warnings">No warnings</option>
            <option value="2-plus">2+ warnings</option>
            <option value="3-plus">3+ warnings</option>
          </select>
        </label>
      </div>

      <div class="users-filter-card">
        <h3>Helpful Notes</h3>
        <ul class="simple-list">
            <li>Admins can create and manage only regular users within their own station.</li>
            <li>Admins cannot create other admins or create substations.</li>
            <li>Superadmins can create substations, assign admins, and review activity across all stations.</li>
          <li>Use the warning/memo action to document misconduct or share formal guidance with a user.</li>
          <li>Password updates are optional during edits.</li>
          <li>User mail access follows assigned station membership.</li>
        </ul>
      </div>
    </aside>

    <section class="users-table-card">
      <div class="users-panel-head">
        <div>
          <p class="users-kicker">Accounts</p>
          <h3>Personnel Accounts</h3>
        </div>
        <div class="users-panel-meta">
          <span class="users-meta-chip">Showing <strong id="usersVisibleCount">0</strong></span>
          <span class="users-meta-chip">Total <strong id="usersTotalMetaCount">0</strong></span>
        </div>
      </div>
      <div class="users-table-wrap">
        <table class="portal-table users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Station</th>
              <th>Warnings</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            <tr><td colspan="7" class="muted-text users-empty-row">Loading users...</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</section>

<div id="userModal" class="users-modal" hidden>
  <div class="users-modal-backdrop" data-close-user-modal="true"></div>
  <div class="users-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="userModalTitle">
    <header class="users-modal-header">
      <div>
        <p class="users-kicker">Account form</p>
        <h3 id="userModalTitle">Create User</h3>
      </div>
      <button type="button" class="modal-close-btn" id="closeUserModalBtn" aria-label="Close">x</button>
    </header>

    <form id="userForm" class="users-form" novalidate>
      <input type="hidden" id="userIdInput" value="">
      <div class="users-form-grid">
        <label>
          Username
          <input type="text" id="usernameInput" maxlength="50" required>
        </label>
        <label>
          Email
          <input type="email" id="emailInput" maxlength="100" required>
        </label>
        <label>
          Password
          <input type="password" id="passwordInput" maxlength="255" placeholder="Leave blank when editing">
        </label>
        <label>
          Role
          <select id="roleSelect"></select>
        </label>
        <label>
          Station
          <select id="stationSelect"></select>
        </label>
        <label>
          Position
          <select id="positionSelect"></select>
        </label>
        <label>
          Status
          <select id="statusSelect">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label class="users-toggle-item">
          <span>
            <strong>Security alerts</strong>
            <small>Enable notifications for account and event security updates.</small>
          </span>
          <input type="checkbox" id="securityAlertsInput">
        </label>

        <label class="users-toggle-item">
          <span>
            <strong>Hide sensitive details</strong>
            <small>Mask confidential incident content until the user chooses to reveal it.</small>
          </span>
          <input type="checkbox" id="hideSensitiveInput">
        </label>

        <label>
          Auto logout
          <select id="autoLogoutInput">
            <option value="0">Disabled</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
          </select>
        </label>
      </div>

      <div class="users-form-actions">
        <button type="submit" class="primary-btn" id="saveUserBtn">Save User</button>
      </div>
      <p class="muted-text" id="userFormMessage"></p>
    </form>
  </div>
</div>

<div id="warningModal" class="users-modal" hidden>
  <div class="users-modal-backdrop" data-close-warning-modal="true"></div>
  <div class="users-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="warningModalTitle">
    <header class="users-modal-header">
      <div>
        <p class="users-kicker">Conduct notice</p>
        <h3 id="warningModalTitle">Send Warning or Memo</h3>
      </div>
      <button type="button" class="modal-close-btn" id="closeWarningModalBtn" aria-label="Close">x</button>
    </header>

    <form id="warningForm" class="users-form" novalidate>
      <input type="hidden" id="warningUserIdInput" value="">
      <div class="users-form-grid">
        <label>
          Notice type
          <select id="warningTypeInput">
            <option value="warning">Warning</option>
            <option value="memo">Memo</option>
          </select>
        </label>

        <label>
          Message template
          <select id="warningTemplateInput">
            <option value="standard_warning">Standard warning</option>
            <option value="final_warning">Final warning</option>
            <option value="performance_memo">Performance improvement memo</option>
            <option value="conduct_reminder">Conduct reminder</option>
            <option value="attendance_notice">Attendance notice</option>
            <option value="misconduct_memo">Inappropriate behavior memo</option>
            <option value="custom">Custom message</option>
          </select>
        </label>

        <label class="users-full-width">
          Message
          <textarea id="warningMessageInput" maxlength="1200" rows="6" placeholder="Describe the misconduct or guidance to the user" required></textarea>
        </label>
      </div>

      <div class="users-form-actions">
        <button type="button" class="secondary-btn" id="cancelWarningBtn">Cancel</button>
        <button type="button" class="secondary-btn" id="warningPrintBtn">Download PDF</button>
        <button type="submit" class="primary-btn" id="sendWarningBtn">Send Notice</button>
      </div>
      <p class="muted-text" id="warningFormMessage"></p>
    </form>
  </div>
</div>

<div id="userActionsModal" class="users-modal" hidden>
  <div class="users-modal-backdrop" data-close-user-actions-modal="true"></div>
  <div class="users-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="userActionsModalTitle">
    <header class="users-modal-header">
      <div>
        <p class="users-kicker">Account actions</p>
        <h3 id="userActionsModalTitle">Manage user</h3>
      </div>
      <button type="button" class="modal-close-btn" id="closeUserActionsModalBtn" aria-label="Close">x</button>
    </header>
    <div class="users-form">
      <div class="users-action-summary">
        <div class="users-action-summary-row">
          <strong id="actionUserName">-</strong>
          <span id="actionUserRole">Role</span>
        </div>
        <div class="users-action-summary-grid">
          <div><span class="users-action-label">Email</span><strong id="actionUserEmail">-</strong></div>
          <div><span class="users-action-label">Station</span><strong id="actionUserStation">-</strong></div>
          <div><span class="users-action-label">Status</span><strong id="actionUserStatus">-</strong></div>
          <div><span class="users-action-label">Warnings</span><strong id="actionUserWarnings">0</strong></div>
        </div>
      </div>
      <div class="users-form-actions users-action-buttons">
        <button type="button" class="secondary-btn" id="openEditFromActionsBtn">Edit User</button>
        <button type="button" class="secondary-btn" id="openWarningFromActionsBtn">Send Warning/Memo</button>
        <button type="button" class="secondary-btn users-action-toggle-btn" id="toggleStatusBtn">Deactivate Account</button>
        <button type="button" class="secondary-btn users-action-delete-btn" id="deleteUserBtn">Delete User</button>
      </div>
      <p class="muted-text" id="userActionsFormMessage"></p>
    </div>
  </div>
</div>

<div id="deleteUserModal" class="users-modal" hidden>
  <div class="users-modal-backdrop" data-close-delete-user-modal="true"></div>
  <div class="users-modal-dialog users-modal-dialog--compact" role="dialog" aria-modal="true" aria-labelledby="deleteUserModalTitle">
    <header class="users-modal-header">
      <div>
        <p class="users-kicker">Delete account</p>
        <h3 id="deleteUserModalTitle">Delete User</h3>
      </div>
      <button type="button" class="modal-close-btn" id="closeDeleteUserModalBtn" aria-label="Close">x</button>
    </header>
    <div class="users-form">
      <div class="users-delete-confirm">
        <p class="users-delete-copy">You are about to permanently delete this user account.</p>
        <div class="users-delete-card">
          <strong id="deleteUserName">-</strong>
          <span id="deleteUserMeta">This action cannot be undone.</span>
        </div>
      </div>
      <div class="users-form-actions">
        <button type="button" class="secondary-btn" id="cancelDeleteUserBtn">Cancel</button>
        <button type="button" class="primary-btn users-delete-confirm-btn" id="confirmDeleteUserBtn">Delete User</button>
      </div>
      <p class="muted-text" id="deleteUserMessage"></p>
    </div>
  </div>
</div>