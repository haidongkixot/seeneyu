'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/NavBar'
import { ArrowLeft, ArrowRight, Lock, CheckCircle, Camera, RotateCcw, Star, Timer } from 'lucide-react'
import { useParams } from 'next/navigation'

interface ChallengeData {
  id: string
  type: 'facial' | 'gesture'
  title: string
  description: string
  context: string
  referenceImageUrl: string | null
  difficulty: string
  xpReward: number
  orderIndex: number
  isComplete: boolean
  isLocked: boolean
  bestScore: number | null
}

interface BundleDetail {
  id: string
  title: string
  description: string
  challenges: ChallengeData[]
  completedCount: number
}

type Screen = 'list' | 'challenge' | 'scoring' | 'result'

export default function BundlePage() {
  const params = useParams()
  const bundleId = params.bundleId as string

  const [bundle, setBundle] = useState<BundleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<Screen>('list')
  const [activeIdx, setActiveIdx] = useState(0)

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const [hasRecorded, setHasRecorded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Score state
  const [scoreResult, setScoreResult] = useState<{
    score: number
    breakdown: { expression_match: number; intensity: number; context_fit: number }
    feedbackLine: string
    xpEarned: number
  } | null>(null)

  const fetchBundle = useCallback(async () => {
    const res = await fetch(`/api/arcade/bundles/${bundleId}/challenges`)
    if (res.ok) {
      const data = await res.json()
      setBundle(data)
    }
    setLoading(false)
  }, [bundleId])

  useEffect(() => { fetchBundle() }, [fetchBundle])

  const activeChallenge = bundle?.challenges[activeIdx]

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      alert('Camera access denied. Please allow camera access to use the Arcade.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  function startRecording() {
    if (!streamRef.current) return
    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' })
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.start(100)
    recorderRef.current = recorder
    setIsRecording(true)
    setTimeLeft(10)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          stopRecording()
          return 0
        }
        return prev - 0.1
      })
    }, 100)
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    recorderRef.current?.stop()
    setIsRecording(false)
    setHasRecorded(true)
  }

  async function submitRecording() {
    if (!activeChallenge) return
    setScreen('scoring')

    // Capture a frame from the video
    const frameUrl = captureFrame()
    if (!frameUrl) {
      setScreen('challenge')
      alert('Could not capture frame. Please try again.')
      return
    }

    try {
      const res = await fetch('/api/arcade/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: activeChallenge.id, frameUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setScoreResult(data)
      setScreen('result')
      stopCamera()
    } catch (err: any) {
      alert(err.message || 'Failed to score. Please try again.')
      setScreen('challenge')
    }
  }

  function captureFrame(): string | null {
    const video = videoRef.current
    if (!video) return null
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.8)
  }

  function startChallenge(idx: number) {
    setActiveIdx(idx)
    setScreen('challenge')
    setIsRecording(false)
    setHasRecorded(false)
    setTimeLeft(10)
    setScoreResult(null)
    setTimeout(() => startCamera(), 100)
  }

  function retryChallenge() {
    setScreen('challenge')
    setIsRecording(false)
    setHasRecorded(false)
    setTimeLeft(10)
    setScoreResult(null)
    setTimeout(() => startCamera(), 100)
  }

  function nextChallenge() {
    fetchBundle() // refresh completion state
    if (bundle && activeIdx < bundle.challenges.length - 1) {
      startChallenge(activeIdx + 1)
    } else {
      setScreen('list')
      stopCamera()
    }
  }

  function exitChallenge() {
    stopCamera()
    setScreen('list')
    fetchBundle() // refresh
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-10">
          <div className="h-8 w-48 skeleton rounded-lg mb-4" />
          <div className="h-4 w-64 skeleton rounded-lg mb-8" />
          {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-xl mb-3" />)}
        </main>
      </div>
    )
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-bg-base">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-10 text-center py-20">
          <p className="text-text-tertiary">Bundle not found.</p>
          <Link href="/arcade" className="text-accent-400 text-sm mt-4 inline-block">Back to Arcade</Link>
        </main>
      </div>
    )
  }

  // ── Challenge Active Screen ────────────────
  if (screen === 'challenge' && activeChallenge) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/6">
          <button onClick={exitChallenge} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft size={16} />
            Exit
          </button>
          <span className="text-sm font-semibold text-text-primary">
            Challenge {activeChallenge.orderIndex} of {bundle.challenges.length}
          </span>
          {isRecording && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-error">
              <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
              REC
            </div>
          )}
          {!isRecording && <div className="w-12" />}
        </div>

        {/* Split screen */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 lg:p-6">
          {/* Left: Reference */}
          <div className="flex flex-col bg-bg-surface rounded-2xl border border-white/8 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/6">
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-widest">Reference</span>
            </div>
            <div className="flex-1 flex flex-col p-5">
              <div className="aspect-video rounded-xl bg-bg-elevated border border-white/8 flex items-center justify-center mb-4 text-4xl">
                {activeChallenge.type === 'facial' ? '\uD83D\uDE10' : '\uD83E\uDDCD'}
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">{activeChallenge.title}</h2>
              <p className="text-sm text-text-primary leading-relaxed mb-4">{activeChallenge.description}</p>
              {activeChallenge.context && (
                <div className="p-3 rounded-lg bg-bg-inset border border-white/6">
                  <p className="text-xs text-text-tertiary leading-relaxed italic">{activeChallenge.context}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Camera */}
          <div className="flex flex-col bg-bg-surface rounded-2xl border border-white/8 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-widest">You</span>
              {isRecording && (
                <div className={`flex items-center gap-1 text-sm font-bold tabular-nums ${timeLeft <= 3 ? 'text-error animate-pulse' : 'text-accent-400'}`}>
                  <Timer size={14} />
                  {timeLeft.toFixed(1)}s
                </div>
              )}
            </div>
            <div className="flex-1 relative bg-black rounded-b-2xl overflow-hidden min-h-[200px]">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {!isRecording && !hasRecorded && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <Camera size={40} className="text-text-tertiary" />
                  <p className="text-sm text-text-secondary">Camera ready</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Countdown bar */}
        {isRecording && (
          <div className="px-4 lg:px-6 pb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-tertiary">{timeLeft.toFixed(1)}s remaining</span>
              <span className="text-xs text-text-tertiary">10s max</span>
            </div>
            <div className="h-2 bg-white/8 rounded-pill overflow-hidden">
              <div
                className={`h-full rounded-pill transition-all duration-100 ${
                  timeLeft > 5 ? 'bg-accent-400' : timeLeft > 2 ? 'bg-warning' : 'bg-error'
                }`}
                style={{ width: `${(timeLeft / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4 px-4 py-4 pb-6">
          {!isRecording && !hasRecorded && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-8 py-3 rounded-pill bg-error text-white font-semibold text-base hover:bg-error/80 transition-colors duration-150 shadow-[0_0_20px_rgba(239,68,68,0.30)]"
            >
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              Start Recording
            </button>
          )}
          {isRecording && (
            <>
              <button
                onClick={stopRecording}
                className="px-6 py-3 rounded-pill border border-white/20 text-text-secondary hover:text-text-primary hover:border-white/30 text-sm font-medium transition-all duration-150"
              >
                Stop Early
              </button>
            </>
          )}
          {hasRecorded && !isRecording && (
            <button
              onClick={submitRecording}
              className="flex items-center gap-2 px-8 py-3 rounded-pill bg-accent-400 text-text-inverse font-semibold text-base hover:bg-accent-500 shadow-glow-sm transition-all duration-150"
            >
              Submit
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Scoring Screen ────────────────
  if (screen === 'scoring') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-400/30 border-t-accent-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Analyzing your performance...</p>
        </div>
      </div>
    )
  }

  // ── Score Result Screen ────────────────
  if (screen === 'result' && scoreResult) {
    const label = scoreResult.score >= 70 ? 'Great Performance!'
                : scoreResult.score >= 40 ? 'Good Effort!'
                : 'Keep Practicing!'

    const ringColor = scoreResult.score >= 70 ? '#22c55e'
                    : scoreResult.score >= 40 ? '#f59e0b'
                    : '#ef4444'

    const radius = 54
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (scoreResult.score / 100) * circumference
    const isLast = activeIdx >= bundle.challenges.length - 1

    return (
      <div className="min-h-screen bg-bg-base flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/6">
          <button onClick={exitChallenge} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft size={16} />
            Back
          </button>
          <span className="text-sm font-semibold text-text-primary">Result</span>
          <div className="w-12" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full gap-6">
          {/* Score ring */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <circle
                  cx="64" cy="64" r={radius}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{
                    transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: `drop-shadow(0 0 8px ${ringColor}60)`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-text-primary tabular-nums">{scoreResult.score}</span>
                <span className="text-xs text-text-tertiary">/100</span>
              </div>
            </div>
            <p className="text-lg font-bold text-text-primary">{label}</p>
          </div>

          {/* XP earned */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-pill bg-accent-400/15 border border-accent-400/30 animate-[pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
            <Star size={16} className="text-accent-400 fill-accent-400" />
            <span className="text-sm font-bold text-accent-400">+{scoreResult.xpEarned} XP earned</span>
          </div>

          {/* Breakdown */}
          <div className="w-full space-y-3 border-t border-white/6 pt-6">
            <BreakdownBar label="Expression Match" value={scoreResult.breakdown.expression_match} />
            <BreakdownBar label="Intensity" value={scoreResult.breakdown.intensity} />
            <BreakdownBar label="Context Fit" value={scoreResult.breakdown.context_fit} />
          </div>

          {/* Feedback */}
          {scoreResult.feedbackLine && (
            <div className="w-full p-4 rounded-xl bg-bg-elevated border border-white/8 text-sm text-text-secondary leading-relaxed">
              &ldquo;{scoreResult.feedbackLine}&rdquo;
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={retryChallenge}
              className="flex items-center gap-2 px-6 py-3 rounded-pill border border-white/15 text-text-secondary hover:border-white/25 hover:text-text-primary text-sm font-semibold transition-all duration-150"
            >
              <RotateCcw size={16} />
              Retry
            </button>
            <button
              onClick={nextChallenge}
              className="flex items-center gap-2 px-8 py-3 rounded-pill bg-accent-400 text-text-inverse font-semibold text-base hover:bg-accent-500 shadow-glow-sm transition-all duration-150"
            >
              {isLast ? 'Complete Bundle \uD83C\uDFC6' : 'Next Challenge'}
              {!isLast && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Challenge List (default screen) ────────────────
  const completedCount = bundle.challenges.filter(c => c.isComplete).length
  const totalCount = bundle.challenges.length

  return (
    <div className="min-h-screen bg-bg-base">
      <NavBar />
      <main className="max-w-3xl mx-auto px-4 lg:px-8 pt-10 pb-20">
        {/* Header */}
        <div className="mb-8">
          <Link href="/arcade" className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4">
            <ArrowLeft size={16} />
            Back to Arcade
          </Link>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{bundle.title}</h1>
              <p className="text-sm text-text-secondary mt-1">{bundle.description}</p>
            </div>
            <span className="text-sm text-text-tertiary whitespace-nowrap ml-4 mt-1">
              {completedCount}/{totalCount} complete
            </span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-pill overflow-hidden">
            <div
              className="h-full bg-accent-400 rounded-pill transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Challenge list */}
        <div className="flex flex-col gap-3">
          {bundle.challenges.map((challenge, i) => (
            <div
              key={challenge.id}
              onClick={() => !challenge.isLocked && startChallenge(i)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                challenge.isLocked
                  ? 'border-white/6 bg-bg-surface/50 opacity-50 cursor-not-allowed'
                  : challenge.isComplete
                  ? 'border-success/20 bg-success/5 cursor-pointer'
                  : 'border-white/8 bg-bg-surface hover:border-accent-400/20 hover:bg-bg-elevated cursor-pointer'
              }`}
            >
              {/* Status icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-white/10">
                {challenge.isLocked ? (
                  <Lock size={14} className="text-text-tertiary" />
                ) : challenge.isComplete ? (
                  <CheckCircle size={16} className="text-success" />
                ) : (
                  <span className="text-text-secondary">{challenge.orderIndex}</span>
                )}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-tight ${challenge.isLocked ? 'text-text-tertiary' : 'text-text-primary'}`}>
                  {challenge.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                    challenge.type === 'facial'
                      ? 'bg-violet-500/15 text-violet-300'
                      : 'bg-cyan-500/15 text-cyan-300'
                  }`}>
                    {challenge.type === 'facial' ? 'Facial' : 'Gesture'}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {challenge.isComplete ? 'Complete' : challenge.isLocked ? 'Locked' : 'Not started'}
                  </span>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-semibold text-accent-400">+{challenge.xpReward} XP</span>
                {challenge.isComplete && challenge.bestScore !== null && (
                  <ScoreBadge score={challenge.bestScore} />
                )}
                {!challenge.isLocked && !challenge.isComplete && (
                  <ArrowRight size={16} className="text-accent-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-success border-success/30 bg-success/10'
              : score >= 40 ? 'text-warning border-warning/30 bg-warning/10'
              : 'text-error border-error/30 bg-error/10'
  return (
    <span className={`inline-flex items-center font-bold rounded-pill border text-xs px-2 py-0.5 ${color}`}>
      {score}
    </span>
  )
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-semibold text-text-primary tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-pill overflow-hidden">
        <div
          className="h-full bg-accent-400/70 rounded-pill transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
