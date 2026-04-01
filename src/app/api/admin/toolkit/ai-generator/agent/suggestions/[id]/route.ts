import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const allowedFields = [
    'suggestedProvider',
    'suggestedModel',
    'classification',
    'status',
    'adminNote',
    'publishTargets',
    'mediaType',
  ]
  const data: Record<string, any> = {}
  for (const field of allowedFields) {
    if (field in body) data[field] = body[field]
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const suggestion = await prisma.contentSuggestion.update({
    where: { id },
    data,
  })

  return NextResponse.json(suggestion)
}
