import React from 'react';
import type { TrendingCourseItem } from './trendingItems';

export function TrendingCourseColumn({
  title,
  items,
  id,
  className = '',
  onHeadingCycle,
  headingCycleAriaLabel,
}: {
  title: string;
  items: readonly TrendingCourseItem[];
  id?: string;
  className?: string;
  /** When set, the trailing arrow is a button that cycles the parent-controlled skill (e.g. Skill Gap). */
  onHeadingCycle?: () => void;
  headingCycleAriaLabel?: string;
}) {
  return (
    <div
      id={id}
      className={`bg-[var(--cds-color-grey-25)] rounded-[var(--cds-border-radius-200)] p-4 ${className}`.trim()}
    >
      <div className="mb-3 flex items-start gap-2">
        <h3 className="cds-subtitle-md min-w-0 flex-1 text-[var(--cds-color-grey-975)] leading-snug line-clamp-3">
          {title}
        </h3>
        {onHeadingCycle != null ? (
          <button
            type="button"
            className="mt-0.5 shrink-0 rounded-[var(--cds-border-radius-100)] p-1 text-[var(--cds-color-grey-600)] transition-colors hover:bg-[var(--cds-color-grey-100)] hover:text-[var(--cds-color-grey-975)]"
            aria-label={headingCycleAriaLabel ?? 'Show next category'}
            onClick={onHeadingCycle}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }} aria-hidden>
              arrow_forward
            </span>
          </button>
        ) : (
          <span
            className="material-symbols-rounded shrink-0 text-[var(--cds-color-grey-600)]"
            style={{ fontSize: 20 }}
            aria-hidden
          >
            arrow_forward
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <div
            key={`${item.title}-${item.provider}-${idx}`}
            className="group flex cursor-pointer items-center gap-3 rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-white)] p-2"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--cds-border-radius-50)] bg-[var(--cds-color-grey-100)]">
              <img src={item.image} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-1">
                <div className="h-[18px] w-[18px] shrink-0 rounded-[var(--cds-border-radius-50)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)]" />
                <span className="cds-body-secondary text-[var(--cds-color-grey-600)]">{item.provider}</span>
              </div>
              <p className="cds-subtitle-sm text-[var(--cds-color-grey-975)] group-hover:text-[var(--cds-color-blue-700)]">
                {item.title}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 cds-body-tertiary text-[var(--cds-color-grey-600)]">
                <span className="shrink-0">{item.timeCommitment}</span>
                <span aria-hidden>·</span>
                <span>{item.type}</span>
                <span aria-hidden>·</span>
                <span className="flex items-center gap-0.5">
                  <span
                    className="material-symbols-rounded text-[var(--cds-color-grey-975)]"
                    style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  {item.rating}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
