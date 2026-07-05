import { useState } from 'react'
import type { FoodEntry, MealCategory, ScannedProduct } from '../types'
import { generateId, inferMealFromTime, scaleMacros } from '../utils/nutrition'
import { MealPicker } from './MealPicker'

type EntryMode = 'servings' | 'grams'

interface ProductEntryProps {
  product: ScannedProduct
  logDate: string
  onSubmit: (entry: FoodEntry) => void
  onCancel: () => void
}

export function ProductEntry({ product, logDate, onSubmit, onCancel }: ProductEntryProps) {
  const hasServing = !!product.servingSizeGrams
  const [mode, setMode] = useState<EntryMode>(hasServing ? 'servings' : 'grams')
  const [servings, setServings] = useState('1')
  const [grams, setGrams] = useState(String(product.servingSizeGrams ?? 100))
  const [meal, setMeal] = useState<MealCategory>(() => inferMealFromTime())
  const [time, setTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })

  const gramsAmount =
    mode === 'servings'
      ? (parseFloat(servings) || 0) * (product.servingSizeGrams ?? 100)
      : parseFloat(grams) || 0

  const macros = scaleMacros(product.per100g, gramsAmount)

  const servingLabel = product.servingDescription ?? `${product.servingSizeGrams ?? 100}g`

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (gramsAmount <= 0) return

    const [hours, minutes] = time.split(':').map(Number)
    const timestamp = new Date()
    timestamp.setHours(hours, minutes, 0, 0)

    let servingDescription: string
    if (mode === 'servings') {
      const count = parseFloat(servings) || 1
      servingDescription = `${count} serving${count !== 1 ? 's' : ''} (${Math.round(gramsAmount)}g)`
    } else {
      servingDescription = `${Math.round(gramsAmount)}g`
    }

    onSubmit({
      id: generateId(),
      name: product.brand ? `${product.name} (${product.brand})` : product.name,
      timestamp: timestamp.getTime(),
      date: logDate,
      meal,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      sugar: macros.sugar,
      servingDescription,
      barcode: product.barcode,
    })
  }

  return (
    <form className="product-entry" onSubmit={handleSubmit}>
      <h2 className="section-title">{product.name}</h2>
      {product.brand && <p className="product-entry__brand">{product.brand}</p>}

      <div className="product-entry__per100g">
        <span>Per 100g:</span>
        <span>{Math.round(product.per100g.calories)} cal</span>
        <span>C {product.per100g.carbs}g</span>
        <span>F {product.per100g.fat}g</span>
        <span>S {product.per100g.sugar}g</span>
        <span>P {product.per100g.protein}g</span>
      </div>

      <div className="entry-mode-toggle">
        {hasServing && (
          <button
            type="button"
            className={`entry-mode-toggle__btn ${mode === 'servings' ? 'entry-mode-toggle__btn--active' : ''}`}
            onClick={() => setMode('servings')}
          >
            Servings
          </button>
        )}
        <button
          type="button"
          className={`entry-mode-toggle__btn ${mode === 'grams' ? 'entry-mode-toggle__btn--active' : ''}`}
          onClick={() => setMode('grams')}
        >
          Weight (g)
        </button>
      </div>

      {mode === 'servings' && hasServing ? (
        <label className="field">
          <span>Number of servings ({servingLabel} each)</span>
          <input
            type="number"
            inputMode="decimal"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            min="0.1"
            step="0.1"
            required
          />
        </label>
      ) : (
        <label className="field">
          <span>Weight in grams</span>
          <input
            type="number"
            inputMode="decimal"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            min="1"
            step="1"
            required
          />
        </label>
      )}

      <MealPicker value={meal} onChange={setMeal} />

      <label className="field">
        <span>Time eaten</span>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </label>

      <div className="product-entry__preview">
        <h3>You'll log:</h3>
        <div className="product-entry__macros">
          <span className="product-entry__calories">{macros.calories} cal</span>
          <span>Carbs {macros.carbs}g</span>
          <span>Fat {macros.fat}g</span>
          <span>Sugar {macros.sugar}g</span>
          <span>Protein {macros.protein}g</span>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          Add to Log
        </button>
      </div>
    </form>
  )
}
