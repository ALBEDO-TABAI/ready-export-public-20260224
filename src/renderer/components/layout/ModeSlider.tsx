import { useMode } from '../../stores/useMode'
import { useNavigate } from 'react-router-dom'

export default function ModeSlider() {
  const { appMode, toggleMode } = useMode()
  const navigate = useNavigate()

  const handleToggle = () => {
    toggleMode()
    // Navigate to the other mode's route
    navigate(appMode === 'workbench' ? '/ready' : '/')
  }

  return (
    <button
      onClick={handleToggle}
      className="relative w-[63px] h-[28px] rounded-2xl flex items-center px-1 transition-all duration-300"
      style={{
        background: appMode === 'ready' ? 'rgba(52, 211, 153, 0.15)' : '#EBE8E1',
        border: `1px solid ${appMode === 'ready' ? 'rgba(52, 211, 153, 0.3)' : 'var(--border-default)'}`
      }}
    >
      {/* Knob */}
      <div
        className="absolute w-[22px] h-[22px] rounded-[11px] bg-white shadow-sm transition-all duration-300 ease-out"
        style={{
          transform: appMode === 'ready' ? 'translateX(34px)' : 'translateX(2px)',
          border: '1px solid var(--border-input)'
        }}
      />

      {/* Labels */}
      <span
        className={`absolute left-2 text-[10px] font-medium transition-opacity duration-200 ${appMode === 'workbench' ? 'opacity-100' : 'opacity-0'
          }`}
        style={{ color: 'var(--text-gray)' }}
      >
        工作台
      </span>
      <span
        className={`absolute right-2 text-[10px] font-medium transition-opacity duration-200 ${appMode === 'ready' ? 'opacity-100' : 'opacity-0'
          }`}
        style={{ color: 'var(--color-green)' }}
      >
        Ready
      </span>
    </button>
  )
}
