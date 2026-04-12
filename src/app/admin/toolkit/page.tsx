'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Database, Gamepad2, FileText, Image, Clock, CheckCircle2, Users, Target, Sparkles, Eye, Bot, Zap, BarChart3, Lightbulb } from 'lucide-react'

interface ToolkitStats {
  contentSources: { total: number; raw: number; curated: number; published: number }
  expressionAssets: { total: number; pending: number; verified: number }
}

interface MiniGameStats {
  totalPlays: number
  completionRate: number
  totalGames: number
}

interface AiGeneratorStats {
  total: number
  byStatus: { draft: number; generating: number; review: number; published: number; failed: number }
  totalAssets: number
}

interface AgentStats {
  totalCycles: number
  pendingReview: number
  generating: number
  completed: number
  latestStatus: string | null
}

interface IdeatingStats {
  totalBatches: number
  completeBatches: number
  generating: number
  failed: number
  totalIdeas: number
}

export default function AdminToolkitPage() {
  const [stats, setStats] = useState<ToolkitStats | null>(null)
  const [gameStats, setGameStats] = useState<MiniGameStats | null>(null)
  const [aiStats, setAiStats] = useState<AiGeneratorStats | null>(null)
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null)
  const [ideatingStats, setIdeatingStats] = useState<IdeatingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [sourcesRes, expressionsRes, analyticsRes, aiRes, agentRes, ideatingRes] = await Promise.all([
          fetch('/api/admin/toolkit/crawler/jobs?page=1'),
          fetch('/api/admin/toolkit/crawler/expressions?page=1'),
          fetch('/api/admin/toolkit/mini-games/analytics').catch(() => null),
          fetch('/api/admin/toolkit/ai-generator/stats').catch(() => null),
          fetch('/api/admin/toolkit/ai-generator/agent/stats').catch(() => null),
          fetch('/api/admin/toolkit/practice-ideating/stats').catch(() => null),
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

        if (analyticsRes && analyticsRes.ok) {
          const analyticsData = await analyticsRes.json()
          setGameStats({
            totalPlays: analyticsData.totalPlays ?? 0,
            completionRate: analyticsData.completionRate ?? 0,
            totalGames: analyticsData.avgScoresByGame?.length ?? 0,
          })
        }

        if (aiRes && aiRes.ok) {
          setAiStats(await aiRes.json())
        }

        if (agentRes && agentRes.ok) {
          setAgentStats(await agentRes.json())
        }

        if (ideatingRes && ideatingRes.ok) {
          setIdeatingStats(await ideatingRes.json())
        }
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
      href: '/admin/toolkit/mini-games',
      label: 'Mini-Games',
      description: 'Manage interactive mini-games for facial expression and gesture practice.',
      Icon: Gamepad2,
      stats: gameStats ? [
        { label: 'Total plays', value: gameStats.totalPlays, Icon: Target },
        { label: 'Games', value: gameStats.totalGames, Icon: Gamepad2 },
        { label: 'Completion', value: `${Math.round(gameStats.completionRate * 100)}%`, Icon: CheckCircle2 },
      ] : [],
    },
    {
      href: '/admin/toolkit/ai-generator',
      label: 'AI Content Generator',
      description: 'Generate expression and body language reference images using AI models.',
      Icon: Sparkles,
      stats: aiStats ? [
        { label: 'Requests', value: aiStats.total, Icon: Sparkles },
        { label: 'In review', value: aiStats.byStatus.review, Icon: Eye },
        { label: 'Published', value: aiStats.byStatus.published, Icon: CheckCircle2 },
      ] : [],
    },
    {
      href: '/admin/toolkit/ai-generator/agent',
      label: 'Content Agent',
      description: 'Autonomous AI agent that analyses user activity, finds content gaps, and generates new training material.',
      Icon: Bot,
      stats: agentStats ? [
        { label: 'Cycles', value: agentStats.totalCycles, Icon: BarChart3 },
        { label: 'Pending', value: agentStats.pendingReview, Icon: Clock },
        { label: 'Generated', value: agentStats.completed, Icon: Zap },
      ] : [],
    },
    {
      href: '/admin/toolkit/practice-ideating',
      label: 'Practice Ideating',
      description: 'Generate batches of AI-designed practice ideas with video prompts, observation guides, and step-by-step guidance — ready to feed into your video generation tool.',
      Icon: Lightbulb,
      stats: ideatingStats ? [
        { label: 'Batches', value: ideatingStats.totalBatches, Icon: FileText },
        { label: 'Ideas', value: ideatingStats.totalIdeas, Icon: Sparkles },
        { label: 'Running', value: ideatingStats.generating, Icon: Clock },
      ] : [],
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.label}
            href={tool.href}
            className="group block bg-bg-surface border border-black/8 rounded-2xl p-6 transition-all duration-150 hover:border-accent-400/30 hover:bg-bg-overlay"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-accent-400/10 text-accent-400 group-hover:bg-accent-400/20 transition-colors">
                <tool.Icon size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-text-primary">{tool.label}</h2>
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
