import { useEffect } from 'react'
import TopBar from '../components/layout/TopBar'
import IconRail from '../components/layout/IconRail'
import SidePanel from '../components/layout/SidePanel'
import ChatPanel from '../components/agent/ChatPanel'
import BrowserMode from './modes/BrowserMode'
import DocumentMode from './modes/DocumentMode'
import ImageMode from './modes/ImageMode'
import VideoMode from './modes/VideoMode'
import RSSMode from './modes/RSSMode'
import CalendarMode from './modes/CalendarMode'
import { useMode } from '../stores/useMode'
import { useWorkspace } from '../stores/useWorkspace'

export default function WorkbenchMode() {
  const { workbenchMode } = useMode()
  const { toggleSidebar, refreshFiles } = useWorkspace()

  // Initialize workspace on mount
  useEffect(() => {
    const initWorkspace = async () => {
      try {
        await refreshFiles()
      } catch (error) {
        console.warn('Workspace init failed, fallback to mock files')
      }
    }
    initWorkspace()
  }, [refreshFiles])

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
        <IconRail />
        <SidePanel />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-content)]">
          {renderMode()}
        </div>
        
        <ChatPanel />
      </div>
    </div>
  )
}
