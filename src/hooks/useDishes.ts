import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface IngredientItem {
  id: string
  name: string
  qty: string
  unit: string
}

export interface DishWithIngredients {
  id: string
  name: string
  category: string
  ingredients: IngredientItem[]
}

export interface DishFormData {
  name: string
  category: string
  ingredients: { name: string; qty: string; unit: string }[]
}

const STORAGE_KEY = 'mealpick_dishes'

const SAMPLE_DISHES: DishWithIngredients[] = [
  { id: 's1', name: '番茄炒蛋', category: '家常菜', ingredients: [{ id: 'i1', name: '番茄', qty: '2', unit: '个' }, { id: 'i2', name: '鸡蛋', qty: '3', unit: '个' }, { id: 'i3', name: '葱', qty: '1', unit: '根' }] },
  { id: 's2', name: '红烧排骨', category: '荤菜', ingredients: [{ id: 'i4', name: '排骨', qty: '500', unit: 'g' }, { id: 'i5', name: '生抽', qty: '2', unit: '勺' }, { id: 'i6', name: '冰糖', qty: '30', unit: 'g' }] },
  { id: 's3', name: '清炒时蔬', category: '素菜', ingredients: [{ id: 'i7', name: '时令蔬菜', qty: '300', unit: 'g' }, { id: 'i8', name: '蒜', qty: '3', unit: '瓣' }] },
  { id: 's4', name: '酸辣土豆丝', category: '家常菜', ingredients: [{ id: 'i9', name: '土豆', qty: '2', unit: '个' }, { id: 'i10', name: '干辣椒', qty: '5', unit: '个' }, { id: 'i11', name: '醋', qty: '2', unit: '勺' }] },
  { id: 's5', name: '紫菜蛋花汤', category: '汤', ingredients: [{ id: 'i12', name: '紫菜', qty: '1', unit: '小把' }, { id: 'i13', name: '鸡蛋', qty: '2', unit: '个' }] },
  { id: 's6', name: '可乐鸡翅', category: '荤菜', ingredients: [{ id: 'i14', name: '鸡翅中', qty: '8', unit: '个' }, { id: 'i15', name: '可乐', qty: '1', unit: '罐' }, { id: 'i16', name: '生抽', qty: '2', unit: '勺' }] },
  { id: 's7', name: '凉拌黄瓜', category: '凉菜', ingredients: [{ id: 'i17', name: '黄瓜', qty: '2', unit: '根' }, { id: 'i18', name: '蒜', qty: '3', unit: '瓣' }, { id: 'i19', name: '醋', qty: '1', unit: '勺' }] },
  { id: 's8', name: '蒜蓉西兰花', category: '素菜', ingredients: [{ id: 'i20', name: '西兰花', qty: '1', unit: '朵' }, { id: 'i21', name: '蒜', qty: '4', unit: '瓣' }] },
  { id: 's9', name: '冬瓜排骨汤', category: '汤', ingredients: [{ id: 'i22', name: '冬瓜', qty: '300', unit: 'g' }, { id: 'i23', name: '排骨', qty: '300', unit: 'g' }] },
]

function loadLocal(): DishWithIngredients[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : SAMPLE_DISHES
  } catch {
    return SAMPLE_DISHES
  }
}

function saveLocal(dishes: DishWithIngredients[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dishes))
}

function genId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useDishes() {
  const [dishes, setDishes] = useState<DishWithIngredients[]>([])
  const [loading, setLoading] = useState(true)
  const [useSupabase, setUseSupabase] = useState(false)

  // Load: use Supabase only when authenticated, otherwise localStorage
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session) {
          const { data, error } = await supabase
            .from('dishes')
            .select('id, name, category, ingredients(id, name, qty, unit)')

          if (!error && data && !cancelled) {
            const mapped: DishWithIngredients[] = data.map((d) => ({
              id: d.id,
              name: d.name,
              category: d.category ?? '家常菜',
              ingredients: (d.ingredients ?? []).map((i: { id: string; name: string; qty: number | null; unit: string | null }) => ({
                id: i.id,
                name: i.name,
                qty: i.qty != null ? String(i.qty) : '',
                unit: i.unit ?? '',
              })),
            }))
            setDishes(mapped)
            setUseSupabase(true)
            setLoading(false)
            return
          }
        }
      } catch {
        // Supabase unavailable or no auth
      }
      if (!cancelled) {
        setDishes(loadLocal())
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Persist to localStorage whenever dishes change (for offline use)
  useEffect(() => {
    if (!loading) saveLocal(dishes)
  }, [dishes, loading])

  const addDish = useCallback(async (form: DishFormData) => {
    const id = genId()
    const ingredients = form.ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({ id: genId(), name: i.name.trim(), qty: i.qty, unit: i.unit }))

    const newDish: DishWithIngredients = { id, name: form.name, category: form.category, ingredients }

    if (useSupabase) {
      try {
        const { data: session } = await supabase.auth.getSession()
        const familyId = session?.session
          ? (await supabase.rpc('get_my_family_id')).data
          : null

        if (familyId) {
          const { data: dishRow, error: dishErr } = await supabase
            .from('dishes')
            .insert({ name: form.name, category: form.category, family_id: familyId })
            .select('id')
            .single()

          if (!dishErr && dishRow) {
            newDish.id = dishRow.id
            if (ingredients.length > 0) {
              await supabase.from('ingredients').insert(
                ingredients.map((i) => ({
                  dish_id: dishRow.id,
                  name: i.name,
                  qty: parseFloat(i.qty) || null,
                  unit: i.unit || null,
                }))
              )
            }
          }
        }
      } catch {
        // Supabase write failed, local state still updates
      }
    }

    setDishes((prev) => [...prev, newDish])
    return newDish
  }, [useSupabase])

  const updateDish = useCallback(async (id: string, form: DishFormData) => {
    const ingredients = form.ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({ id: genId(), name: i.name.trim(), qty: i.qty, unit: i.unit }))

    if (useSupabase) {
      try {
        await supabase.from('dishes').update({ name: form.name, category: form.category }).eq('id', id)
        await supabase.from('ingredients').delete().eq('dish_id', id)
        if (ingredients.length > 0) {
          await supabase.from('ingredients').insert(
            ingredients.map((i) => ({
              dish_id: id,
              name: i.name,
              qty: parseFloat(i.qty) || null,
              unit: i.unit || null,
            }))
          )
        }
      } catch {
        // fallback
      }
    }

    setDishes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: form.name, category: form.category, ingredients } : d))
    )
  }, [useSupabase])

  const deleteDish = useCallback(async (id: string) => {
    if (useSupabase) {
      try {
        await supabase.from('dishes').delete().eq('id', id)
      } catch {
        // fallback
      }
    }
    setDishes((prev) => prev.filter((d) => d.id !== id))
  }, [useSupabase])

  return { dishes, loading, addDish, updateDish, deleteDish }
}
