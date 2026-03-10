import { useState, useMemo } from 'react'
import { useWeek } from '../contexts/WeekContext'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function getTodayStr(): string {
  const d = new Date()
  return toDateStr(d.getFullYear(), d.getMonth(), d.getDate())
}

export default function CalendarPage() {
  const today = new Date()
  const todayStr = getTodayStr()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { completedDishes } = useWeek()

  // Build calendar data: date -> dish names[]
  const calendarData = useMemo(() => {
    const map: Record<string, string[]> = {}
    Object.entries(completedDishes).forEach(([dishName, date]) => {
      if (!map[date]) map[date] = []
      if (!map[date].includes(dishName)) map[date].push(dishName)
    })
    return map
  }, [completedDishes])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Calendar grid: Monday-start
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // Monday=0

  const selectedDishes = selectedDate ? calendarData[selectedDate] : null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900">餐食日历</h1>
        <p className="text-xs text-gray-400 mt-0.5">查看做菜记录</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="text-base font-semibold text-gray-800">
            {viewYear}年{viewMonth + 1}月
          </h2>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`e${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = toDateStr(viewYear, viewMonth, day)
            const hasDishes = calendarData[dateStr]
            const isToday = dateStr === todayStr
            const isSelected = selectedDate === dateStr

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all relative ${
                  isToday
                    ? 'bg-orange-500 text-white font-bold shadow-sm'
                    : isSelected
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {day}
                {hasDishes && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {hasDishes.slice(0, 3).map((_, j) => (
                      <div
                        key={j}
                        className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-orange-400'}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day detail */}
        {selectedDate && selectedDishes && (
          <div className="mt-4 p-3 bg-white rounded-xl border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              {parseInt(selectedDate.slice(5, 7))}月{parseInt(selectedDate.slice(8))}日 菜单
            </h3>
            <div className="space-y-1.5">
              {selectedDishes.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span className="text-sm text-gray-700">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDate && !selectedDishes && (
          <div className="mt-4 text-center py-6">
            <p className="text-gray-300 text-sm">这天还没有做菜记录</p>
          </div>
        )}
      </div>
    </div>
  )
}
