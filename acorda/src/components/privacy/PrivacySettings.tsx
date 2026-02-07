import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserId } from '@/lib/types'
import { ShieldCheck, Trash, Download, Info, FileText, FileCsv } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getDateKey } from '@/lib/helpers'

interface PrivacySettingsProps {
  userId: UserId
  onDeleteAllData: () => Promise<void>
  onExportFinance: () => string
  onExportStudy: () => string
  onExportReading: () => string
}

export function PrivacySettings({
  userId: _userId,
  onDeleteAllData,
  onExportFinance,
  onExportStudy,
  onExportReading,
}: PrivacySettingsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleDelete = async () => {
    if (confirmText !== 'APAGAR') return
    try {
      await onDeleteAllData()
      setShowDeleteConfirm(false)
      setConfirmText('')
      toast.success('Todos os dados foram apagados')
    } catch (error) {
      console.error('Erro ao apagar dados:', error)
      toast.error('Erro ao apagar dados')
    }
  }

  const handleExport = (type: 'finance' | 'study' | 'reading') => {
    let data = ''
    let filename = ''
    
    try {
      switch (type) {
        case 'finance':
          data = onExportFinance()
          filename = `acorda-financas-${getDateKey(new Date())}.csv`
          break
        case 'study':
          data = onExportStudy()
          filename = `acorda-estudos-${getDateKey(new Date())}.md`
          break
        case 'reading':
          data = onExportReading()
          filename = `acorda-leitura-${getDateKey(new Date())}.md`
          break
      }

      const blob = new Blob([data], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Arquivo exportado com sucesso')
    } catch {
      toast.error('Erro ao exportar dados')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary" size={24} />
            <div>
              <CardTitle>Privacidade e Dados</CardTitle>
              <CardDescription>Gerencie seus dados pessoais</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p className="font-medium">O que é armazenado:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tarefas, metas, hábitos e calendário</li>
                  <li>Transações financeiras e categorias</li>
                  <li>Livros, anotações e highlights</li>
                  <li>Sessões de estudo e transcrições (se consentidas)</li>
                  <li>Check-ins de bem-estar</li>
                  <li>Arquivos PDF (sincronizados com o servidor para backup)</li>
                </ul>
                <p className="font-medium mt-3">O que NÃO é armazenado:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Gravações de áudio (apenas transcrições são salvas)</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download size={20} />
            Exportar Dados
          </CardTitle>
          <CardDescription>
            Baixe seus dados em formatos abertos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => handleExport('finance')}
          >
            <FileCsv className="mr-2" />
            Exportar Finanças (CSV)
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => handleExport('study')}
          >
            <FileText className="mr-2" />
            Exportar Estudos (Markdown)
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => handleExport('reading')}
          >
            <FileText className="mr-2" />
            Exportar Leitura (Markdown)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash size={20} />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Esta ação é irreversível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full"
          >
            Apagar Todos os Meus Dados
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão de Dados</DialogTitle>
            <DialogDescription>
              Esta ação apagará permanentemente todos os seus dados do sistema. Isso inclui tarefas, metas, hábitos, finanças, estudos e leituras.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Esta ação não pode ser desfeita. Considere exportar seus dados antes de continuar.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Digite <span className="font-mono font-bold">APAGAR</span> para confirmar
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite APAGAR"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirm(false)
                setConfirmText('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmText !== 'APAGAR'}
            >
              Apagar Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
