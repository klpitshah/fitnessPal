import { useState } from 'react'
import type { FoodEntry, MealCategory } from '../types'
import { generateId, inferMealFromTime } from '../utils/nutrition'
import { MealPicker } from './MealPicker'

interface AddFoodFormProps {
  logDate: string
  onSubmit: (entry: FoodEntry) => void
  onCancel?: () => void
}

const NUTRIENT_FIELDS = [
  { key: 'carbs', label: 'Carbs', color: 'carbs' },
  { key: 'fat', label: 'Fat', color: 'fat' },
  { key: 'sugar', label: 'Sugar', color: 'sugar' },
  { key: 'protein', label: 'Protein', color: 'protein' },
] as const

export function AddFoodForm({ logDate, onSubmit, onCancel }: AddFoodFormProps) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [sugar, setSugar] = useState('')
  const [protein, setProtein] = useState('')
  const [meal, setMeal] = useState<MealCategory>(() => inferMealFromTime())
  const [time, setTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })

  const values = { carbs, fat, sugar, protein }
  const setters = { carbs: setCarbs, fat: setFat, sugar: setSugar, protein: setProtein }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const [hours, minutes] = time.split(':').map(Number)
    const timestamp = new Date()
    timestamp.setHours(hours, minutes, 0, 0)

    onSubmit({
      id: generateId(),
      name: name.trim(),
      timestamp: timestamp.getTime(),
      date: logDate,
      meal,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      sugar: parseFloat(sugar) || 0,
    })

    setName('')
    setCalories('')
    setCarbs('')
    setFat('')
    setSugar('')
    setProtein('')
  }

  return (
    <form className="card card--form" onSubmit={handleSubmit}>
      <div className="card__header">
        <h2 className="card__title">Add food</h2>
        <p className="card__subtitle">Log a meal manually</p>
      </div>

      <label className="field">
        <span className="field-label">Food name</span>
        <input
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Chicken breast, banana…"
          required
        />
      </label>

      <div className="form-row">
        <label className="field field--half">
          <span className="field-label">Time</span>
          <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>

      <MealPicker value={meal} onChange={setMeal} />

      <label className="calorie-field">
        <span className="field-label">Calories</span>
        <input
          type="number"
          inputMode="decimal"
          className="calorie-field__input"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="0"
          min="0"
        />
      </label>

      <p className="field-group-label">Macros (grams)</p>
      <div className="nutrient-grid">
        {NUTRIENT_FIELDS.map(({ key, label, color }) => (
          <label key={key} className={`nutrient-field nutrient-field--${color}`}>
            <span className="nutrient-field__label">{label}</span>
            <input
              type="number"
              inputMode="decimal"
              className="nutrient-field__input"
              value={values[key]}
              onChange={(e) => setters[key](e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </label>
        ))}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn--primary">
          Log food
        </button>
      </div>
    </form>
  )
}
