'use client'

import { useState, useEffect } from 'react'
import {
  Save, Loader2, CheckCircle, Plus, Trash2, Upload,
  ToggleLeft, ToggleRight, Compass, Sparkles,
} from 'lucide-react'

interface Slide { id: string; title: string; description: string; imageUrl: string; order: number }
interface Step { id: string; order: number; targetSelector: string; title: string; description: string; imageUrl: string; position: string; action: string; actionUrl: string; page: string }
interface Rewards { xpAmount: number; kudosTitle: string; kudosMessage: string }

function uid() { return Math.random().toString(36).slice(2, 10) }

export default function OnboardingTourAdmin() {
  const [enabled, setEnabled] = useState(false)
  const [slides, setSlides] = useState<Slide[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [rewards, setRewards] = useState<Rewards>({ xpAmount: 150, kudosTitle: 'Tour Complete!', kudosMessage: "You're ready to start your body language journey!" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/cms/settings/onboarding_tour')
      .then((r) => r.json())
      .then((data) => {
        const v = data.value || data
        if (v.enabled !== undefined) setEnabled(v.enabled)
        if (v.slides) setSlides(v.slides)
        if (v.steps) setSteps(v.steps)
        if (v.rewards) setRewards(v.rewards)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/admin/cms/settings/onboarding_tour', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: { enabled, slides, steps, rewards } }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  const inputCls = 'w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-400/50'

  if (loading) return <div className="p-8 text-text-muted text-sm">Loading...</div>

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Compass size={24} className="text-accent-400" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Onboarding Tour</h1>
          <p className="text-sm text-text-secondary">Configure the guided tour for new users</p>
        </div>
      </div>

      {/* Enable/Disable */}
      <div className="bg-bg-surface border border-black/[0.06] rounded-xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">Tour Status</p>
          <p className="text-xs text-text-muted">When enabled, new users see the tour on first login</p>
        </div>
        <button onClick={() => setEnabled(!enabled)}>
          {enabled ? <ToggleRight size={28} className="text-emerald-400" /> : <ToggleLeft size={28} className="text-text-muted" />}
        </button>
      </div>

      {/* Intro Slides */}
      <div className="bg-bg-surface border border-black/[0.06] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Intro Slides ({slides.length})</h2>
          <button onClick={() => setSlides([...slides, { id: uid(), title: '', description: '', imageUrl: '', order: slides.length + 1 }])} className="text-[10px] text-accent-400 hover:text-accent-300 flex items-center gap-0.5"><Plus size={10} /> Add</button>
        </div>
        <div className="space-y-3">
          {slides.map((s, i) => (
            <div key={s.id} className="bg-bg-overlay border border-black/[0.04] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-accent-400">Slide {i + 1}</span>
                <button onClick={() => setSlides(slides.filter((_, j) => j !== i))} className="text-text-muted hover:text-red-400"><Trash2 size={10} /></button>
              </div>
              <input className={`${inputCls} text-xs`} value={s.title} onChange={(e) => { const n = [...slides]; n[i] = { ...n[i], title: e.target.value }; setSlides(n) }} placeholder="Title" />
              <textarea className={`${inputCls} text-xs min-h-[40px] resize-none`} value={s.description} onChange={(e) => { const n = [...slides]; n[i] = { ...n[i], description: e.target.value }; setSlides(n) }} placeholder="Description" />
              <input className={`${inputCls} text-xs`} value={s.imageUrl} onChange={(e) => { const n = [...slides]; n[i] = { ...n[i], imageUrl: e.target.value }; setSlides(n) }} placeholder="Image URL" />
            </div>
          ))}
        </div>
      </div>

      {/* Tour Steps */}
      <div className="bg-bg-surface border border-black/[0.06] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Tour Steps ({steps.length})</h2>
          <button onClick={() => setSteps([...steps, { id: uid(), order: steps.length + 1, targetSelector: '', title: '', description: '', imageUrl: '', position: 'bottom', action: 'observe', actionUrl: '', page: '' }])} className="text-[10px] text-accent-400 hover:text-accent-300 flex items-center gap-0.5"><Plus size={10} /> Add</button>
        </div>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={s.id} className="bg-bg-overlay border border-black/[0.04] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-accent-400">Step {i + 1}</span>
                <button onClick={() => setSteps(steps.filter((_, j) => j !== i))} className="text-text-muted hover:text-red-400"><Trash2 size={10} /></button>
              </div>
              <input className={`${inputCls} text-xs`} value={s.title} onChange={(e) => { const n = [...steps]; n[i] = { ...n[i], title: e.target.value }; setSteps(n) }} placeholder="Title (e.g. Browse the Library)" />
              <textarea className={`${inputCls} text-xs min-h-[36px] resize-none`} value={s.description} onChange={(e) => { const n = [...steps]; n[i] = { ...n[i], description: e.target.value }; setSteps(n) }} placeholder="Description" />
              <div className="grid grid-cols-2 gap-2">
                <input className={`${inputCls} text-xs`} value={s.targetSelector} onChange={(e) => { const n = [...steps]; n[i] = { ...n[i], targetSelector: e.target.value }; setSteps(n) }} placeholder='CSS Selector (e.g. [data-tour="nav-library"])' />
                <select className={`${inputCls} text-xs`} value={s.position} onChange={(e) => { const n = [...steps]; n[i] = { ...n[i], position: e.target.value }; setSteps(n) }}>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className={`${inputCls} text-xs`} value={s.page} onChange={(e) => { const n = [...steps]; n[i] = { ...n[i], page: e.target.value }; setSteps(n) }} placeholder="Page path (e.g. /dashboard)" />
                <input className={`${inputCls} text-xs`} value={s.imageUrl} onChange={(e) => { const n = [...steps]; n[i] = { ...n[i], imageUrl: e.target.value }; setSteps(n) }} placeholder="Image URL (optional)" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards */}
      <div className="bg-bg-surface border border-black/[0.06] rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-1.5"><Sparkles size={14} className="text-accent-400" /> Rewards</h2>
        <div className="space-y-3">
          <input className={inputCls} type="number" value={rewards.xpAmount} onChange={(e) => setRewards({ ...rewards, xpAmount: parseInt(e.target.value) || 0 })} placeholder="XP Amount" />
          <input className={inputCls} value={rewards.kudosTitle} onChange={(e) => setRewards({ ...rewards, kudosTitle: e.target.value })} placeholder="Kudos Title" />
          <textarea className={`${inputCls} min-h-[48px] resize-none`} value={rewards.kudosMessage} onChange={(e) => setRewards({ ...rewards, kudosMessage: e.target.value })} placeholder="Kudos Message" />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent-400 text-bg-base rounded-xl hover:bg-accent-300 disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Tour Config'}
      </button>
    </div>
  )
}
