import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { key: string } }
) {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: params.key },
    })
    if (!setting) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(setting)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
