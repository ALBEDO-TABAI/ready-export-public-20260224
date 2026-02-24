import { Search, PanelLeftClose, User } from 'lucide-react'
import { useMode, type WorkbenchMode } from '../../stores/useMode'
import ModeSlider from './ModeSlider'

const modes: { id: WorkbenchMode; label: string; icon: string }[] = [
  { id: 'browser', label: '浏览器', icon: '🌐' },
  { id: 'document', label: '文档', icon: '📄' },
  { id: 'image', label: '图像', icon: '🖼️' },
  { id: 'video', label: '剪辑', icon: '✂️' },
  { id: 'rss', label: 'RSS', icon: '📰' },
  { id: 'calendar', label: '日程', icon: '🗓️' }
]

interface TopBarProps {
  onToggleSidebar?: () => void
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const { appMode, workbenchMode, setWorkbenchMode } = useMode()

  return (
    <div 
      className="h-[38px] flex items-center justify-between px-3 border-b border-[var(--border-default)]"
      style={{ 
        background: 'var(--bg-panel)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
      }}
    >
      {/* Left: Mode Slider + Mode Tabs */}
      <div className="flex items-center gap-3">
        <ModeSlider />
        
        {appMode === 'workbench' && (
          <div className="flex items-center gap-1">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setWorkbenchMode(mode.id)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-[12px] font-medium
                  transition-all duration-200 ease-out
                  ${workbenchMode === mode.id 
                    ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]' 
                    : 'text-[var(--text-gray)] hover:bg-black/5 hover:text-[var(--text-body)]'
                  }
                `}
              >
                <span className="text-[13px]">{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Search + User + Toggle */}
      <div className="flex items-center gap-2.5">
        <button className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
          <Search className="w-[15px] h-[15px] text-[#6A6A6A]" strokeWidth={2} />
        </button>
        
        <div 
          className="w-6 h-6 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--color-blue-light)' }}
        >
          <User className="w-3.5 h-3.5 text-[var(--color-blue)]" strokeWidth={2} />
        </div>
        
        <button 
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
        >
          <PanelLeftClose className="w-[15px] h-[15px] text-[#6A6A6A]" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
