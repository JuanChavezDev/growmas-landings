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
