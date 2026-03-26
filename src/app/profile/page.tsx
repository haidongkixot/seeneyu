'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Save,
  LogOut,
  Zap,
  Flame,
  Trophy,
  Crown,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string | null
  email: string
  bio: string | null
  phone: string | null
  location: string | null
  plan: string
  status: string
  role: string
  image: string | null
  avatarUrl: string | null
  createdAt: string
}

interface GamificationData {
  level: number
  totalXp: number
  currentStreak: number
  longestStreak: number
  tier: string
  xpProgress: number
  xpForNextLevel: number
}

export default function ProfilePage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [gamification, setGamification] = useState<GamificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (authStatus !== 'authenticated') return

    Promise.all([
      fetch('/api/user/profile').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/gamification/profile').then((r) => (r.ok ? r.json() : null)),
    ]).then(([userRes, gamRes]) => {
      if (userRes) {
        setProfile(userRes)
        setName(userRes.name ?? '')
        setBio(userRes.bio ?? '')
        setPhone(userRes.phone ?? '')
        setLocation(userRes.location ?? '')
      }
      if (gamRes) setGamification(gamRes)
      setLoading(false)
    })
  }, [authStatus, router])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, phone, location }),
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : profile?.email?.[0]?.toUpperCase() ?? '?'

  if (loading || authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <p className="text-text-secondary">Unable to load profile.</p>
      </div>
    )
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const tierLabel = gamification?.tier ?? profile.plan
  const tierColor =
    tierLabel === 'pro'
      ? 'text-amber-500'
      : tierLabel === 'premium'
        ? 'text-purple-500'
        : 'text-text-secondary'

  return (
    <div className="min-h-screen bg-bg-base pb-24 md:pb-10">
      <main className="max-w-2xl mx-auto px-4 lg:px-8 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-red-500 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent-400/20 text-accent-400 text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-text-primary truncate">
                {profile.name || 'Unnamed User'}
              </p>
              <p className="text-sm text-text-secondary truncate">{profile.email}</p>
              <p className="text-xs text-text-tertiary capitalize mt-0.5">
                {profile.role} &middot; {profile.status}
              </p>
            </div>
          </div>
        </div>

        {/* Gamification summary */}
        {gamification && (
          <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Progress</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 text-amber-600">
                  <Trophy size={18} />
                </div>
                <div>
                  <p className="text-lg font-bold text-text-primary leading-none">
                    {gamification.level}
                  </p>
                  <p className="text-[11px] text-text-tertiary">Level</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-100 text-violet-600">
                  <Zap size={18} />
                </div>
                <div>
                  <p className="text-lg font-bold text-text-primary leading-none">
                    {gamification.totalXp.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-text-tertiary">Total XP</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-100 text-orange-600">
                  <Flame size={18} />
                </div>
                <div>
                  <p className="text-lg font-bold text-text-primary leading-none">
                    {gamification.currentStreak}
                  </p>
                  <p className="text-[11px] text-text-tertiary">Streak</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-100 text-sky-600">
                  <Crown size={18} />
                </div>
                <div>
                  <p className={`text-lg font-bold leading-none capitalize ${tierColor}`}>
                    {tierLabel}
                  </p>
                  <p className="text-[11px] text-text-tertiary">Tier</p>
                </div>
              </div>
            </div>
            {/* XP progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-text-tertiary mb-1">
                <span>
                  {gamification.xpProgress} / {gamification.xpForNextLevel} XP
                </span>
                <span>Level {gamification.level + 1}</span>
              </div>
              <div className="h-2 bg-bg-overlay rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${gamification.xpForNextLevel > 0 ? Math.min(100, (gamification.xpProgress / gamification.xpForNextLevel) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Account info */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Account</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Plan</span>
              <span className="font-medium text-text-primary capitalize">
                {profile.plan}
                <Link
                  href="/pricing"
                  className="ml-2 text-accent-400 hover:text-accent-500 text-xs"
                >
                  Upgrade
                </Link>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Member since</span>
              <span className="text-text-primary">{memberSince}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Status</span>
              <span className="text-text-primary capitalize">{profile.status}</span>
            </div>
          </div>
        </div>

        {/* Edit profile form */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Edit Profile</h2>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
                <User size={12} /> Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 text-sm bg-bg-base border border-black/8 rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-400/40"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
                <Mail size={12} /> Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 text-sm bg-bg-overlay border border-black/8 rounded-xl text-text-tertiary cursor-not-allowed"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
                <FileText size={12} /> Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full px-3 py-2 text-sm bg-bg-base border border-black/8 rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-400/40 resize-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
                <Phone size={12} /> Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full px-3 py-2 text-sm bg-bg-base border border-black/8 rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-400/40"
              />
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
                <MapPin size={12} /> Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                className="w-full px-3 py-2 text-sm bg-bg-base border border-black/8 rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-400/40"
              />
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent-400 text-text-inverse text-sm font-semibold rounded-xl hover:bg-accent-500 transition-colors disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saved ? (
                <CheckCircle2 size={14} />
              ) : (
                <Save size={14} />
              )}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Quick Links</h2>
          <div className="space-y-1">
            {[
              { href: '/submissions', label: 'My Submissions' },
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/pricing', label: 'Pricing & Plans' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors"
              >
                {label}
                <ArrowRight size={14} className="text-text-tertiary" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
