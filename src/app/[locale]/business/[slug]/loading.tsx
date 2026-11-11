import { Skeleton } from "@/components/ui/skeleton";

export default function BusinessLoading() {
  return (
    <div className="container-page pt-4 pb-24" aria-busy="true">
      <Skeleton className="h-4 w-72 rounded" />
      <Skeleton className="mt-4 hidden h-[26rem] rounded-3xl sm:block" />
      <Skeleton className="mt-4 aspect-[4/3] rounded-3xl sm:hidden" />
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-9 w-80 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
