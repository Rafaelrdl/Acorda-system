import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StudySession, Subject } from '@/lib/types'
import { formatTime, filterDeleted } from '@/lib/helpers'
import { Clock, CalendarBlank, ListChecks, CaretRight, BookOpen } from '@phosphor-icons/react'

interface SubjectSessionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject | null
  sessions: StudySession[]
  onSelectSession: (session: StudySession) => void
}

export function SubjectSessionsDialog({
  open,
  onOpenChange,
  subject,
  sessions,
  onSelectSession,
}: SubjectSessionsDialogProps) {
  if (!subject) return null

  const subjectSessions = filterDeleted(sessions)
    .filter(s => s.subjectId === subject.id)
    .sort((a, b) => b.date.localeCompare(a.date)) // Mais recentes primeiro

  const totalTime = subjectSessions.reduce((acc, s) => acc + s.durationMinutes, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen size={20} weight="duotone" className="text-primary" />
            {subject.name}
          </DialogTitle>
          <DialogDescription>
            {subjectSessions.length} sessões · {formatTime(totalTime)} total
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {subjectSessions.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma sessão registrada
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Crie uma nova sessão para começar
              </p>
            </div>
          ) : (
            subjectSessions.map((session) => {
              const hasQuestions = session.selfTestQuestions && session.selfTestQuestions.length > 0
              
              return (
                <button
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session)
                    onOpenChange(false)
                  }}
                  className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarBlank size={14} />
                        <span>{session.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock size={14} />
                        <span>{formatTime(session.durationMinutes)}</span>
                      </div>
                    </div>
                    
                    {session.quickNotes && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {session.quickNotes}
                      </p>
                    )}
                    
                    {hasQuestions && (
                      <div className="flex items-center gap-1 text-xs text-primary mt-1">
                        <ListChecks size={12} />
                        <span>{session.selfTestQuestions!.length} perguntas</span>
                      </div>
                    )}
                  </div>
                  
                  <CaretRight size={16} className="text-muted-foreground flex-shrink-0" />
                </button>
              )
            })
          )}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
