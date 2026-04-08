"use client";

export function LihpLoadingScreen() {
  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header bar skeleton */}
      <header className="flex h-16 w-full items-center justify-between border-b border-[#dae1ed] bg-white px-8">
        <div className="flex items-center gap-6">
          <div className="h-5 w-[100px] animate-pulse rounded bg-[#f2f5fa]" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-14 animate-pulse rounded bg-[#f2f5fa]" />
            <div className="h-4 w-14 animate-pulse rounded bg-[#f2f5fa]" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-5 w-5 animate-pulse rounded-full bg-[#f2f5fa]" />
          <div className="h-4 w-12 animate-pulse rounded bg-[#f2f5fa]" />
          <div className="h-9 w-24 animate-pulse rounded-md bg-[#f2f5fa]" />
        </div>
      </header>

      {/* Nav pills row */}
      <div className="flex gap-2 border-b border-[#dae1ed] px-8 py-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-full bg-[#f2f5fa]"
          />
        ))}
      </div>

      {/* Main content area — split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel (65%) */}
        <div className="flex-[0_0_65%] overflow-hidden px-8 py-6">
          {/* Progressive module skeleton */}
          <div className="h-20 animate-pulse rounded-xl border border-[#dae1ed] bg-[#f2f5fa]" />

          {/* 3x3 course card grid */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div
                key={i}
                className="h-[240px] animate-pulse rounded-lg border border-[#dae1ed] bg-[#f2f5fa]"
              >
                <div className="space-y-2 p-4">
                  <div className="h-3.5 w-[60%] rounded bg-white/40" />
                  <div className="h-3 w-[40%] rounded bg-white/40" />
                  <div className="h-3 w-[80%] rounded bg-white/40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel (35%) — chat skeleton */}
        <div className="flex flex-[0_0_35%] flex-col justify-between border-l border-[#dae1ed] p-4">
          {/* Top: shimmer text lines */}
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-[#f2f5fa]" />
            <div className="h-4 w-[80%] animate-pulse rounded bg-[#f2f5fa]" />
            <div className="h-4 w-[60%] animate-pulse rounded bg-[#f2f5fa]" />
          </div>

          {/* Bottom: input bar skeleton */}
          <div className="h-12 w-full animate-pulse rounded-full bg-[#f2f5fa]" />
        </div>
      </div>
    </div>
  );
}
