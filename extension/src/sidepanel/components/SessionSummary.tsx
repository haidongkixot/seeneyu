export interface CoachSummaryPayload {
  sessionId: string
  durationSeconds: number
  averages: {
    eyeContactPct: number | null
    posture: number | null
    pace: number | null
  }
  coach: {
    headline: string
    summary: string
    whatWorked: string[]
    whatToImprove: string[]
    nextSteps: string[]
  } | null
  xpAwarded?: number
  webUrl?: string
}

interface Props {
  data: CoachSummaryPayload
  onDone: () => void
}

export function SessionSummary({ data, onDone }: Props) {
  const mins = Math.floor(data.durationSeconds / 60)
  const secs = data.durationSeconds % 60

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <header>
        <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase' }}>
          Session complete
        </div>
        <h2 style={{ fontSize: 17, margin: '4px 0', color: '#f9fafb' }}>
          {data.coach?.headline ?? 'Session saved'}
        </h2>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          {mins}m {secs}s
          {typeof data.xpAwarded === 'number' && data.xpAwarded > 0 && (
            <>
              {' · '}<span style={{ color: '#fbbf24' }}>+{data.xpAwarded} XP</span>
            </>
          )}
        </div>
      </header>

      <ScoreRow label="Eye contact" value={data.averages.eyeContactPct} suffix="%" />
      <ScoreRow label="Posture" value={data.averages.posture} suffix="/100" />
      <ScoreRow label="Pace" value={data.averages.pace} suffix=" wpm" />

      {data.coach ? (
        <>
          <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.55, margin: 0 }}>
            {data.coach.summary}
          </p>
          <Block title="What worked" items={data.coach.whatWorked} accent="#34d399" />
          <Block title="What to improve" items={data.coach.whatToImprove} accent="#fbbf24" />
          <Block title="Next time, try" items={data.coach.nextSteps} accent="#a5b4fc" />
        </>
      ) : (
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
          The session is saved to your account, but the Coach Ney write-up couldn't be generated
          right now. You can view raw stats on the Seeneyu site.
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        {data.webUrl && (
          <a
            href={data.webUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              background: '#f59e0b',
              color: '#0d0d14',
              padding: '10px 14px',
              borderRadius: 6,
              fontWeight: 700,
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: 13,
            }}
          >
            View full report
          </a>
        )}
        <button
          onClick={onDone}
          style={{
            flex: 1,
            background: 'transparent',
            color: '#cbd5e1',
            border: '1px solid #374151',
            padding: '10px 14px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

function ScoreRow({ label, value, suffix }: { label: string; value: number | null; suffix: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        background: '#0f172a',
        border: '1px solid #1f2937',
        borderRadius: 8,
        padding: '10px 12px',
      }}
    >
      <span style={{ fontSize: 12, color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
        {value === null ? '—' : Math.round(value)}
        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>{suffix}</span>
      </span>
    </div>
  )
}

function Block({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <div style={{ fontSize: 11, color: accent, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#cbd5e1', lineHeight: 1.55 }}>
        {items.map((it, i) => <li key={i} style={{ marginBottom: 4 }}>{it}</li>)}
      </ul>
    </div>
  )
}
