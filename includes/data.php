<?php
declare(strict_types=1);

function e(string $v): string { return htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

// Labels are translation keys resolved through t() at render time (see i18n.php).
const NAV = [['#flight', 'nav.experience'], ['#overview', 'nav.overview'], ['#features', 'nav.features'], ['#specs', 'nav.specs'], ['#colors', 'nav.views']];

// Views built from the supplied product photography (all White DualSense).
// To add a colorway later, drop its photo in assets/images/ and add a row here.
const VIEWS = [
  ['name' => 'views.front', 'aria' => 'views.frontAria', 'image' => 'assets/images/dualsense-front.webp',    'w' => 1600, 'h' => 1067, 'alt' => 'views.frontAlt'],
  ['name' => 'views.angle', 'aria' => 'views.angleAria', 'image' => 'assets/images/dualsense-angle.webp',    'w' => 1600, 'h' => 900,  'alt' => 'views.angleAlt'],
  ['name' => 'views.top',   'aria' => 'views.topAria',   'image' => 'assets/images/dualsense-triggers.webp', 'w' => 1600, 'h' => 900,  'alt' => 'views.topAlt'],
];

const FEATURES = [
  ['haptic',  'feature.haptic.title',  'feature.haptic.desc'],
  ['trigger', 'feature.trigger.title', 'feature.trigger.desc'],
  ['mic',     'feature.mic.title',     'feature.mic.desc'],
  ['motion',  'feature.motion.title',  'feature.motion.desc'],
  ['usbc',    'feature.usbc.title',    'feature.usbc.desc'],
  ['ergo',    'feature.ergo.title',    'feature.ergo.desc'],
];

const SPECS = [
  ['spec.connectivity.label', 'spec.connectivity.value'],
  ['spec.battery.label',      'spec.battery.value'],
  ['spec.sensors.label',      'spec.sensors.value'],
  ['spec.audio.label',        'spec.audio.value'],
  ['spec.weight.label',       'spec.weight.value'],
];

// Chapters shown over the scroll-scrubbed flight video (flight.mp4), in order.
const CHAPTERS = [
  ['chapter.1.title', 'chapter.1.text'],
  ['chapter.2.title', 'chapter.2.text'],
  ['chapter.3.title', 'chapter.3.text'],
  ['chapter.4.title', 'chapter.4.text'],
];
