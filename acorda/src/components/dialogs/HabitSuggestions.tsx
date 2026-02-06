import { Button } from '@/components/ui/button'
import { HabitSuggestion } from '@/constants/habitSuggestions'
import { cn } from '@/lib/utils'

interface HabitSuggestionsProps {
  suggestions: HabitSuggestion[]
  existingTitles: string[]
  onPick: (suggestion: HabitSuggestion) => void
  disabled?: boolean
}

/**
 * Componente que exibe sugestões rápidas de hábitos em formato de chips.
 * Permite selecionar uma sugestão com um clique para criação rápida.
 * 
 * Acessibilidade:
 * - Cada chip tem aria-label descritivo
 * - Navegação por teclado (Tab, Enter)
 * - Foco visível
 * - Desabilita chips se o hábito já existe
 */
export function HabitSuggestions({
  suggestions,
  existingTitles,
  onPick,
  disabled = false,
}: HabitSuggestionsProps) {
  // Normaliza títulos para comparação
  const normalizedExisting = new Set(
    existingTitles.map(t =>
      t
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
    )
  )

  const getIsDisabled = (suggestion: HabitSuggestion): boolean => {
    const normalizedSuggestion = suggestion.title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
    return normalizedExisting.has(normalizedSuggestion)
  }

  const getAriaLabel = (suggestion: HabitSuggestion, isDisabled: boolean): string => {
    if (isDisabled) {
      return `Hábito "${suggestion.title}" já existe`
    }
    return `Adicionar hábito: ${suggestion.title}`
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        💡 Sugestões rápidas
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible scrollbar-hide">
        {suggestions.map(suggestion => {
          const isDisabled = getIsDisabled(suggestion)
          return (
            <Button
              key={suggestion.id}
              type="button"
              variant={isDisabled ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => !isDisabled && onPick(suggestion)}
              disabled={disabled || isDisabled}
              aria-label={getAriaLabel(suggestion, isDisabled)}
              className={cn(
                'shrink-0 whitespace-nowrap transition-all h-7 px-2 py-1 text-xs',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {suggestion.emoji && <span className="mr-1 text-sm">{suggestion.emoji}</span>}
              <span className="text-xs">{suggestion.title}</span>
            </Button>
          )
        })}
      </div>

      {suggestions.some(s => getIsDisabled(s)) && (
        <p className="text-xs text-muted-foreground italic">
          Hábitos com fundo cinza já foram adicionados
        </p>
      )}
    </div>
  )
}
