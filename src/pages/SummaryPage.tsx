import { useNavigate } from 'react-router-dom'
import { useDishes } from '../hooks/useDishes'
import { useWeek } from '../contexts/WeekContext'
import { useUser } from '../contexts/UserContext'

const CAT_STYLES: Record<string, { bg: string; text: string }> = {
  '家常菜': { bg: 'bg-amber-50', text: 'text-amber-700' },
  '荤菜':   { bg: 'bg-red-50',   text: 'text-red-700' },
  '素菜':   { bg: 'bg-green-50', text: 'text-green-700' },
  '汤':     { bg: 'bg-blue-50',  text: 'text-blue-700' },
  '凉菜':   { bg: 'bg-cyan-50',  text: 'text-cyan-700' },
}

export default function SummaryPage() {
  const navigate = useNavigate()
  const { dishes } = useDishes()
  const { isChef } = useUser()
  const {
    weekRange, allOrders,
    confirmedDishes,
    confirmDish, removeDish, markCompleted,
    completedDishes, getOrderSummary, resolveUserName,
  } = useWeek()

  const summary = getOrderSummary(dishes)
  const submittedCount = Object.values(allOrders).filter(ids => ids.length > 0).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900">本周点菜汇总</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          本周 {weekRange} · {submittedCount} 位家人已点菜
        </p>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {summary.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400 text-sm">还没有人点菜</p>
            <p className="text-gray-300 text-xs mt-1">等大家提交点菜后这里会显示汇总</p>
          </div>
        ) : (
          <div className="space-y-2">
            {summary.map(({ dishId, people }) => {
              const dish = dishes.find(d => d.id === dishId)
              if (!dish) return null
              const isConfirmed = confirmedDishes.includes(dishId)
              const isDone = !!completedDishes[dish.name]
              const cs = CAT_STYLES[dish.category]

              return (
                <div
                  key={dishId}
                  className={`p-3 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-gray-50 border-gray-100 opacity-60'
                      : isConfirmed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Popularity flames */}
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: people.length }).map((_, i) => (
                          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                          </svg>
                        ))}
                      </div>
                      <span className={`font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {dish.name}
                      </span>
                      {cs && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${cs.bg} ${cs.text}`}>
                          {dish.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isChef && !isDone && !isConfirmed && (
                        <>
                          <button
                            onClick={() => removeDish(dishId)}
                            className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            移除
                          </button>
                          <button
                            onClick={() => confirmDish(dishId)}
                            className="text-xs bg-green-500 text-white px-2.5 py-1 rounded-lg hover:bg-green-600 transition-colors"
                          >
                            确认
                          </button>
                        </>
                      )}
                      {isChef && isConfirmed && !isDone && (
                        <button
                          onClick={() => markCompleted(dish.name)}
                          className="text-xs bg-blue-500 text-white px-2.5 py-1 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          已做
                        </button>
                      )}
                      {isDone && (
                        <span className="text-xs text-green-600 font-medium">已完成</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 ml-1">
                    <span className="text-xs text-gray-400">点菜人：</span>
                    {people.map((p, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {resolveUserName(p)}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {confirmedDishes.length > 0 && (
          <button
            onClick={() => navigate('/shopping')}
            className="mt-4 w-full p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white text-center font-medium shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            查看购物清单（{confirmedDishes.length} 道菜）
          </button>
        )}
      </div>
    </div>
  )
}
