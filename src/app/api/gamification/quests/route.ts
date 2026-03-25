import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateDailyQuests, getTodayQuests } from '@/services/gamification'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  // Auto-generate quests if none exist for today
  let quests = await getTodayQuests(userId)
  if (quests.length === 0) {
    quests = await generateDailyQuests(userId)
  }

  return NextResponse.json({ quests })
}
