import { siteConfig } from '@/lib/seo/site-config'

export function SiteFooter() {
  return (
    <footer className="border-t border-berenjena/60 bg-noche py-8">
      <div className="mx-auto max-w-5xl px-6 text-sm text-niebla">
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.name}. {siteConfig.slogan}
        </p>
      </div>
    </footer>
  )
}
