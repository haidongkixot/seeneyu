'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save, Loader2,
  ImageIcon, Mic, Play, RefreshCw, CheckCircle, Sparkles, X,
} from 'lucide-react'

interface SubStep {
  order: number
  text: string
  imageUrl?: string | null
}

interface StepData {
  id?: string
  stepNumber: number
  skillFocus: string
  instruction: string
  tip: string | null
  targetDurationSec: number
  demoImageUrl: string | null
  subSteps: SubStep[] | null
  voiceUrl: string | null
}

interface PreviewStep {
  stepNumber: number
  skillFocus: string
  instruction: string
  tip: string | null
  targetDurationSec: number
  imagePrompt: string
}

interface Props {
  clipId: string
}

export default function PracticeStepEditor({ clipId }: Props) {
  const [steps, setSteps] = useState<StepData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [generatingImage, setGeneratingImage] = useState<string | null>(null)
  const [generatingVoice, setGeneratingVoice] = useState<string | null>(null)

  // AI generation state
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<PreviewStep[] | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [imageProgress, setImageProgress] = useState<string | null>(null)

  const fetchSteps = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clips/${clipId}/steps`)
      if (res.ok) {
        const data = await res.json()
        setSteps(data.map((s: any) => ({
          ...s,
          subSteps: s.subSteps ?? null,
        })))
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [clipId])

  useEffect(() => { fetchSteps() }, [fetchSteps])

  function addStep() {
    setSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        skillFocus: '',
        instruction: '',
        tip: null,
        targetDurationSec: 20,
        demoImageUrl: null,
        subSteps: null,
        voiceUrl: null,
      },
    ])
  }

  function removeStep(idx: number) {
    setSteps((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      return next.map((s, i) => ({ ...s, stepNumber: i + 1 }))
    })
  }

  function moveStep(idx: number, dir: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next.map((s, i) => ({ ...s, stepNumber: i + 1 }))
    })
  }

  function updateStep(idx: number, field: keyof StepData, value: any) {
    setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  // Sub-steps management
  function addSubStep(stepIdx: number) {
    setSteps((prev) => prev.map((s, i) => {
      if (i !== stepIdx) return s
      const existing = s.subSteps ?? []
      return { ...s, subSteps: [...existing, { order: existing.length + 1, text: '' }] }
    }))
  }

  function updateSubStep(stepIdx: number, subIdx: number, text: string) {
    setSteps((prev) => prev.map((s, i) => {
      if (i !== stepIdx || !s.subSteps) return s
      const subs = [...s.subSteps]
      subs[subIdx] = { ...subs[subIdx], text }
      return { ...s, subSteps: subs }
    }))
  }

  function removeSubStep(stepIdx: number, subIdx: number) {
    setSteps((prev) => prev.map((s, i) => {
      if (i !== stepIdx || !s.subSteps) return s
      const subs = s.subSteps.filter((_, j) => j !== subIdx).map((ss, j) => ({ ...ss, order: j + 1 }))
      return { ...s, subSteps: subs.length > 0 ? subs : null }
    }))
  }

  // ── AI Generation ────────────────────────────────────────────

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/admin/clips/${clipId}/steps/auto-generate`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setPreview(data.steps ?? [])
      } else {
        const err = await res.json()
        alert(err.error || 'Generation failed')
      }
    } catch { alert('Generation failed') }
    setGenerating(false)
  }

  function updatePreviewStep(idx: number, field: keyof PreviewStep, value: any) {
    setPreview((prev) => prev?.map((s, i) => i === idx ? { ...s, [field]: value } : s) ?? null)
  }

  function removePreviewStep(idx: number) {
    setPreview((prev) => {
      if (!prev) return null
      const next = prev.filter((_, i) => i !== idx)
      return next.map((s, i) => ({ ...s, stepNumber: i + 1 }))
    })
  }

  async function handleAcceptPreview() {
    if (!preview || preview.length === 0) return
    setAccepting(true)

    // 1. Convert preview steps to StepData and save via PUT
    const stepsToSave: StepData[] = preview.map((p) => ({
      stepNumber: p.stepNumber,
      skillFocus: p.skillFocus,
      instruction: p.instruction,
      tip: p.tip,
      targetDurationSec: p.targetDurationSec,
      demoImageUrl: null,
      subSteps: null,
      voiceUrl: null,
    }))

    try {
      const saveRes = await fetch(`/api/admin/clips/${clipId}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: stepsToSave }),
      })
      if (!saveRes.ok) { alert('Failed to save steps'); setAccepting(false); return }

      const savedSteps: StepData[] = await saveRes.json()
      setSteps(savedSteps)

      // 2. Generate demo images for each step using the custom imagePrompt
      for (let i = 0; i < savedSteps.length; i++) {
        const step = savedSteps[i]
        const previewItem = preview[i]
        if (!step.id || !previewItem?.imagePrompt) continue

        setImageProgress(`Generating image ${i + 1} of ${savedSteps.length}...`)
        try {
          const imgRes = await fetch(`/api/admin/clips/${clipId}/steps/${step.id}/demo-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: previewItem.imagePrompt }),
          })
          if (imgRes.ok) {
            const { url } = await imgRes.json()
            setSteps((prev) => prev.map((s) => s.id === step.id ? { ...s, demoImageUrl: url } : s))
          }
        } catch { /* continue with next */ }
      }

      setPreview(null)
      setImageProgress(null)
    } catch { alert('Failed to accept preview') }
    setAccepting(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/clips/${clipId}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSteps(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function generateDemoImage(stepIdx: number) {
    const step = steps[stepIdx]
    if (!step.id) { alert('Save steps first before generating images.'); return }
    setGeneratingImage(step.id)
    try {
      const res = await fetch(`/api/admin/clips/${clipId}/steps/${step.id}/demo-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const { url } = await res.json()
        updateStep(stepIdx, 'demoImageUrl', url)
      }
    } catch { /* ignore */ }
    setGeneratingImage(null)
  }

  async function generateVoice(stepIdx: number) {
    const step = steps[stepIdx]
    if (!step.id) { alert('Save steps first before generating voice.'); return }
    setGeneratingVoice(step.id)
    try {
      const res = await fetch(`/api/admin/clips/${clipId}/steps/${step.id}/voice`, {
        method: 'POST',
      })
      if (res.ok) {
        const { voiceUrl } = await res.json()
        updateStep(stepIdx, 'voiceUrl', voiceUrl)
      }
    } catch { /* ignore */ }
    setGeneratingVoice(null)
  }

  const inputCls = 'w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-400/50'

  if (loading) return <div className="text-sm text-text-muted py-4">Loading steps...</div>

  return (
    <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Practice Steps</h3>
        <button
          onClick={addStep}
          className="flex items-center gap-1 text-xs font-medium text-accent-400 hover:text-accent-300 transition-colors"
        >
          <Plus size={12} /> Add Step
        </button>
      </div>

      {/* AI Generate Section */}
      <div className="bg-gradient-to-r from-purple-500/5 to-accent-400/5 border border-purple-400/15 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <Sparkles size={12} className="text-purple-400" />
              AI Practice Guide Generator
            </p>
            <p className="text-[10px] text-text-tertiary mt-0.5">
              Auto-generate steps with demo images from clip data
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || accepting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-500/15 text-purple-400 rounded-lg hover:bg-purple-500/25 disabled:opacity-40 transition-colors"
          >
            {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {generating ? 'Generating...' : 'Generate Practice Guide'}
          </button>
        </div>
      </div>

      {/* AI Preview */}
      {preview && (
        <div className="border border-purple-400/20 bg-purple-500/[0.03] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-purple-400">AI Generated Preview — Edit before saving</p>
            <button onClick={() => setPreview(null)} className="text-text-muted hover:text-text-primary"><X size={14} /></button>
          </div>

          <div className="space-y-3">
            {preview.map((ps, idx) => (
              <div key={idx} className="bg-bg-surface border border-black/[0.06] rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-purple-400">#{ps.stepNumber}</span>
                  <input
                    className={`${inputCls} flex-1 text-xs`}
                    value={ps.skillFocus}
                    onChange={(e) => updatePreviewStep(idx, 'skillFocus', e.target.value)}
                  />
                  <input
                    className={`${inputCls} w-16 text-xs text-center`}
                    type="number"
                    min={5}
                    max={60}
                    value={ps.targetDurationSec}
                    onChange={(e) => updatePreviewStep(idx, 'targetDurationSec', parseInt(e.target.value) || 20)}
                  />
                  <button onClick={() => removePreviewStep(idx)} className="text-text-muted hover:text-red-400"><Trash2 size={12} /></button>
                </div>
                <textarea
                  className={`${inputCls} min-h-[48px] resize-none text-xs`}
                  value={ps.instruction}
                  onChange={(e) => updatePreviewStep(idx, 'instruction', e.target.value)}
                  placeholder="Instruction..."
                />
                <input
                  className={`${inputCls} text-xs`}
                  value={ps.tip ?? ''}
                  onChange={(e) => updatePreviewStep(idx, 'tip', e.target.value || null)}
                  placeholder="Tip (optional)"
                />
                <details className="text-[10px]">
                  <summary className="text-text-muted cursor-pointer hover:text-text-secondary">Image prompt</summary>
                  <textarea
                    className={`${inputCls} mt-1 min-h-[36px] resize-none text-[10px]`}
                    value={ps.imagePrompt}
                    onChange={(e) => updatePreviewStep(idx, 'imagePrompt', e.target.value)}
                  />
                </details>
              </div>
            ))}
          </div>

          {imageProgress && (
            <p className="text-[10px] text-purple-400 mt-2 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> {imageProgress}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/[0.06]">
            <button
              onClick={handleAcceptPreview}
              disabled={accepting || preview.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-500/15 text-emerald-400 rounded-lg hover:bg-emerald-500/25 disabled:opacity-40 transition-colors"
            >
              {accepting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
              {accepting ? (imageProgress || 'Saving...') : `Accept & Save with Images (${preview.length} steps)`}
            </button>
            <button
              onClick={() => setPreview(null)}
              disabled={accepting}
              className="px-3 py-2 text-xs text-text-muted hover:text-text-secondary disabled:opacity-40"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {steps.length === 0 && !preview ? (
        <p className="text-xs text-text-muted py-4 text-center">No practice steps yet. Use AI Generate or add one manually.</p>
      ) : steps.length === 0 ? null : (
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={step.id ?? `new-${idx}`} className="bg-bg-overlay border border-black/[0.04] rounded-xl p-4 space-y-3">
              {/* Header: step number + controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent-400 w-6">#{step.stepNumber}</span>
                <input
                  className={`${inputCls} flex-1`}
                  value={step.skillFocus}
                  onChange={(e) => updateStep(idx, 'skillFocus', e.target.value)}
                  placeholder="Skill Focus (e.g., Eye Contact)"
                />
                <button onClick={() => moveStep(idx, -1)} disabled={idx === 0} className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30"><ChevronUp size={14} /></button>
                <button onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1} className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30"><ChevronDown size={14} /></button>
                <button onClick={() => removeStep(idx)} className="p-1 text-text-muted hover:text-red-400"><Trash2 size={14} /></button>
              </div>

              {/* Instruction */}
              <textarea
                className={`${inputCls} min-h-[60px] resize-none`}
                value={step.instruction}
                onChange={(e) => updateStep(idx, 'instruction', e.target.value)}
                placeholder="Main instruction for this step..."
              />

              {/* Tip + Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <input
                    className={inputCls}
                    value={step.tip ?? ''}
                    onChange={(e) => updateStep(idx, 'tip', e.target.value || null)}
                    placeholder="Tip (optional)"
                  />
                </div>
                <div>
                  <input
                    className={inputCls}
                    type="number"
                    min={5}
                    max={60}
                    value={step.targetDurationSec}
                    onChange={(e) => updateStep(idx, 'targetDurationSec', parseInt(e.target.value) || 20)}
                  />
                  <span className="text-[10px] text-text-muted mt-0.5 block">Duration (sec)</span>
                </div>
              </div>

              {/* Sub-steps */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Sub-steps</span>
                  <button onClick={() => addSubStep(idx)} className="text-[10px] text-accent-400 hover:text-accent-300">+ Add</button>
                </div>
                {step.subSteps && step.subSteps.length > 0 ? (
                  <div className="space-y-1.5">
                    {step.subSteps.map((sub, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <span className="text-[10px] text-text-muted w-4">{sub.order}.</span>
                        <input
                          className={`${inputCls} flex-1 text-xs`}
                          value={sub.text}
                          onChange={(e) => updateSubStep(idx, si, e.target.value)}
                          placeholder="Sub-step instruction..."
                        />
                        <button onClick={() => removeSubStep(idx, si)} className="text-text-muted hover:text-red-400"><Trash2 size={10} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-text-muted italic">No sub-steps</p>
                )}
              </div>

              {/* Demo Image + Voice */}
              <div className="flex items-center gap-3 pt-2 border-t border-black/[0.04]">
                {/* Demo image */}
                <div className="flex items-center gap-2">
                  {step.demoImageUrl ? (
                    <a href={step.demoImageUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg overflow-hidden bg-bg-inset">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={step.demoImageUrl} alt="Demo" className="w-full h-full object-cover" />
                    </a>
                  ) : null}
                  <button
                    onClick={() => generateDemoImage(idx)}
                    disabled={!step.id || generatingImage === step.id}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-blue-500/10 text-blue-400 rounded-md hover:bg-blue-500/20 disabled:opacity-40"
                  >
                    {generatingImage === step.id ? <Loader2 size={10} className="animate-spin" /> : <ImageIcon size={10} />}
                    {step.demoImageUrl ? 'Regen Image' : 'Gen Image'}
                  </button>
                </div>

                {/* Voice */}
                <div className="flex items-center gap-2">
                  {step.voiceUrl ? (
                    <>
                      <CheckCircle size={12} className="text-emerald-400" />
                      <audio src={step.voiceUrl} controls className="h-6 w-32" />
                    </>
                  ) : null}
                  <button
                    onClick={() => generateVoice(idx)}
                    disabled={!step.id || generatingVoice === step.id}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-purple-500/10 text-purple-400 rounded-md hover:bg-purple-500/20 disabled:opacity-40"
                  >
                    {generatingVoice === step.id ? <Loader2 size={10} className="animate-spin" /> : <Mic size={10} />}
                    {step.voiceUrl ? 'Regen Voice' : 'Gen Voice'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-black/[0.06]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-accent-400 text-bg-base rounded-lg hover:bg-accent-300 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <CheckCircle size={12} /> : <Save size={12} />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Steps'}
        </button>
        <span className="text-[10px] text-text-muted">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
