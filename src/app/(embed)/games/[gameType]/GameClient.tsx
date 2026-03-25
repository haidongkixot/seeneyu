'use client'

import { useState, useCallback, useEffect } from 'react'
import { Trophy, RotateCcw, ArrowLeft } from 'lucide-react'
import GuessExpressionGame from '@/toolkit/mini-games/components/GuessExpressionGame'
import MatchExpressionGame from '@/toolkit/mini-games/components/MatchExpressionGame'
import ExpressionKingGame from '@/toolkit/mini-games/components/ExpressionKingGame'

interface GameConfig {
  type: string
  title: string
  description: string
  totalRounds: number
  timePerRound: number
  pointsPerCorrect: number
}

interface GameResult {
  score: number
  correct: number
  wrong: number
  accuracy: number
  rounds: Array<{ correct: boolean; score: number }>
}

type GameState = 'intro' | 'playing' | 'result'

function postToParent(type: string, payload: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined' && window.parent !== window) {
    window.parent.postMessage({ type: `seeneyu:${type}`, payload }, '*')
  }
}

export default function GameClient({
  config,
  theme,
}: {
  config: GameConfig
  theme: 'dark' | 'light'
}) {
  const [state, setState] = useState<GameState>('intro')
  const [result, setResult] = useState<GameResult | null>(null)

  useEffect(() => {
    postToParent('game-ready', { gameType: config.type })
  }, [config.type])

  // Listen for parent messages
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const data = e.data
      if (!data || !data.type) return
      // Future: handle config:theme, game:pause, game:resume
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleStart = useCallback(() => {
    setState('playing')
    postToParent('game-started', { gameType: config.type })
  }, [config.type])

  const handleComplete = useCallback(
    (gameResult: GameResult) => {
      setResult(gameResult)
      setState('result')
      postToParent('game-completed', {
        gameType: config.type,
        score: gameResult.score,
        accuracy: gameResult.accuracy,
      })
    },
    [config.type]
  )

  const handlePlayAgain = useCallback(() => {
    setResult(null)
    setState('intro')
  }, [])

  const isLight = theme === 'light'
  const themeClass = isLight ? 'game-theme-light' : ''

  return (
    <div
      className={`w-full min-h-screen flex flex-col bg-bg-base ${themeClass}`}
    >
      {state === 'intro' && (
        <IntroScreen
          config={config}
          onStart={handleStart}
        />
      )}

      {state === 'playing' && (
        <PlayingScreen
          config={config}
          onComplete={handleComplete}
        />
      )}

      {state === 'result' && result && (
        <ResultScreen
          config={config}
          result={result}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}

function IntroScreen({
  config,
  onStart,
}: {
  config: GameConfig
  onStart: () => void
}) {
  const iconMap: Record<string, string> = {
    'guess-expression': '🎯',
    'match-expression': '🔗',
    'expression-king': '👑',
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-accent-400/10 border border-accent-400/30 flex items-center justify-center mb-6">
        <span className="text-3xl">{iconMap[config.type] || '🎮'}</span>
      </div>

      <h1 className="text-2xl font-bold text-text-primary text-center mb-2">
        {config.title}
      </h1>

      <p className="text-sm text-text-secondary text-center max-w-xs mb-2">
        {config.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-text-tertiary mb-8">
        <span>{config.totalRounds} rounds</span>
        <span className="w-1 h-1 rounded-full bg-black/10" />
        <span>{config.timePerRound}s per round</span>
      </div>

      <button
        onClick={onStart}
        className="
          px-8 py-3.5 rounded-pill
          bg-accent-400 text-text-inverse font-semibold text-sm
          hover:bg-accent-500 hover:shadow-glow-sm
          active:bg-accent-600 active:scale-[0.98]
          transition-all duration-150
        "
      >
        Start Game
      </button>
    </div>
  )
}

function PlayingScreen({
  config,
  onComplete,
}: {
  config: GameConfig
  onComplete: (result: GameResult) => void
}) {
  if (config.type === 'guess-expression') {
    return (
      <GuessExpressionGame
        totalRounds={config.totalRounds}
        timePerRound={config.timePerRound}
        pointsPerCorrect={config.pointsPerCorrect}
        onComplete={onComplete}
      />
    )
  }

  if (config.type === 'match-expression') {
    return (
      <MatchExpressionGame
        totalRounds={config.totalRounds}
        timePerRound={config.timePerRound}
        pointsPerCorrect={config.pointsPerCorrect}
        onComplete={onComplete}
      />
    )
  }

  if (config.type === 'expression-king') {
    return (
      <ExpressionKingGame
        totalRounds={config.totalRounds}
        timePerRound={config.timePerRound}
        pointsPerCorrect={config.pointsPerCorrect}
        onComplete={onComplete}
      />
    )
  }

  return null
}

function ResultScreen({
  config,
  result,
  onPlayAgain,
}: {
  config: GameConfig
  result: GameResult
  onPlayAgain: () => void
}) {
  const handleSignUp = () => {
    postToParent('signup-prompt', { gameType: config.type, score: result.score })
    // If not in iframe, navigate directly to signup
    if (typeof window !== 'undefined' && window.parent === window) {
      window.location.href = '/auth/signup'
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 animate-fade-in">
      {/* Trophy icon */}
      <div className="w-20 h-20 rounded-full bg-accent-400/10 border border-accent-400/30 flex items-center justify-center mb-4 animate-bounce-in">
        <Trophy size={36} className="text-accent-400" />
      </div>

      <h2 className="text-2xl font-bold text-text-primary mb-1">Game Over!</h2>
      <p className="text-sm text-text-secondary mb-6">Great effort!</p>

      {/* Final score */}
      <div className="bg-bg-surface border border-black/[0.08] rounded-2xl px-8 py-5 shadow-card mb-6 text-center">
        <span className="text-4xl font-bold text-accent-400 font-mono">
          {result.score}
        </span>
        <p className="text-xs text-text-tertiary mt-1">Total Score</p>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 mb-8">
        <div className="text-center">
          <span className="text-lg font-bold text-success font-mono">
            {result.correct}
          </span>
          <p className="text-xs text-text-tertiary">Correct</p>
        </div>
        <div className="w-px h-8 bg-white/[0.08]" />
        <div className="text-center">
          <span className="text-lg font-bold text-error font-mono">
            {result.wrong}
          </span>
          <p className="text-xs text-text-tertiary">Wrong</p>
        </div>
        <div className="w-px h-8 bg-white/[0.08]" />
        <div className="text-center">
          <span className="text-lg font-bold text-text-primary font-mono">
            {result.accuracy}%
          </span>
          <p className="text-xs text-text-tertiary">Accuracy</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full max-w-[280px]">
        <button
          onClick={onPlayAgain}
          className="
            w-full py-3 rounded-pill flex items-center justify-center gap-2
            bg-accent-400 text-text-inverse font-semibold text-sm
            hover:bg-accent-500 hover:shadow-glow-sm
            active:bg-accent-600 active:scale-[0.98]
            transition-all duration-150
          "
        >
          <RotateCcw size={16} />
          Play Again
        </button>
        <button
          onClick={handleSignUp}
          className="
            w-full py-3 rounded-pill
            bg-transparent border border-black/10 text-text-primary font-semibold text-sm
            hover:border-black/20 hover:bg-bg-overlay
            transition-all duration-150
          "
        >
          Sign up to save score
        </button>
      </div>
    </div>
  )
}
