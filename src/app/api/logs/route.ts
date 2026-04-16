import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Per-IP floor so unauthenticated/system error reports can't spam storage.
const ipRateMap = new Map<string, { count: number; resetAt: number }>()
// Per-user limit for authenticated client-side error reports.
const userRateMap = new Map<string, { count: number; resetAt: number }>()

function isIpLimited(ip: string): boolean {
  const now = Date.now()
  const entry = ipRateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  entry.count++
  return entry.count > 10
}

function isUserLimited(userId: string): boolean {
  const now = Date.now()
  const entry = userRateMap.get(userId)
  if (!entry || now > entry.resetAt) {
    userRateMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return false
  }
  entry.count++
  return entry.count > 60
}

const VALID_LEVELS = ['error', 'warn', 'info']
const VALID_SOURCES = ['api', 'client', 'user-report', 'cron']
const MAX_MESSAGE = 5000
const MAX_STACK = 10_000

function sanitizeMetadata(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== 'object') return null
  const out: Record<string, unknown> = {}
  let count = 0
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (count >= 20) break
    if (typeof k !== 'string' || k.length > 100) continue
    if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) {
      if (typeof v === 'string' && v.length > 500) {
        out[k] = v.slice(0, 500)
      } else {
        out[k] = v
      }
      count++
    }
  }
  return Object.keys(out).length > 0 ? out : null
}

export async function POST(req: NextRequest) {
  try {
    // HIGH-004: Require either a signed-in user OR same-origin CSRF token.
    // Unsigned error reports from other origins are rejected to prevent
    // log-injection / storage-exhaustion abuse.
    const origin = req.headers.get('origin') || ''
    const host = req.headers.get('host') || ''
    const sameOrigin = origin.endsWith(host) || origin === ''

    const authSess = await getServerSession(authOptions)
    const userId = (authSess?.user as any)?.id as string | undefined

    if (!userId && !sameOrigin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isIpLimited(ip)) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }
    if (userId && isUserLimited(userId)) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    const { level, source, message, stack, metadata } = body as {
      level?: unknown; source?: unknown; message?: unknown;
      stack?: unknown; metadata?: unknown;
    }

    if (typeof message !== 'string' || !message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const safeLevel = typeof level === 'string' && VALID_LEVELS.includes(level) ? level : 'error'
    const safeSource = typeof source === 'string' && VALID_SOURCES.includes(source) ? source : 'client'

    const safeMetadata = sanitizeMetadata(metadata)
    await prisma.errorLog.create({
      data: {
        level: safeLevel,
        source: safeSource,
        message: message.slice(0, MAX_MESSAGE),
        stack: typeof stack === 'string' ? stack.slice(0, MAX_STACK) : null,
        metadata: safeMetadata === null ? undefined : (safeMetadata as any),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/logs]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
