'use client'

type TierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'

const TIER_COLORS: Record<TierName, string> = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
  Diamond: '#B9F2FF',
}

interface TierBadgeProps {
  tier: TierName
  size?: 'sm' | 'md' | 'lg'
}

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const color = TIER_COLORS[tier] ?? TIER_COLORS.Bronze

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[11px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
  }

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${sizeClasses[size]}`}
      style={{
        color,
        borderColor: `${color}40`,
        backgroundColor: `${color}15`,
      }}
    >
      {tier}
    </span>
  )
}
