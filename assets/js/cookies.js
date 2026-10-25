/* Lumanta cookie notice.
   lumanta.co uses no advertising or cross-site tracking cookies. The notice records the visitor's choice
   (in this browser only) so anything optional added later, such as analytics, runs only after "Accept".
   Read the choice with window.lumantaConsent ("all", "essential" or null) or listen for "lumanta:consent". */
(function () {
  "use strict";
  var KEY = "lumanta-consent";
  var read = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var save = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };
  window.lumantaConsent = read();

  function build(now) {
    var el = document.createElement("div");
    el.className = "cookie"; el.setAttribute("role", "region"); el.setAttribute("aria-label", "Cookie notice");
    el.innerHTML =
      '<img class="cookie__mark" src="assets/img/lumanta-mark.webp" width="480" height="531" alt="">' +
      '<p><b>Cookies?</b> Only what this site needs to work. No ads or tracking, and analytics would only ever run if you say yes. ' +
      '<a href="privacy#cookies">Privacy Policy</a></p>' +
      '<div class="cookie__btns"><button type="button" class="cookie__no">Essential only</button><button type="button" class="cookie__ok">Accept</button></div>';
    document.body.appendChild(el);
    var close = function (v) {
      save(v); window.lumantaConsent = v;
      try { window.dispatchEvent(new CustomEvent("lumanta:consent", { detail: v })); } catch (e) {}
      el.classList.remove("is-in"); setTimeout(function () { el.remove(); }, 800);
    };
    el.querySelector(".cookie__ok").addEventListener("click", function () { close("all"); });
    el.querySelector(".cookie__no").addEventListener("click", function () { close("essential"); });
    el.addEventListener("keydown", function (e) { if (e.key === "Escape") close("essential"); });
    // the homepage plays its intro first; everywhere else the notice slides up after a short pause
    var show = function () { requestAnimationFrame(function () { el.classList.add("is-in"); }); };
    if (now) { setTimeout(show, 30); return; }
    // on phones it waits for the first scroll (or 12 s) so it never covers the first view's call to action
    if (matchMedia("(max-width: 760px)").matches) {
      var once = function () { removeEventListener("scroll", once); clearTimeout(t); setTimeout(show, 400); };
      var t = setTimeout(once, 12000); addEventListener("scroll", once, { passive: true });
    } else setTimeout(show, document.getElementById("loader") ? 5200 : 1400);
  }

  function init() {
    if (!window.lumantaConsent) build();
    // "Cookie settings" links in the footer reopen the notice
    Array.prototype.forEach.call(document.querySelectorAll("[data-cookie-settings]"), function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); if (!document.querySelector(".cookie")) build(true); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
