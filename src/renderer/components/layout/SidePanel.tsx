import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft, RefreshCw, ChevronRight, ChevronDown, Search,
  FileText, Folder, FolderOpen, Image, Film, FileSpreadsheet,
  FilePlus, FolderPlus, FolderOpen as FolderOpenIcon
} from 'lucide-react'
import { useWorkspace, type FileItem } from '../../stores/useWorkspace'
import { useMode, type WorkbenchMode } from '../../stores/useMode'
import ContextMenu, { type ContextMenuItem } from './ContextMenu'

// --- Inline editing input ---
function InlineInput({
  defaultValue,
  onConfirm,
  onCancel
}: {
  defaultValue: string
  onConfirm: (value: string) => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    inputRef.current?.focus()
    // Select filename without extension
    const dotIdx = defaultValue.lastIndexOf('.')
    inputRef.current?.setSelectionRange(0, dotIdx > 0 ? dotIdx : defaultValue.length)
  }, [defaultValue])

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value.trim()) onConfirm(value.trim())
        else onCancel()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && value.trim()) onConfirm(value.trim())
        if (e.key === 'Escape') onCancel()
        e.stopPropagation()
      }}
      className="w-full px-1 py-0.5 text-[12px] border border-[var(--color-blue)] rounded bg-[var(--bg-primary)] outline-none"
    />
  )
}

// --- Single file tree item ---
function FileTreeItem({
  item,
  isActive,
  isExpanded,
  isRenaming,
  depth,
  onToggleDir,
  onOpenFile,
  onContextMenu,
  onRenameConfirm,
  onRenameCancel
}: {
  item: FileItem
  isActive: boolean
  isExpanded: boolean
  isRenaming: boolean
  depth: number
  onToggleDir: () => void
  onOpenFile: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onRenameConfirm: (newName: string) => void
  onRenameCancel: () => void
}) {
  const getIcon = () => {
    if (item.isDirectory) {
      return isExpanded
        ? <FolderOpen className="w-4 h-4 text-[var(--color-blue)]" />
        : <Folder className="w-4 h-4 text-[var(--color-blue)]" />
    }
    const ext = item.name.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'md': case 'txt': case 'json': case 'ts': case 'tsx': case 'js': case 'css':
        return <FileText className="w-4 h-4 text-[var(--text-muted)]" />
      case 'png': case 'jpg': case 'jpeg': case 'webp': case 'svg': case 'gif':
        return <Image className="w-4 h-4 text-[var(--color-purple)]" />
      case 'mp4': case 'mov': case 'mkv': case 'avi': case 'webm':
        return <Film className="w-4 h-4 text-[var(--color-orange)]" />
      case 'xlsx': case 'csv': case 'xls':
        return <FileSpreadsheet className="w-4 h-4 text-[var(--color-green)]" />
      default:
        return <FileText className="w-4 h-4 text-[var(--text-muted)]" />
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / 1048576).toFixed(1)}MB`
  }

  return (
    <div
      onClick={() => item.isDirectory ? onToggleDir() : onOpenFile()}
      onContextMenu={onContextMenu}
      className={`
        flex items-center gap-2 rounded-lg text-[12px] cursor-pointer
        transition-colors duration-150 group
        ${isActive ? 'bg-[#E8E8E8] dark:bg-[#333538]' : 'hover:bg-black/5'}
      `}
      style={{ padding: '6px 8px', paddingLeft: `${8 + depth * 16}px` }}
    >
      {/* Chevron for directories */}
      {item.isDirectory ? (
        isExpanded
          ? <ChevronDown className="w-3 h-3 text-[var(--text-light)] flex-shrink-0" />
          : <ChevronRight className="w-3 h-3 text-[var(--text-light)] flex-shrink-0" />
      ) : (
        <span className="w-3 flex-shrink-0" />
      )}

      {/* Icon */}
      <span className="flex-shrink-0">{getIcon()}</span>

      {/* Name (inline editable or static) */}
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <InlineInput
            defaultValue={item.name}
            onConfirm={onRenameConfirm}
            onCancel={onRenameCancel}
          />
        ) : (
          <span className="truncate block">{item.name}</span>
        )}
      </div>

      {/* File size (subtle) */}
      {!item.isDirectory && item.size > 0 && (
        <span className="text-[10px] text-[var(--text-light)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {formatSize(item.size)}
        </span>
      )}
    </div>
  )
}

// --- Main SidePanel ---
interface SidePanelProps {
  width?: number
}

export default function SidePanel({ width = 220 }: SidePanelProps) {
  const [query, setQuery] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileItem | null } | null>(null)
  const {
    files,
    sidebarVisible,
    currentPath,
    workspaceRoot,
    selectedFile,
    expandedDirs,
    renamingPath,
    creatingType,
    setCurrentPath,
    selectFile,
    refreshFiles,
    toggleDir,
    openFolderDialog,
    createFile,
    createFolder,
    renameItem,
    deleteItem,
    showInFolder,
    copyPathToClipboard,
    startRenaming,
    cancelRenaming,
    startCreating,
    cancelCreating
  } = useWorkspace()

  const { setWorkbenchMode } = useMode()

  const parentPath = useMemo(() => {
    if (!workspaceRoot || currentPath === workspaceRoot) return null
    const normalized = currentPath.replace(/\/+$/, '') || '/'
    const idx = normalized.lastIndexOf('/')
    if (idx <= 0) return '/'
    return normalized.slice(0, idx)
  }, [currentPath, workspaceRoot])

  const filteredFiles = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return files
    return files.filter((file) => file.name.toLowerCase().includes(keyword))
  }, [files, query])

  // File opener that switches mode based on extension
  const handleOpenFile = useCallback((item: FileItem) => {
    selectFile(item.path)
    const ext = item.name.split('.').pop()?.toLowerCase() || ''
    const modeMap: Record<string, WorkbenchMode> = {
      md: 'document', txt: 'document', json: 'document', ts: 'document', tsx: 'document',
      js: 'document', css: 'document', html: 'document', docx: 'document', xlsx: 'document',
      png: 'image', jpg: 'image', jpeg: 'image', webp: 'image', svg: 'image', gif: 'image',
      mp4: 'video', mov: 'video', mkv: 'video', avi: 'video', webm: 'video'
    }
    if (modeMap[ext]) {
      setWorkbenchMode(modeMap[ext])
    }
  }, [selectFile, setWorkbenchMode])

  // Context menu items
  const getContextItems = useCallback((item: FileItem | null): ContextMenuItem[] => {
    if (!item) {
      // Right-click on empty area
      return [
        { id: 'newFile', label: '新建文件', onClick: () => startCreating('file') },
        { id: 'newFolder', label: '新建文件夹', onClick: () => startCreating('folder') },
        { id: 'sep1', label: '', separator: true },
        { id: 'refresh', label: '刷新', onClick: () => refreshFiles() }
      ]
    }
    return [
      ...(item.isDirectory ? [] : [
        { id: 'open', label: '打开', onClick: () => handleOpenFile(item) }
      ]),
      { id: 'sep1', label: '', separator: true },
      { id: 'rename', label: '重命名', shortcut: 'Enter', onClick: () => startRenaming(item.path) },
      { id: 'copyPath', label: '复制路径', shortcut: '⌥⌘C', onClick: () => copyPathToClipboard(item.path) },
      { id: 'sep2', label: '', separator: true },
      { id: 'newFile', label: '新建文件', onClick: () => startCreating('file') },
      { id: 'newFolder', label: '新建文件夹', onClick: () => startCreating('folder') },
      { id: 'sep3', label: '', separator: true },
      { id: 'showInFinder', label: '在 Finder 中显示', onClick: () => showInFolder(item.path) },
      { id: 'sep4', label: '', separator: true },
      {
        id: 'delete', label: '删除', danger: true, onClick: () => {
          if (confirm(`确定删除 "${item.name}" 吗？`)) {
            deleteItem(item.path)
          }
        }
      }
    ]
  }, [handleOpenFile, startRenaming, copyPathToClipboard, startCreating, showInFolder, deleteItem, refreshFiles])

  if (!sidebarVisible) return null

  // Show "Open Folder" prompt when no workspace root
  if (!workspaceRoot && !(typeof window !== 'undefined' && window.electronAPI)) {
    // In browser preview, just show mock files
  }

  const displayPath = currentPath === workspaceRoot
    ? currentPath.split('/').pop() || currentPath
    : currentPath.replace(workspaceRoot || '', '').replace(/^\//, '') || '/'

  return (
    <div
      className="flex-shrink-0 border-r border-[var(--border-default)] flex flex-col select-none"
      style={{ width, background: 'var(--bg-panel)' }}
      onContextMenu={(e) => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, item: null })
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-[var(--text-title)]">文件管理</span>
          {!(typeof window !== 'undefined' && window.electronAPI) ? (
            <span
              className="flex items-center gap-1 rounded-[10px] text-[10px] font-medium"
              style={{ padding: '3px 8px', background: 'var(--color-orange-light)', color: 'var(--color-orange)' }}
              title="浏览器预览模式下显示模拟文件"
            >
              预览
            </span>
          ) : (
            <span
              className="flex items-center gap-1 rounded-[10px] text-[10px] font-medium"
              style={{ padding: '3px 8px', background: 'var(--color-green-light)', color: 'var(--color-green)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)]" />
              已连接
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => startCreating('file')}
            title="新建文件"
            className="p-1 rounded hover:bg-black/5 text-[var(--text-gray)]"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => startCreating('folder')}
            title="新建文件夹"
            className="p-1 rounded hover:bg-black/5 text-[var(--text-gray)]"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={openFolderDialog}
            title="打开文件夹"
            className="p-1 rounded hover:bg-black/5 text-[var(--text-gray)]"
          >
            <FolderOpenIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 14px' }}>
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
          <div
            className="flex-1 truncate text-[11px] text-[var(--text-muted)] rounded-[10px] px-2.5 py-1"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-input)' }}
            title={currentPath}
          >
            {displayPath}
          </div>
        </div>

        <div
          className="flex items-center gap-[6px] rounded-[10px]"
          style={{ padding: '6px 10px', border: '1px solid var(--border-input)' }}
        >
          <Search className="w-3 h-3 text-[var(--text-light)] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文件..."
            className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--text-body)] placeholder:text-[var(--text-placeholder)]"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto px-1 pb-2 pt-2">
        {/* Inline create input */}
        {creatingType && (
          <div className="px-2 py-1">
            <div className="flex items-center gap-1">
              {creatingType === 'folder'
                ? <Folder className="w-4 h-4 text-[var(--color-blue)] flex-shrink-0" />
                : <FileText className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              }
              <InlineInput
                defaultValue={creatingType === 'folder' ? '新建文件夹' : '新建文件.md'}
                onConfirm={(name) => {
                  if (creatingType === 'folder') createFolder(name)
                  else createFile(name)
                }}
                onCancel={cancelCreating}
              />
            </div>
          </div>
        )}

        {filteredFiles.length === 0 && !creatingType ? (
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
              isExpanded={expandedDirs.has(file.path)}
              isRenaming={renamingPath === file.path}
              depth={0}
              onToggleDir={() => {
                if (file.isDirectory) {
                  selectFile(null)
                  setCurrentPath(file.path)
                }
              }}
              onOpenFile={() => handleOpenFile(file)}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setContextMenu({ x: e.clientX, y: e.clientY, item: file })
              }}
              onRenameConfirm={(newName) => renameItem(file.path, newName)}
              onRenameCancel={cancelRenaming}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          items={getContextItems(contextMenu.item)}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
