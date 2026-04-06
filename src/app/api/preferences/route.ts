import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const db = prisma as any

const DEFAULTS = {
  goal: null,
  genres: [],
  purposes: [],
  traits: [],
  gender: null,
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  const prefs = await db.userPreferences.findUnique({ where: { userId } })
  if (!prefs) {
    return NextResponse.json(DEFAULTS)
  }

  return NextResponse.json({
    goal: prefs.goal,
    genres: prefs.genres ?? [],
    purposes: prefs.purposes ?? [],
    traits: prefs.traits ?? [],
    gender: prefs.gender,
  })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  const body = await req.json()
  const { goal, genres, purposes, traits, gender } = body

  const data: Record<string, unknown> = {}
  if (goal !== undefined) data.goal = goal
  if (genres !== undefined) data.genres = genres
  if (purposes !== undefined) data.purposes = purposes
  if (traits !== undefined) data.traits = traits
  if (gender !== undefined) data.gender = gender

  const updated = await db.userPreferences.upsert({
    where: { userId },
    update: data,
    create: { userId, ...DEFAULTS, ...data },
  })

  return NextResponse.json({
    goal: updated.goal,
    genres: updated.genres ?? [],
    purposes: updated.purposes ?? [],
    traits: updated.traits ?? [],
    gender: updated.gender,
  })
}
