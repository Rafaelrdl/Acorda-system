import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface IconBadgeProps {
  children: ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'muted'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variantStyles = {
  default: 'bg-muted/50 text-foreground border-border/50',
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  muted: 'bg-muted/30 text-muted-foreground border-border/30',
}

const sizeStyles = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

const iconSizeStyles = {
  sm: '[&_svg]:w-4 [&_svg]:h-4',
  md: '[&_svg]:w-5 [&_svg]:h-5',
  lg: '[&_svg]:w-6 [&_svg]:h-6',
}

export function IconBadge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className 
}: IconBadgeProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border shrink-0 transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        iconSizeStyles[size],
        className
      )}
    >
      {children}
    </div>
  )
}
