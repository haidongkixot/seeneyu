'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Circle, Square, RotateCcw, ArrowRight, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/cn'

type RecordState = 'idle' | 'ready' | 'countdown' | 'recording' | 'recorded' | 'uploading' | 'error'

interface RecordClientProps {
  clipId: string
  skillCategory: string
  annotations: { note: string }[]
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

/** Capture a JPEG snapshot from the live camera feed via an offscreen canvas */
function captureFrame(videoEl: HTMLVideoElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 240
    const ctx = canvas.getContext('2d')
    if (!ctx) return resolve(null)
    // Mirror to match the CSS scale-x-[-1] applied to the preview
    ctx.translate(320, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(videoEl, 0, 0, 320, 240)
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.75)
  })
}

export function RecordClient({ clipId, skillCategory, annotations }: RecordClientProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const framesRef = useRef<Blob[]>([])          // captured frame snapshots
  const streamRef = useRef<MediaStream | null>(null)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [state, setState] = useState<RecordState>('idle')
  const [countdownVal, setCountdownVal] = useState(3)
  const [recordingMs, setRecordingMs] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string>('')

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
      setError('Camera access denied — check browser permissions')
      setState('error')
    }
  }, [])

  const beginCountdown = useCallback((onDone: () => void) => {
    setState('countdown')
    setCountdownVal(3)
    let n = 3
    const id = setInterval(() => {
      n--
      if (n <= 0) {
        clearInterval(id)
        onDone()
      } else {
        setCountdownVal(n)
      }
    }, 800)
  }, [])

  const startRecording = useCallback(() => {
    if (!streamRef.current) return
    chunksRef.current = []
    framesRef.current = []

    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp9,opus' })
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setRecordedBlob(blob)
      setState('recorded')
    }
    mr.start(1000)
    mediaRecorderRef.current = mr
    startTimeRef.current = Date.now()

    // Capture a frame every 5 seconds (max 4 frames) for GPT-4o Vision
    frameTimerRef.current = setInterval(async () => {
      if (!videoRef.current || framesRef.current.length >= 4) return
      const frame = await captureFrame(videoRef.current)
      if (frame) framesRef.current.push(frame)
    }, 5000)

    // Capture frame 1 immediately at 1.5s after start
    setTimeout(async () => {
      if (videoRef.current && framesRef.current.length === 0) {
        const frame = await captureFrame(videoRef.current)
        if (frame) framesRef.current.unshift(frame)
      }
    }, 1500)

    timerRef.current = setInterval(() => setRecordingMs(Date.now() - startTimeRef.current), 200)
    setState('recording')
  }, [])

  const stopRecording = useCallback(async () => {
    // Capture a final frame just before stopping
    if (videoRef.current && framesRef.current.length < 4) {
      const frame = await captureFrame(videoRef.current)
      if (frame) framesRef.current.push(frame)
    }
    if (frameTimerRef.current) clearInterval(frameTimerRef.current)
    mediaRecorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const discard = useCallback(() => {
    setRecordedBlob(null)
    framesRef.current = []
    setRecordingMs(0)
    setState('ready')
  }, [])

  const submit = useCallback(async () => {
    if (!recordedBlob) return
    setState('uploading')
    try {
      const formData = new FormData()
      formData.append('recording', recordedBlob, 'recording.webm')
      formData.append('clipId', clipId)
      // Attach captured frames for GPT-4o Vision
      framesRef.current.forEach((frame, i) => {
        formData.append(`frame_${i}`, frame, `frame_${i}.jpg`)
      })

      const res = await fetch('/api/sessions', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { sessionId } = await res.json()
      router.push(`/feedback/${sessionId}`)
    } catch {
      setError('Upload failed — please try again')
      setState('recorded')
    }
  }, [recordedBlob, clipId, router])

  const toggleCheck = (i: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <>
      {/* Webcam preview */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
        {state === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-inset">
            <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center text-text-tertiary">
              <Circle size={24} strokeWidth={1.5} />
            </div>
            <p className="text-sm text-text-tertiary text-center px-4">
              Camera will start when you&apos;re ready to record
            </p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={cn(
            'w-full h-full object-cover',
            'scale-x-[-1]',   // mirror
            state === 'idle' ? 'hidden' : 'block',
          )}
        />

        {/* 3-2-1 countdown overlay */}
        {state === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <span
              key={countdownVal}
              className="text-8xl font-bold text-accent-400"
              style={{ textShadow: '0 0 48px rgba(251,191,36,0.6)', animation: 'float 0.8s ease-out' }}
            >
              {countdownVal}
            </span>
          </div>
        )}

        {/* REC badge */}
        {state === 'recording' && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 rounded-pill px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
            <span className="text-xs font-mono text-white">{formatTime(recordingMs)}</span>
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-inset gap-2 px-4">
            <p className="text-sm text-error text-center">{error}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {state === 'idle' && (
          <button
            onClick={startCamera}
            className="flex-1 bg-accent-400 text-text-inverse rounded-pill py-3 text-base font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150 flex items-center justify-center gap-2"
          >
            <Circle size={16} strokeWidth={2} />
            Start Recording
          </button>
        )}

        {state === 'ready' && (
          <button
            onClick={() => beginCountdown(startRecording)}
            className="flex-1 bg-accent-400 text-text-inverse rounded-pill py-3 text-base font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150 flex items-center justify-center gap-2"
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
              className="flex-1 border border-white/10 text-text-primary rounded-xl py-3 text-base hover:border-white/20 hover:bg-bg-overlay transition-all duration-150 flex items-center justify-center gap-2"
            >
              <Square size={16} strokeWidth={2} />
              Stop & Save
            </button>
            <button
              onClick={() => { stopRecording(); discard() }}
              className="border border-error/30 text-error rounded-xl py-3 px-4 text-sm hover:bg-error/10 transition-all duration-150"
            >
              <RotateCcw size={16} />
            </button>
          </>
        )}

        {state === 'recorded' && (
          <>
            <button
              onClick={discard}
              className="border border-white/10 text-text-secondary rounded-xl py-3 px-4 text-sm hover:border-white/20 hover:bg-bg-overlay transition-all duration-150"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={submit}
              className="flex-1 bg-accent-400 text-text-inverse rounded-pill py-3 text-base font-semibold hover:bg-accent-500 hover:shadow-glow-sm transition-all duration-150 flex items-center justify-center gap-2"
            >
              Submit for AI Feedback
              <ArrowRight size={16} />
            </button>
          </>
        )}

        {state === 'uploading' && (
          <div className="flex-1 flex items-center justify-center gap-2 py-3 text-text-secondary text-sm">
            <div className="w-4 h-4 border-2 border-accent-400/30 border-t-accent-400 rounded-full animate-spin" />
            Uploading...
          </div>
        )}
      </div>

      {/* Observation checklist */}
      <div className="bg-bg-elevated rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
          What to focus on
        </p>
        {annotations.map((a, i) => (
          <button
            key={i}
            onClick={() => toggleCheck(i)}
            className="flex items-start gap-3 text-left group"
          >
            {checkedItems.has(i)
              ? <CheckSquare size={20} strokeWidth={1.5} className="text-accent-400 shrink-0 mt-0.5" />
              : <CheckSquare size={20} strokeWidth={1.5} className="text-text-tertiary shrink-0 mt-0.5 opacity-40" />
            }
            <p className={cn(
              'text-sm leading-relaxed transition-colors duration-150',
              checkedItems.has(i) ? 'text-accent-400' : 'text-text-primary group-hover:text-text-primary',
            )}>
              {a.note}
            </p>
          </button>
        ))}
      </div>
    </>
  )
}
