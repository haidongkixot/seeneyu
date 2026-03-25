import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processActivity } from '@/services/gamification'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  let body: { activityType: string; sourceId?: string; metadata?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { activityType, sourceId, metadata } = body

  if (!activityType) {
    return NextResponse.json({ error: 'activityType is required' }, { status: 400 })
  }

  const result = await processActivity(userId, activityType, {
    ...metadata,
    sourceId,
  })

  return NextResponse.json(result)
}
