import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const page = await prisma.cmsPage.findFirst({
      where: { slug: params.slug, status: 'published' },
    })
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(page)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
