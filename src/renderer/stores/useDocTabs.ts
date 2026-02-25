import { create } from 'zustand'

export interface DocTab {
    id: string
    path: string | null  // null = untitled temp doc
    title: string
    content: string
    isDirty: boolean
}

interface DocTabsState {
    tabs: DocTab[]
    activeTabId: string
    splitTabId: string | null
    splitRatio: number

    openTab: (path: string) => void
    closeTab: (id: string) => void
    setActiveTab: (id: string) => void
    updateTabContent: (id: string, content: string) => void
    markTabSaved: (id: string) => void
    reorderTabs: (fromIndex: number, toIndex: number) => void
    setSplitTab: (id: string | null) => void
    setSplitRatio: (ratio: number) => void
}

let tabCounter = 0
const makeId = () => `doc-${++tabCounter}`

export const useDocTabs = create<DocTabsState>((set, get) => ({
    tabs: [
        {
            id: makeId(),
            path: null,
            title: '新文档',
            content: '',
            isDirty: false,
        }
    ],
    activeTabId: 'doc-1',
    splitTabId: null,
    splitRatio: 50,

    openTab: (path: string) => {
        const { tabs } = get()

        // Empty path = create new blank tab
        if (!path) {
            const id = makeId()
            set({
                tabs: [...tabs, { id, path: null, title: '新文档', content: '', isDirty: false }],
                activeTabId: id,
            })
            return
        }

        // If already open, just activate it
        const existing = tabs.find(t => t.path === path)
        if (existing) {
            set({ activeTabId: existing.id })
            return
        }
        // Create new tab
        const id = makeId()
        const title = path.split('/').pop() || '未知文件'
        const newTab: DocTab = {
            id,
            path,
            title,
            content: '',  // Will be loaded by DocumentEditor
            isDirty: false,
        }
        set({
            tabs: [...tabs, newTab],
            activeTabId: id,
        })
    },

    closeTab: (id: string) => {
        const { tabs, activeTabId, splitTabId } = get()
        const newTabs = tabs.filter(t => t.id !== id)

        // If no tabs left, create a new blank one
        if (newTabs.length === 0) {
            const newId = makeId()
            set({
                tabs: [{ id: newId, path: null, title: '新文档', content: '', isDirty: false }],
                activeTabId: newId,
                splitTabId: null,
            })
            return
        }

        const updates: Partial<DocTabsState> = { tabs: newTabs }

        // If closed tab was the split tab, clear split
        if (splitTabId === id) {
            updates.splitTabId = null
        }

        // If closed tab was active, switch to neighbor
        if (activeTabId === id) {
            const oldIndex = tabs.findIndex(t => t.id === id)
            const newActive = newTabs[Math.min(oldIndex, newTabs.length - 1)]
            updates.activeTabId = newActive.id
        }

        set(updates)
    },

    setActiveTab: (id: string) => {
        set({ activeTabId: id, splitTabId: null })
    },

    updateTabContent: (id: string, content: string) => {
        set({
            tabs: get().tabs.map(t =>
                t.id === id ? { ...t, content, isDirty: true } : t
            )
        })
    },

    markTabSaved: (id: string) => {
        set({
            tabs: get().tabs.map(t =>
                t.id === id ? { ...t, isDirty: false } : t
            )
        })
    },

    reorderTabs: (fromIndex: number, toIndex: number) => {
        const tabs = [...get().tabs]
        const [moved] = tabs.splice(fromIndex, 1)
        tabs.splice(toIndex, 0, moved)
        set({ tabs })
    },

    setSplitTab: (id: string | null) => {
        set({ splitTabId: id })
    },

    setSplitRatio: (ratio: number) => {
        set({ splitRatio: Math.max(20, Math.min(80, ratio)) })
    },
}))
