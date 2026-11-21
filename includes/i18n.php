<?php
declare(strict_types=1);

/**
 * Localization.
 *
 * The language is resolved on the server from the `ds_lang` cookie, so the very
 * first paint is already in the right language and direction (no flicker).
 * localStorage mirrors the cookie for client-side boot/consistency, and the
 * inline boot script in header.php re-syncs the cookie if it was cleared.
 */

const DS_LANGS = ['en' => 'English', 'fa' => 'فارسی'];
const DS_DEFAULT_LANG = 'en';

function ds_lang(): string
{
    static $lang = null;
    if ($lang !== null) {
        return $lang;
    }
    $cookie = $_COOKIE['ds_lang'] ?? '';
    return $lang = (is_string($cookie) && isset(DS_LANGS[$cookie])) ? $cookie : DS_DEFAULT_LANG;
}

function lang(): string
{
    return ds_lang();
}

function lang_dir(): string
{
    return ds_lang() === 'fa' ? 'rtl' : 'ltr';
}

function is_rtl(): bool
{
    return lang_dir() === 'rtl';
}

function lang_name(?string $code = null): string
{
    return DS_LANGS[$code ?? ds_lang()] ?? DS_LANGS[DS_DEFAULT_LANG];
}

// Load the active dictionary plus the English fallback for any missing key.
$GLOBALS['DS_I18N_FALLBACK'] = require __DIR__ . '/lang/en.php';
$GLOBALS['DS_I18N'] = ds_lang() === DS_DEFAULT_LANG
    ? $GLOBALS['DS_I18N_FALLBACK']
    : require __DIR__ . '/lang/' . ds_lang() . '.php';

/**
 * Translate a key. `{placeholder}` tokens are replaced from $vars.
 * Missing keys fall back to English, then to the key itself.
 */
function t(string $key, array $vars = []): string
{
    $text = $GLOBALS['DS_I18N'][$key] ?? $GLOBALS['DS_I18N_FALLBACK'][$key] ?? $key;
    if ($vars) {
        foreach ($vars as $name => $value) {
            $text = str_replace('{' . $name . '}', (string) $value, $text);
        }
    }
    return $text;
}
