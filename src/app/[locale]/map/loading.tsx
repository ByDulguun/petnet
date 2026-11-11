import { Skeleton } from "@/components/ui/skeleton";

export default function MapLoading() {
  return (
    <div className="h-[calc(100dvh-4rem-1px)]" aria-busy="true">
      <div className="hidden h-full lg:grid lg:grid-cols-[27rem_1fr]">
        <div className="space-y-3 border-r px-5 pt-3">
          <Skeleton className="h-12 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-full rounded-none" />
      </div>
      <div className="h-full lg:hidden">
        <Skeleton className="h-full rounded-none" />
      </div>
    </div>
  );
}
