import { FileText, ListOrdered, Lightbulb } from 'lucide-react'

interface ScriptPanelProps {
  type: 'dialogue' | 'action'
  content: string | string[]
  label?: string
  tip?: string
}

export function ScriptPanel({ type, content, label, tip }: ScriptPanelProps) {
  const defaultLabel = type === 'dialogue' ? 'YOUR SCRIPT' : 'WHAT TO DO'
  const Icon = type === 'dialogue' ? FileText : ListOrdered
  const ariaLabel = type === 'dialogue' ? 'Script panel' : 'Action instructions'

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className="bg-bg-surface border border-white/8 rounded-2xl p-4 md:p-5 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Icon size={16} className="w-4 h-4 text-text-tertiary" />
        <span className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
          {label ?? defaultLabel}
        </span>
      </div>

      <div className="border-t border-white/6" />

      {type === 'dialogue' ? (
        <div className="border-l-2 border-accent-400 pl-4">
          <blockquote className="text-base md:text-lg font-medium text-text-primary leading-relaxed italic">
            {content as string}
          </blockquote>
        </div>
      ) : (
        <ol className="space-y-2">
          {(content as string[]).map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-400/15 text-accent-400 text-xs font-bold flex items-center justify-center"
              >
                {i + 1}
              </span>
              <span className="text-base text-text-primary leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      )}

      {tip && (
        <>
          <div className="border-t border-white/6" />
          <div className="flex items-start gap-2 pt-1">
            <Lightbulb size={16} className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary italic">{tip}</p>
          </div>
        </>
      )}
    </div>
  )
}
