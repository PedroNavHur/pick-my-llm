// src/store/router.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Cleaned model row (all required) */
export interface ModelRow {
  name: string;
  slug: string; // e.g. "gpt-4o-mini"
  provider: string; // e.g. "openai"
  artificial_analysis_intelligence_index: number;
  artificial_analysis_coding_index: number;
  artificial_analysis_math_index: number;
  price_input_tokens: number; // $ per 1M
  price_output_tokens: number; // $ per 1M
  median_output_tokens_per_second: number;
}

export interface Weights {
  intelligence: number;
  speed: number;
  price: number;
}

export interface ScoredModel extends ModelRow {
  score: number;
  breakdown: { intel: number; speed: number; price: number };
}

/** Metadata you may attach to a chat response/run */
export interface ModelMeta {
  model?: string; // e.g. "gpt-4o-mini"
  provider?: string; // e.g. "openai"
  inputPrice?: number; // $ per 1M
  outputPrice?: number; // $ per 1M
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  ttfbMs?: number;
  // add fields as needed, but keep them typed
}

interface RouterState {
  // UI/controls
  weights: Weights;

  // selection + metadata
  selectedModel?: string; // slug
  modelMeta?: ModelMeta;

  // results
  topModels: ScoredModel[]; // up to 5

  // actions
  setWeights: (partial: Partial<Weights>, normalize?: boolean) => void;
  setSelectedModel: (slug?: string) => void;
  setModelMeta: (meta?: ModelMeta) => void;
  setTopModels: (models: ScoredModel[]) => void;
  reset: () => void;
}

function normalizeWeights(w: Weights): Weights {
  const sum = w.intelligence + w.speed + w.price || 1;
  return {
    intelligence: w.intelligence / sum,
    speed: w.speed / sum,
    price: w.price / sum,
  };
}

const INITIAL: Pick<RouterState, "weights" | "topModels"> = {
  weights: { intelligence: 0.5, speed: 0.25, price: 0.25 },
  topModels: [],
};

export const useRouterStore = create<RouterState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      setWeights: (partial, normalize = true) => {
        const current = get().weights;
        const merged: Weights = {
          intelligence: partial.intelligence ?? current.intelligence,
          speed: partial.speed ?? current.speed,
          price: partial.price ?? current.price,
        };
        set({ weights: normalize ? normalizeWeights(merged) : merged });
      },

      setSelectedModel: slug => set({ selectedModel: slug }),

      setModelMeta: meta => set({ modelMeta: meta }),

      setTopModels: models => {
        const top5 = models.slice(0, 5);
        set({ topModels: top5 });
        if (top5.length > 0) set({ selectedModel: top5[0].slug });
      },

      reset: () =>
        set({
          ...INITIAL,
          selectedModel: undefined,
          modelMeta: undefined,
        }),
    }),
    {
      name: "pick-my-llm:store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
