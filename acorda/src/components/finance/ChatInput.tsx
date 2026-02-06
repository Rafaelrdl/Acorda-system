import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { UserId } from '@/lib/types'
import { Transaction, FinanceCategory, FinanceAccount, FinanceAuditLog } from '@/lib/types'
import { createTransaction, createFinanceAuditLog, formatCurrency, getDateKey } from '@/lib/helpers'
import { PaperPlaneRight, Microphone, X, PencilSimple, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ChatInputProps {
  userId: UserId
  categories: FinanceCategory[]
  accounts: FinanceAccount[]
  onAddTransaction: (transaction: Transaction) => void
  onAddAuditLog: (log: FinanceAuditLog) => void
}

interface SuggestedTransaction {
  amount: number
  description: string
  categoryId?: string
  date: string
  confidence: number
  originalText: string
  type: 'expense' | 'income'
}

export function ChatInput({ 
  userId, 
  categories, 
  accounts, 
  onAddTransaction,
  onAddAuditLog 
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestion, setSuggestion] = useState<SuggestedTransaction | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Navegador não suporta reconhecimento de voz')
      return
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.lang = 'pt-BR'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsRecording(true)
        toast.info('Fale agora...')
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsRecording(false)
      }

      recognition.onerror = () => {
        setIsRecording(false)
        toast.error('Erro ao capturar áudio. Digite manualmente.')
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
    } catch {
      toast.error('Erro ao ativar microfone. Digite manualmente.')
    }
  }

  const handleSubmit = async () => {
    if (!input.trim()) return

    setIsProcessing(true)

    try {
      const prompt = spark.llmPrompt`Você é um assistente de finanças pessoais. Analise o texto abaixo e extraia informações de uma transação financeira.

Texto do usuário: "${input}"

Categorias disponíveis: ${categories.map(c => `${c.name} (tipo: ${c.type})`).join(', ')}

Retorne um JSON com:
- amount (número, sempre positivo)
- description (string curta e clara)
- categoryId (string, ID da categoria mais provável ou null se não tiver certeza)
- date (string YYYY-MM-DD, use hoje se não especificado: ${getDateKey(new Date())})
- confidence (número 0-1 indicando confiança na extração)
- type (string: "expense" ou "income")

Exemplos:
"comprei um chocolate por 5 reais" → amount: 5, description: "Chocolate", categoryId: <id da categoria alimentação se existir>, type: "expense"
"recebi 100 de freelance" → amount: 100, description: "Freelance", type: "income"

Retorne APENAS o JSON, sem explicações.`

      const response = await spark.llm(prompt, 'gpt-4o-mini', true)
      const parsed = JSON.parse(response)

      const suggestedCategory = parsed.categoryId 
        ? categories.find(c => c.id === parsed.categoryId)
        : categories.find(c => 
            c.type === parsed.type && 
            c.name.toLowerCase().includes(parsed.description.toLowerCase().split(' ')[0])
          )

      setSuggestion({
        amount: Math.abs(parsed.amount),
        description: parsed.description,
        categoryId: suggestedCategory?.id,
        date: parsed.date,
        confidence: parsed.confidence,
        originalText: input,
        type: parsed.type === 'income' ? 'income' : 'expense',
      })

      onAddAuditLog(createFinanceAuditLog(
        userId,
        'ai_suggestion_generated',
        'transaction',
        'pending',
        {
          aiSuggestion: JSON.stringify(parsed),
          originalText: input,
        }
      ))

    } catch (error) {
      toast.error('Não consegui entender. Tente reformular.')
      console.error('LLM Error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSave = () => {
    if (!suggestion) return

    const defaultAccount = accounts.find(a => a.type === 'checking') || accounts[0]
    
    if (!defaultAccount) {
      toast.error('Crie uma conta primeiro nas configurações')
      return
    }

    const transaction = createTransaction(
      userId,
      suggestion.type,
      suggestion.amount,
      suggestion.date,
      defaultAccount.id,
      suggestion.description,
      {
        categoryId: suggestion.categoryId,
        aiSuggested: true,
        aiMetadata: {
          originalText: suggestion.originalText,
          confidence: suggestion.confidence,
          suggestedCategoryId: suggestion.categoryId,
        }
      }
    )

    onAddTransaction(transaction)

    onAddAuditLog(createFinanceAuditLog(
      userId,
      'transaction_saved_from_ai',
      'transaction',
      transaction.id,
      {
        aiSuggestion: JSON.stringify(suggestion),
        originalText: suggestion.originalText,
      }
    ))

    toast.success('Lançamento salvo!')
    
    setInput('')
    setSuggestion(null)
    setEditMode(false)
  }

  const handleCancel = () => {
    setSuggestion(null)
    setEditMode(false)
    setInput('')
  }

  const handleEdit = () => {
    setEditMode(true)
  }

  if (suggestion && !editMode) {
    const category = categories.find(c => c.id === suggestion.categoryId)
    
    return (
      <Card className="p-4 space-y-4 bg-accent/10 border-accent">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground">Confirme o lançamento:</p>
            <div className="space-y-1">
              <p className="font-semibold text-lg">{formatCurrency(suggestion.amount)}</p>
              <p className="text-sm">{suggestion.description}</p>
              {category && (
                <Badge variant="secondary" className="text-xs">
                  {category.name}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(suggestion.date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            {suggestion.confidence < 0.7 && (
              <p className="text-xs text-muted-foreground italic">
                Confiança média - revise os dados
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            className="flex-1"
            size="sm"
          >
            <Check className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button 
            onClick={handleEdit} 
            variant="outline"
            size="sm"
          >
            <PencilSimple className="w-4 h-4" />
          </Button>
          <Button 
            onClick={handleCancel} 
            variant="ghost"
            size="sm"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Ex: comprei um café por 8 reais"
          disabled={isProcessing || isRecording}
          className="flex-1"
        />
        
        <Button
          onClick={handleVoiceInput}
          variant={isRecording ? "default" : "outline"}
          size="icon"
          disabled={isProcessing}
        >
          <Microphone className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isProcessing || !input.trim() || isRecording}
          size="icon"
        >
          <PaperPlaneRight className="w-5 h-5" />
        </Button>
      </div>

      {isRecording && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          Ouvindo...
        </p>
      )}

      {isProcessing && (
        <p className="text-xs text-muted-foreground text-center">
          Processando...
        </p>
      )}
    </div>
  )
}
