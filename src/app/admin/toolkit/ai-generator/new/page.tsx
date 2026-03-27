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
  const [count, setCount] = useState(3)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'idle' | 'creating' | 'generating'>('idle')

  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch('/api/admin/toolkit/ai-generator/providers')
        if (res.ok) {
          const data: Provider[] = await res.json()
          setProviders(data)
          // Default to first available provider
          const available = data.find((p) => p.available)
          if (available) {
            setSelectedProvider(available.id)
            setSelectedModel(available.models[0]?.id || '')
          }
        }
      } catch { /* ignore */ }
      setLoadingProviders(false)
    }
    fetchProviders()
  }, [])

  // Update model when provider changes
  const currentProvider = providers.find((p) => p.id === selectedProvider)
  const availableModels = currentProvider?.models ?? []

  function handleProviderChange(providerId: string) {
    setSelectedProvider(providerId)
    const provider = providers.find((p) => p.id === providerId)
    if (provider?.models.length) {
      setSelectedModel(provider.models[0].id)
    }
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

      // Step 2: Trigger image generation
      setStep('generating')
      const generateRes = await fetch(`/api/admin/toolkit/ai-generator/requests/${request.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider || undefined,
          model: selectedModel || undefined,
          count,
        }),
      })

      if (!generateRes.ok) {
        const data = await generateRes.json()
        throw new Error(data.error || 'Failed to start generation')
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

        {/* Provider & Model */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">AI Provider</h2>

          {loadingProviders ? (
            <div className="text-sm text-text-muted">Loading providers...</div>
          ) : providers.length === 0 ? (
            <div className="text-sm text-text-muted">No providers configured. Set API keys in environment variables.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
                >
                  {providers.map((p) => (
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
                    <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
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
                {step === 'creating' ? 'Creating request...' : 'Starting generation...'}
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
