'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Loader2,
  Save,
  CheckCircle2,
  Eye,
  X,
} from 'lucide-react'

interface Template {
  id: string
  slug: string
  triggerType: string
  channel: string
  subject: string | null
  title: string
  body: string
  variables: string[]
  locale: string
  isActive: boolean
  updatedAt: string
}

export default function EngineTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Template | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/engine/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/engine/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          slug: editing.slug,
          triggerType: editing.triggerType,
          channel: editing.channel,
          subject: editing.subject,
          title: editing.title,
          bodyText: editing.body,
          variables: editing.variables,
          isActive: editing.isActive,
        }),
      })
      if (res.ok) {
        const { template } = await res.json()
        setTemplates((prev) =>
          prev.map((t) => (t.id === template.id ? { ...t, ...template } : t))
        )
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const previewBody = (body: string) => {
    // Replace variables with sample data
    let rendered = body
      .replace(/\{\{userName\}\}/g, 'Jane Doe')
      .replace(/\{\{streakCount\}\}/g, '7')
      .replace(/\{\{skill\}\}/g, 'Eye Contact')
      .replace(/\{\{level\}\}/g, '5')
      .replace(/\{\{badge\}\}/g, 'Body Language Pro')
      .replace(/\{\{xp\}\}/g, '1500')
      .replace(/\{\{[^}]+\}\}/g, '[sample]')
    return rendered
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/engine"
          className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-overlay transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-accent-400" />
          <h1 className="text-xl font-bold text-text-primary">Notification Templates</h1>
        </div>
      </div>

      {/* Template list */}
      <div className="space-y-3">
        {templates.length === 0 && (
          <p className="text-sm text-text-muted bg-bg-surface border border-black/8 rounded-2xl p-6">
            No templates found. Templates are created by the engine scheduler.
          </p>
        )}
        {templates.map((t) => (
          <div
            key={t.id}
            className="bg-bg-surface border border-black/8 rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-bg-overlay px-2 py-0.5 rounded text-text-secondary">
                  {t.slug}
                </span>
                <span className="text-xs text-text-tertiary capitalize">
                  {t.channel.replace('_', ' ')} &middot; {t.triggerType}
                </span>
                {!t.isActive && (
                  <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full font-semibold">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreview(preview === t.id ? null : t.id)}
                  className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-overlay transition-colors"
                  title="Preview"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => setEditing(editing?.id === t.id ? null : { ...t })}
                  className="px-3 py-1 text-xs font-medium bg-accent-400/10 text-accent-400 rounded-lg hover:bg-accent-400/20 transition-colors"
                >
                  {editing?.id === t.id ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            {/* Preview */}
            {preview === t.id && (
              <div className="bg-bg-overlay border border-black/5 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-text-secondary">Preview with sample data:</p>
                <p className="text-sm font-semibold text-text-primary">{previewBody(t.title)}</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{previewBody(t.body)}</p>
              </div>
            )}

            {/* Edit form */}
            {editing?.id === t.id && (
              <div className="space-y-3 border-t border-black/8 pt-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1 block">Slug</label>
                    <input
                      value={editing.slug}
                      onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm bg-bg-base border border-black/8 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-400/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1 block">Trigger Type</label>
                    <input
                      value={editing.triggerType}
                      onChange={(e) => setEditing({ ...editing, triggerType: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm bg-bg-base border border-black/8 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-400/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1 block">Channel</label>
                    <select
                      value={editing.channel}
                      onChange={(e) => setEditing({ ...editing, channel: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm bg-bg-base border border-black/8 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-400/40 appearance-none"
                    >
                      <option value="in_app">In-App</option>
                      <option value="push">Push</option>
                      <option value="email">Email</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Title</label>
                  <input
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-bg-base border border-black/8 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-400/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Body</label>
                  <textarea
                    value={editing.body}
                    onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-1.5 text-sm bg-bg-base border border-black/8 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-400/40 resize-y"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">
                    Variables (comma-separated)
                  </label>
                  <input
                    value={Array.isArray(editing.variables) ? editing.variables.join(', ') : ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        variables: e.target.value.split(',').map((v) => v.trim()).filter(Boolean),
                      })
                    }
                    placeholder="userName, streakCount, skill"
                    className="w-full px-3 py-1.5 text-sm bg-bg-base border border-black/8 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-400/40"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.isActive}
                      onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                      className="rounded border-black/20"
                    />
                    Active
                  </label>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold bg-accent-400 text-text-inverse rounded-lg hover:bg-accent-500 transition-colors disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : saved ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Save size={14} />
                    )}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
