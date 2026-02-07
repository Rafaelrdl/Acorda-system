import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConsentDialog } from './ConsentDialog'
import type { UserId } from '@/lib/types'
import { Subject, RecordedStudySession, ConsentLog } from '@/lib/types'
import { createRecordedStudySession, createConsentLog, getDateKey } from '@/lib/helpers'
import { Microphone, FileText, Sparkle, Info } from '@phosphor-icons/react'

interface RecordedSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  subjects: Subject[]
  onSave: (session: RecordedStudySession, consentLog: ConsentLog) => void
}

export function RecordedSessionDialog({
  open,
  onOpenChange,
  userId,
  subjects,
  onSave,
}: RecordedSessionDialogProps) {
  const [showConsent, setShowConsent] = useState(false)
  const [consentGranted, setConsentGranted] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [transcription, setTranscription] = useState('')
  const [duration, setDuration] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [aiQuestions, setAiQuestions] = useState<string[]>([])

  const handleConsentDecision = (granted: boolean) => {
    setConsentGranted(granted)
    if (!granted) {
      onOpenChange(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!transcription.trim()) return

    setIsProcessing(true)
    try {
      const summaryPrompt = spark.llmPrompt`Você é um assistente de estudos. Analise a transcrição abaixo de uma sessão de estudo e gere um resumo estruturado em formato de "meeting notes":

Transcrição:
${transcription}

Gere um resumo contendo:
- Tópicos principais abordados
- Pontos-chave de cada tópico
- Próximos passos ou conceitos para aprofundar

Seja conciso e use bullet points.`

      const summary = await spark.llm(summaryPrompt, 'gpt-4o-mini')
      setAiSummary(summary)

      const questionsPrompt = spark.llmPrompt`Baseado na transcrição de estudo abaixo, gere exatamente 5 perguntas de revisão. As perguntas devem testar o conhecimento dos conceitos principais. Retorne como JSON no formato: {"questions": ["pergunta1", "pergunta2", ...]}.

Transcrição:
${transcription}`

      const questionsJson = await spark.llm(questionsPrompt, 'gpt-4o-mini', true)
      const parsed = JSON.parse(questionsJson)
      setAiQuestions(parsed.questions || [])
    } catch (error) {
      console.error('Erro ao processar com IA:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSave = () => {
    if (!subjectId || !transcription || !duration) return

    const consentLog = createConsentLog(userId, 'ai_processing', true)
    
    const session = createRecordedStudySession(
      userId,
      subjectId,
      getDateKey(new Date()),
      parseInt(duration),
      consentLog.id,
      {
        transcription,
        aiSummary: aiSummary || undefined,
        aiQuestions: aiQuestions.length > 0 ? aiQuestions : undefined,
      }
    )

    onSave(session, consentLog)
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setSubjectId('')
    setTranscription('')
    setDuration('')
    setAiSummary('')
    setAiQuestions([])
    setConsentGranted(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (open && !consentGranted) {
      setShowConsent(true)
    } else {
      onOpenChange(open)
      if (!open) resetForm()
    }
  }

  return (
    <>
      <ConsentDialog
        open={showConsent}
        onOpenChange={setShowConsent}
        onConsent={handleConsentDecision}
      />

      <Dialog open={open && consentGranted} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microphone className="text-primary" />
              Sessão de Estudo com IA
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Cole a transcrição da sua sessão de estudo ou digite notas. A IA gerará um resumo e perguntas de revisão.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Assunto</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um assunto" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration-input">Duração (minutos)</Label>
              <input
                id="duration-input"
                type="number"
                min="1"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="ex: 60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transcription">Transcrição / Notas</Label>
              <Textarea
                id="transcription"
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                placeholder="Cole a transcrição ou escreva suas notas de estudo aqui..."
                rows={8}
              />
            </div>

            {transcription && (
              <Button
                onClick={handleGenerateAI}
                disabled={isProcessing}
                variant="outline"
                className="w-full"
              >
                <Sparkle className="mr-2" />
                {isProcessing ? 'Processando com IA...' : 'Gerar Resumo e Perguntas com IA'}
              </Button>
            )}

            {aiSummary && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 font-medium">
                  <FileText size={18} />
                  Resumo Gerado
                </div>
                <div className="text-sm whitespace-pre-wrap">{aiSummary}</div>
              </div>
            )}

            {aiQuestions.length > 0 && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="font-medium">Perguntas de Revisão</div>
                <ul className="list-decimal pl-5 space-y-1 text-sm">
                  {aiQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Agenda de revisão: D+1, D+3, D+7, D+14
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!subjectId || !transcription || !duration}>
                Salvar Sessão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
