import { useCallback, useEffect, useState } from 'react'
import { fetchDailySummaries } from '../db'
import type { DailySummary } from '../types'
import { getWeekDates } from '../utils/nutrition'

export function useWeekSummaries(weekAnchor: string) {
  const [summaries, setSummaries] = useState<Map<string, DailySummary>>(new Map())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const weekDates = getWeekDates(weekAnchor)
      const data = await fetchDailySummaries(weekDates[0], weekDates[6])
      setSummaries(new Map(data.map((s) => [s.date, s])))
    } finally {
      setLoading(false)
    }
  }, [weekAnchor])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { summaries, loading, refresh }
}
