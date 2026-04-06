import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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
    const expression = searchParams.get('expression')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = 20

    const where: any = {}
    if (expression) where.expressionLabel = expression

    const [labels, total] = await Promise.all([
      prisma.trainingDataLabel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.trainingDataLabel.count({ where }),
    ])

    return NextResponse.json({
      labels,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin()
    const { submissionId, expressionLabel, confidence } = await req.json()

    if (!submissionId || !expressionLabel || confidence == null) {
      return NextResponse.json(
        { error: 'submissionId, expressionLabel, and confidence required' },
        { status: 400 }
      )
    }

    // Check if label already exists for this submission
    const existing = await prisma.trainingDataLabel.findFirst({
      where: { submissionId },
    })

    let label
    if (existing) {
      // Update with validation
      label = await prisma.trainingDataLabel.update({
        where: { id: existing.id },
        data: {
          expressionLabel,
          confidence,
          validatedBy: (session.user as any).id,
          validatedAt: new Date(),
        },
      })
    } else {
      label = await prisma.trainingDataLabel.create({
        data: {
          submissionId,
          expressionLabel,
          confidence,
        },
      })
    }

    return NextResponse.json(label, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
