'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Activity, TrendingUp, BarChart3, Clock } from 'lucide-react'

interface AnalyticsData {
  totalUsers: number
  dau: number
  wau: number
  mau: number
  sessionsToday: number
  signupTrend: { date: string; count: number }[]
  topPracticedClips: { clipId: string; movieTitle: string; skillCategory: string; count: number }[]
  skillPopularity: Record<string, number>
  recentActivity: { id: string; type: string; createdAt: string; user?: { name: string; email: string } | null }[]
  users: { id: string; name: string | null; email: string; role: string; createdAt: string; _count: { userSessions: number; arcadeAttempts: number } }[]
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Analytics</h1>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-text-muted">Failed to load analytics.</div>

  const maxSignup = Math.max(...data.signupTrend.map(s => s.count), 1)
  const skillEntries = Object.entries(data.skillPopularity).sort((a, b) => b[1] - a[1])
  const maxSkillCount = Math.max(...skillEntries.map(e => e[1]), 1)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 size={24} />
            Analytics Dashboard
          </h1>
          <p className="text-text-secondary text-sm mt-1">User activity and engagement metrics</p>
        </div>
        <Link
          href="/admin/analytics/features"
          className="px-4 py-2 rounded-xl border border-white/10 text-sm text-text-secondary hover:text-text-primary hover:border-white/20 transition-all"
        >
          Feature Performance →
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={data.totalUsers} />
        <StatCard icon={Activity} label="DAU" value={data.dau} />
        <StatCard icon={TrendingUp} label="WAU" value={data.wau} />
        <StatCard icon={TrendingUp} label="MAU" value={data.mau} />
        <StatCard icon={Clock} label="Events Today" value={data.sessionsToday} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Signup trend */}
        <div className="bg-bg-surface border border-white/8 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">New Signups (30 days)</h3>
          <div className="flex items-end gap-[2px] h-32">
            {data.signupTrend.map((day, i) => (
              <div
                key={i}
                className="flex-1 bg-accent-400/60 hover:bg-accent-400 rounded-t transition-colors"
                style={{ height: `${Math.max((day.count / maxSignup) * 100, 2)}%` }}
                title={`${day.date}: ${day.count} signups`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-text-tertiary">
            <span>{data.signupTrend[0]?.date?.slice(5)}</span>
            <span>{data.signupTrend[data.signupTrend.length - 1]?.date?.slice(5)}</span>
          </div>
        </div>

        {/* Skill popularity */}
        <div className="bg-bg-surface border border-white/8 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Skill Popularity</h3>
          <div className="flex flex-col gap-3">
            {skillEntries.length === 0 ? (
              <p className="text-text-muted text-sm">No data yet.</p>
            ) : (
              skillEntries.map(([skill, count]) => (
                <div key={skill}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary capitalize">{skill.replace(/-/g, ' ')}</span>
                    <span className="text-xs text-text-tertiary">{count}</span>
                  </div>
                  <div className="h-2 bg-white/8 rounded-pill overflow-hidden">
                    <div
                      className="h-full bg-accent-400/70 rounded-pill transition-all"
                      style={{ width: `${(count / maxSkillCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top practiced clips */}
      <div className="bg-bg-surface border border-white/8 rounded-2xl p-5 mb-8">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Top Practiced Clips</h3>
        {data.topPracticedClips.length === 0 ? (
          <p className="text-text-muted text-sm">No practice sessions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left py-2 text-text-secondary font-medium">Movie</th>
                <th className="text-left py-2 text-text-secondary font-medium">Skill</th>
                <th className="text-right py-2 text-text-secondary font-medium">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {data.topPracticedClips.map(clip => (
                <tr key={clip.clipId} className="border-b border-white/5">
                  <td className="py-2 text-text-primary">{clip.movieTitle}</td>
                  <td className="py-2 text-text-secondary capitalize">{clip.skillCategory.replace(/-/g, ' ')}</td>
                  <td className="py-2 text-text-primary text-right font-semibold">{clip.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-bg-surface border border-white/8 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Recent Activity</h3>
          {data.recentActivity.length === 0 ? (
            <p className="text-text-muted text-sm">No activity yet.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {data.recentActivity.map(event => (
                <div key={event.id} className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-accent-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-text-primary">{event.user?.name || event.user?.email || 'Anonymous'}</span>
                    <span className="text-text-tertiary ml-1.5">{event.type.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-xs text-text-tertiary flex-shrink-0">
                    {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users table */}
        <div className="bg-bg-surface border border-white/8 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Active Users</h3>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left py-2 text-text-secondary font-medium">User</th>
                  <th className="text-right py-2 text-text-secondary font-medium">Sessions</th>
                  <th className="text-right py-2 text-text-secondary font-medium">Arcade</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-bg-overlay transition-colors">
                    <td className="py-2">
                      <Link href={`/admin/analytics/users/${user.id}`} className="text-text-primary hover:text-accent-400 transition-colors">
                        {user.name || user.email}
                      </Link>
                    </td>
                    <td className="py-2 text-text-secondary text-right">{user._count.userSessions}</td>
                    <td className="py-2 text-text-secondary text-right">{user._count.arcadeAttempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-bg-surface border border-white/8 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-text-tertiary" />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text-primary tabular-nums">{value.toLocaleString()}</p>
    </div>
  )
}
