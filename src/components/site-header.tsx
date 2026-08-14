import Link from 'next/link'
import { Logo } from '@/components/logo'

export function SiteHeader() {
  return (
    <header className="border-b border-berenjena/60 bg-onix/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
        <nav className="flex items-center gap-4 text-sm text-hueso sm:gap-6">
          <Link href="/servicios" className="hidden hover:text-lila sm:inline">
            Servicios
          </Link>
          <Link href="/blog" className="hidden hover:text-lila sm:inline">
            Blog
          </Link>
          <Link
            href="/mas-pacientes"
            className="whitespace-nowrap rounded-md bg-brand-gradient px-3 py-2 text-xs font-medium text-onix sm:px-4 sm:text-sm"
          >
            Agenda tu Auditoría
          </Link>
        </nav>
      </div>
    </header>
  )
}
