import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/mobile-auth'
import { generateDailyQuests, getTodayQuests } from '@/services/gamification'

export async function GET(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = authUser.id

  // Auto-generate quests if none exist for today
  let quests = await getTodayQuests(userId)
  if (quests.length === 0) {
    quests = await generateDailyQuests(userId)
  }

  return NextResponse.json({ quests })
}
