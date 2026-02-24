import { useState, useCallback } from 'react'
import {
  MousePointer, Move, Grid3X3, Square, Type, Brush,
  Sparkles, Layers, Eye, EyeOff, Lock, Unlock,
  Copy, Trash2, Download, ChevronDown, ChevronRight,
  Plus, Minus
} from 'lucide-react'

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
  const [activeTool, setActiveTool] = useState<ActiveTool>('select')
  const [objects, setObjects] = useState<CanvasObject[]>(initialObjects)
  const [selectedId, setSelectedId] = useState<string | null>('title-text')
  const [zoom, setZoom] = useState(1)
  const [layersExpanded, setLayersExpanded] = useState(true)

  const selectedObject = objects.find(o => o.id === selectedId) || null

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

        {/* ===== Tools Rail (44px) ===== */}
        <div
          className="w-11 flex flex-col items-center py-3 gap-1 border-r border-[var(--border-default)] flex-shrink-0"
          style={{ background: 'var(--bg-panel)' }}
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

        {/* ===== Canvas Area ===== */}
        <div
          className="flex-1 relative overflow-auto"
          style={{ background: 'var(--bg-canvas, #E8E8E8)' }}
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
              className="relative bg-white shadow-xl rounded-sm"
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

        {/* ===== Right Panel (260px) — Properties + Layers ===== */}
        <div
          className="w-[260px] flex-shrink-0 border-l border-[var(--border-default)] flex flex-col overflow-hidden"
          style={{ background: 'var(--bg-panel)' }}
        >
          {/* Properties Inspector */}
          <div className="flex-1 overflow-auto p-4">
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
                      className="flex-1 px-2 py-1 rounded border border-[var(--border-input)] text-[12px] bg-white"
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
                          className="flex-1 px-2 py-1 rounded border border-[var(--border-input)] text-[12px] bg-white"
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
                      className="w-full px-2 py-1.5 rounded border border-[var(--border-input)] text-[12px] resize-none bg-white"
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
              <div className="max-h-[200px] overflow-auto pb-2">
                {[...objects].reverse().map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => !obj.locked && handleObjectSelect(obj.id)}
                    className={`
                      flex items-center gap-2 px-4 py-1.5 text-[11px] cursor-pointer
                      transition-colors group
                      ${obj.id === selectedId
                        ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]'
                        : 'text-[var(--text-body)] hover:bg-black/[0.03]'
                      }
                    `}
                  >
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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
          className="w-full px-2 py-1 rounded border border-[var(--border-input)] text-[12px] bg-white"
        />
        {suffix && <span className="text-[10px] text-[var(--text-muted)] ml-1">{suffix}</span>}
      </div>
    </div>
  )
}
