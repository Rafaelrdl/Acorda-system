# Modelo de Dados do Acorda - Guia de Uso

Este documento demonstra como usar o modelo de dados solidificado do Acorda.

## Princípios Fundamentais

### 1. Isolamento por Usuário

Todas as consultas DEVEM filtrar por `userId`:

```typescript
// ✅ CORRETO
const userTasks = tasks.filter(t => t.userId === userId)

// ❌ ERRADO - vaza dados entre usuários
const allTasks = tasks

```

### 2. Timestamps Automáticos

Use as factories para garantir `createdAt` e `updatedAt`:

```typescript
// ✅ CORRETO
const task = createTask(userId, "Minha tarefa")

// ❌ ERRADO - faltam campos obrigatórios
const task = { id: generateId(), userId, title: "Minha tarefa" }

```

### 3. Atualizações com Timestamp

Sempre use `updateTimestamp` ao modificar entidades:

```typescript
// ✅ CORRETO
setTasks(current => current.map(t =>
  t.id === taskId ? updateTimestamp({ ...t, status: 'done' }) : t
))

// ❌ ERRADO - updatedAt não é atualizado
setTasks(current => current.map(t =>
  t.id === taskId ? { ...t, status: 'done' } : t
))

```

## Criando Entidades

### Inbox Item

```typescript
import { createInboxItem } from '@/lib/helpers'

const item = createInboxItem(userId, "Comprar leite")
const itemWithNotes = createInboxItem(userId, "Ligar pro médico", "Agendar checkup anual")

```

### Task

```typescript
import { createTask } from '@/lib/helpers'

// Tarefa simples
const task = createTask(userId, "Revisar código")

// Tarefa completa
const task = createTask(userId, "Preparar apresentação", {
  description: "Slides para reunião de Q1",
  status: 'next',
  tags: ['trabalho', 'urgente'],
  energyLevel: 'high',
  estimateMin: 120,
  scheduledDate: '2024-03-15',
  isTopPriority: true
})

```

### Goal + Key Results

```typescript
import { createGoal, createKeyResult } from '@/lib/helpers'

const goal = createGoal(
  userId,
  "Melhorar saúde física",
  "Estar mais disposto e saudável"
)

const kr1 = createKeyResult(userId, goal.id, "Correr 3x por semana", 12, "semanas")
const kr2 = createKeyResult(userId, goal.id, "Perder peso", 5, "kg")

```

### Habit + Logs

```typescript
import { createHabit, createHabitLog, getDateKey } from '@/lib/helpers'

// Hábito diário
const habitDaily = createHabit(userId, "Meditar 10min", 'daily')

// Hábito semanal (Segunda, Quarta, Sexta)
const habitWeekly = createHabit(userId, "Treino na academia", 'weekly', {
  targetDays: [1, 3, 5],
  description: "Musculação 1h"
})

// Registrar conclusão
const today = getDateKey(new Date())
const log = createHabitLog(userId, habitDaily.id, today, "Me senti ótimo!")

```

### Pomodoro Session

```typescript
import { createPomodoroSession } from '@/lib/helpers'

// Sessão de foco
const session = createPomodoroSession(userId, 'focus', 1500, {
  presetId: 'preset-25-5',
  taskId: 'task-123',
  interrupted: false
})

// Sessão interrompida
const interruptedSession = createPomodoroSession(userId, 'focus', 800, {
  interrupted: true
})

```

## Queries Úteis

### Tarefas de Hoje

```typescript
import { getTasksForToday } from '@/lib/queries'

const todayTasks = getTasksForToday(allTasks, new Date())
// Retorna: tarefas agendadas para hoje + top priorities

```

### Tarefas por Status GTD

```typescript
import { getTasksByStatus } from '@/lib/queries'

const nextActions = getTasksByStatus(allTasks, userId, 'next')
const waiting = getTasksByStatus(allTasks, userId, 'waiting')
const someday = getTasksByStatus(allTasks, userId, 'someday')

```

### Top 3 Prioridades

```typescript
import { getTopPriorities } from '@/lib/queries'

const top3 = getTopPriorities(allTasks, userId)
// Retorna no máximo 3 tarefas não concluídas com isTopPriority=true

```

### Agenda do Dia

```typescript
import { getCalendarBlocksForDay } from '@/lib/queries'

const todayBlocks = getCalendarBlocksForDay(allBlocks, userId, new Date())
// Retorna blocos ordenados por startTime

```

### Hábitos do Dia com Status

```typescript
import { getHabitsForDay } from '@/lib/queries'

const todayHabits = getHabitsForDay(allHabits, allLogs, userId, new Date())
// Retorna: [{ ...habit, completed: boolean }]

todayHabits.forEach(h => {
  console.log(`${h.name}: ${h.completed ? '✓' : '○'}`)
})

```

### Streak de Hábito

```typescript
import { getHabitStreak } from '@/lib/queries'

const streak = getHabitStreak(allLogs, userId, habitId)
console.log(`Você está há ${streak} dias consecutivos!`)

```

### Progresso de Meta

```typescript
import { getGoalProgress, getKeyResultProgress } from '@/lib/queries'

// Progresso de um KR específico
const krProgress = getKeyResultProgress(keyResult)
console.log(`${krProgress}% completo`)

// Progresso geral da meta (média dos KRs)
const goalProgress = getGoalProgress(goal, allKeyResults, userId)
console.log(`Meta: ${goalProgress}% completa`)

```

### Minutos Focados Hoje

```typescript
import { getTotalFocusMinutes } from '@/lib/queries'

const focusedToday = getTotalFocusMinutes(allSessions, userId, new Date())
console.log(`${focusedToday} minutos de foco profundo hoje`)

```

### Tarefas Concluídas Hoje

```typescript
import { getCompletedTasksForDay } from '@/lib/queries'

const completedToday = getCompletedTasksForDay(allTasks, userId, new Date())
console.log(`${completedToday.length} tarefas concluídas hoje`)

```

## Padrões de Atualização

### Marcar Tarefa como Concluída

```typescript
import { updateTimestamp } from '@/lib/helpers'

setTasks(current => current.map(task => {
  if (task.id === taskId) {
    return updateTimestamp({
      ...task,
      status: 'done',
      completedAt: Date.now()
    })
  }
  return task
}))

```

### Atualizar Progresso de KR

```typescript
import { updateTimestamp } from '@/lib/helpers'

setKeyResults(current => current.map(kr => {
  if (kr.id === krId) {
    return updateTimestamp({
      ...kr,
      currentValue: newValue
    })
  }
  return kr
}))

```

### Toggle Hábito

```typescript
import { createHabitLog, getDateKey } from '@/lib/helpers'

const today = getDateKey(new Date())

setHabitLogs(current => {
  const existing = current.find(log =>
    log.habitId === habitId && log.date === today
  )

  if (existing) {
    // Desmarcar
    return current.filter(log => log.id !== existing.id)
  } else {
    // Marcar como concluído
    return [...current, createHabitLog(userId, habitId, today)]
  }
})

```

## Filtragem e Ordenação

### Tarefas por Energia

```typescript
import { getActiveTasksByEnergy } from '@/lib/queries'

const lowEnergyTasks = getActiveTasksByEnergy(allTasks, userId, 'low')
const highEnergyTasks = getActiveTasksByEnergy(allTasks, userId, 'high')

```

### Tarefas de um Projeto

```typescript
import { getTasksByProject } from '@/lib/queries'

const projectTasks = getTasksByProject(allTasks, userId, projectId)

```

### Tempo Estimado Total

```typescript
import { getEstimatedTimeForTasks } from '@/lib/queries'

const totalMinutes = getEstimatedTimeForTasks(nextActions)
console.log(`Você tem ${totalMinutes} minutos de trabalho estimado`)

```

## Validações e Regras de Negócio

### Limite de Top 3

```typescript
const handleTogglePriority = (taskId: string) => {
  setTasks(current => {
    const currentPriorities = current.filter(t =>
      t.isTopPriority && t.status !== 'done'
    )
    const task = current.find(t => t.id === taskId)

    if (!task?.isTopPriority && currentPriorities.length >= 3) {
      toast.error('Você só pode ter 3 prioridades ativas')
      return current
    }

    return current.map(t =>
      t.id === taskId
        ? updateTimestamp({ ...t, isTopPriority: !t.isTopPriority })
        : t
    )
  })
}

```

### Status Transitions GTD

```typescript
// inbox → next (após processar)
// next → scheduled (ao agendar data)
// next/scheduled → waiting (aguardando alguém)
// next/waiting → someday (não é prioridade agora)
// qualquer → done (ao concluir)

const processInboxToTask = (inboxItem: InboxItem) => {
  const task = createTask(userId, inboxItem.content, {
    status: 'next'  // Sai do inbox como próxima ação
  })
  return task
}

```

## Performance e Escalabilidade

### Logs Separados

HabitLogs e PomodoroSessions são entidades separadas para evitar documentos grandes:

```typescript
// ✅ CORRETO - log separado
const log = createHabitLog(userId, habitId, date)

// ❌ ERRADO - array dentro do hábito
const habit = {
  ...habitData,
  logs: [...] // Vai crescer infinitamente!
}

```

### Filtragem no Cliente

Com dados isolados por userId, o volume é controlado:

```typescript
// Cada usuário tem seu próprio conjunto pequeno de dados
const myTasks = filterByUser(allTasks, userId)  // ~50-200 tarefas
const myHabits = filterByUser(allHabits, userId)  // ~5-20 hábitos

```
