'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ObservationGuide } from '@/components/ObservationGuide'
import type { ObservationGuide as ObservationGuideType } from '@/lib/types'

type Tab = 'watch' | 'how-it-works' | 'script'

interface ClipDetailTabsProps {
  clipId: string
  characterName: string | null
  sceneDescription: string
  annotation: string
  contextNote: string | null
  observationGuide: ObservationGuideType | null
  annotations: { note: string; type: string }[]
  scriptText: string | null
  screenplayText: string | null
}

export function ClipDetailTabs({
  clipId,
  characterName,
  sceneDescription,
  annotation,
  contextNote,
  observationGuide,
  annotations,
  scriptText,
  screenplayText,
}: ClipDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('watch')
  const hasScript = !!(scriptText || screenplayText)

  const tabs: Tab[] = hasScript
    ? ['watch', 'how-it-works', 'script']
    : ['watch', 'how-it-works']

  const tabLabels: Record<Tab, string> = {
    'watch': 'Watch',
    'how-it-works': 'How It Works',
    'script': 'Script',
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-black/8 mb-5" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px',
              activeTab === tab
                ? 'border-accent-400 text-accent-400'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div
        role="tabpanel"
        aria-label={tabLabels[activeTab]}
        className="animate-fade-in"
        key={activeTab}
      >
        {activeTab === 'watch' ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-text-secondary leading-relaxed max-w-prose">{annotation}</p>
              {contextNote && (
                <p className="text-xs text-text-tertiary mt-2 leading-relaxed max-w-prose italic">{contextNote}</p>
              )}
            </div>
            <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 shadow-card">
              <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
                What to observe
              </p>
              <div className="flex flex-col gap-3">
                {annotations.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-text-tertiary text-lg leading-none mt-0.5">☐</span>
                    <p className="text-sm text-text-primary leading-relaxed">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'script' ? (
          <div className="flex flex-col gap-4">
            {scriptText && (
              <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 shadow-card">
                <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  Transcript
                </p>
                <pre className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto">
                  {scriptText}
                </pre>
              </div>
            )}
            {screenplayText && (
              <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 shadow-card">
                <p className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  Screenplay
                </p>
                <pre className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto">
                  {screenplayText}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <ObservationGuide
            characterName={characterName}
            guide={observationGuide}
            clipId={clipId}
          />
        )}
      </div>
    </div>
  )
}
