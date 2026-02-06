import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  variant?: 'default' | 'muted' | 'interactive'
  className?: string
  contentClassName?: string
  noPadding?: boolean
}

const variantStyles = {
  default: 'bg-card border-border/50',
  muted: 'bg-muted/30 border-border/30',
  interactive: 'bg-card border-border/50 hover:border-border hover:shadow-sm transition-all duration-200',
}

export function SectionCard({
  title,
  icon,
  action,
  children,
  variant = 'default',
  className,
  contentClassName,
  noPadding = false,
}: SectionCardProps) {
  return (
    <Card className={cn('border', variantStyles[variant], className)}>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <span className="text-primary shrink-0">
                {icon}
              </span>
            )}
            <CardTitle className="text-sm font-medium truncate">
              {title}
            </CardTitle>
          </div>
          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(
        noPadding ? 'p-0' : 'px-4 pb-4',
        contentClassName
      )}>
        {children}
      </CardContent>
    </Card>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-8 px-4 text-center',
      className
    )}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-muted-foreground mb-1">
        {title}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground/70 max-w-[200px]">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}
