/* Zelemeraki motion — GSAP + ScrollTrigger + SplitText + Lenis.
   The opening reveal is the centrepiece: an ink screen with faint arches, an arch
   doorway that rises from the floor and opens until the hero photo fills the screen.
   Everything degrades to a fully visible static page if GSAP is missing or the
   visitor prefers reduced motion. */
(() => {
  const html = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const preloader = $('.preloader');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!window.gsap || !window.ScrollTrigger || reduce) {
    if (preloader) preloader.remove();
    return;
  }

  const hasSplit = !!window.SplitText;
  gsap.registerPlugin(ScrollTrigger);
  if (hasSplit) gsap.registerPlugin(SplitText);

  // Arriving on a section link (e.g. /#contact from the journal) skips the intro.
  let deepLink = null;
  try { deepLink = location.hash.length > 1 ? $(location.hash) : null; } catch (e) { /* invalid selector */ }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!deepLink) window.scrollTo(0, 0);

  const isDesktop = matchMedia('(hover: hover) and (min-width: 861px)').matches;

  /* ───────── Smooth scroll ───────── */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' || id === '#' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: target === 0 ? 0 : -70, duration: 1.4 });
    }));
  }

  /* ───────── Arch geometry ─────────
     An arch "window" of size w×h, bottom-centred in a frame W×H, whose image must stay
     pinned to the frame so the photo doesn't move while the window grows. */
  const setArch = (el, img, w, h, W, H) => {
    const r = w / 2;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.borderRadius = `${r}px ${r}px 0 0`;
    img.style.width = `${W}px`;
    img.style.height = `${H}px`;
    img.style.left = `${(w - W) / 2}px`;
    img.style.top = `${h - H}px`;
  };
  // Size at which the arch's rounded crown clears the frame's top corners.
  const fullArch = (W, H) => {
    const w = W * 1.3;
    return { w, h: H + W * 0.3 + 24 };
  };
  const doorArch = (W, H) => ({ w: W < 700 ? W * 0.56 : Math.min(W * 0.27, 440), h: H * 0.64 });

  const archPath = (W, H, w, h) => {
    const r = w / 2, x0 = W / 2 - r, yTop = H - h + r;
    return `M${x0} ${H + 1}V${yTop}A${r} ${r} 0 0 1 ${x0 + w} ${yTop}V${H + 1}`;
  };

  /* ───────── Opening reveal ───────── */
  const hero = $('.hero');
  const nav = $('#nav');
  const heroTitle = $('.hero-title');
  const heroLede = $('.hero-lede');
  const heroBits = [$('.hero-eyebrow'), $('.hero-actions'), $('.hero-scroll')];
  const heroShade = $('.hero-shade');
  const heroImg = $('.hero-media img');

  let repeatVisit = false;
  try { repeatVisit = sessionStorage.getItem('zm-intro') === '1'; sessionStorage.setItem('zm-intro', '1'); } catch (e) { /* storage blocked */ }

  // Everything the intro will bring in starts hidden (under the preloader).
  gsap.set([nav, ...heroBits], { autoAlpha: 0 });
  gsap.set(heroTitle, { autoAlpha: 0 });
  gsap.set(heroLede, { autoAlpha: 0 });
  gsap.set(heroShade, { opacity: 0 });

  const waitFor = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const heroReady = heroImg.complete ? Promise.resolve() : new Promise((r) => { heroImg.onload = r; heroImg.onerror = r; });
  const ready = waitFor(Promise.all([fontsReady, heroReady]), 5000);

  const runIntro = () => {
    const win = $('.preloader-window', preloader);
    const winImg = $('img', win);
    const decor = $('.preloader-decor', preloader);
    const center = $('.preloader-center', preloader);
    const tag = $('.preloader-tag', preloader);
    const countEl = $('.preloader-count span', preloader);

    const W = preloader.clientWidth, H = preloader.clientHeight;
    const heroBox = hero.getBoundingClientRect();
    const door = doorArch(W, H);
    const full = fullArch(W, H);

    // Faint concentric arches around the doorway
    decor.setAttribute('viewBox', `0 0 ${W} ${H}`);
    decor.innerHTML = [1, 1.6, 2.35, 3.2].map((k) => {
      const w = door.w * k + 28;
      const h = door.h + 14 + (w - door.w) * 0.55;
      return `<path d="${archPath(W, H, w, h)}"/>`;
    }).join('');
    const paths = $$('path', decor);
    paths.forEach((p) => { const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });

    // The doorway's photo must line up exactly with the hero photo underneath.
    const state = { w: door.w, h: 0 };
    const draw = () => {
      setArch(win, winImg, state.w, state.h, heroBox.width, heroBox.height);
      winImg.style.top = `${state.h - H}px`; // hero is anchored to the viewport top
    };
    draw();
    gsap.set(winImg, { scale: 1.35, transformOrigin: '50% 60%' });

    const speed = repeatVisit ? 0.45 : 1;
    const counter = { v: 0 };

    const loading = gsap.timeline()
      .to(paths, { strokeDashoffset: 0, duration: 1.6 * speed, ease: 'power2.inOut', stagger: 0.1 * speed }, 0)
      .fromTo(center, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.8 * speed, ease: 'power3.out' }, 0.05)
      .fromTo(tag, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 * speed }, 0.25)
      .to(counter, {
        v: 100, duration: 1.6 * speed, ease: 'power1.inOut',
        onUpdate: () => { countEl.textContent = Math.round(counter.v); },
      }, 0);

    Promise.all([ready, loading.then()]).then(() => {
      prepareHeroSplit();

      gsap.timeline()
        .to([center, tag], { autoAlpha: 0, y: -18, duration: 0.45, ease: 'power2.in' })
        // 1. the doorway rises from the floor
        .to(state, { h: door.h, duration: 0.85, ease: 'power3.out', onUpdate: draw }, '-=0.15')
        .to(winImg, { scale: 1.18, duration: 0.85, ease: 'power3.out' }, '<')
        // 2. …then opens until the photo fills the screen
        .addLabel('open', '-=0.12')
        .to(state, { w: full.w, h: full.h, duration: 1.25, ease: 'power4.inOut', onUpdate: draw }, 'open')
        .to(winImg, { scale: 1, duration: 1.25, ease: 'power4.inOut' }, 'open')
        .to(decor, { scale: 1.25, autoAlpha: 0, duration: 0.9, ease: 'power2.in' }, 'open+=0.2')
        // 3. hand over to the real hero (pixel-identical) and bring in the copy
        .add(finish, 'open+=1.25')
        .add(heroIn(), 'open+=1.25');
    });

    function finish() {
      preloader.remove();
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
    }
  };

  let titleSplit = null, ledeSplit = null;
  const prepareHeroSplit = () => {
    if (!hasSplit) return;
    titleSplit = SplitText.create(heroTitle, { type: 'lines,chars', mask: 'lines' });
    ledeSplit = SplitText.create(heroLede, { type: 'lines', mask: 'lines' });
    (titleSplit.masks || []).forEach((m) => { m.style.paddingBottom = '.14em'; m.style.marginBottom = '-.14em'; });
  };

  // Hero copy arrives once the photo has filled the screen.
  const heroIn = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        if (titleSplit) titleSplit.revert();
        if (ledeSplit) ledeSplit.revert();
      },
    });
    tl.to(heroShade, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0);
    if (titleSplit) {
      tl.set(heroTitle, { autoAlpha: 1 }, 0)
        .from(titleSplit.chars, { yPercent: 115, duration: 1.3, ease: 'power4.out', stagger: 0.028 }, 0.1);
    } else {
      tl.to(heroTitle, { autoAlpha: 1, duration: 1 }, 0.1);
    }
    if (ledeSplit) {
      tl.set(heroLede, { autoAlpha: 1 }, 0.5)
        .from(ledeSplit.lines, { yPercent: 105, duration: 1.1, ease: 'power3.out', stagger: 0.08 }, 0.5);
    } else {
      tl.to(heroLede, { autoAlpha: 1, duration: 1 }, 0.5);
    }
    tl.fromTo(heroBits, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12 }, 0.35)
      .fromTo(nav, { autoAlpha: 0, yPercent: -60 }, { autoAlpha: 1, yPercent: 0, duration: 1.1, ease: 'power3.out', clearProps: 'transform' }, 0.45);
    return tl;
  };

  clearTimeout(window.__zmPreloaderTimer);
  if (preloader && (deepLink || html.classList.contains('preloader-timeout'))) {
    // Scripts arrived too late — the static fallback already showed the page.
    preloader.remove();
    gsap.set([nav, ...heroBits, heroTitle, heroLede], { autoAlpha: 1 });
    gsap.set(heroShade, { opacity: 1 });
  } else if (preloader) {
    if (lenis) lenis.stop();
    preloader.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    preloader.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
    runIntro();
  } else {
    ready.then(() => { prepareHeroSplit(); heroIn(); });
  }

  /* ───────── Scroll choreography (secondary) ───────── */
  ready.then(() => {
    // Hero drifts and fades as you leave it
    gsap.to(heroImg, { yPercent: 14, scale: 1.06, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-copy', { y: -90, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'center center', end: 'bottom top', scrub: true } });

    // Nav hides on the way down, returns on the way up
    ScrollTrigger.create({
      start: 'top -240', end: 'max',
      onUpdate: (self) => nav.classList.toggle('is-hidden', self.direction === 1 && !document.body.classList.contains('menu-open')),
      onLeaveBack: () => nav.classList.remove('is-hidden'),
    });

    // Headings: lines rise out of masks
    if (hasSplit) {
      $$('[data-split]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines', mask: 'lines', autoSplit: true,
          onSplit: (self) => {
            (self.masks || []).forEach((m) => { m.style.paddingBottom = '.1em'; m.style.marginBottom = '-.1em'; });
            return gsap.from(self.lines, {
              yPercent: 110, duration: 1.2, ease: 'power4.out', stagger: 0.1,
              scrollTrigger: { trigger: el, start: 'top 86%', once: true },
            });
          },
        });
      });
    }

    // Generic fade-up
    gsap.set('.reveal', { autoAlpha: 0, y: 30 });
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%', once: true,
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1 }),
    });

    // Arch / image unveil from the floor up
    $$('[data-clip]').forEach((el) => {
      const img = $('img', el);
      const parallax = img && img.hasAttribute('data-parallax');
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
        .fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.out' })
        .fromTo(img, { scale: 1.35 }, { scale: parallax ? 1.15 : 1, duration: 1.9, ease: 'expo.out' }, 0);
    });
    $$('[data-parallax]').forEach((img) => {
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-speed]').forEach((el) => {
      gsap.to(el, { yPercent: parseFloat(el.dataset.speed), ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Projects
    const projectTweens = new Map();
    $$('.project').forEach((p) => {
      const box = $('.project-img', p);
      const tl = gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 88%', once: true } })
        .fromTo(box, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out' })
        .fromTo($('img', box), { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'transform' }, 0)
        .fromTo($('.project-meta', p), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.35);
      projectTweens.set(p, tl);
    });
    document.addEventListener('projects:filter', () => {
      $$('.project:not(.is-hidden)').forEach((p) => projectTweens.get(p)?.progress(1));
      ScrollTrigger.refresh();
    });

    // Manifesto: full-bleed from the first frame (no limewash margins). The room settles,
    // two arch outlines draw up from the floor around the quote, then the words light up.
    const man = $('.manifesto');
    if (man) {
      const img = $('.manifesto-arch img', man);
      const shade = $('.manifesto-shade', man);
      const frame = $('.manifesto-frame', man);
      const kicker = $('.manifesto-kicker', man);
      const quote = $('.manifesto-quote', man);

      frame.innerHTML = '<path/><path/>';
      const paths = $$('path', frame);
      const drawFrame = () => {
        const W = man.clientWidth, H = man.clientHeight;
        const w = W < 700 ? W * 0.86 : Math.min(W * 0.44, 640);
        const h = H * 0.74; // crown sits below the kicker
        frame.setAttribute('viewBox', `0 0 ${W} ${H}`);
        paths[0].setAttribute('d', archPath(W, H, w, h));
        paths[1].setAttribute('d', archPath(W, H, w + 36, h + 18));
      };
      drawFrame();
      ScrollTrigger.addEventListener('refreshInit', drawFrame);
      const len = (i, el) => el.getTotalLength();

      let words = [quote];
      if (hasSplit) words = SplitText.create(quote, { type: 'words' }).words;

      const tl = gsap.timeline({
        scrollTrigger: { trigger: man, start: 'top top', end: '+=160%', pin: true, scrub: 0.8, invalidateOnRefresh: true },
      });
      tl.fromTo(img, { scale: 1.28, yPercent: -4 }, { scale: 1, yPercent: 0, ease: 'power2.out', duration: 1 }, 0)
        .fromTo(shade, { opacity: 0.35 }, { opacity: 1, ease: 'none', duration: 0.6 }, 0)
        .fromTo(paths, { strokeDasharray: len, strokeDashoffset: len },
          { strokeDasharray: len, strokeDashoffset: 0, ease: 'power1.inOut', duration: 0.7, stagger: 0.08 }, 0.1)
        .fromTo(kicker, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.25 }, 0.35)
        .fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.05, duration: 0.25, ease: 'none' }, 0.4);
    }

    // Process arches draw themselves
    $$('.step').forEach((step, i) => {
      const path = $('.step-arch path', step);
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(path, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', delay: i * 0.12, scrollTrigger: { trigger: '.steps', start: 'top 80%', once: true } });
    });

    // Discipline strip: loop that speeds up with scroll velocity and follows direction
    const track = $('.strip-track');
    if (track) {
      track.style.animation = 'none';
      const loop = gsap.to(track, { xPercent: -50, duration: 42, ease: 'none', repeat: -1 });
      let dir = 1;
      ScrollTrigger.create({
        onUpdate: (self) => {
          dir = self.direction;
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 6);
          gsap.to(loop, { timeScale: dir * boost, duration: 0.2, overwrite: true });
          gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25, ease: 'power2.out' });
        },
      });
    }

    // Sky: clouds part at different depths as you descend toward Lagos; drift pauses off-screen
    const sky = $('.sky');
    if (sky) {
      const st = { trigger: sky, start: 'top bottom', end: 'bottom top', scrub: true };
      gsap.fromTo('.cloud-front', { yPercent: 12 }, { yPercent: -45, ease: 'none', scrollTrigger: st });
      gsap.fromTo('.cloud-mid', { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: st });
      gsap.fromTo('.cloud-low', { yPercent: 10 }, { yPercent: -12, ease: 'none', scrollTrigger: st });
      gsap.fromTo('.sky-photo img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: st });
      gsap.fromTo('.sky-copy', { y: 80 }, { y: -60, ease: 'none', scrollTrigger: st });
      sky.classList.add('is-idle');
      ScrollTrigger.create({ trigger: sky, start: 'top bottom', end: 'bottom top', onToggle: (self) => sky.classList.toggle('is-idle', !self.isActive) });
    }

    // Footer lifts out from under the page
    gsap.from('.footer > *', {
      yPercent: -22, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });

    // Magnetic buttons
    if (isDesktop) {
      $$('[data-magnetic]').forEach((btn) => {
        const xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3.out' });
        const yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3.out' });
        btn.addEventListener('pointermove', (e) => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.3);
          yTo((e.clientY - r.top - r.height / 2) * 0.4);
        });
        btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
      });
    }

    ScrollTrigger.refresh();
    if (deepLink) {
      // Pin spacers and late images shift the layout for a moment; re-settle on every refresh.
      const go = () => (lenis ? lenis.scrollTo(deepLink, { offset: -70, immediate: true, force: true }) : deepLink.scrollIntoView());
      ScrollTrigger.addEventListener('refresh', go);
      setTimeout(() => ScrollTrigger.removeEventListener('refresh', go), 4000);
      const settle = () => ScrollTrigger.refresh();
      if (document.readyState === 'complete') setTimeout(settle, 60);
      else window.addEventListener('load', settle, { once: true });
      go();
    }
  });
})();
