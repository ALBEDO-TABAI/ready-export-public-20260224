import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  Bold, Italic, Underline, Strikethrough, Link, Code,
  List, ListOrdered, CheckSquare, Quote, Save, Loader2,
  Eye, Edit3, Columns, X, Plus, FileText, GripVertical,
  ImageIcon, Film, ZoomIn, ZoomOut, RotateCw
} from 'lucide-react'
import { useWorkspace } from '../../stores/useWorkspace'
import { useDocTabs, type DocTab } from '../../stores/useDocTabs'

const DEFAULT_CONTENT = `# 欢迎使用 Ready 文档编辑器

这是一个支持 Markdown 的文档编辑器，支持**实时预览**。

## 功能特点

- **编辑模式**：直接编写 Markdown 原文
- **预览模式**：实时渲染 Markdown 为富文本
- **分栏模式**：左侧编辑，右侧预览
- 支持文件读取和保存（Electron 环境）

## Markdown 语法示例

### 文本格式
**粗体** / *斜体* / ~~删除线~~ / \`行内代码\`

### 列表
1. 有序列表第一项
2. 有序列表第二项

- 无序列表项
- 另一个无序列表项

### 代码块
\`\`\`javascript
function hello() {
  console.log("Hello, Ready!");
}
\`\`\`

### 引用
> 这是一段引用文字。
> Ready 让自媒体创作更高效。

---

*按 Cmd+S 保存文档*
`

type ViewMode = 'edit' | 'preview' | 'split'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface ReadResult {
  success?: boolean
  content?: string
  html?: string
  data?: Record<string, unknown>
  error?: string
}

const getFileExt = (path: string | null): string => {
  if (!path) return ''
  return (path.split('/').pop() || '').split('.').pop()?.toLowerCase() || ''
}

/** Lightweight Markdown → HTML renderer (no external deps) */
function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<pre class="md-code-block"><code class="lang-${lang}">${code.trim()}</code></pre>`
  })
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
  html = html.replace(/^#### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
  html = html.replace(/^---$/gm, '<hr class="md-hr" />')
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-quote">$1</blockquote>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener">$1</a>')
  html = html.replace(/^- (.+)$/gm, '<li class="md-ul-item">$1</li>')
  html = html.replace(/(<li class="md-ul-item">.*<\/li>\n?)+/g, '<ul class="md-ul">$&</ul>')
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-ol-item">$1</li>')
  html = html.replace(/(<li class="md-ol-item">.*<\/li>\n?)+/g, '<ol class="md-ol">$&</ol>')
  html = html.replace(/^(?!<[a-zA-Z])((?!\s*$).+)$/gm, '<p class="md-p">$1</p>')
  html = html.replace(/<\/blockquote>\s*<blockquote class="md-quote">/g, '<br/>')
  return html
}

const formatXlsxPreview = (data: unknown): string => {
  if (!data || typeof data !== 'object') return '[XLSX] 当前文件暂无可预览内容'
  return Object.entries(data as Record<string, unknown>).map(([sheetName, rows]) => {
    const header = `## Sheet: ${sheetName}`
    if (!Array.isArray(rows)) return `${header}\n\n(无可用行数据)`
    const formatted = rows.map((row) => {
      if (!Array.isArray(row)) return String(row)
      return row.map(cell => String(cell ?? '')).join(' | ')
    }).join('\n')
    return `${header}\n\n${formatted || '(空表)'}`
  }).join('\n\n')
}


// ============================================================
// DocumentEditor — single document pane (used for each tab)
// ============================================================
function DocumentEditor({ tab }: { tab: DocTab }) {
  const { updateTabContent, markTabSaved } = useDocTabs()
  const [viewMode, setViewMode] = useState<ViewMode>('edit')
  const [isLoading, setIsLoading] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const currentExt = useMemo(() => getFileExt(tab.path), [tab.path])
  const isMarkdown = ['md', 'txt', 'json', 'ts', 'tsx', 'js', 'css', 'html', ''].includes(currentExt)
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(currentExt)
  const isVideo = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogg'].includes(currentExt)
  const isMedia = isImage || isVideo
  const canSave = isMarkdown && !!tab.path
  const renderedHtml = useMemo(() => renderMarkdown(tab.content), [tab.content])
  const [imageZoom, setImageZoom] = useState(100)
  const fileUrl = tab.path ? `file://${tab.path}` : ''

  // Load file content on mount / path change
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!tab.path) {
        if (!tab.content && !tab.isDirty) {
          updateTabContent(tab.id, DEFAULT_CONTENT)
        }
        return
      }
      if (typeof window === 'undefined' || !window.electronAPI) return

      setIsLoading(true)
      try {
        const ext = getFileExt(tab.path)
        if (['md', 'txt', 'json', 'ts', 'tsx', 'js', 'css', 'html'].includes(ext)) {
          const result = (await window.electronAPI.document.readFile(tab.path)) as ReadResult
          if (!result.success) throw new Error(result.error || '文件读取失败')
          if (!cancelled) updateTabContent(tab.id, result.content || '')
        } else if (ext === 'docx') {
          const result = (await window.electronAPI.document.parseDocx(tab.path)) as ReadResult
          if (!result.success) throw new Error(result.error || 'DOCX 解析失败')
          if (!cancelled) {
            updateTabContent(tab.id, result.content || result.html || '')
            setViewMode('preview')
          }
        } else if (['xlsx', 'csv', 'xls'].includes(ext)) {
          const result = (await window.electronAPI.document.parseXlsx(tab.path)) as ReadResult
          if (!result.success) throw new Error(result.error || 'XLSX 解析失败')
          if (!cancelled) {
            updateTabContent(tab.id, formatXlsxPreview(result.data))
            setViewMode('preview')
          }
        } else if (isImage || isVideo) {
          // Image/video files don't need content loading, rendered directly via file:// URL
          if (!cancelled) setIsLoading(false)
          return
        } else {
          if (!cancelled) updateTabContent(tab.id, `# 暂不支持该格式\n\n文件: ${tab.path}`)
        }
      } catch (error) {
        if (!cancelled) {
          updateTabContent(tab.id, `# 文件读取失败\n\n${error instanceof Error ? error.message : String(error)}`)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [tab.path]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async () => {
    if (!tab.path || !canSave) return
    if (typeof window === 'undefined' || !window.electronAPI) return
    setSaveState('saving')
    try {
      const result = (await window.electronAPI.document.writeFile(tab.path, tab.content)) as ReadResult
      if (!result.success) throw new Error(result.error || '保存失败')
      setSaveState('saved')
      markTabSaved(tab.id)
    } catch {
      setSaveState('error')
    }
  }, [tab.path, tab.content, canSave, tab.id, markTabSaved])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  const insertFormat = useCallback((before: string, after: string) => {
    const el = editorRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = tab.content.slice(start, end)
    const newContent = tab.content.slice(0, start) + before + selected + after + tab.content.slice(end)
    updateTabContent(tab.id, newContent)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + before.length, end + before.length)
    })
  }, [tab.content, tab.id, updateTabContent])

  const viewModeButtons: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
    { mode: 'edit', icon: Edit3, label: '编辑' },
    { mode: 'split', icon: Columns, label: '分栏' },
    { mode: 'preview', icon: Eye, label: '预览' }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{
          height: 34,
          padding: '0 12px',
          background: '#FAFAF9',
          borderBottom: '1px solid var(--border-default)'
        }}
      >
        <div className="flex items-center gap-0.5">
          {isMarkdown && (viewMode === 'edit' || viewMode === 'split') && (
            <>
              <button onClick={() => insertFormat('**', '**')} className="p-1 rounded hover:bg-black/5 transition-colors" title="粗体">
                <Bold className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <button onClick={() => insertFormat('*', '*')} className="p-1 rounded hover:bg-black/5 transition-colors" title="斜体">
                <Italic className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <button onClick={() => insertFormat('<u>', '</u>')} className="p-1 rounded hover:bg-black/5 transition-colors" title="下划线">
                <Underline className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <button onClick={() => insertFormat('~~', '~~')} className="p-1 rounded hover:bg-black/5 transition-colors" title="删除线">
                <Strikethrough className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <div className="w-px h-4 bg-[var(--border-default)] mx-1" />
              <button onClick={() => insertFormat('\n- ', '')} className="p-1 rounded hover:bg-black/5 transition-colors" title="无序列表">
                <List className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <button onClick={() => insertFormat('\n1. ', '')} className="p-1 rounded hover:bg-black/5 transition-colors" title="有序列表">
                <ListOrdered className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <button onClick={() => insertFormat('\n- [ ] ', '')} className="p-1 rounded hover:bg-black/5 transition-colors" title="任务列表">
                <CheckSquare className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <button onClick={() => insertFormat('[', '](url)')} className="p-1 rounded hover:bg-black/5 transition-colors" title="链接">
                <Link className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <button onClick={() => insertFormat('`', '`')} className="p-1 rounded hover:bg-black/5 transition-colors" title="行内代码">
                <Code className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <button onClick={() => insertFormat('\n> ', '')} className="p-1 rounded hover:bg-black/5 transition-colors" title="引用">
                <Quote className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isMarkdown && (
            <div className="flex items-center rounded-md border border-[var(--border-default)] overflow-hidden">
              {viewModeButtons.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] transition-colors
                    ${viewMode === mode
                      ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]'
                      : 'hover:bg-black/5 text-[var(--text-muted)]'
                    }`}
                  title={label}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}

          {canSave && (
            <button
              onClick={handleSave}
              disabled={isLoading || saveState === 'saving'}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border border-[var(--border-default)] hover:bg-black/5 disabled:opacity-50"
              style={{ background: 'var(--bg-primary)' }}
            >
              {saveState === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              <span>{saveState === 'saved' ? '已保存' : '保存'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex" style={{ background: '#FFFFFF' }}>
        {isImage && tab.path ? (
          /* Image preview */
          <div className="flex-1 flex flex-col overflow-auto" style={{ background: '#F5F5F4' }}>
            {/* Image toolbar */}
            <div className="flex items-center justify-center gap-2 py-2 border-b border-[var(--border-default)]" style={{ background: '#FAFAF9' }}>
              <button
                onClick={() => setImageZoom(z => Math.max(10, z - 25))}
                className="p-1 rounded hover:bg-black/5 transition-colors"
                title="缩小"
              >
                <ZoomOut className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>
              <span className="text-[11px] text-[var(--text-muted)] min-w-[40px] text-center">{imageZoom}%</span>
              <button
                onClick={() => setImageZoom(z => Math.min(400, z + 25))}
                className="p-1 rounded hover:bg-black/5 transition-colors"
                title="放大"
              >
                <ZoomIn className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>
              <button
                onClick={() => setImageZoom(100)}
                className="p-1 rounded hover:bg-black/5 transition-colors"
                title="重置"
              >
                <RotateCw className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>
              <div className="w-px h-4 bg-[var(--border-default)] mx-1" />
              <span className="text-[11px] text-[var(--text-muted)]">{tab.title}</span>
            </div>
            {/* Image display */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
              <img
                src={fileUrl}
                alt={tab.title}
                style={{
                  maxWidth: imageZoom === 100 ? '100%' : 'none',
                  maxHeight: imageZoom === 100 ? '100%' : 'none',
                  width: imageZoom !== 100 ? `${imageZoom}%` : undefined,
                  objectFit: 'contain',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
            </div>
          </div>
        ) : isVideo && tab.path ? (
          /* Video player */
          <div className="flex-1 flex flex-col" style={{ background: '#1a1a1a' }}>
            <div className="flex-1 flex items-center justify-center p-6">
              <video
                src={fileUrl}
                controls
                className="max-w-full max-h-full rounded-lg"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
              >
                您的浏览器不支持视频播放
              </video>
            </div>
            {/* Video info bar */}
            <div
              className="flex items-center justify-between px-4 py-2 text-[11px]"
              style={{ background: '#222', color: '#999' }}
            >
              <div className="flex items-center gap-2">
                <Film className="w-3.5 h-3.5" />
                <span>{tab.title}</span>
              </div>
              <span className="uppercase">{currentExt}</span>
            </div>
          </div>
        ) : isMarkdown ? (
          <>
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className={`${viewMode === 'split' ? 'w-1/2 border-r border-[var(--border-default)]' : 'flex-1'} overflow-auto`}>
                <div style={{ padding: '24px 40px', maxWidth: 800, margin: '0 auto' }}>
                  <textarea
                    ref={editorRef}
                    value={tab.content}
                    onChange={(e) => { updateTabContent(tab.id, e.target.value); setSaveState('idle') }}
                    className="w-full min-h-[600px] resize-none bg-transparent border-none outline-none
                      text-[14px] leading-[1.8] text-[var(--text-body)] font-mono
                      placeholder:text-[var(--text-placeholder)]"
                    placeholder="开始输入 Markdown..."
                    spellCheck={false}
                    readOnly={isLoading}
                  />
                </div>
              </div>
            )}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} overflow-auto`}
                style={{ background: '#FAFAF9' }}
              >
                <div style={{ padding: '24px 40px', maxWidth: 800, margin: '0 auto' }}>
                  <div
                    className="md-preview text-[var(--text-body)]"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 overflow-auto">
            <div style={{ padding: '24px 40px', maxWidth: 800, margin: '0 auto' }}>
              <div
                className="md-preview text-[var(--text-body)]"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


// ============================================================
// SplitResizeHandle — for document split view
// ============================================================
function SplitResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const onResizeRef = useRef(onResize)
  onResizeRef.current = onResize

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    let lastX = e.clientX

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - lastX
      lastX = ev.clientX
      if (delta !== 0) onResizeRef.current(delta)
    }
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.classList.remove('resizing')
    }

    document.body.classList.add('resizing')
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  return <div className="resize-handle" onMouseDown={handleMouseDown} />
}


// ============================================================
// DocumentMode — main component with tab bar
// ============================================================
export default function DocumentMode() {
  const { selectedFile } = useWorkspace()
  const {
    tabs, activeTabId, splitTabId, splitRatio,
    openTab, closeTab, setActiveTab, setSplitTab, setSplitRatio,
    reorderTabs,
  } = useDocTabs()

  const splitContainerRef = useRef<HTMLDivElement>(null)

  // Open the file selected in SidePanel
  useEffect(() => {
    if (selectedFile) {
      openTab(selectedFile)
    }
  }, [selectedFile, openTab])

  const activeTab = tabs.find(t => t.id === activeTabId)
  const splitTab = splitTabId ? tabs.find(t => t.id === splitTabId) : null

  // Tab click handler
  const handleTabClick = useCallback((id: string, e: React.MouseEvent) => {
    if (e.shiftKey && id !== activeTabId) {
      // Shift+click: split with this tab
      setSplitTab(id)
    } else {
      // Normal click: activate and close split
      setActiveTab(id)
    }
  }, [activeTabId, setActiveTab, setSplitTab])

  // Drag & drop reorder
  const dragIndexRef = useRef<number | null>(null)

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndexRef.current !== null && dragIndexRef.current !== index) {
      reorderTabs(dragIndexRef.current, index)
      dragIndexRef.current = index
    }
  }, [reorderTabs])

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null
  }, [])

  // Split resize
  const handleSplitResize = useCallback((delta: number) => {
    if (!splitContainerRef.current) return
    const containerWidth = splitContainerRef.current.offsetWidth
    if (containerWidth <= 0) return
    const deltaPercent = (delta / containerWidth) * 100
    setSplitRatio(splitRatio + deltaPercent)
  }, [splitRatio, setSplitRatio])

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-content)' }}>
      {/* Tab Bar */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          height: 34,
          padding: '0 8px',
          background: '#F8F7F4',
          borderBottom: '1px solid var(--border-default)',
          gap: 2,
        }}
      >
        {tabs.map((tab, index) => {
          const isPrimary = tab.id === activeTabId
          const isSplit = tab.id === splitTabId
          const isActive = isPrimary || isSplit
          return (
            <button
              key={tab.id}
              onClick={(e) => handleTabClick(tab.id, e)}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="flex items-center max-w-[160px] transition-all duration-200 group"
              style={{
                gap: 5,
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 11,
                background: isPrimary ? '#FFFFFF' : isSplit ? 'rgba(91,141,239,0.06)' : 'transparent',
                color: isActive ? 'var(--text-title)' : 'var(--text-gray)',
                boxShadow: isPrimary ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                cursor: 'grab',
                ...(isSplit ? { borderBottom: '2px solid #5B8DEF' } : {}),
              }}
              title={`${tab.title}${isSplit ? ' (分栏)' : ''}\n按住 Shift 点击可分栏`}
            >
              <GripVertical
                style={{ width: 10, height: 10 }}
                className="opacity-0 group-hover:opacity-40 flex-shrink-0 transition-opacity"
                strokeWidth={2}
              />
              <FileText style={{ width: 11, height: 11 }} className="flex-shrink-0" strokeWidth={2} />
              <span className="truncate flex-1">
                {tab.title}
                {tab.isDirty && <span className="text-[var(--text-muted)] ml-0.5">●</span>}
              </span>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                className="rounded hover:bg-black/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 flex-shrink-0"
                style={{ padding: 1 }}
              >
                <X style={{ width: 10, height: 10 }} strokeWidth={2} />
              </span>
            </button>
          )
        })}

        {/* New tab */}
        <button
          onClick={() => openTab('')}
          className="flex items-center justify-center hover:bg-black/5 transition-colors rounded"
          style={{ width: 24, height: 24 }}
          title="新建文档"
        >
          <Plus style={{ width: 12, height: 12 }} className="text-[var(--text-muted)]" strokeWidth={2} />
        </button>
      </div>

      {/* Content Area */}
      {splitTab && activeTab ? (
        <div className="flex-1 flex min-w-0 overflow-hidden" ref={splitContainerRef}>
          <div
            className="flex flex-col min-w-0 overflow-hidden"
            style={{ flexBasis: `${splitRatio}%`, flexShrink: 0, flexGrow: 0 }}
          >
            <DocumentEditor tab={activeTab} />
          </div>
          <SplitResizeHandle onResize={handleSplitResize} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <DocumentEditor tab={splitTab} />
          </div>
        </div>
      ) : activeTab ? (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DocumentEditor tab={activeTab} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-[13px]">点击左侧文件打开文档</p>
          </div>
        </div>
      )}
    </div>
  )
}
