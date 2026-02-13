import { lazy, Suspense } from 'react'
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { LoadingSkeleton } from './components/LoadingSkeleton'
import { StoryPlayerOverlay } from './components/StoryPlayerOverlay'
import { useCollections } from './hooks/useCollections'
import { buildCollectionParam, findCollectionByParam } from './lib/collectionUrl'
import './App.css'

const CollectionGrid = lazy(() =>
  import('./components/CollectionGrid').then((m) => ({ default: m.CollectionGrid }))
)

function App() {
  const { slug: slugParam } = useParams<{ slug?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const slug = slugParam ?? 'nov-25'
  const c = searchParams.get('c')
  const storyParam = searchParams.get('story')
  const storyIndex = storyParam ? Math.max(1, parseInt(storyParam, 10) || 1) : 0

  const { data: collections } = useCollections(slug)
  const collection = c && collections ? findCollectionByParam(collections, c) : null

  const showPlayer = Boolean(c && storyIndex >= 1 && collection)

  // Debug: if URL has c but no collection matched, player overlay will not open.
  if (import.meta.env.DEV && c && storyIndex >= 1 && !collection && collections?.length) {
    console.warn('[Collections] No collection matched for c=', c, 'available:', collections.map((col) => ({ name: col.name, param: buildCollectionParam(col) })))
  }

  const handleClosePlayer = () => {
    navigate(location.pathname || '/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[var(--text)] sm:text-3xl">
          Collections
        </h1>
      </header>
      <main>
        <Suspense fallback={<LoadingSkeleton />}>
          <CollectionGrid slug={slug} />
        </Suspense>
      </main>
      {showPlayer && collection && (
        <StoryPlayerOverlay
          key={`${collection.collectionId}-${storyIndex}`}
          collection={collection}
          initialStoryIndex={Math.max(0, storyIndex - 1)}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  )
}

export default App
