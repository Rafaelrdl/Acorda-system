import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  WorkoutPlanItem, 
  WorkoutPrescription, 
  WorkoutTechnique,
  TechniqueType,
  WorkoutExercise 
} from '@/lib/types'
import { TECHNIQUE_LEGENDS } from '@/lib/training/techniqueLegends'
import { 
  Plus, 
  Minus, 
  Barbell, 
  Lightning,
  Fire,
  Link,
  Question,
  Info,
  CaretDown,
  CaretUp,
  Warning
} from '@phosphor-icons/react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ========== Presets de séries x reps ==========
const PRESETS: { label: string; sets: number; repsMin: number; repsMax?: number }[] = [
  { label: '3×15', sets: 3, repsMin: 15 },
  { label: '3×12', sets: 3, repsMin: 12 },
  { label: '3×8', sets: 3, repsMin: 8 },
  { label: '4×15', sets: 4, repsMin: 15 },
  { label: '4×12', sets: 4, repsMin: 12 },
  { label: '4×8', sets: 4, repsMin: 8 },
  { label: '3×8–12', sets: 3, repsMin: 8, repsMax: 12 },
  { label: '4×8–12', sets: 4, repsMin: 8, repsMax: 12 },
]

// ========== Técnicas avançadas ==========
const TECHNIQUES: { 
  type: TechniqueType
  label: string 
  description: string
  icon: typeof Lightning
}[] = [
  { 
    type: 'backoff', 
    label: 'Backoff Set', 
    description: 'Top set + reduzir 20-30% da carga',
    icon: Barbell 
  },
  { 
    type: 'rest_pause', 
    label: 'Rest-pause', 
    description: 'Micro-pausas de 15-30s até bater reps-alvo',
    icon: Lightning 
  },
  { 
    type: 'pulse_set', 
    label: 'Pulse Set', 
    description: 'Pequenas contrações no ponto de tensão',
    icon: Fire 
  },
  { 
    type: 'widowmaker', 
    label: 'Widowmaker (20 reps)', 
    description: '1 série longa de 20 reps',
    icon: Fire 
  },
  { 
    type: 'bi_set', 
    label: 'Bi-set / Superset', 
    description: '2 exercícios em sequência, pouco descanso',
    icon: Link 
  },
]

interface ExercisePrescriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exerciseName: string
  existingPlanItems: WorkoutPlanItem[]
  exercises: WorkoutExercise[]
  initial?: {
    prescription?: WorkoutPrescription
    technique?: WorkoutTechnique
  }
  onConfirm: (prescription: WorkoutPrescription | undefined, technique: WorkoutTechnique | undefined) => void
  onSkip?: () => void
}

export function ExercisePrescriptionDialog({
  open,
  onOpenChange,
  exerciseName,
  existingPlanItems,
  exercises,
  initial,
  onConfirm,
  onSkip,
}: ExercisePrescriptionDialogProps) {
  // ========== Estado ==========
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    initial?.prescription ? null : '3×8–12'
  )
  const [showCustom, setShowCustom] = useState(!!initial?.prescription && initial.prescription.mode === 'custom')
  
  // Custom sets/reps
  const [customSets, setCustomSets] = useState(initial?.prescription?.workSets || 3)
  const [customRepsMin, setCustomRepsMin] = useState(initial?.prescription?.repsMin || 8)
  const [customRepsMax, setCustomRepsMax] = useState(initial?.prescription?.repsMax || 12)
  const [useRange, setUseRange] = useState(
    initial?.prescription ? (initial.prescription.repsMin !== initial.prescription.repsMax) : true
  )
  const [prescriptionNote, setPrescriptionNote] = useState(initial?.prescription?.note || '')
  
  // Estrutura warmup/feeder/work
  const [useStructure, setUseStructure] = useState(initial?.prescription?.mode === 'warmup_feeder_work')
  const [warmupSets, setWarmupSets] = useState(initial?.prescription?.warmupSets || 2)
  const [feederSets, setFeederSets] = useState(initial?.prescription?.feederSets || 1)
  const [workSets, setWorkSets] = useState(initial?.prescription?.workSets || 3)
  
  // Técnica
  const [showTechniques, setShowTechniques] = useState(!!initial?.technique && initial.technique.type !== 'none')
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueType>(initial?.technique?.type || 'none')
  const [customTechniqueLabel, setCustomTechniqueLabel] = useState(initial?.technique?.label || '')
  const [techniqueNote, setTechniqueNote] = useState(initial?.technique?.note || '')
  const [linkedPlanItemId, setLinkedPlanItemId] = useState(initial?.technique?.linkedPlanItemId || '')
  
  // Params da técnica
  const [backoffPercent, setBackoffPercent] = useState(initial?.technique?.params?.backoffPercent || 25)
  const [restSeconds, setRestSeconds] = useState(initial?.technique?.params?.restSeconds || 20)
  const [targetTotalReps, setTargetTotalReps] = useState(initial?.technique?.params?.targetTotalReps || 12)
  
  // Estado para mostrar/ocultar legenda da técnica
  const [showLegend, setShowLegend] = useState(true)

  // ========== Computed ==========
  const presetData = useMemo(() => {
    if (selectedPreset) {
      return PRESETS.find(p => p.label === selectedPreset)
    }
    return null
  }, [selectedPreset])

  // Exercícios já na ficha (para bi-set)
  const availablePartners = useMemo(() => {
    return existingPlanItems.map(item => {
      const ex = exercises.find(e => e.id === item.exerciseId)
      return { id: item.id, name: ex?.name || 'Exercício desconhecido' }
    })
  }, [existingPlanItems, exercises])

  // ========== Handlers ==========
  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    setSelectedPreset(preset.label)
    setShowCustom(false)
    // Atualizar valores custom para caso o usuário queira personalizar depois
    setCustomSets(preset.sets)
    setCustomRepsMin(preset.repsMin)
    setCustomRepsMax(preset.repsMax || preset.repsMin)
    setUseRange(!!preset.repsMax)
  }

  const handleCustomClick = () => {
    setSelectedPreset(null)
    setShowCustom(true)
  }

  const handleConfirm = () => {
    // Montar prescription
    let prescription: WorkoutPrescription | undefined
    
    if (useStructure) {
      prescription = {
        mode: 'warmup_feeder_work',
        workSets,
        warmupSets,
        feederSets,
        repsMin: customRepsMin,
        repsMax: useRange ? customRepsMax : customRepsMin,
        note: prescriptionNote || undefined,
      }
    } else if (showCustom) {
      prescription = {
        mode: useRange ? 'range' : 'straight',
        workSets: customSets,
        repsMin: customRepsMin,
        repsMax: useRange ? customRepsMax : customRepsMin,
        repsFixed: !useRange ? customRepsMin : undefined,
        note: prescriptionNote || undefined,
      }
    } else if (presetData) {
      prescription = {
        mode: presetData.repsMax ? 'range' : 'straight',
        workSets: presetData.sets,
        repsMin: presetData.repsMin,
        repsMax: presetData.repsMax || presetData.repsMin,
        repsFixed: !presetData.repsMax ? presetData.repsMin : undefined,
      }
    }
    
    // Montar technique
    let technique: WorkoutTechnique | undefined
    
    if (showTechniques && selectedTechnique !== 'none') {
      technique = {
        type: selectedTechnique,
        note: techniqueNote || undefined,
      }
      
      if (selectedTechnique === 'custom') {
        technique.label = customTechniqueLabel || 'Personalizada'
      }
      
      if (selectedTechnique === 'bi_set' && linkedPlanItemId) {
        technique.linkedPlanItemId = linkedPlanItemId
      }
      
      if (selectedTechnique === 'backoff') {
        technique.params = { backoffPercent }
      }
      
      if (selectedTechnique === 'rest_pause') {
        technique.params = { restSeconds, targetTotalReps }
      }
      
      if (selectedTechnique === 'widowmaker') {
        // Widowmaker overrides reps
        if (prescription) {
          prescription.repsFixed = 20
          prescription.repsMin = 20
          prescription.repsMax = 20
          prescription.workSets = 1
        } else {
          prescription = {
            mode: 'straight',
            workSets: 1,
            repsFixed: 20,
            repsMin: 20,
            repsMax: 20,
          }
        }
      }
    }
    
    onConfirm(prescription, technique)
  }

  const Stepper = ({ 
    value, 
    onChange, 
    min = 0, 
    max = 10 
  }: { 
    value: number
    onChange: (v: number) => void
    min?: number
    max?: number 
  }) => (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus size={14} />
      </Button>
      <span className="w-6 text-center font-medium">{value}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus size={14} />
      </Button>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            Configurar: {exerciseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ========== Seção A: Séries e Reps ========== */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Barbell size={16} />
              Séries e Repetições
            </h4>
            
            {/* Presets */}
            {!useStructure && (
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={`px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedPreset === preset.label && !showCustom
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
            
            {/* Botão Personalizar */}
            {!useStructure && (
              <Button
                type="button"
                variant={showCustom ? 'secondary' : 'outline'}
                size="sm"
                className="w-full"
                onClick={handleCustomClick}
              >
                <CaretDown size={14} className={`mr-1 transition-transform ${showCustom ? 'rotate-180' : ''}`} />
                Personalizar
              </Button>
            )}
            
            {/* Inputs Custom */}
            {(showCustom || useStructure) && (
              <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Séries de trabalho</Label>
                  <Stepper 
                    value={useStructure ? workSets : customSets} 
                    onChange={useStructure ? setWorkSets : setCustomSets} 
                    min={1} 
                    max={10} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Usar faixa de reps</Label>
                  <Switch checked={useRange} onCheckedChange={setUseRange} />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                      {useRange ? 'Mín' : 'Reps'}
                    </Label>
                    <Input
                      type="number"
                      value={customRepsMin}
                      onChange={(e) => setCustomRepsMin(Number(e.target.value))}
                      min={1}
                      max={50}
                      className="h-9"
                    />
                  </div>
                  {useRange && (
                    <>
                      <span className="pt-4">–</span>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Máx</Label>
                        <Input
                          type="number"
                          value={customRepsMax}
                          onChange={(e) => setCustomRepsMax(Number(e.target.value))}
                          min={customRepsMin}
                          max={50}
                          className="h-9"
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Nota (opcional)</Label>
                  <Input
                    value={prescriptionNote}
                    onChange={(e) => setPrescriptionNote(e.target.value)}
                    placeholder="Ex: Pausar 2s no topo"
                    className="h-9"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ========== Seção B: Estrutura Warmup/Feeder/Work ========== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                Estrutura avançada
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Define warmup (aquecimento), feeder (aproximação) e work sets (séries de trabalho)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h4>
              <Switch checked={useStructure} onCheckedChange={setUseStructure} />
            </div>
            
            {useStructure && (
              <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Warmup sets</Label>
                  <Stepper value={warmupSets} onChange={setWarmupSets} min={0} max={4} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Feeder sets</Label>
                  <Stepper value={feederSets} onChange={setFeederSets} min={0} max={4} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Work sets</Label>
                  <Stepper value={workSets} onChange={setWorkSets} min={1} max={6} />
                </div>
              </div>
            )}
          </div>

          {/* ========== Seção C: Técnica Avançada ========== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Lightning size={16} />
                Técnica avançada
                <Badge variant="outline" className="text-[10px] font-normal">
                  Opcional
                </Badge>
              </h4>
              <Switch checked={showTechniques} onCheckedChange={setShowTechniques} />
            </div>
            
            {showTechniques && (
              <div className="space-y-3">
                {/* Pills de técnicas */}
                <div className="flex flex-wrap gap-2">
                  {TECHNIQUES.map((tech) => {
                    const Icon = tech.icon
                    return (
                      <TooltipProvider key={tech.type}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTechnique(tech.type)
                                setShowLegend(true)
                              }}
                              aria-pressed={selectedTechnique === tech.type}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                selectedTechnique === tech.type
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              <Icon size={12} />
                              {tech.label}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{tech.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                  
                  {/* Custom technique */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTechnique('custom')
                      setShowLegend(true)
                    }}
                    aria-pressed={selectedTechnique === 'custom'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedTechnique === 'custom'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <Question size={12} />
                    Personalizada
                  </button>
                </div>
                
                {/* ========== Bloco "Como fazer" (Legenda da técnica) ========== */}
                {selectedTechnique !== 'none' && (
                  <Collapsible open={showLegend} onOpenChange={setShowLegend}>
                    <div className="rounded-xl border bg-muted/30 p-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium">Como fazer</h5>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            {showLegend ? (
                              <>
                                <CaretUp size={12} className="mr-1" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <CaretDown size={12} className="mr-1" />
                                Mostrar
                              </>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      
                      <CollapsibleContent>
                        <div className="mt-2">
                          <p className="text-sm font-semibold">
                            {TECHNIQUE_LEGENDS[selectedTechnique].title}
                          </p>
                          <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                            {TECHNIQUE_LEGENDS[selectedTechnique].steps.map((step, index) => (
                              <li key={index} className="leading-snug">
                                {step}
                              </li>
                            ))}
                          </ol>
                          <div className="mt-3 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                            <Warning size={14} className="shrink-0 mt-0.5" />
                            <span>{TECHNIQUE_LEGENDS[selectedTechnique].caution}</span>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}
                
                {/* Params específicos por técnica */}
                {selectedTechnique === 'backoff' && (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Redução de carga</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={backoffPercent}
                          onChange={(e) => setBackoffPercent(Number(e.target.value))}
                          min={10}
                          max={50}
                          className="w-16 h-8"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedTechnique === 'rest_pause' && (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Pausa entre mini-sets</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={restSeconds}
                          onChange={(e) => setRestSeconds(Number(e.target.value))}
                          min={10}
                          max={60}
                          className="w-16 h-8"
                        />
                        <span className="text-sm text-muted-foreground">seg</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Reps total alvo</Label>
                      <Input
                        type="number"
                        value={targetTotalReps}
                        onChange={(e) => setTargetTotalReps(Number(e.target.value))}
                        min={6}
                        max={30}
                        className="w-16 h-8"
                      />
                    </div>
                  </div>
                )}
                
                {selectedTechnique === 'bi_set' && (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <Label className="text-sm">Vincular com exercício</Label>
                    {availablePartners.length > 0 ? (
                      <Select value={linkedPlanItemId} onValueChange={setLinkedPlanItemId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o parceiro..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePartners.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Adicione outros exercícios na ficha primeiro para criar bi-sets
                      </p>
                    )}
                  </div>
                )}
                
                {selectedTechnique === 'custom' && (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nome da técnica</Label>
                      <Input
                        value={customTechniqueLabel}
                        onChange={(e) => setCustomTechniqueLabel(e.target.value)}
                        placeholder="Ex: Myo-reps, Drop set..."
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Como você faz essa técnica?</Label>
                      <textarea
                        value={techniqueNote}
                        onChange={(e) => setTechniqueNote(e.target.value)}
                        placeholder="Descreva os passos em 1–3 linhas..."
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                      />
                    </div>
                  </div>
                )}
                
                {/* Nota da técnica (para técnicas pré-definidas) */}
                {selectedTechnique !== 'none' && selectedTechnique !== 'custom' && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Nota da técnica (opcional)</Label>
                    <Input
                      value={techniqueNote}
                      onChange={(e) => setTechniqueNote(e.target.value)}
                      placeholder="Ex: Aplicar na última série"
                      className="h-9"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onSkip && (
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onSkip}
              className="sm:mr-auto"
            >
              Sem configuração
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========== Helpers para exibição ==========

// eslint-disable-next-line react-refresh/only-export-components -- display helpers co-located with dialog
export function formatPrescriptionBadge(item: WorkoutPlanItem): string | null {
  const { prescription, targetSets, targetRepsMin, targetRepsMax } = item
  
  if (prescription) {
    const sets = prescription.workSets
    const min = prescription.repsMin || prescription.repsFixed
    const max = prescription.repsMax || prescription.repsFixed
    
    if (sets && min) {
      if (min === max || !max) {
        return `${sets}×${min}`
      }
      return `${sets}×${min}–${max}`
    }
  }
  
  if (targetSets && targetRepsMin) {
    if (targetRepsMin === targetRepsMax || !targetRepsMax) {
      return `${targetSets}×${targetRepsMin}`
    }
    return `${targetSets}×${targetRepsMin}–${targetRepsMax}`
  }
  
  return null
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatTechniqueBadge(technique?: WorkoutTechnique): string | null {
  if (!technique || technique.type === 'none') return null
  
  const labels: Record<TechniqueType, string> = {
    none: '',
    backoff: 'Backoff',
    rest_pause: 'Rest-pause',
    pulse_set: 'Pulse set',
    widowmaker: 'Widowmaker',
    bi_set: 'Bi-set',
    custom: technique.label || 'Personalizada',
  }
  
  return labels[technique.type] || null
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatStructureBadge(prescription?: WorkoutPrescription): string | null {
  if (!prescription || prescription.mode !== 'warmup_feeder_work') return null
  
  const parts: string[] = []
  if (prescription.warmupSets) parts.push(`${prescription.warmupSets}W`)
  if (prescription.feederSets) parts.push(`${prescription.feederSets}F`)
  parts.push(`${prescription.workSets}WS`)
  
  return parts.join(' + ')
}
