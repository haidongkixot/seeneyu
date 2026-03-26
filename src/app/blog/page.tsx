import Link from 'next/link'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImage: string | null
  tags: string[] | null
  publishedAt: string | null
}

async function getPosts(): Promise<{ posts: BlogPost[]; total: number }> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/cms/blog?limit=12`, {
      cache: 'no-store',
    })
    if (!res.ok) return { posts: [], total: 0 }
    return res.json()
  } catch {
    return { posts: [], total: 0 }
  }
}

export default async function BlogPage() {
  const { posts } = await getPosts()

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-text-primary mb-2">Blog</h1>
        <p className="text-text-secondary mb-12">Insights on body language, communication, and self-improvement.</p>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted">No posts published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden hover:border-accent-400/20 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
              >
                {post.coverImage && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5">
                  {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(post.tags as string[]).slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] font-medium text-accent-400 bg-accent-400/10 rounded-full px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-accent-400 transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-text-secondary line-clamp-3">{post.excerpt}</p>
                  )}
                  {post.publishedAt && (
                    <p className="text-xs text-text-muted mt-3">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
