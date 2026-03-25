import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory rate limiter: 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  entry.count++
  return entry.count > 10
}

const VALID_LEVELS = ['error', 'warn', 'info']
const VALID_SOURCES = ['api', 'client', 'user-report', 'cron']

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const body = await req.json()
    const { level, source, message, stack, metadata } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const safeLevel = VALID_LEVELS.includes(level) ? level : 'error'
    const safeSource = VALID_SOURCES.includes(source) ? source : 'client'

    await prisma.errorLog.create({
      data: {
        level: safeLevel,
        source: safeSource,
        message: message.slice(0, 5000),
        stack: typeof stack === 'string' ? stack.slice(0, 10000) : null,
        metadata: metadata && typeof metadata === 'object' ? metadata : null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/logs]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
