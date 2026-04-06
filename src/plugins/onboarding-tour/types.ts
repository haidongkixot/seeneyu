export interface TourSlide {
  id: string
  title: string
  description: string
  imageUrl?: string
  order: number
}

export interface TourStep {
  id: string
  order: number
  targetSelector: string
  title: string
  description: string
  imageUrl?: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  action?: 'click' | 'navigate' | 'observe'
  actionUrl?: string
  page?: string
}

export interface TourRewards {
  xpAmount: number
  kudosTitle: string
  kudosMessage: string
}

export interface TourConfig {
  enabled: boolean
  slides: TourSlide[]
  steps: TourStep[]
  rewards: TourRewards
}

export type TourPhase = 'idle' | 'slideshow' | 'guided' | 'completing' | 'done'
