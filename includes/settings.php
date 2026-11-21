<div class="settings" id="settings" inert aria-hidden="true">
  <div class="settings-backdrop" data-close></div>
  <section class="settings-panel glass" role="dialog" aria-modal="true" aria-labelledby="settingsTitle" tabindex="-1">
    <header class="settings-head">
      <h2 class="settings-title" id="settingsTitle"><?= e(t('settings.title')) ?></h2>
      <button class="settings-close" type="button" aria-label="<?= e(t('settings.close')) ?>" data-close>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </header>
    <div class="settings-body">
      <section class="settings-group" aria-labelledby="settingsLangTitle">
        <div class="settings-group-head">
          <h3 class="settings-group-title" id="settingsLangTitle"><?= e(t('settings.language')) ?></h3>
          <p class="settings-current"><?= e(t('settings.current', ['language' => lang_name()])) ?></p>
        </div>
        <p class="settings-desc"><?= e(t('settings.languageDesc')) ?></p>
        <div class="lang-switch" role="radiogroup" aria-label="<?= e(t('settings.languageGroup')) ?>">
          <?php foreach (DS_LANGS as $code => $name): ?>
            <button class="lang-option" type="button" role="radio" aria-checked="<?= $code === lang() ? 'true' : 'false' ?>"
                    data-lang="<?= e($code) ?>" lang="<?= e($code) ?>" dir="<?= $code === 'fa' ? 'rtl' : 'ltr' ?>">
              <span class="lang-name"><?= e($name) ?></span>
              <span class="lang-check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
              </span>
            </button>
          <?php endforeach; ?>
        </div>
      </section>
    </div>
    <p class="settings-note"><?= e(t('settings.note')) ?></p>
  </section>
</div>
