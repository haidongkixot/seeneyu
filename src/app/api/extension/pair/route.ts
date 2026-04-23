import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkUserRateLimit, EXT_TOKEN_ISSUE_LIMIT } from '@/lib/rate-limit-user'
import { isExtensionEnabled } from '@/lib/extension-id-allowlist'
import { issuePairingCode } from '@/lib/extension-auth'

// Web-only endpoint (no CORS for chrome-extension origins) — called from the
// logged-in seeneyu web app when a user clicks "Connect extension". Returns a
// 6-digit code the user pastes into the extension side panel.
export async function POST(_req: NextRequest) {
  if (!isExtensionEnabled()) {
    return NextResponse.json({ error: 'Extension disabled' }, { status: 503 })
  }

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = checkUserRateLimit({ key: 'ext:pair', userId, ...EXT_TOKEN_ISSUE_LIMIT })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const code = await issuePairingCode(userId)
  return NextResponse.json({ code, expiresInSec: 120 })
}
