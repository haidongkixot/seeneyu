import type { MirrorMetricSample } from '@seeneyu/scoring'

interface Props {
  sample: MirrorMetricSample | null
  running: boolean
}

export function Hud({ sample, running }: Props) {
  const eye = sample?.eyeContact === null || sample?.eyeContact === undefined
    ? null
    : sample.eyeContact ? 100 : 0
  const posture = sample?.posture ?? null
  const pace = sample?.vocalPaceWpm ?? null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      <Dial label="Eye contact" value={eye} suffix="%" running={running} />
      <Dial label="Posture" value={posture} suffix="/100" running={running} />
      <Dial label="Pace" value={pace} suffix=" wpm" running={running} />
    </div>
  )
}

function Dial({
  label,
  value,
  suffix,
  running,
}: {
  label: string
  value: number | null
  suffix: string
  running: boolean
}) {
  const display = value === null ? '—' : Math.round(value).toString()
  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 8,
        padding: 12,
        textAlign: 'center',
        opacity: running ? 1 : 0.5,
      }}
    >
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>
        {display}
        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>{suffix}</span>
      </div>
    </div>
  )
}
