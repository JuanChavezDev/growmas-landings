# Sitio de Growmas (growmas.io) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the unused Next.js scaffold at the repo root into the real GROW+ marketing site (Home, Servicios pillar+cluster, Blog), serving `growmas.io/` as the primary Vercel project, with `auditoria-gratuita` preserved as a static passthrough and `diagnostico-de-fuga` removed.

**Architecture:** Next.js App Router, fully static/SSG. A small `lib/seo/` module centralizes site-wide constants and JSON-LD builders so every page's structured data stays consistent. Content for Servicios and Blog lives in plain TypeScript data files (`lib/services/data.ts`, `lib/blog/data.ts`) consumed by `generateStaticParams` — no CMS, no database, matching this repo's existing no-backend pattern.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 3.4, Vitest (unit tests for the pure JSON-LD builder functions only).

## Global Constraints

- Brand name is **GROW+** everywhere (title tags, JSON-LD `Organization.name`, visible copy). Domain stays `growmas.io`; JSON-LD `Organization.alternateName` = `"Growmas"`.
- Slogan: "Sistemas Inteligentes para Hacer Crecer tu Negocio."
- `growmas.io/auditoria-gratuita` must keep serving the exact existing `auditoria-gratuita/index.html` byte-for-byte — it's an externally-exported bundler artifact, never hand-edit its contents.
- `diagnostico-de-fuga/` is deleted from the repo entirely.
- **`api/auditoria-gratuita/*.js` and `lib/auditoria-gratuita/*.js` are a live, working Vercel Functions backend for the audit-quiz report (uses `@anthropic-ai/sdk`, tested with Node's built-in `node --test` runner). This code, the root `package.json`'s existing `"test"` script, its `@anthropic-ai/sdk` dependency, and `vercel.json`'s existing `rewrites`/`functions` entries for it must all keep working unmodified — no task in this plan touches `api/` or `lib/`.** `package.json` already exists (tracked in git, `name: "growmas-landings"`) — never run `npm init`; only add to it.
- Every page needs unique `<title>`/meta description via `generateMetadata`, and `robots.ts` must explicitly allow GPTBot, ClaudeBot, PerplexityBot, and Google-Extended in addition to standard crawlers.
- Naming style per project convention: `camelCase` for variables/functions, `PascalCase` for components, `kebab-case` for filenames. No `any` — use `unknown` if a type is genuinely unknown.
- Services (fixed set, in this order, each with its slug):
  1. Sistema de Captación — `captacion` — "Convierte más personas en oportunidades."
  2. Sistema de Atención — `atencion` — "Responde rápido y mejora la experiencia de tus clientes."
  3. Sistema de Seguimiento — `seguimiento` — "Evita perder oportunidades por falta de seguimiento."
  4. Sistema de Fidelización — `fidelizacion` — "Haz que tus clientes regresen una y otra vez."

---

### Task 1: Initialize the Next.js project for real

The scaffold at the repo root has `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `components.json`, `postcss.config.js`, and a `src/` tree, but nothing has ever been installed or built — running `next`/`tailwindcss` fails until dependencies exist. **A `package.json` already exists and is tracked in git** — it belongs to the separate `auditoria-gratuita` Vercel Functions backend (`@anthropic-ai/sdk` dependency, a `"test"` script running `node --test` over `lib/**/*.test.js` and `api/**/*.test.js`). This task adds the Next.js toolchain to that same `package.json` without disturbing what's already there, and fixes Tailwind's CSS import syntax.

**Files:**
- Modify: `package.json` (add Next.js deps + new scripts; keep the existing `dependencies` and `"test"` script exactly as they are)
- Create: `vitest.config.ts` (scoped to `src/`, so it never touches the existing `node --test` suite under `lib/`/`api/`)
- Modify: `src/app/globals.css` (fix Tailwind v4 import syntax → v3 directives, matching the `tailwindcss@3.4` we install)
- Modify: `.gitignore` (add `node_modules`, `.next` if not already covered)

**Interfaces:**
- Produces: a working `npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test:site` (Vitest, scoped to `src/`) — all additive to the existing `npm test` (the untouched `node --test` suite for `api/`/`lib/`).

- [ ] **Step 1: Check `.gitignore` covers `node_modules` and `.next`**

Read `.gitignore`. If `node_modules` or `.next` are missing, add them:

```
node_modules
.next
.DS_Store
Thumbs.db
.vercel
.playwright-mcp
```

- [ ] **Step 2: Install dependencies into the existing `package.json`**

Run (this merges into the existing `package.json` — it does NOT overwrite `dependencies` or the existing `"test"` script):
```bash
npm install next@16 react@19 react-dom@19
npm install -D typescript@5 @types/node @types/react @types/react-dom tailwindcss@3 postcss autoprefixer eslint eslint-config-next vitest
```

- [ ] **Step 3: Add scripts to `package.json`, keeping everything already there**

Edit `package.json`'s `scripts` block to ADD these entries alongside the existing `"test"` entry (do not remove or rename `"test"`):

```json
{
  "scripts": {
    "test": "node --test \"lib/**/*.test.js\" \"api/**/*.test.js\"",
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "next lint",
    "test:site": "vitest run"
  }
}
```

- [ ] **Step 4: Create `vitest.config.ts` scoped to `src/`**

This keeps Vitest from ever trying to collect the legacy `node --test`-style files under `lib/` and `api/` (which use `node:test`/`node:assert`, not Vitest's API):

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 5: Fix `globals.css` to Tailwind v3 syntax**

The existing file uses the v4 `@import 'tailwindcss';` form, but the project pins Tailwind 3.4 and already ships a v3-style `tailwind.config.ts`. Replace `src/app/globals.css` content with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Verify the toolchain actually runs**

Run:
```bash
npm run build
```
Expected: build succeeds against the current placeholder `src/app/page.tsx` (the "SaaS Factory App" boilerplate) with no errors. This confirms Next/React/Tailwind/TypeScript are wired correctly before we touch any real content.

- [ ] **Step 6: Commit**

`next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `components.json`, `postcss.config.js`, and `src/` are new to git (previously untracked scaffold files) — include them:

```bash
git add package.json package-lock.json vitest.config.ts .gitignore src/ next.config.ts tailwind.config.ts tsconfig.json components.json postcss.config.js
git commit -m "chore: initialize Next.js build toolchain"
```

---

### Task 2: Remove SaaS Factory boilerplate

The scaffold ships auth/dashboard placeholder routes and empty feature-template folders that have nothing to do with a marketing site. Remove them so the codebase only contains what this project actually uses.

**Files:**
- Delete: `src/app/(auth)/` (entire directory: `layout.tsx`, `login/`, `signup/`)
- Delete: `src/app/(main)/` (entire directory: `layout.tsx`, `dashboard/`)
- Delete: `src/features/` (entire directory: `.template/`, `auth/`, `dashboard/`, `README.md`)
- Delete: `src/lib/supabase/` (entire directory: `client.ts`, `server.ts`) — this site has no auth/DB
- Delete: `src/shared/` (entire directory) — empty placeholder dirs, nothing references them yet; real shared components go in `src/components/` per Task 4

**Interfaces:**
- Consumes: nothing from Task 1 besides a working build to verify against.
- Produces: a clean `src/` containing only `src/app/` (layout.tsx, page.tsx, globals.css) and `src/lib/` (empty, populated in Task 3).

- [ ] **Step 1: Delete the unused directories**

```bash
rm -rf "src/app/(auth)" "src/app/(main)" src/features src/lib/supabase src/shared
```

- [ ] **Step 2: Verify nothing else references the deleted paths**

```bash
grep -rn "features/\|shared/\|lib/supabase" src/ --include="*.ts" --include="*.tsx"
```
Expected: no output (no remaining references).

- [ ] **Step 3: Verify build still passes**

```bash
npm run build
```
Expected: succeeds (still building the same placeholder `page.tsx`/`layout.tsx` from Task 1 — this task only removes dead code, doesn't touch the active pages yet).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused SaaS Factory auth/dashboard boilerplate"
```

---

### Task 3: Site config, SEO/JSON-LD helpers, and root layout

Centralize the brand constants and structured-data builders so every later page imports from one place instead of repeating strings.

**Files:**
- Create: `src/lib/seo/site-config.ts`
- Create: `src/lib/seo/schema.ts`
- Test: `src/lib/seo/schema.test.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces:
  - `siteConfig: { name: string; alternateName: string; slogan: string; url: string; description: string }` from `site-config.ts`
  - `organizationSchema(): Record<string, unknown>` from `schema.ts`
  - `serviceSchema(input: { name: string; description: string; url: string }): Record<string, unknown>` from `schema.ts`
  - `articleSchema(input: { headline: string; description: string; url: string; datePublished: string }): Record<string, unknown>` from `schema.ts`
- Consumes: nothing (leaf module).

- [ ] **Step 1: Write the failing tests for the schema builders**

Create `src/lib/seo/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { articleSchema, organizationSchema, serviceSchema } from './schema'

describe('organizationSchema', () => {
  it('identifies GROW+ as the organization with growmas.io as the URL', () => {
    const schema = organizationSchema()
    expect(schema['@type']).toBe('Organization')
    expect(schema.name).toBe('GROW+')
    expect(schema.alternateName).toBe('Growmas')
    expect(schema.url).toBe('https://growmas.io')
  })
})

describe('serviceSchema', () => {
  it('builds a Service node from the given input', () => {
    const schema = serviceSchema({
      name: 'Sistema de Captación',
      description: 'Convierte más personas en oportunidades.',
      url: 'https://growmas.io/servicios/captacion',
    })
    expect(schema['@type']).toBe('Service')
    expect(schema.name).toBe('Sistema de Captación')
    expect(schema.provider).toMatchObject({ '@type': 'Organization', name: 'GROW+' })
    expect(schema.url).toBe('https://growmas.io/servicios/captacion')
  })
})

describe('articleSchema', () => {
  it('builds an Article node from the given input', () => {
    const schema = articleSchema({
      headline: '¿Cuánto cuesta automatizar el seguimiento de clientes?',
      description: 'Respuesta directa con rangos de precio y qué los mueve.',
      url: 'https://growmas.io/blog/costo-automatizar-seguimiento',
      datePublished: '2026-08-07',
    })
    expect(schema['@type']).toBe('Article')
    expect(schema.headline).toBe('¿Cuánto cuesta automatizar el seguimiento de clientes?')
    expect(schema.datePublished).toBe('2026-08-07')
    expect(schema.author).toMatchObject({ '@type': 'Organization', name: 'GROW+' })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run src/lib/seo/schema.test.ts
```
Expected: FAIL — `./schema` and `./site-config` don't exist yet.

- [ ] **Step 3: Create `site-config.ts`**

```ts
export const siteConfig = {
  name: 'GROW+',
  alternateName: 'Growmas',
  slogan: 'Sistemas Inteligentes para Hacer Crecer tu Negocio.',
  url: 'https://growmas.io',
  description:
    'Diseñamos e implementamos sistemas inteligentes que ayudan a negocios de servicios a atraer más oportunidades, mejorar la atención y aumentar el valor de cada cliente.',
} as const
```

- [ ] **Step 4: Create `schema.ts`**

```ts
import { siteConfig } from './site-config'

function baseOrganization() {
  return {
    '@type': 'Organization' as const,
    name: siteConfig.name,
    url: siteConfig.url,
  }
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    url: siteConfig.url,
    description: siteConfig.description,
  }
}

export function serviceSchema(input: { name: string; description: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: input.url,
    provider: baseOrganization(),
  }
}

export function articleSchema(input: {
  headline: string
  description: string
  url: string
  datePublished: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url: input.url,
    datePublished: input.datePublished,
    author: baseOrganization(),
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run src/lib/seo/schema.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 6: Write the root layout with global metadata and Organization JSON-LD**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { organizationSchema } from '@/lib/seo/schema'
import { siteConfig } from '@/lib/seo/site-config'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.slogan}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.slogan}`,
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} | ${siteConfig.slogan}`,
    description: siteConfig.description,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Verify build passes**

```bash
npm run build
```
Expected: succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/lib/seo src/app/layout.tsx
git commit -m "feat: add SEO site config, JSON-LD builders, and root layout metadata"
```

---

### Task 4: Header and footer components

**Files:**
- Create: `src/components/site-header.tsx`
- Create: `src/components/site-footer.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `siteConfig` from `src/lib/seo/site-config.ts` (Task 3).
- Produces: `SiteHeader` and `SiteFooter` components, rendered in the root layout around `{children}` — later page tasks don't need to import these themselves.

- [ ] **Step 1: Create `SiteHeader`**

```tsx
import Link from 'next/link'
import { siteConfig } from '@/lib/seo/site-config'

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/servicios">Servicios</Link>
          <Link href="/blog">Blog</Link>
          <Link
            href="/auditoria-gratuita"
            className="rounded-md bg-black px-4 py-2 text-white"
          >
            Agenda una Auditoría Grow+
          </Link>
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create `SiteFooter`**

```tsx
import { siteConfig } from '@/lib/seo/site-config'

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 py-8">
      <div className="mx-auto max-w-5xl px-6 text-sm text-neutral-500">
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.name}. {siteConfig.slogan}
        </p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Wire both into the root layout**

Modify `src/app/layout.tsx` — add the imports and wrap `{children}`:

```tsx
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
```

```tsx
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components src/app/layout.tsx
git commit -m "feat: add site header and footer"
```

---

### Task 5: Home page

**Files:**
- Modify: `src/app/page.tsx` (replace the "SaaS Factory App" placeholder entirely)

**Interfaces:**
- Consumes: `siteConfig` (Task 3), `SiteHeader`/`SiteFooter` (already wrapped in layout from Task 4, no direct import needed here).
- Produces: the `/` route with the approved Home copy and internal links to `/servicios/[slug]` for each of the 4 services (slugs from Global Constraints) and to `/auditoria-gratuita` for both CTAs.

- [ ] **Step 1: Write `src/app/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/seo/site-config'

export const metadata: Metadata = {
  title: siteConfig.slogan,
  description: siteConfig.description,
}

const services = [
  {
    slug: 'captacion',
    name: 'Sistema de Captación',
    description: 'Convierte más personas en oportunidades.',
  },
  {
    slug: 'atencion',
    name: 'Sistema de Atención',
    description: 'Responde rápido y mejora la experiencia de tus clientes.',
  },
  {
    slug: 'seguimiento',
    name: 'Sistema de Seguimiento',
    description: 'Evita perder oportunidades por falta de seguimiento.',
  },
  {
    slug: 'fidelizacion',
    name: 'Sistema de Fidelización',
    description: 'Haz que tus clientes regresen una y otra vez.',
  },
]

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <section>
        <h1 className="text-4xl font-bold">Haz crecer tu negocio con sistemas inteligentes.</h1>
        <p className="mt-4 text-lg text-neutral-600">
          Diseñamos e implementamos sistemas inteligentes que ayudan a los negocios de servicios a
          atraer más oportunidades, mejorar la atención y aumentar el valor de cada cliente.
        </p>
        <Link
          href="/auditoria-gratuita"
          className="mt-6 inline-block rounded-md bg-black px-6 py-3 text-white"
        >
          Agenda una Auditoría Grow+
        </Link>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-bold">
          Tu negocio no necesita más herramientas. Necesita un sistema.
        </h2>
        <p className="mt-4 text-neutral-600">
          La mayoría de negocios pierde oportunidades todos los días porque sus procesos no están
          preparados para crecer:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-neutral-600">
          <li>Clientes que no reciben respuesta.</li>
          <li>Seguimientos que nunca se hacen.</li>
          <li>Procesos manuales.</li>
          <li>Oportunidades que se pierden.</li>
        </ul>
        <p className="mt-4 text-neutral-600">
          En {siteConfig.name} diseñamos sistemas para resolver esos problemas.
        </p>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-bold">
          No vendemos tecnología. Creamos sistemas que ayudan a tu negocio a crecer.
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {services.map((service) => (
            <Link key={service.slug} href={`/servicios/${service.slug}`} className="block">
              <h3 className="text-lg font-semibold">{service.name}</h3>
              <p className="mt-2 text-neutral-600">{service.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-bold">Nuestra filosofía</h2>
        <p className="mt-4 text-neutral-600">
          No creemos que el crecimiento dependa únicamente de conseguir más clientes. Creemos que
          un negocio crece cuando cada cliente recibe una mejor atención, una mejor experiencia y
          genera más valor con el tiempo. Ese es el propósito del Sistema MAS.
        </p>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-bold">¿Por qué {siteConfig.name}?</h2>
        <ul className="mt-4 space-y-2 text-neutral-600">
          <li>✔ Diseñamos estrategias, no solo herramientas.</li>
          <li>✔ Implementamos sistemas adaptados a tu negocio.</li>
          <li>✔ Te acompañamos en la optimización continua.</li>
          <li>✔ Tú eres el propietario de tus sistemas y de tus datos.</li>
          <li>✔ Nos enfocamos en el crecimiento de tu negocio.</li>
        </ul>
      </section>

      <section className="mt-20 border-t border-neutral-200 pt-16">
        <h2 className="text-2xl font-bold">
          Descubre dónde está el siguiente nivel de crecimiento de tu negocio.
        </h2>
        <p className="mt-4 text-neutral-600">
          Agenda una Auditoría Grow+ y conoce cómo el Sistema MAS puede ayudarte a crecer de forma
          más inteligente.
        </p>
        <Link
          href="/auditoria-gratuita"
          className="mt-6 inline-block rounded-md bg-black px-6 py-3 text-white"
        >
          Quiero mi Auditoría Grow+
        </Link>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Verify the page builds and contains the expected structure**

```bash
npm run build
```
Expected: succeeds, and the build output for `/` (in `.next/server/app/page.html` or via `npm run start` + curl) contains one `<h1>` and five `<h2>` tags, plus four links to `/servicios/<slug>`. Spot-check:

```bash
npm run start &
sleep 2
curl -s http://localhost:3000/ | grep -c "<h2"
curl -s http://localhost:3000/ | grep -o 'href="/servicios/[a-z]*"'
kill %1
```
Expected: `grep -c "<h2"` prints `5`; the four service hrefs (`captacion`, `atencion`, `seguimiento`, `fidelizacion`) are present.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: build GROW+ Home page with approved SEO-mapped copy"
```

---

### Task 6: Servicios pillar page + individual service pages

**Files:**
- Create: `src/lib/services/data.ts`
- Create: `src/app/servicios/page.tsx`
- Create: `src/app/servicios/[slug]/page.tsx`

**Interfaces:**
- Produces: `type Service = { slug: string; name: string; summary: string; body: string }` and `services: Service[]` from `src/lib/services/data.ts`, consumed by both pages.
- Consumes: `serviceSchema` from `src/lib/seo/schema.ts` (Task 3), `siteConfig` (Task 3).

- [ ] **Step 1: Create the services data file**

```ts
export type Service = {
  slug: string
  name: string
  summary: string
  body: string
}

export const services: Service[] = [
  {
    slug: 'captacion',
    name: 'Sistema de Captación',
    summary: 'Convierte más personas en oportunidades.',
    body: 'Diseñamos el sistema que convierte visitas y contactos en oportunidades reales de negocio, con procesos claros desde el primer contacto.',
  },
  {
    slug: 'atencion',
    name: 'Sistema de Atención',
    summary: 'Responde rápido y mejora la experiencia de tus clientes.',
    body: 'Implementamos sistemas de atención que responden rápido y de forma consistente, para que ningún cliente se quede esperando.',
  },
  {
    slug: 'seguimiento',
    name: 'Sistema de Seguimiento',
    summary: 'Evita perder oportunidades por falta de seguimiento.',
    body: 'Creamos procesos de seguimiento que aseguran que ninguna oportunidad se pierda por falta de un siguiente paso.',
  },
  {
    slug: 'fidelizacion',
    name: 'Sistema de Fidelización',
    summary: 'Haz que tus clientes regresen una y otra vez.',
    body: 'Construimos sistemas de fidelización que aumentan el valor de cada cliente a lo largo del tiempo, no solo en la primera compra.',
  },
]

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug)
}
```

- [ ] **Step 2: Create the pillar page `src/app/servicios/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { services } from '@/lib/services/data'

export const metadata: Metadata = {
  title: 'Servicios',
  description:
    'Sistemas inteligentes de Captación, Atención, Seguimiento y Fidelización para hacer crecer tu negocio.',
}

export default function ServiciosPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold">
        No vendemos tecnología. Creamos sistemas que ayudan a tu negocio a crecer.
      </h1>
      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        {services.map((service) => (
          <Link key={service.slug} href={`/servicios/${service.slug}`} className="block">
            <h2 className="text-xl font-semibold">{service.name}</h2>
            <p className="mt-2 text-neutral-600">{service.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Create the dynamic service page `src/app/servicios/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServiceBySlug, services } from '@/lib/services/data'
import { serviceSchema } from '@/lib/seo/schema'
import { siteConfig } from '@/lib/seo/site-config'

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) return {}
  return {
    title: service.name,
    description: service.summary,
  }
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) notFound()

  const schema = serviceSchema({
    name: service.name,
    description: service.summary,
    url: `${siteConfig.url}/servicios/${service.slug}`,
  })

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <h1 className="text-4xl font-bold">{service.name}</h1>
      <p className="mt-4 text-lg text-neutral-600">{service.summary}</p>
      <p className="mt-6 text-neutral-600">{service.body}</p>
      <Link
        href="/auditoria-gratuita"
        className="mt-8 inline-block rounded-md bg-black px-6 py-3 text-white"
      >
        Agenda una Auditoría Grow+
      </Link>
      <p className="mt-12">
        <Link href="/servicios" className="underline">
          Ver todos los sistemas
        </Link>
      </p>
    </main>
  )
}
```

- [ ] **Step 4: Verify build and static generation**

```bash
npm run build
```
Expected: succeeds, and the build log shows 4 static routes generated under `/servicios/[slug]` (`captacion`, `atencion`, `seguimiento`, `fidelizacion`) plus `/servicios`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/services src/app/servicios
git commit -m "feat: add Servicios pillar page and 4 individual service pages"
```

---

### Task 7: Blog index + example post

**Files:**
- Create: `src/lib/blog/data.ts`
- Create: `src/app/blog/page.tsx`
- Create: `src/app/blog/[slug]/page.tsx`

**Interfaces:**
- Produces: `type BlogPost = { slug: string; question: string; directAnswer: string; body: string; datePublished: string }` and `posts: BlogPost[]` from `src/lib/blog/data.ts`.
- Consumes: `articleSchema` from `src/lib/seo/schema.ts` (Task 3), `siteConfig` (Task 3).

The one example post follows the "respuesta directa" AEO format agreed in brainstorming: the question is the H1, the direct answer is the first paragraph, then supporting detail follows.

- [ ] **Step 1: Create the blog data file**

```ts
export type BlogPost = {
  slug: string
  question: string
  directAnswer: string
  body: string
  datePublished: string
}

export const posts: BlogPost[] = [
  {
    slug: 'que-es-un-sistema-de-seguimiento-de-clientes',
    question: '¿Qué es un sistema de seguimiento de clientes?',
    directAnswer:
      'Un sistema de seguimiento de clientes es un proceso automatizado que asegura que cada oportunidad de negocio reciba un siguiente contacto en el momento correcto, sin depender de que alguien se acuerde de hacerlo manualmente.',
    body: 'Sin un sistema de seguimiento, las oportunidades se pierden por una razón simple: nadie vuelve a escribirle al cliente a tiempo. Un sistema de seguimiento resuelve esto con recordatorios automáticos, mensajes programados y reglas claras sobre cuándo y cómo se retoma el contacto, para que ninguna oportunidad dependa de la memoria de una persona.',
    datePublished: '2026-08-07',
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug)
}
```

- [ ] **Step 2: Create the blog index `src/app/blog/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { posts } from '@/lib/blog/data'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Respuestas directas sobre sistemas inteligentes para hacer crecer tu negocio.',
}

export default function BlogIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold">Blog</h1>
      <ul className="mt-12 space-y-8">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="text-xl font-semibold underline">
              {post.question}
            </Link>
            <p className="mt-2 text-neutral-600">{post.directAnswer}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 3: Create the dynamic post page `src/app/blog/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, posts } from '@/lib/blog/data'
import { articleSchema } from '@/lib/seo/schema'
import { siteConfig } from '@/lib/seo/site-config'

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.question,
    description: post.directAnswer,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const schema = articleSchema({
    headline: post.question,
    description: post.directAnswer,
    url: `${siteConfig.url}/blog/${post.slug}`,
    datePublished: post.datePublished,
  })

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <h1 className="text-4xl font-bold">{post.question}</h1>
      <p className="mt-6 text-lg font-medium text-neutral-800">{post.directAnswer}</p>
      <p className="mt-6 text-neutral-600">{post.body}</p>
    </main>
  )
}
```

- [ ] **Step 4: Verify build and static generation**

```bash
npm run build
```
Expected: succeeds, build log shows `/blog` and `/blog/que-es-un-sistema-de-seguimiento-de-clientes` as static routes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/blog src/app/blog
git commit -m "feat: add Blog index and example AEO-formatted post"
```

---

### Task 8: Sitemap and robots

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

**Interfaces:**
- Consumes: `siteConfig` (Task 3), `services` (Task 6), `posts` (Task 7).

- [ ] **Step 1: Create `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next'
import { posts } from '@/lib/blog/data'
import { services } from '@/lib/services/data'
import { siteConfig } from '@/lib/seo/site-config'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${siteConfig.url}/servicios`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteConfig.url}/blog`, changeFrequency: 'weekly', priority: 0.8 },
  ]

  const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${siteConfig.url}/servicios/${service.slug}`,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: post.datePublished,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...serviceRoutes, ...blogRoutes]
}
```

- [ ] **Step 2: Create `src/app/robots.ts`**

```ts
import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
```

- [ ] **Step 3: Verify build and inspect output**

```bash
npm run build
npm run start &
sleep 2
curl -s http://localhost:3000/sitemap.xml | grep -c "<loc>"
curl -s http://localhost:3000/robots.txt
kill %1
```
Expected: sitemap contains 8 `<loc>` entries (3 static + 4 services + 1 blog post); robots.txt lists rules for `*`, `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, and a `Sitemap:` line pointing to `https://growmas.io/sitemap.xml`.

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat: add sitemap.xml and robots.txt with LLM crawler allowlist"
```

---

### Task 9: Migrate existing landings and go live on the root

This is the cutover task: move `auditoria-gratuita` under Next's static file serving, delete `diagnostico-de-fuga`, and adjust `vercel.json`/`next.config.ts` now that Next owns routing at `/`.

**Important:** Next.js's `public/` folder serves files only at their exact path (`public/auditoria-gratuita/index.html` is reachable at `/auditoria-gratuita/index.html`) — it does **not** auto-resolve a bare `/auditoria-gratuita` to that `index.html` the way a plain static host does. A `next.config.ts` rewrite is required to keep `/auditoria-gratuita` working with no trailing filename. `vercel.json` already has a real, working rewrite (`/auditoria-gratuita/reporte` → `/api/auditoria-gratuita/reporte`) and a `functions` entry for `api/auditoria-gratuita/submit.js` — per Global Constraints, these must survive; only the now-obsolete `/` → `diagnostico-de-fuga/index.html` rewrite and the `"framework": null` line (which was forcing static-only handling) are removed.

**Files:**
- Move: `auditoria-gratuita/index.html` → `public/auditoria-gratuita/index.html`
- Delete: `diagnostico-de-fuga/` (entire directory)
- Modify: `vercel.json` (drop the `/` rewrite and `"framework": null`; keep the `/auditoria-gratuita/reporte` rewrite and `functions` entry)
- Modify: `next.config.ts` (add a rewrite so `/auditoria-gratuita` resolves to the static `index.html`)
- Modify: `.vercelignore` (stop excluding the Next.js app files, since they're now the real deploy)

**Interfaces:**
- Consumes: nothing new — this wires together everything built in Tasks 1–8.

- [ ] **Step 1: Move `auditoria-gratuita` into `public/`, unchanged**

```bash
mkdir -p public/auditoria-gratuita
git mv auditoria-gratuita/index.html public/auditoria-gratuita/index.html
git rm -r --cached auditoria-gratuita 2>/dev/null || true
rmdir auditoria-gratuita 2>/dev/null || true
```

Verify the file is byte-identical to before the move:
```bash
git diff --stat HEAD -- public/auditoria-gratuita/index.html
```
Expected: shows as a rename with 0 content changes (or an add with identical byte count to the original — confirm no line-ending or content mutation happened during the move).

- [ ] **Step 2: Delete `diagnostico-de-fuga`**

```bash
git rm -r diagnostico-de-fuga
```

- [ ] **Step 3: Update `vercel.json` — drop the obsolete `/` rewrite and `framework: null`, keep everything else**

Current content (verify it matches before editing):
```json
{
  "framework": null,
  "rewrites": [
    { "source": "/", "destination": "/diagnostico-de-fuga/index.html" },
    { "source": "/auditoria-gratuita/reporte", "destination": "/api/auditoria-gratuita/reporte" }
  ],
  "functions": {
    "api/auditoria-gratuita/submit.js": { "maxDuration": 60 }
  }
}
```

Replace with:
```json
{
  "rewrites": [
    { "source": "/auditoria-gratuita/reporte", "destination": "/api/auditoria-gratuita/reporte" }
  ],
  "functions": {
    "api/auditoria-gratuita/submit.js": { "maxDuration": 60 }
  }
}
```

- [ ] **Step 4: Add a rewrite in `next.config.ts` so `/auditoria-gratuita` serves the static page**

Modify `next.config.ts` to add `rewrites()`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    mcpServer: true,
  },
  async rewrites() {
    return [
      { source: '/auditoria-gratuita', destination: '/auditoria-gratuita/index.html' },
    ]
  },
}

export default nextConfig
```

- [ ] **Step 5: Update `.vercelignore` to stop excluding the Next.js app**

Read the current `.vercelignore` and remove the lines that exclude `.claude/`, `src/`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.js`, `components.json` (whichever of these are present) — these are now the actual deployed application, not a leftover scaffold. `api/**/*.test.js` should stay excluded (test files, not deployed functions). Keep any lines unrelated to the Next.js app (e.g. `.env.local.example` if listed, `.mcp.json`, `CLAUDE.md`, `GEMINI.md`, `README.md`).

- [ ] **Step 6: Full verification build**

```bash
npm run build
npm run start &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/servicios
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/servicios/captacion
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/blog
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/blog/que-es-un-sistema-de-seguimiento-de-clientes
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/auditoria-gratuita
kill %1
```
Expected: all six return `200`.

- [ ] **Step 7: Run the full test suite and typecheck one last time**

```bash
npm run typecheck
npm run test:site
npm test
npm run build
```
Expected: all four succeed with no errors — `npm run test:site` (Vitest, `src/`) and `npm test` (the pre-existing `node --test` suite over `api/`/`lib/`) both stay green.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: cut over growmas.io root to the Next.js GROW+ site; retire diagnostico-de-fuga"
```

**Do not run `vercel --prod` or push to the remote as part of this task** — deploying to production is a separate, explicit step the user should trigger themselves after reviewing the site locally.

---

## Post-plan note

Servicios and Blog currently contain placeholder/example content (4 services with short real summaries but minimal body copy, 1 example blog post). Per the approved design spec, filling these out with full SEO/GEO/AEO-researched content is deferred to the future SEO-auditor and copywriter skills, built in a separate session.
