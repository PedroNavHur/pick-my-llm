// src/lib/client/classify.ts
import type { SemanticRouting } from "@/lib/semantic_router";

export async function classifyPrompt(prompt: string): Promise<SemanticRouting> {
  const res = await fetch("/api/classify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Classify failed (${res.status})`);
  }
  return (await res.json()) as SemanticRouting;
}
