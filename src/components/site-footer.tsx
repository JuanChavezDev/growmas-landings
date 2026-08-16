import Image from 'next/image'
import { siteConfig } from '@/lib/seo/site-config'

export function SiteFooter() {
  return (
    <footer className="border-t border-berenjena/60 bg-noche py-8">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 text-sm text-niebla">
        <Image src="/logo/grow-plus-mark-flat.svg" alt="" width={20} height={20} aria-hidden />
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.name}. {siteConfig.slogan}
        </p>
      </div>
    </footer>
  )
}
