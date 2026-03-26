/**
 * Arcade bundle seed script for Seeneyu.
 * Run with: npx tsx scripts/seed-arcade.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ChallengeSeed {
  type: string
  title: string
  description: string
  context: string
  difficulty: string
  xpReward: number
  orderIndex: number
}

interface BundleSeed {
  id: string
  title: string
  description: string
  theme: string
  difficulty: string
  xpReward: number
  challenges: ChallengeSeed[]
}

const bundles: BundleSeed[] = [
  {
    id: 'bundle_expression_mastery',
    title: 'Expression Mastery',
    description: 'Master the art of facial expressions. Learn to convey surprise, confidence, and empathy through your face alone.',
    theme: 'expressions',
    difficulty: 'beginner',
    xpReward: 50,
    challenges: [
      {
        type: 'expression',
        title: 'Show Surprise',
        description: 'Demonstrate a genuine surprised expression with raised eyebrows, wide eyes, and an open mouth.',
        context: 'Imagine you just received unexpected great news — a promotion, a surprise party, or an old friend showing up unannounced.',
        difficulty: 'beginner',
        xpReward: 15,
        orderIndex: 0,
      },
      {
        type: 'expression',
        title: 'Show Confidence',
        description: 'Project confidence through your facial expression. Steady gaze, relaxed brow, and a slight knowing smile.',
        context: 'You are about to walk into a big presentation. You know the material inside out and you feel ready.',
        difficulty: 'beginner',
        xpReward: 15,
        orderIndex: 1,
      },
      {
        type: 'expression',
        title: 'Show Empathy',
        description: 'Display genuine empathy. Soft eyes, slight head tilt, gentle expression that says "I understand."',
        context: 'A close friend is telling you about a difficult day at work. You want to show them you truly care and are listening.',
        difficulty: 'beginner',
        xpReward: 20,
        orderIndex: 2,
      },
    ],
  },
  {
    id: 'bundle_voice_and_tone',
    title: 'Voice & Tone',
    description: 'Develop vocal control and expressiveness. Practice commanding presence and empathetic delivery.',
    theme: 'vocal',
    difficulty: 'intermediate',
    xpReward: 75,
    challenges: [
      {
        type: 'vocal',
        title: 'Commanding Voice',
        description: 'Speak with authority and conviction. Project your voice clearly with a steady, lower pitch and deliberate pacing.',
        context: 'You are leading a team meeting and need to rally everyone around a new initiative. Your words should inspire action.',
        difficulty: 'intermediate',
        xpReward: 35,
        orderIndex: 0,
      },
      {
        type: 'vocal',
        title: 'Empathetic Tone',
        description: 'Speak with warmth and understanding. Softer volume, slower pace, and a gentle inflection that conveys care.',
        context: 'You are comforting a colleague who just received disappointing feedback. Your tone should make them feel heard and supported.',
        difficulty: 'intermediate',
        xpReward: 40,
        orderIndex: 1,
      },
    ],
  },
  {
    id: 'bundle_social_scenarios',
    title: 'Social Scenarios',
    description: 'Put your body language skills to the test in realistic social situations. Combine expressions, gestures, and vocal tone.',
    theme: 'scenarios',
    difficulty: 'intermediate',
    xpReward: 100,
    challenges: [
      {
        type: 'scenario',
        title: 'Job Interview',
        description: 'Nail the first impression in a job interview. Combine a confident posture, steady eye contact, and a warm greeting.',
        context: 'You are walking into an interview for your dream role. The interviewer stands up to greet you. Show confidence without arrogance.',
        difficulty: 'intermediate',
        xpReward: 30,
        orderIndex: 0,
      },
      {
        type: 'scenario',
        title: 'Difficult Conversation',
        description: 'Navigate a tough conversation with composure. Stay calm, listen actively, and respond with empathy.',
        context: 'You need to give constructive criticism to a team member whose recent work has been below expectations. Be honest but kind.',
        difficulty: 'intermediate',
        xpReward: 35,
        orderIndex: 1,
      },
      {
        type: 'scenario',
        title: 'Public Speaking',
        description: 'Command the room with open body language, purposeful gestures, and vocal variety.',
        context: 'You are giving a 5-minute talk at a community event. The audience is engaged. Use your entire body to reinforce your message.',
        difficulty: 'advanced',
        xpReward: 35,
        orderIndex: 2,
      },
    ],
  },
]

async function main() {
  console.log('Seeding arcade bundles...')

  for (const bundle of bundles) {
    const created = await (prisma as any).arcadeBundle.upsert({
      where: { id: bundle.id },
      update: {
        title: bundle.title,
        description: bundle.description,
        theme: bundle.theme,
        difficulty: bundle.difficulty,
        xpReward: bundle.xpReward,
      },
      create: {
        id: bundle.id,
        title: bundle.title,
        description: bundle.description,
        theme: bundle.theme,
        difficulty: bundle.difficulty,
        xpReward: bundle.xpReward,
      },
    })

    console.log(`  Bundle: ${created.title} (${created.id})`)

    // Delete existing challenges for this bundle then re-create
    await (prisma as any).arcadeChallenge.deleteMany({
      where: { bundleId: created.id },
    })

    for (const challenge of bundle.challenges) {
      const ch = await (prisma as any).arcadeChallenge.create({
        data: {
          bundleId: created.id,
          type: challenge.type,
          title: challenge.title,
          description: challenge.description,
          context: challenge.context,
          difficulty: challenge.difficulty,
          xpReward: challenge.xpReward,
          orderIndex: challenge.orderIndex,
        },
      })
      console.log(`    Challenge: ${ch.title} (${ch.type})`)
    }
  }

  console.log('\nDone! Seeded', bundles.length, 'bundles with', bundles.reduce((s, b) => s + b.challenges.length, 0), 'challenges.')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
