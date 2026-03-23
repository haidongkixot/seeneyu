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

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = 20
    const skip = (page - 1) * limit

    const [jobs, total] = await Promise.all([
      (prisma as any).crawlJob.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { results: true } } },
      }),
      (prisma as any).crawlJob.count(),
    ])

    return NextResponse.json({ jobs, total, page, pages: Math.ceil(total / limit) })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const userId = (session.user as any).id as string
    const body = await req.json()

    const { name, skillCategory, technique, keywords, difficulty, maxResults } = body
    if (!name || !skillCategory || !keywords?.length) {
      return NextResponse.json({ error: 'name, skillCategory, and keywords are required' }, { status: 400 })
    }

    const job = await (prisma as any).crawlJob.create({
      data: {
        name,
        skillCategory,
        technique: technique || null,
        keywords,
        difficulty: difficulty || null,
        maxResults: maxResults ?? 20,
        status: 'pending',
        createdBy: userId,
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
