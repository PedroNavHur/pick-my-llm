// src/lib/router.ts
import modelsRaw from "@/lib/data.json";

/** Cleaned model row shape (all numbers present & > 0) */
export type ModelRow = {
  name: string;
  slug: string; // model id you’ll call
  provider: string; // e.g. "openai"
  artificial_analysis_intelligence_index: number;
  artificial_analysis_coding_index: number;
  artificial_analysis_math_index: number;
  price_input_tokens: number; // $ per 1M input tokens
  price_output_tokens: number; // $ per 1M output tokens
  median_output_tokens_per_second: number;
};

export type Weights = { intelligence: number; speed: number; price: number };

export type Task = "general" | "code" | "math";
export type Difficulty = "easy" | "hard";
export type UserPreference = "intelligence" | "speed" | "price";

export type ScoredModel = ModelRow & {
  score: number;
  breakdown: { intel: number; speed: number; price: number };
};

export type RouteResult = {
  task: Task;
  primary: ScoredModel;
  alternatives: ScoredModel[]; // top 5 (including primary)
};

const MODELS = modelsRaw as ModelRow[];

/* ---------- min-max helpers ---------- */
function mkScaler(values: number[], invert = false) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1; // avoid /0
  return (x: number) => {
    const z = (x - min) / span; // 0..1
    return invert ? 1 - z : z; // invert for “lower is better” (price)
  };
}

/* ---------- precomputed scalers ---------- */
const sIntelGeneral = mkScaler(
  MODELS.map(m => m.artificial_analysis_intelligence_index)
);
const sIntelCode = mkScaler(
  MODELS.map(m => m.artificial_analysis_coding_index)
);
const sIntelMath = mkScaler(MODELS.map(m => m.artificial_analysis_math_index));
const sSpeed = mkScaler(MODELS.map(m => m.median_output_tokens_per_second));
const sPriceIn = mkScaler(
  MODELS.map(m => m.price_input_tokens),
  true
);
const sPriceOut = mkScaler(
  MODELS.map(m => m.price_output_tokens),
  true
);

/* ---------- intelligence blending via soft task scores ---------- */
function blendedIntel(m: ModelRow, taskScores: Record<Task, number>) {
  const g = Math.max(0, taskScores.general || 0);
  const c = Math.max(0, taskScores.code || 0);
  const a = Math.max(0, taskScores.math || 0); // 'a' for arithmetic :P
  const sum = g + c + a;
  if (sum <= 1e-9) {
    // fallback: treat as general
    return sIntelGeneral(m.artificial_analysis_intelligence_index);
  }
  const wg = g / sum,
    wc = c / sum,
    wa = a / sum;
  return (
    wg * sIntelGeneral(m.artificial_analysis_intelligence_index) +
    wc * sIntelCode(m.artificial_analysis_coding_index) +
    wa * sIntelMath(m.artificial_analysis_math_index)
  );
}

function modelSpeed(m: ModelRow) {
  return sSpeed(m.median_output_tokens_per_second);
}
function modelPrice(m: ModelRow) {
  // average input/output price scores (both already inverted)
  return (
    (sPriceIn(m.price_input_tokens) + sPriceOut(m.price_output_tokens)) / 2
  );
}

/* ---------- main picker ---------- */
export function pickModels(args: {
  task: Task;
  taskScores: Record<Task, number>;
  difficulty: Difficulty;
  difficultyScore: number; // 0..1
  userPreference?: UserPreference; // optional
  baseWeights?: Weights; // optional override (defaults below)
  preferenceBoost?: number; // optional tweak amount (default 0.15)
}): RouteResult {
  const {
    task,
    taskScores,
    difficultyScore,
    userPreference,
    baseWeights = { intelligence: 0.4, speed: 0.2, price: 0.4 },
    preferenceBoost = 0.2,
  } = args;

  // Start with base weights
  let wi = baseWeights.intelligence;
  let ws = baseWeights.speed;
  let wp = baseWeights.price;

  // Nudge for difficulty (hard ⇒ a bit more intelligence)
  const diffBoost = 0.15 * Math.max(0, Math.min(1, difficultyScore)); // up to +0.15 to intelligence
  wi += diffBoost;
  // remove from speed/price proportionally
  const rem = diffBoost;
  const denom = ws + wp || 1;
  ws -= (ws / denom) * rem;
  wp -= (wp / denom) * rem;

  // Boost user preference
  if (userPreference === "intelligence") wi += preferenceBoost;
  if (userPreference === "speed") ws += preferenceBoost;
  if (userPreference === "price") wp += preferenceBoost;

  // Normalize to sum 1
  const sum = Math.max(1e-9, wi + ws + wp);
  const w = { intelligence: wi / sum, speed: ws / sum, price: wp / sum };

  // Score models
  const scored = MODELS.map<ScoredModel>(m => {
    const intel = blendedIntel(m, taskScores);
    const speed = modelSpeed(m);
    const price = modelPrice(m);
    const score = w.intelligence * intel + w.speed * speed + w.price * price;
    return { ...m, score, breakdown: { intel, speed, price } };
  }).sort((a, b) => b.score - a.score);

  return {
    task,
    primary: scored[0],
    alternatives: scored.slice(0, 5), // top 5 for display
  };
}
