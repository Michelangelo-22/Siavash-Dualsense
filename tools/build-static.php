<?php
/**
 * Static build for GitHub Pages.
 *
 * GitHub Pages serves files only, so the PHP page is rendered here, once per language:
 *
 *   php tools/build-static.php en dist/index.html
 *   php tools/build-static.php fa dist/fa.html
 *
 * Both files live at the site root so every relative asset URL (assets/...) keeps working.
 * The build sets DS_STATIC=1, which the boot script and the language switcher read to navigate
 * between index.html and fa.html instead of reloading into a server-rendered cookie.
 *
 * DS_PAGES_HOST / DS_PAGES_PATH describe the public origin, e.g. "user.github.io" and
 * "/dual-sense"; they are only used to write absolute og:url / og:image URLs.
 */
declare(strict_types=1);

$root = dirname(__DIR__);
$lang = $argv[1] ?? '';
$target = $argv[2] ?? '';

if (!in_array($lang, ['en', 'fa'], true) || $target === '') {
    fwrite(STDERR, "usage: php tools/build-static.php <en|fa> <output-file>\n");
    exit(1);
}

$host = getenv('DS_PAGES_HOST') ?: 'localhost';
$path = '/' . trim((string) (getenv('DS_PAGES_PATH') ?: ''), '/');
if ($path === '/') {
    $path = '';
}

// The page reads these instead of a real request, so share URLs come out absolute and correct.
putenv('DS_STATIC=1');
$_SERVER['HTTP_HOST'] = $host;
$_SERVER['HTTPS'] = 'on';
$_SERVER['SCRIPT_NAME'] = $path . '/index.php';
$_SERVER['REQUEST_URI'] = $path . '/';
$_COOKIE['ds_lang'] = $lang;

chdir($root);
ob_start();
require $root . '/index.php';
$html = (string) ob_get_clean();

// Fail the build loudly rather than publishing a half-rendered page.
$checks = [
    'document' => str_contains($html, '<html'),
    'static flag' => str_contains($html, 'data-static="1"'),
    'language' => str_contains($html, 'data-lang="' . $lang . '"'),
    'stylesheet' => str_contains($html, 'assets/css/style.css'),
    'main script' => str_contains($html, 'assets/js/main.js'),
];
foreach ($checks as $name => $ok) {
    if (!$ok) {
        fwrite(STDERR, "build check failed: {$name}\n");
        exit(1);
    }
}

$dir = dirname($target);
if (!is_dir($dir) && !mkdir($dir, 0777, true) && !is_dir($dir)) {
    fwrite(STDERR, "could not create {$dir}\n");
    exit(1);
}
if (file_put_contents($target, $html) === false) {
    fwrite(STDERR, "could not write {$target}\n");
    exit(1);
}

fwrite(STDERR, sprintf("wrote %s (%d bytes, %s)\n", $target, strlen($html), $lang));
