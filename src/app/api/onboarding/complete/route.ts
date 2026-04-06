import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  ratings: z.array(
    z.object({
      skillCategory: z.enum([
        'eye-contact',
        'open-posture',
        'active-listening',
        'vocal-pacing',
        'confident-disagreement',
      ]),
      level: z.enum(['beginner', 'intermediate', 'advanced']),
    })
  ).length(5),
  goal: z.string().optional(),
  genres: z.array(z.string()).optional(),
  purposes: z.array(z.string()).optional(),
  traits: z.array(z.string()).optional(),
  gender: z.string().optional(),
})

const db = prisma as any

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { ratings, goal, genres, purposes, traits, gender } = parsed.data

  // Upsert one SkillBaseline per skill, upsert preferences, then mark user as onboarded
  const txOps = [
    ...ratings.map((r: { skillCategory: string; level: string }) =>
      db.skillBaseline.upsert({
        where: { userId_skillCategory: { userId, skillCategory: r.skillCategory } },
        update: { level: r.level, selfRating: r.level },
        create: { userId, skillCategory: r.skillCategory, level: r.level, selfRating: r.level },
      })
    ),
    db.userPreferences.upsert({
      where: { userId },
      update: {
        goal: goal ?? null,
        genres: genres ?? [],
        purposes: purposes ?? [],
        traits: traits ?? [],
        gender: gender ?? null,
      },
      create: {
        userId,
        goal: goal ?? null,
        genres: genres ?? [],
        purposes: purposes ?? [],
        traits: traits ?? [],
        gender: gender ?? null,
      },
    }),
    db.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
    }),
  ]

  await db.$transaction(txOps)

  return NextResponse.json({ success: true })
}
