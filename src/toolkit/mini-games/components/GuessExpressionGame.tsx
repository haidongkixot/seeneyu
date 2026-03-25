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

interface GuessExpressionGameProps {
  totalRounds: number
  timePerRound: number
  pointsPerCorrect: number
  onComplete: (result: GameResult) => void
}

const EMOTIONS = [
  { id: 'happy', label: 'Happy' },
  { id: 'sad', label: 'Sad' },
  { id: 'angry', label: 'Angry' },
  { id: 'surprised', label: 'Surprised' },
  { id: 'disgusted', label: 'Disgusted' },
  { id: 'fearful', label: 'Fearful' },
  { id: 'contempt', label: 'Contempt' },
] as const

// Demo rounds with placeholder images
function generateRounds(count: number) {
  const emotionIds = EMOTIONS.map((e) => e.id)
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    imageUrl: `/api/placeholder/expression/${i}`,
    correctEmotion: emotionIds[i % emotionIds.length],
  }))
}

type RoundStatus = 'correct' | 'wrong' | 'current' | 'upcoming'
type FeedbackState = null | 'correct' | 'wrong'

export default function GuessExpressionGame({
  totalRounds,
  timePerRound,
  pointsPerCorrect,
  onComplete,
}: GuessExpressionGameProps) {
  const rounds = useMemo(() => generateRounds(totalRounds), [totalRounds])

  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [timerActive, setTimerActive] = useState(true)
  const [roundResults, setRoundResults] = useState<Array<{ correct: boolean; score: number }>>([])
  const [scoreFloat, setScoreFloat] = useState<{ points: number; key: number } | null>(null)

  const round = rounds[currentRound]

  const roundStatuses: RoundStatus[] = useMemo(() => {
    return rounds.map((_, i) => {
      if (i < roundResults.length) return roundResults[i].correct ? 'correct' : 'wrong'
      if (i === currentRound) return 'current'
      return 'upcoming'
    })
  }, [rounds, roundResults, currentRound])

  const advanceRound = useCallback(() => {
    const nextRound = currentRound + 1
    if (nextRound >= totalRounds) {
      const correctCount = roundResults.length > 0 ? roundResults.filter((r) => r.correct).length : 0
      onComplete({
        score,
        correct: correctCount,
        wrong: totalRounds - correctCount,
        accuracy: Math.round((correctCount / totalRounds) * 100),
        rounds: roundResults,
      })
    } else {
      setCurrentRound(nextRound)
      setSelected(null)
      setFeedback(null)
      setTimerActive(true)
      setScoreFloat(null)
    }
  }, [currentRound, totalRounds, score, roundResults, onComplete])

  const handleSelect = useCallback(
    (emotionId: string) => {
      if (feedback !== null) return // Already answered

      setSelected(emotionId)
      setTimerActive(false)

      const isCorrect = emotionId === round.correctEmotion
      const points = isCorrect ? pointsPerCorrect : 0

      setFeedback(isCorrect ? 'correct' : 'wrong')

      if (isCorrect) {
        setScore((prev) => prev + points)
        setScoreFloat({ points, key: Date.now() })
      }

      const newResults = [...roundResults, { correct: isCorrect, score: points }]
      setRoundResults(newResults)

      // Auto-advance after feedback
      setTimeout(() => {
        const nextRound = currentRound + 1
        if (nextRound >= totalRounds) {
          const correctCount = newResults.filter((r) => r.correct).length
          onComplete({
            score: score + points,
            correct: correctCount,
            wrong: totalRounds - correctCount,
            accuracy: Math.round((correctCount / totalRounds) * 100),
            rounds: newResults,
          })
        } else {
          setCurrentRound(nextRound)
          setSelected(null)
          setFeedback(null)
          setTimerActive(true)
          setScoreFloat(null)
        }
      }, 1200)
    },
    [feedback, round, pointsPerCorrect, roundResults, currentRound, totalRounds, score, onComplete]
  )

  const handleTimeUp = useCallback(() => {
    if (feedback !== null) return
    setTimerActive(false)
    setFeedback('wrong')

    const newResults = [...roundResults, { correct: false, score: 0 }]
    setRoundResults(newResults)

    setTimeout(() => {
      const nextRound = currentRound + 1
      if (nextRound >= totalRounds) {
        const correctCount = newResults.filter((r) => r.correct).length
        onComplete({
          score,
          correct: correctCount,
          wrong: totalRounds - correctCount,
          accuracy: Math.round((correctCount / totalRounds) * 100),
          rounds: newResults,
        })
      } else {
        setCurrentRound(nextRound)
        setSelected(null)
        setFeedback(null)
        setTimerActive(true)
        setScoreFloat(null)
      }
    }, 1200)
  }, [feedback, roundResults, currentRound, totalRounds, score, onComplete])

  const getButtonClass = (emotionId: string) => {
    const base =
      'py-3 px-2 rounded-xl text-sm font-semibold text-center transition-all duration-150 active:scale-[0.96]'

    if (feedback === null) {
      return `${base} bg-bg-surface border border-black/[0.08] text-text-primary hover:bg-bg-overlay hover:border-black/10`
    }

    if (selected === emotionId && feedback === 'correct') {
      return `${base} border-success bg-success/10 text-success border`
    }

    if (selected === emotionId && feedback === 'wrong') {
      return `${base} border-error bg-error/10 text-error border`
    }

    if (feedback === 'wrong' && emotionId === round.correctEmotion) {
      return `${base} border-success bg-success/10 text-success border`
    }

    return `${base} bg-bg-surface border border-black/[0.08] text-text-primary opacity-40 cursor-not-allowed`
  }

  return (
    <GameShell
      title="Guess the Expression"
      currentRound={currentRound + 1}
      totalRounds={totalRounds}
      score={score}
      timeLimit={timePerRound}
      timerActive={timerActive}
      onTimeUp={handleTimeUp}
      roundStatuses={roundStatuses}
    >
      {/* Expression image */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 relative">
        <div className="w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-bg-surface border border-black/[0.08] shadow-card">
          <div className="w-full h-full flex items-center justify-center bg-bg-inset">
            <span className="text-6xl">
              {round.correctEmotion === 'happy' && '😊'}
              {round.correctEmotion === 'sad' && '😢'}
              {round.correctEmotion === 'angry' && '😠'}
              {round.correctEmotion === 'surprised' && '😲'}
              {round.correctEmotion === 'disgusted' && '🤢'}
              {round.correctEmotion === 'fearful' && '😨'}
              {round.correctEmotion === 'contempt' && '😏'}
            </span>
          </div>
        </div>

        {/* Feedback overlay */}
        {feedback && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none animate-fade-in">
            <div
              className={`
                w-20 h-20 rounded-full flex items-center justify-center
                animate-bounce-in
                ${feedback === 'correct' ? 'bg-success/20 border-2 border-success' : 'bg-error/20 border-2 border-error'}
              `}
            >
              {feedback === 'correct' ? (
                <Check size={40} className="text-success" />
              ) : (
                <X size={40} className="text-error" />
              )}
            </div>
          </div>
        )}

        {/* Score float */}
        {scoreFloat && (
          <span
            key={scoreFloat.key}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 text-lg font-bold text-success animate-xp-float pointer-events-none"
          >
            +{scoreFloat.points}
          </span>
        )}
      </div>

      {/* Emotion buttons */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {EMOTIONS.slice(0, 6).map((emotion) => (
            <button
              key={emotion.id}
              onClick={() => handleSelect(emotion.id)}
              disabled={feedback !== null}
              className={getButtonClass(emotion.id)}
              role="button"
              aria-label={`Select ${emotion.label}`}
            >
              {emotion.label}
            </button>
          ))}
        </div>
        {/* Contempt button centered below */}
        <div className="flex justify-center mt-2">
          <button
            onClick={() => handleSelect('contempt')}
            disabled={feedback !== null}
            className={`${getButtonClass('contempt')} min-w-[100px]`}
            role="button"
            aria-label="Select Contempt"
          >
            Contempt
          </button>
        </div>
      </div>
    </GameShell>
  )
}
