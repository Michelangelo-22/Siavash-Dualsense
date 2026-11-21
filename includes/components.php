<?php
// Versioned asset URL. Appending the file's modification time means replacing a
// photo or clip is picked up on the next load instead of being served from cache.
function asset_url(string $path): string {
  $file = __DIR__ . '/../' . $path;
  $stamp = is_file($file) ? filemtime($file) : 0;
  return $stamp ? $path . '?v=' . $stamp : $path;
}

function icon(string $name): string {
  $p = [
    'haptic' => 'M2 12h3l2-6 4 12 3-9 2 3h6', 'trigger' => 'M6 3v10a6 6 0 0 0 12 0V3',
    'mic' => 'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v4',
    'motion' => 'M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3',
    'usbc' => 'M8 7h8v6a4 4 0 0 1-8 0zM10 3v4M14 3v4M12 17v4',
    'ergo' => 'M5 15c0-6 3-10 7-10s7 4 7 10c0 3-2 4-4 4s-2-3-3-3-1 3-3 3-4-1-4-4z',
  ][$name] ?? '';
  return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' . e($p) . '"/></svg>';
}

function btn(string $label, string $href, string $variant = 'primary'): string {
  return '<a class="btn btn-' . e($variant) . '" href="' . e($href) . '"><span>' . e($label) . '</span></a>';
}

// Same visual language as btn(), but opens the payment dialog instead of navigating.
function pay_btn(string $label, string $variant = 'ghost'): string {
  return '<button class="btn btn-' . e($variant) . '" type="button" id="payOpen" aria-haspopup="dialog" aria-controls="pay"><span>' . e($label) . '</span></button>';
}

function photo(string $file, string $alt, int $w, int $h, string $class = '', bool $eager = false): string {
  return '<img class="' . e($class) . '" src="' . e(asset_url('assets/images/' . $file)) . '" alt="' . e($alt) . '" width="' . $w . '" height="' . $h . '" decoding="async" loading="' . ($eager ? 'eager' : 'lazy') . '"' . ($eager ? ' fetchpriority="high"' : '') . '>';
}

function seq_canvas(string $id, string $dir, string $poster): string {
  $folder = __DIR__ . '/../assets/' . $dir;
  $files = glob($folder . '/f*.webp') ?: [];
  $n = count($files);
  // Newest frame wins, so re-rendering a sequence (same file names) still busts the cache.
  $stamp = 0;
  foreach ($files as $file) $stamp = max($stamp, (int) filemtime($file));
  return '<canvas class="seq" id="' . e($id) . '" width="1280" height="720" data-frames="' . $n . '" data-v="' . $stamp . '" data-path="assets/' . e($dir) . '/f" aria-hidden="true" style="background:url(' . e(asset_url('assets/images/' . $poster)) . ') center/cover"></canvas>';
}

// Ambient light: a single, very soft field of blurred gradient dots. It is rendered once, as the
// first child of <main> (glow_field('page')), so one layer spans the whole page and a dot can
// start in one section and finish in the next without a cut. Only the pinned black film scene
// (haptics) paints above that layer, so it carries its own local copy — lights never bleed onto
// the footage.
// Each dot is [left %, top %, diameter in vmin, opacity] — irregular on purpose (it should read
// as randomly scattered), but fixed, so the composition never shifts between loads.
// Purely visual: aria-hidden, no pointer events, nothing for screen readers.
function glow_field(string $layout = 'page'): string {
  if ($layout === 'dark') {
    // Pinned black scene: brighter, screen-blended bloom.
    $dots = [[18, 12, 70, .72], [86, 26, 58, .64], [52, 82, 50, .56], [6, 94, 42, .52], [96, 70, 36, .5]];
    $class = 'glow-field glow-dark';
  } else {
    // Page-wide field. Percentages are of the whole <main>, so dots keep flowing across every
    // section edge. The middle band (approx. 60-78%) is only visible inside the pinned triggers
    // scene: the black haptics block in front of it is opaque.
    $dots = [
      // hero / flight (behind the footage, so they only matter on unusual layouts)
      [72, 12, 58, .48], [20, 21, 48, .44], [88, 27, 64, .46], [46, 31.5, 52, .42],
      // overview
      [82, 33.6, 56, .52], [22, 35.4, 68, .54], [59, 37.4, 46, .48], [95, 36.4, 38, .44],
      // pinned triggers scene (light, so it shows the page field itself)
      [30, 62.0, 66, .50], [84, 66.0, 58, .50], [14, 70.0, 54, .46], [58, 74.0, 72, .52],
      // ergonomics -> views (dots straddle the section boundaries on purpose)
      [46, 78.0, 64, .54], [10, 79.6, 46, .46], [88, 81.2, 58, .52], [38, 82.9, 42, .46],
      [16, 84.8, 56, .50], [68, 86.6, 70, .54], [92, 88.4, 40, .44], [30, 90.3, 34, .42],
      [58, 91.6, 62, .50], [84, 92.6, 44, .44],
    ];
    $class = 'glow-field glow-page';
  }
  $html = '<div class="' . $class . '" aria-hidden="true">';
  foreach (array_values($dots) as $i => [$x, $y, $size, $opacity]) {
    // Scroll direction: each light travels its own way (any angle, not just up and down), so
    // scrolling makes the haze swirl instead of sliding as one sheet. The hash is deterministic,
    // so the composition is identical on every load.
    $h = abs(sin(($i + 1) * 12.9898 + $x * 0.783)) * 43758.5453;
    $ang = ($h - floor($h)) * 2 * M_PI;
    $dir = '--dx:' . round(cos($ang), 2) . ';--dy:' . round(sin($ang), 2);
    $html .= '<span style="--x:' . $x . '%;--y:' . $y . '%;--s:' . $size . 'vmin;--o:' . $opacity . ';' . $dir . '"></span>';
  }
  return $html . '</div>';
}

