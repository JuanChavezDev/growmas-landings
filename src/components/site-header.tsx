import Link from 'next/link'
import { Logo } from '@/components/logo'

export function SiteHeader() {
  return (
    <header className="border-b border-berenjena/60 bg-onix/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-6 text-sm text-hueso">
          <Link href="/servicios" className="hover:text-lila">
            Servicios
          </Link>
          <Link href="/blog" className="hover:text-lila">
            Blog
          </Link>
          <Link
            href="/auditoria-gratuita"
            className="rounded-md bg-brand-gradient px-4 py-2 font-medium text-onix"
          >
            Agenda una Auditoría Grow+
          </Link>
        </nav>
      </div>
    </header>
  )
}
