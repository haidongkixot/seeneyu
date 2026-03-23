import { NavBar } from '@/components/NavBar'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

const COLOR_MAP: Record<string, string> = {
  amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
  blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40',
  green: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40',
}

const BADGE_COLOR_MAP: Record<string, string> = {
  amber: 'text-amber-400 bg-amber-400/10',
  blue: 'text-blue-400 bg-blue-400/10',
  green: 'text-emerald-400 bg-emerald-400/10',
}

export default async function FoundationPage() {
  const session = await getServerSession(authOptions)

  const courses = await prisma.foundationCourse.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { lessons: true } },
    },
  }).catch(() => [])

  // Get user progress if logged in
  let progressMap: Record<string, number> = {}
  const userId = (session?.user as any)?.id as string | undefined
  if (userId) {
    const allProgress = await prisma.foundationProgress.findMany({
      where: { userId, quizPassed: true },
      select: { lesson: { select: { courseId: true } } },
    }).catch(() => [])

    for (const p of allProgress) {
      const cId = p.lesson.courseId
      progressMap[cId] = (progressMap[cId] || 0) + 1
    }
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-text-primary mb-3">Performing Foundation</h1>
          <p className="text-text-secondary text-lg max-w-2xl">
            Master the core building blocks of human communication — voice, language, and body. Each course combines theory, real-world examples, and quizzes.
          </p>
        </div>

        {/* Course grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => {
            const totalLessons = course._count.lessons
            const completedLessons = progressMap[course.id] || 0
            const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
            const gradientClass = COLOR_MAP[course.color] || COLOR_MAP.amber
            const badgeClass = BADGE_COLOR_MAP[course.color] || BADGE_COLOR_MAP.amber

            return (
              <Link
                key={course.id}
                href={`/foundation/${course.slug}`}
                className={`group flex flex-col bg-gradient-to-b ${gradientClass} border rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1`}
              >
                <div className="text-4xl mb-4">{course.icon}</div>
                <h2 className="text-xl font-bold text-text-primary mb-2">{course.title}</h2>
                <p className="text-text-secondary text-sm mb-4 flex-1">{course.description}</p>
                <div className="flex items-center justify-between text-xs text-text-tertiary mb-3">
                  <span>{totalLessons} lessons</span>
                  <span className={`font-semibold ${badgeClass} px-2 py-0.5 rounded-full`}>
                    {completedLessons}/{totalLessons} done
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-current opacity-60 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </Link>
            )
          })}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-24 text-text-tertiary">
            <p className="text-lg">Foundation content coming soon.</p>
          </div>
        )}
      </main>
    </div>
  )
}
