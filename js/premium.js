/* ==========================================================================
   premium.js — Chauhan Realty cinematic experience
   Core UX works with zero dependencies (progressive enhancement).
   GSAP + Lenis + Three.js are loaded opportunistically and only *enhance*.
   ========================================================================== */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* -------------------------------------------------------------- Preloader */
function initPreloader() {
  const pre = $(".preloader");
  const ready = () => document.body.classList.add("ready");
  if (!pre) { ready(); return; }

  const seen = sessionStorage.getItem("cra_intro");
  if (seen || reduceMotion) {
    pre.remove();
    ready();
    return;
  }
  sessionStorage.setItem("cra_intro", "1");

  const logo = $(".preloader__logo", pre);
  const sub  = $(".preloader__sub", pre);
  const bar  = $(".preloader__bar span", pre);
  const pct  = $(".preloader__pct", pre);

  logo.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }],
    { duration: 600, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "forwards" });
  sub.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 200, fill: "forwards" });

  const dur = 1050;
  const t0 = performance.now();
  function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    bar.style.transform = `scaleX(${eased})`;
    pct.textContent = String(Math.round(eased * 100)).padStart(3, "0");
    if (p < 1) { requestAnimationFrame(step); }
    else { finish(); }
  }
  requestAnimationFrame(step);
  // Safety net: setTimeout keeps firing even when rAF is throttled
  // (backgrounded tab), so the intro can never hang.
  setTimeout(finish, 2600);

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    pre.classList.add("is-done");
    pre.animate([{ clipPath: "inset(0 0 0% 0)" }, { clipPath: "inset(0 0 100% 0)" }],
      { duration: 800, easing: "cubic-bezier(0.76,0,0.24,1)", fill: "forwards" })
      .onfinish = () => pre.remove();
    ready();
  }
  pre.addEventListener("click", finish);
}

/* ----------------------------------------------------------- Custom cursor */
function initCursor() {
  if (!finePointer) return;
  document.body.classList.add("has-cursor");
  const dot = document.createElement("div"); dot.className = "cursor";
  const ring = document.createElement("div"); ring.className = "cursor-follow";
  const label = document.createElement("span"); label.className = "cursor-follow__label";
  ring.appendChild(label);
  document.body.append(dot, ring);

  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    dot.classList.remove("is-hidden"); ring.classList.remove("is-hidden");
  });
  addEventListener("pointerdown", () => ring.style.transform = ring.style.transform.replace("scale(1)", "scale(0.85)"));
  document.addEventListener("mouseleave", () => { dot.classList.add("is-hidden"); ring.classList.add("is-hidden"); });

  (function loop() {
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();

  $$("[data-cursor]").forEach((el) => {
    el.addEventListener("pointerenter", () => {
      ring.classList.add("is-active");
      label.textContent = el.getAttribute("data-cursor") || "";
    });
    el.addEventListener("pointerleave", () => ring.classList.remove("is-active"));
  });
}

/* ---------------------------------------------------------- Magnetic hover */
function initMagnetic() {
  if (!finePointer) return;
  $$("[data-magnetic]").forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic) || 0.35;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * strength;
      const y = (e.clientY - r.top - r.height / 2) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener("pointerleave", () => el.style.transform = "");
  });
}

/* ------------------------------------------------------- Navigation + menu */
function initNav() {
  const nav = $(".nav");
  const burger = $(".nav__burger");
  const menu = $(".menu");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });
  window.__navScroll = onScroll; // also driven by Lenis in the enhance layer

  const closeMenu = () => document.body.classList.remove("menu-open");
  burger?.addEventListener("click", () => document.body.classList.toggle("menu-open"));
  $$(".menu a, .nav__link, .brand").forEach((a) =>
    a.addEventListener("click", () => { if (a.hash) closeMenu(); }));
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  // active section highlight
  const links = $$(".nav__link");
  const map = new Map(links.map((l) => [l.getAttribute("href"), l]));
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((l) => l.classList.remove("is-active"));
        map.get("#" + en.target.id)?.classList.add("is-active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach((s) => io.observe(s));
}

/* --------------------------------------------------------- Reveal on enter */
function initReveals() {
  const els = $$("[data-reveal]");
  const io = new IntersectionObserver((ents, obs) => {
    ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); obs.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
  els.forEach((el) => io.observe(el));

  // split-text words
  $$("[data-split]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((w, i) => {
      const outer = document.createElement("span"); outer.className = "split-word";
      const inner = document.createElement("span"); inner.textContent = w;
      inner.style.transitionDelay = (i * 0.045) + "s";
      outer.appendChild(inner);
      el.appendChild(outer);
      el.appendChild(document.createTextNode(" "));
    });
  });
  const io2 = new IntersectionObserver((ents, obs) => {
    ents.forEach((en) => {
      if (en.isIntersecting) {
        $$(".split-word > span", en.target).forEach((s) => s.style.transform = "translateY(0)");
        obs.unobserve(en.target);
      }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
  $$("[data-split]").forEach((el) => io2.observe(el));
}

/* ------------------------------------------------------------ Counters */
function initCounters() {
  const io = new IntersectionObserver((ents, obs) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      obs.unobserve(en.target);
      const el = en.target;
      const target = parseFloat(el.dataset.target);
      const dur = 1500, t0 = performance.now();
      const numEl = el;
      function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target % 1 === 0 ? Math.round(target * eased) : (target * eased).toFixed(0);
        numEl.firstChild.textContent = val;
        if (p < 1) requestAnimationFrame(tick);
      }
      if (reduceMotion) { numEl.firstChild.textContent = target; return; }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });
  $$("[data-target]").forEach((el) => io.observe(el));
}

/* ---------------------------------------------------- Journey (scroll steps) */
function initJourney() {
  const steps = $$(".step");
  const figures = $$(".journey__media figure");
  const fill = $(".journey__line span");
  if (!steps.length) return;
  let active = -1;
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
    figures.forEach((f, k) => f.classList.toggle("is-active", k === i));
    if (fill) fill.style.height = ((i + 1) / steps.length) * 100 + "%";
  };
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (en.isIntersecting) setActive(steps.indexOf(en.target));
    });
  }, { rootMargin: "-45% 0px -45% 0px" });
  steps.forEach((s) => io.observe(s));
  setActive(0);
}

/* -------------------------------------------------------- Before / After */
function initBeforeAfter() {
  const frame = $(".ba__frame");
  if (!frame) return;
  const set = (clientX) => {
    const r = frame.getBoundingClientRect();
    let p = ((clientX - r.left) / r.width) * 100;
    p = Math.max(4, Math.min(96, p));
    frame.style.setProperty("--split", p + "%");
  };
  let dragging = false;
  frame.addEventListener("pointerdown", (e) => { dragging = true; set(e.clientX); frame.setPointerCapture(e.pointerId); });
  frame.addEventListener("pointermove", (e) => { if (dragging) set(e.clientX); });
  frame.addEventListener("pointerup", () => dragging = false);
  frame.addEventListener("pointercancel", () => dragging = false);
  // reveal-driven initial sweep
  const io = new IntersectionObserver((ents, obs) => {
    ents.forEach((en) => {
      if (!en.isIntersecting || reduceMotion) return;
      obs.unobserve(en.target);
      const t0 = performance.now();
      (function sweep(now) {
        const p = Math.min((now - t0) / 1400, 1);
        const eased = 0.5 + Math.sin(p * Math.PI - Math.PI / 2) * 0.5;
        frame.style.setProperty("--split", (30 + eased * 35) + "%");
        if (p < 1) requestAnimationFrame(sweep);
      })(t0);
    });
  }, { threshold: 0.3 });
  io.observe(frame);
}

/* ---------------------------------------------------------- Services bg swap */
function initServices() {
  const rows = $$(".srv");
  const figs = $$(".services__bg figure");
  rows.forEach((row) => {
    row.addEventListener("pointerenter", () => {
      const k = row.dataset.bg;
      figs.forEach((f) => f.classList.toggle("is-active", f.dataset.bg === k));
    });
  });
}

/* ------------------------------------------------------------- Testimonials */
function initQuotes() {
  const quotes = $$(".quote");
  if (!quotes.length) return;
  const cur = $(".quotes__nav .cur");
  let i = 0, timer;
  const show = (n) => {
    i = (n + quotes.length) % quotes.length;
    quotes.forEach((q, k) => q.classList.toggle("is-active", k === i));
    if (cur) cur.textContent = String(i + 1).padStart(2, "0");
  };
  $(".quotes__nav .prev")?.addEventListener("click", () => { show(i - 1); restart(); });
  $(".quotes__nav .next")?.addEventListener("click", () => { show(i + 1); restart(); });
  const restart = () => { clearInterval(timer); if (!reduceMotion) timer = setInterval(() => show(i + 1), 6000); };
  show(0); restart();
  const stage = $(".quotes__stage");
  stage?.addEventListener("pointerenter", () => clearInterval(timer));
  stage?.addEventListener("pointerleave", restart);
}

/* --------------------------------------------------------------- Video */
function initVideo() {
  const stage = $(".filmstrip__stage");
  if (!stage) return;
  const video = $("video", stage);
  const poster = $(".filmstrip__poster", stage);
  const btnPlay = $(".vctrl--play", stage);
  const btnMute = $(".vctrl--mute", stage);
  const btnFull = $(".vctrl--full", stage);
  const iPlay = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  const iPause = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

  const play = () => { video.play(); poster.classList.add("is-hidden"); if (btnPlay) btnPlay.innerHTML = iPause; };
  const pause = () => { video.pause(); if (btnPlay) btnPlay.innerHTML = iPlay; };
  poster?.addEventListener("click", play);
  btnPlay?.addEventListener("click", () => (video.paused ? play() : pause()));
  btnMute?.addEventListener("click", () => {
    video.muted = !video.muted;
    btnMute.dataset.muted = video.muted;
    btnMute.querySelector("span") && (btnMute.querySelector("span").textContent = video.muted ? "Muted" : "Sound");
  });
  btnFull?.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else stage.requestFullscreen?.();
  });
  video.addEventListener("ended", () => { poster.classList.remove("is-hidden"); if (btnPlay) btnPlay.innerHTML = iPlay; });

  // scale-in when in view
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => stage.classList.toggle("is-in", en.isIntersecting));
  }, { threshold: 0.35 });
  io.observe(stage);
}

/* ----------------------------------------------------- Project modal (FLIP) */
const PROJECTS = {
  p1: {
    name: "The Doon Residence",
    meta: "Residential · Interiors — Dehradun · 2025",
    cats: ["Residential", "Interiors"],
    location: "Dehradun, Uttarakhand",
    year: "2025",
    scope: "Design · Build · Interiors",
    area: "— sq. ft.",
    desc: "A ground-up family home carried through to a fully finished interior — fluted-panel feature walls, a handleless modular kitchen and warm, LED-layered joinery. Every surface detailed in-house, from the marble floors to the last cove light.",
    gallery: [
      ["residence-living", "g-wide"], ["residence-kitchen", "g-tall"],
      ["residence-wardrobe", "g-half"], ["residence-bathroom", "g-half"],
      ["residence-living-alt", "g-tall"], ["residence-kitchen-alt", "g-wide"],
    ],
  },
  p2: {
    name: "Skyline Rooftop Structure",
    meta: "Construction — Dehradun · 2024",
    cats: ["Construction", "Structure"],
    location: "Dehradun, Uttarakhand",
    year: "2024",
    scope: "Structural steel · Roofing",
    area: "— sq. ft.",
    desc: "A rooftop steel roof-structure engineered for the Doon valley's climate — from truss framing and site scaffolding through to a finished, weather-sealed shingle roof, all under daily site supervision.",
    gallery: [
      ["construction-frame", "g-wide"], ["construction-steel", "g-tall"],
      ["construction-scaffold", "g-half"], ["roof-finished", "g-half"],
    ],
  },
  p3: {
    name: "Studio & Office Interior",
    meta: "Interior — Neshville Road, Dehradun · 2025",
    cats: ["Interior", "Commercial"],
    location: "Neshville Road, Dehradun",
    year: "2025",
    scope: "Interior design · Fit-out",
    area: "— sq. ft.",
    desc: "Our own studio: a wood-slat ceiling, marble reception, backlit stone panels and a calm consultation lounge — the space where every project begins.",
    gallery: [
      ["office-feature-wall", "g-wide"], ["office-reception", "g-tall"],
      ["office-detail", "g-half"], ["office-lounge", "g-half"],
      ["office-reception-wide", "g-wide"],
    ],
  },
};

// Most images have 480/960/1600/2400; a few smaller sources only go to 960.
const LIMITED = { "residence-bathroom": [480, 960], "logo": [480, 960] };
function srcset(name) {
  const widths = LIMITED[name] || [480, 960, 1600, 2400];
  return widths.map((w) => `assets/img/${name}-${w}.webp ${w}w`).join(", ");
}

function initModal() {
  const modal = $(".modal");
  if (!modal) return;
  const panel = $(".modal__panel", modal);
  const title = $(".modal__bar h3", modal);
  const meta = $(".modal__bar .meta", modal);
  const scroll = $(".modal__scroll", modal);
  let lastFocus = null;

  const open = (key) => {
    const p = PROJECTS[key];
    if (!p) return;
    lastFocus = document.activeElement;
    title.textContent = p.name;
    meta.textContent = p.meta;
    scroll.innerHTML = `
      <div class="modal__intro">
        <p class="lead">${p.desc}</p>
        <div class="modal__spec">
          <div><div class="k">Category</div><div class="v">${p.cats.join(" · ")}</div></div>
          <div><div class="k">Location</div><div class="v">${p.location}</div></div>
          <div><div class="k">Year</div><div class="v">${p.year}</div></div>
          <div><div class="k">Scope</div><div class="v">${p.scope}</div></div>
        </div>
      </div>
      <div class="modal__gallery">
        ${p.gallery.map(([n, cls]) => `
          <figure class="${cls}">
            <img loading="lazy" src="assets/img/${n}-960.webp" srcset="${srcset(n)}"
                 sizes="(max-width:720px) 100vw, 60vw" alt="${p.name} — ${n.replace(/-/g, " ")}">
          </figure>`).join("")}
      </div>`;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (window.__lenis) window.__lenis.stop();
    $(".modal__close", modal).focus();
  };
  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (window.__lenis) window.__lenis.start();
    lastFocus?.focus();
  };
  $$("[data-project]").forEach((el) =>
    el.addEventListener("click", (e) => { e.preventDefault(); open(el.dataset.project); }));
  $(".modal__close", modal)?.addEventListener("click", close);
  $(".modal__scrim", modal)?.addEventListener("click", close);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) close(); });
}

/* ---------------------------------------------- Office strip drag-to-scroll */
function initOffice() {
  const sc = $(".office__scroller");
  if (!sc || !finePointer) return;
  let down = false, startX = 0, startL = 0, moved = 0;
  sc.addEventListener("pointerdown", (e) => {
    down = true; moved = 0; startX = e.clientX; startL = sc.scrollLeft;
    sc.classList.add("is-dragging"); sc.setPointerCapture(e.pointerId);
  });
  sc.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - startX; moved += Math.abs(dx);
    sc.scrollLeft = startL - dx;
  });
  const up = () => { down = false; sc.classList.remove("is-dragging"); };
  sc.addEventListener("pointerup", up);
  sc.addEventListener("pointercancel", up);
  // prevent click navigation after a drag
  sc.addEventListener("click", (e) => { if (moved > 6) { e.preventDefault(); } }, true);
}

/* --------------------------------------------------------------- Footer year */
function initMisc() {
  const y = $("[data-year]"); if (y) y.textContent = new Date().getFullYear();
}

/* ------------------------------------------------- Core init (no deps) */
function initCore() {
  initPreloader();
  initCursor();
  initMagnetic();
  initNav();
  initReveals();
  initCounters();
  initJourney();
  initBeforeAfter();
  initServices();
  initOffice();
  initQuotes();
  initVideo();
  initModal();
  initMisc();
}
initCore();

/* ============================================ Progressive enhancement layer */
(async function enhance() {
  if (reduceMotion) return;

  // ---- Lenis smooth scroll ----
  let lenis = null;
  try {
    const L = (await import("lenis")).default;
    lenis = new L({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    window.__lenis = lenis;
    document.documentElement.classList.add("lenis");
  } catch (e) { /* native scroll is fine */ }

  // ---- GSAP + ScrollTrigger ----
  let gsap = null, ScrollTrigger = null;
  try {
    gsap = (await import("gsap")).default || (await import("gsap")).gsap;
    ScrollTrigger = (await import("gsap/ScrollTrigger")).ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      lenis.on("scroll", () => window.__navScroll && window.__navScroll());
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) { lenis && lenis.raf(t); requestAnimationFrame(raf); });
    }
  } catch (e) {
    if (lenis) requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
  }

  if (gsap && ScrollTrigger) {
    // Hero cinematic parallax: media scales & drifts, content lifts
    gsap.to(".hero__media", {
      scale: 1.18, yPercent: 8, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__inner", {
      yPercent: -14, opacity: 0.15, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    // Project image parallax
    $$(".project__media img").forEach((img) => {
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 8, ease: "none",
        scrollTrigger: { trigger: img.closest(".project"), start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // Reveal stagger polish for cards
    ScrollTrigger.refresh();
  }

  // ---- Three.js architectural massing ----
  try {
    const canvas = $(".statement__canvas");
    if (canvas) {
      const { initArchScene } = await import("./scene3d.js");
      initArchScene(canvas);
    }
  } catch (e) { /* section still reads fine without 3D */ }
})();
