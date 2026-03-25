/**
 * Seed script for Mini-Games data.
 *
 * Creates 3 games with rounds:
 * - guess_expression: 20 rounds — identify the expression from a description
 * - match_expression: 15 rounds — match description to one of 4 options
 * - expression_king: 10 rounds — challenge prompts to perform expressions
 *
 * Run: npx tsx scripts/seed-mini-games.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding mini-games...')

  // ── 1. Guess the Expression ───────────────────────────────────────────────
  const guessGame = await prisma.miniGame.upsert({
    where: { type: 'guess_expression' },
    update: {},
    create: {
      type: 'guess_expression',
      title: 'Guess the Expression',
      description: 'Look at the image and identify the facial expression. Test your ability to read emotions from faces — a core body language skill.',
      isActive: true,
      config: { timePerRound: 15, totalRounds: 10, passingScore: 70 },
    },
  })

  const guessRounds = [
    { prompt: 'Wide eyes, raised eyebrows, and an open mouth — a reaction to something unexpected.', correctAnswer: 'surprise', imageUrl: '/images/expressions/surprise-1.jpg' },
    { prompt: 'Furrowed brows pulled together, tense jaw, and pressed lips — clear displeasure.', correctAnswer: 'anger', imageUrl: '/images/expressions/anger-1.jpg' },
    { prompt: 'One corner of the mouth slightly raised, with a subtle smirk — a sense of superiority.', correctAnswer: 'contempt', imageUrl: '/images/expressions/contempt-1.jpg' },
    { prompt: 'Nose wrinkled, upper lip raised, and narrowed eyes — something smells terrible.', correctAnswer: 'disgust', imageUrl: '/images/expressions/disgust-1.jpg' },
    { prompt: 'Widened eyes with raised inner eyebrows, slightly open mouth — sensing danger.', correctAnswer: 'fear', imageUrl: '/images/expressions/fear-1.jpg' },
    { prompt: 'Genuine smile with crow\'s feet around the eyes — true joy radiating from the face.', correctAnswer: 'happiness', imageUrl: '/images/expressions/happiness-1.jpg' },
    { prompt: 'Downturned mouth corners, drooping eyelids, and inner eyebrows raised — feeling low.', correctAnswer: 'sadness', imageUrl: '/images/expressions/sadness-1.jpg' },
    { prompt: 'Eyebrows shot up, jaw dropped, hands covering mouth — completely astonished.', correctAnswer: 'surprise', imageUrl: '/images/expressions/surprise-2.jpg' },
    { prompt: 'Tight-lipped smile, eyes not engaged — a polite but insincere expression.', correctAnswer: 'contempt', imageUrl: '/images/expressions/contempt-2.jpg' },
    { prompt: 'Brows lowered and drawn together, staring intently, nostrils flared.', correctAnswer: 'anger', imageUrl: '/images/expressions/anger-2.jpg' },
    { prompt: 'Lower lip pushed up, chin wrinkled, corners of mouth pulled down.', correctAnswer: 'sadness', imageUrl: '/images/expressions/sadness-2.jpg' },
    { prompt: 'Cheeks raised, eyes crinkled, teeth showing — radiating warmth.', correctAnswer: 'happiness', imageUrl: '/images/expressions/happiness-2.jpg' },
    { prompt: 'Eyes wide and darting, mouth slightly open, body tensed — ready to flee.', correctAnswer: 'fear', imageUrl: '/images/expressions/fear-2.jpg' },
    { prompt: 'Upper lip curled, nose bridge wrinkled, tongue slightly out — revulsion.', correctAnswer: 'disgust', imageUrl: '/images/expressions/disgust-2.jpg' },
    { prompt: 'Frozen expression, eyes wide, mouth agape — couldn\'t believe what just happened.', correctAnswer: 'surprise', imageUrl: '/images/expressions/surprise-3.jpg' },
    { prompt: 'Jaw clenched, brows knitted, veins visible — suppressed fury.', correctAnswer: 'anger', imageUrl: '/images/expressions/anger-3.jpg' },
    { prompt: 'Soft smile, head tilted slightly, eyes warm and glistening — deeply moved.', correctAnswer: 'happiness', imageUrl: '/images/expressions/happiness-3.jpg' },
    { prompt: 'Face drained of color, eyes round with dilated pupils, trembling lip.', correctAnswer: 'fear', imageUrl: '/images/expressions/fear-3.jpg' },
    { prompt: 'Asymmetric lip raise with one side of mouth turned up — looking down on someone.', correctAnswer: 'contempt', imageUrl: '/images/expressions/contempt-3.jpg' },
    { prompt: 'Tears welling up, quivering chin, eyebrows drawn together — about to cry.', correctAnswer: 'sadness', imageUrl: '/images/expressions/sadness-3.jpg' },
  ]

  for (let i = 0; i < guessRounds.length; i++) {
    const r = guessRounds[i]
    await prisma.miniGameRound.create({
      data: {
        gameId: guessGame.id,
        orderIndex: i,
        prompt: r.prompt,
        correctAnswer: r.correctAnswer,
        imageUrl: r.imageUrl,
        options: null,
      },
    })
  }
  console.log(`  Created ${guessRounds.length} rounds for guess_expression`)

  // ── 2. Match the Expression ───────────────────────────────────────────────
  const matchGame = await prisma.miniGame.upsert({
    where: { type: 'match_expression' },
    update: {},
    create: {
      type: 'match_expression',
      title: 'Match the Expression',
      description: 'Read the scene description and pick the correct facial expression from four options. Sharpen your emotional intelligence!',
      isActive: true,
      config: { timePerRound: 20, totalRounds: 10, passingScore: 60 },
    },
  })

  const matchRounds = [
    { prompt: 'Your friend just told you they got into their dream university.', correctAnswer: 'happiness', options: ['happiness', 'surprise', 'contempt', 'fear'] },
    { prompt: 'Someone cuts in front of you in a long queue and pretends not to notice.', correctAnswer: 'anger', options: ['sadness', 'anger', 'fear', 'surprise'] },
    { prompt: 'You open a gift and find exactly what you wanted — you had no idea they knew.', correctAnswer: 'surprise', options: ['contempt', 'happiness', 'surprise', 'disgust'] },
    { prompt: 'You see someone mistreating a helpless animal on the street.', correctAnswer: 'disgust', options: ['fear', 'sadness', 'disgust', 'anger'] },
    { prompt: 'You hear a strange noise in a dark, empty house at midnight.', correctAnswer: 'fear', options: ['surprise', 'fear', 'anger', 'contempt'] },
    { prompt: 'A colleague takes credit for your work in front of the entire team.', correctAnswer: 'contempt', options: ['happiness', 'contempt', 'sadness', 'surprise'] },
    { prompt: 'You learn that your childhood pet has passed away.', correctAnswer: 'sadness', options: ['anger', 'disgust', 'fear', 'sadness'] },
    { prompt: 'Someone brags about cheating on an exam and getting the highest score.', correctAnswer: 'contempt', options: ['contempt', 'surprise', 'happiness', 'fear'] },
    { prompt: 'A spider drops onto your desk from the ceiling without warning.', correctAnswer: 'surprise', options: ['sadness', 'anger', 'happiness', 'surprise'] },
    { prompt: 'You taste food that has gone very bad but looked perfectly fine.', correctAnswer: 'disgust', options: ['disgust', 'fear', 'anger', 'surprise'] },
    { prompt: 'Your best friend announces they are moving to another country permanently.', correctAnswer: 'sadness', options: ['happiness', 'sadness', 'contempt', 'anger'] },
    { prompt: 'You are about to give a speech in front of 500 people.', correctAnswer: 'fear', options: ['fear', 'happiness', 'disgust', 'contempt'] },
    { prompt: 'A baby smiles at you on the bus and reaches for your hand.', correctAnswer: 'happiness', options: ['surprise', 'anger', 'happiness', 'sadness'] },
    { prompt: 'Someone deliberately steps on your new shoes and laughs.', correctAnswer: 'anger', options: ['contempt', 'fear', 'sadness', 'anger'] },
    { prompt: 'You find a cockroach in your restaurant meal after eating half of it.', correctAnswer: 'disgust', options: ['surprise', 'disgust', 'fear', 'sadness'] },
  ]

  for (let i = 0; i < matchRounds.length; i++) {
    const r = matchRounds[i]
    await prisma.miniGameRound.create({
      data: {
        gameId: matchGame.id,
        orderIndex: i,
        prompt: r.prompt,
        correctAnswer: r.correctAnswer,
        imageUrl: null,
        options: r.options,
      },
    })
  }
  console.log(`  Created ${matchRounds.length} rounds for match_expression`)

  // ── 3. Expression King ────────────────────────────────────────────────────
  const kingGame = await prisma.miniGame.upsert({
    where: { type: 'expression_king' },
    update: {},
    create: {
      type: 'expression_king',
      title: 'Expression King',
      description: 'Show your best facial expressions! The AI camera will score how well you perform each expression. Pass 5 or more challenges to earn a certificate.',
      isActive: true,
      config: { timePerRound: 30, totalRounds: 7, passingScore: 60 },
    },
  })

  const kingRounds = [
    { prompt: 'Show your best SURPRISE face — imagine you just won the lottery!' },
    { prompt: 'Express CONTEMPT — give a subtle, condescending half-smile.' },
    { prompt: 'Show genuine HAPPINESS — think of the best day of your life!' },
    { prompt: 'Express ANGER — someone just broke your most prized possession.' },
    { prompt: 'Show FEAR — you just saw something terrifying in the shadows.' },
    { prompt: 'Express DISGUST — you just smelled something absolutely horrible.' },
    { prompt: 'Show deep SADNESS — imagine saying goodbye to someone you love.' },
    { prompt: 'Express CONFIDENCE — you are about to walk onto stage as the keynote speaker.' },
    { prompt: 'Show EMPATHY — your friend is telling you about a difficult experience.' },
    { prompt: 'Express SKEPTICISM — someone is telling you a story that sounds completely made up.' },
  ]

  for (let i = 0; i < kingRounds.length; i++) {
    const r = kingRounds[i]
    await prisma.miniGameRound.create({
      data: {
        gameId: kingGame.id,
        orderIndex: i,
        prompt: r.prompt,
        correctAnswer: null,
        imageUrl: null,
        options: null,
      },
    })
  }
  console.log(`  Created ${kingRounds.length} rounds for expression_king`)

  console.log('\nMini-games seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
