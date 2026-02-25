import { useState } from 'react'
import {
  Users, Settings, Plus, Send, Globe, FileText, Image,
  Scissors, Rss, Calendar, Search, ChevronDown, Folder
} from 'lucide-react'
import { useMode } from '../stores/useMode'
import { useAgent } from '../stores/useAgent'
import ModeSlider from '../components/layout/ModeSlider'
import BrowserMode from './modes/BrowserMode'
import DocumentMode from './modes/DocumentMode'
import ImageMode from './modes/ImageMode'
import VideoMode from './modes/VideoMode'
import RSSMode from './modes/RSSMode'
import CalendarMode from './modes/CalendarMode'

interface Task {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed'
}

const subModes: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'browser', label: '浏览器', icon: Globe },
  { id: 'document', label: '文档', icon: FileText },
  { id: 'image', label: '图像', icon: Image },
  { id: 'video', label: '剪辑', icon: Scissors },
  { id: 'rss', label: 'RSS', icon: Rss },
  { id: 'calendar', label: '日程', icon: Calendar }
]

export default function ReadyMode() {
  const { readySubMode, setReadySubMode } = useMode()
  const { agents, messages, inputValue, isStreaming, setInputValue, toggleAgentSelection, sendMessage } = useAgent()
  const [tasks] = useState<Task[]>([
    { id: '1', title: '分析视频素材', status: 'completed' },
    { id: '2', title: '生成文案草稿', status: 'running' },
    { id: '3', title: '剪辑视频片段', status: 'pending' }
  ])

  const renderSubMode = () => {
    switch (readySubMode) {
      case 'browser': return <BrowserMode />
      case 'document': return <DocumentMode />
      case 'image': return <ImageMode />
      case 'video': return <VideoMode />
      case 'rss': return <RSSMode />
      case 'calendar': return <CalendarMode />
      default: return <BrowserMode />
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return
    await sendMessage(inputValue)
    setInputValue('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* UnifiedTopBar — matches design HXeCj */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 40,
          padding: '0 16px 0 72px',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-default)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}
      >
        {/* Left: ModeSlider */}
        <div className="flex items-center" style={{ gap: 12 }}>
          <ModeSlider />
        </div>

        {/* Center: Sub mode tabs */}
        <div className="flex items-center" style={{ gap: 8 }}>
          <button
            className="flex items-center"
            style={{
              padding: '4px 10px',
              borderRadius: 10,
              background: 'rgba(52,211,153,0.09)',
              fontSize: 11, fontWeight: 500, color: 'var(--color-green)'
            }}
          >
            实时跟随
          </button>
          {subModes.map((mode) => {
            const Icon = mode.icon
            const isActive = readySubMode === mode.id
            return (
              <button
                key={mode.id}
                onClick={() => setReadySubMode(mode.id as typeof readySubMode)}
                className="flex items-center transition-all duration-200"
                style={{
                  padding: '4px 8px',
                  borderRadius: 10,
                  gap: 4,
                  background: isActive ? 'rgba(91,141,239,0.09)' : 'transparent',
                  color: isActive ? '#5B8DEF' : '#8A8A8A',
                  fontSize: 11, fontWeight: 500
                }}
              >
                <Icon style={{ width: 12, height: 12 }} strokeWidth={2} />
                <span>{mode.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right: users + settings */}
        <div className="flex items-center" style={{ gap: 8 }}>
          <button className="p-1 rounded hover:bg-black/5 transition-colors">
            <Users style={{ width: 15, height: 15 }} className="text-[#999999]" strokeWidth={2} />
          </button>
          <button className="p-1 rounded hover:bg-black/5 transition-colors">
            <Settings style={{ width: 15, height: 15 }} className="text-[#999999]" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ContentBody — matches design Z58Gf */}
      <div className="flex-1 flex overflow-hidden">
        {/* TaskPanel — matches design vkdOx */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{
            width: 200,
            background: 'var(--bg-panel)',
            borderRight: '1px solid var(--border-default)'
          }}
        >
          {/* Task Header */}
          <div
            className="flex items-center justify-between"
            style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-default)' }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-title)' }}>任务</span>
            <button
              className="flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
              style={{ width: 24, height: 24 }}
            >
              <Plus style={{ width: 14, height: 14 }} className="text-[var(--text-light)]" strokeWidth={2} />
            </button>
          </div>

          {/* Task Count */}
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-default)' }}>
            <span style={{ fontSize: 11, color: '#8A8A8A' }}>{tasks.length} 个任务</span>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-auto" style={{ padding: 8 }}>
            <div className="flex flex-col" style={{ gap: 6 }}>
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center rounded-lg transition-colors hover:bg-black/5"
                  style={{ padding: '8px 10px', gap: 8 }}
                >
                  <span className={`
                    w-2 h-2 rounded-full flex-shrink-0
                    ${task.status === 'completed' ? 'bg-[var(--color-green)]' : ''}
                    ${task.status === 'running' ? 'bg-[var(--color-blue)] animate-pulse' : ''}
                    ${task.status === 'pending' ? 'bg-[var(--text-light)]' : ''}
                  `} />
                  <span
                    className={task.status === 'completed' ? 'line-through' : ''}
                    style={{
                      fontSize: 12,
                      color: task.status === 'completed' ? '#8A8A8A' : 'var(--text-body)'
                    }}
                  >
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MeetingChat — matches design bLNSY */}
        <div
          className="flex-shrink-0 flex flex-col justify-between"
          style={{
            width: 420,
            background: 'var(--bg-content)',
            borderRight: '1px solid var(--border-default)'
          }}
        >
          {/* Chat Messages */}
          <div
            className="flex-1 overflow-auto"
            style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* Welcome */}
            <div className="text-center" style={{ padding: '40px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-title)', marginBottom: 8 }}>
                FlowAI — Agent 正在互动
              </div>
              <div style={{ fontSize: 12, color: '#8A8A8A', lineHeight: '1.6' }}>
                你的多位 Agent 正在准备各自的运营方案。
                <br />
                你可以在此查看他们的实时讨论进度。
              </div>
            </div>

            {/* Message List */}
            {messages.map((msg) => (
              <div key={msg.id} className="flex" style={{ gap: 8 }}>
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 28, height: 28,
                    borderRadius: 8,
                    background: '#E8E8E8'
                  }}
                >
                  <span style={{ fontSize: 12 }}>
                    {agents.find(a => a.name === msg.agent)?.avatar || '🤖'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center" style={{ gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-title)' }}>
                      {agents.find(a => a.name === msg.agent)?.displayName || msg.agent}
                    </span>
                    <span style={{ fontSize: 10, color: '#999999' }}>
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12, color: 'var(--text-body)', lineHeight: '1.5',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 8, padding: '8px 12px'
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid var(--border-default)',
              display: 'flex', flexDirection: 'column', gap: 6
            }}
          >
            {/* Agent tags */}
            <div className="flex items-center flex-wrap" style={{ gap: 4 }}>
              <span style={{ fontSize: 11, color: '#8A8A8A' }}>@</span>
              {agents.filter(a => a.selected).map(agent => (
                <span
                  key={agent.name}
                  className="flex items-center"
                  style={{
                    padding: '2px 6px',
                    borderRadius: 10,
                    fontSize: 10,
                    background: 'var(--color-blue-light)',
                    color: 'var(--color-blue)',
                    gap: 2
                  }}
                >
                  {agent.avatar} {agent.displayName}
                </span>
              ))}
            </div>
            {/* Input */}
            <div className="flex items-center" style={{ gap: 8 }}>
              <div
                className="flex-1 flex items-center"
                style={{
                  borderRadius: 10,
                  border: '1px solid var(--border-input)',
                  padding: '8px 12px',
                  background: 'var(--bg-primary)'
                }}
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="给 Agent 们发送指令..."
                  className="flex-1 bg-transparent border-none outline-none"
                  style={{ fontSize: 12, color: 'var(--text-body)' }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
                className="flex items-center justify-center text-white hover:brightness-95 disabled:opacity-40 transition-all"
                style={{ width: 26, height: 26, borderRadius: 13, background: 'var(--color-blue)' }}
              >
                <Send style={{ width: 12, height: 12 }} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* LiveFollowPanel — matches design qCIIl */}
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{ background: 'var(--bg-content)' }}
        >
          {renderSubMode()}
        </div>

        {/* FilePanel — matches design GZBjq */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{
            width: 180,
            background: 'var(--bg-panel)',
            borderLeft: '1px solid var(--border-default)',
            padding: '12px 10px',
            gap: 8
          }}
        >
          {/* Title */}
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-title)' }}>文件管理</span>
            <Plus style={{ width: 12, height: 12 }} className="text-[#999999]" strokeWidth={2} />
          </div>

          {/* Search */}
          <div
            className="flex items-center"
            style={{
              height: 28, borderRadius: 10,
              background: '#EEEEEE',
              padding: '0 8px', gap: 4
            }}
          >
            <Search style={{ width: 11, height: 11 }} className="text-[#999999]" strokeWidth={2} />
            <input
              type="text"
              placeholder="搜索..."
              className="flex-1 bg-transparent border-none outline-none"
              style={{ fontSize: 11, color: 'var(--text-body)' }}
            />
          </div>

          {/* File List */}
          <div className="flex-1 overflow-auto flex flex-col" style={{ gap: 6 }}>
            {[
              { name: '视频素材', icon: Folder },
              { name: '文案输出', icon: Folder },
              { name: '需求文档.md', icon: FileText },
              { name: 'RSS数据', icon: Folder },
              { name: '封面设计.png', icon: Image },
              { name: '日程安排.md', icon: FileText }
            ].map((file) => {
              const Icon = file.icon
              return (
                <button
                  key={file.name}
                  className="flex items-center w-full rounded-lg hover:bg-black/5 transition-colors text-left"
                  style={{ padding: '6px 8px', gap: 6 }}
                >
                  <Icon style={{ width: 14, height: 14, flexShrink: 0 }} className="text-[var(--text-muted)]" strokeWidth={2} />
                  <span className="truncate" style={{ fontSize: 11, color: 'var(--text-body)' }}>{file.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
