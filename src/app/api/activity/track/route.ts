import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined

  const body = await req.json()
  const { type, metadata } = body as { type: string; metadata?: Record<string, unknown> }

  if (!type) {
    return NextResponse.json({ error: 'type is required' }, { status: 400 })
  }

  await (prisma as any).activityEvent.create({
    data: {
      userId: userId || null,
      type,
      metadata: metadata || null,
    },
  })

  return NextResponse.json({ ok: true })
}
