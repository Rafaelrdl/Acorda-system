import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { WellnessCheckIn, CheckInMood } from '@/lib/types'
import { getDateKey } from '@/lib/helpers'
import { ChartLine, Moon, Lightning, Smiley, TrendUp, TrendDown, Equals, CalendarBlank } from '@phosphor-icons/react'

interface WellnessInsightsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  checkIns: WellnessCheckIn[]
}

type PeriodDays = 7 | 14 | 30

const MOOD_LABELS: Record<CheckInMood, string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
}

const MOOD_VALUE: Record<string, number> = { low: 1, medium: 2, high: 3 }

const sleepChartConfig = {
  sleep: { label: 'Horas de sono', color: 'hsl(220 70% 55%)' },
} satisfies ChartConfig

const energyChartConfig = {
  energy: { label: 'Energia', color: 'hsl(40 90% 50%)' },
} satisfies ChartConfig

const moodChartConfig = {
  mood: { label: 'Humor', color: 'hsl(150 60% 45%)' },
} satisfies ChartConfig

function formatDayLabel(dateKey: string): string {
  const parts = dateKey.split('-')
  return `${parts[2]}/${parts[1]}`
}

function moodValueLabel(val: number): string {
  if (val <= 1) return 'Baixo'
  if (val <= 2) return 'Médio'
  return 'Alto'
}

function computeTrend(values: number[]): 'up' | 'down' | 'neutral' {
  if (values.length < 2) return 'neutral'
  const mid = Math.floor(values.length / 2)
  const firstHalf = values.slice(0, mid)
  const secondHalf = values.slice(mid)
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  const diff = avgSecond - avgFirst
  if (Math.abs(diff) < 0.15) return 'neutral'
  return diff > 0 ? 'up' : 'down'
}

function TrendBadge({ trend, positive }: { trend: 'up' | 'down' | 'neutral'; positive?: boolean }) {
  if (trend === 'neutral') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
        <Equals size={12} weight="bold" />
        Estável
      </span>
    )
  }
  const isGood = positive ? trend === 'up' : trend === 'down'
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
      isGood ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'
    }`}>
      {trend === 'up' ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
      {trend === 'up' ? 'Subindo' : 'Caindo'}
    </span>
  )
}

export function WellnessInsightsDialog({
  open,
  onOpenChange,
  checkIns,
}: WellnessInsightsDialogProps) {
  const [period, setPeriod] = useState<PeriodDays>(14)

  // Gerar dados para o período selecionado
  const { chartData, stats } = useMemo(() => {
    const dates: string[] = []
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push(getDateKey(d))
    }

    const checkInMap = new Map<string, WellnessCheckIn>()
    for (const ci of checkIns || []) {
      checkInMap.set(ci.date, ci)
    }

    const data = dates.map(dateKey => {
      const ci = checkInMap.get(dateKey)
      return {
        date: dateKey,
        label: formatDayLabel(dateKey),
        sleep: ci?.sleepHours ?? null,
        energy: ci?.energyLevel ? MOOD_VALUE[ci.energyLevel] : null,
        mood: ci?.mood ? MOOD_VALUE[ci.mood] : null,
      }
    })

    // Estatísticas
    const sleepValues = data.filter(d => d.sleep !== null).map(d => d.sleep as number)
    const energyValues = data.filter(d => d.energy !== null).map(d => d.energy as number)
    const moodValues = data.filter(d => d.mood !== null).map(d => d.mood as number)

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

    return {
      chartData: data,
      stats: {
        checkInCount: data.filter(d => d.sleep !== null || d.energy !== null || d.mood !== null).length,
        avgSleep: avg(sleepValues),
        avgEnergy: avg(energyValues),
        avgMood: avg(moodValues),
        sleepTrend: computeTrend(sleepValues),
        energyTrend: computeTrend(energyValues),
        moodTrend: computeTrend(moodValues),
        minSleep: sleepValues.length > 0 ? Math.min(...sleepValues) : 0,
        maxSleep: sleepValues.length > 0 ? Math.max(...sleepValues) : 0,
      },
    }
  }, [checkIns, period])

  const hasData = stats.checkInCount > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChartLine size={20} weight="duotone" className="text-primary" />
            Insights de Bem-estar
          </DialogTitle>
          <DialogDescription>
            Tendências de sono, energia e humor
          </DialogDescription>
        </DialogHeader>

        {/* Seletor de período */}
        <div className="flex gap-2">
          {([7, 14, 30] as PeriodDays[]).map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className="flex-1"
            >
              {p} dias
            </Button>
          ))}
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarBlank size={48} className="text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              Nenhum check-in nos últimos {period} dias
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Faça check-ins diários para ver suas tendências aqui
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-0">
                <CardContent className="p-3 text-center">
                  <Moon size={18} className="mx-auto text-blue-500 mb-1" weight="duotone" />
                  <p className="text-lg font-semibold">{stats.avgSleep.toFixed(1)}h</p>
                  <p className="text-[10px] text-muted-foreground">Média sono</p>
                  <div className="mt-1">
                    <TrendBadge trend={stats.sleepTrend} positive />
                  </div>
                </CardContent>
              </Card>
              <Card className="p-0">
                <CardContent className="p-3 text-center">
                  <Lightning size={18} className="mx-auto text-amber-500 mb-1" weight="duotone" />
                  <p className="text-lg font-semibold">{moodValueLabel(stats.avgEnergy)}</p>
                  <p className="text-[10px] text-muted-foreground">Média energia</p>
                  <div className="mt-1">
                    <TrendBadge trend={stats.energyTrend} positive />
                  </div>
                </CardContent>
              </Card>
              <Card className="p-0">
                <CardContent className="p-3 text-center">
                  <Smiley size={18} className="mx-auto text-emerald-500 mb-1" weight="duotone" />
                  <p className="text-lg font-semibold">{moodValueLabel(stats.avgMood)}</p>
                  <p className="text-[10px] text-muted-foreground">Média humor</p>
                  <div className="mt-1">
                    <TrendBadge trend={stats.moodTrend} positive />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Sono */}
            <Card>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Moon size={16} className="text-blue-500" weight="duotone" />
                  Horas de Sono
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">
                  Mín: {stats.minSleep}h · Máx: {stats.maxSleep}h
                </p>
              </CardHeader>
              <CardContent className="px-2 pb-3">
                <ChartContainer config={sleepChartConfig} className="h-[140px] w-full">
                  <AreaChart data={chartData} accessibilityLayer>
                    <defs>
                      <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(220 70% 55%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(220 70% 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      className="text-[10px]"
                      interval={period <= 7 ? 0 : period <= 14 ? 1 : 'preserveStartEnd'}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={30}
                      domain={[0, 12]}
                      tickFormatter={(v: number) => `${v}h`}
                      className="text-[10px]"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) =>
                            value !== null ? `${Number(value).toFixed(1)}h` : 'Sem dados'
                          }
                        />
                      }
                    />
                    <Area
                      dataKey="sleep"
                      type="monotone"
                      stroke="var(--color-sleep)"
                      fill="url(#sleepGrad)"
                      strokeWidth={2}
                      dot={{ r: 2.5, fill: 'var(--color-sleep)' }}
                      connectNulls
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Energia */}
            <Card>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightning size={16} className="text-amber-500" weight="duotone" />
                  Nível de Energia
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-3">
                <ChartContainer config={energyChartConfig} className="h-[120px] w-full">
                  <BarChart data={chartData} accessibilityLayer>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      className="text-[10px]"
                      interval={period <= 7 ? 0 : period <= 14 ? 1 : 'preserveStartEnd'}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      domain={[0, 3]}
                      ticks={[1, 2, 3]}
                      tickFormatter={(v: number) => {
                        if (v === 1) return 'Baixo'
                        if (v === 2) return 'Médio'
                        if (v === 3) return 'Alto'
                        return ''
                      }}
                      className="text-[10px]"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => {
                            const v = Number(value)
                            if (v === 1) return 'Baixo'
                            if (v === 2) return 'Médio'
                            if (v === 3) return 'Alto'
                            return 'Sem dados'
                          }}
                        />
                      }
                    />
                    <Bar
                      dataKey="energy"
                      fill="var(--color-energy)"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Humor */}
            <Card>
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smiley size={16} className="text-emerald-500" weight="duotone" />
                  Humor
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-3">
                <ChartContainer config={moodChartConfig} className="h-[120px] w-full">
                  <BarChart data={chartData} accessibilityLayer>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      className="text-[10px]"
                      interval={period <= 7 ? 0 : period <= 14 ? 1 : 'preserveStartEnd'}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      domain={[0, 3]}
                      ticks={[1, 2, 3]}
                      tickFormatter={(v: number) => {
                        if (v === 1) return 'Baixo'
                        if (v === 2) return 'Médio'
                        if (v === 3) return 'Alto'
                        return ''
                      }}
                      className="text-[10px]"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => {
                            const v = Number(value)
                            if (v === 1) return 'Baixo'
                            if (v === 2) return 'Médio'
                            if (v === 3) return 'Alto'
                            return 'Sem dados'
                          }}
                        />
                      }
                    />
                    <Bar
                      dataKey="mood"
                      fill="var(--color-mood)"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Frequência de check-ins */}
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">
                <strong>{stats.checkInCount}</strong> check-in{stats.checkInCount !== 1 ? 's' : ''} nos últimos <strong>{period}</strong> dias
                {' '}({Math.round((stats.checkInCount / period) * 100)}% de consistência)
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
