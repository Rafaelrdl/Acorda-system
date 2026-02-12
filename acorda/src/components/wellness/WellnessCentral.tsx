import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@/lib/sync-storage'
import { Button } from '@/components/ui/button'
import { SectionCard, EmptyState } from '@/components/ui/section-card'
import { KpiTile } from '@/components/ui/kpi-tile'
import { WellnessProgramDialog } from './WellnessProgramDialog'
import { CheckInDialog } from './CheckInDialog'
import { CheckInInsightDialog } from './CheckInInsightDialog'
import type { UserId } from '@/lib/types'
import { WellnessProgram, WellnessCheckIn, WellnessDayAction } from '@/lib/types'
import { getSyncKey, getDateKey, getWellnessProgramActions, daysBetweenDateKeys, updateTimestamp } from '@/lib/helpers'
import { getCheckInInsight, type CheckInInsight } from '@/lib/wellness/checkInInsights'
import { Heart, Plus, CheckCircle, Circle, Calendar, ArrowRight, Fire, Confetti } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { getProgramTitle, getProgramIcon } from '@/constants/wellness'

interface WellnessCentralProps {
  userId: UserId
}

export function WellnessCentral({ userId }: WellnessCentralProps) {
  const [programs, setPrograms] = useKV<WellnessProgram[]>(getSyncKey(userId, 'wellnessPrograms'), [])
  const [checkIns, setCheckIns] = useKV<WellnessCheckIn[]>(getSyncKey(userId, 'wellnessCheckIns'), [])
  const [dayActions, setDayActions] = useKV<WellnessDayAction[]>(getSyncKey(userId, 'wellnessDayActions'), [])
  
  const [showProgramDialog, setShowProgramDialog] = useState(false)
  const [showCheckInDialog, setShowCheckInDialog] = useState(false)
  
  // Estado para insight dialog após check-in
  const [insightOpen, setInsightOpen] = useState(false)
  const [lastSavedCheckIn, setLastSavedCheckIn] = useState<WellnessCheckIn | null>(null)
  const [lastInsight, setLastInsight] = useState<CheckInInsight | null>(null)

  const today = getDateKey(new Date())
  const todayCheckIn = (checkIns || []).find(c => c.date === today)

  /**
   * Calcula o dia atual do programa baseado na diferença de datas
   * Retorna valor entre 1 e program.duration
   */
  const computeProgramDay = useCallback((program: WellnessProgram): number => {
    const daysSinceStart = daysBetweenDateKeys(program.startDate, today)
    // Dia 1 é o dia de início, então somamos 1
    const computedDay = daysSinceStart + 1
    // Clamp entre 1 e duration
    return Math.max(1, Math.min(computedDay, program.duration))
  }, [today])

  /**
   * Verifica se programa deve ser marcado como concluído
   */
  const isProgramCompleted = useCallback((program: WellnessProgram): boolean => {
    const daysSinceStart = daysBetweenDateKeys(program.startDate, today)
    return daysSinceStart >= program.duration
  }, [today])

  /**
   * Garante que existem ações para o dia atual do programa
   */
  const ensureDayActions = useCallback((program: WellnessProgram, day: number): WellnessDayAction[] => {
    const existingActions = (dayActions || []).filter(
      a => a.programId === program.id && a.day === day
    )

    // Se já existem ações para este dia, não criar novas
    if (existingActions.length > 0) {
      return []
    }

    // Criar ações para o dia
    const actionStrings = getWellnessProgramActions(program.type, day)
    const now = Date.now()
    
    return actionStrings.map((action, index) => ({
      id: `${program.id}-day${day}-${index}`,
      userId,
      programId: program.id,
      day,
      action,
      completed: false,
      createdAt: now,
      updatedAt: now,
    }))
  }, [dayActions, userId])

  /**
   * Effect para atualizar progressão diária dos programas
   * Roda quando central abre e quando programs mudam
   */
  useEffect(() => {
    if (!programs || programs.length === 0) return

    let hasChanges = false
    const newDayActions: WellnessDayAction[] = []
    
    const updatedPrograms = programs.map(program => {
      if (!program.isActive) return program

      // Verificar se programa deve ser concluído
      if (isProgramCompleted(program)) {
        hasChanges = true
        return updateTimestamp({
          ...program,
          isActive: false,
          currentDay: program.duration,
        })
      }

      // Calcular dia atual
      const computedDay = computeProgramDay(program)
      
      // Atualizar currentDay se diferente
      if (program.currentDay !== computedDay) {
        hasChanges = true
        
        // Criar ações do novo dia
        const actionsToCreate = ensureDayActions(program, computedDay)
        newDayActions.push(...actionsToCreate)
        
        return updateTimestamp({
          ...program,
          currentDay: computedDay,
        })
      }

      // Mesmo que currentDay não mude, garantir que ações existem
      const actionsToCreate = ensureDayActions(program, computedDay)
      if (actionsToCreate.length > 0) {
        newDayActions.push(...actionsToCreate)
      }

      return program
    })

    // Atualizar estados apenas se houver mudanças
    if (hasChanges) {
      setPrograms(updatedPrograms)
    }
    
    if (newDayActions.length > 0) {
      setDayActions(current => [...(current || []), ...newDayActions])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ensureDayActions/setPrograms/setDayActions are stable setters; including them would cause an infinite loop
  }, [programs, today, computeProgramDay, isProgramCompleted])

  const handleAddProgram = (program: WellnessProgram) => {
    setPrograms((current) => [...(current || []), program])
    
    // Criar ações do dia 1
    const actions = getWellnessProgramActions(program.type, 1)
    const now = Date.now()
    const newDayActions = actions.map((action, index) => ({
      id: `${program.id}-day1-${index}`,
      userId,
      programId: program.id,
      day: 1,
      action,
      completed: false,
      createdAt: now,
      updatedAt: now,
    }))
    setDayActions((current) => [...(current || []), ...newDayActions])
    
    toast.success('Programa iniciado')
  }

  /**
   * Upsert de check-in: substitui se já existe para hoje, senão adiciona
   * Após salvar, abre o modal de insight com recomendações
   */
  const handleSaveCheckIn = (checkIn: WellnessCheckIn) => {
    setCheckIns((current) => {
      const existing = (current || []).filter(c => c.date !== checkIn.date)
      return [...existing, checkIn]
    })
    
    // Gerar insight e abrir modal
    setLastSavedCheckIn(checkIn)
    setLastInsight(getCheckInInsight(checkIn))
    setInsightOpen(true)
  }

  const handleEditFromInsight = () => {
    setInsightOpen(false)
    setShowCheckInDialog(true)
  }

  const handleToggleAction = (actionId: string) => {
    setDayActions((current) => 
      (current || []).map((action) =>
        action.id === actionId
          ? {
              ...action,
              completed: !action.completed,
              completedAt: !action.completed ? Date.now() : undefined,
              updatedAt: Date.now(),
            }
          : action
      )
    )
  }

  const activePrograms = (programs || []).filter(p => p.isActive)
  const totalCheckIns = (checkIns || []).length

  return (
    <div className="space-y-6 pb-24 px-4 max-w-5xl mx-auto pt-4 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="text-primary" size={24} weight="duotone" />
          <h1 className="text-lg font-semibold">Bem-estar</h1>
        </div>
      </div>

      {/* KPI Row */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide md:grid md:grid-cols-3 [&>*]:flex-shrink-0 [&>*]:min-w-[140px] [&>*]:md:min-w-0">
        <KpiTile
          icon={<Fire size={20} weight="duotone" />}
          value={activePrograms.length}
          label="Programas ativos"
          tone={activePrograms.length > 0 ? 'success' : 'default'}
        />
        <KpiTile
          icon={<Calendar size={20} weight="duotone" />}
          value={totalCheckIns}
          label="Check-ins"
        />
        <KpiTile
          icon={<CheckCircle size={20} weight="duotone" />}
          value={todayCheckIn ? '✓' : '—'}
          label="Check-in hoje"
          tone={todayCheckIn ? 'success' : 'default'}
        />
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button onClick={() => setShowProgramDialog(true)} className="w-full min-h-[48px]">
          <Plus className="mr-2" size={18} />
          Novo Programa
        </Button>
        <Button 
          onClick={() => setShowCheckInDialog(true)} 
          variant={todayCheckIn ? 'outline' : 'default'}
          className="w-full min-h-[48px]"
        >
          <Calendar className="mr-2" size={18} />
          {todayCheckIn ? 'Editar Check-in' : 'Check-in Diário'}
        </Button>
      </div>

      {/* Programas */}
      {activePrograms.length === 0 ? (
        <SectionCard
          title="Programas"
          icon={<Heart size={18} weight="duotone" />}
        >
          <EmptyState
            icon={<Heart size={24} />}
            title="Nenhum programa ativo"
            description="Inicie um programa de 7, 14 ou 30 dias para desenvolver hábitos saudáveis"
            action={
              <Button size="sm" variant="outline" onClick={() => setShowProgramDialog(true)}>
                Iniciar programa
                <ArrowRight size={14} className="ml-1" />
              </Button>
            }
          />
        </SectionCard>
      ) : (
        activePrograms.map((program) => {
          const ProgramIcon = getProgramIcon(program.type)
          const programActions = (dayActions || []).filter(
            a => a.programId === program.id && a.day === program.currentDay
          )
          const completedActions = programActions.filter(a => a.completed).length
          const totalActions = programActions.length
          const progressPercent = totalActions > 0 
            ? (completedActions / totalActions) * 100 
            : 0
          const isDayComplete = totalActions > 0 && completedActions === totalActions

          return (
            <SectionCard
              key={program.id}
              title={getProgramTitle(program.type)}
              icon={<ProgramIcon size={18} weight="duotone" />}
              action={
                <span className="text-xs text-muted-foreground">
                  Dia {program.currentDay}/{program.duration}
                </span>
              }
            >
              <Progress value={progressPercent} className="mb-3" />
              
              {isDayComplete ? (
                <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg text-center justify-center">
                  <Confetti size={20} className="text-primary" weight="fill" />
                  <span className="text-sm font-medium text-primary">
                    Dia concluído! 🎉 Volte amanhã.
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-3">
                    Complete as micro-ações do dia. Amanhã o Acorda gera novas ações automaticamente.
                  </p>
                  <div className="space-y-2" role="group" aria-label="Ações do dia">
                    {programActions.map((action) => (
                      <button
                        type="button"
                        key={action.id}
                        role="checkbox"
                        aria-checked={action.completed}
                        className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors min-h-[48px] w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        onClick={() => handleToggleAction(action.id)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault()
                            handleToggleAction(action.id)
                          }
                        }}
                      >
                        {action.completed ? (
                          <CheckCircle size={20} className="text-primary flex-shrink-0 mt-0.5" weight="fill" />
                        ) : (
                          <Circle size={20} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {action.action}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </SectionCard>
          )
        })
      )}

      {/* Nota */}
      <SectionCard
        title="Nota Importante"
        icon={<Heart size={18} weight="duotone" />}
        variant="muted"
      >
        <p className="text-sm text-muted-foreground">
          Os programas de bem-estar são sugestões baseadas em práticas saudáveis comuns.
          Este não é um conselho médico profissional. Consulte um profissional de saúde para orientações personalizadas.
        </p>
      </SectionCard>

      <WellnessProgramDialog
        open={showProgramDialog}
        onOpenChange={setShowProgramDialog}
        userId={userId}
        onSave={handleAddProgram}
      />

      <CheckInDialog
        open={showCheckInDialog}
        onOpenChange={setShowCheckInDialog}
        userId={userId}
        onSave={handleSaveCheckIn}
        initialCheckIn={todayCheckIn || null}
      />

      <CheckInInsightDialog
        open={insightOpen}
        onOpenChange={setInsightOpen}
        insight={lastInsight}
        checkIn={lastSavedCheckIn}
        onEdit={handleEditFromInsight}
      />
    </div>
  )
}
