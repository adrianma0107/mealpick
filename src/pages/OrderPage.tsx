import { useState } from 'react'
import { useDishes } from '../hooks/useDishes'
import { useWeek } from '../contexts/WeekContext'
import { useUser } from '../contexts/UserContext'

const CATEGORIES = ['全部', '家常菜', '荤菜', '素菜', '汤', '凉菜'] as const
const CAT_STYLES: Record<string, { bg: string; text: string }> = {
  '家常菜': { bg: 'bg-amber-50', text: 'text-amber-700' },
  '荤菜':   { bg: 'bg-red-50',   text: 'text-red-700' },
  '素菜':   { bg: 'bg-green-50', text: 'text-green-700' },
  '汤':     { bg: 'bg-blue-50',  text: 'text-blue-700' },
  '凉菜':   { bg: 'bg-cyan-50',  text: 'text-cyan-700' },
}

export default function OrderPage() {
  const { dishes, loading } = useDishes()
  const { name: currentUser } = useUser()
  const {
    weekRange,
    myOrders, toggleDish, submitOrders, hasSubmitted,
  } = useWeek()
  const [filterCat, setFilterCat] = useState('全部')

  const filteredDishes = filterCat === '全部'
    ? dishes
    : dishes.filter(d => d.category === filterCat)

  const handleSubmit = () => {
    submitOrders()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">家庭点菜助手</h1>
          <p className="text-xs text-gray-400">本周 {weekRange}</p>
        </div>
        <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full font-medium">
          {currentUser}
        </span>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">选择本周想吃的菜</h2>
          <span className="text-xs text-gray-400">已选 {myOrders.length} 道</span>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto mb-4 pb-1 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filterCat === cat
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          /* Dish cards */
          <div className="space-y-2">
            {filteredDishes.map(dish => {
              const selected = myOrders.includes(dish.id)
              const cs = CAT_STYLES[dish.category]
              return (
                <button
                  key={dish.id}
                  onClick={() => toggleDish(dish.id)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    selected
                      ? 'border-orange-400 bg-orange-50 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        selected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                      }`}>
                        {selected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{dish.name}</span>
                    </div>
                    {cs && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cs.bg} ${cs.text}`}>
                        {dish.category}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 ml-7 flex flex-wrap gap-1">
                    {dish.ingredients.slice(0, 4).map((ing, i) => (
                      <span key={i} className="text-xs text-gray-400">
                        {ing.name}{i < Math.min(dish.ingredients.length, 4) - 1 ? ' · ' : ''}
                      </span>
                    ))}
                    {dish.ingredients.length > 4 && (
                      <span className="text-xs text-gray-300">+{dish.ingredients.length - 4}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Submit bar */}
      {myOrders.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-10 px-4 pb-3">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleSubmit}
              className="w-full p-3.5 bg-orange-500 rounded-xl text-white text-center font-medium shadow-lg hover:bg-orange-600 transition-colors active:scale-[0.98]"
            >
              {hasSubmitted ? '更新点菜' : '提交点菜'}（{myOrders.length} 道菜）
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
