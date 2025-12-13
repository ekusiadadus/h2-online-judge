"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Position {
  x: number;
  y: number;
}

interface ProblemFormData {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  gridSize: number;
  maxSteps: number;
  startPosition: { x: number; y: number; direction: number };
  goals: Position[];
  walls: Position[];
  traps: Position[];
  sampleCode: string;
  tags: string[];
  isPublic: boolean;
}

const initialFormData: ProblemFormData = {
  title: "",
  description: "",
  difficulty: "easy",
  gridSize: 10,
  maxSteps: 1000,
  startPosition: { x: 0, y: 0, direction: 0 },
  goals: [],
  walls: [],
  traps: [],
  sampleCode: "",
  tags: [],
  isPublic: false,
};

/**
 * Problem creation form component.
 */
export function ProblemForm() {
  const t = useTranslations("admin.problems.new.form");
  const tDifficulty = useTranslations("problems.difficulty");
  const router = useRouter();

  const [formData, setFormData] = useState<ProblemFormData>(initialFormData);
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
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
        router.push("/problems");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  const addPosition = (
    field: "goals" | "walls" | "traps",
    x: number,
    y: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], { x, y }],
    }));
  };

  const removePosition = (field: "goals" | "walls" | "traps", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const PositionEditor = ({
    field,
    label,
  }: {
    field: "goals" | "walls" | "traps";
    label: string;
  }) => {
    const [newX, setNewX] = useState(0);
    const [newY, setNewY] = useState(0);

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">{label}</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min={0}
            max={formData.gridSize - 1}
            value={newX}
            onChange={(e) => setNewX(parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-border rounded bg-background"
            placeholder="X"
          />
          <input
            type="number"
            min={0}
            max={formData.gridSize - 1}
            value={newY}
            onChange={(e) => setNewY(parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-border rounded bg-background"
            placeholder="Y"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              addPosition(field, newX, newY);
              setNewX(0);
              setNewY(0);
            }}
          >
            {t("addPosition")}
          </Button>
        </div>
        {formData[field].length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData[field].map((pos, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
              >
                ({pos.x}, {pos.y})
                <button
                  type="button"
                  onClick={() => removePosition(field, i)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (success) {
    return (
      <div className="rounded-lg border border-green-500 bg-green-50 dark:bg-green-900/20 p-6 text-center">
        <p className="text-green-700 dark:text-green-300">{t("success")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

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

      <div className="space-y-2">
        <label className="block text-sm font-medium">{t("description")}</label>
        <textarea
          rows={5}
          maxLength={20000}
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="w-full px-3 py-2 border border-border rounded-md bg-background resize-y"
          placeholder={t("descriptionPlaceholder")}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium">{t("gridSize")}</label>
          <input
            type="number"
            min={5}
            max={100}
            value={formData.gridSize}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                gridSize: parseInt(e.target.value) || 10,
              }))
            }
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">{t("maxSteps")}</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={formData.maxSteps}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                maxSteps: parseInt(e.target.value) || 1000,
              }))
            }
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
              }
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm font-medium">{t("isPublic")}</span>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-4">
        <h3 className="font-medium">{t("startPosition")}</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="block text-sm text-muted-foreground">
              {t("startX")}
            </label>
            <input
              type="number"
              min={0}
              max={formData.gridSize - 1}
              value={formData.startPosition.x}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  startPosition: {
                    ...prev.startPosition,
                    x: parseInt(e.target.value) || 0,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-muted-foreground">
              {t("startY")}
            </label>
            <input
              type="number"
              min={0}
              max={formData.gridSize - 1}
              value={formData.startPosition.y}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  startPosition: {
                    ...prev.startPosition,
                    y: parseInt(e.target.value) || 0,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm text-muted-foreground">
              {t("startDirection")}
            </label>
            <select
              value={formData.startPosition.direction}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  startPosition: {
                    ...prev.startPosition,
                    direction: parseInt(e.target.value),
                  },
                }))
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value={0}>{t("directions.0")}</option>
              <option value={90}>{t("directions.90")}</option>
              <option value={180}>{t("directions.180")}</option>
              <option value={270}>{t("directions.270")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <PositionEditor field="goals" label={t("goals")} />
        <PositionEditor field="walls" label={t("walls")} />
        <PositionEditor field="traps" label={t("traps")} />
      </div>

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

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
