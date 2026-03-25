import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAssistantLimits, countMessagesToday } from '@/services/assistant-service'

/**
 * GET /api/assistant/conversations?context=X
 * Get conversation history for the current user, optionally filtered by context.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = (session.user as any).id as string

    const { searchParams } = new URL(req.url)
    const context = searchParams.get('context')

    const where: any = { userId }
    if (context) where.context = context

    const conversations = await prisma.assistantConversation.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })

    // Also return usage info
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    })
    const limits = getAssistantLimits(userRecord?.plan || 'basic')
    const todayCount = await countMessagesToday(userId)

    return NextResponse.json({
      conversations,
      usage: {
        messagesUsedToday: todayCount,
        dailyLimit: limits.maxMessagesPerDay,
        voiceEnabled: limits.voiceEnabled,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
