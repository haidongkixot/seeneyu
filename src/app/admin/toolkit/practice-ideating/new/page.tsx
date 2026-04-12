'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lightbulb, Loader2, Sparkles } from 'lucide-react'

const SKILLS = [
  { value: 'eye-contact', label: 'Eye Contact' },
  { value: 'facial-expressions', label: 'Facial Expressions' },
  { value: 'open-posture', label: 'Open Posture' },
  { value: 'active-listening', label: 'Active Listening' },
  { value: 'vocal-pacing', label: 'Vocal Pacing' },
  { value: 'confident-disagreement', label: 'Confident Disagreement' },
] as const

const DEFAULT_SKILL_DISTRIBUTION: Record<string, number> = {
  'eye-contact': 4,
  'facial-expressions': 4,
  'open-posture': 3,
  'active-listening': 3,
  'vocal-pacing': 3,
  'confident-disagreement': 3,
}

const TONE_OPTIONS = [
  'positive, humor',
  'positive, inspiring',
  'professional',
  'dramatic',
  'educational',
  'warm, empathetic',
]

const LANGUAGES = ['English', 'Spanish', 'Vietnamese']

export default function NewBatchPage() {
  const router = useRouter()

  const [name, setName] = useState(() => `batch-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`)
  const [skills, setSkills] = useState<Record<string, number>>({ ...DEFAULT_SKILL_DISTRIBUTION })
  const [difficultyMix, setDifficultyMix] = useState({ beginner: 35, intermediate: 40, advanced: 25 })
  const [stylePixarRatio, setStylePixarRatio] = useState(70)
  const [tone, setTone] = useState('positive, humor')
  const [language, setLanguage] = useState('English')
  const [characterTheme, setCharacterTheme] = useState<'mixed' | 'animals' | 'humans'>('mixed')
  const [pmPrompt, setPmPrompt] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progressMessage, setProgressMessage] = useState<string | null>(null)

  const totalCount = useMemo(() => {
    return Object.values(skills).reduce((a, b) => a + b, 0)
  }, [skills])

  const difficultyTotal = difficultyMix.beginner + difficultyMix.intermediate + difficultyMix.advanced

  function updateSkillCount(skill: string, value: number) {
    setSkills((prev) => ({ ...prev, [skill]: Math.max(0, Math.min(20, value)) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (totalCount < 1 || totalCount > 50) {
      setError(`Total ideas must be 1-50 (currently ${totalCount})`)
      return
    }
    if (Math.abs(difficultyTotal - 100) > 1) {
      setError(`Difficulty percentages must sum to 100 (currently ${difficultyTotal})`)
      return
    }
    if (!name.trim()) {
      setError('Batch name is required')
      return
    }

    setLoading(true)
    setProgressMessage(`Generating ${totalCount} ideas... this takes 30-60 seconds`)

    try {
      const res = await fetch('/api/admin/toolkit/practice-ideating/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          config: {
            totalCount,
            skills,
            difficultyMix,
            stylePixarRatio,
            tone,
            language,
            characterTheme,
            pmPrompt,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      router.push(`/admin/toolkit/practice-ideating/${data.batch.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      setProgressMessage(null)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href="/admin/toolkit/practice-ideating"
        className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to batches
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Lightbulb size={22} className="text-accent-400" />
          New Practice Ideating Batch
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Configure your batch. GPT-4o-mini will generate a catalog and expand every idea into a full video prompt, observation guide, and practice steps.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Batch name */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-2">
            Batch name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="batch-01-positive-humor"
            className="w-full px-4 py-2.5 bg-bg-base border border-black/10 rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-400/40"
          />
        </div>

        {/* Skill distribution */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-widest">
              Skill distribution
            </label>
            <span className={`text-xs font-medium ${totalCount > 50 ? 'text-error' : totalCount === 0 ? 'text-text-tertiary' : 'text-accent-400'}`}>
              Total: {totalCount} {totalCount > 50 && '(max 50)'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SKILLS.map((skill) => (
              <div key={skill.value} className="flex items-center gap-3 p-3 bg-bg-base border border-black/8 rounded-xl">
                <span className="flex-1 text-sm text-text-primary">{skill.label}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateSkillCount(skill.value, (skills[skill.value] || 0) - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-bg-surface border border-black/10 text-text-secondary hover:text-text-primary hover:border-black/20 transition-colors"
                    aria-label={`Decrease ${skill.label}`}
                  >−</button>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={skills[skill.value] || 0}
                    onChange={(e) => updateSkillCount(skill.value, Number(e.target.value))}
                    className="w-12 text-center px-1 py-1 bg-transparent border-none text-sm font-semibold text-text-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateSkillCount(skill.value, (skills[skill.value] || 0) + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-bg-surface border border-black/10 text-text-secondary hover:text-text-primary hover:border-black/20 transition-colors"
                    aria-label={`Increase ${skill.label}`}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-tertiary mt-3">
            Set 0 to skip a skill. Total must be 1-50.
          </p>
        </div>

        {/* Difficulty mix */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-widest">
              Difficulty mix (%)
            </label>
            <span className={`text-xs font-medium ${Math.abs(difficultyTotal - 100) > 1 ? 'text-error' : 'text-accent-400'}`}>
              Total: {difficultyTotal}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
              <div key={level} className="p-3 bg-bg-base border border-black/8 rounded-xl">
                <div className="text-xs text-text-tertiary capitalize mb-1">{level}</div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={difficultyMix[level]}
                  onChange={(e) => setDifficultyMix((prev) => ({ ...prev, [level]: Number(e.target.value) }))}
                  className="w-full text-lg font-bold text-text-primary bg-transparent border-none focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Style + Character theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
            <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-3">
              Filming style (% Pixar-3D vs realistic)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={stylePixarRatio}
                onChange={(e) => setStylePixarRatio(Number(e.target.value))}
                className="flex-1 accent-accent-400"
              />
              <span className="text-sm font-semibold text-text-primary w-20 text-right">
                {stylePixarRatio}% / {100 - stylePixarRatio}%
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Pixar = cartoon (Kung Fu Panda/Coco/Madagascar). Realistic = cinematic short film.
            </p>
          </div>

          <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
            <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-3">
              Character theme
            </label>
            <div className="flex gap-2">
              {(['mixed', 'animals', 'humans'] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setCharacterTheme(theme)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    characterTheme === theme
                      ? 'bg-accent-400/15 text-accent-400 border border-accent-400/40'
                      : 'bg-bg-base text-text-secondary border border-black/10 hover:border-black/20'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tone + Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
            <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-2">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg-base border border-black/10 rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-400/40"
            >
              {TONE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
            <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg-base border border-black/10 rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-400/40"
            >
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* PM prompt */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
          <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-widest mb-2">
            PM notes (optional, freeform)
          </label>
          <textarea
            value={pmPrompt}
            onChange={(e) => setPmPrompt(e.target.value)}
            rows={5}
            placeholder="Any specific themes, scenarios, or constraints the AI should consider. E.g. 'Focus on workplace scenarios. Avoid romance settings. Characters should be teens or young adults.'"
            className="w-full px-4 py-3 bg-bg-base border border-black/10 rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-400/40 resize-y"
          />
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 rounded-xl p-4 text-sm text-error">
            {error}
          </div>
        )}

        {progressMessage && (
          <div className="bg-accent-400/10 border border-accent-400/30 rounded-xl p-4 text-sm text-accent-400 flex items-center gap-3">
            <Loader2 size={16} className="animate-spin" />
            {progressMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/toolkit/practice-ideating"
            className="px-5 py-2.5 rounded-xl border border-black/10 text-sm text-text-secondary hover:text-text-primary hover:border-black/20 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || totalCount < 1 || totalCount > 50}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-400 text-text-inverse text-sm font-semibold hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Generating...' : `Generate ${totalCount} Ideas`}
          </button>
        </div>
      </form>
    </div>
  )
}
