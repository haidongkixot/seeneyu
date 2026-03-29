import { NextRequest, NextResponse } from 'next/server'
import { getEngine } from '@/engine/learning-assistant'

/**
 * GET /api/cron/morning
 * Daily morning cycle: analyze + plan + schedule for users in current timezone bracket.
 * Secured by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const engine = getEngine()
    const result = await engine.runMorningCycle()

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
