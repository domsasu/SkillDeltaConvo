"use client";

import Image from "next/image";

const COLLECTION_COURSES = [
  {
    thumbnail: "/assets/data-science.jpg",
    partnerLogo: "/assets/umich-logo.png",
    partnerName: "University of Pennsylvania",
    title: "English for Career Development",
  },
  {
    thumbnail: "/assets/ibm-ai-developer.jpg",
    partnerLogo: "/assets/umich-logo.png",
    partnerName: "University of Pennsylvania",
    title: "English for Career Development",
  },
  {
    thumbnail: "/assets/google-project-management.jpg",
    partnerLogo: "/assets/umich-logo.png",
    partnerName: "University of Pennsylvania",
    title: "English for Career Development",
  },
];

export function CollectionSection() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-[#0f1114]">Collection Title</h2>
      <div className="grid grid-cols-3 gap-4">
        {COLLECTION_COURSES.map((course, i) => (
          <div key={i} className="group cursor-pointer">
            <div className="overflow-hidden rounded-lg">
              <Image
                src={course.thumbnail}
                alt={course.title}
                width={320}
                height={180}
                className="h-44 w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Image
                src={course.partnerLogo}
                alt={course.partnerName}
                width={20}
                height={20}
                className="h-5 w-5 shrink-0"
              />
              <span className="text-xs text-[#5b6780]">{course.partnerName}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#0f1114] line-clamp-2">
              {course.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
