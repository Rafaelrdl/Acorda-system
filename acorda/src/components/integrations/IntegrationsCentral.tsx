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
import { getSyncKey, getDateKey, createGoogleCalendarConnection } from '@/lib/helpers'
import { exportFinanceToCSV, exportStudyToMarkdown, exportReadingToMarkdown } from '@/lib/export'
import { deleteAllUserData } from '@/lib/dataCleanup'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, ShieldCheck } from '@phosphor-icons/react'
import { toast } from 'sonner'

const GOOGLE_IDENTITY_SRC = 'https://accounts.google.com/gsi/client'
const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3'
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

let googleIdentityPromise: Promise<void> | null = null

type GoogleCalendarApiEvent = {
  id: string
  status?: string
  summary?: string
  description?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}

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

async function requestAccessToken(
  clientId: string,
  prompt: '' | 'consent'
): Promise<{ accessToken: string; expiresAt: number }> {
  await loadGoogleIdentityScript()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Google Identity Services not typed
  const google = (window as unknown as { google?: any }).google
  if (!google?.accounts?.oauth2?.initTokenClient) {
    throw new Error('Google Identity Services indispon�vel')
  }

  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPES,
      callback: (response: { access_token?: string; expires_in?: number; error?: string; error_description?: string }) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error))
          return
        }
        if (!response.access_token || !response.expires_in) {
          reject(new Error('Resposta inv�lida do Google'))
          return
        }
        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + response.expires_in * 1000,
        })
      },
    })

    tokenClient.requestAccessToken({ prompt })
  })
}

function normalizeEventTimes(event: GoogleCalendarApiEvent): { start: Date; end: Date } | null {
  const startValue = event.start?.dateTime || event.start?.date
  const endValue = event.end?.dateTime || event.end?.date
  if (!startValue || !endValue) return null

  const start = event.start?.dateTime
    ? new Date(startValue)
    : new Date(`${startValue}T00:00:00`)

  const end = event.end?.dateTime
    ? new Date(endValue)
    : new Date(`${endValue}T00:00:00`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null
  }

  return { start, end }
}

function splitEventByDay(
  event: GoogleCalendarApiEvent,
  userId: UserId,
  start: Date,
  end: Date,
  syncedAt: number
): GoogleCalendarEvent[] {
  const entries: GoogleCalendarEvent[] = []
  let cursor = new Date(start)

  while (cursor < end) {
    const dayKey = getDateKey(cursor)
    const dayStart = new Date(cursor)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const segmentEnd = end < dayEnd ? end : dayEnd
    const startMinutes = cursor.getHours() * 60 + cursor.getMinutes()
    let endMinutes = segmentEnd.getHours() * 60 + segmentEnd.getMinutes()

    if (segmentEnd.getTime() === dayEnd.getTime()) {
      endMinutes = 24 * 60
    }

    if (endMinutes > startMinutes) {
      entries.push({
        id: `gcal_${event.id}_${dayKey}_${startMinutes}_${endMinutes}`,
        userId,
        googleEventId: event.id,
        title: event.summary || 'Sem t�tulo',
        description: event.description,
        startTime: startMinutes,
        endTime: endMinutes,
        date: dayKey,
        isReadOnly: true,
        lastSyncedAt: syncedAt,
        createdAt: syncedAt,
        updatedAt: syncedAt,
      })
    }

    cursor = dayEnd
  }

  return entries
}

async function fetchGoogleEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<GoogleCalendarApiEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
  })

  const response = await fetch(`${GOOGLE_CALENDAR_BASE}/calendars/primary/events?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    let message = `Erro ao buscar eventos (${response.status})`
    try {
      const data = await response.json()
      message = data?.error?.message || message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  const data = await response.json()
  return (data?.items || []) as GoogleCalendarApiEvent[]
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

  const ensureAccessToken = async (prompt: '' | 'consent') => {
    if (!googleClientId) {
      throw new Error('VITE_GOOGLE_CLIENT_ID n�o configurado')
    }

    const now = Date.now()
    if (connection?.accessToken && connection?.expiresAt && connection.expiresAt > now + 60_000) {
      return connection.accessToken
    }

    const token = await requestAccessToken(googleClientId, prompt)

    onUpdateConnection((current) => {
      const base = current || createGoogleCalendarConnection(userId)
      return {
        ...base,
        connected: true,
        connectedAt: base.connectedAt || now,
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
        updatedAt: now,
      }
    })

    return token.accessToken
  }

  const handleConnect = async () => {
    try {
      await ensureAccessToken('consent')
      toast.success('Google Calendar conectado')
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message || 'Erro ao conectar Google Calendar'
      toast.error(message)
    }
  }

  const handleDisconnect = async () => {
    const now = Date.now()
    if (connection?.accessToken) {
      try {
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `token=${encodeURIComponent(connection.accessToken)}`,
        })
      } catch {
        // ignore revoke errors
      }
    }

    onUpdateConnection((current) => ({
      ...(current || createGoogleCalendarConnection(userId)),
      connected: false,
      disconnectedAt: now,
      accessToken: undefined,
      expiresAt: undefined,
      updatedAt: now,
    }))
    onUpdateEvents([])
    toast.success('Desconectado do Google Calendar')
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      let accessToken: string
      try {
        accessToken = await ensureAccessToken(connection?.connected ? '' : 'consent')
      } catch (error) {
        if (connection?.connected) {
          accessToken = await ensureAccessToken('consent')
        } else {
          throw error
        }
      }
      const rangeStart = new Date()
      rangeStart.setDate(rangeStart.getDate() - 7)
      rangeStart.setHours(0, 0, 0, 0)
      const rangeEnd = new Date()
      rangeEnd.setDate(rangeEnd.getDate() + 60)
      rangeEnd.setHours(23, 59, 59, 999)

      const apiEvents = await fetchGoogleEvents(accessToken, rangeStart, rangeEnd)
      const syncedAt = Date.now()

      const mappedEvents = apiEvents
        .filter((event) => event.status !== 'cancelled')
        .flatMap((event) => {
          const times = normalizeEventTimes(event)
          if (!times) return []
          return splitEventByDay(event, userId, times.start, times.end, syncedAt)
        })
        .sort((a, b) => (a.date === b.date ? a.startTime - b.startTime : a.date.localeCompare(b.date)))

      onUpdateEvents(mappedEvents)
      onUpdateConnection((current) => ({
        ...(current || createGoogleCalendarConnection(userId)),
        connected: true,
        lastSyncAt: syncedAt,
        updatedAt: syncedAt,
      }))

      toast.success('Sincroniza��o conclu�da')
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message || 'Erro ao sincronizar com o Google Calendar'
      toast.error(message)
    } finally {
      setIsSyncing(false)
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
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
