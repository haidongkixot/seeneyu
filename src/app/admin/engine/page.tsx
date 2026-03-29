'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Zap,
  Send,
  Eye,
  MousePointerClick,
  MessageCircle,
  Bell,
  Mail,
  Smartphone,
  Loader2,
  FileText,
} from 'lucide-react'

interface Stats {
  total: { sent: number; delivered: number; opened: number; clicked: number }
  openRate: number
  clickRate: number
  byChannel: Array<{ channel: string; deliveryStatus: string; _count: { id: number } }>
  byTrigger: Array<{ triggerType: string; deliveryStatus: string; _count: { id: number } }>
  engagementDistribution: Record<string, number>
}

interface LogEntry {
  id: string
  userId: string
  triggerType: string
  channel: string
  title: string
  deliveryStatus: string
  createdAt: string
}

const channelIcons: Record<string, typeof Bell> = {
  in_app: Bell,
  push: Smartphone,
  email: Mail,
  whatsapp: MessageCircle,
}

export default function EngineAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/engine/stats').then((r) => r.json()),
      fetch('/api/admin/engine/logs?limit=50').then((r) => r.json()),
    ])
      .then(([statsData, logsData]) => {
        setStats(statsData)
        setLogs(logsData.logs || [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    )
  }

  // Aggregate channel totals
  const channelTotals: Record<string, number> = {}
  stats?.byChannel.forEach((row) => {
    channelTotals[row.channel] = (channelTotals[row.channel] || 0) + row._count.id
  })

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-400/10 text-accent-400">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Learning Engine</h1>
            <p className="text-sm text-text-secondary">Notification analytics & engagement overview</p>
          </div>
        </div>
        <Link
          href="/admin/engine/templates"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-bg-surface border border-black/8 rounded-xl hover:bg-bg-overlay transition-colors text-text-primary"
        >
          <FileText size={14} />
          Templates
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: stats?.total.sent ?? 0, icon: Send, color: 'text-blue-500' },
          { label: 'Delivered', value: stats?.total.delivered ?? 0, icon: Send, color: 'text-green-500' },
          { label: 'Open Rate', value: `${stats?.openRate ?? 0}%`, icon: Eye, color: 'text-amber-500' },
          { label: 'Click Rate', value: `${stats?.clickRate ?? 0}%`, icon: MousePointerClick, color: 'text-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-surface border border-black/8 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={color} />
              <span className="text-xs font-medium text-text-secondary">{label}</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Channel breakdown + Engagement distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Active channels */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Notifications by Channel</h2>
          <div className="space-y-3">
            {Object.entries(channelTotals).map(([channel, count]) => {
              const Icon = channelIcons[channel] || Bell
              return (
                <div key={channel} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-text-tertiary" />
                    <span className="text-sm text-text-primary capitalize">{channel.replace('_', ' ')}</span>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">{count}</span>
                </div>
              )
            })}
            {Object.keys(channelTotals).length === 0 && (
              <p className="text-sm text-text-muted">No notifications sent yet.</p>
            )}
          </div>
        </div>

        {/* Engagement score distribution */}
        <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Engagement Score Distribution</h2>
          <div className="space-y-2">
            {stats?.engagementDistribution &&
              Object.entries(stats.engagementDistribution).map(([range, count]) => {
                const maxCount = Math.max(1, ...Object.values(stats.engagementDistribution))
                const width = Math.round((count / maxCount) * 100)
                return (
                  <div key={range} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-12 text-right font-mono">{range}</span>
                    <div className="flex-1 h-5 bg-bg-overlay rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-accent-400/60 rounded-lg transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-text-primary w-8">{count}</span>
                  </div>
                )
              })}
            {!stats?.engagementDistribution && (
              <p className="text-sm text-text-muted">No learner profiles found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent notification log */}
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Recent Notifications <span className="text-text-muted font-normal">(last 50)</span>
        </h2>
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-tertiary border-b border-black/8">
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">Channel</th>
                  <th className="pb-2 pr-4">Trigger</th>
                  <th className="pb-2 pr-4">Title</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg-overlay">
                    <td className="py-2 pr-4 text-text-secondary whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 capitalize text-text-primary">
                      {log.channel.replace('_', ' ')}
                    </td>
                    <td className="py-2 pr-4 text-text-secondary font-mono text-xs">
                      {log.triggerType}
                    </td>
                    <td className="py-2 pr-4 text-text-primary max-w-[200px] truncate">
                      {log.title}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.deliveryStatus === 'delivered'
                            ? 'bg-green-500/10 text-green-600'
                            : log.deliveryStatus === 'failed'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
                        {log.deliveryStatus}
                      </span>
                    </td>
                    <td className="py-2 text-text-muted font-mono text-xs">{log.userId.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No notification logs yet.</p>
        )}
      </div>
    </div>
  )
}
