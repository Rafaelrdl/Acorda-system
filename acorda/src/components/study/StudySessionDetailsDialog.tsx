import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StudySession, Subject, ReviewScheduleItem } from '@/lib/types'
import { formatTime } from '@/lib/helpers'
import { Clock, BookOpen, ListChecks, PencilSimple, CalendarBlank, XCircle } from '@phosphor-icons/react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface StudySessionDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: StudySession | null
  subject: Subject | null
  onEditQuestions: (session: StudySession) => void
  /** Revisões futuras (não concluídas) desta sessão */
  upcomingReviews?: ReviewScheduleItem[]
  onCancelUpcomingReviews?: (sessionId: string) => void
}

export function StudySessionDetailsDialog({
  open,
  onOpenChange,
  session,
  subject,
  onEditQuestions,
  upcomingReviews,
  onCancelUpcomingReviews,
}: StudySessionDetailsDialogProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  if (!session) return null

  const hasQuestions = session.selfTestQuestions && session.selfTestQuestions.length > 0
  const futureReviewCount = upcomingReviews?.length ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen size={20} weight="duotone" className="text-primary" />
            {subject?.name || 'Sessão de Estudo'}
          </DialogTitle>
          <DialogDescription>
            Detalhes da sessão de {session.date}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Info da sessão */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock size={16} />
              <span>{formatTime(session.durationMinutes)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarBlank size={16} />
              <span>{session.date}</span>
            </div>
          </div>

          {/* Notas */}
          {session.quickNotes && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Notas</h4>
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                {session.quickNotes}
              </p>
            </div>
          )}

          {/* Perguntas de auto-teste */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ListChecks size={16} className="text-primary" />
                Perguntas de Auto-teste
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditQuestions(session)}
                className="h-7 text-xs"
              >
                <PencilSimple size={14} className="mr-1" />
                {hasQuestions ? 'Editar' : 'Adicionar'}
              </Button>
            </div>

            {hasQuestions ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  Tente responder de memória antes de verificar suas notas:
                </p>
                {session.selfTestQuestions!.map((question, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <span className="text-primary font-medium text-sm">{index + 1}.</span>
                    <span className="text-sm">{question}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-muted/20 rounded-lg">
                <ListChecks size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma pergunta cadastrada
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Adicione perguntas para praticar recuperação ativa
                </p>
              </div>
            )}
          </div>

          {/* Dica de revisão */}
          {hasQuestions && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-primary">
                💡 <strong>Dica:</strong> Tente responder cada pergunta em voz alta ou por escrito antes de consultar suas notas. Isso fortalece a memória!
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            {/* Cancelar próximas revisões */}
            {futureReviewCount > 0 && onCancelUpcomingReviews && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive h-8 text-xs"
                onClick={() => setShowCancelConfirm(true)}
              >
                <XCircle size={14} className="mr-1" />
                Cancelar revisões ({futureReviewCount})
              </Button>
            )}
            {(futureReviewCount === 0 || !onCancelUpcomingReviews) && <span />}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Confirmação de cancelamento */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar próximas revisões?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá {futureReviewCount} revisão(ões) futura(s) pendente(s) desta sessão. As revisões já concluídas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onCancelUpcomingReviews?.(session.id)
                setShowCancelConfirm(false)
              }}
            >
              Cancelar revisões
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
