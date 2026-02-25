import { Search, PanelLeftClose, User, Globe, FileText, Image, Scissors, Rss, Calendar } from 'lucide-react'
import { useMode, type WorkbenchMode } from '../../stores/useMode'
import ModeSlider from './ModeSlider'

const modes: { id: WorkbenchMode; label: string; icon: React.ElementType }[] = [
  { id: 'browser', label: '浏览器', icon: Globe },
  { id: 'document', label: '文档', icon: FileText },
  { id: 'image', label: '图像', icon: Image },
  { id: 'video', label: '剪辑', icon: Scissors },
  { id: 'rss', label: 'RSS', icon: Rss },
  { id: 'calendar', label: '日程', icon: Calendar }
]

interface TopBarProps {
  onToggleSidebar?: () => void
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const { appMode, workbenchMode, splitMode, setWorkbenchMode, setSplitMode } = useMode()

  const handleModeClick = (mode: WorkbenchMode, e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Shift+click: add as split mode (if different from current primary)
      if (mode !== workbenchMode) {
        setSplitMode(mode)
      }
    } else {
      // Normal click: set as primary, clear split
      setWorkbenchMode(mode)
    }
  }

  return (
    <div
      className="h-[38px] flex items-center justify-between drag-region"
      style={{
        background: 'var(--bg-panel)',
        paddingLeft: 72,
        paddingRight: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      {/* Left: Mode Slider + Mode Tabs */}
      <div className="flex items-center gap-3 no-drag">
        <ModeSlider />

        {appMode === 'workbench' && (
          <div className="flex items-center gap-0">
            {modes.map((mode) => {
              const Icon = mode.icon
              const isPrimary = workbenchMode === mode.id
              const isSplit = splitMode === mode.id
              const isActive = isPrimary || isSplit
              return (
                <button
                  key={mode.id}
                  onClick={(e) => handleModeClick(mode.id, e)}
                  className="flex items-center gap-[6px] rounded-[10px] transition-all duration-200 ease-out"
                  style={{
                    padding: '5px 10px',
                    height: 26,
                    opacity: 0.93,
                    background: isPrimary
                      ? 'rgba(91,141,239,0.09)'
                      : isSplit
                        ? 'rgba(91,141,239,0.05)'
                        : 'transparent',
                    color: isActive ? '#5B8DEF' : '#8A8A8A',
                    // Visual indicator for split mode: underline dot
                    ...(isSplit ? { borderBottom: '2px solid #5B8DEF' } : {}),
                  }}
                  title={`${mode.label}${isSplit ? ' (分屏)' : ''}${!isActive ? '\n按住 Shift 点击可分屏' : ''}`}
                >
                  <Icon
                    className="flex-shrink-0"
                    style={{ width: 13, height: 13 }}
                    strokeWidth={2}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: isActive ? 600 : 500,
                      lineHeight: '16px',
                    }}
                  >
                    {mode.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Right: Search + User + Toggle */}
      <div className="flex items-center gap-[10px] no-drag">
        <button
          title="全局搜索 (⌘K)"
          onClick={() => alert('全局搜索功能即将推出 🔍')}
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
        >
          <Search style={{ width: 15, height: 15 }} className="text-[#6A6A6A]" strokeWidth={2} />
        </button>

        <button
          title="用户设置"
          onClick={() => alert('用户菜单即将推出 👤')}
          className="flex items-center justify-center"
          style={{
            width: 24, height: 24,
            borderRadius: 12,
            background: 'rgba(91,141,239,0.09)'
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: '#5B8DEF' }}>U</span>
        </button>

        <button
          onClick={onToggleSidebar}
          title="收起/展开聊天面板"
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
        >
          <PanelLeftClose style={{ width: 15, height: 15 }} className="text-[#6A6A6A]" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
