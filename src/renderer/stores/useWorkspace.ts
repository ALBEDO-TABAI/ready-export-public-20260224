import { create } from 'zustand'

export interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: Date
}

interface WorkspaceState {
  currentPath: string
  files: FileItem[]
  selectedFile: string | null
  sidebarVisible: boolean
  sidebarWidth: number
  chatPanelVisible: boolean
  chatPanelWidth: number
  setCurrentPath: (path: string) => void
  setFiles: (files: FileItem[]) => void
  selectFile: (path: string | null) => void
  toggleSidebar: () => void
  toggleChatPanel: () => void
  refreshFiles: () => Promise<void>
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  currentPath: '/',
  files: [],
  selectedFile: null,
  sidebarVisible: true,
  sidebarWidth: 220,
  chatPanelVisible: true,
  chatPanelWidth: 380,

  setCurrentPath: (path) => {
    set({ currentPath: path })
    get().refreshFiles()
  },

  setFiles: (files) => set({ files }),

  selectFile: (path) => set({ selectedFile: path }),

  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),

  toggleChatPanel: () => set((state) => ({ chatPanelVisible: !state.chatPanelVisible })),

  refreshFiles: async () => {
    try {
      const { currentPath } = get()
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.document.listFiles(currentPath)
        
        if (result.success && result.items) {
          set({ 
            files: result.items.map((item: { modified: string | number | Date }) => ({
              ...item,
              modified: new Date(item.modified)
            }))
          })
        }
      } else {
        // Mock files for development
        set({
          files: [
            { name: 'documents', path: `${currentPath}/documents`, isDirectory: true, size: 0, modified: new Date() },
            { name: 'images', path: `${currentPath}/images`, isDirectory: true, size: 0, modified: new Date() },
            { name: 'readme.md', path: `${currentPath}/readme.md`, isDirectory: false, size: 1024, modified: new Date() }
          ]
        })
      }
    } catch (error) {
      console.error('Failed to refresh files:', error)
    }
  }
}))
