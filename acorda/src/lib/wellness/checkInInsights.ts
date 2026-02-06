import type { WellnessCheckIn, CheckInMood } from '@/lib/types'

export type InsightTone = 'recovery' | 'light' | 'balanced' | 'boost'

export interface CheckInInsight {
  title: string
  summary: string
  bullets: string[]
  tone: InsightTone
}

// Labels para exibição
const MOOD_LABELS: Record<CheckInMood, string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
}

// Bullets base por tone
const BASE_BULLETS: Record<InsightTone, string[]> = {
  recovery: [
    'Priorize descanso e evite sobrecarga',
    'Foque apenas no essencial hoje',
    'Permita-se pausas ao longo do dia',
  ],
  light: [
    'Mantenha um ritmo mais leve',
    'Intercale atividades com descanso',
    'Não se pressione por produtividade máxima',
  ],
  balanced: [
    'Seu dia está equilibrado para tarefas moderadas',
    'Mantenha hidratação e pausas regulares',
    'Aproveite para avançar em projetos pendentes',
  ],
  boost: [
    'Ótimo momento para tarefas desafiadoras',
    'Aproveite a energia para atividades criativas',
    'Use esse impulso para metas importantes',
  ],
}

// Bullets específicos para condições críticas
const CONDITION_BULLETS = {
  sleepLow: 'Evite decisões importantes — seu sono foi insuficiente',
  energyLow: 'Prefira tarefas mais leves para preservar energia',
  moodLow: 'Seja gentil consigo mesmo — seu humor está mais baixo hoje',
}

// Títulos por tone
const TONE_TITLES: Record<InsightTone, string> = {
  recovery: 'Dia de recuperação',
  light: 'Dia mais leve',
  balanced: 'Dia equilibrado',
  boost: 'Dia de avanço',
}

/**
 * Calcula bucket de sono
 */
function getSleepBucket(sleepHours: number): 'low' | 'ok' | 'high' {
  if (sleepHours < 6) return 'low'
  if (sleepHours <= 7.5) return 'ok'
  return 'high'
}

/**
 * Converte bucket/mood para pontos (0-2)
 */
function toPoints(value: 'low' | 'ok' | 'medium' | 'high'): number {
  if (value === 'low') return 0
  if (value === 'ok' || value === 'medium') return 1
  return 2 // high
}

/**
 * Determina tone baseado no score total (0-6)
 */
function getToneFromScore(score: number): InsightTone {
  if (score <= 1) return 'recovery'
  if (score <= 3) return 'light'
  if (score === 4) return 'balanced'
  return 'boost'
}

/**
 * Gera insight personalizado baseado no check-in
 */
export function getCheckInInsight(checkIn: WellnessCheckIn): CheckInInsight {
  const sleepHours = checkIn.sleepHours ?? 7
  const energy = checkIn.energyLevel ?? 'medium'
  const mood = checkIn.mood ?? 'medium'

  // Calcular buckets e pontos
  const sleepBucket = getSleepBucket(sleepHours)
  const sleepPoints = toPoints(sleepBucket)
  const energyPoints = toPoints(energy)
  const moodPoints = toPoints(mood)
  const totalScore = sleepPoints + energyPoints + moodPoints

  // Determinar tone
  const tone = getToneFromScore(totalScore)
  const title = TONE_TITLES[tone]

  // Construir summary
  const sleepDisplay = `${sleepHours}h`
  const energyDisplay = MOOD_LABELS[energy]
  const moodDisplay = MOOD_LABELS[mood]
  const summary = `Sono: ${sleepDisplay} • Energia: ${energyDisplay} • Humor: ${moodDisplay}`

  // Construir bullets (máx 3)
  const bullets: string[] = []
  
  // Adicionar bullets condicionais por prioridade (mais crítico primeiro)
  const isSleepLow = sleepBucket === 'low'
  const isEnergyLow = energy === 'low'
  const isMoodLow = mood === 'low'

  if (isSleepLow) {
    bullets.push(CONDITION_BULLETS.sleepLow)
  }
  if (isEnergyLow && bullets.length < 3) {
    bullets.push(CONDITION_BULLETS.energyLow)
  }
  if (isMoodLow && bullets.length < 3) {
    bullets.push(CONDITION_BULLETS.moodLow)
  }

  // Completar com bullets base do tone até 3
  const baseBullets = BASE_BULLETS[tone]
  for (const bullet of baseBullets) {
    if (bullets.length >= 3) break
    // Evitar duplicatas semânticas
    if (!bullets.includes(bullet)) {
      bullets.push(bullet)
    }
  }

  return {
    title,
    summary,
    bullets: bullets.slice(0, 3),
    tone,
  }
}
