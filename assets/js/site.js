// IdeaHome — interakciós réteg (vanilla JS, függőség nélkül)
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- LOADER (első látogatáskor) ---------- */
  (function () {
    var loader = $("#loader");
    if (!loader) return;
    var hide = function () { loader.classList.add("done"); setTimeout(function () { loader.style.display = "none"; }, 950); };
    if (reduce || sessionStorage.getItem("ih_seen")) { loader.style.display = "none"; return; }
    sessionStorage.setItem("ih_seen", "1");
    requestAnimationFrame(function () { loader.classList.add("reveal-mark"); });
    window.addEventListener("load", function () { setTimeout(hide, 650); });
    setTimeout(hide, 2400); // fallback
  })();

  /* ---------- NAV ---------- */
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

  /* ---------- SERVICES DROPDOWN (touch / keyboard; CSS handles hover) ---------- */
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

  /* ---------- REVEALS ---------- */
  var targets = $$(".reveal, .mask-head, .img-reveal, .pcard, .gallery-item");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- CUSTOM CURSOR + MAGNETIC ---------- */
  if (fine && !reduce) {
    var ring = document.createElement("div"); ring.className = "cursor-ring"; ring.innerHTML = '<span class="cl"></span>';
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    document.body.appendChild(ring); document.body.appendChild(dot);
    document.body.classList.add("has-cursor");
    var label = ring.querySelector(".cl");
    var rx = 0, ry = 0, dx = 0, dy = 0, tx = 0, ty = 0, ready = false;
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!ready) { ready = true; document.body.classList.add("cursor-ready"); rx = dx = tx; ry = dy = ty; }
    });
    document.addEventListener("mouseleave", function () { document.body.classList.add("cursor-hide"); });
    document.addEventListener("mouseenter", function () { document.body.classList.remove("cursor-hide"); });
    (function loop() {
      rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16; dx += (tx - dx) * 0.42; dy += (ty - dy) * 0.42;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      dot.style.transform = "translate(" + dx + "px," + dy + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    $$("a, button, [data-magnetic]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { document.body.classList.add("cursor-hover"); });
      el.addEventListener("mouseleave", function () { document.body.classList.remove("cursor-hover"); });
    });
    $$("[data-view], .work, .pcard, .gallery-item, .next-project").forEach(function (el) {
      el.addEventListener("mouseenter", function () { document.body.classList.add("cursor-view"); label.textContent = el.getAttribute("data-view") || "Megnézem"; });
      el.addEventListener("mouseleave", function () { document.body.classList.remove("cursor-view"); });
    });
    // magnetic
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + mx * 0.28 + "px," + my * 0.4 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- PARALLAX (finom) ---------- */
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

  /* ---------- LIGHTBOX (projekt galéria) ---------- */
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

  /* ---------- PORTFÓLIÓ SZŰRŐ ---------- */
  var chips = $$(".chip[data-filter]");
  if (chips.length) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        var f = chip.getAttribute("data-filter");
        $$(".pcard").forEach(function (card) {
          var show = f === "all" || card.getAttribute("data-cat") === f;
          card.classList.toggle("hide", !show);
        });
      });
    });
  }

  /* ---------- ÉV ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- PRÉMIUM MOZGÁS (progressive enhancement: GSAP scrub + Three.js textúra) ----------
     NINCS scroll-hijack (Lenis kivéve, mert a body overflow-x:hidden-nel megfojtotta a görgetést).
     Robosztus: reduced-motion alatt kimarad; CDN-hiba esetén minden marad (natív scroll,
     CSS/IO reveal, pine heró-háttér). A görgetés és a tartalom SOHA nem függ ezektől. */
  (function () {
    if (reduce) return;
    function load(src) {
      return new Promise(function (res, rej) {
        var s = document.createElement("script");
        s.src = src; s.async = true; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }

    // GSAP + ScrollTrigger — NATÍV scrollon (nincs scroll-hijack), CSAK dekoratív scrub.
    // A görgetés sosem függ ettől; reveal marad IO-n.
    Promise.all([
      load("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"),
      load("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js")
    ]).then(function () {
      if (!window.gsap || !window.ScrollTrigger) return;
      gsap.registerPlugin(ScrollTrigger);
      // signature: heró ív-keret mélység-parallax
      $$(".hero-frame.arch").forEach(function (frame) {
        var hero = frame.closest(".hero");
        if (!hero) return;
        gsap.to(frame, { yPercent: 7, ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      });
      // finom mélység a galéria-képeken (a belső img reveal-scale-jét nem érinti, a keretet mozgatja)
      $$(".work .ph, .pcard .ph").forEach(function (ph) {
        gsap.fromTo(ph, { yPercent: -3 }, { yPercent: 3, ease: "none",
          scrollTrigger: { trigger: ph, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }).catch(function () {});

    // 3) Three.js finom heró-textúra (dekoratív; a pine háttér a fallback)
    var heroDark = $(".hero-dark");
    if (heroDark && window.innerWidth > 720) {
      load("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js").then(function () {
        if (!window.THREE) return;
        try { initHeroTexture(heroDark); } catch (e) {}
      }).catch(function () {});
    }

    function initHeroTexture(host) {
      var THREE = window.THREE;
      var canvas = document.createElement("canvas");
      canvas.className = "hero-fx";
      host.insertBefore(canvas, host.firstChild);
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      var scene = new THREE.Scene();
      var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      var uniforms = { u_time: { value: 0 }, u_res: { value: new THREE.Vector2(1, 1) } };
      var mat = new THREE.ShaderMaterial({
        uniforms: uniforms, transparent: true,
        vertexShader: "void main(){ gl_Position = vec4(position,1.0); }",
        fragmentShader: [
          "precision highp float;",
          "uniform float u_time; uniform vec2 u_res;",
          "float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }",
          "float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f);",
          " return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y); }",
          "void main(){ vec2 uv=gl_FragCoord.xy/u_res.xy; float t=u_time*0.025;",
          " float n=noise(uv*3.0+vec2(t,t*0.6))*0.6+noise(uv*6.0-vec2(t*0.4,t))*0.4;",
          " float g=hash(gl_FragCoord.xy+vec2(u_time))*0.05;",
          " float glow=smoothstep(0.95,0.15,distance(uv,vec2(0.72,0.4)));",
          " vec3 col=vec3(0.13,0.21,0.17)*n + vec3(0.20,0.30,0.24)*glow*0.5;",
          " float a=(n*0.18+glow*0.10+g);",
          " gl_FragColor=vec4(col, a*0.55); }"
        ].join("\n")
      });
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
      function resize() {
        var w = host.clientWidth, h = host.clientHeight;
        renderer.setSize(w, h, false);
        uniforms.u_res.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
      }
      resize();
      window.addEventListener("resize", resize, { passive: true });
      var start = performance.now(), shown = false;
      (function anim() {
        uniforms.u_time.value = (performance.now() - start) / 1000;
        renderer.render(scene, camera);
        if (!shown) { shown = true; canvas.classList.add("on"); }
        requestAnimationFrame(anim);
      })();
    }
  })();

  /* ---------- KÉPROTÁTOR (szöveg mellett folyamatosan váltakozó képek) ---------- */
  (function () {
    $$("[data-rotator]").forEach(function (rot) {
      var imgs = $$("img", rot);
      if (imgs.length < 2) { if (imgs[0]) imgs[0].classList.add("on"); return; }
      imgs.forEach(function (im, i) { im.classList.toggle("on", i === 0); });
      if (reduce) return; // statikus első kép
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

  /* ---------- PROJEKT-CAROUSEL (kattintással mozgatható sor) ---------- */
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

  /* ---------- LENIS smooth scroll (hivatalos recept; robosztus fallback) ----------
     reduced-motion alatt KIMARAD (natív). CDN-hiba esetén lenis=null → natív scroll,
     az oldal teljes. overflow-x:clip (NEM hidden) + lenis.css már a CSS-ben.
     self-driven rAF (NEM gsap.ticker). Menü nyitásnál stop()/start(). */
  (function () {
    if (reduce) return;
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js";
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

  /* ---------- AJÁNLÁS-ACCORDION (vízszintes kibővülő kártyák) ---------- */
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

  /* ---------- SZÁMLÁLÓ (data-count) — IntersectionObserver, gsap nélkül ---------- */
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

  /* ---------- HALADÓ SCROLL-MOTION (gsap-ra vár; degradálható) ----------
     Pin-scene, horizontal works galéria, side-slide split, sticky-stack,
     scroll-scrub videó. gsap nélkül a CSS fallback mindent láthatóvá tesz. */
  (function () {
    if (reduce) return;
    var tries = 0;
    (function waitGSAP() {
      if (window.gsap && window.ScrollTrigger) { initAdvanced(); return; }
      if (tries++ > 40) return; // ~4s — ha nincs gsap, CSS fallback marad
      setTimeout(waitGSAP, 100);
    })();

    function initAdvanced() {
      var gsap = window.gsap, ST = window.ScrollTrigger;
      gsap.registerPlugin(ST);
      ST.config({ ignoreMobileResize: true }); // ne számoljon újra a mobil URL-sáv mozgásától

      // 1) SCROLL-SCRUB VIDEÓ HERO — vajsima (rAF-lerp + all-intra mp4)
      // FEKETE-VILLANÁS FIX: (a) poszter-fedő réteg, amíg az első frame TÉNYLEG dekódolt;
      // (b) egyszeri play().then(pause) prime — enélkül Safari sosem fest frame-et;
      // (c) currentTime-írás csak dekódolható állapotban, throttle-lal (seek-storm ellen);
      // (d) load() csak akkor, ha a letöltés el sem indult (a feltétel nélküli load()
      //     mindent resetelt). A videófájl és a pin-viselkedés ÉRINTETLEN.
      $$("[data-scrub-video]").forEach(function (host) {
        var vid = host.querySelector("video");
        if (!vid) return;
        try { vid.pause(); } catch (e) {}
        var target = 0, cur = 0, dur = 5, raf = 0, canSeek = false, primed = false;

        // poszter-fedő a videó FÖLÉ (abszolút réteg, a host magasságát nem érinti)
        var cover = null, posterSrc = vid.getAttribute("poster");
        if (posterSrc) {
          cover = document.createElement("div");
          cover.className = "scrub-hero__cover";
          cover.style.backgroundImage = "url('" + posterSrc + "')";
          (vid.parentElement || host).appendChild(cover);
        }
        function uncover() {
          canSeek = true;
          if (cover) { cover.classList.add("off"); cover = null; }
        }
        if (window.HTMLVideoElement && "requestVideoFrameCallback" in HTMLVideoElement.prototype) {
          vid.requestVideoFrameCallback(function () { uncover(); });
        }
        vid.addEventListener("loadeddata", uncover, { once: true });

        // dekódolás-prime: muted+playsinline mellett engedélyezett, egyszeri
        function prime() {
          if (primed) return; primed = true;
          try {
            var p = vid.play();
            if (p && p.then) p.then(function () { vid.pause(); }).catch(function () {});
          } catch (e) {}
        }

        function loop() {
          cur += (target - cur) * 0.12;
          if (canSeek && vid.readyState >= 2 && !vid.seeking && isFinite(dur) && dur > 0) {
            var t = Math.max(0, Math.min(dur - 0.05, cur));
            // csak érdemi delta esetén írunk (≥ ~1 frame @30fps) — nincs seek-vihar
            if (Math.abs(t - vid.currentTime) > 0.034) {
              try { vid.currentTime = t; } catch (e) {}
            }
          }
          if (Math.abs(target - cur) > 0.004) raf = requestAnimationFrame(loop);
          else raf = 0;
        }
        // A pin AZONNAL létrejön (default dur=5) → a 200% pin-hely a kezdetektől foglalt,
        // így hálózaton a lassan betöltő videó NEM okoz késői layout-ugrást. A dur csak
        // frissül, amint a metaadat megvan; a poszter addig is látszik.
        ST.create({
          trigger: host, start: "top top", end: "+=200%", pin: true, scrub: true, anticipatePin: 1,
          onUpdate: function (self) {
            target = dur * self.progress;
            if (!raf) raf = requestAnimationFrame(loop);
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

      // 2) PIN SCENE — kép ráközelít, cím feljön
      $$("[data-scene]").forEach(function (sc) {
        var img = sc.querySelector(".scene__img"), title = sc.querySelector(".scene__title");
        var tl = gsap.timeline({ scrollTrigger: { trigger: sc, start: "top top", end: "+=120%", scrub: 1, pin: true } });
        if (img) tl.from(img, { scale: 1.45, yPercent: 16, ease: "none" }, 0);
        if (title) tl.from(title, { yPercent: 60, opacity: 0, ease: "none" }, 0);
      });

      // 3) HORIZONTAL works galéria — pin + translateX
      $$("[data-hscroll]").forEach(function (hs) {
        var track = hs.querySelector(".hscroll__track");
        if (!track) return;
        hs.style.overflow = "hidden";
        hs.style.height = "100vh"; // csak a gsap-pinnelt galéria tölti ki a viewportot (középre)
        gsap.to(track, {
          x: function () { return -(track.scrollWidth - window.innerWidth + 40); }, ease: "none",
          scrollTrigger: { trigger: hs, start: "top top", pin: true, scrub: 1,
            end: function () { return "+=" + (track.scrollWidth - window.innerWidth + 40); }, invalidateOnRefresh: true }
        });
      });

      // 4) SIDE-SLIDE split — kép oldalról úszik be (scrollhoz kötve), belül finom zoom
      gsap.utils.toArray("[data-slide]").forEach(function (fig) {
        var dir = fig.getAttribute("data-slide") === "right" ? 1 : -1;
        var row = fig.closest(".split-motion") || fig;
        gsap.fromTo(fig, { xPercent: dir * 14, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, ease: "none",
          scrollTrigger: { trigger: row, start: "top 85%", end: "top 45%", scrub: 1 } });
        var img = fig.querySelector("img");
        if (img) gsap.fromTo(img, { scale: 1.22 }, { scale: 1, ease: "none",
          scrollTrigger: { trigger: row, start: "top 92%", end: "top 35%", scrub: 1 } });
      });

      // 5) STICKY-STACK — TISZTA CSS sticky, gsap NÉLKÜL (nincs scale/opacity → nem akad
      //    betöltéskor). A kártyák opakok, maguktól fedik egymást. Bulletproof.

      // 6) finom „követő" parallax a data-follow elemekre
      $$("[data-follow]").forEach(function (el) {
        var amt = parseFloat(el.getAttribute("data-follow")) || 0.15;
        gsap.to(el, { yPercent: amt * -100, ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });

      // ROBUSZTUS REFRESH — DEBOUNCE-olt, RITKA frissítés.
      // FONTOS: pinnelt szekciónál a gyakori (pl. képenkénti) refresh megugratja a scrollt
      // → ezért csak néhányszor frissítünk, görgetés közben SOHA. A képek aspect-ratio-val
      // helyet foglalnak (nincs layout-shift), így nem is kell képenként újraszámolni.
      // ROBUSZTUS REFRESH — SOHA görgetés közben. A pin-újraszámítás görgetés közben
      // megugratja a scrollt (ez a "lassú görgetésre buggos"). Csak akkor frissítünk,
      // ha a felhasználó legalább 600 ms-ig nem görgetett (idle).
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
      setTimeout(refreshSoon, 1500); // utolsó biztosíték, mire a lusta képek beértek
    }
  })();
})();
