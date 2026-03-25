import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard } from '@/toolkit/mini-games'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET /api/public/games/leaderboard/[type] — Top 20 scores for a game type
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params
    const leaderboard = await getLeaderboard(type, 20)

    return NextResponse.json({ leaderboard }, { headers: corsHeaders })
  } catch (err) {
    console.error('Error fetching leaderboard:', err)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500, headers: corsHeaders })
  }
}
