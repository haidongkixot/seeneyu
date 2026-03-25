import Link from 'next/link'
import { Trophy, ArrowRight } from 'lucide-react'

interface PerformanceUnlockScreenProps {
  clipId: string
  characterName?: string | null
  completedSteps: number
  allPassed: boolean
}

export function PerformanceUnlockScreen({ clipId, completedSteps, allPassed }: PerformanceUnlockScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-16 px-6">
      <div className="w-20 h-20 rounded-full bg-accent-400/10 border border-accent-400/20 flex items-center justify-center animate-fade-in-up">
        <Trophy size={40} className="text-accent-400" />
      </div>

      <div className="flex flex-col gap-2 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
          {allPassed ? `You nailed all ${completedSteps} steps!` : 'Practice complete!'}
        </h2>
        <p className="text-base text-text-secondary max-w-sm leading-relaxed">
          {allPassed
            ? "You've practiced each technique separately. Now put them all together in one take."
            : "You've worked through every step. Now try the full performance recording."}
        </p>
      </div>

      <div className="w-16 border-t border-black/10" />

      <div className="flex flex-col items-center gap-3 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <Link
          href={`/library/${clipId}/record`}
          className="w-full max-w-xs bg-accent-400 text-text-inverse rounded-pill py-4 text-base font-semibold hover:bg-accent-500 hover:shadow-glow transition-all duration-150 flex items-center justify-center gap-2"
        >
          Full Performance Recording
          <ArrowRight size={18} />
        </Link>
        <Link
          href={`/library/${clipId}`}
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Back to Clip
        </Link>
      </div>
    </div>
  )
}
