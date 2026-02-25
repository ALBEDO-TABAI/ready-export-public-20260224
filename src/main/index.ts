import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from project root (before anything else)
config({ path: resolve(__dirname, '../../.env') })

import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// Import modules
import { setupAgentIPC } from './modules/claude-bridge/ipc-handler'
import { AgentManager } from './modules/claude-bridge/agent-manager'
import { setupBrowserIPC } from './modules/browser-engine/ipc-handler'
import { setupDocumentIPC } from './modules/document-engine/ipc-handler'
import { setupRSSIPC } from './modules/rss-engine/ipc-handler'
import { setupCalendarIPC } from './modules/calendar-engine/ipc-handler'
import { DatabaseManager } from './modules/database'

// Environment configuration
// In production, default to mock mode since real services are not fully ready yet.
// In development, control via ENABLE_MOCK_SERVICES env variable.
const ENABLE_MOCK_SERVICES = is.dev
  ? process.env.ENABLE_MOCK_SERVICES === 'true'
  : process.env.ENABLE_MOCK_SERVICES !== 'false' // default true in production

// Initialize database
const db = new DatabaseManager()

// Initialize agent manager
const agentManager = new AgentManager(ENABLE_MOCK_SERVICES)

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Setup IPC handlers
  setupAgentIPC(agentManager, mainWindow)
  setupBrowserIPC(mainWindow, ENABLE_MOCK_SERVICES)
  setupDocumentIPC(ENABLE_MOCK_SERVICES)
  setupRSSIPC(ENABLE_MOCK_SERVICES)
  setupCalendarIPC(ENABLE_MOCK_SERVICES)

  // Agent management IPC
  ipcMain.handle('agent:getDiagnostics', () => {
    return { success: true, data: agentManager.getDiagnostics() }
  })
  ipcMain.handle('agent:kill', (_, agent: string) => {
    const result = agentManager.killAgent(agent)
    return { success: result, error: result ? undefined : `Agent '${agent}' not found` }
  })

  // Window state IPC
  ipcMain.handle('window:minimize', () => {
    mainWindow.minimize()
  })
  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })
  ipcMain.handle('window:close', () => {
    mainWindow.close()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.ready.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Clean up before quit
app.on('before-quit', () => {
  db.close()
  agentManager.cleanup()
})
