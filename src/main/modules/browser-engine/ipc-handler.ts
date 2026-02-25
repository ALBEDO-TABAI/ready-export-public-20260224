import { ipcMain, BrowserWindow, BrowserView, session, shell } from 'electron'

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
  // Store the last known bounds for BrowserView positioning
  let viewBounds = { x: 0, y: 0, width: 800, height: 600 }

  const sendToRenderer = (channel: string, data: unknown): void => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, data)
    }
  }

  const applyBounds = (view: BrowserView): void => {
    view.setBounds(viewBounds)
  }

  // Create new tab
  ipcMain.handle('browser:createTab', async (_, url: string) => {
    try {
      if (useMock) {
        const tabId = `tab-${++tabCounter}`
        const tab: Tab = { id: tabId, url, title: 'Mock Tab' }
        tabs.set(tabId, tab)
        activeTabId = tabId
        return { success: true, tabId, title: tab.title, mock: true }
      }

      const tabId = `tab-${++tabCounter}`

      const view = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          // Persist cookies/localStorage/session across restarts (enables Google login etc.)
          partition: 'persist:browser',
          spellcheck: true,
          // Allow the page to use media devices
          webSecurity: true,
        }
      })

      applyBounds(view)

      const tab: Tab = { id: tabId, url, title: 'Loading...', view }
      tabs.set(tabId, tab)

      // -- Events --
      view.webContents.on('page-title-updated', (_, title) => {
        tab.title = title
        sendToRenderer('browser:tabUpdate', { type: 'title', tabId, title })
      })

      view.webContents.on('did-navigate', (_, newUrl) => {
        tab.url = newUrl
        sendToRenderer('browser:tabUpdate', {
          type: 'navigate',
          tabId,
          url: newUrl,
          canGoBack: view.webContents.canGoBack(),
          canGoForward: view.webContents.canGoForward(),
        })
      })

      view.webContents.on('did-navigate-in-page', (_, newUrl) => {
        tab.url = newUrl
        sendToRenderer('browser:tabUpdate', {
          type: 'navigate',
          tabId,
          url: newUrl,
          canGoBack: view.webContents.canGoBack(),
          canGoForward: view.webContents.canGoForward(),
        })
      })

      view.webContents.on('did-start-loading', () => {
        sendToRenderer('browser:tabUpdate', { type: 'loading', tabId, loading: true })
      })

      view.webContents.on('did-stop-loading', () => {
        sendToRenderer('browser:tabUpdate', { type: 'loading', tabId, loading: false })
      })

      view.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
        sendToRenderer('browser:tabUpdate', {
          type: 'error',
          tabId,
          error: `${errorDescription} (${errorCode})`,
        })
      })

      // Open external links (target=_blank) in system browser
      view.webContents.setWindowOpenHandler(({ url: linkUrl }) => {
        shell.openExternal(linkUrl)
        return { action: 'deny' }
      })

      // Hide old active view, show new one
      if (activeTabId) {
        const oldTab = tabs.get(activeTabId)
        if (oldTab?.view) {
          mainWindow.removeBrowserView(oldTab.view)
        }
      }

      mainWindow.addBrowserView(view)
      activeTabId = tabId

      // Load URL after setup
      await view.webContents.loadURL(url)

      // Focus the BrowserView so it receives keyboard/scroll events
      view.webContents.focus()

      return { success: true, tabId, title: tab.title }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
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

      if (activeTabId === tabId) {
        const remaining = Array.from(tabs.values())
        if (remaining.length > 0) {
          const newTab = remaining[remaining.length - 1]
          if (newTab.view) {
            mainWindow.addBrowserView(newTab.view)
            applyBounds(newTab.view)
            activeTabId = newTab.id
          }
        } else {
          activeTabId = null
        }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Switch tab
  ipcMain.handle('browser:switchTab', (_, tabId: string) => {
    try {
      const newTab = tabs.get(tabId)
      if (!newTab?.view) return { success: false, error: 'Tab not found' }

      if (activeTabId) {
        const oldTab = tabs.get(activeTabId)
        if (oldTab?.view) mainWindow.removeBrowserView(oldTab.view)
      }

      mainWindow.addBrowserView(newTab.view)
      applyBounds(newTab.view)
      activeTabId = tabId

      // Focus the BrowserView so it receives keyboard/scroll events
      newTab.view.webContents.focus()

      return {
        success: true,
        url: newTab.url,
        title: newTab.title,
        canGoBack: newTab.view.webContents.canGoBack(),
        canGoForward: newTab.view.webContents.canGoForward(),
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Navigate tab
  ipcMain.handle('browser:navigate', async (_, { tabId, url }: { tabId: string; url: string }) => {
    try {
      const tab = tabs.get(tabId)
      if (!tab?.view) return { success: false, error: 'Tab not found' }
      await tab.view.webContents.loadURL(url)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Go back
  ipcMain.handle('browser:goBack', (_, tabId: string) => {
    try {
      const tab = tabs.get(tabId)
      if (!tab?.view) return { success: false, error: 'Tab not found' }
      if (tab.view.webContents.canGoBack()) {
        tab.view.webContents.goBack()
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Go forward
  ipcMain.handle('browser:goForward', (_, tabId: string) => {
    try {
      const tab = tabs.get(tabId)
      if (!tab?.view) return { success: false, error: 'Tab not found' }
      if (tab.view.webContents.canGoForward()) {
        tab.view.webContents.goForward()
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Reload
  ipcMain.handle('browser:reload', (_, tabId: string) => {
    try {
      const tab = tabs.get(tabId)
      if (!tab?.view) return { success: false, error: 'Tab not found' }
      tab.view.webContents.reload()
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Update bounds — called from renderer when layout changes
  ipcMain.handle('browser:updateBounds', (_, bounds: { x: number; y: number; width: number; height: number }) => {
    viewBounds = bounds
    if (activeTabId) {
      const tab = tabs.get(activeTabId)
      if (tab?.view) {
        applyBounds(tab.view)
      }
    }
    return { success: true }
  })

  // Hide all BrowserViews — called when switching away from browser mode
  ipcMain.handle('browser:hideAll', () => {
    if (activeTabId) {
      const tab = tabs.get(activeTabId)
      if (tab?.view) {
        mainWindow.removeBrowserView(tab.view)
      }
    }
    return { success: true }
  })

  // Show active BrowserView — called when switching back to browser mode
  ipcMain.handle('browser:showActive', () => {
    if (activeTabId) {
      const tab = tabs.get(activeTabId)
      if (tab?.view) {
        mainWindow.addBrowserView(tab.view)
        applyBounds(tab.view)
        // Focus so keyboard/scroll works immediately
        tab.view.webContents.focus()
      }
    }
    return { success: true }
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

  // Update view bounds on window resize
  mainWindow.on('resize', () => {
    if (activeTabId) {
      const tab = tabs.get(activeTabId)
      if (tab?.view) {
        applyBounds(tab.view)
      }
    }
  })
}
