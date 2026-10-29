# Landing Page con CSS y Formulario Validado

Rediseño de una página web institucional para la promoción, consulta e inscripción de programas de formación tecnológica. El sitio permite a los usuarios explorar la oferta académica, conocer el contenido de cada programa e inscribirse mediante un formulario con validación.

## Contenido

- Página de inicio con presentación institucional y oferta académica.
- Listado y detalle de programas de formación.
- Formulario de inscripción con validación de campos.
- Página de error 404 personalizada.

## Estructura del proyecto

```
proyecto/
├── index.html          # Página principal
├── programas.html       # Oferta académica
├── inscripcion.html     # Formulario de inscripción
├── 404.html              # Página de error
├── css/
│   ├── styles.css        # Agregador (@import) de los parciales
│   ├── variables.css     # Tokens de diseño y temas
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   └── responsive.css
├── js/                    # Scripts compilados (JavaScript)
│   ├── animaciones.js
│   ├── contacto.js
│   └── inscripcion.js
├── ts/                    # Código fuente en TypeScript
│   ├── animaciones.ts
│   ├── contacto.ts
│   └── inscripcion.ts
├── docs/
│   └── PLAN.md           # Plan de la próxima iteración
├── favicon.png
├── robots.txt
└── sitemap.xml
```

## Cómo usarlo

No requiere instalación ni servidor. Solo abrir el archivo `index.html` en el navegador para visualizar y navegar el sitio.

## Desarrollo (opcional)

Los scripts en `js/` se generan a partir de los archivos TypeScript en `ts/`. Si se realizan cambios en `ts/`, se pueden recompilar con:

```bash
npm install
npm run build
```

## Tecnologías utilizadas

- HTML5
- CSS3
- TypeScript / JavaScript

## Autoría

Proyecto desarrollado por **Alejandra Bocca**, en el marco de **Coding Bootcamps ESPOL**.
