import { lazy, Suspense } from 'react'
import { LoadingSkeleton } from './components/LoadingSkeleton'
import './App.css'

const CollectionGrid = lazy(() =>
  import('./components/CollectionGrid').then((m) => ({ default: m.CollectionGrid }))
)

function App() {
  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[var(--text)] sm:text-3xl">
          Collections
        </h1>
      </header>
      <main>
        <Suspense fallback={<LoadingSkeleton />}>
          <CollectionGrid slug="nov-25" />
        </Suspense>
      </main>
    </div>
  )
}

export default App
