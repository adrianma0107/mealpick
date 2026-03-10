import { useState, useEffect } from 'react'
import type { DishFormData, DishWithIngredients } from '../hooks/useDishes'

const CATEGORIES = ['家常菜', '荤菜', '素菜', '汤', '凉菜'] as const

interface Props {
  open: boolean
  dish?: DishWithIngredients | null
  onClose: () => void
  onSave: (data: DishFormData) => void
}

const emptyIngredient = () => ({ name: '', qty: '', unit: '' })

export default function DishFormModal({ open, dish, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('家常菜')
  const [ingredients, setIngredients] = useState([emptyIngredient()])

  const isEdit = !!dish

  useEffect(() => {
    if (dish) {
      setName(dish.name)
      setCategory(dish.category)
      setIngredients(
        dish.ingredients.length > 0
          ? dish.ingredients.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit }))
          : [emptyIngredient()]
      )
    } else {
      setName('')
      setCategory('家常菜')
      setIngredients([emptyIngredient()])
    }
  }, [dish, open])

  const updateIngredient = (idx: number, field: string, value: string) => {
    setIngredients((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  const removeIngredient = (idx: number) => {
    setIngredients((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))
  }

  const handleSave = () => {
    if (!name.trim()) return
    const validIngredients = ingredients.filter((i) => i.name.trim())
    if (validIngredients.length === 0) return
    onSave({ name: name.trim(), category, ingredients: validIngredients })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white w-full max-w-md rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? '编辑菜品' : '添加新菜品'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">菜名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-orange-400 transition-colors"
              placeholder="如：糖醋里脊"
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">分类</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-all ${
                    category === cat
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1.5">食材</label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-orange-400 transition-colors"
                    placeholder="食材名"
                  />
                  <input
                    type="text"
                    value={ing.qty}
                    onChange={(e) => updateIngredient(i, 'qty', e.target.value)}
                    className="w-16 border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-orange-400 transition-colors text-center"
                    placeholder="数量"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                    className="w-14 border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:border-orange-400 transition-colors text-center"
                    placeholder="单位"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      className="text-gray-300 hover:text-red-400 p-0.5 flex-shrink-0"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
              className="text-xs text-orange-500 font-medium mt-2 hover:text-orange-600"
            >
              + 添加食材
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={!name.trim() || !ingredients.some((i) => i.name.trim())}
            className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEdit ? '保存修改' : '保存菜品'}
          </button>
        </div>
      </div>
    </div>
  )
}
