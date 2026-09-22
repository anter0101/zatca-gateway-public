import { Skeleton } from "@/components/ui/skeleton";

type TableSkeletonProps = {
  columns: number;
  rows?: number;
  pageSize?: number;
};

export function TableSkeleton({
  columns,
  rows,
  pageSize = 10,
}: TableSkeletonProps) {
  const skeletonRows = rows || pageSize;

  return (
    <div className="w-full animate-pulse">
      <div className="border-border bg-background border-b">
        <div className="flex">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="flex-1 px-2 py-1.5 text-center">
              <Skeleton className="mx-auto h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div
        className="bg-background"
        style={{
          height: `${skeletonRows * 32}px`,
          minHeight: `${skeletonRows * 32}px`,
        }}
      >
        {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="border-border hover:bg-muted/50 flex items-center border-b transition-colors duration-150"
            style={{ height: "32px" }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1 px-2 py-1.5 text-center">
                <Skeleton className="mx-auto h-3 w-3/4 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
