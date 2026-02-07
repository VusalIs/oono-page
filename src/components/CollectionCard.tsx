import { memo, useState } from 'react'
import type { Collection } from '../types/collection'
import { getCoverImageUrl, isCoverColor } from '../services/api'

interface CollectionCardProps {
  collection: Collection
  /** Grid slug used to load the list (e.g. "nov-25"). Required for server to fetch collection with stories. */
  gridSlug?: string
}

function CollectionCardComponent({ collection, gridSlug }: CollectionCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const isColor = isCoverColor(collection.cover)
  const coverUrl = getCoverImageUrl(collection.cover)
  const hasImage = Boolean(coverUrl)

  const slugParam = gridSlug ?? collection.slug
  const storyUrl = `/story?collectionId=${encodeURIComponent(collection.collectionId)}&slug=${encodeURIComponent(slugParam)}`

  return (
    <a
      href={storyUrl}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)] focus-visible:ring-offset-2 rounded-lg"
      aria-label={`Open ${collection.name}`}
    >
      <article className="group overflow-hidden rounded-lg bg-[var(--card-bg)] transition-[transform,box-shadow] duration-300 ease-out hover:scale-[1.02] hover:shadow-[var(--card-shadow-hover)]">
      <div className="relative aspect-[9/16] w-full overflow-hidden">
        {isColor && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: collection.cover }}
            aria-hidden
          />
        )}
        {!isColor && (!hasImage || !imageLoaded) && (
          <div
            className="absolute inset-0 bg-[var(--skeleton-bg)] animate-pulse"
            aria-hidden
          />
        )}
        {hasImage && (
          <img
            src={coverUrl}
            alt={collection.name}
            loading="lazy"
            className="h-full w-full object-cover opacity-0 transition-opacity duration-300"
            style={{ opacity: imageLoaded ? 1 : 0 }}
            onLoad={() => setImageLoaded(true)}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-12">
          <h3 className="font-display text-sm font-medium text-white drop-shadow-sm sm:text-base">
            {collection.name}
          </h3>
        </div>
      </div>
    </article>
    </a>
  )
}

export const CollectionCard = memo(CollectionCardComponent)
