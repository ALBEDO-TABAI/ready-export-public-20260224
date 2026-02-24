import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMode } from '../stores/useMode'
import { useWorkspace } from '../stores/useWorkspace'

/**
 * Global keyboard shortcuts for the Ready app.
 * Mount this hook once at the top of the component tree.
 */
export function useKeyboardShortcuts() {
    const navigate = useNavigate()
    const { setWorkbenchMode } = useMode()
    const { toggleSidebar } = useWorkspace()

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const meta = e.metaKey || e.ctrlKey

            // Cmd+, → Settings
            if (meta && e.key === ',') {
                e.preventDefault()
                navigate('/settings')
                return
            }

            // Cmd+B → Toggle sidebar
            if (meta && e.key === 'b') {
                e.preventDefault()
                toggleSidebar()
                return
            }

            // Cmd+1..6 → Switch workbench modes
            if (meta && !e.shiftKey) {
                const modeMap: Record<string, string> = {
                    '1': 'browser',
                    '2': 'document',
                    '3': 'image',
                    '4': 'video',
                    '5': 'rss',
                    '6': 'calendar'
                }
                if (modeMap[e.key]) {
                    e.preventDefault()
                    setWorkbenchMode(modeMap[e.key] as any)
                    return
                }
            }
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [navigate, setWorkbenchMode, toggleSidebar])
}
