import { useState, useCallback } from 'react'
import { 
  MousePointer, Type, Square, Image, Music, Subtitles, Mic, Sparkles,
  Trash2, Scissors, Copy, SkipBack, Play, SkipForward, Volume2, ZoomIn, Maximize
} from 'lucide-react'

interface TimelineClip {
  id: string
  start: number
  end: number
  label: string
  color: string
}

type ClipType = 'video' | 'subtitle'

interface SelectedClip {
  id: string
  type: ClipType
}

export default function VideoMode() {
  const [activeTool, setActiveTool] = useState('select')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(6)
  const [duration] = useState(117)
  const [zoom, setZoom] = useState(1)
  
  // 使用 useState 管理时间轴数据
  const [videoClips, setVideoClips] = useState<TimelineClip[]>([
    { id: '1', start: 0, end: 45, label: 'hook', color: '#5B8DEF' },
    { id: '2', start: 45, end: 62, label: 'cut', color: '#E97A2B' },
    { id: '3', start: 120, end: 195, label: 'climax', color: '#5B8DEF' }
  ])

  const [subtitleClips, setSubtitleClips] = useState<TimelineClip[]>([
    { id: 's1', start: 0, end: 15, label: '大家好', color: '#10B981' },
    { id: 's2', start: 15, end: 30, label: '思考...', color: '#E97A2B' },
    { id: 's3', start: 30, end: 45, label: '停更原因', color: '#E97A2B' }
  ])

  // 选中片段状态
  const [selectedClip, setSelectedClip] = useState<SelectedClip | null>(null)

  const tools = [
    { id: 'select', icon: MousePointer, label: '选择' },
    { id: 'text', icon: Type, label: '文字' },
    { id: 'shape', icon: Square, label: '形状' },
    { id: 'image', icon: Image, label: '图片' },
    { id: 'audio', icon: Music, label: '音乐' },
    { id: 'subtitle', icon: Subtitles, label: '字幕' },
    { id: 'voiceover', icon: Mic, label: '配音' }
  ]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 播放控制边界处理
  const handleSetCurrentTime = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)))
  }, [duration])

  // 跳转到开头
  const handleSkipToStart = useCallback(() => {
    handleSetCurrentTime(0)
  }, [handleSetCurrentTime])

  // 跳转到结尾
  const handleSkipToEnd = useCallback(() => {
    handleSetCurrentTime(duration)
  }, [duration, handleSetCurrentTime])

  // 选中片段
  const handleSelectClip = useCallback((id: string, type: ClipType) => {
    setSelectedClip({ id, type })
  }, [])

  // 获取选中的 clip 数据
  const getSelectedClipData = useCallback((): { clip: TimelineClip | undefined; type: ClipType; setter: React.Dispatch<React.SetStateAction<TimelineClip[]>> } => {
    if (!selectedClip) return { clip: undefined, type: 'video', setter: setVideoClips }
    
    if (selectedClip.type === 'video') {
      return { 
        clip: videoClips.find(c => c.id === selectedClip.id), 
        type: 'video',
        setter: setVideoClips 
      }
    } else {
      return { 
        clip: subtitleClips.find(c => c.id === selectedClip.id), 
        type: 'subtitle',
        setter: setSubtitleClips 
      }
    }
  }, [selectedClip, videoClips, subtitleClips])

  // 分割功能：在 currentTime 处将选中的 clip 分成两段
  const handleSplit = useCallback(() => {
    if (!selectedClip) return
    
    const { clip, type, setter } = getSelectedClipData()
    if (!clip) return

    // 检查 currentTime 是否在 clip 范围内（留出最小分割间隔）
    const minSplitInterval = 1 // 最小分割间隔 1 秒
    if (currentTime <= clip.start + minSplitInterval || currentTime >= clip.end - minSplitInterval) {
      console.warn('分割点必须在片段内部，且距离边界至少 1 秒')
      return
    }

    // 创建两个新的片段
    const leftClip: TimelineClip = {
      ...clip,
      id: `${clip.id}-split-left-${Date.now()}`,
      end: currentTime
    }
    
    const rightClip: TimelineClip = {
      ...clip,
      id: `${clip.id}-split-right-${Date.now()}`,
      start: currentTime
    }

    // 更新状态：移除原 clip，添加两个新 clip
    setter(prevClips => {
      const filtered = prevClips.filter(c => c.id !== clip.id)
      const newClips = [...filtered, leftClip, rightClip]
      // 按开始时间排序，确保时间轴顺序正确
      return newClips.sort((a, b) => a.start - b.start)
    })

    // 更新选中状态为左侧片段
    setSelectedClip({ id: leftClip.id, type })
  }, [selectedClip, currentTime, getSelectedClipData])

  // 复制功能：复制选中的 clip，生成新 ID
  const handleCopy = useCallback(() => {
    if (!selectedClip) return
    
    const { clip, type, setter } = getSelectedClipData()
    if (!clip) return

    // 计算新位置：在原 clip 后面，间隔 1 秒
    const clipDuration = clip.end - clip.start
    const newStart = clip.end + 1
    const newEnd = newStart + clipDuration

    const newClip: TimelineClip = {
      ...clip,
      id: `${clip.id}-copy-${Date.now()}`,
      start: newStart,
      end: newEnd
    }

    // 更新状态
    setter(prevClips => {
      const newClips = [...prevClips, newClip]
      // 按开始时间排序
      return newClips.sort((a, b) => a.start - b.start)
    })

    // 更新选中状态为新片段
    setSelectedClip({ id: newClip.id, type })
  }, [selectedClip, getSelectedClipData])

  // 删除功能：删除选中的 clip
  const handleDelete = useCallback(() => {
    if (!selectedClip) return
    
    const { clip, setter } = getSelectedClipData()
    if (!clip) return

    // 更新状态：移除选中的 clip
    setter(prevClips => prevClips.filter(c => c.id !== clip.id))
    
    // 清除选中状态
    setSelectedClip(null)
  }, [selectedClip, getSelectedClipData])

  // 判断是否有选中的片段
  const hasSelectedClip = selectedClip !== null

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div 
        className="h-[40px] flex items-center justify-between px-4 border-b border-[var(--border-default)]"
        style={{ background: 'var(--bg-toolbar)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-[var(--text-title)]">产品开箱视频.mp4</span>
          <span className="text-[11px] text-[var(--text-muted)]">{formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
            <span className="text-[12px]">↩</span>
          </button>
          <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
            <span className="text-[12px]">↪</span>
          </button>
          <button className="px-3 py-1 rounded-md border border-[var(--border-default)] text-[12px] hover:bg-black/5 transition-colors ml-2">
            分享
          </button>
          <button className="px-3 py-1 rounded-md bg-[var(--text-title)] text-white text-[12px] hover:brightness-95 transition-colors">
            导出
          </button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tools Panel */}
        <div 
          className="w-12 flex flex-col items-center py-3 gap-1 border-r border-[var(--border-default)]"
          style={{ background: 'var(--bg-panel)' }}
        >
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${activeTool === tool.id 
                  ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]' 
                  : 'text-[#6A6A6A] hover:bg-black/5'
                }
              `}
            >
              <tool.icon className="w-4 h-4" strokeWidth={2} />
            </button>
          ))}
          
          <div className="w-6 h-px bg-[var(--border-default)] my-1" />
          
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-blue)] hover:bg-[var(--color-blue-light)] transition-all">
            <Sparkles className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Preview Canvas */}
        <div 
          className="flex-1 flex flex-col"
          style={{ background: 'var(--bg-canvas)' }}
        >
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative bg-black rounded-lg overflow-hidden shadow-lg" style={{ width: 480, height: 270 }}>
              {/* Video Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">🎬</span>
              </div>
              
              {/* Subtitle Overlay */}
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <span className="px-4 py-1 bg-black/60 text-white text-[14px] rounded">
                  大家好，欢迎来到 Ready
                </span>
              </div>
              
              {/* Play Button Overlay */}
              {!isPlaying && (
                <button 
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/20"
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:scale-105 transition-transform">
                    <Play className="w-8 h-8 text-[var(--text-title)] ml-1" fill="currentColor" />
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Playback Controls */}
          <div 
            className="h-9 flex items-center justify-between px-4 border-t border-[var(--border-default)]"
            style={{ background: 'var(--bg-toolbar)' }}
          >
            <div className="flex items-center gap-1">
              <button 
                onClick={handleDelete}
                disabled={!hasSelectedClip}
                className={`p-1.5 rounded transition-colors ${hasSelectedClip ? 'hover:bg-black/5 text-[var(--text-title)]' : 'text-[var(--text-muted)] cursor-not-allowed'}`}
                title="删除"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
              </button>
              <button 
                onClick={handleSplit}
                disabled={!hasSelectedClip}
                className={`p-1.5 rounded transition-colors ${hasSelectedClip ? 'hover:bg-black/5 text-[var(--text-title)]' : 'text-[var(--text-muted)] cursor-not-allowed'}`}
                title="分割"
              >
                <Scissors className="w-4 h-4" strokeWidth={2} />
              </button>
              <button 
                onClick={handleCopy}
                disabled={!hasSelectedClip}
                className={`p-1.5 rounded transition-colors ${hasSelectedClip ? 'hover:bg-black/5 text-[var(--text-title)]' : 'text-[var(--text-muted)] cursor-not-allowed'}`}
                title="复制"
              >
                <Copy className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSkipToStart}
                className="p-1.5 rounded hover:bg-black/5 transition-colors"
                title="跳转到开头"
              >
                <SkipBack className="w-4 h-4" strokeWidth={2} />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-7 h-7 rounded-full bg-[var(--text-title)] text-white flex items-center justify-center hover:brightness-95 transition-all"
              >
                {isPlaying ? (
                  <span className="text-[10px]">⏸</span>
                ) : (
                  <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
                )}
              </button>
              <button 
                onClick={handleSkipToEnd}
                className="p-1.5 rounded hover:bg-black/5 transition-colors"
                title="跳转到结尾"
              >
                <SkipForward className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-mono text-[var(--text-muted)]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
                <Volume2 className="w-4 h-4" strokeWidth={2} />
              </button>
              <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
                <ZoomIn className="w-4 h-4" strokeWidth={2} />
              </button>
              <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
                <Maximize className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div 
          className="w-[240px] flex-shrink-0 border-l border-[var(--border-default)] overflow-auto"
          style={{ background: 'var(--bg-panel)' }}
        >
          <div className="p-4">
            <h3 className="text-[13px] font-semibold text-[var(--text-title)] mb-4">属性</h3>
            
            {/* Selected Clip Info */}
            {selectedClip && (
              <div className="mb-6 p-3 bg-[var(--bg-canvas)] rounded-lg">
                <h4 className="text-[10px] font-medium text-[var(--color-blue)] uppercase tracking-wide mb-2">
                  选中片段
                </h4>
                {(() => {
                  const { clip } = getSelectedClipData()
                  if (!clip) return null
                  return (
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">ID:</span>
                        <span className="text-[var(--text-title)]">{clip.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">标签:</span>
                        <span className="text-[var(--text-title)]">{clip.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">开始:</span>
                        <span className="text-[var(--text-title)]">{formatTime(clip.start)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">结束:</span>
                        <span className="text-[var(--text-title)]">{formatTime(clip.end)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">类型:</span>
                        <span className="text-[var(--text-title)]">{selectedClip.type === 'video' ? '视频' : '字幕'}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
            
            {/* Subtitle Style */}
            <div className="mb-6">
              <h4 className="text-[10px] font-medium text-[var(--text-light)] uppercase tracking-wide mb-3">
                字幕样式
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">字体</label>
                  <select className="w-full px-2 py-1.5 rounded border border-[var(--border-input)] text-[12px] bg-[var(--bg-primary)]">
                    <option>思源黑体</option>
                    <option>微软雅黑</option>
                    <option>PingFang SC</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">字重</label>
                  <select className="w-full px-2 py-1.5 rounded border border-[var(--border-input)] text-[12px] bg-[var(--bg-primary)]">
                    <option>Regular</option>
                    <option>Bold</option>
                    <option>Light</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">大小</label>
                  <input 
                    type="number" 
                    defaultValue={60}
                    className="w-full px-2 py-1.5 rounded border border-[var(--border-input)] text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--text-muted)] block mb-1">颜色</label>
                  <div className="flex items-center gap-2">
                    <input type="color" defaultValue="#FFFFFF" className="w-8 h-8 rounded border" />
                    <input type="text" defaultValue="#FFFFFF" className="flex-1 px-2 py-1.5 rounded border border-[var(--border-input)] text-[12px]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Color Config */}
            <div>
              <h4 className="text-[10px] font-medium text-[var(--text-light)] uppercase tracking-wide mb-3">
                颜色配置
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px]">激活色</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#50FF12]" />
                    <span className="text-[11px] text-[var(--text-muted)]">#50FF12</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px]">填充色</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#7E12FF]" />
                    <span className="text-[11px] text-[var(--text-muted)]">#7E12FF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div 
        className="h-[140px] border-t border-[var(--border-default)] flex flex-col"
        style={{ background: 'var(--bg-toolbar)' }}
      >
        {/* Time Ruler */}
        <div className="h-6 flex items-center px-4 border-b border-[var(--border-default)]">
          <div className="flex-1 relative">
            {[0, 2, 4, 6, 8, 10, 12, 14].map((s) => (
              <span 
                key={s} 
                className="absolute text-[10px] text-[var(--text-light)]"
                style={{ left: `${(s / 14) * 100}%` }}
              >
                {s}s
              </span>
            ))}
          </div>
        </div>

        {/* Tracks */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Video Track */}
          <div className="flex items-center px-4 py-1">
            <span className="w-8 text-[9px] text-[var(--text-muted)]">🎬 V1</span>
            <div className="flex-1 h-6 relative bg-[var(--bg-canvas)] rounded overflow-hidden">
              {videoClips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => handleSelectClip(clip.id, 'video')}
                  className={`
                    absolute h-full rounded flex items-center px-2 text-[10px] text-white cursor-pointer
                    transition-all duration-150
                    ${selectedClip?.id === clip.id && selectedClip?.type === 'video' 
                      ? 'ring-2 ring-white ring-offset-1 ring-offset-[var(--bg-canvas)] brightness-110' 
                      : 'hover:brightness-110'
                    }
                  `}
                  style={{
                    left: `${(clip.start / 200) * 100}%`,
                    width: `${((clip.end - clip.start) / 200) * 100}%`,
                    background: clip.color
                  }}
                >
                  {clip.label}
                </div>
              ))}
            </div>
          </div>

          {/* Subtitle Track */}
          <div className="flex items-center px-4 py-1">
            <span className="w-8 text-[9px] text-[var(--text-muted)]">T 字幕</span>
            <div className="flex-1 h-6 relative bg-[var(--bg-canvas)] rounded overflow-hidden">
              {subtitleClips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => handleSelectClip(clip.id, 'subtitle')}
                  className={`
                    absolute h-full rounded flex items-center px-2 text-[10px] text-white cursor-pointer
                    transition-all duration-150
                    ${selectedClip?.id === clip.id && selectedClip?.type === 'subtitle' 
                      ? 'ring-2 ring-white ring-offset-1 ring-offset-[var(--bg-canvas)] brightness-110' 
                      : 'hover:brightness-110'
                    }
                  `}
                  style={{
                    left: `${(clip.start / 200) * 100}%`,
                    width: `${((clip.end - clip.start) / 200) * 100}%`,
                    background: clip.color
                  }}
                >
                  {clip.label}
                </div>
              ))}
            </div>
          </div>

          {/* Audio Track */}
          <div className="flex items-center px-4 py-1">
            <span className="w-8 text-[9px] text-[var(--text-muted)]">♫ 音频</span>
            <div className="flex-1 h-6 relative bg-[var(--bg-canvas)] rounded overflow-hidden">
              <div 
                className="absolute inset-0 flex items-center justify-center text-[var(--color-purple)]"
                style={{ opacity: 0.3 }}
              >
                {'~'.repeat(50)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
