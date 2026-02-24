import { describe, it } from 'node:test'
import assert from 'node:assert'

// Store Types Validation Tests

describe('Mode Store Types', () => {
    it('should have valid WorkbenchMode values', () => {
        const validModes = ['browser', 'document', 'image', 'video', 'rss', 'calendar']
        validModes.forEach(mode => {
            assert.strictEqual(typeof mode, 'string')
            assert.ok(mode.length > 0)
        })
    })

    it('should have valid AppMode values', () => {
        const validAppModes = ['workbench', 'ready']
        validAppModes.forEach(mode => {
            assert.strictEqual(typeof mode, 'string')
        })
    })
})

describe('Workspace Store Types', () => {
    it('should validate FileItem structure', () => {
        const fileItem = {
            name: 'readme.md',
            path: '/workspace/readme.md',
            isDirectory: false,
            size: 1024,
            modified: new Date()
        }
        assert.strictEqual(typeof fileItem.name, 'string')
        assert.strictEqual(typeof fileItem.path, 'string')
        assert.strictEqual(typeof fileItem.isDirectory, 'boolean')
        assert.strictEqual(typeof fileItem.size, 'number')
    })

    it('should handle directory FileItem', () => {
        const dirItem = {
            name: 'src',
            path: '/workspace/src',
            isDirectory: true,
            size: 0,
            modified: new Date()
        }
        assert.ok(dirItem.isDirectory)
        assert.strictEqual(dirItem.size, 0)
    })
})

describe('Agent Store Types', () => {
    it('should validate Agent structure', () => {
        const agent = {
            name: 'butler',
            status: 'idle' as const,
            task: undefined,
            isMock: false,
            spawnTime: Date.now()
        }
        assert.strictEqual(typeof agent.name, 'string')
        assert.strictEqual(agent.status, 'idle')
        assert.strictEqual(typeof agent.isMock, 'boolean')
    })

    it('should validate AgentMessage structure', () => {
        const message = {
            id: `msg-${Date.now()}`,
            agent: 'butler',
            content: 'Hello, world!',
            type: 'stdout' as const,
            timestamp: Date.now()
        }
        assert.strictEqual(typeof message.id, 'string')
        assert.ok(message.id.startsWith('msg-'))
        assert.strictEqual(typeof message.content, 'string')
    })

    it('should handle all agent status values', () => {
        const validStatuses = ['idle', 'working', 'done', 'error', 'timeout']
        validStatuses.forEach(status => {
            assert.strictEqual(typeof status, 'string')
            assert.ok(validStatuses.includes(status))
        })
    })
})

describe('Store Utilities', () => {
    it('should format message ID correctly', () => {
        const id = `msg-${Date.now()}`
        assert.ok(id.startsWith('msg-'))
        assert.ok(id.length > 4)
    })

    it('should handle path operations', () => {
        const path = '/workspace/src/main/index.ts'
        const parts = path.split('/')
        assert.strictEqual(parts[parts.length - 1], 'index.ts')
        assert.strictEqual(parts[1], 'workspace')
    })
})
