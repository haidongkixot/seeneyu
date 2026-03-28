import type { ProviderConfig } from '../types'

// ── Full Provider Registry ──────────────────────────────────────────
// Each provider lists all supported models. Providers that require an
// API key are gated by their envVar — if the env var is unset, the
// provider is excluded from `getAvailableProviders()`.
// Pollinations is always available (no key required).

const PROVIDER_REGISTRY: ProviderConfig[] = [
  // ── Free / no-key providers ────────────────────────────────────
  {
    id: 'pollinations',
    name: 'Pollinations',
    type: 'image',
    endpoint: 'https://image.pollinations.ai',
    requiresKey: false,
    models: [
      'flux',
      'turbo',
      'flux-realism',
      'flux-anime',
      'flux-3d',
      'flux-cablyai',
    ],
  },

  // ── Hugging Face ───────────────────────────────────────────────
  {
    id: 'huggingface',
    name: 'Hugging Face',
    type: 'image',
    endpoint: 'https://api-inference.huggingface.co/models',
    requiresKey: true,
    envVar: 'HF_TOKEN',
    models: [
      'stabilityai/stable-diffusion-xl-base-1.0',
      'black-forest-labs/FLUX.1-dev',
      'runwayml/stable-diffusion-v1-5',
    ],
  },

  // ── OpenAI ─────────────────────────────────────────────────────
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'image',
    endpoint: 'https://api.openai.com/v1/images/generations',
    requiresKey: true,
    envVar: 'OPENAI_API_KEY',
    models: ['dall-e-3', 'dall-e-2'],
  },

  // ── Stability AI ───────────────────────────────────────────────
  {
    id: 'stability',
    name: 'Stability AI',
    type: 'image',
    endpoint: 'https://api.stability.ai/v2beta/stable-image/generate',
    requiresKey: true,
    envVar: 'STABILITY_API_KEY',
    models: ['stable-diffusion-3', 'stable-image-core'],
  },

  // ── Together AI ────────────────────────────────────────────────
  {
    id: 'together',
    name: 'Together AI',
    type: 'image',
    endpoint: 'https://api.together.xyz/v1/images/generations',
    requiresKey: true,
    envVar: 'TOGETHER_API_KEY',
    models: ['black-forest-labs/FLUX.1-schnell-Free'],
  },

  // ── Kling AI (image + video) ────────────────────────────────────
  {
    id: 'kling',
    name: 'Kling AI',
    type: 'image',
    endpoint: 'https://api.klingai.com/v1',
    requiresKey: true,
    envVar: 'KLING_API_KEY',
    models: [
      'kling-v1-image',
      'kling-v1.5-image',
    ],
  },

  // ── Video Providers ────────────────────────────────────────────

  {
    id: 'kling-video',
    name: 'Kling AI (Video)',
    type: 'video',
    endpoint: 'https://api.klingai.com/v1',
    requiresKey: true,
    envVar: 'KLING_API_KEY',
    models: [
      'kling-v1-standard-t2v',
      'kling-v1-pro-t2v',
      'kling-v1.6-standard-t2v',
      'kling-v1.6-pro-t2v',
      'kling-v2-master-t2v',
      'kling-v1-standard-i2v',
      'kling-v1-pro-i2v',
      'kling-v1.6-standard-i2v',
      'kling-v2-master-i2v',
    ],
  },

  {
    id: 'replicate',
    name: 'Replicate',
    type: 'video',
    endpoint: 'https://api.replicate.com/v1/predictions',
    requiresKey: true,
    envVar: 'REPLICATE_API_TOKEN',
    models: [
      'minimax/video-01',
      'minimax/video-01-live',
      'luma/ray',
      'tencent/hunyuan-video',
      'wavespeedai/wan-2.1-t2v-480p',
    ],
  },

  {
    id: 'runway',
    name: 'Runway',
    type: 'video',
    endpoint: 'https://api.dev.runwayml.com/v1',
    requiresKey: true,
    envVar: 'RUNWAY_API_KEY',
    models: ['gen3a_turbo', 'gen4_turbo'],
  },

  {
    id: 'luma',
    name: 'Luma Dream Machine',
    type: 'video',
    endpoint: 'https://api.lumalabs.ai/dream-machine/v1',
    requiresKey: true,
    envVar: 'LUMA_API_KEY',
    models: ['ray2', 'ray2-flash'],
  },

  {
    id: 'pollinations-video',
    name: 'Pollinations (Video)',
    type: 'video',
    endpoint: 'https://video.pollinations.ai',
    requiresKey: false,
    models: ['fast-svd'],
  },

  {
    id: 'huggingface-video',
    name: 'Hugging Face (Video)',
    type: 'video',
    endpoint: 'https://api-inference.huggingface.co/models',
    requiresKey: true,
    envVar: 'HF_TOKEN',
    models: ['stabilityai/stable-video-diffusion-img2vid-xt'],
  },
]

// ── Public API ──────────────────────────────────────────────────────

/**
 * Returns providers whose required API key is present in the environment.
 * Pollinations is always included (no key required).
 */
export function getAvailableProviders(): ProviderConfig[] {
  return PROVIDER_REGISTRY.filter((p) => {
    if (!p.requiresKey) return true
    return !!process.env[p.envVar!]
  })
}

/**
 * Returns a specific provider by ID regardless of availability.
 */
export function getProviderConfig(providerId: string): ProviderConfig | undefined {
  return PROVIDER_REGISTRY.find((p) => p.id === providerId)
}

/**
 * Returns all registered providers (including unavailable ones)
 * with an `available` flag for each.
 */
export function getAllProviders(): (ProviderConfig & { available: boolean })[] {
  return PROVIDER_REGISTRY.map((p) => ({
    ...p,
    available: !p.requiresKey || !!process.env[p.envVar!],
  }))
}
