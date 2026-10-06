import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { analyze, InputError, NoAnswerError } from "@/lib/analyze";
import { detectMode } from "@/lib/detect";
import { mockAnalyze } from "@/lib/mock";
import { allowRequest } from "@/lib/rate-limit";
import { AnalyzeRequestSchema, type AnalyzeResponse } from "@/lib/schemas";

// Thinking plus a full answer usually takes well under this.
export const maxDuration = 60;

function error(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowRequest(ip)) {
    return error(429, "That's a lot of messages in a short time. Try again in a few minutes.");
  }

  const parsed = AnalyzeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return error(400, parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  if (process.env.MOCK_CLAUDE === "1") {
    const mode = detectMode(parsed.data.message);
    if (!mode) return error(400, "Type a message in English or Japanese.");
    await new Promise((resolve) => setTimeout(resolve, 600));
    return Response.json(mockAnalyze(mode) satisfies AnalyzeResponse);
  }

  try {
    const { mode, result } = await analyze(parsed.data);
    return Response.json({ mode, result } as AnalyzeResponse);
  } catch (err) {
    if (err instanceof InputError) return error(400, err.message);
    if (err instanceof NoAnswerError) return error(422, err.message);
    if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
      return error(503, "Claude is busy right now. Try again in a minute.");
    }
    // Everything below is our problem, not the user's: log it, keep the message generic.
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic API key missing or invalid");
    } else if (err instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${err.status}:`, err.message);
    } else if (err instanceof SyntaxError || err instanceof z.ZodError) {
      console.error("Claude's answer didn't match the expected format:", err);
    } else {
      console.error(err);
    }
    return error(500, "Something went wrong on our side. Try again.");
  }
}
