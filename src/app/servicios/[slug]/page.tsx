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
