import { prisma } from '@/lib/prisma'

// ── Plan Limits ──────────────────────────────────────────────────────

interface AssistantLimits {
  maxMessagesPerDay: number // -1 = unlimited
  voiceEnabled: boolean
}

export function getAssistantLimits(plan: string): AssistantLimits {
  switch (plan) {
    case 'advanced':
      return { maxMessagesPerDay: -1, voiceEnabled: true }
    case 'standard':
      return { maxMessagesPerDay: 50, voiceEnabled: true }
    default: // basic
      return { maxMessagesPerDay: 5, voiceEnabled: false }
  }
}

export async function countMessagesToday(userId: string): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  return prisma.assistantMessage.count({
    where: {
      conversation: { userId },
      role: 'user',
      createdAt: { gte: startOfDay },
    },
  })
}

// ── System Prompt Builder ────────────────────────────────────────────

export async function buildSystemPrompt(
  userId: string,
  context: string
): Promise<string> {
  // Fetch user progress summary + full course catalog + gamification
  const [user, foundationProgress, arcadeAttempts, allCourses, gamification] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, plan: true },
    }),
    prisma.foundationProgress.findMany({
      where: { userId },
      select: {
        quizPassed: true,
        quizScore: true,
        lesson: { select: { title: true, slug: true, order: true, course: { select: { title: true, slug: true, order: true } } } },
      },
    }),
    prisma.arcadeAttempt.findMany({
      where: { userId },
      select: {
        score: true,
        challenge: { select: { title: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.foundationCourse.findMany({
      orderBy: { order: 'asc' },
      select: {
        title: true,
        slug: true,
        order: true,
        lessons: {
          orderBy: { order: 'asc' },
          select: { title: true, slug: true, order: true },
        },
      },
    }),
    prisma.userGamification.findUnique({
      where: { userId },
      select: { totalXp: true, level: true, currentStreak: true, longestStreak: true },
    }).catch(() => null),
  ])

  // Try to load context-specific content
  let contextContent = ''
  if (context.startsWith('lesson:')) {
    const lessonId = context.replace('lesson:', '')
    const lesson = await prisma.foundationLesson.findUnique({
      where: { id: lessonId },
      select: { title: true, theoryHtml: true, course: { select: { title: true } } },
    })
    if (lesson) {
      // Strip HTML for the system prompt
      const plainTheory = lesson.theoryHtml.replace(/<[^>]*>/g, '').slice(0, 1500)
      contextContent = `\nThe learner is currently viewing the lesson "${lesson.title}" in the "${lesson.course.title}" course.\nLesson content summary:\n${plainTheory}`
    }
  } else if (context.startsWith('challenge:')) {
    const challengeId = context.replace('challenge:', '')
    const challenge = await prisma.arcadeChallenge.findUnique({
      where: { id: challengeId },
      select: { title: true, description: true, type: true, context: true, difficulty: true },
    })
    if (challenge) {
      contextContent = `\nThe learner is currently viewing the challenge "${challenge.title}" (${challenge.type}, ${challenge.difficulty}).\nChallenge description: ${challenge.description}\nContext: ${challenge.context}`
    }
  }

  // Build progress summary
  const completedLessons = foundationProgress.filter(p => p.quizPassed).length
  const totalLessonsAttempted = foundationProgress.length
  const recentScores = arcadeAttempts.map(a => `${a.challenge.title}: ${a.score}/100`).join(', ')

  // Build course catalog with progress
  const completedSlugs = new Set(
    foundationProgress.filter(p => p.quizPassed).map(p => `${p.lesson.course.slug}/${p.lesson.slug}`)
  )
  const courseMap = allCourses.map(c => {
    const lessonStatus = c.lessons.map(l => {
      const done = completedSlugs.has(`${c.slug}/${l.slug}`)
      return `  ${done ? '✅' : '⬜'} ${l.title}`
    }).join('\n')
    const completed = c.lessons.filter(l => completedSlugs.has(`${c.slug}/${l.slug}`)).length
    return `${c.title} (${completed}/${c.lessons.length} done):\n${lessonStatus}`
  }).join('\n\n')

  // Gamification summary
  const gamStr = gamification
    ? `- Level: ${gamification.level} | XP: ${gamification.totalXp} | Streak: ${gamification.currentStreak} days (best: ${gamification.longestStreak})`
    : '- No gamification data yet (new user)'

  return `You are Coach Ney, a friendly and encouraging body language & communication coach for the Seeneyu learning platform.

Your personality:
- Warm, supportive, and specific in your advice
- You reference concrete body language techniques (eye contact triangles, power poses, vocal pacing, micro-expressions)
- You celebrate progress and frame weaknesses as growth opportunities
- Keep responses concise (2-4 sentences for simple questions, up to a paragraph for detailed explanations)
- Use natural, conversational language — not overly formal

About the learner:
- Name: ${user?.name || 'Learner'}
- Plan: ${user?.plan || 'basic'}
- Foundation lessons completed: ${completedLessons} (out of ${totalLessonsAttempted} attempted)
${gamStr}
${recentScores ? `- Recent arcade scores: ${recentScores}` : '- No arcade attempts yet'}

Available courses & learner progress:
${courseMap || '(No courses in the system yet)'}
${contextContent}

Guidelines:
- Always relate advice back to body language and communication skills
- If asked about non-relevant topics, gently redirect to communication coaching
- Suggest specific exercises or techniques when giving advice
- Reference the current lesson/challenge content when relevant
- When asked about learning path, use the course catalog above to recommend what to do next
- Never make up information about the platform or its features`
}

// ── OpenAI Integrations ──────────────────────────────────────────────

async function getOpenAI() {
  const { default: OpenAI } = await import('openai')
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function generateResponse(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  systemPrompt: string
): Promise<string> {
  const openai = await getOpenAI()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 500,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  })

  return response.choices[0]?.message?.content ?? 'I apologize, I could not generate a response. Please try again.'
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const openai = await getOpenAI()

  // Create a File-like object for the API
  const file = new File([new Uint8Array(audioBuffer)], 'audio.webm', { type: 'audio/webm' })

  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
  })

  return transcription.text
}

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const openai = await getOpenAI()

  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
  })

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ── Suggestion Generator ─────────────────────────────────────────────

export function getSuggestions(context: string): string[] {
  if (context.startsWith('lesson:')) {
    return [
      'Explain this technique',
      'Tips for practice',
      'Review my last attempt',
      'What should I focus on?',
    ]
  }
  if (context.startsWith('challenge:')) {
    return [
      'How do I do this expression?',
      'Tips for this challenge',
      'What am I doing wrong?',
      'How can I improve?',
    ]
  }
  return [
    'What should I learn first?',
    'Give me a quick tip',
    'How does body language coaching work?',
  ]
}
