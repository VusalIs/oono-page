import { useCollections } from '../hooks/useCollections'
import { CollectionCard } from './CollectionCard'
import { LoadingSkeleton } from './LoadingSkeleton'

interface CollectionGridProps {
  slug?: string
}

export function CollectionGrid({ slug = 'nov-25' }: CollectionGridProps) {
  const { data: collections, isLoading, isError, error } = useCollections(slug)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-[var(--error-bg)] p-6 text-center text-[var(--error-text)]">
        <p className="font-medium">Failed to load collections</p>
        <p className="mt-1 text-sm opacity-90">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  if (!collections?.length) {
    return (
      <div className="py-12 text-center text-[var(--text-muted)]">
        No collections found.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {collections.map((collection) => (
        <CollectionCard
          key={collection.collectionId}
          collection={collection}
        />
      ))}
    </div>
  )
}
