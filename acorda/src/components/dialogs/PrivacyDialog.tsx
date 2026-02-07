import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { UserId } from '@/lib/types'
import { ShieldCheck, Info, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface PrivacyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: UserId
  onDeleteAllData: () => Promise<void>
}

export function PrivacyDialog({
  open,
  onOpenChange,
  userId: _userId,
  onDeleteAllData,
}: PrivacyDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleDelete = async () => {
    if (confirmText !== 'APAGAR') return
    try {
      await onDeleteAllData()
      setShowDeleteConfirm(false)
      setConfirmText('')
      onOpenChange(false)
      toast.success('Todos os dados foram apagados')
    } catch (error) {
      console.error('Erro ao apagar dados:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao apagar dados')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck size={24} className="text-primary" />
            Privacidade e Dados
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações */}
          <Alert>
            <Info className="h-4 w-4 flex-shrink-0" />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Seus dados são privados:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Armazenados de forma isolada por usuário</li>
                  <li>Não são compartilhados com terceiros</li>
                  <li>Você pode exportar ou apagar a qualquer momento</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* O que é armazenado */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">O que armazenamos:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Tarefas, projetos e inbox</li>
              <li>• Metas e Key Results</li>
              <li>• Hábitos e registros</li>
              <li>• Blocos de calendário</li>
              <li>• Sessões Pomodoro</li>
              <li>• Dados de módulos (finanças, leitura, etc.)</li>
            </ul>
          </div>

          {/* Zona de perigo */}
          <div className="pt-4 border-t space-y-3">
            <h3 className="text-sm font-medium text-destructive">Zona de perigo</h3>
            
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full"
              >
                <Trash size={16} className="mr-2" />
                Apagar todos os meus dados
              </Button>
            ) : (
              <div className="space-y-3 p-3 rounded-lg border border-destructive/50 bg-destructive/5">
                <p className="text-sm text-destructive">
                  Esta ação apagará permanentemente todos os seus dados do servidor e deste dispositivo. É irreversível. Digite <strong>APAGAR</strong> para confirmar.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete" className="sr-only">
                    Digite APAGAR para confirmar
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="APAGAR"
                    className="text-center"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={confirmText !== 'APAGAR'}
                    className="flex-1"
                  >
                    Confirmar exclusão
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setConfirmText('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
