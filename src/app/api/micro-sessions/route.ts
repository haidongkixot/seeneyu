import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import type { MicroFeedback } from '@/lib/types'

const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })

const VOCAL_SKILLS = new Set(['vocal-pacing', 'confident-disagreement'])

function buildMicroPrompt(
  skillFocus: string,
  instruction: string,
  transcript: string | null
): string {
  const transcriptLine = transcript
    ? `\nLearner's speech transcript: "${transcript}"`
    : ''

  return `You are a body language and communication coach giving instant feedback on a 30-second practice recording.

The learner was focusing ONLY on: ${skillFocus}
Their task was: ${instruction}${transcriptLine}

Evaluate ONLY this one skill element. Ignore everything else.

Return a JSON object with EXACTLY this structure:
{
  "verdict": "pass" or "needs-work",
  "headline": "<10 words max — direct verdict with encouragement, e.g. 'Good pace — you matched the reference well'>",
  "detail": "<1-2 sentences — specific observation about what they did right or what to improve>"
}

A "pass" verdict means score ≥ 7/10 on this specific element. Be direct and actionable.`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const recording = formData.get('recording') as File | null
    const clipId = formData.get('clipId') as string | null
    const stepNumberRaw = formData.get('stepNumber') as string | null
    const skillFocus = formData.get('skillFocus') as string | null
    const instruction = formData.get('instruction') as string | null
    const skillCategory = formData.get('skillCategory') as string | null

    if (!recording || !clipId || !stepNumberRaw || !skillFocus || !instruction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const stepNumber = parseInt(stepNumberRaw, 10)
    const ts = Date.now()

    // Upload recording
    const blob = await put(`micro/${clipId}/step${stepNumber}/${ts}.webm`, recording, {
      access: 'public',
      contentType: 'video/webm',
    })

    // Upload frames (up to 4)
    const frameUrls: string[] = []
    for (let i = 0; i < 4; i++) {
      const frame = formData.get(`frame_${i}`) as File | null
      if (!frame) break
      const frameBlob = await put(`micro/${clipId}/step${stepNumber}/${ts}_f${i}.jpg`, frame, {
        access: 'public',
        contentType: 'image/jpeg',
      })
      frameUrls.push(frameBlob.url)
    }

    // Create micro session record
    const microSession = await prisma.microSession.create({
      data: {
        clipId,
        stepNumber,
        recordingUrl: blob.url,
        frameUrls: frameUrls.length > 0 ? JSON.stringify(frameUrls) : null,
        status: 'processing',
      },
    })

    // Transcribe audio for vocal/speech skills
    let transcript: string | null = null
    if (skillCategory && VOCAL_SKILLS.has(skillCategory)) {
      try {
        const recordingBuffer = Buffer.from(await recording.arrayBuffer())
        const transcription = await getOpenAI().audio.transcriptions.create({
          file: new File([recordingBuffer], 'recording.webm', { type: 'video/webm' }),
          model: 'whisper-1',
        })
        transcript = transcription.text || null
      } catch {
        // Whisper failure is non-blocking
      }
    }

    // Build analysis prompt + content
    const prompt = buildMicroPrompt(skillFocus, instruction, transcript)
    const messageContent = frameUrls.length > 0
      ? [
          { type: 'text' as const, text: prompt },
          ...frameUrls.slice(0, 2).map(url => ({
            type: 'image_url' as const,
            image_url: { url, detail: 'low' as const },
          })),
        ]
      : [{ type: 'text' as const, text: prompt + '\n\n(No video frames available — evaluate based on context.)' }]

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 200,
      messages: [{ role: 'user', content: messageContent }],
    })

    const raw = response.choices[0]?.message?.content ?? ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in GPT response')

    const feedback = JSON.parse(jsonMatch[0]) as MicroFeedback

    await prisma.microSession.update({
      where: { id: microSession.id },
      data: {
        transcript,
        feedback: JSON.parse(JSON.stringify(feedback)),
        status: 'complete',
      },
    })

    return NextResponse.json({ microSessionId: microSession.id, ...feedback })
  } catch (error) {
    console.error('Micro-session error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
