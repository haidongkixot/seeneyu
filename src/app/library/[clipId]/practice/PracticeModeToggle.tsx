'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Hand, MousePointer } from 'lucide-react'
import dynamic from 'next/dynamic'

const HandsFreePracticeFlow = dynamic(() => import('@/components/HandsFreePracticeFlow'), { ssr: false })

interface ToggleProps {
  clipId: string
  isHandsFree: boolean
}

export default function PracticeModeToggle({ clipId, isHandsFree }: ToggleProps) {
  const router = useRouter()
  const pathname = usePathname()

  function toggle() {
    if (isHandsFree) {
      router.push(pathname)
    } else {
      router.push(`${pathname}?mode=handsfree`)
    }
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <button
        onClick={toggle}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
          isHandsFree
            ? 'bg-accent-400/20 border-accent-400/30 text-accent-400'
            : 'bg-bg-surface border-black/10 text-text-secondary hover:text-text-primary'
        }`}
      >
        {isHandsFree ? <Hand size={14} /> : <MousePointer size={14} />}
        {isHandsFree ? 'Hands-Free ON' : 'Hands-Free'}
      </button>
    </div>
  )
}

// Export hands-free component for use in practice page
PracticeModeToggle.HandsFree = function HandsFree(props: {
  clipId: string
  steps: any[]
  skillCategory: string
}) {
  const router = useRouter()
  return (
    <HandsFreePracticeFlow
      {...props}
      onComplete={() => router.push(`/library/${props.clipId}`)}
    />
  )
}
