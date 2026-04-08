interface PlanSummaryBarProps {
  role: string;
  skills: string[];
  duration: string;
  hoursPerWeek: string;
}

export function PlanSummaryBar({
  role,
  skills,
  duration,
  hoursPerWeek,
}: PlanSummaryBarProps) {
  return (
    <div className="text-sm text-[#5b6780]">
      <span className="font-semibold text-[#0f1114]">{role}</span>
      {" \u00b7 "}
      {skills.slice(0, 3).join(", ")}
      {" \u00b7 "}
      {duration}
      {" \u00b7 ~"}
      {hoursPerWeek}
    </div>
  );
}
