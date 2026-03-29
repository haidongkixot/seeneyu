import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/mobile-auth'
import { getEngine } from '@/engine/learning-assistant'

/**
 * GET /api/proactive-suggestion
 * Returns Coach Ney's proactive suggestion string for the authenticated user.
 */
export async function GET(req: NextRequest) {
  const authUser = await getUserFromRequest(req)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const engine = getEngine()
    const suggestion = await engine.getProactiveSuggestion(authUser.id)
    return NextResponse.json({ suggestion })
  } catch {
    return NextResponse.json({
      suggestion: 'Ready to practice your body language skills today?',
    })
  }
}
