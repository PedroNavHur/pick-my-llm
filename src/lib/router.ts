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

export type Weights = {
  intelligence: number; // 0..1
  speed: number; // 0..1
  price: number; // 0..1
};

export type Task = "general" | "code" | "math";

export type ScoredModel = ModelRow & {
  score: number;
  breakdown: { intel: number; speed: number; price: number };
};

export type RouteResult = {
  task: Task;
  primary: ScoredModel;
  alternatives: ScoredModel[];
};

const MODELS = modelsRaw as ModelRow[];

/* ---------- tiny classifier ---------- */
export function classifyTask(prompt: string): Task {
  const p = prompt.toLowerCase();
  if (/```|function\s|\bclass\b|\bdef\b|import\s|console\.log|<\w+>/.test(p))
    return "code";
  if (
    /\bproof\b|\btheorem\b|integral|derivative|matrix|aime|amc|\d+\s*[\+\-\*\/\^]\s*\d+/.test(
      p
    )
  )
    return "math";
  return "general";
}

/* ---------- min-max helpers (simple, because data is clean) ---------- */
function mkScaler(values: number[], invert = false) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1; // avoid /0 if all equal
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
); // cheaper → higher score
const sPriceOut = mkScaler(
  MODELS.map(m => m.price_output_tokens),
  true
);

/* ---------- scoring ---------- */
function modelIntel(m: ModelRow, task: Task) {
  if (task === "code") return sIntelCode(m.artificial_analysis_coding_index);
  if (task === "math") return sIntelMath(m.artificial_analysis_math_index);
  return sIntelGeneral(m.artificial_analysis_intelligence_index);
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

/* ---------- router ---------- */
export function routeModel(
  prompt: string,
  weights: Weights = { intelligence: 0.5, speed: 0.25, price: 0.25 },
  taskOverride?: Task
): RouteResult {
  // normalize weights to sum 1
  const sum = Math.max(
    1e-9,
    weights.intelligence + weights.speed + weights.price
  );
  const w = {
    intelligence: weights.intelligence / sum,
    speed: weights.speed / sum,
    price: weights.price / sum,
  };

  const task = taskOverride ?? classifyTask(prompt);

  const scored = MODELS.map<ScoredModel>(m => {
    const intel = modelIntel(m, task);
    const speed = modelSpeed(m);
    const price = modelPrice(m);

    const score = w.intelligence * intel + w.speed * speed + w.price * price;
    return { ...m, score, breakdown: { intel, speed, price } };
  }).sort((a, b) => b.score - a.score);

  return {
    task,
    primary: scored[0],
    alternatives: scored.slice(0, 5), // top 5 backups
  };
}
