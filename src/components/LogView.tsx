import { AddFoodForm } from './AddFoodForm'
import { MacroSummary } from './MacroBar'
import { FoodLogList } from './FoodLogList'
import type { DailyGoals, FoodEntry } from '../types'
import { sumMacros } from '../utils/nutrition'

interface LogViewProps {
  entries: FoodEntry[]
  goals: DailyGoals
  loading: boolean
  onSubmit: (entry: FoodEntry) => void
  onDelete: (id: string) => void
  logDate: string
}

export function LogView({ entries, goals, loading, onSubmit, onDelete, logDate }: LogViewProps) {
  const totals = sumMacros(entries)

  return (
    <div className="log-view">
      <header className="page-header">
        <h1 className="page-header__title">Log food</h1>
        <p className="page-header__subtitle">Add meals and track today&apos;s intake</p>
      </header>

      <div className="day-snapshot card">
        <div className="day-snapshot__main">
          <span className="day-snapshot__value">{Math.round(totals.calories)}</span>
          <span className="day-snapshot__label">calories today</span>
        </div>
        <MacroSummary totals={totals} goals={goals} compact />
      </div>

      <AddFoodForm logDate={logDate} onSubmit={onSubmit} />

      <h2 className="section-title">Today&apos;s entries</h2>
      <FoodLogList entries={entries} loading={loading} onDelete={onDelete} grouped={false} />
    </div>
  )
}
