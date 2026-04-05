'use client'

import { useState, useEffect } from 'react'
import {
  Save, Loader2, CheckCircle, Plus, Trash2, Upload,
  Image as ImageIcon, Type, Film, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Section Definitions ─────────────────────────────────────────

const SECTION_DEFS: {
  key: string
  label: string
  page: string
  description: string
  fields: { name: string; type: 'text' | 'textarea' | 'image' | 'video' | 'url'; label: string }[]
  repeatable?: boolean
}[] = [
  {
    key: 'section_home_hero',
    label: 'Homepage Hero',
    page: 'Homepage',
    description: 'Main hero section with title, subtitle, CTA',
    fields: [
      { name: 'title', type: 'text', label: 'Title' },
      { name: 'subtitle', type: 'textarea', label: 'Subtitle' },
      { name: 'cta1Text', type: 'text', label: 'Primary CTA Text' },
      { name: 'cta1Url', type: 'url', label: 'Primary CTA URL' },
      { name: 'cta2Text', type: 'text', label: 'Secondary CTA Text' },
      { name: 'cta2Url', type: 'url', label: 'Secondary CTA URL' },
      { name: 'badge', type: 'text', label: 'Badge Text' },
      { name: 'heroImage', type: 'image', label: 'Hero Background Image' },
      { name: 'cardImage', type: 'image', label: 'Preview Card Image (right side)' },
      { name: 'cardSkill', type: 'text', label: 'Preview Card Skill Label' },
      { name: 'cardDuration', type: 'text', label: 'Preview Card Duration' },
      { name: 'cardQuote', type: 'textarea', label: 'Preview Card Quote' },
      { name: 'cardScore', type: 'text', label: 'Preview Card AI Score (0-100)' },
    ],
  },
  {
    key: 'section_home_mission',
    label: 'Mission Statement',
    page: 'Homepage',
    description: 'Mission section title and description',
    fields: [
      { name: 'title', type: 'text', label: 'Title' },
      { name: 'description', type: 'textarea', label: 'Description' },
      { name: 'image', type: 'image', label: 'Image' },
    ],
  },
  {
    key: 'section_home_skills',
    label: 'Skills Section',
    page: 'Homepage',
    description: 'Skills section title + individual skill cards',
    fields: [
      { name: 'sectionTitle', type: 'text', label: 'Section Title' },
      { name: 'sectionSubtitle', type: 'text', label: 'Section Subtitle' },
    ],
    repeatable: true,
  },
  {
    key: 'section_home_video',
    label: 'Demo Video',
    page: 'Homepage',
    description: '"See it in action" section — video URL, title, subtitle',
    fields: [
      { name: 'title', type: 'text', label: 'Title' },
      { name: 'subtitle', type: 'textarea', label: 'Subtitle' },
      { name: 'videoUrl', type: 'url', label: 'Video URL (YouTube or direct MP4)' },
      { name: 'badge', type: 'text', label: 'Badge Text (shown on placeholder)' },
    ],
  },
  {
    key: 'section_home_testimonials',
    label: 'Testimonials',
    page: 'Homepage',
    description: 'Customer testimonials with name, role, quote',
    fields: [],
    repeatable: true,
  },
  {
    key: 'section_home_team',
    label: 'Team Members',
    page: 'Homepage',
    description: 'Team section with member cards',
    fields: [
      { name: 'sectionTitle', type: 'text', label: 'Section Title' },
    ],
    repeatable: true,
  },
  {
    key: 'section_home_cta',
    label: 'CTA Banner',
    page: 'Homepage',
    description: 'Bottom call-to-action banner',
    fields: [
      { name: 'title', type: 'text', label: 'Title' },
      { name: 'subtitle', type: 'text', label: 'Subtitle' },
      { name: 'ctaText', type: 'text', label: 'CTA Button Text' },
      { name: 'ctaUrl', type: 'url', label: 'CTA Button URL' },
    ],
  },
  {
    key: 'section_pricing_hero',
    label: 'Pricing Hero',
    page: 'Pricing',
    description: 'Pricing page hero copy',
    fields: [
      { name: 'title', type: 'text', label: 'Title' },
      { name: 'subtitle', type: 'textarea', label: 'Subtitle' },
      { name: 'badge', type: 'text', label: 'Badge Text' },
    ],
  },
  {
    key: 'section_pricing_testimonials',
    label: 'Pricing Testimonials',
    page: 'Pricing',
    description: 'Testimonials on pricing page',
    fields: [],
    repeatable: true,
  },
  {
    key: 'section_pricing_faqs',
    label: 'Pricing FAQs',
    page: 'Pricing',
    description: 'Frequently asked questions',
    fields: [],
    repeatable: true,
  },
  {
    key: 'section_global_footer',
    label: 'Footer',
    page: 'Global',
    description: 'Footer text, copyright, links',
    fields: [
      { name: 'tagline', type: 'text', label: 'Tagline' },
      { name: 'copyright', type: 'text', label: 'Copyright Text' },
    ],
  },
  {
    key: 'section_global_metadata',
    label: 'Site Metadata',
    page: 'Global',
    description: 'Site title, description for SEO',
    fields: [
      { name: 'siteTitle', type: 'text', label: 'Site Title' },
      { name: 'siteDescription', type: 'textarea', label: 'Site Description' },
      { name: 'ogImage', type: 'image', label: 'OG Image' },
    ],
  },
]

// ── Component ───────────────────────────────────────────────────

export default function SectionsEditorPage() {
  const [sections, setSections] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/cms/sections')
      .then((r) => r.json())
      .then((data: any[]) => {
        const map: Record<string, any> = {}
        for (const s of data) map[s.key] = s.value
        setSections(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function getValue(sectionKey: string, field: string): string {
    return sections[sectionKey]?.[field] ?? ''
  }

  function setValue(sectionKey: string, field: string, value: string) {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [field]: value },
    }))
  }

  async function saveSection(key: string) {
    setSaving(key)
    setSaved(null)
    try {
      await fetch('/api/admin/cms/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: sections[key] || {} }),
      })
      setSaved(key)
      setTimeout(() => setSaved(null), 3000)
    } catch { /* ignore */ }
    setSaving(null)
  }

  async function handleImageUpload(sectionKey: string, field: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/cms/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const { url } = await res.json()
        setValue(sectionKey, field, url)
      }
    } catch { /* ignore */ }
    setUploading(false)
  }

  // Repeatable items (testimonials, team, FAQs, skills)
  function getItems(sectionKey: string): any[] {
    return sections[sectionKey]?.items ?? []
  }

  function setItems(sectionKey: string, items: any[]) {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], items },
    }))
  }

  const inputCls = 'w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-400/50'

  if (loading) return <div className="p-8 text-text-muted text-sm">Loading sections...</div>

  // Group by page
  const grouped: Record<string, typeof SECTION_DEFS> = {}
  for (const def of SECTION_DEFS) {
    if (!grouped[def.page]) grouped[def.page] = []
    grouped[def.page].push(def)
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Page Sections</h1>
      <p className="text-sm text-text-secondary mb-6">Edit frontend content: titles, images, videos, testimonials, FAQs</p>

      {Object.entries(grouped).map(([page, defs]) => (
        <div key={page} className="mb-8">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">{page}</h2>

          <div className="space-y-3">
            {defs.map((def) => {
              const isOpen = expanded === def.key

              return (
                <div key={def.key} className="bg-bg-surface border border-black/[0.06] rounded-xl overflow-hidden">
                  {/* Header */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : def.key)}
                    className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-black/[0.02] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{def.label}</p>
                      <p className="text-[10px] text-text-muted">{def.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sections[def.key] && <span className="text-[10px] text-emerald-400">Customized</span>}
                      {isOpen ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                    </div>
                  </button>

                  {/* Expanded editor */}
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-black/[0.04] pt-4 space-y-4">
                      {/* Static fields */}
                      {def.fields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-xs font-medium text-text-secondary mb-1">{field.label}</label>
                          {field.type === 'textarea' ? (
                            <textarea
                              className={`${inputCls} min-h-[60px] resize-none`}
                              value={getValue(def.key, field.name)}
                              onChange={(e) => setValue(def.key, field.name, e.target.value)}
                              placeholder={field.label}
                            />
                          ) : field.type === 'image' ? (
                            <div className="flex items-center gap-3">
                              <input
                                className={`${inputCls} flex-1`}
                                value={getValue(def.key, field.name)}
                                onChange={(e) => setValue(def.key, field.name, e.target.value)}
                                placeholder="Image URL or upload"
                              />
                              <label className={`flex items-center gap-1 px-3 py-2 text-xs border border-black/10 rounded-lg cursor-pointer hover:border-black/20 ${uploading ? 'opacity-50' : ''}`}>
                                <Upload size={12} />
                                {uploading ? '...' : 'Upload'}
                                <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleImageUpload(def.key, field.name, e)} />
                              </label>
                              {getValue(def.key, field.name) && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={getValue(def.key, field.name)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                              )}
                            </div>
                          ) : (
                            <input
                              className={inputCls}
                              value={getValue(def.key, field.name)}
                              onChange={(e) => setValue(def.key, field.name, e.target.value)}
                              placeholder={field.label}
                            />
                          )}
                        </div>
                      ))}

                      {/* Repeatable items (testimonials, team, FAQs, skills) */}
                      {def.repeatable && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-text-secondary">Items ({getItems(def.key).length})</span>
                            <button
                              onClick={() => setItems(def.key, [...getItems(def.key), {}])}
                              className="text-[10px] text-accent-400 hover:text-accent-300"
                            >
                              <Plus size={10} className="inline" /> Add Item
                            </button>
                          </div>
                          <div className="space-y-2">
                            {getItems(def.key).map((item: any, i: number) => (
                              <div key={i} className="bg-bg-overlay border border-black/[0.04] rounded-lg p-3 space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-[10px] text-text-muted">Item {i + 1}</span>
                                  <button
                                    onClick={() => setItems(def.key, getItems(def.key).filter((_, j) => j !== i))}
                                    className="text-text-muted hover:text-red-400"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                                {/* Dynamic fields per item type */}
                                {def.key.includes('testimonial') && (
                                  <>
                                    <input className={`${inputCls} text-xs`} value={item.name ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], name: e.target.value }; setItems(def.key, items) }} placeholder="Name" />
                                    <input className={`${inputCls} text-xs`} value={item.role ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], role: e.target.value }; setItems(def.key, items) }} placeholder="Role / Company" />
                                    <textarea className={`${inputCls} text-xs min-h-[40px] resize-none`} value={item.quote ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], quote: e.target.value }; setItems(def.key, items) }} placeholder="Quote" />
                                    <input className={`${inputCls} text-xs`} value={item.avatar ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], avatar: e.target.value }; setItems(def.key, items) }} placeholder="Avatar URL" />
                                  </>
                                )}
                                {def.key.includes('team') && (
                                  <>
                                    <input className={`${inputCls} text-xs`} value={item.name ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], name: e.target.value }; setItems(def.key, items) }} placeholder="Name" />
                                    <input className={`${inputCls} text-xs`} value={item.role ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], role: e.target.value }; setItems(def.key, items) }} placeholder="Role" />
                                    <textarea className={`${inputCls} text-xs min-h-[36px] resize-none`} value={item.bio ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], bio: e.target.value }; setItems(def.key, items) }} placeholder="Bio" />
                                    <input className={`${inputCls} text-xs`} value={item.image ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], image: e.target.value }; setItems(def.key, items) }} placeholder="Photo URL" />
                                  </>
                                )}
                                {def.key.includes('faq') && (
                                  <>
                                    <input className={`${inputCls} text-xs`} value={item.question ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], question: e.target.value }; setItems(def.key, items) }} placeholder="Question" />
                                    <textarea className={`${inputCls} text-xs min-h-[40px] resize-none`} value={item.answer ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], answer: e.target.value }; setItems(def.key, items) }} placeholder="Answer" />
                                  </>
                                )}
                                {def.key.includes('skills') && (
                                  <>
                                    <input className={`${inputCls} text-xs`} value={item.name ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], name: e.target.value }; setItems(def.key, items) }} placeholder="Skill Name" />
                                    <input className={`${inputCls} text-xs`} value={item.icon ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], icon: e.target.value }; setItems(def.key, items) }} placeholder="Icon (emoji)" />
                                    <textarea className={`${inputCls} text-xs min-h-[36px] resize-none`} value={item.description ?? ''} onChange={(e) => { const items = [...getItems(def.key)]; items[i] = { ...items[i], description: e.target.value }; setItems(def.key, items) }} placeholder="Description" />
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Save */}
                      <button
                        onClick={() => saveSection(def.key)}
                        disabled={saving === def.key}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-accent-400 text-bg-base rounded-lg hover:bg-accent-300 disabled:opacity-50 transition-colors"
                      >
                        {saving === def.key ? <Loader2 size={12} className="animate-spin" /> : saved === def.key ? <CheckCircle size={12} /> : <Save size={12} />}
                        {saving === def.key ? 'Saving...' : saved === def.key ? 'Saved!' : 'Save Section'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
