import type { PlanCourse } from "@/lib/plan-types";
import { MoreHorizontal } from "lucide-react";
import { ActivityBadge } from "./activity-badge";

function formatProductType(productType: string): string {
  switch (productType) {
    case "PROFESSIONAL_CERTIFICATE":
      return "Professional Certificate";
    case "SPECIALIZATION":
      return "Specialization";
    case "COURSE":
      return "Course";
    case "GUIDED_PROJECT":
      return "Guided Project";
    default:
      return productType;
  }
}


interface PlanCourseCardProps {
  course: PlanCourse;
  isFirstCourse?: boolean;
}

export function PlanCourseCard({ course, isFirstCourse }: PlanCourseCardProps) {
  const productLabel = formatProductType(course.productType);

  return (
    <div className="flex items-start gap-4 px-4 py-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={course.imageUrl}
        alt={course.name}
        className="h-20 w-20 shrink-0 rounded-lg object-cover bg-[#f2f5fa]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <a
              href={"https://www.coursera.org" + course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#0f1114] hover:underline"
            >
              {course.name}
            </a>
            {course.skills.length > 0 && (
              <p className="text-xs text-[#5b6780]">
                {course.skills.slice(0, 2).join(", ")}
              </p>
            )}
            <p className="text-xs text-[#5b6780]">
              {course.partners.join(", ")}
              {" \u00b7 "}
              {productLabel}
              {" \u00b7 "}
              {course.duration}
            </p>
            {productLabel && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                <ActivityBadge label={productLabel} />
              </div>
            )}
          </div>

          {/* Start card for first course — matches Figma preview style */}
          {isFirstCourse ? (
            <div className="flex shrink-0 items-center gap-3 rounded-lg border border-[#dae1ed] bg-white px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-[#0f1114] whitespace-nowrap">Discovering {course.skills[0] ?? course.name.split(":")[0]}</span>
                <span className="flex items-center gap-1 text-[10px] text-[#5b6780]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                    <rect x="1" y="2.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1" />
                    <path d="M5 5L7.5 6.5L5 8V5Z" fill="currentColor" />
                  </svg>
                  Video (1 min)
                </span>
              </div>
              <span className="cursor-default rounded-md bg-[#0056d2] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap">
                Start
              </span>
            </div>
          ) : (
            <span className="cursor-default shrink-0 text-[#5b6780]">
              <MoreHorizontal size={16} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
