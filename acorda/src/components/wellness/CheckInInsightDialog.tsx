import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { CheckInInsight } from '@/lib/wellness/checkInInsights'
import type { WellnessCheckIn } from '@/lib/types'
import { Lightbulb, CheckCircle, PencilSimple, SunHorizon, Moon, Sparkle, BatteryFull } from '@phosphor-icons/react'

interface CheckInInsightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insight: CheckInInsight | null
  checkIn: WellnessCheckIn | null
  onEdit?: () => void
}

// Ícones e cores por tone
const TONE_CONFIG = {
  recovery: {
    icon: Moon,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  light: {
    icon: SunHorizon,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  balanced: {
    icon: BatteryFull,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  boost: {
    icon: Sparkle,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
}

export function CheckInInsightDialog({
  open,
  onOpenChange,
  insight,
  checkIn,
  onEdit,
}: CheckInInsightDialogProps) {
  if (!insight || !checkIn) return null

  const config = TONE_CONFIG[insight.tone]
  const ToneIcon = config.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lightbulb size={20} className="text-primary" weight="duotone" />
            <DialogTitle>Sugestão para hoje</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Título do tone com ícone */}
          <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bg}`}>
            <ToneIcon size={24} className={config.color} weight="fill" />
            <div>
              <h3 className={`font-medium ${config.color}`}>{insight.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{insight.summary}</p>
            </div>
          </div>

          {/* Bullets */}
          <div className="space-y-2">
            {insight.bullets.map((bullet, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle size={16} className="text-primary mt-0.5 flex-shrink-0" weight="fill" />
                <p className="text-sm text-muted-foreground">{bullet}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground/70 italic">
            Estas são sugestões gerais baseadas no seu check-in. Não substituem orientação profissional.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          {onEdit && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                onEdit()
              }}
              className="flex-1 sm:flex-none"
            >
              <PencilSimple size={16} className="mr-2" />
              Editar
            </Button>
          )}
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
