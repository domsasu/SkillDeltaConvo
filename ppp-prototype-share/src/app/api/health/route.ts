import { getConfig } from "@/lib/config";
import { getCourseraClient } from "@/lib/coursera-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {
    env_openai_key: getConfig().OPENAI_API_KEY ? "configured" : "MISSING",
    env_openai_model: getConfig().OPENAI_MODEL,
    env_graphql_endpoint: getConfig().COURSERA_GRAPHQL_ENDPOINT,
    graphql_connectivity: "unknown",
  };

  try {
    const result = await getCourseraClient().search({ query: "python", limit: 1 });
    checks.graphql_connectivity = result ? "ok" : "empty_response";
  } catch (error) {
    checks.graphql_connectivity = `error: ${error instanceof Error ? error.message : "unknown"}`;
  }

  return Response.json(checks);
}
