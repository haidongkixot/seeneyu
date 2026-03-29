import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const bundles = [
  {
    title: 'Expression King: Emotion Mastery',
    description: 'Master the art of conveying complex emotions through facial expressions. Each challenge tests your ability to precisely replicate advanced emotional states.',
    theme: 'Expression King',
    difficulty: 'intermediate',
    xpReward: 100,
    challenges: [
      { type: 'facial', title: 'The Diplomatic Smile', description: 'Show a polite but restrained smile — warm enough to be welcoming, but controlled enough to maintain authority.', context: 'You are a senior executive greeting investors at a formal dinner. You need to appear approachable yet commanding.', difficulty: 'intermediate', xpReward: 25 },
      { type: 'facial', title: 'Controlled Fury', description: 'Display contained anger — tightened jaw, narrowed eyes, but no outburst. The kind of anger that commands respect through restraint.', context: 'A colleague has just taken credit for your work in front of the CEO. You must show displeasure without losing composure.', difficulty: 'advanced', xpReward: 30 },
      { type: 'facial', title: 'Genuine Surprise to Delight', description: 'Transition from genuine surprise (raised eyebrows, open mouth) to pure delight (wide smile, crinkled eyes) in one fluid motion.', context: 'Your team just completed the impossible project two weeks early. Show the emotional journey from shock to joy.', difficulty: 'intermediate', xpReward: 25 },
      { type: 'facial', title: 'The Empathetic Listener', description: 'Show deep empathy — soft eyes, slightly tilted head, gentle concerned expression. Your face should say "I truly understand your pain."', context: 'A close friend is sharing a difficult personal story. Your expression should make them feel heard and supported.', difficulty: 'beginner', xpReward: 20 },
      { type: 'facial', title: 'Skeptical but Curious', description: 'One eyebrow raised, slight head tilt, the hint of a smirk. You doubt what you hear but find it intriguing.', context: 'Someone is pitching you a wild business idea. You are not convinced, but something catches your attention.', difficulty: 'intermediate', xpReward: 25 },
    ],
  },
  {
    title: 'Expression King: Power & Presence',
    description: 'Develop the facial expressions and body language that communicate authority, confidence, and leadership presence in professional settings.',
    theme: 'Expression King',
    difficulty: 'advanced',
    xpReward: 150,
    challenges: [
      { type: 'facial', title: 'The Boardroom Stare', description: 'Project calm authority with a steady gaze, relaxed but firm jaw, and minimal blinking. This is the look that silences a room.', context: 'You are the CEO about to deliver a critical decision. Everyone is watching. Your face must radiate unshakeable confidence.', difficulty: 'advanced', xpReward: 30 },
      { type: 'facial', title: 'Gracious Victory', description: 'Show winning without gloating — a modest smile, warm eyes, slight nod of acknowledgment. Humble triumph.', context: 'You just won a major contract over three competitors. The losers are in the room. Win with grace.', difficulty: 'intermediate', xpReward: 25 },
      { type: 'facial', title: 'The Thoughtful Pause', description: 'Display deep contemplation — eyes slightly unfocused, lips pressed together, chin slightly raised. Processing something profound.', context: 'A journalist asks a provocative question. Take a deliberate pause that shows serious thought, not scrambling.', difficulty: 'intermediate', xpReward: 25 },
      { type: 'facial', title: 'Warm Authority', description: 'Combine a genuine smile with steady eye contact and open posture. Be approachable AND commanding simultaneously.', context: 'You are a new team leader meeting your team for the first time. They need to trust you AND respect your authority.', difficulty: 'advanced', xpReward: 35 },
      { type: 'facial', title: 'The Negotiator Face', description: 'Neutral but engaged — no tells, no emotion leaking. Interested eyes, relaxed mouth, poker face with just enough warmth.', context: 'You are in a high-stakes negotiation. Every micro-expression could cost you millions. Show nothing, reveal nothing.', difficulty: 'advanced', xpReward: 35 },
    ],
  },
  {
    title: 'Expression King: Social Intelligence',
    description: 'Master the subtle expressions that build rapport, defuse tension, and create connection in everyday social situations.',
    theme: 'Expression King',
    difficulty: 'beginner',
    xpReward: 75,
    challenges: [
      { type: 'facial', title: 'The Encouraging Nod', description: 'Show active encouragement — gentle smile, rhythmic nodding, eyes focused on the speaker. Make someone feel their words matter.', context: 'A shy new colleague is presenting their first idea to the team. Your expression should give them confidence.', difficulty: 'beginner', xpReward: 15 },
      { type: 'facial', title: 'Playful Disbelief', description: 'Wide eyes, raised eyebrows, open-mouthed smile — the "No way!" face. Express amazement with a touch of humor.', context: 'Your best friend just told you they are moving to Paris to become a pastry chef. You are shocked but delighted.', difficulty: 'beginner', xpReward: 15 },
      { type: 'facial', title: 'The Comforting Presence', description: 'Soft eyes, slight downturn of lips showing concern, open and calm face. Without words, say "Everything will be okay."', context: 'A child has fallen and scraped their knee. Before you even speak, your face should calm them.', difficulty: 'beginner', xpReward: 15 },
      { type: 'facial', title: 'Conspiratorial Glee', description: 'A sly grin, twinkling eyes, slightly raised cheeks — the "we share a secret" look that creates instant bonding.', context: 'You and a colleague just witnessed the boss trip over his briefcase. Exchange a look that says it all without a word.', difficulty: 'intermediate', xpReward: 20 },
      { type: 'facial', title: 'Grateful Recognition', description: 'Express deep, heartfelt gratitude — slightly watery eyes, pressed-lip smile, slow blink. Beyond a simple thank-you.', context: 'A mentor who changed your life is being honored at a ceremony. When they look at you, show what their guidance meant.', difficulty: 'intermediate', xpReward: 20 },
    ],
  },
]

async function main() {
  for (const b of bundles) {
    const bundle = await prisma.arcadeBundle.create({
      data: {
        title: b.title,
        description: b.description,
        theme: b.theme,
        difficulty: b.difficulty,
        xpReward: b.xpReward,
      },
    })
    console.log(`Created bundle: ${bundle.title}`)

    for (let i = 0; i < b.challenges.length; i++) {
      const c = b.challenges[i]
      await prisma.arcadeChallenge.create({
        data: {
          bundleId: bundle.id,
          type: c.type,
          title: c.title,
          description: c.description,
          context: c.context,
          difficulty: c.difficulty,
          xpReward: c.xpReward,
          orderIndex: i + 1,
        },
      })
      console.log(`  [${i + 1}] ${c.title}`)
    }
  }

  console.log('\nDone! Created 3 Expression King bundles with 15 challenges.')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect() })
