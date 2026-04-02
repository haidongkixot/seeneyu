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
  const modelId = model ?? 'imagen-4.0-generate-001'

  // Imagen models use the predict endpoint; Gemini flash models use generateContent
  const isImagen = modelId.startsWith('imagen-')

  if (isImagen) {
    // Imagen 4 via predict endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1 },
      }),
    })
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini Imagen API error (${response.status}): ${error.slice(0, 300)}`)
    }
    const data = await response.json()
    const prediction = data.predictions?.[0]
    if (!prediction?.bytesBase64Encoded) throw new Error('No image returned from Gemini Imagen')
    const buffer = Buffer.from(prediction.bytesBase64Encoded, 'base64')
    return { buffer, mimeType: prediction.mimeType ?? 'image/png' }
  } else {
    // Nano Banana / Gemini flash via generateContent
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    })
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini Imagen API error (${response.status}): ${error.slice(0, 300)}`)
    }
    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'))
    if (!imagePart?.inlineData?.data) throw new Error('No image returned from Gemini model')
    const buffer = Buffer.from(imagePart.inlineData.data, 'base64')
    return { buffer, mimeType: imagePart.inlineData.mimeType }
  }
}
