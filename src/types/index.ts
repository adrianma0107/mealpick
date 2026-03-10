export interface Dish {
  id: string
  name: string
  category: string
  tags: string[]
  imageUrl?: string
  ingredients: string[]
  note?: string
}

export interface MealPlan {
  date: string // YYYY-MM-DD
  meals: {
    breakfast: Dish[]
    lunch: Dish[]
    dinner: Dish[]
  }
}

export interface ShoppingItem {
  id: string
  name: string
  quantity: string
  unit: string
  checked: boolean
  dishId?: string
}
