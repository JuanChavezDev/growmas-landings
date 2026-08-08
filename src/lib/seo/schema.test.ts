import { describe, expect, it } from 'vitest'
import { articleSchema, organizationSchema, serviceSchema } from './schema'

describe('organizationSchema', () => {
  it('identifies GROW+ as the organization with growmas.io as the URL', () => {
    const schema = organizationSchema()
    expect(schema['@type']).toBe('Organization')
    expect(schema.name).toBe('GROW+')
    expect(schema.alternateName).toBe('Growmas')
    expect(schema.url).toBe('https://growmas.io')
  })
})

describe('serviceSchema', () => {
  it('builds a Service node from the given input', () => {
    const schema = serviceSchema({
      name: 'Sistema de Captación',
      description: 'Convierte más personas en oportunidades.',
      url: 'https://growmas.io/servicios/captacion',
    })
    expect(schema['@type']).toBe('Service')
    expect(schema.name).toBe('Sistema de Captación')
    expect(schema.provider).toMatchObject({ '@type': 'Organization', name: 'GROW+' })
    expect(schema.url).toBe('https://growmas.io/servicios/captacion')
  })
})

describe('articleSchema', () => {
  it('builds an Article node from the given input', () => {
    const schema = articleSchema({
      headline: '¿Cuánto cuesta automatizar el seguimiento de clientes?',
      description: 'Respuesta directa con rangos de precio y qué los mueve.',
      url: 'https://growmas.io/blog/costo-automatizar-seguimiento',
      datePublished: '2026-08-07',
    })
    expect(schema['@type']).toBe('Article')
    expect(schema.headline).toBe('¿Cuánto cuesta automatizar el seguimiento de clientes?')
    expect(schema.datePublished).toBe('2026-08-07')
    expect(schema.author).toMatchObject({ '@type': 'Organization', name: 'GROW+' })
  })
})
