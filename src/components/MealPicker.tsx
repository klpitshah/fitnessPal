import type { MealCategory } from '../types'
import { MEALS } from '../types'

interface MealPickerProps {
  value: MealCategory
  onChange: (meal: MealCategory) => void
}

export function MealPicker({ value, onChange }: MealPickerProps) {
  return (
    <div className="meal-picker">
      <span className="field-label">Meal</span>
      <div className="meal-picker__track" role="group" aria-label="Meal">
        {MEALS.map((meal) => (
          <button
            key={meal.id}
            type="button"
            className={`meal-picker__btn ${value === meal.id ? 'meal-picker__btn--active' : ''}`}
            onClick={() => onChange(meal.id)}
          >
            {meal.label}
          </button>
        ))}
      </div>
    </div>
  )
}
