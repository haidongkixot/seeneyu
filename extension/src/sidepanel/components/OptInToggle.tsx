interface Props {
  value: boolean
  onChange: (next: boolean) => void | Promise<void>
}

export function OptInToggle({ value, onChange }: Props) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: 12,
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 6,
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 2 }}
      />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Sync post-call summary</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>
          After each session, send only an anonymous aggregate (duration, averages) to Seeneyu so
          your coaching progress is saved. Raw video and audio never leave your device.
        </div>
      </div>
    </label>
  )
}
