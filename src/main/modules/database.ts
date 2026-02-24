import { join } from 'path'
import { app } from 'electron'

interface DatabaseStatement {
  run(...params: unknown[]): unknown
  all<T = unknown>(...params: unknown[]): T[]
}

interface DatabaseConnection {
  exec(sql: string): void
  prepare(sql: string): DatabaseStatement
  close(): void
}

type BetterSqliteConstructor = new (path: string) => DatabaseConnection

let DatabaseConstructor: BetterSqliteConstructor | null = null

// Lazy load better-sqlite3 to handle missing module gracefully
try {
   
  const betterSqlite3 = require('better-sqlite3') as BetterSqliteConstructor & {
    default?: BetterSqliteConstructor
  }
  DatabaseConstructor = betterSqlite3.default || betterSqlite3
} catch {
  console.warn('better-sqlite3 not available, using in-memory fallback')
}

export class DatabaseManager {
  private db: DatabaseConnection | null = null
  private dbPath: string
  private useMemoryDb: boolean

  constructor(useMemoryDb = false) {
    this.useMemoryDb = useMemoryDb || !DatabaseConstructor
    
    if (this.useMemoryDb) {
      this.dbPath = ':memory:'
    } else {
      try {
        const userDataPath = app.getPath('userData')
        this.dbPath = join(userDataPath, 'ready.db')
      } catch {
        this.dbPath = ':memory:'
        this.useMemoryDb = true
      }
    }
    
    this.init()
  }

  private init(): void {
    try {
      if (!DatabaseConstructor) {
        console.warn('Database module not available, using mock implementation')
        this.db = null
        return
      }
      
      this.db = new DatabaseConstructor(this.dbPath)
      this.createTables()
    } catch (error) {
      console.error('Database initialization failed:', error)
      this.db = null
    }
  }

  private createTables(): void {
    if (!this.db) return

    // RSS sources table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rss_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        group_name TEXT DEFAULT 'default',
        icon TEXT,
        last_fetched INTEGER,
        fetch_interval INTEGER DEFAULT 30,
        enabled INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `)

    // RSS items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rss_items (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        guid TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        summary TEXT,
        cover_image TEXT,
        author TEXT,
        published_at INTEGER,
        fetched_at INTEGER DEFAULT (unixepoch()),
        read INTEGER DEFAULT 0,
        starred INTEGER DEFAULT 0,
        ai_score INTEGER,
        ai_tags TEXT,
        FOREIGN KEY (source_id) REFERENCES rss_sources(id) ON DELETE CASCADE
      )
    `)

    // Calendar sources table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS calendar_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#5B8DEF',
        type TEXT DEFAULT 'local',
        sync_url TEXT,
        sync_interval INTEGER DEFAULT 60,
        enabled INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `)

    // Calendar events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id TEXT PRIMARY KEY,
        calendar_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        all_day INTEGER DEFAULT 0,
        recurrence_rule TEXT,
        reminders TEXT,
        agent_action TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (calendar_id) REFERENCES calendar_sources(id) ON DELETE CASCADE
      )
    `)

    // Agent knowledge table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_knowledge (
        id TEXT PRIMARY KEY,
        agent_name TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        UNIQUE(agent_name, key)
      )
    `)

    // Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `)

    // Insert default calendar sources
    const defaultSources = [
      { id: 'work', name: '工作日程', color: '#5B8DEF' },
      { id: 'content', name: '内容创作', color: '#E97A2B' },
      { id: 'holiday', name: '节假日', color: '#34D399' },
      { id: 'personal', name: '个人', color: '#8B5CF6' }
    ]

    const insertSource = this.db.prepare(
      'INSERT OR IGNORE INTO calendar_sources (id, name, color) VALUES (?, ?, ?)'
    )
    for (const source of defaultSources) {
      insertSource.run(source.id, source.name, source.color)
    }
  }

  getDatabase(): DatabaseConnection | null {
    return this.db
  }

  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Singleton instance
let dbInstance: DatabaseManager | null = null

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager()
  }
  return dbInstance
}

// For backward compatibility
export { DatabaseManager as Database }
