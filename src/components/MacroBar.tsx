import type { Macros } from '../types'
import { progressPercent } from '../utils/nutrition'

interface MacroBarProps {
  label: string
  current: number
  goal: number
  color: string
}

export function MacroBar({ label, current, goal, color }: MacroBarProps) {
  const pct = progressPercent(current, goal)

  return (
    <div className="macro-bar">
      <div className="macro-bar__header">
        <span className="macro-bar__label">
          <i className="macro-bar__dot" style={{ backgroundColor: color }} />
          {label}
        </span>
        <span className="macro-bar__values">
          {Math.round(current * 10) / 10}
          <span className="macro-bar__goal">/ {goal}g</span>
        </span>
      </div>
      <div className="macro-bar__track">
        <div className="macro-bar__fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

interface MacroSummaryProps {
  totals: Macros
  goals: Macros
  compact?: boolean
}

export function MacroSummary({ totals, goals, compact }: MacroSummaryProps) {
  if (compact) {
    return (
      <div className="macro-chips">
        <div className="macro-chip macro-chip--cal">{Math.round(totals.calories)} cal</div>
        <div className="macro-chip macro-chip--carbs">C {Math.round(totals.carbs)}g</div>
        <div className="macro-chip macro-chip--fat">F {Math.round(totals.fat)}g</div>
        <div className="macro-chip macro-chip--sugar">S {Math.round(totals.sugar)}g</div>
        <div className="macro-chip macro-chip--protein">P {Math.round(totals.protein)}g</div>
      </div>
    )
  }

  return (
    <div className="macro-summary card">
      <MacroBar label="Carbs" current={totals.carbs} goal={goals.carbs} color="var(--color-carbs)" />
      <MacroBar label="Fat" current={totals.fat} goal={goals.fat} color="var(--color-fat)" />
      <MacroBar label="Sugar" current={totals.sugar} goal={goals.sugar} color="var(--color-sugar)" />
      <MacroBar label="Protein" current={totals.protein} goal={goals.protein} color="var(--color-protein)" />
    </div>
  )
}
