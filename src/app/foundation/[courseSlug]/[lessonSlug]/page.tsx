import { NavBar } from '@/components/NavBar'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import LessonClient from './LessonClient'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>
}) {
  const { courseSlug, lessonSlug } = await params
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

  const lesson = await prisma.foundationLesson.findUnique({
    where: { courseId_slug: { courseId: course.id, slug: lessonSlug } },
    include: {
      examples: true,
      questions: { orderBy: { order: 'asc' } },
    },
  }).catch(() => null)

  if (!lesson) notFound()

  // Get existing progress
  let existingProgress = null
  const userId = (session?.user as any)?.id as string | undefined
  if (userId) {
    existingProgress = await prisma.foundationProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
    }).catch(() => null)
  }

  // Prev/next lesson
  const currentIdx = course.lessons.findIndex(l => l.id === lesson.id)
  const prevLesson = currentIdx > 0 ? course.lessons[currentIdx - 1] : null
  const nextLesson = currentIdx < course.lessons.length - 1 ? course.lessons[currentIdx + 1] : null

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-tertiary mb-8">
          <Link href="/foundation" className="hover:text-text-primary transition-colors">Foundation</Link>
          <ChevronRight size={14} />
          <Link href={`/foundation/${courseSlug}`} className="hover:text-text-primary transition-colors">{course.title}</Link>
          <ChevronRight size={14} />
          <span className="text-text-primary">{lesson.title}</span>
        </nav>

        {/* Lesson position indicator */}
        <div className="flex items-center justify-between text-xs text-text-tertiary mb-6">
          <span>Lesson {currentIdx + 1} of {course.lessons.length}</span>
          <div className="flex gap-1">
            {course.lessons.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-5 rounded-full transition-colors ${i === currentIdx ? 'bg-accent-400' : i < currentIdx ? 'bg-accent-400/40' : 'bg-white/10'}`}
              />
            ))}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-8">{lesson.title}</h1>

        {/* Pass data to client component for interactive quiz */}
        <LessonClient
          lesson={{
            id: lesson.id,
            theoryHtml: lesson.theoryHtml,
            examples: lesson.examples.map(e => ({
              id: e.id,
              youtubeId: e.youtubeId,
              title: e.title,
              description: e.description,
              startTime: e.startTime,
            })),
            questions: lesson.questions.map(q => ({
              id: q.id,
              question: q.question,
              options: q.options as string[],
              correctIndex: q.correctIndex,
              explanation: q.explanation,
              order: q.order,
            })),
          }}
          existingProgress={existingProgress ? {
            quizScore: existingProgress.quizScore,
            quizPassed: existingProgress.quizPassed,
          } : null}
          isLoggedIn={!!session?.user}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/8">
          {prevLesson ? (
            <Link
              href={`/foundation/${courseSlug}/${prevLesson.slug}`}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft size={16} />
              <span>{prevLesson.title}</span>
            </Link>
          ) : (
            <Link href={`/foundation/${courseSlug}`} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              <ChevronLeft size={16} />
              <span>Back to {course.title}</span>
            </Link>
          )}
          {nextLesson ? (
            <Link
              href={`/foundation/${courseSlug}/${nextLesson.slug}`}
              className="flex items-center gap-2 text-sm text-text-primary font-medium hover:text-accent-400 transition-colors"
            >
              <span>{nextLesson.title}</span>
              <ChevronRight size={16} />
            </Link>
          ) : (
            <Link href={`/foundation/${courseSlug}`} className="flex items-center gap-2 text-sm text-text-primary font-medium hover:text-accent-400 transition-colors">
              <span>Finish Course</span>
              <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
