<div class="pay" id="pay" inert aria-hidden="true">
  <div class="pay-backdrop" data-pay-close></div>
  <section class="pay-panel glass" role="dialog" aria-modal="true" aria-labelledby="payTitle" tabindex="-1">
    <header class="pay-head">
      <h2 class="pay-title" id="payTitle"><?= e(t('pay.title')) ?></h2>
      <button class="pay-close" type="button" aria-label="<?= e(t('pay.close')) ?>" data-pay-close>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </header>
    <div class="pay-card" dir="ltr">
      <p class="pay-name">Siavash shirban</p>
      <p class="pay-number">6219-8619-5605-0099</p>
    </div>
    <button class="pay-copy" type="button" id="payCopy" data-copy="6219-8619-5605-0099" data-copied-label="<?= e(t('pay.copyDone')) ?>">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5.5 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v.5"/>
      </svg>
      <span class="pay-copy-label"><?= e(t('pay.copy')) ?></span>
    </button>
    <p class="pay-status" id="payStatus" role="status" aria-live="polite" data-copied="<?= e(t('pay.copied')) ?>" data-error="<?= e(t('pay.copyError')) ?>"></p>
  </section>
</div>
