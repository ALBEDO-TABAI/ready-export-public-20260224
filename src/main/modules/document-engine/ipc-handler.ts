import { ipcMain } from 'electron'
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join } from 'path'

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
}
