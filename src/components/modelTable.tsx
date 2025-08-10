"use client";

import type { ScoredModel } from "@/store/router";
import { useRouterStore } from "@/store/router";
import { useMemo } from "react";
import type { IconType } from "react-icons";
import { RiAnthropicFill } from "react-icons/ri";
import { SiGoogle, SiOpenai, SiX } from "react-icons/si";

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
  if (p === "openai") return "bg-success-content";
  if (p === "anthropic") return "bg-warning";
  if (p === "google") return "bg-info-content";
  if (p === "xai") return "bg-base-content";
  if (p === "mistral") return "bg-neutral";
  return "bg-neutral";
}

function ProviderBadge({ provider }: { provider: string }) {
  const Icon = PROVIDER_ICONS[normalizeProvider(provider)];
  return (
    <div className={`size-6 rounded-full grid place-items-center text-white ${providerColorClass(provider)}`}>
      {Icon ? <Icon className="size-4" /> : <span className="text-xs font-bold">{provider[0]}</span>}
    </div>
  );
}

const fmt1 = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const money2 = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

const to10 = (x: number) => (Math.max(0, Math.min(1, x)) * 10).toFixed(1);
const tps = (n: number) => fmt1.format(n);
const price = (n: number) => money2.format(n);

// shared grid: 1 flexible name col + 4 content-fit KPI cols
const COLS = "grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] items-center gap-3";

export default function ModelTable() {
  const topModels = useRouterStore((s) => s.topModels);
  const rows = useMemo(() => topModels ?? [], [topModels]);

  return (
    <div className="w-full py-4">
      {/* header */}
      <div className={`px-3 pb-2 uppercase tracking-wide text-base-content/60 text-xs ${COLS}`}>
        <div>Model</div>
        <div className="justify-self-end min-w-12">Intelligence</div>
        <div className="justify-self-end min-w-13">Speed</div>
        <div className="justify-self-end min-w-13">Input</div>
        <div className="justify-self-end min-w-13">Output</div>
      </div>

      {/* rows */}
      <div className="space-y-2">
        {rows.length === 0 ? (
          <div className="rounded-full border border-base-300 bg-base-100 p-4 text-center text-sm text-base-content/60">
            No models yet. Ask something in the chat to see recommendations.
          </div>
        ) : (
          rows.map((m: ScoredModel) => (
            <div
              key={m.slug}
              className={`w-full ${COLS} rounded-full bg-base-100 first:bg-base-300 px-2 py-1 text-left shadow-sm`}
            >
              {/* model + provider */}
              <div className="flex items-center gap-2 min-w-0">
                <ProviderBadge provider={m.provider} />
                <div className="min-w-0">
                  <div className="truncate font-medium text-xs">{m.name}</div>
                  <div className="truncate text-xs text-base-content/60">{m.provider}</div>
                </div>
              </div>

              {/* intelligence */}
              <div className="justify-self-end whitespace-nowrap">
                <span className="badge badge-neutral badge-sm min-w-11">{to10(m.breakdown.intel)}</span>
              </div>

              {/* speed (raw TPS) */}
              <div className="justify-self-end whitespace-nowrap">
                <span className="badge badge-ghost badge-sm min-w-14">{tps(m.median_output_tokens_per_second)}</span>
              </div>

              {/* prices */}
              <div className="justify-self-end whitespace-nowrap">
                <span className="badge badge-neutral badge-sm min-w-14">{price(m.price_input_tokens)}</span>
              </div>
              <div className="justify-self-end whitespace-nowrap">
                <span className="badge badge-ghost badge-sm min-w-14">{price(m.price_output_tokens)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
