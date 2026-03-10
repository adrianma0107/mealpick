import { useMemo, useState } from 'react'
import { useDishes } from '../hooks/useDishes'
import { useWeek } from '../contexts/WeekContext'

interface ShoppingItem {
  key: string
  name: string
  qty: number
  rawQty: string
  unit: string
  isExtra?: boolean
  extraId?: string
}

export default function ShoppingPage() {
  const { dishes } = useDishes()
  const {
    confirmedDishes, boughtItems, toggleBought,
    extraItems, addExtraItem, removeExtraItem,
  } = useWeek()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newQty, setNewQty] = useState('')
  const [newUnit, setNewUnit] = useState('')

  // Auto-generated list from confirmed dishes
  const autoList = useMemo(() => {
    const map: Record<string, ShoppingItem> = {}
    confirmedDishes.forEach(dishId => {
      const dish = dishes.find(d => d.id === dishId)
      if (!dish) return
      dish.ingredients.forEach(ing => {
        const key = `${ing.name}_${ing.unit}`
        if (!map[key]) {
          map[key] = { key, name: ing.name, qty: 0, rawQty: ing.qty, unit: ing.unit }
        }
        const num = parseFloat(ing.qty)
        if (!isNaN(num)) map[key].qty += num
        else map[key].rawQty = ing.qty
      })
    })
    return Object.values(map)
  }, [confirmedDishes, dishes])

  // Extra items as ShoppingItems
  const extraList: ShoppingItem[] = extraItems.map(item => ({
    key: `extra_${item.id}`,
    name: item.name,
    qty: parseFloat(item.qty) || 0,
    rawQty: item.qty,
    unit: item.unit,
    isExtra: true,
    extraId: item.id,
  }))

  const allItems = [...autoList, ...extraList]
  const boughtCount = allItems.filter(item => boughtItems[item.key]).length
  const total = allItems.length
  const progress = total > 0 ? (boughtCount / total) * 100 : 0
  const hasContent = confirmedDishes.length > 0 || extraItems.length > 0

  const handleAdd = () => {
    if (!newName.trim()) return
    addExtraItem(newName.trim(), newQty.trim(), newUnit.trim())
    setNewName('')
    setNewQty('')
    setNewUnit('')
    setShowAddForm(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">购物清单</h1>
          <span className="text-xs text-gray-400">
            {boughtCount} / {total} 已购买
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasContent ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🛒</div>
            <p className="text-gray-400 text-sm">还没有确认菜品</p>
            <p className="text-gray-300 text-xs mt-1">先去汇总页面确认本周菜单吧</p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Auto-generated items */}
            <div className="space-y-2">
              {autoList.map(item => {
                const bought = !!boughtItems[item.key]
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleBought(item.key)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      bought ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      bought ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {bought && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className={`flex-1 ${bought ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                      {item.name}
                    </span>
                    <span className={`text-sm ${bought ? 'text-gray-300' : 'text-orange-600 font-medium'}`}>
                      {item.qty > 0 ? `${item.qty} ${item.unit}` : item.rawQty}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Extra items */}
            {extraList.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-gray-400 font-medium mb-2">手动添加</div>
                <div className="space-y-2">
                  {extraList.map(item => {
                    const bought = !!boughtItems[item.key]
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          bought ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100'
                        }`}
                      >
                        <button
                          onClick={() => toggleBought(item.key)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            bought ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }`}
                        >
                          {bought && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => toggleBought(item.key)}
                          className={`flex-1 text-left ${bought ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}
                        >
                          {item.name}
                        </button>
                        <span className={`text-sm ${bought ? 'text-gray-300' : 'text-orange-600 font-medium'}`}>
                          {item.rawQty}{item.unit ? ` ${item.unit}` : ''}
                        </span>
                        <button
                          onClick={() => removeExtraItem(item.extraId!)}
                          className="text-gray-300 hover:text-red-400 p-0.5 flex-shrink-0"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Add item button / form */}
            {showAddForm ? (
              <div className="mt-3 p-3 bg-white border border-orange-200 rounded-xl space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="食材名称"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQty}
                    onChange={e => setNewQty(e.target.value)}
                    placeholder="数量"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
                  />
                  <input
                    type="text"
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    placeholder="单位"
                    className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowAddForm(false); setNewName(''); setNewQty(''); setNewUnit('') }}
                    className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                    className="flex-1 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40"
                  >
                    添加
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-3 w-full p-3 border border-dashed border-gray-300 rounded-xl text-center text-sm text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors"
              >
                + 手动添加食材
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
