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
  setAgents: (agents: Agent[]) => void
  selectAgent: (name: string) => void
  toggleAgentSelection: (name: string) => void
  addMessage: (message: AgentMessage) => void
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

    try {
      // Check if electronAPI is available
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.agent.send(currentAgent, content)
        
        if (!result.success) {
          addMessage({
            id: `msg-${Date.now()}`,
            agent: currentAgent,
            content: `Error: ${result.error || 'Failed to send message'}`,
            type: 'system',
            timestamp: new Date()
          })
        }
      } else {
        // Mock response for development
        setTimeout(() => {
          addMessage({
            id: `msg-${Date.now()}`,
            agent: currentAgent,
            content: `[Mock] 收到消息: "${content}"\n\n这是一个模拟回复，用于在没有 Electron 环境时测试 UI。`,
            type: 'agent',
            timestamp: new Date()
          })
          setIsStreaming(false)
        }, 1000)
      }
    } catch (error) {
      addMessage({
        id: `msg-${Date.now()}`,
        agent: currentAgent,
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        type: 'system',
        timestamp: new Date()
      })
      setIsStreaming(false)
    }
  }
}))

// Setup listeners for agent stream output
if (typeof window !== 'undefined' && window.electronAPI) {
  window.electronAPI.agent.onStream((data) => {
    const { addMessage, setIsStreaming } = useAgent.getState()
    addMessage({
      id: `stream-${Date.now()}`,
      agent: data.agent,
      content: data.chunk,
      type: 'agent',
      timestamp: new Date()
    })
    setIsStreaming(false)
  })

  window.electronAPI.agent.onStatusChange((data) => {
    const { agents, setAgents } = useAgent.getState()
    setAgents(
      agents.map(a => 
        a.name === data.agent ? { ...a, status: data.status as Agent['status'] } : a
      )
    )
  })
}
