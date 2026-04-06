import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { SkillBadge } from '@/components/SkillBadge'
import type { SkillCategory } from '@/lib/types'
import { SKILL_LABELS } from '@/lib/types'
import Link from 'next/link'
import { TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

const SKILLS: SkillCategory[] = [
  'eye-contact',
  'open-posture',
  'active-listening',
  'vocal-pacing',
  'confident-disagreement',
]

/* ── SVG Sparkline ─────────────────────────────────────────────── */

function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null
  const w = 120
  const h = 32
  const pad = 2
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1

  const points = scores
    .map((s, i) => {
      const x = pad + (i / (scores.length - 1)) * (w - pad * 2)
      const y = h - pad - ((s - min) / range) * (h - pad * 2)
      return `${x},${y}`
    })
    .join(' ')

  const lastScore = scores[scores.length - 1]
  const firstScore = scores[0]
  const trending = lastScore > firstScore ? 'up' : lastScore < firstScore ? 'down' : 'flat'
  const strokeColor =
    trending === 'up' ? '#22c55e' : trending === 'down' ? '#ef4444' : '#a3a3a3'

  // Gradient fill path: close the polyline along the bottom
  const fillPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <defs>
        <linearGradient id={`spark-fill-${scores.join('-')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon
        points={fillPoints}
        fill={`url(#spark-fill-${scores.join('-')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {(() => {
        const lastX = pad + ((scores.length - 1) / (scores.length - 1)) * (w - pad * 2)
        const lastY = h - pad - ((lastScore - min) / range) * (h - pad * 2)
        return <circle cx={lastX} cy={lastY} r={2.5} fill={strokeColor} />
      })()}
    </svg>
  )
}

/* ── Trend indicator ───────────────────────────────────────────── */

function TrendIndicator({ scores }: { scores: number[] }) {
  if (scores.length < 2) return <Minus size={14} className="text-text-tertiary" />
  const first = scores[0]
  const last = scores[scores.length - 1]
  const diff = last - first
  if (diff > 3) return <ArrowUpRight size={14} className="text-green-500" />
  if (diff < -3) return <ArrowDownRight size={14} className="text-red-500" />
  return <Minus size={14} className="text-text-tertiary" />
}

/* ── Main Page ─────────────────────────────────────────────────── */

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/signin')

  const userId = (session.user as any).id as string

  const completedSessions = await prisma.userSession.findMany({
    where: {
      userId,
      status: 'complete',
      feedback: { not: Prisma.JsonNull },
    },
    include: {
      clip: {
        select: {
          id: true,
          movieTitle: true,
          skillCategory: true,
          difficulty: true,
          sceneDescription: true,
        },
      },
    },
    orderBy: { completedAt: 'asc' },
  })

  // ── Group sessions by clipId ────────────────────────────────
  const clipGroups: Record<
    string,
    {
      movieTitle: string
      skill: SkillCategory
      difficulty: string
      description: string
      scores: number[]
      dates: string[]
    }
  > = {}

  for (const s of completedSessions) {
    const fb = s.feedback as { overallScore?: number } | null
    const score = fb?.overallScore
    if (score == null) continue

    if (!clipGroups[s.clipId]) {
      clipGroups[s.clipId] = {
        movieTitle: s.clip.movieTitle,
        skill: s.clip.skillCategory as SkillCategory,
        difficulty: s.clip.difficulty,
        description: s.clip.sceneDescription,
        scores: [],
        dates: [],
      }
    }
    clipGroups[s.clipId].scores.push(score)
    clipGroups[s.clipId].dates.push(
      s.completedAt ? new Date(s.completedAt).toLocaleDateString() : '',
    )
  }

  // ── Compute per-skill averages ──────────────────────────────
  const skillStats: Record<
    string,
    { totalScore: number; count: number; scores: number[] }
  > = {}

  for (const s of completedSessions) {
    const fb = s.feedback as { overallScore?: number } | null
    const score = fb?.overallScore
    if (score == null) continue
    const skill = s.clip.skillCategory
    if (!skillStats[skill]) skillStats[skill] = { totalScore: 0, count: 0, scores: [] }
    skillStats[skill].totalScore += score
    skillStats[skill].count += 1
    skillStats[skill].scores.push(score)
  }

  const totalSessions = completedSessions.length
  const overallAvg =
    totalSessions > 0
      ? Math.round(
          completedSessions.reduce((sum, s) => {
            const fb = s.feedback as { overallScore?: number } | null
            return sum + (fb?.overallScore ?? 0)
          }, 0) / totalSessions,
        )
      : null

  const clipEntries = Object.entries(clipGroups)

  return (
    <div className="min-h-screen bg-bg-base">
      <main className="max-w-4xl mx-auto px-4 lg:px-8 pt-10 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp size={28} className="text-accent-400" />
          <h1 className="text-3xl font-bold text-text-primary">Your Progress</h1>
        </div>

        {totalSessions === 0 ? (
          <div className="text-center py-20 bg-bg-surface border border-black/8 rounded-2xl">
            <TrendingUp size={48} className="text-text-tertiary mx-auto" />
            <h2 className="text-xl font-semibold text-text-primary mt-4">No sessions yet</h2>
            <p className="text-text-secondary text-sm mt-2">
              Complete a clip to see your progress here
            </p>
            <Link
              href="/library"
              className="mt-6 inline-block bg-accent-400 text-text-inverse rounded-pill px-6 py-3 text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
            >
              Start Practicing
            </Link>
          </div>
        ) : (
          <>
            {/* Overall summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
              <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
                <p className="text-xs text-text-tertiary uppercase tracking-wide font-medium">
                  Total Sessions
                </p>
                <p className="text-3xl font-black text-text-primary mt-1">{totalSessions}</p>
              </div>
              <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
                <p className="text-xs text-text-tertiary uppercase tracking-wide font-medium">
                  Average Score
                </p>
                <p className="text-3xl font-black text-accent-400 mt-1">
                  {overallAvg ?? '—'}
                  {overallAvg !== null && (
                    <span className="text-sm text-text-tertiary font-normal ml-1">/100</span>
                  )}
                </p>
              </div>
              <div className="bg-bg-surface border border-black/8 rounded-2xl p-5 col-span-2 sm:col-span-1">
                <p className="text-xs text-text-tertiary uppercase tracking-wide font-medium">
                  Clips Practiced
                </p>
                <p className="text-3xl font-black text-text-primary mt-1">
                  {clipEntries.length}
                </p>
              </div>
            </div>

            {/* Skill category breakdown */}
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={20} className="text-accent-400" />
              <h2 className="text-xl font-semibold text-text-primary">By Skill</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {SKILLS.map((skill) => {
                const stats = skillStats[skill]
                const avgScore = stats ? Math.round(stats.totalScore / stats.count) : null
                const count = stats?.count ?? 0

                return (
                  <div key={skill} className="bg-bg-surface border border-black/8 rounded-2xl p-5">
                    <SkillBadge skill={skill} size="sm" className="mb-3" />
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className="text-2xl font-black text-text-primary">
                          {avgScore !== null ? avgScore : '—'}
                          {avgScore !== null && (
                            <span className="text-sm text-text-tertiary font-normal ml-1">
                              /100
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          {count} session{count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {stats && <TrendIndicator scores={stats.scores} />}
                        {avgScore !== null && (
                          <div className="w-16 bg-black/5 rounded-pill h-1.5">
                            <div
                              className="bg-accent-400 h-1.5 rounded-pill"
                              style={{ width: `${avgScore}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Per-clip improvement */}
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-accent-400" />
              <h2 className="text-xl font-semibold text-text-primary">Per-Clip Progress</h2>
            </div>
            <div className="flex flex-col gap-3">
              {clipEntries.map(([clipId, group]) => {
                const latest = group.scores[group.scores.length - 1]
                const best = Math.max(...group.scores)

                return (
                  <div
                    key={clipId}
                    className="bg-bg-surface border border-black/8 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">
                        {group.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <SkillBadge skill={group.skill} size="sm" />
                        <span className="text-xs text-text-tertiary">{group.movieTitle}</span>
                        <span className="text-xs text-text-tertiary">
                          &middot; {group.scores.length} attempt
                          {group.scores.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Sparkline for clips with 2+ attempts */}
                      {group.scores.length >= 2 && <Sparkline scores={group.scores} />}

                      <div className="text-right min-w-[52px]">
                        <p className="text-xl font-black text-accent-400">{latest}</p>
                        <p className="text-xs text-text-tertiary">
                          best {best}
                        </p>
                      </div>
                    </div>
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
