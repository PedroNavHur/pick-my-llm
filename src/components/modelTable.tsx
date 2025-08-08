"use client";

import type { IconType } from "react-icons";
import { RiAnthropicFill } from "react-icons/ri";
import { SiGoogle, SiOpenai, SiX } from "react-icons/si"; // known to exist
// (Anthropic, Mistral, xAI may not be in Simple Icons yet—fallback to initials.)

type ModelRow = {
  provider: string;
  providerColor: string; // e.g. "bg-primary"
  model: string;
  intelligence: number; // 0–10
  speed: number; // 0–10
  inputPrice: string;
  outputPrice: string;
};

// Tiny mapping (extend as more logos land in Simple Icons)
const PROVIDER_ICONS: Partial<Record<string, IconType>> = {
  openai: SiOpenai,
  google: SiGoogle,
  anthropic: RiAnthropicFill,
  xai: SiX,
};

const rows: ModelRow[] = [
  {
    provider: "OpenAI",
    providerColor: "bg-primary-content",
    model: "GPT-4o",
    intelligence: 9,
    speed: 8,
    inputPrice: "$0.15",
    outputPrice: "$0.20",
  },
  {
    provider: "Anthropic",
    providerColor: "bg-secondary-content",
    model: "Claude 3.5 Sonnet",
    intelligence: 9,
    speed: 7,
    inputPrice: "$3 / 1M",
    outputPrice: "$15 / 1M",
  },
  {
    provider: "Google",
    providerColor: "bg-accent-content",
    model: "Gemini 1.5 Pro",
    intelligence: 8,
    speed: 8,
    inputPrice: "$4 / 1M",
    outputPrice: "$12 / 1M",
  },
  {
    provider: "xAI",
    providerColor: "bg-info-content",
    model: "Grok-2",
    intelligence: 8,
    speed: 9,
    inputPrice: "$2 / 1M",
    outputPrice: "$10 / 1M",
  },
];

function normalizeProvider(p: string) {
  return p.toLowerCase().replace(/\s+/g, "");
}

function ProviderBadge({
  provider,
  colorClass,
}: {
  provider: string;
  colorClass: string;
}) {
  const Icon = PROVIDER_ICONS[normalizeProvider(provider)];
  return (
    <div
      className={`size-9 rounded-full grid place-items-center text-white ${colorClass}`}
    >
      {Icon ? (
        <Icon className="size-6" />
      ) : (
        <span className="text-xs font-bold">{provider[0]}</span>
      )}
    </div>
  );
}

export default function ModelTable() {
  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-[72px]">Provider</th>
            <th>Model</th>
            <th>Intelligence</th>
            <th>Speed</th>
            <th>Input</th>
            <th>Output</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.provider + r.model}>
              <td>
                <div className="flex items-center gap-3">
                  <ProviderBadge
                    provider={r.provider}
                    colorClass={r.providerColor}
                  />
                </div>
              </td>

              <td>
                <div className="flex flex-col">
                  <span className="font-medium text-xs">{r.model}</span>
                  <span className="text-xs text-base-content/60">
                    {r.provider}
                  </span>
                </div>
              </td>

              <td>
                <span className="badge badge-ghost">{r.intelligence}</span>
              </td>
              <td>
                <span className="badge badge-ghost">{r.speed}</span>
              </td>
              <td>
                <span className="badge badge-ghost">{r.inputPrice}</span>
              </td>
              <td>
                <span className="badge badge-ghost">{r.outputPrice}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
