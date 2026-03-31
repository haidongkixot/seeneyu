import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string

  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: { not: 'cancelled' } },
    orderBy: { createdAt: 'desc' },
  })

  if (!subscription) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
    },
  })

  // Downgrade user plan to basic on cancellation
  await prisma.user.update({
    where: { id: userId },
    data: { plan: 'basic' },
  })

  return NextResponse.json({ success: true })
}
