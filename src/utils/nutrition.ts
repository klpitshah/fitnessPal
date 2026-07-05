import type { DayStatus, FoodEntry, Macros, MealCategory } from '../types'
import { MEALS } from '../types'

export function todayDateString(): string {
  return dateStringFromDate(new Date())
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDate(dateStr: string): string {
  const today = todayDateString()
  if (dateStr === today) return 'Today'
  const yesterday = dateStringFromDate(new Date(Date.now() - 86400000))
  if (dateStr === yesterday) return 'Yesterday'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function sumMacros(entries: FoodEntry[]): Macros {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
      sugar: acc.sugar + (e.sugar ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0 },
  )
}

export function scaleMacros(per100g: Macros, grams: number): Macros {
  const factor = grams / 100
  return {
    calories: Math.round(per100g.calories * factor),
    protein: Math.round(per100g.protein * factor * 10) / 10,
    carbs: Math.round(per100g.carbs * factor * 10) / 10,
    fat: Math.round(per100g.fat * factor * 10) / 10,
    sugar: Math.round(per100g.sugar * factor * 10) / 10,
  }
}

export function parseServingGrams(servingSize?: string): number | undefined {
  if (!servingSize) return undefined
  const match = servingSize.match(/([\d.]+)\s*g/i)
  if (match) return parseFloat(match[1])
  const mlMatch = servingSize.match(/([\d.]+)\s*ml/i)
  if (mlMatch) return parseFloat(mlMatch[1])
  return undefined
}

export function progressPercent(current: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(100, Math.round((current / goal) * 100))
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function inferMealFromTime(date: Date = new Date()): MealCategory {
  const hour = date.getHours()
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 15) return 'lunch'
  if (hour >= 15 && hour < 21) return 'dinner'
  return 'snack'
}

export function inferMealFromTimestamp(timestamp: number): MealCategory {
  return inferMealFromTime(new Date(timestamp))
}

export function mealLabel(meal: MealCategory): string {
  return MEALS.find((m) => m.id === meal)?.label ?? meal
}

export function normalizeEntry(entry: FoodEntry): FoodEntry {
  return {
    ...entry,
    meal: entry.meal ?? inferMealFromTimestamp(entry.timestamp),
  }
}

export function dateStringFromDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getWeekDates(anchorDate: string): string[] {
  const anchor = new Date(anchorDate + 'T12:00:00')
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - anchor.getDay())

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return dateStringFromDate(date)
  })
}

export function getWeekLabel(weekDates: string[]): string {
  const start = new Date(weekDates[0] + 'T12:00:00')
  const end = new Date(weekDates[6] + 'T12:00:00')
  const startMonth = start.toLocaleDateString(undefined, { month: 'long' })
  const endMonth = end.toLocaleDateString(undefined, { month: 'long' })

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`
  }
  return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export function shiftWeek(anchorDate: string, weeks: number): string {
  const date = new Date(anchorDate + 'T12:00:00')
  date.setDate(date.getDate() + weeks * 7)
  return dateStringFromDate(date)
}

export function weekdayInitial(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'narrow' })
}

export function dayNumber(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getDate()
}

export function getDayStatus(calories: number, goal: number): DayStatus {
  if (calories <= 0) return 'empty'
  const pct = calories / goal
  if (pct > 1.1) return 'over'
  if (pct >= 0.8) return 'good'
  return 'under'
}

export function scaleRecipeMacros(recipe: Macros, servings: number): Macros {
  return {
    calories: Math.round(recipe.calories * servings),
    protein: Math.round(recipe.protein * servings * 10) / 10,
    carbs: Math.round(recipe.carbs * servings * 10) / 10,
    fat: Math.round(recipe.fat * servings * 10) / 10,
    sugar: Math.round(recipe.sugar * servings * 10) / 10,
  }
}

export function groupEntriesByMeal(entries: FoodEntry[]): Map<MealCategory, FoodEntry[]> {
  const groups = new Map<MealCategory, FoodEntry[]>()
  for (const meal of MEALS) {
    groups.set(meal.id, [])
  }
  for (const entry of entries.map(normalizeEntry)) {
    groups.get(entry.meal)!.push(entry)
  }
  for (const [, list] of groups) {
    list.sort((a, b) => a.timestamp - b.timestamp)
  }
  return groups
}
