import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminId = (session.user as any).id as string
  const { name, seats } = await req.json()

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
  }

  const seatCount = Number(seats) || 5
  if (seatCount < 1 || seatCount > 500) {
    return NextResponse.json({ error: 'Seats must be between 1 and 500' }, { status: 400 })
  }

  const PRICE_PER_SEAT = 8.0

  const team = await (prisma as any).teamPlan.create({
    data: {
      name,
      adminId,
      seats: seatCount,
      pricePerSeat: PRICE_PER_SEAT,
      status: 'active',
    },
  })

  return NextResponse.json({
    teamId: team.id,
    name: team.name,
    seats: team.seats,
    totalPrice: team.seats * team.pricePerSeat,
  })
}
