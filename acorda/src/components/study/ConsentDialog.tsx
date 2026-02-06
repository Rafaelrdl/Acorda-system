import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldCheck, Info } from '@phosphor-icons/react'

interface ConsentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConsent: (granted: boolean) => void
}

export function ConsentDialog({
  open,
  onOpenChange,
  onConsent,
}: ConsentDialogProps) {
  const [understood, setUnderstood] = useState(false)
  const [agreedProcessing, setAgreedProcessing] = useState(false)

  const handleGrant = () => {
    onConsent(true)
    onOpenChange(false)
    setUnderstood(false)
    setAgreedProcessing(false)
  }

  const handleDeny = () => {
    onConsent(false)
    onOpenChange(false)
    setUnderstood(false)
    setAgreedProcessing(false)
  }

  const canProceed = understood && agreedProcessing

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary" size={24} />
            <DialogTitle>Consentimento para Gravação e Processamento</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Para usar a funcionalidade de gravação com IA, precisamos do seu consentimento explícito.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 text-sm">
            <p className="font-medium">O que será coletado:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Transcrição do áudio da sua sessão de estudo</li>
              <li>O áudio não é armazenado permanentemente</li>
              <li>A transcrição será processada por IA para gerar resumos e perguntas</li>
            </ul>

            <p className="font-medium mt-4">Como os dados serão usados:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Apenas para gerar resumos e perguntas de estudo para você</li>
              <li>Os dados ficam associados à sua conta</li>
              <li>Você pode excluir tudo a qualquer momento na seção Privacidade</li>
            </ul>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-start gap-2">
              <Checkbox
                id="understood"
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked === true)}
              />
              <Label htmlFor="understood" className="text-sm font-normal cursor-pointer">
                Entendo que a transcrição da minha sessão será processada por IA e armazenada na minha conta
              </Label>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="agreed"
                checked={agreedProcessing}
                onCheckedChange={(checked) => setAgreedProcessing(checked === true)}
              />
              <Label htmlFor="agreed" className="text-sm font-normal cursor-pointer">
                Concordo com o processamento dos meus dados conforme descrito acima
              </Label>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={handleDeny}>
              Não Concordo
            </Button>
            <Button onClick={handleGrant} disabled={!canProceed}>
              Concordo e Continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
