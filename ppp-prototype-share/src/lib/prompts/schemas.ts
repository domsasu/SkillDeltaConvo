import { z } from "zod";

export const gatheredInfoSchema = z.object({
  goal: z.string().nullable(),
  skills: z.string().nullable(),
  background: z.string().nullable(),
  constraints: z.string().nullable(),
});

export const structuredPillSchema = z.object({
  type: z.enum(["multi", "single"]),
  question: z.string(),
  options: z.array(z.string()).max(20),
});

export const conversationStateSchema = z.object({
  gathered_info: gatheredInfoSchema,
  ready_for_plan: z.boolean(),
  suggested_pills: z.union([
    structuredPillSchema,
    z.array(z.string()).max(5).transform((arr) => ({
      type: "single" as const,
      question: "",
      options: arr,
    })),
  ]),
});

export type GatheredInfoSchema = z.infer<typeof gatheredInfoSchema>;
export type ConversationStateSchema = z.infer<typeof conversationStateSchema>;
