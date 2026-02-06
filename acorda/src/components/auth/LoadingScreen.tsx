import { SunHorizon } from '@phosphor-icons/react'

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {/* Logo animado */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 animate-pulse">
          <SunHorizon size={40} className="text-primary" weight="duotone" />
        </div>
        
        {/* Spinner */}
        <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
        </div>
        
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}
