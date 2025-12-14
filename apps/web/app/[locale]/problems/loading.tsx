/**
 * Loading UI for problems list page.
 * Displays skeleton cards while problems are being fetched.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function ProblemsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-9 w-48 bg-muted rounded animate-pulse" />
        <div className="mt-2 h-5 w-64 bg-muted rounded animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-6 space-y-4"
          >
            {/* Difficulty badge skeleton */}
            <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
            {/* Title skeleton */}
            <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </div>
            {/* Footer skeleton */}
            <div className="flex justify-between items-center pt-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
