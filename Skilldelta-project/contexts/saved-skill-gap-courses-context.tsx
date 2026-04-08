import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TrendingCourseItem } from "@/components/trendingItems";

export type JobContextForSkillGap = {
  role: string;
  company: string;
};

export type SavedSkillGapCourseItem = TrendingCourseItem & {
  savedAt: string;
};

export type SkillGapSavedCollection = {
  id: string;
  label: string;
  items: SavedSkillGapCourseItem[];
};

function slugPart(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "x";
}

export function buildSkillGapCollectionLabel(ctx: JobContextForSkillGap): string {
  const r = ctx.role.trim();
  const c = ctx.company.trim();
  if (r && c) return `${r} ${c} skill gaps`;
  if (r) return `${r} skill gaps`;
  if (c) return `${c} skill gaps`;
  return "Job skill gaps";
}

export function getSkillGapCollectionId(ctx: JobContextForSkillGap | null): string {
  if (!ctx) return "sg-job-default";
  const r = ctx.role.trim();
  const c = ctx.company.trim();
  if (!r && !c) return "sg-job-default";
  return `sg-${slugPart(r)}-${slugPart(c)}`;
}

type SavedSkillGapCoursesContextValue = {
  collections: SkillGapSavedCollection[];
  /** Job parsed from the last LinkedIn job link (drives save grouping). */
  activeJobContext: JobContextForSkillGap | null;
  setJobContextForSkillGapSaves: (ctx: JobContextForSkillGap | null) => void;
  addCourseToSkillGapCollection: (item: TrendingCourseItem) => void;
  removeCourseFromSkillGapCollection: (
    collectionId: string,
    item: Pick<TrendingCourseItem, "title" | "provider">,
  ) => void;
};

const SavedSkillGapCoursesContext = createContext<SavedSkillGapCoursesContextValue | null>(null);

export function SavedSkillGapCoursesProvider({ children }: { children: ReactNode }) {
  const [activeJobContext, setActiveJobContext] = useState<JobContextForSkillGap | null>(null);
  const [collections, setCollections] = useState<SkillGapSavedCollection[]>([]);

  const setJobContextForSkillGapSaves = useCallback((ctx: JobContextForSkillGap | null) => {
    setActiveJobContext(ctx);
  }, []);

  const addCourseToSkillGapCollection = useCallback(
    (item: TrendingCourseItem) => {
      const ctx: JobContextForSkillGap = activeJobContext ?? { role: "", company: "" };
      const id = getSkillGapCollectionId(activeJobContext);
      const label = buildSkillGapCollectionLabel(ctx);
      const savedAt = new Date().toISOString();
      const withMeta: SavedSkillGapCourseItem = { ...item, savedAt };

      setCollections((prev) => {
        const i = prev.findIndex((c) => c.id === id);
        if (i === -1) {
          return [...prev, { id, label, items: [withMeta] }];
        }
        const col = prev[i]!;
        if (col.items.some((x) => x.title === item.title && x.provider === item.provider)) {
          return prev;
        }
        const next = [...prev];
        next[i] = { ...col, items: [...col.items, withMeta] };
        return next;
      });
    },
    [activeJobContext],
  );

  const removeCourseFromSkillGapCollection = useCallback(
    (collectionId: string, item: Pick<TrendingCourseItem, "title" | "provider">) => {
      setCollections((prev) =>
        prev
          .map((c) => {
            if (c.id !== collectionId) return c;
            const items = c.items.filter(
              (x) => !(x.title === item.title && x.provider === item.provider),
            );
            return { ...c, items };
          })
          .filter((c) => c.items.length > 0),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      collections,
      activeJobContext,
      setJobContextForSkillGapSaves,
      addCourseToSkillGapCollection,
      removeCourseFromSkillGapCollection,
    }),
    [
      collections,
      activeJobContext,
      setJobContextForSkillGapSaves,
      addCourseToSkillGapCollection,
      removeCourseFromSkillGapCollection,
    ],
  );

  return (
    <SavedSkillGapCoursesContext.Provider value={value}>{children}</SavedSkillGapCoursesContext.Provider>
  );
}

export function useSavedSkillGapCourses(): SavedSkillGapCoursesContextValue {
  const ctx = useContext(SavedSkillGapCoursesContext);
  if (!ctx) {
    throw new Error("useSavedSkillGapCourses must be used within SavedSkillGapCoursesProvider");
  }
  return ctx;
}

/** Optional: use in UI that may render outside the provider (no-op). */
export function useSavedSkillGapCoursesOptional(): SavedSkillGapCoursesContextValue | null {
  return useContext(SavedSkillGapCoursesContext);
}
