"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import type { LearningPlan, PlanMilestone, PlanCourse } from "@/lib/plan-types";
import { SparkleIcon } from "@/components/shared/sparkle-icon";

interface LearningPlanBannerProps {
  plan: LearningPlan;
  onViewPlan: () => void;
  pendingRemovals?: Set<string>;
  swapDisabled?: boolean;
  isRefining?: boolean;
  onRemoveCourse?: (courseId: string, courseName: string, milestoneId: string, milestoneName: string) => void;
  onExploreAlternatives?: (courseId: string, courseName: string, milestoneId: string, milestoneName: string) => void;
}

function AssignmentCompleteIcon() {
  return (
    <svg className="shrink-0" width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M6.41667 12.8333C9.96049 12.8333 12.8333 9.96049 12.8333 6.41667C12.8333 2.87284 9.96049 0 6.41667 0C2.87284 0 0 2.87284 0 6.41667C0 9.96049 2.87284 12.8333 6.41667 12.8333ZM8.93801 4.21465L5.2302 7.92247L3.67708 6.3584C3.58958 6.2709 3.48567 6.22715 3.36536 6.22715C3.24505 6.22715 3.14114 6.2709 3.05364 6.3584C2.96614 6.4459 2.92057 6.54981 2.91692 6.67012C2.91328 6.79044 2.9552 6.89434 3.0427 6.98184L4.92395 8.86309C5.01145 8.95059 5.11354 8.99434 5.2302 8.99434C5.34687 8.99434 5.44895 8.95059 5.53645 8.86309L9.55052 4.83809C9.63802 4.75059 9.68177 4.64669 9.68177 4.52637C9.68177 4.40606 9.63802 4.30215 9.55052 4.21465C9.46302 4.12715 9.36093 4.0834 9.24427 4.0834C9.1276 4.0834 9.02552 4.12715 8.93801 4.21465Z" fill="#c1cad9"/>
    </svg>
  );
}

function formatProductType(productType: string): string {
  switch (productType) {
    case "PROFESSIONAL_CERTIFICATE":
      return "Professional certificate";
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

function ProductTypeTag({ productType }: { productType: string }) {
  const isCareerCert = productType === "PROFESSIONAL_CERTIFICATE" || productType === "SPECIALIZATION";
  const label = isCareerCert ? "Career Certificate" : productType === "GUIDED_PROJECT" ? "Guided Project" : "Certificate";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-1.5 text-xs leading-[18px]",
        isCareerCert
          ? "bg-[#f0f6ff] border border-[#f0f6ff] text-[#0056d2]"
          : "bg-white border border-[#dae1ed] text-[#5b6780]",
      )}
    >
      {label}
    </span>
  );
}

/**
 * Renders a duration like "3-6 months" with the number portion in semibold
 * and the unit (months/weeks) in regular weight, matching the Figma spec.
 */
function DurationChip({ duration }: { duration: string }) {
  const match = duration.match(/^([\d\-–\s]+)\s*(.*)$/);
  if (!match) {
    return (
      <span className="flex shrink-0 items-center gap-1 text-sm text-[#404b61]">
        <AssignmentCompleteIcon />
        <span>{duration}</span>
      </span>
    );
  }
  return (
    <span className="flex shrink-0 items-center gap-1 text-sm text-[#404b61]">
      <AssignmentCompleteIcon />
      <span>
        <span className="font-semibold">{match[1]}</span>
        <span>{match[2]}</span>
      </span>
    </span>
  );
}

function PartnerLogos({ partners, partnerLogos }: { partners: string[]; partnerLogos: string[] }) {
  return (
    <div className="flex items-center gap-0.5">
      {partners.slice(0, 3).map((partner, i) => {
        const logoUrl = partnerLogos[i];
        return (
          <div
            key={partner}
            className="flex h-[14px] w-[14px] items-center justify-center overflow-hidden rounded-[3px] border border-[#dae1ed] bg-white"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={partner} className="h-full w-full object-contain" />
            ) : (
              <span className="text-[7px] font-bold text-[#5b6780]">{partner.charAt(0)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ShimmerPlaceholder() {
  return (
    <div
      className="h-[68px] w-full rounded-lg"
      role="status"
      aria-label="Loading replacement course"
      style={{
        background: "linear-gradient(to right, #f0f6ff, #e3eeff 50%, #f0f6ff)",
        animation: "shimmer 2s ease-in-out infinite",
      }}
    />
  );
}

function CourseEditMenu({ onClose, onRemove, onExploreAlternatives, swapDisabled = false, openUp = false }: { onClose: () => void; onRemove?: () => void; onExploreAlternatives?: () => void; swapDisabled?: boolean; openUp?: boolean }) {
  return (
    <>
      {/* Backdrop to close menu */}
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className={clsx(
        "absolute right-0 z-20 rounded-xl bg-white py-3 px-2 shadow-[0px_0px_4px_0px_#e8eef7,0px_4px_12px_4px_rgba(54,64,81,0.08)]",
        openUp ? "bottom-full mb-1" : "top-full mt-1",
      )}>
        <button
          onClick={() => { onRemove?.(); onClose(); }}
          disabled={swapDisabled}
          className={clsx(
            "flex w-[175px] items-center justify-between rounded p-2 text-sm",
            swapDisabled ? "text-[#c1cad9] cursor-not-allowed" : "text-[#0f1114] hover:bg-[#f0f6ff]",
          )}
        >
          Remove
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5.5 2.5V3.5h5V2.5h-5zM3.5 4v9a1 1 0 001 1h7a1 1 0 001-1V4h-9zm2.5 2v5m2-5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>
        <button
          onClick={() => { onExploreAlternatives?.(); onClose(); }}
          disabled={swapDisabled}
          className={clsx(
            "flex w-[175px] items-center justify-between rounded p-2 text-sm",
            swapDisabled ? "text-[#c1cad9] cursor-not-allowed" : "text-[#0f1114] hover:bg-[#f0f6ff]",
          )}
        >
          Explore alternatives
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 8a5.5 5.5 0 019.37-3.9M13.5 8a5.5 5.5 0 01-9.37 3.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M12.5 2v3h-3M3.5 14v-3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </>
  );
}

function ExpandedCourseRow({
  course,
  milestoneName,
  isLast = false,
  isPending = false,
  swapDisabled = false,
  onRemove,
  onExploreAlternatives,
}: {
  course: PlanCourse;
  milestoneName: string;
  isLast?: boolean;
  isPending?: boolean;
  swapDisabled?: boolean;
  onRemove?: () => void;
  onExploreAlternatives?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (isPending) {
    return (
      <div className="py-3 pl-[40px]">
        <ShimmerPlaceholder />
      </div>
    );
  }

  const productLabel = formatProductType(course.productType);

  return (
    <div className="group flex items-start gap-3 py-3 pl-[40px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={course.imageUrl}
        alt={course.name}
        className="h-[52px] w-[89px] shrink-0 rounded-lg bg-[#f0f6ff] object-cover"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <a
            href={"https://www.coursera.org" + course.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#0f1114] hover:underline"
          >
            {course.name}
          </a>
          {/* Metadata below name */}
          <div className="flex items-center gap-1 text-xs text-[#5b6780]">
            <PartnerLogos partners={course.partners} partnerLogos={course.partnerLogos} />
            <span>{course.partners[0] ?? ""}</span>
            <span>·</span>
            <span>{course.duration || "12 hours"}</span>
            <span>·</span>
            <span>{productLabel}</span>
          </div>
        </div>
        {/* Product type tag */}
        <div className="flex flex-wrap gap-1">
          <ProductTypeTag productType={course.productType} />
        </div>
      </div>
      {/* Right side: edit icon */}
      <div className="relative flex shrink-0 items-center">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-5 w-5 items-center justify-center rounded text-[#5b6780] opacity-0 transition-opacity hover:bg-[#f0f6ff] group-hover:opacity-100"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M10.9866 5.48355C11.6314 4.83882 12.6767 4.83882 13.3214 5.48355L14.5165 6.67859C15.1612 7.32331 15.1612 8.36862 14.5165 9.01335L8.69099 14.8388C8.58779 14.942 8.44781 15 8.30186 15H5.55031C5.24638 15 5 14.7536 5 14.4497V11.6981C5 11.5522 5.05798 11.4122 5.16118 11.309L10.9866 5.48355ZM12.5432 6.2618C12.3283 6.04689 11.9798 6.04689 11.7649 6.2618L11.2814 6.74535L13.2547 8.71864L13.7382 8.2351C13.9531 8.02019 13.9531 7.67175 13.7382 7.45684L12.5432 6.2618ZM12.4764 9.4969L10.5031 7.5236L6.10062 11.9261V13.8994H8.07391L12.4764 9.4969Z" fill="#6D7C99"/>
          </svg>
        </button>
        {menuOpen && <CourseEditMenu onClose={() => setMenuOpen(false)} onRemove={onRemove} onExploreAlternatives={onExploreAlternatives} swapDisabled={swapDisabled} openUp={isLast} />}
      </div>
    </div>
  );
}

function formatCourseCount(courses: PlanCourse[]): string {
  const projects = courses.filter((c) => c.productType === "GUIDED_PROJECT").length;
  const nonProjects = courses.length - projects;
  const parts: string[] = [];
  if (nonProjects > 0) parts.push(`${nonProjects} ${nonProjects === 1 ? "Course" : "Courses"}`);
  if (projects > 0) parts.push(`${projects} ${projects === 1 ? "project" : "projects"}`);
  return parts.join(", ") || `${courses.length} Courses`;
}

/**
 * Parse a milestone description in the format "Goal: skill1, skill2, ..."
 * Returns { prefix, rest } or null if not in that format.
 */
function parseDescription(description: string): { prefix: string; rest: string } | null {
  const match = description.match(/^(Goal):?\s*(.*)$/i);
  if (!match) return null;
  return { prefix: match[1] + ":", rest: match[2] };
}

function MilestoneCard({
  milestone,
  index,
  pendingRemovals,
  swapDisabled,
  onRemoveCourse,
  onExploreAlternatives,
}: {
  milestone: PlanMilestone;
  index: number;
  pendingRemovals?: Set<string>;
  swapDisabled?: boolean;
  onRemoveCourse?: (courseId: string, courseName: string, milestoneId: string, milestoneName: string) => void;
  onExploreAlternatives?: (courseId: string, courseName: string, milestoneId: string, milestoneName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const uniquePartners = milestone.courses.flatMap((c) => c.partners).filter((v, i, a) => a.indexOf(v) === i);
  const uniqueLogos = milestone.courses.flatMap((c) => c.partnerLogos).filter((v, i, a) => a.indexOf(v) === i);
  const parsed = parseDescription(milestone.description);

  return (
    <div className="relative rounded-2xl bg-white px-4">
      {/* Milestone header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={clsx(
          "flex w-full items-center gap-3 py-4 text-left",
          expanded && "border-b border-[#dae1ed]",
        )}
      >
        {/* Milestone number */}
        <div className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded bg-[#f2f5fa]">
          <span className="text-xs font-semibold text-[#0f1114]">{index}</span>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-base font-semibold tracking-tight text-[#0f1114]">{milestone.name}</p>
          {/* Description line: bold prefix + regular skills */}
          {parsed ? (
            <p className="text-xs text-[#0f1114]">
              <span className="font-semibold">{parsed.prefix} </span>
              <span className="font-normal">{parsed.rest}</span>
            </p>
          ) : (
            <p className="text-xs text-[#5b6780]">
              {milestone.description || milestone.skills.join(", ")}
            </p>
          )}
          {/* Partner logos + course count (collapsed only) */}
          {!expanded && (
            <div className="flex items-center gap-2">
              <PartnerLogos partners={uniquePartners} partnerLogos={uniqueLogos} />
              <span className="text-xs text-[#5b6780]">
                {formatCourseCount(milestone.courses)}
              </span>
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          size={20}
          className={clsx("shrink-0 text-[#5b6780] transition-transform duration-200", expanded && "rotate-180")}
        />
      </button>

      {/* Expanded course list */}
      {expanded && (
        <div>
          {milestone.courses.map((course, idx) => (
            <ExpandedCourseRow
              key={`${milestone.id}-${course.id}`}
              course={course}
              milestoneName={milestone.name}
              isLast={idx === milestone.courses.length - 1}
              isPending={pendingRemovals?.has(course.id) ?? false}
              swapDisabled={swapDisabled}
              onRemove={() => onRemoveCourse?.(course.id, course.name, milestone.id, milestone.name)}
              onExploreAlternatives={() => onExploreAlternatives?.(course.id, course.name, milestone.id, milestone.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LearningPlanBanner({ plan, onViewPlan, pendingRemovals, swapDisabled, isRefining, onRemoveCourse, onExploreAlternatives }: LearningPlanBannerProps) {
  return (
    <div
      className="rounded-2xl border border-[#dae1ed] bg-[#f0f6ff] p-5"
      style={{ animation: "fadeSlideIn 200ms ease-out" }}
    >
      {/* Sparkle */}
      <SparkleIcon className="h-3 w-3" />

      {/* Title row */}
      <div className="mt-1 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold leading-6 tracking-tight text-black">
            {plan.title}
          </h2>
          {/* Status chips */}
          <div className="mt-1 flex items-center gap-2">
            <span className="flex max-w-[220px] items-center gap-1 text-sm text-[#404b61]">
              <AssignmentCompleteIcon />
              <span className="truncate">{plan.summary.role}</span>
            </span>
            <span className="shrink-0 text-xs text-[#c1cad9]">•</span>
            <span className="flex min-w-0 max-w-[320px] items-center gap-1 text-sm text-[#404b61]">
              <AssignmentCompleteIcon />
              <span className="truncate">{plan.summary.skills.slice(0, 3).join(", ")}</span>
            </span>
            <span className="shrink-0 text-xs text-[#c1cad9]">•</span>
            <DurationChip duration={plan.summary.totalDuration.replace(/about\s*/i, "")} />
          </div>
        </div>
        <button
          onClick={onViewPlan}
          className="shrink-0 rounded-md bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0048b0] transition-colors"
        >
          Start learning plan
        </button>
      </div>

      {/* Milestone course cards — replaced with shimmer skeleton when refining */}
      <div className="mt-3 space-y-2">
        {isRefining ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[80px] w-full rounded-2xl"
                style={{
                  background: `linear-gradient(to right, white, #e3eeff ${30 + i * 20}%, white)`,
                  animation: "shimmer 2s ease-in-out infinite",
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>
        ) : (
          plan.milestones.filter((ms) => ms.courses.length > 0).map((milestone, msIdx) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              index={msIdx + 1}
              pendingRemovals={pendingRemovals}
              swapDisabled={swapDisabled}
              onRemoveCourse={onRemoveCourse}
              onExploreAlternatives={onExploreAlternatives}
            />
          ))
        )}
      </div>
    </div>
  );
}
