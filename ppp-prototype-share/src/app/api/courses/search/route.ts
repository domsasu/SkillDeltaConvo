import { NextRequest, NextResponse } from "next/server";
import { getCourseraClient } from "@/lib/coursera-client";
import { searchMockCourses } from "@/lib/mock-data";
import type { CourseHit } from "@/lib/coursera-types";

export async function POST(req: NextRequest) {
  try {
    const { query, limit } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "query is required and must be a string" },
        { status: 400 },
      );
    }

    try {
      const result = await getCourseraClient().search({ query, limit });
      const courses: CourseHit[] = (result?.elements ?? [])
        .filter(
          (el) =>
            el.__typename === "Search_ProductHit" &&
            el.isPartOfCourseraPlus === true,
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
      return NextResponse.json({ courses, mock: false });
    } catch (error) {
      console.error(
        "[courses/search] GraphQL failed, using mock data:",
        error,
      );
      return NextResponse.json({ courses: searchMockCourses(query), mock: true });
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
