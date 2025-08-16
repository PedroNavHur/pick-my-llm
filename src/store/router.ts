// src/store/router.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SemanticRouting } from "@/lib/semantic_router";

export interface ModelRow {
  name: string;
  slug: string;
  provider: string;
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

export type UserPreference = "intelligence" | "speed" | "price";

export interface ScoredModel extends ModelRow {
  score: number;
  breakdown: { intel: number; speed: number; price: number };
}

export interface ModelMeta {
  model?: string;
  provider?: string;
  inputPrice?: number;
  outputPrice?: number;
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  ttfbMs?: number;
}

interface RouterState {
  // UI/controls
  weights: Weights;
  userPreference: UserPreference;

  // last classification / routing signal
  routing?: SemanticRouting;

  // optional selection (keep if you still use it elsewhere)
  selectedModel?: string;
  modelMeta?: ModelMeta;

  // results
  topModels: ScoredModel[]; // up to 5

  // actions
  setWeights: (partial: Partial<Weights>, normalize?: boolean) => void;
  setUserPreference: (p: UserPreference) => void;
  setRouting: (r?: SemanticRouting) => void;
  setSelectedModel: (slug?: string) => void; // optional if you still need it
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

const INITIAL: Pick<RouterState, "weights" | "topModels" | "userPreference"> = {
  weights: { intelligence: 0.2, speed: 0.2, price: 0.6 },
  userPreference: "intelligence",
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

      setUserPreference: p => set({ userPreference: p }),

      setRouting: r => set({ routing: r }),

      // Keep if you still highlight a row somewhere
      setSelectedModel: slug => set({ selectedModel: slug }),

      setModelMeta: meta => set({ modelMeta: meta }),

      setTopModels: models => {
        // No auto-select (you said you don’t need selection)
        set({ topModels: models.slice(0, 5) });
      },

      reset: () =>
        set({
          ...INITIAL,
          selectedModel: undefined,
          modelMeta: undefined,
          routing: undefined,
        }),
    }),
    {
      name: "pick-my-llm:store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
