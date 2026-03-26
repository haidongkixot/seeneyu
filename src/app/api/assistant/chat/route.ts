import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/mobile-auth'

export const maxDuration = 30
import { prisma } from '@/lib/prisma'
import {
  getAssistantLimits,
  countMessagesToday,
  buildSystemPrompt,
  generateResponse,
  transcribeAudio,
  synthesizeSpeech,
  getSuggestions,
} from '@/services/assistant-service'

/**
 * POST /api/assistant/chat
 * Body: { conversationId?, context, message?, audio? (base64 string) }
 * Returns: { conversationId, reply, audioUrl?, suggestions[] }
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = authUser.id
    const plan = authUser.plan

    // Check plan limits
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    })
    const userPlan = plan || userRecord?.plan || 'basic'
    const limits = getAssistantLimits(userPlan)

    // Check daily message limit
    if (limits.maxMessagesPerDay !== -1) {
      const todayCount = await countMessagesToday(userId)
      if (todayCount >= limits.maxMessagesPerDay) {
        return NextResponse.json(
          {
            error: 'Daily message limit reached',
            limit: limits.maxMessagesPerDay,
            used: todayCount,
          },
          { status: 429 }
        )
      }
    }

    const json = await req.json()
    const conversationId = json.conversationId as string | undefined
    const context = json.context as string
    const textMessage = json.message as string | undefined
    const audioBase64 = json.audio as string | undefined

    if (!context) {
      return NextResponse.json({ error: 'context is required' }, { status: 400 })
    }

    // Determine user message content
    let userContent: string

    if (audioBase64) {
      // Voice input — check plan
      if (!limits.voiceEnabled) {
        return NextResponse.json(
          { error: 'Voice chat requires Standard plan or above' },
          { status: 403 }
        )
      }
      const audioBuffer = Buffer.from(audioBase64, 'base64')
      userContent = await transcribeAudio(audioBuffer)
    } else if (textMessage && textMessage.trim()) {
      userContent = textMessage.trim()
    } else {
      return NextResponse.json({ error: 'message or audio is required' }, { status: 400 })
    }

    // Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await prisma.assistantConversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50, // Keep recent context
          },
        },
      })
    }

    if (!conversation) {
      conversation = await prisma.assistantConversation.create({
        data: { userId, context },
        include: { messages: true },
      })
    }

    // Save user message
    await prisma.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: userContent,
      },
    })

    // Build messages array for OpenAI
    const historyMessages = conversation.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
    historyMessages.push({ role: 'user', content: userContent })

    // Generate response
    const systemPrompt = await buildSystemPrompt(userId, context)
    const reply = await generateResponse(historyMessages, systemPrompt)

    // Synthesize speech if plan allows voice
    let audioUrl: string | undefined
    if (limits.voiceEnabled && audioBase64) {
      try {
        const speechBuffer = await synthesizeSpeech(reply)
        // Upload to Vercel Blob
        const { put } = await import('@vercel/blob')
        const blob = await put(
          `assistant-audio/${conversation.id}/${Date.now()}.mp3`,
          speechBuffer,
          { access: 'public', contentType: 'audio/mpeg' }
        )
        audioUrl = blob.url
      } catch (e) {
        console.warn('TTS synthesis failed, returning text-only:', e)
      }
    }

    // Save assistant message
    await prisma.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: reply,
        audioUrl: audioUrl ?? null,
      },
    })

    // Update conversation timestamp
    await prisma.assistantConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    const suggestions = getSuggestions(context)

    return NextResponse.json({
      conversationId: conversation.id,
      reply,
      audioUrl,
      transcription: audioBase64 ? userContent : undefined,
      suggestions,
    })
  } catch (err: any) {
    console.error('Assistant chat error:', err?.message, err?.stack)
    // Log to error system if available
    try {
      const { logError } = await import('@/lib/logger')
      await logError('api', err, { route: '/api/assistant/chat', context: 'Coach Ney chat' })
    } catch { /* logger may not be available */ }
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
