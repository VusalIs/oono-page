const SKELETON_COUNT = 12;

function SkeletonCard() {
  return (
    <div
      className="aspect-[9/16] w-full rounded-lg bg-[var(--skeleton-bg)] animate-pulse"
      aria-hidden
    />
  );
}

export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
