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

interface SpotTheSignalGameProps {
  totalRounds: number
  timePerRound: number
  pointsPerCorrect: number
  onComplete: (result: GameResult) => void
}

interface SignalRound {
  scenario: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

const ROUND_DATA: SignalRound[] = [
  // Easy rounds (1-4)
  {
    scenario: 'During a meeting, your colleague crosses their arms tightly across their chest, leans back in their chair, and avoids eye contact while the manager discusses upcoming changes.',
    question: 'What body language signal is being shown?',
    options: ['Defensive resistance', 'Physical coldness', 'Boredom', 'Confidence'],
    correctIndex: 0,
    explanation: 'Crossed arms combined with leaning back and gaze aversion form a classic defensive cluster, signaling resistance or disagreement with what is being said.',
    difficulty: 'easy',
  },
  {
    scenario: 'A friend tells you about their vacation plans while their eyes light up, their hands move expressively, and they lean toward you with an open posture.',
    question: 'What body language signal is being shown?',
    options: ['Nervousness', 'Genuine enthusiasm', 'Impatience', 'Seeking approval'],
    correctIndex: 1,
    explanation: 'Bright eyes, expansive hand gestures, and forward leaning together indicate authentic excitement and engagement with the topic.',
    difficulty: 'easy',
  },
  {
    scenario: 'The speaker at a conference grips the podium with both hands, shifts their weight from foot to foot, and repeatedly touches their collar.',
    question: 'What body language signal is being shown?',
    options: ['Authority display', 'Stage fright / anxiety', 'Preparation to leave', 'Disagreement with audience'],
    correctIndex: 1,
    explanation: 'Gripping objects for stability, weight shifting, and self-touching (adaptor behaviors) are hallmarks of nervousness and anxiety.',
    difficulty: 'easy',
  },
  {
    scenario: 'Your boss nods slowly while you present your idea, maintains steady eye contact, and steeples their fingers in front of their chin.',
    question: 'What body language signal is being shown?',
    options: ['Impatience', 'Confusion', 'Evaluative interest', 'Dismissal'],
    correctIndex: 2,
    explanation: 'Finger steepling combined with slow nodding and sustained eye contact signals confidence and thoughtful evaluation of your proposal.',
    difficulty: 'easy',
  },
  // Medium rounds (5-8)
  {
    scenario: 'During a negotiation, the other party suddenly uncrosses their legs, shifts forward in their seat, and places both palms flat on the table.',
    question: 'What body language signal is being shown?',
    options: ['Aggression warning', 'Readiness to agree', 'Deception attempt', 'Fatigue'],
    correctIndex: 1,
    explanation: 'Opening up body position, forward lean, and palms-down on the table indicate a shift toward engagement and willingness to make a deal.',
    difficulty: 'medium',
  },
  {
    scenario: 'While telling you a story, your friend briefly touches their nose, breaks eye contact to the left, and increases their speaking pace slightly.',
    question: 'What body language signal is being shown?',
    options: ['Allergic reaction', 'Possible deception cues', 'Excitement about the story', 'Trying to remember details'],
    correctIndex: 1,
    explanation: 'Nose touching (increased blood flow from stress), gaze aversion, and speech acceleration form a cluster associated with cognitive load during deception.',
    difficulty: 'medium',
  },
  {
    scenario: 'In a group conversation, one person mirrors the posture of the speaker, tilts their head slightly, and maintains a gentle smile throughout.',
    question: 'What body language signal is being shown?',
    options: ['Mimicry for manipulation', 'Active rapport building', 'Submissive behavior', 'Boredom masking'],
    correctIndex: 1,
    explanation: 'Postural mirroring, head tilting, and sustained soft smiling are unconscious rapport signals showing genuine connection and attentiveness.',
    difficulty: 'medium',
  },
  {
    scenario: 'After receiving feedback, your coworker smiles with their mouth but their eyebrows pull together briefly and their jaw muscles tighten.',
    question: 'What body language signal is being shown?',
    options: ['Genuine appreciation', 'Masked displeasure', 'Physical pain', 'Concentration'],
    correctIndex: 1,
    explanation: 'A smile contradicted by brow furrowing and jaw tension reveals a masked negative emotion — the face is showing conflicting signals between social display and true feeling.',
    difficulty: 'medium',
  },
  // Hard rounds (9-12)
  {
    scenario: 'During a first date, the person across from you aligns their feet toward the door, angles their torso slightly away, but maintains eye contact and laughs at your jokes.',
    question: 'What body language signal is being shown?',
    options: ['Full engagement', 'Feet-first discomfort leak', 'Playful teasing posture', 'Relaxed confidence'],
    correctIndex: 1,
    explanation: 'Feet orientation is one of the most honest body parts — they point where we truly want to go. Despite socially engaging upper body signals, the feet reveal underlying discomfort or desire to leave.',
    difficulty: 'hard',
  },
  {
    scenario: 'A witness being questioned blinks rapidly, swallows hard, then freezes completely still for about two seconds before answering in an overly measured tone.',
    question: 'What body language signal is being shown?',
    options: ['Careful recollection', 'Fight-or-flight freeze response', 'Respectful consideration', 'Physical fatigue'],
    correctIndex: 1,
    explanation: 'Rapid blinking and hard swallowing indicate stress, followed by a freeze response — the body going still as the brain processes a threat (the question) before formulating a controlled response.',
    difficulty: 'hard',
  },
  {
    scenario: 'In a photo, a politician shakes hands with a rival. Their left hand grips the rival\'s elbow, their body is angled to face the cameras, and their smile shows both upper and lower teeth.',
    question: 'What body language signal is being shown?',
    options: ['Genuine warmth', 'Dominance and control display', 'Nervous overcompensation', 'Cultural greeting custom'],
    correctIndex: 1,
    explanation: 'The double-handed handshake with elbow grip is a power move — it controls the other person\'s arm. Combined with camera-oriented positioning, this is a calculated dominance display.',
    difficulty: 'hard',
  },
  {
    scenario: 'While listening to a presentation, a participant\'s pupils dilate noticeably, they lean forward almost imperceptibly, and their breathing becomes slightly shallower.',
    question: 'What body language signal is being shown?',
    options: ['Drowsiness onset', 'Intense cognitive interest', 'Onset of anxiety attack', 'Vision adjustment to lighting'],
    correctIndex: 1,
    explanation: 'Pupil dilation is an involuntary response to interest or arousal. Combined with subtle forward lean and altered breathing, these micro-signals indicate deep cognitive engagement.',
    difficulty: 'hard',
  },
  // Extra rounds for variety
  {
    scenario: 'A customer service agent keeps a flat expression, speaks in a monotone, and repeatedly glances at the clock on the wall.',
    question: 'What body language signal is being shown?',
    options: ['Professional composure', 'Emotional exhaustion / disengagement', 'Active listening', 'Time management awareness'],
    correctIndex: 1,
    explanation: 'Flat affect, monotone speech, and clock-watching together signal emotional burnout and mental disengagement from the interaction.',
    difficulty: 'easy',
  },
  {
    scenario: 'When asked about their weekend, your colleague\'s face briefly flashes a micro-expression — eyebrows pull up and together for less than a second — before they say "It was fine."',
    question: 'What body language signal is being shown?',
    options: ['Genuine contentment', 'Suppressed sadness micro-expression', 'Thinking gesture', 'Muscle twitch'],
    correctIndex: 1,
    explanation: 'Inner eyebrow raise lasting under 0.5 seconds is the hallmark micro-expression of sadness. The verbal "fine" contradicts the fleeting facial truth.',
    difficulty: 'hard',
  },
  {
    scenario: 'During a team lunch, one person sits with their chair pushed slightly back from the table, their body angled away from the group, and they check their phone frequently.',
    question: 'What body language signal is being shown?',
    options: ['Multitasking efficiently', 'Social exclusion or self-isolation', 'Waiting for an important call', 'Introvert recharging'],
    correctIndex: 1,
    explanation: 'Physical distancing from the group through chair position, body angle, and phone use as a barrier object signals social withdrawal or feelings of exclusion.',
    difficulty: 'medium',
  },
  {
    scenario: 'A child hides behind their parent\'s leg, peeks out briefly at a stranger, then quickly retreats again while gripping the parent\'s clothing.',
    question: 'What body language signal is being shown?',
    options: ['Playful peek-a-boo', 'Approach-avoidance conflict', 'Shyness without fear', 'Attention seeking'],
    correctIndex: 1,
    explanation: 'The repeated peek-and-hide pattern demonstrates approach-avoidance conflict — curiosity draws the child to look, but fear drives them to retreat to safety.',
    difficulty: 'medium',
  },
  {
    scenario: 'In a heated debate, one participant suddenly drops their voice to nearly a whisper, slows their speech dramatically, and holds completely still.',
    question: 'What body language signal is being shown?',
    options: ['Losing their train of thought', 'Controlled intensity / power move', 'Admitting defeat', 'Voice fatigue'],
    correctIndex: 1,
    explanation: 'Deliberately lowering volume, slowing pace, and freezing movement is a high-status power signal — it forces others to lean in and pay attention, commanding the room through stillness.',
    difficulty: 'hard',
  },
  {
    scenario: 'Your friend describes their new relationship while unconsciously touching their neck, speaking faster than usual, and looking down with a slight smile.',
    question: 'What body language signal is being shown?',
    options: ['Nervous vulnerability', 'Deceptive storytelling', 'Boredom', 'Physical discomfort'],
    correctIndex: 0,
    explanation: 'Neck touching exposes a vulnerable area (a pacifying gesture), fast speech shows excitement, and the downward gaze with smile indicates shy, positive vulnerability about an emotional topic.',
    difficulty: 'medium',
  },
  {
    scenario: 'At the end of a job interview, the interviewer stands up quickly, extends a firm handshake, and walks you to the door themselves rather than having the receptionist do it.',
    question: 'What body language signal is being shown?',
    options: ['Rushing you out', 'Positive regard / respect signal', 'Standard corporate protocol', 'Dominance assertion'],
    correctIndex: 1,
    explanation: 'Personally escorting a candidate to the door is a high-respect behavior — it signals the interviewer values you enough to invest extra time and personal attention.',
    difficulty: 'medium',
  },
  {
    scenario: 'While presenting quarterly results, the CFO touches their earlobe, clears their throat twice, and shifts the papers on the desk before stating "Numbers look strong this quarter."',
    question: 'What body language signal is being shown?',
    options: ['Habitual mannerism', 'Stress leakage contradicting verbal message', 'Thorough preparation', 'Emphasis technique'],
    correctIndex: 1,
    explanation: 'Earlobe touching, throat clearing, and displacement activities (moving papers) are stress indicators that contradict the confident verbal message — suggesting the numbers may not be as strong as stated.',
    difficulty: 'hard',
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

export default function SpotTheSignalGame({
  totalRounds,
  timePerRound,
  pointsPerCorrect,
  onComplete,
}: SpotTheSignalGameProps) {
  const selectedRounds = useMemo(() => {
    // Sort by difficulty, then pick a progressive set
    const easy = shuffleArray(ROUND_DATA.filter((r) => r.difficulty === 'easy'))
    const medium = shuffleArray(ROUND_DATA.filter((r) => r.difficulty === 'medium'))
    const hard = shuffleArray(ROUND_DATA.filter((r) => r.difficulty === 'hard'))

    const picked: SignalRound[] = []
    const easyCount = Math.min(Math.ceil(totalRounds * 0.3), easy.length)
    const mediumCount = Math.min(Math.ceil(totalRounds * 0.35), medium.length)
    const hardCount = Math.min(totalRounds - easyCount - mediumCount, hard.length)

    picked.push(...easy.slice(0, easyCount))
    picked.push(...medium.slice(0, mediumCount))
    picked.push(...hard.slice(0, hardCount))

    // Fill remaining if needed
    const remaining = totalRounds - picked.length
    if (remaining > 0) {
      const all = shuffleArray(ROUND_DATA.filter((r) => !picked.includes(r)))
      picked.push(...all.slice(0, remaining))
    }

    return picked.slice(0, totalRounds)
  }, [totalRounds])

  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [timerActive, setTimerActive] = useState(true)
  const [roundResults, setRoundResults] = useState<Array<{ correct: boolean; score: number }>>([])
  const [scoreFloat, setScoreFloat] = useState<{ points: number; key: number } | null>(null)

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
          setSelected(null)
          setTimerActive(true)
          setScoreFloat(null)
        }
      }, 2000)
    },
    [currentRound, totalRounds, finishGame]
  )

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (selected !== null) return

      setSelected(optionIndex)
      setTimerActive(false)

      const isCorrect = optionIndex === round.correctIndex
      const points = isCorrect ? pointsPerCorrect : 0
      const newScore = score + points

      if (isCorrect) {
        setScore(newScore)
        setScoreFloat({ points, key: Date.now() })
      }

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

  const getOptionClass = (index: number) => {
    const base =
      'w-full py-3 px-4 rounded-xl text-sm font-medium text-left transition-all duration-150 active:scale-[0.98]'

    if (selected === null) {
      return `${base} bg-bg-surface border-2 border-black/[0.08] text-text-primary hover:border-black/15 hover:bg-bg-overlay`
    }

    if (selected === index && index === round.correctIndex) {
      return `${base} bg-success/10 border-2 border-success text-success`
    }

    if (selected === index && index !== round.correctIndex) {
      return `${base} bg-error/10 border-2 border-error text-error`
    }

    if (index === round.correctIndex) {
      return `${base} bg-success/10 border-2 border-success/50 text-success`
    }

    return `${base} bg-bg-surface border-2 border-black/[0.08] text-text-primary opacity-40`
  }

  const difficultyLabel =
    round.difficulty === 'easy'
      ? 'Easy'
      : round.difficulty === 'medium'
        ? 'Medium'
        : 'Hard'

  const difficultyColor =
    round.difficulty === 'easy'
      ? 'text-success bg-success/10'
      : round.difficulty === 'medium'
        ? 'text-warning bg-warning/10'
        : 'text-error bg-error/10'

  return (
    <GameShell
      title="Spot the Signal"
      currentRound={currentRound + 1}
      totalRounds={totalRounds}
      score={score}
      timeLimit={timePerRound}
      timerActive={timerActive}
      onTimeUp={handleTimeUp}
      roundStatuses={roundStatuses}
    >
      {/* Difficulty badge */}
      <div className="px-4 pt-3 pb-1 flex justify-center">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-pill ${difficultyColor}`}>
          {difficultyLabel}
        </span>
      </div>

      {/* Scenario */}
      <div className="px-4 pt-1 pb-2 relative">
        <p className="text-sm text-text-primary text-center leading-relaxed">
          {round.scenario}
        </p>

        {/* Score float */}
        {scoreFloat && (
          <span
            key={scoreFloat.key}
            className="absolute top-0 left-1/2 -translate-x-1/2 text-lg font-bold text-success animate-xp-float pointer-events-none"
          >
            +{scoreFloat.points}
          </span>
        )}
      </div>

      {/* Question */}
      <div className="px-4 pb-2">
        <p className="text-xs font-semibold text-text-secondary text-center uppercase tracking-wide">
          {round.question}
        </p>
      </div>

      {/* Options */}
      <div className="flex-1 px-4 py-1">
        <div className="flex flex-col gap-2 max-w-[400px] mx-auto">
          {round.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={selected !== null}
              className={getOptionClass(index)}
              role="button"
              aria-label={`Option: ${option}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black/[0.04] flex items-center justify-center text-xs font-bold text-text-tertiary flex-shrink-0">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1">{option}</span>
                {selected !== null && index === round.correctIndex && (
                  <Check size={16} className="text-success flex-shrink-0" />
                )}
                {selected === index && index !== round.correctIndex && (
                  <X size={16} className="text-error flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Explanation after answer */}
      {selected !== null && (
        <div className="px-4 pb-4 flex-shrink-0 animate-fade-in">
          <div className="px-3 py-2.5 rounded-xl bg-accent-400/5 border border-accent-400/20 max-w-[400px] mx-auto">
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="font-semibold text-accent-400">Why:</span>{' '}
              {round.explanation}
            </p>
          </div>
        </div>
      )}
    </GameShell>
  )
}
