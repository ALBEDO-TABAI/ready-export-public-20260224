import { ipcMain, BrowserWindow } from 'electron'
import { AgentManager, AgentSpawnResult } from './agent-manager'

export interface IPCResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  mock?: boolean
}

export function setupAgentIPC(agentManager: AgentManager, mainWindow: BrowserWindow): void {
  // Send message to agent
  ipcMain.handle('agent:send', async (_, { agent, message }: { agent: string; message: string }): Promise<IPCResponse<AgentSpawnResult>> => {
    try {
      const result = await agentManager.spawnAgent(agent, message)
      return {
        success: result.success,
        data: result,
        error: result.success ? undefined : result.error,
        mock: result.mock
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage, mock: false }
    }
  })

  // Orchestrate multiple agents
  ipcMain.handle('agent:orchestrate', async (_, { task, agents }: { task: string; agents: string[] }): Promise<IPCResponse<{ orchestrated: boolean }>> => {
    try {
      const result = await agentManager.orchestrate(task, agents)
      return {
        success: result.success,
        data: { orchestrated: result.success },
        error: result.success ? undefined : result.error,
        mock: result.mock
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage, mock: false }
    }
  })

  // Get agent status
  ipcMain.handle('agent:getStatus', (_, agent: string): IPCResponse<{ status: string; task?: string; pid?: number; exitCode?: number | null }> => {
    try {
      const status = agentManager.getAgentStatus(agent)
      if (!status) {
        return { success: false, error: `Agent '${agent}' not found`, mock: false }
      }
      return {
        success: true,
        data: {
          status: status.status,
          task: status.task,
          pid: status.process.pid,
          exitCode: status.process.exitCode
        },
        mock: status.isMock
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage, mock: false }
    }
  })

  // Get all agents
  ipcMain.handle('agent:getAll', (): IPCResponse<Array<{ name: string; status: string; task?: string; pid?: number; exitCode?: number | null; mock?: boolean }>> => {
    try {
      const agents = agentManager.getAllAgents().map(a => ({
        name: a.name,
        status: a.status,
        task: a.task,
        pid: a.process.pid,
        exitCode: a.process.exitCode,
        mock: a.isMock
      }))
      return { success: true, data: agents, mock: false }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage, mock: false }
    }
  })

  // Forward agent output to renderer
  agentManager.on('output', (data) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent:stream', data)
    }
  })

  // Forward agent status changes to renderer
  agentManager.on('status', (data) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent:status', data)
    }
  })

  // Forward agent error events to renderer
  agentManager.on('error', (data) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent:error', data)
    }
  })
}
