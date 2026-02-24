import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Save,
  Loader2
} from 'lucide-react'
import { useWorkspace } from '../../stores/useWorkspace'

const DEFAULT_CONTENT = `# 欢迎使用 Ready 文档编辑器

这是一个支持 Markdown 的富文本编辑器。

## 功能特点

- **所见即所得**编辑体验
- 支持常见的 Markdown 语法
- AI 辅助写作
- 实时协作（未来版本）

## 快速开始

1. 点击左侧文件管理器选择文档
2. 在编辑器中输入内容
3. 使用工具栏设置格式
4. 按 Cmd/Ctrl + S 保存
`

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
  const filename = path.split('/').pop() || ''
  const ext = filename.split('.').pop() || ''
  return ext.toLowerCase()
}

const formatXlsxPreview = (data: unknown): string => {
  if (!data || typeof data !== 'object') {
    return '[XLSX] 当前文件暂无可预览内容'
  }

  const sections = Object.entries(data as Record<string, unknown>).map(([sheetName, rows]) => {
    const header = `## Sheet: ${sheetName}`
    if (!Array.isArray(rows)) {
      return `${header}\n\n(无可用行数据)`
    }

    const formattedRows = rows
      .map((row) => {
        if (!Array.isArray(row)) return String(row)
        return row.map((cell) => String(cell ?? '')).join(' | ')
      })
      .join('\n')

    return `${header}\n\n${formattedRows || '(空表)'}`
  })

  return sections.join('\n\n')
}

export default function DocumentMode() {
  const { selectedFile } = useWorkspace()
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [activeFormats, setActiveFormats] = useState<string[]>([])
  const [docMode, setDocMode] = useState<DocMode>('markdown')
  const [isLoading, setIsLoading] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [statusText, setStatusText] = useState('准备就绪')

  const currentExt = useMemo(() => getFileExt(selectedFile), [selectedFile])
  const canSave = docMode === 'markdown' && !!selectedFile

  const toggleFormat = (format: string) => {
    setActiveFormats((prev) =>
      prev.includes(format) ? prev.filter((item) => item !== format) : [...prev, format]
    )
  }

  useEffect(() => {
    let cancelled = false

    const loadDocument = async () => {
      if (!selectedFile) {
        setDocMode('markdown')
        setContent(DEFAULT_CONTENT)
        setStatusText('未选择文件，正在编辑临时文档')
        return
      }

      if (typeof window === 'undefined' || !window.electronAPI) {
        return
      }

      setIsLoading(true)
      setSaveState('idle')

      try {
        if (currentExt === 'md' || currentExt === 'txt' || currentExt === 'json') {
          const result = (await window.electronAPI.document.readFile(selectedFile)) as ReadResult
          if (!result.success) throw new Error(result.error || '文件读取失败')
          if (!cancelled) {
            setDocMode('markdown')
            setContent(result.content || '')
            setStatusText('文件已加载')
          }
          return
        }

        if (currentExt === 'docx') {
          const result = (await window.electronAPI.document.parseDocx(selectedFile)) as ReadResult
          if (!result.success) throw new Error(result.error || 'DOCX 解析失败')
          if (!cancelled) {
            setDocMode('docx')
            setContent(result.content || result.html || '[DOCX] 当前文件暂无可预览内容')
            setStatusText('DOCX 已解析（预览模式）')
          }
          return
        }

        if (currentExt === 'xlsx' || currentExt === 'csv') {
          const result = (await window.electronAPI.document.parseXlsx(selectedFile)) as ReadResult
          if (!result.success) throw new Error(result.error || 'XLSX 解析失败')
          if (!cancelled) {
            setDocMode('xlsx')
            setContent(formatXlsxPreview(result.data))
            setStatusText('表格已解析（预览模式）')
          }
          return
        }

        if (!cancelled) {
          setDocMode('unsupported')
          setContent(
            `# 暂不支持该格式的直接编辑\n\n文件路径: ${selectedFile}\n\n建议先转换为 .md / .txt / .docx / .xlsx 后再编辑。`
          )
          setStatusText('当前格式仅支持提示信息展示')
        }
      } catch (error) {
        if (!cancelled) {
          setContent(
            `# 文件读取失败\n\n${error instanceof Error ? error.message : String(error)}\n\n文件路径: ${selectedFile}`
          )
          setStatusText('读取失败')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDocument()
    return () => {
      cancelled = true
    }
  }, [selectedFile, currentExt])

  const handleSave = useCallback(async () => {
    if (!selectedFile) {
      setSaveState('error')
      setStatusText('请先在文件侧栏选择保存目标')
      return
    }

    if (!canSave) {
      setSaveState('error')
      setStatusText('当前文件格式暂不支持回写保存')
      return
    }

    if (typeof window === 'undefined' || !window.electronAPI) {
      setSaveState('error')
      setStatusText('当前环境不可写入文件')
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isSave = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's'
      if (!isSave) return
      event.preventDefault()
      handleSave()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  return (
    <div className="flex flex-col h-full">
      <div
        className="h-[40px] flex items-center justify-between px-3 border-b border-[var(--border-default)]"
        style={{ background: 'var(--bg-toolbar)' }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleFormat('bold')}
            className={`p-1.5 rounded hover:bg-black/5 transition-colors ${activeFormats.includes('bold') ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]' : ''}`}
          >
            <Bold className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => toggleFormat('italic')}
            className={`p-1.5 rounded hover:bg-black/5 transition-colors ${activeFormats.includes('italic') ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]' : ''}`}
          >
            <Italic className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => toggleFormat('underline')}
            className={`p-1.5 rounded hover:bg-black/5 transition-colors ${activeFormats.includes('underline') ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]' : ''}`}
          >
            <Underline className="w-4 h-4" strokeWidth={2} />
          </button>
          <button
            onClick={() => toggleFormat('strikethrough')}
            className={`p-1.5 rounded hover:bg-black/5 transition-colors ${activeFormats.includes('strikethrough') ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]' : ''}`}
          >
            <Strikethrough className="w-4 h-4" strokeWidth={2} />
          </button>

          <div className="w-px h-5 bg-[var(--border-default)] mx-1" />

          <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
            <List className="w-4 h-4" strokeWidth={2} />
          </button>
          <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
            <ListOrdered className="w-4 h-4" strokeWidth={2} />
          </button>
          <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
            <CheckSquare className="w-4 h-4" strokeWidth={2} />
          </button>
          <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
            <Link className="w-4 h-4" strokeWidth={2} />
          </button>
          <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
            <Code className="w-4 h-4" strokeWidth={2} />
          </button>
          <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
            <Quote className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-muted)] max-w-[280px] truncate">
            {selectedFile || '未选择文件'}
          </span>
          <button
            onClick={handleSave}
            disabled={!canSave || isLoading || saveState === 'saving'}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] border border-[var(--border-default)] bg-white hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveState === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>保存</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-[800px] mx-auto p-8">
          {docMode === 'docx' ? (
            /* DOCX: render the HTML produced by mammoth */
            <div
              className="prose prose-sm max-w-none text-[var(--text-body)]
                [&_h1]:text-[24px] [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-[var(--text-title)]
                [&_h2]:text-[20px] [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:text-[var(--text-title)]
                [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:mb-3
                [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
                [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--border-default)] [&_td]:px-2 [&_td]:py-1
                [&_th]:border [&_th]:border-[var(--border-default)] [&_th]:px-2 [&_th]:py-1 [&_th]:bg-[var(--bg-toolbar)]
                [&_img]:max-w-full [&_img]:rounded"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : docMode === 'xlsx' ? (
            /* XLSX: styled preview with sheet sections */
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
          ) : (
            /* Markdown / text: editable textarea */
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[500px] resize-none bg-transparent border-none outline-none
                text-[15px] leading-relaxed text-[var(--text-body)] font-normal
                placeholder:text-[var(--text-placeholder)]"
              placeholder="开始输入..."
              spellCheck={false}
              readOnly={isLoading || docMode === 'unsupported'}
            />
          )}
        </div>
      </div>

      <div
        className="h-[28px] flex items-center justify-between px-3 border-t border-[var(--border-default)] text-[11px] text-[var(--text-muted)]"
        style={{ background: 'var(--bg-toolbar)' }}
      >
        <div className="flex items-center gap-4">
          <span>
            {docMode === 'markdown' && 'Markdown 模式'}
            {docMode === 'docx' && 'DOCX 预览模式'}
            {docMode === 'xlsx' && 'XLSX 预览模式'}
            {docMode === 'unsupported' && '不支持的格式'}
          </span>
          <span>{content.length} 字符</span>
          <span>{content.split(/\s+/).filter((word) => word.length > 0).length} 词</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{statusText}</span>
          <span>{saveState === 'saved' ? '已保存' : saveState === 'saving' ? '保存中' : '未保存'}</span>
        </div>
      </div>
    </div>
  )
}
