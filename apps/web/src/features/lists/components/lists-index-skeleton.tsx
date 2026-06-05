import { Skeleton } from "@/components/ui";

export function ListsIndexSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading lists">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-md border border-border overflow-hidden">
          <Skeleton className="h-20 w-full rounded-none" />
          <div className="flex gap-4 px-4 py-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
