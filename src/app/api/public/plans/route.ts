import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const plans = await (prisma as any).plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        monthlyPrice: true,
        annualPrice: true,
        features: true,
        videoLimitSec: true,
        isActive: true,
      },
    })
    return NextResponse.json(plans)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}
