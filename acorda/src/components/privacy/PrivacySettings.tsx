import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { ShieldCheck, Trash, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface PrivacySettingsProps {
  userId: UserId
  onDeleteAllData: () => Promise<void>
}

export function PrivacySettings({
  userId: _userId,
  onDeleteAllData,
}: PrivacySettingsProps) {
  const [showFirstConfirm, setShowFirstConfirm] = useState(false)
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
      toast.error(error instanceof Error ? error.message : 'Erro ao apagar dados')
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
              </div>
            </AlertDescription>
          </Alert>
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
            onClick={() => setShowFirstConfirm(true)}
            className="w-full"
          >
            Apagar Todos os Meus Dados
          </Button>
        </CardContent>
      </Card>

      {/* Primeiro modal — confirmação inicial */}
      <AlertDialog open={showFirstConfirm} onOpenChange={setShowFirstConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja apagar todos os seus dados?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os seus dados serão apagados permanentemente, incluindo tarefas, metas, hábitos, finanças, estudos, leituras, treinos e check-ins de bem-estar. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setShowFirstConfirm(false)
                setShowDeleteConfirm(true)
              }}
            >
              Sim, quero apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Segundo modal — confirmação final com digitação */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => {
        setShowDeleteConfirm(open)
        if (!open) setConfirmText('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmação Final</DialogTitle>
            <DialogDescription>
              Última chance. Após confirmar, todos os seus dados serão apagados permanentemente e não poderão ser recuperados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Esta ação não pode ser desfeita.
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
