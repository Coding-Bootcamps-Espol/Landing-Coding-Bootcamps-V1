// Copia el layout compartido (encabezado con barra de promoción, pie de página
// y burbuja de WhatsApp) desde index.html a las demás páginas del rediseño.
// Los bloques van entre <!-- layout:NOMBRE --> y <!-- /layout:NOMBRE -->.
// Además marca con aria-current="page" el enlace del menú de cada página.
//
// Uso: npm run sync:layout   (el workflow de staging falla si quedó algo sin sincronizar)
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const SOURCE = "index.html";
const PAGES = ["programas.html", "nosotros.html", "preguntas.html", "contacto.html", "solicita-informacion.html", "gracias.html", "404.html"];
const BLOCKS = ["header", "footer"];

function blockRegex(name) {
  return new RegExp(`(<!-- layout:${name}\\b[^>]*-->)([\\s\\S]*?)(<!-- /layout:${name} -->)`);
}

function setCurrent(html, page) {
  // Quita cualquier aria-current del menú y lo pone en el enlace de esta página.
  return html
    .replace(/(<a class="nav-link"[^>]*?) aria-current="page"/g, "$1")
    .replace(new RegExp(`(<a class="nav-link" href="${page}")`), '$1 aria-current="page"');
}

const source = readFileSync(join(root, SOURCE), "utf8");
let changed = 0;

for (const page of PAGES) {
  const path = join(root, page);
  let html = readFileSync(path, "utf8");
  const before = html;
  for (const name of BLOCKS) {
    const match = source.match(blockRegex(name));
    if (!match) throw new Error(`${SOURCE} no tiene el bloque layout:${name}`);
    if (!blockRegex(name).test(html)) throw new Error(`${page} no tiene el bloque layout:${name}`);
    html = html.replace(blockRegex(name), (_, open, _body, close) => open + match[2] + close);
  }
  html = setCurrent(html, page);
  if (html !== before) {
    writeFileSync(path, html);
    changed++;
    console.log(`actualizado: ${page}`);
  }
}

console.log(changed ? `${changed} página(s) sincronizadas` : "layout ya sincronizado");
