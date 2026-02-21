import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StudySession } from '@/lib/types'
import { Plus, Trash, Warning } from '@phosphor-icons/react'

interface SelfTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: StudySession
  initialQuestions?: string[]
  onSave: (questions: string[]) => void
}

const MIN_QUESTIONS = 3
const MAX_QUESTIONS = 5

export function SelfTestDialog({
  open,
  onOpenChange,
  session: _session,
  initialQuestions = [],
  onSave,
}: SelfTestDialogProps) {
  const [questions, setQuestions] = useState<string[]>(
    initialQuestions.length > 0 ? initialQuestions : ['', '', ''] // Começar com 3 campos
  )

  // Reset quando o dialog abre com novas initialQuestions
  useEffect(() => {
    if (open) {
      setQuestions(initialQuestions.length > 0 ? initialQuestions : ['', '', ''])
    }
  }, [open, initialQuestions])

  const validQuestions = questions.filter(q => q.trim())
  const canSave = validQuestions.length >= MIN_QUESTIONS

  const handleAddQuestion = () => {
    if (questions.length < MAX_QUESTIONS) {
      setQuestions([...questions, ''])
    }
  }

  const handleUpdateQuestion = (index: number, value: string) => {
    const updated = [...questions]
    updated[index] = value
    setQuestions(updated)
  }

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > MIN_QUESTIONS) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const handleSave = () => {
    if (!canSave) return
    onSave(validQuestions)
    onOpenChange(false)
  }

  const handleSkip = () => {
    onSave([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Perguntas de Auto-teste</DialogTitle>
          <DialogDescription>
            A recuperação ativa é uma das formas mais eficazes de fixar conteúdo
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div key={index} className="flex gap-2 items-center">
                <span className={`text-sm font-medium w-5 ${question.trim() ? 'text-primary' : 'text-muted-foreground'}`}>
                  {index + 1}.
                </span>
                <Input
                  value={question}
                  onChange={(e) => handleUpdateQuestion(index, e.target.value)}
                  placeholder={`Pergunta ${index + 1}${index < MIN_QUESTIONS ? ' *' : ''}`}
                  className="flex-1"
                  aria-label={`Pergunta ${index + 1}`}
                />
                {questions.length > MIN_QUESTIONS && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveQuestion(index)}
                  >
                    <Trash size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {questions.length < MAX_QUESTIONS && (
            <Button variant="outline" onClick={handleAddQuestion} className="w-full">
              <Plus size={16} className="mr-2" />
              Adicionar Pergunta
            </Button>
          )}

          {/* Feedback de validação */}
          {!canSave && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
              <Warning size={16} />
              <span>Preencha pelo menos {MIN_QUESTIONS} perguntas para salvar</span>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="ghost" onClick={handleSkip}>
              Pular
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              Salvar Perguntas ({validQuestions.length}/{MIN_QUESTIONS})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
