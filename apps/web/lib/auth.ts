import { auth0 } from "@/lib/auth0";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Get current session. Throws if not authenticated.
 */
export async function requireAuth() {
  const session = await auth0.getSession();
  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }
  return session;
}

/**
 * Get current user from DB. Creates if not exists.
 */
export async function getCurrentUser() {
  const session = await requireAuth();
  const sub = session.user.sub;

  // Check if admin by email
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const userEmail = session.user.email?.toLowerCase() ?? "";
  const isAdmin = adminEmails.length > 0 && adminEmails.includes(userEmail);

  // Upsert user
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, sub),
  });

  if (existingUser) {
    // Update if needed
    const needsUpdate =
      existingUser.email !== session.user.email ||
      existingUser.name !== session.user.name ||
      (isAdmin && existingUser.role !== "admin");

    if (needsUpdate) {
      await db
        .update(users)
        .set({
          email: session.user.email ?? existingUser.email,
          name: session.user.name ?? existingUser.name,
          role: isAdmin ? "admin" : existingUser.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, sub));

      return {
        ...existingUser,
        email: session.user.email ?? existingUser.email,
        name: session.user.name ?? existingUser.name,
        role: isAdmin ? "admin" : existingUser.role,
      };
    }

    return existingUser;
  }

  // Create new user
  const newUser = {
    id: sub,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    username: null,
    role: isAdmin ? ("admin" as const) : ("user" as const),
  };

  await db.insert(users).values(newUser);

  return {
    ...newUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Require admin role. Throws if not admin.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (user.role !== "admin") {
    throw new AuthError("Forbidden: Admin access required", 403);
  }
  return user;
}

/**
 * Get session without throwing (for optional auth).
 */
export async function getOptionalSession() {
  try {
    return await auth0.getSession();
  } catch {
    return null;
  }
}

/**
 * Get current user without throwing (for optional auth).
 */
export async function getOptionalUser() {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}
