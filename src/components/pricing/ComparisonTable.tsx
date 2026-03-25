'use client'

import { Check, X } from 'lucide-react'

const comparisonRows: { feature: string; basic: string | boolean; standard: string | boolean; advanced: string | boolean }[] = [
  { feature: 'Video recording length', basic: '5 seconds', standard: '30 seconds', advanced: '3 minutes' },
  { feature: 'AI feedback', basic: 'Short summary', standard: 'Full analysis', advanced: 'Full + coach summary' },
  { feature: 'Arcade challenges', basic: '3 per type', standard: 'Unlimited', advanced: 'Unlimited' },
  { feature: 'Practice sessions', basic: 'Limited', standard: 'Unlimited', advanced: 'Unlimited' },
  { feature: 'Library access', basic: true, standard: true, advanced: true },
  { feature: 'Foundation courses', basic: true, standard: true, advanced: true },
  { feature: 'VIP lessons', basic: false, standard: false, advanced: true },
  { feature: 'Priority support', basic: false, standard: false, advanced: true },
]

function renderValue(val: string | boolean) {
  if (val === true) return <Check size={16} className="text-success mx-auto" />
  if (val === false) return <X size={16} className="text-text-tertiary mx-auto" />
  return <span className="text-text-primary text-sm">{val}</span>
}

export function ComparisonTable() {
  return (
    <div className="mt-16 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
        Compare Plans
      </h2>
      <div className="rounded-2xl border border-black/8 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-surface border-b border-black/8">
              <th className="text-left py-4 px-6 text-text-secondary font-medium">Feature</th>
              <th className="text-center py-4 px-4 text-text-primary font-semibold">Basic</th>
              <th className="text-center py-4 px-4 text-text-primary font-semibold bg-accent-400/5 border-x border-accent-400/10">Standard</th>
              <th className="text-center py-4 px-4 text-text-primary font-semibold">Advanced</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, i) => (
              <tr key={i} className="border-b border-black/6 last:border-0">
                <td className="py-3 px-6 text-text-secondary">{row.feature}</td>
                <td className="py-3 px-4 text-center">{renderValue(row.basic)}</td>
                <td className="py-3 px-4 text-center bg-accent-400/5 border-x border-accent-400/10">{renderValue(row.standard)}</td>
                <td className="py-3 px-4 text-center">{renderValue(row.advanced)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
