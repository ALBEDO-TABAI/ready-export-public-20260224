import { useState } from 'react'
import { Users, Settings, Plus, Send } from 'lucide-react'
import { useMode } from '../stores/useMode'
import { useAgent } from '../stores/useAgent'
import ModeSlider from '../components/layout/ModeSlider'
import BrowserMode from './modes/BrowserMode'
import DocumentMode from './modes/DocumentMode'
import ImageMode from './modes/ImageMode'
import VideoMode from './modes/VideoMode'

interface Task {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed'
}

export default function ReadyMode() {
  const { readySubMode, setReadySubMode } = useMode()
  const { agents, messages, inputValue, isStreaming, setInputValue, toggleAgentSelection, sendMessage } = useAgent()
  const [tasks] = useState<Task[]>([
    { id: '1', title: '分析视频素材', status: 'completed' },
    { id: '2', title: '生成文案草稿', status: 'running' },
    { id: '3', title: '剪辑视频片段', status: 'pending' }
  ])

  const subModes = [
    { id: 'browser', label: '浏览器', icon: '🌐' },
    { id: 'document', label: '文档', icon: '📄' },
    { id: 'image', label: '图像', icon: '🖼️' },
    { id: 'video', label: '剪辑', icon: '✂️' }
  ]

  const renderSubMode = () => {
    switch (readySubMode) {
      case 'browser':
        return <BrowserMode />
      case 'document':
        return <DocumentMode />
      case 'image':
        return <ImageMode />
      case 'video':
        return <VideoMode />
      default:
        return <BrowserMode />
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return
    await sendMessage(inputValue)
    setInputValue('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div 
        className="h-[40px] flex items-center justify-between px-4 border-b border-[var(--border-default)]"
        style={{ background: 'var(--bg-panel)' }}
      >
        <div className="flex items-center gap-4">
          <ModeSlider />
          
          {/* Sub Mode Tabs */}
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded-lg bg-[var(--color-green-light)] text-[var(--color-green)] text-[12px]">
              实时跟随
            </button>
            {subModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setReadySubMode(mode.id as typeof readySubMode)}
                className={`
                  flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] transition-all
                  ${readySubMode === mode.id 
                    ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]' 
                    : 'hover:bg-black/5 text-[var(--text-muted)]'
                  }
                `}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
            <Users className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={2} />
          </button>
          <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
            <Settings className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Four Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task Panel */}
        <div 
          className="w-[200px] flex-shrink-0 border-r border-[var(--border-default)] flex flex-col"
          style={{ background: 'var(--bg-panel)' }}
        >
          {/* New Task Button */}
          <div className="p-3 border-b border-[var(--border-default)]">
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-blue)] text-white text-[12px] hover:brightness-95 transition-all">
              <Plus className="w-4 h-4" />
              新任务
            </button>
          </div>

          {/* Agent Selector */}
          <div className="p-3 border-b border-[var(--border-default)]">
            <h3 className="text-[11px] font-medium text-[var(--text-light)] uppercase tracking-wide mb-2">
              选择 Agent
            </h3>
            <div className="space-y-1">
              {agents.map(agent => (
                <label 
                  key={agent.name}
                  className="flex items-center gap-2 cursor-pointer hover:bg-black/5 p-1.5 rounded transition-colors"
                >
                  <input 
                    type="checkbox"
                    checked={agent.selected}
                    onChange={() => toggleAgentSelection(agent.name)}
                    className="w-4 h-4 rounded border-[var(--border-input)]"
                  />
                  <span className="text-base">{agent.avatar}</span>
                  <span className="text-[12px] text-[var(--text-body)]">{agent.displayName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-auto p-3">
            <h3 className="text-[11px] font-medium text-[var(--text-light)] uppercase tracking-wide mb-2">
              任务列表
            </h3>
            <div className="space-y-2">
              {tasks.map(task => (
                <div 
                  key={task.id}
                  className="p-2 rounded-lg bg-white border border-[var(--border-default)] text-[12px]"
                >
                  <div className="flex items-center gap-2">
                    <span className={`
                      w-2 h-2 rounded-full
                      ${task.status === 'completed' ? 'bg-[var(--color-green)]' : ''}
                      ${task.status === 'running' ? 'bg-[var(--color-blue)] animate-pulse' : ''}
                      ${task.status === 'pending' ? 'bg-[var(--text-light)]' : ''}
                    `} />
                    <span className={task.status === 'completed' ? 'line-through text-[var(--text-muted)]' : ''}>
                      {task.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Input */}
          <div className="p-3 border-t border-[var(--border-default)]">
            <div className="flex items-center gap-1 flex-wrap mb-2">
              <span className="text-[11px] text-[var(--text-light)]">@</span>
              {agents.filter(a => a.selected).map(agent => (
                <span 
                  key={agent.name}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--color-blue-light)] text-[var(--color-blue)] text-[10px]"
                >
                  {agent.avatar} {agent.displayName}
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="给 Agent 们发送指令..."
                className="w-full px-3 py-2 pr-10 rounded-lg text-[12px] border border-[var(--border-input)] bg-white
                  placeholder:text-[var(--text-placeholder)]
                  focus:outline-none focus:border-[var(--color-blue)]"
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded bg-[var(--color-blue)] text-white disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Meeting Chat */}
        <div 
          className="w-[420px] flex-shrink-0 border-r border-[var(--border-default)] flex flex-col"
          style={{ background: 'var(--bg-panel)' }}
        >
          <div className="h-[38px] flex items-center px-3 border-b border-[var(--border-default)]">
            <span className="text-[13px] font-semibold">会议聊天</span>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            <div className="text-center">
              <span className="text-[11px] text-[var(--text-light)]">欢迎！这是你的第一次集体会议...</span>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-canvas)] flex items-center justify-center flex-shrink-0 text-sm">
                  {agents.find(a => a.name === msg.agent)?.avatar || '🤖'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-medium">
                      {agents.find(a => a.name === msg.agent)?.displayName || msg.agent}
                    </span>
                    <span className="text-[10px] text-[var(--text-light)]">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[12px] text-[var(--text-body)] bg-white rounded-lg px-3 py-2 border border-[var(--border-default)]">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Follow Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {renderSubMode()}
        </div>

        {/* File Panel */}
        <div 
          className="w-[180px] flex-shrink-0 border-l border-[var(--border-default)] flex flex-col"
          style={{ background: 'var(--bg-panel)' }}
        >
          <div className="p-3 border-b border-[var(--border-default)]">
            <input
              type="text"
              placeholder="搜索文件..."
              className="w-full px-2 py-1.5 rounded-lg text-[11px] border border-[var(--border-input)] bg-white
                placeholder:text-[var(--text-placeholder)]
                focus:outline-none focus:border-[var(--color-blue)]"
            />
          </div>

          <div className="flex-1 overflow-auto p-3">
            <div className="space-y-1">
              {[
                { name: '视频素材', icon: '🎬' },
                { name: '文案输出', icon: '📝' },
                { name: 'RSS数据', icon: '📰' },
                { name: '设计系统', icon: '🎨' }
              ].map((folder) => (
                <button
                  key={folder.name}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] hover:bg-black/5 transition-colors text-left"
                >
                  <span>{folder.icon}</span>
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
