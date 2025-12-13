import { NextResponse } from "next/server";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { asc } from "drizzle-orm";

// GET /api/tags - List all tags
export async function GET() {
  try {
    const results = await db.query.tags.findMany({
      orderBy: [asc(tags.name)],
    });

    return NextResponse.json({
      data: results,
    });
  } catch (error) {
    console.error("GET /api/tags error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
