"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/playground/grid";
import { ToolPalette, type ToolType } from "@/components/playground/tool-palette";
import type { Problem, Position, Direction } from "@/lib/h2lang/types";

/** Fixed grid size for Herbert Online Judge */
const GRID_SIZE = 25;

interface ProblemFormData {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  sampleCode: string;
  tags: string[];
  isPublic: boolean;
  status: "draft" | "published";
}

interface ProblemFormProps {
  /** Initial problem data for editing */
  initialProblem?: Problem & ProblemFormData & { id?: string };
  /** Mode: create or edit */
  mode?: "create" | "edit";
}

const initialFormData: ProblemFormData = {
  title: "",
  description: "",
  difficulty: "easy",
  sampleCode: "",
  tags: [],
  isPublic: false,
  status: "draft",
};

/**
 * Check if a position exists in an array of positions.
 */
function hasPosition(positions: Position[], x: number, y: number): boolean {
  return positions.some((p) => p.x === x && p.y === y);
}

/**
 * Remove a position from an array of positions.
 */
function removePosition(positions: Position[], x: number, y: number): Position[] {
  return positions.filter((p) => !(p.x === x && p.y === y));
}

/**
 * Problem creation/edit form with visual grid editor.
 */
export function ProblemForm({ initialProblem, mode = "create" }: ProblemFormProps) {
  const t = useTranslations("admin.problems.new.form");
  const tDifficulty = useTranslations("problems.difficulty");
  const router = useRouter();

  // Form data state
  const [formData, setFormData] = useState<ProblemFormData>(
    initialProblem
      ? {
          title: initialProblem.title,
          description: initialProblem.description,
          difficulty: initialProblem.difficulty,
          sampleCode: initialProblem.sampleCode,
          tags: initialProblem.tags,
          isPublic: initialProblem.isPublic,
          status: initialProblem.status,
        }
      : initialFormData
  );
  const [tagsInput, setTagsInput] = useState(
    initialProblem?.tags?.join(", ") || ""
  );

  // Problem layout state (grid elements)
  const [problem, setProblem] = useState<Problem>(
    initialProblem
      ? {
          goals: initialProblem.goals,
          walls: initialProblem.walls,
          traps: initialProblem.traps,
          startPosition: initialProblem.startPosition,
        }
      : {
          goals: [],
          walls: [],
          traps: [],
          startPosition: {
            x: Math.floor(GRID_SIZE / 2),
            y: Math.floor(GRID_SIZE / 2),
            direction: 0,
          },
        }
  );

  // Edit mode state
  const [editMode, setEditMode] = useState(true);
  const [selectedTool, setSelectedTool] = useState<ToolType>("goal");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle cell click in edit mode
  const handleCellClick = useCallback(
    (x: number, y: number) => {
      setProblem((prev) => {
        const newProblem = { ...prev };

        const hasGoal = hasPosition(prev.goals, x, y);
        const hasWall = hasPosition(prev.walls, x, y);
        const hasTrap = hasPosition(prev.traps, x, y);

        const clearPosition = () => {
          newProblem.goals = removePosition(prev.goals, x, y);
          newProblem.walls = removePosition(prev.walls, x, y);
          newProblem.traps = removePosition(prev.traps, x, y);
        };

        switch (selectedTool) {
          case "goal":
            if (hasGoal) {
              newProblem.goals = removePosition(prev.goals, x, y);
            } else {
              clearPosition();
              newProblem.goals = [...newProblem.goals, { x, y }];
            }
            break;

          case "wall":
            if (hasWall) {
              newProblem.walls = removePosition(prev.walls, x, y);
            } else {
              clearPosition();
              newProblem.walls = [...newProblem.walls, { x, y }];
            }
            break;

          case "trap":
            if (hasTrap) {
              newProblem.traps = removePosition(prev.traps, x, y);
            } else {
              clearPosition();
              newProblem.traps = [...newProblem.traps, { x, y }];
            }
            break;

          case "start":
            clearPosition();
            newProblem.startPosition = {
              x,
              y,
              direction: prev.startPosition.direction,
            };
            break;

          case "erase":
            clearPosition();
            break;
        }

        return newProblem;
      });
    },
    [selectedTool]
  );

  const handleSubmit = async (e: React.FormEvent, saveStatus: "draft" | "published") => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const endpoint =
        mode === "edit" && initialProblem?.id
          ? `/api/problems/${initialProblem.id}`
          : "/api/problems";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: saveStatus,
          isPublic: saveStatus === "published",
          gridSize: GRID_SIZE,
          startPosition: problem.startPosition,
          goals: problem.goals,
          walls: problem.walls,
          traps: problem.traps,
          tags: tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("error"));
      }

      setSuccess(true);
      setTimeout(() => {
        if (saveStatus === "published") {
          router.push("/problems");
        } else {
          router.push("/admin/problems");
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-green-500 bg-green-50 dark:bg-green-900/20 p-6 text-center">
        <p className="text-green-700 dark:text-green-300">{t("success")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Title and Difficulty */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium">{t("title")}</label>
          <input
            type="text"
            required
            maxLength={120}
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
            placeholder={t("titlePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">{t("difficulty")}</label>
          <select
            value={formData.difficulty}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                difficulty: e.target.value as "easy" | "medium" | "hard",
              }))
            }
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="easy">{tDifficulty("easy")}</option>
            <option value="medium">{tDifficulty("medium")}</option>
            <option value="hard">{tDifficulty("hard")}</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">{t("description")}</label>
        <textarea
          rows={4}
          maxLength={20000}
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="w-full px-3 py-2 border border-border rounded-md bg-background resize-y"
          placeholder={t("descriptionPlaceholder")}
        />
      </div>

      {/* Visual Grid Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Grid Editor (25x25)</h3>
          <ToolPalette
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
            editMode={editMode}
            onEditModeToggle={() => setEditMode(!editMode)}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-shrink-0">
            <Grid
              program={null}
              currentStep={0}
              isRunning={false}
              gridSize={GRID_SIZE}
              problem={problem}
              editMode={editMode}
              onCellClick={handleCellClick}
            />
          </div>

          <div className="flex-1 space-y-4">
            {/* Grid Info */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <h4 className="font-medium">Problem Info</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Start Position</dt>
                <dd>
                  ({problem.startPosition.x}, {problem.startPosition.y})
                </dd>
                <dt className="text-muted-foreground">Direction</dt>
                <dd>
                  {problem.startPosition.direction === 0
                    ? "Right →"
                    : problem.startPosition.direction === 90
                      ? "Down ↓"
                      : problem.startPosition.direction === 180
                        ? "Left ←"
                        : "Up ↑"}
                </dd>
                <dt className="text-muted-foreground">Goals</dt>
                <dd>{problem.goals.length}</dd>
                <dt className="text-muted-foreground">Walls</dt>
                <dd>{problem.walls.length}</dd>
                <dt className="text-muted-foreground">Traps</dt>
                <dd>{problem.traps.length}</dd>
              </dl>
            </div>

            {/* Direction Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                {t("startDirection")}
              </label>
              <select
                value={problem.startPosition.direction}
                onChange={(e) =>
                  setProblem((prev) => ({
                    ...prev,
                    startPosition: {
                      ...prev.startPosition,
                      direction: parseInt(e.target.value) as Direction,
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value={0}>{t("directions.0")} →</option>
                <option value={90}>{t("directions.90")} ↓</option>
                <option value={180}>{t("directions.180")} ←</option>
                <option value={270}>{t("directions.270")} ↑</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Code */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">{t("sampleCode")}</label>
        <textarea
          rows={4}
          maxLength={10000}
          value={formData.sampleCode}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, sampleCode: e.target.value }))
          }
          className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-sm resize-y"
          placeholder={t("sampleCodePlaceholder")}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">{t("tags")}</label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-background"
          placeholder={t("tagsPlaceholder")}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={(e) => handleSubmit(e, "draft")}
          className="flex-1"
        >
          {submitting ? t("submitting") : t("saveDraft")}
        </Button>
        <Button
          type="button"
          disabled={submitting || !formData.title || problem.goals.length === 0}
          onClick={(e) => handleSubmit(e, "published")}
          className="flex-1"
        >
          {submitting ? t("submitting") : t("publish")}
        </Button>
      </div>
    </form>
  );
}
