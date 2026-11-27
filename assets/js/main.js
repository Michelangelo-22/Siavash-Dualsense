(() => {
  // A reload behaves like a first visit: start at the top, never resume the previous offset.
  // The pre-paint script in header.php already turns the browser's scroll restoration off
  // for reloads; this is the JS reset (plus the Lenis one further down).
  const navEntry = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
  const isReload = navEntry ? navEntry.type === 'reload'
    : !!(performance.navigation && performance.navigation.type === 1);
  let smooth = null;
  const toTop = () => {
    if (smooth) smooth.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  };
  if (isReload) toTop();

  const prefs = (() => { try { return JSON.parse(localStorage.getItem('ds-settings') || '{}'); } catch (e) { return {}; } })();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    || prefs.motion === true || document.documentElement.classList.contains('reduce-motion');
  const autoplay = prefs.autoplay !== false;
  const nav = document.getElementById('nav');
  const shell = document.querySelector('.nav-shell');
  const row = document.getElementById('navRow');
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('menu');

  addEventListener('scroll', () => {
    const scrolled = scrollY > 10;
    nav.classList.toggle('scrolled', scrolled);
    if (row) row.classList.toggle('is-scrolled', scrolled);
  }, { passive: true });
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    menu.classList.toggle('open', open);
    if (open) lens();
  });
  menu.addEventListener('click', e => {
    if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); }
  });

  // Colour selector (works without GSAP)
  const slides = [...document.querySelectorAll('.color-slide')];
  const swatches = [...document.querySelectorAll('.swatches button')];
  const stage = document.getElementById('colorStage');
  const label = document.getElementById('colorName');
  // Glass lens for segmented controls: slides under the selected item (same look as the navbar)
  const glassLens = (root, el) => {
    root.style.setProperty('--lx', el.offsetLeft + 'px');
    root.style.setProperty('--lw', el.offsetWidth + 'px');
    root.style.setProperty('--lo', 1);
  };
  let cur = 0;
  const select = i => {
    slides.forEach((s, n) => s.classList.toggle('is-active', n === i));
    swatches.forEach((b, n) => { b.setAttribute('aria-checked', n === i); b.tabIndex = n === i ? 0 : -1; });
    label.textContent = swatches[i].dataset.name;
    cur = i; glassLens(swatches[i].parentElement, swatches[i]);
  };
  swatches.forEach((b, i) => {
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const n = (i + d + swatches.length) % swatches.length;
      select(n); swatches[n].focus();
    });
  });
  select(0);
  addEventListener('resize', () => select(cur));
  document.fonts && document.fonts.ready.then(() => select(cur));

  // Section highlighting in nav
  const links = [...menu.querySelectorAll('a[href^="#"]')];
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { links.forEach(l => l.classList.toggle('active', l.hash === '#' + en.target.id)); lens(); }
  }), { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('section[id]').forEach(s => io.observe(s));

  // Liquid glass: the active section keeps its own lens; hovering adds a second lens.
  let navHover = null;
  const hideHoverLens = () => menu.style.setProperty('--ho', 0);
  // The nav becomes a stacked dropdown on small screens, so there the lens slides
  // vertically (--ly/--lh, --hy/--hh) instead of horizontally (--lx/--lw, --hx/--hw).
  const menuStacked = () => getComputedStyle(burger).display !== 'none';
  const setLens = (kind, li) => {
    const vertical = menuStacked();
    menu.style.setProperty('--' + kind + (vertical ? 'y' : 'x'), (vertical ? li.offsetTop : li.offsetLeft) + 'px');
    menu.style.setProperty('--' + kind + (vertical ? 'h' : 'w'), (vertical ? li.offsetHeight : li.offsetWidth) + 'px');
  };
  const lens = () => {
    if (navHover && navHover.classList.contains('active')) hideHoverLens();
    const a = menu.querySelector('a.active:not(.nav-buy)');
    if (!a) { menu.style.setProperty('--lo', 0); return; }
    setLens('l', a.parentElement);
    menu.style.setProperty('--lo', 1);
  };
  const navLinks = links.filter(a => !a.classList.contains('nav-buy'));
  navLinks.forEach(a => {
    // Hover paints a second bubble under the pointer; the active bubble does not move.
    const show = () => {
      navHover = a;
      if (a.classList.contains('active')) { hideHoverLens(); return; }
      setLens('h', a.parentElement);
      menu.style.setProperty('--ho', 1);
    };
    a.addEventListener('pointerenter', show);
    a.addEventListener('focus', show);
    a.addEventListener('click', () => {
      // Promote the clicked item: the active lens glides over and the two bubbles merge.
      links.forEach(l => l.classList.remove('active'));
      a.classList.add('active');
      navHover = null;
      setLens('l', a.parentElement);
      menu.style.setProperty('--lo', 1);
      // Keep the hover lens until the active lens arrives, then fade it so only one remains.
      const merged = e => {
        if (e.target !== menu || e.pseudoElement !== '::before' || e.propertyName !== 'transform') return;
        menu.removeEventListener('transitionend', merged);
        if (!navHover) hideHoverLens();
      };
      menu.addEventListener('transitionend', merged);
      setTimeout(() => { menu.removeEventListener('transitionend', merged); if (!navHover) hideHoverLens(); }, 800);
    });
  });
  menu.addEventListener('pointerleave', () => { navHover = null; hideHoverLens(); lens(); });
  menu.addEventListener('focusout', e => {
    if (!menu.contains(e.relatedTarget)) { navHover = null; hideHoverLens(); lens(); }
  });

  // Cursor-reactive 3D tilt: the element leans away from the pointer and springs back on leave.
  // Angles come from the layout box so the transform itself cannot feed back into the pointer.
  const tilt = (el, maxX, maxY) => {
    let raf = 0;
    let px = 0.5, py = 0.5;
    const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
    const paint = () => {
      raf = 0;
      el.style.setProperty('--ry', ((px - .5) * maxY).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((.5 - py) * maxX).toFixed(2) + 'deg');
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    };
    const track = e => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      const w = el.offsetWidth || r.width;
      const h = el.offsetHeight || r.height;
      px = clamp((e.clientX - (r.left + r.width / 2)) / w + .5);
      py = clamp((e.clientY - (r.top + r.height / 2)) / h + .5);
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      px = py = .5;
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '50%');
    };
    el.addEventListener('pointermove', track);
    el.addEventListener('pointerdown', track);
    el.addEventListener('pointerleave', reset);
    el.addEventListener('pointercancel', reset);
    addEventListener('blur', reset);
  };
  // Fine pointers with motion allowed only: the school badge and the standalone buttons.
  // Navbar controls are excluded on purpose — the nav leans on its own lens animation.
  if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const badge = document.querySelector('.orb-badge');
    if (badge) tilt(badge, 10, 14);
    document.querySelectorAll('.btn, .nav-buy').forEach(b => {
      // Inside the navbar only the Buy Now CTA tilts; the other nav controls keep their lens animation.
      if (!b.closest('.nav, .nav-shell') || b.classList.contains('nav-buy')) tilt(b, 8, 12);
    });
    // Settings dialog: the panel leans a little with the pointer, the close button leans more.
    const settingsPanel = document.querySelector('.settings-panel');
    if (settingsPanel) tilt(settingsPanel, 3, 4);
    document.querySelectorAll('.settings-close').forEach(b => tilt(b, 12, 16));
    // Payment dialog: the account card leans like the badge and carries the same pointer light.
    // The panel and its close button lean exactly like the settings dialog's.
    const payCard = document.querySelector('.pay-card');
    if (payCard) tilt(payCard, 8, 11);
    const payPanel = document.querySelector('.pay-panel');
    if (payPanel) tilt(payPanel, 3, 4);
    document.querySelectorAll('.pay-close').forEach(b => tilt(b, 12, 16));
  }
  // ...and the island adapts: dark glass over dark sections, light glass over light ones
  const probe = () => {
    let el = document.elementsFromPoint(innerWidth / 2, 40).find(e => !nav.contains(e)), light = true;
    for (; el && el !== document.documentElement; el = el.parentElement) {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || +m[3] > 0.5)) { light = (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) > 150; break; }
    }
    nav.classList.toggle('on-light', light);
    if (shell) shell.classList.toggle('on-light', light);
  };
  // Reading the colour under the island costs a hit test plus a style walk up the tree, so it runs
  // at most every 120 ms rather than on every scroll frame; the value rarely changes that fast.
  let probeAt = 0, ticking = false;
  const scheduleProbe = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const now = performance.now();
      if (now - probeAt < 120) return;
      probeAt = now;
      probe();
    });
  };
  addEventListener('scroll', scheduleProbe, { passive: true });
  addEventListener('resize', () => { probe(); lens(); });
  document.fonts && document.fonts.ready.then(lens);
  probe();

  // Video behaviour: hero plays once, CTA loop only runs while visible, reduced motion = posters only.
  // The hero clip is ~18 MB: it stays on its poster until the page has loaded and the browser is idle,
  // so the first paint and the first scroll never compete with it for bandwidth or decode time.
  // Video quality: the page ships a 720p clip for phones, and a phone whose link is genuinely fast
  // also gets the 1080p one. The link is measured once, with a 256 KB ranged read of the HD file, and
  // nothing more is fetched for the test; the HD clip streams at about 5 Mbit/s, so the bar sits a
  // little above that. Desktop keeps its current clip. Reduced motion never starts a clip, so it
  // never measures.
  const phone = matchMedia('(max-width: 900px)').matches;
  let speedTest = null;
  const linkSpeed = () => speedTest || (speedTest = (async () => {
    const hvEl = document.getElementById('heroVideo');
    const url = hvEl && hvEl.dataset.hd;
    if (!url || !navigator.onLine) return 0;
    const t0 = performance.now();
    try {
      const res = await fetch(url, { headers: { Range: 'bytes=0-262143' }, cache: 'no-store' });
      if (!res.ok || !res.body) return 0;
      const reader = res.body.getReader();
      let got = 0;
      while (got < 262144) { const r = await reader.read(); if (r.done) break; got += r.value.length; }
      reader.cancel().catch(() => {});
      const secs = (performance.now() - t0) / 1000;
      return secs > 0.05 ? (got * 8) / secs / 1e6 : 0;   // megabits per second
    } catch (e) { return 0; }
  })());
  const quality = v => v._quality || (v._quality = (() => {
    const hd = v.dataset.hd, src = v.querySelector('source'), c = navigator.connection || {};
    if (!phone || !hd || !src) return Promise.resolve(v);
    if (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')) return Promise.resolve(v);
    return linkSpeed().then(mbps => {
      if (mbps >= 6) { src.src = hd; v.load(); }
      return v;
    });
  })());

  const hv = document.getElementById('heroVideo');
  if (hv) {
    if (reduce || !autoplay) { hv.removeAttribute('autoplay'); hv.pause(); }
    else {
      const startHero = () => quality(hv).then(() => { hv.preload = 'auto'; hv.play().catch(() => {}); });
      const idle = window.requestIdleCallback || (fn => setTimeout(fn, 400));
      addEventListener('load', () => idle(startHero, { timeout: 2000 }), { once: true });
    }
  }

  // Section clips: data-play="once" plays when scrolled into view and holds its last frame; "loop" repeats only while visible
  const clips = [...document.querySelectorAll('video[data-play]')];
  if (reduce || !autoplay) clips.forEach(v => v.pause());
  else {
    clips.forEach(v => v.addEventListener('ended', () => { v.dataset.done = '1'; const c = v.closest('.cta'); c && c.classList.add('is-ended'); }));
    const cio = new IntersectionObserver(es => es.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) { if (!v.dataset.done) quality(v).then(() => { if (!v.dataset.done) v.play().catch(() => {}); }); }
      else if (v.dataset.play === 'loop') v.pause();
    }), { threshold: 0.35 });
    clips.forEach(v => cio.observe(v));
  }

  // Image-sequence player: frames are painted on a <canvas>; seq.draw(n) shows frame n (a fraction cross-fades to the next).
  // Frames load lazily when the canvas is near the viewport. Never blends across a cut or fast motion (that would ghost).
  const sequence = cvs => {
    const total = cvs ? +cvs.dataset.frames || 0 : 0;
    if (!total) return null;
    const ctx = cvs.getContext('2d'), frames = [], jump = new Map();
    const sm = document.createElement('canvas'); sm.width = 32; sm.height = 18;
    const sx = sm.getContext('2d', { willReadFrequently: true });
    let pos = 0, last = '', started = false;
    const ready = i => !!(frames[i] && frames[i].complete && frames[i].naturalWidth);
    const nearest = i => { for (let d = 0; d < total; d++) { if (ready(i - d)) return i - d; if (ready(i + d)) return i + d; } return -1; };
    const isJump = (a, b) => {
      if (jump.has(a)) return jump.get(a);
      sx.drawImage(frames[a], 0, 0, 32, 18); const A = sx.getImageData(0, 0, 32, 18).data;
      sx.drawImage(frames[b], 0, 0, 32, 18); const B = sx.getImageData(0, 0, 32, 18).data;
      let d = 0; for (let i = 0; i < A.length; i += 4) d += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]);
      const r = d / (A.length / 4 * 3) > 25; jump.set(a, r); return r;
    };
    const draw = n => {
      if (n !== undefined) pos = n;
      const a = Math.floor(pos), b = Math.min(a + 1, total - 1), f = pos - a, ia = nearest(a);
      if (ia < 0) return;
      const key = ia + ':' + f.toFixed(2); if (key === last) return; last = key;
      ctx.globalAlpha = 1; ctx.drawImage(frames[ia], 0, 0, cvs.width, cvs.height);
      if (f > 0.02 && b !== ia && ready(b) && !isJump(ia, b)) { ctx.globalAlpha = f; ctx.drawImage(frames[b], 0, 0, cvs.width, cvs.height); ctx.globalAlpha = 1; }
      for (let k = 1; k <= 3; k++) { const im = frames[Math.min(total - 1, a + k)]; im && im.decode().catch(() => {}); }
    };
    const frameSrc = i => `${cvs.dataset.path}${String(i + 1).padStart(4, '0')}.webp${cvs.dataset.v ? '?v=' + cvs.dataset.v : ''}`;
    const load = () => {
      if (started) return; started = true;
      for (let i = 0; i < total; i++) { const im = new Image(); im.decoding = 'async'; frames.push(im); }
      const first = () => { cvs.width = frames[0].naturalWidth; cvs.height = frames[0].naturalHeight; last = ''; draw(); };
      // Four requests in flight at a time: asking for all ~120 frames at once starves the page of
      // bandwidth and makes the first scroll of the pinned scene stutter.
      let next = 0, active = 0;
      const pump = () => {
        while (active < 4 && next < total) {
          const i = next++, im = frames[i];
          active++;
          const done = () => { active--; if (i === 0 && im.naturalWidth) first(); pump(); };
          im.onload = done; im.onerror = done;
          im.src = frameSrc(i);
        }
      };
      pump();
    };
    new IntersectionObserver((es, io) => { if (es.some(e => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: '1200px 0px' }).observe(cvs);
    return { total, draw };
  };

  const run = () => {
    // Static path: no GSAP/ScrollTrigger (a blocked or failed local file) or reduced motion.
    // `no-scrub` relaxes the pinned sections to their content height and fills the progress bars,
    // so every flight chapter and both film scenes stay complete and readable without a pin.
    if (!window.gsap || !window.ScrollTrigger || reduce) {
      document.documentElement.classList.add('no-scrub');
      if (!reduce) console.warn('GSAP/ScrollTrigger did not load — showing the unpinned layout.');
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    // Vertical-only viewport changes (the mobile address bar sliding in/out) must not trigger a
    // full refresh: a refresh landing inside a pinned section can drop the page out of the pin.
    ScrollTrigger.config({ ignoreMobileResize: true });
    gsap.defaults({ ease: 'power3.out' });

    // Smooth, inertial scrolling (Lenis) kept in sync with ScrollTrigger; anchor links glide instead of jumping
    if (window.Lenis) {
      const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
      smooth = lenis;
      // Lenis owns the scroll value, so a reload starts it at the top as well (its internal
      // target would otherwise still point at the old offset).
      if (isReload) lenis.scrollTo(0, { immediate: true, force: true });
      // Lenis drives the window scroll itself, so mirror its progress into the nav state.
      const syncNav = () => {
        const scrolled = scrollY > 10;
        nav.classList.toggle('scrolled', scrolled);
        if (row) row.classList.toggle('is-scrolled', scrolled);
        scheduleProbe();
      };
      lenis.on('scroll', syncNav);
      syncNav();
      lenis.on('scroll', ScrollTrigger.update);
      // Lenis' easing is frame-rate dependent: after one long frame (a burst of decoded frames,
      // GC, tab switch) it applies the whole accumulated momentum at once and the page teleports
      // — reading as a jump from one section to the next. Feed it a clock capped at ~32ms per
      // frame so a stall slows the scroll down smoothly instead of throwing it forward.
      let clock = 0, prevT = 0;
      gsap.ticker.add(t => {
        const ms = t * 1000;
        clock += prevT ? Math.min(Math.max(ms - prevT, 0), 32) : 16;
        prevT = ms;
        lenis.raf(clock);
      });
      gsap.ticker.lagSmoothing(0);
      document.addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"]'); if (!a || a.hash.length < 2) return;
        const t = document.querySelector(a.hash); if (!t) return;
        e.preventDefault(); lenis.scrollTo(t, { duration: 1.7, easing: x => 1 - Math.pow(1 - x, 4) });
      });
    }

    // Text animation. Headings: words rise out of a mask. Paragraphs: words fade in with a soft blur.
    const split = (el, kind) => {
      const txt = el.textContent.trim().replace(/\s+/g, ' ');
      el.setAttribute('aria-label', txt);
      el.innerHTML = txt.split(' ').map((w, i) => kind === 'sw'
        ? `<span class="sw" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`
        : `<span class="lw" aria-hidden="true">${w}</span>`).join(' ');
      return [...el.querySelectorAll(kind === 'sw' ? '.sw>span' : '.lw')];
    };
    // Every reveal is two-way: it plays on the way down and runs backwards (fades out) when
    // the element leaves the reveal line again on the way up, so re-scrolling down replays it.
    const REVEAL = 'play none none reverse';
    document.querySelectorAll('h2.reveal').forEach(h => {
      const w = split(h, 'sw');
      gsap.from(w, { yPercent: 135, duration: 1.15, stagger: 0.07, ease: 'power4.out',
        scrollTrigger: {
          trigger: h, start: 'top 88%', toggleActions: REVEAL,
          // Drop the un-clipped state as soon as the words start sinking back into the mask.
          onLeaveBack: () => h.classList.remove('sw-done')
        },
        onComplete: () => h.classList.add('sw-done') });
    });
    document.querySelectorAll('.chapter h2').forEach(h => split(h, 'sw'));
    document.querySelectorAll('p.lead.reveal').forEach(p => {
      gsap.from(split(p, 'lw'), { opacity: 0, y: 14, filter: 'blur(6px)', duration: 0.9, stagger: 0.022, ease: 'power3.out', clearProps: 'filter',
        scrollTrigger: { trigger: p, start: 'top 90%', toggleActions: REVEAL } });
    });

    // Hero: split headline into words
    const h1 = document.querySelector('.split');
    h1.innerHTML = h1.textContent.split(' ').map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
    gsap.timeline({ onComplete: () => h1.classList.add('done') })
      .from('.split .w>span', { yPercent: 135, duration: 1.1, stagger: 0.12 })
      .from('.hero-in', { y: 24, opacity: 0, duration: 0.9, stagger: 0.12 }, '-=0.6')
      ;
    gsap.to('.hero-video', { scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Feature cards have their own staggered reveal below; keep them out of the generic one so the two never fight over opacity.
    gsap.utils.toArray('.reveal:not(h2):not(.lead):not(.feature-list li)').forEach(el => gsap.from(el, {
      y: 36, opacity: 0, filter: 'blur(8px)', clearProps: 'filter', duration: 1, scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: REVEAL }
    }));
    gsap.utils.toArray('.reveal-img').forEach((el, i) => gsap.from(el, {
      clipPath: 'inset(12% 8% 12% 8% round 28px)', opacity: 0, duration: 1.3, delay: i * 0.1,
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: REVEAL }
    }));
    gsap.utils.toArray('.intro .tile img').forEach((el, i) => gsap.to(el, {
      yPercent: i ? -6 : 6, scrollTrigger: { trigger: el, scrub: true }
    }));



    gsap.from('.feature-list li', { y: 30, opacity: 0, stagger: 0.1, duration: 0.9, scrollTrigger: { trigger: '.feature-list', start: 'top 80%', toggleActions: REVEAL } });
    gsap.from('.color-stage', { scale: 0.94, opacity: 0, duration: 1.2, scrollTrigger: { trigger: '.color-stage', start: 'top 85%', toggleActions: REVEAL } });

    // Image sequences. follow() eases a frame position toward the scroll progress of a ScrollTrigger (frame-rate independent).
    const follow = (seq, vars) => {
      if (!seq) return;
      const { fill, ...st } = vars; let target = 0, cur = 0;
      ScrollTrigger.create({ ...st, onUpdate: s => { target = s.progress * (seq.total - 1); st.onUpdate && st.onUpdate(s); } });
      gsap.ticker.add((t, dt) => {
        // Same guard as the scroll clock: a stalled frame must not snap the sequence forward.
        const step = Math.min(dt, 64);
        cur += (target - cur) * (1 - Math.exp(-step / 1000 * 14)); if (Math.abs(target - cur) < 0.001) cur = target;
        seq.draw(cur);
        if (fill) fill.style.transform = `scaleX(${seq.total > 1 ? cur / (seq.total - 1) : 0})`;
      });
    };

    // Flight: pinned macro montage, scroll drives the frames and the four chapters
    const fs = document.getElementById('flight'), fseq = sequence(document.getElementById('flightCanvas'));
    if (fseq) {
      const chapters = [...fs.querySelectorAll('.chapter')], bar = document.getElementById('flightBar');
      let shown = 0; fs.classList.add('is-scrub'); chapters[0].classList.add('on');
      follow(fseq, { trigger: fs, start: 'top top', end: '+=450%', pin: true, refreshPriority: 1, onUpdate: s => {
        bar.style.transform = `scaleX(${s.progress})`;
        const i = Math.min(chapters.length - 1, Math.floor(s.progress * chapters.length));
        if (i !== shown) { chapters.forEach((c, n) => c.classList.toggle('on', n === i)); shown = i; }
      } });
    } else console.warn('Flight: no frames found in assets/frames/ (expected f0001.webp, f0002.webp, ...)');

    // Haptics: pinned; the ripples spread as you scroll, and the bar shows how far along the film is
    // anticipatePin stays off: with Lenis' smooth scroll it applies the pin a frame early, which yanks
    // the next section into view while the previous pin is still playing (the "jumps to Features" bug).
    // Pinned black scene: the pin freezes the frame, so the scene's own bloom is pushed upward by
    // the film's progress — the lights travel bottom to top for as long as the reel plays.
    const hapticGlow = document.querySelector('.haptics .glow-dark');
    const riseGlow = s => hapticGlow && hapticGlow.style.setProperty('--rise', (6 - s.progress * 60).toFixed(1));
    follow(sequence(document.getElementById('hapticCanvas')), { trigger: '.haptics', start: 'top top', end: '+=300%', pin: true, refreshPriority: 1, fill: document.getElementById('hapticBar'), onUpdate: riseGlow });
    // Triggers: pinned; the trigger presses into the fibres exactly as the resistance bar fills
    follow(sequence(document.getElementById('trigCanvas')), { trigger: '.triggers', start: 'top top', end: '+=250%', pin: true, refreshPriority: 1, fill: document.querySelector('.triggers .trig-fill') });
  };
  document.readyState === 'complete' ? run() : addEventListener('load', run);
})();

// ===== Independent quick menu, settings dialog, language and preferences =====
(() => {
  const orb = document.getElementById('orb');
  const quick = document.getElementById('orbMenu');
  const settings = document.getElementById('settings');
  if (!orb || !quick || !settings) return;

  const panel = settings.querySelector('.settings-panel');
  const openSettingsBtn = document.getElementById('orbSettings');
  const closeEls = [...settings.querySelectorAll('[data-close]')];
  const langButtons = [...settings.querySelectorAll('[data-lang]')];
  const root = document.documentElement;
  const PREF_KEY = 'ds-settings';

  const store = (() => {
    try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch (e) { return {}; }
  })();
  const saveStore = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(store)); } catch (e) {} };

  const menuOpen = () => orb.getAttribute('aria-expanded') === 'true';

  const closeQuick = () => {
    if (!menuOpen()) return;
    const hadFocus = quick.contains(document.activeElement);
    orb.setAttribute('aria-expanded', 'false');
    orb.setAttribute('aria-label', orb.dataset.labelOpen || 'Open menu');
    quick.classList.remove('is-open');
    quick.inert = true;
    if (hadFocus) orb.focus();
  };

  const openQuick = () => {
    orb.setAttribute('aria-expanded', 'true');
    orb.setAttribute('aria-label', orb.dataset.labelClose || 'Close menu');
    quick.inert = false;
    quick.classList.add('is-open');
    const first = quick.querySelector('[role="menuitem"]');
    if (first) first.focus();
  };

  orb.addEventListener('click', e => {
    e.stopPropagation();
    menuOpen() ? closeQuick() : openQuick();
  });

  // Opening the navbar's own menu closes this one: only one menu on screen at a time.
  const navBurger = document.querySelector('.burger');
  if (navBurger) navBurger.addEventListener('click', () => { if (menuOpen()) closeQuick(); });

  document.addEventListener('pointerdown', e => {
    if (menuOpen() && !quick.contains(e.target) && !orb.contains(e.target)) closeQuick();
  });

  // Settings dialog: modal, focus-trapped, with a scroll lock shared by Lenis/native scroll.
  let settingsOpen = false;
  let returnFocus = orb;

  const focusables = () => [...panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter(el => !el.disabled && el.offsetParent !== null);

  const openSettings = () => {
    if (settingsOpen) return;
    returnFocus = orb;
    closeQuick();
    settingsOpen = true;
    settings.inert = false;
    settings.setAttribute('aria-hidden', 'false');
    settings.classList.add('is-open');
    root.classList.add('ds-lock');
    setTimeout(() => panel.focus(), 60);
  };

  const closeSettings = () => {
    if (!settingsOpen) return;
    settingsOpen = false;
    settings.classList.remove('is-open');
    settings.setAttribute('aria-hidden', 'true');
    settings.inert = true;
    root.classList.remove('ds-lock');
    (returnFocus && document.contains(returnFocus) ? returnFocus : orb).focus();
  };

  if (openSettingsBtn) openSettingsBtn.addEventListener('click', openSettings);
  closeEls.forEach(el => el.addEventListener('click', closeSettings));

  settings.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !settingsOpen) return;
    const list = focusables();
    if (!list.length) { e.preventDefault(); panel.focus(); return; }
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (settingsOpen) { e.preventDefault(); closeSettings(); }
    else if (menuOpen()) { e.preventDefault(); closeQuick(); }
  });

  // Language: the cookie drives server rendering; localStorage mirrors it for the boot script.
  const chooseLang = code => {
    if (code === root.getAttribute('data-lang')) return;
    try { localStorage.setItem('ds-lang', code); } catch (e) {}
    // The static build ships one file per language; PHP renders per request, so it reloads.
    if (root.dataset.static) { location.href = code === 'fa' ? 'fa.html' : 'index.html'; return; }
    document.cookie = 'ds_lang=' + code + ';path=/;max-age=31536000;samesite=lax';
    location.reload();
  };
  langButtons.forEach((b, i) => {
    b.addEventListener('click', () => chooseLang(b.dataset.lang));
    b.addEventListener('keydown', e => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const next = langButtons[(i + step + langButtons.length) % langButtons.length];
      next.focus();
      chooseLang(next.dataset.lang);
    });
  });

  // Preference switches (persist in localStorage; motion also applies immediately via CSS).
  const switches = [...settings.querySelectorAll('[data-setting]')];
  switches.forEach(sw => {
    const key = sw.dataset.setting;
    const fallback = sw.getAttribute('aria-checked') === 'true';
    const value = typeof store[key] === 'boolean' ? store[key] : fallback;
    sw.setAttribute('aria-checked', value ? 'true' : 'false');
    sw.addEventListener('click', () => {
      const next = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', next ? 'true' : 'false');
      store[key] = next;
      saveStore();
      if (key === 'motion') {
        root.classList.toggle('reduce-motion', next);
        if (next) document.querySelectorAll('video').forEach(v => v.pause());
        // Motion is decided at boot (GSAP early-return), so reload for a complete, flicker-free change.
        setTimeout(() => location.reload(), 150);
      }
      if (key === 'autoplay' && !next) document.querySelectorAll('video').forEach(v => v.pause());
      if (key === 'autoplay' && next) {
        document.querySelectorAll('#heroVideo, video[data-play]').forEach(v => { if (!v.dataset.done) v.play().catch(() => {}); });
      }
    });
  });
})();

// ===== Final CTA payment dialog =====
(() => {
  const dialog = document.getElementById('pay');
  const opener = document.getElementById('payOpen');
  if (!dialog || !opener) return;

  const panel = dialog.querySelector('.pay-panel');
  if (!panel) return;
  const closeEls = [...dialog.querySelectorAll('[data-pay-close]')];
  const copyBtn = document.getElementById('payCopy');
  const copyLabel = copyBtn ? copyBtn.querySelector('.pay-copy-label') : null;
  const status = document.getElementById('payStatus');
  const root = document.documentElement;
  const defaultLabel = copyLabel ? copyLabel.textContent : '';
  let open = false;
  let returnFocus = opener;
  let resetTimer = 0;

  const focusables = () => [...panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter(el => !el.disabled && el.offsetParent !== null);

  const resetCopy = () => {
    clearTimeout(resetTimer);
    if (!copyBtn || !copyLabel || !status) return;
    copyBtn.classList.remove('is-copied');
    copyLabel.textContent = defaultLabel;
    status.classList.remove('is-error');
    status.textContent = '';
  };

  const show = () => {
    if (open) return;
    open = true;
    returnFocus = opener;
    resetCopy();
    dialog.inert = false;
    dialog.setAttribute('aria-hidden', 'false');
    dialog.classList.add('is-open');
    root.classList.add('ds-lock');
    setTimeout(() => panel.focus(), 60);
  };

  const hide = () => {
    if (!open) return;
    open = false;
    resetCopy();
    dialog.classList.remove('is-open');
    dialog.setAttribute('aria-hidden', 'true');
    dialog.inert = true;
    root.classList.remove('ds-lock');
    (returnFocus && document.contains(returnFocus) ? returnFocus : opener).focus();
  };

  opener.addEventListener('click', show);
  closeEls.forEach(el => el.addEventListener('click', hide));

  dialog.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !open) return;
    const list = focusables();
    if (!list.length) { e.preventDefault(); panel.focus(); return; }
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !open) return;
    e.preventDefault();
    hide();
  });

  // Clipboard: async API when allowed, hidden-textarea fallback for older/blocked contexts.
  const legacyCopy = text => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } finally { ta.remove(); }
    if (!ok) throw new Error('copy-failed');
  };

  const copied = () => {
    if (!copyBtn || !copyLabel || !status) return;
    copyBtn.classList.add('is-copied');
    copyLabel.textContent = copyBtn.dataset.copiedLabel || defaultLabel;
    status.classList.remove('is-error');
    status.textContent = status.dataset.copied || '';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(resetCopy, 2400);
  };

  const failed = () => {
    if (!status) return;
    status.classList.add('is-error');
    status.textContent = status.dataset.error || '';
  };

  if (copyBtn) copyBtn.addEventListener('click', async () => {
    const text = copyBtn.dataset.copy || '';
    try {
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(text); }
        catch (err) { legacyCopy(text); }
      } else {
        legacyCopy(text);
      }
      copied();
    } catch (err) {
      failed();
    }
  });
})();
