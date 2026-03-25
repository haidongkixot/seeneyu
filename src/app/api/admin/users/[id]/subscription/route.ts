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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const subscription = await prisma.subscription.findFirst({
      where: { userId: params.id, status: 'active' },
      include: { plan: true },
      orderBy: { startDate: 'desc' },
    })

    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
    })

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { plan: true },
    })

    return NextResponse.json({
      subscription,
      plans,
      currentPlanSlug: user?.plan || 'basic',
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const { planSlug } = await req.json()

    if (!planSlug) {
      return NextResponse.json({ error: 'planSlug required' }, { status: 400 })
    }

    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Update user's plan field
    await prisma.user.update({
      where: { id: params.id },
      data: { plan: planSlug },
    })

    // Cancel existing active subscription
    await prisma.subscription.updateMany({
      where: { userId: params.id, status: 'active' },
      data: { status: 'cancelled', cancelledAt: new Date() },
    })

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: params.id,
        planId: plan.id,
        status: 'active',
        period: 'monthly',
        startDate: new Date(),
      },
      include: { plan: true },
    })

    return NextResponse.json(subscription)
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
