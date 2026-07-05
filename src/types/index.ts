export interface Nutrients {
  protein: number
  carbs: number
  fat: number
  sugar: number
}

export interface Macros extends Nutrients {
  calories: number
}

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEALS: { id: MealCategory; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
]

export interface FoodEntry {
  id: string
  name: string
  timestamp: number
  date: string
  meal: MealCategory
  calories: number
  protein: number
  carbs: number
  fat: number
  sugar: number
  servingDescription?: string
  barcode?: string
}

export interface DailyGoals extends Macros {
  id: 'daily-goals'
}

export interface ScannedProduct {
  barcode: string
  name: string
  brand?: string
  per100g: Macros
  servingSizeGrams?: number
  servingDescription?: string
}

export interface Recipe {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sugar: number
  servingDescription?: string
  createdAt: number
}

export interface DailySummary {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sugar: number
  entryCount: number
}

export type DayStatus = 'empty' | 'under' | 'good' | 'over'

export type Tab = 'today' | 'log' | 'scan' | 'recipes' | 'goals'
