// ── Expression & Body Language Types ─────────────────────────────────

export type ExpressionType =
  | 'happiness' | 'sadness' | 'anger' | 'surprise'
  | 'fear' | 'disgust' | 'contempt' | 'neutral'
  | 'confusion' | 'interest' | 'boredom' | 'pride'
  | 'shame' | 'embarrassment'

export type BodyLanguageType =
  | 'eye-contact' | 'open-posture' | 'active-listening'
  | 'vocal-pacing' | 'confident-disagreement' | 'hand-gestures'
  | 'facial-mirroring' | 'power-pose' | 'micro-expressions'
  | 'head-tilt' | 'crossed-arms' | 'lean-forward'

// ── Provider Types ──────────────────────────────────────────────────

/** Provider ID — not fixed, admin picks from available providers */
export type GenerationProvider = string

export interface ProviderConfig {
  id: string
  name: string
  type: 'image' | 'video'
  endpoint: string
  requiresKey: boolean
  envVar?: string
  models: string[]
}

// ── Input / Output Interfaces ───────────────────────────────────────

export interface ContentRequestInput {
  expressionType: ExpressionType
  bodyLanguageType: BodyLanguageType
  scenePrompt?: string
  provider?: string
  model?: string
  createdBy: string
}

export interface DescriptionOutput {
  sceneDescription: string
  characterDescription: string
  expressionDetails: string
  imagePrompt: string
  videoPrompt: string
  practiceInstructions: string
}

export interface GenerationResult {
  buffer: Buffer
  mimeType: string
  width?: number
  height?: number
  durationMs?: number
  metadata?: Record<string, unknown>
}

export interface GenerationOptions {
  // Image options
  width?: number
  height?: number
  seed?: number
  negativePrompt?: string

  // Video options
  /** Duration in seconds (1–60). Provider-dependent limits apply. */
  duration?: number
  /** Aspect ratio. Defaults to 16:9. */
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3'
  /** Output resolution. Defaults to 720p. */
  resolution?: '480p' | '720p' | '1080p'
  /**
   * Visual style. Injected into the prompt when providers don't have
   * a native style parameter.
   * e.g. 'cinematic', 'photorealistic', 'anime', 'artistic', 'documentary'
   */
  style?: string
  /** Motion intensity for video (provider-dependent). */
  motionStrength?: 'low' | 'medium' | 'high'
}
