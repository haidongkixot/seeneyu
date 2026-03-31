'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface GameData {
  game: {
    id: string
    type: string
    title: string
    description: string
    config: { totalRounds: number; timePerRound: number; passingScore: number }
  }
  sessionId: string
  rounds: { id: string; prompt: string; imageUrl?: string; correctAnswer?: string; options?: string[] }[]
}

interface Props {
  gameId: string
}

export function EmbedGameWrapper({ gameId }: Props) {
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roundIndex, setRoundIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [gameOver, setGameOver] = useState(false)

  useEffect(() => {
    fetch(`/api/public/games/${gameId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setGameData(data)
      })
      .catch(err => setError(err.message ?? 'Failed to load game'))
      .finally(() => setLoading(false))
  }, [gameId])

  function handleAnswer(answer: string) {
    if (selected || !gameData) return
    setSelected(answer)
    const round = gameData.rounds[roundIndex]
    if (answer === round.correctAnswer) {
      setScore(s => s + 1)
    }
    setTimeout(() => {
      if (roundIndex + 1 >= gameData.rounds.length) {
        setGameOver(true)
      } else {
        setRoundIndex(i => i + 1)
        setSelected(null)
      }
    }, 1000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <div className="w-10 h-10 rounded-full border-4 border-black/10 border-t-accent-400 animate-spin" />
        <p className="text-sm text-text-secondary">Loading game…</p>
      </div>
    )
  }

  if (error || !gameData) {
    return (
      <div className="text-center text-sm text-red-500 py-10">
        {error || 'Failed to load game. Please refresh.'}
      </div>
    )
  }

  if (gameOver) {
    const total = gameData.rounds.length
    const pct = Math.round((score / total) * 100)
    return (
      <div className="text-center flex flex-col items-center gap-4 py-8 max-w-sm">
        <div className="text-5xl font-extrabold text-accent-400">{pct}%</div>
        <div>
          <p className="text-lg font-bold text-text-primary">Game Complete!</p>
          <p className="text-sm text-text-secondary mt-1">
            You scored {score} out of {total}
          </p>
        </div>
        <div className="bg-accent-400/8 border border-accent-400/20 rounded-xl px-5 py-4 text-sm text-text-secondary text-left w-full">
          <p className="font-semibold text-text-primary mb-1">Want to improve?</p>
          <p>Sign up for seeneyu to get AI-powered body language coaching and track your progress.</p>
        </div>
        <button
          onClick={() => {
            setGameOver(false)
            setRoundIndex(0)
            setScore(0)
            setSelected(null)
          }}
          className="px-5 py-2.5 rounded-pill border border-black/15 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          Play Again
        </button>
      </div>
    )
  }

  const round = gameData.rounds[roundIndex]
  const options = round.options ?? []

  return (
    <div className="w-full max-w-sm flex flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>Round {roundIndex + 1} / {gameData.rounds.length}</span>
        <span>Score: {score}</span>
      </div>
      <div className="h-1.5 bg-black/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-400 rounded-full transition-all duration-300"
          style={{ width: `${((roundIndex) / gameData.rounds.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
        {round.imageUrl && (
          <img
            src={round.imageUrl}
            alt="Round image"
            className="w-full rounded-xl mb-4 object-cover max-h-48"
          />
        )}
        <p className="text-sm font-semibold text-text-primary text-center">{round.prompt}</p>
      </div>

      {/* Options */}
      {options.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {options.map(opt => {
            const isSelected = selected === opt
            const isCorrect = opt === round.correctAnswer
            let btnClass = 'py-3 px-3 rounded-xl border text-sm font-medium transition-all duration-150 text-center'
            if (selected) {
              if (isCorrect) btnClass += ' border-green-400 bg-green-50 text-green-700'
              else if (isSelected) btnClass += ' border-red-300 bg-red-50 text-red-600'
              else btnClass += ' border-black/8 text-text-tertiary opacity-60'
            } else {
              btnClass += ' border-black/10 text-text-secondary hover:border-accent-400/40 hover:text-text-primary cursor-pointer'
            }
            return (
              <button key={opt} onClick={() => handleAnswer(opt)} className={btnClass}>
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
