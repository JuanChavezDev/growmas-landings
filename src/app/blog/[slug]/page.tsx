import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, posts } from '@/lib/blog/data'
import { articleSchema } from '@/lib/seo/schema'
import { siteConfig } from '@/lib/seo/site-config'

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.question,
    description: post.directAnswer,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const schema = articleSchema({
    headline: post.question,
    description: post.directAnswer,
    url: `${siteConfig.url}/blog/${post.slug}`,
    datePublished: post.datePublished,
  })

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <h1 className="text-4xl font-bold">{post.question}</h1>
      <p className="mt-6 text-lg font-medium text-lila">{post.directAnswer}</p>
      <p className="mt-6 text-niebla">{post.body}</p>
    </main>
  )
}
