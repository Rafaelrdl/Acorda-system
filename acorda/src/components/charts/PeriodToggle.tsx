import { cn } from '@/lib/utils'

export type PeriodOption = 7 | 14 | 30

interface PeriodToggleProps {
  value: PeriodOption
  onChange: (value: PeriodOption) => void
  options?: PeriodOption[]
  className?: string
}

export function PeriodToggle({ 
  value, 
  onChange, 
  options = [7, 30],
  className = '' 
}: PeriodToggleProps) {
  return (
    <div 
      className={cn('inline-flex rounded-lg bg-muted p-0.5', className)}
      role="radiogroup"
      aria-label="Selecionar período"
    >
      {options.map((option) => (
        <button
          key={option}
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md transition-all',
            value === option 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option}d
        </button>
      ))}
    </div>
  )
}
