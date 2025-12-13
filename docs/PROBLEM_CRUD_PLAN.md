# Problem CRUD Implementation Plan

> Last updated: 2025-12-13
> Target: Next.js 16 + Auth0 v4.13.3 + Turso + Drizzle ORM

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [File Structure](#2-file-structure)
3. [Phase 0: Environment & Config](#3-phase-0-environment--config)
4. [Phase 1: Database & Migration](#4-phase-1-database--migration)
5. [Phase 2: Auth0 & RBAC](#5-phase-2-auth0--rbac)
6. [Phase 3: Problem API](#6-phase-3-problem-api)
7. [Phase 4: UI Components](#7-phase-4-ui-components)
8. [Implementation Checklist](#8-implementation-checklist)

---

## 1. Prerequisites

### Runtime Requirements

| Requirement | Version | Note |
|-------------|---------|------|
| Node.js | 20 LTS+ | Auth0 SDK requirement |
| Next.js | 16.0.7 | App Router |
| pnpm | 9.x | Package manager |

### Environment Variables (`.env`)

```bash
# Turso (existing - will be mapped in code)
TURSO_URL=libsql://...
TURSO_SECRET=eyJ...

# Upstash Redis (existing)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Auth0 (existing)
AUTH0_DOMAIN=dev-xxx.us.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...

# Auth0 (NEW - must add)
AUTH0_SECRET=<generate with: openssl rand -hex 32>
APP_BASE_URL=http://localhost:4000

# Admin (NEW - for initial admin setup)
ADMIN_EMAILS=admin@example.com,another@example.com
```

### Auth0 Dashboard Settings

| Setting | Value |
|---------|-------|
| Allowed Callback URLs | `http://localhost:4000/auth/callback` |
| Allowed Logout URLs | `http://localhost:4000` |
| Allowed Web Origins | `http://localhost:4000` |

---

## 2. File Structure

```
apps/web/
├── app/
│   ├── [locale]/
│   │   ├── problems/
│   │   │   ├── page.tsx                    # Problem list
│   │   │   ├── new/
│   │   │   │   └── page.tsx                # Create problem (admin)
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # Problem detail
│   │   │       └── edit/
│   │   │           └── page.tsx            # Edit problem (admin)
│   │   └── profile/
│   │       └── page.tsx                    # User profile
│   └── api/
│       ├── problems/
│       │   ├── route.ts                    # GET (list), POST (create)
│       │   └── [id]/
│       │       └── route.ts                # GET, PUT, DELETE
│       ├── tags/
│       │   └── route.ts                    # GET (search)
│       └── users/
│           └── me/
│               └── route.ts                # GET (current user + sync)
├── components/
│   ├── auth/
│   │   ├── login-button.tsx
│   │   ├── logout-button.tsx
│   │   └── user-menu.tsx
│   └── problems/
│       ├── problem-list.tsx
│       ├── problem-card.tsx
│       ├── problem-editor.tsx              # Create/Edit form
│       └── problem-grid-builder.tsx        # Grid editor
├── db/
│   ├── index.ts                            # DB connection
│   └── schema/
│       ├── index.ts                        # Export all schemas
│       ├── users.ts
│       ├── problems.ts
│       ├── tags.ts
│       └── problem-tags.ts
├── lib/
│   ├── auth0.ts                            # Auth0 client
│   ├── auth.ts                             # Auth helpers (requireAuth, requireAdmin)
│   └── validations/
│       └── problem.ts                      # Zod schemas
├── migrations/                             # Drizzle migrations
├── proxy.ts                                # Auth0 proxy (Next.js 16)
├── drizzle.config.ts
└── .env
```

---

## 3. Phase 0: Environment & Config

### 3.1 Install Dependencies

```bash
pnpm --filter web add @auth0/nextjs-auth0@^4.13.3 drizzle-orm @libsql/client zod
pnpm --filter web add -D drizzle-kit
```

### 3.2 Generate AUTH0_SECRET

```bash
openssl rand -hex 32
```

Add to `.env`:
```
AUTH0_SECRET=<generated value>
APP_BASE_URL=http://localhost:4000
ADMIN_EMAILS=your@email.com
```

### 3.3 Package.json Scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## 4. Phase 1: Database & Migration

### 4.1 drizzle.config.ts

```typescript
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    // Map existing env names to Turso expected names
    url: process.env.TURSO_DATABASE_URL ?? process.env.TURSO_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_SECRET!,
  },
});
```

### 4.2 db/index.ts

```typescript
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_SECRET!,
});

export const db = drizzle(client, { schema });
```

### 4.3 Schema Definitions

#### db/schema/users.ts

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),                    // Auth0 sub
  email: text("email").notNull(),
  name: text("name"),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

#### db/schema/problems.ts

```typescript
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const problems = sqliteTable("problems", {
  id: text("id").primaryKey(),                    // UUID
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("easy"),
  authorId: text("author_id").notNull().references(() => users.id),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  gridSize: integer("grid_size").notNull().default(25),
  startPositionJson: text("start_position_json").notNull(),  // JSON: {x, y, direction}
  goalsJson: text("goals_json").notNull().default("[]"),     // JSON: [{x, y}]
  wallsJson: text("walls_json").notNull().default("[]"),     // JSON: [{x, y}]
  trapsJson: text("traps_json").notNull().default("[]"),     // JSON: [{x, y}]
  sampleCode: text("sample_code").notNull().default(""),
  maxSteps: integer("max_steps").notNull().default(1000),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index("problems_is_public_created_at_idx").on(table.isPublic, table.createdAt),
  index("problems_author_id_created_at_idx").on(table.authorId, table.createdAt),
]);

export type Problem = typeof problems.$inferSelect;
export type NewProblem = typeof problems.$inferInsert;
```

#### db/schema/tags.ts

```typescript
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),                    // UUID
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex("tags_slug_unique").on(table.slug),
]);

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
```

#### db/schema/problem-tags.ts

```typescript
import { sqliteTable, text, primaryKey, index } from "drizzle-orm/sqlite-core";
import { problems } from "./problems";
import { tags } from "./tags";

export const problemTags = sqliteTable("problem_tags", {
  problemId: text("problem_id").notNull().references(() => problems.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.problemId, table.tagId] }),
  index("problem_tags_problem_id_idx").on(table.problemId),
  index("problem_tags_tag_id_idx").on(table.tagId),
]);

export type ProblemTag = typeof problemTags.$inferSelect;
```

#### db/schema/index.ts

```typescript
export * from "./users";
export * from "./problems";
export * from "./tags";
export * from "./problem-tags";
```

### 4.4 Migration Flow

```bash
# 1. Generate migration files
pnpm --filter web db:generate

# 2. Apply migrations to Turso
pnpm --filter web db:migrate

# 3. (Optional) Open Drizzle Studio
pnpm --filter web db:studio
```

---

## 5. Phase 2: Auth0 & RBAC

### 5.1 lib/auth0.ts

```typescript
import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Auth0Client reads from env automatically:
// - AUTH0_DOMAIN
// - AUTH0_CLIENT_ID
// - AUTH0_CLIENT_SECRET
// - AUTH0_SECRET
// - APP_BASE_URL
export const auth0 = new Auth0Client();
```

### 5.2 proxy.ts (Next.js 16 recommended)

```typescript
import { auth0 } from "@/lib/auth0";

export async function proxy(request: Request) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public files (files with extensions)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*$).*)",
  ],
};
```

### 5.3 lib/auth.ts (Auth Helpers)

```typescript
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
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase());
  const isAdmin = adminEmails.includes(session.user.email?.toLowerCase() ?? "");

  // Upsert user
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, sub),
  });

  if (existingUser) {
    // Update if needed
    if (existingUser.email !== session.user.email || existingUser.name !== session.user.name) {
      await db.update(users)
        .set({
          email: session.user.email ?? existingUser.email,
          name: session.user.name ?? existingUser.name,
          role: isAdmin ? "admin" : existingUser.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, sub));
    }
    return { ...existingUser, role: isAdmin ? "admin" : existingUser.role };
  }

  // Create new user
  const newUser = {
    id: sub,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    role: isAdmin ? "admin" : "user",
  } as const;

  await db.insert(users).values(newUser);
  return { ...newUser, createdAt: new Date(), updatedAt: new Date() };
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
```

---

## 6. Phase 3: Problem API

### 6.1 lib/validations/problem.ts (Zod Schemas)

```typescript
import { z } from "zod";

const positionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

const startPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  direction: z.number().int().min(0).max(270).refine(
    (v) => v % 90 === 0,
    { message: "Direction must be 0, 90, 180, or 270" }
  ),
});

export const createProblemSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(20000).default(""),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  isPublic: z.boolean().default(false),
  gridSize: z.number().int().min(5).max(100).default(25),
  startPosition: startPositionSchema,
  goals: z.array(positionSchema).default([]),
  walls: z.array(positionSchema).default([]),
  traps: z.array(positionSchema).default([]),
  sampleCode: z.string().max(10000).default(""),
  maxSteps: z.number().int().min(1).max(10000).default(1000),
  tags: z.array(z.string().min(1).max(50)).max(10).default([]),
}).refine(
  (data) => {
    // Validate all positions are within grid
    const size = data.gridSize;
    const allPositions = [
      data.startPosition,
      ...data.goals,
      ...data.walls,
      ...data.traps,
    ];
    return allPositions.every(p => p.x < size && p.y < size);
  },
  { message: "All positions must be within grid bounds" }
);

export const updateProblemSchema = createProblemSchema.partial();

export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;
```

### 6.2 app/api/problems/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { problems, tags, problemTags } from "@/db/schema";
import { requireAdmin, getCurrentUser, AuthError } from "@/lib/auth";
import { createProblemSchema } from "@/lib/validations/problem";
import { eq, desc, and, or } from "drizzle-orm";
import { auth0 } from "@/lib/auth0";

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
    const session = await auth0.getSession();
    const isAdmin = session ? (await getCurrentUser()).role === "admin" : false;

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const offset = (page - 1) * limit;

    // Admin sees all, others see only public
    const whereClause = isAdmin ? undefined : eq(problems.isPublic, true);

    const results = await db.query.problems.findMany({
      where: whereClause,
      orderBy: [desc(problems.createdAt)],
      limit,
      offset,
      with: {
        author: {
          columns: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      data: results,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/problems error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
          await tx.insert(problemTags).values({
            problemId,
            tagId: tag.id,
          }).onConflictDoNothing();
        }
      }
    });

    return NextResponse.json({ id: problemId }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
    }
    console.error("POST /api/problems error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### 6.3 app/api/problems/[id]/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { problems, tags, problemTags } from "@/db/schema";
import { requireAdmin, getCurrentUser, AuthError } from "@/lib/auth";
import { updateProblemSchema } from "@/lib/validations/problem";
import { eq, and } from "drizzle-orm";
import { auth0 } from "@/lib/auth0";

type RouteParams = { params: Promise<{ id: string }> };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/problems/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth0.getSession();
    const isAdmin = session ? (await getCurrentUser()).role === "admin" : false;

    const problem = await db.query.problems.findFirst({
      where: eq(problems.id, id),
      with: {
        author: {
          columns: { id: true, name: true },
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Non-public problems require admin
    if (!problem.isPublic && !isAdmin) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Get tags
    const problemTagRecords = await db.query.problemTags.findMany({
      where: eq(problemTags.problemId, id),
      with: { tag: true },
    });

    return NextResponse.json({
      ...problem,
      startPosition: JSON.parse(problem.startPositionJson),
      goals: JSON.parse(problem.goalsJson),
      walls: JSON.parse(problem.wallsJson),
      traps: JSON.parse(problem.trapsJson),
      tags: problemTagRecords.map(pt => pt.tag),
    });
  } catch (error) {
    console.error("GET /api/problems/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/problems/[id] (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requireAdmin();
    const body = await request.json();
    const validated = updateProblemSchema.parse(body);

    const existing = await db.query.problems.findFirst({
      where: eq(problems.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      // Update problem
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (validated.title !== undefined) updateData.title = validated.title;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.difficulty !== undefined) updateData.difficulty = validated.difficulty;
      if (validated.isPublic !== undefined) updateData.isPublic = validated.isPublic;
      if (validated.gridSize !== undefined) updateData.gridSize = validated.gridSize;
      if (validated.startPosition !== undefined) updateData.startPositionJson = JSON.stringify(validated.startPosition);
      if (validated.goals !== undefined) updateData.goalsJson = JSON.stringify(validated.goals);
      if (validated.walls !== undefined) updateData.wallsJson = JSON.stringify(validated.walls);
      if (validated.traps !== undefined) updateData.trapsJson = JSON.stringify(validated.traps);
      if (validated.sampleCode !== undefined) updateData.sampleCode = validated.sampleCode;
      if (validated.maxSteps !== undefined) updateData.maxSteps = validated.maxSteps;

      await tx.update(problems).set(updateData).where(eq(problems.id, id));

      // Update tags if provided
      if (validated.tags !== undefined) {
        // Remove existing tags
        await tx.delete(problemTags).where(eq(problemTags.problemId, id));

        // Add new tags
        for (const tagName of validated.tags) {
          const slug = slugify(tagName);
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

          await tx.insert(problemTags).values({
            problemId: id,
            tagId: tag.id,
          }).onConflictDoNothing();
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error }, { status: 400 });
    }
    console.error("PUT /api/problems/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/problems/[id] (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requireAdmin();

    const existing = await db.query.problems.findFirst({
      where: eq(problems.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Cascade delete handles problem_tags
    await db.delete(problems).where(eq(problems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("DELETE /api/problems/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### 6.4 app/api/users/me/route.ts

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser, AuthError } from "@/lib/auth";

// GET /api/users/me - Get current user (with sync)
export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("GET /api/users/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## 7. Phase 4: UI Components

### 7.1 components/auth/login-button.tsx

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface LoginButtonProps {
  className?: string;
}

export function LoginButton({ className }: LoginButtonProps) {
  return (
    <a href="/auth/login">
      <Button variant="default" size="sm" className={className}>
        <LogIn className="w-4 h-4 mr-2" />
        Login
      </Button>
    </a>
  );
}
```

### 7.2 components/auth/logout-button.tsx

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <a href="/auth/logout">
      <Button variant="outline" size="sm" className={className}>
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </a>
  );
}
```

### 7.3 components/auth/user-menu.tsx

```typescript
"use client";

import { LoginButton } from "./login-button";
import { LogoutButton } from "./logout-button";

interface UserMenuProps {
  user: {
    name?: string | null;
    email: string;
    role: string;
  } | null;
}

export function UserMenu({ user }: UserMenuProps) {
  if (!user) {
    return <LoginButton />;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <span className="font-medium">{user.name ?? user.email}</span>
        {user.role === "admin" && (
          <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
            Admin
          </span>
        )}
      </div>
      <LogoutButton />
    </div>
  );
}
```

### 7.4 Problem Editor (Simplified)

```typescript
// components/problems/problem-editor.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/playground/grid";
import type { Problem, Position, Direction } from "@/lib/h2lang/types";

interface ProblemEditorProps {
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    isPublic: boolean;
    gridSize: number;
    startPosition: { x: number; y: number; direction: Direction };
    goals: Position[];
    walls: Position[];
    traps: Position[];
    sampleCode: string;
    maxSteps: number;
    tags: string[];
  };
}

export function ProblemEditor({ mode, initialData }: ProblemEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? "easy");
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? false);
  const [gridSize] = useState(initialData?.gridSize ?? 25);
  const [startPosition, setStartPosition] = useState(
    initialData?.startPosition ?? { x: 12, y: 12, direction: 0 as Direction }
  );
  const [goals, setGoals] = useState<Position[]>(initialData?.goals ?? []);
  const [walls, setWalls] = useState<Position[]>(initialData?.walls ?? []);
  const [traps, setTraps] = useState<Position[]>(initialData?.traps ?? []);
  const [sampleCode, setSampleCode] = useState(initialData?.sampleCode ?? "");
  const [maxSteps, setMaxSteps] = useState(initialData?.maxSteps ?? 1000);
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(", ") ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);

    const data = {
      title,
      description,
      difficulty,
      isPublic,
      gridSize,
      startPosition,
      goals,
      walls,
      traps,
      sampleCode,
      maxSteps,
      tags,
    };

    try {
      const url = mode === "create" ? "/api/problems" : `/api/problems/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save");
      }

      const result = await res.json();
      router.push(`/problems/${mode === "create" ? result.id : initialData?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-lg"
          required
          maxLength={120}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">Description (Markdown)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-lg h-32 font-mono text-sm"
          maxLength={20000}
        />
      </div>

      {/* Difficulty & Public */}
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
            className="p-2 border rounded-lg"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <label htmlFor="isPublic" className="text-sm font-medium">Public</label>
        </div>
      </div>

      {/* Max Steps */}
      <div>
        <label className="block text-sm font-medium mb-2">Max Steps</label>
        <input
          type="number"
          value={maxSteps}
          onChange={(e) => setMaxSteps(parseInt(e.target.value) || 1000)}
          className="w-32 p-2 border rounded-lg"
          min={1}
          max={10000}
        />
      </div>

      {/* Sample Code */}
      <div>
        <label className="block text-sm font-medium mb-2">Sample Code</label>
        <textarea
          value={sampleCode}
          onChange={(e) => setSampleCode(e.target.value)}
          className="w-full p-2 border rounded-lg h-24 font-mono text-sm"
          placeholder="srl"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full p-2 border rounded-lg"
          placeholder="tutorial, beginner, loops"
        />
      </div>

      {/* Grid Editor - TODO: Integrate with existing Grid component */}
      <div>
        <label className="block text-sm font-medium mb-2">Grid (Edit mode coming soon)</label>
        <p className="text-sm text-muted-foreground">
          Start: ({startPosition.x}, {startPosition.y}, {startPosition.direction}°) |
          Goals: {goals.length} | Walls: {walls.length} | Traps: {traps.length}
        </p>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : mode === "create" ? "Create Problem" : "Update Problem"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

---

## 8. Implementation Checklist

### Phase 0: Environment & Config
- [ ] Install dependencies (`@auth0/nextjs-auth0`, `drizzle-orm`, `@libsql/client`, `zod`, `drizzle-kit`)
- [ ] Generate `AUTH0_SECRET` and add to `.env`
- [ ] Add `APP_BASE_URL` to `.env`
- [ ] Add `ADMIN_EMAILS` to `.env`
- [ ] Configure Auth0 Dashboard (Callback URLs, Logout URLs)
- [ ] Add db scripts to `package.json`

### Phase 1: Database & Migration
- [ ] Create `drizzle.config.ts`
- [ ] Create `db/index.ts`
- [ ] Create `db/schema/users.ts`
- [ ] Create `db/schema/problems.ts`
- [ ] Create `db/schema/tags.ts`
- [ ] Create `db/schema/problem-tags.ts`
- [ ] Create `db/schema/index.ts`
- [ ] Run `pnpm db:generate`
- [ ] Run `pnpm db:migrate`
- [ ] Verify with `pnpm db:studio`

### Phase 2: Auth0 & RBAC
- [ ] Create `lib/auth0.ts`
- [ ] Create `proxy.ts`
- [ ] Create `lib/auth.ts` (requireAuth, requireAdmin, getCurrentUser)
- [ ] Test login/logout flow

### Phase 3: Problem API
- [ ] Create `lib/validations/problem.ts`
- [ ] Create `app/api/problems/route.ts` (GET, POST)
- [ ] Create `app/api/problems/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Create `app/api/users/me/route.ts`
- [ ] Test API endpoints with admin user

### Phase 4: UI Components
- [ ] Create `components/auth/login-button.tsx`
- [ ] Create `components/auth/logout-button.tsx`
- [ ] Create `components/auth/user-menu.tsx`
- [ ] Create `components/problems/problem-editor.tsx`
- [ ] Create `app/[locale]/problems/page.tsx`
- [ ] Create `app/[locale]/problems/new/page.tsx`
- [ ] Create `app/[locale]/problems/[id]/page.tsx`
- [ ] Create `app/[locale]/problems/[id]/edit/page.tsx`
- [ ] Update Header with UserMenu

### Phase 5: Testing & i18n
- [ ] Add API permission tests
- [ ] Add validation boundary tests
- [ ] Add i18n translations for problems

---

## References

- [Auth0 Next.js SDK v4.13.3](https://auth0.github.io/nextjs-auth0/)
- [Turso + Drizzle ORM](https://docs.turso.tech/sdk/ts/orm/drizzle)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
