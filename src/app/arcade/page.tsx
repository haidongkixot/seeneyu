'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'

interface BundleData {
  id: string
  title: string
  description: string
  theme: string
  difficulty: string
  xpReward: number
  challengeCount: number
  completedCount: number
  totalXP: number
}

const THEME_EMOJI: Record<string, string> = {
  'Confidence': '\uD83C\uDFC6',
  'Empathy': '\uD83D\uDC9B',
  'Tension': '\u26A1',
}

function DifficultyDots({ level }: { level: string }) {
  const filled = { beginner: 1, intermediate: 2, advanced: 3 }[level] ?? 1
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map(i => (
        <div key={i} className={`w-2 h-2 rounded-full ${i <= filled ? 'bg-accent-400' : 'bg-black/[0.08]'}`} />
      ))}
      <span className="text-xs text-text-tertiary ml-1 capitalize">{level}</span>
    </div>
  )
}

export default function ArcadePage() {
  const [bundles, setBundles] = useState<BundleData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/arcade/bundles')
      .then(r => r.json())
      .then(data => { setBundles(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalXP = bundles.reduce((s, b) => s + b.totalXP, 0)

  return (
    <div className="min-h-screen bg-bg-base">
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-10 pb-20">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={24} className="text-accent-400" />
              <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
                Arcade Zone
              </h1>
            </div>
            <p className="text-text-secondary text-sm">Quick challenges. Instant scores.</p>
          </div>
          <div className="flex items-center gap-3">
            <StatPill icon="\u2B50" label={`${totalXP} XP`} />
          </div>
        </div>

        {/* Bundle grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-52 rounded-2xl skeleton" />
            ))}
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-20 text-text-tertiary">
            <Zap size={48} className="mx-auto mb-4 opacity-30" />
            <p>No arcade bundles yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map(bundle => (
              <Link key={bundle.id} href={`/arcade/${bundle.id}`}>
                <div className="group relative flex flex-col p-6 rounded-2xl bg-bg-surface border border-black/8 shadow-card hover:shadow-card-hover hover:-translate-y-1 hover:border-accent-400/20 transition-all duration-300 cursor-pointer min-h-[200px]">
                  <div className="text-4xl mb-4">
                    {THEME_EMOJI[bundle.theme] || '\uD83C\uDFAF'}
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-1">{bundle.title}</h3>
                  <p className="text-sm text-text-secondary mb-4 flex-1">{bundle.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-text-tertiary">
                        {bundle.completedCount}/{bundle.challengeCount} challenges
                      </p>
                      <DifficultyDots level={bundle.difficulty} />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-pill bg-accent-400/15 text-accent-400 border border-accent-400/30">
                      {bundle.xpReward} XP
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ArrowRight size={18} className="text-accent-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function StatPill({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-bg-surface border border-black/10 text-sm font-semibold text-text-primary">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  )
}
