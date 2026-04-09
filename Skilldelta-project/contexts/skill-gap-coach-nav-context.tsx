import { createContext, useContext, type ReactNode } from "react";

type SkillGapCoachNavContextValue = {
  /** After bookmarking a course into My Learning from the coach skill-gap card, open dashboard on the Saved tab. */
  onAfterSaveCourseToMyLearning: () => void;
};

const SkillGapCoachNavContext = createContext<SkillGapCoachNavContextValue | null>(null);

export function SkillGapCoachNavProvider({
  children,
  onAfterSaveCourseToMyLearning,
}: {
  children: ReactNode;
  onAfterSaveCourseToMyLearning: () => void;
}) {
  return (
    <SkillGapCoachNavContext.Provider value={{ onAfterSaveCourseToMyLearning }}>
      {children}
    </SkillGapCoachNavContext.Provider>
  );
}

export function useSkillGapCoachNavOptional(): SkillGapCoachNavContextValue | null {
  return useContext(SkillGapCoachNavContext);
}
