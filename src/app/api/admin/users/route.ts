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

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status')

    const where = statusFilter ? { status: statusFilter } : {}

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        statusNote: true,
        approvedAt: true,
        approvedBy: true,
        createdAt: true,
        _count: { select: { userSessions: true } },
      },
    })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin()
    const { id, role } = await req.json()
    if (!id || !['learner', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    const user = await prisma.user.update({ where: { id }, data: { role } })
    return NextResponse.json({ id: user.id, role: user.role })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
