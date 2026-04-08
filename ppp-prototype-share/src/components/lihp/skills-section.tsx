"use client";

const SKILLS = [
  "Natural Language",
  "Prompt Engineering",
  "Python",
  "Generative AI",
  "Computer Vision",
  "SQL",
  "Responsible AI",
  "Prompt Engineering",
];

export function SkillsSection() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-[#0f1114]">In-demand skills</h2>
      <div className="flex items-center gap-2 flex-wrap">
        {SKILLS.map((skill, i) => (
          <button
            key={`${skill}-${i}`}
            className="rounded-full border border-[#dae1ed] bg-white px-4 py-2 text-sm text-[#0f1114] hover:bg-[#f2f5fa] transition-colors"
          >
            {skill}
          </button>
        ))}
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dae1ed] bg-white hover:bg-[#f2f5fa]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="#0f1114" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
