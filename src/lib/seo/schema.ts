import { siteConfig } from './site-config'

function baseOrganization() {
  return {
    '@type': 'Organization' as const,
    name: siteConfig.name,
    url: siteConfig.url,
  }
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    url: siteConfig.url,
    description: siteConfig.description,
  }
}

export function serviceSchema(input: { name: string; description: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: input.url,
    provider: baseOrganization(),
  }
}

export function articleSchema(input: {
  headline: string
  description: string
  url: string
  datePublished: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url: input.url,
    datePublished: input.datePublished,
    author: baseOrganization(),
  }
}
