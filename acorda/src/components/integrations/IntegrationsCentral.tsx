import { useState } from 'react'
import { useKV } from '@/lib/sync-storage'
import { GoogleCalendarIntegration } from './GoogleCalendarIntegration'
import { PrivacySettings } from '../privacy/PrivacySettings'
import type { UserId } from '@/lib/types'
import {
  GoogleCalendarConnection,
  GoogleCalendarEvent,
  Transaction,
  Book,
  ReadingLog,
  PDFHighlight,
  StudySession,
} from '@/lib/types'
import { getSyncKey, createGoogleCalendarConnection } from '@/lib/helpers'
import { exportFinanceToCSV, exportStudyToMarkdown, exportReadingToMarkdown } from '@/lib/export'
import { deleteAllUserData } from '@/lib/dataCleanup'
import { storage, syncManager } from '@/lib/sync-storage'
import { api } from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, ShieldCheck } from '@phosphor-icons/react'
import { toast } from 'sonner'

const GOOGLE_IDENTITY_SRC = 'https://accounts.google.com/gsi/client'
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

let googleIdentityPromise: Promise<void> | null = null

function loadGoogleIdentityScript(): Promise<void> {
  if (googleIdentityPromise) return googleIdentityPromise

  googleIdentityPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_IDENTITY_SRC}"]`)
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Google Identity Services not typed
      const googleReady = (window as unknown as { google?: any }).google?.accounts?.oauth2
      if (googleReady) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar Google Identity Services')))
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_IDENTITY_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar Google Identity Services'))
    document.head.appendChild(script)
  })

  return googleIdentityPromise
}

/**
 * Request an authorization CODE via Google Identity Services (Code Model).
 * The code is exchanged for tokens on the backend — tokens never touch the browser.
 */
async function requestAuthCode(clientId: string): Promise<string> {
  await loadGoogleIdentityScript()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Google Identity Services not typed
  const google = (window as unknown as { google?: any }).google
  if (!google?.accounts?.oauth2?.initCodeClient) {
    throw new Error('Google Identity Services indisponível')
  }

  return new Promise((resolve, reject) => {
    const codeClient = google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: GOOGLE_SCOPES,
      ux_mode: 'popup',
      callback: (response: { code?: string; error?: string; error_description?: string }) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error))
          return
        }
        if (!response.code) {
          reject(new Error('Resposta inválida do Google'))
          return
        }
        resolve(response.code)
      },
      error_callback: (error: { type?: string; message?: string }) => {
        if (error.type === 'popup_closed') {
          reject(new Error('Popup fechado pelo usuário'))
          return
        }
        reject(new Error(error.message || 'Erro no fluxo de autorização'))
      },
    })

    codeClient.requestCode()
  })
}

interface IntegrationsCentralProps {
  userId: UserId
  connection: GoogleCalendarConnection
  onUpdateConnection: (
    value: GoogleCalendarConnection | ((prev: GoogleCalendarConnection) => GoogleCalendarConnection)
  ) => void
  onUpdateEvents: (
    value: GoogleCalendarEvent[] | ((prev: GoogleCalendarEvent[]) => GoogleCalendarEvent[])
  ) => void
}

export function IntegrationsCentral({
  userId,
  connection,
  onUpdateConnection,
  onUpdateEvents,
}: IntegrationsCentralProps) {
  const [transactions] = useKV<Transaction[]>(getSyncKey(userId, 'financeTransactions'), [])
  const [books] = useKV<Book[]>(getSyncKey(userId, 'books'), [])
  const [readingLogs] = useKV<ReadingLog[]>(getSyncKey(userId, 'readingLogs'), [])
  const [pdfHighlights] = useKV<PDFHighlight[]>(getSyncKey(userId, 'pdfHighlights'), [])
  const [studySessions] = useKV<StudySession[]>(getSyncKey(userId, 'studySessions'), [])
  const [isSyncing, setIsSyncing] = useState(false)

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  /**
   * 1. Open Google consent popup (Code Model) → get authorization code
   * 2. Send code to backend → backend exchanges for tokens, stores them securely
   * 3. Sync to pull updated connection state into local KV
   */
  const handleConnect = async () => {
    if (!googleClientId) {
      toast.error('VITE_GOOGLE_CLIENT_ID não configurado')
      return
    }

    try {
      const code = await requestAuthCode(googleClientId)

      const result = await api.googleCalendarConnect(code, 'postmessage')

      // Optimistic local update
      const now = Date.now()
      onUpdateConnection((current) => ({
        ...(current || createGoogleCalendarConnection(userId)),
        connected: true,
        connectedAt: result.connected_at || now,
        updatedAt: now,
        // Tokens are NOT stored locally — they live only on the backend
        accessToken: undefined,
        refreshToken: undefined,
        expiresAt: undefined,
      }))

      // Pull full state from backend via sync
      await syncManager.sync()

      toast.success('Google Calendar conectado')
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message || 'Erro ao conectar Google Calendar'
      if (!message.includes('popup_closed') && !message.includes('Popup fechado')) {
        toast.error(message)
      }
    }
  }

  /**
   * Backend fetches events from Google, upserts into DB,
   * then syncManager.sync() pulls them into local KV.
   */
  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const result = await api.googleCalendarSync()

      // Pull updated events from backend into local KV
      await syncManager.sync()

      toast.success(
        `Sincronizado: ${result.imported_count} evento(s) importado(s)`
      )
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message || 'Erro ao sincronizar com o Google Calendar'
      toast.error(message)
    } finally {
      setIsSyncing(false)
    }
  }

  /**
   * Backend revokes tokens, clears credentials, soft-deletes events.
   * Sync pulls the updated (disconnected) state.
   */
  const handleDisconnect = async () => {
    try {
      await api.googleCalendarDisconnect()

      // Optimistic local update
      const now = Date.now()
      onUpdateConnection((current) => ({
        ...(current || createGoogleCalendarConnection(userId)),
        connected: false,
        disconnectedAt: now,
        accessToken: undefined,
        refreshToken: undefined,
        expiresAt: undefined,
        updatedAt: now,
      }))
      onUpdateEvents([])

      // Pull full state from backend via sync
      await syncManager.sync()

      toast.success('Desconectado do Google Calendar')
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message || 'Erro ao desconectar Google Calendar'
      toast.error(message)
    }
  }

  const handleDeleteAllData = async () => {
    await deleteAllUserData(userId)
    window.location.reload()
  }

  const handleExportFinance = (): string => {
    return exportFinanceToCSV(transactions || [])
  }

  const handleExportStudy = (): string => {
    return exportStudyToMarkdown(studySessions || [])
  }

  const handleExportReading = (): string => {
    return exportReadingToMarkdown(books || [], readingLogs || [], pdfHighlights || [])
  }

  const handleExportAllJSON = async (): Promise<string> => {
    const allKeys = await storage.keys()
    const userPrefix = `user_${userId}_`
    const userKeys = allKeys.filter(k => k.startsWith(userPrefix))
    const dump: Record<string, unknown> = {}
    for (const key of userKeys) {
      const entityName = key.replace(userPrefix, '')
      dump[entityName] = await storage.get(key)
    }
    return JSON.stringify(dump, null, 2)
  }

  return (
    <div className="pb-24">
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar size={16} />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <ShieldCheck size={16} />
            Privacidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <GoogleCalendarIntegration
            connection={connection}
            isSyncing={isSyncing}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSync={handleSync}
          />
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <PrivacySettings
            userId={userId}
            onDeleteAllData={handleDeleteAllData}
            onExportFinance={handleExportFinance}
            onExportStudy={handleExportStudy}
            onExportReading={handleExportReading}
            onExportAllJSON={handleExportAllJSON}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
