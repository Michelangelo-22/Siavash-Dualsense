<!doctype html>
<html lang="<?= e(lang()) ?>" dir="<?= e(lang_dir()) ?>" data-lang="<?= e(lang()) ?>"<?= getenv('DS_STATIC') === '1' ? ' data-static="1"' : '' ?>>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e(t('meta.title')) ?></title>
<meta name="description" content="<?= e(t('meta.description')) ?>">
<meta name="theme-color" content="#003791">
<link rel="icon" href="<?= e(asset_url('assets/favicon.svg')) ?>" type="image/svg+xml">
<?php
// Social cards need absolute URLs, and the page runs both at http://localhost/Dual-Sense/ and
// at a host root, so the base comes from the request instead of a hard-coded host.
$shareHost = preg_replace('/[^A-Za-z0-9.\-:\[\]]/', '', $_SERVER['HTTP_HOST'] ?? '') ?: 'localhost';
$shareHttps = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
  || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
$shareDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
$shareBase = ($shareHttps ? 'https' : 'http') . '://' . $shareHost . $shareDir;
// 1200x630 is the 1.91:1 that summary_large_image cards render, so nothing gets cropped.
$shareImage = $shareBase . '/' . asset_url('assets/images/og-hero.jpg');
$shareLocale = is_rtl() ? 'fa_IR' : 'en_US';
?>
<meta property="og:type" content="website">
<meta property="og:site_name" content="<?= e(t('nav.brand')) ?>">
<meta property="og:url" content="<?= e($shareBase . '/') ?>">
<meta property="og:locale" content="<?= e($shareLocale) ?>">
<meta property="og:locale:alternate" content="<?= e($shareLocale === 'fa_IR' ? 'en_US' : 'fa_IR') ?>">
<meta property="og:title" content="<?= e(t('meta.title')) ?>">
<meta property="og:description" content="<?= e(t('meta.description')) ?>">
<meta property="og:image" content="<?= e($shareImage) ?>">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="<?= e(t('meta.imageAlt')) ?>">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= e(t('meta.title')) ?>">
<meta name="twitter:description" content="<?= e(t('meta.description')) ?>">
<meta name="twitter:image" content="<?= e($shareImage) ?>">
<meta name="twitter:image:alt" content="<?= e(t('meta.imageAlt')) ?>">
<?php if (is_rtl()): ?>
<link rel="preload" href="assets/fonts/Vazirmatn[wght].woff2" as="font" type="font/woff2" crossorigin>
<?php endif; ?>
<link rel="stylesheet" href="assets/css/style.css?v=<?= filemtime(__DIR__ . '/../assets/css/style.css') ?>">
<script>
// Runs before first paint: keep localStorage and the server cookie in sync so the
// language/direction are already correct in the first frame (no flicker).
(function () {
  var d = document.documentElement, guard = 'ds-lang-sync';
  try {
    var saved = localStorage.getItem('ds-lang'), cur = d.getAttribute('data-lang');
    if ((saved === 'en' || saved === 'fa') && saved !== cur) {
      // Static build (GitHub Pages): each language is its own file, so follow the saved choice
      // by navigating instead of reloading a page the server can no longer re-render.
      if (d.dataset.static) { location.replace(saved === 'fa' ? 'fa.html' : 'index.html'); return; }
      if (!sessionStorage.getItem(guard)) {
        sessionStorage.setItem(guard, '1');
        document.cookie = 'ds_lang=' + saved + ';path=/;max-age=31536000;samesite=lax';
        location.reload();
        return;
      }
    } else if (saved) {
      sessionStorage.removeItem(guard);
    }
  } catch (e) {}
  try {
    var prefs = JSON.parse(localStorage.getItem('ds-settings') || '{}');
    if (prefs.motion === true) d.classList.add('reduce-motion');
  } catch (e) {}
  // A reload behaves like a first visit: no restored scroll position and no jump to an anchor.
  try {
    var navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var isReload = navEntry ? navEntry.type === 'reload'
      : !!(performance.navigation && performance.navigation.type === 1);
    if (isReload && 'scrollRestoration' in history) history.scrollRestoration = 'manual';
    // The page itself is the "screen": an incoming #anchor should not drop the visitor mid-page.
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  } catch (e) {}
})();
</script>
<?php
// GSAP + ScrollTrigger ship with the project (assets/js/), so the cinematic layer no longer
// depends on a third-party CDN. main.js checks for them on load and, if either file is missing
// or blocked, switches the page to its unpinned layout instead of leaving the scenes empty.
?>
<script defer src="assets/js/gsap.min.js?v=<?= filemtime(__DIR__ . '/../assets/js/gsap.min.js') ?>"></script>
<script defer src="assets/js/ScrollTrigger.min.js?v=<?= filemtime(__DIR__ . '/../assets/js/ScrollTrigger.min.js') ?>"></script>
<script defer src="assets/js/lenis.min.js?v=<?= filemtime(__DIR__ . '/../assets/js/lenis.min.js') ?>"></script>
<script defer src="assets/js/main.js?v=<?= filemtime(__DIR__ . '/../assets/js/main.js') ?>"></script>
</head>
<body>
<a class="skip" href="#main"><?= e(t('skip')) ?></a>

<div class="nav-shell">
  <div class="nav-row" id="navRow">
    <div class="orb-wrap">
      <button class="orb" id="orb" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="orbMenu" aria-label="<?= e(t('menu.open')) ?>" data-label-open="<?= e(t('menu.open')) ?>" data-label-close="<?= e(t('menu.close')) ?>">
        <span class="orb-lines" aria-hidden="true"><span></span><span></span><span></span></span>
      </button>
      <div class="orb-menu" id="orbMenu" role="menu" aria-label="<?= e(t('menu.label')) ?>" inert>
        <button class="orb-item" id="orbSettings" type="button" role="menuitem">
          <svg class="orb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.51 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.51-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.51 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.37.46.66.85.79.21.07.43.11.65.11H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/>
          </svg>
          <span><?= e(t('menu.settings')) ?></span>
        </button>
      </div>
      <p class="orb-badge" dir="<?= e(lang_dir()) ?>" lang="<?= e(lang()) ?>"><span><?= e(t('school.badge')) ?></span></p>
    </div>
    <header class="nav" id="nav">
      <nav class="island" aria-label="<?= e(t('nav.primary')) ?>">
        <a class="brand" href="#top"><?= e(t('nav.brand')) ?></a>
        <button class="burger" aria-expanded="false" aria-controls="menu" aria-label="<?= e(t('nav.menu')) ?>"><span></span><span></span></button>
        <ul id="menu">
          <?php foreach (NAV as [$href, $label]): ?>
            <li><a href="<?= e($href) ?>"><?= e(t($label)) ?></a></li>
          <?php endforeach; ?>
          <li><a class="nav-buy" href="#buy"><span><?= e(t('nav.buy')) ?></span></a></li>
        </ul>
      </nav>
    </header>
  </div>
</div>
<main id="main">
<?= glow_field('page') ?>
