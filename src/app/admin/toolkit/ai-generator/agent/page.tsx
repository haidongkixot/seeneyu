'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  BarChart3, CheckCircle2, Clock, Zap, Settings, List, History,
  LayoutDashboard, Play, X, Check, ExternalLink, RefreshCw, Loader2,
  ArrowLeft, Sparkles,
} from 'lucide-react'

type Tab = 'dashboard' | 'suggestions' | 'history' | 'settings'

interface Cycle {
  id: string
  type: string
  status: string
  suggestionsCount: number
  approvedCount: number
  generatedCount: number
  costEstimate: number | null
  actualCost: number | null
  createdAt: string
  completedAt: string | null
  _count?: { suggestions: number }
}

interface Suggestion {
  id: string
  expressionType: string
  bodyLanguageType: string
  skillCategory: string
  difficulty: string
  rationale: string
  gapType: string
  priority: number
  suggestedProvider: string | null
  mediaType: string
  classification: string
  status: string
  estimatedCost: number | null
  generationJobs: any[]
}

interface AgentConfig {
  maxSuggestionsPerCycle: number
  defaultClassification: string
  budgetLimitPerCycle: number
  defaultPublishTargets: string[]
  preferVideoForSkills: string[]
}

const TAB_ITEMS: { key: Tab; label: string; Icon: any }[] = [
  { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'suggestions', label: 'Suggestions', Icon: List },
  { key: 'history', label: 'History', Icon: History },
  { key: 'settings', label: 'Settings', Icon: Settings },
]

const STATUS_COLORS: Record<string, string> = {
  analyzing: 'bg-blue-100 text-blue-700',
  suggestions_ready: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  generating: 'bg-violet-100 text-violet-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-600',
}

const GAP_TYPE_LABELS: Record<string, string> = {
  skill_gap: 'Missing Content',
  difficulty_gap: 'Low Variety',
  engagement_gap: 'High Demand',
  content_variety: 'Refresh',
}

export default function ContentAgentPage() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [latestCycle, setLatestCycle] = useState<Cycle | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [config, setConfig] = useState<AgentConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fetchCycles = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/toolkit/ai-generator/agent/cycles')
      const data = await r.json()
      setCycles(data.items ?? [])
      if (data.items?.length > 0) {
        setLatestCycle(data.items[0])
      }
    } catch { /* ignore */ }
  }, [])

  const fetchSuggestions = useCallback(async (cycleId: string) => {
    try {
      const r = await fetch(`/api/admin/toolkit/ai-generator/agent/cycles/${cycleId}`)
      const data = await r.json()
      setSuggestions(data.cycle?.suggestions ?? [])
    } catch { /* ignore */ }
  }, [])

  const fetchConfig = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/toolkit/ai-generator/agent/settings')
      const data = await r.json()
      setConfig(data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchCycles(), fetchConfig()]).finally(() => setLoading(false))
  }, [fetchCycles, fetchConfig])

  useEffect(() => {
    if (latestCycle && tab === 'suggestions') {
      fetchSuggestions(latestCycle.id)
    }
  }, [latestCycle, tab, fetchSuggestions])

  async function runAnalysis() {
    setActionLoading(true)
    try {
      await fetch('/api/cron/content-agent-analyze', {
        headers: { Authorization: `Bearer ${prompt('Enter CRON_SECRET:')}` },
      })
      await fetchCycles()
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  async function approveSelected() {
    if (!latestCycle) return
    setActionLoading(true)
    try {
      const ids = selectedIds.size > 0 ? Array.from(selectedIds) : undefined
      await fetch(`/api/admin/toolkit/ai-generator/agent/cycles/${latestCycle.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionIds: ids }),
      })
      setSelectedIds(new Set())
      await fetchSuggestions(latestCycle.id)
      await fetchCycles()
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  async function updateSuggestion(id: string, data: Record<string, any>) {
    try {
      await fetch(`/api/admin/toolkit/ai-generator/agent/suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (latestCycle) await fetchSuggestions(latestCycle.id)
    } catch { /* ignore */ }
  }

  async function saveConfig() {
    if (!config) return
    setActionLoading(true)
    try {
      await fetch('/api/admin/toolkit/ai-generator/agent/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
      </div>
    )
  }

  const pendingCount = cycles.filter(c => c.status === 'suggestions_ready').length
  const generatingCount = cycles.filter(c => c.status === 'generating').length
  const completedCount = cycles.filter(c => c.status === 'completed').length
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending')

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
        <Link href="/admin/toolkit" className="hover:text-text-secondary">Toolkit</Link>
        <span>/</span>
        <Link href="/admin/toolkit/ai-generator" className="hover:text-text-secondary">AI Generator</Link>
        <span>/</span>
        <span className="text-text-secondary">Content Agent</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-400/10">
            <Sparkles size={22} className="text-accent-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Content Agent</h1>
            <p className="text-sm text-text-secondary mt-0.5">Autonomous content gap analysis and AI generation</p>
          </div>
        </div>
        <Link
          href="/admin/toolkit/ai-generator"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-black/10 text-text-secondary rounded-xl hover:bg-bg-overlay transition-colors"
        >
          <ArrowLeft size={14} /> Manual Generator
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-black/8 pb-px">
        {TAB_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === key
                ? 'text-accent-400 border-b-2 border-accent-400 -mb-px'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Cycles', value: cycles.length, Icon: BarChart3, color: 'text-blue-500' },
              { label: 'Pending Review', value: pendingCount, Icon: Clock, color: 'text-amber-500' },
              { label: 'In Progress', value: generatingCount, Icon: Zap, color: 'text-violet-500' },
              { label: 'Completed', value: completedCount, Icon: CheckCircle2, color: 'text-green-500' },
            ].map(stat => (
              <div key={stat.label} className="bg-bg-surface border border-black/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <stat.Icon size={16} className={stat.color} />
                  <span className="text-xs text-text-tertiary font-medium uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
              </div>
            ))}
          </div>

          {latestCycle && (
            <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Latest Cycle</p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {new Date(latestCycle.createdAt).toLocaleString()} · {latestCycle.type}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-pill text-xs font-semibold ${STATUS_COLORS[latestCycle.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {latestCycle.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div>
                  <p className="text-lg font-bold text-text-primary">{latestCycle.suggestionsCount}</p>
                  <p className="text-xs text-text-tertiary">Suggestions</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-text-primary">{latestCycle.approvedCount}</p>
                  <p className="text-xs text-text-tertiary">Approved</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-text-primary">${(latestCycle.costEstimate ?? 0).toFixed(2)}</p>
                  <p className="text-xs text-text-tertiary">Est. Cost</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={runAnalysis}
            disabled={actionLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-400 text-text-inverse rounded-xl text-sm font-semibold hover:bg-accent-500 transition-colors disabled:opacity-50"
          >
            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Run Analysis Now
          </button>
        </div>
      )}

      {/* Suggestions Tab */}
      {tab === 'suggestions' && (
        <div className="space-y-4">
          {latestCycle?.status === 'suggestions_ready' && pendingSuggestions.length > 0 && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-800 font-medium">
                {pendingSuggestions.length} suggestions awaiting approval · Est. ${suggestions.reduce((s, x) => s + (x.estimatedCost ?? 0), 0).toFixed(2)}
              </p>
              <button
                onClick={approveSelected}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent-400 text-text-inverse rounded-lg text-sm font-semibold hover:bg-accent-500 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Approve {selectedIds.size > 0 ? `(${selectedIds.size})` : 'All'} & Generate
              </button>
            </div>
          )}

          {suggestions.length === 0 ? (
            <div className="text-center py-16 text-text-tertiary text-sm">
              No suggestions yet. Run an analysis cycle first.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/8 text-left">
                    <th className="pb-2 pr-2 w-8">
                      <input
                        type="checkbox"
                        onChange={e => {
                          if (e.target.checked) setSelectedIds(new Set(pendingSuggestions.map(s => s.id)))
                          else setSelectedIds(new Set())
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="pb-2 pr-3 text-text-tertiary font-medium">#</th>
                    <th className="pb-2 pr-3 text-text-tertiary font-medium">Skill</th>
                    <th className="pb-2 pr-3 text-text-tertiary font-medium">Difficulty</th>
                    <th className="pb-2 pr-3 text-text-tertiary font-medium">Gap</th>
                    <th className="pb-2 pr-3 text-text-tertiary font-medium">Media</th>
                    <th className="pb-2 pr-3 text-text-tertiary font-medium">Provider</th>
                    <th className="pb-2 pr-3 text-text-tertiary font-medium">Class.</th>
                    <th className="pb-2 pr-3 text-text-tertiary font-medium">Cost</th>
                    <th className="pb-2 pr-3 text-text-tertiary font-medium">Status</th>
                    <th className="pb-2 text-text-tertiary font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map(s => (
                    <tr key={s.id} className="border-b border-black/5 hover:bg-bg-overlay/50">
                      <td className="py-2.5 pr-2">
                        {s.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(s.id)}
                            onChange={() => toggleSelect(s.id)}
                            className="rounded"
                          />
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-text-tertiary">{s.priority}</td>
                      <td className="py-2.5 pr-3 text-text-primary font-medium">{s.skillCategory}</td>
                      <td className="py-2.5 pr-3 capitalize">{s.difficulty}</td>
                      <td className="py-2.5 pr-3">
                        <span className="text-xs px-2 py-0.5 rounded-pill bg-bg-overlay text-text-secondary">
                          {GAP_TYPE_LABELS[s.gapType] ?? s.gapType}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 capitalize">{s.mediaType}</td>
                      <td className="py-2.5 pr-3 text-text-tertiary">{s.suggestedProvider ?? '—'}</td>
                      <td className="py-2.5 pr-3">
                        <button
                          onClick={() => updateSuggestion(s.id, {
                            classification: s.classification === 'for_public' ? 'for_later' : 'for_public',
                          })}
                          className={`text-xs px-2 py-0.5 rounded-pill font-medium ${
                            s.classification === 'for_public'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {s.classification === 'for_public' ? 'Public' : 'Later'}
                        </button>
                      </td>
                      <td className="py-2.5 pr-3 text-text-tertiary">${(s.estimatedCost ?? 0).toFixed(3)}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`text-xs px-2 py-0.5 rounded-pill font-semibold ${STATUS_COLORS[s.status] ?? ''}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5">
                        {s.status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateSuggestion(s.id, { status: 'approved' })}
                              className="p-1 text-green-500 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => updateSuggestion(s.id, { status: 'rejected' })}
                              className="p-1 text-red-400 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="overflow-x-auto">
          {cycles.length === 0 ? (
            <div className="text-center py-16 text-text-tertiary text-sm">No cycles yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left">
                  <th className="pb-2 pr-3 text-text-tertiary font-medium">Date</th>
                  <th className="pb-2 pr-3 text-text-tertiary font-medium">Type</th>
                  <th className="pb-2 pr-3 text-text-tertiary font-medium">Suggestions</th>
                  <th className="pb-2 pr-3 text-text-tertiary font-medium">Approved</th>
                  <th className="pb-2 pr-3 text-text-tertiary font-medium">Generated</th>
                  <th className="pb-2 pr-3 text-text-tertiary font-medium">Cost</th>
                  <th className="pb-2 text-text-tertiary font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map(c => (
                  <tr key={c.id} className="border-b border-black/5 hover:bg-bg-overlay/50">
                    <td className="py-2.5 pr-3 text-text-primary">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 pr-3 capitalize">{c.type}</td>
                    <td className="py-2.5 pr-3">{c.suggestionsCount}</td>
                    <td className="py-2.5 pr-3">{c.approvedCount}</td>
                    <td className="py-2.5 pr-3">{c.generatedCount}</td>
                    <td className="py-2.5 pr-3">${(c.actualCost ?? c.costEstimate ?? 0).toFixed(2)}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-pill font-semibold ${STATUS_COLORS[c.status] ?? ''}`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && config && (
        <div className="max-w-lg space-y-6">
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-text-primary">Agent Configuration</h3>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Max Suggestions Per Cycle</label>
              <input
                type="number"
                value={config.maxSuggestionsPerCycle}
                onChange={e => setConfig({ ...config, maxSuggestionsPerCycle: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 bg-bg-base border border-black/10 rounded-lg text-sm text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Default Classification</label>
              <select
                value={config.defaultClassification}
                onChange={e => setConfig({ ...config, defaultClassification: e.target.value })}
                className="w-full px-3 py-2 bg-bg-base border border-black/10 rounded-lg text-sm text-text-primary"
              >
                <option value="for_later">For Later Use</option>
                <option value="for_public">For Public (auto-publish)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Budget Limit Per Cycle ($)</label>
              <input
                type="number"
                step="0.5"
                value={config.budgetLimitPerCycle}
                onChange={e => setConfig({ ...config, budgetLimitPerCycle: parseFloat(e.target.value) || 10 })}
                className="w-full px-3 py-2 bg-bg-base border border-black/10 rounded-lg text-sm text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Prefer Video For Skills</label>
              <div className="space-y-1.5">
                {['eye-contact', 'open-posture', 'active-listening', 'vocal-pacing', 'confident-disagreement'].map(skill => (
                  <label key={skill} className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                      type="checkbox"
                      checked={config.preferVideoForSkills.includes(skill)}
                      onChange={e => {
                        const next = e.target.checked
                          ? [...config.preferVideoForSkills, skill]
                          : config.preferVideoForSkills.filter(s => s !== skill)
                        setConfig({ ...config, preferVideoForSkills: next })
                      }}
                      className="rounded"
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={saveConfig}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-accent-400 text-text-inverse rounded-xl text-sm font-semibold hover:bg-accent-500 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
