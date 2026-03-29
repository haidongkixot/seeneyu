import { prisma } from '@/lib/prisma'
import { renderTemplate, resolveVariables } from '../templates/template-engine'
import { DEFAULT_ENGINE_CONFIG } from '../core/config'
import type { TriggerType } from '../core/types'

interface MotivationMessage {
  title: string
  body: string
}

/**
 * Selects a motivation message for a given trigger type.
 * Uses NotificationTemplate table with GPT-4o-mini fallback.
 */
export async function selectMotivation(
  userId: string,
  triggerType: TriggerType,
  context?: Record<string, unknown>
): Promise<MotivationMessage> {
  // Try to find a template
  const templates = await prisma.notificationTemplate.findMany({
    where: {
      triggerType,
      channel: 'in_app',
      isActive: true,
      locale: 'en',
    },
  })

  if (templates.length > 0) {
    // Pick a random template for variety
    const template = templates[Math.floor(Math.random() * templates.length)]

    // Resolve variables
    const variables = await resolveVariables(userId, triggerType)
    const mergedVars = { ...variables, ...(context || {}) }

    return {
      title: renderTemplate(template.title, mergedVars),
      body: renderTemplate(template.body, mergedVars),
    }
  }

  // GPT-4o-mini fallback for missing templates
  return generateWithGPT(userId, triggerType, context)
}

/**
 * GPT-4o-mini fallback for generating motivation messages.
 */
async function generateWithGPT(
  userId: string,
  triggerType: TriggerType,
  context?: Record<string, unknown>
): Promise<MotivationMessage> {
  try {
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })

    const prompt = `Generate a short motivational notification for a body language learning app.
Trigger: ${triggerType}
User name: ${user?.name || 'Learner'}
Context: ${JSON.stringify(context || {})}

Respond in JSON: { "title": "...", "body": "..." }
- Title: max 50 chars, encouraging
- Body: max 150 chars, specific and warm
- Reference body language skills when relevant`

    const response = await openai.chat.completions.create({
      model: DEFAULT_ENGINE_CONFIG.gptModel,
      max_tokens: 150,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.choices[0]?.message?.content
    if (text) {
      const parsed = JSON.parse(text)
      return { title: parsed.title, body: parsed.body }
    }
  } catch {
    // Fall through to default
  }

  // Hardcoded fallback
  return getDefaultMessage(triggerType)
}

function getDefaultMessage(triggerType: TriggerType): MotivationMessage {
  const defaults: Record<string, MotivationMessage> = {
    morning_motivation: {
      title: 'Good morning!',
      body: 'A quick 5-minute practice can transform your communication skills. Ready to start?',
    },
    streak_warning: {
      title: 'Keep your streak alive!',
      body: 'Just one quick lesson or challenge today to maintain your progress.',
    },
    streak_broken: {
      title: 'Fresh start today',
      body: 'Every expert was once a beginner. Jump back in and build a new streak!',
    },
    comeback: {
      title: 'We miss you!',
      body: 'Your body language journey awaits. Come back and pick up where you left off.',
    },
    skill_gap_nudge: {
      title: 'Time to level up',
      body: 'You have skills waiting to be unlocked. Try something new today!',
    },
  }

  return defaults[triggerType] || {
    title: 'Keep learning!',
    body: 'Your body language skills are improving. Keep it up!',
  }
}
