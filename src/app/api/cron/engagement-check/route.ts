import { NextRequest, NextResponse } from 'next/server'
import { getEngine } from '@/engine/learning-assistant'

/**
 * GET /api/cron/engagement-check
 * Evening engagement check: streak warnings for users who haven't practiced.
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
    const result = await engine.runEveningCycle()

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
