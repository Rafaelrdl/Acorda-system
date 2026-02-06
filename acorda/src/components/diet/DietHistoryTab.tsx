import { useState, useMemo } from 'react'
import { DietMealEntry } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react'

interface DietHistoryTabProps {
  meals: DietMealEntry[]
}

type Period = 14 | 30

interface DayStats {
  date: string
  planned: number
  completed: number
  rate: number
}

export function DietHistoryTab({ meals }: DietHistoryTabProps) {
  const [period, setPeriod] = useState<Period>(14)

  // Calcula estatísticas por dia
  const stats = useMemo(() => {
    const today = new Date()
    const days: DayStats[] = []

    for (let i = 0; i < period; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      
      const dayMeals = (meals || []).filter(m => m.date === dateKey)
      const planned = dayMeals.length
      const completed = dayMeals.filter(m => m.isCompleted).length
      const rate = planned > 0 ? Math.round((completed / planned) * 100) : 0

      days.push({ date: dateKey, planned, completed, rate })
    }

    return days.reverse()
  }, [meals, period])

  // Calcula adesão média
  const averageAdherence = useMemo(() => {
    const daysWithMeals = stats.filter(d => d.planned > 0)
    if (daysWithMeals.length === 0) return 0
    const sum = daysWithMeals.reduce((acc, d) => acc + d.rate, 0)
    return Math.round(sum / daysWithMeals.length)
  }, [stats])

  // Calcula tendência (últimos 7d vs 7d anteriores)
  const trend = useMemo(() => {
    if (period < 14) return 0

    const recent = stats.slice(-7).filter(d => d.planned > 0)
    const previous = stats.slice(-14, -7).filter(d => d.planned > 0)

    if (recent.length === 0 || previous.length === 0) return 0

    const recentAvg = recent.reduce((acc, d) => acc + d.rate, 0) / recent.length
    const previousAvg = previous.reduce((acc, d) => acc + d.rate, 0) / previous.length

    return Math.round(recentAvg - previousAvg)
  }, [stats, period])

  // Calcula streak (dias seguidos com >= 80% de adesão)
  const streak = useMemo(() => {
    let count = 0
    const reversed = [...stats].reverse()
    
    for (const day of reversed) {
      if (day.planned === 0) continue
      if (day.rate >= 80) {
        count++
      } else {
        break
      }
    }
    
    return count
  }, [stats])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
  }

  const maxRate = Math.max(...stats.map(d => d.rate), 100)

  return (
    <div className="space-y-4">
      {/* Toggle período */}
      <div className="flex gap-2">
        <Button
          variant={period === 14 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod(14)}
          className="flex-1"
        >
          14 dias
        </Button>
        <Button
          variant={period === 30 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod(30)}
          className="flex-1"
        >
          30 dias
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Adesão média</p>
          <p className="text-2xl font-semibold text-primary">{averageAdherence}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Tendência</p>
          <div className="flex items-center gap-1">
            {trend > 0 ? (
              <TrendUp size={20} className="text-green-500" />
            ) : trend < 0 ? (
              <TrendDown size={20} className="text-red-500" />
            ) : (
              <Minus size={20} className="text-muted-foreground" />
            )}
            <span className={`text-2xl font-semibold ${
              trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : ''
            }`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          </div>
        </Card>

        <Card className="p-4 col-span-2">
          <p className="text-sm text-muted-foreground">Streak (≥80% adesão)</p>
          <p className="text-2xl font-semibold">
            {streak} {streak === 1 ? 'dia' : 'dias'}
          </p>
        </Card>
      </div>

      {/* Gráfico de barras */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Adesão diária
        </h3>
        
        {stats.every(d => d.planned === 0) ? (
          <p className="text-center text-muted-foreground py-8">
            Sem dados de refeições no período
          </p>
        ) : (
          <div className="space-y-2">
            {stats.map((day) => (
              <div key={day.date} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0">
                  {formatDate(day.date)}
                </span>
                <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
                  {day.planned > 0 && (
                    <div
                      className={`h-full rounded-full transition-all ${
                        day.rate >= 80 ? 'bg-green-500' : 
                        day.rate >= 50 ? 'bg-yellow-500' : 
                        day.rate > 0 ? 'bg-red-500' : 'bg-muted'
                      }`}
                      style={{ width: `${(day.rate / maxRate) * 100}%` }}
                    />
                  )}
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {day.planned > 0 ? `${day.rate}%` : '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
