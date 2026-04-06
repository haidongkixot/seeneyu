import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLeaderboard, getUserRank, getWeekPeriod } from '@/services/gamification/leaderboard-updater'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'weekly_xp'
    const periodParam = searchParams.get('period') || 'current'

    const period = periodParam === 'current' ? getWeekPeriod() : periodParam

    const entries = await getLeaderboard(type, period)

    // Try to get current user's rank
    let userRank: number | null = null
    const session = await getServerSession(authOptions)
    const currentUserId = (session?.user as any)?.id
    if (currentUserId) {
      userRank = await getUserRank(currentUserId, type, period)
    }

    return NextResponse.json({
      type,
      period,
      entries,
      userRank,
      userId: currentUserId ?? null,
    })
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
