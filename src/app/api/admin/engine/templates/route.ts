import { NextRequest, NextResponse } from 'next/server'
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
    const templates = await prisma.notificationTemplate.findMany({
      orderBy: { triggerType: 'asc' },
    })
    return NextResponse.json({ templates })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { id, slug, triggerType, channel, subject, title, bodyText, variables, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const updated = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(triggerType !== undefined && { triggerType }),
        ...(channel !== undefined && { channel }),
        ...(subject !== undefined && { subject }),
        ...(title !== undefined && { title }),
        ...(bodyText !== undefined && { body: bodyText }),
        ...(variables !== undefined && { variables }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ template: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
