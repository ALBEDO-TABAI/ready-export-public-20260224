import { create } from 'zustand'

export type WorkbenchMode = 'browser' | 'document' | 'image' | 'video' | 'rss' | 'calendar'
export type AppMode = 'workbench' | 'ready'

interface ModeState {
  appMode: AppMode
  workbenchMode: WorkbenchMode
  readySubMode: WorkbenchMode
  setAppMode: (mode: AppMode) => void
  setWorkbenchMode: (mode: WorkbenchMode) => void
  setReadySubMode: (mode: WorkbenchMode) => void
  toggleMode: () => void
}

export const useMode = create<ModeState>((set) => ({
  appMode: 'workbench',
  workbenchMode: 'browser',
  readySubMode: 'browser',
  setAppMode: (mode) => set({ appMode: mode }),
  setWorkbenchMode: (mode) => set({ workbenchMode: mode }),
  setReadySubMode: (mode) => set({ readySubMode: mode }),
  toggleMode: () => set((state) => ({ 
    appMode: state.appMode === 'workbench' ? 'ready' : 'workbench' 
  }))
}))
