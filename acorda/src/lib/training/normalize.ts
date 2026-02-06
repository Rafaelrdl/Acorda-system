/**
 * Normaliza nome de exercício para comparação
 * - lowercase
 * - trim
 * - remove acentos
 * - colapsa espaços múltiplos
 * - remove pontuação simples
 */
export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove pontuação simples
    .replace(/[.,;:!?'"()-]/g, '')
    // Colapsa espaços múltiplos
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Verifica se dois nomes de exercício são equivalentes
 */
export function areExerciseNamesEqual(name1: string, name2: string): boolean {
  return normalizeExerciseName(name1) === normalizeExerciseName(name2)
}
