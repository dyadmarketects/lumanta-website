/* Sends lumanta.co form submissions to the Lumanta Google Sheet (Apps Script web app "Lumanta Website Forms",
   owned by dyadmarketects@gmail.com), which saves them and emails julie@lumanta.co and dyadmarketects@gmail.com.
   While ENDPOINT is empty the forms only show their thank-you message. If a submission doesn't save, the form
   comes back (with what the visitor typed) and says so. */
(function () {
  "use strict";
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbxEFYuXYRnJvk-o7pWuV3jrwgD4Bk1t1-gJ0sv88O3uE3C05vx7B4qtT2Tn39FAqzdRfg/exec";
  var FORMS = { joinForm: "founding", msgForm: "support", donateList: "donate" };
  var MAX = { name: 120, email: 254, message: 4000 };   // same limits as the script, so nothing is cut off silently
  Object.keys(FORMS).forEach(function (id) {
    var f = document.getElementById(id);
    if (!f) return;
    var thanks = document.querySelector(f.getAttribute("data-thanks") || "#joinThanks");
    // spam trap: off-screen and unreachable for people; a meaningless name so browser autofill leaves it alone
    var trap = document.createElement("input");
    trap.type = "text"; trap.name = "lm_extra"; trap.tabIndex = -1; trap.autocomplete = "off";
    trap.setAttribute("aria-hidden", "true");
    trap.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
    f.appendChild(trap);
    Object.keys(MAX).forEach(function (n) { var el = f.elements[n]; if (el && el.maxLength < 0) el.maxLength = MAX[n]; });

    f.addEventListener("submit", function () {
      if (!ENDPOINT) return;
      var old = document.getElementById(id + "Error");
      if (old) old.remove();
      var data = new URLSearchParams(new FormData(f));
      data.set("form", FORMS[id]);
      data.set("page", location.pathname);   // the path only: never the query string or #fragment
      // A plain form-encoded POST is a CORS "simple request", so the script's JSON reply can be read
      fetch(ENDPOINT, { method: "POST", body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) { if (!res || !res.ok) fail(res && res.error); })
        .catch(function () { fail(""); });
    });

    // Bring the form back after the thank-you animation (main.js / pages.js) has run, and say what went wrong
    function fail(code) {
      setTimeout(function () {
        if (thanks) thanks.hidden = true;
        if (window.gsap) window.gsap.set(f, { clearProps: "opacity,transform" });
        f.hidden = false;
        var note = document.createElement("p");
        note.id = id + "Error"; note.setAttribute("role", "alert");
        note.style.cssText = "margin:14px auto 0;font-size:14px;line-height:1.5;max-width:560px";
        note.textContent = code === "email"
          ? "That email address doesn't look right. Please check it and try again."
          : "Sorry, that didn't go through. Please try again in a minute, or email julie@lumanta.co.";
        f.insertAdjacentElement("afterend", note);
      }, 700);
    }
  });
})();
