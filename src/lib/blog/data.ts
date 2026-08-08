export type BlogPost = {
  slug: string
  question: string
  directAnswer: string
  body: string
  datePublished: string
}

export const posts: BlogPost[] = [
  {
    slug: 'que-es-un-sistema-de-seguimiento-de-clientes',
    question: '¿Qué es un sistema de seguimiento de clientes?',
    directAnswer:
      'Un sistema de seguimiento de clientes es un proceso automatizado que asegura que cada oportunidad de negocio reciba un siguiente contacto en el momento correcto, sin depender de que alguien se acuerde de hacerlo manualmente.',
    body: 'Sin un sistema de seguimiento, las oportunidades se pierden por una razón simple: nadie vuelve a escribirle al cliente a tiempo. Un sistema de seguimiento resuelve esto con recordatorios automáticos, mensajes programados y reglas claras sobre cuándo y cómo se retoma el contacto, para que ninguna oportunidad dependa de la memoria de una persona.',
    datePublished: '2026-08-07',
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug)
}
