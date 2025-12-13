import { z } from "zod";

const positionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

const startPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  direction: z
    .number()
    .int()
    .min(0)
    .max(270)
    .refine((v) => v % 90 === 0, {
      message: "Direction must be 0, 90, 180, or 270",
    }),
});

export const createProblemSchema = z
  .object({
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
  })
  .refine(
    (data) => {
      // Validate all positions are within grid
      const size = data.gridSize;
      const allPositions = [
        data.startPosition,
        ...data.goals,
        ...data.walls,
        ...data.traps,
      ];
      return allPositions.every((p) => p.x < size && p.y < size);
    },
    { message: "All positions must be within grid bounds" }
  );

export const updateProblemSchema = createProblemSchema.partial();

export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;
