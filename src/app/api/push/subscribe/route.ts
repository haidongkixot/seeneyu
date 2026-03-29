import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/mobile-auth'

/**
 * POST /api/push/subscribe
 * Register a push subscription for the authenticated user.
 */
export async function POST(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { endpoint, keys } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Missing endpoint or keys (p256dh, auth)' },
        { status: 400 }
      )
    }

    // Upsert: if the endpoint already exists for this user, update keys
    const existing = await prisma.pushSubscription.findFirst({
      where: { userId: authUser.id, endpoint },
    })

    if (existing) {
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { keys },
      })
    } else {
      await prisma.pushSubscription.create({
        data: {
          userId: authUser.id,
          endpoint,
          keys,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
