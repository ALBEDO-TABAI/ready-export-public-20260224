// Type declarations for window.electronAPI exposed by preload

interface ElectronAgentAPI {
  send: (agent: string, message: string) => Promise<{ success: boolean; error?: string | null }>
  orchestrate: (task: string, agents: string[]) => Promise<{ success: boolean; error?: string | null }>
  getStatus: (agent: string) => Promise<unknown>
  getAll: () => Promise<unknown>
  kill: (agent: string) => Promise<{ success: boolean; error?: string }>
  getDiagnostics: () => Promise<{ success: boolean; data: unknown }>
  onStream: (callback: (data: { agent: string; chunk: string; type: string }) => void) => () => void
  onStatusChange: (callback: (data: { agent: string; status: string; isMock: boolean }) => void) => () => void
  onError: (callback: (data: { agent: string; error: string; type: string }) => void) => () => void
}

interface ElectronBrowserAPI {
  createTab: (url: string) => Promise<unknown>
  closeTab: (tabId: string) => Promise<unknown>
  switchTab: (tabId: string) => Promise<unknown>
  navigate: (tabId: string, url: string) => Promise<unknown>
  onTabUpdate: (callback: (data: unknown) => void) => () => void
}

interface ElectronDocumentAPI {
  readFile: (path: string) => Promise<any>
  writeFile: (path: string, content: string) => Promise<any>
  listFiles: (dir: string) => Promise<any>
  parseDocx: (path: string) => Promise<any>
  parseXlsx: (path: string) => Promise<any>
}

interface ElectronRSSAPI {
  getSources: () => Promise<any>
  addSource: (source: any) => Promise<any>
  removeSource: (id: string) => Promise<any>
  getItems: (sourceId?: string) => Promise<any>
  markRead: (itemId: string) => Promise<any>
  fetchAll: () => Promise<any>
}

interface ElectronCalendarAPI {
  getSources: () => Promise<any>
  getEvents: (start: Date, end: Date) => Promise<any>
  createEvent: (event: any) => Promise<any>
  updateEvent: (id: string, event: any) => Promise<any>
  deleteEvent: (id: string) => Promise<any>
}

interface ElectronWindowAPI {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
}

interface ElectronAPI {
  agent: ElectronAgentAPI
  browser: ElectronBrowserAPI
  document: ElectronDocumentAPI
  rss: ElectronRSSAPI
  calendar: ElectronCalendarAPI
  window: ElectronWindowAPI
  platform: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export { }
