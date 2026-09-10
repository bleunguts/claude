export function DashboardSkeleton() {
  return (
    <div className="space-y-4" data-testid="dashboard-skeleton">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-teal-100" />
        ))}
      </div>
      <div className="h-16 animate-pulse rounded-xl bg-teal-100" />
    </div>
  );
}
