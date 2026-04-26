// Maps an Extension session to the user's skill development on Seeneyu:
// awards XP, advances the streak, and bumps SkillBaseline when scores
// indicate improvement. Mirror Mode counts as a real practice surface so a
// session here keeps the user's daily streak alive and contributes to their
// gamification numbers.

import { prisma } from '@/lib/prisma'

export interface SkillUpdateInput {
  userId: string
  durationSeconds: number
  averages: {
    eyeContactPct: number | null
    posture: number | null
    pace: number | null
  }
}

export interface SkillUpdateResult {
  xpAwarded: number
  streak: number
  baselinesAdvanced: string[]
}

const SKILL_BY_METRIC = {
  eyeContact: 'eye-contact',
  posture: 'posture',
  pace: 'vocal-pacing',
} as const

const ADVANCE_THRESHOLDS: Record<string, { intermediate: number; advanced: number }> = {
  'eye-contact': { intermediate: 60, advanced: 80 },
  'posture': { intermediate: 60, advanced: 80 },
  'vocal-pacing': { intermediate: 60, advanced: 80 }, // we score pace separately below
}

function paceScore(wpm: number | null): number | null {
  if (wpm === null) return null
  // Sweet spot 120-160 → 100. Falls off linearly outside.
  if (wpm >= 120 && wpm <= 160) return 100
  if (wpm < 60 || wpm > 220) return 30
  if (wpm < 120) return Math.round(40 + (wpm - 60) * (60 / 60))
  return Math.round(100 - (wpm - 160) * (60 / 60))
}

export async function applySkillUpdates(input: SkillUpdateInput): Promise<SkillUpdateResult> {
  const minutes = Math.max(1, Math.floor(input.durationSeconds / 60))

  // XP formula: 5 XP per minute, +25 if any score ≥70, +50 if all three ≥70.
  let xp = minutes * 5
  const eye = input.averages.eyeContactPct ?? 0
  const posture = input.averages.posture ?? 0
  const pace = paceScore(input.averages.pace) ?? 0
  const goodCount = [eye, posture, pace].filter((v) => v >= 70).length
  if (goodCount >= 1) xp += 25
  if (goodCount === 3) xp += 50
  xp = Math.min(xp, 250) // cap per session

  await (prisma as any).xpTransaction.create({
    data: {
      userId: input.userId,
      amount: xp,
      source: 'extension-mirror',
      sourceId: null,
      metadata: {
        minutes,
        eyeContact: input.averages.eyeContactPct,
        posture: input.averages.posture,
        pace: input.averages.pace,
      },
    },
  })

  // Advance UserGamification — bumps total XP, level (1 per 1000 XP), and
  // streak counter (only if today wasn't already counted).
  const today = new Date().toISOString().slice(0, 10)
  const existing = await (prisma as any).userGamification.findUnique({
    where: { userId: input.userId },
  })
  const lastDay = existing?.lastActivityDate
  const previousStreak = existing?.currentStreak ?? 0
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  let nextStreak = previousStreak
  if (lastDay !== today) {
    nextStreak = lastDay === yesterday ? previousStreak + 1 : 1
  }
  const newTotal = (existing?.totalXp ?? 0) + xp
  const newLevel = Math.max(1, Math.floor(newTotal / 1000) + 1)

  await (prisma as any).userGamification.upsert({
    where: { userId: input.userId },
    update: {
      totalXp: newTotal,
      level: newLevel,
      currentStreak: nextStreak,
      longestStreak: Math.max(existing?.longestStreak ?? 0, nextStreak),
      lastActivityDate: today,
    },
    create: {
      userId: input.userId,
      totalXp: xp,
      level: 1,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
    },
  })

  // Skill baseline advancement — if the user's score for a skill exceeds the
  // intermediate/advanced threshold, advance.
  const baselinesAdvanced: string[] = []
  const triples: Array<[string, number]> = [
    [SKILL_BY_METRIC.eyeContact, eye],
    [SKILL_BY_METRIC.posture, posture],
    [SKILL_BY_METRIC.pace, pace],
  ]
  for (const [skill, score] of triples) {
    if (!score) continue
    const thr = ADVANCE_THRESHOLDS[skill]
    let target: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
    if (score >= thr.advanced) target = 'advanced'
    else if (score >= thr.intermediate) target = 'intermediate'

    const existing = await (prisma as any).skillBaseline.findUnique({
      where: { userId_skillCategory: { userId: input.userId, skillCategory: skill } },
    })
    const RANK: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }
    if (!existing) {
      await (prisma as any).skillBaseline.create({
        data: { userId: input.userId, skillCategory: skill, level: target, selfRating: target },
      })
      if (target !== 'beginner') baselinesAdvanced.push(skill)
    } else if (RANK[target] > RANK[existing.level]) {
      await (prisma as any).skillBaseline.update({
        where: { userId_skillCategory: { userId: input.userId, skillCategory: skill } },
        data: { level: target },
      })
      baselinesAdvanced.push(skill)
    }
  }

  return { xpAwarded: xp, streak: nextStreak, baselinesAdvanced }
}
