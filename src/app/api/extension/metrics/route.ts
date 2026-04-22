import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { checkUserRateLimit, EXT_METRICS_LIMIT } from '@/lib/rate-limit-user'
import { getExtensionCorsHeaders } from '@/lib/extension-cors'
import { isExtensionEnabled } from '@/lib/extension-id-allowlist'
import { getUserFromExtensionRequest } from '@/lib/extension-auth'

const MAX_BODY_BYTES = 1024

// Bounded, zod-validated, no free-text fields.
const PayloadSchema = z
  .object({
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime(),
    durationSeconds: z.number().int().min(1).max(4 * 60 * 60),
    avgEyeContactPct: z.number().min(0).max(100).nullable().optional(),
    avgPostureScore: z.number().min(0).max(100).nullable().optional(),
    avgVocalPaceWpm: z.number().min(0).max(500).nullable().optional(),
    sampleCount: z.number().int().min(1).max(20000),
    clientVersion: z.string().min(1).max(32),
  })
  .strict()

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { headers: getExtensionCorsHeaders(req.headers.get('origin')) })
}

export async function POST(req: NextRequest) {
  const cors = getExtensionCorsHeaders(req.headers.get('origin'))
  if (!isExtensionEnabled()) {
    return NextResponse.json({ error: 'Extension disabled' }, { status: 503, headers: cors })
  }

  const contentLength = Number(req.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413, headers: cors })
  }

  const auth = await getUserFromExtensionRequest(req)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors })
  }

  const rl = checkUserRateLimit({ key: 'ext:metrics', userId: auth.userId, ...EXT_METRICS_LIMIT })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: cors })
  }

  const profile = await (prisma as any).learnerProfile.findUnique({
    where: { userId: auth.userId },
    select: { extensionMetricsOptIn: true },
  })
  if (!profile?.extensionMetricsOptIn) {
    return NextResponse.json({ error: 'Opt-in required' }, { status: 403, headers: cors })
  }

  const raw = await req.json().catch(() => null)
  const parsed = PayloadSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers: cors })
  }

  const startedAt = new Date(parsed.data.startedAt)
  const endedAt = new Date(parsed.data.endedAt)
  if (endedAt <= startedAt) {
    return NextResponse.json({ error: 'Invalid interval' }, { status: 400, headers: cors })
  }

  const row = await (prisma as any).extensionSession.create({
    data: {
      userId: auth.userId,
      startedAt,
      endedAt,
      durationSeconds: parsed.data.durationSeconds,
      avgEyeContactPct: parsed.data.avgEyeContactPct ?? null,
      avgPostureScore: parsed.data.avgPostureScore ?? null,
      avgVocalPaceWpm: parsed.data.avgVocalPaceWpm ?? null,
      sampleCount: parsed.data.sampleCount,
      clientVersion: parsed.data.clientVersion,
    },
    select: { id: true },
  })

  return NextResponse.json({ ok: true, sessionId: row.id }, { headers: cors })
}
