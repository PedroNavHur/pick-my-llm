"use client";

import type { ScoredModel } from "@/store/router";
import { useRouterStore } from "@/store/router";
import { useMemo } from "react";
import type { IconType } from "react-icons";
import { RiAnthropicFill } from "react-icons/ri";
import {
  SiGoogle,
  SiOpenai,
  SiX /* SiMistral not in SI yet */,
} from "react-icons/si";

function normalizeProvider(p: string) {
  return p.toLowerCase().replace(/\s+/g, "");
}

const PROVIDER_ICONS: Partial<Record<string, IconType>> = {
  openai: SiOpenai,
  google: SiGoogle,
  anthropic: RiAnthropicFill,
  xai: SiX,
};

function providerColorClass(provider: string): string {
  const p = normalizeProvider(provider);
  if (p === "openai") return "bg-primary";
  if (p === "anthropic") return "bg-secondary";
  if (p === "google") return "bg-accent";
  if (p === "xai") return "bg-info";
  if (p === "mistral") return "bg-warning";
  return "bg-neutral";
}

function ProviderBadge({ provider }: { provider: string }) {
  const Icon = PROVIDER_ICONS[normalizeProvider(provider)];
  return (
    <div
      className={`size-9 rounded-full grid place-items-center text-white ${providerColorClass(provider)}`}
    >
      {Icon ? (
        <Icon className="size-5" />
      ) : (
        <span className="text-xs font-bold">{provider[0]}</span>
      )}
    </div>
  );
}

function to10(x: number): string {
  // convert normalized [0..1] → 0..10 with 1 decimal
  const v = Math.max(0, Math.min(1, x)) * 10;
  return v.toFixed(1);
}

function dollarsPerMillion(n: number): string {
  return `$${n}`;
}

function formatTPS(n: number): string {
  return n.toFixed(1); // one decimal, e.g. "347.9"
}

export default function ModelTable() {
  const topModels = useRouterStore(s => s.topModels);
  const selectedModel = useRouterStore(s => s.selectedModel);
  const setSelectedModel = useRouterStore(s => s.setSelectedModel);

  const rows = useMemo(() => topModels ?? [], [topModels]);

  return (
    <div className="overflow-x-auto">
      <table className="table table-xs w-full">
        <thead>
          <tr>
            <th>Model</th>
            <th>Intelligence</th>
            <th>Speed</th>
            <th>Input</th>
            <th>Output</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="text-center text-sm text-base-content/60"
              >
                No models yet. Ask something in the chat to see recommendations.
              </td>
            </tr>
          ) : (
            rows.map((m: ScoredModel) => {
              const isActive = selectedModel === m.slug;
              return (
                <tr
                  key={m.slug}
                  className={`${isActive ? "bg-base-200" : ""} cursor-pointer`}
                  onClick={() => setSelectedModel(m.slug)}
                >
                  {/* Model + Provider */}
                  <td>
                    <div className="flex items-center gap-3">
                      <ProviderBadge provider={m.provider} />
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">{m.name}</span>
                        <span className="text-xs text-base-content/60">
                          {m.provider}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Intelligence (0–10 from normalized breakdown) */}
                  <td>
                    <span className="badge badge-ghost">
                      {to10(m.breakdown.intel)}
                    </span>
                  </td>

                  {/* Speed (0–10 from normalized breakdown) */}
                  <td>
                    <span className="badge badge-ghost">
                      {formatTPS(m.median_output_tokens_per_second)}
                    </span>
                  </td>

                  {/* Prices */}
                  <td>
                    <span className="badge badge-ghost">
                      {dollarsPerMillion(m.price_input_tokens)}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-ghost">
                      {dollarsPerMillion(m.price_output_tokens)}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
