"use client";

import { CourseCard } from "@/components/lihp/course-card";

const MOST_POPULAR = [
  {
    thumbnail: "/assets/google-data-analytics.jpg",
    partnerLogo: "/assets/google-logo.png",
    partnerName: "Google",
    title: "Google AI Essentials",
    type: "Specialization",
    rating: 4.9,
  },
  {
    thumbnail: "/assets/ibm-ai-developer.jpg",
    partnerLogo: "/assets/ibm-logo.png",
    partnerName: "Microsoft",
    title: "Agentic AI and AI Agents",
    type: "Course",
    rating: 4.9,
  },
  {
    thumbnail: "/assets/ai-for-everyone.png",
    partnerLogo: "/assets/ibm-logo.png",
    partnerName: "Meta",
    title: "Agentic AI and AI Agents",
    type: "Course",
    rating: 4.9,
  },
];

const WEEKLY_SPOTLIGHT = [
  {
    thumbnail: "/assets/google-project-management.jpg",
    partnerLogo: "/assets/google-logo.png",
    partnerName: "Google",
    title: "Successful Negotiation: Essential",
    type: "Specialization",
    rating: 4.9,
  },
  {
    thumbnail: "/assets/ibm-data-analyst.png",
    partnerLogo: "/assets/ibm-logo.png",
    partnerName: "IBM",
    title: "Successful Negotiation: Essential",
    type: "Professional Certificate",
    rating: 4.9,
  },
  {
    thumbnail: "/assets/data-science.jpg",
    partnerLogo: "/assets/google-logo.png",
    partnerName: "Google",
    title: "Successful Negotiation: Essential",
    type: "Professional Certificate",
    rating: 4.9,
  },
];

interface SectionCardListProps {
  title: string;
  courses: typeof MOST_POPULAR;
}

function SectionCardList({ title, courses }: SectionCardListProps) {
  return (
    <div className="flex-1 rounded-xl border border-[#dae1ed] bg-white p-5">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-semibold text-[#0f1114]">{title}</h3>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="#0f1114" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="divide-y divide-[#f2f5fa]">
        {courses.map((course, i) => (
          <CourseCard key={i} {...course} />
        ))}
      </div>
    </div>
  );
}

export function TrendingSection() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-[#0f1114]">Trending now</h2>
      <div className="flex gap-4">
        <SectionCardList title="Most popular" courses={MOST_POPULAR} />
        <SectionCardList title="Weekly spotlight" courses={WEEKLY_SPOTLIGHT} />
      </div>
    </div>
  );
}
