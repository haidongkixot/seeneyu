import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generatePracticeIdeaBatch, type IdeatingConfig } from '@/services/practice-ideating/generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') throw new Error('Unauthorized')
  return session
}

function validateConfig(config: any): IdeatingConfig {
  if (typeof config !== 'object' || config === null) throw new Error('config required')
  const totalCount = Number(config.totalCount)
  if (!Number.isFinite(totalCount) || totalCount < 1 || totalCount > 50) {
    throw new Error('totalCount must be 1-50')
  }
  if (typeof config.skills !== 'object' || config.skills === null) throw new Error('skills required')
  const skillSum = Object.values(config.skills).reduce(
    (acc: number, v: any) => acc + (Number(v) || 0),
    0,
  )
  if (skillSum !== totalCount) {
    throw new Error(`skill counts sum to ${skillSum} but totalCount is ${totalCount}`)
  }
  const mix = config.difficultyMix || { beginner: 40, intermediate: 40, advanced: 20 }
  const mixSum = Number(mix.beginner || 0) + Number(mix.intermediate || 0) + Number(mix.advanced || 0)
  if (mixSum < 99 || mixSum > 101) throw new Error('difficultyMix must sum to 100')
  const stylePixarRatio = Number(config.stylePixarRatio)
  if (!Number.isFinite(stylePixarRatio) || stylePixarRatio < 0 || stylePixarRatio > 100) {
    throw new Error('stylePixarRatio must be 0-100')
  }
  return {
    totalCount,
    skills: config.skills,
    difficultyMix: {
      beginner: Number(mix.beginner) || 0,
      intermediate: Number(mix.intermediate) || 0,
      advanced: Number(mix.advanced) || 0,
    },
    stylePixarRatio,
    tone: String(config.tone || 'positive, humor'),
    language: String(config.language || 'English'),
    characterTheme: (config.characterTheme as any) || 'mixed',
    pmPrompt: String(config.pmPrompt || ''),
  }
}

/** POST — create a new batch and run generation synchronously. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const userId = (session.user as any).id as string

    const body = await req.json()
    const name = String(body.name || '').trim() || `batch-${Date.now()}`
    const config = validateConfig(body.config)

    // Create batch record with status='generating'
    const batch = await (prisma as any).practiceIdeaBatch.create({
      data: {
        name,
        status: 'generating',
        config: config as any,
        count: 0,
        createdBy: userId,
      },
      select: { id: true, name: true, status: true, createdAt: true },
    })

    try {
      const ideas = await generatePracticeIdeaBatch({ config })

      const updated = await (prisma as any).practiceIdeaBatch.update({
        where: { id: batch.id },
        data: {
          status: 'complete',
          ideas: ideas as any,
          count: ideas.length,
        },
        select: { id: true, name: true, status: true, count: true, createdAt: true, updatedAt: true },
      })

      return NextResponse.json({ batch: updated, ideas })
    } catch (err: any) {
      await (prisma as any).practiceIdeaBatch.update({
        where: { id: batch.id },
        data: {
          status: 'failed',
          error: err?.message || 'unknown error',
        },
      })
      return NextResponse.json(
        { error: err?.message || 'Generation failed', batchId: batch.id },
        { status: 500 },
      )
    }
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
