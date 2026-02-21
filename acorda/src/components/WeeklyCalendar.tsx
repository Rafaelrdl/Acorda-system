import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { UserId } from '@/lib/types'
import { CalendarBlock, Task, Habit, GoogleCalendarEvent } from '@/lib/types'
import { getWeekDates, getStartOfWeek, getDateKey } from '@/lib/helpers'
import { CaretLeft, CaretRight, Warning } from '@phosphor-icons/react'
import { CalendarBlockDialog } from './dialogs/CalendarBlockDialog'

interface WeeklyCalendarProps {
  userId: UserId
  calendarBlocks: CalendarBlock[]
  tasks: Task[]
  habits?: Habit[]
  weekStartsOn: 0 | 1
  googleCalendarEvents: GoogleCalendarEvent[]
  onAddBlock: (block: CalendarBlock) => void
  onUpdateBlock: (block: CalendarBlock) => void
  onDeleteBlock: (id: string) => void
  onUpdateTask?: (task: Task) => void
}

// Color mapping by block type
const blockTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  task: { bg: 'bg-blue-100/70 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-900 dark:text-blue-100' },
  habit: { bg: 'bg-green-100/70 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700', text: 'text-green-900 dark:text-green-100' },
  focus: { bg: 'bg-purple-100/70 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-900 dark:text-purple-100' },
  meeting: { bg: 'bg-amber-100/70 dark:bg-amber-900/30', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-900 dark:text-amber-100' },
  personal: { bg: 'bg-accent/20', border: 'border-accent', text: '' },
}

const blockTypeLabels: Record<string, string> = {
  task: 'Tarefa',
  habit: 'Hábito',
  focus: 'Foco',
  meeting: 'Reunião',
  personal: 'Pessoal',
}

export function WeeklyCalendar({
  userId,
  calendarBlocks,
  tasks,
  habits = [],
  weekStartsOn,
  googleCalendarEvents,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onUpdateTask,
}: WeeklyCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date(), weekStartsOn))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<number | null>(null)
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const weekDates = getWeekDates(currentWeekStart)

  useEffect(() => {
    setCurrentWeekStart((prev) => getStartOfWeek(prev, weekStartsOn))
  }, [weekStartsOn])

  const nextWeek = () => {
    const next = new Date(currentWeekStart)
    next.setDate(next.getDate() + 7)
    setCurrentWeekStart(next)
  }

  const prevWeek = () => {
    const prev = new Date(currentWeekStart)
    prev.setDate(prev.getDate() - 7)
    setCurrentWeekStart(prev)
  }

  const today = () => {
    setCurrentWeekStart(getStartOfWeek(new Date(), weekStartsOn))
  }

  const handleTimeSlotClick = (date: Date, time: number) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setShowDialog(true)
  }

  const handleEditBlock = (block: CalendarBlock) => {
    setEditingBlock(block)
    setShowDialog(true)
  }

  const handleSaveBlock = (block: CalendarBlock) => {
    if (editingBlock) {
      onUpdateBlock(block)
    } else {
      onAddBlock(block)
    }
    setEditingBlock(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setShowDialog(false)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingBlock(null)
    setSelectedDate(null)
    setSelectedTime(null)
  }

  const getBlocksForDateAndTime = (date: Date, time: number): CalendarBlock[] => {
    const dateKey = getDateKey(date)
    const nextHour = time + 60
    // Mostrar blocos que começam nesta hora OU que estão em andamento nesta hora
    return calendarBlocks.filter(
      block => block.date === dateKey && (
        // Bloco começa nesta hora
        (block.startTime >= time && block.startTime < nextHour) ||
        // Bloco está em andamento (começou antes e termina depois)
        (block.startTime < time && block.endTime > time)
      )
    )
  }

  // Função para verificar se uma tarefa vinculada está concluída
  const isTaskCompleted = (block: CalendarBlock): boolean => {
    if (!block.taskId) return false
    const task = tasks.find(t => t.id === block.taskId)
    return task?.status === 'done'
  }

  const getExternalEventsForDateAndTime = (date: Date, time: number): GoogleCalendarEvent[] => {
    const dateKey = getDateKey(date)
    return googleCalendarEvents.filter(
      event => event.date === dateKey && event.startTime <= time && event.endTime > time
    )
  }

  const checkConflict = (block: CalendarBlock): boolean => {
    const overlaps = (start: number, end: number, otherStart: number, otherEnd: number) =>
      (start >= otherStart && start < otherEnd) ||
      (end > otherStart && end <= otherEnd) ||
      (start <= otherStart && end >= otherEnd)

    const hasLocalConflict = calendarBlocks.some(
      existing =>
        existing.id !== block.id &&
        existing.date === block.date &&
        overlaps(block.startTime, block.endTime, existing.startTime, existing.endTime)
    )

    const hasExternalConflict = googleCalendarEvents.some(
      event =>
        event.date === block.date &&
        overlaps(block.startTime, block.endTime, event.startTime, event.endTime)
    )

    return hasLocalConflict || hasExternalConflict
  }

  const hours = Array.from({ length: 15 }, (_, i) => i + 6)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="sm" onClick={prevWeek} className="touch-target flex items-center justify-center">
            <CaretLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={today} className="touch-target px-2 sm:px-3">
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={nextWeek} className="touch-target flex items-center justify-center">
            <CaretRight />
          </Button>
        </div>
        <div className="text-sm font-medium">
          {currentWeekStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide relative">
        {/* Scroll indicator for mobile */}
        <div className="md:hidden text-xs text-muted-foreground text-center mb-1">
          ← Deslize para ver todos os dias →
        </div>
        <div className="min-w-[640px]">
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="text-xs text-muted-foreground"></div>
            {weekDates.map((date) => {
              const isToday = getDateKey(date) === getDateKey(new Date())
              return (
                <div
                  key={date.toISOString()}
                  className={`text-center py-2 rounded-md ${
                    isToday ? 'bg-primary text-primary-foreground font-semibold' : ''
                  }`}
                >
                  <div className="text-xs">
                    {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </div>
                  <div className="text-sm">{date.getDate()}</div>
                </div>
              )
            })}
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-border last:border-b-0">
                <div className="text-xs text-muted-foreground p-2 bg-muted/30 flex items-start">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDates.map((date) => {
                  const timeInMinutes = hour * 60
                  const blocks = getBlocksForDateAndTime(date, timeInMinutes)
                  const externalEvents = getExternalEventsForDateAndTime(date, timeInMinutes)
                  const hasConflict = blocks.length + externalEvents.length > 1
                  const canCreateBlock = blocks.length === 0

                  return (
                    <div
                      key={`${date.toISOString()}-${hour}`}
                      role={canCreateBlock ? 'button' : undefined}
                      tabIndex={canCreateBlock ? 0 : undefined}
                      aria-label={canCreateBlock ? `Criar bloco às ${hour}:00 em ${date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}` : undefined}
                      className="border-l border-border min-h-[60px] p-1 hover:bg-secondary/30 cursor-pointer transition-colors relative"
                      onClick={() => canCreateBlock && handleTimeSlotClick(date, timeInMinutes)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && canCreateBlock) {
                          e.preventDefault()
                          handleTimeSlotClick(date, timeInMinutes)
                        }
                      }}
                    >
                      {externalEvents.map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-2 rounded mb-1 border border-sky-300 bg-sky-100/70 text-sky-900"
                        >
                          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-sky-700">
                            Google Calendar
                          </div>
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs text-sky-700">
                            {Math.floor(event.startTime / 60)}:
                            {(event.startTime % 60).toString().padStart(2, '0')} - 
                            {Math.floor(event.endTime / 60)}:
                            {(event.endTime % 60).toString().padStart(2, '0')}
                          </div>
                          {hasConflict && (
                            <div className="flex items-center gap-1 text-amber-700 mt-1">
                              <Warning size={12} />
                              <span className="text-xs">Conflito</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {blocks.map((block) => {
                        const completed = isTaskCompleted(block)
                        const colors = blockTypeColors[block.type] || blockTypeColors.personal
                        return (
                          <div
                            key={block.id}
                            className={`text-xs p-2 rounded mb-1 cursor-pointer ${
                              completed 
                                ? 'bg-muted/50 border border-muted-foreground/30 opacity-60' 
                                : hasConflict 
                                  ? 'bg-destructive/20 border border-destructive' 
                                  : `${colors.bg} border ${colors.border} ${colors.text}`
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditBlock(block)
                            }}
                          >
                            <div className="flex items-center gap-1">
                              {!completed && (
                                <span className="text-[9px] uppercase tracking-wide opacity-70">{blockTypeLabels[block.type] || block.type}</span>
                              )}
                            </div>
                            <div className={`font-medium truncate ${completed ? 'line-through text-muted-foreground' : ''}`}>
                              {block.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Math.floor(block.startTime / 60)}:
                              {(block.startTime % 60).toString().padStart(2, '0')} - 
                              {Math.floor(block.endTime / 60)}:
                              {(block.endTime % 60).toString().padStart(2, '0')}
                            </div>
                            {hasConflict && !completed && (
                              <div className="flex items-center gap-1 text-destructive mt-1">
                                <Warning size={12} />
                                <span className="text-xs">Conflito</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <CalendarBlockDialog
        open={showDialog}
        onOpenChange={handleCloseDialog}
        userId={userId}
        block={editingBlock}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        tasks={tasks}
        habits={habits}
        onSave={handleSaveBlock}
        onDelete={editingBlock ? () => {
          onDeleteBlock(editingBlock.id)
          handleCloseDialog()
        } : undefined}
        onUpdateTask={onUpdateTask}
        hasConflict={editingBlock ? checkConflict(editingBlock) : false}
      />
    </div>
  )
}
