# Auditoría Gratuita — Quiz & Report Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the quiz-to-report pipeline for the `auditoria-gratuita` landing: a fixed 13–15 question wizard, server-side loss calculation, an AI-written narrative report, and delivery by email + WhatsApp — with zero database (report data lives in the URL).

**Architecture:** Vanilla-JS quiz wizard embedded in `auditoria-gratuita/index.html` → `POST /api/auditoria-gratuita/submit` (Vercel Node function) computes metrics by formula, calls Claude for narrative text, gzip+base64url-encodes the result into a URL, emails the lead via Resend, best-effort WhatsApps the lead via YCloud, and returns the report URL. `GET /api/auditoria-gratuita/reporte` (rewritten from `/auditoria-gratuita/reporte`) decodes that URL and renders the report page. No Supabase, no database anywhere.

**Tech Stack:** Node.js (CommonJS) Vercel serverless functions, `@anthropic-ai/sdk`, plain `fetch` for Resend/YCloud, Node's built-in `node:test` + `node:assert/strict` for tests, no frontend framework.

## Global Constraints

- No database of any kind (Supabase or otherwise) — report data is gzip+base64url-encoded into the report URL's `d` query param. (Spec §5, confirmed 2026-07-26.)
- Intake is a fixed, branching-only-within-Entrega quiz — never an open-ended AI chat. (Spec §2.)
- The AI (Claude) only writes narrative text around numbers already computed by formula — it must never invent or recompute a number. (Spec §2, §8.)
- Entrega's questions measure only what Growmas' marketing/automation can fix (no-show rate, upsell capture) — never physical/operational delivery quality. (Spec §2.)
- No pricing, plans, or minimum-commitment language anywhere in the report — that's reserved for the live sales call. (Spec §2.)
- The report's final CTA opens WhatsApp to Juan's business number — never to another landing (`sistema-mas` is unrelated and out of scope). (Spec §2.)
- Never touch `diagnostico-de-fuga/` — this work is scoped entirely to `auditoria-gratuita/`, `api/auditoria-gratuita/`, `lib/auditoria-gratuita/`, `vercel.json`, `.vercelignore`, and `package.json`. (Landing isolation rule.)
- Default Claude model for the narrative call is `claude-opus-5` per the project's Claude API skill default (no cheaper model unless the user says so).
- All user-facing and AI-generated text is Spanish.

---

### Task 1: Project setup — package.json for the API functions

**Files:**
- Create/overwrite: `package.json` (repo root)
- Modify: `.vercelignore` (remove the `package.json` line so Vercel installs these deps; everything else in it stays)

**Interfaces:**
- Produces: `@anthropic-ai/sdk` available to any file under `lib/` or `api/` via `require('@anthropic-ai/sdk')`.

**Context:** The current root `package.json` belongs to an unused, never-committed Next.js scaffold (confirmed vestigial in earlier project memory). This task replaces it with a minimal manifest for the real serverless functions this plan adds. This is shared infrastructure (like `vercel.json`), not a specific landing's file.

- [ ] **Step 1: Write the new package.json**

```json
{
  "name": "growmas-landings",
  "private": true,
  "version": "1.0.0",
  "engines": {
    "node": "20.x"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.70.0"
  },
  "scripts": {
    "test": "node --test lib/"
  }
}
```

- [ ] **Step 2: Remove `package.json` from `.vercelignore`**

Open `.vercelignore` and delete the line that reads `package.json`. Leave every other line (`.claude/`, `src/`, `next.config.ts`, etc.) untouched — those remain excluded.

- [ ] **Step 3: Install dependencies locally**

Run: `npm install`
Expected: creates `node_modules/` and `package-lock.json`, no errors.

- [ ] **Step 4: Add `node_modules` to `.gitignore`**

Check the repo-root `.gitignore` already ignores `node_modules` (most `.gitignore` templates do). If it does not, add a line `node_modules`.

- [ ] **Step 5: Commit**

```bash
git add package.json .vercelignore .gitignore
git commit -m "Add package.json for auditoria-gratuita serverless functions"
```

---

### Task 2: Question schema + validation

**Files:**
- Create: `lib/auditoria-gratuita/questions.js`
- Create: `lib/auditoria-gratuita/questions.test.js`
- Create: `lib/auditoria-gratuita/validate.js`
- Create: `lib/auditoria-gratuita/validate.test.js`

**Interfaces:**
- Produces (from `questions.js`): `QUESTIONS` (array), `getVisibleQuestions(answers) -> array`, `getAllQuestionIds() -> array<string>`.
- Produces (from `validate.js`): `validateSubmission(body) -> { ok: boolean, errors: string[], data: { name, whatsapp, email, answers } | null }`.
- Consumes (in `validate.js`): `getVisibleQuestions` from `./questions`.

- [ ] **Step 1: Write `questions.js`**

```js
'use strict';

const QUESTIONS = [
  { id: 'clientes_mes', stage: 'base', type: 'number', min: 0, prompt: '¿Cuántos clientes atiendes o cierras al mes?' },
  { id: 'ticket_promedio', stage: 'base', type: 'number', min: 0, prompt: '¿Cuál es tu ticket promedio por venta/cliente? (S/)' },
  { id: 'canal_adquisicion', stage: 'adquisicion', type: 'choice', options: ['redes_organico', 'recomendaciones', 'publicidad_paga', 'no_lo_se'], prompt: '¿De dónde viene la mayoría de tus clientes nuevos?' },
  { id: 'leads_mes', stage: 'adquisicion', type: 'number_or_unknown', min: 0, prompt: '¿Cuántos leads o contactos nuevos te escribieron el mes pasado?' },
  { id: 'tiempo_respuesta', stage: 'ventas', type: 'choice', options: ['minutos', 'mismo_dia', 'dia_siguiente', 'a_veces_mas_de_un_dia'], prompt: 'Cuando alguien te escribe, ¿en cuánto tiempo respondes en promedio?' },
  { id: 'tasa_cierre', stage: 'ventas', type: 'scale10', prompt: 'De cada 10 que preguntan, ¿cuántos terminan comprando?' },
  { id: 'hace_seguimiento', stage: 'cierre', type: 'choice', options: ['tengo_proceso', 'a_veces', 'casi_nunca'], prompt: 'Cuando alguien muestra interés pero no compra al toque, ¿le haces seguimiento?' },
  { id: 'tasa_seguimiento', stage: 'cierre', type: 'scale10', prompt: 'De esos que no compran al toque, ¿a cuántos de cada 10 les vuelves a escribir después?' },
  { id: 'tipo_entrega', stage: 'entrega', type: 'choice', options: ['producto', 'servicio', 'ambos'], prompt: '¿Tu negocio entrega principalmente un producto, un servicio, o ambos?' },
  {
    id: 'tasa_asistencia',
    stage: 'entrega',
    type: 'scale10',
    prompt: 'De cada 10 citas o reservas que agendas, ¿cuántas se presentan realmente?',
    showIf: (a) => a.tipo_entrega === 'servicio' || a.tipo_entrega === 'ambos',
  },
  {
    id: 'tiene_recordatorio',
    stage: 'entrega',
    type: 'choice',
    options: ['automatico', 'manual_a_veces', 'nada'],
    prompt: '¿Tienes algo automático que le recuerde o confirme la cita al cliente antes del día?',
    showIf: (a) => a.tipo_entrega === 'servicio' || a.tipo_entrega === 'ambos',
  },
  {
    id: 'tasa_upsell',
    stage: 'entrega',
    type: 'scale10',
    prompt: 'De cada 10 clientes que te compran, ¿a cuántos les ofreces o vendes algo adicional en el momento?',
    showIf: (a) => a.tipo_entrega === 'producto' || a.tipo_entrega === 'ambos',
  },
  {
    id: 'precio_adicional',
    stage: 'entrega',
    type: 'number',
    min: 0,
    prompt: '¿Cuál es el precio promedio de ese producto o combo adicional? (S/)',
    showIf: (a) => a.tipo_entrega === 'producto' || a.tipo_entrega === 'ambos',
  },
  {
    id: 'tiene_sistema_upsell',
    stage: 'entrega',
    type: 'choice',
    options: ['automatico', 'depende_persona', 'nada'],
    prompt: '¿Tienes algún sistema automático para ofrecer eso, o depende de que alguien se acuerde?',
    showIf: (a) => a.tipo_entrega === 'producto' || a.tipo_entrega === 'ambos',
  },
  { id: 'tasa_recompra', stage: 'fidelizacion', type: 'scale10', prompt: 'De cada 10 clientes que ya te compraron, ¿cuántos vuelven a comprarte?' },
  { id: 'tiene_reactivacion', stage: 'fidelizacion', type: 'choice', options: ['automatico', 'manual_a_veces', 'nada'], prompt: '¿Tienes algo para traer de vuelta a los clientes que dejaron de comprarte?' },
];

function getVisibleQuestions(answers) {
  const safeAnswers = answers || {};
  return QUESTIONS.filter((q) => (typeof q.showIf === 'function' ? q.showIf(safeAnswers) : true));
}

function getAllQuestionIds() {
  return QUESTIONS.map((q) => q.id);
}

module.exports = { QUESTIONS, getVisibleQuestions, getAllQuestionIds };
```

- [ ] **Step 2: Write `questions.test.js`**

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getVisibleQuestions, getAllQuestionIds } = require('./questions');

test('getAllQuestionIds returns every question id, including branch-only ones', () => {
  const ids = getAllQuestionIds();
  assert.ok(ids.includes('tasa_asistencia'));
  assert.ok(ids.includes('tasa_upsell'));
  assert.equal(new Set(ids).size, ids.length, 'no duplicate ids');
});

test('getVisibleQuestions hides servicio-only questions when tipo_entrega is producto', () => {
  const visible = getVisibleQuestions({ tipo_entrega: 'producto' }).map((q) => q.id);
  assert.ok(!visible.includes('tasa_asistencia'));
  assert.ok(!visible.includes('tiene_recordatorio'));
  assert.ok(visible.includes('tasa_upsell'));
});

test('getVisibleQuestions hides producto-only questions when tipo_entrega is servicio', () => {
  const visible = getVisibleQuestions({ tipo_entrega: 'servicio' }).map((q) => q.id);
  assert.ok(!visible.includes('tasa_upsell'));
  assert.ok(!visible.includes('precio_adicional'));
  assert.ok(visible.includes('tasa_asistencia'));
});

test('getVisibleQuestions shows both branches when tipo_entrega is ambos', () => {
  const visible = getVisibleQuestions({ tipo_entrega: 'ambos' }).map((q) => q.id);
  assert.ok(visible.includes('tasa_asistencia'));
  assert.ok(visible.includes('tasa_upsell'));
});

test('getVisibleQuestions shows no entrega-branch questions before tipo_entrega is answered', () => {
  const visible = getVisibleQuestions({}).map((q) => q.id);
  assert.ok(!visible.includes('tasa_asistencia'));
  assert.ok(!visible.includes('tasa_upsell'));
  assert.ok(visible.includes('tipo_entrega'));
});
```

- [ ] **Step 3: Run the tests to see them pass (module already correct) — verify the harness works**

Run: `node --test lib/auditoria-gratuita/questions.test.js`
Expected: 5 passing tests.

- [ ] **Step 4: Write `validate.js`**

```js
'use strict';

const { getVisibleQuestions } = require('./questions');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSubmission(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { ok: false, errors: ['Cuerpo de la solicitud inválido.'], data: null };
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) errors.push('El nombre es obligatorio.');

  const whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '';
  if (!whatsapp) errors.push('El WhatsApp es obligatorio.');

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || !EMAIL_RE.test(email)) errors.push('El email no es válido.');

  const rawAnswers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const visible = getVisibleQuestions(rawAnswers);
  const answers = {};

  for (const q of visible) {
    const value = rawAnswers[q.id];
    if (q.type === 'number') {
      const n = Number(value);
      if (!Number.isFinite(n) || n < q.min) {
        errors.push(`Respuesta inválida para "${q.id}".`);
        continue;
      }
      answers[q.id] = n;
    } else if (q.type === 'number_or_unknown') {
      if (value === null || value === 'no_lo_se' || value === undefined) {
        answers[q.id] = null;
      } else {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`Respuesta inválida para "${q.id}".`);
          continue;
        }
        answers[q.id] = n;
      }
    } else if (q.type === 'scale10') {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > 10) {
        errors.push(`Respuesta inválida para "${q.id}".`);
        continue;
      }
      answers[q.id] = n;
    } else if (q.type === 'choice') {
      if (!q.options.includes(value)) {
        errors.push(`Respuesta inválida para "${q.id}".`);
        continue;
      }
      answers[q.id] = value;
    }
  }

  if (errors.length > 0) return { ok: false, errors, data: null };
  return { ok: true, errors: [], data: { name, whatsapp, email, answers } };
}

module.exports = { validateSubmission };
```

- [ ] **Step 5: Write `validate.test.js`**

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSubmission } = require('./validate');

function fullAnswers(overrides) {
  return Object.assign(
    {
      clientes_mes: 100,
      ticket_promedio: 50,
      canal_adquisicion: 'redes_organico',
      leads_mes: 200,
      tiempo_respuesta: 'mismo_dia',
      tasa_cierre: 4,
      hace_seguimiento: 'tengo_proceso',
      tasa_seguimiento: 6,
      tipo_entrega: 'producto',
      tasa_upsell: 5,
      precio_adicional: 20,
      tiene_sistema_upsell: 'automatico',
      tasa_recompra: 5,
      tiene_reactivacion: 'manual_a_veces',
    },
    overrides,
  );
}

test('accepts a fully valid submission', () => {
  const result = validateSubmission({
    name: 'Ana',
    whatsapp: '+51999999999',
    email: 'ana@example.com',
    answers: fullAnswers({}),
  });
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.data.name, 'Ana');
  assert.equal(result.data.answers.tasa_cierre, 4);
});

test('rejects missing name, invalid email, and empty whatsapp together', () => {
  const result = validateSubmission({
    name: '',
    whatsapp: '',
    email: 'not-an-email',
    answers: fullAnswers({}),
  });
  assert.equal(result.ok, false);
  assert.equal(result.data, null);
  assert.equal(result.errors.length, 3);
});

test('accepts leads_mes as "no lo sé" and stores it as null', () => {
  const result = validateSubmission({
    name: 'Ana',
    whatsapp: '+51999999999',
    email: 'ana@example.com',
    answers: fullAnswers({ leads_mes: 'no_lo_se' }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.data.answers.leads_mes, null);
});

test('rejects an out-of-range scale10 answer', () => {
  const result = validateSubmission({
    name: 'Ana',
    whatsapp: '+51999999999',
    email: 'ana@example.com',
    answers: fullAnswers({ tasa_cierre: 11 }),
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('tasa_cierre')));
});

test('does not require servicio-branch answers when tipo_entrega is producto', () => {
  const answers = fullAnswers({});
  delete answers.tasa_asistencia; // never provided, and shouldn't be required
  const result = validateSubmission({
    name: 'Ana',
    whatsapp: '+51999999999',
    email: 'ana@example.com',
    answers,
  });
  assert.equal(result.ok, true);
});
```

- [ ] **Step 6: Run the tests**

Run: `node --test lib/auditoria-gratuita/validate.test.js`
Expected: 5 passing tests.

- [ ] **Step 7: Commit**

```bash
git add lib/auditoria-gratuita/questions.js lib/auditoria-gratuita/questions.test.js lib/auditoria-gratuita/validate.js lib/auditoria-gratuita/validate.test.js
git commit -m "Add question schema and submission validation for auditoria-gratuita"
```

---

### Task 3: Loss-calculation formulas

**Files:**
- Create: `lib/auditoria-gratuita/metrics.js`
- Create: `lib/auditoria-gratuita/metrics.test.js`

**Interfaces:**
- Consumes: nothing (pure function of an `answers` object shaped like `validateSubmission`'s `data.answers`).
- Produces: `calculateMetrics(answers) -> { stages: { [stageName]: { dineroQueSeVa: number, recuperable: number } }, totalMensualRecuperable: number, totalAnualRecuperable: number, sinDatosDeLeads: boolean }`, and the exported `CONFIG` object. Later tasks (`narrative.js`, `report-template.js`) consume this exact shape — `stages` keys are `'ventas' | 'cierre' | 'entrega' | 'fidelizacion'` (no `'adquisicion'` key — spec §4 explicitly excludes a numeric Adquisición figure).

- [ ] **Step 1: Write the failing test file first**

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateMetrics } = require('./metrics');

test('calculates ventas, cierre, entrega (producto), and fidelizacion when leads_mes is known', () => {
  const metrics = calculateMetrics({
    clientes_mes: 100,
    ticket_promedio: 50,
    leads_mes: 200,
    tasa_cierre: 4,
    tasa_seguimiento: 2,
    tipo_entrega: 'producto',
    tasa_upsell: 5,
    precio_adicional: 20,
    tasa_recompra: 5,
  });

  assert.equal(metrics.sinDatosDeLeads, false);
  assert.equal(metrics.stages.ventas.dineroQueSeVa, 6000);
  assert.equal(metrics.stages.ventas.recuperable, 1800);
  assert.equal(metrics.stages.cierre.dineroQueSeVa, 4800);
  assert.equal(metrics.stages.cierre.recuperable, 1200);
  assert.equal(metrics.stages.entrega.dineroQueSeVa, 1000);
  assert.equal(metrics.stages.entrega.recuperable, 300);
  assert.equal(metrics.stages.fidelizacion.dineroQueSeVa, 2500);
  assert.equal(metrics.stages.fidelizacion.recuperable, 750);
  assert.equal(metrics.totalMensualRecuperable, 4050);
  assert.equal(metrics.totalAnualRecuperable, 48600);
});

test('omits ventas and cierre when leads_mes is null, and flags sinDatosDeLeads', () => {
  const metrics = calculateMetrics({
    clientes_mes: 50,
    ticket_promedio: 100,
    leads_mes: null,
    tipo_entrega: 'servicio',
    tasa_asistencia: 7,
    tasa_recompra: 10,
  });

  assert.equal(metrics.sinDatosDeLeads, true);
  assert.equal(metrics.stages.ventas, undefined);
  assert.equal(metrics.stages.cierre, undefined);
  assert.equal(metrics.stages.entrega.dineroQueSeVa, 1500);
  assert.equal(metrics.stages.entrega.recuperable, 450);
  assert.equal(metrics.stages.fidelizacion.dineroQueSeVa, 0);
  assert.equal(metrics.stages.fidelizacion.recuperable, 0);
  assert.equal(metrics.totalMensualRecuperable, 450);
});

test('sums both entrega branches when tipo_entrega is ambos', () => {
  const metrics = calculateMetrics({
    clientes_mes: 20,
    ticket_promedio: 30,
    leads_mes: null,
    tipo_entrega: 'ambos',
    tasa_asistencia: 5,
    tasa_upsell: 0,
    precio_adicional: 40,
    tasa_recompra: 0,
  });

  assert.equal(metrics.stages.entrega.dineroQueSeVa, 1100);
  assert.equal(metrics.stages.entrega.recuperable, 330);
  assert.equal(metrics.stages.fidelizacion.dineroQueSeVa, 600);
  assert.equal(metrics.stages.fidelizacion.recuperable, 180);
  assert.equal(metrics.totalMensualRecuperable, 510);
  assert.equal(metrics.totalAnualRecuperable, 6120);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test lib/auditoria-gratuita/metrics.test.js`
Expected: FAIL — `Cannot find module './metrics'`.

- [ ] **Step 3: Write `metrics.js`**

```js
'use strict';

const CONFIG = {
  tasaRecuperacionRealista: 0.30,
  tasaConversionSeguimiento: 0.25,
};

function round(n) {
  return Math.round(n * 100) / 100;
}

function calculateMetrics(answers) {
  const clientesMes = Number(answers.clientes_mes) || 0;
  const ticket = Number(answers.ticket_promedio) || 0;
  const leadsMes = answers.leads_mes === null || answers.leads_mes === undefined ? null : Number(answers.leads_mes);
  const tasaCierre = Number(answers.tasa_cierre) || 0;
  const tasaSeguimiento = Number(answers.tasa_seguimiento) || 0;
  const tipoEntrega = answers.tipo_entrega;
  const tasaAsistencia = Number(answers.tasa_asistencia) || 0;
  const tasaUpsell = Number(answers.tasa_upsell) || 0;
  const precioAdicional = Number(answers.precio_adicional) || 0;
  const tasaRecompra = Number(answers.tasa_recompra) || 0;

  const stages = {};

  if (leadsMes !== null) {
    const leadsPerdidos = (leadsMes * (10 - tasaCierre)) / 10;
    const dineroVentas = leadsPerdidos * ticket;
    stages.ventas = {
      dineroQueSeVa: round(dineroVentas),
      recuperable: round(dineroVentas * CONFIG.tasaRecuperacionRealista),
    };

    const sinSeguimiento = (leadsPerdidos * (10 - tasaSeguimiento)) / 10;
    const dineroCierre = sinSeguimiento * ticket;
    stages.cierre = {
      dineroQueSeVa: round(dineroCierre),
      recuperable: round(dineroCierre * CONFIG.tasaConversionSeguimiento),
    };
  }

  let dineroEntrega = 0;
  if (tipoEntrega === 'servicio' || tipoEntrega === 'ambos') {
    dineroEntrega += (clientesMes * (10 - tasaAsistencia)) / 10 * ticket;
  }
  if (tipoEntrega === 'producto' || tipoEntrega === 'ambos') {
    dineroEntrega += (clientesMes * (10 - tasaUpsell)) / 10 * precioAdicional;
  }
  if (tipoEntrega) {
    stages.entrega = {
      dineroQueSeVa: round(dineroEntrega),
      recuperable: round(dineroEntrega * CONFIG.tasaRecuperacionRealista),
    };
  }

  const noVuelven = (clientesMes * (10 - tasaRecompra)) / 10;
  const dineroFidelizacion = noVuelven * ticket;
  stages.fidelizacion = {
    dineroQueSeVa: round(dineroFidelizacion),
    recuperable: round(dineroFidelizacion * CONFIG.tasaRecuperacionRealista),
  };

  const totalMensualRecuperable = round(
    Object.values(stages).reduce((sum, s) => sum + s.recuperable, 0),
  );

  return {
    stages,
    totalMensualRecuperable,
    totalAnualRecuperable: round(totalMensualRecuperable * 12),
    sinDatosDeLeads: leadsMes === null,
  };
}

module.exports = { calculateMetrics, CONFIG };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test lib/auditoria-gratuita/metrics.test.js`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add lib/auditoria-gratuita/metrics.js lib/auditoria-gratuita/metrics.test.js
git commit -m "Add loss-calculation formulas for auditoria-gratuita"
```

---

### Task 4: Report data codec (URL encode/decode)

**Files:**
- Create: `lib/auditoria-gratuita/report-codec.js`
- Create: `lib/auditoria-gratuita/report-codec.test.js`

**Interfaces:**
- Produces: `encodeReportData(payload: object) -> string`, `decodeReportData(encoded: string) -> object` (throws on invalid input).
- Consumed by: `api/auditoria-gratuita/submit.js` (encode) and `api/auditoria-gratuita/reporte.js` (decode).

- [ ] **Step 1: Write the failing test**

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { encodeReportData, decodeReportData } = require('./report-codec');

test('round-trips a report payload', () => {
  const payload = {
    name: 'Ana',
    metrics: { stages: { ventas: { dineroQueSeVa: 100, recuperable: 30 } }, totalMensualRecuperable: 30, totalAnualRecuperable: 360 },
    report: { intro: 'hola', secciones: { ventas: 'texto' }, cierre_final: 'cierre' },
  };
  const encoded = encodeReportData(payload);
  assert.equal(typeof encoded, 'string');
  const decoded = decodeReportData(encoded);
  assert.deepEqual(decoded, payload);
});

test('throws on garbage input instead of returning something silently wrong', () => {
  assert.throws(() => decodeReportData('not-valid-base64url-gzip-data'));
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test lib/auditoria-gratuita/report-codec.test.js`
Expected: FAIL — `Cannot find module './report-codec'`.

- [ ] **Step 3: Write `report-codec.js`**

```js
'use strict';

const zlib = require('node:zlib');

function encodeReportData(payload) {
  const json = JSON.stringify(payload);
  const compressed = zlib.gzipSync(Buffer.from(json, 'utf8'));
  return compressed.toString('base64url');
}

function decodeReportData(encoded) {
  const compressed = Buffer.from(encoded, 'base64url');
  const json = zlib.gunzipSync(compressed).toString('utf8');
  return JSON.parse(json);
}

module.exports = { encodeReportData, decodeReportData };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test lib/auditoria-gratuita/report-codec.test.js`
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add lib/auditoria-gratuita/report-codec.js lib/auditoria-gratuita/report-codec.test.js
git commit -m "Add gzip+base64url codec for stateless report URLs"
```

---

### Task 5: Report HTML template

**Files:**
- Create: `lib/auditoria-gratuita/report-template.js`
- Create: `lib/auditoria-gratuita/report-template.test.js`

**Interfaces:**
- Consumes: the `metrics` shape from Task 3 (`calculateMetrics`'s return value) and a `report` object shaped like `narrative.js`'s output (Task 6): `{ intro: string, secciones: { [stage]: string }, cierre_final: string }`.
- Produces: `renderReportHtml({ name, metrics, report, whatsappUrl }) -> string` (full HTML document).

- [ ] **Step 1: Write the failing test**

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { renderReportHtml } = require('./report-template');

function baseArgs(overrides) {
  return Object.assign(
    {
      name: 'Ana',
      metrics: {
        stages: { ventas: { dineroQueSeVa: 6000, recuperable: 1800 } },
        totalMensualRecuperable: 1800,
        totalAnualRecuperable: 21600,
      },
      report: { intro: 'Encontramos esto.', secciones: { ventas: 'Texto de ventas.' }, cierre_final: 'Agenda tu llamada.' },
      whatsappUrl: 'https://wa.me/51999999999?text=hola',
    },
    overrides,
  );
}

test('renders the name, total, a stage section, and the CTA link', () => {
  const html = renderReportHtml(baseArgs({}));
  assert.match(html, /Ana/);
  assert.match(html, /S\/\s?1,800/);
  assert.match(html, /Texto de ventas\./);
  assert.match(html, /href="https:\/\/wa\.me\/51999999999\?text=hola"/);
});

test('escapes HTML in the name so a malicious answer cannot inject markup', () => {
  const html = renderReportHtml(baseArgs({ name: '<script>alert(1)</script>' }));
  assert.doesNotMatch(html, /<script>alert/);
});

test('renders without throwing when there is no ventas/cierre stage (leads unknown)', () => {
  const html = renderReportHtml(baseArgs({
    metrics: { stages: { fidelizacion: { dineroQueSeVa: 500, recuperable: 150 } }, totalMensualRecuperable: 150, totalAnualRecuperable: 1800 },
    report: { intro: 'Intro', secciones: { fidelizacion: 'Texto.' }, cierre_final: 'Cierre.' },
  }));
  assert.match(html, /Fidelización/);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test lib/auditoria-gratuita/report-template.test.js`
Expected: FAIL — `Cannot find module './report-template'`.

- [ ] **Step 3: Write `report-template.js`**

```js
'use strict';

const STAGE_LABELS = {
  ventas: 'Ventas',
  cierre: 'Cierre',
  entrega: 'Entrega',
  fidelizacion: 'Fidelización',
};

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function formatSoles(n) {
  return 'S/ ' + Math.round(n).toLocaleString('es-PE');
}

function renderReportHtml({ name, metrics, report, whatsappUrl }) {
  const safeName = escapeHtml(name || '');
  const stages = metrics.stages || {};

  const stageRows = Object.keys(stages)
    .map((key) => {
      const stage = stages[key];
      const label = STAGE_LABELS[key] || key;
      const text = report && report.secciones && report.secciones[key] ? report.secciones[key] : '';
      return `
      <div class="stage-card">
        <div class="stage-head">
          <span class="stage-label">${escapeHtml(label)}</span>
          <span class="stage-amount">${formatSoles(stage.recuperable)}/mes</span>
        </div>
        <p class="stage-text">${escapeHtml(text)}</p>
      </div>`;
    })
    .join('\n');

  const intro = report && report.intro ? escapeHtml(report.intro) : '';
  const cierreFinal = report && report.cierre_final ? escapeHtml(report.cierre_final) : '';
  const safeWhatsappUrl = escapeHtml(whatsappUrl || '');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tu auditoría · Growmas</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0A0A0F; color:#fff; font-family:'DM Sans',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
  main { max-width:680px; margin:0 auto; padding:clamp(32px,6vw,64px) clamp(20px,5vw,32px); }
  h1 { font-family:Sora,sans-serif; font-weight:800; font-size:clamp(24px,4vw,32px); margin-bottom:20px; line-height:1.25; }
  .total-box { background:linear-gradient(135deg,#8B5CF6,#D946EF); border-radius:16px; padding:24px; text-align:center; margin-bottom:32px; }
  .total-box .amount { font-family:Sora,sans-serif; font-weight:800; font-size:clamp(28px,5vw,40px); }
  .total-box .caption { font-size:14px; opacity:.9; margin-top:6px; }
  .intro, .cierre { font-size:15.5px; line-height:1.7; color:#C4C4CC; margin-bottom:24px; }
  .stage-card { background:#111118; border:1px solid rgba(255,255,255,.06); border-radius:14px; padding:20px; margin-bottom:14px; }
  .stage-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:12px; }
  .stage-label { font-family:Sora,sans-serif; font-weight:700; font-size:14px; }
  .stage-amount { font-family:Sora,sans-serif; font-weight:800; font-size:14px; color:#F97316; white-space:nowrap; }
  .stage-text { font-size:14.5px; line-height:1.6; color:#B4B4BC; }
  .cta { display:inline-flex; align-items:center; gap:10px; background:linear-gradient(135deg,#8B5CF6,#D946EF); color:#fff; padding:18px 32px; border-radius:14px; font-weight:600; font-size:16px; text-decoration:none; margin-top:12px; }
</style>
</head>
<body>
<main>
  <h1>${safeName ? `${safeName}, esto es lo que encontramos.` : 'Esto es lo que encontramos.'}</h1>
  <div class="total-box">
    <div class="amount">${formatSoles(metrics.totalMensualRecuperable)}/mes</div>
    <div class="caption">Podrías estar recuperando esto cada mes (${formatSoles(metrics.totalAnualRecuperable)} al año)</div>
  </div>
  <p class="intro">${intro}</p>
  ${stageRows}
  <p class="cierre">${cierreFinal}</p>
  <a class="cta" href="${safeWhatsappUrl}">💬 Quiero agendar mi reunión para adquirir el Sistema Más →</a>
</main>
</body>
</html>`;
}

module.exports = { renderReportHtml, formatSoles, escapeHtml };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test lib/auditoria-gratuita/report-template.test.js`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add lib/auditoria-gratuita/report-template.js lib/auditoria-gratuita/report-template.test.js
git commit -m "Add report HTML template renderer"
```

---

### Task 6: AI narrative generation (prompt + fallback + Claude call)

**Files:**
- Create: `lib/auditoria-gratuita/narrative.js`
- Create: `lib/auditoria-gratuita/narrative.test.js`

**Interfaces:**
- Consumes: `metrics` shape from Task 3.
- Produces: `buildPrompt(name, metrics) -> Array<{role, content}>` (pure), `fallbackNarrative(metrics) -> { intro, secciones, cierre_final }` (pure), `generateNarrative(anthropicClient, name, metrics) -> Promise<{ intro, secciones, cierre_final }>` (impure — calls `anthropicClient.messages.create`, retries once, falls back to `fallbackNarrative` on any failure or malformed response).
- The returned shape's `secciones` keys must line up with `metrics.stages` keys — `report-template.js` (Task 5) looks up `report.secciones[stageKey]` for each key present in `metrics.stages`.

- [ ] **Step 1: Write the failing test — pure functions only (no network)**

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPrompt, fallbackNarrative, generateNarrative } = require('./narrative');

const SAMPLE_METRICS = {
  stages: {
    ventas: { dineroQueSeVa: 6000, recuperable: 1800 },
    fidelizacion: { dineroQueSeVa: 2500, recuperable: 750 },
  },
  totalMensualRecuperable: 2550,
  totalAnualRecuperable: 30600,
  sinDatosDeLeads: false,
};

test('buildPrompt includes the exact precomputed numbers and forbids inventing new ones', () => {
  const messages = buildPrompt('Ana', SAMPLE_METRICS);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].role, 'user');
  assert.match(messages[0].content, /6000/);
  assert.match(messages[0].content, /1800/);
  assert.match(messages[0].content, /2550/);
  assert.match(messages[0].content, /Ana/);
  assert.match(messages[0].content, /NO los recalcules/i);
});

test('fallbackNarrative produces a section for every stage present in metrics, using its numbers', () => {
  const result = fallbackNarrative(SAMPLE_METRICS);
  assert.equal(typeof result.intro, 'string');
  assert.match(result.secciones.ventas, /6000/);
  assert.match(result.secciones.ventas, /1800/);
  assert.match(result.secciones.fidelizacion, /2500/);
  assert.equal(typeof result.cierre_final, 'string');
});

test('generateNarrative falls back when the Claude client throws', async () => {
  const failingClient = {
    messages: {
      create: async () => {
        throw new Error('network down');
      },
    },
  };
  const result = await generateNarrative(failingClient, 'Ana', SAMPLE_METRICS);
  assert.deepEqual(result, fallbackNarrative(SAMPLE_METRICS));
});

test('generateNarrative falls back when the response is not valid JSON', async () => {
  const badClient = {
    messages: {
      create: async () => ({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'not json at all' }],
      }),
    },
  };
  const result = await generateNarrative(badClient, 'Ana', SAMPLE_METRICS);
  assert.deepEqual(result, fallbackNarrative(SAMPLE_METRICS));
});

test('generateNarrative returns the parsed narrative on a well-formed response', async () => {
  const goodNarrative = { intro: 'Hola', secciones: { ventas: 'x', fidelizacion: 'y' }, cierre_final: 'z' };
  const goodClient = {
    messages: {
      create: async () => ({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: JSON.stringify(goodNarrative) }],
      }),
    },
  };
  const result = await generateNarrative(goodClient, 'Ana', SAMPLE_METRICS);
  assert.deepEqual(result, goodNarrative);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test lib/auditoria-gratuita/narrative.test.js`
Expected: FAIL — `Cannot find module './narrative'`.

- [ ] **Step 3: Write `narrative.js`**

```js
'use strict';

const STAGE_LABELS = {
  ventas: 'Ventas',
  cierre: 'Cierre',
  entrega: 'Entrega',
  fidelizacion: 'Fidelización',
};

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    intro: { type: 'string' },
    secciones: {
      type: 'object',
      properties: {
        ventas: { type: 'string' },
        cierre: { type: 'string' },
        entrega: { type: 'string' },
        fidelizacion: { type: 'string' },
      },
      additionalProperties: false,
    },
    cierre_final: { type: 'string' },
  },
  required: ['intro', 'secciones', 'cierre_final'],
  additionalProperties: false,
};

function buildPrompt(name, metrics) {
  const stagesSummary = Object.entries(metrics.stages || {})
    .map(([key, s]) => `- ${STAGE_LABELS[key] || key}: pierde S/ ${s.dineroQueSeVa}/mes, recuperable S/ ${s.recuperable}/mes`)
    .join('\n');

  const content = `Eres un consultor de negocios escribiendo un reporte corto y profesional para ${name || 'el dueño de un negocio'}.

Datos ya calculados (NO los recalcules, NO inventes otros números, úsalos exactamente):
${stagesSummary}
Total recuperable al mes: S/ ${metrics.totalMensualRecuperable}
Total recuperable al año: S/ ${metrics.totalAnualRecuperable}
${metrics.sinDatosDeLeads ? 'El negocio no tiene visibilidad de cuántos leads le llegan al mes.' : ''}

Escribe en español, tono directo y cercano, nunca corporativo ni genérico. No muestres las respuestas crudas del cuestionario, sintetiza. No menciones precios, planes ni compromisos de tiempo mínimo — eso se conversa en una llamada, no en este reporte. Sé breve.

Completa "secciones" solo para las etapas listadas arriba; para cualquier otra etapa deja el texto vacío ("").`;

  return [{ role: 'user', content }];
}

function fallbackNarrative(metrics) {
  const secciones = {};
  for (const [key, s] of Object.entries(metrics.stages || {})) {
    secciones[key] = `En esta etapa se estima que se te están yendo S/ ${s.dineroQueSeVa} al mes, de los cuales podrías recuperar alrededor de S/ ${s.recuperable} con un sistema adecuado.`;
  }
  return {
    intro: 'Analizamos tus respuestas y esto es lo que encontramos en tu negocio.',
    secciones,
    cierre_final: 'Estos números son una estimación basada en tus propias respuestas. El siguiente paso es agendar una llamada para ver exactamente cómo recuperar ese dinero.',
  };
}

function isWellFormedNarrative(parsed) {
  return (
    parsed &&
    typeof parsed === 'object' &&
    typeof parsed.intro === 'string' &&
    parsed.secciones &&
    typeof parsed.secciones === 'object' &&
    typeof parsed.cierre_final === 'string'
  );
}

async function generateNarrative(anthropicClient, name, metrics) {
  const messages = buildPrompt(name, metrics);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await anthropicClient.messages.create({
        model: 'claude-opus-5',
        max_tokens: 1024,
        output_config: {
          effort: 'low',
          format: { type: 'json_schema', schema: REPORT_SCHEMA },
        },
        messages,
      });

      if (response.stop_reason === 'refusal') throw new Error('Claude refused the request');

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock) throw new Error('No text block in Claude response');

      const parsed = JSON.parse(textBlock.text);
      if (!isWellFormedNarrative(parsed)) throw new Error('Malformed narrative shape');
      return parsed;
    } catch (err) {
      if (attempt === 1) break;
    }
  }

  return fallbackNarrative(metrics);
}

module.exports = { buildPrompt, fallbackNarrative, generateNarrative, REPORT_SCHEMA };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test lib/auditoria-gratuita/narrative.test.js`
Expected: 5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add lib/auditoria-gratuita/narrative.js lib/auditoria-gratuita/narrative.test.js
git commit -m "Add Claude narrative generation with retry and template fallback"
```

---

### Task 7: Email delivery (Resend)

**Files:**
- Create: `lib/auditoria-gratuita/email.js`
- Create: `lib/auditoria-gratuita/email.test.js`

**Interfaces:**
- Produces: `sendReportEmail({ apiKey, to, name, reportUrl }) -> Promise<object>` (throws on a non-2xx response).

**Context:** Uses plain `fetch` against Resend's HTTP API directly (no SDK dependency needed for one call type) — Node 20's global `fetch` is used, matching the Vercel Node 20 runtime set in Task 1's `package.json`.

- [ ] **Step 1: Write the failing test — stub global fetch, no real network call**

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { sendReportEmail } = require('./email');

test('sends a POST to Resend with the report link in the body', async (t) => {
  let capturedUrl;
  let capturedInit;
  t.mock.method(global, 'fetch', async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    return { ok: true, json: async () => ({ id: 'email_123' }) };
  });

  const result = await sendReportEmail({
    apiKey: 'test-key',
    to: 'lead@example.com',
    name: 'Ana',
    reportUrl: 'https://growmas.io/auditoria-gratuita/reporte?d=abc',
  });

  assert.equal(capturedUrl, 'https://api.resend.com/emails');
  assert.equal(capturedInit.headers.Authorization, 'Bearer test-key');
  const body = JSON.parse(capturedInit.body);
  assert.deepEqual(body.to, ['lead@example.com']);
  assert.match(body.html, /https:\/\/growmas\.io\/auditoria-gratuita\/reporte\?d=abc/);
  assert.deepEqual(result, { id: 'email_123' });
});

test('throws when Resend responds with a non-2xx status', async (t) => {
  t.mock.method(global, 'fetch', async () => ({ ok: false, status: 422, text: async () => 'invalid domain' }));

  await assert.rejects(
    () => sendReportEmail({ apiKey: 'test-key', to: 'lead@example.com', name: 'Ana', reportUrl: 'https://x' }),
    /Resend error 422/,
  );
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test lib/auditoria-gratuita/email.test.js`
Expected: FAIL — `Cannot find module './email'`.

- [ ] **Step 3: Write `email.js`**

```js
'use strict';

async function sendReportEmail({ apiKey, to, name, reportUrl }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Growmas <auditoria@growmas.io>',
      to: [to],
      subject: `Tu auditoría está lista, ${name}`,
      html: `<p>Hola ${name},</p><p>Tu auditoría personalizada ya está lista. Puedes verla aquí:</p><p><a href="${reportUrl}">${reportUrl}</a></p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  return res.json();
}

module.exports = { sendReportEmail };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test lib/auditoria-gratuita/email.test.js`
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add lib/auditoria-gratuita/email.js lib/auditoria-gratuita/email.test.js
git commit -m "Add Resend email delivery for auditoria-gratuita reports"
```

---

### Task 8: WhatsApp delivery (YCloud) — best-effort, non-blocking

**Files:**
- Create: `lib/auditoria-gratuita/whatsapp.js`
- Create: `lib/auditoria-gratuita/whatsapp.test.js`

**Interfaces:**
- Produces: `sendReportWhatsapp({ apiKey, templateName, to, name, reportUrl }) -> Promise<{ ok: boolean, error?: string }>` — **never throws**; the caller (Task 9) treats WhatsApp as best-effort per spec §9/§10.

**Context — verify before going live:** YCloud's exact WhatsApp template-send endpoint path and payload field names are written below to the best of available documentation at plan-writing time. **Before this is used with a real YCloud account, re-check the request shape against YCloud's own API reference** (their dashboard has interactive API docs) — the endpoint path or field names may differ from what's below. This is exactly the "pending template approval" external dependency already called out in the design spec (§9); nothing here blocks Task 9's tests, which mock the network call.

- [ ] **Step 1: Write the failing test**

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { sendReportWhatsapp } = require('./whatsapp');

test('sends the template with name and report link as params', async (t) => {
  let capturedInit;
  t.mock.method(global, 'fetch', async (url, init) => {
    capturedInit = init;
    return { ok: true, json: async () => ({ id: 'wamid_123' }) };
  });

  const result = await sendReportWhatsapp({
    apiKey: 'test-key',
    templateName: 'auditoria_lista',
    to: '+51999999999',
    name: 'Ana',
    reportUrl: 'https://growmas.io/auditoria-gratuita/reporte?d=abc',
  });

  const body = JSON.parse(capturedInit.body);
  assert.equal(body.to, '+51999999999');
  assert.equal(body.templateName, 'auditoria_lista');
  assert.deepEqual(body.params, ['Ana', 'https://growmas.io/auditoria-gratuita/reporte?d=abc']);
  assert.deepEqual(result, { ok: true });
});

test('returns { ok: false, error } instead of throwing when YCloud errors', async (t) => {
  t.mock.method(global, 'fetch', async () => ({ ok: false, status: 400, text: async () => 'template not approved' }));

  const result = await sendReportWhatsapp({
    apiKey: 'test-key',
    templateName: 'auditoria_lista',
    to: '+51999999999',
    name: 'Ana',
    reportUrl: 'https://x',
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /400/);
});

test('returns { ok: false, error } instead of throwing on a network error', async (t) => {
  t.mock.method(global, 'fetch', async () => {
    throw new Error('DNS lookup failed');
  });

  const result = await sendReportWhatsapp({
    apiKey: 'test-key',
    templateName: 'auditoria_lista',
    to: '+51999999999',
    name: 'Ana',
    reportUrl: 'https://x',
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /DNS lookup failed/);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test lib/auditoria-gratuita/whatsapp.test.js`
Expected: FAIL — `Cannot find module './whatsapp'`.

- [ ] **Step 3: Write `whatsapp.js`**

```js
'use strict';

async function sendReportWhatsapp({ apiKey, templateName, to, name, reportUrl }) {
  try {
    const res = await fetch('https://api.ycloud.com/v2/whatsapp/messages/sendTemplate', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        templateName,
        templateLanguage: 'es',
        params: [name, reportUrl],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `YCloud error ${res.status}: ${body}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { sendReportWhatsapp };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test lib/auditoria-gratuita/whatsapp.test.js`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add lib/auditoria-gratuita/whatsapp.js lib/auditoria-gratuita/whatsapp.test.js
git commit -m "Add best-effort YCloud WhatsApp delivery for auditoria-gratuita reports"
```

---

### Task 9: `/api/auditoria-gratuita/submit` endpoint

**Files:**
- Create: `api/auditoria-gratuita/submit.js`
- Create: `api/auditoria-gratuita/submit.test.js`

**Interfaces:**
- Consumes: `validateSubmission` (Task 2), `calculateMetrics` (Task 3), `encodeReportData` (Task 4), `generateNarrative` (Task 6), `sendReportEmail` (Task 7), `sendReportWhatsapp` (Task 8).
- Produces: `createSubmitHandler(deps) -> (req, res) => Promise<void>` — a factory so tests can inject fake dependencies; `module.exports.default` (or `module.exports`, see Vercel Node function convention) is `createSubmitHandler()` called with real implementations, which is what Vercel actually invokes.
- Response contract: `200 { reportUrl: string }` on success; `400 { errors: string[] }` on invalid input.

**Context:** Vercel Node functions export a single `(req, res)` handler. To keep this endpoint testable without hitting real Anthropic/Resend/YCloud APIs, the handler is built by a factory that takes its dependencies as arguments, defaulting to the real clients when not supplied.

- [ ] **Step 1: Write the failing test — inject fake dependencies, no real network/API calls**

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSubmitHandler } = require('./submit');

function fullAnswers(overrides) {
  return Object.assign(
    {
      clientes_mes: 100,
      ticket_promedio: 50,
      canal_adquisicion: 'redes_organico',
      leads_mes: 200,
      tiempo_respuesta: 'mismo_dia',
      tasa_cierre: 4,
      hace_seguimiento: 'tengo_proceso',
      tasa_seguimiento: 6,
      tipo_entrega: 'producto',
      tasa_upsell: 5,
      precio_adicional: 20,
      tiene_sistema_upsell: 'automatico',
      tasa_recompra: 5,
      tiene_reactivacion: 'manual_a_veces',
    },
    overrides,
  );
}

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('returns a reportUrl and calls email + whatsapp on a valid submission', async () => {
  const emailCalls = [];
  const whatsappCalls = [];
  const handler = createSubmitHandler({
    anthropicClient: { messages: { create: async () => { throw new Error('offline in test'); } } },
    sendReportEmail: async (args) => { emailCalls.push(args); return { id: 'email_1' }; },
    sendReportWhatsapp: async (args) => { whatsappCalls.push(args); return { ok: true }; },
    resendApiKey: 'resend-key',
    ycloudApiKey: 'ycloud-key',
    ycloudTemplateName: 'auditoria_lista',
    siteUrl: 'https://growmas.io',
  });

  const req = {
    method: 'POST',
    body: { name: 'Ana', whatsapp: '+51999999999', email: 'ana@example.com', answers: fullAnswers({}) },
  };
  const res = mockRes();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.reportUrl, /^https:\/\/growmas\.io\/auditoria-gratuita\/reporte\?d=/);
  assert.equal(emailCalls.length, 1);
  assert.equal(emailCalls[0].to, 'ana@example.com');
  assert.equal(whatsappCalls.length, 1);
  assert.equal(whatsappCalls[0].to, '+51999999999');
});

test('returns 400 with errors and calls neither email nor whatsapp on invalid input', async () => {
  const emailCalls = [];
  const whatsappCalls = [];
  const handler = createSubmitHandler({
    anthropicClient: { messages: { create: async () => { throw new Error('unused'); } } },
    sendReportEmail: async (args) => { emailCalls.push(args); },
    sendReportWhatsapp: async (args) => { whatsappCalls.push(args); },
    resendApiKey: 'resend-key',
    ycloudApiKey: 'ycloud-key',
    ycloudTemplateName: 'auditoria_lista',
    siteUrl: 'https://growmas.io',
  });

  const req = { method: 'POST', body: { name: '', whatsapp: '', email: 'bad', answers: {} } };
  const res = mockRes();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.ok(Array.isArray(res.body.errors));
  assert.equal(emailCalls.length, 0);
  assert.equal(whatsappCalls.length, 0);
});

test('still returns a reportUrl when the email dependency throws (email is non-blocking)', async () => {
  const handler = createSubmitHandler({
    anthropicClient: { messages: { create: async () => { throw new Error('offline in test'); } } },
    sendReportEmail: async () => { throw new Error('resend is down'); },
    sendReportWhatsapp: async () => ({ ok: true }),
    resendApiKey: 'resend-key',
    ycloudApiKey: 'ycloud-key',
    ycloudTemplateName: 'auditoria_lista',
    siteUrl: 'https://growmas.io',
  });

  const req = {
    method: 'POST',
    body: { name: 'Ana', whatsapp: '+51999999999', email: 'ana@example.com', answers: fullAnswers({}) },
  };
  const res = mockRes();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.reportUrl, /reporte\?d=/);
});

test('rejects non-POST methods with 405', async () => {
  const handler = createSubmitHandler({
    anthropicClient: { messages: { create: async () => { throw new Error('unused'); } } },
    sendReportEmail: async () => {},
    sendReportWhatsapp: async () => ({ ok: true }),
    resendApiKey: 'k',
    ycloudApiKey: 'k',
    ycloudTemplateName: 't',
    siteUrl: 'https://growmas.io',
  });

  const req = { method: 'GET', body: {} };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.statusCode, 405);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test api/auditoria-gratuita/submit.test.js`
Expected: FAIL — `Cannot find module './submit'`.

- [ ] **Step 3: Write `submit.js`**

```js
'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { validateSubmission } = require('../../lib/auditoria-gratuita/validate');
const { calculateMetrics } = require('../../lib/auditoria-gratuita/metrics');
const { generateNarrative } = require('../../lib/auditoria-gratuita/narrative');
const { encodeReportData } = require('../../lib/auditoria-gratuita/report-codec');
const { sendReportEmail: defaultSendReportEmail } = require('../../lib/auditoria-gratuita/email');
const { sendReportWhatsapp: defaultSendReportWhatsapp } = require('../../lib/auditoria-gratuita/whatsapp');

function createSubmitHandler(overrides) {
  const deps = Object.assign(
    {
      anthropicClient: new Anthropic(),
      sendReportEmail: defaultSendReportEmail,
      sendReportWhatsapp: defaultSendReportWhatsapp,
      resendApiKey: process.env.RESEND_API_KEY,
      ycloudApiKey: process.env.YCLOUD_API_KEY,
      ycloudTemplateName: process.env.YCLOUD_TEMPLATE_NAME,
      siteUrl: process.env.SITE_URL || 'https://growmas.io',
    },
    overrides,
  );

  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.status(405).json({ errors: ['Method not allowed'] });
      return;
    }

    const { ok, errors, data } = validateSubmission(req.body);
    if (!ok) {
      res.status(400).json({ errors });
      return;
    }

    const { name, whatsapp, email, answers } = data;
    const metrics = calculateMetrics(answers);
    const report = await deps.anthropicClient.messages
      ? await generateNarrative(deps.anthropicClient, name, metrics)
      : null;

    const encoded = encodeReportData({ name, metrics, report });
    const reportUrl = `${deps.siteUrl}/auditoria-gratuita/reporte?d=${encoded}`;

    try {
      await deps.sendReportEmail({ apiKey: deps.resendApiKey, to: email, name, reportUrl });
    } catch (err) {
      console.error('sendReportEmail failed:', err.message);
    }

    try {
      await deps.sendReportWhatsapp({
        apiKey: deps.ycloudApiKey,
        templateName: deps.ycloudTemplateName,
        to: whatsapp,
        name,
        reportUrl,
      });
    } catch (err) {
      console.error('sendReportWhatsapp failed:', err.message);
    }

    res.status(200).json({ reportUrl });
  };
}

module.exports = { createSubmitHandler };
module.exports.default = createSubmitHandler();
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test api/auditoria-gratuita/submit.test.js`
Expected: 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add api/auditoria-gratuita/submit.js api/auditoria-gratuita/submit.test.js
git commit -m "Add /api/auditoria-gratuita/submit endpoint"
```

---

### Task 10: `/api/auditoria-gratuita/reporte` endpoint

**Files:**
- Create: `api/auditoria-gratuita/reporte.js`
- Create: `api/auditoria-gratuita/reporte.test.js`

**Interfaces:**
- Consumes: `decodeReportData` (Task 4), `renderReportHtml` (Task 5).
- Produces: `createReporteHandler(deps) -> (req, res) => void`; `module.exports.default` is the ready-to-use handler.

- [ ] **Step 1: Write the failing test**

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createReporteHandler } = require('./reporte');
const { encodeReportData } = require('../../lib/auditoria-gratuita/report-codec');

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('renders the report HTML when the query param decodes successfully', () => {
  const handler = createReporteHandler({ businessWhatsappNumber: '51999999999' });
  const encoded = encodeReportData({
    name: 'Ana',
    metrics: { stages: { ventas: { dineroQueSeVa: 100, recuperable: 30 } }, totalMensualRecuperable: 30, totalAnualRecuperable: 360 },
    report: { intro: 'Intro', secciones: { ventas: 'Texto.' }, cierre_final: 'Cierre.' },
  });

  const req = { method: 'GET', query: { d: encoded } };
  const res = mockRes();
  handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Content-Type'], 'text/html; charset=utf-8');
  assert.match(res.body, /Ana/);
  assert.match(res.body, /wa\.me\/51999999999/);
});

test('renders a friendly 404-style page when d is missing', () => {
  const handler = createReporteHandler({ businessWhatsappNumber: '51999999999' });
  const req = { method: 'GET', query: {} };
  const res = mockRes();
  handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.match(res.body, /no encontramos/i);
});

test('renders a friendly 404-style page when d does not decode', () => {
  const handler = createReporteHandler({ businessWhatsappNumber: '51999999999' });
  const req = { method: 'GET', query: { d: 'not-valid-data' } };
  const res = mockRes();
  handler(req, res);

  assert.equal(res.statusCode, 404);
  assert.match(res.body, /no encontramos/i);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test api/auditoria-gratuita/reporte.test.js`
Expected: FAIL — `Cannot find module './reporte'`.

- [ ] **Step 3: Write `reporte.js`**

```js
'use strict';

const { decodeReportData } = require('../../lib/auditoria-gratuita/report-codec');
const { renderReportHtml, escapeHtml } = require('../../lib/auditoria-gratuita/report-template');

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Auditoría no encontrada</title></head>
<body style="background:#0A0A0F;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px;">
<div><h1>No encontramos esta auditoría</h1><p><a href="/auditoria-gratuita" style="color:#A855F7;">Empezar una nueva auditoría gratuita</a></p></div>
</body></html>`;

function createReporteHandler(overrides) {
  const deps = Object.assign(
    { businessWhatsappNumber: process.env.BUSINESS_WHATSAPP_NUMBER },
    overrides,
  );

  return function handler(req, res) {
    const encoded = req.query && req.query.d;

    if (!encoded) {
      res.status(404);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(NOT_FOUND_HTML);
      return;
    }

    let payload;
    try {
      payload = decodeReportData(encoded);
    } catch (err) {
      res.status(404);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(NOT_FOUND_HTML);
      return;
    }

    const message = encodeURIComponent(
      `Hola, ya llené mi auditoría (${payload.name}) y quiero agendar mi reunión para adquirir el Sistema Más.`,
    );
    const whatsappUrl = `https://wa.me/${deps.businessWhatsappNumber}?text=${message}`;

    const html = renderReportHtml({
      name: payload.name,
      metrics: payload.metrics,
      report: payload.report,
      whatsappUrl,
    });

    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  };
}

module.exports = { createReporteHandler };
module.exports.default = createReporteHandler();
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test api/auditoria-gratuita/reporte.test.js`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add api/auditoria-gratuita/reporte.js api/auditoria-gratuita/reporte.test.js
git commit -m "Add /api/auditoria-gratuita/reporte endpoint"
```

---

### Task 11: Wire up the pretty URL via vercel.json

**Files:**
- Modify: `vercel.json` (repo root)

**Interfaces:** none (routing config only).

**Context:** Current `vercel.json` has one rewrite (`/` → `diagnostico-de-fuga/index.html`). This task adds one more, mapping the pretty report URL to the new function. Query strings pass through rewrites automatically — no special handling needed for `?d=...`.

- [ ] **Step 1: Read the current file and add the rewrite**

The file should end up looking like this (only the `rewrites` array gains a second entry):

```json
{
  "framework": null,
  "rewrites": [
    { "source": "/", "destination": "/diagnostico-de-fuga/index.html" },
    { "source": "/auditoria-gratuita/reporte", "destination": "/api/auditoria-gratuita/reporte" }
  ]
}
```

- [ ] **Step 2: Validate the JSON parses**

Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('ok')"`
Expected: prints `ok`, no syntax error.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "Route /auditoria-gratuita/reporte to the report API function"
```

---

### Task 12: Frontend quiz wizard in `auditoria-gratuita/index.html`

**Files:**
- Modify: `auditoria-gratuita/index.html`

**Interfaces:**
- Consumes: `POST /api/auditoria-gratuita/submit` (Task 9) — sends `{ name, whatsapp, email, answers }`, expects `{ reportUrl }` on success or `{ errors }` on 400.
- The question list embedded here **must stay in sync by hand** with `lib/auditoria-gratuita/questions.js` (Task 2) — there is no bundler in this repo to share one source file between the Node backend and the plain-`<script>` frontend. Both lists are short (≤16 items); if a question changes, update both files in the same commit.

**Context:** The existing file already has `<div id="auditoria"></div>` as the mount point (added when the hero shell was built) and a `#start-audit` button that currently just scrolls there. This task replaces the scroll-only handler with one that renders and drives the wizard, and mounts the wizard markup into that div.

- [ ] **Step 1: Add wizard CSS**

Add this block to the existing `<style>` section (anywhere after the other rules, e.g. right before the `@media (max-width:640px)` block):

```css
.quiz { max-width:560px; margin:0 auto; text-align:left; }
.quiz-progress { height:4px; background:#1a1a22; border-radius:2px; margin-bottom:28px; overflow:hidden; }
.quiz-progress-bar { height:100%; background:linear-gradient(90deg,#8B5CF6,#D946EF); transition:width .3s ease; }
.quiz-question { font-family:Sora,sans-serif; font-weight:700; font-size:19px; margin-bottom:20px; line-height:1.35; }
.quiz-options { display:flex; flex-direction:column; gap:10px; margin-bottom:24px; }
.quiz-option { display:block; width:100%; text-align:left; background:#111118; border:1px solid rgba(255,255,255,.08); color:#fff; padding:14px 18px; border-radius:12px; font-size:15px; cursor:pointer; font-family:inherit; }
.quiz-option:hover, .quiz-option.selected { border-color:#8B5CF6; background:rgba(139,92,246,.12); }
.quiz-scale { display:flex; gap:6px; margin-bottom:24px; flex-wrap:wrap; }
.quiz-scale button { flex:1; min-width:40px; padding:12px 0; border-radius:10px; border:1px solid rgba(255,255,255,.08); background:#111118; color:#fff; font-family:'Sora',sans-serif; font-weight:700; cursor:pointer; }
.quiz-scale button:hover, .quiz-scale button.selected { border-color:#8B5CF6; background:rgba(139,92,246,.12); }
.quiz-input { width:100%; background:#111118; border:1px solid rgba(255,255,255,.08); color:#fff; padding:14px 18px; border-radius:12px; font-size:15px; margin-bottom:20px; font-family:inherit; }
.quiz-nav { display:flex; justify-content:space-between; align-items:center; gap:12px; }
.quiz-back { color:#71717A; background:none; border:none; font-size:14px; cursor:pointer; font-family:inherit; }
.quiz-next { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#8B5CF6,#D946EF); color:#fff; padding:14px 28px; border-radius:12px; font-weight:600; font-size:15px; border:none; cursor:pointer; font-family:inherit; }
.quiz-next:disabled { opacity:.4; cursor:not-allowed; }
.quiz-error { color:#F87171; font-size:13.5px; margin-top:12px; }
.quiz-loading { text-align:center; padding:40px 0; color:#A1A1AA; }
</style>
```

(Note: `</style>` already exists at the end of the current block — add the new rules just before it, don't add a second `<style>`/`</style>` pair.)

- [ ] **Step 2: Replace the placeholder div and the click handler**

Find:

```html
  <div id="auditoria"></div>
```

Replace with:

```html
  <div id="auditoria" class="quiz"></div>
```

Find the existing `<script>` block's `start-audit` handler:

```html
  document.getElementById('start-audit').addEventListener('click', function () {
    var target = document.getElementById('auditoria');
    if (target) target.scrollIntoView({ behavior:'smooth', block:'start' });
  });
```

Replace with:

```html
  document.getElementById('start-audit').addEventListener('click', function () {
    var target = document.getElementById('auditoria');
    if (target) target.scrollIntoView({ behavior:'smooth', block:'start' });
    startQuiz();
  });
```

- [ ] **Step 3: Add the quiz engine script, right before the closing `</body>`**

```html
<script>
(function () {
  var QUESTIONS = [
    { id: 'clientes_mes', type: 'number', min: 0, prompt: '¿Cuántos clientes atiendes o cierras al mes?' },
    { id: 'ticket_promedio', type: 'number', min: 0, prompt: '¿Cuál es tu ticket promedio por venta/cliente? (S/)' },
    { id: 'canal_adquisicion', type: 'choice', options: [
      { value: 'redes_organico', label: 'Redes sociales (orgánico)' },
      { value: 'recomendaciones', label: 'Recomendaciones' },
      { value: 'publicidad_paga', label: 'Publicidad paga' },
      { value: 'no_lo_se', label: 'No tengo claro de dónde vienen' },
    ], prompt: '¿De dónde viene la mayoría de tus clientes nuevos?' },
    { id: 'leads_mes', type: 'number_or_unknown', min: 0, prompt: '¿Cuántos leads o contactos nuevos te escribieron el mes pasado?' },
    { id: 'tiempo_respuesta', type: 'choice', options: [
      { value: 'minutos', label: 'En minutos' },
      { value: 'mismo_dia', label: 'El mismo día' },
      { value: 'dia_siguiente', label: 'Al día siguiente' },
      { value: 'a_veces_mas_de_un_dia', label: 'A veces se me pasa más de un día' },
    ], prompt: 'Cuando alguien te escribe, ¿en cuánto tiempo respondes en promedio?' },
    { id: 'tasa_cierre', type: 'scale10', prompt: 'De cada 10 que preguntan, ¿cuántos terminan comprando?' },
    { id: 'hace_seguimiento', type: 'choice', options: [
      { value: 'tengo_proceso', label: 'Tengo un proceso de seguimiento' },
      { value: 'a_veces', label: 'A veces, si me acuerdo' },
      { value: 'casi_nunca', label: 'Casi nunca vuelvo a escribirle' },
    ], prompt: 'Cuando alguien muestra interés pero no compra al toque, ¿le haces seguimiento?' },
    { id: 'tasa_seguimiento', type: 'scale10', prompt: 'De esos que no compran al toque, ¿a cuántos de cada 10 les vuelves a escribir después?' },
    { id: 'tipo_entrega', type: 'choice', options: [
      { value: 'producto', label: 'Producto' },
      { value: 'servicio', label: 'Servicio' },
      { value: 'ambos', label: 'Ambos' },
    ], prompt: '¿Tu negocio entrega principalmente un producto, un servicio, o ambos?' },
    { id: 'tasa_asistencia', type: 'scale10', prompt: 'De cada 10 citas o reservas que agendas, ¿cuántas se presentan realmente?', showIf: function (a) { return a.tipo_entrega === 'servicio' || a.tipo_entrega === 'ambos'; } },
    { id: 'tiene_recordatorio', type: 'choice', options: [
      { value: 'automatico', label: 'Sí, automático' },
      { value: 'manual_a_veces', label: 'Lo hago manual a veces' },
      { value: 'nada', label: 'No tengo nada' },
    ], prompt: '¿Tienes algo automático que le recuerde o confirme la cita al cliente antes del día?', showIf: function (a) { return a.tipo_entrega === 'servicio' || a.tipo_entrega === 'ambos'; } },
    { id: 'tasa_upsell', type: 'scale10', prompt: 'De cada 10 clientes que te compran, ¿a cuántos les ofreces o vendes algo adicional en el momento?', showIf: function (a) { return a.tipo_entrega === 'producto' || a.tipo_entrega === 'ambos'; } },
    { id: 'precio_adicional', type: 'number', min: 0, prompt: '¿Cuál es el precio promedio de ese producto o combo adicional? (S/)', showIf: function (a) { return a.tipo_entrega === 'producto' || a.tipo_entrega === 'ambos'; } },
    { id: 'tiene_sistema_upsell', type: 'choice', options: [
      { value: 'automatico', label: 'Sí, automático' },
      { value: 'depende_persona', label: 'Depende de la persona que atienda' },
      { value: 'nada', label: 'No tengo nada' },
    ], prompt: '¿Tienes algún sistema automático para ofrecer eso?', showIf: function (a) { return a.tipo_entrega === 'producto' || a.tipo_entrega === 'ambos'; } },
    { id: 'tasa_recompra', type: 'scale10', prompt: 'De cada 10 clientes que ya te compraron, ¿cuántos vuelven a comprarte?' },
    { id: 'tiene_reactivacion', type: 'choice', options: [
      { value: 'automatico', label: 'Sí, algo automático' },
      { value: 'manual_a_veces', label: 'Lo hago manual a veces' },
      { value: 'nada', label: 'No tengo nada, se van y ya' },
    ], prompt: '¿Tienes algo para traer de vuelta a los clientes que dejaron de comprarte?' },
  ];

  var state = { step: 0, answers: {} };
  var mount = null;

  function visibleQuestions() {
    return QUESTIONS.filter(function (q) {
      return typeof q.showIf !== 'function' || q.showIf(state.answers);
    });
  }

  function render() {
    var visible = visibleQuestions();
    var total = visible.length + 1; // +1 for the contact screen
    var pct = Math.round((state.step / total) * 100);

    var html = '<div class="quiz-progress"><div class="quiz-progress-bar" style="width:' + pct + '%"></div></div>';

    if (state.step < visible.length) {
      var q = visible[state.step];
      html += '<div class="quiz-question">' + q.prompt + '</div>';

      if (q.type === 'choice') {
        html += '<div class="quiz-options">' + q.options.map(function (opt) {
          var sel = state.answers[q.id] === opt.value ? ' selected' : '';
          return '<button class="quiz-option' + sel + '" data-value="' + opt.value + '">' + opt.label + '</button>';
        }).join('') + '</div>';
      } else if (q.type === 'scale10') {
        html += '<div class="quiz-scale">' + Array.from({ length: 11 }, function (_, n) { return n; }).map(function (n) {
          var sel = state.answers[q.id] === n ? ' selected' : '';
          return '<button class="' + sel.trim() + '" data-value="' + n + '">' + n + '</button>';
        }).join('') + '</div>';
      } else if (q.type === 'number' || q.type === 'number_or_unknown') {
        var current = state.answers[q.id];
        var val = (current === null || current === undefined) ? '' : current;
        html += '<input class="quiz-input" type="number" min="0" id="quiz-number-input" value="' + val + '" placeholder="Escribe un número">';
        if (q.type === 'number_or_unknown') {
          var noSeSel = state.answers[q.id] === null ? ' selected' : '';
          html += '<div class="quiz-options"><button class="quiz-option' + noSeSel + '" data-value="__unknown__">No lo sé</button></div>';
        }
      }

      html += '<div class="quiz-nav">';
      html += state.step > 0 ? '<button class="quiz-back" id="quiz-back">← Atrás</button>' : '<span></span>';
      html += '<button class="quiz-next" id="quiz-next" disabled>Siguiente →</button>';
      html += '</div><div class="quiz-error" id="quiz-error"></div>';
    } else {
      html += '<div class="quiz-question">Casi listo — ¿a dónde te envío tu auditoría?</div>';
      html += '<input class="quiz-input" type="text" id="quiz-name" placeholder="Tu nombre" value="' + (state.contactName || '') + '">';
      html += '<input class="quiz-input" type="text" id="quiz-whatsapp" placeholder="Tu WhatsApp (con código de país)" value="' + (state.contactWhatsapp || '') + '">';
      html += '<input class="quiz-input" type="email" id="quiz-email" placeholder="Tu email" value="' + (state.contactEmail || '') + '">';
      html += '<div class="quiz-nav"><button class="quiz-back" id="quiz-back">← Atrás</button><button class="quiz-next" id="quiz-submit">Ver mi auditoría →</button></div>';
      html += '<div class="quiz-error" id="quiz-error"></div>';
    }

    mount.innerHTML = html;
    wireEvents(visible);
  }

  function wireEvents(visible) {
    var backBtn = document.getElementById('quiz-back');
    if (backBtn) backBtn.addEventListener('click', function () { state.step -= 1; render(); });

    if (state.step < visible.length) {
      var q = visible[state.step];
      var nextBtn = document.getElementById('quiz-next');

      if (q.type === 'choice') {
        document.querySelectorAll('.quiz-option').forEach(function (btn) {
          btn.addEventListener('click', function () {
            state.answers[q.id] = btn.getAttribute('data-value');
            render();
          });
        });
        nextBtn.disabled = state.answers[q.id] === undefined;
      } else if (q.type === 'scale10') {
        document.querySelectorAll('.quiz-scale button').forEach(function (btn) {
          btn.addEventListener('click', function () {
            state.answers[q.id] = Number(btn.getAttribute('data-value'));
            render();
          });
        });
        nextBtn.disabled = state.answers[q.id] === undefined;
      } else if (q.type === 'number' || q.type === 'number_or_unknown') {
        var input = document.getElementById('quiz-number-input');
        input.addEventListener('input', function () {
          state.answers[q.id] = input.value === '' ? undefined : Number(input.value);
          nextBtn.disabled = state.answers[q.id] === undefined || isNaN(state.answers[q.id]);
        });
        var unknownBtn = document.querySelector('.quiz-option[data-value="__unknown__"]');
        if (unknownBtn) {
          unknownBtn.addEventListener('click', function () {
            state.answers[q.id] = null;
            render();
          });
        }
        nextBtn.disabled = state.answers[q.id] === undefined;
      }

      nextBtn.addEventListener('click', function () {
        state.step += 1;
        render();
      });
    } else {
      document.getElementById('quiz-submit').addEventListener('click', submitQuiz);
    }
  }

  function submitQuiz() {
    var name = document.getElementById('quiz-name').value.trim();
    var whatsapp = document.getElementById('quiz-whatsapp').value.trim();
    var email = document.getElementById('quiz-email').value.trim();
    var errorEl = document.getElementById('quiz-error');

    if (!name || !whatsapp || !email) {
      errorEl.textContent = 'Completa los tres campos para continuar.';
      return;
    }

    state.contactName = name;
    state.contactWhatsapp = whatsapp;
    state.contactEmail = email;
    errorEl.textContent = '';
    mount.innerHTML = '<div class="quiz-loading">Analizando tus respuestas…</div>';

    fetch('/api/auditoria-gratuita/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, whatsapp: whatsapp, email: email, answers: state.answers }),
    })
      .then(function (res) { return res.json().then(function (body) { return { status: res.status, body: body }; }); })
      .then(function (result) {
        if (result.status !== 200) {
          mount.innerHTML = '';
          render();
          document.getElementById('quiz-error').textContent = (result.body.errors || ['Algo salió mal, intenta de nuevo.']).join(' ');
          return;
        }
        window.location.href = result.body.reportUrl;
      })
      .catch(function () {
        mount.innerHTML = '';
        render();
        document.getElementById('quiz-error').textContent = 'No pudimos conectar con el servidor. Intenta de nuevo.';
      });
  }

  window.startQuiz = function () {
    mount = document.getElementById('auditoria');
    if (!mount || mount.dataset.started) return;
    mount.dataset.started = 'true';
    state = { step: 0, answers: {} };
    render();
  };
})();
</script>
```

- [ ] **Step 4: Manual verification in a browser (this file has no automated frontend test suite)**

Start a static server and click through the wizard end-to-end:

```bash
npx --yes serve -l 4173 .
```

Then, using the browser tool available in this session, navigate to `http://localhost:4173/auditoria-gratuita/`, click "Empezar mi auditoría gratuita", and step through:
- Answer `tipo_entrega` as "Ambos" and confirm both `tasa_asistencia` and `tasa_upsell` questions appear later (branching works).
- Answer `leads_mes` via the "No lo sé" button and confirm it advances without requiring a number.
- Reach the contact screen, fill it in, and submit — expect a network error shown in `#quiz-error` (there is no `/api` route on this static server), which confirms the fetch wiring and error path work; the actual 200 path is exercised once this is deployed to Vercel (Task 13).
- Check the browser console for JavaScript errors (there should be none).

Stop the server when done.

- [ ] **Step 5: Confirm `git status` shows only this landing's file changed**

Run: `git status --short`
Expected: only `auditoria-gratuita/index.html` modified — nothing under `diagnostico-de-fuga/`.

- [ ] **Step 6: Commit**

```bash
git add auditoria-gratuita/index.html
git commit -m "Add quiz wizard UI to auditoria-gratuita landing"
```

---

### Task 13: Deploy and verify end-to-end on Vercel

**Files:** none created — this is a deployment + manual verification task.

**Interfaces:** none.

**Context:** Tasks 1–12 are code-complete and unit-tested locally, but the real Claude/Resend/YCloud calls have only been exercised through fakes. This task deploys to a **preview** first (never straight to production) and manually verifies the full flow, then promotes.

- [ ] **Step 1: Run the full test suite one more time**

Run: `npm test`
Expected: every test file under `lib/` and `api/` passes (the `test` script only covers `lib/`; also explicitly run `node --test api/auditoria-gratuita/`).

Run: `node --test api/auditoria-gratuita/`
Expected: all passing.

- [ ] **Step 2: Set the required environment variables in Vercel** (manual, via Vercel dashboard or `vercel env add`)

`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `YCLOUD_API_KEY`, `YCLOUD_TEMPLATE_NAME`, `BUSINESS_WHATSAPP_NUMBER`, `SITE_URL` (`https://growmas.io`). These are prerequisites — Resend needs the `growmas.io` sending domain verified, and YCloud needs the outbound template approved (per spec §9); until then, email works and WhatsApp silently no-ops (by design, Task 8).

- [ ] **Step 3: Deploy to preview**

```bash
vercel
```

- [ ] **Step 4: Manually exercise the flow against the preview URL**

Since preview deployments are SSO-protected for this team (established in an earlier session), promote to production directly after the local test suite passes and a quick visual check of the landing loads correctly — the same pattern already used for the two prior landing changes in this project. Before promoting, at minimum confirm via `vercel logs` or the Vercel dashboard function logs after one real test submission that `/api/auditoria-gratuita/submit` returns 200 and `/api/auditoria-gratuita/reporte` renders.

- [ ] **Step 5: Promote to production**

```bash
vercel --prod
```

- [ ] **Step 6: Verify in production with a real browser session**

Using the browser tool available in this session:
- Navigate to `https://www.growmas.io/auditoria-gratuita`, complete the quiz with realistic answers, submit, and confirm it redirects to a `/auditoria-gratuita/reporte?d=...` URL showing a rendered report with a total, at least one stage card, and a working WhatsApp CTA link.
- Navigate to `https://www.growmas.io/` and confirm Diagnóstico de Fuga still renders unchanged.
- Check the browser console on both pages for errors.

- [ ] **Step 7: Report status to the user**

Summarize: what's live, what still depends on the user's own setup (Resend domain verification, YCloud template approval) before those channels are fully active, and that `diagnostico-de-fuga/` was not touched (confirmed via `git log --stat` for this session's commits).
