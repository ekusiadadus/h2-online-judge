import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, AuthError } from "@/lib/auth";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";

/** Reserved usernames that cannot be used */
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "system",
  "null",
  "undefined",
  "anonymous",
  "guest",
  "user",
  "test",
  "api",
  "www",
  "mail",
  "help",
  "support",
  "info",
  "contact",
  "about",
  "home",
  "login",
  "logout",
  "register",
  "signup",
  "signin",
  "settings",
  "profile",
  "account",
  "dashboard",
  "mod",
  "moderator",
  "staff",
  "official",
  "h2",
  "h2oj",
  "herbert",
]);

/**
 * Username validation schema:
 * - 3-20 characters
 * - Lowercase letters, numbers, and underscores only
 * - Must start with a letter
 * - No consecutive underscores
 */
const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Username must start with a letter and contain only lowercase letters, numbers, and underscores"
  )
  .regex(
    /^(?!.*__)/,
    "Username cannot contain consecutive underscores"
  )
  .refine(
    (val) => !RESERVED_USERNAMES.has(val.toLowerCase()),
    "This username is reserved"
  );

/**
 * GET /api/users/username?username=xxx - Check if username is available
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username parameter is required" },
        { status: 400 }
      );
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Validate format
    const validation = usernameSchema.safeParse(normalizedUsername);
    if (!validation.success) {
      return NextResponse.json({
        available: false,
        reason: validation.error.issues[0]?.message || "Invalid username format",
      });
    }

    // Check database for existing username (case-insensitive)
    const existing = await db.query.users.findFirst({
      where: eq(users.username, normalizedUsername),
    });

    if (existing) {
      return NextResponse.json({
        available: false,
        reason: "Username is already taken",
      });
    }

    return NextResponse.json({
      available: true,
    });
  } catch (error) {
    console.error("GET /api/users/username error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/username - Set username for the first time
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Validate format
    const validation = usernameSchema.safeParse(normalizedUsername);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid username format" },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    try {
      const result = await db.transaction(async (tx) => {
        // Check if username exists (excluding current user)
        const existing = await tx.query.users.findFirst({
          where: and(
            eq(users.username, normalizedUsername),
            ne(users.id, user.id)
          ),
        });

        if (existing) {
          throw new Error("USERNAME_TAKEN");
        }

        // Set the username
        await tx
          .update(users)
          .set({
            username: normalizedUsername,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        // Verify it was set
        const updated = await tx.query.users.findFirst({
          where: eq(users.id, user.id),
        });

        if (updated?.username !== normalizedUsername) {
          throw new Error("USERNAME_TAKEN");
        }

        return { success: true, username: normalizedUsername };
      });

      return NextResponse.json(result);
    } catch (dbError: unknown) {
      if (dbError instanceof Error) {
        if (dbError.message === "USERNAME_TAKEN" ||
            dbError.message.includes("UNIQUE constraint failed")) {
          return NextResponse.json(
            { error: "Username is already taken" },
            { status: 409 }
          );
        }
      }
      throw dbError;
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/users/username error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/username - Update existing username
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Check if same as current
    if (user.username === normalizedUsername) {
      return NextResponse.json({
        success: true,
        username: normalizedUsername,
      });
    }

    // Validate format
    const validation = usernameSchema.safeParse(normalizedUsername);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid username format" },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    try {
      const result = await db.transaction(async (tx) => {
        // Check if username exists (excluding current user)
        const existing = await tx.query.users.findFirst({
          where: and(
            eq(users.username, normalizedUsername),
            ne(users.id, user.id)
          ),
        });

        if (existing) {
          throw new Error("USERNAME_TAKEN");
        }

        // Update the username
        await tx
          .update(users)
          .set({
            username: normalizedUsername,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        // Verify it was set
        const updated = await tx.query.users.findFirst({
          where: eq(users.id, user.id),
        });

        if (updated?.username !== normalizedUsername) {
          throw new Error("USERNAME_TAKEN");
        }

        return { success: true, username: normalizedUsername };
      });

      return NextResponse.json(result);
    } catch (dbError: unknown) {
      if (dbError instanceof Error) {
        if (dbError.message === "USERNAME_TAKEN" ||
            dbError.message.includes("UNIQUE constraint failed")) {
          return NextResponse.json(
            { error: "Username is already taken" },
            { status: 409 }
          );
        }
      }
      throw dbError;
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("PUT /api/users/username error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
