// src/lib/semantic-router.ts (Edge-safe)
import centroids from "@/lib/semantic-centroids.json";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

type Task = "general" | "code" | "math";
type Difficulty = "easy" | "hard";

export type SemanticRouting = {
  task: Task;
  taskScores: Record<Task, number>;
  difficulty: Difficulty;
  difficultyScore: number;
};

type Centroid = { name: string; centroid: number[] };
const CAT: Centroid[] = centroids.categories as Centroid[];
const DIF: Centroid[] = centroids.difficulty as Centroid[];

const dot = (a: number[], b: number[]) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

const normalize = (v: number[]) => {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map(x => x / n);
};

function cheapFeatures(prompt: string) {
  const p = prompt;
  const len = p.length;
  const hasCode = /```|function\b|class\b|def\b|import\b|console\.log/.test(p);
  const hasMath = /[∑√∞≈≠≤≥^]|integral|derivative|matrix|proof|theorem/i.test(
    p
  );
  const lines = p.split(/\r?\n/).length;
  let score = 0;
  score += Math.min(1, len / 800);
  score += hasCode ? 0.3 : 0;
  score += hasMath ? 0.3 : 0;
  score += Math.min(0.4, (lines / 50) * 0.4);
  return Math.min(1, score);
}

export async function semanticRoute(prompt: string): Promise<{
  task: Task;
  taskScores: Record<Task, number>;
  difficulty: Difficulty;
  difficultyScore: number;
}> {
  // Hard gate to save costs
  const p = prompt.toLowerCase();
  if (/```|function\b|class\b|def\b|import\b/.test(p)) {
    const diff = cheapFeatures(prompt);
    return {
      task: "code",
      taskScores: { general: 0, code: 1, math: 0 },
      difficulty: diff >= 0.5 ? "hard" : "easy",
      difficultyScore: diff,
    };
  }
  if (/\bproof\b|\btheorem\b|integral|derivative|matrix/.test(p)) {
    const diff = cheapFeatures(prompt);
    return {
      task: "math",
      taskScores: { general: 0, code: 0, math: 1 },
      difficulty: diff >= 0.5 ? "hard" : "easy",
      difficultyScore: diff,
    };
  }

  // Embed once (Edge-friendly)
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: prompt,
  });
  const v = normalize(embedding);

  // Category via cosine to centroids
  const catScores = CAT.map(c => ({
    name: c.name as Task,
    score: dot(v, c.centroid),
  }));
  catScores.sort((a, b) => b.score - a.score);
  const task = catScores[0].name;
  const taskScores: Record<Task, number> = {
    general: catScores.find(c => c.name === "general")?.score ?? 0,
    code: catScores.find(c => c.name === "code")?.score ?? 0,
    math: catScores.find(c => c.name === "math")?.score ?? 0,
  };

  // Difficulty via centroids + features
  const hard = DIF.find(d => d.name === "hard")!;
  const easy = DIF.find(d => d.name === "easy")!;
  const semHard = (dot(v, hard.centroid) - dot(v, easy.centroid) + 1) / 2;
  const featHard = cheapFeatures(prompt);
  const difficultyScore = 0.6 * semHard + 0.4 * featHard;
  const difficulty: Difficulty = difficultyScore >= 0.5 ? "hard" : "easy";

  return { task, taskScores, difficulty, difficultyScore };
}
