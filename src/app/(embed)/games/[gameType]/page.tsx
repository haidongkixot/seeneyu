import { notFound } from 'next/navigation'
import GameClient from './GameClient'

const VALID_GAME_TYPES = ['guess-expression', 'match-expression', 'expression-king'] as const
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
}

interface PageProps {
  params: Promise<{ gameType: string }>
  searchParams: Promise<{ theme?: string }>
}

export default async function GamePage({ params, searchParams }: PageProps) {
  const { gameType } = await params
  const { theme } = await searchParams

  if (!VALID_GAME_TYPES.includes(gameType as GameType)) {
    notFound()
  }

  const config = GAME_CONFIGS[gameType as GameType]
  const resolvedTheme = theme === 'light' ? 'light' : 'dark'

  return <GameClient config={config} theme={resolvedTheme} />
}
