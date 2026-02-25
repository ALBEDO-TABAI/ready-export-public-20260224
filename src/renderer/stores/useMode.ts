import { create } from 'zustand'

export type WorkbenchMode = 'browser' | 'document' | 'image' | 'video' | 'rss' | 'calendar'
export type AppMode = 'workbench' | 'ready'

interface ModeState {
  appMode: AppMode
  workbenchMode: WorkbenchMode
  splitMode: WorkbenchMode | null
  readySubMode: WorkbenchMode
  setAppMode: (mode: AppMode) => void
  setWorkbenchMode: (mode: WorkbenchMode) => void
  setSplitMode: (mode: WorkbenchMode | null) => void
  setReadySubMode: (mode: WorkbenchMode) => void
  toggleMode: () => void
}

export const useMode = create<ModeState>((set) => ({
  appMode: 'workbench',
  workbenchMode: 'browser',
  splitMode: null,
  readySubMode: 'browser',
  setAppMode: (mode) => set({ appMode: mode }),
  setWorkbenchMode: (mode) => set({ workbenchMode: mode, splitMode: null }),
  setSplitMode: (mode) => set({ splitMode: mode }),
  setReadySubMode: (mode) => set({ readySubMode: mode }),
  toggleMode: () => set((state) => ({
    appMode: state.appMode === 'workbench' ? 'ready' : 'workbench'
  }))
}))
