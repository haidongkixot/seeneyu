'use client'

import { useState, useCallback, useMemo } from 'react'
import { Check, X } from 'lucide-react'
import GameShell from './GameShell'

interface GameResult {
  score: number
  correct: number
  wrong: number
  accuracy: number
  rounds: Array<{ correct: boolean; score: number }>
}

interface MatchExpressionGameProps {
  totalRounds: number
  timePerRound: number
  pointsPerCorrect: number
  onComplete: (result: GameResult) => void
}

interface MatchOption {
  id: number
  correct: boolean
  emoji: string
}

interface MatchRound {
  description: string
  options: MatchOption[]
}

// Demo round data
const ROUND_TEMPLATES: Array<{ description: string; correctEmoji: string; wrongEmojis: string[] }> = [
  { description: 'A person showing genuine surprise with raised eyebrows and an open mouth', correctEmoji: '😲', wrongEmojis: ['😊', '😠', '😢'] },
  { description: 'Someone expressing deep sadness with downturned lips and teary eyes', correctEmoji: '😢', wrongEmojis: ['😊', '😲', '😏'] },
  { description: 'A face showing intense anger with furrowed brows and clenched jaw', correctEmoji: '😠', wrongEmojis: ['😊', '😢', '😲'] },
  { description: 'A warm, genuine smile showing happiness and joy', correctEmoji: '😊', wrongEmojis: ['😠', '😢', '😨'] },
  { description: 'A person showing fear with wide eyes and a tense expression', correctEmoji: '😨', wrongEmojis: ['😊', '😏', '😠'] },
  { description: 'A subtle expression of contempt with one corner of the mouth raised', correctEmoji: '😏', wrongEmojis: ['😊', '😢', '😲'] },
  { description: 'A face showing disgust with wrinkled nose and narrowed eyes', correctEmoji: '🤢', wrongEmojis: ['😊', '😠', '😲'] },
  { description: 'An expression of mixed surprise and delight', correctEmoji: '🤩', wrongEmojis: ['😢', '😠', '😨'] },
  { description: 'Someone showing quiet contemplation and thoughtfulness', correctEmoji: '🤔', wrongEmojis: ['😊', '😠', '😲'] },
  { description: 'A face displaying pure exhaustion and weariness', correctEmoji: '😩', wrongEmojis: ['😊', '😏', '🤩'] },
]

function generateRounds(count: number): MatchRound[] {
  return Array.from({ length: count }, (_, i) => {
    const template = ROUND_TEMPLATES[i % ROUND_TEMPLATES.length]
    const correctIdx = Math.floor(Math.random() * 4)
    const options: MatchOption[] = []
    let wrongIdx = 0

    for (let j = 0; j < 4; j++) {
      if (j === correctIdx) {
        options.push({ id: j, correct: true, emoji: template.correctEmoji })
      } else {
        options.push({ id: j, correct: false, emoji: template.wrongEmojis[wrongIdx++] })
      }
    }

    return { description: template.description, options }
  })
}

type RoundStatus = 'correct' | 'wrong' | 'current' | 'upcoming'

export default function MatchExpressionGame({
  totalRounds,
  timePerRound,
  pointsPerCorrect,
  onComplete,
}: MatchExpressionGameProps) {
  const rounds = useMemo(() => generateRounds(totalRounds), [totalRounds])

  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [timerActive, setTimerActive] = useState(true)
  const [roundResults, setRoundResults] = useState<Array<{ correct: boolean; score: number }>>([])

  const round = rounds[currentRound]

  const roundStatuses: RoundStatus[] = useMemo(() => {
    return rounds.map((_, i) => {
      if (i < roundResults.length) return roundResults[i].correct ? 'correct' : 'wrong'
      if (i === currentRound) return 'current'
      return 'upcoming'
    })
  }, [rounds, roundResults, currentRound])

  const finishGame = useCallback(
    (finalScore: number, results: Array<{ correct: boolean; score: number }>) => {
      const correctCount = results.filter((r) => r.correct).length
      onComplete({
        score: finalScore,
        correct: correctCount,
        wrong: totalRounds - correctCount,
        accuracy: Math.round((correctCount / totalRounds) * 100),
        rounds: results,
      })
    },
    [totalRounds, onComplete]
  )

  const advanceOrFinish = useCallback(
    (newScore: number, newResults: Array<{ correct: boolean; score: number }>) => {
      setTimeout(() => {
        const nextRound = currentRound + 1
        if (nextRound >= totalRounds) {
          finishGame(newScore, newResults)
        } else {
          setCurrentRound(nextRound)
          setSelected(null)
          setTimerActive(true)
        }
      }, 1200)
    },
    [currentRound, totalRounds, finishGame]
  )

  const handleSelect = useCallback(
    (optionId: number) => {
      if (selected !== null) return

      setSelected(optionId)
      setTimerActive(false)

      const option = round.options.find((o) => o.id === optionId)
      const isCorrect = option?.correct ?? false
      const points = isCorrect ? pointsPerCorrect : 0
      const newScore = score + points

      if (isCorrect) setScore(newScore)

      const newResults = [...roundResults, { correct: isCorrect, score: points }]
      setRoundResults(newResults)
      advanceOrFinish(newScore, newResults)
    },
    [selected, round, pointsPerCorrect, score, roundResults, advanceOrFinish]
  )

  const handleTimeUp = useCallback(() => {
    if (selected !== null) return
    setTimerActive(false)
    setSelected(-1) // Sentinel for time-up

    const newResults = [...roundResults, { correct: false, score: 0 }]
    setRoundResults(newResults)
    advanceOrFinish(score, newResults)
  }, [selected, roundResults, score, advanceOrFinish])

  const getOptionClass = (option: MatchOption) => {
    const base = 'relative aspect-square rounded-2xl overflow-hidden bg-bg-surface transition-all duration-200 active:scale-[0.96]'

    if (selected === null) {
      return `${base} border-2 border-white/[0.08] hover:border-white/20 hover:shadow-card-hover`
    }

    if (selected === option.id && option.correct) {
      return `${base} border-2 border-success shadow-glow-green`
    }
    if (selected === option.id && !option.correct) {
      return `${base} border-2 border-error shadow-glow-red`
    }
    if (option.correct && selected !== option.id) {
      return `${base} border-2 border-success/50`
    }
    return `${base} border-2 border-white/[0.08] opacity-40`
  }

  return (
    <GameShell
      title="Match the Expression"
      currentRound={currentRound + 1}
      totalRounds={totalRounds}
      score={score}
      timeLimit={timePerRound}
      timerActive={timerActive}
      onTimeUp={handleTimeUp}
      roundStatuses={roundStatuses}
    >
      {/* Description */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-base font-medium text-text-primary text-center leading-relaxed">
          &ldquo;{round.description}&rdquo;
        </p>
      </div>

      {/* Image option grid */}
      <div className="flex-1 px-4 py-3">
        <div className="grid grid-cols-2 gap-3 max-w-[360px] mx-auto">
          {round.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={selected !== null}
              className={getOptionClass(option)}
              role="button"
              aria-label={`Option ${option.id + 1}`}
            >
              <div className="w-full h-full flex items-center justify-center bg-bg-inset">
                <span className="text-5xl">{option.emoji}</span>
              </div>

              {/* Selection indicator overlay */}
              {selected === option.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  {option.correct ? (
                    <Check size={32} className="text-success" />
                  ) : (
                    <X size={32} className="text-error" />
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  )
}
