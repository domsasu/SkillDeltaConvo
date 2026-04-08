import { getConfig } from "@/lib/config";
import { SEARCH_QUERY } from "@/lib/coursera-queries";
import type { SearchResult } from "@/lib/coursera-types";

export class CourseraGatewayError extends Error {
  details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "CourseraGatewayError";
    this.details = details;
  }
}

function clampInteger(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

export class CourseraDiscoveryClient {
  private endpoint: string;
  private timeoutMs: number;
  private userAgent: string;

  constructor() {
    this.endpoint = getConfig().COURSERA_GRAPHQL_ENDPOINT;
    this.timeoutMs = 15000;
    this.userAgent = "coursera-agentic-discovery-gateway/0.1";
  }

  private async request({
    query,
    variables,
  }: {
    query: string;
    variables: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": this.userAgent,
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      const rawBody = await response.text();
      let jsonBody: Record<string, unknown> = {};
      try {
        jsonBody = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        throw new CourseraGatewayError("Upstream returned non-JSON response", {
          status: response.status,
          rawBody,
        });
      }

      if (!response.ok) {
        throw new CourseraGatewayError("Upstream GraphQL request failed", {
          status: response.status,
          body: jsonBody,
        });
      }

      const errors = jsonBody.errors as unknown[] | undefined;
      if (errors?.length) {
        throw new CourseraGatewayError("Upstream GraphQL returned errors", {
          status: response.status,
          errors,
        });
      }

      return (jsonBody.data as Record<string, unknown>) ?? {};
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new CourseraGatewayError("Upstream GraphQL request timed out", {
          timeoutMs: this.timeoutMs,
          endpoint: this.endpoint,
        });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async search({
    query,
    limit = 10,
  }: {
    query: string;
    limit?: number;
  }): Promise<SearchResult | null> {
    const safeLimit = clampInteger(limit, 1, 50, 10);

    const searchRequest = {
      query,
      entityType: "PRODUCTS",
      limit: safeLimit,
      cursor: "0",
    };

    console.log(`[coursera-client] Search request:`, {
      endpoint: this.endpoint,
      searchQuery: query,
      entityType: "PRODUCTS",
      limit: safeLimit,
    });

    const data = await this.request({
      query: SEARCH_QUERY,
      variables: {
        requests: [searchRequest],
      },
    });

    const searchResult = data?.SearchResult as
      | { search?: SearchResult[] }
      | undefined;
    const result = searchResult?.search?.[0] ?? null;
    console.log(`[coursera-client] Search response for "${query}":`, {
      totalElements: result?.pagination?.totalElements ?? 0,
      returnedElements: result?.elements?.length ?? 0,
    });
    return result;
  }
}

let _client: CourseraDiscoveryClient | null = null;

export function getCourseraClient(): CourseraDiscoveryClient {
  if (!_client) {
    _client = new CourseraDiscoveryClient();
  }
  return _client;
}
