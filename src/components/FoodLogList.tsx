import type { FoodEntry } from '../types'
import { MEALS } from '../types'
import { formatTime, groupEntriesByMeal, mealLabel, normalizeEntry, sumMacros } from '../utils/nutrition'

interface FoodEntryCardProps {
  entry: FoodEntry
  onDelete: (id: string) => void
}

export function FoodEntryCard({ entry, onDelete }: FoodEntryCardProps) {
  const normalized = normalizeEntry(entry)

  return (
    <div className="food-entry">
      <div className="food-entry__main">
        <div className="food-entry__header">
          <span className="food-entry__name">{normalized.name}</span>
          <span className="food-entry__time">{formatTime(normalized.timestamp)}</span>
        </div>
        {normalized.servingDescription && (
          <span className="food-entry__serving">{normalized.servingDescription}</span>
        )}
        <div className="food-entry__chips">
          <span className="macro-chip macro-chip--cal">{Math.round(normalized.calories)} cal</span>
          <span className="macro-chip macro-chip--carbs">C {normalized.carbs}g</span>
          <span className="macro-chip macro-chip--fat">F {normalized.fat}g</span>
          <span className="macro-chip macro-chip--sugar">S {normalized.sugar ?? 0}g</span>
          <span className="macro-chip macro-chip--protein">P {normalized.protein}g</span>
        </div>
      </div>
      <button
        type="button"
        className="food-entry__delete"
        onClick={() => onDelete(normalized.id)}
        aria-label={`Delete ${normalized.name}`}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

interface FoodLogListProps {
  entries: FoodEntry[]
  loading: boolean
  onDelete: (id: string) => void
  grouped?: boolean
}

export function FoodLogList({ entries, loading, onDelete, grouped = true }: FoodLogListProps) {
  if (loading) {
    return <p className="empty-state">Loading...</p>
  }

  if (entries.length === 0) {
    return (
      <p className="empty-state">
        No food logged yet today. Tap Scan or add food manually.
      </p>
    )
  }

  if (!grouped) {
    return (
      <div className="food-log-list">
        {entries.map((entry) => (
          <FoodEntryCard key={entry.id} entry={entry} onDelete={onDelete} />
        ))}
      </div>
    )
  }

  const groups = groupEntriesByMeal(entries)

  return (
    <div className="food-log-grouped">
      {MEALS.map(({ id }) => {
        const mealEntries = groups.get(id)!
        if (mealEntries.length === 0) return null

        const mealTotals = sumMacros(mealEntries)

        return (
          <section key={id} className="meal-group">
            <div className="meal-group__header">
              <h3 className="meal-group__title">{mealLabel(id)}</h3>
              <span className="meal-group__total">{Math.round(mealTotals.calories)} cal</span>
            </div>
            <div className="food-log-list">
              {mealEntries.map((entry) => (
                <FoodEntryCard key={entry.id} entry={entry} onDelete={onDelete} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
