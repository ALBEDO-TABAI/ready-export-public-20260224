import { useState, useCallback, useRef, useEffect } from 'react'
import {
  RefreshCw, Plus, X, ArrowLeft, ArrowRight,
  ExternalLink, Loader2, Globe
} from 'lucide-react'

interface Tab {
  id: string
  url: string
  title: string
  loading: boolean
  canGoBack: boolean
  canGoForward: boolean
}

interface TabUpdateEvent {
  type: 'title' | 'navigate' | 'loading' | 'error'
  tabId: string
  title?: string
  url?: string
  loading?: boolean
  canGoBack?: boolean
  canGoForward?: boolean
  error?: string
}

const DEFAULT_URL = 'https://www.google.com'
const SEARCH_URL = 'https://www.google.com/search?q='

export default function BrowserMode() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI

  const activeTab = tabs.find(t => t.id === activeTabId) || null

  // URL helpers
  const normalizeUrl = useCallback((input: string): string => {
    const trimmed = input.trim()
    if (!trimmed) return DEFAULT_URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    if (trimmed.includes('.') && !trimmed.includes(' ')) return `https://${trimmed}`
    return `${SEARCH_URL}${encodeURIComponent(trimmed)}`
  }, [])

  const updateTab = useCallback((id: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  // == IPC-driven tab operations ==

  const handleNewTab = useCallback(async () => {
    if (!isElectron) return
    const result = await window.electronAPI.browser.createTab(DEFAULT_URL) as { success: boolean; tabId?: string }
    if (result.success && result.tabId) {
      const newTab: Tab = {
        id: result.tabId,
        url: DEFAULT_URL,
        title: '新标签页',
        loading: true,
        canGoBack: false,
        canGoForward: false,
      }
      setTabs(prev => [...prev, newTab])
      setActiveTabId(result.tabId)
      setUrlInput('')
      // Update bounds after rendering
      requestAnimationFrame(() => sendBounds())
    }
  }, [isElectron])

  const handleCloseTab = useCallback(async (id: string) => {
    if (!isElectron) return
    await window.electronAPI.browser.closeTab(id)
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id)
      if (id === activeTabId) {
        if (newTabs.length > 0) {
          const nextTab = newTabs[newTabs.length - 1]
          setActiveTabId(nextTab.id)
          setUrlInput(nextTab.url === DEFAULT_URL ? '' : nextTab.url)
        } else {
          setActiveTabId(null)
          setUrlInput('')
        }
      }
      return newTabs
    })
  }, [isElectron, activeTabId])

  const handleTabClick = useCallback(async (id: string) => {
    if (!isElectron || id === activeTabId) return
    const result = await window.electronAPI.browser.switchTab(id) as {
      success: boolean; url?: string; title?: string; canGoBack?: boolean; canGoForward?: boolean
    }
    if (result.success) {
      setActiveTabId(id)
      const tab = tabs.find(t => t.id === id)
      if (tab) setUrlInput(tab.url === DEFAULT_URL ? '' : tab.url)
      // Update with fresh data from backend
      if (result.url) updateTab(id, {
        canGoBack: result.canGoBack || false,
        canGoForward: result.canGoForward || false,
      })
    }
  }, [isElectron, activeTabId, tabs, updateTab])

  const handleNavigate = useCallback(async (url?: string) => {
    if (!isElectron || !activeTabId) return
    const targetUrl = normalizeUrl(url || urlInput)
    updateTab(activeTabId, { url: targetUrl, loading: true })
    setUrlInput(targetUrl)
    await window.electronAPI.browser.navigate(activeTabId, targetUrl)
  }, [isElectron, activeTabId, urlInput, normalizeUrl, updateTab])

  const handleGoBack = useCallback(async () => {
    if (!isElectron || !activeTabId) return
    await window.electronAPI.browser.goBack(activeTabId)
  }, [isElectron, activeTabId])

  const handleGoForward = useCallback(async () => {
    if (!isElectron || !activeTabId) return
    await window.electronAPI.browser.goForward(activeTabId)
  }, [isElectron, activeTabId])

  const handleRefresh = useCallback(async () => {
    if (!isElectron || !activeTabId) return
    updateTab(activeTabId, { loading: true })
    await window.electronAPI.browser.reload(activeTabId)
  }, [isElectron, activeTabId, updateTab])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNavigate()
    }
  }, [handleNavigate])

  const handleUrlFocus = useCallback(() => {
    if (activeTab) {
      setUrlInput(activeTab.url === DEFAULT_URL ? '' : activeTab.url)
    }
  }, [activeTab])

  // == Bounds management ==
  const sendBounds = useCallback(() => {
    if (!isElectron || !contentRef.current) return
    const rect = contentRef.current.getBoundingClientRect()
    // setBounds() uses CSS pixels, no need to multiply by devicePixelRatio
    window.electronAPI.browser.updateBounds({
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    })
  }, [isElectron])

  // Observe content area size changes
  useEffect(() => {
    if (!contentRef.current) return
    const observer = new ResizeObserver(() => sendBounds())
    observer.observe(contentRef.current)
    return () => observer.disconnect()
  }, [sendBounds])

  // Listen to tab update events from backend
  useEffect(() => {
    if (!isElectron) return
    const cleanup = window.electronAPI.browser.onTabUpdate((data: unknown) => {
      const event = data as TabUpdateEvent
      switch (event.type) {
        case 'title':
          updateTab(event.tabId, { title: event.title || '' })
          break
        case 'navigate':
          updateTab(event.tabId, {
            url: event.url || '',
            canGoBack: event.canGoBack || false,
            canGoForward: event.canGoForward || false,
          })
          // If this is the active tab, sync URL input
          setActiveTabId(prev => {
            if (prev === event.tabId && event.url) {
              setUrlInput(event.url === DEFAULT_URL ? '' : event.url)
            }
            return prev
          })
          break
        case 'loading':
          updateTab(event.tabId, { loading: event.loading || false })
          break
        case 'error':
          updateTab(event.tabId, { loading: false })
          break
      }
    })
    return () => { cleanup() }
  }, [isElectron, updateTab])

  // On mount: create initial tab & show BrowserView
  useEffect(() => {
    if (!isElectron) return
    // Show active BrowserView if returning to browser mode
    window.electronAPI.browser.showActive()
    // If no tabs, create one
    if (tabs.length === 0) {
      handleNewTab()
    }
    // On unmount: hide BrowserView
    return () => {
      window.electronAPI.browser.hideAll()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-content)' }}>
      {/* Tab Bar */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 38,
          padding: '0 12px',
          background: '#F8F7F4',
          borderBottom: '1px solid var(--border-default)'
        }}
      >
        <div className="flex items-center" style={{ gap: 4 }}>
          {/* Back / Forward / Refresh */}
          <button
            onClick={handleGoBack}
            disabled={!activeTab?.canGoBack}
            className="flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors disabled:opacity-30"
            style={{ width: 28, height: 28 }}
            title="后退"
          >
            <ArrowLeft style={{ width: 14, height: 14 }} className="text-[var(--text-light)]" strokeWidth={2} />
          </button>
          <button
            onClick={handleGoForward}
            disabled={!activeTab?.canGoForward}
            className="flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors disabled:opacity-30"
            style={{ width: 28, height: 28 }}
            title="前进"
          >
            <ArrowRight style={{ width: 14, height: 14 }} className="text-[var(--text-light)]" strokeWidth={2} />
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
            style={{ width: 28, height: 28 }}
            title="刷新"
          >
            {activeTab?.loading
              ? <Loader2 style={{ width: 14, height: 14 }} className="text-[var(--color-blue)] animate-spin" strokeWidth={2} />
              : <RefreshCw style={{ width: 14, height: 14 }} className="text-[var(--text-light)]" strokeWidth={2} />
            }
          </button>

          <div style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 4px' }} />

          {/* Tabs */}
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="flex items-center max-w-[160px] transition-all duration-200"
              style={{
                gap: 6,
                padding: '6px 12px',
                borderRadius: '6px 6px 0 0',
                fontSize: 12,
                background: tab.id === activeTabId ? '#FFFFFF' : 'transparent',
                borderRight: tab.id === activeTabId ? '1px solid var(--border-default)' : undefined,
                color: tab.id === activeTabId ? 'var(--text-title)' : 'var(--text-gray)',
              }}
            >
              {tab.loading
                ? <Loader2 style={{ width: 12, height: 12 }} className="text-[var(--color-blue)] animate-spin flex-shrink-0" />
                : <Globe style={{ width: 12, height: 12 }} className="flex-shrink-0" strokeWidth={2} />
              }
              <span className="truncate flex-1">{tab.title}</span>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id) }}
                className="rounded hover:bg-black/10 transition-colors cursor-pointer"
                style={{ padding: 2 }}
              >
                <X style={{ width: 10, height: 10 }} strokeWidth={2} />
              </span>
            </button>
          ))}

          {/* New Tab */}
          <button
            onClick={handleNewTab}
            className="flex items-center justify-center hover:bg-black/5 transition-colors"
            style={{ width: 28, height: 28 }}
            title="新建标签页"
          >
            <Plus style={{ width: 14, height: 14 }} className="text-[var(--text-muted)]" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Address Bar */}
      <div
        className="h-[38px] flex items-center px-3 gap-2 border-b border-[var(--border-default)]"
        style={{ background: 'var(--bg-content)' }}
      >
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

      {/* Browser Content Area — BrowserView renders here natively */}
      <div ref={contentRef} className="flex-1 relative">
        {/* BrowserView is positioned by Electron over this area */}
        {!isElectron && (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--text-light)]">
            <div className="text-center">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-[13px]">浏览器功能需要在 Electron 环境中运行</p>
            </div>
          </div>
        )}
        {isElectron && tabs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--text-light)]">
            <div className="text-center">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-[13px]">点击 + 创建新标签页</p>
            </div>
          </div>
        )}

        {/* Loading bar overlay */}
        {activeTab?.loading && (
          <div className="absolute top-0 left-0 right-0 h-1 z-10">
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
