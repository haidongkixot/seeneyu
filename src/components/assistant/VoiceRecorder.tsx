'use client'

import { Mic, Square } from 'lucide-react'
import { cn } from '@/lib/cn'

interface VoiceRecorderProps {
  isRecording: boolean
  recordingTime: number
  onStart: () => void
  onStop: () => void
  onCancel: () => void
  disabled?: boolean
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const MAX_SECONDS = 120

export function VoiceRecorder({
  isRecording,
  recordingTime,
  onStart,
  onStop,
  onCancel,
  disabled,
}: VoiceRecorderProps) {
  if (!isRecording) {
    return (
      <button
        onClick={onStart}
        disabled={disabled}
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200',
          disabled
            ? 'opacity-40 cursor-not-allowed bg-bg-overlay text-text-tertiary'
            : 'bg-bg-overlay text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
        )}
        aria-label="Start voice recording"
      >
        <Mic size={16} />
      </button>
    )
  }

  const remaining = MAX_SECONDS - recordingTime
  const isLow = remaining <= 5

  return (
    <div className="flex items-center gap-2 flex-1 px-2">
      {/* Cancel / red dot */}
      <button
        onClick={onCancel}
        className="flex-shrink-0 w-3 h-3 rounded-full bg-error animate-pulse"
        aria-label="Cancel recording"
      />

      {/* Waveform bars */}
      <div className="flex items-center gap-0.5 flex-1 h-8 px-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-accent-400"
            style={{
              animation: `waveform-bar 0.8s ease-in-out infinite`,
              animationDelay: `${i * 0.05}s`,
              height: '4px',
            }}
          />
        ))}
      </div>

      {/* Timer */}
      <span
        className={cn(
          'text-xs font-mono tabular-nums',
          isLow ? 'text-warning' : 'text-text-secondary'
        )}
      >
        {formatTime(recordingTime)} / {formatTime(MAX_SECONDS)}
      </span>

      {/* Stop button */}
      <button
        onClick={onStop}
        className="flex-shrink-0 w-9 h-9 rounded-full bg-error/20 text-error flex items-center justify-center hover:bg-error/30 transition-colors"
        aria-label="Stop recording and send"
      >
        <Square size={14} />
      </button>
    </div>
  )
}
