import { useState } from 'react'
import { useKV } from '@/lib/sync-storage'
import { Button } from '@/components/ui/button'
import { SectionCard, EmptyState } from '@/components/ui/section-card'
import { KpiTile } from '@/components/ui/kpi-tile'
import { StudyMethodsTips } from './StudyMethodsTips'
import { StudySessionDialog } from './StudySessionDialog'
import { SelfTestDialog } from './SelfTestDialog'
import { StudySessionDetailsDialog } from './StudySessionDetailsDialog'
import { SubjectSessionsDialog } from './SubjectSessionsDialog'
import { StudyHelpDialog } from './StudyHelpDialog'
import type { UserId } from '@/lib/types'
import { Subject, StudySession, ReviewScheduleItem } from '@/lib/types'
import { 
  addDaysToDate, 
  createReviewScheduleItem, 
  createSubject, 
  filterDeleted, 
  formatTime, 
  getDateKey,
  getSyncKey, 
  softDelete,
  updateTimestamp 
} from '@/lib/helpers'
import { Plus, BookOpen, GraduationCap, Clock, ArrowRight, CalendarCheck, CheckCircle, Warning, Question } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface StudyCentralProps {
  userId: UserId
}

// Intervalos de revisão espaçada (em dias)
const REVIEW_INTERVALS = [1, 3, 7, 14]

export function StudyCentral({ userId }: StudyCentralProps) {
  const [subjects, setSubjects] = useKV<Subject[]>(getSyncKey(userId, 'subjects'), [])
  const [studySessions, setStudySessions] = useKV<StudySession[]>(getSyncKey(userId, 'studySessions'), [])
  const [reviewScheduleItems, setReviewScheduleItems] = useKV<ReviewScheduleItem[]>(
    getSyncKey(userId, 'reviewScheduleItems'),
    []
  )
  
  const [showSessionDialog, setShowSessionDialog] = useState(false)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  
  // Estado para auto-teste após criar sessão
  const [showSelfTestDialog, setShowSelfTestDialog] = useState(false)
  const [sessionForSelfTest, setSessionForSelfTest] = useState<StudySession | null>(null)
  
  // Estados para novos dialogs
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null)
  const [showSessionDetails, setShowSessionDetails] = useState(false)
  const [selectedSubjectForSessions, setSelectedSubjectForSessions] = useState<Subject | null>(null)
  const [showSubjectSessions, setShowSubjectSessions] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return
    const subject = createSubject(userId, newSubjectName.trim())
    setSubjects((current) => [...(current || []), subject])
    setNewSubjectName('')
    setShowAddSubject(false)
    toast.success('Assunto criado')
  }

  const handleSaveSession = (session: StudySession, scheduleReviews: boolean) => {
    setStudySessions((current) => [...(current || []), session])
    
    // Criar itens de revisão espaçada se habilitado
    if (scheduleReviews) {
      const newReviewItems = REVIEW_INTERVALS.map((days) =>
        createReviewScheduleItem(userId, session.id, addDaysToDate(session.date, days))
      )
      setReviewScheduleItems((current) => [...(current || []), ...newReviewItems])
    }
    
    toast.success('Sessão registrada')
    
    // Abrir modal de auto-teste
    setSessionForSelfTest(session)
    setShowSelfTestDialog(true)
  }

  const handleSaveSelfTestQuestions = (questions: string[]) => {
    if (!sessionForSelfTest) return
    
    setStudySessions((current) => 
      (current || []).map(s => 
        s.id === sessionForSelfTest.id 
          ? updateTimestamp({ ...s, selfTestQuestions: questions })
          : s
      )
    )
    
    if (questions.length > 0) {
      toast.success(`${questions.length} perguntas salvas`)
    }
    
    setSessionForSelfTest(null)
  }

  // Calcular estatísticas
  const currentSubjects = filterDeleted(subjects || [])
  const activeSessions = filterDeleted(studySessions || [])
  const totalStudyTime = activeSessions.reduce((acc, s) => acc + s.durationMinutes, 0)
  const totalSessions = activeSessions.length

  // Filtrar revisões pendentes
  const today = getDateKey(new Date())
  const activeReviewItems = filterDeleted(reviewScheduleItems || [])
  
  const pendingReviews = activeReviewItems
    .filter(item => !item.completed)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
  
  // Separar: hoje/atrasadas vs futuras
  const todayAndOverdue = pendingReviews.filter(item => item.scheduledDate <= today)
  const upcoming = pendingReviews.filter(item => item.scheduledDate > today).slice(0, 5)

  const handleCompleteReview = (item: ReviewScheduleItem) => {
    setReviewScheduleItems((current) => (current || []).map(existing => (
      existing.id === item.id
        ? updateTimestamp({ ...existing, completed: true, completedAt: Date.now() })
        : existing
    )))
    toast.success('Revisão concluída!')
  }

  // Função para obter o assunto de uma revisão
  const getReviewSubject = (item: ReviewScheduleItem): string => {
    // Primeiro, procurar em studySessions (fluxo novo sem IA)
    const session = activeSessions.find(s => s.id === item.recordedSessionId)
    if (session) {
      const subject = currentSubjects.find(s => s.id === session.subjectId)
      return subject?.name || 'Sessão sem assunto'
    }
    return 'Sessão sem assunto'
  }

  // Encontra a sessão associada a uma revisão
  const getSessionForReview = (item: ReviewScheduleItem): StudySession | undefined => {
    return activeSessions.find(s => s.id === item.recordedSessionId)
  }

  // Handler para abrir detalhes de uma sessão
  const handleOpenSessionDetails = (session: StudySession | undefined) => {
    if (!session) {
      toast.error('Sessão não encontrada')
      return
    }
    setSelectedSession(session)
    setShowSessionDetails(true)
  }

  // Handler para abrir sessões de um assunto
  const handleOpenSubjectSessions = (subject: Subject) => {
    setSelectedSubjectForSessions(subject)
    setShowSubjectSessions(true)
  }

  // Handler para editar perguntas de uma sessão
  const handleEditSessionQuestions = (session: StudySession) => {
    setSessionForSelfTest(session)
    setShowSelfTestDialog(true)
  }

  // Handler para cancelar revisões futuras de uma sessão
  const handleCancelUpcomingReviews = (sessionId: string) => {
    setReviewScheduleItems((current) =>
      (current || []).map(item =>
        item.recordedSessionId === sessionId && !item.completed && item.scheduledDate > today
          ? softDelete(item)
          : item
      )
    )
    toast.success('Revisões futuras canceladas')
    setShowSessionDetails(false)
    setSelectedSession(null)
  }

  // Obter revisões futuras pendentes de uma sessão
  const getUpcomingReviewsForSession = (sessionId: string) => {
    return activeReviewItems.filter(
      item => item.recordedSessionId === sessionId && !item.completed && item.scheduledDate > today
    )
  }

  return (
    <div className="space-y-6 pb-24 px-4 max-w-5xl mx-auto pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-primary" size={24} weight="duotone" />
          <h1 className="text-lg font-semibold">Estudos</h1>
        </div>
      </div>
      
      {/* KPI Row */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide md:grid md:grid-cols-3">
        <KpiTile
          icon={<Clock size={20} weight="duotone" />}
          value={formatTime(totalStudyTime)}
          label="Tempo total"
          tone={totalStudyTime >= 60 ? 'success' : 'default'}
        />
        <KpiTile
          icon={<BookOpen size={20} weight="duotone" />}
          value={currentSubjects.length}
          label="Assuntos"
        />
        <KpiTile
          icon={<GraduationCap size={20} weight="duotone" />}
          value={totalSessions}
          label="Sessões"
        />
      </div>

      {/* Ação principal */}
      <Button onClick={() => setShowSessionDialog(true)} className="w-full min-h-[48px]">
        <Plus className="mr-2" size={18} />
        Nova Sessão de Estudo
      </Button>

      {/* Revisões de Hoje */}
      <SectionCard
        title={`Revisões de hoje${todayAndOverdue.length > 0 ? ` (${todayAndOverdue.length})` : ''}`}
        icon={<CalendarCheck size={18} weight="duotone" />}
        action={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHelpDialog(true)}
            className="h-7"
            title="Como funciona?"
          >
            <Question size={14} className="mr-1" />
            Ajuda
          </Button>
        }
      >
        {todayAndOverdue.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={24} />}
            title="Nenhuma revisão pendente"
            description="Ao criar uma sessão de estudo, revisões serão agendadas automaticamente em D+1, D+3, D+7 e D+14 para fixar o conteúdo na memória de longo prazo."
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Toque em uma revisão para ver as perguntas que você criou.
            </p>
            {todayAndOverdue.map((item) => {
              const isOverdue = item.scheduledDate < today
              const session = getSessionForReview(item)
              const questionCount = session?.selfTestQuestions?.length || 0
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg min-h-[48px] transition-colors cursor-pointer ${
                    isOverdue ? 'bg-destructive/10 border border-destructive/20 hover:bg-destructive/20' : 'bg-muted/30 hover:bg-accent/50'
                  }`}
                  onClick={() => handleOpenSessionDetails(session)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenSessionDetails(session)}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {isOverdue && <Warning size={14} className="text-destructive" />}
                      <span className="text-sm font-medium">{getReviewSubject(item)}</span>
                      {questionCount > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {questionCount} pergunta{questionCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {isOverdue ? `Atrasada desde ${item.scheduledDate}` : 'Para hoje'}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCompleteReview(item)
                    }}
                  >
                    Concluir
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {/* Próximas revisões (opcional - mostra até 5) */}
      {upcoming.length > 0 && (
        <SectionCard
          title="Próximas revisões"
          icon={<CalendarCheck size={18} weight="duotone" />}
        >
          <div className="space-y-2">
            {upcoming.map((item) => {
              const session = getSessionForReview(item)
              const questionCount = session?.selfTestQuestions?.length || 0
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-muted/20 rounded-lg min-h-[44px] cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleOpenSessionDetails(session)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenSessionDetails(session)}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{getReviewSubject(item)}</span>
                      {questionCount > 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {questionCount}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{item.scheduledDate}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {/* Assuntos */}
      <SectionCard
        title="Assuntos"
        icon={<BookOpen size={18} weight="duotone" />}
        action={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddSubject(true)}
            className="h-7"
          >
            <Plus size={14} className="mr-1" />
            Novo
          </Button>
        }
      >
        {currentSubjects.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={24} />}
            title="Nenhum assunto"
            description="Adicione assuntos para organizar seus estudos. Toque em um assunto para ver todas as sessões e perguntas."
            action={
              <Button size="sm" variant="outline" onClick={() => setShowAddSubject(true)}>
                Criar assunto
                <ArrowRight size={14} className="ml-1" />
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {currentSubjects.map((subject) => {
              const subjectSessions = activeSessions.filter(s => s.subjectId === subject.id)
              const totalTime = subjectSessions.reduce((acc, s) => acc + s.durationMinutes, 0)
              const totalQuestions = subjectSessions.reduce((acc, s) => acc + (s.selfTestQuestions?.length || 0), 0)
              
              return (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg min-h-[48px] hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleOpenSubjectSessions(subject)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenSubjectSessions(subject)}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-primary" weight="duotone" />
                    <span className="font-medium text-sm">{subject.name}</span>
                    {totalQuestions > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {totalQuestions} pergunta{totalQuestions > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {subjectSessions.length} sessões · {formatTime(totalTime)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {showAddSubject && (
        <SectionCard title="Novo Assunto" icon={<Plus size={18} weight="duotone" />}>
          <div className="space-y-3">
            <input
              type="text"
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Nome do assunto"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={handleAddSubject} className="flex-1 min-h-[44px]">
                Criar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddSubject(false)
                  setNewSubjectName('')
                }}
                className="flex-1 min-h-[44px]"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      <StudyMethodsTips />

      <StudySessionDialog
        open={showSessionDialog}
        onOpenChange={setShowSessionDialog}
        userId={userId}
        subjects={currentSubjects}
        onSave={handleSaveSession}
      />

      {sessionForSelfTest && (
        <SelfTestDialog
          open={showSelfTestDialog}
          onOpenChange={(open) => {
            setShowSelfTestDialog(open)
            if (!open) setSessionForSelfTest(null)
          }}
          session={sessionForSelfTest}
          initialQuestions={sessionForSelfTest.selfTestQuestions || []}
          onSave={handleSaveSelfTestQuestions}
        />
      )}

      {/* Dialog de detalhes da sessão */}
      {selectedSession && (
        <StudySessionDetailsDialog
          open={showSessionDetails}
          onOpenChange={(open) => {
            setShowSessionDetails(open)
            if (!open) setSelectedSession(null)
          }}
          session={selectedSession}
          subject={currentSubjects.find(s => s.id === selectedSession.subjectId) || null}
          onEditQuestions={(session) => {
            setShowSessionDetails(false)
            handleEditSessionQuestions(session)
          }}
          upcomingReviews={getUpcomingReviewsForSession(selectedSession.id)}
          onCancelUpcomingReviews={handleCancelUpcomingReviews}
        />
      )}

      {/* Dialog de sessões do assunto */}
      {selectedSubjectForSessions && (
        <SubjectSessionsDialog
          open={showSubjectSessions}
          onOpenChange={(open) => {
            setShowSubjectSessions(open)
            if (!open) setSelectedSubjectForSessions(null)
          }}
          subject={selectedSubjectForSessions}
          sessions={activeSessions}
          onSelectSession={(session) => {
            setShowSubjectSessions(false)
            setSelectedSession(session)
            setShowSessionDetails(true)
          }}
        />
      )}

      {/* Dialog de ajuda */}
      <StudyHelpDialog
        open={showHelpDialog}
        onOpenChange={setShowHelpDialog}
      />
    </div>
  )
}
