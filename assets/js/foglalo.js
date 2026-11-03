(function () {
  "use strict";
  var FOGLALO_API = "https://ideahome-foglalo.pages.dev";
  var TEL_TXT = "+36 30 713 1116";
  var TEL_HREF = "tel:+36307131116";
  var TZ = "Europe/Budapest";
  var IDOKORLAT = 12000;

  var root = document.getElementById("bk");
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var form = $("bk-form"), cal = $("bk-cal"), moEl = $("bk-mo"), prevBtn = $("bk-prev"), nextBtn = $("bk-next");
  var slotsEl = $("bk-slots"), dayLabel = $("bk-day-label"), sumEl = $("bk-sum"), msgEl = $("bk-msg");
  var submitBtn = $("bk-submit"), placeEl = $("bk-place"), live = $("bk-live"), calm = $("bk-calm");
  var done = $("bk-done"), doneT = $("bk-done-t"), doneMeet = $("bk-done-meet");
  var napNote = $("bk-nap-note"), idoNote = $("bk-ido-note");

  var HONAP = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
  var NAP = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];

  var napok = {};
  var napLista = [];
  var honapok = [];
  var hoIdx = 0;
  var valasztott = { datum: null, ido: null };
  var kuldes = false;
  var keresSzam = 0;

  function maBudapest() {
    try {
      var p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
    } catch (e) {}
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoD(iso) { var a = iso.split("-"); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2], 12)); }
  function dIso(d) { return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  function plusz(iso, n) { var d = isoD(iso); d.setUTCDate(d.getUTCDate() + n); return dIso(d); }
  function napNev(iso) { var d = isoD(iso); return HONAP[d.getUTCMonth()] + " " + d.getUTCDate() + "., " + NAP[d.getUTCDay()]; }
  function idoTxt(t) { return String(t).replace(/^0(\d)/, "$1"); }
  function honapCim(ym) { var a = ym.split("-"); return a[0] + ". " + HONAP[+a[1] - 1]; }

  function mond(t) { live.textContent = ""; setTimeout(function () { live.textContent = t; }, 40); }
  function hivjonHtml() { return '<a href="' + TEL_HREF + '">' + TEL_TXT + "</a>"; }

  function allapot(a) {
    root.setAttribute("data-allapot", a);
    root.setAttribute("aria-busy", a === "betolt" ? "true" : "false");
  }
  function nyugodt(szoveg, ujra) {
    calm.innerHTML = '<p class="bk-calm-t">' + szoveg + "</p>" +
      (ujra ? '<button type="button" class="btn btn-ghost bk-retry" id="bk-retry"><span>Újrapróbálom</span></button>' : "");
    allapot("nyugodt");
    var rb = $("bk-retry");
    if (rb) rb.addEventListener("click", function () {
      rb.disabled = true;
      allapot("betolt");
      betolt(true).then(function (ok) { if (ok) { var f = cal.querySelector('[tabindex="0"]'); if (f) f.focus(); } else { var r2 = $("bk-retry"); if (r2) r2.focus(); } });
    });
  }
  var CALM_HAMAROSAN = "Az online foglalás hamarosan elérhető. Addig kérem, írjon az alábbi űrlapon vagy hívjon: ";
  var CALM_HIBA = "Az online foglalás most nem érhető el. Kérem, írjon az alábbi űrlapon vagy hívjon: ";
  var CALM_ATMENETI = "Most nem sikerült betölteni az időpontokat. Kérem, próbálja újra egy perc múlva, vagy hívjon: ";
  var CALM_TELE = "A következő hetekben most nincs szabad időpont. Kérem, írjon az alábbi űrlapon vagy hívjon: ";

  function keres(ut, opt) {
    opt = opt || {};
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, IDOKORLAT) : null;
    if (ctrl) opt.signal = ctrl.signal;
    opt.credentials = "omit";
    return fetch(FOGLALO_API + ut, opt).then(function (r) {
      if (t) clearTimeout(t);
      return r.text().then(function (s) {
        var j = null; try { j = s ? JSON.parse(s) : null; } catch (e) {}
        return { status: r.status, json: j };
      });
    }, function (e) { if (t) clearTimeout(t); throw e; });
  }

  function betolt(megtart, modValtas) {
    var ma = maBudapest();
    var sajat = ++keresSzam;
    var m = mod();
    return keres("/api/szabad-idopontok?tol=" + ma + "&ig=" + plusz(ma, 61) + "&mod=" + m, { method: "GET" }).then(function (r) {
      if (sajat !== keresSzam) return null;
      var j = r.json;
      if (r.status === 503 && j && j.kapcsolat === true) { nyugodt(CALM_ATMENETI + hivjonHtml() + ".", true); return false; }
      if (r.status !== 200 || !j) { nyugodt(CALM_HIBA + hivjonHtml() + ".", true); return false; }
      if (j.kapcsolat !== true) { nyugodt(CALM_HAMAROSAN + hivjonHtml() + "."); return false; }
      napok = {}; napLista = [];
      (j.napok || []).forEach(function (n) {
        if (n && /^\d{4}-\d{2}-\d{2}$/.test(n.datum) && n.idopontok && n.idopontok.length) {
          napok[n.datum] = n.idopontok.slice().sort(); napLista.push(n.datum);
        }
      });
      napLista.sort();
      if (!napLista.length && modValtas && honapok.length) {
        valasztott.datum = null; valasztott.ido = null;
        rajzolHonap(); rajzolIdok(); osszeg();
        jegyzet(napNote, (m === "szemelyes" ? "Személyes" : "Online") + " egyeztetésre a következő hetekben nincs szabad időpont. Kérem, válasszon másik módot, vagy hívjon: " + hivjonHtml() + ".");
        return true;
      }
      if (!napLista.length) { nyugodt(CALM_TELE + hivjonHtml() + "."); return false; }
      honapok = [];
      napLista.forEach(function (d) { var ym = d.slice(0, 7); if (honapok.indexOf(ym) < 0) honapok.push(ym); });
      if (!megtart || (valasztott.datum && !napok[valasztott.datum])) valasztott.datum = null;
      if (valasztott.ido && (!valasztott.datum || napok[valasztott.datum].indexOf(valasztott.ido) < 0)) valasztott.ido = null;
      var ym = (valasztott.datum || napLista[0]).slice(0, 7);
      hoIdx = Math.max(0, honapok.indexOf(ym));
      allapot("kesz-valaszt");
      rajzolHonap(); rajzolIdok(); osszeg();
      return true;
    }, function () { if (sajat !== keresSzam) return null; nyugodt(CALM_HIBA + hivjonHtml() + ".", true); return false; });
  }

  function rajzolHonap() {
    var ym = honapok[hoIdx];
    moEl.textContent = honapCim(ym);
    prevBtn.disabled = hoIdx <= 0;
    nextBtn.disabled = hoIdx >= honapok.length - 1;
    var a = ym.split("-"), y = +a[0], m = +a[1] - 1;
    var napSzam = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    var html = "", elso = true;
    for (var d = 1; d <= napSzam; d++) {
      var iso = y + "-" + pad(m + 1) + "-" + pad(d);
      var dow = isoD(iso).getUTCDay();
      if (dow === 0 || dow === 6) continue;
      if (elso) { for (var k = 1; k < dow; k++) html += '<span class="bk-d is-pad" aria-hidden="true"></span>'; elso = false; }
      if (napok[iso]) {
        var sel = iso === valasztott.datum;
        var db = napok[iso].length;
        html += '<button type="button" class="bk-d" role="radio" data-d="' + iso + '" aria-checked="' + sel + '" tabindex="-1" aria-label="' +
          napNev(iso) + ", " + db + " szabad időpont" + '">' + d + "</button>";
      } else {
        html += '<span class="bk-d is-off" aria-hidden="true">' + d + "</span>";
      }
    }
    cal.innerHTML = html;
    roving(cal);
  }

  function roving(csop) {
    var gombok = csop.querySelectorAll('[role="radio"]');
    if (!gombok.length) return;
    var akt = csop.querySelector('[aria-checked="true"]') || gombok[0];
    for (var i = 0; i < gombok.length; i++) gombok[i].tabIndex = gombok[i] === akt ? 0 : -1;
  }
  function nyilak(csop, e, valaszt) {
    var k = e.key;
    if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].indexOf(k) < 0) return;
    var gombok = Array.prototype.slice.call(csop.querySelectorAll('[role="radio"]'));
    var i = gombok.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    var j = k === "Home" ? 0 : k === "End" ? gombok.length - 1 : (k === "ArrowRight" || k === "ArrowDown") ? i + 1 : i - 1;
    if (j < 0 || j >= gombok.length) return;
    valaszt(gombok[j], true);
  }

  function napValaszt(gomb, fokusz) {
    var iso = gomb.getAttribute("data-d");
    var horgony = rogzit(gomb);
    if (valasztott.datum !== iso) valasztott.ido = null;
    valasztott.datum = iso;
    var gs = cal.querySelectorAll('[role="radio"]');
    for (var i = 0; i < gs.length; i++) gs[i].setAttribute("aria-checked", gs[i] === gomb ? "true" : "false");
    roving(cal);
    if (fokusz) gomb.focus({ preventScroll: true });
    jegyzet(napNote, ""); jegyzet(idoNote, "");
    rajzolIdok(); osszeg(); uzenetEl();
    mond(napNev(iso) + ": " + napok[iso].length + " szabad időpont.");
    helyreAll(horgony, function () { kovetkezoLatszik(slotsEl.firstElementChild || slotsEl, gomb); });
  }
  cal.addEventListener("click", function (e) { var g = e.target.closest("[data-d]"); if (g) napValaszt(g, false); });
  cal.addEventListener("keydown", function (e) { nyilak(cal, e, napValaszt); });
  prevBtn.addEventListener("click", function () { if (hoIdx > 0) { hoIdx--; rajzolHonap(); } });
  nextBtn.addEventListener("click", function () { if (hoIdx < honapok.length - 1) { hoIdx++; rajzolHonap(); } });

  function rajzolIdok() {
    if (!valasztott.datum) {
      dayLabel.textContent = "Előbb válasszon napot.";
      dayLabel.classList.add("is-empty");
      slotsEl.innerHTML = "";
      return;
    }
    dayLabel.textContent = napNev(valasztott.datum);
    dayLabel.classList.remove("is-empty");
    var html = "";
    napok[valasztott.datum].forEach(function (t) {
      html += '<button type="button" class="bk-slot" role="radio" data-t="' + t + '" aria-checked="' + (t === valasztott.ido) + '" tabindex="-1">' + idoTxt(t) + "</button>";
    });
    slotsEl.innerHTML = html;
    roving(slotsEl);
  }
  function idoValaszt(gomb, fokusz) {
    var horgony = rogzit(gomb);
    valasztott.ido = gomb.getAttribute("data-t");
    var gs = slotsEl.querySelectorAll('[role="radio"]');
    for (var i = 0; i < gs.length; i++) gs[i].setAttribute("aria-checked", gs[i] === gomb ? "true" : "false");
    roving(slotsEl);
    if (fokusz) gomb.focus({ preventScroll: true });
    jegyzet(idoNote, "");
    osszeg(); uzenetEl();
    mond("Kiválasztva: " + napNev(valasztott.datum) + ", " + idoTxt(valasztott.ido) + ".");
    helyreAll(horgony, function () { kovetkezoLatszik($("bk-nev"), gomb); });
  }
  slotsEl.addEventListener("click", function (e) { var g = e.target.closest("[data-t]"); if (g) idoValaszt(g, false); });
  slotsEl.addEventListener("keydown", function (e) { nyilak(slotsEl, e, idoValaszt); });

  function mod() { var r = form.querySelector('input[name="mod"]:checked'); return r ? r.value : "online"; }
  function modJelol() {
    var cimkek = form.querySelectorAll(".bk-mode");
    for (var i = 0; i < cimkek.length; i++) { var inp = cimkek[i].querySelector("input"); cimkek[i].classList.toggle("is-on", !!(inp && inp.checked)); }
  }

  form.addEventListener("change", function (e) {
    if (e.target.name !== "mod") return;
    var cimke = e.target.closest(".bk-mode");
    var horgony = cimke ? rogzit(cimke) : null;
    modJelol();
    placeEl.hidden = mod() !== "szemelyes";
    jegyzet(napNote, ""); jegyzet(idoNote, "");
    osszeg(); uzenetEl();
    if (horgony) helyreAll(horgony);
    var volt = { datum: valasztott.datum, ido: valasztott.ido }, m = mod();
    root.classList.add("is-frissit");
    if (volt.datum) { dayLabel.textContent = "Szabad időpontok frissítése…"; dayLabel.classList.add("is-empty"); }
    betolt(true, true).then(function (ok) {
      if (ok === null) return;
      root.classList.remove("is-frissit");
      if (!ok) { rajzolIdok(); return; }
      if (m !== mod()) return;
      var nev = m === "szemelyes" ? "személyes" : "online";
      if (volt.datum && !valasztott.datum) {
        jegyzet(napNote, "<b>" + nagy(napNev(volt.datum)) + "</b> " + nev + " egyeztetésre nem foglalható, ezért a nap kiválasztása törlődött. Kérem, válasszon a kiemelt napok közül." +
          (m === "szemelyes" ? " Személyes egyeztetésre legkorábban holnaputánra, 9:00-ra vagy 13:00-ra lehet foglalni." : ""));
      } else if (volt.ido && !valasztott.ido) {
        jegyzet(idoNote, "A <b>" + idoTxt(volt.ido) + "</b> " + nev + " egyeztetésre nem foglalható ezen a napon, ezért törlődött. Kérem, válasszon a felkínált időpontok közül." +
          (m === "szemelyes" ? " Személyes egyeztetés 9:00-kor vagy 13:00-kor kezdődhet." : ""));
      }
      if (horgony) helyreAll(horgony);
    });
  });
  modJelol();

  function osszeg() {
    if (valasztott.datum && valasztott.ido) {
      sumEl.textContent = napNev(valasztott.datum) + ", " + idoTxt(valasztott.ido) + " · " + (mod() === "online" ? "online" : "személyesen");
      sumEl.classList.remove("is-empty");
    } else if (valasztott.datum) {
      sumEl.textContent = napNev(valasztott.datum) + ", időpont még nincs kiválasztva";
      sumEl.classList.add("is-empty");
    } else {
      sumEl.textContent = "Még nincs kiválasztva";
      sumEl.classList.add("is-empty");
    }
  }

  var MEZOK = { nev: "bk-nev", email: "bk-email", telefon: "bk-tel", uzenet: "bk-uzenet" };
  function mezoHiba(nev, szoveg) {
    var inp = $(MEZOK[nev]), h = $(MEZOK[nev] + "-h");
    if (!inp || !h) return;
    h.textContent = szoveg || "";
    if (szoveg) inp.setAttribute("aria-invalid", "true"); else inp.removeAttribute("aria-invalid");
  }
  function ertek(nev) { var el = $(MEZOK[nev]); return el ? el.value.trim() : ""; }
  function ellenoriz(nev) {
    var v = ertek(nev);
    if (nev === "nev") return v.length < 2 ? "Kérem, adja meg a nevét." : v.length > 100 ? "A név legfeljebb 100 karakter lehet." : "";
    if (nev === "email") return !v ? "Kérem, adja meg az e-mail-címét." : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "Kérem, ellenőrizze az e-mail-címet." : "";
    if (nev === "telefon") {
      if (!v) return "Kérem, adja meg a telefonszámát.";
      if (!/^[0-9+\-\s()\/]+$/.test(v) || (v.match(/\d/g) || []).length < 8) return "Kérem, ellenőrizze a telefonszámot (legalább 8 számjegy).";
      return "";
    }
    if (nev === "uzenet") return v.length > 1000 ? "Az üzenet legfeljebb 1000 karakter lehet." : "";
    return "";
  }
  Object.keys(MEZOK).forEach(function (nev) {
    var el = $(MEZOK[nev]);
    el.addEventListener("blur", function () { if (el.value.trim() || el.hasAttribute("aria-invalid")) mezoHiba(nev, ellenoriz(nev)); });
    el.addEventListener("input", function () { if (el.hasAttribute("aria-invalid")) mezoHiba(nev, ""); });
  });

  function uzenet(html) { msgEl.innerHTML = html; msgEl.hidden = false; msgEl.focus({ preventScroll: true }); gorget(msgEl); }
  function uzenetEl() { if (!msgEl.hidden) { msgEl.hidden = true; msgEl.innerHTML = ""; } }

  function jegyzet(el, html) {
    if (!el) return;
    if (!html) { if (!el.hidden) { el.hidden = true; el.innerHTML = ""; } return; }
    el.innerHTML = html; el.hidden = false;
  }
  function nagy(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function rogzit(el) { return { el: el, top: el.getBoundingClientRect().top + window.pageYOffset }; }
  function gorgetY(y, sima) {
    y = Math.max(0, Math.round(y));
    var l = window.__lenis;
    if (l && l.scrollTo) l.scrollTo(y, sima ? { lerp: 0.12, force: true } : { immediate: true, force: true });
    else if (sima) window.scrollTo({ top: y, behavior: "smooth" });
    else window.scrollTo(0, y);
  }
  function eltolodas(h) { return h.el.getBoundingClientRect().top + window.pageYOffset - h.top; }
  function helyreAll(h, utana) {
    var d = eltolodas(h);
    if (Math.abs(d) > 1) { gorgetY(window.pageYOffset + d, false); h.top += d; }
    requestAnimationFrame(function () {
      var d2 = eltolodas(h);
      if (Math.abs(d2) > 1) { gorgetY(window.pageYOffset + d2, false); h.top += d2; }
      if (utana) requestAnimationFrame(utana);
    });
  }
  function kovetkezoLatszik(cel, gomb) {
    if (!cel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var kell = cel.getBoundingClientRect().bottom - (window.innerHeight - 24);
    if (kell <= 0) return;
    var nav = document.getElementById("nav");
    var felso = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
    var hely = gomb.getBoundingClientRect().top - felso - 16;
    var tav = Math.min(kell, hely);
    if (tav < 8) return;
    gorgetY(window.pageYOffset + tav, true);
  }

  function gorget(el) {
    var r = el.getBoundingClientRect();
    if (r.top >= 80 && r.bottom <= window.innerHeight) return;
    var y = window.pageYOffset + r.top - Math.max(100, window.innerHeight * 0.25);
    if (window.__lenis && window.__lenis.scrollTo) window.__lenis.scrollTo(y, { immediate: true });
    else window.scrollTo(0, y);
  }

  function foglal(on) {
    kuldes = on;
    submitBtn.disabled = on;
    submitBtn.classList.toggle("is-busy", on);
    submitBtn.firstElementChild.textContent = on ? "Foglalás folyamatban" : "Időpontot kérek";
    form.setAttribute("aria-busy", on ? "true" : "false");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (kuldes) return;
    uzenetEl();
    if (!valasztott.datum || !valasztott.ido) {
      uzenet("Kérem, válasszon <b>" + (valasztott.datum ? "időpontot" : "napot és időpontot") + "</b> a foglaláshoz.");
      return;
    }
    var elsoHibas = null;
    Object.keys(MEZOK).forEach(function (nev) {
      var h = ellenoriz(nev); mezoHiba(nev, h);
      if (h && !elsoHibas) elsoHibas = $(MEZOK[nev]);
    });
    if (elsoHibas) { elsoHibas.focus(); mond("Kérem, javítsa a megjelölt mezőket."); return; }

    var adat = {
      datum: valasztott.datum, ido: valasztott.ido,
      nev: ertek("nev"), email: ertek("email"), telefon: ertek("telefon"),
      mod: mod(), uzenet: ertek("uzenet"), website: ($("bk-website").value || "")
    };
    foglal(true);
    keres("/api/foglalas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(adat) }).then(function (r) {
      foglal(false);
      var j = r.json || {};
      if (r.status === 201 && j.ok && j.datum && j.ido) { siker(j, adat.mod); return; }
      if (r.status === 409) {
        valasztott.ido = null;
        betolt(true).then(function (ok) {
          if (!ok) return;
          uzenet("<b>Ezt az időpontot közben lefoglalták.</b> Kérem, válasszon másikat. Az adatai megmaradtak.");
        });
        return;
      }
      if (r.status === 422 && j.mezok) {
        var elso = null, egyeb = [];
        Object.keys(j.mezok).forEach(function (nev) {
          if (MEZOK[nev]) { mezoHiba(nev, String(j.mezok[nev])); if (!elso) elso = $(MEZOK[nev]); }
          else egyeb.push(String(j.mezok[nev]));
        });
        if (j.mezok.datum || j.mezok.ido) {
          valasztott.ido = null;
          betolt(true).then(function (ok) { if (ok) uzenet(egyeb.map(esc).join(" ") + " Kérem, válasszon időpontot a frissített listából."); });
          return;
        }
        if (egyeb.length) uzenet(egyeb.map(esc).join(" "));
        else if (elso) { elso.focus(); mond("Kérem, javítsa a megjelölt mezőket."); }
        return;
      }
      if (r.status === 429) {
        uzenet(mondat(j.uzenet, "Túl sok foglalási kísérlet érkezett erről a hálózatról. Kérem, próbálja újra később.") + " Ha sürgős, hívjon: " + hivjonHtml() + ".");
        return;
      }
      if (r.status === 502) {
        uzenet(mondat(j.uzenet, "A foglalást most nem sikerült rögzíteni a naptárban.") + " Kérem, próbálja újra néhány perc múlva, vagy hívjon: " + hivjonHtml() + ".");
        return;
      }

      uzenet("A foglalás most nem sikerült. Kérem, próbálja újra néhány perc múlva, vagy hívjon: " + hivjonHtml() + ".");
    }, function () {
      foglal(false);
      uzenet("A foglalás most nem sikerült, mert a kapcsolat megszakadt. Kérem, próbálja újra, vagy hívjon: " + hivjonHtml() + ".");
    });
  });

  function mondat(u, alap) { u = typeof u === "string" ? u.trim() : ""; return esc(u && u.length <= 300 ? u : alap); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function siker(j, kuldottMod) {
    doneT.textContent = "Köszönöm, a foglalás rögzítve: " + napNev(j.datum) + ", " + idoTxt(j.ido) + ". A visszaigazolást e-mailben küldi a Google Naptár.";
    var m = j.mod || kuldottMod;
    if (m === "online" && j.meetLink && /^https:\/\/meet\.google\.com\//.test(j.meetLink)) {
      doneMeet.innerHTML = 'A konzultáció Google Meeten lesz: <a href="' + esc(j.meetLink) + '" target="_blank" rel="noopener">' + esc(j.meetLink.replace(/^https:\/\//, "")) + "</a>";
      doneMeet.hidden = false;
    } else if (m === "szemelyes") {
      doneMeet.textContent = "Személyes egyeztetés esetén a helyszínt telefonon egyeztetjük.";
      doneMeet.hidden = false;
    } else {
      doneMeet.hidden = true;
    }
    allapot("kesz");
    done.hidden = false;
    done.focus({ preventScroll: true });
    gorget(done);
  }

  allapot("betolt");
  rajzolIdok(); osszeg();
  betolt(false).then(function () {

    if (location.hash === "#foglalas") {
      var sec = document.getElementById("foglalas");
      var top = sec.getBoundingClientRect().top;
      if (Math.abs(top - 84) > 40) {
        var y = window.pageYOffset + top - 84;
        if (window.__lenis && window.__lenis.scrollTo) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      }
    }
  });
})();
