  </main>
  <?php if (isset($_SESSION['user'])): ?>
    </div>
  <?php endif; ?>
  <?php if (isset($_SESSION['user'])): ?>
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
