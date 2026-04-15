/**
 * Cron: clean up recordings for users who opted out of data storage.
 * Schedule: daily at 4 AM UTC (vercel.json)
 *
 * Safety net — most deletions happen immediately after feedback generation.
 * This catches any recordings that slipped through (e.g. server crash mid-feedback).
 */

import { NextResponse } from 'next/server'
import { batchCleanupOptedOutUsers } from '@/services/consent-manager'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await batchCleanupOptedOutUsers()
    console.log(`[consent-cleanup] processed ${result.usersProcessed} users, deleted ${result.recordingsDeleted} recordings`)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[consent-cleanup] error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
