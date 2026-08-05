// IdeaHome — interakciók (vanilla JS, keretrendszer nélkül)
(function () {
  "use strict";

  // Mobil menü
  var btn = document.getElementById("menuBtn");
  var nav = document.getElementById("mobileNav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("hidden") === false;
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Menü bezárása" : "Menü megnyitása");
    });
    // belső linkre kattintva csukódjon be
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.add("hidden");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Reveal on scroll
  var els = document.querySelectorAll(".reveal");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  // Aktuális év
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
