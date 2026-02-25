import { create } from 'zustand'

export interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: Date
}

interface WorkspaceState {
  // State
  workspaceRoot: string | null
  currentPath: string
  files: FileItem[]
  selectedFile: string | null
  expandedDirs: Set<string>
  dirChildren: Map<string, FileItem[]>
  sidebarVisible: boolean
  sidebarWidth: number
  chatPanelVisible: boolean
  chatPanelWidth: number
  renamingPath: string | null
  creatingType: 'file' | 'folder' | null

  // Navigation
  setCurrentPath: (path: string) => void
  setFiles: (files: FileItem[]) => void
  selectFile: (path: string | null) => void
  toggleSidebar: () => void
  toggleChatPanel: () => void
  refreshFiles: () => Promise<void>
  toggleDir: (path: string) => Promise<void>
  loadDirChildren: (path: string) => Promise<FileItem[]>

  // Workspace
  setWorkspaceRoot: (path: string) => void
  openFolderDialog: () => Promise<void>

  // File operations
  createFile: (name: string) => Promise<boolean>
  createFolder: (name: string) => Promise<boolean>
  renameItem: (oldPath: string, newName: string) => Promise<boolean>
  deleteItem: (path: string) => Promise<boolean>
  showInFolder: (path: string) => Promise<void>
  copyPathToClipboard: (path: string) => void

  // Inline editing state
  startRenaming: (path: string) => void
  cancelRenaming: () => void
  startCreating: (type: 'file' | 'folder') => void
  cancelCreating: () => void
}

// Helper to get dirname
const getDirName = (path: string): string => {
  const idx = path.lastIndexOf('/')
  return idx <= 0 ? '/' : path.slice(0, idx)
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  workspaceRoot: null,
  currentPath: '/',
  files: [],
  selectedFile: null,
  expandedDirs: new Set<string>(),
  dirChildren: new Map<string, FileItem[]>(),
  sidebarVisible: true,
  sidebarWidth: 220,
  chatPanelVisible: true,
  chatPanelWidth: 380,
  renamingPath: null,
  creatingType: null,

  setCurrentPath: (path) => {
    set({ currentPath: path })
    get().refreshFiles()
  },

  setFiles: (files) => set({ files }),

  selectFile: (path) => set({ selectedFile: path }),

  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  toggleChatPanel: () => set((state) => ({ chatPanelVisible: !state.chatPanelVisible })),

  loadDirChildren: async (dirPath) => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.document.listFiles(dirPath)
        if (result.success && result.items) {
          const items = result.items
            .map((item: { modified: string | number | Date }) => ({
              ...item,
              modified: new Date(item.modified)
            }))
            .sort((a: FileItem, b: FileItem) => {
              if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
              return a.name.localeCompare(b.name)
            })
          set((state) => {
            const next = new Map(state.dirChildren)
            next.set(dirPath, items)
            return { dirChildren: next }
          })
          return items
        }
      }
    } catch (error) {
      console.warn('Failed to load dir children:', dirPath, error)
    }
    return []
  },

  toggleDir: async (path) => {
    const { expandedDirs, dirChildren, loadDirChildren } = get()
    const next = new Set(expandedDirs)
    if (next.has(path)) {
      next.delete(path)
      set({ expandedDirs: next })
    } else {
      next.add(path)
      set({ expandedDirs: next })
      // Lazy load children if not cached
      if (!dirChildren.has(path)) {
        await loadDirChildren(path)
      }
    }
  },

  setWorkspaceRoot: (path) => {
    set({ workspaceRoot: path, currentPath: path })
    localStorage.setItem('ready-workspace-root', path)
    get().refreshFiles()
  },

  openFolderDialog: async () => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.document.openFolder()
        if (result.success && result.path) {
          get().setWorkspaceRoot(result.path)
        }
      }
    } catch (error) {
      console.error('Failed to open folder dialog:', error)
    }
  },

  refreshFiles: async () => {
    try {
      const { currentPath } = get()

      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.document.listFiles(currentPath)

        if (result.success && result.items) {
          const items = result.items
            .map((item: { modified: string | number | Date }) => ({
              ...item,
              modified: new Date(item.modified)
            }))
            // Sort: directories first, then by name
            .sort((a: FileItem, b: FileItem) => {
              if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
              return a.name.localeCompare(b.name)
            })
            // Hide dotfiles
            .filter((item: FileItem) => !item.name.startsWith('.'))

          set({ files: items })
        }
      } else {
        // Mock files for development
        set({
          files: [
            { name: 'documents', path: `${currentPath === '/' ? '' : currentPath}/documents`, isDirectory: true, size: 0, modified: new Date() },
            { name: 'images', path: `${currentPath === '/' ? '' : currentPath}/images`, isDirectory: true, size: 0, modified: new Date() },
            { name: '项目说明.md', path: `${currentPath === '/' ? '' : currentPath}/项目说明.md`, isDirectory: false, size: 2048, modified: new Date() },
            { name: '需求文档.md', path: `${currentPath === '/' ? '' : currentPath}/需求文档.md`, isDirectory: false, size: 4096, modified: new Date() },
            { name: '设计稿.png', path: `${currentPath === '/' ? '' : currentPath}/设计稿.png`, isDirectory: false, size: 102400, modified: new Date() },
            { name: '演示视频.mp4', path: `${currentPath === '/' ? '' : currentPath}/演示视频.mp4`, isDirectory: false, size: 5242880, modified: new Date() },
            { name: '数据表.xlsx', path: `${currentPath === '/' ? '' : currentPath}/数据表.xlsx`, isDirectory: false, size: 8192, modified: new Date() }
          ]
        })
      }
    } catch (error) {
      console.error('Failed to refresh files:', error)
    }
  },

  createFile: async (name) => {
    const { currentPath } = get()
    const filePath = `${currentPath}/${name}`
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.document.createFile(filePath)
        if (result.success) {
          await get().refreshFiles()
          set({ creatingType: null, selectedFile: filePath })
          return true
        }
      } else {
        // Mock: just add to files list
        set((state) => ({
          files: [...state.files, { name, path: filePath, isDirectory: false, size: 0, modified: new Date() }],
          creatingType: null,
          selectedFile: filePath
        }))
        return true
      }
    } catch (error) {
      console.error('Failed to create file:', error)
    }
    return false
  },

  createFolder: async (name) => {
    const { currentPath } = get()
    const folderPath = `${currentPath}/${name}`
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.document.mkdir(folderPath)
        if (result.success) {
          await get().refreshFiles()
          set({ creatingType: null })
          return true
        }
      } else {
        set((state) => ({
          files: [...state.files, { name, path: folderPath, isDirectory: true, size: 0, modified: new Date() }],
          creatingType: null
        }))
        return true
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
    return false
  },

  renameItem: async (oldPath, newName) => {
    const dir = getDirName(oldPath)
    const newPath = `${dir}/${newName}`
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.document.rename(oldPath, newPath)
        if (result.success) {
          await get().refreshFiles()
          set({ renamingPath: null })
          return true
        }
      } else {
        set((state) => ({
          files: state.files.map(f =>
            f.path === oldPath ? { ...f, name: newName, path: newPath } : f
          ),
          renamingPath: null
        }))
        return true
      }
    } catch (error) {
      console.error('Failed to rename:', error)
    }
    return false
  },

  deleteItem: async (path) => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.document.deleteItem(path)
        if (result.success) {
          await get().refreshFiles()
          if (get().selectedFile === path) set({ selectedFile: null })
          return true
        }
      } else {
        set((state) => ({
          files: state.files.filter(f => f.path !== path),
          selectedFile: state.selectedFile === path ? null : state.selectedFile
        }))
        return true
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
    return false
  },

  showInFolder: async (path) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.document.showInFolder(path)
      }
    } catch (error) {
      console.error('showInFolder failed:', error)
    }
  },

  copyPathToClipboard: (path) => {
    navigator.clipboard.writeText(path).catch(console.error)
  },

  startRenaming: (path) => set({ renamingPath: path }),
  cancelRenaming: () => set({ renamingPath: null }),
  startCreating: (type) => set({ creatingType: type }),
  cancelCreating: () => set({ creatingType: null })
}))
