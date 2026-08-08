import type { Metadata } from 'next'
import Link from 'next/link'
import { posts } from '@/lib/blog/data'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Respuestas directas sobre sistemas inteligentes para hacer crecer tu negocio.',
}

export default function BlogIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold">Blog</h1>
      <ul className="mt-12 space-y-8">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="text-xl font-semibold underline">
              {post.question}
            </Link>
            <p className="mt-2 text-neutral-600">{post.directAnswer}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
