'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Upload } from 'lucide-react'

interface SettingState {
  logo: string
  footer_text: string
  social_links: string
}

export default function AdminCmsSettingsPage() {
  const [settings, setSettings] = useState<SettingState>({
    logo: '',
    footer_text: '',
    social_links: '{}',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/cms/settings/logo').then(r => r.ok ? r.json() : null),
      fetch('/api/admin/cms/settings/footer_text').then(r => r.ok ? r.json() : null),
      fetch('/api/admin/cms/settings/social_links').then(r => r.ok ? r.json() : null),
    ]).then(([logo, footer, social]) => {
      setSettings({
        logo: typeof logo?.value === 'string' ? logo.value : (logo?.value?.url ?? ''),
        footer_text: typeof footer?.value === 'string' ? footer.value : (footer?.value?.text ?? ''),
        social_links: social?.value ? JSON.stringify(social.value, null, 2) : '{}',
      })
      setLoading(false)
    })
  }, [])

  async function handleUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/cms/upload', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setSettings(s => ({ ...s, logo: url }))
    }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')

    let socialLinksJson: unknown
    try {
      socialLinksJson = JSON.parse(settings.social_links)
    } catch {
      setMessage('Invalid JSON in social links')
      setSaving(false)
      return
    }

    try {
      await Promise.all([
        fetch('/api/admin/cms/settings/logo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: { url: settings.logo } }),
        }),
        fetch('/api/admin/cms/settings/footer_text', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: { text: settings.footer_text } }),
        }),
        fetch('/api/admin/cms/settings/social_links', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: socialLinksJson }),
        }),
      ])
      setMessage('Settings saved successfully')
    } catch {
      setMessage('Error saving settings')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="p-8 text-text-muted">Loading...</div>
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Site Settings</h1>
      <p className="text-text-secondary text-sm mb-8">Global site configuration.</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Logo URL</label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={settings.logo}
              onChange={e => setSettings(s => ({ ...s, logo: e.target.value }))}
              className="flex-1 bg-bg-surface border border-black/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
            />
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-bg-elevated border border-black/8 rounded-xl px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {settings.logo && (
            <img src={settings.logo} alt="Logo preview" className="mt-2 h-10 object-contain" />
          )}
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Footer Text</label>
          <textarea
            value={settings.footer_text}
            onChange={e => setSettings(s => ({ ...s, footer_text: e.target.value }))}
            rows={3}
            className="w-full bg-bg-surface border border-black/8 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Social Links (JSON)</label>
          <textarea
            value={settings.social_links}
            onChange={e => setSettings(s => ({ ...s, social_links: e.target.value }))}
            rows={6}
            className="w-full bg-bg-surface border border-black/8 rounded-xl px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent-400/50 resize-y"
          />
          <p className="text-xs text-text-muted mt-1">
            Example: {`{"twitter": "https://...", "github": "https://...", "linkedin": "https://..."}`}
          </p>
        </div>

        {message && (
          <p className={`text-sm ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-accent-400 text-text-inverse rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-accent-500 disabled:opacity-50 transition-all duration-150"
        >
          <Save size={15} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
