import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined

  const bundles = await (prisma as any).arcadeBundle.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { challenges: true } },
    },
  })

  // If logged in, get user's attempt stats per bundle
  let bundleStats: Record<string, { completedCount: number; totalXP: number; streak: number }> = {}
  if (userId) {
    const attempts = await (prisma as any).arcadeAttempt.findMany({
      where: { userId },
      select: { challengeId: true, score: true, challenge: { select: { bundleId: true, xpReward: true } } },
    })

    // Group by bundle: count distinct challenges with score > 0
    const byBundle: Record<string, Set<string>> = {}
    const xpByBundle: Record<string, number> = {}
    for (const a of attempts) {
      const bid = a.challenge.bundleId
      if (!byBundle[bid]) byBundle[bid] = new Set()
      byBundle[bid].add(a.challengeId)
      xpByBundle[bid] = (xpByBundle[bid] || 0) + a.challenge.xpReward
    }
    for (const bid of Object.keys(byBundle)) {
      bundleStats[bid] = {
        completedCount: byBundle[bid].size,
        totalXP: xpByBundle[bid] || 0,
        streak: 0,
      }
    }
  }

  const result = bundles.map((b: any) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    theme: b.theme,
    difficulty: b.difficulty,
    xpReward: b.xpReward,
    challengeCount: b._count.challenges,
    completedCount: bundleStats[b.id]?.completedCount ?? 0,
    totalXP: bundleStats[b.id]?.totalXP ?? 0,
  }))

  return NextResponse.json(result)
}
