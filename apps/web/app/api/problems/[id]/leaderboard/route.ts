import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { problems, submissions, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

interface LeaderboardEntry {
  rank: number;
  stepCount: number;
  codeLength: number;
  userName: string;
  date: string;
}

/**
 * GET /api/problems/[id]/leaderboard - Get problem leaderboard
 * Returns best submission per user, ranked by stepCount then codeLength
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

    // Get all accepted submissions with user info
    const acceptedSubmissions = await db.query.submissions.findMany({
      where: and(
        eq(submissions.problemId, problemId),
        eq(submissions.status, "accepted")
      ),
      with: {
        user: true,
      },
      orderBy: (submissions, { asc }) => [
        asc(submissions.stepCount),
        asc(submissions.codeLength),
        asc(submissions.createdAt),
      ],
    });

    // Group by user, keep best submission per user
    const bestByUser = new Map<string, typeof acceptedSubmissions[0]>();
    for (const sub of acceptedSubmissions) {
      const existing = bestByUser.get(sub.userId);
      if (!existing) {
        bestByUser.set(sub.userId, sub);
      } else {
        // Compare: lower stepCount wins, then lower codeLength, then earlier date
        const existingStep = existing.stepCount ?? Infinity;
        const subStep = sub.stepCount ?? Infinity;
        if (
          subStep < existingStep ||
          (subStep === existingStep && sub.codeLength < existing.codeLength) ||
          (subStep === existingStep &&
            sub.codeLength === existing.codeLength &&
            sub.createdAt < existing.createdAt)
        ) {
          bestByUser.set(sub.userId, sub);
        }
      }
    }

    // Convert to array and sort
    const sorted = Array.from(bestByUser.values()).sort((a, b) => {
      const aStep = a.stepCount ?? Infinity;
      const bStep = b.stepCount ?? Infinity;
      if (aStep !== bStep) return aStep - bStep;
      if (a.codeLength !== b.codeLength) return a.codeLength - b.codeLength;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Build leaderboard with ranks (same score = same rank)
    const leaderboard: LeaderboardEntry[] = [];
    let currentRank = 1;
    let prevStep: number | null = null;
    let prevLength: number | null = null;

    for (let i = 0; i < sorted.length; i++) {
      const sub = sorted[i];
      if (!sub) continue;
      const step = sub.stepCount ?? 0;
      const length = sub.codeLength;

      // Update rank if score changed
      if (prevStep !== null && (step !== prevStep || length !== prevLength)) {
        currentRank = i + 1;
      }

      leaderboard.push({
        rank: currentRank,
        stepCount: step,
        codeLength: length,
        userName: sub.user?.username || sub.user?.name || sub.user?.email?.split("@")[0] || "Anonymous",
        date: sub.createdAt.toISOString(),
      });

      prevStep = step;
      prevLength = length;
    }

    return NextResponse.json({
      problemId,
      totalSubmissions: acceptedSubmissions.length,
      uniqueUsers: bestByUser.size,
      leaderboard,
    });
  } catch (error) {
    console.error("GET /api/problems/[id]/leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
