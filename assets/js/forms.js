/* Sends lumanta.co form submissions to the Lumanta Google Sheet (Apps Script web app), which saves them and
   emails julie@lumanta.co and dyadmarketects@gmail.com. Paste the web app URL below; while it's empty the
   forms only show their thank-you message, as before. */
(function () {
  "use strict";
  var ENDPOINT = "";
  var FORMS = { joinForm: "founding", msgForm: "support", donateList: "donate" };
  Object.keys(FORMS).forEach(function (id) {
    var f = document.getElementById(id);
    if (!f) return;
    // spam trap: hidden from people, often filled in by bots
    var trap = document.createElement("input");
    trap.type = "text"; trap.name = "website"; trap.tabIndex = -1; trap.autocomplete = "off";
    trap.setAttribute("aria-hidden", "true");
    trap.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
    f.appendChild(trap);
    f.addEventListener("submit", function () {
      if (!ENDPOINT) return;
      var data = new URLSearchParams(new FormData(f));
      data.set("form", FORMS[id]); data.set("page", location.href);
      try { fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: data, keepalive: true }); } catch (e) {}
    });
  });
})();
