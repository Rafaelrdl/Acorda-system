import { Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface FABProps {
  onClick: () => void
}

export function FAB({ onClick }: FABProps) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-50 p-0"
    >
      <Plus size={24} weight="bold" />
    </Button>
  )
}
