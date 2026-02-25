import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import {
  readFileSync, writeFileSync, readdirSync, statSync, existsSync,
  mkdirSync, renameSync, copyFileSync, unlinkSync, rmSync, cpSync
} from 'fs'
import { join, basename, dirname } from 'path'
import { homedir } from 'os'

// Lazy-loaded libraries
let mammothLib: typeof import('mammoth') | null = null
let xlsxLib: typeof import('xlsx') | null = null

async function getMammoth(): Promise<typeof import('mammoth') | null> {
  if (mammothLib) return mammothLib
  try {
    mammothLib = await import('mammoth')
    return mammothLib
  } catch {
    return null
  }
}

async function getXlsx(): Promise<typeof import('xlsx') | null> {
  if (xlsxLib) return xlsxLib
  try {
    xlsxLib = await import('xlsx')
    return xlsxLib
  } catch {
    return null
  }
}

export function setupDocumentIPC(useMock = false): void {
  // Read file
  ipcMain.handle('document:read', async (_, path: string) => {
    try {
      if (useMock) {
        return {
          success: true,
          content: `[Mock] Content of ${path}`,
          mock: true
        }
      }

      if (!existsSync(path)) {
        return { success: false, error: 'File not found', errorCode: 'FILE_NOT_FOUND' }
      }

      const content = readFileSync(path, 'utf-8')
      return { success: true, content }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage, errorCode: 'PARSE_ERROR' }
    }
  })

  // Write file
  ipcMain.handle('document:write', async (_, { path, content }: { path: string; content: string }) => {
    try {
      if (useMock) {
        return { success: true, mock: true }
      }

      writeFileSync(path, content, 'utf-8')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // List directory
  ipcMain.handle('document:list', async (_, dir: string) => {
    try {
      if (useMock) {
        return {
          success: true,
          items: [
            { name: 'documents', path: `${dir}/documents`, isDirectory: true, size: 0, modified: new Date() },
            { name: 'images', path: `${dir}/images`, isDirectory: true, size: 0, modified: new Date() },
            { name: 'readme.md', path: `${dir}/readme.md`, isDirectory: false, size: 1024, modified: new Date() }
          ],
          mock: true
        }
      }

      if (!existsSync(dir)) {
        return { success: false, error: 'Directory not found', errorCode: 'FILE_NOT_FOUND' }
      }

      const items = readdirSync(dir).map(name => {
        const filePath = join(dir, name)
        const stats = statSync(filePath)
        return {
          name,
          path: filePath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime
        }
      })

      return { success: true, items }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage, errorCode: 'PARSE_ERROR' }
    }
  })

  // Parse docx — real parsing with mammoth, fallback to mock
  ipcMain.handle('document:parseDocx', async (_, path: string) => {
    try {
      if (useMock) {
        return {
          success: true,
          content: '<p>[Mock] DOCX parsing requires mammoth.js</p><p>File: ' + path + '</p>',
          html: '<p>[Mock] DOCX parsing requires mammoth.js</p>',
          mock: true
        }
      }

      if (!existsSync(path)) {
        return { success: false, error: 'File not found', errorCode: 'FILE_NOT_FOUND', file: path }
      }

      const mammoth = await getMammoth()
      if (!mammoth) {
        return {
          success: false,
          error: 'DOCX parsing library (mammoth) is not installed. Run: npm install mammoth',
          errorCode: 'LIBRARY_NOT_INSTALLED'
        }
      }

      const buffer = readFileSync(path)
      const result = await mammoth.convertToHtml({ buffer })

      return {
        success: true,
        content: result.value,
        html: result.value,
        messages: result.messages,
        file: path
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: errorMessage,
        errorCode: 'PARSE_ERROR',
        file: path
      }
    }
  })

  // Parse xlsx — real parsing with SheetJS, fallback to mock
  ipcMain.handle('document:parseXlsx', async (_, path: string) => {
    try {
      if (useMock) {
        return {
          success: true,
          sheets: ['Sheet1'],
          data: { 'Sheet1': [['A1', 'B1'], ['A2', 'B2']] },
          file: path,
          mock: true
        }
      }

      if (!existsSync(path)) {
        return { success: false, error: 'File not found', errorCode: 'FILE_NOT_FOUND', file: path }
      }

      const xlsx = await getXlsx()
      if (!xlsx) {
        return {
          success: false,
          error: 'XLSX parsing library (xlsx) is not installed. Run: npm install xlsx',
          errorCode: 'LIBRARY_NOT_INSTALLED'
        }
      }

      const buffer = readFileSync(path)
      const workbook = xlsx.read(buffer, { type: 'buffer' })

      const data: Record<string, unknown[][]> = {}
      for (const sheetName of workbook.SheetNames) {
        data[sheetName] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as unknown[][]
      }

      return {
        success: true,
        sheets: workbook.SheetNames,
        data,
        file: path
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: errorMessage,
        errorCode: 'PARSE_ERROR',
        originalError: errorMessage,
        file: path
      }
    }
  })

  // --- File Management IPC Handlers ---

  // Create directory
  ipcMain.handle('document:mkdir', async (_, path: string) => {
    try {
      if (useMock) return { success: true, mock: true }
      mkdirSync(path, { recursive: true })
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Rename file/directory
  ipcMain.handle('document:rename', async (_, { oldPath, newPath }: { oldPath: string; newPath: string }) => {
    try {
      if (useMock) return { success: true, mock: true }
      if (!existsSync(oldPath)) return { success: false, error: 'Source not found' }
      if (existsSync(newPath)) return { success: false, error: 'Target already exists' }
      renameSync(oldPath, newPath)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Delete file/directory
  ipcMain.handle('document:delete', async (_, path: string) => {
    try {
      if (useMock) return { success: true, mock: true }
      if (!existsSync(path)) return { success: false, error: 'Not found' }
      const stats = statSync(path)
      if (stats.isDirectory()) {
        rmSync(path, { recursive: true, force: true })
      } else {
        unlinkSync(path)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Copy file/directory
  ipcMain.handle('document:copy', async (_, { src, dest }: { src: string; dest: string }) => {
    try {
      if (useMock) return { success: true, mock: true }
      if (!existsSync(src)) return { success: false, error: 'Source not found' }
      const stats = statSync(src)
      if (stats.isDirectory()) {
        cpSync(src, dest, { recursive: true })
      } else {
        copyFileSync(src, dest)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Move file/directory
  ipcMain.handle('document:move', async (_, { src, dest }: { src: string; dest: string }) => {
    try {
      if (useMock) return { success: true, mock: true }
      if (!existsSync(src)) return { success: false, error: 'Source not found' }
      renameSync(src, dest)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Get file stats
  ipcMain.handle('document:stat', async (_, path: string) => {
    try {
      if (useMock) {
        return { success: true, mock: true, stat: { size: 1024, isDirectory: false, modified: new Date() } }
      }
      if (!existsSync(path)) return { success: false, error: 'Not found' }
      const stats = statSync(path)
      return {
        success: true,
        stat: {
          size: stats.size,
          isDirectory: stats.isDirectory(),
          modified: stats.mtime,
          created: stats.birthtime
        }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Open folder dialog — let user choose a workspace directory
  ipcMain.handle('document:openFolder', async () => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return { success: false, error: 'No window' }
      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
        title: '选择工作区目录'
      })
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'cancelled' }
      }
      return { success: true, path: result.filePaths[0] }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Get home directory
  ipcMain.handle('document:getHome', async () => {
    return { success: true, path: homedir() }
  })

  // Reveal in system file manager
  ipcMain.handle('document:showInFolder', async (_, path: string) => {
    try {
      if (!existsSync(path)) return { success: false, error: 'Not found' }
      shell.showItemInFolder(path)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Create a new empty file
  ipcMain.handle('document:createFile', async (_, path: string) => {
    try {
      if (useMock) return { success: true, mock: true }
      if (existsSync(path)) return { success: false, error: 'File already exists' }
      writeFileSync(path, '', 'utf-8')
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
}
