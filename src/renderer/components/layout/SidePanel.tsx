import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft, RefreshCw, ChevronRight, ChevronDown, Search,
  FileText, Folder, FolderOpen, Image, Film, FileSpreadsheet,
  FilePlus, FolderPlus, FolderOpen as FolderOpenIcon, PanelLeftClose,
  MoreVertical
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

// --- Allowed file extensions ---
const ALLOWED_EXTENSIONS = new Set([
  // 文档
  'md', 'txt', 'pdf', 'docx', 'doc', 'rtf', 'odt',
  // 代码
  'ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css', 'scss', 'less',
  'py', 'go', 'rs', 'java', 'kt', 'swift', 'c', 'cpp', 'h',
  'yaml', 'yml', 'toml', 'xml', 'sql', 'sh', 'bash', 'zsh',
  'vue', 'svelte', 'astro', 'env', 'gitignore',
  // 网页
  'htm', 'svg',
  // 图片
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'ico', 'tiff',
  // 视频
  'mp4', 'mov', 'mkv', 'avi', 'webm', 'flv', 'wmv',
  // 音频
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a',
  // 表格
  'xlsx', 'xls', 'csv', 'tsv',
  // 配置
  'ini', 'cfg', 'conf', 'properties', 'plist',
  // 其他
  'log', 'lock',
])

function isFileAllowed(item: FileItem): boolean {
  if (item.isDirectory) return true
  // Files without extension are allowed (Makefile, Dockerfile, etc.)
  const ext = item.name.split('.').pop()?.toLowerCase()
  if (!ext || ext === item.name.toLowerCase()) return true
  return ALLOWED_EXTENSIONS.has(ext)
}

// --- Recursive file tree ---
function FileTreeRecursive({
  items,
  depth,
  selectedFile,
  expandedDirs,
  dirChildren,
  renamingPath,
  onToggleDir,
  onOpenFile,
  onContextMenu,
  onRenameConfirm,
  onRenameCancel
}: {
  items: FileItem[]
  depth: number
  selectedFile: string | null
  expandedDirs: Set<string>
  dirChildren: Map<string, FileItem[]>
  renamingPath: string | null
  onToggleDir: (path: string) => Promise<void>
  onOpenFile: (item: FileItem) => void
  onContextMenu: (e: React.MouseEvent, item: FileItem) => void
  onRenameConfirm: (path: string, newName: string) => void
  onRenameCancel: () => void
}) {
  return (
    <>
      {items.filter(isFileAllowed).map((item) => {
        const isExpanded = expandedDirs.has(item.path)
        const children = dirChildren.get(item.path) || []
        return (
          <div key={item.path}>
            <FileTreeItem
              item={item}
              isActive={selectedFile === item.path}
              isExpanded={isExpanded}
              isRenaming={renamingPath === item.path}
              depth={depth}
              onToggleDir={() => onToggleDir(item.path)}
              onOpenFile={() => onOpenFile(item)}
              onContextMenu={(e) => onContextMenu(e, item)}
              onRenameConfirm={(newName) => onRenameConfirm(item.path, newName)}
              onRenameCancel={onRenameCancel}
            />
            {item.isDirectory && isExpanded && children.length > 0 && (
              <FileTreeRecursive
                items={children}
                depth={depth + 1}
                selectedFile={selectedFile}
                expandedDirs={expandedDirs}
                dirChildren={dirChildren}
                renamingPath={renamingPath}
                onToggleDir={onToggleDir}
                onOpenFile={onOpenFile}
                onContextMenu={onContextMenu}
                onRenameConfirm={onRenameConfirm}
                onRenameCancel={onRenameCancel}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

// --- Main SidePanel ---
export default function SidePanel() {
  const [query, setQuery] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileItem | null } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const workspaceMenuRef = useRef<HTMLDivElement>(null)
  const {
    files,
    sidebarVisible,
    sidebarWidth,
    toggleSidebar,
    currentPath,
    workspaceRoot,
    selectedFile,
    expandedDirs,
    dirChildren,
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
    cancelCreating,
    clearWorkspace,
    saveWorkspace,
    getSavedWorkspaces,
    loadSavedWorkspace,
  } = useWorkspace()

  const { setWorkbenchMode } = useMode()

  // Close workspace menu on click outside
  useEffect(() => {
    if (!showWorkspaceMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        setShowWorkspaceMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showWorkspaceMenu])

  const parentPath = useMemo(() => {
    if (!workspaceRoot || currentPath === workspaceRoot) return null
    const normalized = currentPath.replace(/\/+$/, '') || '/'
    const idx = normalized.lastIndexOf('/')
    if (idx <= 0) return '/'
    return normalized.slice(0, idx)
  }, [currentPath, workspaceRoot])

  const filteredFiles = useMemo(() => {
    let result = files.filter(isFileAllowed)
    const keyword = query.trim().toLowerCase()
    if (keyword) {
      result = result.filter((file) => file.name.toLowerCase().includes(keyword))
    }
    return result
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

  // Show "Open Folder" prompt when no workspace root
  if (!workspaceRoot && !(typeof window !== 'undefined' && window.electronAPI)) {
    // In browser preview, just show mock files
  }

  // --- Drag & Drop from Finder ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy'
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const droppedFiles = e.dataTransfer.files
    if (!droppedFiles || droppedFiles.length === 0) return

    if (typeof window !== 'undefined' && window.electronAPI) {
      // Collect all dropped paths
      const droppedPaths: string[] = []
      for (let i = 0; i < droppedFiles.length; i++) {
        const p = window.electronAPI.getFilePathFromDrop(droppedFiles[i])
        if (p) droppedPaths.push(p)
      }
      if (droppedPaths.length === 0) return

      // Check if any dropped item is a directory (via stat)
      // For simplicity: use the parent directory of all dropped paths as the new root
      // This way each dropped folder/file appears as an entry in the file tree
      const parents = droppedPaths.map(p => {
        const idx = p.lastIndexOf('/')
        return idx > 0 ? p.slice(0, idx) : '/'
      })

      // Find the common parent of all dropped items
      const commonParent = parents.reduce((common, parent) => {
        if (!common) return parent
        // Find common prefix
        const parts1 = common.split('/')
        const parts2 = parent.split('/')
        const shared: string[] = []
        for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
          if (parts1[i] === parts2[i]) shared.push(parts1[i])
          else break
        }
        return shared.join('/') || '/'
      }, '')

      // Set workspace root to the common parent so all dropped items appear as entries
      const { setWorkspaceRoot: setRoot } = useWorkspace.getState()
      setRoot(commonParent)
    }
  }, [])

  const displayPath = currentPath === workspaceRoot
    ? currentPath.split('/').pop() || currentPath
    : currentPath.replace(workspaceRoot || '', '').replace(/^\//, '') || '/'

  return (
    <div
      className="flex-shrink-0 border-r border-[var(--border-default)] flex flex-col select-none overflow-hidden"
      style={{
        width: sidebarVisible ? sidebarWidth : 0,
        minWidth: sidebarVisible ? sidebarWidth : 0,
        background: 'var(--bg-panel)',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        borderRightWidth: sidebarVisible ? 1 : 0,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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

          {/* Workspace menu */}
          <div className="relative" ref={workspaceMenuRef}>
            <button
              onClick={() => setShowWorkspaceMenu(v => !v)}
              title="工作区操作"
              className="p-1 rounded hover:bg-black/5 text-[var(--text-gray)]"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showWorkspaceMenu && (
              <div
                className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] shadow-lg py-1"
                onClick={() => setShowWorkspaceMenu(false)}
              >
                <button
                  onClick={() => {
                    if (!workspaceRoot || confirm('确定新建工作区？当前文件列表将被清空。')) {
                      clearWorkspace()
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-black/5 flex items-center gap-2"
                >
                  <FilePlus className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  新建工作区
                </button>
                <button
                  onClick={() => {
                    if (!workspaceRoot) return alert('当前没有打开的工作区')
                    const name = prompt('工作区名称：', workspaceRoot.split('/').pop() || '我的工作区')
                    if (name) {
                      saveWorkspace(name)
                      alert(`工作区 "${name}" 已保存`)
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-black/5 flex items-center gap-2"
                >
                  <Folder className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  保存工作区
                </button>

                {/* Separator */}
                <div className="border-t border-[var(--border-default)] my-1" />

                {/* Saved workspaces */}
                {getSavedWorkspaces().length > 0 && (
                  <>
                    <div className="px-3 py-1 text-[10px] text-[var(--text-light)] font-medium">已保存的工作区</div>
                    {getSavedWorkspaces().map(w => (
                      <button
                        key={w.name}
                        onClick={() => loadSavedWorkspace(w.root)}
                        className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-black/5 flex items-center gap-2 group"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-[var(--color-blue)]" />
                        <span className="flex-1 truncate">{w.name}</span>
                      </button>
                    ))}
                    <div className="border-t border-[var(--border-default)] my-1" />
                  </>
                )}

                <button
                  onClick={openFolderDialog}
                  className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-black/5 flex items-center gap-2"
                >
                  <FolderOpenIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  打开文件夹...
                </button>
              </div>
            )}
          </div>
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
      <div className="flex-1 overflow-auto px-1 pb-2 pt-2 relative">
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-blue-light)] border-2 border-dashed border-[var(--color-blue)] rounded-lg m-1 pointer-events-none">
            <div className="flex flex-col items-center gap-1">
              <FolderOpenIcon className="w-6 h-6 text-[var(--color-blue)]" />
              <span className="text-[12px] font-medium text-[var(--color-blue)]">拖放文件到这里</span>
            </div>
          </div>
        )}
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
          <FileTreeRecursive
            items={filteredFiles}
            depth={0}
            selectedFile={selectedFile}
            expandedDirs={expandedDirs}
            dirChildren={dirChildren}
            renamingPath={renamingPath}
            onToggleDir={toggleDir}
            onOpenFile={handleOpenFile}
            onContextMenu={(e, item) => {
              e.preventDefault()
              e.stopPropagation()
              setContextMenu({ x: e.clientX, y: e.clientY, item })
            }}
            onRenameConfirm={(path, newName) => renameItem(path, newName)}
            onRenameCancel={cancelRenaming}
          />
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
