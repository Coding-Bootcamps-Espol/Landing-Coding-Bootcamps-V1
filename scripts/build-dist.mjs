// Assembles the static, deployable site into /dist for Netlify.
// Run after `tsc` so js/ reflects the latest ts/ sources.
import { cpSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

const files = [
  "index.html",
  "programas.html",
  "solicita-informacion.html",
  "gracias.html",
  "404.html",
  "playground.html",
  "favicon.png",
  "robots.txt",
  "sitemap.xml",
];

const dirs = ["css", "js"];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const file of files) {
  const src = join(root, file);
  if (existsSync(src)) {
    cpSync(src, join(dist, file));
  }
}

for (const dir of dirs) {
  const src = join(root, dir);
  if (existsSync(src)) {
    cpSync(src, join(dist, dir), { recursive: true });
  }
}

console.log(`dist/ generado en ${dist}`);
