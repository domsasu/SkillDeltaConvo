import { useEffect, useRef, useState } from "react";
import { SKILL_GAP_ROLE_UPLOAD_FOCUS } from "@/components/skillGapConstants";
import { getCourseraShortCoursesForPrioritySkill } from "@/components/rolePriorityCourseraCourses";
import type { TrendingCourseItem } from "@/components/trendingItems";
import {
  getSkillGapCollectionId,
  useSavedSkillGapCoursesOptional,
} from "@/contexts/saved-skill-gap-courses-context";

/** Assistant message text — MessageBubble renders custom UI instead of Markdown. */
export const CHAT_UI_RESUME_AND_COURSES = "[[CHAT_UI:RESUME_AND_COURSES]]";

const COURSE_CARD_REVEAL_DELAY_MS = 3000;

function CourseRow({ item }: { item: TrendingCourseItem }) {
  const savedCtx = useSavedSkillGapCoursesOptional();
  const [localSaved, setLocalSaved] = useState(false);
  const [playFill, setPlayFill] = useState(false);
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const collectionId = getSkillGapCollectionId(savedCtx?.activeJobContext ?? null);
  const inCollection = savedCtx
    ? Boolean(
        savedCtx.collections
          .find((c) => c.id === collectionId)
          ?.items.some((i) => i.title === item.title && i.provider === item.provider),
      )
    : false;
  const saved = savedCtx ? inCollection : localSaved;

  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, []);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !saved;
    if (savedCtx) {
      if (next) {
        savedCtx.addCourseToSkillGapCollection(item);
        setPlayFill(true);
        if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
        animTimeoutRef.current = setTimeout(() => {
          setPlayFill(false);
          animTimeoutRef.current = null;
        }, 480);
      } else {
        savedCtx.removeCourseFromSkillGapCollection(collectionId, {
          title: item.title,
          provider: item.provider,
        });
      }
    } else {
      setLocalSaved(next);
      if (next) {
        setPlayFill(true);
        if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
        animTimeoutRef.current = setTimeout(() => {
          setPlayFill(false);
          animTimeoutRef.current = null;
        }, 480);
      }
    }
  };

  return (
    <div className="group flex cursor-pointer items-center gap-3 rounded-xl border border-[#eaeef4] bg-white p-2.5 shadow-sm transition-colors hover:border-[#c9d6ee]">
      <div className="flex shrink-0 items-start pt-0.5">
        <button
          type="button"
          onClick={handleSaveClick}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save course"}
          className={`-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[#eef2f7] ${
            saved ? "text-[#0056d2]" : "text-[#5b6780] hover:text-[#0f1114]"
          }`}
        >
          <span
            className={`material-symbols-rounded block text-[20px] leading-none ${
              playFill ? "animate-save-bookmark" : ""
            }`}
            style={{
              fontVariationSettings: saved
                ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
            }}
          >
            bookmark
          </span>
        </button>
      </div>
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#eef2f7]">
        <img src={item.image} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs text-[#5b6780]">{item.provider}</p>
        <p className="text-sm font-semibold leading-snug text-[#0f1114] group-hover:text-[#0056d2]">
          {item.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-[#5b6780]">
          <span>{item.timeCommitment}</span>
          <span aria-hidden>·</span>
          <span>{item.type}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-0.5">
            <span className="text-[#0f1114]" aria-hidden>
              ★
            </span>
            {item.rating}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Combined resume praise + course recommendations (card appears after {@link COURSE_CARD_REVEAL_DELAY_MS}). */
export function ResumeAndCoursesFollowupBlock() {
  const skills = SKILL_GAP_ROLE_UPLOAD_FOCUS;
  const [activeIdx, setActiveIdx] = useState(0);
  const [cardReady, setCardReady] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const didInitialCourseScrollRef = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => setCardReady(true), COURSE_CARD_REVEAL_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!cardReady) return;
    const id = window.setTimeout(() => {
      const firstReveal = !didInitialCourseScrollRef.current;
      didInitialCourseScrollRef.current = true;
      threadEndRef.current?.scrollIntoView({
        behavior: firstReveal ? "auto" : "smooth",
        block: "end",
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [cardReady, activeIdx]);

  const activeSkill = skills[activeIdx] ?? skills[0]!;
  const courses = getCourseraShortCoursesForPrioritySkill(activeSkill);

  return (
    <div className="w-full min-w-0 text-base leading-relaxed text-[#0f1114]">
      <p>That&apos;s a solid resume, I now see more relevant skills.</p>

      <p className="mt-4">
        Here are courses or projects that take under a week to boost your profile based on the{" "}
        <strong className="font-semibold text-[#0f1114]">
          remaining 3 skills required for this role
        </strong>
        :
      </p>

      {!cardReady ? (
        <div className="mt-3 space-y-2" aria-busy="true">
          <div className="h-24 animate-pulse rounded-xl bg-[#eef2f7]" />
          <div className="h-24 animate-pulse rounded-xl bg-[#eef2f7]" />
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`max-w-full rounded-full border px-3 py-1.5 text-left text-xs font-medium leading-snug transition-colors ${
                  i === activeIdx
                    ? "border-[#0056d2] bg-[#e8f1fc] text-[#0f1114]"
                    : "border-[#dae1ed] bg-[#f8fafc] text-[#0f1114] hover:border-[#c9d6ee]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-2xl border border-[#dae1ed] bg-[#f4f6fa] p-3">
            <h3 className="mb-3 text-base font-semibold leading-snug text-[#0f1114]">
              {activeSkill}
            </h3>
            <div className="flex flex-col gap-2">
              {courses.length === 0 ? (
                <p className="text-xs text-[#5b6780]">
                  No under-a-week items for this skill in the demo catalog.
                </p>
              ) : (
                courses.map((item, idx) => <CourseRow key={`${item.title}-${idx}`} item={item} />)
              )}
            </div>
          </div>
        </>
      )}
      <div ref={threadEndRef} className="h-px w-full shrink-0" aria-hidden />
    </div>
  );
}
