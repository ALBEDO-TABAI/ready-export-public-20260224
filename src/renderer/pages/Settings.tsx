import { useState } from 'react'
import {
  ChevronLeft, User, Bell, Shield, Database,
  Palette, Keyboard, Globe, Info, Moon, Sun, Bot
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SettingSection {
  id: string
  title: string
  icon: React.ElementType
  settings: SettingItem[]
}

interface SettingItem {
  id: string
  label: string
  type: 'toggle' | 'select' | 'text' | 'button'
  value?: boolean | string
  options?: string[]
}

const settingsData: SettingSection[] = [
  {
    id: 'account',
    title: '帐号',
    icon: User,
    settings: [
      { id: 'username', label: '用户名', type: 'text', value: 'Ready User' },
      { id: 'email', label: '邮箱', type: 'text', value: 'user@ready.app' }
    ]
  },
  {
    id: 'ai',
    title: 'AI 模型',
    icon: Bot,
    settings: [
      { id: 'apiProvider', label: 'API 提供商', type: 'select', value: 'kimi', options: ['kimi', 'anthropic', 'openai-compatible'] },
      { id: 'apiBaseUrl', label: 'API 地址', type: 'text', value: 'https://api.kimi.com/coding/' },
      { id: 'apiKey', label: 'API Key', type: 'text', value: 'sk-kimi-••••••••' },
      { id: 'model', label: '默认模型', type: 'select', value: 'kimi-for-coding', options: ['kimi-for-coding', 'claude-sonnet-4-6', 'claude-haiku'] },
      { id: 'testConnection', label: '测试连接', type: 'button' }
    ]
  },
  {
    id: 'appearance',
    title: '外观',
    icon: Palette,
    settings: [
      { id: 'darkMode', label: '深色模式', type: 'toggle', value: false },
      { id: 'theme', label: '主题色', type: 'select', value: 'blue', options: ['blue', 'green', 'purple', 'orange'] }
    ]
  },
  {
    id: 'notifications',
    title: '通知',
    icon: Bell,
    settings: [
      { id: 'pushEnabled', label: '推送通知', type: 'toggle', value: true },
      { id: 'soundEnabled', label: '声音提示', type: 'toggle', value: true }
    ]
  },
  {
    id: 'privacy',
    title: '隐私',
    icon: Shield,
    settings: [
      { id: 'analytics', label: '使用分析', type: 'toggle', value: false },
      { id: 'crashReports', label: '崩溃报告', type: 'toggle', value: true }
    ]
  },
  {
    id: 'storage',
    title: '存储',
    icon: Database,
    settings: [
      { id: 'cacheSize', label: '缓存大小', type: 'text', value: '256 MB' },
      { id: 'clearCache', label: '清除缓存', type: 'button' }
    ]
  },
  {
    id: 'shortcuts',
    title: '快捷键',
    icon: Keyboard,
    settings: [
      { id: 'newTask', label: '新建任务', type: 'text', value: '⌘+N' },
      { id: 'sendMessage', label: '发送消息', type: 'text', value: '⌘+Enter' }
    ]
  },
  {
    id: 'language',
    title: '语言',
    icon: Globe,
    settings: [
      { id: 'language', label: '界面语言', type: 'select', value: 'zh-CN', options: ['zh-CN', 'en-US', 'ja-JP'] }
    ]
  },
  {
    id: 'about',
    title: '关于',
    icon: Info,
    settings: [
      { id: 'version', label: '版本', type: 'text', value: '0.1.0' },
      { id: 'checkUpdate', label: '检查更新', type: 'button' }
    ]
  }
]

export default function Settings() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('account')
  const [settings, setSettings] = useState(settingsData)

  const currentSection = settings.find(s => s.id === activeSection)

  const updateSetting = (sectionId: string, settingId: string, value: boolean | string) => {
    setSettings(settings.map(section =>
      section.id === sectionId
        ? {
          ...section,
          settings: section.settings.map(s =>
            s.id === settingId ? { ...s, value } : s
          )
        }
        : section
    ))
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-content)]">
      {/* Header */}
      <div
        className="h-[38px] flex items-center px-3 border-b border-[var(--border-default)]"
        style={{ background: 'var(--bg-panel)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded hover:bg-black/5 transition-colors mr-2"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </button>
        <span className="text-[13px] font-semibold">设置</span>
      </div>

      {/* Settings Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className="w-[200px] flex-shrink-0 border-r border-[var(--border-default)] overflow-auto"
          style={{ background: 'var(--bg-panel)' }}
        >
          {settings.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left
                transition-colors
                ${activeSection === section.id
                  ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]'
                  : 'hover:bg-black/5 text-[var(--text-body)]'
                }
              `}
            >
              <section.icon className="w-4 h-4" strokeWidth={2} />
              <span className="text-[13px]">{section.title}</span>
            </button>
          ))}
        </div>

        {/* Settings Panel */}
        <div className="flex-1 overflow-auto p-6">
          {currentSection && (
            <div>
              <h2 className="text-[18px] font-semibold text-[var(--text-title)] mb-6">
                {currentSection.title}
              </h2>

              <div className="space-y-4 max-w-[500px]">
                {currentSection.settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between py-3 border-b border-[var(--border-default)]"
                  >
                    <span className="text-[13px] text-[var(--text-body)]">{setting.label}</span>

                    {setting.type === 'toggle' && (
                      <button
                        onClick={() => updateSetting(currentSection.id, setting.id, !setting.value)}
                        className={`
                          w-11 h-6 rounded-full transition-colors relative
                          ${setting.value ? 'bg-[var(--color-green)]' : 'bg-[var(--border-input)]'}
                        `}
                      >
                        <span
                          className={`
                            absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                            ${setting.value ? 'left-6' : 'left-1'}
                          `}
                        />
                      </button>
                    )}

                    {setting.type === 'select' && (
                      <select
                        value={setting.value as string}
                        onChange={(e) => updateSetting(currentSection.id, setting.id, e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border-input)] text-[12px] bg-white"
                      >
                        {setting.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {setting.type === 'text' && (
                      <span className="text-[13px] text-[var(--text-muted)]">{setting.value}</span>
                    )}

                    {setting.type === 'button' && (
                      <button className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[12px] hover:bg-black/5 transition-colors">
                        执行
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
