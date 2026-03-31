import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeCommentBody } from '@/lib/sanitize'
import { checkRateLimit } from '@/lib/rate-limit'
import { canPostComments } from '@/lib/access-control'

const COMMENT_SELECT = {
  id: true,
  body: true,
  isHidden: true,
  createdAt: true,
  updatedAt: true,
  parentId: true,
  lessonId: true,
  challengeId: true,
  user: { select: { id: true, name: true } },
}

/**
 * GET /api/comments?lessonId=X or ?challengeId=X
 * Returns threaded comments (top-level with nested replies).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get('lessonId')
    const challengeId = searchParams.get('challengeId')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = 20

    if (!lessonId && !challengeId) {
      return NextResponse.json({ error: 'lessonId or challengeId required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const isAdmin = session && (session.user as any).role === 'admin'

    // Build where clause for top-level comments only
    const where: any = { parentId: null }
    if (lessonId) where.lessonId = lessonId
    if (challengeId) where.challengeId = challengeId
    // Non-admins don't see hidden comments
    if (!isAdmin) where.isHidden = false

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        select: {
          ...COMMENT_SELECT,
          replies: {
            where: isAdmin ? {} : { isHidden: false },
            select: COMMENT_SELECT,
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ])

    return NextResponse.json({ comments, total, page, limit })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/comments
 * Create a comment. Requires auth.
 * Body: { body, lessonId?, challengeId?, parentId? }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = (session.user as any).id as string

    // Plan check — only standard/advanced can post
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
    const userPlan = dbUser?.plan || 'basic'
    if (!canPostComments(userPlan)) {
      return NextResponse.json(
        { error: 'Upgrade to Standard or Advanced plan to post comments', upgradeRequired: true },
        { status: 403 }
      )
    }

    // Rate limit check
    const rl = checkRateLimit(userId)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before posting again.', retryAfterMs: rl.retryAfterMs },
        { status: 429 }
      )
    }

    const json = await req.json()
    const rawBody = json.body as string | undefined
    const lessonId = json.lessonId as string | undefined
    const challengeId = json.challengeId as string | undefined
    const parentId = json.parentId as string | undefined

    if (!rawBody || !rawBody.trim()) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
    }
    if (!lessonId && !challengeId) {
      return NextResponse.json({ error: 'lessonId or challengeId required' }, { status: 400 })
    }

    const body = sanitizeCommentBody(rawBody)

    // If replying, verify parent exists and inherit its lessonId/challengeId
    let data: any = { body, userId }
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } })
      if (!parent) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
      // Replies inherit context from parent (no nested replies — parent must be top-level)
      if (parent.parentId) {
        return NextResponse.json({ error: 'Cannot reply to a reply' }, { status: 400 })
      }
      data.parentId = parentId
      data.lessonId = parent.lessonId
      data.challengeId = parent.challengeId
    } else {
      data.lessonId = lessonId ?? null
      data.challengeId = challengeId ?? null
    }

    const comment = await prisma.comment.create({
      data,
      select: {
        ...COMMENT_SELECT,
        replies: { select: COMMENT_SELECT },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
