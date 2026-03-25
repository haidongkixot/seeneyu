import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const TIER_THRESHOLDS = [
  { name: 'Diamond', minXp: 50000, color: '#B9F2FF' },
  { name: 'Platinum', minXp: 15000, color: '#E5E4E2' },
  { name: 'Gold', minXp: 5000, color: '#FFD700' },
  { name: 'Silver', minXp: 1000, color: '#C0C0C0' },
  { name: 'Bronze', minXp: 0, color: '#CD7F32' },
] as const

type TierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'

function getTierForXp(totalXp: number): { name: TierName; color: string; minXp: number } {
  for (const tier of TIER_THRESHOLDS) {
    if (totalXp >= tier.minXp) {
      return { name: tier.name as TierName, color: tier.color, minXp: tier.minXp }
    }
  }
  return { name: 'Bronze', color: '#CD7F32', minXp: 0 }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gam = await prisma.userGamification.findUnique({
      where: { userId },
    })

    const totalXp = gam?.totalXp ?? 0
    const tier = getTierForXp(totalXp)

    // Find next tier
    const currentIdx = TIER_THRESHOLDS.findIndex((t) => t.name === tier.name)
    const nextTier = currentIdx > 0 ? TIER_THRESHOLDS[currentIdx - 1] : null

    return NextResponse.json({
      tier: tier.name,
      color: tier.color,
      totalXp,
      nextTier: nextTier
        ? { name: nextTier.name, xpRequired: nextTier.minXp, remaining: nextTier.minXp - totalXp }
        : null,
    })
  } catch (error) {
    console.error('Tier error:', error)
    return NextResponse.json({ error: 'Failed to fetch tier' }, { status: 500 })
  }
}
