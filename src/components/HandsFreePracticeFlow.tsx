'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Pause, Play, X, Volume2, Camera, Square, LogOut } from 'lucide-react'
import { useMediaPipe } from '@/hooks/useMediaPipe'
import { usePracticeAssistant } from '@/hooks/usePracticeAssistant'
import { startAnalysisCollection } from '@/lib/analysis-helpers'
import type { AnalysisSnapshot } from '@/lib/mediapipe-types'

interface PracticeStep {
  id: string
  stepNumber: number
  skillFocus: string
  instruction: string
  tip: string | null
  targetDurationSec: number
  voiceUrl: string | null
  demoImageUrl: string | null
}

interface MicroFeedback {
  verdict: 'pass' | 'needs-work'
  headline: string
  detail: string
  score?: number
}

interface Props {
  clipId: string
  steps: PracticeStep[]
  skillCategory: string
  onComplete?: () => void
}

type Phase = 'preparing' | 'reading' | 'countdown' | 'recording' | 'processing' | 'result' | 'paused'

export default function HandsFreePracticeFlow({ clipId, steps, skillCategory, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('preparing')
  const [countdown, setCountdown] = useState(3)
  const [elapsed, setElapsed] = useState(0)
  const [feedback, setFeedback] = useState<MicroFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const collectorRef = useRef<ReturnType<typeof startAnalysisCollection> | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [cameraReady, setCameraReady] = useState(false)

  const { isReady, detectAll } = useMediaPipe()
  const { stopAllSounds, speakText, playAudio, playCountdown, announceResult } = usePracticeAssistant()
  const step = steps[currentStep]

  // ── Camera ──────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      setCameraReady(false)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        // Wait for video to actually be playing (avoids frozen first frames)
        await new Promise<void>((resolve) => {
          const v = videoRef.current!
          v.onloadeddata = () => resolve()
          v.play().catch(() => resolve())
        })
        // Extra delay to let camera warm up and MediaPipe init
        await new Promise((r) => setTimeout(r, 500))
        setCameraReady(true)
      }
    } catch {
      setError('Camera access denied. Please allow camera and microphone.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  // ── Recording ───────────────────────────────────────────────────

  const startRecording = useCallback(() => {
    if (!streamRef.current) return
    chunksRef.current = []
    const mr = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus',
    })
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.start(1000)
    recorderRef.current = mr

    // Start MediaPipe analysis
    if (isReady && videoRef.current) {
      collectorRef.current = startAnalysisCollection(videoRef.current, detectAll, 500)
    }
  }, [isReady, detectAll])

  const stopRecording = useCallback((): { blob: Blob; snapshots: AnalysisSnapshot[] } => {
    recorderRef.current?.stop()
    const snapshots = collectorRef.current?.stop() ?? []
    collectorRef.current = null
    const blob = new Blob(chunksRef.current, { type: 'video/webm' })
    return { blob, snapshots }
  }, [])

  // ── Submit ──────────────────────────────────────────────────────

  const submitRecording = useCallback(async (blob: Blob, snapshots: AnalysisSnapshot[]) => {
    const formData = new FormData()
    formData.append('recording', blob, 'recording.webm')
    formData.append('clipId', clipId)
    formData.append('stepNumber', String(step.stepNumber))
    formData.append('skillFocus', step.skillFocus)
    formData.append('instruction', step.instruction)
    formData.append('skillCategory', skillCategory)
    if (snapshots.length > 0) {
      formData.append('analysisData', JSON.stringify({ snapshots }))
    }

    const res = await fetch('/api/micro-sessions', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Submission failed')
    return res.json()
  }, [clipId, step, skillCategory])

  // ── Phase machine ───────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'preparing') {
      startCamera().then(() => {
        // Camera is now ready (setCameraReady(true) already called)
        setPhase('reading')
      })
    }

    if (phase === 'reading' && step) {
      const readInstruction = async () => {
        if (step.voiceUrl) {
          await playAudio(step.voiceUrl)
        } else {
          await speakText(step.instruction)
        }
        setPhase('countdown')
      }
      readInstruction()
    }

    if (phase === 'countdown') {
      setCountdown(3)
      const countVoice = async () => {
        for (let i = 3; i >= 1; i--) {
          setCountdown(i)
          await speakText(String(i))
          await new Promise((r) => setTimeout(r, 300))
        }
        await speakText('Go!')
        setPhase('recording')
      }
      countVoice()
    }

    if (phase === 'recording') {
      startRecording()
      setElapsed(0)
      const dur = step?.targetDurationSec ?? 20
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= dur) {
            clearInterval(timerRef.current!)
            // Auto-stop
            const { blob, snapshots } = stopRecording()
            setPhase('processing')
            submitRecording(blob, snapshots)
              .then((data) => {
                setFeedback(data)
                setPhase('result')
              })
              .catch(() => {
                setError('Analysis failed. Try again.')
                setPhase('result')
              })
            return dur
          }
          return prev + 1
        })
      }, 1000)

      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }

    if (phase === 'result' && feedback) {
      const announce = async () => {
        const score = feedback.score ?? (feedback.verdict === 'pass' ? 80 : 45)
        await announceResult(score, feedback.headline)
        // Auto-advance after 3 seconds
        setTimeout(() => {
          if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1)
            setFeedback(null)
            setPhase('reading')
          } else {
            onComplete?.()
          }
        }, 3000)
      }
      announce()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentStep])

  // Cleanup on unmount — stop EVERYTHING
  useEffect(() => {
    return () => {
      stopAllSounds()
      stopCamera()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [stopCamera, stopAllSounds])

  function handlePause() {
    if (phase === 'recording') {
      recorderRef.current?.pause()
      if (timerRef.current) clearInterval(timerRef.current)
      setPhase('paused')
    }
  }

  function handleResume() {
    if (phase === 'paused') {
      recorderRef.current?.resume()
      setPhase('recording')
    }
  }

  function handleStopEarly() {
    if (phase !== 'recording') return
    if (timerRef.current) clearInterval(timerRef.current)
    const { blob, snapshots } = stopRecording()
    setPhase('processing')
    submitRecording(blob, snapshots)
      .then((data) => { setFeedback(data); setPhase('result') })
      .catch(() => { setError('Analysis failed'); setPhase('result') })
  }

  function handlePreviousStep() {
    if (currentStep <= 0) return
    stopAllSounds()
    if (timerRef.current) clearInterval(timerRef.current)
    try { recorderRef.current?.stop() } catch { /* ignore */ }
    collectorRef.current?.stop()
    setFeedback(null)
    setCurrentStep((prev) => prev - 1)
    setPhase('reading')
  }

  function handleExit() {
    stopAllSounds()
    if (timerRef.current) clearInterval(timerRef.current)
    try { recorderRef.current?.stop() } catch { /* ignore */ }
    collectorRef.current?.stop()
    stopCamera()
    onComplete?.()
  }

  if (!step) return null

  const dur = step.targetDurationSec

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Camera feed */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover mirror"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
        />

        {/* Top controls — always visible over camera */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <LogOut size={16} /> Exit
            </button>
            {currentStep > 0 && phase !== 'recording' && (
              <button
                onClick={handlePreviousStep}
                className="flex items-center gap-1 text-white/60 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                ← Prev Step
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white/60 text-xs">Step {currentStep + 1}/{steps.length}</span>
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < currentStep ? 'bg-emerald-400' : i === currentStep ? 'bg-accent-400' : 'bg-white/30'}`} />
              ))}
            </div>
          </div>

          {phase === 'recording' ? (
            <button
              onClick={handleStopEarly}
              className="flex items-center gap-1.5 text-white bg-red-500/80 hover:bg-red-500 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Square size={14} fill="white" /> Stop
            </button>
          ) : phase === 'paused' ? (
            <button
              onClick={handleResume}
              className="flex items-center gap-1.5 text-white bg-emerald-500/80 hover:bg-emerald-500 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Play size={14} /> Resume
            </button>
          ) : (
            <div className="w-20" />
          )}
        </div>

        {/* Center overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {phase === 'preparing' && (
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-6 text-center">
              <Loader2 size={32} className="text-accent-400 mx-auto mb-3 animate-spin" />
              <p className="text-white text-sm font-medium mb-1">Loading camera & analysis models...</p>
              <p className="text-white/50 text-xs">This may take a few seconds on first use</p>
            </div>
          )}

          {phase === 'reading' && (
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-6 text-center max-w-md">
              <Volume2 size={24} className="text-accent-400 mx-auto mb-2 animate-pulse" />
              <p className="text-white text-sm font-medium mb-1">Step {step.stepNumber}: {step.skillFocus}</p>
              <p className="text-white/70 text-xs">{step.instruction}</p>
            </div>
          )}

          {phase === 'countdown' && (
            <div className="text-8xl font-bold text-white drop-shadow-lg animate-pulse">
              {countdown}
            </div>
          )}

          {phase === 'recording' && (
            <>
              {/* Recording timer badge */}
              <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500/80 rounded-full px-4 py-2 pointer-events-none">
                <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-bold">REC {elapsed}s / {dur}s</span>
              </div>
              {/* Bottom controls: pause + stop */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 pointer-events-auto">
                <button
                  onClick={handlePause}
                  className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  title="Pause"
                >
                  <Pause size={20} className="text-white" />
                </button>
                <button
                  onClick={handleStopEarly}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg transition-colors"
                  title="Stop and submit"
                >
                  <Square size={24} className="text-white" fill="white" />
                </button>
              </div>
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                <div className="h-full bg-accent-400 transition-all" style={{ width: `${(elapsed / dur) * 100}%` }} />
              </div>
            </>
          )}

          {phase === 'processing' && (
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-6 text-center">
              <Loader2 size={32} className="text-accent-400 mx-auto mb-2 animate-spin" />
              <p className="text-white text-sm">Analyzing your performance...</p>
            </div>
          )}

          {phase === 'result' && feedback && (
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-6 text-center max-w-sm">
              <p className={`text-3xl font-bold mb-2 ${feedback.verdict === 'pass' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {feedback.score ?? (feedback.verdict === 'pass' ? 80 : 45)}
              </p>
              <p className="text-white text-sm font-medium">{feedback.headline}</p>
              <p className="text-white/50 text-xs mt-2">
                {currentStep < steps.length - 1 ? 'Moving to next step...' : 'Practice complete!'}
              </p>
            </div>
          )}

          {phase === 'paused' && (
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-6 text-center">
              <Pause size={32} className="text-white mx-auto mb-2" />
              <p className="text-white text-sm">Paused</p>
            </div>
          )}
        </div>
      </div>

      {/* No bottom bar — controls are on top of camera and center */}

      {/* Error */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-500/80 text-white text-xs rounded-lg px-3 py-2">{error}</div>
      )}
    </div>
  )
}
