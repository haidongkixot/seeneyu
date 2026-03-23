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
  { params }: { params: Promise<{ id: string; resultId: string }> }
) {
  try {
    await requireAdmin()
    const { resultId } = await params
    const body = await req.json()
    const { action, clipMetadata } = body as {
      action: 'approve' | 'reject'
      clipMetadata?: Record<string, unknown>
    }

    const result = await (prisma as any).crawlResult.findUnique({ where: { id: resultId } })
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (action === 'reject') {
      await (prisma as any).crawlResult.update({
        where: { id: resultId },
        data: { status: 'rejected' },
      })
      return NextResponse.json({ status: 'rejected' })
    }

    if (action === 'approve') {
      if (!clipMetadata) {
        return NextResponse.json({ error: 'clipMetadata required for approve' }, { status: 400 })
      }

      // Create the Clip record
      const clip = await prisma.clip.create({
        data: {
          youtubeVideoId: result.youtubeId,
          movieTitle: String(clipMetadata.movieTitle ?? result.title),
          characterName: clipMetadata.characterName ? String(clipMetadata.characterName) : null,
          actorName: clipMetadata.actorName ? String(clipMetadata.actorName) : null,
          year: clipMetadata.year ? Number(clipMetadata.year) : null,
          sceneDescription: String(clipMetadata.sceneDescription ?? result.description.slice(0, 500)),
          skillCategory: String(clipMetadata.skillCategory ?? 'eye-contact'),
          difficulty: String(clipMetadata.difficulty ?? 'intermediate'),
          difficultyScore: Number(clipMetadata.difficultyScore ?? 2),
          signalClarity: Number(clipMetadata.signalClarity ?? 2),
          noiseLevel: Number(clipMetadata.noiseLevel ?? 2),
          contextDependency: Number(clipMetadata.contextDependency ?? 2),
          replicationDifficulty: Number(clipMetadata.replicationDifficulty ?? 2),
          annotation: String(clipMetadata.annotation ?? ''),
          startSec: Number(clipMetadata.startSec ?? 0),
          endSec: Number(clipMetadata.endSec ?? 60),
          screenplaySource: clipMetadata.screenplaySource ? String(clipMetadata.screenplaySource) : null,
          isActive: true,
        },
      })

      // Mark result as approved
      await (prisma as any).crawlResult.update({
        where: { id: resultId },
        data: { status: 'approved', approvedClipId: clip.id },
      })

      // Auto-generate observation guide in the background
      try {
        const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
        await fetch(`${baseUrl}/api/admin/clips/${clip.id}/observation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ internal: true }),
        })
      } catch {
        // Non-blocking — observation guide generation failure should not block approval
      }

      return NextResponse.json({ status: 'approved', clipId: clip.id })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
