import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { UserId } from '@/lib/types'
import { InboxItem, Task, Reference, EnergyLevel } from '@/lib/types'
import { createTask } from '@/lib/helpers'
import { ArrowRight, CheckCircle } from '@phosphor-icons/react'

interface ProcessInboxDialogProps {
  item: InboxItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  onCreateTask: (task: Task) => void
  onCreateReference: (reference: Reference) => void
  onMarkProcessed: (itemId: string) => void
}

type ProcessStep = 'actionable' | 'next-action' | 'two-minute' | 'someday'

export function ProcessInboxDialog({ 
  item, 
  open, 
  onOpenChange, 
  userId,
  onCreateTask,
  onCreateReference,
  onMarkProcessed
}: ProcessInboxDialogProps) {
  const [step, setStep] = useState<ProcessStep>('actionable')
  const [isActionable, setIsActionable] = useState<string>('yes')
  const [nextAction, setNextAction] = useState('')
  const [isTwoMinute, setIsTwoMinute] = useState<string>('no')
  const [tags, setTags] = useState('')
  const [referenceTitle, setReferenceTitle] = useState('')
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | ''>('')

  const resetState = () => {
    setStep('actionable')
    setIsActionable('yes')
    setNextAction('')
    setIsTwoMinute('no')
    setTags('')
    setReferenceTitle('')
    setEnergyLevel('')
  }

  const handleClose = () => {
    resetState()
    onOpenChange(false)
  }

  if (!item) return null

  const handleActionableDecision = () => {
    if (isActionable === 'no') {
      // Criar anotação diretamente
      const reference: Reference = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        title: referenceTitle.trim() || item.content.substring(0, 50),
        content: item.content + (item.notes ? `\n\n${item.notes}` : ''),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      onCreateReference(reference)
      onMarkProcessed(item.id)
      handleClose()
    } else {
      setStep('next-action')
    }
  }

  const handleNextActionSubmit = () => {
    if (!nextAction.trim()) return
    setStep('two-minute')
  }

  const handleTwoMinuteDecision = () => {
    if (isTwoMinute === 'yes') {
      const task = createTask(userId, item.content, {
        status: 'done',
        description: nextAction.trim(),
        isTwoMinuteTask: true,
        completedAt: Date.now(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        notes: item.notes,
        energyLevel: energyLevel || undefined,
      })
      onCreateTask(task)
      onMarkProcessed(item.id)
      handleClose()
    } else {
      const task = createTask(userId, item.content, {
        status: 'next',
        description: nextAction.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        notes: item.notes,
        energyLevel: energyLevel || undefined,
      })
      onCreateTask(task)
      onMarkProcessed(item.id)
      handleClose()
    }
  }

  const handleDoNow = () => {
    const task = createTask(userId, item.content, {
      status: 'done',
      description: nextAction.trim(),
      isTwoMinuteTask: true,
      completedAt: Date.now(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: item.notes,
      energyLevel: energyLevel || undefined,
    })
    onCreateTask(task)
    onMarkProcessed(item.id)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Processar Inbox</DialogTitle>
          <DialogDescription>
            Transforme este item em algo acionável
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-secondary/50 rounded-lg border border-border">
            <p className="text-sm">{item.content}</p>
            {item.notes && (
              <p className="text-xs text-muted-foreground mt-2">{item.notes}</p>
            )}
          </div>

          {step === 'actionable' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Isso é acionável?</Label>
                <RadioGroup value={isActionable} onValueChange={setIsActionable}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="actionable-yes" />
                    <Label htmlFor="actionable-yes" className="font-normal cursor-pointer">
                      Sim, preciso fazer algo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="actionable-no" />
                    <Label htmlFor="actionable-no" className="font-normal cursor-pointer">
                      Não, apenas anotação
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {isActionable === 'no' && (
                <div className="space-y-3 pl-6 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label htmlFor="reference-title" className="text-sm">Título</Label>
                    <Input
                      id="reference-title"
                      value={referenceTitle}
                      onChange={(e) => setReferenceTitle(e.target.value)}
                      placeholder="Nome para esta anotação"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags-classify" className="text-sm">Tags (opcional)</Label>
                    <Input
                      id="tags-classify"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Separadas por vírgula"
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleActionableDecision} className="w-full">
                Continuar <ArrowRight className="ml-2" />
              </Button>
            </div>
          )}

          {step === 'next-action' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="next-action" className="text-base font-semibold">
                  Qual a próxima ação física?
                </Label>
                <p className="text-xs text-muted-foreground">
                  Descreva uma ação concreta e específica que você pode fazer
                </p>
                <Textarea
                  id="next-action"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="Ex: Ligar para João e marcar reunião"
                  rows={3}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags-action" className="text-sm">Tags (opcional)</Label>
                <Input
                  id="tags-action"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="trabalho, urgente, telefone"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm">Nível de Energia</Label>
                <RadioGroup value={energyLevel} onValueChange={(val) => setEnergyLevel(val as EnergyLevel)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="energy-high" />
                    <Label htmlFor="energy-high" className="font-normal cursor-pointer text-red-500">
                      Alta
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="energy-medium" />
                    <Label htmlFor="energy-medium" className="font-normal cursor-pointer text-yellow-600">
                      Média
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="energy-low" />
                    <Label htmlFor="energy-low" className="font-normal cursor-pointer text-green-600">
                      Baixa
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('actionable')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleNextActionSubmit} 
                  disabled={!nextAction.trim()}
                  className="flex-1"
                >
                  Continuar <ArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 'two-minute' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Regra dos 2 minutos</Label>
                <p className="text-sm text-muted-foreground">
                  Esta ação leva menos de 2 minutos?
                </p>
                <RadioGroup value={isTwoMinute} onValueChange={setIsTwoMinute}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="two-min-yes" />
                    <Label htmlFor="two-min-yes" className="font-normal cursor-pointer">
                      Sim, é rápida (&lt;2 min)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="two-min-no" />
                    <Label htmlFor="two-min-no" className="font-normal cursor-pointer">
                      Não, vai demorar mais
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {isTwoMinute === 'yes' && (
                <div className="p-3 bg-accent/10 border border-accent rounded-lg">
                  <p className="text-sm font-medium text-accent-foreground mb-2">
                    Fazer agora!
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Tarefas de menos de 2 minutos devem ser feitas imediatamente. Quer marcar como concluída?
                  </p>
                  <Button 
                    onClick={handleDoNow}
                    variant="default"
                    size="sm"
                    className="w-full"
                  >
                    <CheckCircle className="mr-2" /> Fazer agora e concluir
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('next-action')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleTwoMinuteDecision}
                  className="flex-1"
                >
                  {isTwoMinute === 'yes' ? 'Adicionar à lista' : 'Criar tarefa'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
