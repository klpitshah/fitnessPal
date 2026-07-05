import { useCallback, useState } from 'react'
import { lookupBarcode } from './api/openFoodFacts'
import { BarcodeScanner } from './components/BarcodeScanner'
import { BottomNav } from './components/BottomNav'
import { LogView } from './components/LogView'
import { GoalsSettings } from './components/GoalsSettings'
import { ProductEntry } from './components/ProductEntry'
import { RecipeForm } from './components/RecipeForm'
import { RecipeList } from './components/RecipeList'
import { TodayView } from './components/TodayView'
import { useFoodLog } from './hooks/useFoodLog'
import { useGoals } from './hooks/useGoals'
import { useRecipes } from './hooks/useRecipes'
import { useWeekSummaries } from './hooks/useWeekSummaries'
import type { FoodEntry, ScannedProduct, Tab } from './types'
import { shiftWeek, todayDateString } from './utils/nutrition'

type ScanState =
  | { phase: 'idle' }
  | { phase: 'loading'; barcode: string }
  | { phase: 'product'; product: ScannedProduct }
  | { phase: 'error'; message: string; barcode: string }

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [scanState, setScanState] = useState<ScanState>({ phase: 'idle' })
  const [selectedDate, setSelectedDate] = useState(() => todayDateString())
  const [weekAnchor, setWeekAnchor] = useState(() => todayDateString())

  const viewDate = tab === 'today' ? selectedDate : todayDateString()
  const logDate = todayDateString()

  const { entries, loading, log, remove } = useFoodLog(viewDate)
  const { goals, loading: goalsLoading, update } = useGoals()
  const { summaries, refresh: refreshSummaries } = useWeekSummaries(weekAnchor)
  const { recipes, loading: recipesLoading, save: saveRecipe, remove: removeRecipe } = useRecipes()

  const handleBarcode = useCallback(async (barcode: string) => {
    setScanState({ phase: 'loading', barcode })
    try {
      const product = await lookupBarcode(barcode)
      setScanState({ phase: 'product', product })
    } catch (err) {
      setScanState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Lookup failed',
        barcode,
      })
    }
  }, [])

  const handleLog = useCallback(
    async (entry: FoodEntry) => {
      await log(entry)
      await refreshSummaries()
      setSelectedDate(entry.date)
      setWeekAnchor(entry.date)
      setScanState({ phase: 'idle' })
      setTab('today')
    },
    [log, refreshSummaries],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await remove(id)
      await refreshSummaries()
    },
    [remove, refreshSummaries],
  )

  const goToToday = useCallback(() => {
    const today = todayDateString()
    setSelectedDate(today)
    setWeekAnchor(today)
  }, [])

  const resetScan = () => setScanState({ phase: 'idle' })

  if (goalsLoading || !goals) {
    return (
      <div className="app app--loading">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <main className="app__content">
        {tab === 'today' && (
          <TodayView
            entries={entries}
            goals={goals}
            loading={loading}
            selectedDate={selectedDate}
            weekAnchor={weekAnchor}
            summaries={summaries}
            onSelectDate={setSelectedDate}
            onPrevWeek={() => setWeekAnchor(shiftWeek(weekAnchor, -1))}
            onNextWeek={() => setWeekAnchor(shiftWeek(weekAnchor, 1))}
            onToday={goToToday}
            onDelete={handleDelete}
          />
        )}

        {tab === 'log' && (
          <LogView
            entries={entries}
            goals={goals}
            loading={loading}
            logDate={logDate}
            onSubmit={handleLog}
            onDelete={handleDelete}
          />
        )}

        {tab === 'scan' && (
          <div className="scan-view">
            {scanState.phase === 'idle' && (
              <BarcodeScanner onScan={handleBarcode} onManualEntry={handleBarcode} />
            )}
            {scanState.phase === 'loading' && (
              <div className="scan-status">
                <p>Looking up barcode {scanState.barcode}...</p>
              </div>
            )}
            {scanState.phase === 'error' && (
              <div className="scan-status">
                <p className="error-message">{scanState.message}</p>
                <button className="btn btn--secondary" onClick={resetScan}>
                  Try Again
                </button>
              </div>
            )}
            {scanState.phase === 'product' && (
              <ProductEntry
                product={scanState.product}
                logDate={logDate}
                onSubmit={handleLog}
                onCancel={resetScan}
              />
            )}
          </div>
        )}

        {tab === 'recipes' && (
          <div className="recipes-view">
            <header className="page-header">
              <h1 className="page-header__title">Recipes</h1>
              <p className="page-header__subtitle">Save meals you eat often and log them in one tap</p>
            </header>
            <RecipeForm onSave={saveRecipe} />
            <h2 className="section-title">Saved Recipes</h2>
            <RecipeList
              recipes={recipes}
              loading={recipesLoading}
              logDate={logDate}
              onLog={handleLog}
              onDelete={removeRecipe}
            />
          </div>
        )}

        {tab === 'goals' && <GoalsSettings goals={goals} onSave={update} />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
