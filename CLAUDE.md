# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static institutional landing site (in Spanish) for Coding Bootcamps ESPOL: promotes tech training programs, lets users browse the academic offering, learn about the institution, and submit an enrollment form. Redesign of an existing site, built for a "Proyecto Integrador" academic deliverable. No backend, no framework, no bundler — plain HTML5 + CSS3 + TypeScript compiled 1:1 to JS.

## Commands

- Install deps: `npm install`
- Build (compile `ts/` → `js/`): `npm run build` (runs `tsc`)
- No lint script is configured.
- No real test suite: `npm test` only runs a placeholder that exits with an error — there is nothing to execute.
- No dev server needed: open any `.html` file directly in a browser.

## Architecture

### Page structure

Four standalone HTML pages, each fully self-contained (no shared templates/includes/partials):

- `index.html` — home: hero, programs teaser grid, short "Nosotros" teaser, testimonials carousel, photo gallery + lightbox, contact form, chat widget.
- `programas.html` — full detail for the 3 programs (Full Stack Developer, Ciencia de Datos, Business Data Analytics), each with curriculum bullets and a CTA into `inscripcion.html` (passing `?programa=...` to preselect the program).
- `inscripcion.html` — enrollment form (nombre, email, whatsapp, programa select, mensaje).
- `404.html` — custom error page (`noindex`).

Because there is no templating system, the header/nav/footer/chat-widget markup **and** the inline `<script>` that wires up the mobile nav drawer, theme toggle, and chat widget is duplicated verbatim across all 4 HTML files. Changing that shared behavior or markup means editing every page, not just one.

### TypeScript → JS

- Source of truth is `ts/*.ts`; the committed `js/*.js` is compiled output (`tsconfig.json`: `rootDir: ts`, `outDir: js`, target/module `ES2022`, `strict: true`). Edit the `.ts` files, never the `.js` by hand, then rerun `npm run build`.
- `ts/inscripcion.ts` — field validators + submit handler for the enrollment form; also reads the `?programa=` query param on load to preselect the `<select>`. The WhatsApp field is enhanced by `intl-tel-input` loaded from a jsDelivr CDN `<script>` in `inscripcion.html` (initialized inline, default country `ec`); the validator uses `window.intlTelInputGlobals`/`isValidNumber()` when present, so the phone check depends on that CDN script loading.
- `ts/contacto.ts` — field validators + submit handler for the contact form on `index.html`.
- `ts/animaciones.ts` — a type-guard helper (`esHTMLElement`) plus `resaltarNavActivo()`, which highlights the current page's nav link on `DOMContentLoaded` by comparing `location.pathname` to each link's `href`. No HTML page actually loads `js/animaciones.js` via `<script>`, so the whole file is still dead code in practice.
- Each compiled file is loaded via `<script defer>` only on the page(s) that need it — there's no bundler or shared module graph tying them together.

### Forms are simulated, not wired to a backend

Both the contact form and the enrollment form only validate client-side and show an inline success message (then `form.reset()`) on submit — there is no network request, backend, or email service integration. Don't assume a real submission path exists unless asked to add one.

### CSS structure

Every page links only `css/styles.css`, but that file is just an `@import` aggregator (in this order): `variables.css`, `base.css`, `layout.css`, `components.css`, `responsive.css`. Add new rules to the matching partial, not to `styles.css` itself — `variables.css` for tokens, `components.css` for component styles (the largest file), `responsive.css` for media queries. `@import` order matters for cascade/specificity, so don't reorder those lines casually.

### Theming

CSS custom properties on `:root` (in `css/variables.css`) define a dark theme by default; a light variant applies either via `prefers-color-scheme: light` or a manual toggle that sets `data-theme="light"` on `<html>` and persists the choice to `localStorage`. Every page has a small blocking inline `<script>` in `<head>` that reads `localStorage` before first paint to avoid a flash of the wrong theme — keep that script in sync across pages if the theming approach ever changes.

### Known dead code

`css/layout.css` and `css/responsive.css` still define a full dropdown-nav component (`.nav-trigger`, `.dropdown`, `.nav-chevron`, `nav a.active`), and `index.html`'s inline script still wires up `.nav-trigger` listeners, but no markup on any page actually uses these classes — the nav is currently a flat link list. Don't assume there's a working submenu.

## Notes

- `docs/PLAN.md` documents an approved but not-yet-implemented iteration (a dedicated "Nosotros" page and a post-enrollment confirmation page) — check it for planned scope before starting unrelated redesign work.
- Branches: work happens on `develop`; `master` only receives reviewed merges from `develop`. Every push to `develop` triggers `.github/workflows/deploy-staging.yml`, which fails if `js/` isn't up to date with `ts/` (so always commit the `npm run build` output) and then updates https://landing-staging.codingbootcampslatam.com over SSH (the server-side key is restricted to a fixed `git fetch` + `reset --hard origin/develop`). The staging server's nginx denies `.git*`, `ts/`, `docs/`, `node_modules/`, `*.md` and `*.json`; any new folder with non-public content needs a matching deny rule there.
- Project docs (non-site Markdown) live in `docs/`. The site itself must stay at the repo root: pages, `favicon.png`, `robots.txt`, `sitemap.xml` and `404.html` are referenced by root-relative paths, so don't move HTML into subfolders.
- An old divergent site snapshot (`dist/`, with `gracias.html`, `playground.html`, extra CSS partials) was deleted; it's recoverable from git history (commit `5ef3417`) if needed as reference for the planned confirmation page.
- `node_modules/` is committed to the repo — the root `.gitignore` only excludes select `.claude/commands/skills/...` files, not `node_modules/` — this is pre-existing, not something to "fix" unprompted.
