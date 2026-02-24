import { useState } from 'react'
import { MousePointer, Move, Grid3X3, Square, Type, Brush, Sparkles, Layers, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

interface CanvasObject {
  id: string
  type: 'rect' | 'text' | 'image'
  x: number
  y: number
  width: number
  height: number
  fill?: string
  text?: string
  selected?: boolean
}

export default function ImageMode() {
  const [activeTool, setActiveTool] = useState('select')
  const [objects, setObjects] = useState<CanvasObject[]>([
    { id: '1', type: 'rect', x: 100, y: 100, width: 200, height: 150, fill: '#5B8DEF', selected: false },
    { id: '2', type: 'text', x: 150, y: 200, width: 100, height: 30, text: 'Hello Ready', selected: true }
  ])
  const [selectedObject, setSelectedObject] = useState<CanvasObject | null>(objects[1])
  const [zoom, setZoom] = useState(1)

  const tools = [
    { id: 'select', icon: MousePointer, label: '选择' },
    { id: 'pan', icon: Move, label: '平移' },
    { id: 'grid', icon: Grid3X3, label: '网格' },
    { id: 'shape', icon: Square, label: '形状' },
    { id: 'text', icon: Type, label: '文字' },
    { id: 'brush', icon: Brush, label: '画笔' }
  ]

  const handleObjectSelect = (obj: CanvasObject) => {
    setObjects(objects.map(o => ({ ...o, selected: o.id === obj.id })))
    setSelectedObject(obj)
  }

  const updateSelectedObject = (updates: Partial<CanvasObject>) => {
    if (!selectedObject) return
    setObjects(objects.map(o => 
      o.id === selectedObject.id ? { ...o, ...updates } : o
    ))
    setSelectedObject({ ...selectedObject, ...updates })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tools Rail */}
        <div 
          className="w-11 flex flex-col items-center py-3 gap-1 border-r border-[var(--border-default)]"
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
          
          <button
            onClick={() => {}}
            title="AI 工具"
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[var(--color-blue)] hover:bg-[var(--color-blue-light)] transition-all"
          >
            <Sparkles className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
        </div>

        {/* Canvas */}
        <div 
          className="flex-1 relative overflow-auto"
          style={{ background: 'var(--bg-canvas)' }}
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
              className="relative bg-white shadow-lg"
              style={{ width: 800, height: 600 }}
            >
              {objects.map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => handleObjectSelect(obj)}
                  className={`absolute cursor-pointer transition-all ${
                    obj.selected ? 'ring-2 ring-[var(--color-blue)]' : ''
                  }`}
                  style={{
                    left: obj.x,
                    top: obj.y,
                    width: obj.width,
                    height: obj.height,
                    background: obj.fill,
                  }}
                >
                  {obj.type === 'text' && (
                    <span className="text-[var(--text-body)]">{obj.text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white rounded-lg shadow border border-[var(--border-default)] px-2 py-1">
            <button 
              onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
              className="p-1 hover:bg-black/5 rounded"
            >
              -
            </button>
            <span className="text-[12px] w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(Math.min(4, zoom + 0.25))}
              className="p-1 hover:bg-black/5 rounded"
            >
              +
            </button>
          </div>
        </div>

        {/* Properties Panel */}
        <div 
          className="w-[260px] flex-shrink-0 border-l border-[var(--border-default)] overflow-auto"
          style={{ background: 'var(--bg-panel)' }}
        >
          <div className="p-4">
            <h3 className="text-[13px] font-semibold text-[var(--text-title)] mb-4">属性</h3>
            
            {selectedObject ? (
              <div className="space-y-4">
                {/* Geometry */}
                <div>
                  <h4 className="text-[10px] font-medium text-[var(--text-light)] uppercase tracking-wide mb-2">
                    几何
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-[var(--text-muted)]">X</label>
                      <input
                        type="number"
                        value={selectedObject.x}
                        onChange={(e) => updateSelectedObject({ x: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded border border-[var(--border-input)] text-[12px]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[var(--text-muted)]">Y</label>
                      <input
                        type="number"
                        value={selectedObject.y}
                        onChange={(e) => updateSelectedObject({ y: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded border border-[var(--border-input)] text-[12px]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[var(--text-muted)]">W</label>
                      <input
                        type="number"
                        value={selectedObject.width}
                        onChange={(e) => updateSelectedObject({ width: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded border border-[var(--border-input)] text-[12px]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[var(--text-muted)]">H</label>
                      <input
                        type="number"
                        value={selectedObject.height}
                        onChange={(e) => updateSelectedObject({ height: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded border border-[var(--border-input)] text-[12px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Fill */}
                <div>
                  <h4 className="text-[10px] font-medium text-[var(--text-light)] uppercase tracking-wide mb-2">
                    填充
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedObject.fill || '#ffffff'}
                      onChange={(e) => updateSelectedObject({ fill: e.target.value })}
                      className="w-8 h-8 rounded border border-[var(--border-input)]"
                    />
                    <input
                      type="text"
                      value={selectedObject.fill || '#ffffff'}
                      onChange={(e) => updateSelectedObject({ fill: e.target.value })}
                      className="flex-1 px-2 py-1 rounded border border-[var(--border-input)] text-[12px]"
                    />
                  </div>
                </div>

                {/* Text */}
                {selectedObject.type === 'text' && (
                  <div>
                    <h4 className="text-[10px] font-medium text-[var(--text-light)] uppercase tracking-wide mb-2">
                      文本
                    </h4>
                    <textarea
                      value={selectedObject.text || ''}
                      onChange={(e) => updateSelectedObject({ text: e.target.value })}
                      className="w-full px-2 py-1 rounded border border-[var(--border-input)] text-[12px] resize-none"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-light)]">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-[12px]">选择对象查看属性</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
