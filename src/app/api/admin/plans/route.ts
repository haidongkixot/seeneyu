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

export async function GET() {
  try {
    await requireAdmin()
    const plans = await (prisma as any).plan.findMany({
      orderBy: { monthlyPrice: 'asc' },
      include: { _count: { select: { subscriptions: true } } },
    })
    return NextResponse.json(plans)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const plan = await (prisma as any).plan.create({
      data: {
        slug: body.slug,
        name: body.name,
        tagline: body.tagline || null,
        monthlyPrice: body.monthlyPrice ?? 0,
        annualPrice: body.annualPrice ?? null,
        features: body.features ?? [],
        videoLimitSec: body.videoLimitSec ?? 5,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json(plan, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const plan = await (prisma as any).plan.update({
      where: { id: body.id },
      data: {
        name: body.name,
        tagline: body.tagline,
        monthlyPrice: body.monthlyPrice,
        annualPrice: body.annualPrice,
        features: body.features,
        videoLimitSec: body.videoLimitSec,
        isActive: body.isActive,
      },
    })
    return NextResponse.json(plan)
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
