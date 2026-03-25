'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Plus, Pencil, X } from 'lucide-react'

interface PlanData {
  id: string
  slug: string
  name: string
  tagline: string | null
  monthlyPrice: number
  annualPrice: number | null
  features: string[]
  videoLimitSec: number
  isActive: boolean
  _count: { subscriptions: number }
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanData[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<PlanData | null>(null)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    fetch('/api/admin/plans')
      .then(r => r.json())
      .then(d => { setPlans(d); setLoading(false) })
  }, [])

  async function handleSave(data: any) {
    if (data.id) {
      // Update
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const plan = await res.json()
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...plan, _count: p._count } : p))
      }
    } else {
      // Create
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const plan = await res.json()
        setPlans(prev => [...prev, { ...plan, _count: { subscriptions: 0 } }])
      }
    }
    setEditing(null)
    setShowNew(false)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <CreditCard size={24} />
            Subscription Plans
          </h1>
          <p className="text-text-secondary text-sm mt-1">{plans.length} plans configured</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all duration-150"
        >
          <Plus size={15} />
          Add Plan
        </button>
      </div>

      <div className="bg-bg-surface border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Name</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Slug</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Monthly</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Annual</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Subscribers</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Status</th>
              <th className="text-right px-4 py-3 text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-text-muted">Loading…</td></tr>
            ) : plans.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-text-muted">No plans yet. Create the default plans.</td></tr>
            ) : (
              plans.map(plan => (
                <tr key={plan.id} className="border-b border-white/5 hover:bg-bg-overlay transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <PlanBadgeInline plan={plan.slug} />
                      <span className="text-text-primary font-medium">{plan.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{plan.slug}</td>
                  <td className="px-4 py-3 text-text-primary">{plan.monthlyPrice === 0 ? 'Free' : `$${plan.monthlyPrice}`}</td>
                  <td className="px-4 py-3 text-text-primary">{plan.annualPrice ? `$${plan.annualPrice}` : '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{plan._count.subscriptions}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${plan.isActive ? 'bg-green-900/40 text-green-400' : 'bg-bg-inset text-text-muted'}`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(plan)}
                      className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-overlay rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/New Modal */}
      {(editing || showNew) && (
        <PlanModal
          plan={editing}
          onSave={handleSave}
          onClose={() => { setEditing(null); setShowNew(false) }}
        />
      )}
    </div>
  )
}

function PlanBadgeInline({ plan }: { plan: string }) {
  const config: Record<string, string> = {
    basic: 'bg-white/5 text-text-tertiary border-white/10',
    standard: 'bg-accent-400/10 text-accent-400 border-accent-400/25',
    advanced: 'bg-violet-500/10 text-violet-300 border-violet-500/25',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-semibold border ${config[plan] || config.basic}`}>
      {plan}
    </span>
  )
}

function PlanModal({ plan, onSave, onClose }: {
  plan: PlanData | null
  onSave: (data: any) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    id: plan?.id || '',
    slug: plan?.slug || '',
    name: plan?.name || '',
    tagline: plan?.tagline || '',
    monthlyPrice: plan?.monthlyPrice ?? 0,
    annualPrice: plan?.annualPrice ?? 0,
    features: plan?.features?.join('\n') || '',
    videoLimitSec: plan?.videoLimitSec ?? 5,
    isActive: plan?.isActive ?? true,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      ...form,
      features: form.features.split('\n').filter(f => f.trim()),
      annualPrice: form.annualPrice || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-elevated border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h2 className="text-lg font-bold text-text-primary">{plan ? 'Edit Plan' : 'New Plan'}</h2>
          <button onClick={onClose} className="p-1 text-text-tertiary hover:text-text-primary"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                className="w-full bg-bg-inset border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Slug</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required
                disabled={!!plan}
                className="w-full bg-bg-inset border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50 disabled:opacity-50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Tagline</label>
            <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
              className="w-full bg-bg-inset border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Monthly ($)</label>
              <input type="number" step="0.01" min={0} value={form.monthlyPrice}
                onChange={e => setForm(f => ({ ...f, monthlyPrice: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-bg-inset border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Annual ($)</label>
              <input type="number" step="0.01" min={0} value={form.annualPrice}
                onChange={e => setForm(f => ({ ...f, annualPrice: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-bg-inset border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Video Limit (s)</label>
              <input type="number" min={1} value={form.videoLimitSec}
                onChange={e => setForm(f => ({ ...f, videoLimitSec: parseInt(e.target.value) || 5 }))}
                className="w-full bg-bg-inset border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Features (one per line)</label>
            <textarea rows={5} value={form.features}
              onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
              className="w-full bg-bg-inset border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50" />
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="rounded" />
            Active
          </label>
          <div className="flex gap-2 pt-2">
            <button type="submit"
              className="bg-accent-400 text-text-inverse rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-accent-500 transition-all">
              Save
            </button>
            <button type="button" onClick={onClose}
              className="px-6 py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
