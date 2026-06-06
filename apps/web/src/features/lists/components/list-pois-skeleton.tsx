import { Skeleton } from "@/components/ui";

export function ListPoisSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading places">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-md border border-border p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
