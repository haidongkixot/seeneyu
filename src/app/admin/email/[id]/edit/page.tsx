'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, CheckCircle, Eye, Send } from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitize-html'

export default function EditEmailTemplatePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const [form, setForm] = useState({
    slug: '',
    triggerType: '',
    subject: '',
    title: '',
    body: '',
    variables: [] as string[],
    isActive: true,
  })

  useEffect(() => {
    fetch(`/api/admin/email/templates/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          slug: data.slug,
          triggerType: data.triggerType,
          subject: data.subject || '',
          title: data.title,
          body: data.body,
          variables: data.variables || [],
          isActive: data.isActive,
        })
        setLoading(false)
      })
  }, [id])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const res = await fetch(`/api/admin/email/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: form.subject,
        title: form.title,
        body: form.body,
        isActive: form.isActive,
      }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  function handlePreview() {
    // Replace variables with sample data for preview
    let html = form.body
    const samples: Record<string, string> = {
      name: 'Alex',
      plan: 'Standard',
      suggestedSkill: 'Eye Contact',
      firstClipUrl: '#',
      clipCount: '65',
      trialEndsAt: 'April 12, 2026',
      daysLeft: '2',
      upgradeUrl: '#',
      amount: '9.99',
      currency: 'USD',
      nextBillingDate: 'May 5, 2026',
      invoiceUrl: '#',
      clipTitle: 'The Pursuit of Happyness',
      score: '82',
      feedbackUrl: '#',
      streakDays: '14',
      xpTotal: '2,450',
      xpEarned: '320',
      badgeName: 'Week Warrior',
      newLevel: '5',
      lessonsCompleted: '8',
      streak: '14',
      topSkill: 'Eye Contact',
      weakSkill: 'Vocal Pacing',
      lastPractice: '3 days ago',
      streakAtRisk: '7',
      newContent: '5 new clips added this week',
      couponCode: 'COMEBACK30',
      limitHit: 'hearts',
      accessUntil: 'May 1, 2026',
      reactivateUrl: '#',
      friendName: 'Jordan',
      rewardXp: '100',
    }
    for (const [key, val] of Object.entries(samples)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val)
    }
    setPreviewHtml(html)
    setShowPreview(true)
  }

  const inputCls = 'w-full bg-bg-inset border border-black/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-400/50'

  if (loading) return <div className="p-8 text-text-muted">Loading...</div>

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/admin/email" className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-4">
        <ArrowLeft size={12} /> Back to Email Templates
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{form.title}</h1>
          <p className="text-xs text-text-muted mt-1">
            Trigger: <code className="bg-bg-inset px-1.5 py-0.5 rounded">{form.triggerType}</code> ·
            Slug: <code className="bg-bg-inset px-1.5 py-0.5 rounded">{form.slug}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-black/10 text-text-secondary hover:text-text-primary rounded-lg transition-colors"
          >
            <Eye size={13} /> Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-accent-400 text-bg-base rounded-lg hover:bg-accent-300 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <CheckCircle size={13} /> : <Save size={13} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Subject Line</label>
          <input
            className={inputCls}
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="Email subject..."
          />
        </div>

        {/* Variables hint */}
        <div className="bg-bg-inset border border-black/[0.06] rounded-xl p-3">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Available Variables</p>
          <div className="flex flex-wrap gap-1.5">
            {form.variables.map((v) => (
              <code key={v} className="text-[10px] bg-accent-400/10 text-accent-400 px-2 py-0.5 rounded-md">
                {'{{' + v + '}}'}
              </code>
            ))}
          </div>
        </div>

        {/* HTML Body */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">HTML Body</label>
          <textarea
            className={`${inputCls} font-mono text-xs min-h-[400px] resize-y`}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="w-4 h-4 rounded accent-accent-400"
          />
          <span className="text-sm text-text-primary">Template active (will be sent when triggered)</span>
        </label>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-[640px] w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 bg-gray-100 border-b">
              <div>
                <p className="text-xs text-gray-500">Subject: {form.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => k === 'name' ? 'Alex' : k)}</p>
                <p className="text-[10px] text-gray-400">From: coach@seeneyu.com</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-sm">Close</button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }} />
          </div>
        </div>
      )}
    </div>
  )
}
