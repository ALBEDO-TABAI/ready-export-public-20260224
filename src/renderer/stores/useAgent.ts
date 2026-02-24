import { create } from 'zustand'

export interface AgentMessage {
  id: string
  agent: string
  content: string
  type: 'user' | 'agent' | 'system'
  timestamp: Date
}

export interface Agent {
  name: string
  displayName: string
  avatar: string
  status: 'idle' | 'working' | 'done' | 'error'
  selected: boolean
}

interface AgentState {
  agents: Agent[]
  messages: AgentMessage[]
  currentAgent: string
  inputValue: string
  isStreaming: boolean
  streamingMessageId: string | null
  setAgents: (agents: Agent[]) => void
  selectAgent: (name: string) => void
  toggleAgentSelection: (name: string) => void
  addMessage: (message: AgentMessage) => void
  appendToMessage: (id: string, chunk: string) => void
  setInputValue: (value: string) => void
  setIsStreaming: (streaming: boolean) => void
  sendMessage: (content: string) => Promise<void>
}

export const useAgent = create<AgentState>((set, get) => ({
  agents: [
    { name: 'butler', displayName: '管家', avatar: '🤖', status: 'idle', selected: true },
    { name: 'copywriter', displayName: '文案', avatar: '✍️', status: 'idle', selected: false },
    { name: 'video-editor', displayName: '剪辑', avatar: '🎬', status: 'idle', selected: false },
    { name: 'analyst', displayName: '分析', avatar: '📊', status: 'idle', selected: false }
  ],
  messages: [
    {
      id: 'welcome',
      agent: 'butler',
      content: '你好！我是 Ready 的管家 Agent。我可以帮你协调文案、剪辑、分析等 Agent 完成自媒体创作任务。今天想做什么？',
      type: 'agent',
      timestamp: new Date()
    }
  ],
  currentAgent: 'butler',
  inputValue: '',
  isStreaming: false,
  streamingMessageId: null,

  setAgents: (agents) => set({ agents }),

  selectAgent: (name) => set({ currentAgent: name }),

  toggleAgentSelection: (name) => set((state) => ({
    agents: state.agents.map(a =>
      a.name === name ? { ...a, selected: !a.selected } : a
    )
  })),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  appendToMessage: (id, chunk) => set((state) => ({
    messages: state.messages.map(m =>
      m.id === id ? { ...m, content: m.content + chunk } : m
    )
  })),

  setInputValue: (value) => set({ inputValue: value }),

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  sendMessage: async (content: string) => {
    const { currentAgent, addMessage, setIsStreaming } = get()

    // Add user message
    addMessage({
      id: `msg-${Date.now()}`,
      agent: currentAgent,
      content,
      type: 'user',
      timestamp: new Date()
    })

    setIsStreaming(true)

    // Create a placeholder for the agent response
    const responseId = `response-${Date.now()}`
    addMessage({
      id: responseId,
      agent: currentAgent,
      content: '',
      type: 'agent',
      timestamp: new Date()
    })
    set({ streamingMessageId: responseId })

    try {
      // Check if electronAPI is available (real Electron env)
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.agent.send(currentAgent, content)

        if (!result.success) {
          // Update the placeholder message with error
          set((state) => ({
            messages: state.messages.map(m =>
              m.id === responseId
                ? { ...m, content: `⚠️ ${result.error || '发送失败'}`, type: 'system' as const }
                : m
            ),
            isStreaming: false,
            streamingMessageId: null
          }))
        }
        // If success, stream data will arrive via onStream listener
      } else {
        // Mock response for browser-only development
        const mockResponses = [
          `收到你的消息: "${content}"\n\n我正在处理中...这是模拟回复，在 Electron 环境中会连接到 Kimi API。`,
          `好的，我来帮你处理: "${content}"\n\n当前运行在浏览器预览模式，Agent 功能需要在 Electron 中使用。`,
          `了解！"${content}" 这个需求我可以帮你完成。\n\n提示：启动 Electron 应用并配置 ANTHROPIC_API_KEY 即可使用真实 AI 能力。`
        ]
        const mockReply = mockResponses[Math.floor(Math.random() * mockResponses.length)]

        // Simulate streaming: type out character by character
        let i = 0
        const typeInterval = setInterval(() => {
          if (i < mockReply.length) {
            const chunk = mockReply.slice(i, i + Math.floor(Math.random() * 3) + 1)
            get().appendToMessage(responseId, chunk)
            i += chunk.length
          } else {
            clearInterval(typeInterval)
            set({ isStreaming: false, streamingMessageId: null })
          }
        }, 30)
      }
    } catch (error) {
      set((state) => ({
        messages: state.messages.map(m =>
          m.id === responseId
            ? { ...m, content: `❌ 错误: ${error instanceof Error ? error.message : String(error)}`, type: 'system' as const }
            : m
        ),
        isStreaming: false,
        streamingMessageId: null
      }))
    }
  }
}))

// Setup listeners for real Electron agent communication
if (typeof window !== 'undefined' && window.electronAPI) {
  // Stream data: accumulate chunks into the current streaming message
  window.electronAPI.agent.onStream((data) => {
    const { streamingMessageId, appendToMessage, setIsStreaming } = useAgent.getState()

    if (data.type === 'result' || data.type === 'done') {
      // Stream completed
      setIsStreaming(false)
      useAgent.setState({ streamingMessageId: null })
      return
    }

    if (streamingMessageId && data.chunk) {
      appendToMessage(streamingMessageId, data.chunk)
    }
  })

  // Status changes
  window.electronAPI.agent.onStatusChange((data) => {
    const { agents, setAgents } = useAgent.getState()
    setAgents(
      agents.map(a =>
        a.name === data.agent ? { ...a, status: data.status as Agent['status'] } : a
      )
    )
  })

  // Error events
  window.electronAPI.agent.onError((data) => {
    const { addMessage, setIsStreaming } = useAgent.getState()
    addMessage({
      id: `error-${Date.now()}`,
      agent: data.agent,
      content: `⚠️ Agent 错误: ${data.error}`,
      type: 'system',
      timestamp: new Date()
    })
    setIsStreaming(false)
    useAgent.setState({ streamingMessageId: null })
  })
}
