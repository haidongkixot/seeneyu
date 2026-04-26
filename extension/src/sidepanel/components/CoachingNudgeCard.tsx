import type { CoachingNudge } from '../../lib/coaching-rules'

const TONE_PALETTE: Record<CoachingNudge['tone'], { bg: string; border: string; accent: string }> = {
  reset: { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.5)', accent: '#fbbf24' },
  encourage: { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.5)', accent: '#34d399' },
  recover: { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.5)', accent: '#a5b4fc' },
}

interface Props {
  nudge: CoachingNudge
  onDismiss: () => void
}

export function CoachingNudgeCard({ nudge, onDismiss }: Props) {
  const palette = TONE_PALETTE[nudge.tone]
  return (
    <div
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 10,
        padding: 14,
        position: 'relative',
        animation: 'mirror-pop 220ms ease-out',
      }}
    >
      <button
        aria-label="Dismiss"
        onClick={onDismiss}
        style={{
          position: 'absolute',
          right: 8,
          top: 8,
          background: 'transparent',
          border: 0,
          color: '#6b7280',
          cursor: 'pointer',
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
      <div style={{ fontSize: 11, color: palette.accent, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        Coach Ney
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: '#f9fafb' }}>{nudge.headline}</div>

      <Row label="Act" body={nudge.act} accent={palette.accent} />
      <Row label="Say" body={nudge.say} accent={palette.accent} />
      <Row label="How" body={nudge.how} accent={palette.accent} />
    </div>
  )
}

function Row({ label, body, accent }: { label: string; body: string; accent: string }) {
  return (
    <div style={{ marginTop: 8, display: 'flex', gap: 8, fontSize: 12, color: '#cbd5e1' }}>
      <div style={{ minWidth: 28, color: accent, fontWeight: 700, letterSpacing: 0.3 }}>{label}.</div>
      <div style={{ lineHeight: 1.45 }}>{body}</div>
    </div>
  )
}
