interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
    />
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="w-8 h-6" />
            <Skeleton className="h-6 flex-1" />
            <Skeleton className="w-12 h-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TipsSummarySkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-24 h-5" />
            {[...Array(4)].map((_, j) => (
              <Skeleton key={j} className="w-12 h-5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <div className="flex justify-between mb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="flex-1 h-12 rounded-lg" />
        <div className="flex items-center">
          <Skeleton className="w-6 h-4" />
        </div>
        <Skeleton className="flex-1 h-12 rounded-lg" />
      </div>
    </div>
  );
}

export function TipEntrySkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <Skeleton className="h-8 w-64 mb-6" />
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="mt-6 h-12 w-full rounded-lg" />
    </div>
  );
}

export function MemberSelectSkeleton() {
  return (
    <div>
      <Skeleton className="h-7 w-48 mb-4" />
      <div className="grid gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
