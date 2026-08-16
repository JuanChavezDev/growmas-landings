import type { Metadata } from 'next'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  MessageSquareText,
  Repeat2,
  TrendingUp,
  UserPlus,
} from 'lucide-react'
import { siteConfig } from '@/lib/seo/site-config'
import { ChatMockup } from '@/components/chat-mockup'
import { CycleDiagram } from '@/components/cycle-diagram'
import { HeroWaves } from '@/components/hero-waves'
import { PipelineMockup } from '@/components/pipeline-mockup'
import { RadarIcon } from '@/components/radar-icon'

export const metadata: Metadata = {
  title: siteConfig.slogan,
  description: siteConfig.description,
}

const services = [
  {
    slug: 'captacion',
    name: 'Sistema de Captación',
    description: 'Convierte más personas en oportunidades.',
    icon: UserPlus,
  },
  {
    slug: 'atencion',
    name: 'Sistema de Atención',
    description: 'Responde rápido y mejora la experiencia de tus clientes.',
    icon: MessageSquareText,
  },
  {
    slug: 'seguimiento',
    name: 'Sistema de Seguimiento',
    description: 'Evita perder oportunidades por falta de seguimiento.',
    icon: Repeat2,
  },
  {
    slug: 'fidelizacion',
    name: 'Sistema de Fidelización',
    description: 'Haz que tus clientes regresen una y otra vez.',
    icon: TrendingUp,
  },
]

const painPoints = [
  'Clientes que no reciben respuesta.',
  'Seguimientos que nunca se hacen.',
  'Procesos manuales.',
  'Oportunidades que se pierden.',
]

const reasons = [
  'Diseñamos estrategias, no solo herramientas.',
  'Implementamos sistemas adaptados a tu negocio.',
  'Te acompañamos en la optimización continua.',
  'Tú eres el propietario de tus sistemas y de tus datos.',
  'Nos enfocamos en el crecimiento de tu negocio.',
]

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
        <HeroWaves />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 animate-[glow-pulse_7s_ease-in-out_infinite] rounded-full bg-violeta/15 blur-[140px]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-magenta">
              La mayoría de negocios solo piensa en cómo atraer más gente.
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.1] sm:text-5xl">
              Haz crecer tu negocio con <span className="text-gradient">sistemas inteligentes</span> en
              cada etapa de tu Ciclo de Valor.
            </h1>
            <p className="mt-6 text-lg text-niebla">
              La mayoría solo se enfoca en traer más tráfico. Nosotros trabajamos justo donde más
              dinero se pierde: desde que el lead llega, en Conversión, Operación, Relación y
              Crecimiento.
            </p>
            <Link
              href="/mas-pacientes"
              className="mt-8 inline-block rounded-md bg-brand-gradient px-8 py-4 font-medium text-onix shadow-[0_0_30px_rgba(180,92,255,0.35)] transition hover:shadow-[0_0_45px_rgba(180,92,255,0.55)]"
            >
              Agenda una Auditoría Grow+
            </Link>
          </div>

          <div className="relative mx-auto flex h-[300px] w-[300px] items-center justify-center sm:h-[360px] sm:w-[420px]">
            <CycleDiagram />
            <div className="absolute -left-4 top-0 hidden animate-[float-card_5s_ease-in-out_infinite] rounded-xl border border-berenjena bg-noche/90 px-4 py-3 shadow-lg backdrop-blur sm:block">
              <p className="text-xs text-niebla">Sistema activo</p>
              <p className="text-sm font-semibold text-hueso">Respuesta en minutos</p>
            </div>
            <div className="absolute -bottom-8 left-1/2 hidden -translate-x-1/2 animate-[float-card_6s_ease-in-out_1s_infinite] rounded-xl border border-berenjena bg-noche/90 px-4 py-3 shadow-lg backdrop-blur sm:block">
              <p className="text-xs text-niebla">Seguimiento</p>
              <p className="text-sm font-semibold text-hueso">0 oportunidades perdidas</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-berenjena/60 bg-noche/60 px-6 py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-3xl font-bold">
              Tu negocio no necesita más herramientas.
              <br />
              Necesita un sistema.
            </h2>
            <p className="mt-4 max-w-2xl text-niebla">
              La mayoría de negocios pierde oportunidades todos los días porque sus procesos no
              están preparados para crecer:
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {painPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-lg border border-berenjena bg-onix/60 p-4"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-magenta" />
                  <span className="text-hueso">{point}</span>
                </div>
              ))}
            </div>
            <p className="mt-8 text-lg text-hueso">
              En {siteConfig.name} diseñamos sistemas para resolver esos problemas.
            </p>
          </div>
          <div className="flex justify-center">
            <ChatMockup />
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold">
            No vendemos tecnología.
            <br />
            Creamos sistemas que ayudan a tu negocio a crecer.
          </h2>
          <div className="mt-10">
            <PipelineMockup />
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/servicios/${service.slug}`}
                className="group block overflow-hidden rounded-xl border border-berenjena bg-noche/50 bg-dot-grid p-6 transition hover:border-violeta hover:bg-noche"
              >
                <RadarIcon icon={service.icon} />
                <h3 className="mt-4 text-lg font-semibold text-hueso">{service.name}</h3>
                <p className="mt-2 text-niebla">{service.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-berenjena/60 bg-noche/60 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold">
            No hacemos que lleguen más personas.
            <br />
            Hacemos que las que ya llegan no se pierdan.
          </h2>
          <p className="mt-4 text-lg text-niebla">
            Tu Ciclo de Valor tiene 5 etapas: Atracción, Conversión, Operación, Relación y
            Crecimiento. Nuestro trabajo empieza justo cuando el lead llega: ahí diseñamos los
            sistemas inteligentes que evitan que se pierda, etapa por etapa, hasta que se convierte
            en un cliente que vuelve. Esa es la metodología <strong className="text-hueso">Sistema MAS</strong>.
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold">¿Por qué {siteConfig.name}?</h2>
          <ul className="mt-8 space-y-4">
            {reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violeta" />
                <span className="text-hueso">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-berenjena px-6 py-24">
        <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 animate-[glow-pulse_8s_ease-in-out_infinite] rounded-full bg-magenta/10 blur-[140px]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">
            Descubre dónde está el siguiente nivel de crecimiento de tu negocio.
          </h2>
          <p className="mt-4 text-niebla">
            Agenda una Auditoría Grow+ y conoce cómo el Sistema MAS puede ayudarte a crecer de forma
            más inteligente.
          </p>
          <Link
            href="/mas-pacientes"
            className="mt-8 inline-block rounded-md bg-brand-gradient px-8 py-4 font-medium text-onix shadow-[0_0_30px_rgba(180,92,255,0.35)] transition hover:shadow-[0_0_45px_rgba(180,92,255,0.55)]"
          >
            Quiero mi Auditoría Grow+
          </Link>
        </div>
      </section>
    </main>
  )
}
