import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="container-page py-16 lg:py-24" aria-busy="true">
      {/* hero skeleton */}
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-xl space-y-6">
          <Skeleton className="h-8 w-64 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-4/5 rounded-xl" />
          </div>
          <Skeleton className="h-6 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="hidden aspect-[4/5] w-full max-w-lg rounded-[2.5rem] lg:block" />
      </div>

      {/* category grid skeleton */}
      <div className="mt-24 space-y-8">
        <Skeleton className="h-9 w-72 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
