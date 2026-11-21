# DualSense Showcase (PHP + GSAP)

Run: `php -S localhost:8000` in this folder, then open http://localhost:8000
(or upload the folder to any PHP host, PHP 8.0+).

## Structure
- `index.php` assembles the page from `includes/` (hero, flight, overview, features, product-colors, footer).
- `includes/data.php`: nav, scrub chapters (`CHAPTERS`), views, features, specs, and the `e()` escaper.
- `assets/video/` holds the web-optimised clips cut from the reference video (298836012.mp4).
- `assets/images/` holds your product photos plus a poster frame for each video.

## How the footage is used
| Asset | Section | Behaviour |
|---|---|---|
| `video/hero.mp4` | Hero | Autoplay, muted, plays once, holds last frame; slow zoom on scroll |
| `frames/` (214 WebP) | Experience | Pinned; scroll drives an image sequence on a canvas; 4 chapters fade in |
| `frames-haptics/` (121 WebP) | Haptics | Pinned + scroll-scrubbed, with a progress bar |
| `frames-triggers/` (93 WebP) | Adaptive triggers | Pinned + scroll-scrubbed; the trigger presses as the resistance bar fills |
| `video/ports.mp4` | Specifications | USB-C to headset jack, loops only while visible |
| `video/duo-loop.mp4` | Final CTA | Plays once when scrolled into view, then holds its last frame |

Frame folders are counted automatically by PHP (`seq_canvas()` in `components.php`); names must be `f0001.webp`, `f0002.webp`, ... with no gaps.
Frames load lazily when their section is near the screen. Each section has a poster image in `assets/images/`.

### Replacing media

Put the new master files in `assets/images/` (`dualsense-*.png` exports and `*-poster.png` stills) and
rebuild the web copies:

    python tools/build-media.py

- `dualsense-*.webp` — the product photos the page serves (1600px wide, quality 82)
- `*-poster.jpg` — 1280x720 poster frames used by the canvas sections and the videos

Every media URL is built with `asset_url()` (`includes/components.php`), which appends `?v=<filemtime>`,
so a replaced photo or clip is picked up on the next load instead of coming from the browser cache.
Frame sequences are versioned from the newest frame's mtime (`data-v`), so re-rendering a sequence in place
also busts the cache.

To replace the scrubbed sequence: export frames as `assets/frames/f0001.webp`, `f0002.webp`, ... (no gaps). The page counts them automatically.
`ffmpeg -i in.mp4 -an -vf fps=20,scale=1280:-2 -c:v libwebp -quality 70 assets/frames/f%04d.webp`
The haptics and triggers sequences are 1024x576 (`scale=1024:-2`) and their cards use `aspect-ratio:16/9`,
the same ratio as the clips, so the poster and every scrubbed frame are shown whole — never cropped or stretched.
Keep hero/loop videos `muted playsinline` (needed for autoplay).
The hero `<source>` URL is versioned with `filemtime()`, so replacing `hero.mp4` busts stale browser
caches that would otherwise stop playback at the old clip length.

Reduced-motion users get poster frames and a normal scrolling layout.
GSAP 3.12.5 + ScrollTrigger (both MIT) are served locally from `assets/js/` and versioned with `filemtime()`,
so the page works offline and does not depend on a CDN. If either file fails to load (blocked extension,
bad deploy), `main.js` adds `html.no-scrub`: the pinned scenes become ordinary sections at their content
height, the progress bars read as complete, and all four flight chapters stay visible in the flow.
Sony owns the reference footage and PlayStation/DualSense marks; get permission before publishing publicly.

## Languages (English / فارسی)

The page is rendered **server-side in the selected language**, so the first paint already has the right
`lang`, `dir` and text (no flash of English on a Persian load).

- `includes/i18n.php` resolves the language (`ds_lang` cookie, validated against `DS_LANGS`) and exposes
  `lang()`, `lang_dir()`, `is_rtl()`, `lang_name()` and `t($key, $vars)`.
- `includes/lang/en.php` and `includes/lang/fa.php` are flat `key => text` dictionaries with identical keys.
  `t()` formats `{placeholders}`, then falls back to English, then to the key itself.
- Templates, nav labels and data arrays in `includes/data.php` store **keys**, not copy; every user-facing
  string (headings, buttons, alt text, ARIA labels, settings, notices) goes through `t()`.
- Switching language in Settings writes the `ds_lang` cookie (1 year) and mirrors it to `localStorage`
  (`ds-lang`), then reloads. A tiny inline script in `<head>` re-syncs the cookie from `localStorage` if it
  was cleared, guarded by `sessionStorage` against reload loops.
- Persian sets `lang="fa" dir="rtl"`, uses the locally hosted Vazirmatn variable font
  (`assets/fonts/Vazirmatn[wght].woff2`, preloaded only for Persian) and gets RTL spacing/icon/flip rules in
  `style.css`. English restores `ltr` and the system font stack.

## Design tokens

PlayStation blue replaces the old Apple-blue accent. All accents live in `:root` in `assets/css/style.css`:

| Token | Value | Use |
|---|---|---|
| `--accent` | `#0070D1` | primary actions, active states |
| `--accent-hover` | `#005FB8` | hover |
| `--accent-deep` | `#003791` | deep backgrounds, focus ring tint |
| `--accent-2` | `#00A8E8` | gradients, glows, progress |
| `--accent-3` | `#5CB8FF` | outlines, focus rings, secondary text on dark |

The navbar island, the orb's quick menu, the school badge beside the orb, the payment dialog and the Settings
dialog share one neutral Liquid Glass recipe: white gradient fills, a bright rim, backdrop blur and soft neutral
shadows. They use the same `--g1/--g2/--tint/--edge/--rim/--lens/--shadow` variables, so light/dark sections adapt
automatically. Blue is reserved for accents (primary buttons, active states, checked switches) and for the ambient
light field below; the glass panels themselves stay neutral.

### Ambient blue light field

One continuous field of very soft, blurred blue gradient dots plus a 4-corner colour wash — the After Effects
"4-colour gradient" look — runs behind the whole page. Implemented in `includes/components.php`:

- `glow_field('page')` is rendered once, as the first child of `<main>`, so a single layer spans every section
  from the hero to the CTA. A dot can start in one section and finish in the next: nothing is clipped at a
  section boundary any more.
- Each entry is `[left %, top %, diameter in vmin, opacity]`. Positions are irregular on purpose (they should
  read as randomly scattered) but fixed, so the composition never jumps between reloads. The pool includes
  dots in the triggers band (roughly 62–74 % of `<main>`), which the light pinned scene shows directly.
- The layer is `position:absolute; inset:0; z-index:0`. Every plain section is transparent and `<main>` owns
  the single white page background, so the light sections flow into each other with no seam at all; their
  direct children are lifted to `z-index:1`, so text, cards and buttons sit above the light and stay readable
  and clickable. The field is `pointer-events:none` and `aria-hidden`.
- Video sections (`hero`, `flight`, `cta`) paint above the field, so no light is ever visible on the footage.
  The black film scene (`haptics`) also paints above the page layer and carries its own local copy,
  `glow_field('dark')` (bright cyan/deep blue with `mix-blend-mode:screen`, neon on black) whose mask fades the
  bloom out before the section edges so it is never sliced by a boundary.
- Where the colour actually changes (flight→overview, overview→haptics, haptics→triggers, views→CTA,
  CTA→footer) the two sections meet on a clean, deliberate edge — no gradient band melts them together; the
  cut itself separates them. `.flight::after` and `.cta-video::before` fade the footage itself to black at its
  edges, so each cut lands on black instead of on a frozen frame.
- Dots are heavily blurred (`filter:blur(clamp(40px,10vmin,110px))`) with soft gradient stops, so they read as
  light rather than discs. They drift very slowly (`glow-drift`, 34–54 s alternate) on desktop; the drift is
  off below 700 px and under reduced motion, leaving static gradients.

Interactive feedback is motion-based: `.btn` lifts and sweeps a travelling white sheen on hover. In the
navbar the active section keeps its glass lens, and hovering another item paints a second lens under the
pointer; clicking promotes that item, so the active lens glides over and the two merge into one. Swatches,
menu items, language options and switches get small lifts or scales. The school badge tilts toward the
cursor with a following highlight and a single sheen sweep, and drops all three — including the
pointer tracking in `main.js` — under `prefers-reduced-motion` and the in-page motion preference.

## Navigation shell and Settings

- `.nav-shell` is a fixed full-width layer containing `.nav-row`, a `1fr auto 1fr` grid. The nav island sits
  in the center column; the circular hamburger **orb is a sibling of `<header class="nav">`** (not inside
  it), in column 1, so the island stays mathematically centered and the whole layout mirrors in RTL.
- The orb is 52px (46px while scrolled, matching `.nav.scrolled .island`), always `border-radius:50%`, with
  the same backdrop blur/rim/shadow and no coloured glow. A matching glass badge reading
  “Siavash Shirban Kamal HighSchool” sits beside it (forced LTR so the name reads correctly in RTL). It is
  slightly larger than before, tilts toward the pointer, carries a cursor-following highlight and a sheen on
  hover, and steps down in size on narrower screens (hidden at <=359px so the nav stays usable). Its quick
  menu holds **Settings** only and opens on click, closes on second click, outside pointerdown, or Escape; it
  is `inert` while closed and moves focus into the menu when opened.
- `includes/settings.php` is the shared dialog with a Language group (`role="radiogroup"`, English/فارسی with a
  check state and arrow-key switching).
  The panel is dark Liquid Glass built from the same recipe as the navbar (blur 26px, white gradient and rim,
  neutral shadows); its inner controls use neutral glass. It traps focus, locks scroll (`html.ds-lock`, works
  with Lenis) and returns focus to the orb on close.
- `includes/payment.php` is opened by the **Buy Now** button in the final CTA (`.btn` styled, but a real
  `<button>` so it cannot navigate). It shows the card holder and number, plus a copy button backed by
  `navigator.clipboard` with a hidden-textarea fallback and a polite live-region confirmation. It reuses the
  dialog mechanics above: focus trap, Escape/backdrop close, scroll lock and focus restored to the opener.

### Adding a string or a language

1. Add the key to both `includes/lang/en.php` and `includes/lang/fa.php`.
2. Use `<?= e(t('your.key')) ?>` in a template, or `t('your.key')` inside a data array.
3. For a new language: add its code/name to `DS_LANGS` in `i18n.php`, create `includes/lang/<code>.php`,
   and add any `html[lang]`/`dir` typography rules.

Smooth scrolling: `assets/js/lenis.min.js` (Lenis 1.1.20, MIT), `assets/js/gsap.min.js` (GSAP 3.12.5) and
`assets/js/ScrollTrigger.min.js` are loaded locally and wired together in `main.js`; no build step and no CDN.
Tune the feel with `lerp` (smaller = heavier inertia).
A reload always behaves like a first visit: the pre-paint script in `header.php` turns off the browser's
scroll restoration and strips any `#anchor` from the URL, then `main.js` resets `scrollY` (and Lenis' target)
to the top. In-page anchor links still glide to their section.
Lenis is fed a clock capped at ~32 ms per frame so one long frame (a burst of decoded sequence frames, GC, a tab
switch) slows the scroll instead of applying all of its accumulated momentum at once — without the cap the page
teleports by several hundred pixels, which reads as a jump from one section to the next. Text animations live in the `split()` helper and the `.sw` / `.lw` CSS rules.

Scroll reveals are two-way: every reveal ScrollTrigger uses `toggleActions: 'play none none reverse'`, so content
animates in on the way down, runs backwards (fades out) when it drops back below the reveal line on the way up, and
replays on the next scroll down. Under reduced motion the block is skipped and all content is visible statically.
