'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Circle, Square, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { startAnalysisCollection, type AnalysisCollector } from '@/lib/analysis-helpers'
import type { DetectAllFn } from '@/hooks/useMediaPipe'
import type { AnalysisSnapshot } from '@/lib/mediapipe-types'

type RecordState = 'idle' | 'ready' | 'countdown' | 'recording' | 'recorded'

interface PracticeRecorderProps {
  stepNumber: number
  onComplete: (blob: Blob, frames: Blob[], snapshots?: AnalysisSnapshot[]) => void
  /** MediaPipe detect function — if provided, collects analysis instead of JPEG frames */
  detectAll?: DetectAllFn
}

function captureFrame(videoEl: HTMLVideoElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 240
    const ctx = canvas.getContext('2d')
    if (!ctx) return resolve(null)
    ctx.translate(320, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(videoEl, 0, 0, 320, 240)
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.75)
  })
}

const MAX_SECS = 30
const RING_R = 30
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R

export function PracticeRecorder({ stepNumber, onComplete, detectAll }: PracticeRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const framesRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hardStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const collectorRef = useRef<AnalysisCollector | null>(null)

  const [state, setState] = useState<RecordState>('idle')
  const [countdown, setCountdown] = useState(3)
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECS)
  const [error, setError] = useState('')

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (frameTimerRef.current) clearInterval(frameTimerRef.current)
      if (hardStopRef.current) clearTimeout(hardStopRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
      }
      setState('ready')
    } catch {
      setError('Camera access denied')
    }
  }, [])

  const stopRecording = useCallback(async () => {
    if (hardStopRef.current) clearTimeout(hardStopRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    if (frameTimerRef.current) clearInterval(frameTimerRef.current)
    // Stop MediaPipe analysis collection
    collectorRef.current?.stop()
    // Capture final frame (legacy path)
    if (!detectAll && videoRef.current && framesRef.current.length < 4) {
      const frame = await captureFrame(videoRef.current)
      if (frame) framesRef.current.push(frame)
    }
    mediaRecorderRef.current?.stop()
  }, [detectAll])

  const startRecording = useCallback(() => {
    if (!streamRef.current) return
    chunksRef.current = []
    framesRef.current = []

    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp9,opus' })
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const snapshots = collectorRef.current?.stop()
      onComplete(blob, framesRef.current, snapshots)
      setState('recorded')
    }
    mr.start(1000)
    mediaRecorderRef.current = mr

    // Start MediaPipe analysis if available (every 500ms for 30s = ~60 snapshots)
    if (detectAll && videoRef.current) {
      collectorRef.current = startAnalysisCollection(videoRef.current, detectAll, 500)
    }

    const startMs = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000)
      const left = Math.max(0, MAX_SECS - elapsed)
      setSecondsLeft(left)
      if (left === 0) stopRecording()
    }, 200)

    // Legacy frame capture (only when MediaPipe not available)
    if (!detectAll) {
      setTimeout(async () => {
        if (videoRef.current && framesRef.current.length === 0) {
          const frame = await captureFrame(videoRef.current)
          if (frame) framesRef.current.unshift(frame)
        }
      }, 1500)

      frameTimerRef.current = setInterval(async () => {
        if (!videoRef.current || framesRef.current.length >= 3) return
        const frame = await captureFrame(videoRef.current)
        if (frame) framesRef.current.push(frame)
      }, 10000)
    }

    // Hard stop at MAX_SECS
    hardStopRef.current = setTimeout(stopRecording, MAX_SECS * 1000)

    setSecondsLeft(MAX_SECS)
    setState('recording')
  }, [onComplete, stopRecording])

  const beginCountdown = useCallback(() => {
    setState('countdown')
    setCountdown(3)
    let n = 3
    const id = setInterval(() => {
      n--
      if (n <= 0) { clearInterval(id); startRecording() }
      else setCountdown(n)
    }, 800)
  }, [startRecording])

  const discard = useCallback(() => {
    framesRef.current = []
    chunksRef.current = []
    setSecondsLeft(MAX_SECS)
    setState('ready')
  }, [])

  // Ring color based on remaining time
  const ringColor = secondsLeft > 10 ? '#fbbf24' : secondsLeft > 5 ? '#f59e0b' : '#ef4444'
  const dashOffset = RING_CIRCUMFERENCE - (secondsLeft / MAX_SECS) * RING_CIRCUMFERENCE

  return (
    <div className="flex flex-col gap-3">
      {/* Webcam */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
        {state === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-inset">
            <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center text-text-tertiary">
              <Circle size={24} strokeWidth={1.5} />
            </div>
            <p className="text-sm text-text-tertiary text-center px-4">Camera will start when you're ready</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={cn('w-full h-full object-cover scale-x-[-1]', state === 'idle' ? 'hidden' : 'block')}
        />

        {/* 3-2-1 overlay */}
        {state === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span
              key={countdown}
              className="text-8xl font-bold text-accent-400"
              style={{ textShadow: '0 0 48px rgba(251,191,36,0.6)', animation: 'float 0.8s ease-out' }}
            >
              {countdown}
            </span>
          </div>
        )}

        {/* 30s countdown ring */}
        {state === 'recording' && (
          <div className="absolute bottom-3 right-3 z-raised pointer-events-none">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r={RING_R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
              <circle
                cx="36" cy="36" r={RING_R}
                fill="none"
                stroke={ringColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s' }}
                className={secondsLeft <= 5 ? 'animate-pulse' : ''}
              />
              <text x="36" y="40" textAnchor="middle" fill="white" fontSize="14" fontFamily="monospace" fontWeight="600">
                {secondsLeft}
              </text>
            </svg>
          </div>
        )}

        {/* REC badge */}
        {state === 'recording' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 rounded-pill px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
            <span className="text-xs font-mono text-white">REC</span>
          </div>
        )}

        {state === 'recorded' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <p className="text-sm text-white font-semibold">Recording saved</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-inset">
            <p className="text-sm text-error text-center px-4">{error}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {state === 'idle' && (
          <button
            onClick={startCamera}
            className="flex-1 bg-accent-400 text-text-inverse rounded-pill py-3 text-sm font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150 flex items-center justify-center gap-2"
          >
            <Circle size={14} strokeWidth={2} />
            Start Recording
          </button>
        )}
        {state === 'ready' && (
          <button
            onClick={beginCountdown}
            className="flex-1 bg-accent-400 text-text-inverse rounded-pill py-3 text-sm font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150 flex items-center justify-center gap-2"
          >
            <span className="w-3 h-3 rounded-full bg-error" />
            Start Recording
          </button>
        )}
        {state === 'countdown' && (
          <div className="flex-1 flex items-center justify-center gap-2 py-3 text-text-secondary text-sm">
            <span className="text-accent-400 font-semibold">Get ready…</span>
          </div>
        )}
        {state === 'recording' && (
          <>
            <button
              onClick={stopRecording}
              className="flex-1 border border-black/10 text-text-primary rounded-xl py-3 text-sm hover:border-black/20 hover:bg-bg-overlay transition-all duration-150 flex items-center justify-center gap-2"
            >
              <Square size={14} strokeWidth={2} />
              Stop & Save
            </button>
            <button
              onClick={() => { stopRecording(); discard() }}
              className="border border-error/30 text-error rounded-xl py-3 px-4 text-sm hover:bg-error/10 transition-all duration-150"
            >
              <RotateCcw size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
