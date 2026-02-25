import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
    theme: Theme
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

// Read initial theme from localStorage
const getStoredTheme = (): Theme => {
    try {
        const stored = localStorage.getItem('ready-theme')
        if (stored === 'dark' || stored === 'light') return stored
    } catch { }
    return 'light'
}

// Apply theme to the DOM
const applyTheme = (theme: Theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ready-theme', theme)
}

export const useTheme = create<ThemeState>((set) => {
    // Apply initial theme on load
    const initial = getStoredTheme()
    applyTheme(initial)

    return {
        theme: initial,
        setTheme: (theme) => {
            applyTheme(theme)
            set({ theme })
        },
        toggleTheme: () => set((state) => {
            const next = state.theme === 'light' ? 'dark' : 'light'
            applyTheme(next)
            return { theme: next }
        })
    }
})
