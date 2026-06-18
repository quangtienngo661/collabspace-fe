import { Card } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";

function StatCardSkeleton({ dual = false, withSubtitle = false }: { dual?: boolean; withSubtitle?: boolean }) {
  return (
    <Card className="flex min-h-[7.5rem] flex-col border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <Skeleton className="mb-2 h-3 w-24" />
      {dual ? (
        <div className="flex gap-5">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-10" />
            <Skeleton className="h-2.5 w-10" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-10" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        </div>
      ) : (
        <>
          <Skeleton className="h-8 w-12" />
          {withSubtitle && <Skeleton className="mt-auto h-8 w-28" />}
        </>
      )}
    </Card>
  );
}

function DonutChartSkeleton() {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <Skeleton className="size-36 rounded-full" />
    </div>
  );
}

function BarChartSkeleton() {
  const widths = ["72%", "55%", "88%", "42%", "64%", "48%"];
  return (
    <div className="flex h-[200px] flex-col justify-center gap-3 px-1">
      {widths.map((width, index) => (
        <Skeleton key={index} className="h-3.5 rounded-md" style={{ width }} />
      ))}
    </div>
  );
}

function LineChartSkeleton() {
  const heights = [48, 72, 56, 96, 64, 80];
  return (
    <div className="flex h-[200px] items-end justify-between gap-3 px-2 pb-6 pt-4">
      {heights.map((height, index) => (
        <Skeleton key={index} className="w-full max-w-9 rounded-t-md" style={{ height }} />
      ))}
    </div>
  );
}

function ChartCardSkeleton({ variant }: { variant: "donut" | "bar" | "line" }) {
  return (
    <Card className="min-w-0 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <Skeleton className="mb-3 h-4 w-36" />
      {variant === "donut" && <DonutChartSkeleton />}
      {variant === "bar" && <BarChartSkeleton />}
      {variant === "line" && <LineChartSkeleton />}
    </Card>
  );
}

export function AdminOverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading platform overview">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCardSkeleton withSubtitle />
        <StatCardSkeleton dual />
        <StatCardSkeleton withSubtitle />
        <StatCardSkeleton withSubtitle />
        <StatCardSkeleton withSubtitle />
        <StatCardSkeleton withSubtitle />
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCardSkeleton variant="donut" />
          <ChartCardSkeleton variant="donut" />
          <ChartCardSkeleton variant="donut" />
          <ChartCardSkeleton variant="bar" />
          <ChartCardSkeleton variant="line" />
        </div>
      </div>
    </div>
  );
}
