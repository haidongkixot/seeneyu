import { NextRequest, NextResponse } from 'next/server'
import { getEngine } from '@/engine/learning-assistant'

/**
 * GET /api/cron/weekly-report
 * Weekly report: generates and schedules weekly summary emails for active users.
 * Secured by CRON_SECRET. Runs Sundays at 10:00 UTC.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const engine = getEngine()
    const result = await engine.runWeeklyReport()

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
