# Plan de producto — Coding Bootcamps ESPOL

## Contexto

Este proyecto es una landing institucional (HTML/CSS/TS compilado a JS, sin backend) para la promoción, consulta e inscripción de programas de formación tecnológica de Coding Bootcamps ESPOL. Hoy tiene 4 páginas: `index.html`, `programas.html`, `inscripcion.html` y `404.html`. El pedido fue analizar el sitio **como producto** (no como código): qué falta para un flujo completo, qué secciones existentes están débiles, y qué decisiones se necesitaban antes de plantear un plan. Este documento recoge ese análisis y el alcance acordado para la siguiente iteración.

## Análisis: estado actual

**Páginas existentes**
- `index.html` — Hero, banner de webinar, 3 tarjetas de programas, bloque "Nosotros" corto, testimonios (carrusel fijo de 3), galería de fotos, formulario de contacto, chatbot de reglas fijas (FAQ simulada).
- `programas.html` — Detalle de los 3 programas (duración, modalidad, temario, CTA a inscripción).
- `inscripcion.html` — Formulario de inscripción (nombre, email, WhatsApp, programa, comentario), con preselección de programa vía query param y validación 100% client-side.
- `404.html` — Página de error con navegación de vuelta.

**Qué falta para un flujo completo**
- No hay página dedicada "Nosotros" (solo un bloque de 2 párrafos en el home) — sin metodología, instructores, alianzas ni cifras de impacto.
- No hay página de precios/becas ni FAQ real — el chatbot literalmente responde "contáctanos para precios".
- No hay calendario de cohortes ni explicación del proceso de admisión (paso a paso entre inscribirse y empezar).
- No hay páginas legales (privacidad, términos) pese a que el formulario de inscripción recolecta datos personales.
- No hay cierre del flujo de inscripción: al enviar, solo se ve un mensaje inline y el formulario se limpia — no hay página de confirmación, próximos pasos ni contacto directo (WhatsApp).
- No hay página de testimonios/casos de éxito ampliada (solo 3 fijos en el carrusel del home).
- No hay blog/recursos, ni logos de empresas aliadas, ni certificado de muestra.

**Secciones existentes débiles**
- Sección "Nosotros" del home: muy breve, su botón "Conoce más" apunta a `#contacto` (no aporta más info sobre la institución).
- Chatbot: solo 5 respuestas fijas por palabra clave: útil como decoración, pero no reemplaza una FAQ real.
- Footer: sin dirección, teléfono, correo ni enlaces legales.
- Formularios: validan pero no envían nada a ningún lado (ni backend ni servicio externo) — coherente con el alcance actual del proyecto, pero es una limitación real si se piensa como producto.

## Decisiones (respuestas del usuario)

1. **Prioridad de esta iteración:** página dedicada **"Nosotros / Quiénes somos"**. (FAQ+Precios, proceso de admisión/cohortes y páginas legales quedan identificadas pero fuera de alcance por ahora — ver backlog.)
2. **Cierre del flujo de inscripción:** agregar una **página de confirmación** con próximos pasos y contacto directo por WhatsApp (recomendado y aceptado).
3. **Formularios:** se mantienen **simulados**, sin backend ni servicio externo — no se toca `contacto.ts`/`contacto.js`.
4. **Contenido:** se usará **contenido placeholder realista**, claramente reemplazable (nombres, cifras, número de WhatsApp, etc.), ya que no se compartieron datos reales.

## Plan de acción (alcance de esta iteración)

### 1. Página "Nosotros" (`nosotros.html`)

Nueva página siguiendo el mismo patrón estructural que `programas.html` (header, nav, main, footer, chat widget, mismo bloque `<script>` inline de nav/tema/chat duplicado como en las demás páginas).

Secciones de contenido (placeholder, marcado como editable):
- `.page-header`: título "Quiénes somos" + bajada institucional.
- Misión y visión.
- Metodología (reutiliza el patrón `.about-grid` / `.about-image` / `.about-content` ya usado en `programas.html` e `index.html`).
- Instructores destacados: grid de tarjetas reutilizando el patrón visual de `.programs-grid` / `.program-card` (foto, nombre, especialidad, bio corta — placeholders).
- Cifras de impacto: fila simple de estadísticas (egresados, tasa de empleabilidad, empresas aliadas) — única pieza de CSS nueva, mínima, reutilizando los tokens existentes (`--color-accent`, `--color-surface`, espaciados actuales).
- Alianzas / empresas (lista textual simple de nombres placeholder, sin logos reales todavía).
- CTA final a `inscripcion.html`, reutilizando el patrón `.programs-cta` ya usado en `programas.html` y `404.html`.

Cambios en páginas existentes:
- Agregar el link "Nosotros" al `<nav class="main-nav">` (entre "Programas" y "Contacto") en `index.html`, `programas.html`, `inscripcion.html`, `404.html`, y por supuesto en la propia `nosotros.html` (con `aria-current="page"`).
- Igual en `.footer-nav-list` de las 5 páginas.
- En `index.html`, cambiar el CTA "Conoce más" de la sección `#nosotros` (línea ~167) de `href="#contacto"` a `href="nosotros.html"`, para que el teaser del home lleve a la página completa.
- Agregar `nosotros.html` a `sitemap.xml`.

### 2. Página de confirmación (`gracias.html`) + redirección desde inscripción

Nueva página `gracias.html`, con `<meta name="robots" content="noindex">` (igual que `404.html`, ya que es una página transaccional) y sin entrada en `sitemap.xml`.

Contenido:
- Confirmación: "¡Tu inscripción fue recibida!"
- Próximos pasos: qué esperar (revisión de datos, contacto de un asesor en <24h).
- Botón WhatsApp directo (`https://wa.me/593XXXXXXXXX`, número placeholder) con mensaje prellenado que incluye el programa elegido.
- CTA secundario: volver al inicio / ver otros programas.
- Mismo header/footer/chat widget que el resto de páginas.

Cambios de código:
- `ts/gracias.ts` (nuevo, compila a `js/gracias.js`): lee el query param `programa` (mismo patrón `URLSearchParams` que ya usa `preselectPrograma()` en `ts/inscripcion.ts`) e inserta el nombre del programa en el texto de confirmación y en el mensaje prellenado de WhatsApp.
- `ts/inscripcion.ts`: en el handler de `submit` (líneas ~102-107), reemplazar el bloque que hoy escribe el mensaje inline y hace `form.reset()` por una redirección: `window.location.href = "gracias.html?programa=" + encodeURIComponent(selectPrograma.value)`. Se mantiene toda la validación existente sin cambios.
- `ts/contacto.ts` **no se toca** — el formulario de contacto sigue mostrando su mensaje inline actual, conforme a lo decidido.
- Ejecutar `npm run build` para regenerar `js/inscripcion.js` y `js/gracias.js` a partir de los `.ts` (mismo flujo que ya documenta el `README.md`).

### CSS

Reutilizar en lo posible clases y tokens existentes (`.page-header`, `.about-grid`, `.program-card`, `.programs-cta`, `.btn`/`.btn-primary`/`.btn-secondary`, variables de color en `css/styles.css`). Única adición nueva: una clase simple para la fila de "cifras de impacto" en `nosotros.html`.

## Fuera de alcance por ahora (backlog identificado)

Quedan documentados para una futura iteración, sin tocarlos en esta:
- FAQ real + página de precios/becas y financiamiento.
- Proceso de admisión detallado + calendario de cohortes.
- Páginas legales: política de privacidad y términos y condiciones (relevante por LOPDP Ecuador, dado que el formulario recolecta datos personales).
- Página de testimonios/casos de éxito ampliada (más allá del carrusel de 3 en el home).
- Blog/recursos, logos de empresas aliadas reales, certificado de muestra.
- Conectar los formularios a un servicio real de envío (ej. Formspree/EmailJS) si en el futuro se decide dejar de simularlos.

## Verificación

- `npm run build` sin errores de TypeScript.
- Abrir `index.html`, `programas.html`, `inscripcion.html`, `404.html` y `nosotros.html` en el navegador y confirmar que el link "Nosotros" aparece y funciona en nav y footer de las 5 páginas.
- Completar `inscripcion.html` con datos válidos, enviar, y confirmar que redirige a `gracias.html?programa=...` mostrando el programa correcto y que el botón de WhatsApp arma el enlace con el mensaje esperado.
- Confirmar que `gracias.html` no aparece en `sitemap.xml` y tiene `noindex`.
- Revisar en modo claro y oscuro (toggle de tema) que las secciones nuevas respetan los tokens de color existentes.
