export function PlanLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back link placeholder */}
      <div className="h-4 w-28 rounded bg-[#f2f5fa]" />

      {/* Title + CTA row */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-64 rounded bg-[#f2f5fa]" />
        <div className="h-10 w-44 rounded-full bg-[#f2f5fa]" />
      </div>

      {/* Summary bar */}
      <div className="h-4 w-96 rounded bg-[#f2f5fa]" />

      {/* Milestone skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[#dae1ed] p-4 space-y-3"
        >
          {/* Milestone header */}
          <div className="h-4 w-40 rounded bg-[#f2f5fa]" />
          {/* Milestone description */}
          <div className="h-3 w-72 rounded bg-[#f2f5fa]" />

          {/* Course card skeletons */}
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="flex items-start gap-4 py-3">
              <div className="h-20 w-20 shrink-0 rounded-lg bg-[#f2f5fa]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-[#f2f5fa]" />
                <div className="h-3 w-32 rounded bg-[#f2f5fa]" />
                <div className="h-3 w-56 rounded bg-[#f2f5fa]" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
