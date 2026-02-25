import { useEffect, useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../stores/useWorkspace'
import { useMode } from '../stores/useMode'
import TopBar from '../components/layout/TopBar'
import IconRail from '../components/layout/IconRail'
import SidePanel from '../components/layout/SidePanel'
import ChatPanel from '../components/agent/ChatPanel'
import StatusBar from '../components/layout/StatusBar'
import BrowserMode from './modes/BrowserMode'
import DocumentMode from './modes/DocumentMode'
import ImageMode from './modes/ImageMode'
import VideoMode from './modes/VideoMode'
import RSSMode from './modes/RSSMode'
import CalendarMode from './modes/CalendarMode'

// --- Resize Handle ---
function ResizeHandle({
  onResize,
  direction = 'right'
}: {
  onResize: (delta: number) => void
  direction?: 'right' | 'left'
}) {
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startX.current = e.clientX
    setDragging(true)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current
      startX.current = e.clientX
      onResize(direction === 'right' ? delta : -delta)
    }
    const handleMouseUp = () => setDragging(false)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [dragging, onResize, direction])

  return (
    <div
      className={`resize-handle ${dragging ? 'active' : ''}`}
      onMouseDown={handleMouseDown}
    />
  )
}

export default function WorkbenchMode() {
  const {
    refreshFiles,
    toggleSidebar,
    sidebarVisible,
    chatPanelVisible,
  } = useWorkspace()
  const { workbenchMode } = useMode()
  const navigate = useNavigate()

  // Initialize workspace on mount
  useEffect(() => {
    const initWorkspace = async () => {
      try {
        const savedRoot = localStorage.getItem('ready-workspace-root')

        if (typeof window !== 'undefined' && window.electronAPI) {
          if (savedRoot) {
            useWorkspace.getState().setWorkspaceRoot(savedRoot)
          } else {
            const homeResult = await window.electronAPI.document.getHome()
            if (homeResult.success && homeResult.path) {
              useWorkspace.getState().setWorkspaceRoot(homeResult.path)
            }
          }
        } else {
          await refreshFiles()
        }
      } catch (error) {
        console.warn('Workspace init failed, fallback to mock files')
        await refreshFiles()
      }
    }
    initWorkspace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleIconClick = (icon: string) => {
    if (icon === 'settings') {
      navigate('/settings')
    }
  }

  const handleSidebarResize = useCallback((delta: number) => {
    useWorkspace.setState((state) => ({
      sidebarWidth: Math.max(160, Math.min(400, state.sidebarWidth + delta))
    }))
  }, [])

  const handleChatResize = useCallback((delta: number) => {
    useWorkspace.setState((state) => ({
      chatPanelWidth: Math.max(280, Math.min(600, state.chatPanelWidth + delta))
    }))
  }, [])

  const renderMode = () => {
    switch (workbenchMode) {
      case 'browser':
        return <BrowserMode />
      case 'document':
        return <DocumentMode />
      case 'image':
        return <ImageMode />
      case 'video':
        return <VideoMode />
      case 'rss':
        return <RSSMode />
      case 'calendar':
        return <CalendarMode />
      default:
        return <BrowserMode />
    }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar onToggleSidebar={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden">
        <IconRail onIconClick={handleIconClick} />
        <SidePanel />

        {/* Sidebar resize handle */}
        {sidebarVisible && (
          <ResizeHandle onResize={handleSidebarResize} direction="right" />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-content)]">
          {renderMode()}
        </div>

        {/* Chat panel resize handle */}
        {chatPanelVisible && (
          <ResizeHandle onResize={handleChatResize} direction="left" />
        )}

        <ChatPanel />
      </div>

      <StatusBar />
    </div>
  )
}
