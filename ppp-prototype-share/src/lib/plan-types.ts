import { z } from "zod";

export const planCourseSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  imageUrl: z.string().default(""),
  productType: z.string(),
  partners: z.array(z.string()),
  partnerLogos: z.array(z.string()).default([]),
  skills: z.array(z.string()),
  duration: z.string(),
  productDifficultyLevel: z.string(),
  estimatedHours: z.number().default(0),
  activityBadges: z.array(z.string()).default([]),
});

export const planMilestoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  skills: z.array(z.string()),
  badges: z.array(z.string()).default([]),
  courses: z.array(planCourseSchema),
  estimatedWeeks: z.number().default(0),
});

export const learningPlanSchema = z.object({
  title: z.string(),
  summary: z.object({
    role: z.string(),
    skills: z.array(z.string()),
    totalDuration: z.string(),
    hoursPerWeek: z.string(),
  }),
  milestones: z.array(planMilestoneSchema),
});

export type PlanCourse = z.infer<typeof planCourseSchema>;
export type PlanMilestone = z.infer<typeof planMilestoneSchema>;
export type LearningPlan = z.infer<typeof learningPlanSchema>;
