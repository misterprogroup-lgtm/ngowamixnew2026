'use client';

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-dark-800/50 rounded-xl overflow-hidden animate-pulse ${className}`}>
      <div className="aspect-square bg-dark-700/50" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-dark-700/50 rounded w-3/4" />
        <div className="h-3 bg-dark-700/50 rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl animate-pulse ${className}`}>
      <div className="w-12 h-12 bg-dark-700/50 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-dark-700/50 rounded w-2/3" />
        <div className="h-3 bg-dark-700/50 rounded w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-16 bg-dark-700/50 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="h-4 bg-dark-700/50 rounded" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
}
