import { Folder, Search, Puzzle, Settings } from 'lucide-react'

interface IconRailProps {
  activeIcon?: string
  onIconClick?: (icon: string) => void
}

const topIcons = [
  { id: 'folder', icon: Folder, label: '文件' },
  { id: 'search', icon: Search, label: '搜索' },
  { id: 'extensions', icon: Puzzle, label: '插件' }
]

export default function IconRail({ activeIcon = 'folder', onIconClick }: IconRailProps) {
  const handleClick = (id: string) => {
    if (id === 'search') {
      alert('全局搜索功能即将推出 🔍')
    } else if (id === 'extensions') {
      alert('插件市场即将推出 🧩')
    } else {
      onIconClick?.(id)
    }
  }

  return (
    <div
      className="w-11 flex flex-col justify-between py-2.5 border-r border-[var(--border-default)]"
      style={{
        background: 'var(--bg-panel)',
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)'
      }}
    >
      {/* Top Icons */}
      <div className="flex flex-col items-center gap-1.5">
        {topIcons.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => handleClick(id)}
            title={label}
            className={`
              w-[34px] h-[34px] rounded-[10px] flex items-center justify-center
              transition-all duration-200
              ${activeIcon === id
                ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]'
                : 'text-[#6A6A6A] hover:bg-black/5'
              }
            `}
          >
            <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
        ))}
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => onIconClick?.('settings')}
          title="设置"
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[#6A6A6A] hover:bg-black/5 transition-all duration-200"
        >
          <Settings className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
