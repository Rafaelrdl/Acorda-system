/**
 * Sugestões de hábitos pré-definidas para novos usuários
 * Cada sugestão inclui: id, title, emoji, cadence, e targets opcionais
 */

export interface HabitSuggestion {
  id: string
  title: string
  emoji?: string
  cadence: 'daily' | 'weekly'
  targetMinutes?: number
  description?: string
}

export const HABIT_SUGGESTIONS: HabitSuggestion[] = [
  {
    id: 'water-daily',
    title: 'Beber água',
    emoji: '💧',
    cadence: 'daily',
    description: 'Manter-se hidratado durante o dia'
  },
  {
    id: 'walk-daily',
    title: 'Caminhada 10 min',
    emoji: '🚶',
    cadence: 'daily',
    targetMinutes: 10,
    description: 'Caminhada leve ou moderada'
  },
  {
    id: 'meditate-daily',
    title: 'Meditar 5 min',
    emoji: '🧘',
    cadence: 'daily',
    targetMinutes: 5,
    description: 'Meditação ou respiração consciente'
  },
  {
    id: 'read-daily',
    title: 'Ler 10 min',
    emoji: '📖',
    cadence: 'daily',
    targetMinutes: 10,
    description: 'Leitura de livro, artigo ou conteúdo interessante'
  },
  {
    id: 'journal-daily',
    title: 'Diário 2 min',
    emoji: '✍️',
    cadence: 'daily',
    targetMinutes: 2,
    description: 'Anotar pensamentos ou reflexões'
  },
  {
    id: 'stretch-daily',
    title: 'Alongar',
    emoji: '🧘‍♂️',
    cadence: 'daily',
    description: 'Alongamentos simples para flexibilidade'
  },
  {
    id: 'sleep-early-daily',
    title: 'Dormir cedo',
    emoji: '🌙',
    cadence: 'daily',
    description: 'Manter uma rotina regular de sono'
  },
  {
    id: 'organize-daily',
    title: 'Organizar 10 min',
    emoji: '🧹',
    cadence: 'daily',
    targetMinutes: 10,
    description: 'Organizar um pequeno espaço ou tarefa'
  },
  {
    id: 'gratitude-daily',
    title: 'Gratidão',
    emoji: '🙏',
    cadence: 'daily',
    description: 'Refletir sobre coisas pelas quais é grato'
  },
  {
    id: 'exercise-weekly',
    title: 'Exercício',
    emoji: '💪',
    cadence: 'weekly',
    description: 'Atividade física regular'
  }
]
