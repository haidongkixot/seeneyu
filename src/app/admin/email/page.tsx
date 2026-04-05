'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, CheckCircle, XCircle, Edit, Eye, ToggleLeft, ToggleRight } from 'lucide-react'

interface Template {
  id: string
  slug: string
  triggerType: string
  subject: string | null
  title: string
  isActive: boolean
  variables: string[]
  updatedAt: string
}

const TRIGGER_LABELS: Record<string, string> = {
  welcome: 'User signs up',
  onboarding_day1: '24h after signup',
  onboarding_day3: '72h, no practice yet',
  trial_started: 'Trial activated',
  trial_expiring: '2 days before trial ends',
  trial_expired: 'Trial ended',
  payment_receipt: 'Payment completed',
  feedback_ready: 'AI feedback generated',
  streak_milestone: 'Streak 7/14/21/30 days',
  level_up: 'New level reached',
  weekly_report: 'Every Sunday',
  re_engagement_3d: '3 days inactive',
  re_engagement_7d: '7 days inactive',
  re_engagement_30d: '30 days inactive',
  upgrade_nudge: 'Free user hits limit',
  cancellation_confirm: 'Subscription cancelled',
  referral_reward: 'Friend signs up via referral',
}

const CATEGORY: Record<string, string> = {
  welcome: 'Onboarding',
  onboarding_day1: 'Onboarding',
  onboarding_day3: 'Onboarding',
  trial_started: 'Trial',
  trial_expiring: 'Trial',
  trial_expired: 'Trial',
  payment_receipt: 'Payment',
  feedback_ready: 'Engagement',
  streak_milestone: 'Gamification',
  level_up: 'Gamification',
  weekly_report: 'Report',
  re_engagement_3d: 'Re-engagement',
  re_engagement_7d: 'Re-engagement',
  re_engagement_30d: 'Re-engagement',
  upgrade_nudge: 'Conversion',
  cancellation_confirm: 'Retention',
  referral_reward: 'Growth',
}

export default function AdminEmailPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/email/templates')
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/admin/email/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) {
      setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, isActive: !current } : t))
    }
  }

  if (loading) return <div className="p-8 text-text-muted text-sm">Loading...</div>

  // Group by category
  const grouped: Record<string, Template[]> = {}
  for (const t of templates) {
    const cat = CATEGORY[t.triggerType] || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(t)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Mail size={24} className="text-accent-400" />
            Email Marketing
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {templates.length} lifecycle templates · {templates.filter((t) => t.isActive).length} active
          </p>
        </div>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">{category}</h2>
          <div className="space-y-2">
            {items.map((t) => (
              <div
                key={t.id}
                className={`bg-bg-surface border rounded-xl p-4 flex items-center gap-4 transition-all ${
                  t.isActive ? 'border-black/[0.06]' : 'border-black/[0.04] opacity-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-text-primary">{t.title}</span>
                    {t.isActive ? (
                      <CheckCircle size={12} className="text-emerald-400" />
                    ) : (
                      <XCircle size={12} className="text-text-muted" />
                    )}
                  </div>
                  <p className="text-xs text-text-tertiary truncate">{t.subject}</p>
                  <p className="text-[10px] text-text-muted mt-1">
                    Trigger: {TRIGGER_LABELS[t.triggerType] || t.triggerType} ·
                    Variables: {(t.variables as string[]).join(', ') || 'none'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(t.id, t.isActive)}
                    className="text-text-muted hover:text-text-primary transition-colors"
                    title={t.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {t.isActive ? <ToggleRight size={20} className="text-emerald-400" /> : <ToggleLeft size={20} />}
                  </button>
                  <Link
                    href={`/admin/email/${t.id}/edit`}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-accent-400/10 text-accent-400 rounded-lg hover:bg-accent-400/20 transition-colors"
                  >
                    <Edit size={11} /> Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
