import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

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

      const skillSessions = completedSessions.filter(
        (s: any) => s.clip.skillCategory === skill
      )

      const passingAtLevel = skillSessions.filter((s: any) => {
        if (s.clip.difficulty !== currentLevel) return false
        const fb = s.feedback as any
        return fb?.overallScore >= 70
      })
      if (passingAtLevel.length >= 2) {
        const advanced = nextLevel(currentLevel)
        if (advanced) currentLevel = advanced
      }

      const clipsCompleted = skillSessions.filter(
        (s: any) => s.clip.difficulty === currentLevel
      ).length

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

      return {
        skillCategory: skill,
        currentLevel,
        clipsCompleted,
        clipsTotal: CLIPS_PER_LEVEL,
        nextClip,
      }
    })
  )

  return NextResponse.json(tracks)
}
