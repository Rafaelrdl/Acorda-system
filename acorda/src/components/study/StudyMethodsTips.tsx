import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Brain, Clock, Repeat } from '@phosphor-icons/react'

const STUDY_METHODS = [
  {
    icon: Clock,
    title: 'Espaçamento',
    tip: 'Revise o conteúdo em intervalos crescentes (D+1, D+3, D+7, D+14).',
  },
  {
    icon: Brain,
    title: 'Prática de Recuperação',
    tip: 'Teste seu conhecimento sem consultar o material.',
  },
  {
    icon: Repeat,
    title: 'Intercalação',
    tip: 'Alterne entre diferentes assuntos para melhor retenção.',
  },
  {
    icon: BookOpen,
    title: 'Elaboração',
    tip: 'Explique o conteúdo com suas próprias palavras.',
  },
]

export function StudyMethodsTips() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Métodos Eficazes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {STUDY_METHODS.map((method) => (
          <div key={method.title} className="flex gap-3">
            <method.icon className="text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-medium text-sm">{method.title}</p>
              <p className="text-xs text-muted-foreground">{method.tip}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
