import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_AGENT_CONFIG } from '@/engine/content-agent/config'

const SETTINGS_KEY = 'content_agent_config'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const setting = await prisma.siteSettings.findUnique({ where: { key: SETTINGS_KEY } })
  const config = setting
    ? { ...DEFAULT_AGENT_CONFIG, ...(setting.value as any) }
    : DEFAULT_AGENT_CONFIG

  return NextResponse.json(config)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  await prisma.siteSettings.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: body },
    create: { key: SETTINGS_KEY, value: body },
  })

  return NextResponse.json({ ok: true })
}
