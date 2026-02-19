import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Lightning, Check } from '@phosphor-icons/react'
import type { UserId, Habit } from '@/lib/types'
import { createHabit } from '@/lib/helpers'
import { HABIT_SUGGESTIONS, type HabitSuggestion } from '@/constants/habitSuggestions'

interface HabitsStepProps {
  userId: UserId
  onComplete: (habits: Habit[]) => void
  onSkip: () => void
  onBack: () => void
}

export function HabitsStep({ userId, onComplete, onSkip, onBack }: HabitsStepProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSuggestion = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSubmit = () => {
    const habits = HABIT_SUGGESTIONS
      .filter(s => selectedIds.has(s.id))
      .map(s => createHabit(
        userId,
        s.title,
        s.cadence,
        {
          description: s.description,
          timesPerWeek: s.cadence === 'weekly' ? 3 : undefined,
          targetDays: s.cadence === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : undefined,
        }
      ))
    onComplete(habits)
  }

  return (
    <div className="flex flex-col min-h-full px-4 sm:px-6 py-4 sm:py-6">
      <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Lightning size={24} weight="duotone" className="text-amber-500" />
              <h2 className="text-xl font-bold text-foreground">Escolha seus hábitos</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione os hábitos que quer acompanhar. Você pode adicionar mais depois.
            </p>
          </div>
        </div>

        {/* Selected count */}
        {selectedIds.size > 0 && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <p className="text-sm font-medium text-primary">
              {selectedIds.size} hábito{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* All habits */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {HABIT_SUGGESTIONS.map(suggestion => (
            <HabitCard
              key={suggestion.id}
              suggestion={suggestion}
              selected={selectedIds.has(suggestion.id)}
              onToggle={() => toggleSuggestion(suggestion.id)}
            />
          ))}
        </div>

        {/* Quick tip */}
        <p className="text-xs text-muted-foreground text-center italic">
          💡 Dica: comece com poucos hábitos e aumente gradualmente
        </p>

        {/* Actions */}
        <div className="flex gap-3 pt-2 pb-safe">
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1 h-12 text-sm sm:text-base"
          >
            Pular
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0}
            className="flex-1 h-12 text-sm sm:text-base"
          >
            {selectedIds.size > 0
              ? `Adicionar ${selectedIds.size} hábito${selectedIds.size > 1 ? 's' : ''}`
              : 'Selecione hábitos'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function HabitCard({ suggestion, selected, onToggle }: {
  suggestion: HabitSuggestion
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center
        ${selected
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-border bg-card hover:border-muted-foreground/30'
        }
      `}
    >
      {selected && (
        <div className="absolute top-1.5 right-1.5">
          <Check size={14} weight="bold" className="text-primary" />
        </div>
      )}
      <span className="text-2xl">{suggestion.emoji || '✨'}</span>
      <span className="text-xs font-medium text-foreground leading-tight">{suggestion.title}</span>
    </button>
  )
}
