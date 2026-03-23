import { NavBar } from '@/components/NavBar'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseSlug: string }>
}) {
  const { courseSlug } = await params
  const session = await getServerSession(authOptions)

  const course = await prisma.foundationCourse.findUnique({
    where: { slug: courseSlug },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        select: { id: true, slug: true, title: true, order: true },
      },
    },
  }).catch(() => null)

  if (!course) notFound()

  // Get completed lessons
  let completedIds = new Set<string>()
  const userId = (session?.user as any)?.id as string | undefined
  if (userId) {
    const progress = await prisma.foundationProgress.findMany({
      where: { userId, lessonId: { in: course.lessons.map(l => l.id) }, quizPassed: true },
      select: { lessonId: true },
    }).catch(() => [])
    completedIds = new Set(progress.map(p => p.lessonId))
  }

  const completedCount = completedIds.size
  const totalCount = course.lessons.length

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-tertiary mb-8">
          <Link href="/foundation" className="hover:text-text-primary transition-colors">Foundation</Link>
          <ChevronRight size={14} />
          <span className="text-text-primary">{course.title}</span>
        </nav>

        {/* Course header */}
        <div className="mb-10">
          <div className="text-5xl mb-4">{course.icon}</div>
          <h1 className="text-3xl font-bold text-text-primary mb-3">{course.title}</h1>
          <p className="text-text-secondary text-lg mb-4">{course.description}</p>
          <div className="flex items-center gap-4 text-sm text-text-tertiary">
            <span>{totalCount} lessons</span>
            <span>·</span>
            <span className="text-accent-400 font-medium">{completedCount}/{totalCount} complete</span>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-white/8 rounded-full overflow-hidden max-w-xs">
            <div
              className="h-full bg-accent-400 rounded-full transition-all duration-500"
              style={{ width: totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}%` : '0%' }}
            />
          </div>
        </div>

        {/* Lesson list */}
        <div className="space-y-2">
          {course.lessons.map((lesson, i) => {
            const isDone = completedIds.has(lesson.id)
            return (
              <Link
                key={lesson.id}
                href={`/foundation/${courseSlug}/${lesson.slug}`}
                className="flex items-center gap-4 p-4 bg-bg-surface border border-white/8 rounded-xl hover:border-accent-400/30 hover:bg-bg-overlay transition-all duration-150 group"
              >
                {isDone
                  ? <CheckCircle2 size={20} className="text-accent-400 shrink-0" />
                  : <Circle size={20} className="text-text-muted shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-text-tertiary">Lesson {i + 1}</span>
                  <p className="text-text-primary font-medium group-hover:text-accent-400 transition-colors">{lesson.title}</p>
                </div>
                <ChevronRight size={16} className="text-text-muted group-hover:text-accent-400 transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
