/**
 * Audio Extractor — downloads webm from Vercel Blob and decodes to PCM audio.
 *
 * Uses node-web-audio-api for audio decoding (no ffmpeg binary needed).
 * Works in Vercel serverless environment.
 */

/**
 * Download a webm recording and decode its audio to mono Float32Array.
 * Returns PCM samples at the decoded sample rate (typically 48000).
 */
export async function extractAudioFromWebm(
  recordingUrl: string,
): Promise<{ samples: Float32Array; sampleRate: number }> {
  // Dynamically import to avoid SSR issues
  const { AudioContext } = await import('node-web-audio-api')

  // Download the webm file
  const res = await fetch(recordingUrl)
  if (!res.ok) throw new Error(`Failed to download recording: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()

  // Decode audio from the webm container
  const ctx = new AudioContext({ sampleRate: 16000 })
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    // Mix down to mono if multi-channel
    const samples = audioBuffer.numberOfChannels > 1
      ? mixToMono(audioBuffer)
      : audioBuffer.getChannelData(0)

    return { samples, sampleRate: audioBuffer.sampleRate }
  } finally {
    await ctx.close()
  }
}

/** Mix multi-channel audio to mono by averaging channels */
function mixToMono(audioBuffer: any): Float32Array {
  const length = audioBuffer.length
  const mono = new Float32Array(length)
  const channels = audioBuffer.numberOfChannels

  for (let ch = 0; ch < channels; ch++) {
    const channelData = audioBuffer.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      mono[i] += channelData[i]
    }
  }

  for (let i = 0; i < length; i++) {
    mono[i] /= channels
  }

  return mono
}
