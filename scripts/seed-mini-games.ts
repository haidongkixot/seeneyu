/**
 * Seed script for Mini-Games data.
 *
 * Creates 5 games with rounds:
 * - guess_expression: 20 rounds — identify the expression from a description
 * - match_expression: 15 rounds — match description to one of 4 options
 * - expression_king: 10 rounds — challenge prompts to perform expressions
 * - emotion_timeline: 15 rounds — arrange emotions in chronological order
 * - spot_the_signal: 20 rounds — identify body language signals in scenarios
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

  // ── 4. Emotion Timeline ──────────────────────────────────────────────────
  const timelineGame = await prisma.miniGame.upsert({
    where: { type: 'emotion_timeline' },
    update: {},
    create: {
      type: 'emotion_timeline',
      title: 'Emotion Timeline',
      description: 'Arrange emotions in the correct chronological order as they unfold in real-life scenarios. Learn how emotional progression works in body language.',
      isActive: true,
      config: { timePerRound: 20, totalRounds: 8, passingScore: 60 },
    },
  })

  const timelineRounds = [
    {
      prompt: 'A job candidate walks into an interview room and meets the panel for the first time.',
      correctAnswer: JSON.stringify(['Anxiety', 'Forced smile', 'Self-soothing touch', 'Gradual relaxation', 'Genuine engagement']),
      options: ['Genuine engagement', 'Anxiety', 'Self-soothing touch', 'Forced smile', 'Gradual relaxation'],
    },
    {
      prompt: 'A student receives their exam results in front of classmates — they failed.',
      correctAnswer: JSON.stringify(['Anticipation', 'Shock', 'Embarrassment', 'Sadness', 'Withdrawal']),
      options: ['Shock', 'Withdrawal', 'Anticipation', 'Sadness', 'Embarrassment'],
    },
    {
      prompt: 'Two strangers meet at a party, discover they share a rare hobby, and become fast friends.',
      correctAnswer: JSON.stringify(['Polite distance', 'Curiosity', 'Surprise recognition', 'Enthusiastic gesturing', 'Mirrored posture']),
      options: ['Mirrored posture', 'Polite distance', 'Enthusiastic gesturing', 'Curiosity', 'Surprise recognition'],
    },
    {
      prompt: 'A manager calls an employee into their office to discuss a serious mistake.',
      correctAnswer: JSON.stringify(['Dread', 'Defensive posture', 'Guilt recognition', 'Acceptance', 'Determination']),
      options: ['Acceptance', 'Dread', 'Determination', 'Defensive posture', 'Guilt recognition'],
    },
    {
      prompt: 'A person watches a surprise birthday party unfold for them as they walk through the door.',
      correctAnswer: JSON.stringify(['Confusion', 'Startle response', 'Wide-eyed surprise', 'Joyful tears', 'Grateful embracing']),
      options: ['Wide-eyed surprise', 'Grateful embracing', 'Confusion', 'Joyful tears', 'Startle response'],
    },
    {
      prompt: 'A couple has a disagreement at a restaurant that escalates and then resolves.',
      correctAnswer: JSON.stringify(['Tense silence', 'Aggressive leaning forward', 'Crossed arms', 'Softening gaze', 'Reaching for hand']),
      options: ['Crossed arms', 'Reaching for hand', 'Tense silence', 'Softening gaze', 'Aggressive leaning forward'],
    },
    {
      prompt: 'A child performs on stage for the first time in a school play.',
      correctAnswer: JSON.stringify(['Stage fright', 'Frozen posture', 'Tentative first line', 'Growing confidence', 'Proud beaming']),
      options: ['Proud beaming', 'Stage fright', 'Growing confidence', 'Frozen posture', 'Tentative first line'],
    },
    {
      prompt: 'An athlete receives a gold medal at a championship ceremony.',
      correctAnswer: JSON.stringify(['Disbelief', 'Trembling lip', 'Tears of joy', 'Fist pump celebration', 'Humble gratitude']),
      options: ['Tears of joy', 'Humble gratitude', 'Disbelief', 'Fist pump celebration', 'Trembling lip'],
    },
    {
      prompt: 'A person gets caught telling a lie by their close friend.',
      correctAnswer: JSON.stringify(['Micro-expression of fear', 'Gaze aversion', 'Nervous laughter', 'Shame display', 'Apologetic posture']),
      options: ['Shame display', 'Micro-expression of fear', 'Apologetic posture', 'Gaze aversion', 'Nervous laughter'],
    },
    {
      prompt: 'A doctor delivers unexpected good news to a patient who feared the worst.',
      correctAnswer: JSON.stringify(['Bracing tension', 'Held breath', 'Confusion processing', 'Relief collapse', 'Elated disbelief']),
      options: ['Relief collapse', 'Bracing tension', 'Elated disbelief', 'Held breath', 'Confusion processing'],
    },
    {
      prompt: 'A negotiator makes a deal that saves a project from cancellation.',
      correctAnswer: JSON.stringify(['Poker face composure', 'Subtle lip press', 'Controlled nodding', 'Suppressed smile', 'Handshake with full grip']),
      options: ['Suppressed smile', 'Poker face composure', 'Handshake with full grip', 'Subtle lip press', 'Controlled nodding'],
    },
    {
      prompt: 'A teenager tells their parents they want to drop out of school.',
      correctAnswer: JSON.stringify(['Nervous fidgeting', 'Averted eyes', 'Rushed speech', 'Defensive stance', 'Pleading expression']),
      options: ['Defensive stance', 'Nervous fidgeting', 'Pleading expression', 'Averted eyes', 'Rushed speech'],
    },
    {
      prompt: 'A person witnesses a stranger collapse on the street.',
      correctAnswer: JSON.stringify(['Freeze response', 'Wide-eyed alarm', 'Looking around for help', 'Rushing forward', 'Focused determination']),
      options: ['Rushing forward', 'Freeze response', 'Focused determination', 'Wide-eyed alarm', 'Looking around for help'],
    },
    {
      prompt: 'A new employee joins their first team meeting at a prestigious company.',
      correctAnswer: JSON.stringify(['Tight smile', 'Minimal space occupation', 'Active listening lean', 'First tentative comment', 'Relaxed contribution']),
      options: ['Active listening lean', 'Tight smile', 'Relaxed contribution', 'Minimal space occupation', 'First tentative comment'],
    },
    {
      prompt: 'A person opens a gift they secretly dislike but must appear grateful.',
      correctAnswer: JSON.stringify(['Genuine anticipation', 'Micro-expression of disappointment', 'Quick recovery smile', 'Exaggerated gratitude', 'Gaze avoidance']),
      options: ['Quick recovery smile', 'Genuine anticipation', 'Gaze avoidance', 'Micro-expression of disappointment', 'Exaggerated gratitude'],
    },
  ]

  for (let i = 0; i < timelineRounds.length; i++) {
    const r = timelineRounds[i]
    await prisma.miniGameRound.create({
      data: {
        gameId: timelineGame.id,
        orderIndex: i,
        prompt: r.prompt,
        correctAnswer: r.correctAnswer,
        imageUrl: null,
        options: r.options,
      },
    })
  }
  console.log(`  Created ${timelineRounds.length} rounds for emotion_timeline`)

  // ── 5. Spot the Signal ──────────────────────────────────────────────────
  const signalGame = await prisma.miniGame.upsert({
    where: { type: 'spot_the_signal' },
    update: {},
    create: {
      type: 'spot_the_signal',
      title: 'Spot the Signal',
      description: 'Read scenario descriptions and identify the specific body language signal being demonstrated. Test your observation skills with progressively harder challenges!',
      isActive: true,
      config: { timePerRound: 8, totalRounds: 12, passingScore: 50 },
    },
  })

  const signalRounds = [
    // Easy
    {
      prompt: 'During a meeting, your colleague crosses their arms tightly across their chest, leans back in their chair, and avoids eye contact while the manager discusses upcoming changes.',
      correctAnswer: 'Defensive resistance',
      options: ['Defensive resistance', 'Physical coldness', 'Boredom', 'Confidence'],
    },
    {
      prompt: 'A friend tells you about their vacation plans while their eyes light up, their hands move expressively, and they lean toward you with an open posture.',
      correctAnswer: 'Genuine enthusiasm',
      options: ['Nervousness', 'Genuine enthusiasm', 'Impatience', 'Seeking approval'],
    },
    {
      prompt: 'The speaker at a conference grips the podium with both hands, shifts their weight from foot to foot, and repeatedly touches their collar.',
      correctAnswer: 'Stage fright / anxiety',
      options: ['Authority display', 'Stage fright / anxiety', 'Preparation to leave', 'Disagreement with audience'],
    },
    {
      prompt: 'Your boss nods slowly while you present your idea, maintains steady eye contact, and steeples their fingers in front of their chin.',
      correctAnswer: 'Evaluative interest',
      options: ['Impatience', 'Confusion', 'Evaluative interest', 'Dismissal'],
    },
    {
      prompt: 'A customer service agent keeps a flat expression, speaks in a monotone, and repeatedly glances at the clock on the wall.',
      correctAnswer: 'Emotional exhaustion / disengagement',
      options: ['Professional composure', 'Emotional exhaustion / disengagement', 'Active listening', 'Time management awareness'],
    },
    // Medium
    {
      prompt: 'During a negotiation, the other party suddenly uncrosses their legs, shifts forward in their seat, and places both palms flat on the table.',
      correctAnswer: 'Readiness to agree',
      options: ['Aggression warning', 'Readiness to agree', 'Deception attempt', 'Fatigue'],
    },
    {
      prompt: 'While telling you a story, your friend briefly touches their nose, breaks eye contact to the left, and increases their speaking pace slightly.',
      correctAnswer: 'Possible deception cues',
      options: ['Allergic reaction', 'Possible deception cues', 'Excitement about the story', 'Trying to remember details'],
    },
    {
      prompt: 'In a group conversation, one person mirrors the posture of the speaker, tilts their head slightly, and maintains a gentle smile throughout.',
      correctAnswer: 'Active rapport building',
      options: ['Mimicry for manipulation', 'Active rapport building', 'Submissive behavior', 'Boredom masking'],
    },
    {
      prompt: 'After receiving feedback, your coworker smiles with their mouth but their eyebrows pull together briefly and their jaw muscles tighten.',
      correctAnswer: 'Masked displeasure',
      options: ['Genuine appreciation', 'Masked displeasure', 'Physical pain', 'Concentration'],
    },
    {
      prompt: 'Your friend describes their new relationship while unconsciously touching their neck, speaking faster than usual, and looking down with a slight smile.',
      correctAnswer: 'Nervous vulnerability',
      options: ['Nervous vulnerability', 'Deceptive storytelling', 'Boredom', 'Physical discomfort'],
    },
    {
      prompt: 'During a team lunch, one person sits with their chair pushed slightly back from the table, their body angled away from the group, and they check their phone frequently.',
      correctAnswer: 'Social exclusion or self-isolation',
      options: ['Multitasking efficiently', 'Social exclusion or self-isolation', 'Waiting for an important call', 'Introvert recharging'],
    },
    {
      prompt: 'A child hides behind their parent\'s leg, peeks out briefly at a stranger, then quickly retreats again while gripping the parent\'s clothing.',
      correctAnswer: 'Approach-avoidance conflict',
      options: ['Playful peek-a-boo', 'Approach-avoidance conflict', 'Shyness without fear', 'Attention seeking'],
    },
    // Hard
    {
      prompt: 'During a first date, the person across from you aligns their feet toward the door, angles their torso slightly away, but maintains eye contact and laughs at your jokes.',
      correctAnswer: 'Feet-first discomfort leak',
      options: ['Full engagement', 'Feet-first discomfort leak', 'Playful teasing posture', 'Relaxed confidence'],
    },
    {
      prompt: 'A witness being questioned blinks rapidly, swallows hard, then freezes completely still for about two seconds before answering in an overly measured tone.',
      correctAnswer: 'Fight-or-flight freeze response',
      options: ['Careful recollection', 'Fight-or-flight freeze response', 'Respectful consideration', 'Physical fatigue'],
    },
    {
      prompt: 'In a photo, a politician shakes hands with a rival. Their left hand grips the rival\'s elbow, their body is angled to face the cameras, and their smile shows both upper and lower teeth.',
      correctAnswer: 'Dominance and control display',
      options: ['Genuine warmth', 'Dominance and control display', 'Nervous overcompensation', 'Cultural greeting custom'],
    },
    {
      prompt: 'While listening to a presentation, a participant\'s pupils dilate noticeably, they lean forward almost imperceptibly, and their breathing becomes slightly shallower.',
      correctAnswer: 'Intense cognitive interest',
      options: ['Drowsiness onset', 'Intense cognitive interest', 'Onset of anxiety attack', 'Vision adjustment to lighting'],
    },
    {
      prompt: 'When asked about their weekend, your colleague\'s face briefly flashes a micro-expression — eyebrows pull up and together for less than a second — before they say "It was fine."',
      correctAnswer: 'Suppressed sadness micro-expression',
      options: ['Genuine contentment', 'Suppressed sadness micro-expression', 'Thinking gesture', 'Muscle twitch'],
    },
    {
      prompt: 'In a heated debate, one participant suddenly drops their voice to nearly a whisper, slows their speech dramatically, and holds completely still.',
      correctAnswer: 'Controlled intensity / power move',
      options: ['Losing their train of thought', 'Controlled intensity / power move', 'Admitting defeat', 'Voice fatigue'],
    },
    {
      prompt: 'At the end of a job interview, the interviewer stands up quickly, extends a firm handshake, and walks you to the door themselves rather than having the receptionist do it.',
      correctAnswer: 'Positive regard / respect signal',
      options: ['Rushing you out', 'Positive regard / respect signal', 'Standard corporate protocol', 'Dominance assertion'],
    },
    {
      prompt: 'While presenting quarterly results, the CFO touches their earlobe, clears their throat twice, and shifts the papers on the desk before stating "Numbers look strong this quarter."',
      correctAnswer: 'Stress leakage contradicting verbal message',
      options: ['Habitual mannerism', 'Stress leakage contradicting verbal message', 'Thorough preparation', 'Emphasis technique'],
    },
  ]

  for (let i = 0; i < signalRounds.length; i++) {
    const r = signalRounds[i]
    await prisma.miniGameRound.create({
      data: {
        gameId: signalGame.id,
        orderIndex: i,
        prompt: r.prompt,
        correctAnswer: r.correctAnswer,
        imageUrl: null,
        options: r.options,
      },
    })
  }
  console.log(`  Created ${signalRounds.length} rounds for spot_the_signal`)

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
