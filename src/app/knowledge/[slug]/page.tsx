import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitize-html'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function KnowledgeChapterPage({ params }: PageProps) {
  const { slug } = await params

  const post = await prisma.blogPost.findUnique({
    where: { slug },
  })

  if (!post || post.category !== 'knowledge' || post.status !== 'published') {
    notFound()
  }

  // Get all knowledge chapters for prev/next navigation
  const allChapters = await prisma.blogPost.findMany({
    where: { category: 'knowledge', status: 'published' },
    orderBy: { createdAt: 'asc' },
    select: { slug: true, title: true },
  })

  const currentIdx = allChapters.findIndex((c) => c.slug === slug)
  const prevChapter = currentIdx > 0 ? allChapters[currentIdx - 1] : null
  const nextChapter = currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null
  const chapterNumber = currentIdx + 1

  return (
    <div className="min-h-screen bg-bg-base">
      <article className="max-w-3xl mx-auto px-4 lg:px-8 py-12">
        {/* Nav */}
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          All Chapters
        </Link>

        {/* Chapter header */}
        <div className="mb-10">
          <span className="text-xs font-semibold text-accent-400 uppercase tracking-wider">
            Chapter {chapterNumber} of {allChapters.length}
          </span>
          <h1 className="text-3xl font-bold text-text-primary mt-2 mb-3">{post.title}</h1>
          {post.excerpt && (
            <p className="text-text-secondary text-base leading-relaxed">{post.excerpt}</p>
          )}
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <div className="mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full rounded-2xl"
            />
          </div>
        )}

        {/* Body */}
        <div
          className="prose prose-neutral max-w-none
            prose-headings:text-text-primary prose-headings:font-bold
            prose-p:text-text-secondary prose-p:leading-relaxed
            prose-strong:text-text-primary
            prose-a:text-accent-400 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:my-6
            prose-blockquote:border-accent-400/30 prose-blockquote:text-text-secondary
            prose-li:text-text-secondary
            prose-code:text-accent-400 prose-code:bg-bg-inset prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          "
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.body) }}
        />

        {/* Prev/Next navigation */}
        <div className="flex items-stretch gap-4 mt-12 pt-8 border-t border-black/[0.06]">
          {prevChapter ? (
            <Link
              href={`/knowledge/${prevChapter.slug}`}
              className="flex-1 flex items-center gap-3 bg-bg-surface border border-black/[0.06] rounded-xl p-4 hover:border-accent-400/30 transition-colors group"
            >
              <ChevronLeft size={16} className="text-text-muted group-hover:text-accent-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Previous</span>
                <p className="text-sm font-medium text-text-primary truncate">{prevChapter.title}</p>
              </div>
            </Link>
          ) : <div className="flex-1" />}

          {nextChapter ? (
            <Link
              href={`/knowledge/${nextChapter.slug}`}
              className="flex-1 flex items-center justify-end gap-3 bg-bg-surface border border-black/[0.06] rounded-xl p-4 hover:border-accent-400/30 transition-colors group text-right"
            >
              <div className="min-w-0">
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Next</span>
                <p className="text-sm font-medium text-text-primary truncate">{nextChapter.title}</p>
              </div>
              <ChevronRight size={16} className="text-text-muted group-hover:text-accent-400 flex-shrink-0" />
            </Link>
          ) : <div className="flex-1" />}
        </div>
      </article>
    </div>
  )
}
