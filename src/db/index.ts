import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { DailyGoals, DailySummary, FoodEntry, Recipe } from '../types'

interface FitnessPalDB extends DBSchema {
  entries: {
    key: string
    value: FoodEntry
    indexes: { 'by-date': string }
  }
  goals: {
    key: string
    value: DailyGoals
  }
  recipes: {
    key: string
    value: Recipe
  }
}

const DB_NAME = 'fitnesspal'
const DB_VERSION = 1

const DEFAULT_GOALS: DailyGoals = {
  id: 'daily-goals',
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
  sugar: 50,
}

let dbPromise: Promise<IDBPDatabase<FitnessPalDB>> | null = null

function getDb(): Promise<IDBPDatabase<FitnessPalDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FitnessPalDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const entries = db.createObjectStore('entries', { keyPath: 'id' })
        entries.createIndex('by-date', 'date')
        db.createObjectStore('goals', { keyPath: 'id' })
        db.createObjectStore('recipes', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function fetchEntriesByDate(date: string): Promise<FoodEntry[]> {
  const db = await getDb()
  const entries = await db.getAllFromIndex('entries', 'by-date', date)
  return entries.sort((a, b) => b.timestamp - a.timestamp)
}

export async function fetchEntriesInRange(start: string, end: string): Promise<FoodEntry[]> {
  const db = await getDb()
  const all = await db.getAll('entries')
  return all.filter((entry) => entry.date >= start && entry.date <= end)
}

export async function createEntry(entry: FoodEntry): Promise<FoodEntry> {
  const db = await getDb()
  await db.put('entries', entry)
  return entry
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('entries', id)
}

export async function fetchDailySummaries(start: string, end: string): Promise<DailySummary[]> {
  const entries = await fetchEntriesInRange(start, end)
  const byDate = new Map<string, DailySummary>()

  for (const entry of entries) {
    let summary = byDate.get(entry.date)
    if (!summary) {
      summary = {
        date: entry.date,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sugar: 0,
        entryCount: 0,
      }
      byDate.set(entry.date, summary)
    }
    summary.calories += entry.calories
    summary.protein += entry.protein
    summary.carbs += entry.carbs
    summary.fat += entry.fat
    summary.sugar += entry.sugar ?? 0
    summary.entryCount += 1
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export async function fetchGoals(): Promise<DailyGoals> {
  const db = await getDb()
  const goals = await db.get('goals', 'daily-goals')
  if (goals) return goals
  await db.put('goals', DEFAULT_GOALS)
  return DEFAULT_GOALS
}

export async function saveGoals(values: Omit<DailyGoals, 'id'>): Promise<void> {
  const db = await getDb()
  await db.put('goals', { id: 'daily-goals', ...values })
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const db = await getDb()
  const recipes = await db.getAll('recipes')
  return recipes.sort((a, b) => b.createdAt - a.createdAt)
}

export async function createRecipe(recipe: Recipe): Promise<Recipe> {
  const db = await getDb()
  await db.put('recipes', recipe)
  return recipe
}

export async function deleteRecipe(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('recipes', id)
}
