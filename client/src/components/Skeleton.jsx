// Базовый shimmer-скелетон. Использование:
// <Skeleton className="h-4 w-24" /> — произвольный блок
// <FriendRowSkeleton /> / <NotificationSkeleton /> / <MapSkeleton /> — готовые варианты

export const Skeleton = ({ className = '' }) => (
  <div
    className={`relative overflow-hidden bg-white/5 rounded ${className}`}
  >
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

export const FriendRowSkeleton = () => (
  <div className="flex items-center gap-3 p-3 bg-surface2 rounded-lg mb-2">
    <Skeleton className="w-10 h-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <div className="space-y-2 text-right">
      <Skeleton className="h-2 w-12 ml-auto" />
      <Skeleton className="h-3 w-16 ml-auto" />
    </div>
  </div>
);

export const NotificationSkeleton = () => (
  <div className="bg-surface rounded-lg p-3 mb-2 flex items-center gap-3">
    <Skeleton className="w-10 h-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-2 w-16" />
    </div>
  </div>
);

export const MapSkeleton = () => (
  <div className="w-full h-screen bg-bg flex flex-col">
    <div className="p-4 flex justify-between items-center">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-16 rounded-xl" />
    </div>
    <div className="flex-1 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-surface to-bg">
        <Skeleton className="absolute top-1/3 left-1/3 w-16 h-16 rounded-full" />
        <Skeleton className="absolute top-1/2 right-1/4 w-12 h-12 rounded-full" />
        <Skeleton className="absolute bottom-1/3 left-1/4 w-14 h-14 rounded-full" />
      </div>
    </div>
    <div className="p-4 flex gap-2 justify-between">
      <Skeleton className="w-14 h-14 rounded-full" />
      <Skeleton className="w-14 h-14 rounded-full" />
    </div>
  </div>
);
