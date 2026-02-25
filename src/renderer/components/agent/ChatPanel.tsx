import { useState, useRef, useEffect } from 'react'
import { History, Minus, AtSign, Plus, Send, ChevronDown, Maximize2 } from 'lucide-react'
import { useAgent } from '../../stores/useAgent'

interface ChatPanelProps {
  width?: number
  title?: string
}

export default function ChatPanel({ width = 380, title = 'New Task' }: ChatPanelProps) {
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
      className="flex-shrink-0 flex flex-col"
      style={{
        width,
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border-default)',
        boxShadow: '-3px 0 12px rgba(0,0,0,0.06)'
      }}
    >
      {/* Header — chatHead */}
      <div
        className="flex items-center justify-between"
        style={{ height: 38, padding: '0 14px', borderBottom: '1px solid var(--border-default)' }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-title)' }}>{title}</span>
        <div className="flex items-center" style={{ gap: 6 }}>
          <button className="p-1 rounded hover:bg-black/5 transition-colors">
            <History style={{ width: 14, height: 14 }} className="text-[#999999]" strokeWidth={2} />
          </button>
          <button className="p-1 rounded hover:bg-black/5 transition-colors">
            <Minus style={{ width: 14, height: 14 }} className="text-[#999999]" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ChatMessages */}
      <div
        className="flex-1 overflow-auto"
        style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {/* Welcome Card — m1 */}
        <div
          className="flex flex-col items-center"
          style={{ gap: 16, padding: '50px 16px' }}
        >
          {/* Avatar — R logo */}
          <div
            className="flex items-center justify-center"
            style={{
              width: 40, height: 40,
              borderRadius: 10,
              background: '#E8E8E8'
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A' }}>R</span>
          </div>

          {/* Title */}
          <span style={{ fontSize: 15, fontWeight: 600, color: '#333333' }}>Ready AI Assistant</span>

          {/* Description */}
          <span
            style={{
              fontSize: 13, fontWeight: 500, color: '#8A8A8A',
              textAlign: 'center', lineHeight: '1.5'
            }}
          >
            你的智能工作区助手。随时提问、创作内容、分析数据。
          </span>

          {/* Quick Action Cards — m1cards */}
          <div className="flex w-full" style={{ gap: 8 }}>
            <button
              onClick={() => setInputValue('帮我分析最近的热门视频趋势')}
              className="flex-1 text-left hover:border-[var(--color-blue)] transition-colors"
              style={{
                padding: 12, borderRadius: 8,
                border: '1px solid rgba(91,141,239,0.15)',
                display: 'flex', flexDirection: 'column', gap: 4
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-title)' }}>📊 内容优化</span>
              <span style={{ fontSize: 11, color: '#8A8A8A' }}>分析热门数据...</span>
            </button>
            <button
              onClick={() => setInputValue('帮我写一篇关于 AI 创作的文案')}
              className="flex-1 text-left hover:border-[var(--color-blue)] transition-colors"
              style={{
                padding: 12, borderRadius: 8,
                border: '1px solid rgba(91,141,239,0.15)',
                display: 'flex', flexDirection: 'column', gap: 4
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-title)' }}>📝 写作文案</span>
              <span style={{ fontSize: 11, color: '#8A8A8A' }}>创作优质内容...</span>
            </button>
          </div>
        </div>

        {/* Message List */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.type === 'user'
                ? 'bg-[var(--color-blue)] text-white'
                : 'bg-[#E8E8E8]'
                }`}
            >
              {msg.type === 'user' ? (
                <span className="text-[12px] font-medium">我</span>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>R</span>
              )}
            </div>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${msg.type === 'user'
                ? 'bg-[var(--color-blue)] text-white'
                : msg.type === 'system'
                  ? 'bg-red-50 text-red-600 border border-red-100'
                  : 'bg-[var(--bg-primary)] border border-[var(--border-default)]'
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isStreaming && (() => {
          const streamMsg = messages.find(m => m.id === (useAgent.getState().streamingMessageId))
          if (!streamMsg || streamMsg.content.length === 0) {
            return (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8E8E8] flex items-center justify-center">
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>R</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)]">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-blue)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[var(--color-blue)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[var(--color-blue)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )
          }
          return null
        })()}

        <div ref={messagesEndRef} />
      </div>

      {/* ChatInputArea — matches design R65YI */}
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border-default)',
          display: 'flex', flexDirection: 'column', gap: 8
        }}
      >
        {/* Input Box — inputBox */}
        <div
          className="flex items-center"
          style={{
            borderRadius: 10,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-input)',
            padding: '10px 14px'
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Agent Neo 现在可以为你完成什么？"
            className="flex-1 bg-transparent border-none outline-none"
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-body)' }}
          />
        </div>

        {/* Bottom Bar — inputBtm */}
        <div className="flex items-center justify-between">
          {/* Left: add + mode + model */}
          <div className="flex items-center" style={{ gap: 6 }}>
            <button
              className="flex items-center justify-center hover:bg-black/5 transition-colors"
              style={{ width: 24, height: 24, borderRadius: 8, border: '1px solid var(--border-input)' }}
            >
              <Plus style={{ width: 12, height: 12 }} className="text-[#6A6A6A]" strokeWidth={2} />
            </button>
            {/* Agent selector */}
            <button
              onClick={() => setShowAgentSelect(!showAgentSelect)}
              className="flex items-center hover:bg-black/5 transition-colors"
              style={{ padding: '3px 8px', borderRadius: 8, border: '1px solid var(--border-input)', gap: 4 }}
            >
              <span style={{ fontSize: 11, color: '#6A6A6A' }}>{currentAgentData?.avatar}</span>
              <span style={{ fontSize: 11, color: '#6A6A6A' }}>{currentAgentData?.displayName || '管家'}</span>
              <ChevronDown style={{ width: 10, height: 10 }} className="text-[#999999]" />
            </button>
            {/* Model selector */}
            <button
              className="flex items-center hover:bg-black/5 transition-colors"
              style={{ padding: '3px 8px', borderRadius: 8, border: '1px solid var(--border-input)', gap: 4 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)]" />
              <span style={{ fontSize: 11, color: '#6A6A6A' }}>Claude</span>
              <ChevronDown style={{ width: 10, height: 10 }} className="text-[#999999]" />
            </button>
          </div>

          {/* Right: @ + expand + send */}
          <div className="flex items-center" style={{ gap: 6 }}>
            <button className="p-1 rounded hover:bg-black/5 transition-colors">
              <AtSign style={{ width: 15, height: 15 }} className="text-[#6A6A6A]" strokeWidth={2} />
            </button>
            <button className="p-1 rounded hover:bg-black/5 transition-colors">
              <Maximize2 style={{ width: 14, height: 14 }} className="text-[#6A6A6A]" strokeWidth={2} />
            </button>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming}
              className="flex items-center justify-center text-white hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{
                width: 26, height: 26,
                borderRadius: 13,
                background: 'var(--color-blue)'
              }}
            >
              <Send style={{ width: 13, height: 13 }} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
