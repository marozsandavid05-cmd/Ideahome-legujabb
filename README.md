# IdeaHome — weboldal

Freund-Hernády Zita lakberendező weboldala. Statikus oldal (HTML + CSS + vanilla JS, build-lépés nélkül), közvetlenül megnyitható.

**Élő:** https://marozsandavid05-cmd.github.io/ideahome/

## Szolgáltatások (4 külön oldal)
- **Lakberendezés** — `lakberendezes.html`
- **Home staging** — `home-staging.html`
- **Látványtervezés (3D)** — `latvanytervezes.html`
- **Ingatlanfejlesztés** — `ingatlanfejlesztes.html`

A navban a „Szolgáltatások ▾" lenyíló fogja össze őket.

## Oldalak
- `index.html` — főoldal (heró, szolgáltatások, kiemelt munkák, vélemény)
- a 4 szolgáltatás-oldal (fent)
- `portfolio.html` — Munkáink, szolgáltatás szerint szűrhető
- `arak.html` — valós árak 3 szolgáltatásra, horgony-navval
- `gyik.html` — GYIK, 4 szakasz, horgony-navval
- `rolam.html` — Zita személyes oldala (egyedüli, E/1 hangnem)
- `kapcsolat.html` — elérhetőség (GHL naptár-beágyazás később)
- `munkaink/` — projekt-eset oldalak

## Szerkezet
- `assets/css/site.css` — design rendszer (token alapú; aktuális paletta: **Soft Blue** világos editorial)
- `assets/js/site.js` — interakciók (GSAP scroll reveal, kurzor, magnetic; natív görgetés)
- `assets/img/` — képek (webp); `portfolio/opt/proj/<projekt>/` a galériák
- `.nojekyll` — GitHub Pages a fájlokat nyersen szolgálja ki
- `src/` — build-segéd (nincs a deployban, `.gitignore`-olt)

## Design
Világos editorial, **Soft Blue** paletta (lágy törtfehér háttér, visszafogott kék akcent). Tipográfia: Cormorant Garamond (display + dőlt akcent) + Manrope (UI/szöveg). Egyedüli (E/1) hangnem mindenhol; a „belsőépítész" megnevezés nincs használva — Zita lakberendező.

## GitHub Pages
Repo → **Settings → Pages → Source: Deploy from branch → `main` / `(root)`**. Pár perc múlva frissül az élő oldal.
