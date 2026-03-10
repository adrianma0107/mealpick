export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type UserRole  = 'admin' | 'member'

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id:          string
          name:        string
          invite_code: string
          created_at:  string
        }
        Insert: {
          id?:         string
          name:        string
          invite_code?: string
          created_at?: string
        }
        Update: {
          id?:         string
          name?:       string
          invite_code?: string
          created_at?: string
        }
        Relationships: []
      }

      users: {
        Row: {
          id:         string
          name:       string
          family_id:  string | null
          role:       UserRole
          created_at: string
        }
        Insert: {
          id:          string
          name:        string
          family_id?:  string | null
          role?:       UserRole
          created_at?: string
        }
        Update: {
          id?:        string
          name?:      string
          family_id?: string | null
          role?:      UserRole
          created_at?: string
        }
        Relationships: []
      }

      dishes: {
        Row: {
          id:         string
          name:       string
          category:   string | null
          family_id:  string
          created_at: string
        }
        Insert: {
          id?:        string
          name:       string
          category?:  string | null
          family_id:  string
          created_at?: string
        }
        Update: {
          id?:        string
          name?:      string
          category?:  string | null
          family_id?: string
          created_at?: string
        }
        Relationships: []
      }

      ingredients: {
        Row: {
          id:      string
          dish_id: string
          name:    string
          qty:     number | null
          unit:    string | null
        }
        Insert: {
          id?:     string
          dish_id: string
          name:    string
          qty?:    number | null
          unit?:   string | null
        }
        Update: {
          id?:     string
          dish_id?: string
          name?:   string
          qty?:    number | null
          unit?:   string | null
        }
        Relationships: []
      }

      weekly_orders: {
        Row: {
          id:         string
          family_id:  string
          week_start: string
          user_id:    string
          dish_id:    string
          created_at: string
        }
        Insert: {
          id?:        string
          family_id:  string
          week_start: string
          user_id:    string
          dish_id:    string
          created_at?: string
        }
        Update: {
          id?:        string
          family_id?: string
          week_start?: string
          user_id?:   string
          dish_id?:   string
          created_at?: string
        }
        Relationships: []
      }

      calendar_entries: {
        Row: {
          id:         string
          family_id:  string
          date:       string
          meal_type:  MealType
          dish_id:    string
          created_at: string
        }
        Insert: {
          id?:        string
          family_id:  string
          date:       string
          meal_type?: MealType
          dish_id:    string
          created_at?: string
        }
        Update: {
          id?:        string
          family_id?: string
          date?:      string
          meal_type?: MealType
          dish_id?:   string
          created_at?: string
        }
        Relationships: []
      }
    }

    Views: {
      v_family_dishes: {
        Row: {
          dish_id:          string
          dish_name:        string
          category:         string | null
          family_id:        string
          dish_created_at:  string
          ingredients:      Json | null
        }
        Relationships: []
      }
    }

    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ── Convenience row types ──────────────────────────────────────
export type Family         = Database['public']['Tables']['families']['Row']
export type UserProfile    = Database['public']['Tables']['users']['Row']
export type Dish           = Database['public']['Tables']['dishes']['Row']
export type Ingredient     = Database['public']['Tables']['ingredients']['Row']
export type WeeklyOrder    = Database['public']['Tables']['weekly_orders']['Row']
export type CalendarEntry  = Database['public']['Tables']['calendar_entries']['Row']
export type FamilyDishView = Database['public']['Views']['v_family_dishes']['Row']
