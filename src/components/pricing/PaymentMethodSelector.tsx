'use client'

export function PaymentMethodSelector({
  selectedMethod,
  onChange,
}: {
  selectedMethod: 'paypal' | 'vnpay'
  onChange: (m: 'paypal' | 'vnpay') => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(['paypal', 'vnpay'] as const).map(method => (
        <button
          key={method}
          onClick={() => onChange(method)}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
            selectedMethod === method
              ? 'border-accent-400/40 bg-accent-400/5 shadow-glow-sm'
              : 'border-white/10 bg-bg-surface hover:border-white/20'
          }`}
        >
          <span className="text-2xl">{method === 'paypal' ? 'PP' : 'VN'}</span>
          <span className="text-sm font-semibold text-text-primary capitalize">
            {method === 'paypal' ? 'PayPal' : 'VNPay'}
          </span>
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            selectedMethod === method ? 'border-accent-400' : 'border-white/20'
          }`}>
            {selectedMethod === method && (
              <div className="w-2 h-2 rounded-full bg-accent-400" />
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
