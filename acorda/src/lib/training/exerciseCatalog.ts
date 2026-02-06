import type { MuscleGroup } from '@/lib/types'

/**
 * Categoria do exercício para agrupamento
 */
export type ExerciseCategory = 'composto' | 'isolador' | 'acessorio'

/**
 * Tipos de equipamento padronizados
 */
export type EquipmentType = 
  | 'Barra' 
  | 'Halteres' 
  | 'Máquina' 
  | 'Cabo' 
  | 'Peso corporal' 
  | 'Outro'

/**
 * Lista de equipamentos para filtros
 */
export const EQUIPMENT_OPTIONS: { value: EquipmentType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'Barra', label: 'Barra' },
  { value: 'Halteres', label: 'Halteres' },
  { value: 'Máquina', label: 'Máquina' },
  { value: 'Cabo', label: 'Cabo' },
  { value: 'Peso corporal', label: 'Peso corporal' },
]

/**
 * Template de exercício do catálogo sugerido
 */
export interface ExerciseTemplate {
  name: string
  muscleGroup: MuscleGroup
  equipment?: string
  category?: ExerciseCategory
}

/**
 * Mapeia equipamento livre para tipo padronizado (para filtro)
 */
export function getEquipmentType(equipment?: string): EquipmentType | null {
  if (!equipment) return null
  const lower = equipment.toLowerCase()
  
  if (lower.includes('barra') || lower.includes('ez')) return 'Barra'
  if (lower.includes('halter')) return 'Halteres'
  if (lower.includes('máquina') || lower.includes('maquina')) return 'Máquina'
  if (lower.includes('cabo') || lower.includes('polia')) return 'Cabo'
  if (lower.includes('peso corporal') || lower.includes('corporal')) return 'Peso corporal'
  
  return 'Outro'
}

/**
 * Catálogo padrão de exercícios sugeridos de musculação
 * Agrupados por grupo muscular, com equipamento e categoria
 */
export const DEFAULT_EXERCISE_CATALOG: ExerciseTemplate[] = [
  // ===== PEITO =====
  // Compostos
  { name: 'Supino reto', muscleGroup: 'chest', equipment: 'Barra', category: 'composto' },
  { name: 'Supino inclinado', muscleGroup: 'chest', equipment: 'Barra', category: 'composto' },
  { name: 'Supino declinado', muscleGroup: 'chest', equipment: 'Barra', category: 'composto' },
  { name: 'Supino reto com halteres', muscleGroup: 'chest', equipment: 'Halteres', category: 'composto' },
  { name: 'Supino inclinado com halteres', muscleGroup: 'chest', equipment: 'Halteres', category: 'composto' },
  { name: 'Flexão de braço', muscleGroup: 'chest', equipment: 'Peso corporal', category: 'composto' },
  { name: 'Paralelas para peito', muscleGroup: 'chest', equipment: 'Peso corporal', category: 'composto' },
  // Isoladores
  { name: 'Crucifixo', muscleGroup: 'chest', equipment: 'Halteres', category: 'isolador' },
  { name: 'Crucifixo inclinado', muscleGroup: 'chest', equipment: 'Halteres', category: 'isolador' },
  { name: 'Crossover', muscleGroup: 'chest', equipment: 'Cabo', category: 'isolador' },
  { name: 'Peck deck', muscleGroup: 'chest', equipment: 'Máquina', category: 'isolador' },
  { name: 'Pullover', muscleGroup: 'chest', equipment: 'Halteres', category: 'isolador' },
  
  // ===== COSTAS =====
  // Compostos
  { name: 'Barra fixa', muscleGroup: 'back', equipment: 'Peso corporal', category: 'composto' },
  { name: 'Remada curvada', muscleGroup: 'back', equipment: 'Barra', category: 'composto' },
  { name: 'Remada cavalinho', muscleGroup: 'back', equipment: 'Máquina', category: 'composto' },
  { name: 'Remada unilateral', muscleGroup: 'back', equipment: 'Halteres', category: 'composto' },
  { name: 'Levantamento terra', muscleGroup: 'back', equipment: 'Barra', category: 'composto' },
  // Isoladores/Acessórios
  { name: 'Pulldown', muscleGroup: 'back', equipment: 'Cabo', category: 'isolador' },
  { name: 'Puxada frontal', muscleGroup: 'back', equipment: 'Cabo', category: 'isolador' },
  { name: 'Remada baixa', muscleGroup: 'back', equipment: 'Cabo', category: 'isolador' },
  { name: 'Pulldown triângulo', muscleGroup: 'back', equipment: 'Cabo', category: 'isolador' },
  { name: 'Serrátil no cabo', muscleGroup: 'back', equipment: 'Cabo', category: 'acessorio' },
  
  // ===== OMBROS =====
  // Compostos
  { name: 'Desenvolvimento com barra', muscleGroup: 'shoulders', equipment: 'Barra', category: 'composto' },
  { name: 'Desenvolvimento com halteres', muscleGroup: 'shoulders', equipment: 'Halteres', category: 'composto' },
  { name: 'Desenvolvimento Arnold', muscleGroup: 'shoulders', equipment: 'Halteres', category: 'composto' },
  { name: 'Desenvolvimento na máquina', muscleGroup: 'shoulders', equipment: 'Máquina', category: 'composto' },
  // Isoladores
  { name: 'Elevação lateral', muscleGroup: 'shoulders', equipment: 'Halteres', category: 'isolador' },
  { name: 'Elevação lateral no cabo', muscleGroup: 'shoulders', equipment: 'Cabo', category: 'isolador' },
  { name: 'Elevação frontal', muscleGroup: 'shoulders', equipment: 'Halteres', category: 'isolador' },
  { name: 'Face pull', muscleGroup: 'shoulders', equipment: 'Cabo', category: 'isolador' },
  { name: 'Crucifixo inverso', muscleGroup: 'shoulders', equipment: 'Máquina', category: 'isolador' },
  { name: 'Encolhimento', muscleGroup: 'shoulders', equipment: 'Halteres', category: 'acessorio' },
  
  // ===== BÍCEPS =====
  // Compostos
  { name: 'Rosca direta', muscleGroup: 'biceps', equipment: 'Barra', category: 'composto' },
  { name: 'Rosca direta EZ', muscleGroup: 'biceps', equipment: 'Barra', category: 'composto' },
  // Isoladores
  { name: 'Rosca alternada', muscleGroup: 'biceps', equipment: 'Halteres', category: 'isolador' },
  { name: 'Rosca martelo', muscleGroup: 'biceps', equipment: 'Halteres', category: 'isolador' },
  { name: 'Rosca concentrada', muscleGroup: 'biceps', equipment: 'Halteres', category: 'isolador' },
  { name: 'Rosca Scott', muscleGroup: 'biceps', equipment: 'Barra', category: 'isolador' },
  { name: 'Rosca no cabo', muscleGroup: 'biceps', equipment: 'Cabo', category: 'isolador' },
  { name: 'Rosca 21', muscleGroup: 'biceps', equipment: 'Barra', category: 'isolador' },
  
  // ===== TRÍCEPS =====
  // Compostos
  { name: 'Supino fechado', muscleGroup: 'triceps', equipment: 'Barra', category: 'composto' },
  { name: 'Paralelas para tríceps', muscleGroup: 'triceps', equipment: 'Peso corporal', category: 'composto' },
  // Isoladores
  { name: 'Tríceps testa', muscleGroup: 'triceps', equipment: 'Barra', category: 'isolador' },
  { name: 'Tríceps corda', muscleGroup: 'triceps', equipment: 'Cabo', category: 'isolador' },
  { name: 'Tríceps pulley', muscleGroup: 'triceps', equipment: 'Cabo', category: 'isolador' },
  { name: 'Tríceps francês', muscleGroup: 'triceps', equipment: 'Halteres', category: 'isolador' },
  { name: 'Tríceps coice', muscleGroup: 'triceps', equipment: 'Halteres', category: 'isolador' },
  { name: 'Tríceps banco', muscleGroup: 'triceps', equipment: 'Peso corporal', category: 'isolador' },
  
  // ===== QUADRÍCEPS =====
  // Compostos
  { name: 'Agachamento livre', muscleGroup: 'quadriceps', equipment: 'Barra', category: 'composto' },
  { name: 'Agachamento frontal', muscleGroup: 'quadriceps', equipment: 'Barra', category: 'composto' },
  { name: 'Leg press 45', muscleGroup: 'quadriceps', equipment: 'Máquina', category: 'composto' },
  { name: 'Leg press horizontal', muscleGroup: 'quadriceps', equipment: 'Máquina', category: 'composto' },
  { name: 'Hack squat', muscleGroup: 'quadriceps', equipment: 'Máquina', category: 'composto' },
  { name: 'Avanço', muscleGroup: 'quadriceps', equipment: 'Halteres', category: 'composto' },
  { name: 'Passada', muscleGroup: 'quadriceps', equipment: 'Halteres', category: 'composto' },
  // Isoladores
  { name: 'Cadeira extensora', muscleGroup: 'quadriceps', equipment: 'Máquina', category: 'isolador' },
  { name: 'Agachamento búlgaro', muscleGroup: 'quadriceps', equipment: 'Halteres', category: 'isolador' },
  { name: 'Sissy squat', muscleGroup: 'quadriceps', equipment: 'Peso corporal', category: 'isolador' },
  
  // ===== POSTERIOR DE COXA =====
  // Compostos
  { name: 'Terra romeno', muscleGroup: 'hamstrings', equipment: 'Barra', category: 'composto' },
  { name: 'Stiff', muscleGroup: 'hamstrings', equipment: 'Barra', category: 'composto' },
  { name: 'Good morning', muscleGroup: 'hamstrings', equipment: 'Barra', category: 'composto' },
  // Isoladores
  { name: 'Mesa flexora', muscleGroup: 'hamstrings', equipment: 'Máquina', category: 'isolador' },
  { name: 'Flexora deitado', muscleGroup: 'hamstrings', equipment: 'Máquina', category: 'isolador' },
  { name: 'Flexora em pé', muscleGroup: 'hamstrings', equipment: 'Máquina', category: 'isolador' },
  { name: 'Nordic curl', muscleGroup: 'hamstrings', equipment: 'Peso corporal', category: 'isolador' },
  
  // ===== GLÚTEOS =====
  // Compostos
  { name: 'Hip thrust', muscleGroup: 'glutes', equipment: 'Barra', category: 'composto' },
  { name: 'Afundo búlgaro', muscleGroup: 'glutes', equipment: 'Halteres', category: 'composto' },
  { name: 'Agachamento sumô', muscleGroup: 'glutes', equipment: 'Halteres', category: 'composto' },
  // Isoladores
  { name: 'Glute bridge', muscleGroup: 'glutes', equipment: 'Peso corporal', category: 'isolador' },
  { name: 'Abdução de quadril', muscleGroup: 'glutes', equipment: 'Máquina', category: 'isolador' },
  { name: 'Kickback no cabo', muscleGroup: 'glutes', equipment: 'Cabo', category: 'isolador' },
  { name: 'Elevação pélvica', muscleGroup: 'glutes', equipment: 'Peso corporal', category: 'isolador' },
  { name: 'Coice na máquina', muscleGroup: 'glutes', equipment: 'Máquina', category: 'isolador' },
  
  // ===== PANTURRILHA =====
  { name: 'Panturrilha em pé', muscleGroup: 'calves', equipment: 'Máquina', category: 'isolador' },
  { name: 'Panturrilha sentado', muscleGroup: 'calves', equipment: 'Máquina', category: 'isolador' },
  { name: 'Panturrilha no leg press', muscleGroup: 'calves', equipment: 'Máquina', category: 'isolador' },
  { name: 'Panturrilha unilateral', muscleGroup: 'calves', equipment: 'Peso corporal', category: 'isolador' },
  
  // ===== CORE =====
  // Compostos/Estabilizadores
  { name: 'Prancha', muscleGroup: 'core', equipment: 'Peso corporal', category: 'composto' },
  { name: 'Prancha lateral', muscleGroup: 'core', equipment: 'Peso corporal', category: 'composto' },
  { name: 'Dead bug', muscleGroup: 'core', equipment: 'Peso corporal', category: 'composto' },
  // Isoladores
  { name: 'Abdominal crunch', muscleGroup: 'core', equipment: 'Peso corporal', category: 'isolador' },
  { name: 'Abdominal infra', muscleGroup: 'core', equipment: 'Peso corporal', category: 'isolador' },
  { name: 'Elevação de pernas', muscleGroup: 'core', equipment: 'Peso corporal', category: 'isolador' },
  { name: 'Russian twist', muscleGroup: 'core', equipment: 'Peso corporal', category: 'isolador' },
  { name: 'Abdominal na roda', muscleGroup: 'core', equipment: 'Máquina', category: 'isolador' },
  { name: 'Abdominal no cabo', muscleGroup: 'core', equipment: 'Cabo', category: 'isolador' },
  
  // ===== ANTEBRAÇO =====
  { name: 'Rosca de punho', muscleGroup: 'forearms', equipment: 'Barra', category: 'isolador' },
  { name: 'Rosca inversa', muscleGroup: 'forearms', equipment: 'Barra', category: 'isolador' },
  { name: 'Farmer walk', muscleGroup: 'forearms', equipment: 'Halteres', category: 'composto' },
  
  // ===== CORPO INTEIRO =====
  { name: 'Clean and press', muscleGroup: 'full_body', equipment: 'Barra', category: 'composto' },
  { name: 'Burpee', muscleGroup: 'full_body', equipment: 'Peso corporal', category: 'composto' },
  { name: 'Thruster', muscleGroup: 'full_body', equipment: 'Halteres', category: 'composto' },
  { name: 'Snatch', muscleGroup: 'full_body', equipment: 'Barra', category: 'composto' },
  { name: 'Turkish get-up', muscleGroup: 'full_body', equipment: 'Halteres', category: 'composto' },
  
  // ===== CARDIO =====
  { name: 'Corrida na esteira', muscleGroup: 'cardio', equipment: 'Máquina', category: 'composto' },
  { name: 'Bicicleta ergométrica', muscleGroup: 'cardio', equipment: 'Máquina', category: 'composto' },
  { name: 'Pular corda', muscleGroup: 'cardio', equipment: 'Peso corporal', category: 'composto' },
  { name: 'Remador', muscleGroup: 'cardio', equipment: 'Máquina', category: 'composto' },
  { name: 'Elíptico', muscleGroup: 'cardio', equipment: 'Máquina', category: 'composto' },
]

/**
 * Labels para categorias
 */
export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  composto: 'Compostos',
  isolador: 'Isoladores',
  acessorio: 'Acessórios',
}

/**
 * Ordem de prioridade das categorias
 */
export const CATEGORY_ORDER: ExerciseCategory[] = ['composto', 'isolador', 'acessorio']

/**
 * Agrupa exercícios por categoria
 */
export function groupByCategory(exercises: ExerciseTemplate[]): Map<ExerciseCategory | 'outros', ExerciseTemplate[]> {
  const groups = new Map<ExerciseCategory | 'outros', ExerciseTemplate[]>()
  
  for (const ex of exercises) {
    const cat = ex.category || 'outros'
    if (!groups.has(cat)) {
      groups.set(cat, [])
    }
    groups.get(cat)!.push(ex)
  }
  
  return groups
}

