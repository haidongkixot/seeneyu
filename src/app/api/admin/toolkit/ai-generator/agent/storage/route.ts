import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const configs = await prisma.cloudStorageConfig.findMany({
    orderBy: { provider: 'asc' },
  })

  // Mask sensitive tokens in the response
  const masked = configs.map(c => ({
    ...c,
    config: maskSensitiveFields(c.config as any),
  }))

  return NextResponse.json(masked)
}

function maskSensitiveFields(config: Record<string, any>): Record<string, any> {
  const masked = { ...config }
  for (const key of ['accessToken', 'refreshToken', 'clientSecret']) {
    if (masked[key]) {
      masked[key] = masked[key].slice(0, 8) + '...' + masked[key].slice(-4)
    }
  }
  return masked
}
