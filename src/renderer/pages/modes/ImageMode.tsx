import { useState, useCallback, useRef, useEffect } from 'react'
import {
  MousePointer, Move, Grid3X3, Square, Type, Brush,
  Sparkles, Layers, Eye, EyeOff, Lock, Unlock,
  Copy, Trash2, Download, ChevronDown, ChevronRight,
  Plus, Minus, GripVertical, Type as TypeIcon, Image as ImageIcon,
  Upload
} from 'lucide-react'
import { useWorkspace } from '../../stores/useWorkspace'

// --- Types ---

interface CanvasObject {
  id: string
  type: 'rect' | 'text' | 'image'
  name: string
  x: number
  y: number
  width: number
  height: number
  fill?: string
  fillOpacity?: number
  stroke?: string
  strokeWidth?: number
  strokeEnabled?: boolean
  text?: string
  fontSize?: number
  visible: boolean
  locked: boolean
  selected?: boolean
}

type ActiveTool = 'select' | 'pan' | 'grid' | 'shape' | 'text' | 'brush' | 'ai'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  layerId: string | null
}

// --- Initial Data ---

const initialObjects: CanvasObject[] = [
  {
    id: 'bg',
    type: 'rect',
    name: '背景',
    x: 0, y: 0, width: 800, height: 600,
    fill: '#F8F9FA', fillOpacity: 1,
    visible: true, locked: true, selected: false
  },
  {
    id: 'hero-rect',
    type: 'rect',
    name: '主视觉区',
    x: 40, y: 40, width: 720, height: 320,
    fill: '#5B8DEF', fillOpacity: 1,
    stroke: '#3A6FD8', strokeWidth: 2, strokeEnabled: true,
    visible: true, locked: false, selected: false
  },
  {
    id: 'title-text',
    type: 'text',
    name: '标题文字',
    x: 80, y: 120, width: 640, height: 60,
    text: 'Ready — 自媒体 AI 工作台',
    fontSize: 36, fill: '#FFFFFF', fillOpacity: 1,
    visible: true, locked: false, selected: true
  },
  {
    id: 'subtitle-text',
    type: 'text',
    name: '副标题',
    x: 80, y: 200, width: 640, height: 30,
    text: '让 AI 帮你完成从创意到发布的全流程',
    fontSize: 18, fill: '#E0E8FF', fillOpacity: 1,
    visible: true, locked: false, selected: false
  },
  {
    id: 'cta-rect',
    type: 'rect',
    name: 'CTA 按钮',
    x: 80, y: 260, width: 160, height: 48,
    fill: '#FF9F43', fillOpacity: 1,
    visible: true, locked: false, selected: false
  }
]

// --- Component ---

export default function ImageMode() {
  const { selectedFile } = useWorkspace()
  const [activeTool, setActiveTool] = useState<ActiveTool>('select')
  const [objects, setObjects] = useState<CanvasObject[]>(initialObjects)
  const [selectedId, setSelectedId] = useState<string | null>('title-text')
  const [zoom, setZoom] = useState(1)
  const [layersExpanded, setLayersExpanded] = useState(true)
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null)

  // Load real image when selectedFile is an image
  useEffect(() => {
    const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp']
    if (!selectedFile) {
      setLoadedImageUrl(null)
      return
    }
    const ext = selectedFile.split('.').pop()?.toLowerCase() || ''
    if (!imageExts.includes(ext)) {
      setLoadedImageUrl(null)
      return
    }

    // Use file:// protocol for Electron, or try to read as base64
    if (typeof window !== 'undefined' && window.electronAPI) {
      // In Electron, file:// works directly
      setLoadedImageUrl(`file://${selectedFile}`)
    } else {
      // In browser preview, show placeholder
      setLoadedImageUrl(null)
    }

    // Create image object on the canvas
    const img = new Image()
    img.onload = () => {
      const maxW = 800
      const maxH = 600
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)

      setObjects(prev => {
        // Remove any existing loaded-image layer
        const filtered = prev.filter(o => o.id !== 'loaded-image')
        // Insert after background
        const bgIdx = filtered.findIndex(o => o.id === 'bg')
        const newObj: CanvasObject = {
          id: 'loaded-image',
          type: 'image',
          name: selectedFile.split('/').pop() || '图片',
          x: Math.round((maxW - w) / 2),
          y: Math.round((maxH - h) / 2),
          width: w,
          height: h,
          visible: true,
          locked: false,
          selected: true
        }
        const result = [...filtered]
        result.splice(bgIdx + 1, 0, newObj)
        return result
      })
      setSelectedId('loaded-image')
    }
    if (typeof window !== 'undefined' && window.electronAPI) {
      img.src = `file://${selectedFile}`
    }
  }, [selectedFile])

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    layerId: null
  })

  const contextMenuRef = useRef<HTMLDivElement>(null)

  const selectedObject = objects.find(o => o.id === selectedId) || null

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }))
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // --- Handlers ---

  const handleObjectSelect = useCallback((id: string) => {
    const obj = objects.find(o => o.id === id)
    if (obj?.locked) return
    setObjects(prev => prev.map(o => ({ ...o, selected: o.id === id })))
    setSelectedId(id)
  }, [objects])

  const updateObject = useCallback((id: string, updates: Partial<CanvasObject>) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
  }, [])

  const updateSelectedObject = useCallback((updates: Partial<CanvasObject>) => {
    if (!selectedId) return
    updateObject(selectedId, updates)
  }, [selectedId, updateObject])

  const toggleVisibility = useCallback((id: string) => {
    updateObject(id, { visible: !objects.find(o => o.id === id)?.visible })
  }, [objects, updateObject])

  const toggleLock = useCallback((id: string) => {
    updateObject(id, { locked: !objects.find(o => o.id === id)?.locked })
  }, [objects, updateObject])

  const deleteObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const duplicateObject = useCallback((id: string) => {
    const obj = objects.find(o => o.id === id)
    if (!obj) return
    const newObj: CanvasObject = {
      ...obj,
      id: `${obj.id}-copy-${Date.now()}`,
      name: `${obj.name} 副本`,
      x: obj.x + 20,
      y: obj.y + 20,
      selected: false
    }
    setObjects(prev => [...prev, newObj])
  }, [objects])

  // Merge layer with the one below it
  const mergeLayer = useCallback((id: string) => {
    const currentIndex = objects.findIndex(o => o.id === id)
    if (currentIndex <= 0) return // Can't merge if it's the bottom layer or not found

    const currentObj = objects[currentIndex]
    const targetObj = objects[currentIndex - 1]

    // Simple merge: delete the current layer and apply some properties to target
    // In a real app, this would involve canvas drawing operations
    setObjects(prev => {
      const newObjects = [...prev]
      // Remove the current layer
      newObjects.splice(currentIndex, 1)
      return newObjects
    })

    if (selectedId === id) {
      setSelectedId(targetObj.id)
    }
  }, [objects, selectedId])

  // --- Drag and Drop Handlers ---

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    // Set a transparent drag image or use default
    e.dataTransfer.setData('text/plain', id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedId && draggedId !== id) {
      setDragOverId(id)
    }
  }, [draggedId])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOverId(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    setObjects(prev => {
      const draggedIndex = prev.findIndex(o => o.id === draggedId)
      const targetIndex = prev.findIndex(o => o.id === targetId)

      if (draggedIndex === -1 || targetIndex === -1) return prev

      const newObjects = [...prev]
      const [removed] = newObjects.splice(draggedIndex, 1)
      newObjects.splice(targetIndex, 0, removed)

      return newObjects
    })

    setDraggedId(null)
    setDragOverId(null)
  }, [draggedId])

  // --- Context Menu Handlers ---

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      layerId: id
    })
  }, [])

  const handleContextMenuAction = useCallback((action: 'duplicate' | 'delete' | 'merge') => {
    if (!contextMenu.layerId) return

    switch (action) {
      case 'duplicate':
        duplicateObject(contextMenu.layerId)
        break
      case 'delete':
        deleteObject(contextMenu.layerId)
        break
      case 'merge':
        mergeLayer(contextMenu.layerId)
        break
    }

    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [contextMenu.layerId, duplicateObject, deleteObject, mergeLayer])

  // --- Tool definitions ---

  const tools: { id: ActiveTool; icon: typeof MousePointer; label: string }[] = [
    { id: 'select', icon: MousePointer, label: '选择' },
    { id: 'pan', icon: Move, label: '平移' },
    { id: 'grid', icon: Grid3X3, label: '网格' },
    { id: 'shape', icon: Square, label: '形状' },
    { id: 'text', icon: Type, label: '文字' },
    { id: 'brush', icon: Brush, label: '画笔' }
  ]

  // --- Render ---

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex overflow-hidden">

        {/* ToolsPanel — matches design caMJS */}
        <div
          className="flex flex-col items-center gap-1 flex-shrink-0"
          style={{
            width: 48,
            padding: '12px 0',
            background: '#FAFAF9',
            borderRight: '1px solid #E8E8E8'
          }}
        >
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
              className={`
                w-[34px] h-[34px] rounded-[10px] flex items-center justify-center
                transition-all duration-200
                ${activeTool === tool.id
                  ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]'
                  : 'text-[#6A6A6A] hover:bg-black/5'
                }
              `}
            >
              <tool.icon className="w-[18px] h-[18px]" strokeWidth={2} />
            </button>
          ))}

          <div className="w-6 h-px bg-[var(--border-default)] my-1" />

          {/* AI Tool */}
          <button
            onClick={() => setActiveTool('ai')}
            title="AI 工具"
            className={`
              w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-all
              ${activeTool === 'ai'
                ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]'
                : 'text-[var(--color-blue)] hover:bg-[var(--color-blue-light)]'
              }
            `}
          >
            <Sparkles className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
        </div>

        {/* CanvasArea — matches design qWdG4 */}
        <div
          className="flex-1 relative overflow-auto"
          style={{ background: '#F0EFED' }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              minWidth: '100%',
              minHeight: '100%',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Canvas Container */}
            <div
              className="relative bg-[var(--bg-primary)] shadow-xl rounded-sm"
              style={{ width: 800, height: 600 }}
            >
              {objects.filter(o => o.visible).map((obj) => (
                <div
                  key={obj.id}
                  onClick={(e) => { e.stopPropagation(); handleObjectSelect(obj.id) }}
                  className={`absolute transition-shadow ${obj.locked ? 'cursor-default' : 'cursor-pointer'
                    } ${obj.selected
                      ? 'ring-2 ring-[var(--color-blue)] ring-offset-1'
                      : 'hover:ring-1 hover:ring-[var(--color-blue)]/30'
                    }`}
                  style={{
                    left: obj.x,
                    top: obj.y,
                    width: obj.width,
                    height: obj.height,
                    background: obj.fill,
                    opacity: obj.fillOpacity ?? 1,
                    border: obj.strokeEnabled ? `${obj.strokeWidth || 1}px solid ${obj.stroke || '#000'}` : undefined,
                    fontSize: obj.fontSize,
                    display: 'flex',
                    alignItems: obj.type === 'text' ? 'center' : undefined,
                  }}
                >
                  {obj.type === 'text' && (
                    <span style={{ color: obj.fill, fontWeight: obj.fontSize && obj.fontSize > 24 ? 700 : 400 }}>
                      {obj.text}
                    </span>
                  )}
                  {obj.type === 'image' && obj.id === 'loaded-image' && loadedImageUrl && (
                    <img
                      src={loadedImageUrl}
                      alt={obj.name}
                      className="w-full h-full object-contain pointer-events-none"
                      draggable={false}
                    />
                  )}
                  {obj.type === 'image' && obj.id === 'loaded-image' && !loadedImageUrl && (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-light)]">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-[11px]">浏览器预览模式</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur rounded-lg shadow-md border border-[var(--border-default)] px-2 py-1">
            <button
              onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
              className="p-1 hover:bg-black/5 rounded"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="text-[11px] w-12 text-center hover:bg-black/5 rounded px-1 py-0.5"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom(Math.min(4, zoom + 0.25))}
              className="p-1 hover:bg-black/5 rounded"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Export Button */}
          <div className="absolute bottom-4 right-4">
            <button className="flex items-center gap-1.5 bg-[var(--color-blue)] text-white rounded-lg shadow-md px-3 py-1.5 text-[12px] font-medium hover:brightness-110 transition-all">
              <Download className="w-3.5 h-3.5" />
              导出
            </button>
          </div>
        </div>

        {/* PropertiesPanel — matches design 9C9vi */}
        <div
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            width: 268,
            background: '#FAFAF9',
            borderLeft: '1px solid #E8E8E8'
          }}
        >
          {/* Properties Inspector */}
          <div className="flex-1 overflow-auto" style={{ padding: '20px 16px' }}>
            <h3 className="text-[13px] font-semibold text-[var(--text-title)] mb-4">属性</h3>

            {selectedObject ? (
              <div className="space-y-5">
                {/* Object name */}
                <div className="text-[11px] text-[var(--text-muted)] bg-black/[0.03] px-2 py-1 rounded">
                  {selectedObject.name} · {selectedObject.type}
                </div>

                {/* Geometry */}
                <InspectorSection title="几何">
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField label="X" value={selectedObject.x} onChange={v => updateSelectedObject({ x: v })} />
                    <NumberField label="Y" value={selectedObject.y} onChange={v => updateSelectedObject({ y: v })} />
                    <NumberField label="W" value={selectedObject.width} onChange={v => updateSelectedObject({ width: v })} />
                    <NumberField label="H" value={selectedObject.height} onChange={v => updateSelectedObject({ height: v })} />
                  </div>
                </InspectorSection>

                {/* Fill */}
                <InspectorSection title="填充">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedObject.fill || '#ffffff'}
                      onChange={(e) => updateSelectedObject({ fill: e.target.value })}
                      className="w-8 h-8 rounded border border-[var(--border-input)] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedObject.fill || '#ffffff'}
                      onChange={(e) => updateSelectedObject({ fill: e.target.value })}
                      className="flex-1 px-2 py-1 rounded border border-[var(--border-input)] text-[12px] bg-[var(--bg-primary)]"
                    />
                  </div>
                  <div className="mt-2">
                    <NumberField
                      label="不透明度"
                      value={Math.round((selectedObject.fillOpacity ?? 1) * 100)}
                      onChange={v => updateSelectedObject({ fillOpacity: v / 100 })}
                      suffix="%"
                    />
                  </div>
                </InspectorSection>

                {/* Stroke */}
                <InspectorSection title="描边">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedObject.strokeEnabled ?? false}
                      onChange={(e) => updateSelectedObject({ strokeEnabled: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-[11px] text-[var(--text-muted)]">启用描边</span>
                  </div>
                  {selectedObject.strokeEnabled && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedObject.stroke || '#000000'}
                          onChange={(e) => updateSelectedObject({ stroke: e.target.value })}
                          className="w-8 h-8 rounded border border-[var(--border-input)] cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedObject.stroke || '#000000'}
                          onChange={(e) => updateSelectedObject({ stroke: e.target.value })}
                          className="flex-1 px-2 py-1 rounded border border-[var(--border-input)] text-[12px] bg-[var(--bg-primary)]"
                        />
                      </div>
                      <NumberField
                        label="宽度"
                        value={selectedObject.strokeWidth ?? 1}
                        onChange={v => updateSelectedObject({ strokeWidth: v })}
                        suffix="px"
                      />
                    </div>
                  )}
                </InspectorSection>

                {/* Text-specific */}
                {selectedObject.type === 'text' && (
                  <InspectorSection title="文本">
                    <textarea
                      value={selectedObject.text || ''}
                      onChange={(e) => updateSelectedObject({ text: e.target.value })}
                      className="w-full px-2 py-1.5 rounded border border-[var(--border-input)] text-[12px] resize-none bg-[var(--bg-primary)]"
                      rows={3}
                    />
                    <div className="mt-2">
                      <NumberField
                        label="字号"
                        value={selectedObject.fontSize ?? 14}
                        onChange={v => updateSelectedObject({ fontSize: v })}
                        suffix="px"
                      />
                    </div>
                  </InspectorSection>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-light)]">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-[12px]">选择对象查看属性</p>
              </div>
            )}
          </div>

          {/* Layers Panel */}
          <div className="border-t border-[var(--border-default)]">
            <button
              onClick={() => setLayersExpanded(!layersExpanded)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold text-[var(--text-title)] hover:bg-black/[0.02]"
            >
              {layersExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <Layers className="w-3.5 h-3.5" />
              图层
              <span className="ml-auto text-[10px] text-[var(--text-muted)]">{objects.length}</span>
            </button>

            {layersExpanded && (
              <div className="max-h-[240px] overflow-auto pb-2">
                {[...objects].reverse().map((obj, reversedIndex) => {
                  const originalIndex = objects.length - 1 - reversedIndex
                  const isDragOver = dragOverId === obj.id && draggedId !== obj.id

                  return (
                    <div
                      key={obj.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, obj.id)}
                      onDragOver={(e) => handleDragOver(e, obj.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, obj.id)}
                      onClick={() => !obj.locked && handleObjectSelect(obj.id)}
                      onContextMenu={(e) => handleContextMenu(e, obj.id)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 text-[11px] cursor-pointer
                        transition-colors group select-none
                        ${obj.id === selectedId
                          ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]'
                          : 'text-[var(--text-body)] hover:bg-black/[0.03]'
                        }
                        ${isDragOver ? 'border-t-2 border-[var(--color-blue)]' : ''}
                        ${draggedId === obj.id ? 'opacity-50' : ''}
                      `}
                    >
                      {/* Drag Handle */}
                      <GripVertical className="w-3 h-3 opacity-30 cursor-grab active:cursor-grabbing" />

                      {/* Thumbnail */}
                      <LayerThumbnail obj={obj} />

                      {/* Visibility toggle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(obj.id) }}
                        className="opacity-40 hover:opacity-100 transition-opacity"
                      >
                        {obj.visible
                          ? <Eye className="w-3 h-3" />
                          : <EyeOff className="w-3 h-3 text-red-400" />
                        }
                      </button>

                      {/* Name */}
                      <span className={`flex-1 truncate ${!obj.visible ? 'line-through opacity-40' : ''}`}>
                        {obj.name}
                      </span>

                      {/* Lock toggle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLock(obj.id) }}
                        className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                      >
                        {obj.locked
                          ? <Lock className="w-3 h-3 text-amber-500" />
                          : <Unlock className="w-3 h-3" />
                        }
                      </button>

                      {/* Actions */}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-40">
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateObject(obj.id) }}
                          className="hover:!opacity-100 transition-opacity"
                          title="复制图层"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {!obj.locked && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteObject(obj.id) }}
                            className="hover:!opacity-100 hover:text-red-500 transition-all"
                            title="删除图层"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-[var(--bg-primary)] rounded-lg shadow-lg border border-[var(--border-default)] py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleContextMenuAction('duplicate')}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text-body)] hover:bg-black/[0.05] transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            复制图层
          </button>
          <button
            onClick={() => handleContextMenuAction('merge')}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text-body)] hover:bg-black/[0.05] transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            向下合并
          </button>
          <div className="h-px bg-[var(--border-default)] my-1" />
          <button
            onClick={() => handleContextMenuAction('delete')}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            删除图层
          </button>
        </div>
      )}
    </div>
  )
}

// --- Sub-components ---

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-medium text-[var(--text-light)] uppercase tracking-wide mb-2">
        {title}
      </h4>
      {children}
    </div>
  )
}

function NumberField({
  label, value, onChange, suffix
}: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string
}) {
  return (
    <div>
      <label className="text-[11px] text-[var(--text-muted)]">{label}</label>
      <div className="flex items-center">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-2 py-1 rounded border border-[var(--border-input)] text-[12px] bg-[var(--bg-primary)]"
        />
        {suffix && <span className="text-[10px] text-[var(--text-muted)] ml-1">{suffix}</span>}
      </div>
    </div>
  )
}

// Layer Thumbnail Component
function LayerThumbnail({ obj }: { obj: CanvasObject }) {
  const getThumbnailContent = () => {
    switch (obj.type) {
      case 'rect':
        return (
          <div
            className="w-full h-full rounded-sm"
            style={{
              backgroundColor: obj.fill || '#ccc',
              opacity: obj.visible ? (obj.fillOpacity ?? 1) : 0.3
            }}
          />
        )
      case 'text':
        return (
          <div
            className="w-full h-full flex items-center justify-center rounded-sm"
            style={{
              backgroundColor: obj.fill ? `${obj.fill}20` : '#f0f0f0',
              opacity: obj.visible ? 1 : 0.3
            }}
          >
            <TypeIcon
              className="w-3 h-3"
              style={{ color: obj.fill || '#333' }}
            />
          </div>
        )
      case 'image':
        return (
          <div
            className="w-full h-full flex items-center justify-center rounded-sm bg-gray-100"
            style={{ opacity: obj.visible ? 1 : 0.3 }}
          >
            <ImageIcon className="w-3 h-3 text-gray-500" />
          </div>
        )
      default:
        return (
          <div className="w-full h-full bg-gray-200 rounded-sm" />
        )
    }
  }

  return (
    <div
      className="w-6 h-6 rounded border border-[var(--border-default)] overflow-hidden flex-shrink-0"
      title={`${obj.type === 'rect' ? '矩形' : obj.type === 'text' ? '文本' : '图片'}图层`}
    >
      {getThumbnailContent()}
    </div>
  )
}
