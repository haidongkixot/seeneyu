'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface KeywordsTagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  max?: number
  placeholder?: string
}

export function KeywordsTagInput({
  value,
  onChange,
  max = 5,
  placeholder = 'Add keyword...',
}: KeywordsTagInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag() {
    const tag = input.trim()
    if (!tag || value.includes(tag) || value.length >= max) return
    onChange([...value, tag])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <div
        aria-label="Search keywords"
        className="bg-bg-inset border border-white/10 rounded-xl px-3 py-2 flex flex-wrap gap-1.5 min-h-[52px] focus-within:border-accent-400/60 focus-within:ring-1 focus-within:ring-accent-400/20 transition-colors cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-accent-400/10 border border-accent-400/20 text-accent-400 text-xs px-2.5 py-1 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="hover:text-white transition-colors cursor-pointer"
              aria-label={`Remove ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        {value.length < max && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={addTag}
            placeholder={value.length === 0 ? placeholder : ''}
            className="bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none min-w-[120px] flex-1"
          />
        )}
      </div>
      <p className="text-xs text-text-tertiary mt-1.5">
        Add 3–5 search terms. Press Enter after each.
        {value.length >= max && <span className="ml-1 text-amber-400"> Max {max} reached.</span>}
      </p>
    </div>
  )
}
