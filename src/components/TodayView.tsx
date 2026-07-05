import { MacroSummary } from './MacroBar'
import { FoodLogList } from './FoodLogList'
import { WeekStrip } from './WeekStrip'
import type { DailyGoals, DailySummary, FoodEntry } from '../types'
import { formatDate, getWeekDates, sumMacros, todayDateString } from '../utils/nutrition'

interface TodayViewProps {
  entries: FoodEntry[]
  goals: DailyGoals
  loading: boolean
  selectedDate: string
  weekAnchor: string
  summaries: Map<string, DailySummary>
  onSelectDate: (date: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
  onDelete: (id: string) => void
}

export function TodayView({
  entries,
  goals,
  loading,
  selectedDate,
  weekAnchor,
  summaries,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  onDelete,
}: TodayViewProps) {
  const totals = sumMacros(entries)
  const remaining = goals.calories - totals.calories
  const isToday = selectedDate === todayDateString()
  const weekDates = getWeekDates(weekAnchor)

  return (
    <div className="today-view">
      <header className="page-header">
        <h1 className="page-header__title">FitnessPal</h1>
        <p className="page-header__subtitle">{formatDate(selectedDate)}</p>
      </header>

      <WeekStrip
        weekDates={weekDates}
        selectedDate={selectedDate}
        summaries={summaries}
        calorieGoal={goals.calories}
        onSelectDate={onSelectDate}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onToday={onToday}
      />

      <div className="calorie-ring-card card card--hero">
        <div className="calorie-ring-card__main">
          <span className="calorie-ring-card__remaining">
            {remaining >= 0 ? Math.round(remaining) : `+${Math.round(-remaining)}`}
          </span>
          <span className="calorie-ring-card__label">
            {remaining >= 0 ? 'calories remaining' : 'calories over'}
          </span>
        </div>
        <div className="calorie-ring-card__stats">
          <div>
            <span className="stat-value">{Math.round(totals.calories)}</span>
            <span className="stat-label">eaten</span>
          </div>
          <div>
            <span className="stat-value">{goals.calories}</span>
            <span className="stat-label">goal</span>
          </div>
        </div>
      </div>

      <MacroSummary totals={totals} goals={goals} />

      <h2 className="section-title">{isToday ? "Today's Food" : 'Food Log'}</h2>
      <FoodLogList entries={entries} loading={loading} onDelete={onDelete} />
    </div>
  )
}
