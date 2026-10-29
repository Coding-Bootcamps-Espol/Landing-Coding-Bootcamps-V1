# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static institutional landing site (in Spanish) for Coding Bootcamps ESPOL: promotes tech training programs, lets users browse the academic offering, learn about the institution, and request more information about a program. Redesign of an existing site, built for a "Proyecto Integrador" academic deliverable. No backend, no framework, no bundler — plain HTML5 + CSS3 + TypeScript compiled 1:1 to JS.

## Commands

- Install deps: `npm install`
- Sync shared header/footer from `index.html` to the other pages: `npm run sync:layout`
- Build (compile `ts/` → `js/`): `npm run build` (runs `tsc`)
- Build the deployable site: `npm run build:dist` (`tsc` + `scripts/build-dist.mjs`, which copies an explicit file list plus `css/` and `js/` into `dist/`). `netlify.toml` runs this and publishes `dist/`. `dist/` is gitignored — never commit it. When adding a page, add it to the `files` list in `scripts/build-dist.mjs` or it won't be deployed to Netlify.
- No lint script is configured.
- No real test suite: `npm test` only runs a placeholder that exits with an error — there is nothing to execute.
- Preview locally with a static server, e.g. `python -m http.server 8000` (then http://localhost:8000). Opening `.html` files directly (file://) mostly works, but the redesign's brand texture (`.has-pattern`, a CSS mask image) is blocked by the browser on file://.

## Architecture

### Page structure

All public pages use the v2 design system (see "Design system v2" below):

- `index.html` — home: hero, technologies, program cards, methodology, admission steps, testimonials, gallery, FAQ (`#preguntas`), contact form (`ts/contacto.ts`, simulated).
- `programas.html` — one program at a time: big tabs (`[data-tabs]`, `role="tab"` buttons → `role="tabpanel"` sections with ids `#desarrollo-web`, `#ciencia-de-datos`, `#business-data-analytics`; `initTabs` in `ts/sitio.ts` opens the panel from the URL hash, so links from other pages keep working; without JS all three show stacked). Each `.prog-panel.program--fs|ds|bda` has: color hero with KPIs and artwork (`.prog-hero`), short benefits, curriculum as a roadmap whose line draws on scroll (`.roadmap`), "Tu semana" boxed schedule + includes + tech logos, Mi Credencial (FS), instructor cards (`.mentor`, colored top with initials) and admission + price (`.prog-enroll`). Content from the 2026 brochures (`docs/*.pdf`, gitignored). Prices: Full Stack and BDA USD 2.800, Data Science USD 3.200.
- `solicita-informacion.html` — lead form embedded from Tally (`data-tally-src`, `https://tally.so/widgets/embed.js`). An inline `message` listener sends `Tally.FormLoaded`/`Tally.FormSubmitted` to GA4 (`gtag`) and Mixpanel, then redirects to `gracias.html?programa=...`. Tally owns validation and storage.
- `gracias.html` — confirmation (`noindex`), confetti + steps; `ts/gracias.ts` fills `#gracias-programa-texto` and the `#whatsapp-directo` link (number `593979631573`).
- `nosotros.html` — about page (who we are, upskilling/reskilling, mission/vision, stats, team with portraits in `img/equipo/`, industry companies). Only Dra. Carmen Vaca has a bio (from the brochure); do not invent bios for the rest of the team.
- `404.html` — custom error page (`noindex`, no analytics).
- `inscripcion.html` — legacy URL only: redirects to `solicita-informacion.html` keeping the query string.
- `playground.html` — internal component playground; still on the **old** design (`css/styles.css`, `js/playground.js`, `js/backoffice.js`). It's the only page using the old CSS.

**Shared layout:** there is no templating, so the header (promo bar + nav) and the footer (+ WhatsApp bubble) live in `index.html` between `<!-- layout:header -->…<!-- /layout:header -->` and `<!-- layout:footer -->…<!-- /layout:footer -->`. Edit them only in `index.html` and run `npm run sync:layout` (`scripts/sync-layout.mjs`), which copies them into the other pages and sets `aria-current` on the matching nav link. The staging workflow fails if a page is out of sync. Nav/footer links are absolute (`index.html#metodologia`, `programas.html`) so they work from every page.

**Analytics:** each page keeps its own `<head>` scripts (Contentsquare, GA4 `G-8T00EQ2LKJ`, Mixpanel). Careful: the Mixpanel snippet is preceded by a comment containing the text `</head>`, so any script that splits a page at `</head>` must use the last occurrence.

### TypeScript → JS

- Source of truth is `ts/*.ts`; the committed `js/*.js` is compiled output (`tsconfig.json`: `rootDir: ts`, `outDir: js`, target/module `ES2022`, `strict: true`). Edit the `.ts` files, never the `.js` by hand, then rerun `npm run build`.
- `ts/gracias.ts` — reads the `?programa=` query param on `gracias.html` to fill in confirmation copy and build a prefilled `wa.me` WhatsApp link.
- `ts/contacto.ts` — field validators + submit handler for the contact form on `index.html`.
- `ts/playground.ts` — supports `playground.html`'s component showcase (unrelated to the lead-gen/enrollment flow), including the `c-theme-switch` toggle (sound/vibration/aria-live feedback).
- `ts/backoffice.ts` — theme switch sync, dropdown menus and pagination for a backoffice UI. No page loads `js/backoffice.js` yet.
- `ts/playground.ts` and `ts/backoffice.ts` were reconstructed on 2026-10-28 from the compiled `dist/js/*.js` of commit `5ef3417` (the original sources were never pushed); they compile byte-for-byte to that output.
- `ts/animaciones.ts` — a type-guard helper (`esHTMLElement`) plus `resaltarNavActivo()`, which highlights the current page's nav link on `DOMContentLoaded` by comparing `location.pathname` to each link's `href`. No HTML page actually loads `js/animaciones.js` via `<script>`, so the whole file is still dead code in practice.
- Each compiled file is loaded via `<script defer>` only on the page(s) that need it — there's no bundler or shared module graph tying them together.

### Forms: one simulated, one real

The contact form on `index.html` is still simulated: it only validates client-side and shows an inline success message (then `form.reset()`) — no network request, backend, or email service integration.

`solicita-informacion.html` is different: its form is an embedded Tally form (external service), so submissions are real and stored by Tally, not simulated. The host page only listens for Tally's `postMessage` events to fire analytics and redirect to `gracias.html` — it does not handle validation or storage itself.

### Design system v2

"Editorial vibrante" style based on the brand of the old WordPress site (bootcamps.espol.edu.ec) and the 2026 brochures. All public pages use it; only `playground.html` still uses the old `css/styles.css` and its partials (`css/variables.css`, `base.css`, `layout.css`, `components.css`, `responsive.css`, …), which are otherwise unused.

- Styles: migrated pages link only `css/site.css`, which imports `css/v2/` in order: `tokens.css` → `base.css` → `layout.css` (sections, header, footer) → `components.css` (buttons, eyebrow, mark, chips, stickers, accordion, form, `.cta-panel`, `.has-pattern`, `.wa-float`) → `home.css` (index sections) → `pages.css` (programas, solicitar, gracias, 404) → `effects.css`.
- **All colors, fonts, sizes, spacing, radii, shadows and easings live in `css/v2/tokens.css`.** Never hardcode a color/rgba elsewhere (the user explicitly asked for this); add a token instead. Fonts: Inter Tight (display) + Inter (body) from Google Fonts. Brand: `--brand` #213a8e (the blue of the official logo) drives the UI through `--accent` / `--accent-strong` / `--accent-soft` (buttons, links, highlights, icons) and `--surface-dark` (dark bands, testimonials, footer, mobile nav); the user wants this characteristic blue used uniformly. `--ink` #030541 is for text only; `--violet` is reserved for the BDA program; `--mint` #2ec58d is the secondary highlight.
- Reuse components before writing new CSS: `.section` (+ `--paper-2`, `--brand`), `.section-head`, `.wrap`, `.btn` (brand blue by default; + `--ghost`, `--light`, `--outline-light`, `--lg`, `--block`), `.eyebrow`, `.mark`, `.chip`, `.sticker` (+ `--mint|--sun|--white|--icon`, `.sticker-logos`), `.accordion`, `.form`/`.field`, `.wa-float` (floating WhatsApp bubble, add it to every migrated page before the scripts; color tokens `--whatsapp*`).
- Behavior: `ts/sitio.ts` (→ `js/sitio.js`) handles nav drawer, header scroll state, scroll reveal (`data-reveal`, `data-reveal="scale|left"`, stagger with `style="--i:n"`), counters (`data-count`), 3D tilt (`data-tilt`), testimonials carousel (autoplay), tabs (`data-tabs`), scrollspy nav (`data-scrollspy`, currently unused) and Mixpanel `program_clicked` (`data-program-name`). Every init checks its elements exist, so the same script works on every page. `<head>` adds `html.js` so reveal-hidden content is visible without JS. Everything respects `prefers-reduced-motion`.
- Brand textures from the old site: `.has-pattern` (+ `--light` on light backgrounds) paints the "Coding Bootcamp" lettering (`img/patron-letras.webp`, white-on-transparent, used as a mask so it takes `--pattern-color`); `img/fondo-diagonales.webp` is the green/blue diagonal panel behind the hero photo (`.hero-panel`).
- Icons: shared external sprite `img/icons.svg` (`<svg width="24" height="24"><use href="img/icons.svg#i-arrow"/></svg>`; keep the width/height attributes as a fallback against stale cached CSS); `#t-*` symbols are brand logos from Simple Icons v16.36.0 (CC0). Logo colors are tokens (`--logo-*`) applied with `.tech-card--<slug>`. Power BI and AWS are not in Simple Icons (trademark removals); the OpenAI/ChatGPT logo comes from simple-icons@10.4.0 (removed in later versions) and is used only to indicate the tool is taught.
- A moving promo bar (`.promo-bar`, inside `.site-header`, reuses `.marquee`) sits above the nav; its height is `--promo-h` and anything offset by the fixed header must use `--top-offset` (header + promo), not `--header-h`. Its text has no dates on purpose (the old Early Bird expired Oct 4); update the two `.promo-group` copies together.
- Light-only (no theme toggle). Removed on purpose: the expired "Early Bird" banner, the placeholder YouTube gallery and the Jelou chatbot.
- Program colors are tokens (`--fs-*`, `--ds-*`, `--bda-*`) taken from each program's artwork; cards use `.program-card--fs|--ds|--bda` and the artwork in `img/programas/*-440|800.webp` (from the old site; the baked-in text still says "Business Analytics" and "Full Stack Developer").
- Images: real 2023 event photos from the old site in `img/galeria/*-640.webp` / `*-1200.webp`, hero cutout `img/hero-estudiante.webp`, logos `img/logo-cbe.webp` / `img/logo-cbe-blanco.webp`.

## Notes

- `docs/PLAN.md` documents an approved iteration. Its post-enrollment confirmation page is now implemented as `gracias.html` (its dedicated "Nosotros" page is still not implemented). It still describes the older native-`<form>`/`ts/inscripcion.ts` design for what is now `solicita-informacion.html` — treat that part as historical and check "Page structure" above instead.
- Branches: work happens on `develop` (feature branches merge into it via PR); `master` only receives reviewed merges from `develop`. Every push to `develop` triggers `.github/workflows/deploy-staging.yml`, which fails if `js/` isn't up to date with `ts/` or if the shared layout isn't synced (so always commit the `npm run build` and `npm run sync:layout` output) and then updates https://landing-staging.codingbootcampslatam.com over SSH (the server-side key is restricted to a fixed `git fetch` + `reset --hard origin/develop`). Staging serves the repo root as-is (not `dist/`). Its nginx denies `.git*`, `ts/`, `docs/`, `node_modules/`, `*.md` and `*.json`; any new folder with non-public content needs a matching deny rule there (`scripts/` is already denied).
- The current site on `develop` was restored from the built `dist/` committed in `5ef3417` (Sep 18, newer than the source files that had been pushed). It was then redesigned (design system v2).
- `brochures/` (public brochure PDFs, 4-5 MB each) and `docs/*.pdf` are gitignored by decision of the user. They are NOT deployed by the workflow: upload `brochures/*.pdf` by hand to `~/landing-staging/site/brochures/` on the server (untracked files survive the deploy's `git reset --hard`), otherwise the "Descargar brochure" buttons 404. `scripts/build-dist.mjs` doesn't copy them either.
- Project docs (non-site Markdown) live in `docs/`. The site itself must stay at the repo root: pages, `favicon.png`, `robots.txt`, `sitemap.xml` and `404.html` are referenced by root-relative paths, so don't move HTML into subfolders.
- `node_modules/` is committed to the repo — the root `.gitignore` only excludes select `.claude/commands/skills/...` files, not `node_modules/` — this is pre-existing, not something to "fix" unprompted.
