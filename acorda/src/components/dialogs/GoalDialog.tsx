import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { UserId } from '@/lib/types'
import { Goal, KeyResult } from '@/lib/types'
import { createGoal, createKeyResult } from '@/lib/helpers'
import { Plus, Trash } from '@phosphor-icons/react'

interface GoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  onSave: (goal: Goal, keyResults: KeyResult[]) => void
}

interface KRInput {
  description: string
}

export function GoalDialog({ open, onOpenChange, userId, onSave }: GoalDialogProps) {
  const [objective, setObjective] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [keyResultInputs, setKeyResultInputs] = useState<KRInput[]>([
    { description: '' },
    { description: '' },
  ])

  const handleAddKR = () => {
    if (keyResultInputs.length >= 5) return
    setKeyResultInputs([...keyResultInputs, { description: '' }])
  }

  const handleRemoveKR = (index: number) => {
    if (keyResultInputs.length <= 2) return
    setKeyResultInputs(keyResultInputs.filter((_, i) => i !== index))
  }

  const handleKRChange = (index: number, field: keyof KRInput, value: string) => {
    const updated = [...keyResultInputs]
    updated[index] = { ...updated[index], [field]: value }
    setKeyResultInputs(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!objective.trim()) return

    const keyResults: KeyResult[] = keyResultInputs
      .filter(kr => kr.description.trim())
      .map(kr => createKeyResult(
        userId,
        '',
        kr.description.trim()
      ))

    if (keyResults.length < 2) {
      return
    }

    const deadlineTimestamp = deadline ? new Date(deadline).getTime() : undefined
    const goal = createGoal(userId, objective.trim(), description.trim() || undefined, deadlineTimestamp)

    const finalKRs = keyResults.map(kr => ({ ...kr, goalId: goal.id }))

    onSave(goal, finalKRs)
    
    setObjective('')
    setDescription('')
    setDeadline('')
    setKeyResultInputs([
      { description: '' },
      { description: '' },
    ])
    onOpenChange(false)
  }

  const validKRs = keyResultInputs.filter(kr => kr.description.trim()).length
  const canSubmit = objective.trim() && validKRs >= 2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Meta (OKR)</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-objective">Objetivo</Label>
            <Input
              id="goal-objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex: Melhorar minha saúde física"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-description">Descrição (opcional)</Label>
            <Textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Por que essa meta é importante?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-deadline">Prazo (opcional)</Label>
            <Input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Resultados-Chave (2–5)</Label>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={handleAddKR}
                disabled={keyResultInputs.length >= 5}
              >
                <Plus size={16} className="mr-1" />
                Adicionar KR
              </Button>
            </div>

            {keyResultInputs.map((kr, index) => (
              <div key={index} className="p-3 border border-border rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Ex: Correr 3x por semana"
                      value={kr.description}
                      onChange={(e) => handleKRChange(index, 'description', e.target.value)}
                    />
                  </div>
                  {keyResultInputs.length > 2 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveKR(index)}
                    >
                      <Trash size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={!canSubmit}>
              Criar Meta
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
          {validKRs < 2 && validKRs > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Adicione pelo menos 2 resultados-chave
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
