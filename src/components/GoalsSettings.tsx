import { useState } from 'react'
import type { DailyGoals } from '../types'

interface GoalsSettingsProps {
  goals: DailyGoals
  onSave: (goals: Omit<DailyGoals, 'id'>) => void
}

export function GoalsSettings({ goals, onSave }: GoalsSettingsProps) {
  const [calories, setCalories] = useState(String(goals.calories))
  const [carbs, setCarbs] = useState(String(goals.carbs))
  const [fat, setFat] = useState(String(goals.fat))
  const [sugar, setSugar] = useState(String(goals.sugar ?? 50))
  const [protein, setProtein] = useState(String(goals.protein))
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      calories: parseFloat(calories) || 2000,
      carbs: parseFloat(carbs) || 200,
      fat: parseFloat(fat) || 65,
      sugar: parseFloat(sugar) || 50,
      protein: parseFloat(protein) || 150,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form className="card card--form goals-settings" onSubmit={handleSubmit}>
      <div className="card__header">
        <h2 className="card__title">Daily goals</h2>
        <p className="card__subtitle">Calorie and macro targets</p>
      </div>

      <label className="field">
        <span className="field-label">Calorie goal</span>
        <input
          type="number"
          inputMode="numeric"
          className="input"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          min="500"
          step="50"
        />
      </label>

      <p className="field-group-label">Macros (grams)</p>
      <div className="nutrient-grid">
        <label className="field field--compact nutrient-field nutrient-field--carbs">
          <span className="nutrient-field__label">Carbs</span>
          <input type="number" inputMode="decimal" className="nutrient-field__input" value={carbs} onChange={(e) => setCarbs(e.target.value)} min="0" />
        </label>
        <label className="field field--compact nutrient-field nutrient-field--fat">
          <span className="nutrient-field__label">Fat</span>
          <input type="number" inputMode="decimal" className="nutrient-field__input" value={fat} onChange={(e) => setFat(e.target.value)} min="0" />
        </label>
        <label className="field field--compact nutrient-field nutrient-field--sugar">
          <span className="nutrient-field__label">Sugar</span>
          <input type="number" inputMode="decimal" className="nutrient-field__input" value={sugar} onChange={(e) => setSugar(e.target.value)} min="0" />
        </label>
        <label className="field field--compact nutrient-field nutrient-field--protein">
          <span className="nutrient-field__label">Protein</span>
          <input type="number" inputMode="decimal" className="nutrient-field__input" value={protein} onChange={(e) => setProtein(e.target.value)} min="0" />
        </label>
      </div>

      <button type="submit" className="btn btn--primary btn--full">
        {saved ? 'Saved!' : 'Save Goals'}
      </button>

      <p className="auth-footnote">
        All food logs, recipes, and goals are saved on this device.
      </p>
    </form>
  )
}
