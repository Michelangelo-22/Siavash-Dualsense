<section class="dark haptics" id="features">
  <?= glow_field('dark') ?>
  <div class="dark-copy">
    <h2 class="reveal"><?= e(t('haptics.title')) ?></h2>
    <p class="lead reveal"><?= e(t('haptics.lead')) ?></p>
  </div>
  <div class="vid-card" aria-hidden="true">
    <div class="trig-bar"><span class="trig-fill" id="hapticBar"></span></div>
    <?= seq_canvas('hapticCanvas', 'frames-haptics', 'haptics-poster.jpg') ?>
  </div></section>

<section class="triggers">
  <div class="trig-visual" aria-hidden="true">
    <div class="trig-bar"><span class="trig-fill"></span></div>
    <?= seq_canvas('trigCanvas', 'frames-triggers', 'triggers-poster.jpg') ?>
  </div>
  <div>
    <h2 class="reveal"><?= e(t('triggers.title')) ?></h2>
    <p class="lead reveal"><?= e(t('triggers.lead')) ?></p>
  </div>
</section>

<section class="ergo">
  <h2 class="reveal"><?= e(t('ergo.title')) ?></h2>
  <p class="lead reveal"><?= e(t('ergo.lead')) ?></p>
</section>

<section class="list-sec">
  <ul class="feature-list">
    <?php foreach (FEATURES as [$ic, $title, $desc]): ?>
      <li class="reveal"><?= icon($ic) ?><h3><?= e(t($title)) ?></h3><p><?= e(t($desc)) ?></p></li>
    <?php endforeach; ?>
  </ul>
</section>

<section class="specs" id="specs">
  <h2 class="reveal"><?= e(t('specs.title')) ?></h2>
  <div class="specs-grid">
  <dl>
    <?php foreach (SPECS as [$k, $v]): ?>
      <div class="reveal"><dt><?= e(t($k)) ?></dt><dd><?= e(t($v)) ?></dd></div>
    <?php endforeach; ?>
  </dl>
    <div class="vid-card ports-card" aria-hidden="true">
      <video muted loop playsinline preload="none" data-play="loop" poster="<?= e(asset_url('assets/images/ports-poster.jpg')) ?>" data-hd="<?= e(asset_url('assets/video/ports-hd.mp4')) ?>"><source src="<?= e(asset_url('assets/video/ports.mp4')) ?>" type="video/mp4"></video>
    </div>
  </div>
</section>
