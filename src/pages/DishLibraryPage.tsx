import { useState } from 'react'
import { useDishes } from '../hooks/useDishes'
import type { DishWithIngredients, DishFormData } from '../hooks/useDishes'
import DishFormModal from '../components/DishFormModal'

const CATEGORIES = ['家常菜', '荤菜', '素菜', '汤', '凉菜'] as const

const CAT_STYLES: Record<string, { bg: string; border: string; dot: string; text: string }> = {
  '家常菜': { bg: 'bg-amber-50',  border: 'border-amber-200', dot: 'bg-amber-400',  text: 'text-amber-700' },
  '荤菜':   { bg: 'bg-red-50',    border: 'border-red-200',   dot: 'bg-red-400',    text: 'text-red-700' },
  '素菜':   { bg: 'bg-green-50',  border: 'border-green-200', dot: 'bg-green-400',  text: 'text-green-700' },
  '汤':     { bg: 'bg-blue-50',   border: 'border-blue-200',  dot: 'bg-blue-400',   text: 'text-blue-700' },
  '凉菜':   { bg: 'bg-cyan-50',   border: 'border-cyan-200',  dot: 'bg-cyan-400',   text: 'text-cyan-700' },
}

const getStyle = (cat: string) =>
  CAT_STYLES[cat] ?? { bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400', text: 'text-gray-700' }

export default function DishLibraryPage() {
  const { dishes, loading, addDish, updateDish, deleteDish } = useDishes()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<DishWithIngredients | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')

  const filtered = searchText
    ? dishes.filter((d) => d.name.includes(searchText) || d.ingredients.some((i) => i.name.includes(searchText)))
    : dishes

  const openAdd = () => {
    setEditingDish(null)
    setModalOpen(true)
  }

  const openEdit = (dish: DishWithIngredients) => {
    setEditingDish(dish)
    setModalOpen(true)
  }

  const handleSave = async (form: DishFormData) => {
    if (editingDish) {
      await updateDish(editingDish.id, form)
    } else {
      await addDish(form)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteDish(id)
    setDeleteConfirmId(null)
    setExpandedId(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-base font-bold text-gray-900">菜品库</h1>
          <p className="text-xs text-gray-400 mt-0.5">{dishes.length} 道菜品</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1 text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          添加菜品
        </button>
      </header>

      {/* Search */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="搜索菜品或食材..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-orange-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📖</div>
            <p className="text-gray-400 text-sm">{searchText ? '没有找到匹配的菜品' : '菜品库还是空的'}</p>
            <p className="text-gray-300 text-xs mt-1">
              {searchText ? '换个关键词试试' : '点击右上角添加你的第一道菜'}
            </p>
          </div>
        ) : (
          <div className="space-y-5 pt-1">
            {CATEGORIES.map((cat) => {
              const catDishes = filtered.filter((d) => d.category === cat)
              if (catDishes.length === 0) return null
              const s = getStyle(cat)
              return (
                <div key={cat}>
                  {/* Category Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="text-sm font-semibold text-gray-600">{cat}</span>
                    <span className="text-xs text-gray-300">{catDishes.length}</span>
                  </div>

                  {/* Dish Cards */}
                  <div className="space-y-2">
                    {catDishes.map((dish) => {
                      const isExpanded = expandedId === dish.id
                      const isDeleting = deleteConfirmId === dish.id
                      return (
                        <div key={dish.id} className={`rounded-xl ${s.bg} border ${s.border} overflow-hidden`}>
                          {/* Card Body */}
                          <button
                            className="w-full text-left p-3"
                            onClick={() => setExpandedId(isExpanded ? null : dish.id)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-800 text-sm">{dish.name}</span>
                              <svg
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {dish.ingredients.slice(0, 5).map((ing) => (
                                <span key={ing.id} className="text-xs bg-white/60 text-gray-600 px-1.5 py-0.5 rounded">
                                  {ing.name} {ing.qty}{ing.unit}
                                </span>
                              ))}
                              {dish.ingredients.length > 5 && (
                                <span className="text-xs text-gray-400">+{dish.ingredients.length - 5}</span>
                              )}
                            </div>
                          </button>

                          {/* Expanded Actions */}
                          {isExpanded && (
                            <div className="px-3 pb-3">
                              {/* Full ingredients if more than 5 */}
                              {dish.ingredients.length > 5 && (
                                <div className="mb-2.5 flex flex-wrap gap-1">
                                  {dish.ingredients.slice(5).map((ing) => (
                                    <span key={ing.id} className="text-xs bg-white/60 text-gray-600 px-1.5 py-0.5 rounded">
                                      {ing.name} {ing.qty}{ing.unit}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {isDeleting ? (
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-xs text-red-500 flex-1">确认删除"{dish.name}"？</span>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                                  >
                                    取消
                                  </button>
                                  <button
                                    onClick={() => handleDelete(dish.id)}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600"
                                  >
                                    删除
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => openEdit(dish)}
                                    className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
                                  >
                                    编辑
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(dish.id)}
                                    className="flex-1 text-xs py-1.5 rounded-lg border border-red-200 text-red-500 bg-white hover:bg-red-50 transition-colors"
                                  >
                                    删除
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <DishFormModal
        open={modalOpen}
        dish={editingDish}
        onClose={() => {
          setModalOpen(false)
          setEditingDish(null)
        }}
        onSave={handleSave}
      />
    </div>
  )
}
