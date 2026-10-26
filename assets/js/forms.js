/* Sends lumanta.co form submissions to the Lumanta Google Sheet (Apps Script web app "Lumanta Website Forms",
   owned by dyadmarketects@gmail.com), which saves them and emails julie@lumanta.co and dyadmarketects@gmail.com.
   Each form carries an "I'm not a robot" checkbox (ALTCHA: self-hosted proof of work, no cookies, no tracking).
   The challenge comes from the same Apps Script, which also verifies the answer before saving anything.
   If a submission doesn't save, the form comes back (with what the visitor typed) and says so. */
(function () {
  "use strict";
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbxEFYuXYRnJvk-o7pWuV3jrwgD4Bk1t1-gJ0sv88O3uE3C05vx7B4qtT2Tn39FAqzdRfg/exec";
  var FORMS = { joinForm: "founding", msgForm: "support" };
  var MAX = { name: 120, email: 254, message: 4000 };   // same limits as the script, so nothing is cut off silently
  var STRINGS = JSON.stringify({
    label: "I'm not a robot", verified: "Verified. Thank you.", verifying: "Checking...", waitAlert: "Checking... please wait.",
    error: "That didn't work. Please check the box again.", expired: "That expired. Please check the box again.",
    ariaLinkLabel: "About this check", footer: ""
  });

  function setupHuman(w) {
    if (!w || !ENDPOINT) return;
    var go = function () {
      if (typeof w.configure !== "function") return;
      w.configure({
        challengeurl: ENDPOINT + "?action=challenge",
        // a plain GET with no custom headers, so the browser can read Google's reply without a preflight
        customfetch: function (url) { return fetch(url, { cache: "no-store" }); },
        hidefooter: true, hidelogo: true, strings: STRINGS
      });
    };
    if (window.customElements && customElements.whenDefined) customElements.whenDefined("altcha-widget").then(go); else go();
  }

  function note(f, text) {
    var id = f.id + "Human", n = document.getElementById(id);
    if (!text) { if (n) n.remove(); return; }
    if (!n) {
      n = document.createElement("p"); n.id = id; n.className = "form-human-note"; n.setAttribute("role", "alert");
      var h = f.querySelector(".human"); (h || f).insertAdjacentElement(h ? "afterend" : "beforeend", n);
    }
    n.textContent = text;
  }

  Object.keys(FORMS).forEach(function (id) {
    var f = document.getElementById(id);
    if (!f) return;
    var thanks = document.querySelector(f.getAttribute("data-thanks") || "#joinThanks");
    var human = f.querySelector("altcha-widget");
    setupHuman(human);
    // spam trap: off-screen and unreachable for people; a meaningless name so browser autofill leaves it alone
    var trap = document.createElement("input");
    trap.type = "text"; trap.name = "lm_extra"; trap.tabIndex = -1; trap.autocomplete = "off";
    trap.setAttribute("aria-hidden", "true");
    trap.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
    f.appendChild(trap);
    Object.keys(MAX).forEach(function (n) { var el = f.elements[n]; if (el && el.maxLength < 0) el.maxLength = MAX[n]; });
    if (human) human.addEventListener("statechange", function (ev) { if (ev.detail && ev.detail.state === "verified") note(f, ""); });

    // Runs before main.js / pages.js (this file loads first): if the box isn't checked yet, check it now and send once it's done
    f.addEventListener("submit", function (e) {
      if (!ENDPOINT) return;
      if (human && typeof human.getState === "function" && human.getState() !== "verified") {
        e.preventDefault(); e.stopImmediatePropagation();
        if (human.getState() === "verifying") return;
        note(f, "One moment, checking that you're not a robot...");
        var done = function (ev) {
          var st = ev.detail && ev.detail.state;
          if (st === "verified") { human.removeEventListener("statechange", done); note(f, ""); f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true })); }
          else if (st === "error" || st === "expired") { human.removeEventListener("statechange", done); note(f, "Please check the box to confirm you're not a robot."); }
        };
        human.addEventListener("statechange", done);
        try { human.verify(); } catch (err) { human.removeEventListener("statechange", done); note(f, "Please check the box to confirm you're not a robot."); }
        return;
      }
      // same rule as the server: an address needs a dot in its domain (saves a round trip for "name@host")
      var em0 = f.elements.email;
      if (em0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em0.value.trim())) { e.preventDefault(); e.stopImmediatePropagation(); clearError(); fail("email"); return; }
      // From here this file owns the whole submission: the thank-you only appears once the server confirms the save
      e.preventDefault(); e.stopImmediatePropagation();
      if (busy) return;                                     // ignore double clicks and repeated Enter
      clearError();
      var data = new URLSearchParams(new FormData(f));
      data.set("form", FORMS[id]);
      data.set("page", location.pathname);   // the path only: never the query string or #fragment
      setBusy(true);
      var ctl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
      // A plain form-encoded POST is a CORS "simple request", so the script's JSON reply can be read
      fetch(ENDPOINT, { method: "POST", body: data, signal: ctl ? ctl.signal : undefined })
        .then(function (r) { return r.json(); })
        .then(function (res) { clearTimeout(timer); setBusy(false); if (res && res.ok) succeed(); else fail(res && res.error); })
        .catch(function () { clearTimeout(timer); setBusy(false); fail(navigator.onLine === false ? "offline" : ""); });
    });

    var busy = false, btn = f.querySelector('[type="submit"]'), label = btn ? btn.innerHTML : "";
    function setBusy(on) {
      busy = on; f.setAttribute("aria-busy", on ? "true" : "false");
      if (btn) { btn.disabled = on; btn.innerHTML = on ? "Sending\u2026" : label; }
    }
    function clearError() {
      var old = document.getElementById(id + "Error"); if (old) old.remove();
      var em = f.elements.email; if (em) { em.removeAttribute("aria-invalid"); em.removeAttribute("aria-describedby"); }
    }
    function succeed() {
      var show = function () { f.hidden = true; if (thanks) { thanks.hidden = false; thanks.classList.add("rv", "in"); thanks.setAttribute("tabindex", "-1"); thanks.focus({ preventScroll: true }); } };
      if (window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) window.gsap.to(f, { opacity: 0, y: -10, duration: 0.4, onComplete: function () { show(); window.gsap.fromTo(thanks, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }); } });
      else show();
      try { window.dispatchEvent(new CustomEvent("lumanta:signup", { detail: { form: FORMS[id] } })); } catch (err) {}
    }
    // Keep the form (and what the visitor typed), say what went wrong next to it, and let them try again
    function fail(code) {
      if (human && typeof human.reset === "function") human.reset();
      var n = document.createElement("p");
      n.id = id + "Error"; n.className = "form-error"; n.setAttribute("role", "alert");
      n.textContent = code === "email" ? "That email address doesn't look right. Please check it and try again."
        : code === "human" ? "Please check the \u201cI'm not a robot\u201d box again, then resend."
        : code === "offline" ? "You seem to be offline. Please check your connection and try again."
        : code === "busy" ? "We're getting a lot of sign-ups right now. Please try again in a minute."
        : "Sorry, that didn't go through. Please try again in a minute, or email julie@lumanta.co.";
      f.insertAdjacentElement("afterend", n);
      var em = f.elements.email;
      if (code === "email" && em) { em.setAttribute("aria-invalid", "true"); em.setAttribute("aria-describedby", n.id); em.focus(); }
    }
  });
})();
