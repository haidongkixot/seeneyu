import Link from 'next/link'
import { CoachNeyAvatar } from '@/components/gamification/CoachNeyAvatar'

interface CoachNeyEmptyStateProps {
  message: string
  actionLabel?: string
  actionHref?: string
}

export function CoachNeyEmptyState({ message, actionLabel, actionHref }: CoachNeyEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <CoachNeyAvatar size="lg" />
      <div className="mt-4 relative bg-accent-400/10 border border-accent-400/20 rounded-2xl px-5 py-4 max-w-sm">
        {/* Speech tail */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent-400/10 border-l border-t border-accent-400/20 rotate-45" />
        <p className="relative z-10 text-sm text-text-primary leading-relaxed">
          <span className="font-semibold text-accent-600">Coach Ney says:</span>{' '}
          {message}
        </p>
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 bg-accent-400 text-text-inverse rounded-pill px-6 py-2.5 text-sm font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
