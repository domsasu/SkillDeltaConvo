import { tool } from "ai";
import { z } from "zod";
import { getCourseraClient } from "@/lib/coursera-client";
import { searchMockCourses } from "@/lib/mock-data";
import type { CourseHit } from "@/lib/coursera-types";

export const searchCoursesTool = tool({
  description:
    "Search the Coursera Plus catalog for courses matching a query. Call this multiple times with different queries for each milestone area (e.g., 'python fundamentals', 'data analysis projects'). Only returns C+ eligible courses.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("Search query targeting a specific skill area or topic"),
    limit: z
      .number()
      .default(8)
      .describe("Max courses to return"),
  }),
  execute: async ({
    query,
    limit,
  }): Promise<{ query: string; courses: CourseHit[] }> => {
    console.log(`[search-courses] Executing search:`, { query, limit });
    try {
      const result = await getCourseraClient().search({ query, limit });
      const totalElements = result?.elements?.length ?? 0;
      console.log(`[search-courses] GraphQL returned ${totalElements} raw elements for "${query}"`);

      const courses = (result?.elements ?? [])
        .filter(
          (el) =>
            el.__typename === "Search_ProductHit" &&
            el.isPartOfCourseraPlus === true
        )
        .map((el) => ({
          id: el.id ?? "",
          name: el.name ?? "",
          url: el.url ?? "",
          imageUrl: el.imageUrl ?? "",
          productType: el.productType ?? "",
          partners: el.partners ?? [],
          partnerLogos: el.partnerLogos ?? [],
          skills: el.skills ?? [],
          duration: el.duration ?? "",
          productDifficultyLevel: el.productDifficultyLevel ?? "",
          isPartOfCourseraPlus: true as const,
          activityBadges: el.productCard?.badges ?? [],
        }));

      console.log(`[search-courses] After C+ filter: ${courses.length} courses for "${query}"`);
      for (const c of courses) {
        console.log(`[search-courses]   "${c.name}" (${c.partners.join(", ")}) [${c.productType}] id=${c.id}`);
      }

      if (courses.length > 0) {
        return { query, courses };
      }

      // Fall back to mock data if no C+ courses found
      console.log(`[search-courses] No C+ courses found, falling back to mock data for "${query}"`);
      const mockCourses = searchMockCourses(query);
      console.log(`[search-courses] Mock returned ${mockCourses.length} courses`);
      return { query, courses: mockCourses };
    } catch (error) {
      console.error(
        `[search-courses] Search failed for "${query}", using mock data:`,
        error
      );
      const mockCourses = searchMockCourses(query);
      console.log(`[search-courses] Mock fallback returned ${mockCourses.length} courses`);
      return { query, courses: mockCourses };
    }
  },
});
