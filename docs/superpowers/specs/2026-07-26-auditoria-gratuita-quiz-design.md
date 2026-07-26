# Diseño: Módulo de auditoría — `auditoria-gratuita`

**Fecha:** 2026-07-26
**Landing:** `growmas.io/auditoria-gratuita` (ver `auditoria-gratuita/index.html`, ya en producción)
**Estado:** diseño aprobado por el usuario, pendiente de plan de implementación

## 1. Objetivo

La landing ya construida (hero + ciclo de 5 etapas) termina en un botón "Empezar mi auditoría gratuita". Este documento diseña lo que pasa al hacer clic:

1. El lead responde un cuestionario fijo de 13-14 preguntas (según ramificación).
2. Deja nombre, WhatsApp y email.
3. El sistema calcula una pérdida estimada en soles por etapa (fórmula, no IA) y genera un texto profesional y corto alrededor de esos números (IA).
4. El lead recibe un link a su reporte personalizado por email (siempre) y por WhatsApp (si la plantilla de YCloud ya está aprobada) — el mensaje de WhatsApp lo manda el sistema al WhatsApp del propio lead, con el link.
5. El reporte (`growmas.io/auditoria-gratuita/reporte?d=<datos codificados>`) termina con un botón que abre WhatsApp con un mensaje para agendar la llamada — directo al WhatsApp de negocio de Juan, nunca a otra landing.

**Sin base de datos (decisión 2026-07-26):** no se usa Supabase ni ningún otro almacenamiento server-side. El reporte se calcula una sola vez al enviar el formulario y sus datos (números + texto de la IA) se codifican directamente en la URL del reporte — la página del reporte solo decodifica y renderiza, no consulta nada. El registro de "a quién se le envió" lo lleva Juan por sus propios medios (historial de WhatsApp e email), no el sistema.

## 2. Decisiones ya tomadas (no reabrir sin razón)

- **Intake = cuestionario fijo**, no un agente de IA abierto. Evita que el lead se desvíe o nunca termine.
- La IA (Claude API) **solo redacta texto** alrededor de números ya calculados por fórmula — nunca inventa cifras.
- Mismas preguntas para todo tipo de negocio (no se ramifica por rubro), excepto la ramificación local Producto/Servicio/Ambos dentro de Entrega.
- Las preguntas de Entrega miden **solo lo que Growmas puede resolver con marketing/automatización** (no-shows, upsell no capturado) — nunca la operación física del negocio.
- El compromiso comercial (mínimo 3 meses, precio) **no va en el reporte**, se maneja en la llamada de venta.
- Backend en **funciones serverless del mismo proyecto de Vercel** (no n8n, no Make) — pipeline corto y determinístico.
- Reporte es una **página web**, no un PDF adjunto — mejor fidelidad visual, compartible por link, CTA nativo.
- El botón final del reporte va **directo a WhatsApp**, no a otra landing (`sistema-mas` es un proyecto separado, futuro, no relacionado).
- Un solo proyecto de Vercel sirve todas las landings — nada de esto crea un proyecto nuevo.

## 3. Cuestionario (fuente de verdad)

Cada pregunta tiene un `id` estable usado como key en el JSON de respuestas.

| id | Etapa | Pregunta | Tipo | Opciones / rango |
|---|---|---|---|---|
| `clientes_mes` | Base | ¿Cuántos clientes atiendes o cierras al mes? | número | entero ≥0 |
| `ticket_promedio` | Base | ¿Cuál es tu ticket promedio por venta/cliente? | número (S/) | ≥0 |
| `canal_adquisicion` | Adquisición | ¿De dónde viene la mayoría de tus clientes nuevos? | choice | redes_organico / recomendaciones / publicidad_paga / no_lo_se |
| `leads_mes` | Adquisición | ¿Cuántos leads o contactos nuevos te escribieron el mes pasado? | número o null | entero ≥0, o "no lo sé" → null |
| `tiempo_respuesta` | Ventas | ¿En cuánto tiempo respondes en promedio? | choice | minutos / mismo_dia / dia_siguiente / a_veces_mas_de_un_dia |
| `tasa_cierre` | Ventas | De cada 10 que preguntan, ¿cuántos compran? | número 0-10 | 0..10 |
| `hace_seguimiento` | Cierre | Si no compran al toque, ¿le haces seguimiento? | choice | tengo_proceso / a_veces / casi_nunca |
| `tasa_seguimiento` | Cierre | De esos que no compran al toque, ¿a cuántos de cada 10 les vuelves a escribir? | número 0-10 | 0..10 |
| `tipo_entrega` | Entrega | ¿Producto, servicio, o ambos? | choice | producto / servicio / ambos |
| `tasa_asistencia` | Entrega (si servicio) | De cada 10 citas, ¿cuántas se presentan? | número 0-10 | 0..10, solo si `tipo_entrega` ∈ {servicio, ambos} |
| `tiene_recordatorio` | Entrega (si servicio) | ¿Recordatorio automático de cita? | choice | automatico / manual_a_veces / nada — solo si servicio/ambos |
| `tasa_upsell` | Entrega (si producto) | De cada 10 que compran, ¿a cuántos les ofreces algo más? | número 0-10 | 0..10, solo si producto/ambos |
| `precio_adicional` | Entrega (si producto) | Precio promedio de ese producto/combo adicional | número (S/) | ≥0, solo si producto/ambos |
| `tiene_sistema_upsell` | Entrega (si producto) | ¿Sistema automático para ofrecer eso? | choice | automatico / depende_persona / nada — solo si producto/ambos |
| `tasa_recompra` | Fidelización | De cada 10 clientes que ya compraron, ¿cuántos vuelven? | número 0-10 | 0..10 |
| `tiene_reactivacion` | Fidelización | ¿Algo para traer de vuelta a los que dejaron de comprar? | choice | automatico / manual_a_veces / nada |

Total: 13 preguntas si `tipo_entrega` es producto o servicio solamente; 15 si es "ambos" (se muestran las dos ramas de Entrega).

## 4. Cálculo de pérdida (fórmula, no IA)

Todas las fórmulas usan `ticket_promedio` y `clientes_mes` como base. Las constantes marcadas `(config)` son supuestos razonables, ajustables sin tocar la lógica — viven en un objeto de configuración al inicio del archivo de cálculo, no hardcodeadas dispersas.

```
tasa_recuperacion_realista = 0.30   (config) — % de la brecha que es realista recuperar con un sistema
tasa_conversion_seguimiento = 0.25  (config) — % de leads con seguimiento que sí terminan comprando
```

**Ventas** — leads que preguntan y no compran:
```
leads_perdidos = leads_mes * (10 - tasa_cierre) / 10        (si leads_mes es null, omitir esta etapa del cálculo numérico y narrar solo cualitativamente)
dinero_que_se_va_ventas = leads_perdidos * ticket_promedio
recuperable_ventas = dinero_que_se_va_ventas * tasa_recuperacion_realista
```

**Cierre** — de los que no compran al toque, los que además no reciben seguimiento:
```
sin_seguimiento = leads_perdidos * (10 - tasa_seguimiento) / 10
recuperable_cierre = sin_seguimiento * ticket_promedio * tasa_conversion_seguimiento
```

**Entrega — rama servicio** (no-shows):
```
dinero_que_se_va_entrega = clientes_mes * (10 - tasa_asistencia) / 10 * ticket_promedio
recuperable_entrega = dinero_que_se_va_entrega * tasa_recuperacion_realista
```

**Entrega — rama producto** (upsell no capturado):
```
dinero_que_se_va_entrega = clientes_mes * (10 - tasa_upsell) / 10 * precio_adicional
recuperable_entrega = dinero_que_se_va_entrega * tasa_recuperacion_realista
```
(si `tipo_entrega` = "ambos", sumar ambas ramas)

**Fidelización** — clientes que no vuelven:
```
no_vuelven = clientes_mes * (10 - tasa_recompra) / 10
dinero_que_se_va_fidelizacion = no_vuelven * ticket_promedio
recuperable_fidelizacion = dinero_que_se_va_fidelizacion * tasa_recuperacion_realista
```

**Adquisición**: no se calcula un número — no hay una fórmula creíble sin inventar datos. Se trata narrativamente (ej. "no tienes visibilidad de cuántos leads te llegan" si `leads_mes` es null).

**Total mensual recuperable** = suma de `recuperable_*` de las etapas calculables.
**Total anual** = total mensual × 12 (se muestra como cifra de impacto mayor, común en este tipo de reportes).

Todos los números se calculan en el servidor antes de llamar a la IA; la IA los recibe ya resueltos, no los recalcula.

## 5. Arquitectura

```
Landing (auditoria-gratuita/index.html)
  → clic en CTA → abre el módulo de cuestionario (mismo archivo, ver #7)
  → responde 13-15 preguntas (estado en memoria del navegador, sin llamadas al servidor)
  → pantalla final: nombre + WhatsApp + email
  → POST /api/auditoria-gratuita/submit
        1. valida input
        2. calcula métricas (fórmulas de la sección 4)
        3. llama a Claude API → texto narrativo por etapa + intro + cierre
        4. codifica { name, metrics, report } → gzip → base64url → query param `d`
        5. envía email con Resend al lead (link al reporte)
        6. intenta enviar plantilla de WhatsApp vía YCloud al lead (no bloqueante)
        7. responde { reportUrl }
  → navegador redirige a reportUrl
GET /auditoria-gratuita/reporte?d=<datos codificados>  (rewrite → /api/auditoria-gratuita/reporte)
  → decodifica el query param `d` (gzip+base64url → JSON)
  → renderiza la página del reporte con el mismo branding de la landing
  → CTA final → wa.me al número de negocio de Juan
```

No hay base de datos ni almacenamiento server-side. El reporte es puro cómputo: se genera una vez en `submit`, se codifica en la URL, y `reporte` solo decodifica y pinta HTML — es una función pura sobre el contenido de la URL, no hay estado que pueda desincronizarse ni tabla que mantener.

**Nota de seguridad aceptada:** los datos del reporte no llevan firma/HMAC, así que alguien con conocimientos técnicos podría en teoría fabricar una URL con números falsos. Se acepta este riesgo para la v1: el reporte no dispara ninguna acción sensible (no es un pago, no otorga acceso a nada), es contenido de marketing. Si más adelante se necesita, agregar una firma HMAC sobre el payload es un cambio pequeño y aislado.

## 7. Dónde vive el cuestionario en la landing

El cuestionario se agrega **dentro de `auditoria-gratuita/index.html`**, como una sección/modal que hoy es el placeholder `<div id="auditoria"></div>`. Es JavaScript vanilla (mismo patrón que el resto del archivo, sin frameworks), con:
- Estado del wizard en una variable JS (paso actual, respuestas acumuladas).
- Una pregunta visible a la vez, barra de progreso simple.
- Validación básica en el cliente (número ≥0, campo no vacío) antes de avanzar.
- Al llegar a la pantalla de contacto (nombre/WhatsApp/email) y enviar: `fetch('/api/auditoria-gratuita/submit', ...)`, loading state, luego `window.location.href = reportUrl`.

## 8. Prompt de la IA (Claude API)

Input al modelo: JSON con `answers`, `metrics` ya calculados, y el nombre del lead. Instrucción explícita:
- Redactar en español, tono profesional pero directo, cercano — no corporativo genérico.
- **Nunca inventar ni ajustar números** — usar exactamente los valores de `metrics` que se le pasan.
- No mostrar las respuestas crudas del lead, sintetizar.
- No mencionar precios, planes ni compromiso mínimo (eso es de la llamada, no del reporte — decisión ya tomada).
- Salida esperada: JSON con `intro` (1 párrafo), `secciones` (una por etapa con hallazgo calculable, 2-4 líneas cada una), `cierre` (1 párrafo que conecta con el botón de WhatsApp).
- Longitud total corta — el usuario pidió explícitamente que no sea un reporte de 50 páginas.

**Fallback si la IA falla o se cae la conexión:** reintento único, y si vuelve a fallar, se usa una plantilla de texto fija por etapa (con los números insertados) para que el lead nunca vea un error — se pierde algo de personalización, no la entrega del reporte.

## 9. Email (Resend) y WhatsApp (YCloud)

- **Email:** siempre se intenta enviar tras calcular el reporte. Asunto tipo "Tu auditoría está lista, {{name}}". Cuerpo corto con el link al reporte. Requiere dominio `growmas.io` verificado en Resend para buena entregabilidad.
- **WhatsApp:** el sistema le manda el link **al WhatsApp del lead** (no al de Juan) usando una plantilla de YCloud ya aprobada (ej. "Hola {{1}}, tu Auditoría de Sistema Más ya está lista: {{2}}") sobre el número real de negocio de Juan, con coexistencia. Si la plantilla no existe o la llamada falla, simplemente no se envía y se loguea — el email es el canal garantizado, nunca bloquea la respuesta al lead.
- No hay tabla ni registro de qué se envió a quién — eso lo lleva Juan por su cuenta (historial de WhatsApp Business y de su herramienta de email).

## 10. Manejo de errores

- Fallo de Claude → reintento único → fallback a plantilla fija (sección 8).
- Fallo de email → se loguea, no bloquea la respuesta; el lead ya ve su reporte en el navegador de todas formas.
- Fallo de WhatsApp (o plantilla no configurada) → no bloquea, se loguea y sigue.
- `/auditoria-gratuita/reporte` sin el query param `d`, o con un valor que no decodifica a JSON válido → página amigable ("no encontramos esta auditoría") con link para empezar una nueva, no un error crudo.

## 11. Variables de entorno (Vercel, nunca en el repo)

`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `YCLOUD_API_KEY`, `YCLOUD_WHATSAPP_NUMBER`, `YCLOUD_TEMPLATE_NAME`, `BUSINESS_WHATSAPP_NUMBER` (el número de Juan para el CTA final del reporte).

## 12. Fuera de alcance (explícitamente descartado)

- Preguntas distintas por rubro de negocio.
- Un agente de IA conversacional abierto para la intake.
- PDF adjunto (se reemplazó por página web con link).
- Mostrar condiciones comerciales (precio, mínimo de meses) en el reporte.
- n8n o Make.com como orquestador de este flujo.
- **Base de datos de cualquier tipo** (Supabase u otro) — decisión 2026-07-26, el reporte vive codificado en la URL.
- Reutilizar los proyectos Supabase existentes (`whatsapp-saas`, `fidelizacion-app`) para esto — son de otros propósitos.
- Cualquier cambio a `diagnostico-de-fuga/` — este trabajo no la toca.
