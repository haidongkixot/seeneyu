import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getExtensionCorsHeaders } from '@/lib/extension-cors'
import { isExtensionEnabled } from '@/lib/extension-id-allowlist'
import { getUserFromExtensionRequest } from '@/lib/extension-auth'

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { headers: getExtensionCorsHeaders(req.headers.get('origin')) })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!isExtensionEnabled()) {
    return NextResponse.json({ error: 'Extension disabled' }, { status: 503 })
  }

  // Accept either an extension bearer token or a logged-in NextAuth session.
  let userId: string | null = null
  const ext = await getUserFromExtensionRequest(req)
  if (ext) {
    userId = ext.userId
  } else {
    const session = await getServerSession(authOptions)
    userId = ((session?.user as any)?.id as string) || null
  }
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const row = await (prisma as any).extensionSession.findUnique({
    where: { id: params.id },
  })
  if (!row || row.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ session: row })
}
