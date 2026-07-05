import { useState } from 'react'
import type { Recipe } from '../types'
import { generateId } from '../utils/nutrition'

interface RecipeFormProps {
  onSave: (recipe: Recipe) => void
}

export function RecipeForm({ onSave }: RecipeFormProps) {
  const [name, setName] = useState('')
  const [servingDescription, setServingDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [sugar, setSugar] = useState('')
  const [protein, setProtein] = useState('')
  const [expanded, setExpanded] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      id: generateId(),
      name: name.trim(),
      servingDescription: servingDescription.trim() || undefined,
      calories: parseFloat(calories) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      sugar: parseFloat(sugar) || 0,
      protein: parseFloat(protein) || 0,
      createdAt: Date.now(),
    })

    setName('')
    setServingDescription('')
    setCalories('')
    setCarbs('')
    setFat('')
    setSugar('')
    setProtein('')
    setExpanded(false)
  }

  if (!expanded) {
    return (
      <button type="button" className="btn btn--primary btn--full" onClick={() => setExpanded(true)}>
        + New Recipe
      </button>
    )
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <h2 className="section-title">Save Recipe</h2>
      <p className="section-subtitle">Store macros per serving for quick logging later</p>

      <label className="field">
        <span>Recipe name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Overnight oats"
          required
        />
      </label>

      <label className="field">
        <span>Serving size (optional)</span>
        <input
          type="text"
          value={servingDescription}
          onChange={(e) => setServingDescription(e.target.value)}
          placeholder="e.g. 1 bowl"
        />
      </label>

      <label className="field">
        <span>Calories</span>
        <input type="number" inputMode="decimal" value={calories} onChange={(e) => setCalories(e.target.value)} min="0" />
      </label>

      <div className="macro-inputs">
        <label className="field field--compact">
          <span>Carbs (g)</span>
          <input type="number" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} min="0" step="0.1" />
        </label>
        <label className="field field--compact">
          <span>Fat (g)</span>
          <input type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} min="0" step="0.1" />
        </label>
        <label className="field field--compact">
          <span>Sugar (g)</span>
          <input type="number" inputMode="decimal" value={sugar} onChange={(e) => setSugar(e.target.value)} min="0" step="0.1" />
        </label>
        <label className="field field--compact">
          <span>Protein (g)</span>
          <input type="number" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} min="0" step="0.1" />
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--secondary" onClick={() => setExpanded(false)}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          Save Recipe
        </button>
      </div>
    </form>
  )
}
