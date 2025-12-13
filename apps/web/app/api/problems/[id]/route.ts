import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { problems, tags, problemTags } from "@/db/schema";
import { requireAdmin, getOptionalUser, AuthError } from "@/lib/auth";
import { updateProblemSchema } from "@/lib/validations/problem";
import { eq, and } from "drizzle-orm";
import { ZodError } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/problems/[id] - Get single problem
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getOptionalUser();
    const isAdmin = user?.role === "admin";

    const problem = await db.query.problems.findFirst({
      where: eq(problems.id, id),
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Check visibility (non-admins can only see published & public problems)
    if (!isAdmin && (!problem.isPublic || problem.status !== "published")) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Get tags for this problem
    const problemTagRows = await db.query.problemTags.findMany({
      where: eq(problemTags.problemId, id),
      with: {
        tag: true,
      },
    });

    const tagList = problemTagRows.map((pt) => pt.tag);

    // Parse JSON fields
    const parsed = {
      ...problem,
      startPosition: JSON.parse(problem.startPositionJson),
      goals: JSON.parse(problem.goalsJson),
      walls: JSON.parse(problem.wallsJson),
      traps: JSON.parse(problem.trapsJson),
      tags: tagList,
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("GET /api/problems/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/problems/[id] - Update problem (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requireAdmin();

    const problem = await db.query.problems.findFirst({
      where: eq(problems.id, id),
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateProblemSchema.parse(body);

    await db.transaction(async (tx) => {
      // Build update object only with provided fields
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (validated.title !== undefined) updateData.title = validated.title;
      if (validated.description !== undefined)
        updateData.description = validated.description;
      if (validated.difficulty !== undefined)
        updateData.difficulty = validated.difficulty;
      if (validated.isPublic !== undefined)
        updateData.isPublic = validated.isPublic;
      if (validated.status !== undefined) updateData.status = validated.status;
      if (validated.gridSize !== undefined)
        updateData.gridSize = validated.gridSize;
      if (validated.startPosition !== undefined)
        updateData.startPositionJson = JSON.stringify(validated.startPosition);
      if (validated.goals !== undefined)
        updateData.goalsJson = JSON.stringify(validated.goals);
      if (validated.walls !== undefined)
        updateData.wallsJson = JSON.stringify(validated.walls);
      if (validated.traps !== undefined)
        updateData.trapsJson = JSON.stringify(validated.traps);
      if (validated.sampleCode !== undefined)
        updateData.sampleCode = validated.sampleCode;
      if (validated.maxSteps !== undefined)
        updateData.maxSteps = validated.maxSteps;

      // Update problem
      await tx.update(problems).set(updateData).where(eq(problems.id, id));

      // Handle tags if provided
      if (validated.tags !== undefined) {
        // Remove existing tags
        await tx.delete(problemTags).where(eq(problemTags.problemId, id));

        // Add new tags
        for (const tagName of validated.tags) {
          const slug = tagName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

          if (!slug) continue;

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

          await tx
            .insert(problemTags)
            .values({
              problemId: id,
              tagId: tag.id,
            })
            .onConflictDoNothing();
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/problems/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/problems/[id] - Delete problem (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requireAdmin();

    const problem = await db.query.problems.findFirst({
      where: eq(problems.id, id),
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      // Delete problem tags first (foreign key)
      await tx.delete(problemTags).where(eq(problemTags.problemId, id));

      // Delete problem
      await tx.delete(problems).where(eq(problems.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("DELETE /api/problems/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
