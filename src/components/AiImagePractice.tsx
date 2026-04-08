'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, RotateCcw, CheckCircle, XCircle, ArrowLeft, Star } from 'lucide-react'
import Link from 'next/link'

interface AiImagePracticeProps {
  clipId: string
  imageUrl: string
  title: string
  skillCategory: string
  annotation: string
}

type Phase = 'observe' | 'capture' | 'scoring' | 'result'

export function AiImagePractice({ clipId, imageUrl, title, skillCategory, annotation }: AiImagePracticeProps) {
  const [phase, setPhase] = useState<Phase>('observe')
  const [score, setScore] = useState(0)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Hot-fix: ensure camera stops on unmount (stops tracks, clears srcObject, nulls ref)
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setPhase('capture')
    } catch (err) {
      alert('Camera access is required for this practice. Please allow camera access.')
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(dataUrl)

    // Stop camera
    streamRef.current?.getTracks().forEach(t => t.stop())

    // Simulate AI scoring
    setPhase('scoring')
    setTimeout(() => {
      const randomScore = Math.floor(Math.random() * 35) + 65 // 65-100
      setScore(randomScore)
      setAttempts(prev => prev + 1)
      setBestScore(prev => Math.max(prev, randomScore))
      setPhase('result')
    }, 2000)
  }, [])

  const retry = useCallback(() => {
    setCapturedImage(null)
    setScore(0)
    setPhase('observe')
  }, [])

  const skillLabel = skillCategory.replace(/-/g, ' ').replace(/_/g, ' ')

  return (
    <div className="min-h-screen bg-bg-base">
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/library/${clipId}`}
            className="w-9 h-9 rounded-full bg-bg-surface border border-black/8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Mimic Practice</h1>
            <p className="text-xs text-text-tertiary capitalize">{skillLabel}</p>
          </div>
          {attempts > 0 && (
            <div className="ml-auto text-right">
              <p className="text-xs text-text-tertiary">Best score</p>
              <p className="text-lg font-bold text-accent-500">{bestScore}</p>
            </div>
          )}
        </div>

        {/* OBSERVE PHASE */}
        {phase === 'observe' && (
          <div className="space-y-6">
            {/* Reference image */}
            <div className="bg-bg-surface border border-black/8 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-black/6">
                <p className="text-xs font-semibold text-accent-500 uppercase tracking-wider">Reference Expression</p>
              </div>
              <img
                src={imageUrl}
                alt={title}
                className="w-full max-h-[400px] object-contain bg-black/5"
              />
            </div>

            {/* Instructions */}
            <div className="bg-bg-surface border border-black/8 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-text-primary mb-2">{title}</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{annotation}</p>
            </div>

            {/* Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm text-amber-800 font-medium mb-1">How to practice:</p>
              <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                <li>Study the reference expression above</li>
                <li>Tap "Start Camera" when ready</li>
                <li>Mimic the expression with your face</li>
                <li>Capture your expression for scoring</li>
                <li>Try again to beat your score!</li>
              </ol>
            </div>

            <button
              onClick={startCamera}
              className="w-full bg-accent-400 text-text-inverse rounded-2xl py-4 text-base font-semibold hover:bg-accent-500 transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              Start Camera
            </button>
          </div>
        )}

        {/* CAPTURE PHASE */}
        {phase === 'capture' && (
          <div className="space-y-4">
            {/* Side by side: reference + camera */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-surface border border-black/8 rounded-xl overflow-hidden">
                <p className="text-[10px] font-semibold text-center py-1.5 text-accent-500 uppercase tracking-wider bg-accent-400/10">Reference</p>
                <img src={imageUrl} alt="Reference" className="w-full aspect-square object-cover" />
              </div>
              <div className="bg-bg-surface border border-black/8 rounded-xl overflow-hidden">
                <p className="text-[10px] font-semibold text-center py-1.5 text-emerald-600 uppercase tracking-wider bg-emerald-50">Your Face</p>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-square object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </div>
            </div>

            <p className="text-sm text-text-secondary text-center">
              Match the reference expression, then tap Capture
            </p>

            <button
              onClick={capturePhoto}
              className="w-full bg-red-500 text-white rounded-2xl py-4 text-base font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              Capture Expression
            </button>
          </div>
        )}

        {/* SCORING PHASE */}
        {phase === 'scoring' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-accent-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-lg font-semibold text-text-primary">Analyzing your expression...</p>
            <p className="text-sm text-text-tertiary mt-1">Comparing with reference</p>
          </div>
        )}

        {/* RESULT PHASE */}
        {phase === 'result' && (
          <div className="space-y-6">
            {/* Score display */}
            <div className="bg-bg-surface border border-black/8 rounded-2xl p-6 text-center">
              {score >= 80 ? (
                <CheckCircle size={56} className="mx-auto text-emerald-500 mb-3" />
              ) : (
                <Star size={56} className="mx-auto text-amber-500 mb-3" />
              )}
              <p className="text-5xl font-bold text-text-primary">{score}</p>
              <p className="text-sm text-text-tertiary mt-1">out of 100</p>
              <p className="text-lg font-semibold mt-2" style={{ color: score >= 85 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444' }}>
                {score >= 85 ? 'Excellent match!' : score >= 70 ? 'Good effort!' : 'Keep practicing!'}
              </p>
              <p className="text-xs text-text-tertiary mt-2">
                Attempt #{attempts} · Best: {bestScore}
              </p>
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-surface border border-black/8 rounded-xl overflow-hidden">
                <p className="text-[10px] font-semibold text-center py-1.5 text-accent-500 uppercase tracking-wider bg-accent-400/10">Reference</p>
                <img src={imageUrl} alt="Reference" className="w-full aspect-square object-cover" />
              </div>
              <div className="bg-bg-surface border border-black/8 rounded-xl overflow-hidden">
                <p className="text-[10px] font-semibold text-center py-1.5 text-emerald-600 uppercase tracking-wider bg-emerald-50">Your Capture</p>
                {capturedImage && (
                  <img src={capturedImage} alt="Your capture" className="w-full aspect-square object-cover" style={{ transform: 'scaleX(-1)' }} />
                )}
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-bg-surface border border-black/8 rounded-2xl p-4">
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Tips to improve</p>
              <ul className="text-sm text-text-secondary space-y-1.5">
                {score < 85 && <li>• Pay close attention to the eyebrow position in the reference</li>}
                {score < 80 && <li>• Try to match the mouth shape more precisely</li>}
                {score < 75 && <li>• Notice the head tilt angle in the reference image</li>}
                <li>• Practice in front of a mirror to build muscle memory</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={retry}
                className="flex-1 bg-bg-surface border border-black/8 text-text-primary rounded-2xl py-3.5 font-semibold hover:bg-bg-overlay transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Try Again
              </button>
              <Link
                href={`/library/${clipId}`}
                className="flex-1 bg-accent-400 text-text-inverse rounded-2xl py-3.5 font-semibold hover:bg-accent-500 transition-colors text-center"
              >
                Done
              </Link>
            </div>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </main>
    </div>
  )
}
