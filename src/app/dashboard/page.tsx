import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import Link from 'next/link'
import { SkillTrackColumn } from '@/components/SkillTrackColumn'
import { AssistantButton } from '@/components/assistant'
import { ProactiveSuggestionBanner } from '@/components/ProactiveSuggestionBanner'
import { PushPermissionPrompt } from '@/components/PushPermissionPrompt'
import { LearningPlanCard } from '@/components/LearningPlanCard'
import { UpgradeBanner } from '@/components/UpgradeBanner'
import type { SkillCategory, SkillLevel, SkillTrack } from '@/lib/types'

const SKILLS: SkillCategory[] = [
  'eye-contact',
  'open-posture',
  'vocal-pacing',
  'confident-disagreement',
  'active-listening',
]

const LEVEL_ORDER: SkillLevel[] = ['beginner', 'intermediate', 'advanced']
const CLIPS_PER_LEVEL = 5
const db = prisma as any

function nextLevel(level: SkillLevel): SkillLevel | null {
  const idx = LEVEL_ORDER.indexOf(level)
  return idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/signin')

  const userId = (session.user as any).id as string

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { onboardingComplete: true, name: true },
  })

  if (!user) redirect('/auth/signin')

  const [baselines, completedSessions, userPreferences, reviewDueClips] = await Promise.all([
    db.skillBaseline.findMany({ where: { userId } }),
    prisma.userSession.findMany({
      where: { userId, status: 'complete', feedback: { not: Prisma.JsonNull } },
      include: { clip: { select: { skillCategory: true, difficulty: true } } },
      orderBy: { completedAt: 'asc' },
    }),
    // LC: Check if user has set preferences
    db.userPreferences.findUnique({ where: { userId }, select: { goal: true, genres: true, purposes: true, traits: true } }),
    // I3: Clips ready for spaced review
    prisma.userSession.findMany({
      where: { userId, status: 'complete', nextReviewAt: { lte: new Date() } },
      include: { clip: { select: { id: true, movieTitle: true, skillCategory: true, youtubeVideoId: true } } },
      orderBy: { nextReviewAt: 'asc' },
      take: 3,
    }),
  ])

  const tracks: SkillTrack[] = await Promise.all(
    SKILLS.map(async (skill: SkillCategory) => {
      const baseline = baselines.find((b: any) => b.skillCategory === skill)
      let currentLevel: SkillLevel = (baseline?.level as SkillLevel) ?? 'beginner'

      const skillSessions = completedSessions.filter((s: any) => s.clip.skillCategory === skill)

      const passingAtLevel = skillSessions.filter((s: any) => {
        if (s.clip.difficulty !== currentLevel) return false
        const fb = s.feedback as any
        return fb?.overallScore >= 70
      })
      if (passingAtLevel.length >= 2) {
        const advanced = nextLevel(currentLevel)
        if (advanced) currentLevel = advanced
      }

      const clipsCompleted = skillSessions.filter((s: any) => s.clip.difficulty === currentLevel).length

      const nextClipRow = await prisma.clip.findFirst({
        where: { skillCategory: skill, difficulty: currentLevel, isActive: true },
        select: { id: true, sceneDescription: true, youtubeVideoId: true, difficulty: true, skillCategory: true },
      })

      const nextClip = nextClipRow
        ? {
            id: nextClipRow.id,
            title: nextClipRow.sceneDescription,
            thumbnailUrl: `https://i.ytimg.com/vi/${nextClipRow.youtubeVideoId}/mqdefault.jpg`,
            difficulty: nextClipRow.difficulty as any,
            skillCategory: nextClipRow.skillCategory as SkillCategory,
          }
        : null

      return { skillCategory: skill, currentLevel, clipsCompleted, clipsTotal: CLIPS_PER_LEVEL, nextClip }
    })
  )

  return (
    <div className="min-h-screen bg-bg-base">
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        {/* Upgrade banner for free users */}
        <div className="mb-6">
          <UpgradeBanner />
        </div>

        {/* Proactive suggestion from Coach Ney */}
        <div className="mb-6">
          <ProactiveSuggestionBanner />
        </div>

        {/* LC: Personalize prompt for users without preferences */}
        {!userPreferences && (
          <div className="mb-6 bg-accent-400/5 border border-accent-400/20 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-text-primary font-semibold">Personalize your learning curve</p>
              <p className="text-text-secondary text-sm mt-0.5">Tell us your preferences and we'll tailor content to match your goals.</p>
            </div>
            <Link
              href="/settings/preferences"
              className="shrink-0 bg-accent-400 text-text-inverse rounded-pill px-5 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-colors"
            >
              Set Up
            </Link>
          </div>
        )}

        {/* LC: Learning Curve summary card */}
        {userPreferences && (
          <div className="mb-6 bg-bg-surface border border-black/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-text-tertiary text-xs font-semibold uppercase tracking-widest">Your Learning Curve</p>
              <Link href="/settings/preferences" className="text-xs text-accent-400 hover:text-accent-500 font-medium">Edit</Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                ...((userPreferences.genres as string[]) ?? []),
                ...((userPreferences.purposes as string[]) ?? []),
                ...((userPreferences.traits as string[]) ?? []),
              ].map((tag: string) => (
                <span key={tag} className="bg-accent-400/10 text-accent-400 text-xs font-medium px-2.5 py-1 rounded-pill border border-accent-400/20">
                  {tag.replace(/-/g, ' ').replace(/^for /, '')}
                </span>
              ))}
              {((userPreferences.genres as string[]) ?? []).length === 0 &&
               ((userPreferences.purposes as string[]) ?? []).length === 0 &&
               ((userPreferences.traits as string[]) ?? []).length === 0 && (
                <span className="text-text-tertiary text-sm">No preferences set yet</span>
              )}
            </div>
          </div>
        )}

        {/* Today's personalized learning plan */}
        <div className="mb-8">
          <LearningPlanCard />
        </div>

        {/* I3: Ready to Review section */}
        {reviewDueClips.length > 0 && (
          <div className="mb-8">
            <p className="text-text-tertiary text-xs font-semibold uppercase tracking-widest mb-3">Ready to Review</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {reviewDueClips.map((s: any) => {
                const lastScore = (s.scores as any)?.overallScore ?? 0
                const daysSince = Math.floor((Date.now() - new Date(s.completedAt).getTime()) / 86400000)
                return (
                  <Link
                    key={s.id}
                    href={`/library/${s.clip.id}/record`}
                    className="bg-bg-surface border border-black/8 rounded-xl p-4 hover:border-accent-400/40 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={`https://i.ytimg.com/vi/${s.clip.youtubeVideoId}/mqdefault.jpg`}
                        alt="" className="w-16 h-12 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-text-primary text-sm font-medium truncate group-hover:text-accent-400 transition-colors">
                          {s.clip.movieTitle.slice(0, 30)}
                        </p>
                        <p className="text-text-tertiary text-xs mt-0.5">
                          Last score: {lastScore} · {daysSince}d ago
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-1 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text-primary">
              {user.name ? `${user.name}'s Learning Path` : 'Your Learning Path'}
            </h1>
            <Link
              href="/profile"
              className="text-sm text-accent-400 hover:text-accent-500 font-medium transition-colors"
            >
              Edit Profile &rarr;
            </Link>
          </div>
          <p className="text-sm text-text-secondary">
            Track your progress across all 5 communication skills.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {tracks.map((track: SkillTrack) => (
            <SkillTrackColumn key={track.skillCategory} track={track} />
          ))}
        </div>
      </main>

      {/* Push notification opt-in prompt */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-6">
        <PushPermissionPrompt />
      </div>

      {/* AI Assistant */}
      <AssistantButton context="general" />
    </div>
  )
}
