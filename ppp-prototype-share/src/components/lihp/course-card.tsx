"use client";

import Image from "next/image";

interface CourseCardProps {
  thumbnail: string;
  partnerLogo: string;
  partnerName: string;
  title: string;
  type: string;
  rating: number;
}

export function CourseCard({
  thumbnail,
  partnerLogo,
  partnerName,
  title,
  type,
  rating,
}: CourseCardProps) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Image
        src={thumbnail}
        alt={title}
        width={64}
        height={64}
        className="h-16 w-16 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Image
            src={partnerLogo}
            alt={partnerName}
            width={16}
            height={16}
            className="h-4 w-4 shrink-0"
          />
          <span className="truncate text-xs text-[#5b6780]">{partnerName}</span>
        </div>
        <p className="mt-0.5 text-sm font-semibold leading-tight text-[#0f1114] line-clamp-2">
          {title}
        </p>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-[#5b6780]">
          <span>{type}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="#f5c518">
              <path d="M6 1l1.545 3.13L11 4.635 8.5 7.07l.59 3.44L6 8.885 2.91 10.51l.59-3.44L1 4.635l3.455-.505L6 1z" />
            </svg>
            {rating}
          </span>
        </div>
      </div>
    </div>
  );
}
