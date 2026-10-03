(() => {
  const WHATSAPP = '2348030656011';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Nav background after scrolling past the top (pages without a photo hero keep it solid)
  const nav = $('#nav');
  const solid = nav.hasAttribute('data-solid');
  const onScroll = () => nav.classList.toggle('is-scrolled', solid || window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Defer the cloud artwork until the sky section is within ~1.5 screens
  const sky = $('.sky');
  if (sky) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        sky.classList.add('is-near');
        io.disconnect();
      }, { rootMargin: '150% 0px' });
      io.observe(sky);
    } else {
      sky.classList.add('is-near');
    }
  }

  // Mobile menu
  const toggle = $('.menu-toggle');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (window.lenis) window.lenis[open ? 'stop' : 'start']();
  };
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  // Services: accordion + arch image preview
  const services = $$('.service');
  const preview = $('#service-img');
  const activate = (item) => {
    if (item.classList.contains('is-active')) return;
    services.forEach((s) => {
      s.classList.toggle('is-active', s === item);
      $('button', s).setAttribute('aria-expanded', String(s === item));
    });
    if (!preview) return;
    preview.classList.add('is-swapping');
    const next = new Image();
    next.src = item.dataset.img;
    next.onload = () => {
      preview.src = item.dataset.img;
      preview.alt = item.dataset.alt || '';
      requestAnimationFrame(() => preview.classList.remove('is-swapping'));
    };
  };
  services.forEach((s) => {
    const btn = $('button', s);
    btn.setAttribute('aria-expanded', String(s.classList.contains('is-active')));
    btn.addEventListener('click', () => activate(s));
    if (window.matchMedia('(hover: hover)').matches) s.addEventListener('mouseenter', () => activate(s));
  });

  // Project filters
  const filters = $$('.filter');
  const projects = $$('.project');
  filters.forEach((f) => f.addEventListener('click', () => {
    const cat = f.dataset.filter;
    filters.forEach((b) => {
      b.classList.toggle('is-active', b === f);
      b.setAttribute('aria-selected', String(b === f));
    });
    projects.forEach((p) => {
      const show = cat === 'all' || p.dataset.cat.split(' ').includes(cat);
      p.classList.toggle('is-hidden', !show);
      if (show) p.classList.add('is-in');
    });
    // Wide tiles only make sense in the unfiltered layout
    projects.forEach((p) => {
      p.style.gridColumn = cat === 'all' ? '' : 'auto';
      p.style.gridRow = cat === 'all' ? '' : 'auto';
    });
    document.dispatchEvent(new CustomEvent('projects:filter'));
  }));

  // Contact form → WhatsApp message
  const form = $('#contact-form');
  const note = $('#form-note');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').trim();
    const phone = (data.get('phone') || '').trim();
    $$('.field', form).forEach((f) => f.classList.remove('has-error'));
    if (!name || !phone) {
      if (!name) $('#f-name').closest('.field').classList.add('has-error');
      if (!phone) $('#f-phone').closest('.field').classList.add('has-error');
      note.textContent = 'Please add your name and phone number so we can reach you.';
      return;
    }
    const types = data.getAll('type');
    const lines = [
      'Hello Zelemeraki Design, I would like to book a consultation.',
      '',
      `Name: ${name}`,
      `Phone: ${phone}`,
      data.get('email') && `Email: ${data.get('email')}`,
      types.length && `Project: ${types.join(', ')}`,
      data.get('location') && `Location: ${data.get('location')}`,
      data.get('budget') && `Budget: ${data.get('budget')}`,
      data.get('message') && `\n${data.get('message')}`,
    ].filter(Boolean);
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
    note.textContent = 'Opening WhatsApp…';
    window.open(url, '_blank', 'noopener');
  });

  // Footer mailing list. With data-endpoint set to a Mailchimp embed action URL it
  // subscribes via Mailchimp's JSONP endpoint; until then it falls back to an email.
  const signup = $('#signup-form');
  if (signup) signup.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameEl = $('[name="name"]', signup);
    const emailEl = $('[name="email"]', signup);
    const msg = $('.signup-note', signup);
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    nameEl.classList.toggle('has-error', !name);
    emailEl.classList.toggle('has-error', !/^\S+@\S+\.\S+$/.test(email));
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) { msg.textContent = 'Please add your name and a valid email address.'; return; }

    const endpoint = signup.dataset.endpoint;
    if (!endpoint) {
      const body = encodeURIComponent(`Please add me to the Zelemeraki Design mailing list.\n\nName: ${name}\nEmail: ${email}`);
      window.location.href = `mailto:hello@zelemeraki.design?subject=${encodeURIComponent('Mailing list sign-up')}&body=${body}`;
      msg.textContent = 'Opening your email app to confirm…';
      return;
    }
    const cb = `zmSignup${Date.now()}`;
    const [first, ...rest] = name.split(/\s+/);
    const url = `${endpoint.replace('/post?', '/post-json?')}&EMAIL=${encodeURIComponent(email)}&FNAME=${encodeURIComponent(first)}&LNAME=${encodeURIComponent(rest.join(' '))}&c=${cb}`;
    const tag = document.createElement('script');
    window[cb] = (res) => {
      msg.textContent = res && res.result === 'success' ? 'Thank you — you’re on the list.' : 'Something went wrong. Please try again.';
      if (res && res.result === 'success') signup.reset();
      delete window[cb]; tag.remove();
    };
    tag.src = url;
    document.body.appendChild(tag);
    msg.textContent = 'Signing you up…';
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
