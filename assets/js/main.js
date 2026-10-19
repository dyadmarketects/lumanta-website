/* ==========================================================================
   Lumanta homepage choreography (GSAP + ScrollTrigger + Lenis)
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const seg = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const smooth = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 760px)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const PARTICLES_URL = "assets/data/lumanta-particles.bin";

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  window.lumanta = { get lenis() { return lenis; } };
  const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.6 }) : window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" }));

  /* ---------- Hero video (HD on large screens, 720p on phones) ---------- */
  const video = $("#heroVideo");
  const saveData = navigator.connection && navigator.connection.saveData;
  video.src = (Math.max(innerWidth, innerHeight) > 900 && !saveData) ? video.dataset.srcHd : video.dataset.srcSd;
  video.load();
  const videoReady = new Promise((res) => {
    if (video.readyState >= 3) return res();
    video.addEventListener("canplaythrough", res, { once: true });
    video.addEventListener("loadeddata", () => setTimeout(res, 600), { once: true });
    video.addEventListener("error", res, { once: true });
  });
  const playVideo = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); };
  let heroOnScreen = true;
  new IntersectionObserver((entries) => {
    heroOnScreen = entries[0].isIntersecting;
    if (heroOnScreen) { if (!document.body.classList.contains("is-loading")) playVideo(); } else video.pause();
  }, { threshold: 0 }).observe(document.getElementById("hero"));
  // Loop safety net: restart on "ended" (some browsers ignore loop after a src swap) and nudge playback if it stalls
  video.addEventListener("ended", () => { video.currentTime = 0; playVideo(); });
  // Keep it playing: if the hero is on screen and the browser paused or stalled it, start it again
  let lastT = -1, stuck = 0;
  setInterval(() => {
    if (document.hidden || !heroOnScreen || document.body.classList.contains("is-loading")) return;
    if (video.paused) { playVideo(); stuck = 0; lastT = video.currentTime; return; }
    if (video.currentTime === lastT) {
      if (++stuck >= 2) { stuck = 0; if (video.duration && video.duration - video.currentTime < 0.6) video.currentTime = 0; playVideo(); }
    } else stuck = 0;
    lastT = video.currentTime;
  }, 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && heroOnScreen) playVideo(); });
  // Phones in low power mode block autoplay until the first touch: start it on the first interaction
  ["touchstart", "pointerdown", "keydown", "wheel"].forEach((t) => addEventListener(t, () => { if (heroOnScreen && video.paused) playVideo(); }, { passive: true }));

  /* ---------- Initial hidden states for the hero intro ---------- */
  const heroBits = {
    rise: $$(".headline__rise .ch"),
    above: $$(".headline__above .ch:not(.ch--mark)"),
    mark: $(".ch--mark img"),
    stat: $$(".headline__static .ch"),
    rule: $(".hero__rule"),
    tag: $$(".hero__tag .tl, .hero__desc"),
    stores: $$(".hero__stores .store, .hero__more"),
    cue: $$(".scroll-cue > span"),
    mesh: $("#heroMesh"),
  };
  if (!reduced) {
    gsap.set([...heroBits.rise, ...heroBits.above, ...heroBits.stat], { yPercent: 70, opacity: 0, filter: "blur(10px)" });
    gsap.set(heroBits.mark, { scale: 0.2, rotation: -220, opacity: 0 });
    gsap.set(heroBits.rule, { scaleX: 0 });
    gsap.set([...heroBits.tag, ...heroBits.stores], { y: 26, opacity: 0 });
    gsap.set(heroBits.cue, { opacity: 0, y: 14 });
    gsap.set(heroBits.mesh, { "--mi": 0 });
    gsap.set("#nav", { yPercent: -110 });
  }

  function heroIntro() {
    if (reduced) { gsap.set(heroBits.mesh, { "--mi": 1 }); return; }
    const tl = gsap.timeline();
    tl.to("#nav", { yPercent: 0, duration: 0.8, ease: "power3.out" }, 0.1)
      .fromTo("#heroVideo", { scale: 1.12 }, { scale: 1, duration: 1.8, ease: "power2.out" }, 0)
      .to(heroBits.rise, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1, stagger: 0.05, ease: "expo.out" }, 0.1)
      .to(heroBits.above, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1, stagger: 0.045, ease: "expo.out" }, 0.2)
      .to(heroBits.mark, { scale: 1, rotation: 0, opacity: 1, duration: 1.3, ease: "expo.out" }, 0.28)
      .to(heroBits.stat, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.025, ease: "expo.out" }, 0.32)
      .to(heroBits.rule, { scaleX: 1, duration: 0.9, ease: "expo.inOut" }, 0.4)
      .to(heroBits.tag, { y: 0, opacity: 1, duration: 0.75, stagger: 0.07, ease: "power3.out" }, 0.5)
      .to(heroBits.stores, { y: 0, opacity: 1, duration: 0.7, stagger: 0.07, ease: "power3.out" }, 0.66)
      .to(heroBits.cue, { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" }, 0.85)
      .to(heroBits.mesh, { "--mi": 1, duration: 1.4, ease: "power2.out" }, 0.45);
    return tl;
  }

  const navEl = document.getElementById("nav");
  function setNavTheme(t) { if (navEl.dataset.theme !== t) navEl.dataset.theme = t; }

  /* ==========================================================================
     LOADER
     ========================================================================== */
  const loader = $("#loader");
  function finishLoading() {
    document.body.classList.remove("is-loading");
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
  }

  function runLoader() {
    const MIN = reduced ? 0.3 : 2.6, MAX = 8;
    const t0 = performance.now();
    const bar = $("#loaderBar"), pct = $("#loaderPct");
    const word = $$(".loader__word span"), tag = $(".loader__tag");
    const state = { shown: 0 };
    let dataOk = 0, fontsOk = 0, vidOk = 0;
    const eng = new LumantaParticles($("#loaderCanvas"), { count: mobile ? 36000 : 72000, dprMax: mobile ? 1.5 : 2 });
    if (!eng.ok) document.documentElement.classList.add("no-webgl");

    const progressTick = () => {
      const target = Math.min(1, dataOk * 0.35 + fontsOk * 0.15 + vidOk * 0.5) * Math.min(1, (performance.now() - t0) / (MIN * 1000));
      state.shown += (target - state.shown) * 0.08;
      bar.style.transform = "scaleX(" + state.shown.toFixed(4) + ")";
      pct.textContent = String(Math.round(state.shown * 100)).padStart(2, "0");
    };
    gsap.ticker.add(progressTick);

    // Words of the wordmark appear while the logomark assembles
    if (!reduced) {
      gsap.to(word, { opacity: 1, duration: 0.8, stagger: 0.06, ease: "power2.out", delay: 0.7 });
      gsap.to(tag, { opacity: 1, duration: 0.8, ease: "power2.out", delay: 1.2 });
    } else { gsap.set([word, tag], { opacity: 1 }); }

    const dataP = loadParticleData(PARTICLES_URL).then((d) => {
      dataOk = 1;
      if (!eng.ok) return;
      eng.setData(d);
      const zFit = eng.fitZ(mobile ? 0.62 : 0.46);
      eng.cam.y = 0.6;
      eng.u.alpha = 0.62; eng.u.size = 0.92;
      if (reduced) { eng.u.burst = 1; eng.u.form = 1; eng.cam.z = zFit; }
      else {
        eng.cam.z = zFit + 6; eng.cam.ry = -1.1;
        gsap.timeline()
          .to(eng.u, { burst: 1, duration: 0.9, ease: "power3.out" }, 0)
          .to(eng.u, { form: 1, duration: 1.9, ease: "power2.inOut" }, 0.35)
          .to(eng.cam, { z: zFit, duration: 2.4, ease: "power3.out" }, 0)
          .to(eng.cam, { ry: 0, duration: 2.6, ease: "power3.out" }, 0);
      }
      eng.start((e) => { e.cam.rx = Math.sin(e.u.time * 0.6) * 0.06; });
    }).catch(() => { dataOk = 1; document.documentElement.classList.add("no-webgl"); });

    document.fonts && document.fonts.ready.then(() => { fontsOk = 1; });
    if (!document.fonts) fontsOk = 1;
    videoReady.then(() => { vidOk = 1; });

    const minWait = new Promise((r) => setTimeout(r, MIN * 1000));
    const maxWait = new Promise((r) => setTimeout(r, MAX * 1000));
    Promise.race([Promise.all([dataP, videoReady, minWait, document.fonts ? document.fonts.ready : 0]), maxWait]).then(() => {
      dataOk = fontsOk = vidOk = 1;
      setTimeout(exit, reduced ? 0 : 150);
    });

    function exit() {
      playVideo();
      try { video.currentTime = 0; } catch (e) {}
      if (reduced) {
        gsap.to(loader, { opacity: 0, duration: 0.4, onComplete: done });
        return;
      }
      const tl = gsap.timeline({ onComplete: done });
      tl.to([".loader__brand", ".loader__progress"], { opacity: 0, y: 12, duration: 0.4, ease: "power2.in" }, 0)
        .to(eng.u, { explode: 1, duration: 1.2, ease: "power2.in" }, 0.05)
        .to(eng.cam, { z: 1.2, duration: 1.2, ease: "power3.in" }, 0.05)
        .to(eng.u, { alpha: 0, duration: 0.45, ease: "power1.in" }, 0.8)
        .to(loader, { "--hole": "160vmax", duration: 1, ease: "power2.in" }, 0.35)
        .add(() => { heroIntro(); }, 0.7);
    }
    function done() {
      gsap.ticker.remove(progressTick);
      eng.destroy();
      loader.remove();
      finishLoading();
    }
  }

  /* ==========================================================================
     HERO: wave mesh + scroll exit
     ========================================================================== */
  function heroMesh() {
    const c = $("#heroMesh");
    if (!c || mobile || reduced) return;
    const ctx = c.getContext("2d");
    let W = 0, H = 0, dpr = 1, raf = 0, on = false;
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = c.width = c.clientWidth * dpr; H = c.height = c.clientHeight * dpr; };
    size(); addEventListener("resize", size);
    const LINES = 22, CROSS = 34;
    const pt = (u, v, t) => {
      const cy = H * (0.86 - 0.5 * u) + Math.sin(u * 4.2 + t * 0.45) * H * 0.07;
      const thick = H * (0.05 + 0.3 * Math.pow(Math.sin(u * Math.PI * 0.95 + 0.1), 1.4));
      const tw = Math.cos(u * 5.2 - t * 0.35);
      return [u * W, cy + (v - 0.5) * thick * tw + Math.sin(u * 11 + v * 3 + t * 0.9) * H * 0.01];
    };
    function draw(ts) {
      const t = ts / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1 * dpr;
      for (let i = 0; i < LINES; i++) {
        const v = i / (LINES - 1);
        const a = (0.12 + 0.3 * Math.sin(v * Math.PI)).toFixed(3), g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, "rgba(30,111,217,0)"); g.addColorStop(0.08, "rgba(30,111,217," + a + ")");
        g.addColorStop(0.7, "rgba(30,111,217," + a + ")"); g.addColorStop(1, "rgba(30,111,217,0)");
        ctx.strokeStyle = g;
        ctx.beginPath();
        for (let k = 0; k <= 90; k++) { const p = pt(k / 90, v, t); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
        ctx.stroke();
      }
      for (let j = 1; j < CROSS; j++) {
        const u = j / CROSS; ctx.beginPath();
        ctx.strokeStyle = "rgba(30,111,217," + (0.13 * Math.min(1, u / 0.08, (1 - u) / 0.3)).toFixed(3) + ")";
        for (let k = 0; k <= 10; k++) { const p = pt(u, k / 10, t); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
        ctx.stroke();
      }
      if (on) raf = requestAnimationFrame(draw);
    }
    ScrollTrigger.create({ trigger: ".hero-wrap", start: "top bottom", end: "bottom top",
      onToggle: (s) => { on = s.isActive; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(draw); } });
  }

  function heroScroll() {
    if (reduced) return;
    gsap.timeline({ scrollTrigger: { trigger: ".hero-wrap", start: "top top", end: "bottom bottom", scrub: 0.6 } })
      .to(".hero__content", { y: () => -innerHeight * 0.16, opacity: 0, ease: "power1.in" }, 0)
      .to(".headline__rise", { y: -50, ease: "none" }, 0)
      .to(".headline__static", { y: 30, ease: "none" }, 0)
      .fromTo(".scroll-cue", { opacity: 1, y: 0 }, { opacity: 0, y: 30, duration: 0.25, immediateRender: false }, 0)
      .fromTo(".hero__mesh", { "--mo": 1 }, { "--mo": 0, duration: 0.6, immediateRender: false }, 0);

    // Cards arrive in a soft stagger as they slide over the hero
    $$(".pillar").forEach((card, i) => {
      gsap.fromTo(card, { y: (mobile ? (i % 2) * 60 : i * 70) }, { y: 0, ease: "none",
        scrollTrigger: { trigger: ".hero-wrap", start: "top top", end: "bottom bottom", scrub: 0.6 } });
    });
  }

  /* ---------- Pillar icons draw themselves ---------- */
  function pillarIcons() {
    $$(".pillar").forEach((card) => {
      const shapes = $$("path, circle", $(".pillar__icon", card));
      shapes.forEach((s) => { const L = s.getTotalLength ? s.getTotalLength() : 60; s.style.strokeDasharray = L; s.style.strokeDashoffset = reduced ? 0 : L; s.dataset.len = L; });
      if (reduced) return;
      gsap.to(shapes, { strokeDashoffset: 0, ease: "power2.out", stagger: 0.12,
        scrollTrigger: { trigger: card, start: "top 92%", end: "top 40%", scrub: 0.6 } });
      gsap.fromTo($(".pillar__icon", card), { scale: 0.6, rotation: -30, opacity: 0.2 }, { scale: 1, rotation: 0, opacity: 1, ease: "power2.out",
        scrollTrigger: { trigger: card, start: "top 92%", end: "top 40%", scrub: 0.6 } });
      gsap.to($(".pillar__icon", card), { opacity: 0, y: -30, ease: "power1.in",
        scrollTrigger: { trigger: card, start: "top 10%", end: "top -20%", scrub: 0.6 } });
    });
  }

  /* ==========================================================================
     Generic intro + exit reveals for every [data-anim] asset
     ========================================================================== */
  function splitWords(el) {
    const out = document.createDocumentFragment();
    const wrap = (text, grad) => text.split(/(\s+)/).forEach((t) => {
      if (!t) return;
      if (/^\s+$/.test(t)) { out.appendChild(document.createTextNode(" ")); return; }
      const s = document.createElement("span"); s.className = "w" + (grad ? " g" : ""); s.textContent = t; out.appendChild(s);
    });
    Array.from(el.childNodes).forEach((n) => {
      if (n.nodeType === 3) wrap(n.textContent, false);
      else if (n.nodeName === "EM") wrap(n.textContent, true);
      else out.appendChild(n.cloneNode(true));
    });
    el.textContent = ""; el.appendChild(out);
  }

  function reveals() {
    $$("[data-anim]").forEach((el) => {
      const type = el.dataset.anim;
      if (type === "words") {
        splitWords(el);
        if (reduced) return;
        gsap.fromTo($$(".w", el), { "--in": 0 }, { "--in": 1, ease: "none", stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 86%", end: "bottom 52%", scrub: 0.7 } });
      } else if (!reduced) {
        gsap.fromTo(el, { "--in": 0 }, { "--in": 1, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 97%", end: "top 70%", scrub: 0.7 } });
      }
      if (!reduced) {
        gsap.fromTo(el, { "--out": 1 }, { "--out": 0, ease: "power1.in", immediateRender: false,
          scrollTrigger: { trigger: el, start: "bottom 24%", end: "bottom -4%", scrub: 0.7 } });
      }
    });
    // Founder portrait drifts inside its arch
    // Parallax for the join background
    if (!reduced) gsap.fromTo(".join__bg", { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: ".join", start: "top bottom", end: "bottom top", scrub: true } });
  }

  /* ==========================================================================
     THE STATIC: noise -> logomark -> light, driven by scroll
     ========================================================================== */
  function staticSection() {
    const section = $("#static"), stage = $(".static__stage");
    const c1 = $(".static__copy--1"), c2 = $(".static__copy--2"), c3 = $(".static__copy--3"), hint = $(".static__hint");
    const eng = new LumantaParticles($("#staticCanvas"), { count: mobile ? 30000 : 72000, dprMax: mobile ? 1.5 : 2 });
    if (!eng.ok) document.documentElement.classList.add("no-webgl");
    const night = [10, 15, 36], off = [250, 247, 245];
    let target = 0, cur = 0, mx = 0, my = 0, loaded = false;

    loadParticleData(PARTICLES_URL).then((d) => { if (eng.ok) { eng.setData(d); loaded = true; } });
    Object.assign(eng.u, { burst: 1, useStatic: 1, staticAmt: 1, form: 0, additive: 1, light: 0 });

    let pulse = 0, releaseT = 0;
    hint.textContent = finePointer ? "Move your cursor through the light" : "Touch the light";
    if (finePointer) {
      stage.addEventListener("pointermove", (e) => { eng.setMouse(e.clientX, e.clientY); mx = (e.clientX / innerWidth) * 2 - 1; my = (e.clientY / innerHeight) * 2 - 1; });
      stage.addEventListener("pointerleave", () => { eng.mouse.has = false; mx = my = 0; });
      stage.addEventListener("pointerdown", () => { pulse = 1.3; });
    }
    // Touch: tap or drag a finger through the light (passive, so the page still scrolls)
    const touchAt = (e) => {
      const t = e.touches && e.touches[0]; if (!t) return;
      clearTimeout(releaseT);
      eng.setMouse(t.clientX, t.clientY); mx = (t.clientX / innerWidth) * 2 - 1; my = (t.clientY / innerHeight) * 2 - 1;
    };
    stage.addEventListener("touchstart", (e) => { touchAt(e); pulse = 1.4; }, { passive: true });
    stage.addEventListener("touchmove", touchAt, { passive: true });
    stage.addEventListener("touchend", () => { releaseT = setTimeout(() => { eng.mouse.has = false; mx = my = 0; }, 1100); }, { passive: true });

    // Progress in "vh scrolled since the section's top reached the viewport bottom"
    const total = () => (section.offsetHeight / innerHeight) * 100;   // 430
    ScrollTrigger.create({ trigger: section, start: "top bottom", end: "bottom bottom",
      onUpdate: (s) => { target = s.progress; } });
    let underNav = false;
    ScrollTrigger.create({ trigger: section, start: () => "top " + (navEl.offsetHeight / 2) + "px", end: () => "bottom " + (navEl.offsetHeight / 2) + "px",
      onToggle: (s) => { underNav = s.isActive; } });
    ScrollTrigger.create({ trigger: section, start: "top bottom", end: "bottom top",
      onToggle: (s) => { if (s.isActive && loaded !== null) eng.start(frame); else eng.stop(); } });

    function apply(p) {
      const T = total(), s = p * T; // s in vh
      const rs = (a, b) => seg(s, a, b);
      const form = reduced ? 1 : smooth(rs(190, 330));
      const light = reduced ? 1 : smooth(rs(292, 352));
      const u = eng.u;
      u.form = form;
      u.staticAmt = 1 - rs(190, 270);
      u.light = light; u.additive = 1 - light;
      u.size = (mobile ? 1.15 : 1) * (0.95 - 0.12 * light);
      u.rise = smooth(rs(T - 26, T + 40));
      u.alpha = 1 - rs(T - 6, T + 50) * 0.9;
      u.mouseOn = form > 0.97 && s < T - 20 ? 1 + pulse : 0;
      const zWide = eng.fitZ(mobile ? 0.5 : 0.42) * 0.9, zLogo = eng.fitZ(mobile ? 0.86 : 0.64);
      eng.cam.z = mix(zWide, zLogo, form);
      eng.cam.y = mix(0, 0.25, form);
      const bg = night.map((v, i) => Math.round(mix(v, off[i], light)));
      stage.style.backgroundColor = "rgb(" + bg.join(",") + ")";
      if (underNav) setNavTheme(light > 0.5 ? "light" : "dark");
      // copy timings
      const o1 = rs(30, 95) * (1 - rs(165, 195));
      const o2 = rs(212, 238) * (1 - rs(285, 308));
      const o3 = rs(342, 372) * (1 - rs(T - 18, T + 6));
      c1.style.opacity = o1; c1.style.transform = "translateY(" + ((1 - rs(30, 95)) * 40 - rs(165, 195) * 40) + "px)";
      c2.style.opacity = o2; c2.style.transform = "translateY(" + ((1 - rs(212, 238)) * 40 - rs(285, 308) * 40) + "px)";
      c3.style.opacity = o3; c3.style.transform = "scale(" + (0.94 + 0.06 * rs(342, 372)) + ") translateY(" + (-rs(T - 18, T + 6) * 40) + "px)";
      c3.style.filter = "blur(" + ((1 - rs(342, 372)) * 8).toFixed(2) + "px)";
      hint.style.opacity = rs(372, 388) * (1 - rs(T - 30, T - 14));
    }

    function frame(e) {
      cur += (target - cur) * (reduced ? 1 : 0.12);
      pulse *= 0.94;
      apply(cur);
      const f = e.u.form;
      e.cam.ry = Math.sin(f * Math.PI) * 0.75 + Math.sin(e.u.time * 0.35) * 0.2 * f + mx * 0.18 * f;
      e.cam.rx = Math.sin(f * Math.PI) * 0.12 + my * 0.1 * f;
    }
    apply(0);
  }

  /* ==========================================================================
     THE APP: pinned phone walkthrough of Catch / Shift / Rise / Repeat
     ========================================================================== */
  function appSection() {
    const steps = $$(".app__steps li"), phone = $("#phone"), glows = $$(".app__glow");
    const icons = $$(".phone__icons svg"), cards = $$(".phone__card"), dots = $$(".phone__dots i");
    const colors = ["var(--ember)", "var(--glow)", "var(--aqua)", "var(--lumen)"];
    let current = -1;
    function setStep(i) {
      if (i === current) return; current = i;
      [steps, icons, cards, dots].forEach((list) => list.forEach((n, k) => n.classList.toggle("is-active", k === i)));
      phone.style.setProperty("--sc", colors[i]);
      glows.forEach((g) => g.style.setProperty("--sc", colors[i]));
    }
    setStep(0);
    const st = ScrollTrigger.create({ trigger: ".app", start: "top top", end: "bottom bottom",
      onUpdate: (s) => setStep(clamp(Math.floor((s.progress - 0.06) / 0.235), 0, 3)) });
    steps.forEach((li, i) => li.addEventListener("click", () => scrollToY(st.start + (st.end - st.start) * (0.08 + i * 0.235 + 0.1))));

    if (reduced) return;
    // Enter: the phone floats up and straightens, text slides in
    gsap.timeline({ scrollTrigger: { trigger: ".app", start: "top bottom", end: "top top", scrub: 0.7 } })
      .fromTo(".app__device", { y: () => innerHeight * 0.35, rotation: 8, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, ease: "power2.out" }, 0)
      .fromTo(".app__text > *", { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, ease: "power2.out" }, 0.2);
    // Exit: everything lifts away
    gsap.timeline({ scrollTrigger: { trigger: ".app", start: "bottom bottom", end: "bottom 15%", scrub: 0.7 } })
      .to(".app__device", { y: () => -innerHeight * 0.2, opacity: 0, ease: "power1.in" }, 0)
      .to(".app__text", { y: -80, opacity: 0, ease: "power1.in" }, 0);
    // A pronounced float on the phone
    gsap.to(phone, { y: -30, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.fromTo(phone, { rotation: -1.6 }, { rotation: 1.6, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1 });

    // Particle rings radiating from behind the phone in the current step's color
    const rc = $("#appRings"), rx = rc.getContext("2d");
    const hex = ["#ff9a3c", "#ff5f8a", "#2edfcf", "#1e6fd9"];
    let rings = [], lastSpawn = -9, on = false, raf = 0, dpr = 1, RW = 0, RH = 0;
    const rsize = () => { dpr = Math.min(devicePixelRatio || 1, 2); RW = rc.width = rc.clientWidth * dpr; RH = rc.height = rc.clientHeight * dpr; };
    rsize(); addEventListener("resize", rsize);
    const spawn = (t) => {
      const n = mobile ? 80 : 140, dots = [];
      for (let k = 0; k < n; k++) dots.push({ a: (k / n) * Math.PI * 2 + Math.random() * 0.06, j: (Math.random() - 0.5) * 0.08, s: 1 + Math.random() * 2.2, o: 0.55 + Math.random() * 0.45 });
      rings.push({ t0: t, c: hex[Math.max(0, current)], dots, spin: (Math.random() - 0.5) * 0.8 });
    };
    const LIFE = 4.4;
    function drawRings(ts) {
      const t = ts / 1000;
      if (t - lastSpawn > 1.15) { spawn(t); lastSpawn = t; }
      rx.clearRect(0, 0, RW, RH);
      const cx = RW / 2, cy = RH / 2, base = Math.min(RW, RH) * 0.16, maxR = Math.min(RW, RH) * 0.5;
      rings = rings.filter((r) => t - r.t0 < LIFE);
      for (const r of rings) {
        const life = (t - r.t0) / LIFE, R = base + (maxR - base) * (1 - Math.pow(1 - life, 2.2));
        const fade = Math.sin(Math.PI * Math.min(1, life)) * 0.9;
        rx.fillStyle = r.c;
        for (const d of r.dots) {
          const ang = d.a + r.spin * life, rr = R * (1 + d.j);
          rx.globalAlpha = fade * d.o;
          rx.beginPath(); rx.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, d.s * dpr * (1.25 - life * 0.5), 0, Math.PI * 2); rx.fill();
        }
      }
      rx.globalAlpha = 1;
      if (on) raf = requestAnimationFrame(drawRings);
    }
    ScrollTrigger.create({ trigger: ".app", start: "top bottom", end: "bottom top",
      onToggle: (s) => { on = s.isActive; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(drawRings); } });
  }

  /* ==========================================================================
     UI: nav, menu, anchors, FAQ, form
     ========================================================================== */
  function ui() {
    const nav = $("#nav"), burger = $("#burger"), menu = $("#menu");
    const onScroll = (y) => {
      nav.style.setProperty("--nav-a", (0.94 - 0.28 * clamp(y / 500, 0, 1)).toFixed(3));
    };
    onScroll(0);
    $$("[data-nav]").forEach((sec) => {
      if (sec.dataset.nav === "auto") return;
      ScrollTrigger.create({ trigger: sec, start: () => "top " + (nav.offsetHeight / 2) + "px", end: () => "bottom " + (nav.offsetHeight / 2) + "px",
        onToggle: (s) => { if (s.isActive) setNavTheme(sec.dataset.nav); } });
    });
    if (lenis) lenis.on("scroll", (l) => onScroll(l.scroll)); else addEventListener("scroll", () => onScroll(scrollY), { passive: true });

    // Current section highlight
    $$(".nav__links a[href^='#']").forEach((a) => {
      const sec = $(a.getAttribute("href")); if (!sec) return;
      ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onToggle: (s) => a.classList.toggle("is-current", s.isActive) });
    });

    const toggleMenu = (open) => {
      menu.classList.toggle("is-open", open); menu.setAttribute("aria-hidden", !open);
      burger.setAttribute("aria-expanded", open); burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    burger.addEventListener("click", () => toggleMenu(!menu.classList.contains("is-open")));

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href^='#']"); if (!a) return;
      const id = a.getAttribute("href");
      const el = id === "#top" ? document.body : $(id);
      if (!el) return;
      e.preventDefault();
      if (menu.classList.contains("is-open")) toggleMenu(false);
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 80;
      let y = id === "#top" ? 0 : el.getBoundingClientRect().top + (lenis ? lenis.scroll : scrollY);
      if (["#research", "#donate", "#about", "#founder", "#what"].includes(id)) y -= navH + 10;
      if (id === "#method") y = $(".hero-wrap").offsetHeight - innerHeight;
      scrollToY(y);
    });

    $$(".faq__q").forEach((q) => q.addEventListener("click", () => {
      const open = q.getAttribute("aria-expanded") === "true";
      $$(".faq__q").forEach((o) => o.setAttribute("aria-expanded", "false"));
      q.setAttribute("aria-expanded", String(!open));
      setTimeout(() => ScrollTrigger.refresh(), 650);
    }));

    $("#joinForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.currentTarget, t = $("#joinThanks");
      gsap.to(f, { opacity: 0, y: -10, duration: 0.4, onComplete: () => { f.hidden = true; t.hidden = false; gsap.fromTo(t, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }); } });
    });
  }

  /* ---------- Boot ---------- */
  ui();
  heroMesh();
  heroScroll();
  pillarIcons();
  reveals();
  staticSection();
  appSection();
  runLoader();
  addEventListener("load", () => { if (document.body.classList.contains("is-loading")) { window.scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); } ScrollTrigger.refresh(); });
  addEventListener("beforeunload", () => window.scrollTo(0, 0));
  addEventListener("pageshow", (e) => { if (e.persisted) { window.scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true }); } });
})();
