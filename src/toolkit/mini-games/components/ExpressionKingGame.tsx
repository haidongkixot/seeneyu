'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Camera } from 'lucide-react'
import GameShell from './GameShell'
import CertificateCard from './CertificateCard'

interface GameResult {
  score: number
  correct: number
  wrong: number
  accuracy: number
  rounds: Array<{ correct: boolean; score: number }>
}

interface ExpressionKingGameProps {
  totalRounds: number
  timePerRound: number
  pointsPerCorrect: number
  onComplete: (result: GameResult) => void
}

const CHALLENGES = [
  { prompt: 'Show us your best SURPRISE face!', emoji: '😲' },
  { prompt: 'Give us your most dramatic ANGER!', emoji: '😠' },
  { prompt: 'Show genuine HAPPINESS and joy!', emoji: '😊' },
  { prompt: 'Express deep SADNESS and sorrow.', emoji: '😢' },
  { prompt: 'Show your most convincing FEAR!', emoji: '😨' },
  { prompt: 'Give us a look of pure DISGUST!', emoji: '🤢' },
  { prompt: 'Show subtle CONTEMPT with a smirk.', emoji: '😏' },
  { prompt: 'Express EXCITEMENT and wonder!', emoji: '🤩' },
  { prompt: 'Show deep CONCENTRATION and focus.', emoji: '🤔' },
  { prompt: 'Give us your best CONFIDENT smile!', emoji: '😎' },
]

type RoundStatus = 'correct' | 'wrong' | 'current' | 'upcoming'
type CaptureState = 'ready' | 'capturing' | 'analyzing' | 'scored'

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Perfect!'
  if (score >= 70) return 'Great!'
  if (score >= 40) return 'Good try'
  return 'Keep practicing'
}

export default function ExpressionKingGame({
  totalRounds,
  timePerRound,
  pointsPerCorrect,
  onComplete,
}: ExpressionKingGameProps) {
  const challenges = useMemo(
    () => CHALLENGES.slice(0, totalRounds),
    [totalRounds]
  )

  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [captureState, setCaptureState] = useState<CaptureState>('ready')
  const [roundScore, setRoundScore] = useState(0)
  const [timerActive, setTimerActive] = useState(true)
  const [roundResults, setRoundResults] = useState<Array<{ correct: boolean; score: number }>>([])
  const [cameraError, setCameraError] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const challenge = challenges[currentRound]

  // Start camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 640 } },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCameraError(false)
      } catch {
        setCameraError(true)
      }
    }
    startCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const roundStatuses: RoundStatus[] = useMemo(() => {
    return challenges.map((_, i) => {
      if (i < roundResults.length) return roundResults[i].correct ? 'correct' : 'wrong'
      if (i === currentRound) return 'current'
      return 'upcoming'
    })
  }, [challenges, roundResults, currentRound])

  const handleCapture = useCallback(() => {
    if (captureState !== 'ready') return

    setCaptureState('capturing')
    setTimerActive(false)

    // Freeze frame onto canvas
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth || 480
      canvas.height = video.videoHeight || 640
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }
    }

    // Simulate AI analysis
    setCaptureState('analyzing')

    setTimeout(() => {
      // Generate a simulated AI score (40-100)
      const aiScore = Math.floor(Math.random() * 61) + 40
      setRoundScore(aiScore)
      setCaptureState('scored')

      const isPass = aiScore >= 70
      const points = isPass ? pointsPerCorrect : Math.floor(pointsPerCorrect * 0.5)
      setScore((prev) => prev + points)

      const newResults = [...roundResults, { correct: isPass, score: points }]
      setRoundResults(newResults)

      // Auto-advance after showing score
      setTimeout(() => {
        const nextRound = currentRound + 1
        if (nextRound >= totalRounds) {
          const passCount = newResults.filter((r) => r.correct).length
          // Show certificate if 5+ passes
          if (passCount >= 5) {
            setShowCertificate(true)
          }
          onComplete({
            score: score + points,
            correct: passCount,
            wrong: totalRounds - passCount,
            accuracy: Math.round((passCount / totalRounds) * 100),
            rounds: newResults,
          })
        } else {
          setCurrentRound(nextRound)
          setCaptureState('ready')
          setTimerActive(true)
          setRoundScore(0)
        }
      }, 2000)
    }, 1500)
  }, [captureState, pointsPerCorrect, roundResults, currentRound, totalRounds, score, onComplete])

  const handleTimeUp = useCallback(() => {
    if (captureState !== 'ready') return
    // Auto-capture on time up
    handleCapture()
  }, [captureState, handleCapture])

  const scoreRingColor = roundScore >= 70 ? '#22c55e' : roundScore >= 40 ? '#fbbf24' : '#ef4444'
  const circumference = 2 * Math.PI * 52

  return (
    <GameShell
      title="Expression King"
      currentRound={currentRound + 1}
      totalRounds={totalRounds}
      score={score}
      timeLimit={timePerRound}
      timerActive={timerActive}
      onTimeUp={handleTimeUp}
      roundStatuses={roundStatuses}
    >
      {/* Challenge prompt */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1 text-center">
          Challenge
        </p>
        <p className="text-base font-medium text-text-primary text-center leading-relaxed">
          &ldquo;{challenge.prompt}&rdquo;
        </p>
      </div>

      {/* Camera viewfinder */}
      <div className="flex-1 flex items-center justify-center px-4 py-3">
        <div className="relative w-full max-w-[300px] aspect-[3/4] rounded-2xl overflow-hidden bg-bg-inset border-2 border-black/10 shadow-card">
          {cameraError ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <Camera size={32} className="text-text-tertiary" />
              <p className="text-sm text-text-secondary text-center px-4">
                Camera access required. Please allow camera permissions.
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className={`w-full h-full object-cover scale-x-[-1] ${captureState !== 'ready' ? 'hidden' : ''}`}
                autoPlay
                muted
                playsInline
                aria-label="Camera viewfinder - show your expression"
              />
              <canvas
                ref={canvasRef}
                className={`w-full h-full object-cover scale-x-[-1] ${captureState === 'ready' ? 'hidden' : ''}`}
              />
            </>
          )}

          {/* Corner guides */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent-400/60 rounded-tl-md pointer-events-none" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent-400/60 rounded-tr-md pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent-400/60 rounded-bl-md pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent-400/60 rounded-br-md pointer-events-none" />

          {/* Recording indicator */}
          {captureState === 'capturing' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-error/80 rounded-pill px-2.5 py-1">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-medium text-white">REC</span>
            </div>
          )}

          {/* Analyzing overlay */}
          {captureState === 'analyzing' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-2xl">
              <div className="w-12 h-12 border-[3px] border-accent-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-text-secondary">Analyzing your expression...</p>
            </div>
          )}

          {/* Score overlay */}
          {captureState === 'scored' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-2xl animate-fade-in">
              {/* Score ring */}
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={scoreRingColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - roundScore / 100)}
                    className="transition-all duration-700 ease-smooth"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-text-primary font-mono">
                    {roundScore}
                  </span>
                </div>
              </div>

              <p className="text-sm font-medium text-text-secondary mt-4">
                {getScoreLabel(roundScore)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Capture button */}
      <div className="flex justify-center pb-4">
        <button
          onClick={handleCapture}
          disabled={captureState !== 'ready' || cameraError}
          className={`
            relative w-16 h-16 rounded-full
            bg-error border-4 border-black/15
            hover:bg-error/80 hover:scale-105
            active:scale-95
            transition-all duration-150
            flex items-center justify-center
            disabled:opacity-40 disabled:cursor-not-allowed
            ${captureState === 'capturing' ? 'bg-error animate-pulse' : ''}
          `}
          aria-label="Capture expression"
        >
          <div className="w-12 h-12 rounded-full bg-error/80 border-2 border-black/20" />
        </button>
      </div>
    </GameShell>
  )
}
