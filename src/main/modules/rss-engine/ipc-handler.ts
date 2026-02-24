import { ipcMain } from 'electron'
import { getDatabase } from '../database'

// --- Unified Response Helpers ---

interface RSSResponse<T> {
  success: boolean
  mock: boolean
  data?: T
  error?: string
}

function createSuccessResponse<T>(data: T, isMock: boolean): RSSResponse<T> {
  return { success: true, mock: isMock, data }
}

function createErrorResponse(error: string): RSSResponse<never> {
  return { success: false, mock: false, error }
}

// --- Mock Data ---

const mockSources = [
  { id: '1', name: '36氪', url: 'https://36kr.com/feed', group: 'tech', enabled: true },
  { id: '2', name: '虎嗅', url: 'https://www.huxiu.com/rss', group: 'tech', enabled: true },
  { id: '3', name: '阮一峰', url: 'https://www.ruanyifeng.com/blog/atom.xml', group: 'dev', enabled: true }
]

const mockItems = [
  {
    id: '1',
    sourceId: '1',
    title: 'AI 创作工具的下一个十年',
    link: 'https://36kr.com/p/123456',
    summary: '探讨 AI 如何改变内容创作行业...',
    author: '张三',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    starred: false
  },
  {
    id: '2',
    sourceId: '2',
    title: '自媒体运营的核心方法论',
    link: 'https://www.huxiu.com/article/789',
    summary: '从 0 到 1 打造个人 IP 的实战经验...',
    author: '李四',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    read: false,
    starred: true
  },
  {
    id: '3',
    sourceId: '3',
    title: '科技爱好者周刊',
    link: 'https://www.ruanyifeng.com/blog/2026/02/weekly-300.html',
    summary: '本周值得关注的科技资讯...',
    author: '阮一峰',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    starred: false
  }
]

// --- IPC Setup ---

export function setupRSSIPC(useMock = false): void {
  // Get all RSS sources
  ipcMain.handle('rss:getSources', async () => {
    if (useMock) {
      return createSuccessResponse(mockSources, true)
    }

    try {
      const db = getDatabase().getDatabase()
      if (db) {
        const sources = db.prepare('SELECT * FROM rss_sources WHERE enabled = 1').all()
        return createSuccessResponse(sources, false)
      }
      return createErrorResponse('Database not available')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createErrorResponse(errorMessage)
    }
  })

  // Add RSS source
  ipcMain.handle('rss:addSource', async (_, source: { name: string; url: string; group?: string }) => {
    if (useMock) {
      return createSuccessResponse({ id: `source-${Date.now()}` }, true)
    }

    try {
      const db = getDatabase().getDatabase()
      if (db) {
        const id = `source-${Date.now()}`
        db.prepare(
          'INSERT INTO rss_sources (id, name, url, group_name) VALUES (?, ?, ?, ?)'
        ).run(id, source.name, source.url, source.group || 'default')
        return createSuccessResponse({ id }, false)
      }
      return createErrorResponse('Database not available')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createErrorResponse(errorMessage)
    }
  })

  // Remove RSS source
  ipcMain.handle('rss:removeSource', async (_, id: string) => {
    if (useMock) {
      return createSuccessResponse({ removed: true }, true)
    }

    try {
      const db = getDatabase().getDatabase()
      if (db) {
        db.prepare('DELETE FROM rss_sources WHERE id = ?').run(id)
        return createSuccessResponse({ removed: true }, false)
      }
      return createErrorResponse('Database not available')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createErrorResponse(errorMessage)
    }
  })

  // Get RSS items
  ipcMain.handle('rss:getItems', async (_, sourceId?: string) => {
    if (useMock) {
      const items = sourceId
        ? mockItems.filter(i => i.sourceId === sourceId)
        : mockItems
      return createSuccessResponse(items, true)
    }

    try {
      const db = getDatabase().getDatabase()
      if (db) {
        let items
        if (sourceId) {
          items = db.prepare('SELECT * FROM rss_items WHERE source_id = ? ORDER BY published_at DESC')
            .all(sourceId)
        } else {
          items = db.prepare('SELECT * FROM rss_items ORDER BY published_at DESC').all()
        }
        return createSuccessResponse(items, false)
      }
      return createErrorResponse('Database not available')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createErrorResponse(errorMessage)
    }
  })

  // Mark item as read
  ipcMain.handle('rss:markRead', async (_, itemId: string) => {
    if (useMock) {
      return createSuccessResponse({ marked: true }, true)
    }

    try {
      const db = getDatabase().getDatabase()
      if (db) {
        db.prepare('UPDATE rss_items SET read = 1 WHERE id = ?').run(itemId)
        return createSuccessResponse({ marked: true }, false)
      }
      return createErrorResponse('Database not available')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createErrorResponse(errorMessage)
    }
  })

  // Fetch all RSS feeds
  ipcMain.handle('rss:fetchAll', async () => {
    if (useMock) {
      return createSuccessResponse({ message: 'RSS fetch simulated (mock mode)' }, true)
    }

    try {
      // TODO: Implement real RSS fetching with rss-parser or similar
      return createSuccessResponse({ message: 'RSS fetch not yet implemented' }, false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return createErrorResponse(errorMessage)
    }
  })
}
