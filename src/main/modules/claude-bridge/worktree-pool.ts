import { execSync, ExecSyncOptions } from 'child_process'
import { mkdirSync, existsSync, copyFileSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

export interface Worktree {
  path: string
  branch: string
  agentName: string
}

export interface WorktreeError extends Error {
  code: 'GIT_INIT_FAILED' | 'WORKTREE_CREATE_FAILED' | 'WORKTREE_REMOVE_FAILED' | 'CONFIG_COPY_FAILED'
  originalError?: Error
}

export class WorktreePool {
  private basePath: string
  private worktreesDir: string
  private agentsDir: string
  private activeWorktrees = new Map<string, Worktree>()
  private useMock: boolean
  private gitAvailable: boolean | null = null

  constructor(useMock = false) {
    this.useMock = useMock
    try {
      this.basePath = app.getPath('userData')
    } catch {
      this.basePath = join(process.cwd(), '.ready-data')
    }
    this.worktreesDir = join(this.basePath, '.worktrees')
    this.agentsDir = join(this.basePath, 'agents')
    this.ensureDirectories()

    if (!this.useMock) {
      this.gitAvailable = this.checkGitAvailability()
      if (this.gitAvailable) {
        this.initGitRepo()
      }
    }
  }

  /**
   * Check if git is available
   */
  private checkGitAvailability(): boolean {
    try {
      execSync('git --version', { stdio: 'ignore', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  private ensureDirectories(): void {
    if (!existsSync(this.worktreesDir)) {
      mkdirSync(this.worktreesDir, { recursive: true })
    }
    if (!existsSync(this.agentsDir)) {
      mkdirSync(this.agentsDir, { recursive: true })
    }
  }

  private initGitRepo(): void {
    const gitDir = join(this.basePath, '.git')
    if (!existsSync(gitDir)) {
      try {
        execSync('git init', { cwd: this.basePath, stdio: 'ignore' })
        execSync('git config user.email "ready@localhost"', { cwd: this.basePath, stdio: 'ignore' })
        execSync('git config user.name "Ready"', { cwd: this.basePath, stdio: 'ignore' })

        // Create initial commit if no commits exist
        try {
          execSync('git rev-parse HEAD', { cwd: this.basePath, stdio: 'ignore' })
        } catch {
          // No commits yet, create initial commit
          const readmePath = join(this.basePath, 'README.md')
          if (!existsSync(readmePath)) {
            writeFileSync(readmePath, '# Ready Agent Worktrees\n', 'utf-8')
          }
          execSync('git add README.md', { cwd: this.basePath, stdio: 'ignore' })
          execSync('git commit -m "Initial commit"', { cwd: this.basePath, stdio: 'ignore' })
        }
      } catch (error) {
        console.warn('Git init failed (non-fatal):', error)
        this.gitAvailable = false
      }
    }
  }

  /**
   * Acquire a worktree for an agent
   */
  async acquire(agentName: string): Promise<Worktree> {
    const taskId = Date.now()
    const branch = `agent/${agentName}-${taskId}`
    const path = join(this.worktreesDir, `${agentName}-${taskId}`)

    // Try git worktree if available
    if (!this.useMock && this.gitAvailable) {
      try {
        const execOptions: ExecSyncOptions = {
          cwd: this.basePath,
          stdio: 'ignore',
          timeout: 10000
        }
        execSync(`git worktree add "${path}" -b ${branch}`, execOptions)

        const worktree: Worktree = { path, branch, agentName }
        this.activeWorktrees.set(path, worktree)
        this.copyAgentConfig(agentName, path)
        return worktree
      } catch (error) {
        console.warn('Git worktree failed, using directory fallback:', error)
        // Fall through to directory fallback
      }
    }

    // Directory fallback
    try {
      mkdirSync(path, { recursive: true })
      const worktree: Worktree = { path, branch, agentName }
      this.activeWorktrees.set(path, worktree)
      this.copyAgentConfig(agentName, path)
      return worktree
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw this.createWorktreeError('WORKTREE_CREATE_FAILED', errorMessage, error as Error)
    }
  }

  private copyAgentConfig(agentName: string, worktreePath: string): void {
    const agentDir = join(this.agentsDir, agentName)
    const claudeMdSource = join(agentDir, 'CLAUDE.md')
    const claudeMdDest = join(worktreePath, 'CLAUDE.md')

    if (!existsSync(claudeMdSource)) {
      this.createDefaultAgentConfig(agentName, agentDir)
    }

    if (existsSync(claudeMdSource)) {
      try {
        copyFileSync(claudeMdSource, claudeMdDest)
      } catch (error) {
        console.warn('Failed to copy CLAUDE.md:', error)
        // Non-fatal: continue without config
      }
    }
  }

  private createDefaultAgentConfig(agentName: string, agentDir: string): void {
    if (!existsSync(agentDir)) {
      mkdirSync(agentDir, { recursive: true })
    }
    const personaContent = this.getDefaultPersona(agentName)
    const claudeMdPath = join(agentDir, 'CLAUDE.md')
    try {
      writeFileSync(claudeMdPath, personaContent, 'utf-8')
    } catch (error) {
      console.warn('Failed to create default agent config:', error)
      // Non-fatal: continue without config
    }
  }

  private getDefaultPersona(agentName: string): string {
    const personas: Record<string, string> = {
      butler: `# Butler Agent\n\nYou are a helpful butler agent that coordinates other agents.`,
      copywriter: `# Copywriter Agent\n\nYou are a creative copywriter specializing in marketing content.`,
      'video-editor': `# Video Editor Agent\n\nYou are a video editing assistant.`,
      analyst: `# Analyst Agent\n\nYou are a data analyst specializing in insights and reporting.`
    }
    return personas[agentName] || personas['butler']
  }

  /**
   * Release a worktree
   */
  async release(worktreePath: string): Promise<void> {
    const worktree = this.activeWorktrees.get(worktreePath)
    if (!worktree) return

    // Try git worktree remove if available
    if (!this.useMock && this.gitAvailable) {
      try {
        const execOptions: ExecSyncOptions = {
          cwd: this.basePath,
          stdio: 'ignore',
          timeout: 10000
        }
        execSync(`git worktree remove "${worktreePath}" --force`, execOptions)
        this.activeWorktrees.delete(worktreePath)
        return
      } catch (error) {
        console.warn('Git worktree remove failed, using directory fallback:', error)
        // Fall through to directory fallback
      }
    }

    // Directory fallback
    try {
      rmSync(worktreePath, { recursive: true, force: true })
    } catch (error) {
      console.warn('Failed to remove worktree directory:', error)
      // Non-fatal: just remove from tracking
    }

    this.activeWorktrees.delete(worktreePath)
  }

  getActiveWorktrees(): Worktree[] {
    return Array.from(this.activeWorktrees.values())
  }

  async cleanup(): Promise<void> {
    const errors: Error[] = []

    for (const [path] of this.activeWorktrees) {
      try {
        await this.release(path)
      } catch (error) {
        errors.push(error as Error)
      }
    }

    if (errors.length > 0) {
      console.warn(`Worktree cleanup completed with ${errors.length} errors:`, errors)
    }
  }

  /**
   * Get diagnostic information about the worktree pool
   */
  getDiagnostics(): {
    gitAvailable: boolean
    useMock: boolean
    basePath: string
    activeWorktrees: number
    worktreePaths: string[]
  } {
    return {
      gitAvailable: this.gitAvailable ?? false,
      useMock: this.useMock,
      basePath: this.basePath,
      activeWorktrees: this.activeWorktrees.size,
      worktreePaths: Array.from(this.activeWorktrees.keys())
    }
  }

  private createWorktreeError(
    code: WorktreeError['code'],
    message: string,
    originalError?: Error
  ): WorktreeError {
    const error = new Error(message) as WorktreeError
    error.code = code
    error.originalError = originalError
    return error
  }
}
