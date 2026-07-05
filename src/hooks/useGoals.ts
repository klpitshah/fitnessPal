import { useCallback, useEffect, useState } from 'react'
import { fetchGoals, saveGoals } from '../db'
import type { DailyGoals } from '../types'

export function useGoals() {
  const [goals, setGoals] = useState<DailyGoals | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchGoals()
      setGoals(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const update = useCallback(
    async (values: Omit<DailyGoals, 'id'>) => {
      await saveGoals(values)
      await refresh()
    },
    [refresh],
  )

  return { goals, loading, update, refresh }
}
