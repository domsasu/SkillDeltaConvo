import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  COURSERA_GRAPHQL_ENDPOINT: z
    .string()
    .url()
    .default("https://www.coursera.org/graphql-gateway"),
});

export type AppConfig = z.infer<typeof envSchema>;

let _config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!_config) {
    _config = envSchema.parse({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      COURSERA_GRAPHQL_ENDPOINT: process.env.COURSERA_GRAPHQL_ENDPOINT,
    });
  }
  return _config;
}
