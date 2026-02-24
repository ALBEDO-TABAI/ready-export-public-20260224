import { contextBridge, ipcRenderer } from 'electron'

// Agent API
const agentAPI = {
  send: (agent: string, message: string) => ipcRenderer.invoke('agent:send', { agent, message }),
  orchestrate: (task: string, agents: string[]) =>
    ipcRenderer.invoke('agent:orchestrate', { task, agents }),
  getStatus: (agent: string) => ipcRenderer.invoke('agent:getStatus', agent),
  getAll: () => ipcRenderer.invoke('agent:getAll'),
  kill: (agent: string) => ipcRenderer.invoke('agent:kill', agent),
  getDiagnostics: () => ipcRenderer.invoke('agent:getDiagnostics'),
  onStream: (callback: (data: { agent: string; chunk: string; type: string }) => void) => {
    ipcRenderer.on('agent:stream', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('agent:stream')
  },
  onStatusChange: (callback: (data: { agent: string; status: string; isMock: boolean }) => void) => {
    ipcRenderer.on('agent:status', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('agent:status')
  },
  onError: (callback: (data: { agent: string; error: string; type: string }) => void) => {
    ipcRenderer.on('agent:error', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('agent:error')
  }
}

// Browser API
const browserAPI = {
  createTab: (url: string) => ipcRenderer.invoke('browser:createTab', url),
  closeTab: (tabId: string) => ipcRenderer.invoke('browser:closeTab', tabId),
  switchTab: (tabId: string) => ipcRenderer.invoke('browser:switchTab', tabId),
  navigate: (tabId: string, url: string) => ipcRenderer.invoke('browser:navigate', { tabId, url }),
  onTabUpdate: (callback: (data: unknown) => void) => {
    ipcRenderer.on('browser:tabUpdate', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('browser:tabUpdate')
  }
}

// Document API
const documentAPI = {
  readFile: (path: string) => ipcRenderer.invoke('document:read', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('document:write', { path, content }),
  listFiles: (dir: string) => ipcRenderer.invoke('document:list', dir),
  parseDocx: (path: string) => ipcRenderer.invoke('document:parseDocx', path),
  parseXlsx: (path: string) => ipcRenderer.invoke('document:parseXlsx', path)
}

// RSS API
const rssAPI = {
  getSources: () => ipcRenderer.invoke('rss:getSources'),
  addSource: (source: unknown) => ipcRenderer.invoke('rss:addSource', source),
  removeSource: (id: string) => ipcRenderer.invoke('rss:removeSource', id),
  getItems: (sourceId?: string) => ipcRenderer.invoke('rss:getItems', sourceId),
  markRead: (itemId: string) => ipcRenderer.invoke('rss:markRead', itemId),
  fetchAll: () => ipcRenderer.invoke('rss:fetchAll')
}

// Calendar API
const calendarAPI = {
  getSources: () => ipcRenderer.invoke('calendar:getSources'),
  getEvents: (start: Date, end: Date) => ipcRenderer.invoke('calendar:getEvents', { start, end }),
  createEvent: (event: unknown) => ipcRenderer.invoke('calendar:createEvent', event),
  updateEvent: (id: string, event: unknown) => ipcRenderer.invoke('calendar:updateEvent', { id, event }),
  deleteEvent: (id: string) => ipcRenderer.invoke('calendar:deleteEvent', id)
}

// Window API
const windowAPI = {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close')
}

// Expose APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  agent: agentAPI,
  browser: browserAPI,
  document: documentAPI,
  rss: rssAPI,
  calendar: calendarAPI,
  window: windowAPI,
  platform: process.platform
})

// Type declarations for renderer
declare global {
  interface Window {
    electronAPI: {
      agent: typeof agentAPI
      browser: typeof browserAPI
      document: typeof documentAPI
      rss: typeof rssAPI
      calendar: typeof calendarAPI
      window: typeof windowAPI
      platform: string
    }
  }
}
