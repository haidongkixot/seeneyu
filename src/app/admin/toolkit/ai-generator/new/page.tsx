'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface Provider {
  id: string
  name: string
  models: { id: string; name: string; type: string }[]
  available: boolean
}

const EXPRESSION_TYPES = [
  { value: 'happiness', label: 'Happiness' },
  { value: 'sadness', label: 'Sadness' },
  { value: 'anger', label: 'Anger' },
  { value: 'surprise', label: 'Surprise' },
  { value: 'fear', label: 'Fear' },
  { value: 'disgust', label: 'Disgust' },
  { value: 'contempt', label: 'Contempt' },
]

const BODY_LANGUAGE_TYPES = [
  { value: 'eye-contact', label: 'Eye Contact' },
  { value: 'open-posture', label: 'Open Posture' },
  { value: 'active-listening', label: 'Active Listening' },
  { value: 'vocal-pacing', label: 'Vocal Pacing' },
  { value: 'confident-disagreement', label: 'Confident Disagreement' },
  { value: 'hand-gestures', label: 'Hand Gestures' },
  { value: 'facial-mirroring', label: 'Facial Mirroring' },
  { value: 'power-pose', label: 'Power Pose' },
]

// ── Main Page ─────────────────────────────────────────────────────────

export default function NewAiGeneratorPage() {
  const router = useRouter()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)

  // Form state
  const [expressionType, setExpressionType] = useState('happiness')
  const [bodyLanguageType, setBodyLanguageType] = useState('eye-contact')
  const [scenePrompt, setScenePrompt] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [outputType, setOutputType] = useState<'image' | 'video' | 'both'>('image')
  const [videoProvider, setVideoProvider] = useState('')
  const [videoModel, setVideoModel] = useState('')
  const [count, setCount] = useState(3)
  // Video generation options
  const [videoDuration, setVideoDuration] = useState(5)
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3'>('16:9')
  const [videoResolution, setVideoResolution] = useState<'480p' | '720p' | '1080p'>('720p')
  const [videoStyle, setVideoStyle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'idle' | 'creating' | 'generating' | 'generating-video'>('idle')

  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch('/api/admin/toolkit/ai-generator/providers')
        if (res.ok) {
          const data: Provider[] = await res.json()
          setProviders(data)
          // Default to first available provider
          // Default image provider
          const availableImage = data.find((p) => p.available && p.models.some((m: any) => m.type === 'image'))
          if (availableImage) {
            setSelectedProvider(availableImage.id)
            const imgModel = availableImage.models.find((m: any) => m.type === 'image')
            setSelectedModel(imgModel?.id || '')
          }
          // Default video provider
          const availableVideo = data.find((p) => p.available && p.models.some((m: any) => m.type === 'video'))
          if (availableVideo) {
            setVideoProvider(availableVideo.id)
            const vidModel = availableVideo.models.find((m: any) => m.type === 'video')
            setVideoModel(vidModel?.id || '')
          }
        }
      } catch { /* ignore */ }
      setLoadingProviders(false)
    }
    fetchProviders()
  }, [])

  // Split providers by type
  const imageProviders = providers.filter((p) => p.models.some((m) => m.type === 'image'))
  const videoProviders = providers.filter((p) => p.models.some((m) => m.type === 'video'))

  // Update model when provider changes
  const currentProvider = providers.find((p) => p.id === selectedProvider)
  const availableModels = (currentProvider?.models ?? []).filter((m) => m.type === 'image')

  const currentVideoProvider = providers.find((p) => p.id === videoProvider)
  const availableVideoModels = (currentVideoProvider?.models ?? []).filter((m) => m.type === 'video')

  function handleProviderChange(providerId: string) {
    setSelectedProvider(providerId)
    const provider = providers.find((p) => p.id === providerId)
    const imageModels = provider?.models.filter((m) => m.type === 'image') ?? []
    if (imageModels.length) setSelectedModel(imageModels[0].id)
  }

  function handleVideoProviderChange(providerId: string) {
    setVideoProvider(providerId)
    const provider = providers.find((p) => p.id === providerId)
    const vidModels = provider?.models.filter((m) => m.type === 'video') ?? []
    if (vidModels.length) setVideoModel(vidModels[0].id)
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setStep('creating')

    try {
      // Step 1: Create the request
      const createRes = await fetch('/api/admin/toolkit/ai-generator/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expressionType,
          bodyLanguageType,
          scenePrompt: scenePrompt || undefined,
          provider: selectedProvider || undefined,
          model: selectedModel || undefined,
        }),
      })

      if (!createRes.ok) {
        const data = await createRes.json()
        throw new Error(data.error || 'Failed to create request')
      }

      const request = await createRes.json()

      // Step 2: Trigger image generation (if image or both)
      if (outputType === 'image' || outputType === 'both') {
        setStep('generating')
        const generateRes = await fetch(`/api/admin/toolkit/ai-generator/requests/${request.id}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: selectedProvider || undefined,
            model: selectedModel || undefined,
            count,
            type: 'image',
          }),
        })

        if (!generateRes.ok) {
          const data = await generateRes.json()
          throw new Error(data.error || 'Failed to start image generation')
        }
      }

      // Step 3: Trigger video generation (if video or both)
      if (outputType === 'video' || outputType === 'both') {
        setStep('generating-video')
        const videoRes = await fetch(`/api/admin/toolkit/ai-generator/requests/${request.id}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: videoProvider || undefined,
            model: videoModel || undefined,
            count: 1,
            type: 'video',
            options: {
              duration: videoDuration,
              aspectRatio: videoAspectRatio,
              resolution: videoResolution,
              ...(videoStyle ? { style: videoStyle } : {}),
            },
          }),
        })

        if (!videoRes.ok) {
          const data = await videoRes.json()
          console.warn('Video generation failed:', data.error)
          // Don't throw — video is optional, images may have succeeded
        }
      }

      // Navigate to request detail page
      router.push(`/admin/toolkit/ai-generator/${request.id}`)
    } catch (err: any) {
      setError(err.message)
      setStep('idle')
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/toolkit/ai-generator" className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-3">
          <ArrowLeft size={12} /> Back to AI Generator
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">New Content Generation</h1>
        <p className="text-text-secondary text-sm mt-1">
          Configure expression and body language parameters, then generate reference images.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Expression Type */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Content Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Expression Type</label>
              <select
                value={expressionType}
                onChange={(e) => setExpressionType(e.target.value)}
                className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              >
                {EXPRESSION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Body Language Type</label>
              <select
                value={bodyLanguageType}
                onChange={(e) => setBodyLanguageType(e.target.value)}
                className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              >
                {BODY_LANGUAGE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Scene Context <span className="text-text-muted">(optional)</span>
              </label>
              <textarea
                value={scenePrompt}
                onChange={(e) => setScenePrompt(e.target.value)}
                placeholder="E.g., 'Business meeting setting, person standing near whiteboard' or leave blank for default"
                rows={3}
                className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Output Type */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Output Type</h2>
          <div className="flex gap-2">
            {([
              { value: 'image', label: '🖼️ Images Only', desc: 'Generate reference images' },
              { value: 'video', label: '🎬 Video Only', desc: 'Generate short video with sound' },
              { value: 'both', label: '🖼️+🎬 Both', desc: 'Images + video' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOutputType(opt.value)}
                className={`flex-1 text-left px-4 py-3 rounded-xl border-2 transition-all ${
                  outputType === opt.value
                    ? 'border-accent-400 bg-accent-400/10'
                    : 'border-black/8 hover:border-black/15'
                }`}
              >
                <p className="text-sm font-semibold text-text-primary">{opt.label}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Image Provider */}
        {(outputType === 'image' || outputType === 'both') && (
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">🖼️ Image Provider</h2>

          {loadingProviders ? (
            <div className="text-sm text-text-muted">Loading providers...</div>
          ) : imageProviders.length === 0 ? (
            <div className="text-sm text-text-muted">No image providers available.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
                >
                  {imageProviders.map((p) => (
                    <option key={p.id} value={p.id} disabled={!p.available}>
                      {p.name}{!p.available ? ' (no API key)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
                >
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Number of Images <span className="text-text-muted">(1-5)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={count}
                  onChange={(e) => setCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-24 bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
                />
              </div>
            </div>
          )}
        </div>
        )}

        {/* Video Provider */}
        {(outputType === 'video' || outputType === 'both') && (
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">🎬 Video Provider</h2>

          {loadingProviders ? (
            <div className="text-sm text-text-muted">Loading providers...</div>
          ) : videoProviders.length === 0 ? (
            <div className="text-sm text-text-muted">No video providers available. Set REPLICATE_API_TOKEN, RUNWAY_API_KEY, or LUMA_API_KEY.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Provider</label>
                <select
                  value={videoProvider}
                  onChange={(e) => handleVideoProviderChange(e.target.value)}
                  className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
                >
                  {videoProviders.map((p) => (
                    <option key={p.id} value={p.id} disabled={!p.available}>
                      {p.name}{!p.available ? ' (no API key)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Model</label>
                <select
                  value={videoModel}
                  onChange={(e) => setVideoModel(e.target.value)}
                  className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
                >
                  {availableVideoModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Video generation options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Duration <span className="text-text-muted">(seconds)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(Math.min(60, Math.max(1, parseInt(e.target.value) || 5)))}
                    className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Aspect Ratio</label>
                  <select
                    value={videoAspectRatio}
                    onChange={(e) => setVideoAspectRatio(e.target.value as any)}
                    className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:3">4:3 (Classic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Resolution</label>
                  <select
                    value={videoResolution}
                    onChange={(e) => setVideoResolution(e.target.value as any)}
                    className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
                  >
                    <option value="480p">480p</option>
                    <option value="720p">720p (recommended)</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Style <span className="text-text-muted">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={videoStyle}
                    onChange={(e) => setVideoStyle(e.target.value)}
                    placeholder="e.g. cinematic, anime, documentary"
                    className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-400/50"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Audio:</strong> Replicate, Runway, and Luma generate video with native sound.
                  Other providers produce silent video — OpenAI TTS narration will be added automatically.
                </p>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-accent-400 text-bg-base rounded-xl hover:bg-accent-300 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {step === 'creating' ? 'Creating request...' : step === 'generating-video' ? 'Generating video...' : 'Generating images...'}
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate
              </>
            )}
          </button>
          <Link
            href="/admin/toolkit/ai-generator"
            className="px-4 py-2.5 text-sm text-text-muted hover:text-text-secondary rounded-xl transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
