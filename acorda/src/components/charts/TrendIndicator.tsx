import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface TrendIndicatorProps {
  current: number
  previous: number
  label?: string
  invertColors?: boolean
  className?: string
}

export function TrendIndicator({ 
  current, 
  previous, 
  label,
  invertColors = false,
  className = ''
}: TrendIndicatorProps) {
  const { deltaPct, direction } = getTrendDelta(current, previous)
  
  const isPositive = direction === 'up'
  const isNegative = direction === 'down'
  
  // Cores: normalmente up=verde, down=vermelho. Se invertColors, inverte.
  const colorClass = invertColors
    ? isPositive ? 'text-rose-500' : isNegative ? 'text-emerald-500' : 'text-muted-foreground'
    : isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-muted-foreground'

  return (
    <div 
      className={cn('flex items-center gap-1 text-xs font-medium', colorClass, className)}
      aria-label={label ? `${label}: ${deltaPct}% ${direction === 'up' ? 'acima' : direction === 'down' ? 'abaixo' : 'igual'}` : undefined}
    >
      {direction === 'up' && <TrendUp size={14} weight="bold" aria-hidden="true" />}
      {direction === 'down' && <TrendDown size={14} weight="bold" aria-hidden="true" />}
      {direction === 'neutral' && <Minus size={14} weight="bold" aria-hidden="true" />}
      <span>{deltaPct}%</span>
    </div>
  )
}

export function getTrendDelta(current: number, previous: number): { 
  deltaPct: number
  direction: 'up' | 'down' | 'neutral' 
} {
  if (previous === 0 && current === 0) {
    return { deltaPct: 0, direction: 'neutral' }
  }
  
  if (previous === 0) {
    return { deltaPct: 100, direction: 'up' }
  }
  
  const delta = ((current - previous) / previous) * 100
  const deltaPct = Math.abs(Math.round(delta))
  
  if (delta > 0) {
    return { deltaPct, direction: 'up' }
  } else if (delta < 0) {
    return { deltaPct, direction: 'down' }
  }
  
  return { deltaPct: 0, direction: 'neutral' }
}
