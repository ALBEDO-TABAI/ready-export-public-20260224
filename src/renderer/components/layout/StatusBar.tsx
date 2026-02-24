import { Wifi, WifiOff, Clock, GitBranch } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function StatusBar() {
    const [time, setTime] = useState(new Date())
    const hasElectron = typeof window !== 'undefined' && !!window.electronAPI

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div
            className="h-[24px] flex items-center justify-between px-3 border-t border-[var(--border-default)] text-[11px] text-[var(--text-light)] select-none"
            style={{ background: 'var(--bg-toolbar)' }}
        >
            {/* Left */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    {hasElectron ? (
                        <Wifi className="w-3 h-3 text-[var(--color-green)]" />
                    ) : (
                        <WifiOff className="w-3 h-3 text-[var(--text-light)]" />
                    )}
                    <span>{hasElectron ? 'Kimi API 已连接' : '浏览器预览模式'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3" />
                    <span>main</span>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
                <span>Ready v0.1.0</span>
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        </div>
    )
}
