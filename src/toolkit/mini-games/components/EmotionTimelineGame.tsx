'use client'

import { useState, useCallback, useMemo } from 'react'
import { Check, X, ArrowUp, ArrowDown } from 'lucide-react'
import GameShell from './GameShell'

interface GameResult {
  score: number
  correct: number
  wrong: number
  accuracy: number
  rounds: Array<{ correct: boolean; score: number }>
}

interface EmotionTimelineGameProps {
  totalRounds: number
  timePerRound: number
  pointsPerCorrect: number
  onComplete: (result: GameResult) => void
}

interface TimelineRound {
  scenario: string
  correctOrder: string[]
  explanation: string
}

const ROUND_DATA: TimelineRound[] = [
  {
    scenario: 'A job candidate walks into an interview room and meets the panel for the first time.',
    correctOrder: ['Anxiety', 'Forced smile', 'Self-soothing touch', 'Gradual relaxation', 'Genuine engagement'],
    explanation: 'Candidates typically progress from nervous energy to self-comfort behaviors before settling into authentic interaction.',
  },
  {
    scenario: 'A student receives their exam results in front of classmates — they failed.',
    correctOrder: ['Anticipation', 'Shock', 'Embarrassment', 'Sadness', 'Withdrawal'],
    explanation: 'Bad news triggers a cascade from hope through disbelief, social shame, and finally emotional retreat.',
  },
  {
    scenario: 'Two strangers meet at a party, discover they share a rare hobby, and become fast friends.',
    correctOrder: ['Polite distance', 'Curiosity', 'Surprise recognition', 'Enthusiastic gesturing', 'Mirrored posture'],
    explanation: 'Connection builds from social politeness through shared discovery to unconscious body language synchronization.',
  },
  {
    scenario: 'A manager calls an employee into their office to discuss a serious mistake.',
    correctOrder: ['Dread', 'Defensive posture', 'Guilt recognition', 'Acceptance', 'Determination'],
    explanation: 'Being confronted moves people from fear through self-protection to acknowledgment and resolve to improve.',
  },
  {
    scenario: 'A person watches a surprise birthday party unfold for them as they walk through the door.',
    correctOrder: ['Confusion', 'Startle response', 'Wide-eyed surprise', 'Joyful tears', 'Grateful embracing'],
    explanation: 'Genuine surprise follows a predictable path from disorientation through the startle reflex to overwhelming positive emotion.',
  },
  {
    scenario: 'A couple has a disagreement at a restaurant that escalates and then resolves.',
    correctOrder: ['Tense silence', 'Aggressive leaning forward', 'Crossed arms', 'Softening gaze', 'Reaching for hand'],
    explanation: 'Conflict follows tension, confrontation, and self-protection before empathy and reconciliation signals emerge.',
  },
  {
    scenario: 'A child performs on stage for the first time in a school play.',
    correctOrder: ['Stage fright', 'Frozen posture', 'Tentative first line', 'Growing confidence', 'Proud beaming'],
    explanation: 'Performance anxiety transitions from paralysis through cautious action to flow state and pride.',
  },
  {
    scenario: 'An athlete receives a gold medal at a championship ceremony.',
    correctOrder: ['Disbelief', 'Trembling lip', 'Tears of joy', 'Fist pump celebration', 'Humble gratitude'],
    explanation: 'Achievement triggers disbelief, emotional overflow, explosive celebration, then grounded appreciation.',
  },
  {
    scenario: 'A person gets caught telling a lie by their close friend.',
    correctOrder: ['Micro-expression of fear', 'Gaze aversion', 'Nervous laughter', 'Shame display', 'Apologetic posture'],
    explanation: 'Deception discovery causes a flash of fear, eye avoidance, deflection attempts, then submission signals.',
  },
  {
    scenario: 'A doctor delivers unexpected good news to a patient who feared the worst.',
    correctOrder: ['Bracing tension', 'Held breath', 'Confusion processing', 'Relief collapse', 'Elated disbelief'],
    explanation: 'Relief follows a physical arc from rigid tension through a processing delay to physical release and joy.',
  },
  {
    scenario: 'A negotiator makes a deal that saves a project from cancellation.',
    correctOrder: ['Poker face composure', 'Subtle lip press', 'Controlled nodding', 'Suppressed smile', 'Handshake with full grip'],
    explanation: 'Professional triumph is managed through practiced composure, leaking micro-expressions, before a confident closing gesture.',
  },
  {
    scenario: 'A teenager tells their parents they want to drop out of school.',
    correctOrder: ['Nervous fidgeting', 'Averted eyes', 'Rushed speech', 'Defensive stance', 'Pleading expression'],
    explanation: 'Delivering unwelcome news shows anxiety, shame avoidance, urgency to finish, self-protection, then seeking understanding.',
  },
  {
    scenario: 'A person witnesses a stranger collapse on the street.',
    correctOrder: ['Freeze response', 'Wide-eyed alarm', 'Looking around for help', 'Rushing forward', 'Focused determination'],
    explanation: 'Emergency response progresses from the freeze instinct through alarm, social referencing, action, and task focus.',
  },
  {
    scenario: 'A new employee joins their first team meeting at a prestigious company.',
    correctOrder: ['Tight smile', 'Minimal space occupation', 'Active listening lean', 'First tentative comment', 'Relaxed contribution'],
    explanation: 'Social integration in groups moves from guarded politeness through careful observation to gradual confident participation.',
  },
  {
    scenario: 'A person opens a gift they secretly dislike but must appear grateful.',
    correctOrder: ['Genuine anticipation', 'Micro-expression of disappointment', 'Quick recovery smile', 'Exaggerated gratitude', 'Gaze avoidance'],
    explanation: 'Social masking shows authentic emotion leaking before the conscious override, with avoidance signaling the deception effort.',
  },
]

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

type RoundStatus = 'correct' | 'wrong' | 'current' | 'upcoming'

export default function EmotionTimelineGame({
  totalRounds,
  timePerRound,
  pointsPerCorrect,
  onComplete,
}: EmotionTimelineGameProps) {
  const selectedRounds = useMemo(() => {
    const shuffled = shuffleArray(ROUND_DATA)
    return shuffled.slice(0, totalRounds)
  }, [totalRounds])

  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [timerActive, setTimerActive] = useState(true)
  const [roundResults, setRoundResults] = useState<Array<{ correct: boolean; score: number }>>([])
  const [playerOrder, setPlayerOrder] = useState<string[]>(() =>
    shuffleArray(selectedRounds[0].correctOrder)
  )
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [positionResults, setPositionResults] = useState<boolean[]>([])

  const round = selectedRounds[currentRound]

  const roundStatuses: RoundStatus[] = useMemo(() => {
    return Array.from({ length: totalRounds }, (_, i) => {
      if (i < roundResults.length) return roundResults[i].correct ? 'correct' : 'wrong'
      if (i === currentRound) return 'current'
      return 'upcoming'
    })
  }, [totalRounds, roundResults, currentRound])

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
          setPlayerOrder(shuffleArray(selectedRounds[nextRound].correctOrder))
          setSelectedIndex(null)
          setChecked(false)
          setPositionResults([])
          setTimerActive(true)
        }
      }, 2000)
    },
    [currentRound, totalRounds, finishGame, selectedRounds]
  )

  const handleTapCard = useCallback(
    (index: number) => {
      if (checked) return

      if (selectedIndex === null) {
        setSelectedIndex(index)
      } else if (selectedIndex === index) {
        setSelectedIndex(null)
      } else {
        // Swap the two positions
        setPlayerOrder((prev) => {
          const next = [...prev]
          ;[next[selectedIndex], next[index]] = [next[index], next[selectedIndex]]
          return next
        })
        setSelectedIndex(null)
      }
    },
    [selectedIndex, checked]
  )

  const handleMoveUp = useCallback(
    (index: number) => {
      if (checked || index === 0) return
      setPlayerOrder((prev) => {
        const next = [...prev]
        ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
        return next
      })
      if (selectedIndex === index) setSelectedIndex(index - 1)
    },
    [checked, selectedIndex]
  )

  const handleMoveDown = useCallback(
    (index: number) => {
      if (checked || index === playerOrder.length - 1) return
      setPlayerOrder((prev) => {
        const next = [...prev]
        ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
        return next
      })
      if (selectedIndex === index) setSelectedIndex(index + 1)
    },
    [checked, selectedIndex, playerOrder.length]
  )

  const handleCheckOrder = useCallback(() => {
    if (checked) return
    setTimerActive(false)
    setChecked(true)

    const results = playerOrder.map((item, i) => item === round.correctOrder[i])
    setPositionResults(results)

    const correctPositions = results.filter(Boolean).length
    const allCorrect = correctPositions === round.correctOrder.length
    const points = allCorrect
      ? pointsPerCorrect * 2
      : Math.round((correctPositions / round.correctOrder.length) * pointsPerCorrect)

    const isRoundCorrect = correctPositions >= Math.ceil(round.correctOrder.length / 2)
    const newScore = score + points
    if (points > 0) setScore(newScore)

    const newResults = [...roundResults, { correct: isRoundCorrect, score: points }]
    setRoundResults(newResults)
    advanceOrFinish(newScore, newResults)
  }, [checked, playerOrder, round, pointsPerCorrect, score, roundResults, advanceOrFinish])

  const handleTimeUp = useCallback(() => {
    if (checked) return
    setTimerActive(false)
    setChecked(true)

    const results = playerOrder.map((item, i) => item === round.correctOrder[i])
    setPositionResults(results)

    const newResults = [...roundResults, { correct: false, score: 0 }]
    setRoundResults(newResults)
    advanceOrFinish(score, newResults)
  }, [checked, playerOrder, round, roundResults, score, advanceOrFinish])

  const getCardClass = (index: number) => {
    const base =
      'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150'

    if (checked) {
      if (positionResults[index]) {
        return `${base} bg-success/10 border-2 border-success text-success`
      }
      return `${base} bg-error/10 border-2 border-error text-error`
    }

    if (selectedIndex === index) {
      return `${base} bg-accent-400/10 border-2 border-accent-400 text-accent-400`
    }

    return `${base} bg-bg-surface border-2 border-black/[0.08] text-text-primary hover:border-black/15 active:scale-[0.98]`
  }

  return (
    <GameShell
      title="Emotion Timeline"
      currentRound={currentRound + 1}
      totalRounds={totalRounds}
      score={score}
      timeLimit={timePerRound}
      timerActive={timerActive}
      onTimeUp={handleTimeUp}
      roundStatuses={roundStatuses}
    >
      {/* Scenario */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-sm font-medium text-text-primary text-center leading-relaxed">
          &ldquo;{round.scenario}&rdquo;
        </p>
        <p className="text-xs text-text-tertiary text-center mt-1">
          Arrange the emotions in chronological order (tap to select, tap another to swap)
        </p>
      </div>

      {/* Reorderable card list */}
      <div className="flex-1 px-4 py-2 overflow-y-auto">
        <div className="flex flex-col gap-2 max-w-[360px] mx-auto">
          {playerOrder.map((emotion, index) => (
            <div key={`${emotion}-${index}`} className="flex items-center gap-1.5">
              {/* Position number */}
              <span className="w-5 text-xs font-mono text-text-tertiary text-right flex-shrink-0">
                {index + 1}.
              </span>

              {/* Card */}
              <button
                onClick={() => handleTapCard(index)}
                disabled={checked}
                className={`flex-1 ${getCardClass(index)}`}
                role="button"
                aria-label={`Position ${index + 1}: ${emotion}`}
              >
                <span className="flex-1 text-left">{emotion}</span>
                {checked && (
                  <span className="flex-shrink-0">
                    {positionResults[index] ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <X size={16} className="text-error" />
                    )}
                  </span>
                )}
              </button>

              {/* Move buttons */}
              {!checked && (
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-bg-surface border border-black/[0.08] text-text-tertiary hover:text-text-primary disabled:opacity-20 transition-colors"
                    aria-label="Move up"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === playerOrder.length - 1}
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-bg-surface border border-black/[0.08] text-text-tertiary hover:text-text-primary disabled:opacity-20 transition-colors"
                    aria-label="Move down"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Explanation after checking */}
        {checked && (
          <div className="mt-3 px-3 py-2.5 rounded-xl bg-accent-400/5 border border-accent-400/20 max-w-[360px] mx-auto animate-fade-in">
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="font-semibold text-accent-400">Insight:</span>{' '}
              {round.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Check Order button */}
      {!checked && (
        <div className="px-4 pb-4 flex-shrink-0">
          <button
            onClick={handleCheckOrder}
            className="
              w-full py-3 rounded-pill
              bg-accent-400 text-text-inverse font-semibold text-sm
              hover:bg-accent-500 hover:shadow-glow-sm
              active:bg-accent-600 active:scale-[0.98]
              transition-all duration-150
            "
          >
            Check Order
          </button>
        </div>
      )}
    </GameShell>
  )
}
