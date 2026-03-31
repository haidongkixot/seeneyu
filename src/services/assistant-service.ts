import { prisma } from '@/lib/prisma'
import { getAssistantLimits } from '@/lib/access-control'

export { getAssistantLimits }

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
  // Fetch minimal data in parallel — keep fast for Vercel 10s limit
  const [user, progressCount, gamification] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, plan: true },
    }),
    prisma.foundationProgress.count({ where: { userId, quizPassed: true } }),
    prisma.userGamification.findUnique({
      where: { userId },
      select: { totalXp: true, level: true, currentStreak: true },
    }).catch(() => null),
  ])

  // Load context-specific content (single query, only if on a lesson/challenge page)
  let contextContent = ''
  try {
    if (context.startsWith('lesson:')) {
      const lessonId = context.replace('lesson:', '')
      const lesson = await prisma.foundationLesson.findUnique({
        where: { id: lessonId },
        select: { title: true, theoryHtml: true, course: { select: { title: true } } },
      })
      if (lesson) {
        const plainTheory = lesson.theoryHtml.replace(/<[^>]*>/g, '').slice(0, 800)
        contextContent = `\nCurrently viewing: "${lesson.title}" in "${lesson.course.title}"\nContent: ${plainTheory}`
      }
    } else if (context.startsWith('arcade:')) {
      const id = context.replace('arcade:', '')
      const challenge = await prisma.arcadeChallenge.findUnique({
        where: { id },
        select: { title: true, description: true, type: true },
      }).catch(() => null)
      if (challenge) {
        contextContent = `\nCurrently viewing arcade: "${challenge.title}" (${challenge.type})\n${challenge.description}`
      }
    }
  } catch { /* context loading is optional */ }

  const gamStr = gamification
    ? `Level ${gamification.level}, ${gamification.totalXp} XP, ${gamification.currentStreak}-day streak`
    : 'new user'

  return `You are Coach Ney, a friendly body language & communication coach on Seeneyu.

Be warm, specific, concise (2-3 sentences). Reference techniques like eye contact triangles, power poses, vocal pacing.

Learner: ${user?.name || 'Learner'} (${user?.plan || 'basic'} plan, ${progressCount} lessons completed, ${gamStr})
${contextContent}

Guidelines: relate advice to body language skills, suggest specific exercises, don't make up platform features.`
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
    model: 'gpt-4o-mini',
    max_tokens: 300,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-8),
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
