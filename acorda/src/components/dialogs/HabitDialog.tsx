import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { UserId } from '@/lib/types'
import { Habit, Goal, KeyResult } from '@/lib/types'
import { createHabit, updateTimestamp } from '@/lib/helpers'
import { HabitSuggestions } from './HabitSuggestions'
import { HABIT_SUGGESTIONS } from '@/constants/habitSuggestions'
import { toast } from 'sonner'

interface HabitDialogProps {
  habit?: Habit
  habits?: Habit[]
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  goals: Goal[]
  keyResults: KeyResult[]
  onSave: (habit: Habit) => void
}

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

export function HabitDialog({
  open,
  onOpenChange, 
  habit,
  habits = [],
  userId,
  goals,
  keyResults,
  onSave
}: HabitDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [minimumVersion, setMinimumVersion] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [timesPerWeek, setTimesPerWeek] = useState(3)
  const [targetDays, setTargetDays] = useState<number[]>([])
  const [keyResultId, setKeyResultId] = useState('')
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime')

  // Determina se deve mostrar sugestões - sempre quando for novo hábito
  const shouldShowSuggestions = !habit

  const handleQuickPickSuggestion = (suggestion: typeof HABIT_SUGGESTIONS[0]) => {
    // Normaliza título para validação
    const normalizedSuggestion = suggestion.title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')

    // Verifica duplicado
    const hasDuplicate = habits.some(h =>
      h.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ') === normalizedSuggestion
    )

    if (hasDuplicate) {
      toast.error(`Você já tem o hábito "${suggestion.title}"`)
      return
    }

    // Preenche os campos do formulário com base na sugestão
    setName(suggestion.title)
    setDescription(suggestion.description || '')
    setMinimumVersion(suggestion.targetMinutes ? `${suggestion.targetMinutes} min` : '')
    setFrequency(suggestion.cadence)
    
    // Foca no campo de nome para o usuário perceber que pode editar
    setTimeout(() => {
      const nameInput = document.getElementById('habit-name')
      if (nameInput) {
        nameInput.focus()
        // Seleciona o texto para facilitar edição
        if (nameInput instanceof HTMLInputElement) {
          nameInput.select()
        }
      }
    }, 100)
  }

  useEffect(() => {
    if (open) {
      if (habit) {
        setName(habit.name)
        setDescription(habit.description || '')
        setMinimumVersion(habit.minimumVersion || '')
        setFrequency(habit.frequency)
        setTimesPerWeek(habit.timesPerWeek || 3)
        setTargetDays(habit.targetDays || [])
        setKeyResultId(habit.keyResultId || '')
        setPreferredTime(habit.preferredTime || 'anytime')
      } else {
        setName('')
        setDescription('')
        setMinimumVersion('')
        setFrequency('daily')
        setTimesPerWeek(3)
        setTargetDays([])
        setKeyResultId('')
        setPreferredTime('anytime')
      }
    }
  }, [habit, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return

    const habitData = habit 
      ? updateTimestamp({
          ...habit,
          name: name.trim(),
          description: description.trim() || undefined,
          minimumVersion: minimumVersion.trim() || undefined,
          frequency,
          timesPerWeek: frequency === 'weekly' ? timesPerWeek : undefined,
          targetDays: frequency === 'weekly' ? targetDays : undefined,
          keyResultId: keyResultId || undefined,
          preferredTime: preferredTime !== 'anytime' ? preferredTime : undefined,
        })
      : createHabit(userId, name.trim(), frequency, {
          description: description.trim() || undefined,
          minimumVersion: minimumVersion.trim() || undefined,
          timesPerWeek: frequency === 'weekly' ? timesPerWeek : undefined,
          targetDays: frequency === 'weekly' ? targetDays : undefined,
          keyResultId: keyResultId || undefined,
          preferredTime: preferredTime !== 'anytime' ? preferredTime : undefined,
        })

    onSave(habitData)
    onOpenChange(false)
  }

  const toggleTargetDay = (day: number) => {
    setTargetDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  const availableKRs = keyResults.filter(kr => {
    const goal = goals.find(g => g.id === kr.goalId)
    return goal?.status === 'active'
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{habit ? 'Editar Hábito' : 'Novo Hábito'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {shouldShowSuggestions && (
            <>
              <HabitSuggestions
                suggestions={HABIT_SUGGESTIONS}
                existingTitles={habits.map(h => h.name)}
                onPick={handleQuickPickSuggestion}
              />
              <div className="border-b" />
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="habit-name">Nome do Hábito</Label>
            <Input
              id="habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Meditar, Exercitar, Ler"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="habit-description">Descrição (opcional)</Label>
            <Textarea
              id="habit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre o hábito"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="habit-minimum">Versão Mínima (opcional)</Label>
            <Input
              id="habit-minimum"
              value={minimumVersion}
              onChange={(e) => setMinimumVersion(e.target.value)}
              placeholder="Ex: 5 minutos, 1 página"
            />
          </div>

          <div className="space-y-2">
            <Label>Frequência</Label>
            <RadioGroup value={frequency} onValueChange={(v) => setFrequency(v as 'daily' | 'weekly')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="font-normal">Diário</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="font-normal">Semanal</Label>
              </div>
            </RadioGroup>
          </div>

          {frequency === 'weekly' && (
            <>
              <div className="space-y-2">
                <Label>Vezes por Semana</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTimesPerWeek(num)}
                      aria-pressed={timesPerWeek === num}
                      className={`w-10 h-10 rounded-md border ${
                        timesPerWeek === num 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dias Específicos (opcional)</Label>
                <div className="flex gap-2">
                  {WEEKDAYS.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleTargetDay(day.value)}
                      aria-pressed={targetDays.includes(day.value)}
                      className={`flex-1 py-2 px-1 text-sm rounded-md border ${
                        targetDays.includes(day.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {availableKRs.length > 0 && (
            <div className="space-y-2">
              <Label>Vincular a Key Result (opcional)</Label>
              <Select value={keyResultId || '__none__'} onValueChange={(val) => setKeyResultId(val === '__none__' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um KR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {availableKRs.map(kr => {
                    const goal = goals.find(g => g.id === kr.goalId)
                    return (
                      <SelectItem key={kr.id} value={kr.id}>
                        {goal?.objective}: {kr.description}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Horário preferido (opcional)</Label>
            <Select value={preferredTime} onValueChange={(v) => setPreferredTime(v as typeof preferredTime)}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anytime">Qualquer horário</SelectItem>
                <SelectItem value="morning">Manhã</SelectItem>
                <SelectItem value="afternoon">Tarde</SelectItem>
                <SelectItem value="evening">Noite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-12 touch-target">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 h-12 touch-target">
              {habit ? 'Salvar' : 'Criar Hábito'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
