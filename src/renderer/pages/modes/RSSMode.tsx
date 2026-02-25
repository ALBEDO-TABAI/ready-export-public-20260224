import { useState, useEffect } from 'react'
import { RefreshCw, Filter, ExternalLink, Star, X, AlertCircle } from 'lucide-react'

interface RSSItem {
  id: string
  title: string
  source: string
  sourceId: string
  summary: string
  publishedAt: string
  read: boolean
  starred: boolean
  coverImage?: string
  link: string
}

interface RSSSource {
  id: string
  name: string
  count: number
}

export default function RSSMode() {
  const [items, setItems] = useState<RSSItem[]>([])
  const [sources, setSources] = useState<RSSSource[]>([])
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<RSSItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all')
  const [isMock, setIsMock] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRSSData()
  }, [])

  const loadRSSData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.rss.getItems()
        if (result.success === false) {
          setError(result.error || '获取 RSS 项目失败')
          setItems([])
        } else if (result.data) {
          setItems(result.data.map((item: { publishedAt: string | number | Date }) => ({
            ...item,
            publishedAt: new Date(item.publishedAt).toLocaleString()
          })))
          setIsMock(result.mock || false)
        }

        const sourcesResult = await window.electronAPI.rss.getSources()
        if (sourcesResult.success === false) {
          setError(prev => prev || sourcesResult.error || '获取 RSS 源失败')
          setSources([])
        } else if (sourcesResult.data) {
          setSources(sourcesResult.data.map((s: { id: string; name: string }) => ({
            ...s,
            count: Math.floor(Math.random() * 20) + 5
          })))
        }
      } else {
        // Mock data for development
        setIsMock(true)
        setItems([
          { 
            id: '1', 
            sourceId: '1', 
            title: 'AI 创作工具的下一个十年', 
            link: 'https://36kr.com/p/123456',
            summary: '探讨 AI 如何改变内容创作行业...',
            source: '36氪',
            publishedAt: new Date(Date.now() - 3600000).toLocaleString(),
            read: false,
            starred: false
          },
          { 
            id: '2', 
            sourceId: '2', 
            title: '自媒体运营的核心方法论', 
            link: 'https://www.huxiu.com/article/789',
            summary: '从 0 到 1 打造个人 IP 的实战经验...',
            source: '虎嗅',
            publishedAt: new Date(Date.now() - 7200000).toLocaleString(),
            read: false,
            starred: true
          }
        ])
        setSources([
          { id: '1', name: '36氪', count: 15 },
          { id: '2', name: '虎嗅', count: 12 }
        ])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载 RSS 数据时发生错误'
      console.log('RSS data load error:', err)
      setError(errorMessage)
      setItems([])
      setSources([])
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item => {
    if (selectedSource && item.sourceId !== selectedSource) return false
    if (filter === 'unread' && item.read) return false
    if (filter === 'starred' && !item.starred) return false
    return true
  })

  const handleItemClick = (item: RSSItem) => {
    setSelectedItem(item)
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.rss.markRead(item.id)
    }
  }

  // Error UI
  if (error && !loading && items.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ background: 'var(--bg-content)' }}>
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-[var(--color-red)]" />
          <h3 className="text-[16px] font-semibold text-[var(--text-title)] mb-2">加载失败</h3>
          <p className="text-[13px] text-[var(--text-muted)] mb-4 max-w-[300px]">{error}</p>
          <button
            onClick={loadRSSData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-blue)] text-white text-[13px] hover:brightness-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div 
        className="h-[44px] flex items-center justify-between px-4 border-b border-[var(--border-default)]"
        style={{ background: 'var(--bg-toolbar)' }}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-[13px] font-semibold text-[var(--text-title)]">RSS 订阅源</h2>
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-blue-light)] text-[var(--color-blue)] text-[11px]">
            {items.length} 条
          </span>
          {isMock && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--color-orange-light)] text-[var(--color-orange)] text-[11px]">
              Mock 模式
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Source Filter */}
          <select 
            value={selectedSource || ''}
            onChange={(e) => setSelectedSource(e.target.value || null)}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-input)] text-[12px] bg-[var(--bg-primary)]"
          >
            <option value="">全部源</option>
            {sources.map(source => (
              <option key={source.id} value={source.id}>{source.name}</option>
            ))}
          </select>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-input)] p-0.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${filter === 'all' ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]' : 'hover:bg-black/5'}`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${filter === 'unread' ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]' : 'hover:bg-black/5'}`}
            >
              未读
            </button>
            <button
              onClick={() => setFilter('starred')}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${filter === 'starred' ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]' : 'hover:bg-black/5'}`}
            >
              收藏
            </button>
          </div>

          <button 
            onClick={loadRSSData}
            className="p-1.5 rounded hover:bg-black/5 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* RSS List */}
        <div 
          className={`flex-shrink-0 overflow-auto border-r border-[var(--border-default)] transition-all duration-300 ${
            selectedItem ? 'w-[300px] opacity-50' : 'flex-1'
          }`}
          style={{ background: 'var(--bg-content)' }}
        >
          <div className="divide-y divide-[var(--border-default)]">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-[var(--text-light)]">
                <Filter className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-[13px]">暂无内容</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left p-4 hover:bg-black/[0.02] transition-colors ${
                    selectedItem?.id === item.id ? 'bg-[var(--color-blue-light)] border-l-2 border-[var(--color-blue)]' : ''
                  } ${!item.read ? 'bg-[var(--bg-primary)]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-[13px] mb-1 truncate ${!item.read ? 'font-semibold text-[var(--text-title)]' : 'text-[var(--text-body)]'}`}>
                        {item.title}
                      </h3>
                      <p className="text-[12px] text-[var(--text-muted)] line-clamp-2 mb-2">
                        {item.summary}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-light)]">
                        <span>{item.source}</span>
                        <span>{item.publishedAt}</span>
                      </div>
                    </div>
                    {item.starred && <Star className="w-4 h-4 text-[var(--color-gold)] flex-shrink-0" fill="currentColor" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Preview Browser */}
        {selectedItem && (
          <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-content)' }}>
            {/* Browser Toolbar */}
            <div 
              className="h-[38px] flex items-center justify-between px-3 border-b border-[var(--border-default)]"
              style={{ background: 'var(--bg-toolbar)' }}
            >
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded hover:bg-black/5 transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
                <span className="text-[12px] text-[var(--text-muted)] truncate max-w-[300px]">
                  {selectedItem.link}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={loadRSSData}
                  className="p-1.5 rounded hover:bg-black/5 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={2} />
                </button>
                <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
                  <ExternalLink className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Browser Content */}
            <div className="flex-1 flex items-center justify-center bg-[var(--bg-canvas)]">
              <div className="text-center text-[var(--text-light)]">
                <ExternalLink className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-[14px] font-medium mb-1">{selectedItem.title}</p>
                <p className="text-[12px] max-w-[400px] mx-auto mb-4">{selectedItem.summary}</p>
                <a 
                  href={selectedItem.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-blue)] text-white text-[12px] hover:brightness-95 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  在浏览器中打开
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
