import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkUserRateLimit, EXT_PREFERENCES_LIMIT } from '@/lib/rate-limit-user'
import { getExtensionCorsHeaders } from '@/lib/extension-cors'
import { isExtensionEnabled } from '@/lib/extension-id-allowlist'
import { getUserFromExtensionRequest } from '@/lib/extension-auth'

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const ext = await getUserFromExtensionRequest(req)
  if (ext) return ext.userId
  const session = await getServerSession(authOptions)
  return ((session?.user as any)?.id as string) || null
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { headers: getExtensionCorsHeaders(req.headers.get('origin')) })
}

export async function GET(req: NextRequest) {
  const cors = getExtensionCorsHeaders(req.headers.get('origin'))
  if (!isExtensionEnabled()) {
    return NextResponse.json({ error: 'Extension disabled' }, { status: 503, headers: cors })
  }

  const userId = await resolveUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors })

  const rl = checkUserRateLimit({ key: 'ext:prefs:get', userId, ...EXT_PREFERENCES_LIMIT })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: cors })
  }

  const profile = await (prisma as any).learnerProfile.findUnique({
    where: { userId },
    select: { extensionMetricsOptIn: true, extensionMetricsOptInAt: true },
  })
  return NextResponse.json(
    {
      metricsOptIn: profile?.extensionMetricsOptIn ?? false,
      metricsOptInAt: profile?.extensionMetricsOptInAt ?? null,
    },
    { headers: cors },
  )
}

export async function PUT(req: NextRequest) {
  const cors = getExtensionCorsHeaders(req.headers.get('origin'))
  if (!isExtensionEnabled()) {
    return NextResponse.json({ error: 'Extension disabled' }, { status: 503, headers: cors })
  }

  const userId = await resolveUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors })

  const rl = checkUserRateLimit({ key: 'ext:prefs:put', userId, ...EXT_PREFERENCES_LIMIT })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: cors })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body.metricsOptIn !== 'boolean') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400, headers: cors })
  }

  const updated = await (prisma as any).learnerProfile.upsert({
    where: { userId },
    update: {
      extensionMetricsOptIn: body.metricsOptIn,
      extensionMetricsOptInAt: body.metricsOptIn ? new Date() : null,
    },
    create: {
      userId,
      extensionMetricsOptIn: body.metricsOptIn,
      extensionMetricsOptInAt: body.metricsOptIn ? new Date() : null,
    },
    select: { extensionMetricsOptIn: true, extensionMetricsOptInAt: true },
  })

  return NextResponse.json(
    {
      metricsOptIn: updated.extensionMetricsOptIn,
      metricsOptInAt: updated.extensionMetricsOptInAt,
    },
    { headers: cors },
  )
}
