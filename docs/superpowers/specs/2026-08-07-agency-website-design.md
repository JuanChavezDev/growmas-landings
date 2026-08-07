# Sitio de Growmas (growmas.io) — Diseño

## Contexto

`growmas-landings` hoy aloja landings estáticas independientes (un `index.html`
autocontenido por carpeta) bajo un único proyecto Vercel (`framework: null`),
más un scaffold Next.js nunca terminado en la raíz (sin `package.json`, sin
dependencias instaladas, excluido a propósito del deploy vía `.vercelignore`).

Growmas necesita un sitio real de agencia en `growmas.io`, optimizado no solo
para SEO clásico sino para GEO (Generative Engine Optimization) y AEO (Answer
Engine Optimization) — que los motores de búsqueda y los LLMs (ChatGPT,
Claude, Perplexity, Google AI Overviews) puedan rastrear, entender y citar el
contenido.

## Decisiones clave

- **Stack: Next.js**, usando (y completando) el scaffold ya presente en la
  raíz. Se prefiere sobre HTML estático puro porque a la escala que requiere
  SEO/GEO/AEO serio (múltiples páginas de servicio, blog, schema por página,
  sitemap) Next.js sistematiza eso; HTML a mano lo vuelve tedioso y propenso a
  desincronización.
- **Next.js pasa a ser el framework del proyecto Vercel** (hoy `framework:
  null`). Un único proyecto Vercel sigue sirviendo todo `growmas.io`.
- **`growmas.io/` (raíz) = nuevo Home de agencia**, generado por Next.
- **`auditoria-gratuita/`** se mueve a `public/auditoria-gratuita/` tal cual
  (mismo `index.html`, sin modificar su contenido/lógica) — Next sirve
  cualquier cosa en `/public` como archivo estático, así que
  `growmas.io/auditoria-gratuita` sigue funcionando exactamente igual.
- **`diagnostico-de-fuga/` se elimina del repo.** Ya no se usa; ocupaba la
  raíz, que ahora es el Home nuevo.
- El boilerplate del scaffold SaaS Factory sin usar (`(auth)/login`,
  `(auth)/signup`, `(main)/dashboard`, layouts de esas rutas) se elimina —
  esto es un sitio de marketing, no una app con auth.
- Todo el trabajo técnico (jerarquía de encabezados, arquitectura de
  información, schema, internal linking, crawlability, Core Web Vitals) se
  hace con criterio de **experto en SEO avanzado y arquitectura web**, no
  genérico.

## Alcance de esta fase

Estructura y páginas, **sin contenido final de servicios/blog** (eso lo
generan skills de SEO/GEO/AEO-auditor y copywriter que se construirán en una
sesión aparte, después de esta). El Home sí lleva copy real, provisto por el
usuario.

### Páginas

| Ruta | Descripción |
|---|---|
| `growmas.io/` | Home — copy real provisto por el usuario |
| `growmas.io/servicios` | Página pilar: intro + tarjetas enlazando a cada servicio individual |
| `growmas.io/servicios/[slug]` | Página por servicio (1-2 de ejemplo como placeholder de estructura) |
| `growmas.io/blog` | Índice del blog |
| `growmas.io/blog/[slug]` | Artículo individual — 1 post de ejemplo en formato "respuesta directa" (pregunta como H1/H2, respuesta directa en el primer párrafo, desarrollo debajo) sirviendo de plantilla |
| `growmas.io/auditoria-gratuita` | Sin cambios — landing existente, movida a `/public` tal cual |

El modelo de Servicios es **pillar page + topic clusters**: la página pilar
enlaza a cada servicio, y cada servicio enlaza de vuelta a la pilar.

### Fundamentos técnicos SEO/GEO/AEO

- Metadata única por página vía `generateMetadata` (title, description, OG,
  Twitter card).
- `app/sitemap.ts` y `app/robots.ts` generados por Next — `robots.ts` permite
  explícitamente crawlers de LLM (GPTBot, ClaudeBot, PerplexityBot,
  Google-Extended) además de los buscadores tradicionales.
- JSON-LD (schema.org): `Organization` en el layout raíz; `Service` en cada
  página de servicio; `Article`/`FAQPage` en posts de blog.
- HTML semántico con jerarquía de encabezados estricta — el objetivo es que
  un LLM pueda extraer una respuesta limpia de un `<h2>` + párrafo sin
  ambigüedad.
- Todo estático/SSG: carga rápida, 100% crawlable sin depender de JS.

### Fuera de alcance (explícitamente, para después)

- Skills reutilizables de auditor SEO/GEO/AEO y de copywriting.
- Copy real de páginas de servicio y posts de blog (placeholder hasta que
  existan esos skills).
- Sistema de diseño visual definitivo — se decide cuando el usuario entregue
  el copy del Home (puede tomar uno de los 5 sistemas en
  `.claude/design-systems/` o derivarse del copy).

## Riesgos / notas

- El scaffold Next.js nunca tuvo `package.json`: hay que inicializarlo de
  cero (Next 16, React 19, TypeScript, Tailwind — Golden Path del proyecto),
  no solo "completar" algo a medio andar.
- Mover `auditoria-gratuita` a `public/` no debe alterar ni un byte de su
  `index.html` ni de los assets embebidos — es un artefacto exportado de un
  bundler externo, no código para tocar a mano.
