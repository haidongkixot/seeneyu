import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SkillTrackColumn } from '@/components/SkillTrackColumn'
import { AssistantButton } from '@/components/assistant'
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

  if (!user?.onboardingComplete) redirect('/onboarding')

  const [baselines, completedSessions] = await Promise.all([
    db.skillBaseline.findMany({ where: { userId } }),
    prisma.userSession.findMany({
      where: { userId, status: 'complete', feedback: { not: undefined } },
      include: { clip: { select: { skillCategory: true, difficulty: true } } },
      orderBy: { completedAt: 'asc' },
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
        <div className="space-y-1 mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            {user.name ? `${user.name}'s Learning Path` : 'Your Learning Path'}
          </h1>
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

      {/* AI Assistant */}
      <AssistantButton context="general" />
    </div>
  )
}
