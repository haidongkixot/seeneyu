import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

interface TimelineEntry {
  id: string
  type: 'session' | 'arcade' | 'comment' | 'assistant'
  title: string
  description: string | null
  score: number | null
  createdAt: Date
}

const PAGE_SIZE = 20

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const typeFilter = searchParams.get('type')

    const userId = params.id
    const entries: TimelineEntry[] = []

    // Fetch all types (or filtered) in parallel
    const shouldFetch = (t: string) => !typeFilter || typeFilter === t

    const [sessions, arcadeAttempts, comments, conversations] = await Promise.all([
      shouldFetch('session')
        ? prisma.userSession.findMany({
            where: { userId },
            select: {
              id: true,
              status: true,
              scores: true,
              createdAt: true,
              clip: { select: { movieTitle: true, skillCategory: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      shouldFetch('arcade')
        ? prisma.arcadeAttempt.findMany({
            where: { userId },
            select: {
              id: true,
              score: true,
              createdAt: true,
              challenge: { select: { title: true, type: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      shouldFetch('comment')
        ? prisma.comment.findMany({
            where: { userId },
            select: {
              id: true,
              body: true,
              createdAt: true,
              lesson: { select: { title: true } },
              challenge: { select: { title: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      shouldFetch('assistant')
        ? prisma.assistantConversation.findMany({
            where: { userId },
            select: {
              id: true,
              context: true,
              createdAt: true,
              _count: { select: { messages: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ])

    for (const s of sessions) {
      const scores = s.scores as any
      entries.push({
        id: s.id,
        type: 'session',
        title: `Session: ${s.clip.movieTitle}`,
        description: `${s.clip.skillCategory.replace(/-/g, ' ')} - ${s.status}`,
        score: scores?.overallScore ?? null,
        createdAt: s.createdAt,
      })
    }

    for (const a of arcadeAttempts) {
      entries.push({
        id: a.id,
        type: 'arcade',
        title: `Arcade: ${a.challenge.title}`,
        description: a.challenge.type,
        score: a.score,
        createdAt: a.createdAt,
      })
    }

    for (const c of comments) {
      const target = c.lesson?.title || c.challenge?.title || 'Unknown'
      entries.push({
        id: c.id,
        type: 'comment',
        title: `Comment on ${target}`,
        description: c.body.length > 100 ? c.body.slice(0, 100) + '...' : c.body,
        score: null,
        createdAt: c.createdAt,
      })
    }

    for (const conv of conversations) {
      entries.push({
        id: conv.id,
        type: 'assistant',
        title: `Assistant Chat: ${conv.context}`,
        description: `${conv._count.messages} messages`,
        score: null,
        createdAt: conv.createdAt,
      })
    }

    // Sort chronologically descending
    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Paginate
    const total = entries.length
    const start = (page - 1) * PAGE_SIZE
    const paginated = entries.slice(start, start + PAGE_SIZE)

    return NextResponse.json({
      entries: paginated,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
