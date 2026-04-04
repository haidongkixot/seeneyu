/**
 * ElevenLabs Text-to-Speech service.
 * Direct REST API — no npm package needed.
 *
 * Env var: ELEVENLABS_API_KEY
 * Default voice: "Rachel" (21m00Tcm4TlvDq8ikWAM)
 */

import { put } from '@vercel/blob'

const API_BASE = 'https://api.elevenlabs.io/v1'
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM' // Rachel — clear, warm, coaching tone

/**
 * Generate speech audio from text using ElevenLabs.
 * Returns an MP3 buffer.
 */
export async function generateVoice(
  text: string,
  options?: {
    voiceId?: string
    modelId?: string
    stability?: number
    similarityBoost?: number
  },
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not configured')

  const voiceId = options?.voiceId ?? DEFAULT_VOICE_ID
  const modelId = options?.modelId ?? 'eleven_monolingual_v1'

  const res = await fetch(`${API_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: options?.stability ?? 0.5,
        similarity_boost: options?.similarityBoost ?? 0.75,
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${errText.slice(0, 200)}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

/**
 * Generate voice and upload to Vercel Blob.
 * Returns the public blob URL.
 */
export async function generateAndUploadVoice(
  text: string,
  clipId: string,
  stepNumber: number,
  options?: Parameters<typeof generateVoice>[1],
): Promise<string> {
  const buffer = await generateVoice(text, options)
  const pathname = `practice-audio/${clipId}/step${stepNumber}.mp3`
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType: 'audio/mpeg',
  })
  return blob.url
}
