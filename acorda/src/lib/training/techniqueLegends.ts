import { TechniqueType } from '@/lib/types'

export interface TechniqueLegend {
  title: string
  steps: string[]
  caution: string
}

/**
 * Legendas/instruções de como executar cada técnica avançada
 */
export const TECHNIQUE_LEGENDS: Record<Exclude<TechniqueType, 'none'>, TechniqueLegend> = {
  backoff: {
    title: 'Backoff set',
    steps: [
      'Faça 1 top set pesado com boa técnica.',
      'Reduza a carga ~20–30%.',
      'Faça 1–2 séries extras de 8–12 reps (ou perto da falha técnica).',
      'Anote a carga e reps para progredir na próxima sessão.',
    ],
    caution: 'Avançado: mantenha a técnica; pare se a execução degradar.',
  },
  
  rest_pause: {
    title: 'Rest-pause (DC)',
    steps: [
      'Escolha uma carga para ~8–12 reps (ou 11–15 em máquinas).',
      'Vá até a falha técnica.',
      'Descanse 20–30s (≈10–15 respirações profundas).',
      'Faça mais reps até a falha técnica.',
      'Descanse 20–30s e repita (total 3 mini-sets).',
    ],
    caution: 'Use em poucos exercícios; alto estresse.',
  },
  
  pulse_set: {
    title: 'Pulse set',
    steps: [
      'Use carga moderada e repetições controladas.',
      "Faça reps completas + 'pulsos' (parciais curtas) no final do movimento.",
      'Siga a sequência do seu método (ex.: 5 reps + 5 pulsos; 4 reps + 5 pulsos…).',
      "Mantenha amplitude segura e sem 'roubar' com balanço.",
    ],
    caution: 'Avançado: cuidado com articulações; reduza a carga se perder controle.',
  },
  
  widowmaker: {
    title: 'Widowmaker (20 reps)',
    steps: [
      'Escolha uma carga próxima do seu 10RM.',
      'Faça 20 reps total, com pequenas pausas de respiração se necessário.',
      "Evite re-rack/'soltar' a carga no meio (se for seguro no exercício).",
      'Foque em técnica e ritmo; objetivo é completar as 20 reps.',
    ],
    caution: 'Muito exigente: use com parcimônia (principalmente em agachamentos/leg press).',
  },
  
  bi_set: {
    title: 'Bi-set / Superset',
    steps: [
      'Faça o Exercício A e, sem descanso (ou descanso mínimo), faça o Exercício B.',
      'Descanse ao final do par e repita pelo número de séries.',
      'Ajuste as cargas para manter a técnica nos dois exercícios.',
    ],
    caution: 'Se o segundo exercício cair muito, aumente o descanso ou reduza carga.',
  },
  
  custom: {
    title: 'Técnica personalizada',
    steps: [
      'Descreva em 1–3 linhas como você executa (passo a passo).',
      'Salve para repetir igual nas próximas sessões.',
    ],
    caution: 'Dica: mantenha instruções objetivas e mensuráveis (reps/pausa).',
  },
}
