import { useEffect, useRef, useState } from 'react'

export interface ContextMenuItem {
    id: string
    label: string
    icon?: React.ReactNode
    shortcut?: string
    danger?: boolean
    disabled?: boolean
    separator?: boolean
    onClick?: () => void
}

interface ContextMenuProps {
    items: ContextMenuItem[]
    x: number
    y: number
    onClose: () => void
}

export default function ContextMenu({ items, x, y, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [adjustedPos, setAdjustedPos] = useState({ x, y })

    // Adjust position to stay within viewport
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect()
            const vw = window.innerWidth
            const vh = window.innerHeight
            setAdjustedPos({
                x: x + rect.width > vw ? vw - rect.width - 8 : x,
                y: y + rect.height > vh ? vh - rect.height - 8 : y
            })
        }
    }, [x, y])

    // Close on outside click or Escape
    useEffect(() => {
        const handleClick = () => onClose()
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        // Delay to avoid immediate close from the same right-click
        const timer = setTimeout(() => {
            window.addEventListener('click', handleClick)
            window.addEventListener('contextmenu', handleClick)
        }, 50)
        window.addEventListener('keydown', handleKey)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('click', handleClick)
            window.removeEventListener('contextmenu', handleClick)
            window.removeEventListener('keydown', handleKey)
        }
    }, [onClose])

    return (
        <div
            ref={menuRef}
            className="fixed z-50 rounded-lg shadow-xl border border-[var(--border-default)] py-1 min-w-[180px] animate-fadeIn"
            style={{
                left: adjustedPos.x,
                top: adjustedPos.y,
                background: 'var(--bg-panel)',
                backdropFilter: 'blur(12px)'
            }}
        >
            {items.map((item) => {
                if (item.separator) {
                    return <div key={item.id} className="h-px my-1 mx-2" style={{ background: 'var(--border-default)' }} />
                }
                return (
                    <button
                        key={item.id}
                        onClick={() => {
                            item.onClick?.()
                            onClose()
                        }}
                        disabled={item.disabled}
                        className={`
              w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors
              ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--color-blue-light)]'}
              ${item.danger ? 'text-[var(--color-red)]' : 'text-[var(--text-body)]'}
            `}
                    >
                        {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                            <span className="text-[10px] text-[var(--text-light)] ml-4">{item.shortcut}</span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
