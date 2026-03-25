'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, User as UserIcon, CreditCard, Activity, BarChart3,
  Save, Loader2, MessageSquare, Gamepad2, Monitor, Bot,
  ChevronLeft, ChevronRight, Zap, Flame, Heart, Trophy
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  status: string
  statusNote: string | null
  bio: string | null
  avatarUrl: string | null
  phone: string | null
  location: string | null
  plan: string
  approvedAt: string | null
  approvedBy: string | null
  onboardingComplete: boolean
  createdAt: string
  updatedAt: string
  gamification: {
    totalXp: number
    level: number
    currentStreak: number
    longestStreak: number
    hearts: number
  } | null
  subscriptions: Array<{
    id: string
    status: string
    period: string
    startDate: string
    endDate: string | null
    plan: { name: string; slug: string; monthlyPrice: number; features: any }
  }>
  _count: {
    userSessions: number
    arcadeAttempts: number
    comments: number
    assistantConversations: number
  }
}

interface TimelineEntry {
  id: string
  type: 'session' | 'arcade' | 'comment' | 'assistant'
  title: string
  description: string | null
  score: number | null
  createdAt: string
}

interface SubscriptionData {
  subscription: any
  plans: Array<{ id: string; slug: string; name: string; monthlyPrice: number; features: any }>
  currentPlanSlug: string
}

type Tab = 'profile' | 'subscription' | 'activity' | 'stats'

// ── Tab Components ───────────────────────────────────────────────────────

function ProfileTab({ user, onSave }: { user: UserProfile; onSave: (data: any) => Promise<void> }) {
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email,
    bio: user.bio || '',
    phone: user.phone || '',
    location: user.location || '',
    role: user.role,
    status: user.status,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    // Profile fields via profile endpoint
    await fetch(`/api/admin/users/${user.id}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: form.bio, phone: form.phone, location: form.location }),
    })
    // Role/status via existing endpoint
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: form.role, status: form.status }),
    })
    await onSave(form)
    setSaving(false)
  }

  const initials = (user.name || user.email).slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6">
      {/* Avatar + basic info */}
      <div className="flex items-start gap-5">
        <div className="w-20 h-20 rounded-2xl bg-accent-400/20 text-accent-400 flex items-center justify-center text-2xl font-bold shrink-0">
          {user.avatarUrl || user.image ? (
            <img src={user.avatarUrl || user.image!} alt="" className="w-full h-full rounded-2xl object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-lg font-semibold text-text-primary">{user.name || user.email}</p>
          <p className="text-sm text-text-secondary">{user.email}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            {user.approvedAt && <span>| Approved {new Date(user.approvedAt).toLocaleDateString()}</span>}
            <span>| Last updated {new Date(user.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Email</label>
            <input
              value={form.email}
              disabled
              className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-muted cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              placeholder="+1 555 000 0000"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Location</label>
            <input
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
              placeholder="City, Country"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
            >
              <option value="learner">Learner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={3}
            className="w-full bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50 resize-none"
            placeholder="User bio..."
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent-400 text-bg-base rounded-lg hover:bg-accent-300 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function SubscriptionTab({ userId }: { userId: string }) {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/subscription`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setSelectedPlan(d.currentPlanSlug)
        setLoading(false)
      })
  }, [userId])

  async function changePlan() {
    if (!selectedPlan || selectedPlan === data?.currentPlanSlug) return
    setSaving(true)
    const res = await fetch(`/api/admin/users/${userId}/subscription`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planSlug: selectedPlan }),
    })
    if (res.ok) {
      // Refresh
      const d = await fetch(`/api/admin/users/${userId}/subscription`).then(r => r.json())
      setData(d)
    }
    setSaving(false)
  }

  if (loading) return <p className="text-text-muted text-sm">Loading subscription...</p>
  if (!data) return <p className="text-text-muted text-sm">Failed to load subscription data.</p>

  const activeSub = data.subscription
  const currentPlan = data.plans.find(p => p.slug === data.currentPlanSlug)

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <CreditCard size={18} className="text-accent-400" />
          <h3 className="text-lg font-semibold text-text-primary">Current Plan</h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-400/20 text-accent-400">
            {currentPlan?.name || data.currentPlanSlug}
          </span>
        </div>
        {activeSub && (
          <div className="text-sm text-text-secondary space-y-1">
            <p>Period: {activeSub.period}</p>
            <p>Started: {new Date(activeSub.startDate).toLocaleDateString()}</p>
            {activeSub.endDate && <p>Ends: {new Date(activeSub.endDate).toLocaleDateString()}</p>}
          </div>
        )}
        {currentPlan?.features && (
          <div className="mt-4">
            <p className="text-xs text-text-muted mb-2">Plan Features:</p>
            <ul className="text-sm text-text-secondary space-y-1">
              {(Array.isArray(currentPlan.features) ? currentPlan.features : []).map((f: string, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent-400" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Change plan */}
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Change Plan</h3>
        <div className="flex items-center gap-3">
          <select
            value={selectedPlan}
            onChange={e => setSelectedPlan(e.target.value)}
            className="flex-1 bg-bg-inset border border-black/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-400/50"
          >
            {data.plans.map(p => (
              <option key={p.slug} value={p.slug}>
                {p.name} (${p.monthlyPrice}/mo)
              </option>
            ))}
          </select>
          <button
            onClick={changePlan}
            disabled={saving || selectedPlan === data.currentPlanSlug}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent-400 text-bg-base rounded-lg hover:bg-accent-300 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function ActivityTab({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string>('')

  const fetchHistory = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (typeFilter) params.set('type', typeFilter)
    fetch(`/api/admin/users/${userId}/history?${params}`)
      .then(r => r.json())
      .then(data => {
        setEntries(data.entries || [])
        setTotalPages(data.totalPages || 1)
        setLoading(false)
      })
  }, [userId, page, typeFilter])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const typeIcons: Record<string, React.ReactNode> = {
    session: <Monitor size={14} className="text-blue-400" />,
    arcade: <Gamepad2 size={14} className="text-purple-400" />,
    comment: <MessageSquare size={14} className="text-green-400" />,
    assistant: <Bot size={14} className="text-amber-400" />,
  }

  const typeColors: Record<string, string> = {
    session: 'bg-blue-400/10 text-blue-400',
    arcade: 'bg-purple-400/10 text-purple-400',
    comment: 'bg-green-400/10 text-green-400',
    assistant: 'bg-amber-400/10 text-amber-400',
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-1 bg-bg-inset rounded-xl p-1 w-fit">
        {[
          { value: '', label: 'All' },
          { value: 'session', label: 'Sessions' },
          { value: 'arcade', label: 'Arcade' },
          { value: 'comment', label: 'Comments' },
          { value: 'assistant', label: 'Assistant' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => { setTypeFilter(opt.value); setPage(1) }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
              typeFilter === opt.value
                ? 'bg-bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-text-muted text-sm">No activity found.</p>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => (
            <div key={entry.id} className="bg-bg-surface border border-black/8 rounded-xl p-4 flex items-start gap-3">
              <div className="mt-0.5">{typeIcons[entry.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${typeColors[entry.type]}`}>
                    {entry.type}
                  </span>
                  <p className="text-sm font-medium text-text-primary truncate">{entry.title}</p>
                </div>
                {entry.description && (
                  <p className="text-xs text-text-secondary mt-0.5 truncate">{entry.description}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                {entry.score != null && (
                  <p className="text-sm font-semibold text-accent-400">{entry.score}/100</p>
                )}
                <p className="text-[10px] text-text-muted">{new Date(entry.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-text-secondary">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

function StatsTab({ user }: { user: UserProfile }) {
  const gam = user.gamification
  const [avgScore, setAvgScore] = useState<number | null>(null)

  useEffect(() => {
    // Fetch average score from sessions
    fetch(`/api/admin/users/${user.id}/history?page=1`)
      .then(r => r.json())
      .then(data => {
        const scored = (data.entries || []).filter((e: TimelineEntry) => e.score != null)
        if (scored.length > 0) {
          const avg = scored.reduce((sum: number, e: TimelineEntry) => sum + (e.score || 0), 0) / scored.length
          setAvgScore(Math.round(avg))
        }
      })
  }, [user.id])

  const stats = [
    { label: 'Total XP', value: gam?.totalXp ?? 0, icon: <Zap size={18} className="text-accent-400" />, color: 'text-accent-400' },
    { label: 'Level', value: gam?.level ?? 1, icon: <Trophy size={18} className="text-yellow-400" />, color: 'text-yellow-400' },
    { label: 'Current Streak', value: gam?.currentStreak ?? 0, icon: <Flame size={18} className="text-orange-400" />, color: 'text-orange-400' },
    { label: 'Hearts', value: gam?.hearts ?? 5, icon: <Heart size={18} className="text-red-400" />, color: 'text-red-400' },
    { label: 'Sessions', value: user._count.userSessions, icon: <Monitor size={18} className="text-blue-400" />, color: 'text-blue-400' },
    { label: 'Avg Score', value: avgScore != null ? `${avgScore}/100` : '--', icon: <BarChart3 size={18} className="text-emerald-400" />, color: 'text-emerald-400' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {stats.map(s => (
        <div key={s.label} className="bg-bg-surface border border-black/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-text-muted">{s.label}</span></div>
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  useEffect(() => {
    fetch(`/api/admin/users/${params.id}/profile`)
      .then(r => r.json())
      .then(data => { setUser(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  if (!user || (user as any).error) {
    return (
      <div className="p-8">
        <p className="text-text-muted">User not found.</p>
        <Link href="/admin/users" className="text-accent-400 text-sm mt-2 inline-block">Back to Users</Link>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; Icon: any }[] = [
    { key: 'profile', label: 'Profile', Icon: UserIcon },
    { key: 'subscription', label: 'Subscription', Icon: CreditCard },
    { key: 'activity', label: 'Activity', Icon: Activity },
    { key: 'stats', label: 'Stats', Icon: BarChart3 },
  ]

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/users" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4">
          <ArrowLeft size={14} />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">{user.name ?? user.email}</h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-text-secondary text-sm">{user.email}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-accent-400/20 text-accent-400' : 'bg-bg-inset text-text-muted'}`}>
            {user.role}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            user.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400'
            : user.status === 'pending' ? 'bg-accent-400/20 text-accent-400'
            : 'bg-red-500/20 text-red-400'
          }`}>
            {user.status}
          </span>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-6 bg-bg-inset rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
              activeTab === tab.key
                ? 'bg-bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <tab.Icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <ProfileTab user={user} onSave={async () => {
          const data = await fetch(`/api/admin/users/${params.id}/profile`).then(r => r.json())
          setUser(data)
        }} />
      )}
      {activeTab === 'subscription' && <SubscriptionTab userId={user.id} />}
      {activeTab === 'activity' && <ActivityTab userId={user.id} />}
      {activeTab === 'stats' && <StatsTab user={user} />}
    </div>
  )
}
