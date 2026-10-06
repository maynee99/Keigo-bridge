import Anthropic from "@anthropic-ai/sdk";
import { detectMode, type Mode } from "./detect";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt";
import {
  CheckResultSchema,
  toOutputSchema,
  WriteResultSchema,
  type AnalyzeRequest,
  type AnalyzeResponse,
} from "./schemas";

export const DEFAULT_MODEL = "claude-opus-5-5";

// Models that accept server-side refusal fallbacks (`fallbacks: "default"`).
// If the request is declined by a safety classifier, the API retries it on a
// recommended fallback model inside the same call instead of returning nothing.
const MODELS_WITH_FALLBACKS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);

const WRITE_OUTPUT = toOutputSchema(WriteResultSchema);
const CHECK_OUTPUT = toOutputSchema(CheckResultSchema);

/** The input can't be analysed (e.g. no letters at all). Safe to show the user. */
export class InputError extends Error {}

/** Claude declined or couldn't finish. Safe to show the user. */
export class NoAnswerError extends Error {}

export type AnalyzeOutput = AnalyzeResponse & {
  model: string;
  usage: { inputTokens: number; outputTokens: number };
};

export async function analyze(
  input: AnalyzeRequest,
  options: { client?: Anthropic; model?: string; mode?: Mode } = {},
): Promise<AnalyzeOutput> {
  const mode = options.mode ?? detectMode(input.message);
  if (!mode) throw new InputError("Type a message in English or Japanese.");

  const client = options.client ?? new Anthropic();
  const model = options.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  const fallbacks = MODELS_WITH_FALLBACKS.has(model)
    ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
    : {};

  const response = await client.beta.messages.create({
    model,
    max_tokens: 16000,
    ...fallbacks,
    output_config: {
      // Tone judgement benefits from some thinking, but this is a short task
      // and people are waiting on it, so stay below the "high" setting.
      effort: "medium",
      format: { type: "json_schema", schema: mode === "write" ? WRITE_OUTPUT : CHECK_OUTPUT },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(input, mode) }],
  });

  if (response.stop_reason === "refusal") {
    throw new NoAnswerError("Claude declined to answer this one. Try rewording the message.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new NoAnswerError("The answer was cut off. Try a shorter message.");
  }

  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");
  const json: unknown = JSON.parse(text);
  const usage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };

  return mode === "write"
    ? { mode, result: WriteResultSchema.parse(json), model: response.model, usage }
    : { mode, result: CheckResultSchema.parse(json), model: response.model, usage };
}
