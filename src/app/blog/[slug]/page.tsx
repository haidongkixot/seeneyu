import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitize-html'

interface BlogPost {
  title: string
  body: string
  excerpt: string | null
  coverImage: string | null
  tags: string[] | null
  authorId: string | null
  publishedAt: string | null
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/cms/blog/${slug}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-bg-base">
      <article className="max-w-3xl mx-auto px-4 lg:px-8 py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to Blog
        </Link>

        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full aspect-video object-cover rounded-2xl mb-8"
          />
        )}

        {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(post.tags as string[]).map(tag => (
              <span key={tag} className="text-xs font-medium text-accent-400 bg-accent-400/10 rounded-full px-2.5 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4 leading-tight">
          {post.title}
        </h1>

        {post.publishedAt && (
          <p className="text-sm text-text-muted mb-8">
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}

        <div
          className="prose prose-invert prose-amber max-w-none
            prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-accent-400
            prose-strong:text-text-primary prose-li:text-text-secondary
            prose-blockquote:border-accent-400/30 prose-blockquote:text-text-secondary
            prose-code:text-accent-400 prose-pre:bg-bg-elevated"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.body) }}
        />
      </article>
    </div>
  )
}
