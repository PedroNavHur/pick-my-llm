import { openai } from '@ai-sdk/openai';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { convertToModelMessages, streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const RATE_LIMIT_REQUESTS = 2;
const RATE_LIMIT_SECONDS = '10s';

export async function POST(req: Request) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const ip = req.headers.get('x-forwarded-for');
    const ratelimit = new Ratelimit({
      redis: kv,
      // rate limit to 5 requests per 10 seconds
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_REQUESTS, RATE_LIMIT_SECONDS),
    });

    const { success, limit, reset, remaining } = await ratelimit.limit(
      `ratelimit_${ip}`,
    );

    if (!success) {
      return new Response('You have reached your request limit for the day.', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  }

  // Extract the `messages` from the body of the request
  const { messages } = await req.json();

  const modelMessages = convertToModelMessages(messages);

  // Call the language model
  const result = streamText({
    model: openai('gpt-4.1-nano'),
    messages: modelMessages,
  });

  // Respond with the stream
  return result.toUIMessageStreamResponse();
}
