/* Lumanta subpages: nav, menu, reveals, contents highlight, forms, share, and the 404 light field */
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;
  document.documentElement.classList.replace("no-js", "js");
  // Back button returns get a fresh load too, so every page opens the way it was designed to
  addEventListener("pagehide", (e) => { if (e.persisted) document.documentElement.classList.add("is-leaving"); });
  addEventListener("pageshow", (e) => { if (e.persisted) location.reload(); });

  /* ---------- Nav: lightens a touch as you scroll ---------- */
  const nav = $("#nav");
  const onScroll = () => {
    nav && nav.style.setProperty("--nav-a", (0.94 - 0.28 * Math.min(1, Math.max(0, scrollY / 500))).toFixed(3));
    const social = $("#social"), footer = $(".footer");
    if (social && footer) social.classList.toggle("is-foot", scrollY + innerHeight > footer.offsetTop + 60);
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger"), menu = $("#menu");
  const toggleMenu = (open) => {
    menu.classList.toggle("is-open", open); menu.setAttribute("aria-hidden", !open);
    burger.setAttribute("aria-expanded", open); burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.documentElement.style.overflow = open ? "hidden" : "";
  };
  if (burger && menu) {
    burger.addEventListener("click", () => toggleMenu(!menu.classList.contains("is-open")));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("is-open")) toggleMenu(false); });
  }

  /* ---------- Gentle reveals ---------- */
  const rv = $$(".rv");
  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add("in"));

  /* ---------- Legal contents: highlight the section you're reading ---------- */
  const tocLinks = $$(".toc a");
  if (tocLinks.length) {
    const secs = tocLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
    const mark = () => {
      const y = innerHeight * 0.32; let on = 0;
      secs.forEach((s, i) => { if (s.getBoundingClientRect().top < y) on = i; });
      tocLinks.forEach((a, i) => a.classList.toggle("is-on", i === on));
    };
    addEventListener("scroll", mark, { passive: true }); mark();
  }

  /* ---------- FAQ ---------- */
  $$(".faq2__q").forEach((q) => q.addEventListener("click", () => {
    const open = q.getAttribute("aria-expanded") === "true";
    $$(".faq2__q").forEach((o) => { o.setAttribute("aria-expanded", "false"); const pn = document.getElementById(o.getAttribute("aria-controls")); if (pn) pn.inert = true; });
    q.setAttribute("aria-expanded", String(!open)); { const pn = document.getElementById(q.getAttribute("aria-controls")); if (pn) pn.inert = open; }
  }));

  /* ---------- Forms: confirm on the page (forms.js sends the submission) ---------- */
  $$("form[data-thanks]").forEach((f) => f.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = $(f.dataset.thanks);
    f.hidden = true; if (t) { t.hidden = false; t.classList.add("rv", "in"); }
  }));
  // Support form: preselect a topic from the link (support#message?topic=privacy style links use data-topic)
  $$("[data-topic]").forEach((a) => a.addEventListener("click", () => { const s = $("#topic"); if (s) s.value = a.dataset.topic; }));

  /* ---------- Share ---------- */
  $$("[data-share]").forEach((b) => b.addEventListener("click", async () => {
    const url = new URL("./", location.href).href, msg = $(b.dataset.share);
    const data = { title: "Lumanta", text: "Lumanta helps you notice your thoughts, let them go and free up space.", url };
    const say = (t) => { if (!msg) return; msg.textContent = ""; setTimeout(() => { msg.textContent = t; }, 60); };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch (err) { if (err && err.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(url); say("Link copied. Thank you for sharing!"); return; } catch (_) {}
    // no share sheet and no clipboard: show the link, selected, ready to copy
    if (msg) {
      msg.textContent = "Copy this link: ";
      const inp = document.createElement("input"); inp.type = "text"; inp.readOnly = true; inp.value = url; inp.className = "share-link";
      inp.setAttribute("aria-label", "Link to Lumanta"); msg.appendChild(inp); inp.focus(); inp.select();
    }
  }));

  /* ---------- 404: the static, calming into a ring of light where you are ---------- */
  const c = $("#nfCanvas");
  if (c) {
    const x = c.getContext("2d"), hint = $(".nf__hint"), o = $(".nf__o");
    if (hint) hint.textContent = coarse ? "Touch the light" : "Move through the light";
    const cols = ["#ff9a3c", "#ff5f8a", "#1e6fd9", "#2edfcf", "#faf7f5"];
    let W = 0, H = 0, dpr = 1, P = [], t = 0;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0, active: false };
    const home = () => { const r = o ? o.getBoundingClientRect() : null; return r ? [r.left + r.width / 2, r.top + r.height / 2] : [W / 2, H * 0.4]; };
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = c.clientWidth; H = c.clientHeight;
      c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(coarse ? 700 : 1500, (W * H) / (coarse ? 1100 : 900)));
      P = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, c: cols[(Math.random() * cols.length) | 0],
        s: 0.6 + Math.random() * 1.9, a: Math.random() * Math.PI * 2, w: (Math.random() < 0.5 ? -1 : 1) * (0.15 + Math.random() * 0.35),
        r: 0.75 + Math.random() * 0.5, cap: 0, al: 0.35 + Math.random() * 0.6 }));
      if (!ptr.active) { [ptr.x, ptr.y] = home(); ptr.tx = ptr.x; ptr.ty = ptr.y; }
    }
    size(); addEventListener("resize", size);
    const move = (px, py) => { ptr.tx = px; ptr.ty = py; ptr.active = true; };
    addEventListener("pointermove", (e) => move(e.clientX, e.clientY), { passive: true });
    addEventListener("touchmove", (e) => { const tt = e.touches[0]; if (tt) move(tt.clientX, tt.clientY); }, { passive: true });
    document.addEventListener("pointerleave", () => { ptr.active = false; });
    addEventListener("touchend", () => { setTimeout(() => { ptr.active = false; }, 1600); });

    function frame() {
      t += 1 / 60;
      if (!ptr.active) { const [hx, hy] = home(); ptr.tx = hx; ptr.ty = hy; }
      ptr.x += (ptr.tx - ptr.x) * 0.06; ptr.y += (ptr.ty - ptr.y) * 0.06;
      const R = Math.min(W, H) * (coarse ? 0.2 : 0.13), reach = R * 2.4;
      x.globalCompositeOperation = "source-over"; x.fillStyle = "rgba(10, 15, 36, .32)"; x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = "lighter";
      for (const p of P) {
        const dx = p.x - ptr.x, dy = p.y - ptr.y, d = Math.hypot(dx, dy);
        if (d < reach) p.cap = Math.min(1, p.cap + 0.02); else p.cap = Math.max(0, p.cap - 0.01);
        if (p.cap > 0.02 && Math.random() < 0.0015) p.cap = 0;                       // a few drift back out into the static
        if (p.cap > 0.02) {                                                          // calm: settle onto a slow ring of light
          p.a += p.w * 0.012;
          const tx = ptr.x + Math.cos(p.a) * R * p.r, ty = ptr.y + Math.sin(p.a) * R * p.r;
          p.vx += (tx - p.x) * 0.012 * p.cap; p.vy += (ty - p.y) * 0.012 * p.cap; p.vx *= 0.86; p.vy *= 0.86;
        } else {                                                                     // static: restless jitter
          p.vx += (Math.random() - 0.5) * 0.5; p.vy += (Math.random() - 0.5) * 0.5; p.vx *= 0.9; p.vy *= 0.9;
        }
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
        x.globalAlpha = Math.min(1, p.al * (0.4 + 0.9 * p.cap));
        x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, p.s * (1 + p.cap * 0.7), 0, Math.PI * 2); x.fill();
      }
      x.globalAlpha = 1;
      if (!reduced) requestAnimationFrame(frame);
    }
    if (reduced) { for (let i = 0; i < 90; i++) frame(); } else requestAnimationFrame(frame);
  }
})();
