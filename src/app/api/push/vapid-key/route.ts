import { NextResponse } from 'next/server'

/**
 * GET /api/push/vapid-key
 * Returns the public VAPID key so the client can subscribe to push notifications.
 */
export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY

  if (!publicKey) {
    return NextResponse.json(
      { error: 'VAPID public key not configured' },
      { status: 503 }
    )
  }

  return NextResponse.json({ publicKey })
}
