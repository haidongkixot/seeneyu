import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkUserRateLimit, EXT_METRICS_LIMIT } from '@/lib/rate-limit-user'
import { getExtensionCorsHeaders } from '@/lib/extension-cors'
import { isExtensionEnabled } from '@/lib/extension-id-allowlist'
import { getUserFromExtensionRequest } from '@/lib/extension-auth'
import { generateCoachWriteup, type SessionInput } from '@/services/extension-coach'
import { applySkillUpdates } from '@/services/extension-skill-mapper'

const MAX_BODY_BYTES = 64 * 1024 // 64 KB — full time series + nudges

const TimeSeriesPoint = z.object({
  t: z.number().int().min(0).max(60 * 60 * 4),
  eyeContact: z.number().min(0).max(100).nullable().optional(),
  posture: z.number().min(0).max(100).nullable().optional(),
  pace: z.number().min(0).max(500).nullable().optional(),
})

const NudgeRecord = z.object({
  at: z.number().int().min(0).max(60 * 60 * 4),
  pattern: z.string().min(1).max(64),
  headline: z.string().min(1).max(140),
})

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
    timeSeries: z.array(TimeSeriesPoint).max(2000).default([]),
    nudges: z.array(NudgeRecord).max(64).default([]),
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

  const rl = checkUserRateLimit({ key: 'ext:sessions', userId: auth.userId, ...EXT_METRICS_LIMIT })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: cors })
  }

  // Always require opt-in to STORE the session (it would otherwise hold time
  // series data on our backend without explicit consent).
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
    return NextResponse.json(
      { error: 'Invalid payload', detail: parsed.error.issues.slice(0, 3) },
      { status: 400, headers: cors },
    )
  }

  const startedAt = new Date(parsed.data.startedAt)
  const endedAt = new Date(parsed.data.endedAt)
  if (endedAt <= startedAt) {
    return NextResponse.json({ error: 'Invalid interval' }, { status: 400, headers: cors })
  }

  // Create the row first so we always have a record even if Coach Ney fails.
  const created = await (prisma as any).extensionSession.create({
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
      timeSeries: parsed.data.timeSeries as any,
      nudgesShown: parsed.data.nudges as any,
    },
  })

  // Generate Coach Ney write-up (best-effort — falls back to template internally).
  const coachInput: SessionInput = {
    durationSeconds: parsed.data.durationSeconds,
    averages: {
      eyeContactPct: parsed.data.avgEyeContactPct ?? null,
      posture: parsed.data.avgPostureScore ?? null,
      pace: parsed.data.avgVocalPaceWpm ?? null,
    },
    timeSeries: parsed.data.timeSeries.map((p) => ({
      t: p.t,
      eyeContact: p.eyeContact ?? null,
      posture: p.posture ?? null,
      pace: p.pace ?? null,
    })),
    nudges: parsed.data.nudges,
  }
  let coach: Awaited<ReturnType<typeof generateCoachWriteup>> | null = null
  try {
    coach = await generateCoachWriteup(coachInput)
  } catch (err) {
    console.error('[POST /api/extension/sessions] coach failed', err)
  }

  // Award XP + advance skills + update streak.
  let skillResult: Awaited<ReturnType<typeof applySkillUpdates>> | null = null
  try {
    skillResult = await applySkillUpdates({
      userId: auth.userId,
      durationSeconds: parsed.data.durationSeconds,
      averages: coachInput.averages,
    })
  } catch (err) {
    console.error('[POST /api/extension/sessions] skill update failed', err)
  }

  // Persist the coach write-up + xp.
  if (coach || skillResult) {
    await (prisma as any).extensionSession.update({
      where: { id: created.id },
      data: {
        coachHeadline: coach?.headline ?? null,
        coachSummary: coach?.summary ?? null,
        coachWhatWorked: coach?.whatWorked ?? null,
        coachWhatToImprove: coach?.whatToImprove ?? null,
        coachNextSteps: coach?.nextSteps ?? null,
        coachGeneratedAt: coach ? new Date() : null,
        xpAwarded: skillResult?.xpAwarded ?? 0,
      },
    })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://seeneyu.vercel.app'

  return NextResponse.json(
    {
      sessionId: created.id,
      durationSeconds: parsed.data.durationSeconds,
      averages: coachInput.averages,
      coach,
      xpAwarded: skillResult?.xpAwarded ?? 0,
      webUrl: `${baseUrl.replace(/\/$/, '')}/sessions/extension/${created.id}`,
    },
    { headers: cors },
  )
}

// List recent sessions for the authenticated user (used by the web settings page).
export async function GET(req: NextRequest) {
  if (!isExtensionEnabled()) {
    return NextResponse.json({ error: 'Extension disabled' }, { status: 503 })
  }
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rows = await (prisma as any).extensionSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      durationSeconds: true,
      avgEyeContactPct: true,
      avgPostureScore: true,
      avgVocalPaceWpm: true,
      coachHeadline: true,
      coachGeneratedAt: true,
      xpAwarded: true,
    },
  })
  return NextResponse.json({ sessions: rows })
}
