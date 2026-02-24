export {}

declare global {
  interface Window {
    electronAPI: {
      agent: {
        send: (agent: string, message: string) => Promise<{ success: boolean; error?: string | null }>
        orchestrate: (task: string, agents: string[]) => Promise<{ success: boolean; error?: string | null }>
        onStream: (callback: (data: { agent: string; chunk: string }) => void) => () => void
        onStatusChange: (callback: (data: { agent: string; status: string }) => void) => () => void
      }
      browser: {
        createTab: (url: string) => Promise<any>
        closeTab: (tabId: string) => Promise<any>
        switchTab: (tabId: string) => Promise<any>
        navigate: (tabId: string, url: string) => Promise<any>
        onTabUpdate: (callback: (data: unknown) => void) => () => void
      }
      document: {
        readFile: (path: string) => Promise<any>
        writeFile: (path: string, content: string) => Promise<any>
        listFiles: (dir: string) => Promise<any>
        parseDocx: (path: string) => Promise<any>
        parseXlsx: (path: string) => Promise<any>
      }
      rss: {
        getSources: () => Promise<any>
        addSource: (source: unknown) => Promise<any>
        removeSource: (id: string) => Promise<any>
        getItems: (sourceId?: string) => Promise<any>
        markRead: (itemId: string) => Promise<any>
        fetchAll: () => Promise<any>
      }
      calendar: {
        getSources: () => Promise<any>
        getEvents: (start: Date, end: Date) => Promise<any>
        createEvent: (event: unknown) => Promise<any>
        updateEvent: (id: string, event: unknown) => Promise<any>
        deleteEvent: (id: string) => Promise<any>
      }
      window: {
        minimize: () => Promise<any>
        maximize: () => Promise<any>
        close: () => Promise<any>
      }
      platform: string
    }
  }
}
