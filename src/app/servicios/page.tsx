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
          <Link
            key={service.slug}
            href={`/servicios/${service.slug}`}
            className="block rounded-lg border border-berenjena p-6 transition hover:border-violeta"
          >
            <h2 className="text-xl font-semibold text-hueso">{service.name}</h2>
            <p className="mt-2 text-niebla">{service.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
