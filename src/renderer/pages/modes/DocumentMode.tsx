import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  Bold, Italic, Underline, Strikethrough, Link, Code,
  List, ListOrdered, CheckSquare, Quote, Save, Loader2,
  Eye, Edit3, Columns
} from 'lucide-react'
import { useWorkspace } from '../../stores/useWorkspace'

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

### 链接和图片
[Ready 官网](https://ready.app)

---

*按 Cmd+S 保存文档*
`

type ViewMode = 'edit' | 'preview' | 'split'
type DocMode = 'markdown' | 'docx' | 'xlsx' | 'unsupported'
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
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (fenced)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<pre class="md-code-block"><code class="lang-${lang}">${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="md-hr" />')

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-quote">$1</blockquote>')

  // Bold, italic, strikethrough
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener">$1</a>')

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="md-ul-item">$1</li>')
  html = html.replace(/(<li class="md-ul-item">.*<\/li>\n?)+/g, '<ul class="md-ul">$&</ul>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-ol-item">$1</li>')
  html = html.replace(/(<li class="md-ol-item">.*<\/li>\n?)+/g, '<ol class="md-ol">$&</ol>')

  // Paragraphs — wrap remaining text lines
  html = html.replace(/^(?!<[a-zA-Z])((?!\s*$).+)$/gm, '<p class="md-p">$1</p>')

  // Merge adjacent blockquotes
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

export default function DocumentMode() {
  const { selectedFile } = useWorkspace()
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [docMode, setDocMode] = useState<DocMode>('markdown')
  const [isLoading, setIsLoading] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [statusText, setStatusText] = useState('准备就绪')
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const currentExt = useMemo(() => getFileExt(selectedFile), [selectedFile])
  const canSave = docMode === 'markdown' && !!selectedFile
  const renderedHtml = useMemo(() => renderMarkdown(content), [content])

  // Load document
  useEffect(() => {
    let cancelled = false
    const loadDocument = async () => {
      if (!selectedFile) {
        setDocMode('markdown')
        setContent(DEFAULT_CONTENT)
        setStatusText('未选择文件，正在编辑临时文档')
        return
      }
      if (typeof window === 'undefined' || !window.electronAPI) return

      setIsLoading(true)
      setSaveState('idle')

      try {
        if (['md', 'txt', 'json', 'ts', 'tsx', 'js', 'css', 'html'].includes(currentExt)) {
          const result = (await window.electronAPI.document.readFile(selectedFile)) as ReadResult
          if (!result.success) throw new Error(result.error || '文件读取失败')
          if (!cancelled) {
            setDocMode('markdown')
            setContent(result.content || '')
            setStatusText(`已加载: ${selectedFile.split('/').pop()}`)
          }
        } else if (currentExt === 'docx') {
          const result = (await window.electronAPI.document.parseDocx(selectedFile)) as ReadResult
          if (!result.success) throw new Error(result.error || 'DOCX 解析失败')
          if (!cancelled) {
            setDocMode('docx')
            setContent(result.content || result.html || '')
            setStatusText('DOCX 已解析（预览模式）')
            setViewMode('preview')
          }
        } else if (['xlsx', 'csv', 'xls'].includes(currentExt)) {
          const result = (await window.electronAPI.document.parseXlsx(selectedFile)) as ReadResult
          if (!result.success) throw new Error(result.error || 'XLSX 解析失败')
          if (!cancelled) {
            setDocMode('xlsx')
            setContent(formatXlsxPreview(result.data))
            setStatusText('表格已解析（预览模式）')
            setViewMode('preview')
          }
        } else {
          if (!cancelled) {
            setDocMode('unsupported')
            setContent(`# 暂不支持该格式\n\n文件: ${selectedFile}`)
            setStatusText('当前格式不支持编辑')
          }
        }
      } catch (error) {
        if (!cancelled) {
          setContent(`# 文件读取失败\n\n${error instanceof Error ? error.message : String(error)}`)
          setStatusText('读取失败')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadDocument()
    return () => { cancelled = true }
  }, [selectedFile, currentExt])

  // Save
  const handleSave = useCallback(async () => {
    if (!selectedFile || !canSave) return
    if (typeof window === 'undefined' || !window.electronAPI) {
      setSaveState('error')
      setStatusText('浏览器模式不支持保存')
      return
    }
    setSaveState('saving')
    setStatusText('正在保存...')
    try {
      const result = (await window.electronAPI.document.writeFile(selectedFile, content)) as ReadResult
      if (!result.success) throw new Error(result.error || '保存失败')
      setSaveState('saved')
      setStatusText('保存成功')
    } catch (error) {
      setSaveState('error')
      setStatusText(`保存失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [selectedFile, canSave, content])

  // Cmd+S shortcut
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

  // Insert markdown formatting
  const insertFormat = useCallback((before: string, after: string) => {
    const el = editorRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = content.slice(start, end)
    const newContent = content.slice(0, start) + before + selected + after + content.slice(end)
    setContent(newContent)
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + before.length, end + before.length)
    })
  }, [content])

  const viewModeButtons: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
    { mode: 'edit', icon: Edit3, label: '编辑' },
    { mode: 'split', icon: Columns, label: '分栏' },
    { mode: 'preview', icon: Eye, label: '预览' }
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-content)' }}>
      {/* Toolbar — matches design pYbC8 */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 38,
          padding: '0 16px',
          background: '#FAFAF9',
          borderBottom: '1px solid var(--border-default)'
        }}
      >
        {/* Format buttons */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => insertFormat('**', '**')} className="p-1.5 rounded hover:bg-black/5 transition-colors" title="粗体">
            <Bold className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => insertFormat('*', '*')} className="p-1.5 rounded hover:bg-black/5 transition-colors" title="斜体">
            <Italic className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => insertFormat('<u>', '</u>')} className="p-1.5 rounded hover:bg-black/5 transition-colors" title="下划线">
            <Underline className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => insertFormat('~~', '~~')} className="p-1.5 rounded hover:bg-black/5 transition-colors" title="删除线">
            <Strikethrough className="w-4 h-4" strokeWidth={2} />
          </button>

          <div className="w-px h-5 bg-[var(--border-default)] mx-1" />

          <button onClick={() => insertFormat('\n- ', '')} className="p-1.5 rounded hover:bg-black/5 transition-colors" title="无序列表">
            <List className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => insertFormat('\n1. ', '')} className="p-1.5 rounded hover:bg-black/5 transition-colors" title="有序列表">
            <ListOrdered className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => insertFormat('\n- [ ] ', '')} className="p-1.5 rounded hover:bg-black/5 transition-colors" title="任务列表">
            <CheckSquare className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => insertFormat('[', '](url)')} className="p-1.5 rounded hover:bg-black/5 transition-colors" title="链接">
            <Link className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => insertFormat('`', '`')} className="p-1.5 rounded hover:bg-black/5 transition-colors" title="行内代码">
            <Code className="w-4 h-4" strokeWidth={2} />
          </button>
          <button onClick={() => insertFormat('\n> ', '')} className="p-1.5 rounded hover:bg-black/5 transition-colors" title="引用">
            <Quote className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Right side: view mode + save */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          {docMode === 'markdown' && (
            <div className="flex items-center rounded-lg border border-[var(--border-default)] overflow-hidden">
              {viewModeButtons.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] transition-colors
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

          <span className="text-[11px] text-[var(--text-muted)] max-w-[160px] truncate">
            {selectedFile?.split('/').pop() || '未选择文件'}
          </span>

          <button
            onClick={handleSave}
            disabled={!canSave || isLoading || saveState === 'saving'}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] border border-[var(--border-default)] hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--bg-primary)' }}
          >
            {saveState === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>保存</span>
          </button>
        </div>
      </div>

      {/* Content area — matches design DocumentContent */}
      <div className="flex-1 overflow-hidden flex" style={{ background: '#FFFFFF' }}>
        {docMode === 'docx' ? (
          <div className="flex-1 overflow-auto">
            <div style={{ padding: '30px 50px', maxWidth: 800, margin: '0 auto' }}>
              <div
                className="prose prose-sm max-w-none text-[var(--text-body)]
                  [&_h1]:text-[24px] [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-[var(--text-title)]
                  [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:text-[var(--text-title)]
                  [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:mb-3"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        ) : docMode === 'xlsx' ? (
          <div className="flex-1 overflow-auto">
            <div style={{ padding: '30px 50px', maxWidth: 1000, margin: '0 auto' }}>
              <div className="text-[14px] text-[var(--text-body)] space-y-4">
                {content.split(/\n## Sheet: /).map((section, i) => {
                  if (i === 0 && !section.trim()) return null
                  const lines = section.split('\n')
                  const sheetName = i === 0 ? '' : lines[0]
                  const rows = lines.slice(i === 0 ? 0 : 1).filter(l => l.trim())
                  return (
                    <div key={i} className="border border-[var(--border-default)] rounded-lg overflow-hidden">
                      {sheetName && (
                        <div className="bg-[var(--bg-toolbar)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-title)] border-b border-[var(--border-default)]">
                          📊 {sheetName}
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                          <tbody>
                            {rows.map((row, ri) => (
                              <tr key={ri} className={ri === 0 ? 'bg-[var(--bg-toolbar)]' : 'hover:bg-black/[0.02]'}>
                                {row.split(' | ').map((cell, ci) => (
                                  <td key={ci} className="border border-[var(--border-default)] px-2 py-1 whitespace-nowrap">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Markdown: edit / preview / split */
          <>
            {/* Editor pane */}
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className={`${viewMode === 'split' ? 'w-1/2 border-r border-[var(--border-default)]' : 'flex-1'} overflow-auto`}>
                <div style={{ padding: '30px 50px', maxWidth: 800, margin: '0 auto' }}>
                  <textarea
                    ref={editorRef}
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setSaveState('idle') }}
                    className="w-full min-h-[600px] resize-none bg-transparent border-none outline-none
                      text-[14px] leading-[1.8] text-[var(--text-body)] font-mono
                      placeholder:text-[var(--text-placeholder)]"
                    placeholder="开始输入 Markdown..."
                    spellCheck={false}
                    readOnly={isLoading || docMode === 'unsupported'}
                  />
                </div>
              </div>
            )}

            {/* Preview pane */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} overflow-auto`}
                style={{ background: '#FAFAF9' }}
              >
                <div style={{ padding: '30px 50px', maxWidth: 800, margin: '0 auto' }}>
                  <div
                    className="md-preview text-[var(--text-body)]"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status bar */}
      <div
        className="h-[28px] flex items-center justify-between px-3 border-t border-[var(--border-default)] text-[11px] text-[var(--text-muted)]"
        style={{ background: 'var(--bg-toolbar)' }}
      >
        <div className="flex items-center gap-4">
          <span>
            {docMode === 'markdown' && 'Markdown'}
            {docMode === 'docx' && 'DOCX 预览'}
            {docMode === 'xlsx' && 'XLSX 预览'}
            {docMode === 'unsupported' && '不支持'}
          </span>
          <span>{content.length} 字符</span>
          <span>{content.split('\n').length} 行</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{statusText}</span>
          <span>
            {saveState === 'saved' ? '✓ 已保存' : saveState === 'saving' ? '保存中...' : canSave ? '未保存' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
