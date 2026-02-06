import { Moon, DeviceMobile, SunHorizon, Target } from '@phosphor-icons/react'
import type { WellnessProgramType } from '@/lib/types'
import type { Icon } from '@phosphor-icons/react'

export interface ProgramInfo {
  icon: Icon
  title: string
  description: string
}

export const PROGRAM_INFO: Record<WellnessProgramType, ProgramInfo> = {
  sleep: {
    icon: Moon,
    title: 'Rotina de Sono',
    description: 'Melhore a qualidade do seu sono com hábitos saudáveis',
  },
  screen_time: {
    icon: DeviceMobile,
    title: 'Redução de Tela',
    description: 'Diminua o tempo em dispositivos e recupere seu foco',
  },
  morning_routine: {
    icon: SunHorizon,
    title: 'Rotina Matinal',
    description: 'Comece o dia com energia e propósito',
  },
  focus: {
    icon: Target,
    title: 'Foco e Concentração',
    description: 'Desenvolva habilidades de foco profundo',
  },
}

export function getProgramTitle(type: WellnessProgramType): string {
  return PROGRAM_INFO[type]?.title || type.replace('_', ' ')
}

export function getProgramIcon(type: WellnessProgramType): Icon {
  return PROGRAM_INFO[type]?.icon || Moon
}
