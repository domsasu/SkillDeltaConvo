"use client";

import { CourseraLogo } from "@/components/shared/coursera-logo";
import { SparkleOpenIcon } from "@/components/shared/sparkle-icon";

export function Header() {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-[#dae1ed] bg-white px-6">
      <CourseraLogo className="h-5" />
      <div className="flex items-center gap-4">
        <SparkleOpenIcon className="h-5 w-5 text-[#0056d2]" />
        <span className="text-sm font-medium text-[#0056d2]">Exit</span>
      </div>
    </header>
  );
}
