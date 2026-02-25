import { useState, useCallback, useRef } from 'react'
import {
  RefreshCw, Plus, Star, X, ArrowLeft, ArrowRight,
  Split, LayoutGrid, Columns2, Rows2, ExternalLink, Loader2, Globe
} from 'lucide-react'

interface Tab {
  id: string
  url: string
  title: string
  loading: boolean
  canGoBack: boolean
  canGoForward: boolean
}

const DEFAULT_URL = 'https://www.google.com/webhp?igu=1'
const SEARCH_URL = 'https://www.google.com/search?igu=1&q='

export default function BrowserMode() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', url: DEFAULT_URL, title: 'Google', loading: false, canGoBack: false, canGoForward: false }
  ])
  const [activeTabId, setActiveTabId] = useState('1')
  const [urlInput, setUrlInput] = useState('')
  const [showSplitMenu, setShowSplitMenu] = useState(false)
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({})

  const activeTab = tabs.find(t => t.id === activeTabId)

  // URL helpers
  const normalizeUrl = useCallback((input: string): string => {
    const trimmed = input.trim()
    if (!trimmed) return DEFAULT_URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    // Looks like a domain
    if (trimmed.includes('.') && !trimmed.includes(' ')) return `https://${trimmed}`
    // Search query
    return `${SEARCH_URL}${encodeURIComponent(trimmed)}`
  }, [])

  const updateTab = useCallback((id: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  // Tab operations
  const handleNewTab = () => {
    const newId = Date.now().toString()
    const newTab: Tab = {
      id: newId,
      url: DEFAULT_URL,
      title: '新标签页',
      loading: false,
      canGoBack: false,
      canGoForward: false
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newId)
    setUrlInput('')
  }

  const handleCloseTab = (id: string) => {
    const newTabs = tabs.filter(t => t.id !== id)
    if (newTabs.length === 0) {
      handleNewTab()
      return
    }
    if (id === activeTabId) {
      setActiveTabId(newTabs[newTabs.length - 1].id)
    }
    setTabs(newTabs)
  }

  const handleTabClick = (id: string) => {
    setActiveTabId(id)
    const tab = tabs.find(t => t.id === id)
    if (tab) setUrlInput(tab.url === DEFAULT_URL ? '' : tab.url)
  }

  const handleNavigate = (url?: string) => {
    if (!activeTab) return
    const targetUrl = normalizeUrl(url || urlInput)
    updateTab(activeTab.id, { url: targetUrl, title: targetUrl, loading: true })
  }

  const handleRefresh = () => {
    if (!activeTab) return
    const iframe = iframeRefs.current[activeTab.id]
    if (iframe) {
      iframe.src = activeTab.url
      updateTab(activeTab.id, { loading: true })
    }
  }

  const handleIframeLoad = (tabId: string) => {
    updateTab(tabId, { loading: false })
    // Try to get the iframe title
    try {
      const iframe = iframeRefs.current[tabId]
      if (iframe?.contentDocument?.title) {
        updateTab(tabId, { title: iframe.contentDocument.title })
      }
    } catch {
      // Cross-origin: can't read title, use URL instead
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNavigate()
    }
  }

  const handleUrlFocus = () => {
    if (activeTab) {
      setUrlInput(activeTab.url === DEFAULT_URL ? '' : activeTab.url)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div
        className="h-[34px] flex items-center px-2 border-b border-[var(--border-default)]"
        style={{ background: 'var(--bg-toolbar)' }}
      >
        {/* Navigation Buttons */}
        <div className="flex items-center gap-0.5 mr-1">
          <button className="p-1 rounded hover:bg-black/5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 text-[var(--text-light)]" strokeWidth={2} />
          </button>
          <button className="p-1 rounded hover:bg-black/5 transition-colors">
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-light)]" strokeWidth={2} />
          </button>
          <button
            onClick={handleRefresh}
            className="p-1 rounded hover:bg-black/5 transition-colors"
          >
            {activeTab?.loading
              ? <Loader2 className="w-3.5 h-3.5 text-[var(--color-blue)] animate-spin" strokeWidth={2} />
              : <RefreshCw className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={2} />
            }
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-1 flex items-center gap-1 overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] max-w-[160px]
                transition-all duration-200
                ${tab.id === activeTabId
                  ? 'bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-sm'
                  : 'hover:bg-black/5'
                }
              `}
            >
              {tab.loading
                ? <Loader2 className="w-3 h-3 text-[var(--color-blue)] animate-spin flex-shrink-0" />
                : <Globe className="w-3 h-3 text-[var(--text-light)] flex-shrink-0" />
              }
              <span className="truncate flex-1">{tab.title}</span>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id) }}
                className="p-0.5 rounded hover:bg-black/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
              >
                <X className="w-3 h-3" strokeWidth={2} />
              </span>
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
            <div
              className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg border border-[var(--border-default)] z-10"
              style={{ background: 'var(--bg-panel)' }}
            >
              <button className="flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-black/5 w-full text-left">
                <Columns2 className="w-4 h-4" /> 左右分屏
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-black/5 w-full text-left">
                <Rows2 className="w-4 h-4" /> 上下分屏
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-[12px] hover:bg-black/5 w-full text-left">
                <LayoutGrid className="w-4 h-4" /> 网格分屏
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Address Bar */}
      <div
        className="h-[38px] flex items-center px-3 gap-2 border-b border-[var(--border-default)]"
        style={{ background: 'var(--bg-content)' }}
      >
        <button className="p-1 rounded hover:bg-black/5 flex-shrink-0">
          <Star className="w-4 h-4 text-[var(--text-light)]" strokeWidth={2} />
        </button>
        <div
          className="flex-1 flex items-center rounded-lg px-3 py-1 text-[12px] border border-[var(--border-input)]"
          style={{ background: 'var(--bg-primary)' }}
        >
          {activeTab?.loading && (
            <div className="w-3 h-0.5 bg-[var(--color-blue)] rounded-full mr-2 animate-pulse" />
          )}
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleUrlFocus}
            placeholder="输入网址或搜索..."
            className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--text-body)]"
          />
        </div>
        <button
          onClick={() => {
            if (activeTab) window.open(activeTab.url, '_blank')
          }}
          className="p-1 rounded hover:bg-black/5 flex-shrink-0"
          title="在外部浏览器中打开"
        >
          <ExternalLink className="w-4 h-4 text-[var(--text-light)]" strokeWidth={2} />
        </button>
      </div>

      {/* Browser Content — iframe for each tab */}
      <div className="flex-1 relative">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="absolute inset-0"
            style={{ display: tab.id === activeTabId ? 'block' : 'none' }}
          >
            <iframe
              ref={(el) => { iframeRefs.current[tab.id] = el }}
              src={tab.url}
              onLoad={() => handleIframeLoad(tab.id)}
              className="w-full h-full border-none"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
              title={tab.title}
            />
          </div>
        ))}

        {/* Loading overlay */}
        {activeTab?.loading && (
          <div
            className="absolute top-0 left-0 right-0 h-1 z-10"
          >
            <div
              className="h-full bg-[var(--color-blue)] rounded-r animate-pulse"
              style={{ width: '60%', transition: 'width 0.3s' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
