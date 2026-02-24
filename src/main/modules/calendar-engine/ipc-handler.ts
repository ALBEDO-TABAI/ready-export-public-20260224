import { ipcMain } from 'electron'
import { getDatabase } from '../database'

// --- Unified Response Helpers ---

interface CalendarResponse<T> {
  success: boolean
  mock: boolean
  data?: T
  error?: string
}

function createSuccessResponse<T>(data: T, isMock: boolean): CalendarResponse<T> {
  return { success: true, mock: isMock, data }
}

function createErrorResponse(error: string): CalendarResponse<never> {
  return { success: false, mock: false, error }
}

// --- Mock Data ---

const mockSources = [
  { id: 'work', name: '工作日程', color: '#5B8DEF', type: 'local', enabled: true },
  { id: 'content', name: '内容创作', color: '#E97A2B', type: 'local', enabled: true },
  { id: 'holiday', name: '节假日', color: '#34D399', type: 'local', enabled: true },
  { id: 'personal', name: '个人', color: '#8B5CF6', type: 'local', enabled: true }
]

const mockEvents = [
  {
    id: '1',
    calendarId: 'work',
    title: '团队周会',
    description: '每周进度同步',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    endTime: new Date(Date.now() + 7200000).toISOString(),
    allDay: false
  },
  {
    id: '2',
    calendarId: 'content',
    title: '视频发布',
    description: '本周短视频发布',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 90000000).toISOString(),
    allDay: false
  },
  {
    id: '3',
    calendarId: 'work',
    title: '内容策划',
    description: '下月选题规划',
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now()).toISOString(),
    allDay: false
  }
]

// --- IPC Setup ---

export function setupCalendarIPC(useMock = false): void {
  // Get all calendar sources
  ipcMain.handle('calendar:getSources', async () => {
    if (useMock) {
      return createSuccessResponse(mockSources, true)
    }

    try {
      const db = getDatabase().getDatabase()
      if (db) {
        const sources = db.prepare('SELECT * FROM calendar_sources WHERE enabled = 1').all()
        return createSuccessResponse(sources, false)
      }
      return createErrorResponse('Database not available')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createErrorResponse(errorMessage)
    }
  })

  // Get events in date range
  ipcMain.handle('calendar:getEvents', async (_, { start, end }: { start: string; end: string }) => {
    if (useMock) {
      return createSuccessResponse(mockEvents, true)
    }

    try {
      const db = getDatabase().getDatabase()
      if (db) {
        const events = db.prepare(
          'SELECT * FROM calendar_events WHERE start_time >= ? AND end_time <= ? ORDER BY start_time'
        ).all(new Date(start).getTime() / 1000, new Date(end).getTime() / 1000)
        return createSuccessResponse(events, false)
      }
      return createErrorResponse('Database not available')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createErrorResponse(errorMessage)
    }
  })

  // Create event
  ipcMain.handle('calendar:createEvent', async (_, event: {
    calendarId: string
    title: string
    description?: string
    startTime: string
    endTime: string
    allDay?: boolean
  }) => {
    if (useMock) {
      return createSuccessResponse({ id: `event-${Date.now()}` }, true)
    }

    try {
      const db = getDatabase().getDatabase()
      if (db) {
        const id = `event-${Date.now()}`
        db.prepare(
          `INSERT INTO calendar_events
           (id, calendar_id, title, description, start_time, end_time, all_day)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          id,
          event.calendarId,
          event.title,
          event.description || '',
          new Date(event.startTime).getTime() / 1000,
          new Date(event.endTime).getTime() / 1000,
          event.allDay ? 1 : 0
        )
        return createSuccessResponse({ id }, false)
      }
      return createErrorResponse('Database not available')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createErrorResponse(errorMessage)
    }
  })

  // Update event
  ipcMain.handle('calendar:updateEvent', async (_, { id, event }: { id: string; event: unknown }) => {
    if (useMock) {
      return createSuccessResponse({ updated: true }, true)
    }

    try {
      const db = getDatabase().getDatabase()
      if (db) {
        const { title } = event as { title?: string }
        if (title) {
          db.prepare('UPDATE calendar_events SET title = ?, updated_at = unixepoch() WHERE id = ?')
            .run(title, id)
        }
        return createSuccessResponse({ updated: true }, false)
      }
      return createErrorResponse('Database not available')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createErrorResponse(errorMessage)
    }
  })

  // Delete event
  ipcMain.handle('calendar:deleteEvent', async (_, id: string) => {
    if (useMock) {
      return createSuccessResponse({ deleted: true }, true)
    }

    try {
      const db = getDatabase().getDatabase()
      if (db) {
        db.prepare('DELETE FROM calendar_events WHERE id = ?').run(id)
        return createSuccessResponse({ deleted: true }, false)
      }
      return createErrorResponse('Database not available')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createErrorResponse(errorMessage)
    }
  })
}
