import { useCallback, useEffect, useState } from 'react'
import { createRecipe, deleteRecipe, fetchRecipes } from '../db'
import type { Recipe } from '../types'

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchRecipes()
      setRecipes(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = useCallback(
    async (recipe: Recipe) => {
      await createRecipe(recipe)
      await refresh()
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteRecipe(id)
      await refresh()
    },
    [refresh],
  )

  return { recipes, loading, save, remove, refresh }
}
