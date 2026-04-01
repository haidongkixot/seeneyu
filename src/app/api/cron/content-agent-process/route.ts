import { NextRequest, NextResponse } from 'next/server'
import { processCompletedJobs } from '@/engine/content-agent'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processCompletedJobs()
    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Content agent processing failed:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
