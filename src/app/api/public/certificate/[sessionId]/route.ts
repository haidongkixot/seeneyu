import { NextRequest, NextResponse } from 'next/server'
import { generateCertificate } from '@/toolkit/mini-games'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET /api/public/certificate/[sessionId] — Certificate data for Expression King
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const certificate = await generateCertificate(sessionId)

    if (!certificate) {
      return NextResponse.json(
        { error: 'No certificate available. Player must complete Expression King with 5+ passed challenges.' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json({ certificate }, { headers: corsHeaders })
  } catch (err) {
    console.error('Error generating certificate:', err)
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500, headers: corsHeaders })
  }
}
