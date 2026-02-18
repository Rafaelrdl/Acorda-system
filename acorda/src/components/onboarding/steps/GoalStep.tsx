import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Target, ArrowLeft, Plus, Trash, LightbulbFilament } from '@phosphor-icons/react'
import type { UserId, Goal, KeyResult } from '@/lib/types'
import { createGoal, createKeyResult, generateId } from '@/lib/helpers'

interface GoalStepProps {
  userId: UserId
  onComplete: (goal: Goal, keyResults: KeyResult[]) => void
  onSkip: () => void
  onBack: () => void
}

const GOAL_SUGGESTIONS = [
  { objective: 'Melhorar minha saúde física', description: 'Ter mais energia e disposição no dia a dia' },
  { objective: 'Organizar minhas finanças', description: 'Ter controle do dinheiro e economizar' },
  { objective: 'Desenvolver minha carreira', description: 'Crescer profissionalmente e aprender novas habilidades' },
  { objective: 'Ler mais livros', description: 'Cultivar o hábito de leitura regularmente' },
  { objective: 'Aprender algo novo', description: 'Estudar um tema que sempre quis dominar' },
  { objective: 'Cuidar da saúde mental', description: 'Ter mais equilíbrio emocional e reduzir estresse' },
]

interface KRInput {
  id: string
  description: string
}

export function GoalStep({ userId, onComplete, onSkip, onBack }: GoalStepProps) {
  const [phase, setPhase] = useState<'objective' | 'keyresults'>('objective')
  const [objective, setObjective] = useState('')
  const [description, setDescription] = useState('')
  const [keyResultInputs, setKeyResultInputs] = useState<KRInput[]>([
    { id: generateId(), description: '' },
    { id: generateId(), description: '' },
  ])

  const handleSelectSuggestion = (suggestion: typeof GOAL_SUGGESTIONS[0]) => {
    setObjective(suggestion.objective)
    setDescription(suggestion.description)
  }

  const handleAddKR = () => {
    if (keyResultInputs.length >= 5) return
    setKeyResultInputs([...keyResultInputs, { id: generateId(), description: '' }])
  }

  const handleRemoveKR = (id: string) => {
    if (keyResultInputs.length <= 1) return
    setKeyResultInputs(keyResultInputs.filter(kr => kr.id !== id))
  }

  const handleKRChange = (id: string, value: string) => {
    setKeyResultInputs(keyResultInputs.map(kr =>
      kr.id === id ? { ...kr, description: value } : kr
    ))
  }

  const handleSubmit = () => {
    if (!objective.trim()) return

    const deadline = Date.now() + 90 * 24 * 60 * 60 * 1000 // 90 dias
    const goal = createGoal(userId, objective.trim(), description.trim() || undefined, deadline)

    const validKRs = keyResultInputs.filter(kr => kr.description.trim())
    const keyResults = validKRs.map(kr =>
      createKeyResult(userId, goal.id, kr.description.trim(), { targetValue: 1 })
    )

    // Se não tiver KRs, cria pelo menos 1 genérico
    if (keyResults.length === 0) {
      keyResults.push(
        createKeyResult(userId, goal.id, 'Completar objetivo principal', { targetValue: 1 })
      )
    }

    onComplete(goal, keyResults)
  }

  const canProceedToKR = objective.trim().length > 0
  const canFinish = objective.trim().length > 0

  return (
    <div className="flex flex-col min-h-full px-6 py-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Target size={24} weight="duotone" className="text-primary" />
              <h2 className="text-xl font-bold text-foreground">Sua primeira meta</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {phase === 'objective'
                ? 'O que você quer conquistar nos próximos meses?'
                : 'Como você vai medir seu progresso?'}
            </p>
          </div>
        </div>

        {phase === 'objective' && (
          <div className="space-y-5">
            {/* Suggestions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <LightbulbFilament size={14} weight="fill" className="text-amber-500" />
                Sugestões — toque para usar
              </p>
              <div className="flex flex-wrap gap-2">
                {GOAL_SUGGESTIONS.map((s, i) => (
                  <Badge
                    key={i}
                    variant={objective === s.objective ? 'default' : 'outline'}
                    className="cursor-pointer text-xs py-1.5 px-3 transition-colors"
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    {s.objective}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Objective input */}
            <div className="space-y-2">
              <Label htmlFor="onboarding-objective" className="text-sm font-medium">
                Objetivo
              </Label>
              <Input
                id="onboarding-objective"
                placeholder="Ex: Melhorar minha saúde física"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="h-12"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="onboarding-description" className="text-sm font-medium">
                Por quê? <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="onboarding-description"
                placeholder="O que te motiva a atingir essa meta?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onSkip}
                className="flex-1 h-12"
              >
                Pular
              </Button>
              <Button
                onClick={() => setPhase('keyresults')}
                disabled={!canProceedToKR}
                className="flex-1 h-12"
              >
                Próximo
              </Button>
            </div>
          </div>
        )}

        {phase === 'keyresults' && (
          <div className="space-y-5">
            {/* Selected goal summary */}
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-primary">🎯 {objective}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>

            {/* Key results */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Key Results — como medir seu progresso?
              </Label>
              <p className="text-xs text-muted-foreground">
                Defina de 1 a 5 resultados-chave mensuráveis. Deixe em branco para pular.
              </p>

              {keyResultInputs.map((kr, index) => (
                <div key={kr.id} className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">
                    {index + 1}.
                  </span>
                  <Input
                    placeholder={`Ex: ${index === 0 ? 'Exercitar 3x por semana' : 'Perder 5kg em 3 meses'}`}
                    value={kr.description}
                    onChange={(e) => handleKRChange(kr.id, e.target.value)}
                    className="flex-1"
                  />
                  {keyResultInputs.length > 1 && (
                    <button
                      onClick={() => handleRemoveKR(kr.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              ))}

              {keyResultInputs.length < 5 && (
                <button
                  onClick={handleAddKR}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus size={14} weight="bold" />
                  Adicionar Key Result
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setPhase('objective')}
                className="flex-1 h-12"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canFinish}
                className="flex-1 h-12"
              >
                Criar Meta
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
