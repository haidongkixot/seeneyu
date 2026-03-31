import type { Metadata } from 'next'
import Link from 'next/link'
import { EmbedGameWrapper } from './EmbedGameWrapper'

export const metadata: Metadata = {
  robots: 'noindex',
}

const VALID_GAME_IDS = [
  'guess-expression',
  'match-expression',
  'expression-king',
  'emotion-timeline',
  'spot-the-signal',
] as const

type GameId = (typeof VALID_GAME_IDS)[number]

const GAME_TITLES: Record<GameId, string> = {
  'guess-expression': 'Guess the Expression',
  'match-expression': 'Match the Expression',
  'expression-king': 'Expression King',
  'emotion-timeline': 'Emotion Timeline',
  'spot-the-signal': 'Spot the Signal',
}

interface PageProps {
  params: Promise<{ gameId: string }>
}

export default async function EmbedGamePage({ params }: PageProps) {
  const { gameId } = await params

  const isValid = VALID_GAME_IDS.includes(gameId as GameId)
  const title = isValid ? GAME_TITLES[gameId as GameId] : 'Game'

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Minimal header */}
      <div className="px-4 py-3 border-b border-black/8 flex items-center justify-between">
        <span className="text-sm font-bold text-text-primary">seeneyu</span>
        <span className="text-xs text-text-tertiary">{title}</span>
      </div>

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {isValid ? (
          <EmbedGameWrapper gameId={gameId} />
        ) : (
          <div className="text-center text-text-secondary text-sm">
            Game not found.
          </div>
        )}
      </div>

      {/* Branding footer — shown after game ends via client state, always visible in embed */}
      <div className="px-4 py-4 border-t border-black/8 bg-bg-surface text-center">
        <p className="text-sm text-text-secondary mb-2">
          Want to improve your body language skills?
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-xs text-text-tertiary">Play more games at</span>
          <a
            href="https://seeneyu.vercel.app/games"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-accent-400 hover:underline"
          >
            seeneyu.com
          </a>
          <a
            href="https://seeneyu.vercel.app/auth/signin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-pill bg-accent-400 text-text-inverse font-semibold hover:bg-accent-500 transition-colors"
          >
            Sign Up Free
          </a>
        </div>
      </div>
    </div>
  )
}
