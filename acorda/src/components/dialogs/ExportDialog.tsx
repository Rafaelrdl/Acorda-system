import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getDateKey } from '@/lib/helpers'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExportTasks: () => string
  onExportHabits: () => string
  onExportGoals: () => string
}

export function ExportDialog({
  open,
  onOpenChange,
  onExportTasks,
  onExportHabits,
  onExportGoals,
}: ExportDialogProps) {
  const [selectedItems, setSelectedItems] = useState({
    tasks: true,
    habits: true,
    goals: true,
  })
  const [isExporting, setIsExporting] = useState(false)

  const toggleItem = (item: keyof typeof selectedItems) => {
    setSelectedItems(prev => ({ ...prev, [item]: !prev[item] }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const exports: string[] = []
      
      if (selectedItems.tasks) {
        exports.push('# Tarefas\n' + onExportTasks())
      }
      if (selectedItems.habits) {
        exports.push('# Hábitos\n' + onExportHabits())
      }
      if (selectedItems.goals) {
        exports.push('# Metas\n' + onExportGoals())
      }

      const content = exports.join('\n\n---\n\n')
      const filename = `acorda-export-${getDateKey(new Date())}.md`
      
      // Create and download file
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Dados exportados com sucesso!')
      onOpenChange(false)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Erro ao exportar dados')
    } finally {
      setIsExporting(false)
    }
  }

  const hasSelection = Object.values(selectedItems).some(Boolean)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar dados</DialogTitle>
          <DialogDescription>
            Selecione os dados que deseja exportar do Acorda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seleção de dados */}
          <div className="space-y-3">
            <Label>Dados para exportar</Label>
            
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={selectedItems.tasks}
                  onCheckedChange={() => toggleItem('tasks')}
                  id="export-tasks"
                />
                <span className="text-sm">Tarefas e projetos</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={selectedItems.habits}
                  onCheckedChange={() => toggleItem('habits')}
                  id="export-habits"
                />
                <span className="text-sm">Hábitos e registros</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={selectedItems.goals}
                  onCheckedChange={() => toggleItem('goals')}
                  id="export-goals"
                />
                <span className="text-sm">Metas e Key Results</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Formato</Label>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <FileText size={20} aria-hidden="true" />
              <span className="text-sm font-medium">Markdown</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            disabled={!hasSelection || isExporting}
            className="flex-1"
          >
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
