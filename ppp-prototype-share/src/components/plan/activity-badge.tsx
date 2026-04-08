import { Circle } from "lucide-react";

interface ActivityBadgeProps {
  label: string;
}

export function ActivityBadge({ label }: ActivityBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[#f2f5fa] px-2 py-0.5 text-xs text-[#5b6780]">
      <Circle size={12} />
      {label}
    </span>
  );
}
