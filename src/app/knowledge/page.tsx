import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BookOpen, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function KnowledgePage() {
  const chapters = await prisma.blogPost.findMany({
    where: { category: 'knowledge', status: 'published' },
    orderBy: { createdAt: 'asc' },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      tags: true,
    },
  })

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-2xl bg-accent-400/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-accent-400" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-3">Body Language Fundamentals</h1>
          <p className="text-text-secondary text-base max-w-lg mx-auto leading-relaxed">
            A comprehensive guide to understanding and mastering body language,
            facial expressions, and non-verbal communication.
          </p>
        </div>

        {/* Chapter list */}
        {chapters.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted text-sm">Chapters coming soon. Check back later.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter, i) => (
              <Link
                key={chapter.slug}
                href={`/knowledge/${chapter.slug}`}
                className="flex items-center gap-4 bg-bg-surface border border-black/[0.06] rounded-xl p-5 hover:border-accent-400/30 hover:bg-accent-400/[0.02] transition-all group"
              >
                <span className="text-lg font-bold text-text-muted w-8 text-right flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-text-primary group-hover:text-accent-400 transition-colors">
                    {chapter.title}
                  </h2>
                  {chapter.excerpt && (
                    <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{chapter.excerpt}</p>
                  )}
                </div>
                <ChevronRight size={16} className="text-text-muted group-hover:text-accent-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Back to home */}
        <div className="text-center mt-12">
          <Link href="/" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            Back to seeneyu
          </Link>
        </div>
      </div>
    </div>
  )
}
