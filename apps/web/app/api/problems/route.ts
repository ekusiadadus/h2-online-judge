import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { problems, tags, problemTags } from "@/db/schema";
import { requireAdmin, getOptionalUser, AuthError } from "@/lib/auth";
import { createProblemSchema } from "@/lib/validations/problem";
import { eq, desc, and } from "drizzle-orm";
import { ZodError } from "zod";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/problems - List problems
export async function GET(request: NextRequest) {
  try {
    const user = await getOptionalUser();
    const isAdmin = user?.role === "admin";

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20"))
    );
    const offset = (page - 1) * limit;

    // Admin sees all, others see only public
    const whereClause = isAdmin ? undefined : eq(problems.isPublic, true);

    const results = await db.query.problems.findMany({
      where: whereClause,
      orderBy: [desc(problems.createdAt)],
      limit,
      offset,
    });

    // Parse JSON fields
    const parsedResults = results.map((problem) => ({
      ...problem,
      startPosition: JSON.parse(problem.startPositionJson),
      goals: JSON.parse(problem.goalsJson),
      walls: JSON.parse(problem.wallsJson),
      traps: JSON.parse(problem.trapsJson),
    }));

    return NextResponse.json({
      data: parsedResults,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/problems error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/problems - Create problem (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const validated = createProblemSchema.parse(body);

    const problemId = crypto.randomUUID();

    // Start transaction
    await db.transaction(async (tx) => {
      // 1. Insert problem
      await tx.insert(problems).values({
        id: problemId,
        title: validated.title,
        description: validated.description,
        difficulty: validated.difficulty,
        authorId: admin.id,
        isPublic: validated.isPublic,
        gridSize: validated.gridSize,
        startPositionJson: JSON.stringify(validated.startPosition),
        goalsJson: JSON.stringify(validated.goals),
        wallsJson: JSON.stringify(validated.walls),
        trapsJson: JSON.stringify(validated.traps),
        sampleCode: validated.sampleCode,
        maxSteps: validated.maxSteps,
      });

      // 2. Handle tags
      if (validated.tags.length > 0) {
        for (const tagName of validated.tags) {
          const slug = slugify(tagName);
          if (!slug) continue;

          // Find or create tag
          let tag = await tx.query.tags.findFirst({
            where: eq(tags.slug, slug),
          });

          if (!tag) {
            const tagId = crypto.randomUUID();
            await tx.insert(tags).values({
              id: tagId,
              name: tagName,
              slug,
            });
            tag = { id: tagId, name: tagName, slug, createdAt: new Date() };
          }

          // Link tag to problem
          await tx
            .insert(problemTags)
            .values({
              problemId,
              tagId: tag.id,
            })
            .onConflictDoNothing();
        }
      }
    });

    return NextResponse.json({ id: problemId }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/problems error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
