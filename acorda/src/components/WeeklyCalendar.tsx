import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { UserId } from '@/lib/types'
import { CalendarBlock, Task, Habit, GoogleCalendarEvent } from '@/lib/types'
import { getWeekDates, getDateKey } from '@/lib/helpers'
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
  googleCalendarEvents,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onUpdateTask,
}: WeeklyCalendarProps) {
  // O dia atual é sempre a primeira coluna — a semana começa "hoje"
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<number | null>(null)
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const weekDates = getWeekDates(currentWeekStart)

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
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    setCurrentWeekStart(d)
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

  // Função para verificar se uma tarefa vinculada está concluída
  const isTaskCompleted = (block: CalendarBlock): boolean => {
    if (!block.taskId) return false
    const task = tasks.find(t => t.id === block.taskId)
    return task?.status === 'done'
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
  const HOUR_HEIGHT = 60 // px per hour
  const FIRST_HOUR = hours[0] // 6

  // Get all blocks for a given date
  const getBlocksForDate = (date: Date): CalendarBlock[] => {
    const dateKey = getDateKey(date)
    return calendarBlocks.filter(block => block.date === dateKey)
  }

  const getExternalEventsForDate = (date: Date): GoogleCalendarEvent[] => {
    const dateKey = getDateKey(date)
    return googleCalendarEvents.filter(event => event.date === dateKey)
  }

  // Check if a time slot is occupied by any block
  const isSlotOccupied = (date: Date, timeInMinutes: number): boolean => {
    const dateKey = getDateKey(date)
    return calendarBlocks.some(block => 
      block.date === dateKey && block.startTime <= timeInMinutes && block.endTime > timeInMinutes
    ) || googleCalendarEvents.some(event =>
      event.date === dateKey && event.startTime <= timeInMinutes && event.endTime > timeInMinutes
    )
  }

  // Check conflict for a specific block
  const hasBlockConflict = (block: CalendarBlock): boolean => {
    const dateKey = block.date
    const hasLocalConflict = calendarBlocks.some(
      existing =>
        existing.id !== block.id &&
        existing.date === dateKey &&
        existing.startTime < block.endTime &&
        existing.endTime > block.startTime
    )
    const hasExternalConflict = googleCalendarEvents.some(
      event =>
        event.date === dateKey &&
        event.startTime < block.endTime &&
        event.endTime > block.startTime
    )
    return hasLocalConflict || hasExternalConflict
  }

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
          {/* Header row with day names */}
          <div className="grid grid-cols-8 gap-0 mb-2">
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

          {/* Calendar body */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-8">
              {/* Time labels column */}
              <div>
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="text-xs text-muted-foreground p-2 bg-muted/30 border-b border-border last:border-b-0 flex items-start"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDates.map((date) => {
                const dayBlocks = getBlocksForDate(date)
                const dayEvents = getExternalEventsForDate(date)

                return (
                  <div key={date.toISOString()} className="relative border-l border-border">
                    {/* Hour grid lines (click targets) */}
                    {hours.map((hour) => {
                      const timeInMinutes = hour * 60
                      const occupied = isSlotOccupied(date, timeInMinutes)
                      return (
                        <div
                          key={hour}
                          role={!occupied ? 'button' : undefined}
                          tabIndex={!occupied ? 0 : undefined}
                          aria-label={!occupied ? `Criar bloco às ${hour}:00 em ${date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}` : undefined}
                          className="border-b border-border last:border-b-0 hover:bg-secondary/30 cursor-pointer transition-colors"
                          style={{ height: `${HOUR_HEIGHT}px` }}
                          onClick={() => !occupied && handleTimeSlotClick(date, timeInMinutes)}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && !occupied) {
                              e.preventDefault()
                              handleTimeSlotClick(date, timeInMinutes)
                            }
                          }}
                        />
                      )
                    })}

                    {/* External Google Calendar events overlay */}
                    {dayEvents.map((event) => {
                      const topPx = ((event.startTime - FIRST_HOUR * 60) / 60) * HOUR_HEIGHT
                      const heightPx = ((event.endTime - event.startTime) / 60) * HOUR_HEIGHT
                      return (
                        <div
                          key={event.id}
                          className="absolute left-1 right-1 p-1.5 rounded text-xs border border-sky-300 bg-sky-100/70 dark:bg-sky-900/30 text-sky-900 dark:text-sky-100 z-10 overflow-hidden cursor-default"
                          style={{ top: `${topPx}px`, height: `${Math.max(heightPx, 24)}px` }}
                        >
                          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-sky-700 dark:text-sky-300">
                            Google Calendar
                          </div>
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs text-sky-700 dark:text-sky-300">
                            {Math.floor(event.startTime / 60).toString().padStart(2, '0')}:
                            {(event.startTime % 60).toString().padStart(2, '0')} - 
                            {Math.floor(event.endTime / 60).toString().padStart(2, '0')}:
                            {(event.endTime % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      )
                    })}

                    {/* Calendar blocks overlay */}
                    {dayBlocks.map((block) => {
                      const completed = isTaskCompleted(block)
                      const conflict = hasBlockConflict(block)
                      const colors = blockTypeColors[block.type] || blockTypeColors.personal
                      const topPx = ((block.startTime - FIRST_HOUR * 60) / 60) * HOUR_HEIGHT
                      const heightPx = ((block.endTime - block.startTime) / 60) * HOUR_HEIGHT

                      const durationMin = block.endTime - block.startTime
                      const isLarge = heightPx >= 90 // ~1.5h+
                      const isMedium = heightPx >= 55 // ~1h

                      return (
                        <div
                          key={block.id}
                          className={`absolute left-1 right-1 rounded text-xs cursor-pointer z-10 overflow-hidden flex flex-col ${
                            isLarge ? 'p-2.5 justify-between' : 'p-1.5 justify-start'
                          } ${
                            completed
                              ? 'bg-muted/50 border border-muted-foreground/30 opacity-60'
                              : conflict
                                ? 'bg-destructive/20 border border-destructive'
                                : `${colors.bg} border ${colors.border} ${colors.text}`
                          }`}
                          style={{ top: `${topPx}px`, height: `${Math.max(heightPx, 24)}px` }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditBlock(block)
                          }}
                        >
                          {/* Top section: type label */}
                          <div>
                            {!completed && (
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className={`uppercase tracking-wide opacity-70 ${isLarge ? 'text-[10px]' : 'text-[9px]'}`}>
                                  {blockTypeLabels[block.type] || block.type}
                                </span>
                              </div>
                            )}
                            {/* Title */}
                            <div className={`font-semibold ${isLarge ? 'text-sm' : 'text-xs'} ${isLarge ? 'line-clamp-2' : 'truncate'} ${completed ? 'line-through text-muted-foreground' : ''}`}>
                              {block.title}
                            </div>
                            {/* Description for large blocks */}
                            {isLarge && block.description && (
                              <div className="text-[11px] opacity-70 mt-1 line-clamp-2">
                                {block.description}
                              </div>
                            )}
                          </div>

                          {/* Bottom section: time + duration */}
                          {isMedium && (
                            <div className={`flex items-center justify-between ${isLarge ? 'mt-auto pt-1' : 'mt-0.5'}`}>
                              <span className="text-xs opacity-70">
                                {Math.floor(block.startTime / 60).toString().padStart(2, '0')}:
                                {(block.startTime % 60).toString().padStart(2, '0')} – 
                                {Math.floor(block.endTime / 60).toString().padStart(2, '0')}:
                                {(block.endTime % 60).toString().padStart(2, '0')}
                              </span>
                              {isLarge && (
                                <span className="text-[10px] opacity-50">
                                  {durationMin >= 60 ? `${Math.floor(durationMin / 60)}h` : ''}{durationMin % 60 > 0 ? `${durationMin % 60}min` : ''}
                                </span>
                              )}
                            </div>
                          )}

                          {conflict && !completed && (
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
