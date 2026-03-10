import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { DishWithIngredients } from '../hooks/useDishes'
import { useUser } from './UserContext'

// ── Helpers ──────────────────────────────────────────────────────
function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
}

function genId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ── Types ────────────────────────────────────────────────────────
export interface ExtraItem {
  id: string
  name: string
  qty: string
  unit: string
}

export interface WeeklyData {
  weekStart: string
  orders: Record<string, string[]>       // userId -> dishId[]
  confirmedDishes: string[]               // dishId[]
  removedDishes: string[]                 // dishId[]
  completedDishes: Record<string, string> // dishName -> date
  boughtItems: Record<string, boolean>    // ingredientKey -> bought
  extraItems: ExtraItem[]                 // manually added items
}

interface WeekContextValue {
  weekStart: string
  weekRange: string
  myOrders: string[]
  toggleDish: (dishId: string) => void
  submitOrders: () => void
  hasSubmitted: boolean
  allOrders: Record<string, string[]>
  confirmedDishes: string[]
  removedDishes: string[]
  confirmDish: (dishId: string) => void
  removeDish: (dishId: string) => void
  markCompleted: (dishName: string) => void
  completedDishes: Record<string, string>
  boughtItems: Record<string, boolean>
  toggleBought: (key: string) => void
  extraItems: ExtraItem[]
  addExtraItem: (name: string, qty: string, unit: string) => void
  removeExtraItem: (id: string) => void
  getOrderSummary: (dishes: DishWithIngredients[]) => { dishId: string; people: string[] }[]
  resolveUserName: (userId: string) => string
}

const STORAGE_KEY = 'mealpick_week'

function loadWeek(weekStart: string): WeeklyData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data: WeeklyData = JSON.parse(raw)
      if (data.weekStart === weekStart) {
        if (!data.extraItems) data.extraItems = []
        return data
      }
    }
  } catch { /* ignore */ }
  return {
    weekStart,
    orders: {},
    confirmedDishes: [],
    removedDishes: [],
    completedDishes: {},
    boughtItems: {},
    extraItems: [],
  }
}

function saveWeek(data: WeeklyData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ── Context ──────────────────────────────────────────────────────
const WeekContext = createContext<WeekContextValue | null>(null)

export function useWeek() {
  const ctx = useContext(WeekContext)
  if (!ctx) throw new Error('useWeek must be inside WeekProvider')
  return ctx
}

export function WeekProvider({ children }: { children: ReactNode }) {
  const { deviceId, name: userName, familyMembers } = useUser()
  const today = new Date()
  const weekStart = getMonday(today)
  const weekRange = formatWeekRange(weekStart)

  const [data, setData] = useState<WeeklyData>(() => loadWeek(weekStart))
  const [hasSubmitted, setHasSubmitted] = useState(() => {
    const d = loadWeek(weekStart)
    return (d.orders[deviceId] ?? []).length > 0
  })
  const [localSelections, setLocalSelections] = useState<string[]>(() => {
    const d = loadWeek(weekStart)
    return d.orders[deviceId] ?? []
  })

  // Persist
  useEffect(() => {
    saveWeek(data)
  }, [data])

  // Resolve userId → display name
  const resolveUserName = useCallback((userId: string): string => {
    if (userId === deviceId) return userName
    const member = familyMembers.find(m => m.id === userId)
    return member?.name ?? userId.slice(0, 6)
  }, [deviceId, userName, familyMembers])

  const toggleDish = useCallback((dishId: string) => {
    setLocalSelections(prev =>
      prev.includes(dishId) ? prev.filter(id => id !== dishId) : [...prev, dishId]
    )
  }, [])

  const submitOrders = useCallback(() => {
    setData(prev => ({
      ...prev,
      orders: { ...prev.orders, [deviceId]: localSelections },
    }))
    setHasSubmitted(true)
  }, [deviceId, localSelections])

  const confirmDish = useCallback((dishId: string) => {
    setData(prev => ({
      ...prev,
      confirmedDishes: prev.confirmedDishes.includes(dishId) ? prev.confirmedDishes : [...prev.confirmedDishes, dishId],
    }))
  }, [])

  const removeDish = useCallback((dishId: string) => {
    setData(prev => ({
      ...prev,
      removedDishes: prev.removedDishes.includes(dishId) ? prev.removedDishes : [...prev.removedDishes, dishId],
      confirmedDishes: prev.confirmedDishes.filter(id => id !== dishId),
    }))
  }, [])

  const markCompleted = useCallback((dishName: string) => {
    setData(prev => ({
      ...prev,
      completedDishes: { ...prev.completedDishes, [dishName]: new Date().toISOString().slice(0, 10) },
    }))
  }, [])

  const toggleBought = useCallback((key: string) => {
    setData(prev => ({
      ...prev,
      boughtItems: { ...prev.boughtItems, [key]: !prev.boughtItems[key] },
    }))
  }, [])

  const addExtraItem = useCallback((name: string, qty: string, unit: string) => {
    setData(prev => ({
      ...prev,
      extraItems: [...prev.extraItems, { id: genId(), name, qty, unit }],
    }))
  }, [])

  const removeExtraItem = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      extraItems: prev.extraItems.filter(item => item.id !== id),
      boughtItems: { ...prev.boughtItems, [`extra_${id}`]: false },
    }))
  }, [])

  const getOrderSummary = useCallback((_dishes: DishWithIngredients[]) => {
    const allOrders = data.orders
    const summary: Record<string, string[]> = {}
    Object.entries(allOrders).forEach(([userId, ids]) => {
      ids.forEach(id => {
        if (data.removedDishes.includes(id)) return
        if (!summary[id]) summary[id] = []
        summary[id].push(userId)
      })
    })
    return Object.entries(summary)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([dishId, people]) => ({ dishId, people }))
  }, [data.orders, data.removedDishes])

  return (
    <WeekContext.Provider value={{
      weekStart,
      weekRange,
      myOrders: localSelections,
      toggleDish,
      submitOrders,
      hasSubmitted,
      allOrders: data.orders,
      confirmedDishes: data.confirmedDishes,
      removedDishes: data.removedDishes,
      confirmDish,
      removeDish,
      markCompleted,
      completedDishes: data.completedDishes,
      boughtItems: data.boughtItems,
      toggleBought,
      extraItems: data.extraItems,
      addExtraItem,
      removeExtraItem,
      getOrderSummary,
      resolveUserName,
    }}>
      {children}
    </WeekContext.Provider>
  )
}
