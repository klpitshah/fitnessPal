import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db.js'
import { requireAuth, type AuthedRequest } from '../middleware.js'

const router = Router()
router.use(requireAuth)

function rowToEntry(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    timestamp: row.timestamp,
    date: row.date,
    meal: row.meal,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    sugar: row.sugar ?? 0,
    servingDescription: row.serving_description ?? undefined,
    barcode: row.barcode ?? undefined,
  }
}

router.get('/entries', (req: AuthedRequest, res) => {
  const { date, start, end } = req.query
  const userId = req.user!.id

  if (start && end) {
    const rows = db
      .prepare(
        'SELECT * FROM food_entries WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY timestamp DESC',
      )
      .all(userId, String(start), String(end))
    res.json(rows.map(rowToEntry))
    return
  }

  if (!date) {
    res.status(400).json({ error: 'date or start/end required' })
    return
  }

  const rows = db
    .prepare('SELECT * FROM food_entries WHERE user_id = ? AND date = ? ORDER BY timestamp DESC')
    .all(userId, String(date))
  res.json(rows.map(rowToEntry))
})

router.get('/summaries', (req: AuthedRequest, res) => {
  const { start, end } = req.query
  if (!start || !end) {
    res.status(400).json({ error: 'start and end required' })
    return
  }

  const rows = db
    .prepare(
      `SELECT date,
        SUM(calories) as calories,
        SUM(protein) as protein,
        SUM(carbs) as carbs,
        SUM(fat) as fat,
        SUM(sugar) as sugar,
        COUNT(*) as entryCount
      FROM food_entries
      WHERE user_id = ? AND date >= ? AND date <= ?
      GROUP BY date`,
    )
    .all(req.user!.id, String(start), String(end))

  res.json(rows)
})

router.post('/entries', (req: AuthedRequest, res) => {
  const entry = req.body
  if (!entry?.name || !entry?.date) {
    res.status(400).json({ error: 'Invalid entry' })
    return
  }

  const id = entry.id ?? randomUUID()
  db.prepare(
    `INSERT INTO food_entries
      (id, user_id, name, timestamp, date, meal, calories, protein, carbs, fat, sugar, serving_description, barcode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    req.user!.id,
    entry.name,
    entry.timestamp ?? Date.now(),
    entry.date,
    entry.meal ?? 'snack',
    entry.calories ?? 0,
    entry.protein ?? 0,
    entry.carbs ?? 0,
    entry.fat ?? 0,
    entry.sugar ?? 0,
    entry.servingDescription ?? null,
    entry.barcode ?? null,
  )

  res.status(201).json({ ...entry, id })
})

router.delete('/entries/:id', (req: AuthedRequest, res) => {
  const result = db
    .prepare('DELETE FROM food_entries WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user!.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Entry not found' })
    return
  }
  res.status(204).end()
})

router.get('/goals', (req: AuthedRequest, res) => {
  const row = db.prepare('SELECT * FROM goals WHERE user_id = ?').get(req.user!.id) as
    | Record<string, number>
    | undefined

  res.json({
    id: 'daily-goals',
    calories: row?.calories ?? 2000,
    protein: row?.protein ?? 150,
    carbs: row?.carbs ?? 200,
    fat: row?.fat ?? 65,
    sugar: row?.sugar ?? 50,
  })
})

router.put('/goals', (req: AuthedRequest, res) => {
  const { calories, protein, carbs, fat, sugar } = req.body ?? {}
  db.prepare(
    `INSERT INTO goals (user_id, calories, protein, carbs, fat, sugar) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       calories = excluded.calories,
       protein = excluded.protein,
       carbs = excluded.carbs,
       fat = excluded.fat,
       sugar = excluded.sugar`,
  ).run(
    req.user!.id,
    calories ?? 2000,
    protein ?? 150,
    carbs ?? 200,
    fat ?? 65,
    sugar ?? 50,
  )
  res.json({ ok: true })
})

router.get('/recipes', (req: AuthedRequest, res) => {
  const rows = db
    .prepare('SELECT * FROM recipes WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user!.id)

  res.json(
    rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      sugar: row.sugar ?? 0,
      servingDescription: row.serving_description ?? undefined,
      createdAt: row.created_at,
    })),
  )
})

router.post('/recipes', (req: AuthedRequest, res) => {
  const recipe = req.body
  if (!recipe?.name) {
    res.status(400).json({ error: 'Invalid recipe' })
    return
  }

  const id = recipe.id ?? randomUUID()
  db.prepare(
    `INSERT INTO recipes
      (id, user_id, name, calories, protein, carbs, fat, sugar, serving_description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    req.user!.id,
    recipe.name,
    recipe.calories ?? 0,
    recipe.protein ?? 0,
    recipe.carbs ?? 0,
    recipe.fat ?? 0,
    recipe.sugar ?? 0,
    recipe.servingDescription ?? null,
    recipe.createdAt ?? Date.now(),
  )

  res.status(201).json({ ...recipe, id })
})

router.delete('/recipes/:id', (req: AuthedRequest, res) => {
  const result = db
    .prepare('DELETE FROM recipes WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user!.id)
  if (result.changes === 0) {
    res.status(404).json({ error: 'Recipe not found' })
    return
  }
  res.status(204).end()
})

export default router
