import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  SKILL_GAP_COPY,
  SKILL_GAP_FLOATING_PILLS,
  SKILL_GAP_HERO,
  SKILL_GAP_ROLE_LINK_PREVIEW_DELAY_MS,
  SKILL_GAP_ROLE_UPLOAD_FOCUS,
  SKILL_GAP_ROLE_UPLOAD_OTHER,
  SKILL_GAP_UPLOAD_PREVIEW_DELAY_MS,
  SKILL_GAP_UPLOAD_PREVIEW_SKILLS,
} from './skillGapConstants';
import {
  analyzeSkillGap,
  isGeminiConfigured,
  type SkillGapAnalysis,
} from '../services/geminiService';
import { getCourseraShortCoursesForPrioritySkill } from './rolePriorityCourseraCourses';
import { TrendingCourseColumn } from './TrendingCourseColumn';

type PanelId = 'found' | 'opportunities';

function GreyPulseListSkeleton({ statusText }: { statusText: string }) {
  const widths = ['w-full', 'w-[94%]', 'w-[88%]', 'w-full', 'w-[76%]', 'w-[90%]'];
  return (
    <div className="space-y-2.5" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{statusText}</span>
      {widths.map((tw, i) => (
        <div
          key={i}
          className={`h-2.5 rounded-full bg-[var(--cds-color-grey-100)] animate-pulse ${tw}`}
          style={{ animationDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  );
}

function pickResumeFileFromList(files: FileList | null): File | null {
  if (!files?.length) return null;
  const list = Array.from(files);
  return list.find((f) => /\.(pdf|txt)$/i.test(f.name)) ?? list[0];
}

function isValidHttpsJobUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'https:' && Boolean(u.hostname);
  } catch {
    return false;
  }
}

function CollapsiblePanel({
  id,
  title,
  count,
  badgeClass,
  hint,
  expanded,
  onToggle,
  emptyMessage,
  children,
  isLoading = false,
  loadingStatusText,
  collapsedFooter,
}: {
  id: PanelId;
  title: string;
  count: number;
  badgeClass: string;
  hint?: string;
  expanded: boolean;
  onToggle: () => void;
  emptyMessage: string;
  children: React.ReactNode;
  isLoading?: boolean;
  loadingStatusText?: string;
  /** Shown below the header row when collapsed (e.g. Found skills encouragement). */
  collapsedFooter?: React.ReactNode;
}) {
  const hasContent = count > 0;
  const showCollapsedFooter = !expanded && !isLoading && hasContent && collapsedFooter != null;
  return (
    <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--cds-color-grey-25)]"
        aria-expanded={expanded}
        aria-busy={isLoading}
        aria-controls={`${id}-panel`}
        id={`${id}-heading`}
        aria-describedby={showCollapsedFooter ? `${id}-collapsed-footer` : undefined}
      >
        <span
          className={`rounded-[var(--cds-border-radius-400)] px-2 py-0.5 cds-body-secondary shrink-0 ${badgeClass} ${isLoading ? 'min-w-[10rem]' : ''}`}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-3.5 w-14 shrink-0 rounded bg-[var(--cds-color-grey-200)] animate-pulse"
                aria-hidden
              />
              <span className="cds-body-secondary">{title}</span>
            </span>
          ) : (
            <>
              {count} {title}
            </>
          )}
        </span>
        <span
          className="material-symbols-rounded ml-auto text-[var(--cds-color-grey-600)] shrink-0"
          style={{ fontSize: 22 }}
          aria-hidden
        >
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {showCollapsedFooter ? (
        <p
          id={`${id}-collapsed-footer`}
          className="border-t border-[var(--cds-color-grey-100)] px-4 py-3 cds-body-secondary text-[var(--cds-color-grey-600)]"
        >
          {collapsedFooter}
        </p>
      ) : null}
      {expanded && (
        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-heading`}
          aria-busy={isLoading}
          className="border-t border-[var(--cds-color-grey-100)] px-4 py-3"
        >
          {hint ? (
            <p className="cds-body-tertiary text-[var(--cds-color-grey-600)] mb-3">{hint}</p>
          ) : null}
          {isLoading ? (
            <GreyPulseListSkeleton statusText={loadingStatusText ?? 'Loading'} />
          ) : hasContent ? (
            children
          ) : (
            <p className="cds-body-secondary text-[var(--cds-color-grey-600)]">{emptyMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Wrapping skill chips (Found skills + analyzed Skill opportunities). */
function FoundSkillTags({ items }: { items: string[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0" role="list">
      {items.map((s, i) => (
        <li key={`${i}-${s}`} role="listitem">
          <span className="inline-flex max-w-full items-center rounded-full border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] px-2.5 py-1 text-left cds-body-secondary text-[var(--cds-color-grey-975)]">
            {s}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Job-link preview pills: green for secondary group, caution yellow for priority focus. */
function RoleLinkOpportunityTags({
  items,
  variant = 'green',
  selectedIndex,
  onSelectIndex,
}: {
  items: readonly string[];
  variant?: 'green' | 'caution';
  /** When set with onSelectIndex, pills are buttons that drive the trending course column. */
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
}) {
  const chipTone =
    variant === 'caution'
      ? 'border-[var(--cds-color-yellow-200)] bg-[var(--cds-color-yellow-25)]'
      : 'border-[var(--cds-color-green-200)] bg-[var(--cds-color-green-25)]';
  const selectedStroke =
    variant === 'caution'
      ? 'border-2 border-[var(--cds-color-yellow-900)]'
      : 'border-2 border-[var(--cds-color-green-800)]';
  const interactive =
    onSelectIndex != null
      ? `cursor-pointer transition-[border-color,background-color] hover:bg-[var(--cds-color-yellow-50)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          variant === 'caution'
            ? 'focus-visible:outline-[var(--cds-color-yellow-900)]'
            : 'focus-visible:outline-[var(--cds-color-blue-700)]'
        }`
      : '';

  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0" role="list">
      {items.map((s, i) => {
        const selected = selectedIndex === i;
        const chipClass = `inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-left cds-body-secondary text-[var(--cds-color-grey-975)] ${chipTone} ${interactive} ${selected ? selectedStroke : ''}`;

        return (
          <li key={`${i}-${s}`} role="listitem">
            {onSelectIndex != null ? (
              <button
                type="button"
                className={chipClass}
                aria-pressed={selected}
                onClick={() => onSelectIndex(i)}
              >
                {s}
              </button>
            ) : (
              <span className={chipClass}>{s}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function RoleLinkPrioritySkillsPreviewSection({
  focus,
  selectedPriorityIndex,
  onSelectPriorityIndex,
}: {
  focus: readonly string[];
  selectedPriorityIndex: number;
  onSelectPriorityIndex: (index: number) => void;
}) {
  return (
    <div>
      <p className="cds-body-secondary mb-2 font-semibold text-[var(--cds-color-grey-975)]">
        {SKILL_GAP_COPY.roleLinkOpportunitiesExpandedLead}
      </p>
      <RoleLinkOpportunityTags
        items={focus}
        variant="caution"
        selectedIndex={selectedPriorityIndex}
        onSelectIndex={onSelectPriorityIndex}
      />
    </div>
  );
}

function RoleLinkOtherSkillAreasPreviewSection({ other }: { other: readonly string[] }) {
  return (
    <div>
      <p className="cds-body-secondary mb-2 font-semibold text-[var(--cds-color-grey-975)]">
        {SKILL_GAP_COPY.roleLinkOtherSkillAreasLead}
      </p>
      <RoleLinkOpportunityTags items={other} variant="caution" />
    </div>
  );
}

const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)';

/** Visible typewriter line; screen readers get the full string immediately via sr-only. */
function TypewriterEncouragement({
  text,
  onComplete,
  msPerChar = 26,
}: {
  text: string;
  onComplete?: () => void;
  msPerChar?: number;
}) {
  const [shown, setShown] = useState('');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setShown('');
    if (!text) return;

    const reduced =
      typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_MQ).matches;

    if (reduced) {
      setShown(text);
      const id = window.requestAnimationFrame(() => {
        onCompleteRef.current?.();
      });
      return () => window.cancelAnimationFrame(id);
    }

    let i = 0;
    let timeoutId = 0;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        onCompleteRef.current?.();
        return;
      }
      timeoutId = window.setTimeout(step, msPerChar);
    };

    timeoutId = window.setTimeout(step, msPerChar);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [text, msPerChar]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{shown}</span>
    </>
  );
}

export type SkillGapToolProps = {
  /** Increment (e.g. from Header) to scroll into view and expand the full tool. */
  expandRequestToken?: number;
  /** When true, render the full tool immediately (e.g. My Learning → Career tools). */
  defaultExpanded?: boolean;
};

export const SkillGapTool: React.FC<SkillGapToolProps> = ({
  expandRequestToken = 0,
  defaultExpanded = false,
}) => {
  const uploadModalTitleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const extractPreviewTimerRef = useRef<number | null>(null);
  const roleLinkPreviewTimerRef = useRef<number | null>(null);

  const [resumeText, setResumeText] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileBusy, setFileBusy] = useState(false);
  const [foundSkillsUploadLoading, setFoundSkillsUploadLoading] = useState(false);
  const [uploadPreviewFoundSkills, setUploadPreviewFoundSkills] = useState<string[] | null>(null);
  const [jobTitle, setJobTitle] = useState('');

  const [jobRoleLink, setJobRoleLink] = useState('');
  const [roleLinkError, setRoleLinkError] = useState<string | null>(null);
  const [roleLinkUploadBusy, setRoleLinkUploadBusy] = useState(false);
  const [roleLinkPreview, setRoleLinkPreview] = useState<{
    focus: readonly string[];
    other: readonly string[];
  } | null>(null);
  /** Which priority focus skill drives #skill-gap-trending-most-popular (chips + heading cycle). */
  const [rolePrioritySkillIndex, setRolePrioritySkillIndex] = useState(0);

  const [jobDescription, setJobDescription] = useState('');

  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [analyzeBusy, setAnalyzeBusy] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Record<PanelId, boolean>>({
    found: true,
    opportunities: true,
  });

  const [toolExpanded, setToolExpanded] = useState(defaultExpanded);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);

  useEffect(() => {
    if (!expandRequestToken) return;
    setToolExpanded(true);
    const raf = window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [expandRequestToken]);

  useEffect(() => {
    setRolePrioritySkillIndex(0);
  }, [roleLinkPreview]);

  useEffect(() => {
    const len = roleLinkPreview?.focus.length ?? 0;
    if (len < 1) return;
    setRolePrioritySkillIndex((i) => Math.min(i, len - 1));
  }, [roleLinkPreview?.focus.length]);

  const geminiReady = useMemo(() => isGeminiConfigured(), []);

  const toggle = useCallback((id: PanelId) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const selectRolePrioritySkill = useCallback((index: number) => {
    setRolePrioritySkillIndex(index);
    window.requestAnimationFrame(() => {
      document.getElementById('skill-gap-trending-most-popular')?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });
  }, []);

  const cycleRolePrioritySkill = useCallback(() => {
    setRolePrioritySkillIndex((i) => {
      const len = roleLinkPreview?.focus.length ?? 0;
      if (len < 1) return 0;
      return (i + 1) % len;
    });
  }, [roleLinkPreview]);

  const processResumeFile = useCallback(async (file: File) => {
    setFileError(null);
    if (extractPreviewTimerRef.current != null) {
      window.clearTimeout(extractPreviewTimerRef.current);
      extractPreviewTimerRef.current = null;
    }
    if (roleLinkPreviewTimerRef.current != null) {
      window.clearTimeout(roleLinkPreviewTimerRef.current);
      roleLinkPreviewTimerRef.current = null;
    }
    setRoleLinkPreview(null);
    setRoleLinkUploadBusy(false);
    setUploadPreviewFoundSkills(null);
    setFoundSkillsUploadLoading(true);
    setExpanded((prev) => ({ ...prev, found: true }));
    setFileBusy(true);
    try {
      const { extractTextFromResumeFile } = await import('../services/extractResumeText');
      const text = await extractTextFromResumeFile(file);
      setResumeText(text);
      setUploadModalOpen(false);
      setDropActive(false);
      extractPreviewTimerRef.current = window.setTimeout(() => {
        setUploadPreviewFoundSkills([...SKILL_GAP_UPLOAD_PREVIEW_SKILLS]);
        setFoundSkillsUploadLoading(false);
        extractPreviewTimerRef.current = null;
      }, SKILL_GAP_UPLOAD_PREVIEW_DELAY_MS);
    } catch (err) {
      setFoundSkillsUploadLoading(false);
      setFileError(err instanceof Error ? err.message : 'Could not read file');
    } finally {
      setFileBusy(false);
    }
  }, []);

  const openUploadModal = useCallback(() => {
    setFileError(null);
    setUploadModalOpen(true);
  }, []);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      await processResumeFile(file);
    },
    [processResumeFile]
  );

  const closeUploadModal = useCallback(() => {
    if (fileBusy) return;
    setUploadModalOpen(false);
    setDropActive(false);
  }, [fileBusy]);

  const onUploadDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDropActive(false);
      const file = pickResumeFileFromList(e.dataTransfer.files);
      if (!file) {
        setFileError(SKILL_GAP_COPY.uploadModalInvalidDrop);
        return;
      }
      if (!/\.(pdf|txt)$/i.test(file.name)) {
        setFileError(SKILL_GAP_COPY.uploadModalInvalidDrop);
        return;
      }
      void processResumeFile(file);
    },
    [processResumeFile]
  );

  const onUploadDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onUploadDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropActive(true);
  }, []);

  const onUploadDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropActive(false);
    }
  }, []);

  const uploadRoleFromLink = useCallback(() => {
    const raw = jobRoleLink.trim();
    if (!isValidHttpsJobUrl(raw)) {
      setRoleLinkError(SKILL_GAP_COPY.roleLinkUrlInvalid);
      return;
    }
    setRoleLinkError(null);
    if (roleLinkPreviewTimerRef.current != null) {
      window.clearTimeout(roleLinkPreviewTimerRef.current);
      roleLinkPreviewTimerRef.current = null;
    }
    setRoleLinkUploadBusy(true);
    setRoleLinkPreview(null);
    setExpanded((prev) => ({ ...prev, opportunities: false }));
    roleLinkPreviewTimerRef.current = window.setTimeout(() => {
      setRoleLinkPreview({
        focus: SKILL_GAP_ROLE_UPLOAD_FOCUS,
        other: SKILL_GAP_ROLE_UPLOAD_OTHER,
      });
      setRoleLinkUploadBusy(false);
      setExpanded((prev) => ({ ...prev, opportunities: false }));
      roleLinkPreviewTimerRef.current = null;
    }, SKILL_GAP_ROLE_LINK_PREVIEW_DELAY_MS);
  }, [jobRoleLink]);

  const runAnalyze = useCallback(async () => {
    setAnalyzeError(null);
    const r = resumeText.trim();
    if (r.length < 40) {
      setAnalyzeError('Add more resume text (upload a file or paste below).');
      return;
    }
    const jt = jobTitle.trim();
    const jd = jobDescription.trim();
    if (!jt && jd.length < 40) {
      setAnalyzeError('Paste a job description (expand Find role if needed).');
      return;
    }
    if (!geminiReady) {
      setAnalyzeError(SKILL_GAP_COPY.geminiOffline);
      return;
    }
    setAnalyzeBusy(true);
    setAnalysis(null);
    if (roleLinkPreviewTimerRef.current != null) {
      window.clearTimeout(roleLinkPreviewTimerRef.current);
      roleLinkPreviewTimerRef.current = null;
    }
    setRoleLinkPreview(null);
    setRoleLinkUploadBusy(false);
    try {
      const result = await analyzeSkillGap({
        resumeText: r,
        jobTitle: jt || 'General professional role',
        jobDescriptionText: jd,
      });
      if (!result) {
        setAnalyzeError('Analysis failed. Try again with shorter text or check your API key.');
        return;
      }
      setAnalysis(result);
      setUploadPreviewFoundSkills(null);
      if (roleLinkPreviewTimerRef.current != null) {
        window.clearTimeout(roleLinkPreviewTimerRef.current);
        roleLinkPreviewTimerRef.current = null;
      }
      setRoleLinkPreview(null);
      setRoleLinkUploadBusy(false);
    } finally {
      setAnalyzeBusy(false);
    }
  }, [resumeText, jobTitle, jobDescription, geminiReady]);

  useEffect(() => {
    if (!toolExpanded) return;
    const t = window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => window.clearTimeout(t);
  }, [toolExpanded]);

  useEffect(() => {
    if (!toolExpanded) {
      setUploadModalOpen(false);
      setDropActive(false);
    }
  }, [toolExpanded]);

  useEffect(() => {
    if (!uploadModalOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') closeUploadModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [uploadModalOpen, closeUploadModal]);

  useEffect(() => {
    return () => {
      if (extractPreviewTimerRef.current != null) {
        window.clearTimeout(extractPreviewTimerRef.current);
      }
      if (roleLinkPreviewTimerRef.current != null) {
        window.clearTimeout(roleLinkPreviewTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (resumeText.trim().length > 0) return;
    if (extractPreviewTimerRef.current != null) {
      window.clearTimeout(extractPreviewTimerRef.current);
      extractPreviewTimerRef.current = null;
    }
    setUploadPreviewFoundSkills(null);
    setFoundSkillsUploadLoading(false);
  }, [resumeText]);

  const foundSkillsForList = useMemo(() => {
    const fromAnalysis = analysis?.foundSkills;
    if (fromAnalysis && fromAnalysis.length > 0) return fromAnalysis;
    return uploadPreviewFoundSkills ?? [];
  }, [analysis?.foundSkills, uploadPreviewFoundSkills]);

  const showUploadPreviewLead =
    Boolean(uploadPreviewFoundSkills?.length) &&
    !(analysis?.foundSkills && analysis.foundSkills.length > 0);

  const foundSkillsCollapsedFooter = useMemo(() => {
    const n = foundSkillsForList.length;
    if (n < 1) return undefined;
    return n === 1
      ? SKILL_GAP_COPY.foundSkillsCollapsedEncouragementOne
      : SKILL_GAP_COPY.foundSkillsCollapsedEncouragementMany.replace('{count}', String(n));
  }, [foundSkillsForList.length]);

  const prevFoundSkillsCountRef = useRef(0);

  useEffect(() => {
    const n = foundSkillsForList.length;
    const prev = prevFoundSkillsCountRef.current;
    if (!foundSkillsUploadLoading && n > 0 && prev === 0) {
      setExpanded((p) => ({ ...p, found: false }));
    }
    prevFoundSkillsCountRef.current = n;
  }, [foundSkillsForList.length, foundSkillsUploadLoading]);

  const opportunitiesForList = useMemo(() => {
    return analysis?.skillOpportunities ?? [];
  }, [analysis?.skillOpportunities]);

  const roleLinkPreviewCount = useMemo(() => {
    if (!roleLinkPreview) return 0;
    return roleLinkPreview.focus.length + roleLinkPreview.other.length;
  }, [roleLinkPreview]);

  const opportunitiesBadgeCount = useMemo(() => {
    if (analysis?.skillOpportunities && analysis.skillOpportunities.length > 0) {
      return analysis.skillOpportunities.length;
    }
    if (roleLinkPreviewCount > 0) {
      return roleLinkPreviewCount;
    }
    return 0;
  }, [analysis?.skillOpportunities, roleLinkPreviewCount]);

  const showTitleDisclaimer = jobTitle.trim().length > 0 && jobDescription.trim().length < 80;

  return (
    <section
      id="skill-gap-tool"
      ref={sectionRef}
      className={`scroll-mt-24 bg-[var(--cds-color-white)] border border-[var(--cds-color-grey-100)] rounded-[var(--cds-border-radius-200)] overflow-hidden hover:shadow-[var(--cds-elevation-level2)] transition-shadow p-4 sm:p-5 lg:p-6 ${
        !toolExpanded ? 'lg:flex lg:h-[300px] lg:min-h-0 lg:flex-col' : ''
      }`}
      aria-labelledby="skill-gap-main-heading"
    >
      {!toolExpanded ? (
        <div className="grid min-h-0 grid-cols-1 gap-6 lg:flex-1 lg:grid-cols-2 lg:gap-8 lg:items-stretch">
          <div className="flex min-h-0 flex-col justify-center gap-3 lg:py-0">
            <h2
              id="skill-gap-main-heading"
              className="cds-subtitle-lg text-[var(--cds-color-grey-975)] sm:text-[1.375rem] sm:leading-tight sm:font-semibold"
            >
              {SKILL_GAP_COPY.sectionTitle}
            </h2>
            <p className="cds-body-secondary whitespace-pre-line text-[var(--cds-color-grey-600)] leading-relaxed max-w-3xl lg:line-clamp-3">
              {SKILL_GAP_COPY.intro}
            </p>
            <button
              type="button"
              aria-expanded={false}
              aria-label={SKILL_GAP_COPY.entryCtaAriaLabel}
              onClick={() => setToolExpanded(true)}
              className="inline-flex h-9 w-[140px] shrink-0 items-center justify-center rounded-lg bg-[var(--cds-color-grey-975)] px-2 font-semibold text-[var(--cds-color-white)] transition-colors hover:bg-[var(--cds-color-grey-900)] cds-action-secondary text-center text-sm leading-tight"
            >
              {SKILL_GAP_COPY.entryCta}
            </button>
          </div>
          <div className="relative mx-auto h-[220px] w-full max-w-xl shrink-0 lg:mx-0 lg:h-full lg:max-w-none lg:min-h-0">
            <div className="relative h-full min-h-0 overflow-hidden rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] shadow-[var(--cds-elevation-level1)]">
              <img
                src={SKILL_GAP_HERO.imageSrc}
                alt={SKILL_GAP_HERO.imageAlt}
                className="absolute inset-0 h-full w-full object-cover grayscale"
              />
              {SKILL_GAP_FLOATING_PILLS.map((pill) => {
                const toneClasses =
                  pill.tone === 'yellow'
                    ? 'border-[var(--cds-color-yellow-200)] bg-[var(--cds-color-yellow-100)] text-[var(--cds-color-yellow-800)]'
                    : 'border-[var(--cds-color-blue-200)] bg-[var(--cds-color-blue-25)] text-[var(--cds-color-grey-975)]';
                return (
                  <span
                    key={pill.label}
                    className={`pointer-events-none absolute max-w-[min(42%,11rem)] rounded-full border px-2.5 py-1 text-center text-xs font-semibold shadow-[var(--cds-elevation-level1)] sm:text-sm ${toneClasses}`}
                    style={{
                      ...(pill.top != null ? { top: pill.top } : {}),
                      ...(pill.left != null ? { left: pill.left } : {}),
                      ...(pill.right != null ? { right: pill.right } : {}),
                      ...(pill.bottom != null ? { bottom: pill.bottom } : {}),
                    }}
                  >
                    {pill.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 space-y-2">
              <h2
                id="skill-gap-main-heading"
                className="cds-subtitle-lg text-[var(--cds-color-grey-975)] sm:text-[1.375rem] sm:leading-tight sm:font-semibold"
              >
                {SKILL_GAP_COPY.sectionTitle}
              </h2>
              <p className="cds-body-secondary whitespace-pre-line text-[var(--cds-color-grey-600)] leading-relaxed max-w-3xl">
                {SKILL_GAP_COPY.intro}
              </p>
            </div>
            <button
              type="button"
              aria-expanded={true}
              aria-controls="skill-gap-tool-panel"
              onClick={() => setToolExpanded(false)}
              className="shrink-0 rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-200)] px-3 py-2 cds-body-secondary text-[var(--cds-color-grey-975)] hover:bg-[var(--cds-color-grey-25)]"
            >
              {SKILL_GAP_COPY.collapseSection}
            </button>
          </div>

          <div id="skill-gap-tool-panel">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        {/* Left: resume */}
        <div
          className="min-w-0 space-y-4"
          role="region"
          aria-label={SKILL_GAP_COPY.resumeHeading}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="cds-subtitle-md min-w-0 flex-1 text-[var(--cds-color-grey-975)]">
              {SKILL_GAP_COPY.resumeHeading}
            </h3>
            <div className="flex shrink-0 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                className="sr-only"
                aria-label={SKILL_GAP_COPY.uploadLabel}
                onChange={onFileChange}
              />
              <button
                type="button"
                onClick={openUploadModal}
                disabled={fileBusy}
                className="rounded-[var(--cds-border-radius-100)] bg-[var(--cds-color-grey-975)] px-4 py-2 font-semibold text-[var(--cds-color-white)] transition-colors hover:bg-[var(--cds-color-grey-900)] disabled:opacity-50 cds-action-secondary"
              >
                {fileBusy ? 'Reading…' : SKILL_GAP_COPY.uploadLabel}
              </button>
            </div>
          </div>
          <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">
            PDF or .txt — or paste below. Word (.doc/.docx) is not supported yet.
          </p>
          {fileError ? (
            <p className="cds-body-secondary text-[var(--cds-color-red-700)]" role="alert">
              {fileError}
            </p>
          ) : null}

          <textarea
            id="skill-gap-resume-field"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder={SKILL_GAP_COPY.pastePlaceholder}
            rows={14}
            className="w-full resize-y rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] p-3 cds-body-secondary text-[var(--cds-color-grey-975)] placeholder:text-[var(--cds-color-grey-400)] focus:border-[var(--cds-color-blue-700)] focus:outline-none focus:ring-1 focus:ring-[var(--cds-color-blue-700)]"
            aria-label={SKILL_GAP_COPY.pastePlaceholder}
          />
        </div>

        {/* Right: job + results */}
        <div className="min-w-0 space-y-4" role="region" aria-label={SKILL_GAP_COPY.findRoleHeading}>
          <div className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)]">
            <button
              type="button"
              id="skill-gap-job-details-heading"
              className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--cds-color-grey-25)]"
              aria-expanded={jobDetailsOpen}
              aria-controls="skill-gap-job-details-more"
              onClick={() => setJobDetailsOpen((o) => !o)}
            >
              <span className="cds-subtitle-md text-[var(--cds-color-grey-975)]">
                {SKILL_GAP_COPY.findRoleHeading}
              </span>
              <span
                className="material-symbols-rounded ml-auto shrink-0 text-[var(--cds-color-grey-600)]"
                style={{ fontSize: 22 }}
                aria-hidden
              >
                {jobDetailsOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            <div
              id="skill-gap-job-details-panel"
              role="region"
              aria-labelledby="skill-gap-job-details-heading"
              className="border-t border-[var(--cds-color-grey-100)] px-4 pb-3 pt-3"
            >
              <div className="space-y-1.5">
                <label htmlFor="skill-gap-job-role-link" className="cds-body-secondary text-[var(--cds-color-grey-975)]">
                  {SKILL_GAP_COPY.jobRoleLinkLabel}
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="skill-gap-job-role-link"
                    type="url"
                    inputMode="url"
                    value={jobRoleLink}
                    onChange={(e) => {
                      setJobRoleLink(e.target.value);
                      if (roleLinkError) setRoleLinkError(null);
                    }}
                    placeholder={SKILL_GAP_COPY.jobRoleLinkPlaceholder}
                    className="min-w-0 flex-1 rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] px-3 py-2 cds-body-secondary text-[var(--cds-color-grey-975)] placeholder:text-[var(--cds-color-grey-400)] focus:border-[var(--cds-color-blue-700)] focus:outline-none focus:ring-1 focus:ring-[var(--cds-color-blue-700)]"
                  />
                  <button
                    type="button"
                    onClick={uploadRoleFromLink}
                    disabled={roleLinkUploadBusy}
                    className="shrink-0 rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-blue-700)] bg-[var(--cds-color-white)] px-4 py-2 font-semibold text-[var(--cds-color-blue-700)] shadow-sm transition-colors hover:bg-[var(--cds-color-blue-25)] disabled:opacity-50 cds-action-secondary"
                  >
                    {roleLinkUploadBusy ? 'Working…' : SKILL_GAP_COPY.uploadRoleButton}
                  </button>
                </div>
                {roleLinkError ? (
                  <p className="cds-body-tertiary text-[var(--cds-color-red-700)]" role="alert">
                    {roleLinkError}
                  </p>
                ) : (
                  <p className="cds-body-tertiary text-[var(--cds-color-grey-600)]">
                    {SKILL_GAP_COPY.jobRoleLinkHint}
                  </p>
                )}
              </div>

              <div
                id="skill-gap-job-details-more"
                hidden={!jobDetailsOpen}
                className={jobDetailsOpen ? 'mt-4 space-y-4 border-t border-[var(--cds-color-grey-100)] pt-4' : undefined}
              >
                <div className="space-y-1.5">
                  <label htmlFor="skill-gap-jd" className="cds-body-secondary text-[var(--cds-color-grey-975)]">
                    {SKILL_GAP_COPY.jobDescriptionLabel}
                  </label>
                  <textarea
                    id="skill-gap-jd"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder={SKILL_GAP_COPY.jobDescriptionPlaceholder}
                    className="h-[125px] min-h-[125px] w-full resize-y rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] p-3 cds-body-secondary text-[var(--cds-color-grey-975)] placeholder:text-[var(--cds-color-grey-400)] focus:border-[var(--cds-color-blue-700)] focus:outline-none focus:ring-1 focus:ring-[var(--cds-color-blue-700)]"
                  />
                </div>

                <p className="cds-body-tertiary leading-relaxed text-[var(--cds-color-grey-600)]">
                  {SKILL_GAP_COPY.privacyNote}
                </p>

                {showTitleDisclaimer ? (
                  <p className="cds-body-tertiary italic text-[var(--cds-color-grey-600)]">
                    {SKILL_GAP_COPY.disclaimerJobTitleOnly}
                  </p>
                ) : null}

                {!geminiReady ? (
                  <p className="cds-body-secondary text-[var(--cds-color-grey-600)]" role="status">
                    {SKILL_GAP_COPY.geminiOffline}
                  </p>
                ) : null}

                {analyzeError ? (
                  <p className="cds-body-secondary text-[var(--cds-color-red-700)]" role="alert">
                    {analyzeError}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={runAnalyze}
                  disabled={analyzeBusy || !geminiReady}
                  className="w-full rounded-[var(--cds-border-radius-100)] bg-[#E85D75] px-5 py-2.5 font-semibold text-[var(--cds-color-white)] shadow-sm transition-colors hover:bg-[#d64f66] disabled:opacity-50 cds-action-secondary sm:w-auto"
                >
                  {analyzeBusy ? 'Analyzing…' : SKILL_GAP_COPY.analyze}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <CollapsiblePanel
              id="found"
              title={SKILL_GAP_COPY.foundSkillsTitle}
              count={foundSkillsForList.length}
              badgeClass="bg-[var(--cds-color-green-100)] text-[var(--cds-color-green-700)]"
              expanded={expanded.found}
              onToggle={() => toggle('found')}
              emptyMessage={SKILL_GAP_COPY.foundSkillsEmpty}
              isLoading={foundSkillsUploadLoading}
              loadingStatusText={SKILL_GAP_COPY.foundSkillsUploadLoadingStatus}
              collapsedFooter={
                foundSkillsCollapsedFooter ? (
                  <TypewriterEncouragement text={foundSkillsCollapsedFooter} />
                ) : undefined
              }
            >
              {showUploadPreviewLead ? (
                <>
                  <p className="cds-body-secondary mb-2 font-medium text-[var(--cds-color-grey-975)]">
                    {SKILL_GAP_COPY.foundSkillsUploadPreviewLead}
                  </p>
                  <FoundSkillTags items={foundSkillsForList} />
                </>
              ) : (
                <FoundSkillTags items={foundSkillsForList} />
              )}
            </CollapsiblePanel>

            <CollapsiblePanel
              id="opportunities"
              title={SKILL_GAP_COPY.opportunitiesTitle}
              count={opportunitiesBadgeCount}
              badgeClass={
                roleLinkPreviewCount > 0
                  ? 'bg-[var(--cds-color-yellow-100)] text-[var(--cds-color-yellow-800)]'
                  : 'border border-[var(--cds-color-blue-200)] bg-[var(--cds-color-blue-25)] text-[var(--cds-color-grey-975)]'
              }
              expanded={expanded.opportunities}
              onToggle={() => toggle('opportunities')}
              emptyMessage={SKILL_GAP_COPY.opportunitiesEmpty}
              isLoading={roleLinkUploadBusy}
              loadingStatusText={SKILL_GAP_COPY.roleUploadLoadingStatus}
              collapsedFooter={
                roleLinkPreviewCount > 0 && opportunitiesForList.length < 1 ? (
                  <TypewriterEncouragement
                    text={SKILL_GAP_COPY.roleLinkOpportunitiesCollapsedEncouragement}
                  />
                ) : undefined
              }
            >
              {opportunitiesForList.length > 0 ? (
                <FoundSkillTags items={opportunitiesForList} />
              ) : roleLinkPreview ? (
                <div className="space-y-5">
                  <RoleLinkPrioritySkillsPreviewSection
                    focus={roleLinkPreview.focus}
                    selectedPriorityIndex={rolePrioritySkillIndex}
                    onSelectPriorityIndex={selectRolePrioritySkill}
                  />
                  <RoleLinkOtherSkillAreasPreviewSection other={roleLinkPreview.other} />
                  <TrendingCourseColumn
                    id="skill-gap-trending-most-popular"
                    title={roleLinkPreview.focus[rolePrioritySkillIndex] ?? ''}
                    items={getCourseraShortCoursesForPrioritySkill(
                      roleLinkPreview.focus[rolePrioritySkillIndex] ?? roleLinkPreview.focus[0] ?? '',
                    )}
                    className="animate-fade-in-soft"
                    onHeadingCycle={
                      roleLinkPreview.focus.length > 1 ? cycleRolePrioritySkill : undefined
                    }
                    headingCycleAriaLabel="Show courses for next priority skill"
                  />
                </div>
              ) : null}
            </CollapsiblePanel>

            {analysis?.summaryNote ? (
              <p className="cds-body-tertiary text-[var(--cds-color-grey-600)] border-t border-[var(--cds-color-grey-100)] pt-3">
                {analysis.summaryNote}
              </p>
            ) : null}
          </div>
        </div>
      </div>
          </div>
        </>
      )}

      {uploadModalOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label={SKILL_GAP_COPY.uploadModalCloseLabel}
            onClick={closeUploadModal}
            disabled={fileBusy}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={uploadModalTitleId}
            className="relative w-full max-w-md rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id={uploadModalTitleId} className="cds-subtitle-md text-[var(--cds-color-grey-975)]">
                {SKILL_GAP_COPY.uploadModalTitle}
              </h2>
              <button
                type="button"
                onClick={closeUploadModal}
                disabled={fileBusy}
                className="rounded-[var(--cds-border-radius-100)] p-1 text-[var(--cds-color-grey-600)] transition-colors hover:bg-[var(--cds-color-grey-25)] hover:text-[var(--cds-color-grey-975)] disabled:opacity-50"
                aria-label={SKILL_GAP_COPY.uploadModalCloseLabel}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 22 }} aria-hidden>
                  close
                </span>
              </button>
            </div>
            <p className="cds-body-secondary mb-4 text-[var(--cds-color-grey-600)]">
              {SKILL_GAP_COPY.uploadModalSubtitle}
            </p>

            <div
              onDragEnter={onUploadDragEnter}
              onDragOver={onUploadDragOver}
              onDragLeave={onUploadDragLeave}
              onDrop={onUploadDrop}
              className={`flex flex-col items-center justify-center gap-3 rounded-[var(--cds-border-radius-200)] border-2 border-dashed px-4 py-10 text-center transition-colors ${
                dropActive
                  ? 'border-[var(--cds-color-blue-700)] bg-[var(--cds-color-blue-25)]'
                  : 'border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)]'
              }`}
            >
              <span
                className="material-symbols-rounded text-[var(--cds-color-grey-600)]"
                style={{ fontSize: 40 }}
                aria-hidden
              >
                upload_file
              </span>
              <p className="cds-body-secondary text-[var(--cds-color-grey-700)]">
                {dropActive ? SKILL_GAP_COPY.uploadModalDropActive : SKILL_GAP_COPY.uploadModalDropHint}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={fileBusy}
                className="rounded-lg bg-[var(--cds-color-grey-975)] px-4 py-2 font-semibold text-[var(--cds-color-white)] transition-colors hover:bg-[var(--cds-color-grey-900)] disabled:opacity-50 cds-action-secondary"
              >
                {fileBusy ? 'Reading…' : SKILL_GAP_COPY.uploadModalChooseFile}
              </button>
            </div>

            <p className="cds-body-tertiary mt-3 text-[var(--cds-color-grey-600)]">
              PDF or .txt — Word (.doc/.docx) is not supported yet.
            </p>
            {fileError ? (
              <p className="cds-body-secondary mt-2 text-[var(--cds-color-red-700)]" role="alert">
                {fileError}
              </p>
            ) : null}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={closeUploadModal}
                disabled={fileBusy}
                className="rounded-[var(--cds-border-radius-100)] border border-[var(--cds-color-grey-200)] px-4 py-2 cds-body-secondary text-[var(--cds-color-grey-975)] hover:bg-[var(--cds-color-grey-25)] disabled:opacity-50"
              >
                {SKILL_GAP_COPY.uploadModalCancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
