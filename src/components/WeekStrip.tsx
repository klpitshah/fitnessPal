import type { DailySummary } from '../types'
import {
  dayNumber,
  getDayStatus,
  getWeekLabel,
  todayDateString,
  weekdayInitial,
} from '../utils/nutrition'

interface WeekStripProps {
  weekDates: string[]
  selectedDate: string
  summaries: Map<string, DailySummary>
  calorieGoal: number
  onSelectDate: (date: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
}

export function WeekStrip({
  weekDates,
  selectedDate,
  summaries,
  calorieGoal,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onToday,
}: WeekStripProps) {
  const today = todayDateString()
  const isCurrentWeek = weekDates.includes(today)

  return (
    <div className="week-strip">
      <div className="week-strip__header">
        <button type="button" className="week-strip__nav-btn" onClick={onPrevWeek} aria-label="Previous week">
          ‹
        </button>
        <div className="week-strip__title-wrap">
          <span className="week-strip__title">{getWeekLabel(weekDates)}</span>
          {!isCurrentWeek && (
            <button type="button" className="week-strip__today-btn" onClick={onToday}>
              Today
            </button>
          )}
        </div>
        <button type="button" className="week-strip__nav-btn" onClick={onNextWeek} aria-label="Next week">
          ›
        </button>
      </div>

      <div className="week-strip__days">
        {weekDates.map((date) => {
          const summary = summaries.get(date)
          const calories = summary?.calories ?? 0
          const status = getDayStatus(calories, calorieGoal)
          const isSelected = date === selectedDate
          const isToday = date === today

          return (
            <button
              key={date}
              type="button"
              className={[
                'week-day',
                isSelected && 'week-day--selected',
                isToday && !isSelected && 'week-day--today',
                `week-day--${status}`,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(date)}
            >
              <span className="week-day__label">{weekdayInitial(date)}</span>
              <span className="week-day__num">{dayNumber(date)}</span>
              <span className="week-day__indicator" aria-hidden />
            </button>
          )
        })}
      </div>

      <div className="week-strip__legend">
        <span><i className="legend-dot legend-dot--good" /> On target</span>
        <span><i className="legend-dot legend-dot--under" /> Under</span>
        <span><i className="legend-dot legend-dot--over" /> Over</span>
      </div>
    </div>
  )
}
