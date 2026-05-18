  </main>
  <?php if (isset($_SESSION['user'])): ?>
    </div>
  <?php endif; ?>
  <script src="/firenet/NEWFIRENET/assets/js/cloudinary-upload.js"></script>
  <script src="/firenet/NEWFIRENET/assets/js/app.js"></script>
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
