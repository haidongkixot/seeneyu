import { notFound } from 'next/navigation'
import GameClient from '@/app/embed/games/[gameType]/GameClient'

const VALID_GAME_TYPES = ['guess-expression', 'match-expression', 'expression-king', 'emotion-timeline', 'spot-the-signal'] as const
type GameType = (typeof VALID_GAME_TYPES)[number]

interface GameConfig {
  type: GameType
  title: string
  description: string
  totalRounds: number
  timePerRound: number
  pointsPerCorrect: number
}

const GAME_CONFIGS: Record<GameType, GameConfig> = {
  'guess-expression': {
    type: 'guess-expression',
    title: 'Guess the Expression',
    description: 'Look at the face and pick the correct emotion. How many can you get right?',
    totalRounds: 10,
    timePerRound: 10,
    pointsPerCorrect: 30,
  },
  'match-expression': {
    type: 'match-expression',
    title: 'Match the Expression',
    description: 'Read the description and find the matching face from four options.',
    totalRounds: 8,
    timePerRound: 12,
    pointsPerCorrect: 40,
  },
  'expression-king': {
    type: 'expression-king',
    title: 'Expression King',
    description: 'Show your best expression on camera and let AI judge your performance!',
    totalRounds: 5,
    timePerRound: 30,
    pointsPerCorrect: 20,
  },
  'emotion-timeline': {
    type: 'emotion-timeline',
    title: 'Emotion Timeline',
    description: 'Arrange emotions in the correct chronological order as they unfold in real scenarios.',
    totalRounds: 8,
    timePerRound: 20,
    pointsPerCorrect: 40,
  },
  'spot-the-signal': {
    type: 'spot-the-signal',
    title: 'Spot the Signal',
    description: 'Identify the body language signal hidden in each scenario. How sharp are your observation skills?',
    totalRounds: 12,
    timePerRound: 8,
    pointsPerCorrect: 25,
  },
}

interface PageProps {
  params: Promise<{ gameType: string }>
}

export default async function GamePlayPage({ params }: PageProps) {
  const { gameType } = await params

  if (!VALID_GAME_TYPES.includes(gameType as GameType)) {
    notFound()
  }

  const config = GAME_CONFIGS[gameType as GameType]

  return (
    <div className="min-h-screen bg-bg-base">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <GameClient config={config} theme="light" />
      </main>
    </div>
  )
}
