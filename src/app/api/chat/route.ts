import { openai } from "@ai-sdk/openai";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  convertToModelMessages,
} from "ai";
import { RouterUIMessage } from "@/lib/types";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { semanticRoute } from "@/lib/semantic_router";
import type { SemanticRouting } from "@/lib/semantic_router";
import { pickModels } from "@/lib/pickModels";

export const maxDuration = 30;

const RATE_LIMIT_REQUESTS = 2;
const RATE_LIMIT_SECONDS = "10s";

function partsToText(parts: RouterUIMessage["parts"]): string {
  // Concatenate all text parts (ignore data parts)
  return parts
    .map(p => (p.type === "text" ? (p.text ?? "") : ""))
    .join("")
    .trim();
}

export async function POST(req: Request) {
  // Rate limit
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const ip = req.headers.get("x-forwarded-for");
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_REQUESTS, RATE_LIMIT_SECONDS),
    });
    const { success, limit, reset, remaining } = await ratelimit.limit(
      `ratelimit_${ip}`
    );
    if (!success) {
      return new Response("You have reached your request limit for the day.", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

  // --- Streaming logic ---
  const { messages } = await req.json();
  const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
  const preference = lastUserMessage?.metadata?.preference ?? "price";
  const fullPrompt = partsToText(lastUserMessage.parts);

  // Classify Prompt
  const result: SemanticRouting = await semanticRoute(fullPrompt);

  const { primary } = pickModels({
    task: result.task,
    taskScores: result.taskScores,
    difficulty: result.difficulty,
    difficultyScore: result.difficultyScore,
    userPreference: preference,
    baseWeights: {
      intelligence: 0.075,
      speed: 0.025,
      price: 0.9,
    },
  });
  console.log(preference, result, primary);

  const stream = createUIMessageStream<RouterUIMessage>({
    execute: ({ writer }) => {
      // 1) Attach model metadata to this assistant message
      writer.write({
        type: "data-llmmodel",
        id: "llm-model-1",
        data: { name: primary.name, provider: primary.provider },
      });

      // 2) Stream the model and capture usage when it finishes
      const result = streamText({
        model: openai("gpt-5-nano"),
        messages: convertToModelMessages(messages),

        // <-- this fires once the provider returns its final usage numbers
        onFinish: ({ usage }) => {
          const inputTokens = usage?.inputTokens ?? 0;
          const outputTokens = usage?.outputTokens ?? 0;
          writer.write({
            type: "data-usage",
            id: "usage-1",
            data: { inputTokens, outputTokens },
          });
        },
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
