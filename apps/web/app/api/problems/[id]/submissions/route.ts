import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { problems, submissions, users } from "@/db/schema";
import { getCurrentUser, AuthError } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const submitSchema = z.object({
  code: z.string().min(1).max(10000),
  /** Result from client-side simulation */
  result: z.object({
    success: z.boolean(),
    stepCount: z.number().int().min(0),
  }),
});

/**
 * POST /api/problems/[id]/submissions - Submit a solution
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: problemId } = await params;
    const user = await getCurrentUser();

    // Check if problem exists and is published
    const problem = await db.query.problems.findFirst({
      where: eq(problems.id, problemId),
    });

    if (!problem || problem.status !== "published" || !problem.isPublic) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = submitSchema.parse(body);

    const codeLength = new TextEncoder().encode(validated.code).length;

    // Determine status based on client result
    // In a real system, we'd verify server-side, but for now trust client
    const status = validated.result.success ? "accepted" : "wrong_answer";
    const stepCount = validated.result.success ? validated.result.stepCount : null;

    // Create submission
    const submissionId = crypto.randomUUID();
    await db.insert(submissions).values({
      id: submissionId,
      problemId,
      userId: user.id,
      code: validated.code,
      status,
      stepCount,
      codeLength,
    });

    return NextResponse.json({
      id: submissionId,
      status,
      stepCount,
      codeLength,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/problems/[id]/submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/problems/[id]/submissions - Get user's submissions for this problem
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: problemId } = await params;

    // Check if problem exists
    const problem = await db.query.problems.findFirst({
      where: eq(problems.id, problemId),
    });

    if (!problem || problem.status !== "published" || !problem.isPublic) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Get all accepted submissions for leaderboard (with user info)
    const allSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.problemId, problemId),
      with: {
        user: true,
      },
      orderBy: (submissions, { asc }) => [
        asc(submissions.stepCount),
        asc(submissions.codeLength),
        asc(submissions.createdAt),
      ],
    });

    return NextResponse.json(allSubmissions);
  } catch (error) {
    console.error("GET /api/problems/[id]/submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
