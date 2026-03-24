'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface LibrarySearchBarProps {
  filteredCount: number
}

export function LibrarySearchBar({ filteredCount }: LibrarySearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('search') ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) {
        params.set('search', value.trim())
      } else {
        params.delete('search')
      }
      router.push(`/library${params.toString() ? `?${params}` : ''}`)
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Search clips, films, characters…"
          className="w-full bg-bg-inset border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-400/60 focus:outline-none transition-colors duration-150"
        />
        {value && (
          <button
            onClick={() => setValue('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <span className="shrink-0 text-xs text-text-tertiary tabular-nums">
        {filteredCount} {filteredCount === 1 ? 'clip' : 'clips'}
      </span>
    </div>
  )
}
