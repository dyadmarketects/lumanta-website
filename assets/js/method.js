/* Lumanta method pages (Catch, Shift, Rise): drifting words, parallax, the light ring around the hero portal,
   the scroll-driven logomark stage and the small interactive demos. pages.js handles nav, menu, reveals and FAQ. */
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const mobile = matchMedia("(max-width: 760px)").matches;
  const MODE = document.body.dataset.mode || "catch";
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const seg = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const smooth = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;
  const COLORS = ["#ff9a3c", "#ff5f8a", "#1e6fd9", "#2edfcf", "#ffb86b", "#8fd0ff"];

  /* ---------- Words drift in, one at a time ---------- */
  $$("[data-split]").forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const w = document.createElement("span"); w.className = "w"; w.style.setProperty("--i", i++); w.textContent = p; frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("w")) {
          if (n.matches("em, strong, b, a, span:not(.w)") && !n.children.length && !/\s/.test(n.textContent.trim())) {
            n.classList.add("w"); n.style.setProperty("--i", i++);   // a single highlighted word moves as one
          } else walk(n);
        }
      });
    };
    walk(el);
  });
  const splits = $$("[data-split]");
  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
    splits.forEach((el) => io.observe(el));
  } else splits.forEach((el) => el.classList.add("in"));

  /* ---------- Parallax: hero portal and the join background ---------- */
  const portalImg = $(".mh__portal img"), joinBg = $(".join__bg img");
  const portalTop0 = portalImg ? portalImg.parentElement.getBoundingClientRect().top + scrollY : 0;
  let ticking = false;
  function parallax() {
    ticking = false;
    if (reduced) return;
    const vh = innerHeight;
    if (portalImg) {   // the photo drifts up a little slower than the page (its frame is 14% taller than the portal)
      const r = portalImg.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) portalImg.style.setProperty("--py", Math.max(-r.height * 0.13, Math.min(0, (r.top - portalTop0) * 0.14)).toFixed(1) + "px");
    }
    if (joinBg) { const r = joinBg.parentElement.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) joinBg.style.setProperty("--py", (-(r.top + r.height / 2 - vh / 2) * 0.18).toFixed(1) + "px"); }
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
  parallax();

  /* ---------- Hero: a ring of light around the portal that answers your cursor ---------- */
  const ringCanvas = $(".mh__ring");
  if (ringCanvas) {
    const x = ringCanvas.getContext("2d");
    let W = 0, H = 0, dpr = 1, P = [], visible = true, t = 0;
    const ptr = { x: -9999, y: -9999, on: false };
    const N = coarse ? 150 : 280;
    const spawn = (p, fresh) => {
      p.a = Math.random() * Math.PI * 2; p.r = 0.9 + Math.random() * 0.28; p.s = 0.7 + Math.random() * 2; p.w = (Math.random() < 0.5 ? -1 : 1) * (0.0012 + Math.random() * 0.0026);
      p.c = COLORS[(Math.random() * COLORS.length) | 0]; p.al = 0.35 + Math.random() * 0.55; p.off = 0; p.lift = 0; p.life = fresh ? Math.random() : 0;
      p.x = W / 2; p.y = H / 2; p.vx = 0; p.vy = 0; p.calm = 0;
    };
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = ringCanvas.clientWidth; H = ringCanvas.clientHeight;
      ringCanvas.width = W * dpr; ringCanvas.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!P.length) P = Array.from({ length: N }, () => { const p = {}; spawn(p, true); return p; });
      P.forEach((p) => { const [tx, ty] = home(p); p.x = tx; p.y = ty; });
    }
    function home(p) {
      const rx = W * 0.36 * p.r, ry = H * 0.43 * p.r;
      return [W / 2 + Math.cos(p.a) * rx * (1 + p.off), H / 2 + Math.sin(p.a) * ry * (1 + p.off) - p.lift];
    }
    size(); addEventListener("resize", size);
    const media = ringCanvas.parentElement;
    const move = (cx, cy) => { const r = ringCanvas.getBoundingClientRect(); ptr.x = cx - r.left; ptr.y = cy - r.top; ptr.on = true; };
    media.addEventListener("pointermove", (e) => move(e.clientX, e.clientY));
    media.addEventListener("pointerleave", () => { ptr.on = false; });
    addEventListener("touchmove", (e) => { const tt = e.touches[0]; if (tt && media.contains(e.target)) move(tt.clientX, tt.clientY); }, { passive: true });
    addEventListener("touchend", () => { ptr.on = false; }, { passive: true });
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !reduced) requestAnimationFrame(frame); }).observe(ringCanvas);

    function frame() {
      t += 1 / 60;
      x.clearRect(0, 0, W, H);
      for (const p of P) {
        p.a += p.w;
        if (MODE === "catch") {                       // restless static that settles into a calm ring
          p.calm = Math.min(1, p.calm + 0.004);
          if (Math.random() < 0.002) p.calm = 0;
          const j = (1 - p.calm) * 2.2; p.vx += (Math.random() - 0.5) * j; p.vy += (Math.random() - 0.5) * j;
        } else if (MODE === "shift") {                // now and then a particle lets go and drifts away
          p.life += 0.0016;
          if (p.life > 0.7) { p.off += 0.006; p.al *= 0.992; }
          if (p.life > 1 || p.al < 0.03) spawn(p, false);
        } else {                                      // rise: everything floats gently upward
          p.lift += 0.35 + p.s * 0.12;
          if (p.lift > H * 0.55) { spawn(p, false); p.lift = -H * 0.08; }
        }
        const [hx, hy] = home(p);
        p.vx += (hx - p.x) * 0.02; p.vy += (hy - p.y) * 0.02;
        if (ptr.on) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y, d = Math.hypot(dx, dy), R = 120;
          if (d < R) { const k = (1 - d / R); p.vx += (-dy / (d || 1)) * k * 1.6 + (dx / (d || 1)) * k * 0.6; p.vy += (dx / (d || 1)) * k * 1.6 + (dy / (d || 1)) * k * 0.6; }
        }
        p.vx *= 0.86; p.vy *= 0.86; p.x += p.vx; p.y += p.vy;
        const fade = MODE === "rise" ? Math.min(1, (H * 0.55 - p.lift) / (H * 0.2)) : 1;
        x.globalAlpha = Math.max(0, p.al * fade * (0.75 + 0.25 * Math.sin(t * 2 + p.a * 3)));
        x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, p.s, 0, Math.PI * 2); x.fill();
      }
      x.globalAlpha = 1;
      if (visible && !reduced) requestAnimationFrame(frame);
    }
    if (reduced) frame(); else requestAnimationFrame(frame);
  }

  /* ---------- The logomark stage: catch it, let it go, rise ---------- */
  const stageSec = $(".mstage");
  if (stageSec && window.LumantaParticles) {
    const stage = $(".mstage__stage", stageSec), canvas = $(".mstage__canvas", stageSec), copies = $$(".mstage__copy", stageSec), hint = $(".mstage__hint", stageSec);
    const eng = new LumantaParticles(canvas, { count: mobile ? 22000 : 60000, dprMax: mobile ? 1.25 : 1.75 });
    if (!eng.ok) document.documentElement.classList.add("no-webgl");
    let loaded = false, target = 0, cur = 0, mx = 0, my = 0, pulse = 0, running = false;
    loadParticleData("assets/data/lumanta-particles.bin").then((d) => { if (eng.ok) { eng.setData(d); loaded = true; } }).catch(() => document.documentElement.classList.add("no-webgl"));
    Object.assign(eng.u, MODE === "catch"
      ? { burst: 1, useStatic: 1, staticAmt: 1, form: 0, additive: 1, light: 0 }
      : { burst: 1, useStatic: 1, staticAmt: 0, form: 1, additive: 1, light: 0 });
    if (hint) hint.textContent = coarse ? "Touch the light" : "Move your cursor through the light";
    const point = (cx, cy) => { eng.setMouse(cx, cy); mx = (cx / innerWidth) * 2 - 1; my = (cy / innerHeight) * 2 - 1; };
    stage.addEventListener("pointermove", (e) => point(e.clientX, e.clientY));
    stage.addEventListener("pointerleave", () => { eng.mouse.has = false; mx = my = 0; });
    stage.addEventListener("pointerdown", () => { pulse = 0.9; });
    stage.addEventListener("touchstart", (e) => { const tt = e.touches[0]; if (tt) point(tt.clientX, tt.clientY); pulse = 0.9; }, { passive: true });
    stage.addEventListener("touchmove", (e) => { const tt = e.touches[0]; if (tt) point(tt.clientX, tt.clientY); }, { passive: true });
    stage.addEventListener("touchend", () => setTimeout(() => { eng.mouse.has = false; mx = my = 0; }, 350), { passive: true });
    const night = [10, 15, 36], off = [250, 247, 245], navEl = $("#nav");
    const windows = { catch: [[0.02, 0.24], [0.3, 0.52], [0.62, 0.97]], shift: [[0.03, 0.28], [0.36, 0.6], [0.68, 0.97]], rise: [[0.03, 0.28], [0.34, 0.56], [0.64, 0.97]] }[MODE];
    function progress() {
      const r = stageSec.getBoundingClientRect(), span = stageSec.offsetHeight - innerHeight;
      return clamp(-r.top / (span || 1), 0, 1);
    }
    function apply(p) {
      const u = eng.u;
      let light = 0;
      if (MODE === "catch") {
        u.form = reduced ? 1 : smooth(seg(p, 0.18, 0.62)); u.staticAmt = 1 - seg(p, 0.16, 0.5); u.explode = 0; u.rise = 0;
      } else if (MODE === "shift") {
        u.form = 1; u.staticAmt = 0; u.explode = reduced ? 0 : smooth(seg(p, 0.34, 0.9)) * 0.42; u.rise = reduced ? 0 : smooth(seg(p, 0.6, 1)) * 0.25;
        u.alpha = 1 - seg(p, 0.6, 1) * 0.5;
      } else {
        u.form = 1; u.staticAmt = 0; light = reduced ? 1 : smooth(seg(p, 0.3, 0.62)); u.rise = reduced ? 0 : smooth(seg(p, 0.58, 1)) * 0.75; u.alpha = 1 - seg(p, 0.85, 1) * 0.6;
      }
      u.light = light; u.additive = 1 - light;
      u.size = (mobile ? 1.15 : 1) * (0.95 - 0.12 * light);
      u.mouseOn = u.form > 0.97 ? 1 + pulse : 0;
      const zWide = eng.fitZ(mobile ? 0.5 : 0.42) * 0.9, zLogo = eng.fitZ(mobile ? 0.62 : 0.52);
      eng.cam.z = mix(zWide, zLogo, u.form); eng.cam.y = mix(0, -0.6, u.form);
      const bg = night.map((v, i) => Math.round(mix(v, off[i], light)));
      stage.style.backgroundColor = "rgb(" + bg.join(",") + ")";
      stageSec.classList.toggle("is-light", light > 0.5);
      if (navEl) { const r = stageSec.getBoundingClientRect(), y = navEl.offsetHeight / 2; navEl.dataset.theme = r.top < y && r.bottom > y && light < 0.5 ? "dark" : "light"; }
      copies.forEach((c, i) => {
        const [a, b] = windows[i] || [0, 0], fadeIn = seg(p, a, a + 0.06), fadeOut = i === copies.length - 1 ? 0 : seg(p, b - 0.06, b);
        const o = reduced ? (i === 0 ? 1 : 0) : fadeIn * (1 - fadeOut);
        c.style.opacity = o.toFixed(3);
        c.style.transform = "translate3d(0," + ((1 - fadeIn) * 30 - fadeOut * 30).toFixed(1) + "px,0)";
      });
      if (hint) hint.style.opacity = (seg(p, 0.05, 0.12) * (1 - seg(p, 0.9, 0.98))).toFixed(3);
    }
    function frame(e) {
      target = progress();
      cur += (target - cur) * (reduced ? 1 : 0.12);
      pulse *= 0.94;
      apply(cur);
      const f = e.u.form;
      e.cam.ry = Math.sin(e.u.time * 0.3) * (mobile ? 0.12 : 0.22) * f + mx * (mobile ? 0.06 : 0.18) * f + (MODE === "catch" ? Math.sin(f * Math.PI) * 0.6 : 0);
      e.cam.rx = my * 0.1 * f;
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => {
        const on = es[0].isIntersecting;
        if (on && !running && eng.ok) { running = true; eng.start(frame); } else if (!on && running) { running = false; eng.stop(); if (navEl) navEl.dataset.theme = "light"; }
      }, { rootMargin: "100px 0px" }).observe(stageSec);
    }
    apply(0);
  }

  /* ---------- Demos ---------- */
  const fb = $(".phone__feedback");
  const say = (line) => { if (fb) fb.innerHTML = "<span>" + line + "</span>"; };
  const ripple = (el) => { const r = document.createElement("span"); r.className = "mdemo__ripple"; el.appendChild(r); setTimeout(() => r.remove(), 1200); };

  if (MODE === "catch") {
    const LINES = ["You noticed.", "You caught it.", "There it is.", "That&rsquo;s awareness.", "You caught the thought.", "Notice. That&rsquo;s enough.", "Another moment of awareness.", "Awareness begins here."];
    const count = $(".phone__count b"), arc = $(".phone__arc");
    let n = 0, k = 0;
    $$(".phone--demo [data-kind]").forEach((b) => b.addEventListener("click", () => {
      n++; if (count) count.textContent = n;
      if (arc) arc.style.setProperty("--arc", String(Math.max(0, 100 - Math.min(100, 12 + n * 11))));
      b.classList.add("is-tap"); setTimeout(() => b.classList.remove("is-tap"), 220);
      ripple(b);
      say(LINES[k++ % LINES.length] + (b.dataset.kind !== "negative" ? "" : ""));
    }));
  }

  if (MODE === "shift") {
    const THOUGHTS = ["What if I mess this up?", "They probably think I&rsquo;m not good enough.", "I always get this wrong.", "Something bad is going to happen.", "Why can&rsquo;t I be more like them?"];
    const LINES = ["Notice it. Let it go.", "You don&rsquo;t have to carry that thought.", "Let it pass.", "No need to follow it.", "Watch it pass.", "You noticed it. Now let it go."];
    const card = $(".thought"), q = card && $("q", card), btn = $(".release"), cv = $(".drift-canvas");
    let i = 0;
    const burst = () => {
      if (!cv || reduced) return;
      const scr = cv.parentElement, sr = scr.getBoundingClientRect(), tr = card.getBoundingClientRect();
      const ctx = cv.getContext("2d"), d = Math.min(devicePixelRatio || 1, 2);
      cv.width = sr.width * d; cv.height = sr.height * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      const ps = Array.from({ length: 140 }, () => ({ x: tr.left - sr.left + Math.random() * tr.width, y: tr.top - sr.top + Math.random() * tr.height,
        vx: (Math.random() - 0.5) * 0.8, vy: -0.4 - Math.random() * 1.4, s: 0.6 + Math.random() * 1.8, c: COLORS[(Math.random() * COLORS.length) | 0], a: 1 }));
      let f = 0;
      (function tick() {
        ctx.clearRect(0, 0, sr.width, sr.height);
        ps.forEach((p) => { p.x += p.vx + Math.sin((f + p.y) * 0.05) * 0.3; p.y += p.vy; p.vy *= 0.995; p.a *= 0.975;
          ctx.globalAlpha = p.a; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill(); });
        if (++f < 150) requestAnimationFrame(tick); else ctx.clearRect(0, 0, sr.width, sr.height);
      })();
    };
    btn && btn.addEventListener("click", () => {
      btn.disabled = true; burst(); card.classList.add("is-gone"); say(LINES[i % LINES.length]);
      setTimeout(() => { i++; q.innerHTML = THOUGHTS[i % THOUGHTS.length]; card.classList.remove("is-gone"); btn.disabled = false; }, 1700);
    });
  }

  if (MODE === "rise") {
    const LINES = { ideas: "Your next idea needs somewhere to land.", creativity: "Make space for creativity.", connection: "Make space for connection.", calm: "Less static. More space.", possibility: "Make space for something you haven&rsquo;t imagined yet." };
    const orb = $(".space-orb"), ob = orb && $("b", orb), os = orb && $("small", orb);
    $$(".space-chips button").forEach((b) => b.addEventListener("click", () => {
      b.classList.toggle("is-on"); b.setAttribute("aria-pressed", b.classList.contains("is-on"));
      const on = $$(".space-chips .is-on").length;
      orb.style.setProperty("--fill", String(on * 20));
      if (on === 5) { ob.innerHTML = "Free Up Space. See what&rsquo;s possible."; os.textContent = "Look what you've started."; }
      else if (b.classList.contains("is-on")) { ob.innerHTML = LINES[b.dataset.fill]; os.textContent = on + " of 5"; }
      else { ob.innerHTML = on ? "What else could fill that space?" : "What could fill that space?"; os.textContent = on ? on + " of 5" : "Tap to choose"; }
      ripple(b);
    }));
  }
})();
