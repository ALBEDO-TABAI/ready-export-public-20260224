import { useMemo, useState } from 'react'
import { ArrowLeft, RefreshCw, ChevronRight, FileText, Folder, Image, Film, FileSpreadsheet } from 'lucide-react'
import { useWorkspace } from '../../stores/useWorkspace'

interface FileTreeItemProps {
  item: {
    name: string
    path: string
    isDirectory: boolean
  }
  isActive: boolean
  onOpenDirectory: (path: string) => void
  onOpenFile: (path: string) => void
}

function FileTreeItem({ item, isActive, onOpenDirectory, onOpenFile }: FileTreeItemProps) {
  const getIcon = () => {
    if (item.isDirectory) return <Folder className="w-4 h-4 text-[var(--color-blue)]" />
    const ext = item.name.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'md':
      case 'txt':
      case 'json':
        return <FileText className="w-4 h-4 text-[var(--text-muted)]" />
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
        return <Image className="w-4 h-4 text-[var(--color-purple)]" />
      case 'mp4':
      case 'mov':
      case 'mkv':
        return <Film className="w-4 h-4 text-[var(--color-orange)]" />
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-[var(--color-green)]" />
      default:
        return <FileText className="w-4 h-4 text-[var(--text-muted)]" />
    }
  }

  return (
    <button
      onClick={() => (item.isDirectory ? onOpenDirectory(item.path) : onOpenFile(item.path))}
      className={`
        w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px]
        transition-colors duration-200 text-left
        ${isActive ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]' : 'hover:bg-black/5'}
      `}
    >
      {item.isDirectory ? (
        <ChevronRight className="w-3 h-3 text-[var(--text-light)]" />
      ) : (
        <span className="w-3" />
      )}
      {getIcon()}
      <span className="truncate">{item.name}</span>
    </button>
  )
}

interface SidePanelProps {
  title?: string
  width?: number
}

export default function SidePanel({ title = '文件管理', width = 220 }: SidePanelProps) {
  const [query, setQuery] = useState('')
  const {
    files,
    sidebarVisible,
    currentPath,
    selectedFile,
    setCurrentPath,
    selectFile,
    refreshFiles
  } = useWorkspace()

  const parentPath = useMemo(() => {
    if (currentPath === '/') return null
    const normalized = currentPath.replace(/\/+$/, '') || '/'
    const idx = normalized.lastIndexOf('/')
    if (idx <= 0) return '/'
    return normalized.slice(0, idx)
  }, [currentPath])

  const filteredFiles = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return files
    return files.filter((file) => file.name.toLowerCase().includes(keyword))
  }, [files, query])

  if (!sidebarVisible) return null

  return (
    <div
      className="flex-shrink-0 border-r border-[var(--border-default)] flex flex-col"
      style={{ width, background: 'var(--bg-panel)' }}
    >
      <div className="h-[38px] flex items-center px-3 border-b border-[var(--border-default)]">
        <span className="text-[13px] font-semibold text-[var(--text-title)]">{title}</span>
        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-green-light)] text-[var(--color-green)]">
          Connected
        </span>
      </div>

      <div className="px-3 pt-2">
        <div className="flex items-center gap-1 mb-2">
          <button
            onClick={() => parentPath && setCurrentPath(parentPath)}
            disabled={!parentPath}
            className="p-1 rounded border border-[var(--border-default)] disabled:opacity-40 hover:bg-black/5"
            title="返回上一级"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => refreshFiles()}
            className="p-1 rounded border border-[var(--border-default)] hover:bg-black/5"
            title="刷新"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 truncate text-[11px] text-[var(--text-muted)] bg-white rounded px-2 py-1 border border-[var(--border-default)]">
            {currentPath}
          </div>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索文件..."
          className="w-full px-3 py-1.5 rounded-[10px] text-[12px] border border-[var(--border-input)] bg-white
            placeholder:text-[var(--text-placeholder)]
            focus:outline-none focus:border-[var(--color-blue)] focus:ring-1 focus:ring-[var(--color-blue)]"
        />
      </div>

      <div className="flex-1 overflow-auto px-2 pb-2 pt-2">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[var(--text-light)]">
            <Folder className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-[11px]">{files.length === 0 ? '暂无文件' : '未找到匹配文件'}</span>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <FileTreeItem
              key={file.path}
              item={file}
              isActive={file.isDirectory ? currentPath === file.path : selectedFile === file.path}
              onOpenDirectory={(path) => {
                selectFile(null)
                setCurrentPath(path)
              }}
              onOpenFile={(path) => selectFile(path)}
            />
          ))
        )}
      </div>
    </div>
  )
}
