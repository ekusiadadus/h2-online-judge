/**
 * Loading UI for playground page.
 * Displays skeleton layout while the playground is initializing.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function PlaygroundLoading() {
  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-20 bg-muted rounded animate-pulse"
          />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Grid skeleton */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="h-6 w-20 bg-muted rounded animate-pulse mb-4" />
          <div className="aspect-square bg-muted rounded animate-pulse" />
        </div>

        {/* Editor skeleton */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 w-16 bg-muted rounded animate-pulse" />
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>

        {/* Output skeleton */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="h-6 w-16 bg-muted rounded animate-pulse mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-muted rounded animate-pulse"
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
