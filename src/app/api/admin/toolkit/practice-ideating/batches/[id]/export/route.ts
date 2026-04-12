import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ideasToMarkdown, type PracticeIdea } from '@/services/practice-ideating/generator'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'batch'
}

/** GET /?format=json|md — download the batch as JSON or Markdown. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const format = (searchParams.get('format') || 'json').toLowerCase()

    const batch = await (prisma as any).practiceIdeaBatch.findUnique({
      where: { id },
    })
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    if (batch.status !== 'complete' || !batch.ideas) {
      return NextResponse.json({ error: 'Batch is not complete yet' }, { status: 400 })
    }

    const ideas = batch.ideas as PracticeIdea[]
    const baseName = slug(batch.name)

    if (format === 'md' || format === 'markdown') {
      const md = ideasToMarkdown(batch.name, ideas)
      return new NextResponse(md, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${baseName}.md"`,
        },
      })
    }

    // default: JSON
    const body = JSON.stringify(ideas, null, 2)
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${baseName}.json"`,
      },
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
