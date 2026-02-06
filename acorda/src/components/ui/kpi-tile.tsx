import { cn } from '@/lib/utils'
import { IconBadge } from './icon-badge'
import type { ReactNode } from 'react'

interface KpiTileProps {
  icon: ReactNode
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'success' | 'warning' | 'destructive' | 'primary'
  className?: string
  onClick?: () => void
  action?: ReactNode
}

const toneStyles = {
  default: '',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  destructive: 'text-destructive',
  primary: 'text-primary',
}

export function KpiTile({
  icon,
  label,
  value,
  hint,
  tone = 'default',
  className,
  onClick,
  action,
}: KpiTileProps) {
  const Component = onClick ? 'button' : 'div'
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50',
        'w-full text-left',
        onClick && [
          'cursor-pointer transition-all duration-200',
          'hover:bg-accent/50 hover:border-border',
          'active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        ],
        className
      )}
    >
      <IconBadge variant={tone === 'default' ? 'muted' : tone} size="md">
        {icon}
      </IconBadge>
      
      <div className="flex flex-col min-w-0 flex-1">
        <span className={cn(
          'text-lg font-semibold leading-tight truncate',
          toneStyles[tone]
        )}>
          {value}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {label}
        </span>
        {hint && (
          <span className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
            {hint}
          </span>
        )}
      </div>
      
      {action && (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      )}
    </Component>
  )
}
