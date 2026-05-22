/* ==========================================================================
   Chauhan Realty & Associates — Site Scripts
   - Mobile nav toggle
   - Sticky header scroll state
   - Scroll reveal (Intersection Observer)
   - Active nav link highlighting (data-page based)
   - Lightbox stub (used on projects page; safe no-op elsewhere)
   ========================================================================== */

(function () {
  'use strict';

  /* -------------------- Mobile nav toggle -------------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navList   = document.querySelector('.nav-list');
  const body      = document.body;

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      navList.classList.toggle('is-open', !open);
      body.classList.toggle('no-scroll', !open);
    });

    // Close menu when a nav link is clicked (mobile)
    navList.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 900px)').matches) {
          navToggle.setAttribute('aria-expanded', 'false');
          navList.classList.remove('is-open');
          body.classList.remove('no-scroll');
        }
      });
    });
  }

  /* -------------------- Sticky header scroll state -------------------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* -------------------- Scroll reveal -------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* -------------------- Active nav link -------------------- */
  const currentPage = body.dataset.page;
  if (currentPage) {
    document.querySelectorAll('.nav-link[data-nav]').forEach((link) => {
      if (link.dataset.nav === currentPage) link.classList.add('active');
    });
  }

  /* -------------------- Footer year -------------------- */
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------------------- Gallery filters (projects page) -------------------- */
  const filterBar = document.querySelector('.filters');
  const gallery   = document.querySelector('.gallery');
  if (filterBar && gallery) {
    const buttons = filterBar.querySelectorAll('.filter-btn');
    const items   = gallery.querySelectorAll('[data-category]');

    // Compute counts and append to button labels
    const counts = { all: items.length };
    items.forEach((el) => {
      const cat = el.dataset.category;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    buttons.forEach((btn) => {
      const f = btn.dataset.filter;
      const countEl = btn.querySelector('.count');
      if (countEl && counts[f] != null) countEl.textContent = `(${counts[f]})`;
    });

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      const filter = btn.dataset.filter;
      buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
      items.forEach((el) => {
        const matches = filter === 'all' || el.dataset.category === filter;
        el.classList.toggle('is-hidden', !matches);
      });
    });
  }

  /* -------------------- Contact form validation -------------------- */
  const contactForm = document.querySelector('.js-contact-form');
  if (contactForm) {
    const statusEl = contactForm.querySelector('.form-status');

    const setError = (field, msg) => {
      const wrap = field.closest('.form-field');
      if (!wrap) return;
      wrap.classList.add('has-error');
      const err = wrap.querySelector('.error-msg');
      if (err && msg) err.textContent = msg;
    };
    const clearError = (field) => {
      const wrap = field.closest('.form-field');
      if (wrap) wrap.classList.remove('has-error');
    };

    contactForm.querySelectorAll('input, select, textarea').forEach((f) => {
      f.addEventListener('input',  () => clearError(f));
      f.addEventListener('change', () => clearError(f));
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      const data = {};

      const required = contactForm.querySelectorAll('[required]');
      required.forEach((f) => {
        const v = (f.value || '').trim();
        if (!v) { setError(f, 'This field is required.'); valid = false; return; }
        data[f.name] = v;
      });

      const email = contactForm.querySelector('input[type="email"]');
      if (email && email.value.trim()) {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
        if (!ok) { setError(email, 'Please enter a valid email.'); valid = false; }
      }

      const phone = contactForm.querySelector('input[name="phone"]');
      if (phone && phone.value.trim()) {
        const digits = phone.value.replace(/\D/g, '');
        if (digits.length < 10) { setError(phone, 'Please enter a valid phone number.'); valid = false; }
      }

      if (!valid) {
        if (statusEl) { statusEl.textContent = 'Please fix the highlighted fields.'; statusEl.className = 'form-status is-error'; }
        const firstError = contactForm.querySelector('.has-error input, .has-error select, .has-error textarea');
        if (firstError) firstError.focus();
        return;
      }

      // Success path: open the user's mail client with a pre-filled email.
      // Easy to swap for Formspree / a backend endpoint later.
      const name    = contactForm.elements['name']?.value.trim() || '';
      const fromEm  = contactForm.elements['email']?.value.trim() || '';
      const fromPh  = contactForm.elements['phone']?.value.trim() || '';
      const service = contactForm.elements['service']?.value.trim() || 'General enquiry';
      const message = contactForm.elements['message']?.value.trim() || '';

      const subject = encodeURIComponent(`Enquiry: ${service} — ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${fromEm}\nPhone: ${fromPh}\nService: ${service}\n\nMessage:\n${message}`
      );
      const mailto = `mailto:contact@chauhanrealty.in?subject=${subject}&body=${body}`;

      if (statusEl) { statusEl.textContent = 'Opening your email app… If nothing happens, please call us directly.'; statusEl.className = 'form-status is-success'; }
      window.location.href = mailto;
    });
  }

  /* -------------------- Lightbox (projects page) -------------------- */
  // Will be initialized when project gallery is rendered.
  // Safe stub: does nothing if no .js-lightbox-trigger elements exist.
  const triggers = document.querySelectorAll('.js-lightbox-trigger');
  if (triggers.length) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <button class="lightbox-nav lightbox-prev" aria-label="Previous">&#8249;</button>
      <button class="lightbox-nav lightbox-next" aria-label="Next">&#8250;</button>
      <figure class="lightbox-figure">
        <img alt="" />
        <figcaption></figcaption>
      </figure>
    `;
    document.body.appendChild(lightbox);

    const imgEl     = lightbox.querySelector('img');
    const captionEl = lightbox.querySelector('figcaption');
    const closeBtn  = lightbox.querySelector('.lightbox-close');
    const prevBtn   = lightbox.querySelector('.lightbox-prev');
    const nextBtn   = lightbox.querySelector('.lightbox-next');

    let items = [];
    let currentIndex = 0;

    function refreshItems() {
      items = Array.from(document.querySelectorAll('.js-lightbox-trigger'))
        .filter((el) => el.offsetParent !== null || el.classList.contains('is-visible-filter'));
    }
    function render() {
      const el = items[currentIndex];
      if (!el) return;
      const src = el.dataset.full || el.querySelector('img')?.src;
      const cap = el.dataset.caption || el.querySelector('img')?.alt || '';
      imgEl.src = src;
      imgEl.alt = cap;
      captionEl.textContent = cap;
    }
    function open(index) {
      refreshItems();
      currentIndex = index;
      render();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      body.classList.add('no-scroll');
    }
    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      body.classList.remove('no-scroll');
    }
    function step(delta) {
      currentIndex = (currentIndex + delta + items.length) % items.length;
      render();
    }

    triggers.forEach((el, idx) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        open(idx);
      });
    });
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }
})();
