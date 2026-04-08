'use client'

/**
 * ArcadeHandsFreeFlow — voice-guided arcade challenge runner.
 *
 * Walks the user through every challenge in a bundle without requiring
 * any taps. Voice prompts (browser SpeechSynthesis) announce the title,
 * count down, signal the start, auto-stop after the recording window,
 * announce the score, and auto-advance to the next challenge.
 *
 * Phase machine: idle → preparing → reading → countdown → recording →
 *                processing → result → (next | exit)
 *
 * Reuses usePracticeAssistant for voice playback consistency with
 * HandsFreePracticeFlow (the library hands-free flow).
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Loader2, Volume2, VolumeX, Square, SkipForward } from 'lucide-react'
import { useMediaPipe } from '@/hooks/useMediaPipe'
import { usePracticeAssistant } from '@/hooks/usePracticeAssistant'
import { startAnalysisCollection, type AnalysisCollector } from '@/lib/analysis-helpers'
import type { GuidanceStep } from '@/components/GuidanceStepViewer'

interface ChallengeData {
  id: string
  type: 'facial' | 'gesture'
  title: string
  description: string
  context: string
  referenceImageUrl: string | null
  mediaUrl: string | null
  mediaType: string | null
  difficulty: string
  xpReward: number
  orderIndex: number
  isComplete: boolean
  isLocked: boolean
  bestScore: number | null
  guidanceSteps: GuidanceStep[] | null
}

interface ScoreResult {
  score: number
  breakdown: { expression_match: number; intensity: number; context_fit: number }
  feedbackLine: string
  xpEarned: number
}

interface Props {
  challenges: ChallengeData[]
  startIdx?: number
  onExit: () => void
  onComplete?: () => void
}

type Phase = 'preparing' | 'reading' | 'countdown' | 'recording' | 'processing' | 'result'

const RECORD_DURATION_SEC = 10

export default function ArcadeHandsFreeFlow({ challenges, startIdx = 0, onExit, onComplete }: Props) {
  const [activeIdx, setActiveIdx] = useState(startIdx)
  const [phase, setPhase] = useState<Phase>('preparing')
  const [countdown, setCountdown] = useState(3)
  const [elapsed, setElapsed] = useState(0)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const collectorRef = useRef<AnalysisCollector | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { isReady: mpReady, detectAll } = useMediaPipe()
  const { stopAllSounds, speakText, announceResult } = usePracticeAssistant()

  const challenge = challenges[activeIdx]
  const isLast = activeIdx >= challenges.length - 1

  // Mutable mute ref so the speak helper sees the latest value without re-triggering effects
  const mutedRef = useRef(muted)
  useEffect(() => { mutedRef.current = muted }, [muted])

  const speak = useCallback(
    async (text: string) => {
      if (mutedRef.current) return
      await speakText(text)
    },
    [speakText],
  )

  // ── Camera ──────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        await new Promise<void>((resolve) => {
          const v = videoRef.current!
          v.onloadeddata = () => resolve()
          v.play().catch(() => resolve())
        })
        await new Promise((r) => setTimeout(r, 400))
      }
    } catch {
      setError('Camera access denied. Please allow camera and try again.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    streamRef.current = null
  }, [])

  // ── Submission ───────────────────────────────────────────────────

  const submitAttempt = useCallback(
    async (snapshots: any[], peakSnapshot: any): Promise<ScoreResult | null> => {
      try {
        const res = await fetch('/api/arcade/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId: challenge.id, snapshots, peakSnapshot }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Scoring failed')
        if (typeof window !== 'undefined' && data.xpEarned > 0) {
          window.dispatchEvent(new CustomEvent('xp:awarded', { detail: { amount: data.xpEarned } }))
        }
        return data
      } catch (err: any) {
        setError(err.message || 'Failed to score this attempt.')
        return null
      }
    },
    [challenge?.id],
  )

  // ── Phase machine ───────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function runPhase() {
      if (!challenge) return

      if (phase === 'preparing') {
        await startCamera()
        if (cancelled) return
        setPhase('reading')
        return
      }

      if (phase === 'reading') {
        const intro = `Challenge ${activeIdx + 1} of ${challenges.length}. ${challenge.title}. ${challenge.description}`
        await speak(intro)
        if (cancelled) return
        setPhase('countdown')
        return
      }

      if (phase === 'countdown') {
        for (let i = 3; i >= 1; i--) {
          if (cancelled) return
          setCountdown(i)
          await speak(String(i))
          await new Promise((r) => setTimeout(r, 250))
        }
        if (cancelled) return
        await speak('Go!')
        if (cancelled) return
        setPhase('recording')
        return
      }

      if (phase === 'recording') {
        // Start MediaPipe collection
        if (mpReady && videoRef.current) {
          collectorRef.current = startAnalysisCollection(videoRef.current, detectAll, 1000)
        }
        setElapsed(0)
        timerRef.current = setInterval(() => {
          setElapsed((prev) => {
            const next = prev + 0.1
            if (next >= RECORD_DURATION_SEC) {
              if (timerRef.current) clearInterval(timerRef.current)
              // Auto-stop and submit
              const snapshots = collectorRef.current?.stop() ?? []
              const peakSnapshot = collectorRef.current?.getPeakSnapshot() ?? snapshots[0] ?? null
              collectorRef.current = null
              setPhase('processing')
              if (snapshots.length === 0 || !peakSnapshot) {
                setError('No analysis captured. Make sure your face is visible.')
                setScoreResult(null)
                setPhase('result')
                return RECORD_DURATION_SEC
              }
              submitAttempt(snapshots, peakSnapshot).then((result) => {
                setScoreResult(result)
                setPhase('result')
              })
              return RECORD_DURATION_SEC
            }
            return next
          })
        }, 100)
        return
      }

      if (phase === 'result') {
        if (scoreResult) {
          await announceResult(scoreResult.score, scoreResult.feedbackLine || 'Nice work.')
        } else if (error) {
          await speak(error)
        }
        if (cancelled) return
        // Auto-advance after 3 seconds
        await new Promise((r) => setTimeout(r, 3000))
        if (cancelled) return
        if (isLast) {
          await speak('Bundle complete. Great work!')
          if (cancelled) return
          stopCamera()
          onComplete?.()
          onExit()
        } else {
          setScoreResult(null)
          setError(null)
          setActiveIdx((prev) => prev + 1)
          setPhase('reading')
        }
      }
    }

    runPhase()
    return () => {
      cancelled = true
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeIdx])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllSounds()
      stopCamera()
      if (timerRef.current) clearInterval(timerRef.current)
      collectorRef.current?.stop()
    }
  }, [stopAllSounds, stopCamera])

  function handleSkip() {
    // Skip to next challenge without scoring
    stopAllSounds()
    if (timerRef.current) clearInterval(timerRef.current)
    collectorRef.current?.stop()
    collectorRef.current = null
    setScoreResult(null)
    setError(null)
    if (isLast) {
      stopCamera()
      onComplete?.()
      onExit()
    } else {
      setActiveIdx((prev) => prev + 1)
      setPhase('reading')
    }
  }

  function handleExit() {
    stopAllSounds()
    if (timerRef.current) clearInterval(timerRef.current)
    collectorRef.current?.stop()
    stopCamera()
    onExit()
  }

  function handleStopEarly() {
    if (phase !== 'recording') return
    if (timerRef.current) clearInterval(timerRef.current)
    const snapshots = collectorRef.current?.stop() ?? []
    const peakSnapshot = collectorRef.current?.getPeakSnapshot() ?? snapshots[0] ?? null
    collectorRef.current = null
    setPhase('processing')
    if (snapshots.length === 0 || !peakSnapshot) {
      setError('No analysis captured.')
      setScoreResult(null)
      setPhase('result')
      return
    }
    submitAttempt(snapshots, peakSnapshot).then((result) => {
      setScoreResult(result)
      setPhase('result')
    })
  }

  if (!challenge) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white">No challenges available.</p>
      </div>
    )
  }

  const recordProgress = phase === 'recording' ? (elapsed / RECORD_DURATION_SEC) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm">
        <button
          onClick={handleExit}
          className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Exit
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/70 tabular-nums">
            {activeIdx + 1} / {challenges.length}
          </span>
          <span className="px-2 py-0.5 rounded-pill bg-amber-400/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
            Hands-Free
          </span>
        </div>
        <button
          onClick={() => {
            const next = !muted
            setMuted(next)
            if (next) stopAllSounds()
          }}
          aria-label={muted ? 'Unmute voice' : 'Mute voice'}
          className="text-white/80 hover:text-white transition-colors"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Camera + Reference split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 p-2 lg:p-4 min-h-0">
        {/* Reference */}
        <div className="relative bg-black rounded-xl overflow-hidden flex flex-col items-center justify-center max-h-[45vh] lg:max-h-none">
          <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded bg-black/60 text-[10px] font-semibold text-white/80 uppercase tracking-wider">
            Reference
          </div>
          {challenge.mediaUrl || challenge.referenceImageUrl ? (
            challenge.mediaType === 'ai_video' ? (
              <video
                src={challenge.mediaUrl!}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={challenge.mediaUrl || challenge.referenceImageUrl!}
                alt={challenge.title}
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <div className="text-6xl">{challenge.type === 'facial' ? '😐' : '🧍'}</div>
          )}
          <div className="absolute bottom-3 left-3 right-3 z-10 px-3 py-2 rounded-lg bg-black/70 backdrop-blur-sm">
            <p className="text-sm font-bold text-white">{challenge.title}</p>
            <p className="text-xs text-white/70 mt-0.5 line-clamp-2">{challenge.description}</p>
          </div>
        </div>

        {/* Camera */}
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video lg:aspect-auto max-h-[45vh] lg:max-h-none">
          <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded bg-black/60 text-[10px] font-semibold text-white/80 uppercase tracking-wider">
            You
          </div>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {phase === 'recording' && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/90 text-white text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              REC {Math.max(0, RECORD_DURATION_SEC - elapsed).toFixed(1)}s
            </div>
          )}
          {/* Phase overlays */}
          {phase === 'preparing' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
              <Loader2 size={36} className="text-amber-400 animate-spin" />
              <p className="text-white text-sm">Starting camera...</p>
            </div>
          )}
          {phase === 'reading' && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
              <Volume2 size={32} className="text-amber-400 animate-pulse" />
              <p className="text-white text-base font-semibold">Listen to the prompt...</p>
            </div>
          )}
          {phase === 'countdown' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-[120px] font-extrabold leading-none animate-pulse tabular-nums">
                {countdown}
              </span>
            </div>
          )}
          {phase === 'processing' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
              <Loader2 size={36} className="text-amber-400 animate-spin" />
              <p className="text-white text-sm">Scoring your attempt...</p>
            </div>
          )}
          {phase === 'result' && scoreResult && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="text-6xl font-extrabold text-white tabular-nums">{scoreResult.score}</div>
              <div className="text-xs text-white/70 uppercase tracking-wider">Score</div>
              <div className="px-3 py-1 rounded-pill bg-amber-400/20 border border-amber-400/40 text-amber-300 text-sm font-bold">
                +{scoreResult.xpEarned} XP
              </div>
              {scoreResult.feedbackLine && (
                <p className="text-white/80 text-sm max-w-xs">&ldquo;{scoreResult.feedbackLine}&rdquo;</p>
              )}
              <p className="text-white/50 text-xs">Auto-advancing...</p>
            </div>
          )}
          {phase === 'result' && !scoreResult && error && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-red-400 text-base font-semibold">Couldn&apos;t score this attempt</p>
              <p className="text-white/70 text-sm max-w-xs">{error}</p>
              <p className="text-white/50 text-xs">Auto-advancing...</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom progress + actions */}
      <div className="px-4 py-3 bg-black/60 backdrop-blur-sm">
        {phase === 'recording' && (
          <div className="h-1 bg-white/10 rounded-pill overflow-hidden mb-3">
            <div
              className="h-full bg-amber-400 rounded-pill transition-all duration-100"
              style={{ width: `${recordProgress}%` }}
            />
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          {phase === 'recording' && (
            <button
              onClick={handleStopEarly}
              className="flex items-center gap-2 px-5 py-2 rounded-pill bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              <Square size={14} fill="currentColor" />
              Stop early
            </button>
          )}
          {(phase === 'reading' || phase === 'countdown' || phase === 'recording') && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-2 px-5 py-2 rounded-pill bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              <SkipForward size={14} />
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
