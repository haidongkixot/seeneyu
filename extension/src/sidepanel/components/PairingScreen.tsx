import { useState } from 'react'

interface Props {
  onPair: (code: string) => Promise<void>
}

export function PairingScreen({ onPair }: Props) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setMessage('')
    try {
      await onPair(code.trim())
    } catch (err) {
      setStatus('error')
      setMessage(String((err as Error)?.message || err))
      return
    }
    setStatus('idle')
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1 style={{ fontSize: 16, margin: 0 }}>Connect Seeneyu Mirror</h1>
      <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
        Open seeneyu.com, sign in, and go to <strong>Settings → Extension</strong>. Copy the
        6-digit pairing code and paste it below.
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          placeholder="6-digit code"
          maxLength={6}
          style={{
            background: '#111827',
            border: '1px solid #374151',
            color: '#f9fafb',
            padding: '10px 12px',
            borderRadius: 6,
            fontSize: 18,
            letterSpacing: 4,
            textAlign: 'center',
          }}
        />
        <button
          type="submit"
          disabled={code.length !== 6 || status === 'submitting'}
          style={{
            background: '#f59e0b',
            color: '#0d0d14',
            border: 0,
            padding: '10px 14px',
            borderRadius: 6,
            fontWeight: 600,
            cursor: code.length === 6 ? 'pointer' : 'not-allowed',
            opacity: code.length === 6 ? 1 : 0.5,
          }}
        >
          {status === 'submitting' ? 'Connecting…' : 'Connect'}
        </button>
        {message && (
          <div style={{ color: '#f87171', fontSize: 12 }}>{message}</div>
        )}
      </form>
    </div>
  )
}
