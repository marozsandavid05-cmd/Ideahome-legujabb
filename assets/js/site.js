(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var VENDOR = (function () {
    var cs = document.currentScript;
    return cs && cs.src ? cs.src.replace(/js\/site\.js(\?.*)?$/, "vendor/") : "assets/vendor/";
  })();
  var $ = function (s, c) { return (c || document).querySelector(s); };

  (function () {
    if (!/^https?:$/.test(location.protocol)) return;
    Array.prototype.forEach.call(document.querySelectorAll("a[href]"), function (a) {
      var h = a.getAttribute("href");
      if (!h || /^([a-z]+:|\/\/|#)/i.test(h)) return;
      var m = h.match(/^([^?#]*?)(index)?\.html([?#].*)?$/);
      if (!m) return;
      var path = m[2] ? (m[1] || "./") : m[1];
      a.setAttribute("href", path + (m[3] || ""));
    });
  })();

  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  (function () {
    var portrait = window.matchMedia("(max-aspect-ratio: 4/5)").matches;
    $$("video[data-src]").forEach(function (v) {
      var src = (portrait && v.getAttribute("data-src-m")) || v.getAttribute("data-src");
      var poster = (portrait && v.getAttribute("data-poster-m")) || v.getAttribute("data-poster");
      if (portrait && v.getAttribute("data-src-m")) v.setAttribute("data-mobile", "");
      if (poster) v.setAttribute("poster", poster);
      v.setAttribute("src", src);
    });
  })();

  (function () {
    var loader = $("#loader");
    if (!loader) return;
    var hide = function () { loader.classList.add("done"); setTimeout(function () { loader.style.display = "none"; }, 950); };
    if (reduce || sessionStorage.getItem("ih_seen")) { loader.style.display = "none"; return; }
    sessionStorage.setItem("ih_seen", "1");
    requestAnimationFrame(function () { loader.classList.add("reveal-mark"); });
    window.addEventListener("load", function () { setTimeout(hide, 650); });
    setTimeout(hide, 2400);
  })();

  var nav = $("#nav");
  var onScroll = function () { if (nav) nav.classList.toggle("scrolled", window.scrollY > 24); };
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  var burger = $("#burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Menü bezárása" : "Menü megnyitása");
    });
    $$("#mobileMenu a").forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("menu-open"); burger.setAttribute("aria-expanded", "false"); });
    });
  }

  $$(".nav-dd").forEach(function (dd) {
    var trigger = dd.querySelector(".nav-dd-trigger");
    if (!trigger) return;
    function setOpen(state) {
      dd.classList.toggle("open", state);
      trigger.setAttribute("aria-expanded", String(state));
    }
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      setOpen(!dd.classList.contains("open"));
    });
    document.addEventListener("click", function (e) {
      if (!dd.contains(e.target)) setOpen(false);
    });
    dd.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { setOpen(false); trigger.focus(); }
    });
  });

  var targets = $$(".reveal, .mask-head, .img-reveal, .pcard, .gallery-item");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

    var vh = window.innerHeight, bottom = vh * 0.92;
    var unsized = $$("img:not([width])").filter(function (i) { return i.style.display !== "none"; });
    unsized.forEach(function (i) { i.style.display = "none"; });
    var first = targets.map(function (el) {
      var r = el.getBoundingClientRect(), vis = Math.min(r.bottom, bottom) - Math.max(r.top, 0);
      return r.width > 0 && (r.height > 0 ? vis > 0 && vis / r.height >= 0.14 : r.top >= 0 && r.top <= bottom);
    });
    unsized.forEach(function (i) { i.style.display = ""; });
    targets.forEach(function (el, k) { if (first[k]) el.classList.add("in"); else io.observe(el); });
  }

  if (fine && !reduce) {
    var ring = document.createElement("div"); ring.className = "cursor-ring"; ring.innerHTML = '<span class="cl"></span>';
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    document.body.appendChild(ring); document.body.appendChild(dot);
    document.body.classList.add("has-cursor");
    var label = ring.querySelector(".cl");
    var rx = 0, ry = 0, dx = 0, dy = 0, tx = 0, ty = 0, ready = false, craf = 0;
    function cursorLoop() {
      rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16; dx += (tx - dx) * 0.42; dy += (ty - dy) * 0.42;
      if (Math.abs(tx - rx) < 0.1 && Math.abs(ty - ry) < 0.1 && Math.abs(tx - dx) < 0.1 && Math.abs(ty - dy) < 0.1) { rx = dx = tx; ry = dy = ty; }
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      dot.style.transform = "translate(" + dx + "px," + dy + "px) translate(-50%,-50%)";
      craf = (rx === tx && ry === ty && dx === tx && dy === ty) || document.hidden ? 0 : requestAnimationFrame(cursorLoop);
    }
    function cursorKick() { if (!craf && !document.hidden) craf = requestAnimationFrame(cursorLoop); }
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!ready) { ready = true; document.body.classList.add("cursor-ready"); rx = dx = tx; ry = dy = ty; }
      cursorKick();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (craf) { cancelAnimationFrame(craf); craf = 0; } } else cursorKick();
    });
    document.addEventListener("mouseleave", function () { document.body.classList.add("cursor-hide"); });
    document.addEventListener("mouseenter", function () { document.body.classList.remove("cursor-hide"); });
    cursorKick();
    $$("a, button, [data-magnetic]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { document.body.classList.add("cursor-hover"); });
      el.addEventListener("mouseleave", function () { document.body.classList.remove("cursor-hover"); });
    });
    $$("[data-view], .work, .pcard, .gallery-item, .next-project").forEach(function (el) {
      el.addEventListener("mouseenter", function () { document.body.classList.add("cursor-view"); label.textContent = el.getAttribute("data-view") || "Megnézem"; });
      el.addEventListener("mouseleave", function () { document.body.classList.remove("cursor-view"); });
    });

    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + mx * 0.28 + "px," + my * 0.4 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  if (!reduce) {
    var pxEls = $$("[data-parallax]");
    if (pxEls.length) {
      var tick = false;
      var run = function () {
        var vh = window.innerHeight;
        pxEls.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          var sp = parseFloat(el.getAttribute("data-parallax")) || 0.1;
          var prog = (r.top + r.height / 2 - vh / 2) / vh;
          el.style.transform = "translateY(" + (prog * sp * -100).toFixed(1) + "px)";
        });
        tick = false;
      };
      window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true });
      run();
    }
  }

  var lbItems = $$("[data-lightbox]");
  if (lbItems.length) {
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML =
      '<div class="lightbox-img"><img alt=""></div>' +
      '<button class="lb-btn lb-close" aria-label="Bezárás"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '<button class="lb-btn lb-prev" aria-label="Előző"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>' +
      '<button class="lb-btn lb-next" aria-label="Következő"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector(".lightbox-img img");
    var srcs = lbItems.map(function (el) { return el.getAttribute("data-lightbox") || el.querySelector("img").src; });
    var cur = 0;
    var show = function (i) { cur = (i + srcs.length) % srcs.length; lbImg.src = srcs[cur]; };
    var open = function (i) { show(i); lb.classList.add("open"); document.body.style.overflow = "hidden"; };
    var close = function () { lb.classList.remove("open"); document.body.style.overflow = ""; };
    lbItems.forEach(function (el, i) { el.addEventListener("click", function (e) { e.preventDefault(); open(i); }); });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-next").addEventListener("click", function () { show(cur + 1); });
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(cur - 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(cur + 1);
      if (e.key === "ArrowLeft") show(cur - 1);
    });
  }

  var chips = $$(".chip[data-filter]");
  if (chips.length) {

    var pcs = $$(".pcard");
    pcs.forEach(function (c) { c.setAttribute("data-size", (c.className.match(/\bp-(?:lg|md|sm|half)\b/) || ["p-sm"])[0]); });
    var setSize = function (card, cls) { card.className = card.className.replace(/\bp-(?:lg|md|sm|half)\b/g, "").replace(/\s+/g, " ").trim() + " " + cls; };
    var rhythm = function (n) {
      var tpl = [["p-lg", "p-md"], ["p-sm", "p-sm", "p-sm"], ["p-md", "p-lg"], ["p-sm", "p-sm", "p-sm"], ["p-half", "p-half"]];
      var out = [], i = 0, r = n, guard = 0;
      while (r > 0 && guard++ < 50) {
        if (r === 1) { out.push("p-half"); break; }
        if (r === 2) { out = out.concat(["p-half", "p-half"]); break; }
        if (r === 4) { out = out.concat(["p-lg", "p-md", "p-half", "p-half"]); break; }
        var t = tpl[i % tpl.length]; i++;
        if (t.length > r || r - t.length === 1) continue;
        out = out.concat(t); r -= t.length;
      }
      return out;
    };
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        var f = chip.getAttribute("data-filter");
        pcs.forEach(function (card) {
          var show = f === "all" || card.getAttribute("data-cat") === f;
          card.classList.toggle("hide", !show);
        });
        var vis = pcs.filter(function (c) { return !c.classList.contains("hide"); });
        if (f === "all") { vis.forEach(function (c) { setSize(c, c.getAttribute("data-size")); }); }
        else { var rh = rhythm(vis.length); vis.forEach(function (c, k) { setSize(c, rh[k] || "p-sm"); }); }
      });
    });
    var h = (location.hash || "").slice(1);
    if (h) { chips.forEach(function (c) { if (c.getAttribute("data-filter") === h) c.click(); }); }
  }

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  (function () {
    if (reduce) return;
    function load(src) {
      return new Promise(function (res, rej) {
        var s = document.createElement("script");
        s.src = src; s.async = true; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }

    Promise.all([
      load(VENDOR + "gsap.min.js"),
      load(VENDOR + "ScrollTrigger.min.js")
    ]).then(function () {
      if (!window.gsap || !window.ScrollTrigger) return;
      gsap.registerPlugin(ScrollTrigger);

      $$(".hero-frame.arch").forEach(function (frame) {
        var hero = frame.closest(".hero");
        if (!hero) return;
        gsap.to(frame, { yPercent: 7, ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      });

      $$(".work .ph, .pcard .ph").forEach(function (ph) {
        gsap.fromTo(ph, { yPercent: -3 }, { yPercent: 3, ease: "none",
          scrollTrigger: { trigger: ph, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }).catch(function () {});

  })();

  (function () {
    $$("[data-rotator]").forEach(function (rot) {
      var imgs = $$("img", rot);
      if (imgs.length < 2) { if (imgs[0]) imgs[0].classList.add("on"); return; }
      imgs.forEach(function (im, i) { im.classList.toggle("on", i === 0); });
      if (reduce) return;
      var cur = 0;
      var delay = parseInt(rot.getAttribute("data-rotator-delay") || "3600", 10);
      setInterval(function () {
        if (document.hidden) return;
        imgs[cur].classList.remove("on");
        cur = (cur + 1) % imgs.length;
        imgs[cur].classList.add("on");
      }, delay);
    });
  })();

  (function () {
    $$("[data-carousel]").forEach(function (car) {
      var track = $(".pc-track", car);
      var prev = $(".pc-nav.prev", car);
      var next = $(".pc-nav.next", car);
      if (!track) return;
      function step() {
        var item = track.querySelector(".pc-item");
        var w = item ? item.getBoundingClientRect().width : track.clientWidth * 0.8;
        var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || "16") || 16;
        return (w + gap) * Math.max(1, Math.floor(track.clientWidth / (w + gap)));
      }
      function sync() {
        if (!prev || !next) return;
        prev.disabled = track.scrollLeft < 8;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
      }
      if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
      if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
      track.addEventListener("scroll", function () { requestAnimationFrame(sync); }, { passive: true });
      sync();
    });
  })();

  (function () {
    if (reduce) return;
    var s = document.createElement("script");
    s.src = VENDOR + "lenis.min.js";
    s.async = true;
    s.onload = function () {
      if (!window.Lenis) return;
      try {
        var lenis = new window.Lenis({ smoothWheel: true, syncTouch: false, lerp: 0.1 });
        window.__lenis = lenis;
        function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
        lenis.on("scroll", function () { if (window.ScrollTrigger) window.ScrollTrigger.update(); });
        var bg = $("#burger");
        if (bg) bg.addEventListener("click", function () {
          setTimeout(function () {
            if (document.body.classList.contains("menu-open")) lenis.stop(); else lenis.start();
          }, 0);
        });
      } catch (e) { window.__lenis = null; }
    };
    s.onerror = function () { window.__lenis = null; };
    document.head.appendChild(s);
  })();

  (function () {
    $$("[data-accordion]").forEach(function (acc) {
      var cards = $$(".testi-card", acc);
      function open(c) { cards.forEach(function (x) { x.classList.remove("open"); }); c.classList.add("open"); }
      cards.forEach(function (c) {
        c.addEventListener("click", function () { open(c); });
        c.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(c); }
        });
        if (fine) c.addEventListener("mouseenter", function () { open(c); });
      });
    });
  })();

  (function () {
    var els = $$("[data-count]");
    if (!els.length || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || ""); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        var end = parseFloat(el.getAttribute("data-count")) || 0, suf = el.getAttribute("data-suffix") || "";
        if (reduce) { el.textContent = end + suf; return; }
        var t0 = performance.now(), dur = 1400;
        (function tick(t) {
          var p = Math.min(1, (t - t0) / dur);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  })();

  (function () {
    if (reduce) return;
    var tries = 0;
    (function waitGSAP() {
      if (window.gsap && window.ScrollTrigger) { initAdvanced(); return; }
      if (tries++ > 40) return;
      setTimeout(waitGSAP, 100);
    })();

    function initAdvanced() {
      var gsap = window.gsap, ST = window.ScrollTrigger;
      gsap.registerPlugin(ST);
      ST.config({ ignoreMobileResize: true });

      $$("[data-scrub-video]").forEach(function (host) {
        var vid = host.querySelector("video");
        if (!vid) return;
        try { vid.pause(); } catch (e) {}
        var target = 0, cur = 0, dur = 5, raf = 0, canSeek = false, primed = false;

        var fps = parseFloat(vid.getAttribute("data-fps")) || 30;
        var minDelta = Math.max(0.02, 0.85 / fps);

        var media = vid.parentElement || host;
        var cover = null, posterSrc = vid.getAttribute("poster");
        if (posterSrc) {
          cover = document.createElement("div");
          cover.className = "scrub-hero__cover";
          cover.style.backgroundImage = "url('" + posterSrc + "')";
          media.appendChild(cover);
        }

        var canvas = document.createElement("canvas");
        canvas.className = "scrub-hero__canvas";
        var ctx2d = canvas.getContext("2d");
        media.insertBefore(canvas, cover || null);
        media.classList.add("canvas-on");
        function draw() {
          if (!vid.videoWidth || !ctx2d) return;
          if (canvas.width !== vid.videoWidth) { canvas.width = vid.videoWidth; canvas.height = vid.videoHeight; }
          try { ctx2d.drawImage(vid, 0, 0); } catch (e) {}
        }
        vid.addEventListener("seeked", draw);
        if (window.HTMLVideoElement && "requestVideoFrameCallback" in HTMLVideoElement.prototype) {
          (function frameLoop() {
            vid.requestVideoFrameCallback(function () { draw(); frameLoop(); });
          })();
        }

        function uncover() {
          canSeek = true;
          draw();
          if (cover) { cover.classList.add("off"); cover = null; }
        }

        if (vid.readyState >= 2) {
          uncover();
        } else {
          vid.addEventListener("loadeddata", uncover, { once: true });
          if (window.HTMLVideoElement && "requestVideoFrameCallback" in HTMLVideoElement.prototype) {
            vid.requestVideoFrameCallback(function () { uncover(); });
          }
          var guard = setInterval(function () {
            if (vid.readyState >= 2) { clearInterval(guard); uncover(); }
          }, 250);
          setTimeout(function () { clearInterval(guard); uncover(); }, 8000);
        }

        function prime() {
          if (primed) return; primed = true;
          try {
            var p = vid.play();
            if (p && p.then) p.then(function () { vid.pause(); }).catch(function () {});
          } catch (e) {}
        }

        var lastT = 0;
        function loop(now) {
          var dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 1 / 60;
          lastT = now;
          cur += (target - cur) * (1 - Math.pow(1 - 0.115, dt * 60));
          if (canSeek && vid.readyState >= 2 && !vid.seeking && isFinite(dur) && dur > 0) {
            var t = Math.max(0, Math.min(dur - 0.05, cur));

            if (Math.abs(t - vid.currentTime) > minDelta) {
              try { vid.currentTime = t; } catch (e) {}
            }
          }
          if (Math.abs(target - cur) > 0.004) raf = requestAnimationFrame(loop);
          else { raf = 0; lastT = 0; }
        }

        ST.create({
          trigger: host, start: "top top", end: "+=200%", pin: true, scrub: true, anticipatePin: 1,
          onUpdate: function (self) {
            target = dur * self.progress;
            if (!raf) { lastT = 0; raf = requestAnimationFrame(loop); }
          }
        });
        function setDur() {
          if (vid.duration && isFinite(vid.duration)) dur = vid.duration;
          prime();
        }
        if (vid.readyState >= 1) setDur();
        else {
          vid.addEventListener("loadedmetadata", setDur, { once: true });
          if (vid.readyState === 0 && vid.networkState === 0) vid.load();
        }
      });

      $$("[data-scene]").forEach(function (sc) {
        var img = sc.querySelector(".scene__img"), title = sc.querySelector(".scene__title");
        var tl = gsap.timeline({ scrollTrigger: { trigger: sc, start: "top top", end: "+=120%", scrub: 1, pin: true } });
        if (img) tl.from(img, { scale: 1.45, yPercent: 16, ease: "none" }, 0);
        if (title) tl.from(title, { yPercent: 60, opacity: 0, ease: "none" }, 0);
      });

      $$("[data-hscroll]").forEach(function (hs) {
        var track = hs.querySelector(".hscroll__track");
        if (!track) return;
        hs.style.overflow = "hidden";
        hs.style.height = "100vh";
        gsap.to(track, {
          x: function () { return -(track.scrollWidth - window.innerWidth + 40); }, ease: "none",
          scrollTrigger: { trigger: hs, start: "top top", pin: true, scrub: 1,
            end: function () { return "+=" + (track.scrollWidth - window.innerWidth + 40); }, invalidateOnRefresh: true }
        });
      });

      gsap.utils.toArray("[data-slide]").forEach(function (fig) {
        var dir = fig.getAttribute("data-slide") === "right" ? 1 : -1;
        var row = fig.closest(".split-motion") || fig;
        gsap.fromTo(fig, { xPercent: dir * 14, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, ease: "none",
          scrollTrigger: { trigger: row, start: "top 85%", end: "top 45%", scrub: 1 } });
        var img = fig.querySelector("img");
        if (img) gsap.fromTo(img, { scale: 1.22 }, { scale: 1, ease: "none",
          scrollTrigger: { trigger: row, start: "top 92%", end: "top 35%", scrub: 1 } });
      });

      $$("[data-follow]").forEach(function (el) {
        var amt = parseFloat(el.getAttribute("data-follow")) || 0.15;
        gsap.to(el, { yPercent: amt * -100, ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });

      var rt, lastScrollT = 0;
      window.addEventListener("scroll", function () { lastScrollT = performance.now(); }, { passive: true });
      function doRefresh() {
        if (performance.now() - lastScrollT < 600) { rt = setTimeout(doRefresh, 260); return; }
        ST.refresh();
      }
      function refreshSoon() { clearTimeout(rt); rt = setTimeout(doRefresh, 220); }
      refreshSoon();
      window.addEventListener("load", refreshSoon);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshSoon);
      setTimeout(refreshSoon, 1500);
    }
  })();
})();

(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  Array.prototype.slice.call(document.querySelectorAll("[data-details]")).forEach(function (box) {
    var rows = Array.prototype.slice.call(box.querySelectorAll(".dl-row"));
    var imgs = Array.prototype.slice.call(box.querySelectorAll(".dl-media img"));
    var media = box.querySelector(".dl-media"), frame = box.querySelector(".dl-frame");
    var idxEl = box.querySelector("[data-dl-idx]");
    if (!rows.length || rows.length !== imgs.length) return;
    var cur = 0;
    function set(i) {
      if (i === cur) return;
      rows[cur].classList.remove("is-on"); imgs[cur].classList.remove("is-on");
      rows[cur].querySelector("button").removeAttribute("aria-current");
      cur = i;
      rows[cur].classList.add("is-on"); imgs[cur].classList.add("is-on");
      rows[cur].querySelector("button").setAttribute("aria-current", "true");
      if (idxEl) idxEl.textContent = (cur + 1 < 10 ? "0" : "") + (cur + 1);
    }

    var STEP = 3000, timer = null, inView = false;
    function arm() { clearTimeout(timer); timer = setTimeout(function () { if (inView && !document.hidden) set((cur + 1) % rows.length); arm(); }, STEP); }
    function pick(i) { set(i); arm(); }
    rows.forEach(function (r, i) {
      var b = r.querySelector("button");
      b.addEventListener("click", function () { pick(i); });
      b.addEventListener("focus", function () { pick(i); });
      if (fine) r.addEventListener("mouseenter", function () { pick(i); });
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.3 }).observe(box);
    } else { inView = true; }
    arm();
    if (fine && !reduce && media && frame) {
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      var loop = function () {
        cx += (tx - cx) * 0.1; cy += (ty - cy) * 0.1;
        media.style.transform = "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0) scale(1.06)";
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(loop); else raf = null;
      };
      var kick = function () { if (!raf) raf = requestAnimationFrame(loop); };
      frame.addEventListener("mousemove", function (e) {
        var r = frame.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * -16;
        ty = ((e.clientY - r.top) / r.height - 0.5) * -16;
        kick();
      });
      frame.addEventListener("mouseleave", function () { tx = 0; ty = 0; kick(); });
    }
  });
})();

(function () {
  "use strict";
  var sels = Array.prototype.slice.call(document.querySelectorAll(".field select"));
  sels.forEach(function (sel, si) {
    var field = sel.parentElement;
    if (!field) return;
    var opts = Array.prototype.slice.call(sel.options);
    if (!opts.length) return;
    var wrap = document.createElement("div");
    wrap.className = "sel";
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add("sel-native");
    sel.setAttribute("tabindex", "-1");
    sel.setAttribute("aria-hidden", "true");

    var listId = "sel-list-" + si;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sel-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", listId);
    var lbl = field.querySelector("label");
    if (lbl && lbl.id) { btn.setAttribute("aria-labelledby", lbl.id + " " + (btn.id || "")); }
    else if (lbl) { btn.setAttribute("aria-label", lbl.textContent.trim()); }
    btn.innerHTML = '<span class="sel-val"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    wrap.appendChild(btn);

    var list = document.createElement("ul");
    list.className = "sel-list";
    list.id = listId;
    list.setAttribute("role", "listbox");
    list.setAttribute("data-lenis-prevent", "");
    opts.forEach(function (o, i) {
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", i === sel.selectedIndex ? "true" : "false");
      li.textContent = o.textContent;
      li.addEventListener("click", function () { pick(i); close(true); });
      li.addEventListener("mouseenter", function () { mark(i); });
      list.appendChild(li);
    });
    wrap.appendChild(list);

    var items = Array.prototype.slice.call(list.children);
    var val = btn.querySelector(".sel-val");
    var open = false, active = sel.selectedIndex < 0 ? 0 : sel.selectedIndex;

    function paint() {
      val.textContent = opts[sel.selectedIndex < 0 ? 0 : sel.selectedIndex].textContent;
      items.forEach(function (li, i) { li.setAttribute("aria-selected", i === sel.selectedIndex ? "true" : "false"); });
    }
    function mark(i) {
      active = i;
      items.forEach(function (li, k) { li.classList.toggle("act", k === i); });
      list.setAttribute("aria-activedescendant", "");
    }
    function pick(i) {
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      paint();
    }
    function openList() {
      if (open) return;

      var r = btn.getBoundingClientRect();
      var h = list.offsetHeight || 240;
      wrap.classList.toggle("up", (window.innerHeight - r.bottom) < h + 16 && r.top > (window.innerHeight - r.bottom));
      open = true; wrap.classList.add("open"); btn.setAttribute("aria-expanded", "true");
      mark(sel.selectedIndex < 0 ? 0 : sel.selectedIndex);
    }
    function close(focusBtn) {
      if (!open) return;
      open = false; wrap.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
      items.forEach(function (li) { li.classList.remove("act"); });
      if (focusBtn) btn.focus();
    }
    btn.addEventListener("click", function () { open ? close(false) : openList(); });
    btn.addEventListener("keydown", function (e) {
      var k = e.key;
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " " || k === "Spacebar") {
        e.preventDefault();
        if (!open) { openList(); return; }
        if (k === "Enter" || k === " " || k === "Spacebar") { pick(active); close(true); return; }
        mark(k === "ArrowDown" ? Math.min(items.length - 1, active + 1) : Math.max(0, active - 1));
      } else if (k === "Escape") { close(true); }
      else if (k === "Home" && open) { e.preventDefault(); mark(0); }
      else if (k === "End" && open) { e.preventDefault(); mark(items.length - 1); }
    });
    document.addEventListener("click", function (e) { if (!wrap.contains(e.target)) close(false); });
    btn.addEventListener("blur", function () { setTimeout(function () { if (!wrap.contains(document.activeElement)) close(false); }, 0); });
    paint();
  });
})();

(function () {
  "use strict";
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  Array.prototype.slice.call(document.querySelectorAll("[data-roomgal]")).forEach(function (box) {
    var rows = Array.prototype.slice.call(box.querySelectorAll(".dl-row"));
    var sets = Array.prototype.slice.call(box.querySelectorAll(".rg-set"));
    var frame = box.querySelector(".rg-frame"), main = box.querySelector(".rg-main");
    var idxEl = box.querySelector("[data-rg-idx]"), totEl = box.querySelector("[data-rg-total]");
    if (!rows.length || rows.length !== sets.length || !frame || !main) return;
    var room = 0, pic = 0, ratio = 4 / 3, sizeRaf = 0;
    function thumbs(r) { return Array.prototype.slice.call(sets[r].querySelectorAll(".rg-thumb")); }
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function size() {
      var w = frame.clientWidth; if (!w) return;
      frame.style.height = Math.round(w / ratio) + "px";
    }
    function show(r, p, instant) {
      var t = thumbs(r); if (!t.length) return;
      p = (p + t.length) % t.length;
      if (r !== room) {
        rows[room].classList.remove("is-on"); rows[room].querySelector("button").removeAttribute("aria-current"); sets[room].classList.remove("is-on");
        room = r;
        rows[room].classList.add("is-on"); rows[room].querySelector("button").setAttribute("aria-current", "true"); sets[room].classList.add("is-on");
      }
      t.forEach(function (a, i) { a.classList.toggle("is-on", i === p); });
      pic = p;
      var a = t[p], img = a.querySelector("img");
      var src = a.getAttribute("data-lightbox") || a.href;
      var w = parseFloat(a.getAttribute("data-w")), h = parseFloat(a.getAttribute("data-h"));
      if (w && h) { ratio = w / h; size(); }
      if (idxEl) idxEl.textContent = pad(p + 1);
      if (totEl) totEl.textContent = pad(t.length);
      var alt = img ? img.alt : "";
      if (instant || main.getAttribute("src") === src) { main.src = src; main.alt = alt; return; }
      frame.classList.add("is-swapping");
      var pre = new Image();
      pre.onload = function () { main.src = src; main.alt = alt; requestAnimationFrame(function () { frame.classList.remove("is-swapping"); }); };
      pre.onerror = function () { frame.classList.remove("is-swapping"); };
      pre.src = src;
    }
    rows.forEach(function (r, i) {
      var b = r.querySelector("button");
      b.addEventListener("click", function () { show(i, 0); });

    });
    sets.forEach(function (s, r) {
      thumbs(r).forEach(function (a, p) {

        a.addEventListener("click", function (e) {
          if (r !== room || p !== pic) { e.preventDefault(); e.stopImmediatePropagation(); show(r, p); }
        }, true);
      });
    });
    function openCurrent() { var t = thumbs(room); if (t[pic]) t[pic].click(); }
    frame.addEventListener("click", function (e) { if (e.target.closest(".rg-nav")) return; openCurrent(); });
    frame.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCurrent(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); show(room, pic + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); show(room, pic - 1); }
    });
    var prev = box.querySelector(".rg-prev"), next = box.querySelector(".rg-next");
    if (prev) prev.addEventListener("click", function (e) { e.stopPropagation(); show(room, pic - 1); });
    if (next) next.addEventListener("click", function (e) { e.stopPropagation(); show(room, pic + 1); });
    window.addEventListener("resize", function () { if (!sizeRaf) sizeRaf = requestAnimationFrame(function () { sizeRaf = 0; size(); }); });

    var STEP = 3000, timer = null, inView = false;
    function step() {
      var t = thumbs(room);
      if (pic + 1 < t.length) show(room, pic + 1); else show((room + 1) % rows.length, 0);
    }
    function arm() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (inView && !document.hidden && !document.querySelector(".lightbox.open")) step();
        arm();
      }, STEP);
    }

    box.addEventListener("pointerdown", arm, { passive: true });
    box.addEventListener("keydown", arm);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.3 }).observe(box);
    } else { inView = true; }
    show(0, 0, true);
    frame.style.aspectRatio = "";
    size();
    arm();

    var rr = box.querySelector(".rg-rows");
    if (rr) {
      var more = function () { rr.classList.toggle("is-more", rr.scrollWidth - rr.clientWidth - rr.scrollLeft > 4); };
      rr.addEventListener("scroll", more, { passive: true });
      window.addEventListener("resize", more, { passive: true });
      more();
    }
  });
})();
