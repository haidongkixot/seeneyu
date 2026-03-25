'use client'
import { cn } from '@/lib/cn'

interface StickyPracticeLayoutProps {
  cameraSlot: React.ReactNode
  contentSlot: React.ReactNode
  className?: string
}

export function StickyPracticeLayout({ cameraSlot, contentSlot, className }: StickyPracticeLayoutProps) {
  return (
    <div className={cn('flex flex-col lg:flex-row gap-0 lg:gap-6', className)}>
      {/* Camera pane — sticky */}
      <div className="lg:w-[45%] sticky top-14 z-10 h-[40vh] lg:h-[calc(100vh-56px)] bg-bg-base">
        <div className="h-full flex flex-col">
          {cameraSlot}
        </div>
      </div>
      {/* Content pane — scrollable */}
      <div className="lg:w-[55%] min-h-screen px-4 lg:px-0 py-6">
        {contentSlot}
      </div>
    </div>
  )
}
