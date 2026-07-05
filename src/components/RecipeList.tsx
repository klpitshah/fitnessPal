import { useState } from 'react'
import type { FoodEntry, MealCategory, Recipe } from '../types'
import {
  generateId,
  inferMealFromTime,
  scaleRecipeMacros,
} from '../utils/nutrition'
import { MealPicker } from './MealPicker'

interface RecipeListProps {
  recipes: Recipe[]
  loading: boolean
  logDate: string
  onLog: (entry: FoodEntry) => void
  onDelete: (id: string) => void
}

export function RecipeList({ recipes, loading, logDate, onLog, onDelete }: RecipeListProps) {
  const [loggingId, setLoggingId] = useState<string | null>(null)
  const [servings, setServings] = useState('1')
  const [meal, setMeal] = useState<MealCategory>(() => inferMealFromTime())

  if (loading) {
    return <p className="empty-state">Loading recipes...</p>
  }

  if (recipes.length === 0) {
    return (
      <p className="empty-state">
        No saved recipes yet. Create one above to log meals in one tap.
      </p>
    )
  }

  function startLog(recipe: Recipe) {
    setLoggingId(recipe.id)
    setServings('1')
    setMeal(inferMealFromTime())
  }

  function confirmLog(recipe: Recipe) {
    const count = parseFloat(servings) || 1
    const macros = scaleRecipeMacros(recipe, count)
    const now = new Date()

    onLog({
      id: generateId(),
      name: recipe.name,
      timestamp: now.getTime(),
      date: logDate,
      meal,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      sugar: macros.sugar,
      servingDescription: recipe.servingDescription
        ? `${count} × ${recipe.servingDescription}`
        : `${count} serving${count !== 1 ? 's' : ''}`,
    })

    setLoggingId(null)
  }

  return (
    <div className="recipe-list">
      {recipes.map((recipe) => (
        <div key={recipe.id} className="recipe-card">
          <div className="recipe-card__main">
            <span className="recipe-card__name">{recipe.name}</span>
            {recipe.servingDescription && (
              <span className="recipe-card__serving">Per {recipe.servingDescription}</span>
            )}
            <div className="recipe-card__macros">
              <span className="recipe-card__calories">{Math.round(recipe.calories)} cal</span>
              <span>C {recipe.carbs}g</span>
              <span>F {recipe.fat}g</span>
              <span>S {recipe.sugar ?? 0}g</span>
              <span>P {recipe.protein}g</span>
            </div>
          </div>

          {loggingId === recipe.id ? (
            <div className="recipe-card__log-panel">
              <label className="field field--compact">
                <span>Servings</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  min="0.1"
                  step="0.1"
                />
              </label>
              <MealPicker value={meal} onChange={setMeal} />
              <div className="form-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setLoggingId(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn--primary" onClick={() => confirmLog(recipe)}>
                  Log
                </button>
              </div>
            </div>
          ) : (
            <div className="recipe-card__actions">
              <button type="button" className="btn btn--primary btn--sm" onClick={() => startLog(recipe)}>
                Log
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onDelete(recipe.id)}
                aria-label={`Delete ${recipe.name}`}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
