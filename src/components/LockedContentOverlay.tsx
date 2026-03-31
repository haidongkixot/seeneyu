'use client'

import { Lock, CheckCircle2 } from 'lucide-react'

interface LockedContentOverlayProps {
  title: string
  reason: string
  onUpgrade?: () => void
  previewBullets?: string[]
}

export function LockedContentOverlay({
  title,
  reason,
  onUpgrade,
  previewBullets,
}: LockedContentOverlayProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred background preview */}
      <div className="absolute inset-0 bg-bg-surface/80 backdrop-blur-md z-10" />

      {/* Lock UI */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 py-10 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-black/10 flex items-center justify-center shadow-sm">
          <Lock size={24} className="text-text-secondary" />
        </div>

        <div>
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-xs leading-relaxed">{reason}</p>
        </div>

        {previewBullets && previewBullets.length > 0 && (
          <ul className="space-y-2 text-left w-full max-w-xs">
            {previewBullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-accent-400/60 shrink-0 mt-0.5" />
                <span className="text-xs text-text-secondary">{b}</span>
              </li>
            ))}
          </ul>
        )}

        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="mt-2 px-6 py-2.5 rounded-pill bg-accent-400 text-text-inverse text-sm font-semibold hover:bg-accent-500 shadow-glow-sm transition-all duration-150"
          >
            Unlock with Upgrade
          </button>
        )}
      </div>
    </div>
  )
}
