</main>
<footer class="footer">
  <p><?= e(t('footer.legal')) ?></p>
  <p><?= e(t('footer.rights', ['year' => date('Y')])) ?></p>
</footer>
<?php require __DIR__ . '/payment.php'; ?>
<?php require __DIR__ . '/settings.php'; ?>
</body>
</html>
