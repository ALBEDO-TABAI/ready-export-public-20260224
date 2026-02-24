import { ipcMain, BrowserWindow, BrowserView } from 'electron'

interface Tab {
  id: string
  url: string
  title: string
  view?: BrowserView
}

export function setupBrowserIPC(mainWindow: BrowserWindow, useMock = false): void {
  const tabs = new Map<string, Tab>()
  let activeTabId: string | null = null
  let tabCounter = 0

  // Create new tab
  ipcMain.handle('browser:createTab', async (_, url: string) => {
    try {
      if (useMock) {
        // Mock mode: just return success without creating BrowserView
        const tabId = `tab-${++tabCounter}`
        const tab: Tab = {
          id: tabId,
          url,
          title: 'Mock Tab'
        }
        tabs.set(tabId, tab)
        activeTabId = tabId
        return { success: true, tabId, title: tab.title, mock: true }
      }

      const tabId = `tab-${++tabCounter}`
      
      // Create BrowserView
      const view = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      // Set bounds (will be updated when tab becomes active)
      const bounds = mainWindow.getBounds()
      view.setBounds({ x: 0, y: 80, width: bounds.width - 600, height: bounds.height - 80 })

      // Load URL
      await view.webContents.loadURL(url)

      const tab: Tab = {
        id: tabId,
        url,
        title: 'Loading...',
        view
      }

      tabs.set(tabId, tab)

      // Update title when page loads
      view.webContents.on('page-title-updated', (_, title) => {
        tab.title = title
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('browser:tabUpdate', { 
            type: 'title', 
            tabId, 
            title 
          })
        }
      })

      // Update URL on navigation
      view.webContents.on('did-navigate', (_, newUrl) => {
        tab.url = newUrl
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('browser:tabUpdate', { 
            type: 'url', 
            tabId, 
            url: newUrl 
          })
        }
      })

      // Switch to new tab
      if (activeTabId) {
        const oldTab = tabs.get(activeTabId)
        if (oldTab?.view) {
          mainWindow.removeBrowserView(oldTab.view)
        }
      }
      
      mainWindow.addBrowserView(view)
      activeTabId = tabId

      return { success: true, tabId, title: tab.title }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // Close tab
  ipcMain.handle('browser:closeTab', (_, tabId: string) => {
    try {
      const tab = tabs.get(tabId)
      if (tab?.view) {
        mainWindow.removeBrowserView(tab.view)
        tab.view.webContents.close()
      }
      tabs.delete(tabId)

      // Switch to another tab if this was active
      if (activeTabId === tabId) {
        const remainingTabs = Array.from(tabs.values())
        if (remainingTabs.length > 0) {
          const newTab = remainingTabs[remainingTabs.length - 1]
          if (newTab.view) {
            mainWindow.addBrowserView(newTab.view)
            activeTabId = newTab.id
          }
        } else {
          activeTabId = null
        }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // Switch tab
  ipcMain.handle('browser:switchTab', (_, tabId: string) => {
    try {
      const newTab = tabs.get(tabId)
      if (!newTab?.view) {
        return { success: false, error: 'Tab not found' }
      }

      // Remove current tab view
      if (activeTabId) {
        const oldTab = tabs.get(activeTabId)
        if (oldTab?.view) {
          mainWindow.removeBrowserView(oldTab.view)
        }
      }

      // Add new tab view
      mainWindow.addBrowserView(newTab.view)
      activeTabId = tabId

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // Navigate tab
  ipcMain.handle('browser:navigate', async (_, { tabId, url }: { tabId: string; url: string }) => {
    try {
      const tab = tabs.get(tabId)
      if (!tab?.view) {
        return { success: false, error: 'Tab not found' }
      }

      await tab.view.webContents.loadURL(url)
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // Get all tabs
  ipcMain.handle('browser:getTabs', () => {
    return Array.from(tabs.values()).map(tab => ({
      id: tab.id,
      url: tab.url,
      title: tab.title,
      active: tab.id === activeTabId
    }))
  })

  // Update view bounds when window resizes
  mainWindow.on('resize', () => {
    if (activeTabId) {
      const tab = tabs.get(activeTabId)
      if (tab?.view) {
        const bounds = mainWindow.getBounds()
        tab.view.setBounds({ 
          x: 264, 
          y: 80, 
          width: bounds.width - 644, 
          height: bounds.height - 80 
        })
      }
    }
  })
}
