/**
 * Page Sections CMS — admin editable content sections.
 * Stores each section as a SiteSettings entry with key prefix "section_".
 *
 * GET — list all sections
 * PUT — update a section by key
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
}

/** GET — list all page sections */
export async function GET() {
  try {
    await requireAdmin()
    const settings = await prisma.siteSettings.findMany({
      where: { key: { startsWith: 'section_' } },
      orderBy: { key: 'asc' },
    })
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

/** PUT — upsert a section */
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin()
    const { key, value } = await req.json()

    if (!key || !key.startsWith('section_')) {
      return NextResponse.json({ error: 'Key must start with section_' }, { status: 400 })
    }

    const setting = await prisma.siteSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json(setting)
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
