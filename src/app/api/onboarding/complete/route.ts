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

  const { ratings } = parsed.data

  // Upsert one SkillBaseline per skill, then mark user as onboarded
  await db.$transaction([
    ...ratings.map((r: { skillCategory: string; level: string }) =>
      db.skillBaseline.upsert({
        where: { userId_skillCategory: { userId, skillCategory: r.skillCategory } },
        update: { level: r.level, selfRating: r.level },
        create: { userId, skillCategory: r.skillCategory, level: r.level, selfRating: r.level },
      })
    ),
    db.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
    }),
  ])

  return NextResponse.json({ success: true })
}
