/**
 * Google Nano Banana (Gemini Imagen) image generator.
 * Uses @google/generative-ai npm package.
 * Env var: GOOGLE_AI_API_KEY
 * Models: imagen-3.0-generate-002
 * Cost: ~$0.065/image at 1K resolution
 */

export interface GeminiImagenOptions {
  width?: number
  height?: number
}

export async function generateWithGeminiImagen(
  prompt: string,
  model?: string,
  options?: GeminiImagenOptions,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured')

  // Use the Gemini API REST endpoint directly
  const modelId = model ?? 'gemini-2.0-flash-exp'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `Generate an image: ${prompt}` }],
      }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageDimensions: {
          width: options?.width ?? 1024,
          height: options?.height ?? 1024,
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini Imagen API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts ?? []

  // Find the image part
  const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'))
  if (!imagePart?.inlineData?.data) {
    throw new Error('No image returned from Gemini Imagen')
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64')
  return { buffer, mimeType: imagePart.inlineData.mimeType }
}
