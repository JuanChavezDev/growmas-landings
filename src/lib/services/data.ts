export type Service = {
  slug: string
  name: string
  summary: string
  body: string
}

export const services: Service[] = [
  {
    slug: 'captacion',
    name: 'Sistema de Captación',
    summary: 'Convierte más personas en oportunidades.',
    body: 'Diseñamos el sistema que convierte visitas y contactos en oportunidades reales de negocio, con procesos claros desde el primer contacto.',
  },
  {
    slug: 'atencion',
    name: 'Sistema de Atención',
    summary: 'Responde rápido y mejora la experiencia de tus clientes.',
    body: 'Implementamos sistemas de atención que responden rápido y de forma consistente, para que ningún cliente se quede esperando.',
  },
  {
    slug: 'seguimiento',
    name: 'Sistema de Seguimiento',
    summary: 'Evita perder oportunidades por falta de seguimiento.',
    body: 'Creamos procesos de seguimiento que aseguran que ninguna oportunidad se pierda por falta de un siguiente paso.',
  },
  {
    slug: 'fidelizacion',
    name: 'Sistema de Fidelización',
    summary: 'Haz que tus clientes regresen una y otra vez.',
    body: 'Construimos sistemas de fidelización que aumentan el valor de cada cliente a lo largo del tiempo, no solo en la primera compra.',
  },
]

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug)
}
