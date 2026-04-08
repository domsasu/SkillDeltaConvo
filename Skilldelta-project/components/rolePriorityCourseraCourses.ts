import { SKILL_GAP_ROLE_UPLOAD_FOCUS } from './skillGapConstants';
import type { TrendingCourseItem } from './trendingItems';

/**
 * Three short Coursera-style offerings per job-link priority skill (demo catalog).
 * Titles/partners mirror common Coursera library patterns; not live API-backed.
 * Each row uses a distinct Unsplash thumb (fit=crop 128²).
 */
const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=128&h=128`;

/** Rough minutes for sort order (hours × 60; multi-week ≈ 10 h/week). */
const M = {
  h: (hours: number) => hours * 60,
  wk: (weeks: number) => weeks * 10 * 60,
} as const;

const COURSES_BY_SKILL: Record<(typeof SKILL_GAP_ROLE_UPLOAD_FOCUS)[number], TrendingCourseItem[]> = {
  [SKILL_GAP_ROLE_UPLOAD_FOCUS[0]]: [
    {
      title: 'Getting Started with Power BI Desktop',
      provider: 'Microsoft',
      timeCommitment: '2 hrs',
      durationMinutes: M.h(2),
      type: 'Guided Project',
      rating: 4.8,
      image: u('photo-1551288049-bebda4e38f71'),
    },
    {
      title: 'Data Modeling and Visualization in Power BI',
      provider: 'Microsoft',
      timeCommitment: '5 weeks',
      durationMinutes: M.wk(5),
      type: 'Course',
      rating: 4.7,
      image: u('photo-1543286386-713bdd548da4'),
    },
    {
      title: 'Analyze and Visualize with Looker Studio',
      provider: 'Google',
      timeCommitment: '9 hrs',
      durationMinutes: M.h(9),
      type: 'Course',
      rating: 4.6,
      image: u('photo-1551836022-d5d88e9218df'),
    },
  ],
  [SKILL_GAP_ROLE_UPLOAD_FOCUS[1]]: [
    {
      title: 'Conducting an A/B Test',
      provider: 'Meta',
      timeCommitment: '17 hrs',
      durationMinutes: M.h(17),
      type: 'Course',
      rating: 4.7,
      image: u('photo-1553877522-43269d4ea984'),
    },
    {
      title: 'Google Analytics for Beginners',
      provider: 'Google',
      timeCommitment: '4 weeks',
      durationMinutes: M.wk(4),
      type: 'Course',
      rating: 4.8,
      image: u('photo-1460925895917-afdab827c52f'),
    },
    {
      title: 'Data-Driven Product Decisions with SQL',
      provider: 'University of California, Davis',
      timeCommitment: '6 weeks',
      durationMinutes: M.wk(6),
      type: 'Course',
      rating: 4.6,
      image: u('photo-1504639725590-34d0984388bd'),
    },
  ],
  [SKILL_GAP_ROLE_UPLOAD_FOCUS[2]]: [
    {
      title: 'Introduction to SQL for BigQuery on Google Cloud',
      provider: 'Google Cloud',
      timeCommitment: '3 hrs',
      durationMinutes: M.h(3),
      type: 'Guided Project',
      rating: 4.8,
      image: u('photo-1451187580459-43490279c0fa'),
    },
    {
      title: 'Modernizing Data Lakes and Data Warehouses with Google Cloud',
      provider: 'Google Cloud',
      timeCommitment: '13 hrs',
      durationMinutes: M.h(13),
      type: 'Course',
      rating: 4.7,
      image: u('photo-1558494949-ef010cbdcc31'),
    },
    {
      title: 'Cloud Data Warehousing Foundations',
      provider: 'IBM',
      timeCommitment: '5 weeks',
      durationMinutes: M.wk(5),
      type: 'Course',
      rating: 4.6,
      image: u('photo-1544197150-b99a580bb7a8'),
    },
  ],
};

/** When no mapped skill label matches — only ≤1-week style rows. */
const FALLBACK_SHORT: TrendingCourseItem[] = [
  {
    title: 'Introduction to Data Analytics',
    provider: 'IBM',
    timeCommitment: '6 hrs',
    durationMinutes: M.h(6),
    type: 'Course',
    rating: 4.7,
    image: u('photo-1485827404703-89b55fcc665e'),
  },
  {
    title: 'SQL for Data Science',
    provider: 'University of California, Davis',
    timeCommitment: '8 hrs',
    durationMinutes: M.h(8),
    type: 'Course',
    rating: 4.8,
    image: u('photo-1519389950473-47ba0277781c'),
  },
  {
    title: 'The Structured Query Language (SQL)',
    provider: 'University of Colorado Boulder',
    timeCommitment: '5 hrs',
    durationMinutes: M.h(5),
    type: 'Course',
    rating: 4.6,
    image: u('photo-1504868584819-f8e8b4b6d7e3'),
  },
];

const MAX_HOURS_FOR_ONE_WEEK = 40;

/** Skill-gap upsell: omit anything longer than ~one week (multi-week courses, months, or very long hour totals). */
function isAtMostOneWeekOffering(item: TrendingCourseItem): boolean {
  const tc = item.timeCommitment.toLowerCase();
  if (/\d+\s*months?\b/.test(tc) || /\bmonth\b|\byear\b/.test(tc)) {
    return false;
  }
  const weeks = tc.match(/(\d+)\s*weeks?\b/);
  if (weeks) {
    return parseInt(weeks[1], 10) <= 1;
  }
  const hours = tc.match(/(\d+)\s*hrs?\b/);
  if (hours) {
    return parseInt(hours[1], 10) <= MAX_HOURS_FOR_ONE_WEEK;
  }
  const dm = item.durationMinutes;
  if (dm != null) {
    return dm <= M.h(MAX_HOURS_FOR_ONE_WEEK);
  }
  return false;
}

function sortByTimeCommitment(items: TrendingCourseItem[]): TrendingCourseItem[] {
  return [...items].sort((a, b) => {
    const ma = a.durationMinutes ?? Number.POSITIVE_INFINITY;
    const mb = b.durationMinutes ?? Number.POSITIVE_INFINITY;
    return ma - mb;
  });
}

export function getCourseraShortCoursesForPrioritySkill(skillLabel: string): TrendingCourseItem[] {
  const list = COURSES_BY_SKILL[skillLabel as keyof typeof COURSES_BY_SKILL];
  const raw = list && list.length > 0 ? [...list] : [...FALLBACK_SHORT];
  return sortByTimeCommitment(raw.filter(isAtMostOneWeekOffering));
}
