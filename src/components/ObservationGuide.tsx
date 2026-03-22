import Link from 'next/link'
import { ChevronRight, ClipboardList } from 'lucide-react'
import type { ObservationGuide as ObservationGuideType } from '@/lib/types'

function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface ObservationGuideProps {
  characterName: string | null
  guide: ObservationGuideType | null
  clipId: string
}

export function ObservationGuide({ characterName, guide, clipId }: ObservationGuideProps) {
  if (!guide || guide.moments.length === 0) {
    return (
      <div className="bg-bg-elevated border border-white/8 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
        <ClipboardList size={32} className="text-text-tertiary" strokeWidth={1.5} />
        <p className="text-sm font-medium text-text-secondary">
          Observation guide coming soon for this clip.
        </p>
        <p className="text-sm text-text-tertiary max-w-xs leading-relaxed">
          In the meantime, watch the clip carefully and focus on what the character does with their eyes, posture, and voice.
        </p>
        <Link
          href={`/library/${clipId}/record`}
          className="mt-1 inline-flex items-center gap-2 bg-accent-400 text-text-inverse rounded-pill px-5 py-2.5 text-sm font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150"
        >
          Start Recording
          <ChevronRight size={15} />
        </Link>
      </div>
    )
  }

  const headline = guide.headline ?? (characterName ? `What ${characterName.split(' ')[0]} does — and why it works` : 'Why this technique works')

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base font-semibold text-text-primary">{headline}</p>

      {/* Timeline */}
      <div role="list" aria-label="Technique timeline" className="relative flex flex-col gap-0">
        {/* Vertical guide line */}
        <div className="absolute left-[31px] top-4 bottom-4 w-px bg-white/8 pointer-events-none" />

        {guide.moments.map((moment, index) => (
          <div
            key={index}
            role="listitem"
            className="relative flex items-start gap-4 animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Timestamp badge */}
            <span
              aria-label={`at ${moment.atSecond} seconds`}
              className="flex-shrink-0 w-[63px] h-7 rounded-pill bg-bg-elevated border border-white/10 flex items-center justify-center text-xs font-mono text-text-secondary"
            >
              {formatTimestamp(moment.atSecond)}
            </span>

            {/* Dot on timeline */}
            <span className="absolute left-[27px] top-3.5 w-2 h-2 rounded-full bg-accent-400 ring-2 ring-bg-base flex-shrink-0 z-raised" aria-hidden="true" />

            {/* Content */}
            <div className="flex-1 pb-5">
              <p className="text-sm font-semibold text-text-primary mb-0.5">{moment.technique}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{moment.what}</p>
              <p className="text-xs text-text-tertiary mt-1 leading-relaxed italic">{moment.why}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/8" />

      {/* CTA */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">Ready to practise this yourself?</span>
        <Link
          href={`/library/${clipId}/record`}
          className="inline-flex items-center gap-2 bg-accent-400 text-text-inverse rounded-pill px-5 py-2.5 text-sm font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150"
        >
          Start Recording
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  )
}
