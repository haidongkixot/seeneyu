import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { roundId: string } }
) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { prompt, imageUrl, correctAnswer, options, orderIndex } = body

    const updateData: Record<string, unknown> = {}
    if (prompt !== undefined) updateData.prompt = prompt
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer
    if (options !== undefined) updateData.options = options
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const round = await prisma.miniGameRound.update({
      where: { id: params.roundId },
      data: updateData,
    })

    return NextResponse.json(round)
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { roundId: string } }
) {
  try {
    await requireAdmin()

    await prisma.miniGameRound.delete({
      where: { id: params.roundId },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
