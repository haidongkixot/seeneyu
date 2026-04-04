/**
 * Voice Analysis API — server-side audio analysis using Meyda + pitchy.
 * Zero AI API cost.
 *
 * POST { recordingUrl } → VoiceMetrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyzeVoice } from '@/services/voice-analyzer'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { recordingUrl } = body as { recordingUrl?: string }

    if (!recordingUrl) {
      return NextResponse.json({ error: 'recordingUrl is required' }, { status: 400 })
    }

    const startMs = Date.now()
    const metrics = await analyzeVoice(recordingUrl)
    const processingMs = Date.now() - startMs

    return NextResponse.json({ ...metrics, processingMs })
  } catch (err: any) {
    console.error('[voice-analysis] error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
