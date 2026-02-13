import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Collection } from '../types/collection'
import { getMediaUrl } from '../services/api'

interface StoryPlayerOverlayProps {
  collection: Collection
  initialStoryIndex: number
  onClose: () => void
}

const DEFAULT_STORY_DURATION_SECONDS = 15

function isColor(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  const t = value.trim()
  return t.startsWith('#') || t.startsWith('rgb(') || t.startsWith('rgba(')
}

function getEmbedSrc(embedCode?: string): string {
  if (!embedCode) return ''
  const decoded = embedCode
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')

  const srcAttrPatterns = [
    /src\s*=\s*["']([^"']+)["']/i,
    /src\s*=\s*\\["']([^"']+)\\["']/i,
    /data-src\s*=\s*["']([^"']+)["']/i,
    /href\s*=\s*["']([^"']+)["']/i,
  ]

  for (const pattern of srcAttrPatterns) {
    const match = decoded.match(pattern)
    const candidate = match?.[1]?.trim()
    if (!candidate) continue
    if (candidate.startsWith('//')) return `https:${candidate}`
    if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
      return candidate
    }
  }

  // Some providers send raw URL instead of full iframe markup.
  const plainUrl = decoded.match(/https?:\/\/[^\s"'<]+/i)?.[0]?.trim() ?? ''
  return plainUrl
}

function StoryPlayerOverlayComponent({
  collection,
  initialStoryIndex,
  onClose,
}: StoryPlayerOverlayProps) {
  const stories = collection.stories ?? []
  const safeInitialIndex =
    stories.length > 0
      ? Math.max(0, Math.min(initialStoryIndex, stories.length - 1))
      : 0
  const [activeIndex, setActiveIndex] = useState(safeInitialIndex)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [activeProgress, setActiveProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerStartMsRef = useRef<number | null>(null)
  const elapsedMsRef = useRef(0)

  const totalStories = stories.length
  const activeStory = stories[activeIndex]
  const isVideoStory = (activeStory?.backgroundType ?? '').toUpperCase() === 'VIDEO'

  const goToStory = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, totalStories - 1))
      setActiveIndex(clamped)
      setActiveProgress(0)
      elapsedMsRef.current = 0
      timerStartMsRef.current = null
    },
    [totalStories],
  )

  const goNext = useCallback(() => {
    if (totalStories <= 0) {
      onClose()
      return
    }
    setActiveProgress(0)
    elapsedMsRef.current = 0
    timerStartMsRef.current = null
    setActiveIndex((current) => {
      if (current >= totalStories - 1) {
        onClose()
        return current
      }
      return current + 1
    })
  }, [onClose, totalStories])

  const goPrev = useCallback(() => {
    if (totalStories <= 0) return
    setActiveProgress(0)
    elapsedMsRef.current = 0
    timerStartMsRef.current = null
    setActiveIndex((current) => Math.max(0, current - 1))
  }, [totalStories])

  useEffect(() => {
    if (!isVideoStory) return
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      void video.play().catch(() => undefined)
      return
    }
    video.pause()
  }, [isVideoStory, isPlaying, activeIndex])

  useEffect(() => {
    if (!isVideoStory) return
    const video = videoRef.current
    if (!video) return
    video.muted = isMuted
  }, [isVideoStory, isMuted, activeIndex])

  const timedDurationMs = useMemo(() => {
    if (!activeStory) return null
    const customDuration =
      typeof activeStory.duration === 'number' && activeStory.duration > 0
        ? activeStory.duration
        : null

    if (!isVideoStory) {
      return (customDuration ?? DEFAULT_STORY_DURATION_SECONDS) * 1000
    }

    if (customDuration) return customDuration * 1000
    return null
  }, [activeStory, isVideoStory])

  useEffect(() => {
    if (!isPlaying || !activeStory || !timedDurationMs) return

    const tick = (now: number) => {
      if (timerStartMsRef.current == null) {
        timerStartMsRef.current = now
      }
      const delta = now - timerStartMsRef.current
      const elapsed = elapsedMsRef.current + delta
      const progress = Math.min(elapsed / timedDurationMs, 1)
      setActiveProgress(progress)
      if (progress >= 1) {
        elapsedMsRef.current = 0
        timerStartMsRef.current = null
        goNext()
        return
      }
      rafRef.current = window.requestAnimationFrame(tick)
    }

    rafRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (timerStartMsRef.current != null && timedDurationMs) {
        const now = performance.now()
        elapsedMsRef.current += now - timerStartMsRef.current
      }
      timerStartMsRef.current = null
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
      }
      rafRef.current = null
    }
  }, [activeStory, goNext, isPlaying, timedDurationMs])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowRight') {
        goNext()
        return
      }
      if (e.key === 'ArrowLeft') {
        goPrev()
        return
      }
      if (e.key === ' ') {
        e.preventDefault()
        setIsPlaying((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onClose])

  if (!activeStory) {
    return (
      <div
        className="fixed inset-0 z-[9999] bg-black"
        role="dialog"
        aria-modal="true"
        aria-label="Story player"
      >
        <div className="flex h-full w-full items-center justify-center text-[var(--text)]">
          No stories available.
        </div>
      </div>
    )
  }

  const bgType = (activeStory.backgroundType ?? '').toUpperCase()
  const videoSrc = getMediaUrl(activeStory.background)
  const imageSrc =
    getMediaUrl(activeStory.background) ||
    getMediaUrl(activeStory.thumbnail) ||
    'https://placehold.co/720x1280/1a1a1a/ffffff?text=Story'
  const embedSrc = getEmbedSrc(activeStory.embedCode)
  const gradientColor =
    activeStory.background && isColor(activeStory.background)
      ? activeStory.background
      : '#000000'

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={`${collection.name} story player`}
    >
      <div className="flex h-full w-full items-center justify-center overflow-hidden bg-black px-0 sm:px-4">
        <div
          className="relative aspect-[9/16] overflow-hidden bg-black"
          style={{ width: 'min(100vw, calc(100vh * 9 / 16))' }}
        >
          <div className="absolute left-3 right-3 top-3 z-30 flex items-center gap-1.5">
            {stories.map((story, idx) => {
              const key = story._id || `${story.storyId || 'story'}-${idx}`
              const width =
                idx < activeIndex
                  ? 1
                  : idx === activeIndex
                    ? activeProgress
                    : 0
              return (
                <button
                  key={key}
                  type="button"
                  className="group relative h-1.5 flex-1 rounded-full bg-white/25"
                  onClick={() => goToStory(idx)}
                  aria-label={`Go to story ${idx + 1}`}
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-100"
                    style={{ width: `${Math.round(width * 100)}%` }}
                    aria-hidden
                  />
                  <span className="sr-only">Story {idx + 1}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-8 z-30 rounded-full border border-white/50 bg-black/40 px-2.5 py-1 text-sm text-white backdrop-blur-sm hover:bg-black/60"
            aria-label="Close story player"
          >
            Close
          </button>

          <div className="h-full w-full">
            {bgType === 'VIDEO' && (
              <video
                key={activeStory.storyId || activeStory._id || activeIndex}
                ref={videoRef}
                src={videoSrc}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                muted={isMuted}
                onEnded={goNext}
                onTimeUpdate={(e) => {
                  if (timedDurationMs) return
                  const current = e.currentTarget.currentTime
                  const total = e.currentTarget.duration
                  if (!Number.isFinite(total) || total <= 0) return
                  setActiveProgress(Math.min(current / total, 1))
                }}
              />
            )}

            {bgType === 'IMAGE' && (
              <img
                src={imageSrc}
                alt={collection.name}
                className="h-full w-full object-cover"
                loading="eager"
              />
            )}

            {bgType === 'EMBED' && embedSrc && (
              <>
                <iframe
                  src={embedSrc}
                  className="h-full w-full border-0"
                  title="Embedded content"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; payment; web-share; camera; microphone"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
                <a
                  href={embedSrc}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="absolute bottom-20 right-3 z-30 rounded-full border border-white/50 bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/70"
                >
                  Open source
                </a>
              </>
            )}

            {bgType === 'EMBED' && !embedSrc && (
              <div className="relative h-full w-full">
                <img
                  src={imageSrc}
                  alt={collection.name}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-6 text-center text-sm text-white">
                  This embedded story is not available in the player.
                </div>
              </div>
            )}

            {(bgType === 'GRADIENT' || bgType === 'BLANK' || bgType === 'blank') && (
              <div className="h-full w-full" style={{ backgroundColor: gradientColor }} />
            )}

            {bgType !== 'VIDEO' &&
              bgType !== 'IMAGE' &&
              bgType !== 'EMBED' &&
              bgType !== 'GRADIENT' &&
              bgType !== 'BLANK' &&
              bgType !== 'blank' && (
                <img
                  src={imageSrc}
                  alt={collection.name}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/70 to-transparent pb-4 pt-20">
            <div className="pointer-events-auto mx-auto flex w-full items-center justify-center gap-2 px-4">
              <button
                type="button"
                onClick={() => setIsMuted((v) => !v)}
                className="rounded-full border border-white/40 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/60 disabled:opacity-50"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                disabled={!isVideoStory}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                onClick={goPrev}
                className="rounded-full border border-white/40 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/60"
                aria-label="Previous story"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying((v) => !v)}
                className="rounded-full border border-white/40 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/60"
                aria-label={isPlaying ? 'Pause story' : 'Play story'}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                onClick={goNext}
                className="rounded-full border border-white/40 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/60"
                aria-label="Next story"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const StoryPlayerOverlay = memo(StoryPlayerOverlayComponent)
