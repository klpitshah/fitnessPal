import { useCallback, useEffect, useState } from 'react'
import { createEntry, deleteEntry, fetchEntriesByDate } from '../db'
import type { FoodEntry } from '../types'
import { todayDateString } from '../utils/nutrition'

export function useFoodLog(date: string = todayDateString()) {
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchEntriesByDate(date)
      data.sort((a, b) => b.timestamp - a.timestamp)
      setEntries(data)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    refresh()
  }, [refresh])

  const log = useCallback(
    async (entry: FoodEntry) => {
      await createEntry(entry)
      await refresh()
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteEntry(id)
      await refresh()
    },
    [refresh],
  )

  return { entries, loading, log, remove, refresh }
}
