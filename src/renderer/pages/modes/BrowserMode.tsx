import { useState } from 'react'
import { RefreshCw, Plus, Star, X, Split, LayoutGrid, Columns2, Rows2 } from 'lucide-react'

interface Tab {
  id: string
  url: string
  title: string
  favicon?: string
  active?: boolean
}

export default function BrowserMode() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', url: 'https://www.google.com', title: 'Google', active: true },
    { id: '2', url: 'https://github.com', title: 'GitHub' }
  ])
  const [urlInput, setUrlInput] = useState('')
  const [showSplitMenu, setShowSplitMenu] = useState(false)

  const activeTab = tabs.find(t => t.active)

  const handleNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      url: 'about:blank',
      title: '新标签页'
    }
    setTabs([...tabs, newTab])
  }

  const handleCloseTab = (id: string) => {
    setTabs(tabs.filter(t => t.id !== id))
  }

  const handleTabClick = (id: string) => {
    setTabs(tabs.map(t => ({ ...t, active: t.id === id })))
  }

  const handleNavigate = () => {
    if (!urlInput.trim() || !activeTab) return
    
    let url = urlInput
    if (!url.startsWith('http')) {
      url = `https://${url}`
    }
    
    setTabs(tabs.map(t => 
      t.id === activeTab.id ? { ...t, url, title: url } : t
    ))
    setUrlInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div 
        className="h-[34px] flex items-center px-2 border-b border-[var(--border-default)]"
        style={{ background: 'var(--bg-toolbar)' }}
      >
        {/* Refresh */}
        <button className="p-1 rounded hover:bg-black/5 transition-colors mr-1">
          <RefreshCw className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={2} />
        </button>

        {/* Tabs */}
        <div className="flex-1 flex items-center gap-1 overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-1 rounded-md text-[12px] max-w-[160px]
                transition-all duration-200
                ${tab.active 
                  ? 'bg-white border border-[var(--border-default)] shadow-sm' 
                  : 'hover:bg-black/5'
                }
              `}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-[var(--bg-canvas)] flex items-center justify-center text-[8px]">
                🌐
              </span>
              <span className="truncate flex-1">{tab.title}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id) }}
                className="p-0.5 rounded hover:bg-black/10 transition-colors"
              >
                <X className="w-3 h-3" strokeWidth={2} />
              </button>
            </button>
          ))}
        </div>

        {/* New Tab */}
        <button 
          onClick={handleNewTab}
          className="p-1 rounded hover:bg-black/5 transition-colors mx-1"
        >
          <Plus className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={2} />
        </button>

        {/* Split View */}
        <div className="relative">
          <button 
            onClick={() => setShowSplitMenu(!showSplitMenu)}
            className="p-1 rounded hover:bg-black/5 transition-colors"
          >
            <Split className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={2} />
          </button>
          
          {showSplitMenu && (
            <div className="absolute right-0 top-full mt-1 py-1 bg-white rounded-lg shadow-lg border border-[var(--border-default)] z-10">
              <button className="flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-black/5 w-full text-left">
                <Columns2 className="w-4 h-4" />
                左右分屏
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-black/5 w-full text-left">
                <Rows2 className="w-4 h-4" />
                上下分屏
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-black/5 w-full text-left">
                <LayoutGrid className="w-4 h-4" />
                网格分屏
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Address Bar */}
      <div 
        className="h-[38px] flex items-center px-3 border-b border-[var(--border-default)]"
        style={{ background: 'var(--bg-content)' }}
      >
        <div className="flex-1 flex items-center gap-2">
          <button className="p-1 rounded hover:bg-black/5">
            <Star className="w-4 h-4 text-[var(--text-light)]" strokeWidth={2} />
          </button>
          <input
            type="text"
            value={urlInput || activeTab?.url || ''}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
            placeholder="输入网址或搜索..."
            className="flex-1 px-3 py-1 rounded-md text-[12px] bg-transparent border-none
              focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
          />
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 bg-[var(--bg-canvas)] flex items-center justify-center">
        <div className="text-center text-[var(--text-light)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-panel)] flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🌐</span>
          </div>
          <p className="text-[14px] font-medium mb-1">浏览器模式</p>
          <p className="text-[12px]">BrowserView 将在实际 Electron 环境中渲染</p>
          <p className="text-[11px] mt-2 opacity-60">当前 URL: {activeTab?.url}</p>
        </div>
      </div>
    </div>
  )
}
