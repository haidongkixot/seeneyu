'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Database, Gamepad2, FileText, Image, Clock, CheckCircle2 } from 'lucide-react'

interface ToolkitStats {
  contentSources: { total: number; raw: number; curated: number; published: number }
  expressionAssets: { total: number; pending: number; verified: number }
}

export default function AdminToolkitPage() {
  const [stats, setStats] = useState<ToolkitStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [sourcesRes, expressionsRes] = await Promise.all([
          fetch('/api/admin/toolkit/crawler/jobs?page=1'),
          fetch('/api/admin/toolkit/crawler/expressions?page=1'),
        ])
        const sourcesData = await sourcesRes.json()
        const expressionsData = await expressionsRes.json()

        // Count statuses from the response
        const sources = sourcesData.items ?? []
        const expressions = expressionsData.items ?? []

        setStats({
          contentSources: {
            total: sourcesData.total ?? 0,
            raw: sources.filter((s: any) => s.status === 'raw').length,
            curated: sources.filter((s: any) => s.status === 'curated').length,
            published: sources.filter((s: any) => s.status === 'published').length,
          },
          expressionAssets: {
            total: expressionsData.total ?? 0,
            pending: expressions.filter((e: any) => e.status === 'pending').length,
            verified: expressions.filter((e: any) => e.status === 'verified').length,
          },
        })
      } catch {
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const tools = [
    {
      href: '/admin/toolkit/crawler',
      label: 'Data Crawler',
      description: 'Crawl articles, research papers, expression databases, and YouTube timestamps for training content.',
      Icon: Database,
      stats: stats ? [
        { label: 'Sources', value: stats.contentSources.total, Icon: FileText },
        { label: 'Pending curation', value: stats.contentSources.raw, Icon: Clock },
        { label: 'Expressions', value: stats.expressionAssets.total, Icon: Image },
      ] : [],
    },
    {
      href: '#',
      label: 'Mini-Games',
      description: 'Manage interactive mini-games for facial expression and gesture practice.',
      Icon: Gamepad2,
      stats: [],
      disabled: true,
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Toolkit</h1>
        <p className="text-text-secondary text-sm mt-1">
          Tools for managing training content, data pipelines, and game assets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.label}
            href={tool.href}
            className={`group block bg-bg-surface border border-white/8 rounded-2xl p-6 transition-all duration-150 ${
              tool.disabled
                ? 'opacity-50 pointer-events-none'
                : 'hover:border-accent-400/30 hover:bg-bg-overlay'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-accent-400/10 text-accent-400 group-hover:bg-accent-400/20 transition-colors">
                <tool.Icon size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-text-primary">{tool.label}</h2>
                  {tool.disabled && (
                    <span className="text-[10px] font-medium bg-bg-inset text-text-muted rounded px-1.5 py-0.5 uppercase">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-text-secondary text-sm mt-1">{tool.description}</p>

                {tool.stats.length > 0 && (
                  <div className="flex items-center gap-4 mt-4">
                    {loading ? (
                      <span className="text-xs text-text-muted">Loading stats...</span>
                    ) : (
                      tool.stats.map((stat) => (
                        <div key={stat.label} className="flex items-center gap-1.5 text-xs text-text-muted">
                          <stat.Icon size={12} />
                          <span className="font-medium text-text-secondary">{stat.value}</span>
                          <span>{stat.label}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
