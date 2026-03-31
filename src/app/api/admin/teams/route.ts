import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role as string
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const teams = await (prisma as any).teamPlan.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      admin: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true } },
    },
  })

  return NextResponse.json({ teams })
}
