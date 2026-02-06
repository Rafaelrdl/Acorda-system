import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GoogleCalendarConnection } from '@/lib/types'
import { Calendar, Info, WarningCircle } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'

interface GoogleCalendarIntegrationProps {
  connection?: GoogleCalendarConnection
  isSyncing?: boolean
  onConnect: () => Promise<void> | void
  onDisconnect: () => Promise<void> | void
  onSync: () => Promise<void> | void
}

export function GoogleCalendarIntegration({
  connection,
  isSyncing,
  onConnect,
  onDisconnect,
  onSync,
}: GoogleCalendarIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await onConnect()
    } finally {
      setIsConnecting(false)
    }
  }

  const isConnected = connection?.connected || false

  const handleSync = async () => {
    await onSync()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="text-primary" size={24} />
              <div>
                <CardTitle>Google Calendar</CardTitle>
                <CardDescription>
                  Sincronize seus eventos com o calendário semanal
                </CardDescription>
              </div>
            </div>
            {isConnected && <Badge>Conectado</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm space-y-2">
              <p className="font-medium">Como funciona:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Eventos do Google Calendar aparecem como "somente leitura" no calendário semanal</li>
                <li>Você será alertado sobre conflitos com blocos internos</li>
                <li>Eventos externos não podem ser editados aqui</li>
                <li>Sincronização manual disponível</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert className="border-yellow-500/50">
            <WarningCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm">
              Para sincronizar, conecte sua conta Google e use o botão "Sincronizar Agora".
            </AlertDescription>
          </Alert>

          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? 'Conectando...' : 'Conectar Google Calendar'}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Conexão Ativa</p>
                  {connection?.lastSyncAt && (
                    <p className="text-xs text-muted-foreground">
                      Última sincronização: {new Date(connection.lastSyncAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                </Button>
                <Button variant="outline" onClick={onDisconnect} className="flex-1">
                  Desconectar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dicas</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Eventos sincronizados aparecem como somente leitura no calendário semanal.</p>
          <p>Você pode criar blocos internos mesmo com eventos do Google no mesmo horário.</p>
        </CardContent>
      </Card>
    </div>
  )
}
