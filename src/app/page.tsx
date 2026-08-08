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
        <p className="mt-4 text-lg text-niebla">
          Diseñamos e implementamos sistemas inteligentes que ayudan a los negocios de servicios a
          atraer más oportunidades, mejorar la atención y aumentar el valor de cada cliente.
        </p>
        <Link
          href="/auditoria-gratuita"
          className="mt-6 inline-block rounded-md bg-brand-gradient px-6 py-3 font-medium text-onix"
        >
          Agenda una Auditoría Grow+
        </Link>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-bold">
          Tu negocio no necesita más herramientas. Necesita un sistema.
        </h2>
        <p className="mt-4 text-niebla">
          La mayoría de negocios pierde oportunidades todos los días porque sus procesos no están
          preparados para crecer:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-niebla">
          <li>Clientes que no reciben respuesta.</li>
          <li>Seguimientos que nunca se hacen.</li>
          <li>Procesos manuales.</li>
          <li>Oportunidades que se pierden.</li>
        </ul>
        <p className="mt-4 text-niebla">
          En {siteConfig.name} diseñamos sistemas para resolver esos problemas.
        </p>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-bold">
          No vendemos tecnología. Creamos sistemas que ayudan a tu negocio a crecer.
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/servicios/${service.slug}`}
              className="block rounded-lg border border-berenjena p-6 transition hover:border-violeta"
            >
              <h3 className="text-lg font-semibold text-hueso">{service.name}</h3>
              <p className="mt-2 text-niebla">{service.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-bold">Nuestra filosofía</h2>
        <p className="mt-4 text-niebla">
          No creemos que el crecimiento dependa únicamente de conseguir más clientes. Creemos que
          un negocio crece cuando cada cliente recibe una mejor atención, una mejor experiencia y
          genera más valor con el tiempo. Ese es el propósito del Sistema MAS.
        </p>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-bold">¿Por qué {siteConfig.name}?</h2>
        <ul className="mt-4 space-y-2 text-niebla">
          <li>✔ Diseñamos estrategias, no solo herramientas.</li>
          <li>✔ Implementamos sistemas adaptados a tu negocio.</li>
          <li>✔ Te acompañamos en la optimización continua.</li>
          <li>✔ Tú eres el propietario de tus sistemas y de tus datos.</li>
          <li>✔ Nos enfocamos en el crecimiento de tu negocio.</li>
        </ul>
      </section>

      <section className="mt-20 border-t border-berenjena pt-16">
        <h2 className="text-2xl font-bold">
          Descubre dónde está el siguiente nivel de crecimiento de tu negocio.
        </h2>
        <p className="mt-4 text-niebla">
          Agenda una Auditoría Grow+ y conoce cómo el Sistema MAS puede ayudarte a crecer de forma
          más inteligente.
        </p>
        <Link
          href="/auditoria-gratuita"
          className="mt-6 inline-block rounded-md bg-brand-gradient px-6 py-3 font-medium text-onix"
        >
          Quiero mi Auditoría Grow+
        </Link>
      </section>
    </main>
  )
}
