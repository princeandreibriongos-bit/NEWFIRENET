  </main>
  <?php if (isset($_SESSION['user'])): ?>
    </div>
    <div class="staff-nav-scrim" id="staffNavScrim" hidden aria-hidden="true"></div>
    <nav class="staff-mobile-tabbar" aria-label="Primary mobile sections">
      <a class="staff-mobile-tab<?php echo $currentPath === $dashboardPath ? ' is-active' : ''; ?>" href="<?php echo htmlspecialchars($dashboardPath); ?>">
        <i class="bi bi-speedometer2" aria-hidden="true"></i>
        <span>Home</span>
      </a>
      <a class="staff-mobile-tab<?php echo $currentPath === $reportsPath ? ' is-active' : ''; ?>" href="<?php echo htmlspecialchars($reportsPath); ?>">
        <i class="bi bi-file-earmark-text-fill" aria-hidden="true"></i>
        <span>Reports</span>
      </a>
      <a class="staff-mobile-tab<?php echo $currentPath === $calendarPath ? ' is-active' : ''; ?>" href="<?php echo htmlspecialchars($calendarPath); ?>">
        <i class="bi bi-calendar3" aria-hidden="true"></i>
        <span>Calendar</span>
      </a>
      <a class="staff-mobile-tab<?php echo $currentPath === $analyticsPath ? ' is-active' : ''; ?>" href="<?php echo htmlspecialchars($analyticsPath); ?>">
        <i class="bi bi-graph-up-arrow" aria-hidden="true"></i>
        <span>Analytics</span>
      </a>
      <button type="button" class="staff-mobile-tab" id="staffMobileMoreBtn" aria-label="Open more sections">
        <i class="bi bi-grid-fill" aria-hidden="true"></i>
        <span>More</span>
      </button>
    </nav>
    <button type="button" class="fn-to-top" id="fnToTop" aria-label="Back to top" title="Back to top"><i class="bi bi-arrow-up" aria-hidden="true"></i></button>
  <?php endif; ?>
  <script src="/firenet/NEWFIRENET/assets/js/portal-fx.js?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/js/portal-fx.js'); ?>"></script>
  <script src="/firenet/NEWFIRENET/assets/js/app.js?v=<?php echo (int) @filemtime(__DIR__ . '/../assets/js/app.js'); ?>"></script>
  <?php if (isset($pageScripts) && is_array($pageScripts)): ?>
    <?php foreach ($pageScripts as $scriptPath): ?>
      <?php if (strpos($scriptPath, 'maps.googleapis.com') !== false): ?>
        <script async defer src="<?php echo htmlspecialchars($scriptPath); ?>"></script>
      <?php else: ?>
        <script src="<?php echo htmlspecialchars($scriptPath); ?>"></script>
      <?php endif; ?>
    <?php endforeach; ?>
  <?php endif; ?>
</body>
</html>
