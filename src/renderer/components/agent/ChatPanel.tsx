import { useState, useRef, useEffect } from 'react'
import { History, Minus, AtSign, Hash, Paperclip, Send, ChevronDown } from 'lucide-react'
import { useAgent } from '../../stores/useAgent'

interface ChatPanelProps {
  width?: number
  title?: string
}

export default function ChatPanel({ width = 380, title = 'Ready AI 助手' }: ChatPanelProps) {
  const { 
    agents, 
    messages, 
    currentAgent, 
    inputValue, 
    isStreaming,
    selectAgent,
    setInputValue,
    sendMessage 
  } = useAgent()
  
  const [showAgentSelect, setShowAgentSelect] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentAgentData = agents.find(a => a.name === currentAgent)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return
    
    const content = inputValue
    setInputValue('')
    await sendMessage(content)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div 
      className="flex-shrink-0 flex flex-col border-l border-[var(--border-default)]"
      style={{ 
        width, 
        background: 'var(--bg-panel)',
        boxShadow: '-3px 0 12px rgba(0,0,0,0.06)'
      }}
    >
      {/* Header */}
      <div className="h-[38px] flex items-center justify-between px-3.5 border-b border-[var(--border-default)]">
        <span className="text-[13px] font-semibold text-[var(--text-title)]">{title}</span>
        <div className="flex items-center gap-1.5">
          <button className="p-1 rounded hover:bg-black/5 transition-colors">
            <History className="w-[14px] h-[14px] text-[var(--text-light)]" strokeWidth={2} />
          </button>
          <button className="p-1 rounded hover:bg-black/5 transition-colors">
            <Minus className="w-[14px] h-[14px] text-[var(--text-light)]" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3.5">
        {/* Welcome Card */}
        <div className="flex gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-canvas)' }}
          >
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--text-title)] mb-1">
              欢迎使用 Ready
            </h3>
            <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
              我是你的 AI 管家，可以帮你协调文案、剪辑、分析等 Agent 完成自媒体创作任务。
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button 
            onClick={() => setInputValue('帮我分析最近的热门视频趋势')}
            className="p-3 rounded-lg border border-[var(--border-default)] bg-white hover:border-[var(--color-blue)] hover:bg-[var(--color-blue-light)] transition-all text-left"
          >
            <div className="text-[12px] font-medium text-[var(--text-title)] mb-1">📊 内容优化</div>
            <div className="text-[11px] text-[var(--text-muted)]">分析热门数据...</div>
          </button>
          <button 
            onClick={() => setInputValue('帮我写一篇关于 AI 创作的文案')}
            className="p-3 rounded-lg border border-[var(--border-default)] bg-white hover:border-[var(--color-blue)] hover:bg-[var(--color-blue-light)] transition-all text-left"
          >
            <div className="text-[12px] font-medium text-[var(--text-title)] mb-1">📝 写文案</div>
            <div className="text-[11px] text-[var(--text-muted)]">写一篇...</div>
          </button>
        </div>

        {/* Message List */}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div 
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.type === 'user' 
                  ? 'bg-[var(--color-blue)] text-white' 
                  : 'bg-[var(--bg-canvas)]'
              }`}
            >
              {msg.type === 'user' ? (
                <span className="text-[12px] font-medium">我</span>
              ) : (
                <span>{agents.find(a => a.name === msg.agent)?.avatar || '🤖'}</span>
              )}
            </div>
            <div 
              className={`max-w-[80%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                msg.type === 'user'
                  ? 'bg-[var(--color-blue)] text-white'
                  : msg.type === 'system'
                  ? 'bg-red-50 text-red-600 border border-red-100'
                  : 'bg-white border border-[var(--border-default)]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {isStreaming && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-canvas)] flex items-center justify-center">
              <span>{currentAgentData?.avatar}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white border border-[var(--border-default)]">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-blue)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[var(--color-blue)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[var(--color-blue)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-[var(--border-default)]">
        {/* Agent Selector */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[11px] text-[var(--text-light)]">@</span>
          {agents.filter(a => a.selected).map(agent => (
            <button
              key={agent.name}
              onClick={() => selectAgent(agent.name)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-colors ${
                currentAgent === agent.name
                  ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]'
                  : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:bg-[var(--border-default)]'
              }`}
            >
              <span>{agent.avatar}</span>
              <span>{agent.displayName}</span>
              {currentAgent === agent.name && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-blue)]" />}
            </button>
          ))}
          <button
            onClick={() => setShowAgentSelect(!showAgentSelect)}
            className="p-0.5 rounded hover:bg-black/5 transition-colors"
          >
            <ChevronDown className="w-3 h-3 text-[var(--text-light)]" />
          </button>
        </div>

        {/* Input Box */}
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`给 ${currentAgentData?.displayName || 'Agent'} 发送指令...`}
            className="w-full px-3 py-2.5 pr-24 rounded-[10px] text-[13px] border border-[var(--border-input)] bg-white
              placeholder:text-[var(--text-placeholder)]
              focus:outline-none focus:border-[var(--color-blue)] focus:ring-1 focus:ring-[var(--color-blue)]"
          />
          
          {/* Input Actions */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
              <AtSign className="w-4 h-4 text-[var(--text-light)]" strokeWidth={2} />
            </button>
            <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
              <Hash className="w-4 h-4 text-[var(--text-light)]" strokeWidth={2} />
            </button>
            <button className="p-1.5 rounded hover:bg-black/5 transition-colors">
              <Paperclip className="w-4 h-4 text-[var(--text-light)]" strokeWidth={2} />
            </button>
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming}
              className="p-1.5 rounded bg-[var(--color-blue)] text-white hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Model Selector */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-green)]" />
            <span className="text-[11px] text-[var(--text-muted)]">Claude</span>
            <ChevronDown className="w-3 h-3 text-[var(--text-light)]" />
          </div>
          <span className="text-[11px] text-[var(--text-light)]">⌘ ↵ 发送</span>
        </div>
      </div>
    </div>
  )
}
