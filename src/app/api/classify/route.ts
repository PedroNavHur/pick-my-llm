import { semanticRoute } from "@/lib/semantic_router";
import type { SemanticRouting } from "@/lib/semantic_router";
// Run on the Edge for low latency
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt?: string };

    if (typeof prompt !== "string" || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing or empty `prompt`" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    const result: SemanticRouting = await semanticRoute(prompt);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // classify results depend on the body; don’t cache
        "cache-control": "no-store",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
