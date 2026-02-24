import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Info } from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface CalendarEvent {
  id: string
  title: string
  startTime: Date
  endTime: Date
  calendarId: string
  color: string
}

interface CalendarSource {
  id: string
  name: string
  color: string
  enabled: boolean
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8) // 8AM to 6PM
const HOUR_HEIGHT = 60 // Height of each hour in pixels
const TOTAL_HOURS = 11 // Total hours displayed (8AM to 6PM)

export default function CalendarMode() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [sources, setSources] = useState<CalendarSource[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isMock, setIsMock] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadCalendarData()
  }, [currentDate])

  const loadCalendarData = async () => {
    try {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = addDays(start, 6)
      
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.calendar.getEvents(start, end)
        if (result.success && result.data) {
          setEvents(result.data.map((e: { startTime: string | number | Date; endTime: string | number | Date }) => ({
            ...e,
            startTime: new Date(e.startTime),
            endTime: new Date(e.endTime)
          })))
          // Set mock mode from API response
          setIsMock(result.mock === true)
        }

        const sourcesResult = await window.electronAPI.calendar.getSources()
        if (sourcesResult.success && sourcesResult.data) {
          setSources(sourcesResult.data)
          // Update mock mode if sources API also returns mock
          if (sourcesResult.mock === true) {
            setIsMock(true)
          }
        }
      } else {
        // Mock data for development
        setIsMock(true)
        setSources([
          { id: 'work', name: '工作日程', color: '#5B8DEF', enabled: true },
          { id: 'content', name: '内容创作', color: '#E97A2B', enabled: true },
          { id: 'holiday', name: '节假日', color: '#34D399', enabled: true },
          { id: 'personal', name: '个人', color: '#8B5CF6', enabled: false }
        ])
        setEvents([
          {
            id: '1',
            calendarId: 'work',
            title: '团队周会',
            startTime: new Date(Date.now() + 3600000),
            endTime: new Date(Date.now() + 7200000),
            color: '#5B8DEF'
          }
        ])
      }
    } catch (error) {
      console.log('Calendar data load error:', error)
    }
  }

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Check if current week contains today
  const todayInWeek = weekDays.findIndex(day => isToday(day))
  const hasTodayInWeek = todayInWeek !== -1

  const getEventsForDay = (day: Date) => {
    return events.filter(e => isSameDay(e.startTime, day))
  }

  const toggleSource = (id: string) => {
    setSources(sources.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  // Calculate current time line position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    // Only show if within displayed hours (8AM - 6PM)
    if (hours < 8 || hours > 18) return null
    return (hours - 8) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT
  }

  const currentTimePosition = getCurrentTimePosition()

  return (
    <div className="flex flex-col h-full">
      {/* Mock Mode Badge */}
      {isMock && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
          <Info className="w-4 h-4 text-amber-600" />
          <span className="text-[12px] text-amber-700">
            当前处于演示模式，数据为模拟数据
          </span>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div 
          className="w-[220px] flex-shrink-0 border-r border-[var(--border-default)] overflow-auto"
          style={{ background: 'var(--bg-panel)' }}
        >
          {/* Mini Calendar */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold">
                {format(currentDate, 'yyyy年 M月', { locale: zhCN })}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentDate(addDays(currentDate, -30))}
                  className="p-1 rounded hover:bg-black/5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCurrentDate(addDays(currentDate, 30))}
                  className="p-1 rounded hover:bg-black/5"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} className="text-center text-[10px] text-[var(--text-light)] py-1">
                  {d}
                </div>
              ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square flex items-center justify-center text-[11px] rounded-lg
                    transition-colors
                    ${isToday(day) ? 'bg-[var(--color-red)] text-white font-semibold' : 'hover:bg-black/5'}
                    ${selectedDate && isSameDay(day, selectedDate) ? 'ring-2 ring-[var(--color-blue)]' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-[var(--border-default)] mx-4" />

          {/* Calendar Sources */}
          <div className="p-4">
            <h3 className="text-[12px] font-semibold text-[var(--text-title)] mb-3">日历源</h3>
            <div className="space-y-2">
              {sources.map(source => (
                <label 
                  key={source.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-black/5 p-1.5 rounded transition-colors"
                >
                  <input 
                    type="checkbox"
                    checked={source.enabled}
                    onChange={() => toggleSource(source.id)}
                    className="w-4 h-4 rounded border-[var(--border-input)]"
                  />
                  <span 
                    className="w-3 h-3 rounded-full"
                    style={{ background: source.color }}
                  />
                  <span className="text-[12px] text-[var(--text-body)]">{source.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Add Account Button */}
          <div className="px-4 pb-4">
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-default)] text-[12px] text-[var(--text-muted)] hover:bg-black/5 transition-colors">
              <Plus className="w-4 h-4" />
              添加日历帐号
            </button>
          </div>
        </div>

        {/* Main Calendar */}
        <div className="flex-1 flex flex-col" style={{ background: 'var(--bg-content)' }}>
          {/* Navigation Bar */}
          <div 
            className="h-[44px] flex items-center justify-between px-4 border-b border-[var(--border-default)]"
            style={{ background: 'var(--bg-toolbar)' }}
          >
            <div className="flex items-center gap-4">
              <h2 className="text-[15px] font-semibold">
                {format(currentDate, 'MMMM yyyy', { locale: zhCN })}
              </h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentDate(addDays(currentDate, -7))}
                  className="p-1.5 rounded hover:bg-black/5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 rounded-lg border border-[var(--border-default)] text-[12px] hover:bg-black/5 transition-colors"
                >
                  今天
                </button>
                <button 
                  onClick={() => setCurrentDate(addDays(currentDate, 7))}
                  className="p-1.5 rounded hover:bg-black/5 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-[var(--color-blue)] text-white text-[12px] hover:brightness-95 transition-all">
                周
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="flex border-b border-[var(--border-default)]">
            <div className="w-14 flex-shrink-0 border-r border-[var(--border-default)]" />
            {weekDays.map((day, i) => (
              <div 
                key={i}
                className={`flex-1 py-2 text-center border-r border-[var(--border-default)] last:border-r-0 ${
                  isToday(day) ? 'bg-[var(--color-red)]/5' : ''
                }`}
              >
                <div className={`text-[11px] ${isToday(day) ? 'text-[var(--color-red)] font-medium' : 'text-[var(--text-muted)]'}`}>
                  {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][i]}
                </div>
                <div className={`text-[14px] font-semibold mt-0.5 ${
                  isToday(day) ? 'text-[var(--color-red)]' : 'text-[var(--text-title)]'
                }`}>
                  {format(day, 'd')}
                  {isToday(day) && (
                    <span className="ml-1 text-[10px]">今天</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="flex-1 overflow-auto relative">
            <div className="flex min-h-full relative">
              {/* Time Labels */}
              <div className="w-14 flex-shrink-0 border-r border-[var(--border-default)] bg-[var(--bg-toolbar)]">
                {HOURS.map(hour => (
                  <div 
                    key={hour}
                    className="h-[60px] flex items-start justify-center pt-1 border-b border-[var(--border-default)]"
                  >
                    <span className="text-[10px] text-[var(--text-light)]">
                      {hour <= 12 ? `${hour} AM` : `${hour - 12} PM`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDays.map((day, dayIndex) => (
                <div 
                  key={dayIndex}
                  className={`flex-1 border-r border-[var(--border-default)] last:border-r-0 relative ${
                    isToday(day) ? 'bg-[var(--color-blue)]/[0.02]' : ''
                  }`}
                >
                  {/* Hour Grid Lines */}
                  {HOURS.map(hour => (
                    <div 
                      key={hour}
                      className="h-[60px] border-b border-[var(--border-default)]"
                    />
                  ))}

                  {/* Current Time Line - Only show in today's column */}
                  {isToday(day) && currentTimePosition !== null && (
                    <div 
                      className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                      style={{ top: `${currentTimePosition}px` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-[var(--color-red)] -ml-1" />
                      <div className="flex-1 h-px bg-[var(--color-red)]" />
                      <span className="text-[10px] text-[var(--color-red)] ml-1 mr-1 bg-white/80 px-1 rounded">
                        {format(currentTime, 'HH:mm')}
                      </span>
                    </div>
                  )}

                  {/* Events */}
                  {getEventsForDay(day).map(event => (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 rounded-lg px-2.5 py-1.5 text-[11px] cursor-pointer 
                        hover:shadow-md hover:scale-[1.02] transition-all duration-200 ease-out
                        backdrop-blur-sm"
                      style={{
                        top: `${(event.startTime.getHours() - 8) * HOUR_HEIGHT + (event.startTime.getMinutes() / 60) * HOUR_HEIGHT}px`,
                        height: `${Math.max(
                          ((event.endTime.getTime() - event.startTime.getTime()) / 60000 / 60) * HOUR_HEIGHT,
                          24
                        )}px`,
                        background: `${event.color}15`,
                        borderLeft: `3px solid ${event.color}`,
                        borderTop: `1px solid ${event.color}30`,
                        borderRight: `1px solid ${event.color}30`,
                        borderBottom: `1px solid ${event.color}30`,
                        color: event.color,
                        boxShadow: `0 1px 3px ${event.color}20`
                      }}
                    >
                      <div className="font-semibold truncate leading-tight">{event.title}</div>
                      <div className="text-[10px] opacity-80 mt-0.5 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-current" />
                        {format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
