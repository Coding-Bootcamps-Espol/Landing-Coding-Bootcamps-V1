# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static institutional landing site (in Spanish) for Coding Bootcamps ESPOL: promotes tech training programs, lets users browse the academic offering, learn about the institution, and request more information about a program. Redesign of an existing site, built for a "Proyecto Integrador" academic deliverable. No backend, no framework, no bundler — plain HTML5 + CSS3 + TypeScript compiled 1:1 to JS.

## Commands

- Install deps: `npm install`
- Build (compile `ts/` → `js/`): `npm run build` (runs `tsc`)
- Build the deployable site: `npm run build:dist` (`tsc` + `scripts/build-dist.mjs`, which copies an explicit file list plus `css/` and `js/` into `dist/`). `netlify.toml` runs this and publishes `dist/`. `dist/` is gitignored — never commit it. When adding a page, add it to the `files` list in `scripts/build-dist.mjs` or it won't be deployed to Netlify.
- No lint script is configured.
- No real test suite: `npm test` only runs a placeholder that exits with an error — there is nothing to execute.
- No dev server needed: open any `.html` file directly in a browser.

## Architecture

### Page structure

Seven standalone HTML pages (the six below plus the orphaned `inscripcion.html`, see Notes), each fully self-contained (no shared templates/includes/partials):

- `index.html` — home: hero, programs teaser grid, short "Nosotros" teaser, testimonials carousel (3 real testimonials; the carousel JS counts slides from the DOM), video gallery, FAQ (`#preguntas-frecuentes`, native `<details>`), contact details + contact form, chat widget.
- `programas.html` — full detail for the 3 programs (Full Stack Development, Data Science, Business Data Analytics, all "+ Applied AI Tools"). Each `<article>` keeps its anchor id (`#desarrollo-web`, `#ciencia-de-datos`, `#business-data-analytics`, linked from `index.html`), a facts `<dl>` (duration, content, modality, requirement, price), CTAs to `solicita-informacion.html?programa=...` and to `brochures/*.pdf`, benefit cards, and collapsible `<details class="program-section">` blocks (modules, schedule, includes, instructors, admission). Content comes from the 2026 brochures in `docs/*.pdf` (gitignored); prices: Full Stack and BDA USD 2.800, Data Science USD 3.200.
- `solicita-informacion.html` — lead-gen page for requesting program info. The form itself is an embedded Tally form (`data-tally-src`, via `https://tally.so/widgets/embed.js`), not a native HTML `<form>` — Tally owns validation and storage. An inline `postMessage` listener reacts to `Tally.FormLoaded`/`Tally.FormSubmitted` to fire GA4 (`gtag`) and Mixpanel events, then redirects to `gracias.html?programa=...` on submit.
- `gracias.html` — post-submission confirmation page (`noindex`, not in `sitemap.xml`), reached only via the redirect above. Reads `?programa=` to fill in confirmation copy and a prefilled `wa.me` WhatsApp link (`ts/gracias.ts`). WhatsApp number: `593979631573` (also used in `index.html` contact details and `programas.html`).
- `playground.html` — component playground (unrelated to the enrollment/lead-gen flow; see its own feature branch for context).
- `404.html` — custom error page (`noindex`).

Because there is no templating system, the header/nav/footer/chat-widget markup **and** the inline `<script>` that wires up the mobile nav drawer, theme toggle, and chat widget is duplicated verbatim across all HTML files. Changing that shared behavior or markup means editing every page, not just one.

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

### CSS structure

Every page links only `css/styles.css`, but that file is just an `@import` aggregator (in this order): `variables.css`, `base.css`, `layout.css`, `components.css`, `responsive.css`, then the UI-component partials (`alerts.css`, `botones.css`, `checkboxes-radios.css`, `dialogs.css`, `menus.css`, `toasts.css`), then the backoffice partials (`switches.css`, `badges.css`, `paginacion.css`, `graficos.css`). Add new rules to the matching partial, not to `styles.css` itself — `variables.css` for tokens, `components.css` for component styles (the largest file), `responsive.css` for media queries. `@import` order matters for cascade/specificity, so don't reorder those lines casually.

### Redesign in progress (design system v2)

The site is being redesigned page by page in an "editorial vibrante" style based on the brand of the old WordPress site (bootcamps.espol.edu.ec). **`index.html` is migrated; the other pages still use the old `css/styles.css` and their duplicated inline script** until they are migrated one by one.

- Styles: migrated pages link only `css/site.css`, which imports `css/v2/` in order: `tokens.css` → `base.css` → `layout.css` (sections, header, footer) → `components.css` (buttons, eyebrow, mark, chips, float-card, accordion, form) → `home.css` (index-only sections) → `effects.css`. New page-specific styles go in their own `css/v2/<page>.css`, imported before `effects.css`.
- **All colors, fonts, sizes, spacing, radii, shadows and easings live in `css/v2/tokens.css`.** Never hardcode a color/rgba elsewhere (the user explicitly asked for this); add a token instead. Fonts: Inter Tight (display) + Inter (body) from Google Fonts. Brand: `--ink` #030541, `--violet` #6255a5, `--blue` #2575fc, `--mint` #2ec58d.
- Reuse components before writing new CSS: `.section` (+ `--paper-2`, `--ink`), `.section-head`, `.wrap`, `.btn` (+ `--accent`, `--ghost`, `--light`, `--outline-light`, `--lg`, `--block`), `.eyebrow`, `.mark`, `.chip`, `.float-card`, `.accordion`, `.form`/`.field`.
- Behavior: `ts/sitio.ts` (→ `js/sitio.js`) handles nav drawer, header scroll state, scroll reveal (`data-reveal`, `data-reveal="scale|left"`, stagger with `style="--i:n"`), counters (`data-count`), 3D tilt (`data-tilt`), testimonials carousel (autoplay) and Mixpanel `program_clicked` (`data-program-name`). Every init checks its elements exist, so the same script works on every page. `<head>` adds `html.js` so reveal-hidden content is visible without JS. Everything respects `prefers-reduced-motion`.
- Icons: inline SVG sprite at the top of `<body>` (`<svg><use href="#i-arrow"/></svg>`).
- The redesign is light-only (no theme toggle), the expired "Early Bird" promo banner, the placeholder YouTube gallery and the Jelou chatbot were removed from `index.html`.
- Program colors are tokens (`--fs-*`, `--ds-*`, `--bda-*`) taken from each program's artwork; cards use `.program-card--fs|--ds|--bda` and the artwork in `img/programas/*-440|800.webp` (from the old site; the baked-in text still says "Business Analytics" and "Full Stack Developer").
- Images: real 2023 event photos from the old site in `img/galeria/*-640.webp` / `*-1200.webp`, hero cutout `img/hero-estudiante.webp`, logos `img/logo-cbe.webp` / `img/logo-cbe-blanco.webp`.

### Theming

CSS custom properties on `:root` (in `css/variables.css`) define a dark theme by default; a light variant applies either via `prefers-color-scheme: light` or a manual toggle that sets `data-theme="light"` on `<html>` and persists the choice to `localStorage`. Every page has a small blocking inline `<script>` in `<head>` that reads `localStorage` before first paint to avoid a flash of the wrong theme — keep that script in sync across pages if the theming approach ever changes.

### Known dead code

`css/layout.css` and `css/responsive.css` still define a full dropdown-nav component (`.nav-trigger`, `.dropdown`, `.nav-chevron`, `nav a.active`), and `index.html`'s inline script still wires up `.nav-trigger` listeners, but no markup on any page actually uses these classes — the nav is currently a flat link list. Don't assume there's a working submenu.

## Notes

- `docs/PLAN.md` documents an approved iteration. Its post-enrollment confirmation page is now implemented as `gracias.html` (its dedicated "Nosotros" page is still not implemented). It still describes the older native-`<form>`/`ts/inscripcion.ts` design for what is now `solicita-informacion.html` — treat that part as historical and check "Page structure" above instead.
- `inscripcion.html` is a leftover from before the Tally switch: it now also embeds Tally, but nothing links to it (programs CTAs and `sitemap.xml` point to `solicita-informacion.html`). Don't add features to it; it's a candidate for removal.
- Branches: work happens on `develop` (feature branches merge into it via PR); `master` only receives reviewed merges from `develop`. Every push to `develop` triggers `.github/workflows/deploy-staging.yml`, which fails if `js/` isn't up to date with `ts/` (so always commit the `npm run build` output) and then updates https://landing-staging.codingbootcampslatam.com over SSH (the server-side key is restricted to a fixed `git fetch` + `reset --hard origin/develop`). Staging serves the repo root as-is (not `dist/`). Its nginx denies `.git*`, `ts/`, `docs/`, `node_modules/`, `*.md` and `*.json`; any new folder with non-public content (e.g. `scripts/`) needs a matching deny rule there.
- The current site on `develop` was restored from the built `dist/` committed in `5ef3417` (Sep 18, newer than the source files that had been pushed). Hero images live in `img/`. Pages also load third-party scripts: Contentsquare analytics (all pages except 404) and a Jelou chat widget (`index.html`).
- `brochures/` (public brochure PDFs, 4-5 MB each) and `docs/*.pdf` are gitignored by decision of the user. They are NOT deployed by the workflow: upload `brochures/*.pdf` by hand to `~/landing-staging/site/brochures/` on the server (untracked files survive the deploy's `git reset --hard`), otherwise the "Descargar brochure" buttons 404. `scripts/build-dist.mjs` doesn't copy them either.
- Project docs (non-site Markdown) live in `docs/`. The site itself must stay at the repo root: pages, `favicon.png`, `robots.txt`, `sitemap.xml` and `404.html` are referenced by root-relative paths, so don't move HTML into subfolders.
- `node_modules/` is committed to the repo — the root `.gitignore` only excludes select `.claude/commands/skills/...` files, not `node_modules/` — this is pre-existing, not something to "fix" unprompted.
