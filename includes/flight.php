<?php
$frameFiles = glob(__DIR__ . '/../assets/frames/f*.webp') ?: [];
$frames = count($frameFiles);
$framesV = 0;
foreach ($frameFiles as $frameFile) $framesV = max($framesV, (int) filemtime($frameFile));
?>
<section class="flight" id="flight" aria-label="<?= e(t('flight.label')) ?>">
  <div class="flight-stage">
    <canvas class="flight-video" id="flightCanvas" width="1280" height="720" data-frames="<?= (int) $frames ?>" data-v="<?= (int) $framesV ?>" data-path="assets/frames/f" aria-hidden="true" style="background:url(<?= e(asset_url('assets/images/flight-poster.jpg')) ?>) center/cover"></canvas>
    <div class="flight-shade"></div>
    <?php foreach (CHAPTERS as [$title, $text]): ?>
      <div class="chapter"><h2><?= e(t($title)) ?></h2><p class="lead"><?= e(t($text)) ?></p></div>
    <?php endforeach; ?>
    <div class="flight-bar" aria-hidden="true"><span id="flightBar"></span></div>
  </div>
</section>
