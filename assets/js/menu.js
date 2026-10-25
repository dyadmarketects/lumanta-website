/* Lumanta: shared accessibility for the mobile menu and the founding member CTAs (every page).
   Works alongside main.js / pages.js, which still open and close the menu. */
(function () {
  "use strict";
  var menu = document.getElementById("menu"), burger = document.getElementById("burger");
  var behind = ["main", "#social", ".footer", ".nav__logo", ".skip"];
  function setInert(on) {
    behind.forEach(function (s) { Array.prototype.forEach.call(document.querySelectorAll(s), function (el) { el.inert = on; }); });
  }
  if (menu && burger) {
    var wasOpen = false;
    new MutationObserver(function () {
      var open = menu.classList.contains("is-open");
      if (open === wasOpen) return; wasOpen = open;
      setInert(open);
      if (open) { var first = menu.querySelector("a"); if (first) setTimeout(function () { first.focus(); }, 60); }
      else if (document.activeElement && (menu.contains(document.activeElement) || document.activeElement === document.body)) burger.focus();
    }).observe(menu, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("keydown", function (e) {
      if (!menu.classList.contains("is-open")) return;
      if (e.key === "Escape") { burger.click(); return; }
      if (e.key !== "Tab") return;
      // keep Tab inside the open menu (its links plus the close button)
      var items = [burger].concat(Array.prototype.slice.call(menu.querySelectorAll("a")));
      var i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    });
  }

  /* Founding member CTAs: after the scroll lands, put the cursor in the email field (audit P1-03) */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href="#contact"], a[href="#join"], a[href="./#contact"]');
    if (!a) return;
    if (a.getAttribute("href") === "./#contact" && !document.getElementById("contact")) return;
    var input = document.querySelector("#joinForm input[type=email]");
    if (!input) return;
    var tries = 0;
    (function wait() {
      var r = input.getBoundingClientRect();
      if ((r.top > 60 && r.bottom < innerHeight - 20) || tries > 40) { input.focus({ preventScroll: true }); return; }
      tries++; setTimeout(wait, 80);
    })();
  });
})();
