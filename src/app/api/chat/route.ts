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

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const RATE_LIMIT_REQUESTS = 2;
const RATE_LIMIT_SECONDS = "10s";

export async function POST(req: Request) {
  // Rate limiting Logic
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

  // Message Streaming Logic Below
  const { messages } = await req.json();

  const stream = createUIMessageStream<RouterUIMessage>({
    execute: ({ writer }) => {
      // 1. Send initial status (transient - won't be added to message history)
      writer.write({
        type: "data-notification",
        data: { message: "Processing your request...", level: "info" },
        transient: true, // This part won't be added to message history
      });

      // 3. Send data parts with loading state
      writer.write({
        type: "data-weather",
        id: "weather-1",
        data: { city: "San Francisco", status: "loading" },
      });

      const result = streamText({
        model: openai("gpt-5-nano"),
        messages: convertToModelMessages(messages),
        onFinish() {
          // 4. Update the same data part (reconciliation)
          writer.write({
            type: "data-weather",
            id: "weather-1", // Same ID = update existing part
            data: {
              city: "San Francisco",
              weather: "sunny",
              status: "success",
            },
          });

          // 5. Send completion notification (transient)
          writer.write({
            type: "data-notification",
            data: { message: "Request completed", level: "info" },
            transient: true, // Won't be added to message history
          });
        },
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
