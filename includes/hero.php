<section class="hero hero-cine" id="top">
  <video class="hero-video" id="heroVideo" autoplay muted playsinline preload="auto" poster="<?= e(asset_url('assets/images/hero-poster.jpg')) ?>" aria-hidden="true" tabindex="-1">
    <source src="<?= e(asset_url('assets/video/hero.mp4')) ?>" type="video/mp4">
  </video>
  <div class="hero-shade"></div>
  <h1 class="split"><?= e(t('hero.title')) ?></h1>
  <p class="lead hero-in"><?= e(t('hero.lead')) ?></p>
  <div class="actions hero-in"><?= btn(t('hero.explore'), "#flight") ?><?= btn(t('hero.buy'), "#buy", "ghost") ?></div>
</section>
