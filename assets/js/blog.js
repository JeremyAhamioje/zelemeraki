/* Journal motion — the same vocabulary as the homepage, minus the preloader. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  if (!window.gsap || !window.ScrollTrigger || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const hasSplit = !!window.SplitText;
  gsap.registerPlugin(ScrollTrigger);
  if (hasSplit) gsap.registerPlugin(SplitText);

  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const title = $('h1');
  gsap.set(title, { autoAlpha: 0 });
  gsap.set('[data-intro]', { autoAlpha: 0, y: 18 });

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    const tl = gsap.timeline({ delay: 0.1 });
    if (hasSplit) {
      const split = SplitText.create(title, { type: 'lines,words', mask: 'lines' });
      (split.masks || []).forEach((m) => { m.style.paddingBottom = '.12em'; m.style.marginBottom = '-.12em'; });
      tl.set(title, { autoAlpha: 1 })
        .from(split.words, { yPercent: 115, duration: 1.2, ease: 'power4.out', stagger: 0.04, onComplete: () => split.revert() });
    } else {
      tl.to(title, { autoAlpha: 1, duration: 1 });
    }
    tl.to('[data-intro]', { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }, 0.25);

    if (hasSplit) {
      $$('[data-split]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines', mask: 'lines', autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, {
            yPercent: 110, duration: 1.2, ease: 'power4.out', stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }),
        });
      });
    }

    gsap.set('.reveal', { autoAlpha: 0, y: 30 });
    ScrollTrigger.batch('.reveal', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1 }),
    });

    $$('[data-clip]').forEach((el) => {
      const img = $('img', el);
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
        .fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.out' })
        .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.9, ease: 'expo.out', clearProps: 'transform' }, 0);
    });

    ScrollTrigger.refresh();
  });
})();
