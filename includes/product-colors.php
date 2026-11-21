<section class="colors" id="colors">
  <h2 class="reveal"><?= e(t('views.title')) ?></h2>
  <div class="color-stage" id="colorStage">
    <?php foreach (VIEWS as $i => $v): ?>
      <div class="color-slide<?= $i === 0 ? ' is-active' : '' ?>">
        <?= photo(basename($v['image']), t($v['alt']), $v['w'], $v['h'], 'shot', $i === 0) ?>
      </div>
    <?php endforeach; ?>
  </div>
  <p class="color-name" id="colorName" aria-live="polite"><?= e(t(VIEWS[0]['name'])) ?></p>
  <div class="swatches" role="radiogroup" aria-label="<?= e(t('views.group')) ?>">
    <?php foreach (VIEWS as $i => $v): ?>
      <button type="button" role="radio" aria-checked="<?= $i === 0 ? 'true' : 'false' ?>" aria-label="<?= e(t($v['aria'])) ?>"
              data-name="<?= e(t($v['name'])) ?>"><?= e(t($v['name'])) ?></button>
    <?php endforeach; ?>
  </div>
</section>

<section class="cta cta-video" id="buy">
  <video class="cta-bg" muted playsinline preload="none" data-play="once" poster="<?= e(asset_url('assets/images/duo-poster.jpg')) ?>" aria-hidden="true" tabindex="-1">
    <source src="<?= e(asset_url('assets/video/duo-loop.mp4')) ?>" type="video/mp4">
  </video>
  <div class="cta-shade"></div>
  <div class="cta-copy">
    <h2 class="reveal"><?= e(t('cta.title')) ?></h2>
    <p class="lead reveal"><?= e(t('cta.lead')) ?></p>
    <div class="actions"><?= btn(t('cta.discover'), "#overview") ?><?= pay_btn(t('cta.buy')) ?></div>
  </div>
</section>
