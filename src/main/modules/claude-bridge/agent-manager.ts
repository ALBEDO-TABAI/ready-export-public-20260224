import { spawn, spawnSync, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { WorktreePool } from './worktree-pool'

export interface AgentInstance {
  name: string
  process: ChildProcess
  worktree: string
  status: 'idle' | 'working' | 'done' | 'error' | 'timeout'
  task?: string
  isMock: boolean
  spawnTime: number
  exitCode?: number | null
  errorMessage?: string
}

export interface AgentOutput {
  agent: string
  chunk: string
  type: 'stdout' | 'stderr' | 'error'
}

export interface AgentStatusEvent {
  agent: string
  status: AgentInstance['status']
  exitCode?: number | null
  errorMessage?: string
  isMock: boolean
}

export interface AgentSpawnResult {
  success: boolean
  agent: string
  mock: boolean
  pid?: number
  error?: string
  exitCode?: number | null
}

export interface OrchestrateResult {
  success: boolean
  mock: boolean
  error?: string
}

export interface AgentErrorEvent {
  agent: string
  error: string
  type: 'spawn' | 'runtime' | 'timeout' | 'exit'
  exitCode?: number | null
}

export class AgentManager extends EventEmitter {
  private agents = new Map<string, AgentInstance>()
  private worktreePool: WorktreePool
  private maxAgents = 4
  private useMock: boolean
  private agentTimeoutMs: number
  private claudeAvailable: boolean | null = null

  constructor(useMock = false, agentTimeoutMs = 5 * 60 * 1000) {
    super()
    this.useMock = useMock
    this.agentTimeoutMs = agentTimeoutMs
    this.worktreePool = new WorktreePool(useMock)
    this.claudeAvailable = this.checkClaudeAvailability()
  }

  /**
   * Check if Claude CLI is available (with timeout)
   */
  private checkClaudeAvailability(): boolean {
    try {
      const result = spawnSync('claude', ['--version'], {
        stdio: 'ignore',
        timeout: 5000
      })
      return result.status === 0
    } catch {
      return false
    }
  }

  /**
   * Determine if we should use mock mode for this agent
   */
  private shouldUseMock(): boolean {
    if (this.useMock) return true
    if (this.claudeAvailable === null) {
      this.claudeAvailable = this.checkClaudeAvailability()
    }
    return !this.claudeAvailable
  }

  /**
   * Spawn a new Agent (Claude Code instance)
   */
  async spawnAgent(name: string, task: string): Promise<AgentSpawnResult> {
    if (this.agents.size >= this.maxAgents) {
      const error = `Maximum agent limit (${this.maxAgents}) reached.`
      this.emit('output', {
        agent: name,
        chunk: `Error: ${error}`,
        type: 'error'
      })
      return { success: false, agent: name, mock: false, error }
    }

    // Kill existing agent with same name
    if (this.agents.has(name)) {
      this.killAgent(name)
    }

    let isMock = this.shouldUseMock()
    const spawnTime = Date.now()

    try {
      const wt = await this.worktreePool.acquire(name)

      let proc: ChildProcess
      try {
        proc = isMock
          ? this.createMockProcess(task)
          : this.createClaudeProcess(wt.path, task)
      } catch (processError) {
        // If Claude process creation fails, fall back to mock
        if (!isMock) {
          isMock = true
          this.emit('output', {
            agent: name,
            chunk: `Claude process creation failed, falling back to mock mode: ${processError instanceof Error ? processError.message : String(processError)}`,
            type: 'stderr'
          })
          proc = this.createMockProcess(task)
        } else {
          throw processError
        }
      }

      const agent: AgentInstance = {
        name,
        process: proc,
        worktree: wt.path,
        status: 'working',
        task,
        isMock,
        spawnTime
      }

      this.agents.set(name, agent)
      this.emit('status', { agent: name, status: 'working', isMock: agent.isMock })

      // Setup timeout handler
      const timeoutId = setTimeout(() => {
        if (agent.status === 'working') {
          agent.status = 'timeout'
          agent.errorMessage = `Agent timed out after ${this.agentTimeoutMs}ms`
          this.emit('output', {
            agent: name,
            chunk: agent.errorMessage,
            type: 'error'
          })
          this.emit('error', {
            agent: name,
            error: agent.errorMessage,
            type: 'timeout'
          })
          this.emit('status', {
            agent: name,
            status: 'timeout',
            errorMessage: agent.errorMessage,
            isMock: agent.isMock
          })
          this.killAgent(name)
        }
      }, this.agentTimeoutMs)

      // Buffer for incomplete JSON lines
      let lineBuffer = ''

      proc.stdout?.on('data', (chunk: Buffer) => {
        lineBuffer += chunk.toString()
        const lines = lineBuffer.split('\n')
        // Keep the last potentially incomplete line in the buffer
        lineBuffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const json = JSON.parse(trimmed)
            // Extract text content from stream-json format
            if (json.type === 'assistant' && json.message?.content) {
              for (const block of json.message.content) {
                if (block.type === 'text' && block.text) {
                  this.emit('output', { agent: name, chunk: block.text, type: 'text' })
                }
              }
            } else if (json.type === 'result') {
              // Stream completed — send the final result text
              if (json.result) {
                this.emit('output', { agent: name, chunk: '', type: 'done' })
              }
            }
            // Ignore 'system' init messages and thinking blocks
          } catch {
            // Non-JSON line — forward raw text (e.g. mock process output)
            this.emit('output', { agent: name, chunk: trimmed, type: 'stdout' })
          }
        }
      })

      proc.stderr?.on('data', (chunk: Buffer) => {
        const text = chunk.toString().trim()
        if (text) {
          this.emit('output', { agent: name, chunk: text, type: 'stderr' })
        }
      })

      proc.on('close', (code) => {
        clearTimeout(timeoutId)
        agent.exitCode = code
        const status = code === 0 ? 'done' : 'error'
        agent.status = status

        if (code !== 0 && code !== null) {
          agent.errorMessage = `Process exited with code ${code}`
          this.emit('error', {
            agent: name,
            error: agent.errorMessage,
            type: 'exit',
            exitCode: code
          } as AgentErrorEvent)
        }

        this.emit('status', {
          agent: name,
          status,
          exitCode: code,
          isMock: agent.isMock
        } as AgentStatusEvent)
        this.agents.delete(name)
        this.worktreePool.release(wt.path).catch(console.error)
      })

      proc.on('error', (error) => {
        clearTimeout(timeoutId)
        agent.status = 'error'
        agent.errorMessage = `Process error: ${error.message}`

        this.emit('output', {
          agent: name,
          chunk: agent.errorMessage,
          type: 'error'
        })
        this.emit('error', {
          agent: name,
          error: error.message,
          type: 'runtime'
        } as AgentErrorEvent)
        this.emit('status', {
          agent: name,
          status: 'error',
          errorMessage: agent.errorMessage,
          isMock: agent.isMock
        } as AgentStatusEvent)
        this.agents.delete(name)
        this.worktreePool.release(wt.path).catch(console.error)
      })

      return {
        success: true,
        agent: name,
        mock: agent.isMock,
        pid: proc.pid
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.emit('output', {
        agent: name,
        chunk: `Failed to spawn agent: ${errorMessage}`,
        type: 'error'
      })
      this.emit('error', {
        agent: name,
        error: errorMessage,
        type: 'spawn'
      } as AgentErrorEvent)
      return {
        success: false,
        agent: name,
        mock: isMock,
        error: errorMessage
      }
    }
  }

  /**
   * Create Claude Code process
   */
  private createClaudeProcess(worktreePath: string, task: string): ChildProcess {
    const proc = spawn(
      'claude',
      ['--print', '--verbose', '--output-format', 'stream-json'],
      {
        cwd: worktreePath,
        env: {
          ...process.env,
          CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
          // Kimi API configuration (can be overridden by process.env)
          ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || 'https://api.kimi.com/coding/',
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || ''
        }
      }
    )

    if (!proc.pid) {
      throw new Error('Failed to spawn Claude process')
    }

    proc.stdin?.write(task)
    proc.stdin?.end()

    return proc
  }

  /**
   * Create mock process for environments without Claude CLI
   */
  private createMockProcess(task: string): ChildProcess {
    const script = `
const task = ${JSON.stringify(task)};
console.log('[Mock Agent] Received task: ' + task);
console.log('[Mock Agent] Claude Code is not available. Running in mock mode.');
console.log('[Mock Agent] Simulating task execution...');
setTimeout(() => {
  console.log('[Mock Agent] Task completed (mock).');
  process.exit(0);
}, 1000);
`
    return spawn(process.execPath, ['-e', script], { stdio: ['pipe', 'pipe', 'pipe'] })
  }

  /**
   * Orchestrate multiple agents for a task
   */
  async orchestrate(task: string, agentNames?: string[]): Promise<OrchestrateResult> {
    const agents = agentNames || ['butler']

    // Check if we're in mock mode upfront
    const isMock = this.shouldUseMock()

    const result = await this.spawnAgent('butler', `Analyze and orchestrate: ${task}`)
    if (!result.success) {
      return { success: false, mock: isMock, error: result.error }
    }

    const onOutput = (data: AgentOutput) => {
      if (data.agent === 'butler' && data.type === 'stdout') {
        const match = data.chunk.match(/SPAWN_AGENT:(\w+):(.+)/)
        if (match) {
          const [, agentName, agentTask] = match
          if (agents.includes(agentName)) {
            this.spawnAgent(agentName, agentTask)
          }
        }
      }
    }

    this.on('output', onOutput)

    // Cleanup listener after orchestration timeout
    setTimeout(() => {
      this.off('output', onOutput)
    }, this.agentTimeoutMs)

    return { success: true, mock: result.mock }
  }

  /**
   * Get agent status
   */
  getAgentStatus(name: string): AgentInstance | undefined {
    return this.agents.get(name)
  }

  /**
   * Get all active agents
   */
  getAllAgents(): AgentInstance[] {
    return Array.from(this.agents.values())
  }

  /**
   * Kill an agent with graceful shutdown (SIGTERM → SIGKILL)
   */
  killAgent(name: string): boolean {
    const agent = this.agents.get(name)
    if (agent) {
      try {
        agent.process.kill('SIGTERM')
        // Force kill after 5 seconds if still running
        setTimeout(() => {
          if (!agent.process.killed) {
            agent.process.kill('SIGKILL')
          }
        }, 5000)
      } catch (error) {
        console.error(`Failed to kill agent ${name}:`, error)
      }
      return true
    }
    return false
  }

  /**
   * Cleanup all agents
   */
  cleanup(): void {
    for (const [name, agent] of this.agents) {
      try {
        agent.process.kill('SIGTERM')
        this.worktreePool.release(agent.worktree).catch(console.error)
      } catch (error) {
        console.error(`Failed to cleanup agent ${name}:`, error)
      }
    }
    this.agents.clear()
  }

  /**
   * Get diagnostic information about the agent manager
   */
  getDiagnostics(): {
    claudeAvailable: boolean
    useMock: boolean
    maxAgents: number
    agentTimeoutMs: number
    activeAgents: number
    activeAgentNames: string[]
  } {
    return {
      claudeAvailable: this.claudeAvailable ?? false,
      useMock: this.useMock,
      maxAgents: this.maxAgents,
      agentTimeoutMs: this.agentTimeoutMs,
      activeAgents: this.agents.size,
      activeAgentNames: Array.from(this.agents.keys())
    }
  }
}
