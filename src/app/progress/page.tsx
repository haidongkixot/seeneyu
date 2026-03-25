import { NavBar } from '@/components/NavBar'
import { prisma } from '@/lib/prisma'
import { SkillBadge } from '@/components/SkillBadge'
import type { SkillCategory } from '@/lib/types'
import { SKILL_LABELS } from '@/lib/types'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

export default async function ProgressPage() {
  const sessions = await prisma.userSession.findMany({
    where: { status: 'complete' },
    include: { clip: { select: { skillCategory: true, difficulty: true, sceneDescription: true, movieTitle: true } } },
    orderBy: { completedAt: 'desc' },
    take: 20,
  }).catch(() => [])

  const skills = ['eye-contact', 'open-posture', 'active-listening', 'vocal-pacing', 'confident-disagreement'] as SkillCategory[]

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 lg:px-8 pt-10 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp size={28} className="text-accent-400" />
          <h1 className="text-3xl font-bold text-text-primary">Your Progress</h1>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-20 bg-bg-surface border border-black/8 rounded-2xl">
            <TrendingUp size={48} className="text-text-tertiary mx-auto" />
            <h2 className="text-xl font-semibold text-text-primary mt-4">No sessions yet</h2>
            <p className="text-text-secondary text-sm mt-2">Complete a clip to see your progress here</p>
            <Link
              href="/library"
              className="mt-6 inline-block bg-accent-400 text-text-inverse rounded-pill px-6 py-3 text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
            >
              Start Practicing
            </Link>
          </div>
        ) : (
          <>
            {/* Skill summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {skills.map((skill) => {
                const skillSessions = sessions.filter(s => s.clip.skillCategory === skill)
                const avgScore = skillSessions.length
                  ? Math.round(skillSessions.reduce((sum, s) => {
                      const feedback = s.feedback as { overallScore?: number } | null
                      return sum + (feedback?.overallScore ?? 0)
                    }, 0) / skillSessions.length)
                  : null

                return (
                  <div key={skill} className="bg-bg-surface border border-black/8 rounded-2xl p-5">
                    <SkillBadge skill={skill} size="sm" className="mb-3" />
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className="text-2xl font-black text-text-primary">
                          {avgScore !== null ? avgScore : '—'}
                          {avgScore !== null && <span className="text-sm text-text-tertiary font-normal ml-1">/100</span>}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          {skillSessions.length} session{skillSessions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {avgScore !== null && (
                        <div className="w-16 bg-black/5 rounded-pill h-1.5">
                          <div className="bg-accent-400 h-1.5 rounded-pill" style={{ width: `${avgScore}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Recent sessions */}
            <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Sessions</h2>
            <div className="flex flex-col gap-3">
              {sessions.map((session) => {
                const feedback = session.feedback as { overallScore?: number } | null
                return (
                  <div key={session.id} className="bg-bg-surface border border-black/8 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">
                        {session.clip.sceneDescription}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <SkillBadge skill={session.clip.skillCategory as SkillCategory} size="sm" />
                        <span className="text-xs text-text-tertiary">{session.clip.movieTitle}</span>
                      </div>
                    </div>
                    {feedback?.overallScore !== undefined && (
                      <div className="text-right shrink-0">
                        <p className="text-xl font-black text-accent-400">{feedback.overallScore}</p>
                        <p className="text-xs text-text-tertiary">/100</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
